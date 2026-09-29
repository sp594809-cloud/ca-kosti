/**
 * Shared Footer Component for Koshti & Company Website
 * ICAI Compliant Footer with Disclaimer & Permitted Particulars
 */
document.addEventListener('DOMContentLoaded', () => {
  renderFooter();
});

function renderFooter() {
  const footerContainer = document.getElementById('site-footer');
  if (!footerContainer) return;

  fetch('/api/config')
    .then(res => res.json())
    .then(data => {
      const config = data.config || {};
      const firmName = config.firmName || 'Koshti & Company';
      const frn = config.icaiFirmRegNo || '142857W';
      const year = config.yearEstablished || '2015';
      const address = config.address || '';
      const city = config.city || '';
      const email = config.email || '';
      const phones = config.phones || [];
      const whatsapp = config.whatsapp || '919876543210';
      const workingHours = config.workingHours || '';
      const demoMode = config.demoMode;

      const primaryPhone = phones[0] || '+91 98765 43210';
      const cleanPhone = primaryPhone.replace(/[\s\-\(\)]/g, '');

      // Apply Demo Mode Meta tag dynamically if demoMode is true
      if (demoMode) {
        let metaRobots = document.querySelector('meta[name="robots"]');
        if (!metaRobots) {
          metaRobots = document.createElement('meta');
          metaRobots.name = "robots";
          document.head.appendChild(metaRobots);
        }
        metaRobots.content = "noindex, nofollow";
      }

      const html = `
        <footer class="site-footer">
          <div class="container">
            <div class="footer-grid">
              <!-- Col 1: Firm Overview & Permitted Particulars -->
              <div class="footer-col">
                <h4>${firmName}</h4>
                <p style="font-size: 0.9rem; color: #94A3B8; margin-bottom: 1rem;">
                  Chartered Accountants | Established ${year}<br />
                  ICAI Firm Registration Number (FRN): <strong>${frn}</strong>
                </p>
                <p style="font-size: 0.88rem; color: #94A3B8;">
                  <strong>Office Address:</strong><br />
                  ${address}, ${city}
                </p>
              </div>

              <!-- Col 2: Quick Links -->
              <div class="footer-col">
                <h4>Navigation</h4>
                <ul class="footer-links">
                  <li><a href="/index.html">Home</a></li>
                  <li><a href="/about.html">About Firm</a></li>
                  <li><a href="/services.html">Services Offered</a></li>
                  <li><a href="/updates.html">Articles & Updates</a></li>
                  <li><a href="/due-dates.html">Compliance Due Dates</a></li>
                  <li><a href="/contact.html">Contact Us</a></li>
                </ul>
              </div>

              <!-- Col 3: Permitted Practice Areas -->
              <div class="footer-col">
                <h4>Practice Areas</h4>
                <ul class="footer-links">
                  <li><a href="/service.html?s=statutory-audit-assurance">Statutory Audit</a></li>
                  <li><a href="/service.html?s=gst-registration-returns">GST Compliance</a></li>
                  <li><a href="/service.html?s=income-tax-return-itr-filing">Income Tax Returns</a></li>
                  <li><a href="/service.html?s=company-llp-registration">Company Incorporation</a></li>
                  <li><a href="/service.html?s=roc-compliance-annual-filings">ROC Annual Filings</a></li>
                </ul>
              </div>

              <!-- Col 4: Contact Particulars & Working Hours -->
              <div class="footer-col">
                <h4>Contact Particulars</h4>
                <p style="font-size: 0.88rem; color: #94A3B8; margin-bottom: 0.5rem;">
                  <strong>Phone:</strong> <a href="tel:${cleanPhone}" style="color:#D0DCEB;">${primaryPhone}</a>
                </p>
                <p style="font-size: 0.88rem; color: #94A3B8; margin-bottom: 0.5rem;">
                  <strong>Email:</strong> <a href="mailto:${email}" style="color:#D0DCEB;">${email}</a>
                </p>
                <p style="font-size: 0.88rem; color: #94A3B8; margin-top: 1rem;">
                  <strong>Working Hours:</strong><br />
                  ${workingHours}
                </p>
              </div>
            </div>

            <!-- Mandatory ICAI Disclaimer Box -->
            <div class="footer-disclaimer-box">
              <strong style="color:#CBD5E1;">Disclaimer & ICAI Website Guidelines Compliance:</strong><br />
              The information published on this website is for general informational purposes only and does not constitute professional advice, legal opinion, or solicitation of work. This website strictly complies with the Council Guidelines for Website Publication issued by the Institute of Chartered Accountants of India (ICAI, Code of Ethics, 13th edition). Visitors should seek specific professional guidance from qualified Chartered Accountants prior to acting on any information contained herein.
            </div>

            <!-- Footer Bottom Bar -->
            <div class="footer-bottom">
              <div>
                © ${new Date().getFullYear()} ${firmName} (FRN: ${frn}). All rights reserved.
                ${demoMode ? `<span style="margin-left: 10px; color: #E5C384;">• Preview prepared for ${firmName}</span>` : ''}
              </div>
              <div>
                <a href="/#login" id="hidden-admin-trigger" style="color: #64748B; font-size: 0.78rem;" title="Staff Access">Portal Access</a>
              </div>
            </div>
          </div>
        </footer>

        <!-- Mobile Sticky Action Bar -->
        <div class="mobile-action-bar no-print">
          <div class="mobile-action-grid">
            <a href="tel:${cleanPhone}" class="btn btn-outline btn-sm" style="background:#0B2545; color:#fff; border:none;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              Call Us
            </a>
            <a href="https://wa.me/${whatsapp}?text=Hello%20Koshti%20%26%20Company,%20I%20have%20a%20professional%20enquiry." target="_blank" rel="noopener" class="btn btn-primary btn-sm" style="background:#25D366; border:none;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>
              WhatsApp
            </a>
          </div>
        </div>
      `;

      footerContainer.innerHTML = html;
    })
    .catch(err => console.error('Error rendering footer:', err));
}
