import { Client } from "@notionhq/client";

export const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

export const DATABASE_ID = process.env.NOTION_DATABASE_ID!;

export interface DailyReportData {
  date: string;
  projectName: string;
  status: string;
  activity: string;
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
  // Build image blocks for page body
  const imageBlocks: object[] = [];

  if (data.pictureUrls.length > 0) {
    imageBlocks.push({
      object: "block",
      type: "heading_2",
      heading_2: {
        rich_text: [{ type: "text", text: { content: "Site Photos" } }],
      },
    });
    data.pictureUrls.forEach((url) => {
      imageBlocks.push({
        object: "block",
        type: "image",
        image: { type: "external", external: { url } },
      });
    });
  }

  if (data.signSheetUrl) {
    imageBlocks.push({
      object: "block",
      type: "heading_2",
      heading_2: {
        rich_text: [{ type: "text", text: { content: "Sign Sheet" } }],
      },
    });
    imageBlocks.push({
      object: "block",
      type: "image",
      image: { type: "external", external: { url: data.signSheetUrl } },
    });
  }

  return notion.pages.create({
    parent: { database_id: DATABASE_ID },
    properties: {
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
      Activity: {
        rich_text: [{ text: { content: data.activity } }],
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
    },
    // Photos added as image blocks inside the page body
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    children: imageBlocks as any,
  });
}
