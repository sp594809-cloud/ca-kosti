/**
 * Admin Panel Client Logic for Koshti & Company Portal
 */

document.addEventListener('DOMContentLoaded', () => {
  initAdminNavigation();
  loadDashboardData();
  loadEnquiriesData();
  loadArticlesData();
  loadDueDatesData();
  loadServicesData();
  loadFirmConfigData();
  loadPhotosData();
  initFormListeners();
});

// 1. Sidebar Section Switcher
function initAdminNavigation() {
  const items = document.querySelectorAll('.sidebar-item a');
  const sections = document.querySelectorAll('.admin-panel-section');
  const titleEl = document.getElementById('section-title');

  items.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = item.getAttribute('data-section');

      items.forEach(i => i.parentElement.classList.remove('active'));
      item.parentElement.classList.add('active');

      sections.forEach(sec => sec.classList.remove('active'));
      const targetSec = document.getElementById(targetId);
      if (targetSec) targetSec.classList.add('active');

      const titleMap = {
        'sec-dashboard': 'Dashboard',
        'sec-enquiries': 'Client Enquiries',
        'sec-articles': 'Articles & Technical Updates',
        'sec-due-dates': 'Compliance Due Dates',
        'sec-services': 'Practice Services',
        'sec-firm-config': 'Firm Configuration',
        'sec-photos': 'Photos & Assets Manager',
        'sec-account': 'Account Settings'
      };
      if (titleEl) titleEl.textContent = titleMap[targetId] || 'Dashboard';
    });
  });

  // Logout button
  document.getElementById('admin-logout-btn').addEventListener('click', () => {
    fetch('/api/logout', { method: 'POST' })
      .then(() => window.location.href = '/index.html');
  });
}

// 2. Dashboard Section
function loadDashboardData() {
  fetch('/api/admin/dashboard')
    .then(res => {
      if (res.status === 401) window.location.href = '/#login';
      return res.json();
    })
    .then(data => {
      if (!data.success) return;
      document.getElementById('dash-new-count').textContent = data.stats.newEnquiries;
      document.getElementById('dash-total-count').textContent = data.stats.totalEnquiries;
      document.getElementById('dash-articles-count').textContent = data.stats.totalArticles;
      document.getElementById('dash-duedates-count').textContent = data.stats.totalDueDates;

      const recentBody = document.getElementById('dash-recent-enquiries');
      if (recentBody) {
        recentBody.innerHTML = (data.recentEnquiries || []).map(e => `
          <tr>
            <td><strong>${e.name}</strong></td>
            <td>${e.phone}</td>
            <td>${e.subject}</td>
            <td><span class="badge-tag" style="background:${getStatusBg(e.status)};">${e.status}</span></td>
            <td><small style="color:#64748B;">${new Date(e.created_at).toLocaleDateString()}</small></td>
          </tr>
        `).join('');
      }
    })
    .catch(err => console.error('Dash error:', err));
}

function getStatusBg(st) {
  if (st === 'New') return '#FEF3C7';
  if (st === 'Contacted') return '#E0F2FE';
  return '#DCFCE7';
}

