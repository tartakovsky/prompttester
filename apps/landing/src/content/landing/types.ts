/* ─── Block content types ─────────────────────────────────────────────── */

/** CTA button shape used across multiple blocks */
export interface CtaButton {
  label: string;
  href: string;
}

/* ── Hero ─────────────────────────────────────────────────────────────── */

export interface HeroContent {
  /** Short pill badge above the headline, ~8 words */
  badge: string;
  /** Two-line headline */
  title: string;
  /** Supporting paragraph, max ~40 words */
  body: string;
  primaryCta: CtaButton;
  /** Small helper text below the CTA */
  helperText: string;
}

/* ── Features ("How it works") ────────────────────────────────────────── */

export interface FeatureItem {
  emoji: string;
  title: string;
  body: string;
}

export interface FeaturesContent {
  title: string;
  items: readonly [FeatureItem, FeatureItem, FeatureItem];
}

/* ── Trust badges ─────────────────────────────────────────────────────── */

export interface TrustItem {
  emoji: string;
  title: string;
  body: string;
}

export interface TrustContent {
  items: readonly [TrustItem, TrustItem, TrustItem];
}

/* ── Final CTA ────────────────────────────────────────────────────────── */

export interface FinalCtaContent {
  title: string;
  body: string;
  cta: CtaButton;
}

/* ── Footer ───────────────────────────────────────────────────────────── */

export interface FooterContent {
  tagline: string;
}

/* ── Master landing content ───────────────────────────────────────────── */

export interface LandingContent {
  hero: HeroContent;
  features: FeaturesContent;
  trust: TrustContent;
  finalCta: FinalCtaContent;
  footer: FooterContent;
}
