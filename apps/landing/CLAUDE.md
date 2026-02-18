# Landing App (`apps/landing`)

Marketing landing page for Prompt Tester. Runs on port 3011.

## Architecture: Typed Block Pattern

The landing page uses a **typed block architecture** where content, types, and components are strictly separated:

```
src/
├── content/landing/
│   ├── types.ts        ← Block interfaces (shape of each section's data)
│   └── content.ts      ← Actual content conforming to types
├── components/landing/
│   ├── hero-section.tsx
│   ├── features-section.tsx
│   ├── trust-section.tsx
│   ├── cta-section.tsx
│   └── footer.tsx
└── app/
    └── page.tsx         ← Orchestrator: imports content + blocks, composes
```

### How it works

1. **`types.ts`** defines interfaces for each block (e.g., `HeroContent`, `FeaturesContent`). A master `LandingContent` interface maps block names to their types.

2. **`content.ts`** exports `landingContent: LandingContent` — the actual strings, populated inline. If the shape doesn't match the types, the build fails.

3. **Block components** each receive a single typed prop (e.g., `content: HeroContent`). They are purely presentational with no cross-block dependencies.

4. **`page.tsx`** is the orchestrator — it imports the content object and all block components, then composes them in order. No logic, just composition.

### Rules

- **Never hardcode text in block components.** All copy comes from `content.ts`.
- **Every block has a type.** Adding a new section means: add type → add content → add component → add to page.tsx.
- **Blocks are independent.** No block imports from or depends on another block.
- **Types enforce constraints.** Use tuples for fixed-length arrays, JSDoc for word count limits.

### Adding a new block

1. Define the interface in `types.ts`
2. Add the field to `LandingContent`
3. Populate the data in `content.ts`
4. Create the component in `components/landing/`
5. Add it to `page.tsx` in the desired position

## Deployment

This app is not yet deployed separately. The web app deploys to Railway from `apps/web`.
