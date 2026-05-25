import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownProps {
  children: string;
  className?: string;
}

export function Markdown({ children, className }: MarkdownProps) {
  return (
    <div
      className={
        className ??
        "prose-invert space-y-3 text-on-surface/80 [&_a]:text-primary-dim [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-primary [&_strong]:font-semibold [&_strong]:text-on-surface [&_ul]:ml-4 [&_ul]:list-disc [&_ol]:ml-4 [&_ol]:list-decimal [&_code]:rounded [&_code]:bg-surface-high [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs"
      }
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
