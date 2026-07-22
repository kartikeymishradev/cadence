/**
 * Extracts the authenticated user identity from the
 * x-ms-client-principal header set by Azure Static Web Apps.
 *
 * Returns { userId, provider, userDetails } or null if unauthenticated.
 */
function getUser(req) {
  const header = req.headers['x-ms-client-principal'];
  if (!header) return null;

  try {
    const decoded = Buffer.from(header, 'base64').toString('utf8');
    const principal = JSON.parse(decoded);

    return {
      userId: principal.userId,
      provider: principal.identityProvider,       // 'github', 'aad', etc.
      userDetails: principal.userDetails,         // email or username
      userRoles: principal.userRoles || [],
    };
  } catch {
    return null;
  }
}

/**
 * Middleware: require authentication.
 * Returns the user object or sends a 401 response.
 */
function requireAuth(req, context) {
  const user = getUser(req);
  if (!user) {
    return {
      status: 401,
      jsonBody: { error: 'Authentication required' },
    };
  }
  return user;
}

module.exports = { getUser, requireAuth };
