import { redirect } from "next/navigation";
import { getFirstBrandId } from "@/lib/queries";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function RootPage() {
  const id = await getFirstBrandId();
  redirect(id ? `/brands/${id}` : "/onboarding");
}
