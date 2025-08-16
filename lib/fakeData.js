export const SPEEDS = ["T0", "T1", "T2", "T3", "T4", "T5"];

export const PROFILES = {
	stealth: {
		label: "Stealth (-sS -Pn -T2)",
		services: ["ssh", "http", "https", "rdp", "smb", "dns", "ntp", "snmp"],
		commonPorts: [22, 53, 80, 110, 139, 143, 161, 443, 445, 3389],
	},
	fast: {
		label: "Fast (-F -T4)",
		services: ["http", "https", "mdns", "ssh", "rdp", "smb"],
		commonPorts: [22, 53, 80, 443, 445, 3389, 5353],
	},
	full: {
		label: "Full TCP (-sT -p 1-65535)",
		services: ["*"],
		commonPorts: Array.from(
			{ length: 50 },
			(_, i) =>
				[
					1, 4, 7, 9, 13, 20, 21, 22, 23, 25, 37, 53, 67, 68, 69, 79, 80, 88,
					110, 111, 123, 135, 137, 138, 139, 143, 161, 162, 389, 443, 445, 465,
					500, 514, 515, 520, 587, 631, 993, 995, 1080, 1433, 1521, 1723, 2049,
					3306, 3389, 5000, 5432, 8080, 8443,
				][i],
		).filter(Boolean),
	},
};
