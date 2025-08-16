"use client";
import Papa from "papaparse";

export default function ExportMenu({ rows, disabled }) {
	function dl(name, content, type) {
		const a = document.createElement("a");
		a.href = URL.createObjectURL(new Blob([content], { type }));
		a.download = name;
		a.click();
		URL.revokeObjectURL(a.href);
	}
	function toCsv() {
		dl("scan.csv", Papa.unparse(rows), "text/csv;charset=utf-8");
	}
	function toJson() {
		dl("scan.json", JSON.stringify(rows, null, 2), "application/json");
	}

	return (
		<div className="inline-flex gap-2">
			<button
				onClick={toCsv}
				disabled={disabled}
				className="text-xs px-3 py-1.5 rounded border border-zinc-700 bg-zinc-800/70 disabled:opacity-50"
			>
				Export CSV
			</button>
			<button
				onClick={toJson}
				disabled={disabled}
				className="text-xs px-3 py-1.5 rounded border border-zinc-700 bg-zinc-800/70 disabled:opacity-50"
			>
				Export JSON
			</button>
		</div>
	);
}
