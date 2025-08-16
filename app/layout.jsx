import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata = {
	title: "NMAP GUI",
	description: "Simulate a GUI for NMAP, a tool for Network admins/engineers",
};

export default function RootLayout({ children }) {
	return (
		<html lang="en">
			<body className="min-h-dvh bg-zinc-950 text-zinc-100 antialiased">
				<div className="mx-auto max-w-6xl p-4 md:p-6">
					<header className="flex items-center gap-3 pb-4 border-b border-zinc-800">
						<img src="/logo.svg" alt="logo" className="size-8" />
						<h1 className="text-xl font-semibold tracking-tight">
							SOHO Nmap GUI — Mock
						</h1>
						<span className="ml-auto text-xs bg-zinc-800/60 px-2 py-1 rounded border border-zinc-700">
							MMVP
						</span>
					</header>
					<main className="pt-6">{children}</main>
				</div>
			</body>
		</html>
	);
}
