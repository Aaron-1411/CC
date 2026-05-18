import { ReactNode } from "react";
import { useDocumentTitle } from "@/hooks/use-document-title";

interface Props {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** Plain-text version of the title used for <title> + analytics. Falls back to title if it is a string. */
  documentTitle?: string;
  /** Plain-text meta description for SEO. Falls back to description if it is a string. */
  metaDescription?: string;
}

export default function PageHeader({ eyebrow, title, description, actions, documentTitle, metaDescription }: Props) {
  useDocumentTitle(
    documentTitle ?? (typeof title === "string" ? title : undefined),
    metaDescription ?? (typeof description === "string" ? description : undefined),
  );
  return (
    <div className="border-b bg-gradient-warm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="max-w-2xl">
          {eyebrow && (
            <span className="text-[11px] uppercase tracking-[0.2em] text-brand font-semibold">{eyebrow}</span>
          )}
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-brand mt-2 leading-tight">{title}</h1>
          {description && <p className="text-muted-foreground mt-3 text-base md:text-lg leading-relaxed">{description}</p>}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
    </div>
  );
}
