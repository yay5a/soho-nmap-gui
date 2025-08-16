"use client";

import { useEffect, useState } from "react";

export default function RefreshTimer({ enabled, intervalMs }) {
	const [remaining, setRemaining] = useState(intervalMs);
	useEffect(() => {
		if (!enabled) return;
		setRemaining(intervalMs);
		const id = setInterval(() => {
			setRemaining((r) => (r <= 1000 ? intervalMs : r - 1000));
		}, 1000);
		return () => clearInterval(id);
	}, [enabled, intervalMs]);
	if (!enabled)
		return <span className="text-xs text-zinc-400">Auto-refresh off</span>;
	return (
		<span className="text-xs text-zinc-400">
			Refreshing in {Math.ceil(remaining / 1000)}s
		</span>
	);
}
