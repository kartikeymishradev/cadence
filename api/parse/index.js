module.exports = async function handler(arg1, arg2) {
  // Support both Vercel Serverless Functions (req, res) and Azure Functions (context, req)
  let req, res, isAzure = false;

  if (arg1 && arg1.req && arg1.res) {
    // Azure Functions environment
    req = arg1.req;
    res = arg1.res;
    isAzure = true;
  } else if (arg2 && arg2.status) {
    // Vercel environment: arg1 is req, arg2 is res
    req = arg1;
    res = arg2;
  } else {
    // Fallback: arg1 is req
    req = arg1;
  }

  function sendResponse(status, jsonBody) {
    if (isAzure) {
      arg1.res = { status, jsonBody };
    } else if (res && typeof res.status === 'function') {
      res.status(status).json(jsonBody);
    }
  }

  try {
    const body = req.body || {};
    const { system, userText } = typeof body === 'string' ? JSON.parse(body) : body;

    if (!system || !userText) {
      return sendResponse(400, { error: 'Missing system prompt or user text' });
    }

    const groqKey = process.env.GROQ_API_KEY_PARSE || process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY_PARSE || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (!groqKey && !geminiKey) {
      return sendResponse(500, { error: 'LLM API key not configured on backend Vercel environment' });
    }

    // 1. Try Server-Side Groq API
    if (groqKey) {
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: system },
              { role: 'user', content: userText },
            ],
            temperature: 0.2,
            response_format: { type: 'json_object' },
          }),
        });

        if (groqRes.ok) {
          const data = await groqRes.json();
          const text = data.choices?.[0]?.message?.content;
          if (text) {
            const clean = text.replace(/```json|```/g, '').trim();
            const parsedJSON = JSON.parse(clean);
            return sendResponse(200, parsedJSON);
          }
        }
      } catch (err) {
        console.error('Groq parse error:', err);
      }
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

      return sendResponse(200, parsedJSON);
    }

    return sendResponse(502, { error: lastError || 'Gemini API call failed across all models' });
  } catch (err) {
    console.error('Parse function error:', err);
    return sendResponse(500, { error: 'Internal server error' });
  }
};
