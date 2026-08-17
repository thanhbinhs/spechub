import type { ComponentPropsWithoutRef } from "react";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import { extractWikiHeadings, wikiHeadingId } from "@/lib/wiki-markdown";

export function MarkdownContent({ markdown }: { markdown: string }) {
  const headingIdsByLine = new Map(
    extractWikiHeadings(markdown).map((heading) => [heading.line, heading.id]),
  );

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      urlTransform={(url, key) => {
        if (
          key === "src" &&
          /^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=\s]+$/i.test(url)
        ) {
          return url;
        }
        return defaultUrlTransform(url);
      }}
      components={{
        h1: (props) => (
          <h1
            className="mb-4 mt-8 text-2xl font-semibold text-slate-950"
            {...props}
          />
        ),
        h2: ({ children, node, ...props }) => (
          <h2
            id={
              headingIdsByLine.get(node?.position?.start.line ?? -1) ??
              wikiHeadingId(readableText(children))
            }
            className="mb-3 mt-10 scroll-mt-24 border-t border-slate-200 pt-8 text-xl font-semibold text-slate-950"
            {...props}
          >
            {children}
          </h2>
        ),
        h3: ({ children, node, ...props }) => (
          <h3
            id={
              headingIdsByLine.get(node?.position?.start.line ?? -1) ??
              wikiHeadingId(readableText(children))
            }
            className="mb-2 mt-7 scroll-mt-24 text-lg font-semibold text-slate-950"
            {...props}
          >
            {children}
          </h3>
        ),
        p: (props) => (
          <p className="my-4 leading-8 text-slate-700" {...props} />
        ),
        ul: (props) => (
          <ul className="my-4 list-disc space-y-2 pl-6" {...props} />
        ),
        ol: (props) => (
          <ol className="my-4 list-decimal space-y-2 pl-6" {...props} />
        ),
        li: (props) => (
          <li
            className="leading-7 text-slate-700 marker:text-slate-400"
            {...props}
          />
        ),
        strong: (props) => (
          <strong className="font-semibold text-slate-950" {...props} />
        ),
        em: (props) => (
          <em className="text-sm leading-6 text-slate-500" {...props} />
        ),
        blockquote: (props) => (
          <blockquote
            className="my-5 border-l-4 border-blue-300 bg-blue-50/60 px-4 py-1 text-slate-700"
            {...props}
          />
        ),
        a: ({ href, ...props }) => (
          <a
            href={safeHref(href)}
            target={href?.startsWith("http") ? "_blank" : undefined}
            rel={
              href?.startsWith("http") ? "noopener noreferrer" : undefined
            }
            className="font-medium text-blue-700 underline decoration-blue-200 underline-offset-2 hover:text-blue-800"
            {...props}
          />
        ),
        code: ({ className, ...props }) => (
          <code
            className={`${className ?? ""} rounded bg-slate-100 px-1.5 py-0.5 text-[0.9em] text-slate-900`}
            {...props}
          />
        ),
        pre: (props) => (
          <pre
            className="my-5 overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm leading-6 text-slate-100 [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-inherit"
            {...props}
          />
        ),
        table: (props) => (
          <div className="my-5 overflow-x-auto rounded-lg border border-slate-200">
            <table
              className="w-full min-w-[560px] border-collapse text-left text-sm"
              {...props}
            />
          </div>
        ),
        th: (props) => (
          <th
            className="border-b bg-slate-50 px-3 py-2 font-semibold"
            {...props}
          />
        ),
        td: (props) => (
          <td className="border-b border-slate-100 px-3 py-2" {...props} />
        ),
        img: (props: ComponentPropsWithoutRef<"img">) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="my-7 max-h-[620px] w-full rounded-xl border border-slate-200 bg-slate-50 object-contain shadow-sm"
            loading="lazy"
            decoding="async"
            {...props}
            alt={props.alt ?? ""}
          />
        ),
        hr: (props) => (
          <hr className="my-10 border-0 border-t border-slate-200" {...props} />
        ),
        input: (props) => (
          <input
            className="mr-2 h-4 w-4 translate-y-0.5 rounded border-slate-300 accent-blue-600"
            {...props}
          />
        ),
      }}
    >
      {markdown}
    </ReactMarkdown>
  );
}

function readableText(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(readableText).join("");
  }
  if (value && typeof value === "object" && "props" in value) {
    return readableText(
      (value as { props?: { children?: unknown } }).props?.children,
    );
  }
  return "";
}

function safeHref(href?: string) {
  if (!href) return "#";
  return /^(https?:|mailto:|\/|#)/i.test(href) ? href : "#";
}
