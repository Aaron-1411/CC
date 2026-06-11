import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "edge";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ itemId: string }> },
) {
  const { itemId } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as { note?: string };

  const item = await db.inboxItem.findUnique({ where: { id: itemId } });
  if (!item) return NextResponse.json({ error: "Item not found." }, { status: 404 });

  const updated = await db.inboxItem.update({
    where: { id: itemId },
    data: {
      status: "REJECTED",
      reviewedAt: new Date(),
      reviewedBy: "you",
      reviewNote: body.note?.trim() || null,
    },
  });

  return NextResponse.json({ item: updated });
}
