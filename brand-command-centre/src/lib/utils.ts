import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNowStrict } from "date-fns";
import type { InboxItemType } from "@/types/agents";
import type { RAGStatus } from "@/types/analysis";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function timeAgo(date: Date | string): string {
  return formatDistanceToNowStrict(new Date(date), { addSuffix: true })
    .replace("minutes", "min")
    .replace("minute", "min")
    .replace("hours", "hrs")
    .replace("hour", "hr")
    .replace("seconds", "sec")
    .replace("second", "sec");
}

const ITEM_TYPE_LABELS: Record<InboxItemType, string> = {
  BLOG_POST: "Blog",
  SOCIAL_POST: "Post",
  AD_DRAFT: "Ad",
  EMAIL_FLOW: "Email",
  PROMO_OFFER: "Promo",
  REVIEW_RESPONSE: "Response",
  INTEL_REPORT: "Intel",
};

export function itemTypeLabel(type: InboxItemType): string {
  return ITEM_TYPE_LABELS[type] ?? type;
}

export function ragStyles(status: RAGStatus): {
  text: string;
  bg: string;
  label: string;
} {
  switch (status) {
    case "GREEN":
      return { text: "text-[var(--good)]", bg: "bg-[var(--good-bg)]", label: "On track" };
    case "AMBER":
      return { text: "text-[var(--warn)]", bg: "bg-[var(--warn-bg)]", label: "Needs work" };
    case "RED":
    default:
      return { text: "text-[var(--bad)]", bg: "bg-[var(--bad-bg)]", label: "Critical" };
  }
}
