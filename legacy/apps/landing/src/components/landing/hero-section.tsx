import type { HeroContent } from "@/content/landing/types";

interface HeroSectionProps {
  content: HeroContent;
}

export function HeroSection({ content }: HeroSectionProps) {
  const [line1, line2] = content.title.split("\n");

  return (
    <section className="mx-auto max-w-5xl px-4 pt-20 pb-16 text-center">
      <div className="mb-6 inline-block rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-muted-foreground">
        {content.badge}
      </div>

      <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
        {line1}
        <br />
        {line2}
      </h1>

      <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl">
        {content.body}
      </p>

      <a
        href={content.primaryCta.href}
        className="inline-flex h-auto items-center rounded-lg bg-primary px-8 py-3 text-base font-medium text-primary-foreground transition-colors hover:opacity-90"
      >
        {content.primaryCta.label}
      </a>

      <p className="mt-4 text-sm text-muted-foreground">
        {content.helperText}
      </p>
    </section>
  );
}
