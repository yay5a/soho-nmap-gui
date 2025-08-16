export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import path from "node:path";
import { pathToFileURL } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { parseStringPromise } from "xml2js";

const execFileAsync = promisify(execFile);

async function runNmap(args, timeoutMs = 120_000) {
	const { stdout } = await execFileAsync("nmap", args, {
		timeout: timeoutMs,
		maxBuffer: 10 * 1024 * 1024,
	});
	return parseStringPromise(stdout);
}

const MAX_HOSTS = parseInt(process.env.MAX_HOSTS || "4096", 10); // keep requests small in a single HTTP call
const REQ_BUDGET_MS = parseInt(process.env.REQ_BUDGET_MS || "55000", 10); // leave headroom for response

function estimateHostCount(target = "") {
	const parts = String(target).trim().split(/\s+/).filter(Boolean);

	let total = 0;
	for (const part of parts) {
		const cidrMatch = part.match(/^(?:\d{1,3}\.){3}\d{1,3}\/(\d{1,2})$/);
		if (cidrMatch) {
			const prefix = Number(cidrMatch[1]);
			if (prefix >= 0 && prefix <= 32) {
				total += 2 ** (32 - prefix);
				continue;
			}
		}

		total += 1;
	}

	return total;
}

function parseHostsFromXml(xml) {
	const hosts = xml?.nmaprun?.host || [];
	return hosts
		.map((h) => {
			const addr =
				(h.address || []).map((a) => a?.$?.addr).find(Boolean) ||
				h?.address?.[0]?.$?.addr ||
				null;

			const status = h?.status?.[0]?.$?.state || "down";

			const portsNode = h?.ports?.[0]?.port || [];
			const ports = portsNode.map((p) => {
				const svc = p?.service?.[0]?.$ || {};
				return {
					protocol: p?.$?.protocol || "tcp",
					portid: Number(p?.$?.portid),
					state: p?.state?.[0]?.$?.state || "closed",
					service: svc.name || "",
					version: [svc.product, svc.version, svc.extrainfo]
						.filter(Boolean)
						.join(" "),
				};
			});

			return addr ? { addr, status, ports } : null;
		})
		.filter(Boolean);
}

async function loadProfiles() {
	const root = process.cwd();
	const candidates = [
		path.join(root, "scan-profile.js"),
		path.join(root, "scan-profile"),
		path.join(root, "src", "scan-profile.js"),
		path.join(root, "src", "scan-profile"),
	];
	for (const p of candidates) {
		try {
			const mod = await import(pathToFileURL(p).href);
			const profiles = mod?.default ?? mod?.scanProfiles ?? mod;
			if (profiles && typeof profiles === "object") return profiles;
		} catch {
			// try next
		}
	}
	throw new Error(
		"scan-profile module not found; put scan-profile.js next to your app/ folder and export either default or { scanProfiles }",
	);
}

let scanInFlight = false;

export async function GET(req) {
	const startTime = Date.now();

	try {
		// read query
		const { searchParams } = new URL(req.url);
		const target = searchParams.get("target") ?? "192.168.1.0/24";
		const profileName = searchParams.get("profile") ?? "stealth";

		// limits
		const hostCount = estimateHostCount(target);
		if (hostCount > MAX_HOSTS) {
			return Response.json(
				{
					error: "Target too large",
					detail: `CIDR covers ${hostCount} hosts; server limit is ${MAX_HOSTS}. Use a smaller CIDR (e.g. /24) or set MAX_HOSTS.`,
				},
				{ status: 400, headers: { "Cache-Control": "no-store" } },
			);
		}

		// load the scan profile (however you already implemented loadProfiles)
		const profiles = await loadProfiles();
		const profile =
			profiles?.[profileName] ??
			profiles?.default ??
			(() => {
				throw new Error(`Profile "${profileName}" not found`);
			})();

		// ---------- discovery ----------

		const discoveryTimeoutMs = Math.max(
			15_000,
			Math.min(REQ_BUDGET_MS - 5_000, Math.floor(hostCount * 120)),
		);
		const discoveryArgs = ["-oX", "-", "-sn", "-T3", "-n", target];

		const discoveryXml = await runNmap(discoveryArgs, discoveryTimeoutMs);
		const discoveryHosts = parseHostsFromXml(discoveryXml);
		const upHosts = discoveryHosts
			.filter((h) => h.status === "up")
			.map((h) => h.addr);

		let portHosts = [];
		if (upHosts.length > 0) {
			const portTimeoutMs = Math.min(
				900_000,
				Math.max(180_000, upHosts.length * 1200),
			);
			const portArgs = ["-oX", "-", "-n", ...profile.ports, ...upHosts];

			let portsXml;
			try {
				portsXml = await runNmap(portArgs, portTimeoutMs);
			} catch (err) {
				const msg = String(err?.stderr || err?.message || err);
				const needsRoot =
					/root privileges|failed to open raw socket|are you root/i.test(msg);
				if (!needsRoot) throw err;
				const fallbackArgs = portArgs.map((a) => (a === "-sS" ? "-sT" : a)); // SYN→connect()
				console.warn("Raw-socket scan failed; retrying with -sT");
				portsXml = await runNmap(fallbackArgs, portTimeoutMs);
			}

			portHosts = parseHostsFromXml(portsXml).map((h) => ({
				...h,
				ports: h.ports.filter((p) => p.state === "open"),
			}));
		}

		const portMap = new Map(portHosts.map((h) => [h.addr, h]));
		const hosts = discoveryHosts.map((h) => ({
			...h,
			ports: portMap.get(h.addr)?.ports || [],
		}));

		const duration = Date.now() - startTime;
		return Response.json(
			{ hosts, duration },
			{ headers: { "Cache-Control": "no-store" } },
		);
	} catch (e) {
		console.error("Scan failed", e);
		return Response.json(
			{ error: "Scan failed", detail: String(e?.message || e) },
			{ status: 500 },
		);
	} finally {
		scanInFlight = false;
	}
}
