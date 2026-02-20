import { LandingPageSchema } from "./schemas";
import { landingContent } from "./content";

// Parse gate — validates content at module evaluation time.
// Next.js evaluates this during build. Bad content = ZodError = build fails.
export const content = LandingPageSchema.parse(landingContent);
