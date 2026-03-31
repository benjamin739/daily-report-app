import { NextRequest, NextResponse } from "next/server";
import { createDailyReport } from "@/lib/notion";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      date,
      projectName,
      status,
      office,
      activity,
      activityOnSite,
      foremanName,
      workersNames,
      workersHours,
      tools,
      tomorrowsGoal,
      unforeseen,
      safetyMeeting,
      pictureUrls,
      signSheetUrl,
    } = body;

    if (!date || !projectName) {
      return NextResponse.json(
        { error: "Date and project name are required" },
        { status: 400 }
      );
    }

    await createDailyReport({
      date,
      projectName,
      status: status || "",
      office: office || "",
      activity: activity || "",
      activityOnSite: activityOnSite || "",
      foremanName: foremanName || "",
      workersNames: workersNames || "",
      workersHours: workersHours || "",
      tools: tools || "",
      tomorrowsGoal: tomorrowsGoal || "",
      unforeseen: unforeseen || "",
      safetyMeeting: !!safetyMeeting,
      pictureUrls: pictureUrls || [],
      signSheetUrl: signSheetUrl || "",
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Submit report error:", err);
    const message = err instanceof Error ? err.message : "Failed to submit report";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
