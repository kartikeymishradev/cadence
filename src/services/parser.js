import { STUDY_SYS, GYM_SYS } from '../utils/constants';

/**
 * Call Groq API (OpenAI-compatible, very fast, generous free tier).
 * Endpoint: https://api.groq.com/openai/v1/chat/completions
 */
async function callGroq(system, userText, apiKey) {
  const modelsToTry = [
    'llama-3.3-70b-versatile',
    'llama3-70b-8192',
    'llama3-8b-8192',
  ];
  let lastError = null;

  for (const model of modelsToTry) {
    let res;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
      res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: userText },
          ],
          temperature: 0.2,
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        lastError = new Error(`Groq API timed out after 15s for model ${model}.`);
      } else {
        lastError = new Error(`Network error connecting to Groq API: ${err.message}`);
      }
      continue;
    }

    if (!res.ok) {
      const errObj = await res.json().catch(() => ({}));
      const message = errObj.error?.message || `HTTP ${res.status}`;
      if (res.status === 429) {
        lastError = new Error(`Groq rate limit on ${model}, trying next...`);
        continue;
      }
      if (res.status === 401) {
        throw new Error(`Groq API key invalid (401): Check your server-side GROQ_API_KEY in Vercel settings`);
      }
      lastError = new Error(`Groq error (${res.status}): ${message}`);
      continue;
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      lastError = new Error('Groq returned an empty response.');
      continue;
    }

    const clean = text.replace(/```json|```/g, '').trim();
    try {
      return JSON.parse(clean);
    } catch {
      throw new Error('AI produced invalid JSON. Try re-phrasing your plan.');
    }
  }

  throw lastError || new Error('Failed to connect to Groq API.');
}

/**
 * Call Google Gemini API directly (fallback).
 */
async function callGemini(system, userText, apiKey) {
  const modelsToTry = ['gemini-2.0-flash', 'gemini-flash-latest'];
  let lastError = null;

  for (const model of modelsToTry) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    let res;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: userText }] }],
          systemInstruction: { parts: [{ text: system }] },
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        lastError = new Error(`Gemini API timed out after 15s for model ${model}.`);
      } else {
        lastError = new Error(`Network error connecting to Gemini: ${err.message}`);
      }
      continue;
    }

    if (!res.ok) {
      const errObj = await res.json().catch(() => ({}));
      const message = errObj.error?.message || `HTTP ${res.status}`;
      if (res.status === 429) {
        lastError = new Error(`Gemini rate limit on ${model}.`);
        continue;
      }
      lastError = new Error(`Gemini error (${res.status}): ${message}`);
      continue;
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      lastError = new Error('Gemini returned an empty response.');
      continue;
    }

    const clean = text.replace(/```json|```/g, '').trim();
    try {
      return JSON.parse(clean);
    } catch {
      throw new Error('AI produced invalid JSON. Try re-phrasing your plan.');
    }
  }

  throw lastError || new Error('Failed to connect to Gemini API.');
}

/**
 * Internal: call LLM through secure serverless backend proxy (/api/parse).
 * Server-side Vercel Environment holds GROQ_API_KEY / GEMINI_API_KEY with 0 client exposure.
 */
async function callLLM(system, userText) {
  let res;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    res = await fetch('/api/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system, userText }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('API proxy timed out after 15 seconds.');
    }
    throw new Error(`Network error: ${err.message}`);
  }

  if (!res.ok) {
    const errObj = await res.json().catch(() => ({}));
    throw new Error(errObj.error || `API error (${res.status})`);
  }

  const rawTextRes = await res.text();
  try {
    return JSON.parse(rawTextRes);
  } catch {
    throw new Error('Serverless parser returned invalid JSON.');
  }
}

/**
 * Parse a pasted plan into a structured schedule.
 */
export async function parsePlan(tab, text) {
  const system = tab === 'study' ? STUDY_SYS : GYM_SYS;
  return callLLM(system, text);
}

/**
 * Re-parse with clarification answers.
 */
export async function refinePlan(tab, text, clarifications, answers) {
  const qa = clarifications
    .map(
      (q) =>
        `Q: ${q}\nA: ${answers[q] || 'no preference, use your best judgement'}`
    )
    .join('\n');
  const combined = `${text}\n\nAdditional answers from the user:\n${qa}\n\nUse these to fill gaps. Don't ask clarifications again unless truly necessary.`;
  const system = tab === 'study' ? STUDY_SYS : GYM_SYS;
  return callLLM(system, combined);
}
