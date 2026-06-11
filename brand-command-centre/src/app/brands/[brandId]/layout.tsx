import { notFound } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { getBrand, getPendingCount, getLatestAudit } from "@/lib/queries";

export const runtime = "edge";

export default async function BrandLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = await params;
  const brand = await getBrand(brandId);
  if (!brand) notFound();

  const [pendingCount, latestAudit] = await Promise.all([
    getPendingCount(brandId),
    getLatestAudit(brandId),
  ]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar brandId={brandId} brandName={brand.name} pendingCount={pendingCount} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          brandId={brandId}
          brandName={brand.name}
          brandUrl={brand.url}
          lastAuditAt={latestAudit?.completedAt ?? null}
        />
        <main className="min-h-0 flex-1 overflow-y-auto scroll-thin">{children}</main>
      </div>
    </div>
  );
}
