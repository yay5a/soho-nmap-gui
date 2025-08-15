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

async function runNmap(args, timeoutMs = 120_000) {
	const { stdout } = await execFileAsync("nmap", args, {
		timeout: timeoutMs,
		maxBuffer: 10 * 1024 * 1024,
	});
	return parseStringPromise(stdout);
}

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

		if (discovered.length === 0) {
			return Response.json(
				{ hosts: [] },
				{ headers: { "Cache-Control": "no-store" } },
			);
		}
		const discoveryArgs = [
			"-oX",
			"-",
			"-Pn",
			...profile.discovery,
			"--host-timeout",
			"30s",
			q.target,
		];
		const discoveryXml = await runNmap(discoveryArgs);
		const discoveryHosts = parseHostsFromXml(discoveryXml);
		const upHosts = discoveryHosts
			.filter((h) => h.status === "up")
			.map((h) => h.addr);
		console.log(
			`Discovery found ${discoveryHosts.length} hosts (${upHosts.length} up)`,
		);

		let portHosts = [];
		if (upHosts.length > 0) {
			const portArgs = [
				"-oX",
				"-",
				"-Pn",
				...profile.ports,
				"--max-retries",
				"1",
				"--host-timeout",
				"30s",
				...upHosts,
			];
			console.log(`Running port scan on ${upHosts.length} hosts`);
			const portsXml = await runNmap(portArgs);
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
		console.log("Scan finished", {
			durationMs: duration,
			totalHosts: hosts.length,
		});

		return Response.json(
			{ hosts, duration },
			{ headers: { "Cache-control": "no-store" } },
		);
	} catch (e) {
		console.error("Scan failed", e);
		return Response.json(
			{ error: "Scan failed", detail: String(e?.message || e) },
			{ status: 500 },
		);
	}
}
