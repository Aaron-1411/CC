import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { clsx } from "clsx";

// Lesson bodies are authored in markdown. We style via Tailwind arbitrary
// descendant variants (no typography plugin, no custom component map — which
// keeps us clear of react-markdown's `node` prop and unused-var rules).
const MD = clsx(
  "text-sm leading-relaxed text-navy-600",
  "[&_p]:mb-3 [&_p:last-child]:mb-0",
  "[&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5",
  "[&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5",
  "[&_li]:leading-relaxed",
  "[&_strong]:font-semibold [&_strong]:text-navy-900",
  "[&_em]:italic",
  "[&_a]:font-medium [&_a]:text-emerald-700 [&_a]:underline [&_a]:break-words",
  "[&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-navy-900",
  "[&_h3]:mt-4 [&_h3]:mb-1.5 [&_h3]:font-bold [&_h3]:text-navy-900",
  "[&_blockquote]:border-l-2 [&_blockquote]:border-navy-200 [&_blockquote]:pl-4 [&_blockquote]:italic",
  "[&_code]:rounded [&_code]:bg-navy-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em] [&_code]:text-navy-800",
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
