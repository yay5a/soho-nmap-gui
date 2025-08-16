export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { parseStringPromise } from "xml2js";
import { z } from "zod";
import { scanProfiles } from "@/lib/scan-profile";

const execFileAsync = promisify(execFile);

// RFC1918 allowlist
const RFC1918 = [/^10\./, /^192\.168\./, /^172\.(1[6-9]|2\d|3[0-1])\./];
const isRfc1918 = (target) =>
	RFC1918.some((rx) => rx.test(target.split("/")[0]));

const Query = z.object({
	target: z.string().default("192.168.4.0/22"),
	profile: z.enum(["stealth", "fast", "deep"]).default("stealth"),
});

let scanInFlight = false;

async function runNmap(args, timeoutMs = 120_000) {
	const { stdout } = await execFileAsync("nmap", args, {
		timeout: timeoutMs,
		maxBuffer: 10 * 1024 * 1024,
	});
	return parseStringPromise(stdout);
}

function estimateHostCount(cidr) {
	const m = /^(\d{1,3}\.){3}\d{1,3}\/(\d{1,2})$/.exec(cidr);
	if (!m) return 256; // default budget if not CIDR
	const mask = Number(m[2]);
	return Math.max(1, 2 ** (32 - mask));
}

const estimatedHostCount = estimateHostCount(q.target);

// Discovery timeout: ~0.3s/host, floor 3m, cap 10m
const discoveryTimeoutMs = Math.min(
	600_000,
	Math.max(180_000, estimatedHostCount * 300),
);

function parseHostsFromXml(xml) {
	return (xml?.nmaprun?.host || []).map((h) => {
		const addr = h.address?.[0]?.$.addr ?? "unknown";
		const status = h.status?.[0]?.$.state ?? "down";
		const ports = (h.ports?.[0]?.port || []).map((p) => {
			const svc = p.service?.[0]?.$ || {};
			return {
				proto: p.$.protocol,
				portid: Number(p.$.portid),
				state: p.state?.[0]?.$.state,
				service: svc.name,
				product: svc.product,
				version: svc.version,
			};
		});
		return { addr, status, ports };
	});
}

export async function GET(req) {
	if (scanInFlight) {
		return Response.json(
			{ error: "Scan already in progress.." },
			{ status: 400, headers: { "Cache-Control": "no-store" } },
		);
	}
	scanInFlight = true;
	const startTime = Date.now();
	try {
		const { searchParams } = new URL(req.url);
		const q = Query.parse(Object.fromEntries(searchParams));
		const profile = scanProfiles[q.profile] ?? scanProfiles.stealth;
		console.log("Scan requested", { target: q.target, profile: q.profile });
		if (!isRfc1918(q.target)) {
			return Response.json(
				{ error: "Target must be RFC1918 (home LAN)." },
				{ status: 400 },
			);
		}
		// Fast discovery: no DNS lookups
		const targetCidr = q.target;
		const discoveryArgs = ["-oX", "-", "-sn", "-T3", "-n", targetCidr];

		const discoveryXml = await runNmap(discoveryArgs, discoveryTimeoutMs);
		const discoveryHosts = parseHostsFromXml(discoveryXml);
		const upHosts = discoveryHosts
			.filter((h) => h.status === "up")
			.map((h) => h.addr);

		console.log(
			`Discovery found ${discoveryHosts.length} hosts (${upHosts.length} up)`,
		);

		let portHosts = [];
		try {
			portsXml = await runNmap(portArgs, portTimeoutMs);
		} catch (err) {
			const msg = String(err?.stderr || err?.message || err);
			const needsRoot =
				/root privileges|failed to open raw socket|are you root/i.test(msg);
			if (!needsRoot) throw err;
			const fallbackArgs = portArgs.map((a) => (a === "-sS" ? "-sT" : a));
			console.warn("Raw-socket scan failed; retrying with -sT");
			portsXml = await runNmap(fallbackArgs, portTimeoutMs);
		}
		portHosts = parseHostsFromXml(portsXml).map((h) => ({
			...h,
			ports: h.ports.filter((p) => p.state === "open"),
		}));

		const portMap = new Map(portHosts.map((h) => [h.addr, h]));
		const mergedHosts = discoveryHosts.map((h) => ({
			...h,
			ports: portMap.get(h.addr)?.ports || [],
		}));

		const duration = Date.now() - startTime;
		console.log("Scan finished", {
			durationMs: duration,
			totalHosts: mergedHosts.length,
		});

		return Response.json(
			{ hosts: mergedHosts, duration },
			{ headers: { "Cache-control": "no-store" } },
		);
	} finally {
		scanInFlight = false;
	}
}
