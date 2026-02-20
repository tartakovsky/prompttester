import { type FinalCtaContent } from "@/content/landing/types";

export function CtaSection({ content }: { content: FinalCtaContent }) {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16 text-center">
      <h2 className="mb-4 text-2xl font-bold">{content.title}</h2>
      <p className="mb-8 text-muted-foreground">{content.body}</p>
      <a
        href={content.cta.href}
        className="inline-flex h-auto items-center rounded-lg bg-primary px-8 py-3 text-base font-medium text-primary-foreground transition-colors hover:opacity-90"
      >
        {content.cta.label}
      </a>
    </section>
  );
}
