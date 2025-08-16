const scanProfiles = {
	stealth: {
		discovery: ["-sn", "-T2"],
		ports: ["-sS", "-F", "-T2", "--max-retries", "1", "--scan-delay", "50ms"],
		label: "Stealth (hosts + top ports, low noise)",
	},
	fast: {
		discovery: ["-sn", "-T4"],
		ports: ["-sS", "-F", "-T4"],
		label: "Fast (top ports)",
	},
	deep: {
		discovery: ["-sn", "-T3"],
		ports: ["-sS", "-p1-1024", "-T3"],
		label: "Deep (1-1024 TCP)",
	},
};
export default scanProfiles;
