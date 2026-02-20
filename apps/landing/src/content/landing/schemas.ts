import { z } from "zod";

export const CtaButtonSchema = z.object({
  label: z.string().min(1).max(40),
  href: z.string().url(),
});

export const HeroSchema = z.object({
  badge: z.string().min(1).max(80),
  title: z.string().min(1).max(80),
  body: z.string().min(10).max(800),
  primaryCta: CtaButtonSchema,
  helperText: z.string().min(1).max(200),
});

export const FeatureItemSchema = z.object({
  emoji: z.string().min(1).max(4),
  title: z.string().min(1).max(60),
  body: z.string().min(10).max(400),
});

export const FeaturesSchema = z.object({
  title: z.string().min(1).max(60),
  items: z.tuple([FeatureItemSchema, FeatureItemSchema, FeatureItemSchema]),
});

export const TrustItemSchema = z.object({
  emoji: z.string().min(1).max(4),
  title: z.string().min(1).max(60),
  body: z.string().min(10).max(400),
});

export const TrustSchema = z.object({
  items: z.tuple([TrustItemSchema, TrustItemSchema, TrustItemSchema]),
});

export const FinalCtaSchema = z.object({
  title: z.string().min(1).max(80),
  body: z.string().min(10).max(400),
  cta: CtaButtonSchema,
});

export const FooterSchema = z.object({
  tagline: z.string().min(1).max(200),
});

export const LandingPageSchema = z.object({
  hero: HeroSchema,
  features: FeaturesSchema,
  trust: TrustSchema,
  finalCta: FinalCtaSchema,
  footer: FooterSchema,
});
