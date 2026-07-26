module.exports = async function handler(arg1, arg2) {
  let req, res, isAzure = false;

  if (arg1 && arg1.req && arg1.res) {
    req = arg1.req;
    res = arg1.res;
    isAzure = true;
  } else if (arg2 && arg2.status) {
    req = arg1;
    res = arg2;
  } else {
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
    const { query, schedule, notesArchive } = typeof body === 'string' ? JSON.parse(body) : body;

    if (!query) {
      return sendResponse(400, { error: 'Missing user query' });
    }

    // SERVER-SIDE ONLY SECRET KEY READ (Never exposed to browser JavaScript)
    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    const scheduleSummary = Object.entries(schedule || {})
      .map(([cat, tasks]) => `${cat}: ${(tasks || []).map((t) => `${t.title} (${t.time || 'no time'})`).join(', ')}`)
      .join('\n');

    const notesSummary = (notesArchive || [])
      .map((n) => `[${n.title}]: ${n.content.substring(0, 150)}...`)
      .join('\n');

    const systemPrompt = `You are Cadence AI Copilot, a fast productivity assistant for schedule rescheduling and notes Q&A.
User's Schedule Today:
${scheduleSummary || 'No tasks scheduled yet'}

User's Notes Vault:
${notesSummary || 'No notes stored yet'}

If user asks to shift, reschedule, or change time for a class/task, respond ONLY in valid JSON format:
{"type":"proposal","proposal":{"taskId":"skill-0","catId":"skill","taskIndex":0,"originalTitle":"Task Name","originalTime":"10:00 AM","newTime":"06:00 PM","reason":"Adjusted for evening focus window"}}

Otherwise, respond in plain text with a concise, helpful answer.`;

    // 1. Try Server-Side Groq API if key configured
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
              { role: 'system', content: systemPrompt },
              { role: 'user', content: query },
            ],
            temperature: 0.2,
          }),
        });

        if (groqRes.ok) {
          const data = await groqRes.json();
          const text = data?.choices?.[0]?.message?.content || '';
          if (text.includes('"type":"proposal"') || text.includes('"newTime"')) {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              return sendResponse(200, parsed);
            }
          }
          return sendResponse(200, { type: 'text', content: text });
        }
      } catch (err) {
        console.error('Groq server-side call failed:', err);
      }
    }

    // 2. Try Server-Side Gemini API if key configured
    if (geminiKey) {
      try {
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\nUser Query: ${query}` }] }],
          }),
        });

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          return sendResponse(200, { type: 'text', content: text });
        }
      } catch (err) {
        console.error('Gemini server-side call failed:', err);
      }
    }

    return sendResponse(503, { error: 'No server-side LLM key configured on Vercel environment' });
  } catch (err) {
    console.error('Copilot function error:', err);
    return sendResponse(500, { error: 'Internal server error' });
  }
};
