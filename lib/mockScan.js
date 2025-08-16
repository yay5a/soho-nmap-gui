import { PROFILES } from "./fakeData.js";

function* rng(seed = 1) {
	let t = seed;
	while (true) {
		t = (t * 48721) % 2147483647;
		yield t / 2147483647;
	}
}

function randomIp(cidr = "192.168.1.0/24", r) {
	const base = cidr.split("/")[0].split(".").map(Number);
	const host = 10 + Math.floor(r.next().value * 200); // 10..210
	return `${base[0]}.${base[1]}.${base[2]}.${host}`;
}

function pick(arr, r) {
	return arr[Math.floor(r.next().value * arr.length)];
}

export async function* mockScan(params) {
	const r = rng(Date.now() % 100000);
	const prof = PROFILES[params.profile] ?? PROFILES.stealth;
	const rows = [];
	const total = 60 + Math.floor(r.next().value * 40); // ~60-100 hosts

	// stream progress + chunks
	for (let i = 1; i <= total; i++) {
		const ip = randomIp(params.target, r);
		const portCount = 1 + Math.floor(r.next().value * 5);
		const common = prof.commonPorts;
		const ports = Array.from({ length: portCount }, () => pick(common, r))
			.filter((v, i, a) => a.indexOf(v) === i)
			.sort((a, b) => a - b);
		const services = ports.map((p) => {
			if (p === 22) return "ssh";
			if (p === 80) return "http";
			if (p === 443) return "https";
			if (p === 445) return "smb";
			if (p === 3389) return "rdp";
			if (p === 53) return "dns";
			return "service";
		});
		const os = pick(
			["Windows", "Linux", "macOS", "OpenWrt", "FreeBSD", null],
			r,
		);

		rows.push({ ip, host: `host-${i}`, state: "up", ports, services, os });

		if (i % 10 === 0 || i === total) {
			yield { type: "chunk", rows: rows.splice(0, rows.length) };
		}
		const pct = Math.round((i / total) * 100);
		yield { type: "progress", value: pct };
		await new Promise((res) =>
			setTimeout(res, 60 + Math.floor(r.next().value * 140)),
		);
	}
}
