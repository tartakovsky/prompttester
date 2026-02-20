import { type FeaturesContent } from "@/content/landing/types";

export function FeaturesSection({ content }: { content: FeaturesContent }) {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16">
      <h2 className="mb-10 text-center text-2xl font-bold">{content.title}</h2>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {content.items.map((item) => (
          <div
            key={item.title}
            className="rounded-lg border bg-background p-6 shadow-sm"
          >
            <div className="mb-4 text-3xl">{item.emoji}</div>
            <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
            <p className="text-sm text-muted-foreground">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
