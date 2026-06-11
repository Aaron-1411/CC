import type {
  AgentPayload,
  AgentType,
  InboxItemType,
  InboxStatus,
} from "./agents";

/** Serialisable inbox item passed from server components to client UI. */
export interface InboxItemDTO {
  id: string;
  brandId: string;
  agentType: AgentType;
  type: InboxItemType;
  title: string;
  description: string;
  payload: AgentPayload;
  estimatedImpact: string | null;
  pillarSource: number | null;
  status: InboxStatus;
  edited: boolean;
  createdAt: string; // ISO
}
