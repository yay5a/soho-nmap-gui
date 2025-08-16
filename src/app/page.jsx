"use client";

import { useMemo, useState, useCallback } from "react";
import useSWR from "swr";

// robust fetcher: parse JSON when available, otherwise show server text
const fetcher = async (key) => {
	const res = await fetch(key);
	const ct = res.headers.get("content-type") || "";
	const text = await res.text();
	if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);

	if (ct.includes("application/json")) return JSON.parse(text);
	if (ct.includes("xml")) {
		// Browser-side: get an XMLDocument
		return new window.DOMParser().parseFromString(text, "application/xml");
	}
	return text; // fallback
};

export default function Page() {
	// UI state
	const [target, setTarget] = useState("192.168.4.0/22");
	const [profile, setProfile] = useState("stealth");
	const [autoRefresh, setAutoRefresh] = useState(true);
	const [intervalMs, setIntervalMs] = useState(120_000);

	// query string and SWR key MUST be defined BEFORE useSWR
	const qs = useMemo(
		() => new URLSearchParams({ target, profile }).toString(),
		[target, profile],
	);
	const key = `/api/scan?${qs}`;

	// SWR: do NOT reference isValidating in the options object
	const { data, error, isLoading, isValidating, mutate } = useSWR(
		key,
		fetcher,
		{
			revalidateOnFocus: false,
			dedupingInterval: 1000,
			// function form avoids touching isValidating and lets us toggle
			refreshInterval: () => (autoRefresh ? intervalMs : 0),
			keepPreviousData: true,
		},
	);
	const results = data || null;
	const hosts = results?.hosts ?? [];
	const durationSec = results?.duration
		? (results.duration / 1000).toFixed(1)
		: null;
	const busy = isLoading || isValidating;

	const upCount = hosts.filter((h) => h.status === "up").length;

	const runNow = useCallback(() => mutate(), [mutate]);
	function exportJSON() {
		const payload = {
			generatedAt: new Date().toISOString(),
			target,
			profile,
			durationMs: results?.duration ?? 0,
			hosts,
		};
		const blob = new Blob([JSON.stringify(payload, null, 2)], {
			type: "application/json",
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `nmap-scan-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}

	return (
		<>
			<div className="mx-auto max-w-6xl px-6 py-8">
				{/* Header */}
				<div className="mb-6 flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-semibold tracking-tight">
							SOHO Nmap Monitor{" "}
							<span className="text-neutral-400">(Stealth)</span>
						</h1>
						<p className="mt-1 text-sm text-neutral-400">
							Target{" "}
							<span className="font-mono text-neutral-200">{target}</span>
							{durationSec && (
								<>
									{" · "}Scan duration{" "}
									<span className="font-mono text-neutral-200">
										{durationSec}s
									</span>
								</>
							)}
						</p>
					</div>

					<div className="flex items-center gap-2">
						<span
							className={[
								"inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs",
								busy
									? "bg-amber-500/10 text-amber-300"
									: "bg-emerald-500/10 text-emerald-300",
							].join(" ")}
						>
							<span
								className={[
									"h-2 w-2 rounded-full",
									busy ? "bg-amber-400 animate-pulse" : "bg-emerald-400",
								].join(" ")}
							/>
							{busy ? "Scanning…" : "Idle"}
						</span>
					</div>
				</div>

				{/* Controls */}
				<div className="mb-6 rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
					<form
						onSubmit={(e) => {
							e.preventDefault();
							runNow();
						}}
						className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-5"
					>
						<label className="col-span-2 flex flex-col gap-1">
							<span className="text-xs uppercase tracking-wide text-neutral-400">
								Target (CIDR)
							</span>
							<input
								className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 font-mono text-sm text-neutral-100 outline-none ring-0 focus:border-neutral-500"
								value={target}
								onChange={(e) => setTarget(e.target.value)}
								placeholder="192.168.1.0/24"
								spellCheck="false"
							/>
						</label>

						<label className="flex flex-col gap-1">
							<span className="text-xs uppercase tracking-wide text-neutral-400">
								Profile
							</span>
							<input
								className="w-full cursor-not-allowed rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-400"
								value={profile}
								readOnly
							/>
						</label>

						<label className="inline-flex items-center gap-2">
							<span className="text-sm text-neutral-300">Every</span>
							<input
								type="number"
								min={30}
								step={15}
								value={Math.round(intervalMs / 1000)}
								onChange={(e) =>
									setIntervalMs(Math.max(30, Number(e.target.value)) * 1000)
								}
								className="w-20 rounded-lg border border-neutral-700 bg-neutral-950 px-2 py-1 text-sm text-neutral-100"
							/>
							<span className="text-sm text-neutral-300">s</span>
						</label>

						<div className="flex items-end gap-3">
							<label className="inline-flex select-none items-center gap-2">
								<input
									type="checkbox"
									className="h-4 w-4 accent-emerald-500"
									checked={autoRefresh}
									onChange={(e) => setAutoRefresh(e.target.checked)}
								/>
								<span className="text-sm text-neutral-300">
									Auto-refresh ({Math.round(intervalMs / 1000)}s)
								</span>
							</label>

							<button
								type="submit"
								disabled={isValidating}
								className={[
									"rounded-lg px-3 py-2 text-sm font-medium transition",
									isValidating
										? "cursor-not-allowed bg-neutral-800 text-neutral-400"
										: "bg-emerald-600 text-white hover:bg-emerald-500",
								].join(" ")}
							>
								{isValidating ? "Scanning…" : "Run"}
							</button>

							<button
								type="button"
								onClick={exportJSON}
								className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-200 hover:border-neutral-500 hover:bg-neutral-800"
							>
								Export JSON
							</button>
						</div>
					</form>
				</div>

				{/* Summary */}
				<div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-neutral-400">
					<span className="inline-flex items-center gap-2">
						<span className="h-2 w-2 rounded-full bg-emerald-500" />
						{upCount} up
					</span>
					<span>•</span>
					<span>{hosts.length} total hosts</span>
					{error && (
						<>
							<span>•</span>
							<span className="text-rose-300">
								Error: {String(error.message).slice(0, 160)}
							</span>
						</>
					)}
				</div>

				{/* Results table */}
				<div className="overflow-hidden rounded-xl border border-neutral-800">
					<div className="overflow-x-auto">
						<table className="min-w-full border-collapse text-sm">
							<thead className="bg-neutral-900/70 text-neutral-300 backdrop-blur">
								<tr className="border-b border-neutral-800">
									<th className="px-4 py-3 text-left font-semibold">Host</th>
									<th className="px-4 py-3 text-left font-semibold">Status</th>
									<th className="px-4 py-3 text-left font-semibold">
										Open Ports
									</th>
									<th className="px-4 py-3 text-left font-semibold">
										Services
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-neutral-900">
								{hosts.length === 0 && (
									<tr>
										<td
											colSpan={4}
											className="px-4 py-10 text-center text-neutral-500"
										>
											{isValidating
												? "Scanning…"
												: "No results yet. Click “Run” to start."}
										</td>
									</tr>
								)}
								{hosts.map((h) => {
									const openPorts = (h.ports || []).filter(
										(p) => p.state === "open",
									);
									const portList =
										openPorts.length > 0
											? openPorts.map((p) => p.portid).join(", ")
											: "—";
									const services =
										openPorts.length > 0
											? openPorts
													.map((p) => p.service || "")
													.filter(Boolean)
													.join(" | ") || "—"
											: "—";

									return (
										<tr key={h.addr} className="hover:bg-neutral-900/40">
											<td className="whitespace-nowrap px-4 py-3 font-mono text-neutral-100">
												{h.addr}
											</td>
											<td className="px-4 py-3">
												{h.status === "up" ? (
													<span className="inline-flex items-center gap-2 text-emerald-400">
														<span className="h-2 w-2 rounded-full bg-emerald-400" />
														up
													</span>
												) : (
													<span className="inline-flex items-center gap-2 text-neutral-500">
														<span className="h-2 w-2 rounded-full bg-neutral-500" />
														down
													</span>
												)}
											</td>
											<td className="px-4 py-3 font-mono text-neutral-200">
												{portList}
											</td>
											<td className="px-4 py-3 text-neutral-300">{services}</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</div>

				{/* Footer hint */}
				<p className="mt-4 text-xs text-neutral-500">
					Tip: set auto-refresh ≥ typical scan time for your target (e.g., 120s
					for a /22 with top ports).
				</p>
			</div>
		</>
	);
}
