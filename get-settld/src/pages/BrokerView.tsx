import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LoadingState, EmptyState } from "@/components/states";
import { useTrackTool } from "@/hooks/use-track-tool";

export default function BrokerView() {
  const { code = "" } = useParams();
  useTrackTool("broker.view", { code });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [invite, setInvite] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc("lookup_broker_invite", { p_code: code });
      const inv = Array.isArray(data) && data[0] ? data[0] : null;
      setInvite(inv);
      if (inv?.receipt_id) {
        const r = await supabase.from("verdict_receipts").select("*").eq("id", inv.receipt_id).maybeSingle();
        setReceipt(r.data);
      }
      if (inv && !inv.accepted_at) await supabase.rpc("accept_broker_invite", { p_code: code });
      setLoading(false);
    })();
  }, [code]);

  if (loading) return <LoadingState label="Loading invite…" />;
  if (!invite) return <EmptyState title="Invite not found" description="This link may have been revoked." />;

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 space-y-6">
      <Card className="p-8">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-5 h-5 text-brand" />
          <Badge className="bg-brand-muted text-brand border-0">Broker invite</Badge>
        </div>
        <h1 className="font-serif text-3xl font-bold text-brand mb-2">A buyer wants your view.</h1>
        <p className="text-muted-foreground mb-4">Hello {invite.broker_name || "there"} — a Homestead Ledger user has shared this with you:</p>
        {invite.message && <blockquote className="border-l-4 border-brand pl-4 italic text-foreground my-4">{invite.message}</blockquote>}
        {receipt && (
          <Card className="p-4 mt-4 bg-muted/30">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Attached Verdict Receipt</p>
            <p className="font-serif font-bold text-brand text-lg">{receipt.property_ref || receipt.slug}</p>
            {receipt.score && <p className="text-sm">Score: {receipt.score}/100 ({receipt.band})</p>}
            <Button asChild size="sm" className="mt-2"><Link to={`/v/${receipt.slug}`}>Open full receipt <ArrowRight className="w-3 h-3 ml-1" /></Link></Button>
          </Card>
        )}
        <p className="text-xs text-muted-foreground mt-6">Issued by Homestead Ledger. We never share user details with estate agents.</p>
      </Card>
    </div>
  );
}
