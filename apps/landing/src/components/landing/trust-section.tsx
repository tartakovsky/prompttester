import { type TrustContent } from "@/content/landing/types";

export function TrustSection({ content }: { content: TrustContent }) {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16">
      <div className="grid grid-cols-1 gap-6 text-center md:grid-cols-3">
        {content.items.map((item) => (
          <div key={item.title}>
            <div className="mb-2 text-2xl">{item.emoji}</div>
            <h3 className="mb-1 font-semibold">{item.title}</h3>
            <p className="text-sm text-muted-foreground">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
