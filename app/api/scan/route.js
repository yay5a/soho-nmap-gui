import { NextResponse } from "next/server";
import { mockScan } from "@/lib/mockScan";

export async function POST(req) {
	const params = await req.json();
	const { readable, writable } = new TransformStream();
	const writer = writable.getWriter();

	(async () => {
		for await (const event of mockScan(params)) {
			await writer.write(
				new TextEncoder().encode(JSON.stringify(event) + "\n\n"),
			);
		}
		writer.close();
	})();
	return new NextResponse(readable, {
		headers: { "Content-Type": "application/json; charset=utf-8" },
	});
}
