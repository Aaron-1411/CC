"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { emptyContextData } from "@/lib/brand-context";
import { defaultConfigFor } from "@/lib/agents/config";
import { AGENT_TYPES, type AgentType, type AutonomyLevel } from "@/types/agents";

function normalizeUrl(raw: string): string {
  const t = raw.trim();
  if (!t) return t;
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

/** Create a brand + its context + default (disabled) agent configs, then open it. */
export async function createBrand(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const urlRaw = String(formData.get("url") ?? "").trim();
  const industry = String(formData.get("industry") ?? "").trim() || null;
  const cmsType = String(formData.get("cmsType") ?? "").trim() || null;
  const toneOfVoice = String(formData.get("toneOfVoice") ?? "").trim() || null;

  if (!name || !urlRaw) return;
  const url = normalizeUrl(urlRaw);

  const brand = await db.brand.create({
    data: {
      name,
      url,
      industry,
      cmsType,
      toneOfVoice,
      brandContext: { create: { ...emptyContextData() } },
      agentConfigs: {
        create: AGENT_TYPES.map((t) => {
          const d = defaultConfigFor(t);
          return {
            agentType: d.agentType,
            enabled: d.enabled,
            scheduleExpr: d.scheduleExpr,
            autonomyLevel: d.autonomyLevel,
            config: d.config as object,
          };
        }),
      },
    },
  });

  redirect(`/brands/${brand.id}`);
}

export async function setAgentEnabled(
  brandId: string,
  agentType: AgentType,
  enabled: boolean,
) {
  await db.agentConfig.updateMany({
    where: { brandId, agentType },
    data: { enabled },
  });
  revalidatePath(`/brands/${brandId}/agents`);
  revalidatePath(`/brands/${brandId}`);
}

export async function setAgentAutonomy(
  brandId: string,
  agentType: AgentType,
  autonomyLevel: AutonomyLevel,
) {
  await db.agentConfig.updateMany({
    where: { brandId, agentType },
    data: { autonomyLevel },
  });
  revalidatePath(`/brands/${brandId}/agents`);
}

/** Update editable brand details from the Settings page. */
export async function updateBrand(brandId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const urlRaw = String(formData.get("url") ?? "").trim();
  const industry = String(formData.get("industry") ?? "").trim() || null;
  const cmsType = String(formData.get("cmsType") ?? "").trim() || null;
  const toneOfVoice = String(formData.get("toneOfVoice") ?? "").trim() || null;
  const primaryColour = String(formData.get("primaryColour") ?? "").trim() || null;

  await db.brand.update({
    where: { id: brandId },
    data: {
      ...(name ? { name } : {}),
      ...(urlRaw ? { url: normalizeUrl(urlRaw) } : {}),
      industry,
      cmsType,
      toneOfVoice,
      primaryColour,
    },
  });

  revalidatePath(`/brands/${brandId}/settings`);
  revalidatePath(`/brands/${brandId}`);
}
