import { STUDY_SYS, GYM_SYS } from '../utils/constants';

const isDev = import.meta.env.DEV;
const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GOOGLE_API_KEY || import.meta.env.VITE_FREEMODEL_KEY || '';

/**
 * Call Google Gemini API directly (gemini-3.6-flash with gemini-flash-latest fallback).
 */
async function callGemini(system, userText, apiKey) {
  const modelsToTry = ['gemini-3.6-flash', 'gemini-flash-latest', 'gemini-2.0-flash'];
  let lastError = null;

  for (const model of modelsToTry) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    let res;
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
      });
    } catch (err) {
      lastError = new Error(`Network error connecting to Google Gemini API: ${err.message}`);
      continue;
    }

    if (!res.ok) {
      const errObj = await res.json().catch(() => ({}));
      const message = errObj.error?.message || `HTTP ${res.status}`;
      if (res.status === 429) {
        lastError = new Error(`Gemini Rate Limit (429): Quota exceeded on model ${model}. Retrying next model...`);
        continue;
      }
      if (res.status === 400 || res.status === 403) {
        throw new Error(`Google API Key error (${res.status}): ${message}`);
      }
      lastError = new Error(`Google Gemini Error (${res.status}): ${message}`);
      continue;
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      lastError = new Error('Gemini API returned an empty response.');
      continue;
    }

    const clean = text.replace(/```json|```/g, '').trim();
    try {
      return JSON.parse(clean);
    } catch {
      throw new Error('AI produced invalid JSON output. Try re-phrasing your plan.');
    }
  }

  throw lastError || new Error('Failed to connect to Google Gemini API.');
}

/**
 * Internal: call the LLM in development mode.
 */
async function callLLM(system, userText) {
  if (isDev) {
    if (!GEMINI_KEY) {
      throw new Error('API key missing in .env.local! Please add your key to .env.local.');
    }
    return callGemini(system, userText, GEMINI_KEY);
  }

  // Production: call the backend proxy (Azure Function)
  let res;
  try {
    res = await fetch('/api/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system, userText }),
    });
  } catch (err) {
    throw new Error(`Backend API error: ${err.message}`);
  }

  if (!res.ok) {
    const errObj = await res.json().catch(() => ({}));
    throw new Error(errObj.error || `Parse API error (${res.status})`);
  }

  return res.json();
}

/**
 * Parse a pasted plan into a structured multi-week or single-week schedule.
 */
export async function parsePlan(tab, text) {
  const system = tab === 'study' ? STUDY_SYS : GYM_SYS;
  return callLLM(system, text);
}

/**
 * Re-parse a plan with additional clarification answers.
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
