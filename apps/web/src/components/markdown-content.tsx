import type { ComponentPropsWithoutRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownContent({ markdown }: { markdown: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: (props) => (
          <h1
            className="mb-4 mt-8 text-2xl font-semibold text-slate-950"
            {...props}
          />
        ),
        h2: (props) => (
          <h2
            className="mb-3 mt-8 text-xl font-semibold text-slate-950"
            {...props}
          />
        ),
        h3: (props) => (
          <h3
            className="mb-2 mt-6 text-lg font-semibold text-slate-950"
            {...props}
          />
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
            rel={href?.startsWith("http") ? "noreferrer" : undefined}
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
            className="my-5 max-h-[520px] rounded-lg object-contain"
            loading="lazy"
            {...props}
            alt={props.alt ?? ""}
          />
        ),
      }}
    >
      {markdown}
    </ReactMarkdown>
  );
}

function safeHref(href?: string) {
  if (!href) return "#";
  return /^(https?:|mailto:|\/|#)/i.test(href) ? href : "#";
}
