const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const dbLayer = require('../db');
const nodemailer = require('nodemailer');

const configPath = path.join(__dirname, '../../config/firm.json');

// Helper to read config
function getFirmConfig() {
  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading firm.json config:', err);
    return {};
  }
}

// 1. Get Firm Configuration
router.get('/config', (req, res) => {
  const config = getFirmConfig();
  res.json({ success: true, config });
});

// 2. Get Published Articles
router.get('/articles', (req, res) => {
  try {
    const limit = req.query.limit;
    const articles = dbLayer.getPublishedArticles(limit);
    res.json({ success: true, articles });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch articles' });
  }
});

// 3. Get Article by Slug
router.get('/articles/:slug', (req, res) => {
  try {
    const article = dbLayer.getArticleBySlug(req.params.slug);
    if (!article || article.status !== 'published') {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }
    res.json({ success: true, article });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch article' });
  }
});

// 4. Get Due Dates
router.get('/due-dates', (req, res) => {
  try {
    const limit = req.query.limit;
    const dueDates = dbLayer.getUpcomingDueDates(limit);
    res.json({ success: true, dueDates });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch due dates' });
  }
});

// 5. Get Active Services
router.get('/services', (req, res) => {
  try {
    const services = dbLayer.getActiveServices();
    res.json({ success: true, services });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch services' });
  }
});

// 6. Get Service by Slug
router.get('/services/:slug', (req, res) => {
  try {
    const service = dbLayer.getServiceBySlug(req.params.slug);
    if (!service || !service.is_active) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }
    // parse json arrays
    service.documents_required = JSON.parse(service.documents_required || '[]');
    service.process_steps = JSON.parse(service.process_steps || '[]');
    res.json({ success: true, service });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch service' });
  }
});

// 7. Contact Form Submission
router.post('/contact', async (req, res) => {
  try {
    const { name, phone, email, subject, message, website_hp } = req.body;

    // Honeypot check (if bot filled website_hp field, fail silently)
    if (website_hp && website_hp.trim().length > 0) {
      console.warn('[SPAM PREVENTED] Honeypot field was filled.');
      return res.json({ success: true, message: 'Thank you for your enquiry. We will get in touch shortly.' });
    }

    // Server-side validation
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Please enter a valid full name.' });
    }

    // Validate 10-digit Indian phone number
    const phoneClean = (phone || '').replace(/[\s\-\+\(\)]/g, '');
    const phoneRegex = /^(?:91)?[6789]\d{9}$/;
    if (!phoneRegex.test(phoneClean)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid 10-digit Indian mobile number.' });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    }

    if (!subject || subject.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Please select a service subject.' });
    }

    if (!message || message.trim().length < 5 || message.length > 500) {
      return res.status(400).json({ success: false, error: 'Please enter a message between 5 and 500 characters.' });
    }

    // Save to Database
    dbLayer.addEnquiry({
      name: name.trim(),
      phone: phoneClean,
      email: (email || '').trim(),
      subject: subject.trim(),
      message: message.trim()
    });

    // =========================================================================
    // OPTIONAL EMAIL NOTIFICATION HOOK (SMTP)
    // =========================================================================
    // If SMTP environment variables are defined in .env, send email notification
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587', 10),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });

        const firmConfig = getFirmConfig();
        const recipientEmail = process.env.NOTIFICATION_EMAIL || firmConfig.email || process.env.SMTP_USER;

        await transporter.sendMail({
          from: `"${firmConfig.firmName} Site" <${process.env.SMTP_USER}>`,
          to: recipientEmail,
          subject: `[New Website Enquiry] ${subject} - ${name}`,
          html: `
            <h3>New Enquiry Received on ${firmConfig.firmName} Website</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Phone:</strong> ${phoneClean}</p>
            <p><strong>Email:</strong> ${email || 'N/A'}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong></p>
            <blockquote style="background:#f4f4f4; padding:10px;">${message}</blockquote>
            <hr />
            <p><small>Logged in Website Database. Login to Admin Panel to view and update status.</small></p>
          `
        });
        console.log(`[SMTP Notification] Sent email notification for enquiry from ${name}`);
      } catch (smtpErr) {
        console.error('[SMTP Notification Error]', smtpErr.message);
        // Do not block client response if email notification fails
      }
    }

    return res.json({
      success: true,
      message: 'Thank you for contacting Koshti & Company. Your enquiry has been received and will be processed in accordance with professional practice standards.'
    });
  } catch (err) {
    console.error('Contact Form Error:', err);
    return res.status(500).json({ success: false, error: 'An unexpected error occurred while saving your message. Please try again or call us directly.' });
  }
});

// 8. Admin Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Username and password are required.' });
  }

  const admin = dbLayer.getAdminByUsername(username.trim());
  if (!admin) {
    return res.status(401).json({ success: false, error: 'Invalid username or password.' });
  }

  const isMatch = bcrypt.compareSync(password, admin.password_hash);
  if (!isMatch) {
    return res.status(401).json({ success: false, error: 'Invalid username or password.' });
  }

  // Set session
  req.session.adminUser = {
    id: admin.id,
    username: admin.username
  };

  res.json({ success: true, message: 'Authenticated successfully', username: admin.username });
});

// 9. Admin Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    res.clearCookie('connect.sid');
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// 10. Check Auth Status
router.get('/auth-status', (req, res) => {
  if (req.session && req.session.adminUser) {
    return res.json({ authenticated: true, user: req.session.adminUser });
  }
  return res.json({ authenticated: false });
});

module.exports = router;
