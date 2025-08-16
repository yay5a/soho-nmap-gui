"use client";

export default function StatusBar({ session }) {
	const pct = Math.round(session?.progress ?? 0);
	const label =
		session?.state === "running"
			? `Scanning... ${pct}%`
			: session?.state === "done"
				? "Completed"
				: session?.state === "queued"
					? "Queued"
					: "Idle";
	return (
		<div className="flex items-center gap-2 text-xs">
			<div className="w-40 h-2 rounded bg-zinc-800 overflow-hidden">
				<div
					className="h-full bg-emerald-500 transition-all"
					style={{ width: `${pct}%` }}
				/>
			</div>
			<span className="text-zinc-400">{label}</span>
		</div>
	);
}
