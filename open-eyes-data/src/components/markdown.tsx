import { Fragment, type ReactNode } from "react";

function inline(text: string): ReactNode {
  // bold + italic
  const nodes: ReactNode[] = [];
  const regex = /\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[1]) nodes.push(<strong key={key++}>{m[1]}</strong>);
    else if (m[2]) nodes.push(<em key={key++}>{m[2]}</em>);
    else if (m[3])
      nodes.push(
        <code key={key++} className="px-1 py-0.5 rounded bg-surface-2 label-mono text-[12px]">
          {m[3]}
        </code>,
      );
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function Markdown({ source }: { source: string }) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^##\s+/.test(line)) {
      blocks.push(
        <h3 key={key++} className="font-display text-lg font-bold mt-6 mb-2 text-amber">
          {inline(line.replace(/^##\s+/, ""))}
        </h3>,
      );
      i++;
    } else if (/^#\s+/.test(line)) {
      blocks.push(
        <h2 key={key++} className="font-display text-2xl font-bold mt-6 mb-3">
          {inline(line.replace(/^#\s+/, ""))}
        </h2>,
      );
      i++;
    } else if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ""));
        i++;
      }
      blocks.push(
        <ul key={key++} className="list-disc pl-5 space-y-1 my-2 marker:text-amber/70">
          {items.map((it, idx) => (
            <li key={idx}>{inline(it)}</li>
          ))}
        </ul>,
      );
    } else if (line.trim() === "") {
      i++;
    } else {
      const para: string[] = [];
      while (i < lines.length && lines[i].trim() !== "" && !/^(#|[-*]\s+)/.test(lines[i])) {
        para.push(lines[i]);
        i++;
      }
      blocks.push(
        <p key={key++} className="my-2 leading-7">
          {inline(para.join(" "))}
        </p>,
      );
    }
  }
  return <Fragment>{blocks}</Fragment>;
}