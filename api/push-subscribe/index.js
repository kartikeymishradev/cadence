const { requireAuth } = require('../lib/auth');
const { getContainer } = require('../lib/cosmos');

module.exports = async function (context, req) {
  // Authenticate
  const user = requireAuth(req, context);
  if (user.status === 401) {
    context.res = user;
    return;
  }

  const container = await getContainer('push_subscriptions');
  const docId = `${user.userId}_push`;

  if (req.method === 'POST') {
    // ── Store push subscription ──
    const { subscription } = req.body || {};

    if (!subscription || !subscription.endpoint) {
      context.res = {
        status: 400,
        jsonBody: { error: 'Missing push subscription object' },
      };
      return;
    }

    const doc = {
      id: docId,
      userId: user.userId,
      subscription,
      createdAt: new Date().toISOString(),
    };

    try {
      await container.items.upsert(doc);
      context.res = { status: 200, jsonBody: { ok: true } };
    } catch (err) {
      context.log.error('Push subscribe error:', err);
      context.res = {
        status: 500,
        jsonBody: { error: 'Failed to save subscription' },
      };
    }
  } else if (req.method === 'DELETE') {
    // ── Remove push subscription ──
    try {
      await container.item(docId, user.userId).delete();
      context.res = { status: 200, jsonBody: { ok: true } };
    } catch (err) {
      if (err.code === 404) {
        context.res = { status: 200, jsonBody: { ok: true } };
        return;
      }
      context.log.error('Push unsubscribe error:', err);
      context.res = {
        status: 500,
        jsonBody: { error: 'Failed to remove subscription' },
      };
    }
  }
};
