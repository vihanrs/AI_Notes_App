import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownProps {
  children: string;
  onNoteClick?: (id: string) => void;
}

export default function Markdown({ children, onNoteClick }: MarkdownProps) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children, ...props }) => {
            // Check for our custom note viewer path
            if (href?.includes("/note-viewer/") && onNoteClick) {
              const noteId = href.split("/note-viewer/")[1];
              return (
                <a 
                  href="#"
                  {...props}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onNoteClick(noteId);
                  }}
                  className="text-primary hover:underline font-bold cursor-pointer inline-flex items-center gap-1 bg-primary/10 px-1.5 py-0.5 rounded-md no-underline border border-primary/20 transition-colors hover:bg-primary/20"
                >
                  {children}
                </a>
              );
            }

            // Standard link handling
            const isInternalLink =
              href?.startsWith(process.env.NEXT_PUBLIC_BASE_URL!) ||
              href?.startsWith("/");
            if (isInternalLink) {
              return (
                <Link href={href || "#"} className="text-primary hover:underline">
                  {children}
                </Link>
              );
            }
            return (
              <a href={href || "#"} className="text-primary hover:underline">
                {children}
              </a>
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
