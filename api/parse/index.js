const { requireAuth } = require('../lib/auth');

// Simple in-memory rate limiter (10 requests/min per user)
const rateMap = new Map();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60_000;

function checkRateLimit(userId) {
  const now = Date.now();
  const entry = rateMap.get(userId);

  if (!entry || now - entry.start > RATE_WINDOW) {
    rateMap.set(userId, { start: now, count: 1 });
    return true;
  }

  if (entry.count >= RATE_LIMIT) {
    return false;
  }

  entry.count++;
  return true;
}

module.exports = async function (context, req) {
  // Authenticate
  const user = requireAuth(req, context);
  if (user.status === 401) {
    context.res = user;
    return;
  }

  // Rate limit
  if (!checkRateLimit(user.userId)) {
    context.res = {
      status: 429,
      jsonBody: { error: 'Too many requests. Please wait a minute.' },
    };
    return;
  }

  try {
    const { system, userText } = req.body || {};

    if (!system || !userText) {
      context.res = {
        status: 400,
        jsonBody: { error: 'Missing system prompt or user text' },
      };
      return;
    }

    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.FREEMODEL_API_KEY;

    if (!geminiKey) {
      context.res = {
        status: 500,
        jsonBody: { error: 'LLM API key not configured on backend' },
      };
      return;
    }

    const modelsToTry = ['gemini-3.6-flash', 'gemini-flash-latest', 'gemini-2.0-flash'];
    let lastError = null;

    for (const model of modelsToTry) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
      const response = await fetch(url, {
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

      if (!response.ok) {
        const errObj = await response.json().catch(() => ({}));
        lastError = errObj.error?.message || `HTTP ${response.status}`;
        continue;
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) continue;

      const clean = text.replace(/```json|```/g, '').trim();
      const parsedJSON = JSON.parse(clean);

      context.res = {
        status: 200,
        jsonBody: parsedJSON,
      };
      return;
    }

    context.res = {
      status: 502,
      jsonBody: { error: lastError || 'Gemini API call failed across all models' },
    };
  } catch (err) {
    context.log.error('Parse function error:', err);
    context.res = {
      status: 500,
      jsonBody: { error: 'Internal server error' },
    };
  }
};
