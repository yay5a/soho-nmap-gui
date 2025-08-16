"use client";

import { useMemo, useState } from "react";

export default function ResultsTable({ rows }) {
	const [q, setQ] = useState("");
	const filtered = useMemo(() => {
		const x = (rows ?? []).filter((r) =>
			`${r.ip} ${r.host} ${r.os ?? ""}`.toLowerCase().includes(q.toLowerCase()),
		);
		return x;
	}, [rows, q]);

	return (
		<div className="grid gap-2">
			<input
				value={q}
				onChange={(e) => setQ(e.target.value)}
				placeholder="Filter by IP/host/OS"
				className="bg-zinc-950 border border-zinc-800 rounded px-3 py-2 w-full"
			/>

			<div className="overflow-auto rounded-xl border border-zinc-800">
				<table className="min-w-full text-sm">
					<thead className="bg-zinc-900/60">
						<tr className="text-left">
							<Th>IP</Th>
							<Th>Hostname</Th>
							<Th>State</Th>
							<Th>Open Ports</Th>
							<Th>Services</Th>
							<Th>OS (guess)</Th>
						</tr>
					</thead>
					<tbody>
						{(filtered.length ? filtered : rows).map((r, i) => (
							<tr key={i} className="border-t border-zinc-800/80">
								<Td className="font-mono">{r.ip}</Td>
								<Td>{r.host}</Td>
								<Td>{r.state}</Td>
								<Td className="font-mono">{r.ports.join(", ")}</Td>
								<Td>{r.services.join(", ")}</Td>
								<Td>{r.os ?? "—"}</Td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}

function Th({ children }) {
	return <th className="px-3 py-2 font-semibold text-zinc-300">{children}</th>;
}
function Td({ children, className = "" }) {
	return <td className={`px-3 py-2 ${className}`}>{children}</td>;
}
