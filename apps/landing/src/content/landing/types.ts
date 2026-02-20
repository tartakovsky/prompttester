import { type z } from "zod";
import { type HeroSchema, type FeaturesSchema, type TrustSchema, type FinalCtaSchema, type FooterSchema, type LandingPageSchema } from "./schemas";

export type HeroContent = z.infer<typeof HeroSchema>;
export type FeaturesContent = z.infer<typeof FeaturesSchema>;
export type TrustContent = z.infer<typeof TrustSchema>;
export type FinalCtaContent = z.infer<typeof FinalCtaSchema>;
export type FooterContent = z.infer<typeof FooterSchema>;
export type LandingPageContent = z.infer<typeof LandingPageSchema>;
