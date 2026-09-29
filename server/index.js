const express = require('express');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const session = require('express-session');
require('dotenv').config();

const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');
const { requireAuth } = require('./middleware/auth');
const dbLayer = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const configPath = path.join(__dirname, '../config/firm.json');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'koshti_ca_default_session_secret_2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true if running under HTTPS in production
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  })
);

// Helper to get firm config
function getFirmConfig() {
  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return {};
  }
}

// Dynamic robots.txt
app.get('/robots.txt', (req, res) => {
  const config = getFirmConfig();
  res.type('text/plain');
  if (config.demoMode) {
    return res.send("User-agent: *\nDisallow: /");
  } else {
    return res.send("User-agent: *\nAllow: /\nDisallow: /admin.html\nDisallow: /api/\nSitemap: http://" + req.headers.host + "/sitemap.xml");
  }
});

// Dynamic sitemap.xml
app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml');
  const baseUrl = `${req.protocol}://${req.headers.host}`;
  const articles = dbLayer.getPublishedArticles();
  const services = dbLayer.getActiveServices();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  const staticPages = ['', '/about.html', '/services.html', '/updates.html', '/due-dates.html', '/contact.html'];
  staticPages.forEach(p => {
    xml += `  <url><loc>${baseUrl}${p}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`;
  });

  services.forEach(s => {
    xml += `  <url><loc>${baseUrl}/service.html?s=${s.slug}</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>\n`;
  });

  articles.forEach(a => {
    xml += `  <url><loc>${baseUrl}/article.html?a=${a.slug}</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>\n`;
  });

  xml += `</urlset>`;
  res.send(xml);
});

// SERVER-SIDE AUTH GUARD FOR admin.html (REQUIRE AUTH BEFORE SERVING ADMIN HTML FILE)
app.get('/admin.html', requireAuth, (req, res, next) => {
  res.sendFile(path.join(__dirname, '../public/admin.html'));
});

// Serve Static Assets from /public
app.use(express.static(path.join(__dirname, '../public')));

// Mount API Routes
app.use('/api/admin', adminRoutes);
app.use('/api', apiRoutes);

// 404 Fallback for HTML page requests
app.use((req, res) => {
  if (req.accepts('html')) {
    return res.status(404).sendFile(path.join(__dirname, '../public/404.html'));
  }
  res.status(404).json({ success: false, error: 'Resource not found' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`========================================================`);
  console.log(` Koshti & Company Chartered Accountants Website Server `);
  console.log(` Running on: http://localhost:${PORT}`);
  console.log(` Demo Mode: ${getFirmConfig().demoMode ? 'ENABLED (noindex)' : 'DISABLED (production)'}`);
  console.log(`========================================================`);
});