// 3. Enquiries Section
function loadEnquiriesData() {
  const search = document.getElementById('enq-search') ? document.getElementById('enq-search').value : '';
  const status = document.getElementById('enq-status-filter') ? document.getElementById('enq-status-filter').value : 'All';

  fetch(`/api/admin/enquiries?status=${encodeURIComponent(status)}&search=${encodeURIComponent(search)}`)
    .then(res => res.json())
    .then(data => {
      const tbody = document.getElementById('enquiries-table-body');
      if (!tbody || !data.success) return;

      const enquiries = data.enquiries || [];
      if (enquiries.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#64748B; padding:2rem;">No enquiries found.</td></tr>`;
        return;
      }

      tbody.innerHTML = enquiries.map(e => `
        <tr>
          <td>
            <strong>${e.name}</strong><br />
            <small style="color:#64748B;">${e.phone} ${e.email ? '| ' + e.email : ''}</small>
          </td>
          <td>
            <strong>${e.subject}</strong><br />
            <p style="font-size:0.88rem; color:#475569; margin:4px 0 0 0;">${e.message}</p>
          </td>
          <td>
            <a href="tel:${e.phone}" class="btn btn-outline btn-sm" style="padding:2px 8px; font-size:0.78rem;">Call</a>
            <a href="https://wa.me/91${e.phone}?text=${encodeURIComponent('Hello ' + e.name + ', regarding your enquiry for ' + e.subject + ' at Koshti & Company:')}" target="_blank" class="btn btn-primary btn-sm" style="padding:2px 8px; font-size:0.78rem; background:#25D366; border:none;">WhatsApp</a>
          </td>
          <td>
            <select class="form-control" style="padding:4px; font-size:0.85rem;" onchange="updateEnqStatus(${e.id}, this.value)">
              <option value="New" ${e.status === 'New' ? 'selected' : ''}>New</option>
              <option value="Contacted" ${e.status === 'Contacted' ? 'selected' : ''}>Contacted</option>
              <option value="Closed" ${e.status === 'Closed' ? 'selected' : ''}>Closed</option>
            </select>
          </td>
          <td>
            <button onclick="deleteEnquiry(${e.id})" class="btn btn-outline btn-sm" style="color:#DC2626; border-color:#DC2626; padding:2px 8px; font-size:0.78rem;">Delete</button>
          </td>
        </tr>
      `).join('');
    });
}

function updateEnqStatus(id, status) {
  fetch('/api/admin/enquiries/status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, status })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        loadDashboardData();
      }
    });
}

function deleteEnquiry(id) {
  if (!confirm('Are you sure you want to delete this enquiry record?')) return;
  fetch(`/api/admin/enquiries/${id}`, { method: 'DELETE' })
    .then(res => res.json())
    .then(data => {
      loadEnquiriesData();
      loadDashboardData();
    });
}

// 4. Articles Section
let currentArticles = [];
function loadArticlesData() {
  fetch('/api/admin/articles')
    .then(res => res.json())
    .then(data => {
      const tbody = document.getElementById('articles-table-body');
      if (!tbody || !data.success) return;
      currentArticles = data.articles || [];

      tbody.innerHTML = currentArticles.map(a => `
        <tr>
          <td><strong>${a.title}</strong></td>
          <td><span class="badge-tag">${a.category}</span></td>
          <td><span class="badge-tag" style="background:${a.status === 'published' ? '#DEF7EC' : '#FEE2E2'}; color:${a.status === 'published' ? '#03543F' : '#991B1B'}">${a.status}</span></td>
          <td><small style="color:#64748B;">${new Date(a.published_at).toLocaleDateString()}</small></td>
          <td>
            <button onclick="editArticle(${a.id})" class="btn btn-outline btn-sm" style="padding:2px 8px; font-size:0.78rem;">Edit</button>
            <button onclick="deleteArticle(${a.id})" class="btn btn-outline btn-sm" style="color:#DC2626; border-color:#DC2626; padding:2px 8px; font-size:0.78rem;">Delete</button>
          </td>
        </tr>
      `).join('');
    });
}

function editArticle(id) {
  const art = currentArticles.find(a => a.id === id);
  if (!art) return;
  document.getElementById('art-id').value = art.id;
  document.getElementById('art-form-title').value = art.title;
  document.getElementById('art-form-cat').value = art.category;
  document.getElementById('art-form-status').value = art.status;
  document.getElementById('art-form-excerpt').value = art.excerpt;
  document.getElementById('art-form-body').value = art.body;
  document.getElementById('art-modal-title').textContent = 'Edit Article';
  document.getElementById('modal-article').classList.add('open');
}

function deleteArticle(id) {
  if (!confirm('Are you sure you want to delete this article?')) return;
  fetch(`/api/admin/articles/${id}`, { method: 'DELETE' })
    .then(() => loadArticlesData());
}

