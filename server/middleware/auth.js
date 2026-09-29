function requireAuth(req, res, next) {
  if (req.session && req.session.adminUser) {
    return next();
  }
  
  // If it's an API request, return 401 JSON
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(401).json({ success: false, error: 'Unauthorized. Please login as admin.' });
  }

  // If requesting page directly, redirect to home page with login modal hash
  return res.redirect('/#login');
}

module.exports = { requireAuth };
