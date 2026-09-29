const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'firm.sqlite');
const db = new Database(dbPath);

// Enable Foreign Keys and WAL Mode for performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDb() {
  // 1. Admin Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default admin if none exists
  const adminCount = db.prepare('SELECT COUNT(*) as count FROM admins').get().count;
  if (adminCount === 0) {
    const adminUser = process.env.ADMIN_USER || 'admin';
    const adminPass = process.env.ADMIN_PASS || 'KoshtiCA@2026!';
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(adminPass, salt);
    db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run(adminUser, hash);
    console.log(`[DB Seed] Created initial admin user: ${adminUser}`);
  }

  // 2. Enquiries Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS enquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'New',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed 6 sample enquiries if empty
  const enquiryCount = db.prepare('SELECT COUNT(*) as count FROM enquiries').get().count;
  if (enquiryCount === 0) {
    const sampleEnquiries = [
      ['Rajesh Shah', '9825012345', 'rajesh.shah@example.com', 'ITR Filing (individuals & businesses)', 'Seeking assistance for filing Annual Income Tax Return for FY 2025-26 for a private firm.', 'New', '2026-09-28 10:30:00'],
      ['Anita Mehta', '9979854321', 'anita.mehta@techin.com', 'GST Registration & Returns', 'Inquiry regarding GST registration process for a newly established IT consultancy firm in New Ranip.', 'New', '2026-09-27 14:15:00'],
      ['Suresh Patel', '9426098765', 'suresh@pateltraders.in', 'Statutory Audit', 'Need statutory audit services for partnership firm operating in Ahmedabad.', 'Contacted', '2026-09-25 11:00:00'],
      ['Vikram Desai', '9898011223', 'vikram.desai@gmail.com', 'Income Tax Notice Replies', 'Received an inquiry notice under section 143(1) regarding tax deduction discrepancies.', 'Contacted', '2026-09-22 16:45:00'],
      ['Megha Sharma', '9727044332', 'megha@solarsystems.co.in', 'Company & LLP Registration', 'Requirements and documentation checklist for converting an existing proprietorship into a Private Limited Company.', 'Closed', '2026-09-20 09:20:00'],
      ['Hardik Soni', '9824055667', 'hardik.soni@gmail.com', 'Net Worth & Other Certifications', 'Requirement for CA certified Net Worth Certificate for visa and financial documentation purposes.', 'Closed', '2026-09-18 15:10:00']
    ];
    const stmt = db.prepare('INSERT INTO enquiries (name, phone, email, subject, message, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
    for (const enq of sampleEnquiries) {
      stmt.run(...enq);
    }
    console.log('[DB Seed] Seeded 6 sample enquiries');
  }

  // 3. Articles Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      excerpt TEXT NOT NULL,
      body TEXT NOT NULL,
      seo_title TEXT,
      seo_description TEXT,
      status TEXT DEFAULT 'published',
      published_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed 5 original factual articles if empty
  const articleCount = db.prepare('SELECT COUNT(*) as count FROM articles').get().count;
  if (articleCount === 0) {
    const sampleArticles = [
      {
        title: 'Essential Documents Required for GST Registration in India',
        slug: 'documents-required-for-gst-registration',
        category: 'GST & Indirect Tax',
        excerpt: 'A comprehensive checklist of legal and identity documents mandatory for registering a business under Goods and Services Tax (GST).',
        body: `### Overview of GST Registration Requirements

Obtaining a Goods and Services Tax Identification Number (GSTIN) is mandatory for entities exceeding prescribed turnover thresholds or engaging in inter-state supply of goods and services. Proper documentation ensures efficient verification by tax authorities.

#### Primary Documents for Business Entities

1. **PAN Card**: Permanent Account Number of the business or the proprietor/partners/directors.
2. **Identity & Address Proofs**: Aadhaar Card, Passport, or Voter ID of authorized signatories and partners/directors.
3. **Proof of Business Registration**:
   - For Partnership Firms: Partnership Deed.
   - For Companies / LLPs: Certificate of Incorporation, MOA & AOA, LLP Agreement.
4. **Proof of Place of Business**:
   - Owned property: Electricity bill, Municipal property tax receipt, or registry document.
   - Rented property: Valid Rent Agreement alongside the landlord's electricity bill and No Objection Certificate (NOC).
5. **Bank Account Details**: Cancelled cheque or passbook statement reflecting business account title, branch address, and IFSC code.
6. **Authorization Documents**: Board resolution or Letter of Authorization nominating the designated authorized signatory.

#### Key Compliance Considerations

Submitting legibly scanned, authentic copies minimizes administrative queries. All applicants must complete Aadhaar authentication or physical site verification where mandatory under statutory provisions.

*Note: The information provided above is for general informative purposes and does not constitute formal tax advice.*`,
        seo_title: 'Documents Required for GST Registration Checklist | Koshti & Company',
        seo_description: 'Complete factual checklist of mandatory documents required for GST registration in India for proprietors, partnerships, and companies.'
      },
      {
        title: 'Comparative Analysis: Private Limited Company vs. Limited Liability Partnership (LLP)',
        slug: 'private-limited-vs-llp-structure-comparison',
        category: 'Corporate Compliance',
        excerpt: 'An objective structural overview of governance, compliance standards, and liability parameters distinguishing Private Limited Companies from LLPs.',
        body: `### Understanding Organizational Frameworks

Selecting an appropriate legal structure is a crucial decision for commercial enterprises. Both Private Limited Companies and LLPs offer limited liability protection, yet differ in governance regulations and compliance requirements under Indian law.

#### Key Structural Differences

| Parameter | Private Limited Company | Limited Liability Partnership (LLP) |
| :--- | :--- | :--- |
| **Governing Statute** | Companies Act, 2013 | Limited Liability Partnership Act, 2008 |
| **Minimum Members** | 2 Directors, 2 Shareholders | 2 Designated Partners |
| **Compliance Overhead** | High (Mandatory Statutory Audits, Board Meetings, ROC Forms) | Moderate (Audit mandatory only if turnover/capital exceeds threshold) |
| **Ownership Transfer** | Transferable via share transfer deed | Requires agreement modification among partners |
| **Profit Distribution** | Subject to dividend distribution norms & tax structures | Distributed to partners per LLP Agreement without Dividend Tax |

#### Governance and Statutory Audit Provisions

Private Limited Companies are subject to mandatory annual audit by a qualified Chartered Accountant regardless of turnover. Conversely, an LLP requires audit only if its annual turnover exceeds ₹40 Lakhs or its contribution exceeds ₹25 Lakhs.

Both structures demand timely compliance filings with the Registrar of Companies (ROC) to avoid statutory penalties.

*Note: General informational overview only; consult statutory manuals or professional advisors for specific structure evaluations.*`,
        seo_title: 'Pvt Ltd vs LLP Comparison Guide | Koshti & Company',
        seo_description: 'Factual breakdown comparing Private Limited Company and LLP legal structures, compliance frameworks, and audit requirements.'
      },
      {
        title: 'Statutory Procedure for Responding to Income Tax Notices',
        slug: 'statutory-procedure-responding-income-tax-notices',
        category: 'Direct Taxation',
        excerpt: 'Step-by-step guidance on understanding, verifying, and responding to statutory communications issued by the Income Tax Department.',
        body: `### Understanding Income Tax Communications

Taxpayers periodically receive notices or communications from the Income Tax Department via the e-Filing portal. Communications may range from routine processing intimations to statutory inquiries under specific sections of the Income Tax Act, 1961.

#### Common Notice Provisions

- **Section 143(1) Intimation**: Summary assessment reflecting computational adjustments, TDS mismatch, or arithmetic corrections between filed returns and central records.
- **Section 139(9) Defective Return**: Issued when a return lacks mandatory schedules, statements, or tax proof attachments.
- **Section 142(1) Inquiry Notice**: Request for additional details, accounts, or clarification regarding specific line items in the return.
- **Section 148 Re-assessment Notice**: Issued when the assessing officer has reason to believe income chargeable to tax has escaped assessment.

#### Recommended Action Steps

1. **Verify Document Identification Number (DIN)**: Confirm authenticity on the official e-filing portal (incometax.gov.in) before acting.
2. **Review Response Deadlines**: Statutory notices stipulate strict submission timelines (typically 15 to 30 days).
3. **Compile Supporting Evidence**: Gather relevant bank statements, Form 26AS/AIS/TIS statements, invoices, and deduction receipts.
4. **Submit Digital Response**: Log into the e-Filing account under 'Pending Actions > e-Proceedings' to submit formal replies along with documentary attachments.

*Note: Official statutory notifications should be reviewed thoroughly. This summary serves informational purposes only.*`,
        seo_title: 'Income Tax Notice Response Procedure | Koshti & Company',
        seo_description: 'Guide to understanding and responding to Income Tax notices under Sections 143(1), 139(9), and 142(1) via the e-Filing portal.'
      },
      {
        title: 'Advance Tax Framework: Provisions, Computation & Installments',
        slug: 'advance-tax-provisions-computation-installments',
        category: 'Direct Taxation',
        excerpt: 'An overview of statutory advance tax applicability, installment due dates, and interest implications under Sections 234B and 234C.',
        body: `### Statutory Advance Tax Overview

Advance tax refers to the pay-as-you-earn mechanism where taxpayers estimate and pay their income tax liability in installment tranches during the financial year, rather than as a single lump sum at year-end.

#### Applicability Criteria

Under Section 208 of the Income Tax Act, 1961, every taxpayer whose estimated net tax liability for the financial year (after reducing tax deducted at source / tax collected at source) is ₹10,000 or more is obligated to pay advance tax.

Senior citizens (aged 60 years or above) residing in India who do not derive income from business or profession are exempt from advance tax payment obligations.

#### Advance Tax Due Date Schedule (Non-Corporate & Corporate Taxpayers)

- **15th June**: Minimum 15% of net estimated tax liability.
- **15th September**: Minimum 45% of net estimated tax liability.
- **15th December**: Minimum 75% of net estimated tax liability.
- **15th March**: 100% of net estimated tax liability.

#### Consequences of Non-Payment or Short Payment

Decline or delay in meeting prescribed installment percentages attracts statutory interest under Section 234C (1% per month for delay in installment) and Section 234B (1% per month for shortfall in overall 90% payment threshold).

*Note: Educational guide only. Always verify computation parameters against official income tax rules.*`,
        seo_title: 'Advance Tax Due Dates & Calculation Rules | Koshti & Company',
        seo_description: 'Factual guide detailing Advance Tax installment due dates, liability threshold rules, and statutory interest applicability under Indian Income Tax law.'
      },
      {
        title: 'Annual Income Tax Return (ITR) Filing Preparation Checklist',
        slug: 'annual-itr-filing-preparation-checklist',
        category: 'Direct Taxation',
        excerpt: 'A structured list of statements, certificates, and records required for accurate annual return preparation.',
        body: `### Preparing for Annual Income Tax Return Filing

Accurate return filing requires systematic aggregation of income records, tax deduction certificates, and investment disclosures. Maintaining proper documentation facilitates smooth verification during central processing.

#### Key Statements and Reconciliation Sources

1. **Form 26AS & Annual Information Statement (AIS / TIS)**: Download from the official Income Tax portal to verify reported income, TDS credits, TCS credits, and high-value financial transactions.
2. **Form 16 / Form 16A**: Salary certificate from employers and TDS certificates issued by deductors (banks, clients, tenants).
3. **Bank Account Statements**: Comprehensive statements for all active savings, current, and deposit accounts held during the financial year.
4. **Capital Gains Statements**: Detailed trade summaries from stockbrokers, mutual fund capital gain statements, and property sale/purchase deeds.

#### Deduction and Exemption Documentation

- **Section 80C**: Receipts for Life Insurance Premium, PPF, ELSS, School Tuition Fees, Principal Home Loan repayment.
- **Section 80D**: Medical Insurance premium payment receipts and preventive health check-up records.
- **Section 80G**: Donation receipts with 10BE certificates containing the donee's PAN.
- **Home Loan Interest**: Annual interest certificate issued by the lending institution under Section 24(b).

#### Disclosure Responsibilities

Taxpayers must report all foreign assets, directorships in unlisted companies, and unlisted equity shareholding where applicable.

*Note: For official information only. Consult statutory return guidelines or a qualified professional for individual filing.*`,
        seo_title: 'Annual ITR Preparation Checklist | Koshti & Company',
        seo_description: 'Essential checklist of documents, AIS statements, Form 26AS, and interest certificates needed for filing Income Tax Returns in India.'
      }
    ];

    const stmt = db.prepare('INSERT INTO articles (title, slug, category, excerpt, body, seo_title, seo_description) VALUES (?, ?, ?, ?, ?, ?, ?)');
    for (const art of sampleArticles) {
      stmt.run(art.title, art.slug, art.category, art.excerpt, art.body, art.seo_title, art.seo_description);
    }
    console.log('[DB Seed] Seeded 5 factual articles');
  }

  // 4. Due Dates Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS due_dates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      due_date DATE NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      authority TEXT NOT NULL,
      verification_status TEXT DEFAULT 'sample, verify',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed due dates if empty
  const dueCount = db.prepare('SELECT COUNT(*) as count FROM due_dates').get().count;
  if (dueCount === 0) {
    const sampleDueDates = [
      ['GSTR-1 Monthly Return', '2026-10-11', 'GST Compliance', 'Filing of details of outward supplies for tax period September 2026 for monthly filers.', 'GSTN (gst.gov.in)', 'sample, verify'],
      ['GSTR-3B Monthly Return', '2026-10-20', 'GST Compliance', 'Summary return & tax payment for outward supplies and Input Tax Credit (ITC) for September 2026.', 'GSTN (gst.gov.in)', 'sample, verify'],
      ['TDS Payment for September', '2026-10-07', 'Direct Tax', 'Deposit of Tax Deducted at Source (TDS) & TCS deducted during the month of September 2026.', 'Income Tax Department (incometax.gov.in)', 'sample, verify'],
      ['TDS Quarterly Return (Q2)', '2026-10-31', 'Direct Tax', 'Quarterly statement of TDS deposited for the quarter ending 30th September 2026 (Forms 24Q, 26Q, 27Q).', 'Income Tax Department (incometax.gov.in)', 'sample, verify'],
      ['ROC Form AOC-4 (Annual Financials)', '2026-10-30', 'ROC Compliance', 'Filing of Annual Financial Statements with ROC within 30 days of AGM for eligible Private Limited Companies.', 'Ministry of Corporate Affairs (mca.gov.in)', 'sample, verify'],
      ['Income Tax Return (Audit Cases)', '2026-10-31', 'Direct Tax', 'Filing of Income Tax Return for corporate entities and assessee entities subject to statutory audit for AY 2026-27.', 'Income Tax Department (incometax.gov.in)', 'sample, verify'],
      ['GSTR-1 Quarterly (QRMP Scheme)', '2026-10-13', 'GST Compliance', 'Quarterly details of outward supplies for taxpayers enrolled under QRMP scheme for Q2 (July-Sept).', 'GSTN (gst.gov.in)', 'sample, verify'],
      ['Advance Tax 3rd Installment', '2026-12-15', 'Direct Tax', 'Payment of 75% cumulative advance tax liability for FY 2026-27.', 'Income Tax Department (incometax.gov.in)', 'sample, verify']
    ];

    const stmt = db.prepare('INSERT INTO due_dates (title, due_date, category, description, authority, verification_status) VALUES (?, ?, ?, ?, ?, ?)');
    for (const dd of sampleDueDates) {
      stmt.run(...dd);
    }
    console.log('[DB Seed] Seeded sample due dates');
  }

  // 5. Services Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      short_desc TEXT NOT NULL,
      full_desc TEXT NOT NULL,
      who_needs_it TEXT NOT NULL,
      documents_required TEXT NOT NULL,
      process_steps TEXT NOT NULL,
      icon TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0
    );
  `);

  // Seed 12 services if empty
  const serviceCount = db.prepare('SELECT COUNT(*) as count FROM services').get().count;
  if (serviceCount === 0) {
    const sampleServices = [
      {
        title: 'Income Tax Return (ITR) Filing',
        slug: 'income-tax-return-itr-filing',
        category: 'Direct Tax',
        short_desc: 'Comprehensive annual income tax return filing for salaried individuals, professionals, HUFs, partnerships, and business entities.',
        full_desc: 'Filing Income Tax Returns accurately is a statutory annual obligation for taxable entities in India. Our firm provides structured return preparation services ensuring proper computation of total income, eligible deductions under Chapter VI-A, and reconciliation with Form 26AS and AIS/TIS tax registers.',
        who_needs_it: 'Individuals with income exceeding basic exemption limits, business owners, professionals, partners, NRIs with Indian income, and entities seeking tax refunds or loan documentation.',
        documents_required: JSON.stringify(['PAN Card & Aadhaar Card', 'Form 16 / Form 16A / Form 26AS', 'Annual Information Statement (AIS) & TIS', 'Bank Account Statements (All accounts)', 'Investment proofs (80C, 80D, 80G)', 'Capital gains broker statements (if applicable)']),
        process_steps: JSON.stringify(['Data Collection & Statement Verification', 'Form 26AS / AIS / TIS Reconciliation', 'Tax Computation & Chapter VI-A Deduction Verification', 'Draft Review with Client', 'E-Filing on Income Tax Portal & Verification']),
        icon: 'file-text',
        sort_order: 1
      },
      {
        title: 'GST Registration & Return Compliance',
        slug: 'gst-registration-returns',
        category: 'Indirect Tax',
        short_desc: 'End-to-end Goods & Services Tax compliance including new registration, monthly GSTR-1 & GSTR-3B filings, and Annual Returns.',
        full_desc: 'The Goods and Services Tax (GST) framework requires regular monthly and quarterly statutory filings. We assist businesses with initial registration, regular outward supply reporting, Input Tax Credit (ITC) reconciliation with GSTR-2B, and annual return filings (GSTR-9/9C).',
        who_needs_it: 'Traders, manufacturers, service providers exceeding statutory turnover limits (₹20/40 Lakhs), e-commerce sellers, and entities engaging in inter-state business.',
        documents_required: JSON.stringify(['PAN & Aadhaar of Proprietor/Partners/Directors', 'Business Registration Certificate / Partnership Deed', 'Electricity Bill / Municipal Receipt of Business Place', 'Rent Agreement & Landlord NOC (if rented)', 'Cancelled Cheque of Business Bank Account']),
        process_steps: JSON.stringify(['Eligibility Evaluation & Application Preparation', 'Portal Submission & ARN Tracking', 'Monthly Outward Sales Invoicing Data Processing', 'GSTR-2B Input Tax Credit Reconciliation', 'Return Submission & Tax Payment Challan Generation']),
        icon: 'percent',
        sort_order: 2
      },
      {
        title: 'Income Tax Notice Replies & Proceedings',
        slug: 'income-tax-notice-replies',
        category: 'Direct Tax',
        short_desc: 'Professional drafting of technical responses and online submissions for Income Tax notices and e-proceedings.',
        full_desc: 'Taxpayers receiving statutory notices under Sections 143(1), 139(9), 142(1), or 148 require objective documentation and timely submission. We examine notice grounds, reconcile discrepancies with department records, and assist in preparing digital e-proceeding responses.',
        who_needs_it: 'Taxpayers who have received intimations, inquiry letters, assessment notices, or defect notices from the Income Tax Department.',
        documents_required: JSON.stringify(['Copy of Notice / Intimation received from IT Department', 'Filed ITR Ack & Computation of relevant Assessment Year', 'Form 26AS and Bank Statements of relevant FY', 'Supporting invoices, deduction receipts, or explanation documents']),
        process_steps: JSON.stringify(['Notice Examination & DIN Verification', 'Fact-Finding & Financial Data Reconciliation', 'Technical Reply Drafting per Statutory Provisions', 'Client Review & Approval', 'Digital Submission on Portal under e-Proceedings']),
        icon: 'alert-circle',
        sort_order: 3
      },
      {
        title: 'Company & LLP Registration Services',
        slug: 'company-llp-registration',
        category: 'Corporate Compliance',
        short_desc: 'Incorporation services for Private Limited Companies, Public Companies, Limited Liability Partnerships (LLP), and Section 8 entities.',
        full_desc: 'Setting up a formal legal entity provides limited liability, structured governance, and brand credibility. We assist promoters with name availability reservation, Digital Signature Certificates (DSC), Director Identification Numbers (DIN), and SPICe+ filing with the Ministry of Corporate Affairs.',
        who_needs_it: 'Entrepreneurs, startups, expanding businesses, and joint ventures seeking formal corporate registration in India.',
        documents_required: JSON.stringify(['PAN & Aadhaar / Passport of Directors / Partners', 'Bank Statement / Utility Bill (Address proof of individuals)', 'Registered Office Electricity Bill & NOC from Owner', 'Passport-size Photographs of Directors']),
        process_steps: JSON.stringify(['Name Reservation via RUN / SPICe+ Part A', 'Obtaining Digital Signature Certificates (DSC)', 'Drafting MOA, AOA & LLP Agreement', 'Filing SPICe+ Part B Incorporation Forms with MCA', 'Obtaining Certificate of Incorporation, PAN & TAN']),
        icon: 'briefcase',
        sort_order: 4
      },
      {
        title: 'ROC Compliance & Annual Filings',
        slug: 'roc-compliance-annual-filings',
        category: 'Corporate Compliance',
        short_desc: 'Mandatory annual secretarial returns, Form AOC-4, MGT-7, DIR-12, and statutory register maintenance under Companies Act, 2013.',
        full_desc: 'Registered Companies and LLPs are statutorily required to file annual financial statements and annual returns with the Registrar of Companies (ROC). We manage statutory form filings, Director KYC (DIR-3 KYC), board meeting documentation support, and statutory compliance updates.',
        who_needs_it: 'All active Private Limited Companies, Public Limited Companies, and LLPs registered with the Ministry of Corporate Affairs.',
        documents_required: JSON.stringify(['Audited Balance Sheet & Profit & Loss Statement', 'Auditor Report & Board of Directors Report', 'List of Shareholders & Share Transfer Register', 'DIR-3 KYC Details of Active Directors']),
        process_steps: JSON.stringify(['Compilation of Financial Accounts & Audit Reports', 'Drafting Notice & Minutes of Annual General Meeting', 'E-Form AOC-4 (Financials) Filing within 30 Days of AGM', 'E-Form MGT-7 (Annual Return) Filing within 60 Days', 'Director KYC Verification on MCA Portal']),
        icon: 'layers',
        sort_order: 5
      },
      {
        title: 'Statutory Audit & Assurance',
        slug: 'statutory-audit-assurance',
        category: 'Audit & Assurance',
        short_desc: 'Independent statutory financial audit services conducted in accordance with ICAI Standards on Auditing and regulatory provisions.',
        full_desc: 'Statutory audit entails an independent examination of financial statements to ensure true and fair presentation and compliance with applicable Accounting Standards. Our audit approach adheres strictly to ICAI Standards on Auditing (SAs) and Companies Act regulations.',
        who_needs_it: 'Companies registered under Companies Act, LLPs exceeding turnover thresholds, and entities mandated by statutory authorities.',
        documents_required: JSON.stringify(['Books of Accounts & General Ledger Statements', 'Bank Reconciliation Statements (BRS)', 'Fixed Asset Register & Inventory Valuation Schedules', 'Statutory Returns (GST, Income Tax, TDS, PF/ESI)', 'Vouchers, Invoices, and Purchase Bills']),
        process_steps: JSON.stringify(['Audit Planning & Risk Assessment Strategy', 'Internal Control Review & Substantive Testing', 'Verification of Balance Sheet & Income Line Items', 'Audit Query Discussion & Management Representation', 'Issuance of Independent Auditor Report']),
        icon: 'shield-check',
        sort_order: 6
      },
      {
        title: 'Tax Audit under Section 44AB',
        slug: 'tax-audit-section-44ab',
        category: 'Audit & Assurance',
        short_desc: 'Tax audit examination and Form 3CA/3CB and 3CD filing for eligible businesses and professionals exceeding statutory limits.',
        full_desc: 'Tax Audit under Section 44AB of the Income Tax Act, 1961 requires thorough verification of business accounts to ensure compliance with tax laws, disallowances under Section 40, 40A, and reporting in Form 3CD.',
        who_needs_it: 'Businesses with gross turnover exceeding statutory audit limits (₹1 Crore / ₹10 Crore subject to cash transaction caps) and professionals with receipts exceeding ₹50 Lakhs / ₹75 Lakhs.',
        documents_required: JSON.stringify(['Trial Balance & Financial Statements', 'Tax Deduction Schedules & Proofs of Payment', 'GSTR-9 / 9C Data Reconciliation Statements', 'Method of Accounting & Stock Valuation Disclosures']),
        process_steps: JSON.stringify(['Preliminary Records Examination & Sampling', 'Form 3CD Clause-by-Clause Verification', 'Disallowance & Prescribed Ratio Computations', 'Draft Form 3CD Review with Management', 'Digital Upload of Audit Report on IT Portal']),
        icon: 'check-square',
        sort_order: 7
      },
      {
        title: 'Accounting & Bookkeeping Services',
        slug: 'accounting-bookkeeping-services',
        category: 'Advisory',
        short_desc: 'Systematic financial ledger maintenance, bank reconciliation, financial statement preparation, and management reporting.',
        full_desc: 'Maintaining accurate accounting records is fundamental to financial management and statutory compliance. We provide structured bookkeeping services following Indian Accounting Standards (Ind AS / AS), creating trial balances, profit and loss statements, and balance sheets.',
        who_needs_it: 'Small and medium enterprises, sole proprietors, partnership firms, startups, and professional practices.',
        documents_required: JSON.stringify(['Sales & Purchase Invoices', 'Bank Account Statements & Cheque Counterfoils', 'Expense Vouchers & Cash Receipts', 'Loan Agreements & EMI Schedules']),
        process_steps: JSON.stringify(['Source Document Collection & Categorization', 'Transaction Entry in Accounting Software', 'Periodic Bank & Vendor Reconciliation', 'Preparation of Monthly / Quarterly Trial Balance', 'Final Financial Statement Drafting']),
        icon: 'book-open',
        sort_order: 8
      },
      {
        title: 'Startup Registration & Advisory Compliance',
        slug: 'startup-registration-advisory',
        category: 'Advisory',
        short_desc: 'DPIIT Startup India recognition assistance, MSME / Udyam registration, statutory licenses, and advisory.',
        full_desc: 'Early-stage entities require guidance regarding statutory registrations, government scheme benefits, and compliance roadmaps. We assist startups with Udyam Registration, DPIIT Recognition, and structuring financial frameworks.',
        who_needs_it: 'New business entities, tech ventures, innovators, and MSME enterprises in Gujarat.',
        documents_required: JSON.stringify(['Certificate of Incorporation / Partnership Deed', 'PAN of Entity & Authorized Representative', 'Brief Description of Business Model / Innovation', 'Pitch Deck / Product Details (for DPIIT)']),
        process_steps: JSON.stringify(['Entity Structure Evaluation', 'Udyam Registration on Official MSME Portal', 'DPIIT Application Preparation & Submission', 'Compliance Roadmap Briefing']),
        icon: 'trending-up',
        sort_order: 9
      },
      {
        title: 'NRI Taxation & Advisory Services',
        slug: 'nri-taxation-advisory',
        category: 'Direct Tax',
        short_desc: 'Taxation guidance for Non-Resident Indians (NRIs) regarding property sale, Form 15CA/CB certification, and DTAA relief.',
        full_desc: 'Non-Resident Indians deriving income from India (rental, capital gains, interest) must adhere to specialized tax provisions. We assist NRIs with residential status determination, Form 15CA/15CB remittance certificates, and Double Taxation Avoidance Agreement (DTAA) provisions.',
        who_needs_it: 'NRIs selling Indian immovable property, transferring funds abroad, or earning taxable rental/capital income in India.',
        documents_required: JSON.stringify(['Passport & Overseas Residence Proof', 'Indian PAN Card & Bank Statements (NRE/NRO)', 'Property Sale / Purchase Agreements & Registry Documents', 'Tax Residency Certificate (TRC) for DTAA claims']),
        process_steps: JSON.stringify(['Residential Status & Tax Liability Determination', 'Computation of Capital Gains / Withholding Tax', 'Issuance of CA Certificate (Form 15CB) if applicable', 'Form 15CA E-Filing on IT Portal', 'Annual Indian ITR Filing for NRI']),
        icon: 'globe',
        sort_order: 10
      },
      {
        title: 'Net Worth & Professional Certifications',
        slug: 'net-worth-certifications',
        category: 'Advisory',
        short_desc: 'CA certified Net Worth Certificates, turnover certificates, and solvency statements for visa, tender, or bank requirements.',
        full_desc: 'Financial certificates verified and signed by a Chartered Accountant with a Unique Document Identification Number (UDIN) are frequently required by banks, government departments, and foreign embassies.',
        who_needs_it: 'Individuals applying for overseas student/work visas, entities participating in government tenders, or borrowers seeking credit facilities.',
        documents_required: JSON.stringify(['Property Valuation Reports / Title Deeds', 'Bank Statements & Fixed Deposit Receipts', 'Share Certificate & Investment Statements', 'Vehicle Registration Certificates & Liability Statements']),
        process_steps: JSON.stringify(['Asset & Liability Statement Verification', 'Physical Inspection / Document Proof Audit', 'Computation of Net Worth as per ICAI Guidelines', 'Issuance of CA Certificate with Mandatory UDIN']),
        icon: 'award',
        sort_order: 11
      },
      {
        title: 'TDS Return Filing & Compliance',
        slug: 'tds-returns-compliance',
        category: 'Direct Tax',
        short_desc: 'Quarterly TDS return preparation (Forms 24Q, 26Q, 27Q), Form 16/16A generation, and TRACES compliance.',
        full_desc: 'Entities deducting tax at source (on salaries, contractor payments, rent, professional fees) must deposit TDS monthly and file quarterly statements with NSDL/TRACES. We handle quarterly return filings and certificate downloads.',
        who_needs_it: 'Employers, companies, firms, and individuals required to deduct tax under Chapter XVII-B of the Income Tax Act.',
        documents_required: JSON.stringify(['Deductor TAN & PAN Details', 'Challan Payment Records (BSR Code, Challan No, Date)', 'Deductee-wise Deduction Register (PAN, Amount, Date)', 'TRACES Login Credentials']),
        process_steps: JSON.stringify(['Challan & Deduction Data Verification', 'Quarterly FVU File Generation using NSDL Utility', 'Return Submission on Portal', 'Form 16 / 16A Download & Certificate Issue']),
        icon: 'file-check',
        sort_order: 12
      }
    ];

    const stmt = db.prepare('INSERT INTO services (title, slug, category, short_desc, full_desc, who_needs_it, documents_required, process_steps, icon, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    for (const s of sampleServices) {
      stmt.run(s.title, s.slug, s.category, s.short_desc, s.full_desc, s.who_needs_it, s.documents_required, s.process_steps, s.icon, s.sort_order);
    }
    console.log('[DB Seed] Seeded 12 comprehensive services');
  }
}

// Execute initial database setup
initDb();

module.exports = {
  db,

  // Admin methods
  getAdminByUsername: (username) => {
    return db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
  },
  updateAdminPassword: (id, passwordHash) => {
    return db.prepare('UPDATE admins SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(passwordHash, id);
  },

  // Enquiry methods
  getAllEnquiries: (statusFilter, searchQuery) => {
    let sql = 'SELECT * FROM enquiries WHERE 1=1';
    const params = [];
    if (statusFilter && statusFilter !== 'All') {
      sql += ' AND status = ?';
      params.push(statusFilter);
    }
    if (searchQuery) {
      sql += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ? OR subject LIKE ?)';
      const q = `%${searchQuery}%`;
      params.push(q, q, q, q);
    }
    sql += ' ORDER BY created_at DESC';
    return db.prepare(sql).all(...params);
  },
  addEnquiry: (enquiry) => {
    const stmt = db.prepare('INSERT INTO enquiries (name, phone, email, subject, message) VALUES (?, ?, ?, ?, ?)');
    return stmt.run(enquiry.name, enquiry.phone, enquiry.email || '', enquiry.subject, enquiry.message);
  },
  updateEnquiryStatus: (id, status) => {
    return db.prepare('UPDATE enquiries SET status = ? WHERE id = ?').run(status, id);
  },
  deleteEnquiry: (id) => {
    return db.prepare('DELETE FROM enquiries WHERE id = ?').run(id);
  },
  getEnquiriesCount: () => {
    const total = db.prepare('SELECT COUNT(*) as count FROM enquiries').get().count;
    const newCount = db.prepare("SELECT COUNT(*) as count FROM enquiries WHERE status = 'New'").get().count;
    return { total, newCount };
  },

  // Article methods
  getPublishedArticles: (limit) => {
    let sql = "SELECT * FROM articles WHERE status = 'published' ORDER BY published_at DESC";
    if (limit) sql += ` LIMIT ${parseInt(limit, 10)}`;
    return db.prepare(sql).all();
  },
  getArticleBySlug: (slug) => {
    return db.prepare('SELECT * FROM articles WHERE slug = ?').get(slug);
  },
  getAllArticlesAdmin: () => {
    return db.prepare('SELECT * FROM articles ORDER BY published_at DESC').all();
  },
  saveArticle: (art) => {
    if (art.id) {
      return db.prepare('UPDATE articles SET title = ?, slug = ?, category = ?, excerpt = ?, body = ?, seo_title = ?, seo_description = ?, status = ? WHERE id = ?')
        .run(art.title, art.slug, art.category, art.excerpt, art.body, art.seo_title || art.title, art.seo_description || art.excerpt, art.status || 'published', art.id);
    } else {
      return db.prepare('INSERT INTO articles (title, slug, category, excerpt, body, seo_title, seo_description, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .run(art.title, art.slug, art.category, art.excerpt, art.body, art.seo_title || art.title, art.seo_description || art.excerpt, art.status || 'published');
    }
  },
  deleteArticle: (id) => {
    return db.prepare('DELETE FROM articles WHERE id = ?').run(id);
  },

  // Due Dates methods
  getUpcomingDueDates: (limit) => {
    let sql = 'SELECT * FROM due_dates ORDER BY due_date ASC';
    if (limit) sql += ` LIMIT ${parseInt(limit, 10)}`;
    return db.prepare(sql).all();
  },
  getAllDueDatesAdmin: () => {
    return db.prepare('SELECT * FROM due_dates ORDER BY due_date ASC').all();
  },
  saveDueDate: (dd) => {
    if (dd.id) {
      return db.prepare('UPDATE due_dates SET title = ?, due_date = ?, category = ?, description = ?, authority = ?, verification_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(dd.title, dd.due_date, dd.category, dd.description, dd.authority, dd.verification_status || 'sample, verify', dd.id);
    } else {
      return db.prepare('INSERT INTO due_dates (title, due_date, category, description, authority, verification_status) VALUES (?, ?, ?, ?, ?, ?)')
        .run(dd.title, dd.due_date, dd.category, dd.description, dd.authority, dd.verification_status || 'sample, verify');
    }
  },
  deleteDueDate: (id) => {
    return db.prepare('DELETE FROM due_dates WHERE id = ?').run(id);
  },

  // Services methods
  getActiveServices: () => {
    return db.prepare('SELECT * FROM services WHERE is_active = 1 ORDER BY sort_order ASC, title ASC').all();
  },
  getServiceBySlug: (slug) => {
    return db.prepare('SELECT * FROM services WHERE slug = ?').get(slug);
  },
  getAllServicesAdmin: () => {
    return db.prepare('SELECT * FROM services ORDER BY sort_order ASC, title ASC').all();
  },
  saveService: (srv) => {
    const docs = typeof srv.documents_required === 'string' ? srv.documents_required : JSON.stringify(srv.documents_required || []);
    const steps = typeof srv.process_steps === 'string' ? srv.process_steps : JSON.stringify(srv.process_steps || []);
    if (srv.id) {
      return db.prepare('UPDATE services SET title = ?, slug = ?, category = ?, short_desc = ?, full_desc = ?, who_needs_it = ?, documents_required = ?, process_steps = ?, icon = ?, is_active = ?, sort_order = ? WHERE id = ?')
        .run(srv.title, srv.slug, srv.category, srv.short_desc, srv.full_desc, srv.who_needs_it, docs, steps, srv.icon || 'briefcase', srv.is_active ? 1 : 0, srv.sort_order || 0, srv.id);
    } else {
      return db.prepare('INSERT INTO services (title, slug, category, short_desc, full_desc, who_needs_it, documents_required, process_steps, icon, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .run(srv.title, srv.slug, srv.category, srv.short_desc, srv.full_desc, srv.who_needs_it, docs, steps, srv.icon || 'briefcase', srv.is_active ? 1 : 0, srv.sort_order || 0);
    }
  },
  deleteService: (id) => {
    return db.prepare('DELETE FROM services WHERE id = ?').run(id);
  }
};
