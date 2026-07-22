const { requireAuth } = require('../lib/auth');
const { getContainer } = require('../lib/cosmos');

module.exports = async function (context, req) {
  // Authenticate
  const user = requireAuth(req, context);
  if (user.status === 401) {
    context.res = user;
    return;
  }

  const container = await getContainer('schedules');

  if (req.method === 'GET') {
    // ── GET /api/schedule?week=2026-07-20&tab=study ──
    const week = req.query.week;
    const tab = req.query.tab || 'study';

    if (!week) {
      context.res = {
        status: 400,
        jsonBody: { error: 'Missing ?week= parameter' },
      };
      return;
    }

    const docId = `${user.userId}_${week}_${tab}`;

    try {
      const { resource } = await container
        .item(docId, user.userId)
        .read();

      if (!resource) {
        context.res = { status: 404, jsonBody: { error: 'Not found' } };
        return;
      }

      context.res = { status: 200, jsonBody: resource };
    } catch (err) {
      if (err.code === 404) {
        context.res = { status: 404, jsonBody: { error: 'Not found' } };
        return;
      }
      throw err;
    }
  } else if (req.method === 'PUT') {
    // ── PUT /api/schedule ──
    const body = req.body || {};
    const { weekStart, tab, rawText, tasks, meals, dayStatus, actuals, mealsLogged } = body;

    if (!weekStart || !tab) {
      context.res = {
        status: 400,
        jsonBody: { error: 'Missing weekStart or tab' },
      };
      return;
    }

    const docId = `${user.userId}_${weekStart}_${tab}`;
    const doc = {
      id: docId,
      userId: user.userId,
      weekStart,
      tab,
      rawText: rawText || '',
      tasks: tasks || [],
      meals: meals || [],
      dayStatus: dayStatus || {},
      actuals: actuals || {},
      mealsLogged: mealsLogged || {},
      updatedAt: new Date().toISOString(),
    };

    try {
      await container.items.upsert(doc);
      context.res = { status: 200, jsonBody: { ok: true } };
    } catch (err) {
      context.log.error('Schedule upsert error:', err);
      context.res = {
        status: 500,
        jsonBody: { error: 'Failed to save schedule' },
      };
    }
  }
};
