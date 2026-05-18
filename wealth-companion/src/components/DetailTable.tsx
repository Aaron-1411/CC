import type { ReactNode } from "react";
import { HelpCircle } from "lucide-react";

export interface Column<T> {
  key: string;
  header: string;
  hint?: string; // plain-English explainer shown under header
  align?: "left" | "right" | "center";
  render: (row: T) => ReactNode;
  width?: string;
}

export function DetailTable<T extends { id?: string | number }>({
  columns,
  rows,
  caption,
  empty = "Nothing to show yet.",
  footer,
}: {
  columns: Column<T>[];
  rows: T[];
  caption?: string;
  empty?: string;
  footer?: ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card shadow-soft overflow-hidden">
      {caption && (
        <div className="px-4 py-3 border-b bg-muted/30">
          <p className="text-xs text-muted-foreground">{caption}</p>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  style={{ width: c.width }}
                  className={`px-3 py-2.5 text-${c.align ?? "left"} align-top`}
                >
                  <div className={`flex items-center gap-1 ${c.align === "right" ? "justify-end" : c.align === "center" ? "justify-center" : ""}`}>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/80">
                      {c.header}
                    </span>
                    {c.hint && (
                      <span title={c.hint} className="text-muted-foreground cursor-help">
                        <HelpCircle className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                  {c.hint && (
                    <div className={`mt-0.5 text-[10px] font-normal normal-case tracking-normal text-muted-foreground leading-tight ${c.align === "right" ? "text-right" : ""}`}>
                      {c.hint}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-6 text-center text-sm text-muted-foreground">
                  {empty}
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={(r.id as any) ?? i} className="border-t hover:bg-muted/20">
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={`px-3 py-2.5 align-middle text-${c.align ?? "left"} ${c.align === "right" ? "num" : ""}`}
                    >
                      {c.render(r)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
          {footer && (
            <tfoot className="border-t bg-muted/30 font-semibold">
              {footer}
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

export function TypePill({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "primary" | "gold" | "success" | "warning" }) {
  const cls: Record<string, string> = {
    default: "bg-muted text-muted-foreground",
    primary: "bg-primary/15 text-primary",
    gold: "bg-gold/20 text-gold-foreground",
    success: "bg-success/15 text-success",
    warning: "bg-warning/20 text-warning-foreground",
  };
  return (
    <span className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${cls[tone]}`}>
      {children}
    </span>
  );
}
