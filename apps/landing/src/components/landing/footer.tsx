import { type FooterContent } from "@/content/landing/types";

export function Footer({ content }: { content: FooterContent }) {
  return (
    <footer className="border-t py-8 text-center text-sm text-muted-foreground">
      <p>{content.tagline}</p>
    </footer>
  );
}