// 5. Due Dates Section
let currentDueDates = [];
function loadDueDatesData() {
  fetch('/api/admin/due-dates')
    .then(res => res.json())
    .then(data => {
      const tbody = document.getElementById('duedates-table-body');
      if (!tbody || !data.success) return;
      currentDueDates = data.dueDates || [];

      tbody.innerHTML = currentDueDates.map(d => `
        <tr>
          <td><strong>${d.title}</strong></td>
          <td><strong>${d.due_date}</strong></td>
          <td><span class="badge-tag">${d.category}</span></td>
          <td>${d.authority}</td>
          <td>
            <button onclick="editDueDate(${d.id})" class="btn btn-outline btn-sm" style="padding:2px 8px; font-size:0.78rem;">Edit</button>
            <button onclick="deleteDueDate(${d.id})" class="btn btn-outline btn-sm" style="color:#DC2626; border-color:#DC2626; padding:2px 8px; font-size:0.78rem;">Delete</button>
          </td>
        </tr>
      `).join('');
    });
}

function editDueDate(id) {
  const dd = currentDueDates.find(d => d.id === id);
  if (!dd) return;
  document.getElementById('due-id').value = dd.id;
  document.getElementById('due-form-title').value = dd.title;
  document.getElementById('due-form-date').value = dd.due_date;
  document.getElementById('due-form-cat').value = dd.category;
  document.getElementById('due-form-authority').value = dd.authority;
  document.getElementById('due-form-desc').value = dd.description;
  document.getElementById('due-modal-title').textContent = 'Edit Compliance Due Date';
  document.getElementById('modal-duedate').classList.add('open');
}

function deleteDueDate(id) {
  if (!confirm('Are you sure you want to delete this due date?')) return;
  fetch(`/api/admin/due-dates/${id}`, { method: 'DELETE' })
    .then(() => loadDueDatesData());
}

// 6. Services Section
let currentServices = [];
function loadServicesData() {
  fetch('/api/admin/services')
    .then(res => res.json())
    .then(data => {
      const tbody = document.getElementById('services-table-body');
      if (!tbody || !data.success) return;
      currentServices = data.services || [];

      tbody.innerHTML = currentServices.map(s => `
        <tr>
          <td>${s.sort_order}</td>
          <td><strong>${s.title}</strong></td>
          <td><span class="badge-tag">${s.category}</span></td>
          <td><span class="badge-tag" style="background:${s.is_active ? '#DEF7EC' : '#FEE2E2'}">${s.is_active ? 'Active' : 'Hidden'}</span></td>
          <td>
            <button onclick="editService(${s.id})" class="btn btn-outline btn-sm" style="padding:2px 8px; font-size:0.78rem;">Edit</button>
            <button onclick="deleteService(${s.id})" class="btn btn-outline btn-sm" style="color:#DC2626; border-color:#DC2626; padding:2px 8px; font-size:0.78rem;">Delete</button>
          </td>
        </tr>
      `).join('');
    });
}

function editService(id) {
  const s = currentServices.find(srv => srv.id === id);
  if (!s) return;
  document.getElementById('srv-id').value = s.id;
  document.getElementById('srv-form-title').value = s.title;
  document.getElementById('srv-form-cat').value = s.category;
  document.getElementById('srv-form-icon').value = s.icon || '';
  document.getElementById('srv-form-order').value = s.sort_order || 0;
  document.getElementById('srv-form-short').value = s.short_desc;
  document.getElementById('srv-form-full').value = s.full_desc;
  document.getElementById('srv-form-who').value = s.who_needs_it;
  document.getElementById('srv-form-docs').value = Array.isArray(s.documents_required) ? s.documents_required.join('\n') : '';
  document.getElementById('srv-form-steps').value = Array.isArray(s.process_steps) ? s.process_steps.join('\n') : '';
  document.getElementById('srv-form-active').checked = !!s.is_active;

  document.getElementById('srv-modal-title').textContent = 'Edit Service';
  document.getElementById('modal-service').classList.add('open');
}

