"use client";

import ScanStatusPill from "./ScanStatusPill";

export default function HostCard({ host }) {
	const {
		ip,
		host: hostname,
		state,
		ports = [],
		services = [],
		os,
	} = host || {};
	return (
		<div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 grid gap-2 md:grid-cols-4 md:items-center">
			<div className="flex items-center gap-3 md:col-span-1">
				<ScanStatusPill status={state} />
				<div>
					<div className="font-mono text-sm">{ip}</div>
					{hostname && <div className="text-xs text-zinc-400">{hostname}</div>}
				</div>
			</div>
			<div className="text-sm md:col-span-1">
				<span className="font-medium">Ports: </span>
				<span className="font-mono">{ports.join(", ") || "—"}</span>
			</div>
			<div className="text-sm md:col-span-1">
				<span className="font-medium">Services: </span>
				<span>{services.join(", ") || "—"}</span>
			</div>
			<div className="text-sm md:col-span-1">
				<span className="font-medium">OS: </span>
				<span>{os || "—"}</span>
			</div>
		</div>
	);
}
