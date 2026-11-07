import { Fragment, type ReactNode } from "react";

/**
 * Renders a tiny, safe subset of Markdown written by admins (no HTML is ever injected):
 * "## heading", "- list item", **bold**, and paragraphs.
 */
export function SimpleMarkdown({ source }: { source: string }) {
  const blocks: ReactNode[] = [];
  const lines = source.replace(/\r/g, "").split("\n");
  let list: string[] = [];
  let para: string[] = [];

  const inline = (text: string) =>
    text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>,
    );
  const flushList = () => {
    if (list.length) blocks.push(<ul key={`ul-${blocks.length}`}>{list.map((l, i) => <li key={i}>{inline(l)}</li>)}</ul>);
    list = [];
  };
  const flushPara = () => {
    if (para.length) blocks.push(<p key={`p-${blocks.length}`}>{inline(para.join(" "))}</p>);
    para = [];
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushList();
      flushPara();
    } else if (line.startsWith("## ")) {
      flushList();
      flushPara();
      blocks.push(<h2 key={`h-${blocks.length}`}>{line.slice(3)}</h2>);
    } else if (/^[-•]\s+/.test(line)) {
      flushPara();
      list.push(line.replace(/^[-•]\s+/, ""));
    } else {
      flushList();
      para.push(line);
    }
  }
  flushList();
  flushPara();
  return <>{blocks}</>;
}
