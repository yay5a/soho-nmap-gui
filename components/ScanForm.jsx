"use client";

import { useState } from "react";
import { ChevronDown, Play } from "lucide-react";
import { PROFILES, SPEEDS } from "@/lib/fakeData";
import ToggleSwitch from "./ToggleSwitch";

export default function ScanForm({ onStart, disabled }) {
	const [target, setTarget] = useState("192.168.1.0/24");
	const [profile, setProfile] = useState("stealth");
	const [speed, setSpeed] = useState("T3");
	const [osDetect, setOsDetect] = useState(false);
	const [serviceDetect, setServiceDetect] = useState(true);
	const [skipPing, setSkipPing] = useState(true);

	function handleSubmit(e) {
		e.preventDefault();
		onStart?.({ target, profile, speed, osDetect, serviceDetect, skipPing });
	}

	return (
		<form
			onSubmit={handleSubmit}
			className="grid gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"
		>
			<div className="grid gap-2 md:grid-cols-2">
				<label className="grid gap-1">
					<span className="text-sm">Target / CIDR</span>
					<input
						value={target}
						onChange={(e) => setTarget(e.target.value)}
						className="bg-zinc-950 border border-zinc-800 rounded px-3 py-2 font-mono"
						placeholder="192.168.1.0/24"
					/>
				</label>
				<label className="grid gap-1">
					<span className="text-sm">Profile</span>
					<div className="relative">
						<select
							value={profile}
							onChange={(e) => setProfile(e.target.value)}
							className="appearance-none bg-zinc-950 border border-zinc-800 rounded px-3 py-2 pr-8 w-full"
						>
							{Object.keys(PROFILES).map((k) => (
								<option key={k} value={k}>
									{k}
								</option>
							))}
						</select>
						<ChevronDown className="absolute right-2 top-2.5 size-4 opacity-70" />
					</div>
				</label>
			</div>

			<div className="grid gap-2 md:grid-cols-3">
				<label className="grid gap-1">
					<span className="text-sm">Speed template</span>
					<select
						value={speed}
						onChange={(e) => setSpeed(e.target.value)}
						className="bg-zinc-950 border border-zinc-800 rounded px-3 py-2"
					>
						{SPEEDS.map((s) => (
							<option key={s} value={s}>
								{s}
							</option>
						))}
					</select>
				</label>
				<label className="items-center gap-2 inline-flex">
					<ToggleSwitch checked={osDetect} onChange={setOsDetect} />
					OS detect (-O)
				</label>
				<label className="items-center gap-2 inline-flex">
					<ToggleSwitch checked={serviceDetect} onChange={setServiceDetect} />
					Service detect (-sV)
				</label>
				<label className="items-center gap-2 inline-flex">
					<ToggleSwitch checked={skipPing} onChange={setSkipPing} />
					Skip ping (-Pn)
				</label>{" "}
			</div>

			<div className="flex items-center gap-2 pt-1">
				<button
					disabled={disabled}
					className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded px-3 py-2 text-sm"
				>
					<Play className="size-4" /> Start mock scan
				</button>
				<span className="text-xs text-zinc-400">
					Simulation only — no system commands are executed.
				</span>
			</div>
		</form>
	);
}
