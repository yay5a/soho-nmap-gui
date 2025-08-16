"use client";

export default function ScanStatusPill({ status }) {
	const up = status === "up";
	const color = up ? "bg-emerald-500" : "bg-zinc-500";
	const label = up ? "up" : "down";
	return (
		<span className="inline-flex items-center gap-2 text-xs">
			<span className={`h-2 w-2 rounded-full ${color}`} /> {label}
		</span>
	);
}
