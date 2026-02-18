import { landingContent } from "@/content/landing/content";
import type { LandingContent } from "@/content/landing/types";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { TrustSection } from "@/components/landing/trust-section";
import { CtaSection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export default function LandingPage() {
  const content: LandingContent = landingContent;

  return (
    <main className="min-h-screen">
      <HeroSection content={content.hero} />
      <FeaturesSection content={content.features} />
      <TrustSection content={content.trust} />
      <CtaSection content={content.finalCta} />
      <Footer content={content.footer} />
    </main>
  );
}
