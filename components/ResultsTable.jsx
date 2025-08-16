"use client";

import { useMemo, useState } from "react";
import HostCard from "./HostCard";

export default function ResultsTable({ rows }) {
	const [q, setQ] = useState("");
	const filtered = useMemo(() => {
		const x = (rows ?? []).filter((r) =>
			`${r.ip} ${r.host} ${r.os ?? ""}`.toLowerCase().includes(q.toLowerCase()),
		);
		return x;
	}, [rows, q]);
	const list = filtered.length ? filtered : rows;
	return (
		<div className="grid gap-3">
			<input
				value={q}
				onChange={(e) => setQ(e.target.value)}
				placeholder="Filter by IP/host/OS"
				className="bg-zinc-950 border border-zinc-800 rounded px-3 py-2 w-full"
			/>
			<div className="grid gap-2">
				{list.map((r, i) => (
					<HostCard key={i} host={r} />
				))}
			</div>
		</div>
	);
}
