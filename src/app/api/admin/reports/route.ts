import { NextResponse } from "next/server";
import { notion, DATABASE_ID } from "@/lib/notion";

export async function GET() {
  try {
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      sorts: [{ property: "Date", direction: "descending" }],
      page_size: 50,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reports = response.results.map((page: any) => ({
      id: page.id,
      url: page.url,
      properties: page.properties,
    }));

    return NextResponse.json({ reports });
  } catch (err: unknown) {
    console.error("Fetch reports error:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch reports";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
