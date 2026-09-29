/**
 * Shared Header Component for Koshti & Company Website
 */
document.addEventListener('DOMContentLoaded', () => {
  renderHeader();
});

function renderHeader() {
  const headerContainer = document.getElementById('site-header');
  if (!headerContainer) return;

  const currentPath = window.location.pathname;

  fetch('/api/config')
    .then(res => res.json())
    .then(data => {
      const config = data.config || {};
      const firmName = config.firmName || 'Koshti & Company';
      const logoText = config.logoText || 'Koshti & Co.';
      const phone = (config.phones && config.phones[0]) ? config.phones[0] : '+91 98765 43210';
      const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

      const html = `
        <header class="site-header">
          <div class="container">
            <div class="header-inner">
              <a href="/index.html" class="logo-brand" title="${firmName}">
                <span class="brand-title">${logoText}</span>
                <span class="brand-subtitle">Chartered Accountants</span>
              </a>

              <nav>
                <ul class="nav-menu" id="nav-menu">
                  <li><a href="/index.html" class="nav-link ${isActive(currentPath, '/index.html')}">Home</a></li>
                  <li><a href="/about.html" class="nav-link ${isActive(currentPath, '/about.html')}">About Us</a></li>
                  <li><a href="/services.html" class="nav-link ${isActive(currentPath, '/services.html')}">Services</a></li>
                  <li><a href="/updates.html" class="nav-link ${isActive(currentPath, '/updates.html')}">Updates</a></li>
                  <li><a href="/due-dates.html" class="nav-link ${isActive(currentPath, '/due-dates.html')}">Due Dates</a></li>
                  <li><a href="/contact.html" class="nav-link ${isActive(currentPath, '/contact.html')}">Contact</a></li>
                </ul>
              </nav>

              <div style="display: flex; align-items: center; gap: 1rem;">
                <a href="tel:${cleanPhone}" class="header-cta-phone">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  ${phone}
                </a>

                <button class="mobile-nav-toggle" id="mobile-toggle" aria-label="Toggle menu">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                </button>
              </div>
            </div>
          </div>
        </header>
      `;

      headerContainer.innerHTML = html;

      // Mobile Menu Handler
      const toggleBtn = document.getElementById('mobile-toggle');
      const navMenu = document.getElementById('nav-menu');
      if (toggleBtn && navMenu) {
        toggleBtn.addEventListener('click', () => {
          navMenu.classList.toggle('open');
        });
      }
    })
    .catch(err => console.error('Error rendering header:', err));
}

function isActive(path, target) {
  if (path === target || (path === '/' && target === '/index.html')) return 'active';
  return '';
}
