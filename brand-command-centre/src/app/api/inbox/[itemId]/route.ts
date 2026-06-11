import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { AgentPayload } from "@/types/agents";

export const runtime = "edge";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ itemId: string }> },
) {
  const { itemId } = await ctx.params;
  const item = await db.inboxItem.findUnique({ where: { id: itemId } });
  if (!item) return NextResponse.json({ error: "Item not found." }, { status: 404 });
  return NextResponse.json({ item });
}

// Autosave the inline editor (payload + optional title/description).
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ itemId: string }> },
) {
  const { itemId } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as {
    payload?: AgentPayload;
    title?: string;
    description?: string;
  };

  const item = await db.inboxItem.findUnique({ where: { id: itemId } });
  if (!item) return NextResponse.json({ error: "Item not found." }, { status: 404 });
  if (item.status !== "PENDING") {
    return NextResponse.json(
      { error: "Only pending items can be edited." },
      { status: 409 },
    );
  }

  const updated = await db.inboxItem.update({
    where: { id: itemId },
    data: {
      ...(body.payload !== undefined ? { payload: body.payload as unknown as object } : {}),
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      edited: true,
    },
  });

  return NextResponse.json({ item: updated, savedAt: new Date().toISOString() });
}