function deleteService(id) {
  if (!confirm('Delete this service?')) return;
  fetch(`/api/admin/services/${id}`, { method: 'DELETE' })
    .then(() => loadServicesData());
}

// 7. Firm Config Section
let currentConfig = {};
function loadFirmConfigData() {
  fetch('/api/admin/config')
    .then(res => res.json())
    .then(data => {
      if (!data.success) return;
      currentConfig = data.config || {};
      document.getElementById('cfg-firmName').value = currentConfig.firmName || '';
      document.getElementById('cfg-shortName').value = currentConfig.shortName || '';
      document.getElementById('cfg-frn').value = currentConfig.icaiFirmRegNo || '';
      document.getElementById('cfg-year').value = currentConfig.yearEstablished || '';
      document.getElementById('cfg-address').value = currentConfig.address || '';
      document.getElementById('cfg-city').value = currentConfig.city || '';
      document.getElementById('cfg-email').value = currentConfig.email || '';
      document.getElementById('cfg-phone1').value = (currentConfig.phones && currentConfig.phones[0]) ? currentConfig.phones[0] : '';
      document.getElementById('cfg-whatsapp').value = currentConfig.whatsapp || '';
      document.getElementById('cfg-hours').value = currentConfig.workingHours || '';
      document.getElementById('cfg-heroBg').value = currentConfig.heroBgImage || '';
      document.getElementById('cfg-officePhoto').value = currentConfig.officePhoto || '';
      document.getElementById('cfg-demoMode').checked = !!currentConfig.demoMode;

      const partners = currentConfig.partners || [];
      if (partners[0]) {
        document.getElementById('cfg-p1-mem').value = partners[0].membershipNo || '';
        document.getElementById('cfg-p1-photo').value = partners[0].photo || '';
      }
      if (partners[1]) {
        document.getElementById('cfg-p2-mem').value = partners[1].membershipNo || '';
        document.getElementById('cfg-p2-photo').value = partners[1].photo || '';
      }
    });
}

// 8. Photos Manager Section
function loadPhotosData() {
  fetch('/api/admin/uploads')
    .then(res => res.json())
    .then(data => {
      const grid = document.getElementById('photos-grid');
      if (!grid || !data.success) return;

      const photos = data.photos || [];
      if (photos.length === 0) {
        grid.innerHTML = `<p style="grid-column:1/-1; color:#64748B;">No uploaded photo assets yet.</p>`;
        return;
      }

      grid.innerHTML = photos.map(p => `
        <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:0.85rem; text-align:center; box-shadow: var(--shadow-sm); display:flex; flex-direction:column;">
          <div style="height:170px; display:flex; align-items:center; justify-content:center; background:#f8fafc; border:1px solid #f1f5f9; overflow:hidden; border-radius:6px; margin-bottom:0.75rem;">
            <img src="${p.url}" alt="${p.name}" style="max-width:100%; max-height:100%; width:auto; height:auto; object-fit:contain;" />
          </div>
          <div style="font-size:0.75rem; color:#64748B; margin-bottom:0.5rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${p.name}">${p.name}</div>
          
          <div style="display:flex; flex-direction:column; gap:0.4rem; margin-top:auto;">
            <button onclick="assignPhotoToConfig('heroBgImage', '${p.url}')" class="btn btn-primary btn-sm" style="padding:4px 6px; font-size:0.75rem;">Set as Hero Background</button>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.3rem;">
              <button onclick="assignPhotoToConfig('partner1', '${p.url}')" class="btn btn-outline btn-sm" style="padding:3px; font-size:0.72rem;">Set Partner 1</button>
              <button onclick="assignPhotoToConfig('partner2', '${p.url}')" class="btn btn-outline btn-sm" style="padding:3px; font-size:0.72rem;">Set Partner 2</button>
            </div>
            <button onclick="assignPhotoToConfig('officePhoto', '${p.url}')" class="btn btn-outline btn-sm" style="padding:3px; font-size:0.72rem;">Set Office Building</button>
            <input type="text" readonly value="${p.url}" class="form-control" style="font-size:0.72rem; padding:3px; text-align:center; margin-top:0.2rem;" onclick="this.select(); navigator.clipboard.writeText('${p.url}'); alert('Copied Image URL to clipboard!');" title="Click to copy image URL" />
          </div>
        </div>
      `).join('');
    });
}

