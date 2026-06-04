import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { clsx } from "clsx";

// Lesson bodies are authored in markdown. We style via Tailwind arbitrary
// descendant variants (no typography plugin, no custom component map — which
// keeps us clear of react-markdown's `node` prop and unused-var rules).
const MD = clsx(
  // Darker base ink than before — body copy now reads at AA-comfortable contrast
  // so the eye absorbs it faster and with less strain.
  "text-[0.95rem] leading-relaxed text-navy-700",
  "[&_p]:mb-3 [&_p:last-child]:mb-0",
  "[&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ul]:marker:text-emerald-500",
  "[&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5 [&_ol]:marker:font-semibold [&_ol]:marker:text-emerald-600",
  "[&_li]:leading-relaxed",
  // Keyword highlight: bold terms get a key-term token treatment — dark ink on
  // a soft emerald wash so the words that matter jump off the page. Semibold
  // (not bold) keeps it from going double-loud where several terms cluster in
  // one sentence; box-decoration-clone keeps the wash tidy across line breaks.
  "[&_strong]:font-semibold [&_strong]:text-navy-900 [&_strong]:rounded-[3px] [&_strong]:bg-emerald-100 [&_strong]:px-1 [&_strong]:py-px [&_strong]:box-decoration-clone",
  // Emphasis stays distinct but quieter — navy ink, no highlight, so it reads as
  // a secondary signal next to the emerald keyword highlight.
  "[&_em]:not-italic [&_em]:font-semibold [&_em]:text-emerald-700",
  "[&_a]:font-semibold [&_a]:text-emerald-700 [&_a]:underline [&_a]:decoration-emerald-300 [&_a]:underline-offset-2 [&_a]:break-words hover:[&_a]:decoration-emerald-500",
  "[&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-navy-900",
  "[&_h3]:mt-4 [&_h3]:mb-1.5 [&_h3]:font-bold [&_h3]:text-navy-900",
  "[&_blockquote]:border-l-[3px] [&_blockquote]:border-emerald-300 [&_blockquote]:bg-emerald-50/40 [&_blockquote]:rounded-r-lg [&_blockquote]:py-1.5 [&_blockquote]:pl-4 [&_blockquote]:pr-3 [&_blockquote]:text-navy-700",
  "[&_code]:rounded [&_code]:bg-navy-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em] [&_code]:font-semibold [&_code]:text-navy-800",
  "[&_table]:mb-3 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm",
  "[&_th]:border [&_th]:border-navy-200 [&_th]:bg-navy-50 [&_th]:px-3 [&_th]:py-1.5 [&_th]:text-left [&_th]:font-semibold [&_th]:text-navy-700",
  "[&_td]:border [&_td]:border-navy-200 [&_td]:px-3 [&_td]:py-1.5",
);

export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={clsx(MD, className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
