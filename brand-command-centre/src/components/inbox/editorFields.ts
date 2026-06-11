import type { InboxItemType } from "@/types/agents";

export type FieldKind = "text" | "textarea" | "lines";

export interface EditableField {
  key: string; // payload key
  label: string;
  kind: FieldKind; // lines = newline-separated array
  rows?: number;
}

/**
 * Which payload fields the inline editor exposes per item type. Array fields
 * (kind: "lines") are edited as newline-separated text and split on save.
 * INTEL_REPORT is intentionally omitted — it's read-only.
 */
export const EDITABLE_FIELDS: Partial<Record<InboxItemType, EditableField[]>> = {
  BLOG_POST: [
    { key: "title", label: "Title", kind: "text" },
    { key: "metaDescription", label: "Meta description", kind: "textarea", rows: 2 },
    { key: "body", label: "Body (Markdown)", kind: "textarea", rows: 18 },
  ],
  SOCIAL_POST: [{ key: "caption", label: "Caption", kind: "textarea", rows: 8 }],
  AD_DRAFT: [
    { key: "headlines", label: "Headlines (one per line)", kind: "lines", rows: 6 },
    { key: "descriptions", label: "Descriptions (one per line)", kind: "lines", rows: 4 },
    { key: "audienceNotes", label: "Audience notes", kind: "textarea", rows: 3 },
  ],
  EMAIL_FLOW: [
    { key: "subject", label: "Subject", kind: "text" },
    { key: "previewText", label: "Preview text", kind: "text" },
    { key: "bodyHtml", label: "Body (HTML)", kind: "textarea", rows: 14 },
  ],
  PROMO_OFFER: [
    { key: "landingPageCopy", label: "Landing page copy", kind: "textarea", rows: 6 },
    { key: "conditions", label: "Conditions", kind: "textarea", rows: 2 },
    { key: "urgencyMechanic", label: "Urgency mechanic", kind: "text" },
  ],
  REVIEW_RESPONSE: [
    { key: "suggestedResponse", label: "Your response", kind: "textarea", rows: 6 },
  ],
};

export function fieldsFor(type: InboxItemType): EditableField[] {
  return EDITABLE_FIELDS[type] ?? [];
}
