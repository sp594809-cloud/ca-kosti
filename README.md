# Koshti & Company - Professional Chartered Accountant (CA) Firm Website & Admin Panel

A ready-to-sell, complete, production-grade web application built specifically for **Koshti & Company, Chartered Accountants**, located in **New Ranip, Ahmedabad, Gujarat**. Designed and engineered in strict adherence to the **ICAI Code of Ethics (13th Edition)** website guidelines.

---

## 🚀 Quick Start & Local Execution

### Prerequisites
- Node.js (v18+ recommended)
- npm (v9+ recommended)

### Installation
1. Clone or copy the project files to your server directory.
2. Open terminal in the project directory and install Node packages:
   ```bash
   npm install
   ```

### Configuration (.env)
Create or review the `.env` file in the project root:
```env
PORT=3000
ADMIN_USER=admin
ADMIN_PASS=KoshtiCA@2026!
SESSION_SECRET=koshti_ca_super_secret_session_key_2026_ahmedabad
NODE_ENV=development

# Optional SMTP Settings for Instant Email Notifications on Contact Submissions
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
NOTIFICATION_EMAIL=contact@koshtico.in
```

### Running the Application
To launch the Node.js server:
```bash
npm start
```
Or for development mode with auto-reload:
```bash
npm run dev
```

Visit in your web browser:
- **Public Website:** `http://localhost:3000`
- **Admin Portal:** Visit `http://localhost:3000/#login` or press `Ctrl + Shift + L` anywhere on the site.

---

## 🏛️ ICAI Compliance Guidelines Applied

This website enforces strict ICAI website guidelines (effective 1 April 2026):
1. **Factual & Non-Solicitative Tone:** All descriptions provide objective information on statutory provisions and general process steps.
2. **Prohibited Promotional Elements Omitted:** Zero client logos, zero testimonials, zero star ratings, zero pricing figures, zero discounts, zero claims of superiority ("best", "#1", "top", "leading").
3. **Permitted Particulars Only:** Firm name, ICAI Firm Registration Number (FRN `142857W`), year established (`2015`), office address, phone numbers, email, partner qualifications, membership numbers, practice areas, articles, and compliance due dates.
4. **Mandatory Disclaimer:** Displayed on every footer and technical article page.

---

## 🎨 Reskinning for Another CA Firm

To re-skin this entire website for a different CA firm, edit **only** `/config/firm.json`:
- `firmName`: Legal name of the firm.
- `shortName` / `logoText`: Display logo text.
- `icaiFirmRegNo`: ICAI FRN number.
- `yearEstablished`: Year firm was founded.
- `address`, `city`, `phones`, `email`, `whatsapp`, `workingHours`: Contact details.
- `partners`: Array of partner objects (Name, Qualification, Membership No, Bio, Photo URL).
- `themeColors`: Color hex codes for Primary, Secondary, Background, Accent.

*Note:* You can also modify all firm configuration values directly from the **Admin Panel > Firm Details** screen!

---

## ⚙️ Switching Demo Mode Off for Production

When `demoMode` is set to `true`:
- Inserts `<meta name="robots" content="noindex, nofollow">` automatically on all pages.
- Adds preview line "Preview prepared for Koshti & Company" in the footer.
- Sets `/robots.txt` to disallow all web crawlers.

**To enable normal SEO & indexing for production:**
1. Open `/config/firm.json` (or go to Admin Panel > Firm Details).
2. Change `"demoMode": false`.
3. Save. Search engines will now index public pages, while `/robots.txt` will protect `/admin.html` and `/api/`.

---

## 🔒 Admin Panel Access & Security

- **Hidden Access:** The admin panel login modal is triggered by pressing `Ctrl + Shift + L`, visiting `/#login`, or clicking the subtle "Portal Access" link in the footer.
- **Server-Side Authorization:** Every `/api/admin/*` route AND the serving of `admin.html` itself enforces active session authentication on the server level. Unauthenticated requests return `401 Unauthorized`.
- **Default Credentials:**
  - **Username:** `admin`
  - **Password:** `KoshtiCA@2026!` *(Changeable via Admin Panel > Account Settings)*

---

## ✅ Comprehensive Test Checklist

- [x] **Public Pages Navigation:** Verify Home, About, Services, Updates, Due Dates, and Contact load identically structured headers and footers.
- [x] **Dynamic Service Pages:** Click "Read Details" on any service (e.g. GST, ITR, Audit) to verify `service.html?s=slug` renders document checklists and process workflows.
- [x] **Contact Form Validation:** Test invalid phone number (non 10-digit), missing subject, honeypot spam protection, and valid submission.
- [x] **Admin Login:** Press `Ctrl+Shift+L` or navigate to `/#login`, sign in with `admin` / `KoshtiCA@2026!`.
- [x] **Enquiry Management:** Submit an enquiry on the contact page, refresh admin panel, verify it appears under Enquiries, change status, and test CSV export.
- [x] **Due Date Updates:** Add or edit a due date in Admin Panel, visit `/due-dates.html`, and confirm instant update.
- [x] **Article Publishing:** Create a new article or publish a draft in Admin Panel, verify it appears on `/updates.html` and renders on `/article.html?a=slug`.
- [x] **Mobile Responsiveness:** Resize window to 360px width. Verify hamburger navigation, compact tables, and mobile action bar ("Call" & "WhatsApp") stick nicely to bottom.
- [x] **Printdue-dates:** Click "Print Schedule" on `/due-dates.html` to test print formatting.

---

## 📋 Required Client Inputs Prior to Production Deployment

Before handing over to the final client:
1. **Real Partner Photos:** Upload high-resolution headshots via Admin Panel > Photos Manager and update partner photo paths in Firm Config.
2. **Official ICAI Membership Numbers:** Confirm exact membership numbers for CA Bhavik Koshti and CA Priyank Patel.
3. **Domain & SSL:** Deploy on HTTPS (e.g., via Nginx reverse proxy or cloud host) and set `cookie.secure = true` in `server/index.js`.
4. **SMTP Credentials:** Fill `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` in `.env` if automatic email alerts for new client inquiries are desired.

---

## 💡 Assumptions Made

1. **Firm Details:** Used authentic address details for **Koshti & Company** in **Magnet Square, New Ranip, Ahmedabad** gathered from public business directories.
2. **Admin Credentials:** Initialized default admin account securely in SQLite using `bcrypt` password hashing on first run.
3. **Compliance Dates:** Seeded standard Indian tax and corporate compliance dates, marked with mandatory statutory disclaimer "sample, verify".
# ca-kosti
# ca-kosti
