const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const dbLayer = require('../db');
const { requireAuth } = require('../middleware/auth');

const configPath = path.join(__dirname, '../../config/firm.json');
const uploadsDir = path.join(__dirname, '../../public/uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-z0-9]/gi, '-').toLowerCase();
    cb(null, `${cleanName}-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

// Protect all routes in this router with server-side authentication!
router.use(requireAuth);

// 1. Dashboard Stats & Recent Activity
router.get('/dashboard', (req, res) => {
  try {
    const counts = dbLayer.getEnquiriesCount();
    const recentEnquiries = dbLayer.getAllEnquiries('All', '').slice(0, 5);
    const articles = dbLayer.getAllArticlesAdmin();
    const dueDates = dbLayer.getAllDueDatesAdmin();

    res.json({
      success: true,
      stats: {
        totalEnquiries: counts.total,
        newEnquiries: counts.newCount,
        totalArticles: articles.length,
        totalDueDates: dueDates.length
      },
      recentEnquiries
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Enquiries List with Filter & Search
router.get('/enquiries', (req, res) => {
  try {
    const { status, search } = req.query;
    const enquiries = dbLayer.getAllEnquiries(status, search);
    res.json({ success: true, enquiries });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Update Enquiry Status
router.post('/enquiries/status', (req, res) => {
  try {
    const { id, status } = req.body;
    if (!id || !['New', 'Contacted', 'Closed'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid parameters' });
    }
    dbLayer.updateEnquiryStatus(id, status);
    res.json({ success: true, message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Delete Enquiry
router.delete('/enquiries/:id', (req, res) => {
  try {
    dbLayer.deleteEnquiry(req.params.id);
    res.json({ success: true, message: 'Enquiry deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Export Enquiries CSV
router.get('/enquiries/export', (req, res) => {
  try {
    const enquiries = dbLayer.getAllEnquiries('All', '');
    let csv = 'ID,Name,Phone,Email,Subject,Message,Status,Date\n';
    enquiries.forEach(e => {
      const cleanMsg = (e.message || '').replace(/"/g, '""').replace(/\n/g, ' ');
      const cleanSubj = (e.subject || '').replace(/"/g, '""');
      csv += `"${e.id}","${e.name}","${e.phone}","${e.email}","${cleanSubj}","${cleanMsg}","${e.status}","${e.created_at}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=enquiries-export.csv');
    res.status(200).send(csv);
  } catch (err) {
    res.status(500).send('Failed to generate CSV export');
  }
});

// 6. Articles CRUD
router.get('/articles', (req, res) => {
  try {
    const articles = dbLayer.getAllArticlesAdmin();
    res.json({ success: true, articles });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/articles', (req, res) => {
  try {
    const art = req.body;
    if (!art.title || !art.excerpt || !art.body) {
      return res.status(400).json({ success: false, error: 'Title, excerpt, and body are required' });
    }

    // Auto slug if empty
    if (!art.slug) {
      art.slug = art.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }

    dbLayer.saveArticle(art);
    res.json({ success: true, message: 'Article saved successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/articles/:id', (req, res) => {
  try {
    dbLayer.deleteArticle(req.params.id);
    res.json({ success: true, message: 'Article deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Due Dates CRUD
router.get('/due-dates', (req, res) => {
  try {
    const dueDates = dbLayer.getAllDueDatesAdmin();
    res.json({ success: true, dueDates });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/due-dates', (req, res) => {
  try {
    const dd = req.body;
    if (!dd.title || !dd.due_date || !dd.category) {
      return res.status(400).json({ success: false, error: 'Title, due date, and category are required' });
    }
    dbLayer.saveDueDate(dd);
    res.json({ success: true, message: 'Due date saved successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/due-dates/:id', (req, res) => {
  try {
    dbLayer.deleteDueDate(req.params.id);
    res.json({ success: true, message: 'Due date deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Services CRUD
router.get('/services', (req, res) => {
  try {
    const services = dbLayer.getAllServicesAdmin().map(s => ({
      ...s,
      documents_required: JSON.parse(s.documents_required || '[]'),
      process_steps: JSON.parse(s.process_steps || '[]')
    }));
    res.json({ success: true, services });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/services', (req, res) => {
  try {
    const srv = req.body;
    if (!srv.title || !srv.short_desc || !srv.full_desc) {
      return res.status(400).json({ success: false, error: 'Title, short description, and full description are required' });
    }
    if (!srv.slug) {
      srv.slug = srv.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
    dbLayer.saveService(srv);
    res.json({ success: true, message: 'Service saved successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/services/:id', (req, res) => {
  try {
    dbLayer.deleteService(req.params.id);
    res.json({ success: true, message: 'Service deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Config Management (Read / Save firm.json)
router.get('/config', (req, res) => {
  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    res.json({ success: true, config: JSON.parse(raw) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/config', (req, res) => {
  try {
    const newConfig = req.body;
    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2), 'utf8');
    res.json({ success: true, message: 'Firm configuration updated successfully. Public site updated.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Upload Photo Management
router.post('/upload', upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No valid image file uploaded' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ success: true, url: fileUrl, filename: req.file.filename });
});

router.get('/uploads', (req, res) => {
  try {
    const files = fs.readdirSync(uploadsDir);
    const photos = files.map(f => ({
      name: f,
      url: `/uploads/${f}`
    }));
    res.json({ success: true, photos });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 11. Change Admin Password
router.post('/account/password', (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters long' });
    }

    const admin = dbLayer.getAdminByUsername(req.session.adminUser.username);
    if (!admin || !bcrypt.compareSync(currentPassword, admin.password_hash)) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(newPassword, salt);
    dbLayer.updateAdminPassword(admin.id, hash);

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