function assignPhotoToConfig(targetKey, photoUrl) {
  fetch('/api/admin/config')
    .then(res => res.json())
    .then(data => {
      const config = data.config || {};
      if (targetKey === 'heroBgImage') {
        config.heroBgImage = photoUrl;
      } else if (targetKey === 'officePhoto') {
        config.officePhoto = photoUrl;
      } else if (targetKey === 'partner1') {
        if (!config.partners) config.partners = [{}, {}];
        config.partners[0].photo = photoUrl;
      } else if (targetKey === 'partner2') {
        if (!config.partners) config.partners = [{}, {}];
        if (!config.partners[1]) config.partners[1] = {};
        config.partners[1].photo = photoUrl;
      }

      return fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert(`Success! Updated website display setting with image URL: ${photoUrl}`);
        loadFirmConfigData();
      } else {
        alert(data.error || 'Failed to update photo setting');
      }
    })
    .catch(err => alert('Failed to assign photo: ' + err.message));
}

// 9. Forms & Event Listeners
function initFormListeners() {
  // Enquiry filter events
  const enqSearch = document.getElementById('enq-search');
  const enqFilter = document.getElementById('enq-status-filter');
  if (enqSearch) enqSearch.addEventListener('input', loadEnquiriesData);
  if (enqFilter) enqFilter.addEventListener('change', loadEnquiriesData);

  // Article Modal Triggers
  document.getElementById('btn-create-article').addEventListener('click', () => {
    document.getElementById('form-article').reset();
    document.getElementById('art-id').value = '';
    document.getElementById('art-modal-title').textContent = 'Create New Article';
    document.getElementById('modal-article').classList.add('open');
  });

  document.getElementById('form-article').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('art-id').value;
    const title = document.getElementById('art-form-title').value.trim();
    const category = document.getElementById('art-form-cat').value.trim();
    const status = document.getElementById('art-form-status').value;
    const excerpt = document.getElementById('art-form-excerpt').value.trim();
    const body = document.getElementById('art-form-body').value.trim();

    fetch('/api/admin/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id ? parseInt(id, 10) : undefined, title, category, status, excerpt, body })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          closeAdminModals();
          loadArticlesData();
          loadDashboardData();
        } else {
          alert(data.error);
        }
      });
  });

  // Due Date Modal Triggers
  document.getElementById('btn-create-duedate').addEventListener('click', () => {
    document.getElementById('form-duedate').reset();
    document.getElementById('due-id').value = '';
    document.getElementById('due-modal-title').textContent = 'Add New Due Date';
    document.getElementById('modal-duedate').classList.add('open');
  });

  document.getElementById('form-duedate').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('due-id').value;
    const title = document.getElementById('due-form-title').value.trim();
    const due_date = document.getElementById('due-form-date').value;
    const category = document.getElementById('due-form-cat').value;
    const authority = document.getElementById('due-form-authority').value.trim();
    const description = document.getElementById('due-form-desc').value.trim();

    fetch('/api/admin/due-dates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id ? parseInt(id, 10) : undefined, title, due_date, category, authority, description })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          closeAdminModals();
          loadDueDatesData();
          loadDashboardData();
        } else {
          alert(data.error);
        }
      });
  });

  // Service Modal Triggers
  document.getElementById('btn-create-service').addEventListener('click', () => {
    document.getElementById('form-service').reset();
    document.getElementById('srv-id').value = '';
    document.getElementById('srv-modal-title').textContent = 'Add New Service';
    document.getElementById('modal-service').classList.add('open');
  });

  document.getElementById('form-service').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('srv-id').value;
    const title = document.getElementById('srv-form-title').value.trim();
    const category = document.getElementById('srv-form-cat').value.trim();
    const icon = document.getElementById('srv-form-icon').value.trim();
    const sort_order = parseInt(document.getElementById('srv-form-order').value || '0', 10);
    const short_desc = document.getElementById('srv-form-short').value.trim();
    const full_desc = document.getElementById('srv-form-full').value.trim();
    const who_needs_it = document.getElementById('srv-form-who').value.trim();
    const docsStr = document.getElementById('srv-form-docs').value.trim();
    const stepsStr = document.getElementById('srv-form-steps').value.trim();
    const is_active = document.getElementById('srv-form-active').checked;

    const documents_required = docsStr ? docsStr.split('\n').filter(x => x.trim()) : [];
    const process_steps = stepsStr ? stepsStr.split('\n').filter(x => x.trim()) : [];

    fetch('/api/admin/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: id ? parseInt(id, 10) : undefined,
        title, category, icon, sort_order, short_desc, full_desc, who_needs_it,
        documents_required, process_steps, is_active
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          closeAdminModals();
          loadServicesData();
        } else {
          alert(data.error);
        }
      });
  });

  // Firm Config Save
  document.getElementById('firm-config-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const p1Photo = document.getElementById('cfg-p1-photo').value.trim();
    const p1Mem = document.getElementById('cfg-p1-mem').value.trim();
    const p2Photo = document.getElementById('cfg-p2-photo').value.trim();
    const p2Mem = document.getElementById('cfg-p2-mem').value.trim();

    const partners = currentConfig.partners || [{}, {}];
    if (partners[0]) {
      partners[0].membershipNo = p1Mem || partners[0].membershipNo;
      if (p1Photo) partners[0].photo = p1Photo;
    }
    if (partners[1]) {
      partners[1].membershipNo = p2Mem || partners[1].membershipNo;
      if (p2Photo) partners[1].photo = p2Photo;
    }

    const updated = {
      ...currentConfig,
      firmName: document.getElementById('cfg-firmName').value.trim(),
      shortName: document.getElementById('cfg-shortName').value.trim(),
      logoText: document.getElementById('cfg-shortName').value.trim(),
      icaiFirmRegNo: document.getElementById('cfg-frn').value.trim(),
      yearEstablished: document.getElementById('cfg-year').value.trim(),
      address: document.getElementById('cfg-address').value.trim(),
      city: document.getElementById('cfg-city').value.trim(),
      email: document.getElementById('cfg-email').value.trim(),
      phones: [document.getElementById('cfg-phone1').value.trim(), currentConfig.phones[1] || '+91 079 2750 0000'],
      whatsapp: document.getElementById('cfg-whatsapp').value.trim(),
      workingHours: document.getElementById('cfg-hours').value.trim(),
      heroBgImage: document.getElementById('cfg-heroBg').value.trim(),
      officePhoto: document.getElementById('cfg-officePhoto').value.trim(),
      demoMode: document.getElementById('cfg-demoMode').checked,
      partners
    };

    fetch('/api/admin/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert('Firm configuration and Partner photos updated successfully! Public website updated.');
          currentConfig = updated;
        } else {
          alert(data.error);
        }
      });
  });

  // Upload Photo Form
  document.getElementById('upload-photo-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('photo-file-input');
    if (!fileInput.files || fileInput.files.length === 0) return;

    const formData = new FormData();
    formData.append('photo', fileInput.files[0]);

    fetch('/api/admin/upload', {
      method: 'POST',
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert(`Photo uploaded! URL: ${data.url}`);
          fileInput.value = '';
          loadPhotosData();
        } else {
          alert(data.error || 'Upload failed');
        }
      });
  });

  // Password Change
  document.getElementById('change-pass-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById('pass-current').value;
    const newPassword = document.getElementById('pass-new').value;

    fetch('/api/admin/account/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert('Password updated successfully!');
          document.getElementById('change-pass-form').reset();
        } else {
          alert(data.error || 'Failed to update password');
        }
      });
  });
}

function closeAdminModals() {
  document.querySelectorAll('.admin-modal').forEach(m => m.classList.remove('open'));
}
