import { supabase } from "@/integrations/supabase/client";

export interface AgentQuestionsInput {
  postcode?: string;
  askingPrice?: number;
  beds?: number;
  sqft?: number;
  tenure?: "freehold" | "leasehold";
  leaseYears?: number;
  epc?: string;
  flags?: string[];
}

export async function fetchAgentQuestions(input: AgentQuestionsInput): Promise<string[]> {
  const { data: sess } = await supabase.auth.getSession();
  if (!sess?.session) return [];
  const { data, error } = await supabase.functions.invoke<{ questions?: string[]; error?: string }>(
    "agent-questions",
    { body: input },
  );
  if (error) throw new Error(error.message);
  if (!data) throw new Error("No response");
  if (data.error) throw new Error(data.error);
  return data.questions ?? [];
}
