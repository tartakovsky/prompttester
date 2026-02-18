import type { FooterContent } from "@/content/landing/types";

interface FooterProps {
  content: FooterContent;
}

export function Footer({ content }: FooterProps) {
  return (
    <footer className="border-t py-8 text-center text-sm text-muted-foreground">
      <p>{content.tagline}</p>
    </footer>
  );
}
