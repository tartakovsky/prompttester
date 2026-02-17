# Replace default models + visual section differentiation

**Date:** 2026-02-17 20:13
**Task:** Use autosmm commenter models as defaults, add color-coded section styling

## 1. Replace Default Models
AutoSMM commenter SUPPORTED_MODELS:
1. `mistralai/mistral-small-3.2-24b-instruct`
2. `google/gemini-2.5-flash-lite`
3. `google/gemini-3-flash-preview`
4. `anthropic/claude-opus-4.6`
5. `anthropic/claude-opus-4.5`
6. `openai/gpt-5.2-chat`

Short display names: `mistral-small-3.2-24b-instruct`, `gemini-2.5-flash-lite`, etc.

## 2. Visual Section Differentiation
Neutral color palette for sections — no emotional associations, just enough to tell them apart:
- **Inputs**: Warm stone/sand — `stone` palette (brownish gray)
- **Prompts**: Cool slate — `slate` palette (blue-gray)
- **Models**: Neutral zinc — `zinc` palette (pure gray)

Applied to:
- Section title color
- Active item border + bg tint in ItemList
- Slight left border accent on the section

Implementation: Pass a `colorClass` prop to ItemList and section headers. Use Tailwind classes like:
- Inputs: `border-stone-400`, `bg-stone-500/10`, `text-stone-600`
- Prompts: `border-slate-400`, `bg-slate-500/10`, `text-slate-600`
- Models: `border-zinc-400`, `bg-zinc-500/10`, `text-zinc-600`

More spacing between sections: increase `space-y-6` to `space-y-10` or add explicit margins.

## Files to Modify
- `apps/web/src/app/page.tsx` — both changes
