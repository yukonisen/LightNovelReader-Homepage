import type { VercelRequest, VercelResponse } from "@vercel/node";

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: "info" | "warning" | "critical";
  published_at: string;
  expires_at?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const announcements: Announcement[] = [];

  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
  return res.status(200).json({
    announcements,
    count: announcements.length,
  });
}
