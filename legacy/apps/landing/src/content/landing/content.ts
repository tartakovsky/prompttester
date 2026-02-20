import type { LandingContent } from "./types";

const APP_URL = "https://app.prompttester.io";

export const landingContent: LandingContent = {
  hero: {
    badge: "Free \u00b7 Private \u00b7 Works with any OpenRouter model",
    title: "Test your prompts\nacross any model",
    body: "Run the same inputs through any model on OpenRouter \u2014 GPT, Claude, Gemini, Llama, Mistral, and hundreds more. Compare quality, cost, and speed side by side. Everything stays in your browser.",
    primaryCta: { label: "Sign In & Start Testing \u2192", href: APP_URL },
    helperText: "One-click sign up. Free to use. Bring your OpenRouter key.",
  },

  features: {
    title: "How it works",
    items: [
      {
        emoji: "\ud83d\udcdd",
        title: "Write Prompts & Inputs",
        body: "Create multiple system prompts and test inputs. Iterate on your prompt engineering in real time.",
      },
      {
        emoji: "\ud83d\udd0c",
        title: "Any OpenRouter Model",
        body: "Use your OpenRouter API key to access hundreds of models. We just pass through the responses \u2014 no lock-in, no limits.",
      },
      {
        emoji: "\ud83d\udcca",
        title: "Compare Results",
        body: "See every response in a grid. Compare token usage, cost, and output quality across models and prompts.",
      },
    ],
  },

  trust: {
    items: [
      {
        emoji: "\ud83d\udd12",
        title: "100% Private",
        body: "All tests are stored locally in your browser. We never see your prompts or results.",
      },
      {
        emoji: "\ud83d\udcb8",
        title: "Completely Free",
        body: "No billing, no tiers, no limits. You only pay OpenRouter for model usage.",
      },
      {
        emoji: "\u26a1",
        title: "Instant Setup",
        body: "One-click sign up. Paste your OpenRouter key and start testing in seconds.",
      },
    ],
  },

  finalCta: {
    title: "Ready to find your best prompt?",
    body: "Sign in, add your OpenRouter key, and start comparing models instantly.",
    cta: { label: "Get Started Free \u2192", href: APP_URL },
  },

  footer: {
    tagline: "Prompt Tester \u2014 Built for AI engineers who care about quality.",
  },
};
