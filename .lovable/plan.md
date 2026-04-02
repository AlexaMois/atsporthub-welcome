
## Plan: Migrate AI Summary from Perplexity to Lovable AI Gateway

### Problem
The "Создать саммари ИИ" button fails with "PERPLEXITY_API_KEY not configured". The edge function uses the Perplexity API which is not configured.

### Fix
Update `supabase/functions/bpium-api/index.ts` lines 540-572 to use the Lovable AI Gateway instead of Perplexity.

### Changes (single file)

**`supabase/functions/bpium-api/index.ts`** — Replace the AI call section:

```typescript
// Before (lines 540-564):
const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
if (!PERPLEXITY_API_KEY) throw new Error('PERPLEXITY_API_KEY not configured');
const aiRes = await fetch('https://api.perplexity.ai/chat/completions', {
  headers: { 'Authorization': `Bearer ${PERPLEXITY_API_KEY}`, ... },
  body: JSON.stringify({ model: 'sonar', ... })
});

// After:
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');
const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
  headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, ... },
  body: JSON.stringify({ model: 'google/gemini-2.5-flash', ... })
});
```

- Replace `PERPLEXITY_API_KEY` → `LOVABLE_API_KEY` (auto-provisioned, no user action needed)
- Replace API URL → `https://ai.gateway.lovable.dev/v1/chat/completions`
- Replace model `sonar` → `google/gemini-2.5-flash` (good balance of speed/quality for summarization)
- Update error messages from "Perplexity" → "AI gateway"
- Keep the same system prompt and response parsing (OpenAI-compatible format)
- Add handling for 429 (rate limit) and 402 (payment required) errors
