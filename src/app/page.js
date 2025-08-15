"use client";

import useSWR from "swr";
import { useMemo, useState } from "react";

const fetcher = (url) => fetch(url).then((r) => r.json());

export default function Home() {
	const [target, setTarget] = useState("192.168.1.0/24");
	const [profile] = useState("stealth"); // locked to stealth by default
	const [auto, setAuto] = useState(true);

	const qs = useMemo(() => {
		const p = new URLSearchParams({ target, profile });
		return p.toString();
	}, [target, profile]);

	const { data, isLoading, error } = useSWR(`/api/scan?${qs}`, fetcher, {
		refreshInterval: auto ? 45000 : 0,
		revalidateOnFocus: false,
	});

	const hosts = data?.hosts || [];

	function exportJson() {
		const blob = new Blob([JSON.stringify(hosts, null, 2)], {
			type: "application/json",
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "scan-results.json";
		a.click();
		URL.revokeObjectURL(url);
	}
	return (
		<main style={{ padding: 24, fontFamily: "ui-sans-serif, system-ui" }}>
			<h1 style={{ fontSize: 28, marginBottom: 12 }}>
				SOHO Nmap Monitor (Stealth)
			</h1>

			<form
				onSubmit={(e) => e.preventDefault()}
				style={{
					display: "grid",
					gap: 8,
					gridTemplateColumns: "1fr auto auto",
					alignItems: "end",
					marginBottom: 16,
				}}
			>
				<label>
					Target
					<input
						value={target}
						onChange={(e) => setTarget(e.target.value)}
						placeholder="192.168.1.0/24"
					/>
				</label>
				<label>
					<input
						type="checkbox"
						checked={auto}
						onChange={(e) => setAuto(e.target.checked)}
					/>{" "}
					Auto‑refresh (45s)
				</label>
				<button type="submit">Run</button>
			</form>

			{isLoading && (
				<div style={{ marginBottom: 12 }}>
					<p>Scanning…</p>
					<progress />
				</div>
			)}
			{error && (
				<p style={{ color: "crimson" }}>
					Error: {error.message || "API error"}
				</p>
			)}

			{data && (
				<div style={{ marginBottom: 12 }}>
					<p>Scan duration: {(data.duration / 1000).toFixed(1)}s</p>
					<button onClick={exportJson} disabled={hosts.length === 0}>
						Export JSON
					</button>
				</div>
			)}

			<table
				border="1"
				cellPadding="6"
				style={{ borderCollapse: "collapse", width: "100%" }}
			>
				<thead>
					<tr>
						<th>Host</th>
						<th>Status</th>
						<th>Open Ports</th>
						<th>Services</th>
					</tr>
				</thead>
				<tbody>
					{hosts.map((h) => (
						<tr key={h.addr}>
							<td>{h.addr}</td>
							<td>
								<span
									style={{
										color: h.status === "up" ? "green" : "red",
									}}
								>
									● {h.status}
								</span>
							</td>
							<td>{h.ports.map((p) => p.portid).join(", ") || "—"}</td>
							<td>
								{h.ports
									.map(
										(p) =>
											`${p.service || "?"}${p.version ? ` ${p.version}` : ""}`,
									)
									.join(" | ") || "—"}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</main>
	);
}
