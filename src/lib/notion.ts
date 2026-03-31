import { Client } from "@notionhq/client";

export const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

export const DATABASE_ID = process.env.NOTION_DATABASE_ID!;

export interface DailyReportData {
  date: string;
  projectName: string;
  status: string;
  office: string;
  activity: string;
  activityOnSite: string;
  foremanName: string;
  workersNames: string;
  workersHours: string;
  tools: string;
  tomorrowsGoal: string;
  unforeseen: string;
  safetyMeeting: boolean;
  pictureUrls: string[];
  signSheetUrl: string;
}

export async function createDailyReport(data: DailyReportData) {
  const pictureFiles = data.pictureUrls.map((url) => ({
    type: "external" as const,
    name: "Site Photo",
    external: { url },
  }));

  const signSheetFiles = data.signSheetUrl
    ? [
        {
          type: "external" as const,
          name: "Sign Sheet",
          external: { url: data.signSheetUrl },
        },
      ]
    : [];

  return notion.pages.create({
    parent: { database_id: DATABASE_ID },
    properties: {
      // Title field - required by Notion
      Name: {
        title: [
          {
            text: {
              content: `${data.projectName} — ${data.date}`,
            },
          },
        ],
      },
      Date: {
        date: { start: data.date },
      },
      "Project Name": {
        rich_text: [{ text: { content: data.projectName } }],
      },
      Status: {
        select: { name: data.status },
      },
      Office: {
        rich_text: [{ text: { content: data.office } }],
      },
      Activity: {
        rich_text: [{ text: { content: data.activity } }],
      },
      "Activity on Site": {
        rich_text: [{ text: { content: data.activityOnSite } }],
      },
      "Foreman Name": {
        rich_text: [{ text: { content: data.foremanName } }],
      },
      "Workers Names": {
        rich_text: [{ text: { content: data.workersNames } }],
      },
      "Workers Hours": {
        rich_text: [{ text: { content: data.workersHours } }],
      },
      Tools: {
        rich_text: [{ text: { content: data.tools } }],
      },
      "Tomorrow's Goal": {
        rich_text: [{ text: { content: data.tomorrowsGoal } }],
      },
      Unforeseen: {
        rich_text: [{ text: { content: data.unforeseen } }],
      },
      "Safety Meeting": {
        checkbox: data.safetyMeeting,
      },
      Pictures: {
        files: pictureFiles,
      },
      "Sign Sheet": {
        files: signSheetFiles,
      },
    },
  });
}
