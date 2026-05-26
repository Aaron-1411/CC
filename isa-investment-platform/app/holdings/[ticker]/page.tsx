import { HOLDINGS_DEFINITION } from '@/lib/constants';
import InstrumentClient from './client';

// Pre-render a page for every known ticker at build time (required for static export)
export function generateStaticParams() {
  return HOLDINGS_DEFINITION.map((h) => ({ ticker: encodeURIComponent(h.ticker) }));
}

interface Props { params: Promise<{ ticker: string }>; }

export default async function InstrumentPage({ params }: Props) {
  const { ticker } = await params;
  return <InstrumentClient ticker={ticker} />;
}
