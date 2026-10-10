const state = {
  user: null,
  permissions: [],
  chart: null,
  page: 'dashboard',
  confirmAction: null,
};

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'IN', name: 'India' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
];

function can(key) {
  return state.permissions.includes(key);
}

function toast(message, type = 'success') {
  const wrap = document.getElementById('toastStack');
  const el = document.createElement('div');
  el.className = `toast align-items-center text-bg-${type} border-0 show mb-2`;
  el.innerHTML = `<div class="d-flex"><div class="toast-body">${escapeHtml(message)}</div>
    <button class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString();
}

function showLoader(on) {
  document.getElementById('pageLoader').classList.toggle('d-none', !on);
}

function navItems() {
  return [
    { id: 'dashboard', label: 'Dashboard', icon: 'bi-speedometer2', perm: 'dashboard.view' },
    { id: 'users', label: 'Users', icon: 'bi-people', perm: 'users.view' },
    { id: 'permissions', label: 'Permissions', icon: 'bi-shield-check', perm: 'permissions.manage' },
    { id: 'leads', label: 'Leads', icon: 'bi-kanban', perm: 'leads.view' },
    { id: 'statuses', label: 'Lead Status', icon: 'bi-flag', perm: 'lead_statuses.manage' },
    { id: 'logs', label: 'Activity Logs', icon: 'bi-clock-history', perm: 'activity_logs.view' },
  ].filter((item) => can(item.perm));
}

function renderSidebar() {
  const items = navItems();
  document.getElementById('sidebar').innerHTML = items
    .map(
      (item) => `<a href="#/${item.id}" class="${state.page === item.id ? 'active' : ''}">
      <i class="bi ${item.icon}"></i> ${item.label}</a>`
    )
    .join('');
}

async function boot() {
  try {
    const res = await Api.get('/api/auth/me');
    state.user = res.data.user;
    state.permissions = res.data.user.permissions || [];
    Api.setCsrf(res.data.csrfToken);
    document.getElementById('profileLabel').textContent = `${state.user.fullName} · ${state.user.role?.name || ''}`;
    route();
  } catch {
    window.location.href = '/login.html';
  }
}

function route() {
  const hash = (location.hash || '#/dashboard').replace('#/', '');
  const page = hash.split('?')[0] || 'dashboard';
  const allowed = navItems().map((n) => n.id);
  state.page = allowed.includes(page) ? page : allowed[0] || 'dashboard';
  renderSidebar();
  const views = {
    dashboard: renderDashboard,
    users: renderUsers,
    permissions: renderPermissions,
    leads: renderLeads,
    statuses: renderStatuses,
    logs: renderLogs,
  };
  (views[state.page] || renderDashboard)();
}

document.getElementById('logoutBtn').addEventListener('click', async () => {
  try {
    await Api.post('/api/auth/logout', {});
  } catch {
    /* still redirect */
  }
  window.location.href = '/login.html';
});

document.getElementById('menuToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

window.addEventListener('hashchange', route);
document.getElementById('confirmOk').addEventListener('click', async () => {
  if (state.confirmAction) await state.confirmAction();
  bootstrap.Modal.getInstance(document.getElementById('confirmModal'))?.hide();
});

function confirmDelete(message, action) {
  document.getElementById('confirmModalBody').textContent = message;
  state.confirmAction = action;
  new bootstrap.Modal(document.getElementById('confirmModal')).show();
}

function openModal(title, html) {
  document.getElementById('formModalTitle').textContent = title;
  document.getElementById('formModalBody').innerHTML = html;
  new bootstrap.Modal(document.getElementById('formModal')).show();
}

function pagination(meta, action) {
  if (!meta || meta.pages <= 1) return '';
  let buttons = '';
  for (let i = 1; i <= meta.pages; i += 1) {
    buttons += `<button type="button" class="btn btn-sm ${i === meta.page ? 'btn-primary' : 'btn-outline-primary'}" data-action="${action}" data-page="${i}">${i}</button>`;
  }
  return `<div class="d-flex gap-1 flex-wrap mt-3">${buttons}</div>`;
}

function emptyState(text) {
  return `<div class="empty-state"><i class="bi bi-inbox fs-1 d-block mb-2"></i>${escapeHtml(text)}</div>`;
}

async function renderDashboard() {
  showLoader(true);
  try {
    const res = await Api.get('/api/dashboard/stats');
    const s = res.data;
    const userCards = can('users.view')
      ? `<div class="col-md-3"><div class="stat-card"><div class="label">Total Users</div><div class="value">${s.totalUsers ?? 0}</div></div></div>
         <div class="col-md-3"><div class="stat-card"><div class="label">Active Users</div><div class="value">${s.activeUsers ?? 0}</div></div></div>`
      : '';
    document.getElementById('pageContent').innerHTML = `
      <h2 class="h4 mb-3">Dashboard</h2>
      <div class="row g-3 mb-4">
        <div class="col-md-3"><div class="stat-card"><div class="label">Total Leads</div><div class="value">${s.totalLeads}</div></div></div>
        <div class="col-md-3"><div class="stat-card"><div class="label">New Leads</div><div class="value">${s.newLeads}</div></div></div>
        <div class="col-md-3"><div class="stat-card"><div class="label">Contacted</div><div class="value">${s.contactedLeads}</div></div></div>
        <div class="col-md-3"><div class="stat-card"><div class="label">Qualified</div><div class="value">${s.qualifiedLeads}</div></div></div>
        <div class="col-md-3"><div class="stat-card"><div class="label">Converted</div><div class="value">${s.convertedLeads}</div></div></div>
        <div class="col-md-3"><div class="stat-card"><div class="label">Lost</div><div class="value">${s.lostLeads}</div></div></div>
        ${userCards}
      </div>
      ${can('reports.view') ? `<div class="panel"><h3 class="h6 mb-3">Leads by status</h3><canvas id="statusChart" height="110"></canvas></div>` : ''}
    `;
    if (can('reports.view') && window.Chart) {
      const ctx = document.getElementById('statusChart');
      if (state.chart) state.chart.destroy();
      state.chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: s.byStatus.map((x) => x.name),
          datasets: [{ data: s.byStatus.map((x) => x.count), backgroundColor: s.byStatus.map((x) => x.color || '#64748b') }],
        },
      });
    }
  } catch (err) {
    toast(err.message, 'danger');
    document.getElementById('pageContent').innerHTML = emptyState('Unable to load dashboard.');
  } finally {
    showLoader(false);
  }
}

window.loadUsers = async function loadUsers(page = 1) {
  const q = document.getElementById('userQ')?.value || '';
  const status = document.getElementById('userStatus')?.value || '';
  const roleId = document.getElementById('userRole')?.value || '';
  const params = new URLSearchParams({ page, limit: 10 });
  if (q) params.set('q', q);
  if (status) params.set('status', status);
  if (roleId) params.set('roleId', roleId);
  const res = await Api.get(`/api/users?${params}`);
  const rows = res.data.items
    .map(
      (u) => `<tr>
      <td>${u.id}</td>
      <td>${escapeHtml(u.fullName)}</td>
      <td>${escapeHtml(u.email)}</td>
      <td>${escapeHtml(u.phone)}</td>
      <td>${escapeHtml(u.role?.name || '')}</td>
      <td><span class="badge ${u.status === 'active' ? 'text-bg-success' : 'text-bg-secondary'}">${u.status}</span></td>
      <td class="text-end">${userActions(u)}</td>
    </tr>`
    )
    .join('');
  document.getElementById('usersTable').innerHTML = rows || `<tr><td colspan="7">${emptyState('No users found.')}</td></tr>`;
  document.getElementById('usersPager').innerHTML = pagination(res.data.pagination, 'load-users');
};

function userActions(u) {
  const bits = [];
  if (can('users.update')) {
    bits.push(`<button type="button" class="btn btn-sm btn-outline-primary" data-action="open-user-form" data-id="${u.id}">Edit</button>`);
    bits.push(
      `<button type="button" class="btn btn-sm btn-outline-warning" data-action="reset-user-password" data-id="${u.id}">Reset password</button>`
    );
    bits.push(
      `<button type="button" class="btn btn-sm btn-outline-secondary" data-action="toggle-user-status" data-id="${u.id}" data-extra="${u.status === 'active' ? 'inactive' : 'active'}">${
        u.status === 'active' ? 'Deactivate' : 'Activate'
      }</button>`
    );
  }
  if (can('users.delete')) {
    bits.push(`<button type="button" class="btn btn-sm btn-outline-danger" data-action="delete-user" data-id="${u.id}">Delete</button>`);
  }
  return bits.join(' ');
}

async function renderUsers() {
  showLoader(true);
  try {
    const roles = await Api.get('/api/users/roles');
    const options = roles.data.map((r) => `<option value="${r.id}">${escapeHtml(r.name)}</option>`).join('');
    document.getElementById('pageContent').innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h2 class="h4 mb-0">Users</h2>
        ${can('users.create') ? `<button type="button" class="btn btn-primary" data-action="open-user-form">Add user</button>` : ''}
      </div>
      <div class="panel mb-3">
        <div class="row g-2">
          <div class="col-md-4"><input class="form-control" id="userQ" placeholder="Search name, email, phone" /></div>
          <div class="col-md-3"><select class="form-select" id="userStatus"><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
          <div class="col-md-3"><select class="form-select" id="userRole"><option value="">All roles</option>${options}</select></div>
          <div class="col-md-2"><button type="button" class="btn btn-outline-primary w-100" data-action="load-users" data-page="1">Filter</button></div>
        </div>
      </div>
      <div class="panel">
        <div class="table-responsive">
          <table class="table align-middle">
            <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th></th></tr></thead>
            <tbody id="usersTable"></tbody>
          </table>
        </div>
        <div id="usersPager"></div>
      </div>`;
    window._roles = roles.data;
    await loadUsers(1);
  } catch (err) {
    toast(err.message, 'danger');
  } finally {
    showLoader(false);
  }
}

window.openUserForm = async function openUserForm(id) {
  const user = id ? (await Api.get(`/api/users/${id}`)).data : null;
  const roles = (window._roles || []).map((r) => `<option value="${r.id}" ${user?.roleId === r.id ? 'selected' : ''}>${escapeHtml(r.name)}</option>`).join('');
  openModal(id ? 'Edit user' : 'Add user', `
    <form id="userForm">
      <div class="row g-3">
        <div class="col-md-6"><label class="form-label">Full Name</label><input name="fullName" class="form-control" value="${escapeHtml(user?.fullName || '')}" /><div class="invalid-feedback"></div></div>
        <div class="col-md-6"><label class="form-label">Email</label><input name="email" type="email" class="form-control" value="${escapeHtml(user?.email || '')}" /><div class="invalid-feedback"></div></div>
        <div class="col-md-6"><label class="form-label">Phone Number</label><input name="phone" class="form-control" value="${escapeHtml(user?.phone || '')}" /><div class="invalid-feedback"></div></div>
        <div class="col-md-6"><label class="form-label">Role</label><select name="roleId" class="form-select">${roles}</select><div class="invalid-feedback"></div></div>
        <div class="col-md-6"><label class="form-label">Password ${id ? '(leave blank to keep)' : ''}</label><input name="password" type="password" class="form-control" /><div class="invalid-feedback"></div></div>
        <div class="col-md-6"><label class="form-label">Confirm Password</label><input name="confirmPassword" type="password" class="form-control" /><div class="invalid-feedback"></div></div>
        <div class="col-md-6"><label class="form-label">Status</label><select name="status" class="form-select"><option value="active" ${user?.status !== 'inactive' ? 'selected' : ''}>Active</option><option value="inactive" ${user?.status === 'inactive' ? 'selected' : ''}>Inactive</option></select><div class="invalid-feedback"></div></div>
      </div>
      <div class="mt-4"><button class="btn btn-primary" type="submit">Save</button></div>
    </form>`);
  document.getElementById('userForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const payload = Object.fromEntries(new FormData(form).entries());
    const errors = {
      fullName: CRMValidators.validateName(payload.fullName),
      email: CRMValidators.validateEmail(payload.email),
      phone: CRMValidators.validatePhone(payload.phone),
    };
    if (!id || payload.password) {
      errors.password = CRMValidators.validatePassword(payload.password);
      if (payload.password !== payload.confirmPassword) errors.confirmPassword = 'Passwords do not match.';
    }
    Object.keys(errors).forEach((k) => {
      if (!errors[k]) delete errors[k];
    });
    CRMValidators.applyErrors(form, errors);
    if (Object.keys(errors).length) return;
    payload.roleId = Number(payload.roleId);
    try {
      if (id) await Api.put(`/api/users/${id}`, payload);
      else await Api.post('/api/users', payload);
      bootstrap.Modal.getInstance(document.getElementById('formModal')).hide();
      toast(id ? 'User updated successfully' : 'User created successfully');
      loadUsers();
    } catch (err) {
      CRMValidators.applyErrors(form, err.payload?.errors || {});
      toast(err.message, 'danger');
    }
  });
};

window.deleteUser = function deleteUser(id) {
  confirmDelete('Delete this user? This cannot be undone.', async () => {
    try {
      await Api.delete(`/api/users/${id}`);
      toast('User deleted successfully');
      loadUsers();
    } catch (err) {
      toast(err.message, 'danger');
    }
  });
};

window.toggleUserStatus = async function toggleUserStatus(id, status) {
  try {
    await Api.patch(`/api/users/${id}/status`, { status });
    toast('User status updated');
    loadUsers();
  } catch (err) {
    toast(err.message, 'danger');
  }
};

window.resetUserPassword = function resetUserPassword(id) {
  openModal('Reset password', `
    <form id="resetForm">
      <label class="form-label">New password</label>
      <input name="password" type="password" class="form-control" />
      <div class="invalid-feedback"></div>
      <button class="btn btn-primary mt-3" type="submit">Reset</button>
    </form>`);
  document.getElementById('resetForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = e.target.password.value;
    const err = CRMValidators.validatePassword(password);
    CRMValidators.applyErrors(e.target, err ? { password: err } : {});
    if (err) return;
    try {
      await Api.post(`/api/users/${id}/reset-password`, { password });
      bootstrap.Modal.getInstance(document.getElementById('formModal')).hide();
      toast('Password reset successfully');
    } catch (ex) {
      toast(ex.message, 'danger');
    }
  });
};

async function renderPermissions() {
  showLoader(true);
  try {
    const [usersRes, catalogRes] = await Promise.all([
      Api.get('/api/users?limit=100'),
      Api.get('/api/permissions'),
    ]);
    const users = usersRes.data.items;
    const catalog = catalogRes.data;
    document.getElementById('pageContent').innerHTML = `
      <h2 class="h4 mb-3">Permission Management</h2>
      <div class="panel">
        <label class="form-label">User</label>
        <select class="form-select mb-4" id="permUser">${users
          .map((u) => `<option value="${u.id}">${escapeHtml(u.fullName)} (${escapeHtml(u.email)})</option>`)
          .join('')}</select>
        <div id="permMatrix"></div>
        <button type="button" class="btn btn-primary mt-3" data-action="save-permissions">Save permissions</button>
      </div>`;
    window._permCatalog = catalog;
    if (users[0]) await loadPermissionMatrix(users[0].id);
    document.getElementById('permUser').addEventListener('change', (e) => loadPermissionMatrix(e.target.value));
  } catch (err) {
    toast(err.message, 'danger');
  } finally {
    showLoader(false);
  }
}

window.loadPermissionMatrix = async function loadPermissionMatrix(userId) {
  const user = (await Api.get(`/api/users/${userId}`)).data;
  const groups = {};
  window._permCatalog.forEach((p) => {
    groups[p.groupName] = groups[p.groupName] || [];
    groups[p.groupName].push(p);
  });
  document.getElementById('permMatrix').innerHTML = Object.entries(groups)
    .map(([group, items]) => {
      const rows = items
        .map((p) => {
          const checked = user.permissions.includes(p.key) ? 'checked' : '';
          return `<label class="d-flex justify-content-between border-bottom py-2">
            <span>${escapeHtml(p.name)}</span>
            <input type="checkbox" data-key="${p.key}" ${checked} />
          </label>`;
        })
        .join('');
      return `<h3 class="h6 mt-3">${escapeHtml(group)}</h3>${rows}`;
    })
    .join('');
};

window.savePermissions = async function savePermissions() {
  const userId = document.getElementById('permUser').value;
  const permissions = [...document.querySelectorAll('#permMatrix input[type=checkbox]')].map((el) => ({
    key: el.dataset.key,
    allowed: el.checked,
  }));
  try {
    await Api.post(`/api/users/${userId}/permissions`, { permissions });
    toast('Permissions updated successfully');
  } catch (err) {
    toast(err.message, 'danger');
  }
};

window.loadLeads = async function loadLeads(page = 1) {
  const params = new URLSearchParams({ page, limit: 10 });
  ['leadQ', 'leadCountry', 'leadStatus', 'leadAssignee', 'leadFrom', 'leadTo'].forEach((id) => {
    const el = document.getElementById(id);
    if (!el || !el.value) return;
    const map = {
      leadQ: 'q',
      leadCountry: 'country',
      leadStatus: 'statusId',
      leadAssignee: 'assignedUserId',
      leadFrom: 'dateFrom',
      leadTo: 'dateTo',
    };
    params.set(map[id], el.value);
  });
  const res = await Api.get(`/api/leads?${params}`);
  const rows = res.data.items
    .map(
      (l) => `<tr>
      <td>${l.id}</td>
      <td>${escapeHtml(l.name)}</td>
      <td>${escapeHtml(l.email)}</td>
      <td>${escapeHtml(l.phone)}</td>
      <td>${escapeHtml(l.country)}</td>
      <td>${escapeHtml(l.company || '')}</td>
      <td><span class="status-pill" style="background:${l.status?.color || '#64748b'}">${escapeHtml(l.status?.name || '')}</span></td>
      <td>${escapeHtml(l.assignedUser?.fullName || '—')}</td>
      <td>${formatDate(l.createdAt)}</td>
      <td class="text-end">${leadActions(l)}</td>
    </tr>`
    )
    .join('');
  document.getElementById('leadsTable').innerHTML = rows || `<tr><td colspan="10">${emptyState('No leads found.')}</td></tr>`;
  document.getElementById('leadsPager').innerHTML = pagination(res.data.pagination, 'load-leads');
};

function leadActions(l) {
  const bits = [];
  if (can('leads.view')) bits.push(`<button type="button" class="btn btn-sm btn-outline-secondary" data-action="view-lead" data-id="${l.id}">View</button>`);
  if (can('leads.update')) bits.push(`<button type="button" class="btn btn-sm btn-outline-primary" data-action="open-lead-form" data-id="${l.id}">Edit</button>`);
  if (can('leads.delete')) bits.push(`<button type="button" class="btn btn-sm btn-outline-danger" data-action="delete-lead" data-id="${l.id}">Delete</button>`);
  return bits.join(' ');
}

async function renderLeads() {
  showLoader(true);
  try {
    const [statuses, users] = await Promise.all([
      Api.get('/api/lead-statuses'),
      Api.get('/api/users/options'),
    ]);
    window._statuses = statuses.data;
    window._assignees = users.data || [];
    const countryOpts = COUNTRIES.map((c) => `<option value="${c.code}">${c.name}</option>`).join('');
    const statusOpts = statuses.data.map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('');
    const userOpts = window._assignees.map((u) => `<option value="${u.id}">${escapeHtml(u.fullName)}</option>`).join('');
    document.getElementById('pageContent').innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h2 class="h4 mb-0">Leads</h2>
        <div class="d-flex gap-2">
          ${can('leads.export') ? `<button type="button" class="btn btn-outline-secondary" data-action="export-leads">Export</button>` : ''}
          ${can('leads.create') ? `<button type="button" class="btn btn-primary" data-action="open-lead-form">Add lead</button>` : ''}
        </div>
      </div>
      <div class="panel mb-3">
        <div class="row g-2">
          <div class="col-md-3"><input class="form-control" id="leadQ" placeholder="Search name, email, phone, company" /></div>
          <div class="col-md-2"><select class="form-select" id="leadCountry"><option value="">Country</option>${countryOpts}</select></div>
          <div class="col-md-2"><select class="form-select" id="leadStatus"><option value="">Status</option>${statusOpts}</select></div>
          <div class="col-md-2"><select class="form-select" id="leadAssignee"><option value="">Assigned user</option>${userOpts}</select></div>
          <div class="col-md-1"><input class="form-control" id="leadFrom" type="date" /></div>
          <div class="col-md-1"><input class="form-control" id="leadTo" type="date" /></div>
          <div class="col-md-1"><button type="button" class="btn btn-outline-primary w-100" data-action="load-leads" data-page="1">Go</button></div>
        </div>
      </div>
      <div class="panel">
        <div class="table-responsive">
          <table class="table align-middle">
            <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Country</th><th>Company</th><th>Lead Status</th><th>Assigned To</th><th>Created Date</th><th>Actions</th></tr></thead>
            <tbody id="leadsTable"></tbody>
          </table>
        </div>
        <div id="leadsPager"></div>
      </div>`;
    await loadLeads(1);
  } catch (err) {
    toast(err.message, 'danger');
  } finally {
    showLoader(false);
  }
}

function leadFormFields(lead) {
  const countryOpts = COUNTRIES.map((c) => `<option value="${c.code}" ${lead?.country === c.code ? 'selected' : ''}>${c.name}</option>`).join('');
  const statusOpts = (window._statuses || [])
    .map((s) => `<option value="${s.id}" ${lead?.statusId === s.id ? 'selected' : ''}>${escapeHtml(s.name)}</option>`)
    .join('');
  const userOpts = `<option value="">Unassigned</option>${(window._assignees || [])
    .map((u) => `<option value="${u.id}" ${lead?.assignedUserId === u.id ? 'selected' : ''}>${escapeHtml(u.fullName)}</option>`)
    .join('')}`;
  return `
    <form id="leadForm">
      <div class="row g-3">
        <div class="col-md-6"><label class="form-label">Name</label><input name="name" class="form-control" value="${escapeHtml(lead?.name || '')}" /><div class="invalid-feedback"></div></div>
        <div class="col-md-6"><label class="form-label">Email</label><input name="email" class="form-control" value="${escapeHtml(lead?.email || '')}" /><div class="invalid-feedback"></div></div>
        <div class="col-md-6"><label class="form-label">Phone Number</label><input name="phone" class="form-control" value="${escapeHtml(lead?.phone || '')}" /><div class="invalid-feedback"></div></div>
        <div class="col-md-6"><label class="form-label">Country</label><select name="country" class="form-select">${countryOpts}</select><div class="invalid-feedback"></div></div>
        <div class="col-md-8"><label class="form-label">Address</label><input name="address" class="form-control" value="${escapeHtml(lead?.address || '')}" /><div class="invalid-feedback"></div></div>
        <div class="col-md-4"><label class="form-label">PIN / ZIP Code</label><input name="pinCode" class="form-control" value="${escapeHtml(lead?.pinCode || '')}" /><div class="invalid-feedback"></div></div>
        <div class="col-md-6"><label class="form-label">Company</label><input name="company" class="form-control" value="${escapeHtml(lead?.company || '')}" /></div>
        <div class="col-md-6"><label class="form-label">Lead Source</label><input name="source" class="form-control" value="${escapeHtml(lead?.source || '')}" /></div>
        <div class="col-md-6"><label class="form-label">Lead Status</label><select name="statusId" class="form-select">${statusOpts}</select><div class="invalid-feedback"></div></div>
        <div class="col-md-6"><label class="form-label">Assigned User</label><select name="assignedUserId" class="form-select">${userOpts}</select></div>
        <div class="col-12"><label class="form-label">Notes</label><textarea name="notes" class="form-control" rows="3">${escapeHtml(lead?.notes || '')}</textarea></div>
      </div>
      <div class="mt-4"><button class="btn btn-primary" type="submit">Save</button></div>
    </form>`;
}

window.openLeadForm = async function openLeadForm(id) {
  const lead = id ? (await Api.get(`/api/leads/${id}`)).data : null;
  openModal(id ? 'Edit lead' : 'Add lead', leadFormFields(lead));
  document.getElementById('leadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const payload = Object.fromEntries(new FormData(form).entries());
    const errors = {
      name: CRMValidators.validateName(payload.name),
      email: CRMValidators.validateEmail(payload.email),
      phone: CRMValidators.validatePhone(payload.phone),
      country: payload.country ? '' : 'Country is required.',
      pinCode: CRMValidators.validatePin(payload.country, payload.pinCode),
      statusId: payload.statusId ? '' : 'Lead status is required.',
    };
    Object.keys(errors).forEach((k) => {
      if (!errors[k]) delete errors[k];
    });
    CRMValidators.applyErrors(form, errors);
    if (Object.keys(errors).length) return;
    payload.statusId = Number(payload.statusId);
    if (payload.assignedUserId) payload.assignedUserId = Number(payload.assignedUserId);
    else delete payload.assignedUserId;
    try {
      if (id) await Api.put(`/api/leads/${id}`, payload);
      else await Api.post('/api/leads', payload);
      bootstrap.Modal.getInstance(document.getElementById('formModal')).hide();
      toast(id ? 'Lead updated successfully' : 'Lead created successfully');
      loadLeads();
    } catch (err) {
      CRMValidators.applyErrors(form, err.payload?.errors || {});
      toast(err.message, 'danger');
    }
  });
};

window.viewLead = async function viewLead(id) {
  const l = (await Api.get(`/api/leads/${id}`)).data;
  openModal('Lead details', `
    <dl class="row mb-0">
      <dt class="col-sm-4">Name</dt><dd class="col-sm-8">${escapeHtml(l.name)}</dd>
      <dt class="col-sm-4">Email</dt><dd class="col-sm-8">${escapeHtml(l.email)}</dd>
      <dt class="col-sm-4">Phone</dt><dd class="col-sm-8">${escapeHtml(l.phone)}</dd>
      <dt class="col-sm-4">Country</dt><dd class="col-sm-8">${escapeHtml(l.country)}</dd>
      <dt class="col-sm-4">Address</dt><dd class="col-sm-8">${escapeHtml(l.address || '—')}</dd>
      <dt class="col-sm-4">PIN / ZIP</dt><dd class="col-sm-8">${escapeHtml(l.pinCode)}</dd>
      <dt class="col-sm-4">Company</dt><dd class="col-sm-8">${escapeHtml(l.company || '—')}</dd>
      <dt class="col-sm-4">Source</dt><dd class="col-sm-8">${escapeHtml(l.source || '—')}</dd>
      <dt class="col-sm-4">Status</dt><dd class="col-sm-8">${escapeHtml(l.status?.name || '')}</dd>
      <dt class="col-sm-4">Assigned To</dt><dd class="col-sm-8">${escapeHtml(l.assignedUser?.fullName || '—')}</dd>
      <dt class="col-sm-4">Created By</dt><dd class="col-sm-8">${escapeHtml(l.createdBy?.fullName || '—')}</dd>
      <dt class="col-sm-4">Created Date</dt><dd class="col-sm-8">${formatDate(l.createdAt)}</dd>
      <dt class="col-sm-4">Updated Date</dt><dd class="col-sm-8">${formatDate(l.updatedAt)}</dd>
      <dt class="col-sm-4">Notes</dt><dd class="col-sm-8">${escapeHtml(l.notes || '—')}</dd>
    </dl>`);
};

window.deleteLead = function deleteLead(id) {
  confirmDelete('Delete this lead?', async () => {
    try {
      await Api.delete(`/api/leads/${id}`);
      toast('Lead deleted successfully');
      loadLeads();
    } catch (err) {
      toast(err.message, 'danger');
    }
  });
};

window.exportLeads = async function exportLeads() {
  const params = new URLSearchParams();
  if (document.getElementById('leadQ')?.value) params.set('q', document.getElementById('leadQ').value);
  const res = await Api.download(`/api/leads/export?${params}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'leads.csv';
  a.click();
  URL.revokeObjectURL(url);
};

async function renderStatuses() {
  showLoader(true);
  try {
    const res = await Api.get('/api/lead-statuses');
    const rows = res.data
      .map(
        (s) => `<tr>
        <td>${s.id}</td>
        <td>${escapeHtml(s.name)}</td>
        <td><span class="status-pill" style="background:${s.color || '#64748b'}">${escapeHtml(s.slug)}</span></td>
        <td>${s.sortOrder}</td>
        <td>${s.isActive ? 'Active' : 'Inactive'}</td>
        <td class="text-end">
          <button type="button" class="btn btn-sm btn-outline-primary" data-action="open-status-form" data-id="${s.id}">Edit</button>
          <button type="button" class="btn btn-sm btn-outline-danger" data-action="delete-status" data-id="${s.id}">Delete</button>
        </td>
      </tr>`
      )
      .join('');
    document.getElementById('pageContent').innerHTML = `
      <div class="d-flex justify-content-between mb-3">
        <h2 class="h4 mb-0">Lead Status</h2>
        <button type="button" class="btn btn-primary" data-action="open-status-form">Add status</button>
      </div>
      <div class="panel table-responsive">
        <table class="table"><thead><tr><th>ID</th><th>Name</th><th>Slug</th><th>Order</th><th>Active</th><th></th></tr></thead>
        <tbody>${rows || `<tr><td colspan="6">${emptyState('No statuses.')}</td></tr>`}</tbody></table>
      </div>`;
  } catch (err) {
    toast(err.message, 'danger');
  } finally {
    showLoader(false);
  }
}

window.openStatusForm = async function openStatusForm(id) {
  const list = (await Api.get('/api/lead-statuses')).data;
  const s = id ? list.find((x) => x.id === id) || {} : {};
  openModal(s.id ? 'Edit status' : 'Add status', `
    <form id="statusForm">
      <label class="form-label">Name</label>
      <input name="name" class="form-control" value="${escapeHtml(s.name || '')}" />
      <div class="invalid-feedback"></div>
      <label class="form-label mt-3">Color</label>
      <input name="color" type="color" class="form-control form-control-color" value="${s.color || '#64748b'}" />
      <label class="form-label mt-3">Sort order</label>
      <input name="sortOrder" type="number" class="form-control" value="${s.sortOrder || 0}" />
      <div class="form-check mt-3">
        <input class="form-check-input" type="checkbox" name="isActive" ${s.isActive !== false ? 'checked' : ''} />
        <label class="form-check-label">Active</label>
      </div>
      <button class="btn btn-primary mt-3" type="submit">Save</button>
    </form>`);
  document.getElementById('statusForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const payload = {
      name: form.name.value,
      color: form.color.value,
      sortOrder: Number(form.sortOrder.value || 0),
      isActive: form.isActive.checked,
    };
    if (!payload.name.trim()) {
      CRMValidators.applyErrors(form, { name: 'Name is required.' });
      return;
    }
    try {
      if (s.id) await Api.put(`/api/lead-statuses/${s.id}`, payload);
      else await Api.post('/api/lead-statuses', payload);
      bootstrap.Modal.getInstance(document.getElementById('formModal')).hide();
      toast('Lead status saved');
      renderStatuses();
    } catch (err) {
      CRMValidators.applyErrors(form, err.payload?.errors || {});
      toast(err.message, 'danger');
    }
  });
};

window.deleteStatus = function deleteStatus(id) {
  confirmDelete('Delete this lead status?', async () => {
    try {
      await Api.delete(`/api/lead-statuses/${id}`);
      toast('Lead status deleted');
      renderStatuses();
    } catch (err) {
      toast(err.message, 'danger');
    }
  });
};

window.loadLogs = async function loadLogs(page = 1) {
  const params = new URLSearchParams({ page, limit: 15 });
  const q = document.getElementById('logQ')?.value;
  const action = document.getElementById('logAction')?.value;
  const dateFrom = document.getElementById('logFrom')?.value;
  const dateTo = document.getElementById('logTo')?.value;
  if (q) params.set('q', q);
  if (action) params.set('action', action);
  if (dateFrom) params.set('dateFrom', dateFrom);
  if (dateTo) params.set('dateTo', dateTo);
  const res = await Api.get(`/api/activity-logs?${params}`);
  const rows = res.data.items
    .map(
      (l) => `<tr>
      <td>${formatDate(l.createdAt)} ${new Date(l.createdAt).toLocaleTimeString()}</td>
      <td>${escapeHtml(l.user?.fullName || 'System')}</td>
      <td>${escapeHtml(l.action)}</td>
      <td>${escapeHtml(l.description)}</td>
      <td>${escapeHtml(l.ipAddress || '')}</td>
    </tr>`
    )
    .join('');
  document.getElementById('logsTable').innerHTML = rows || `<tr><td colspan="5">${emptyState('No activity yet.')}</td></tr>`;
  document.getElementById('logsPager').innerHTML = pagination(res.data.pagination, 'load-logs');
};

async function renderLogs() {
  document.getElementById('pageContent').innerHTML = `
    <h2 class="h4 mb-3">Activity Logs</h2>
    <div class="panel mb-3">
      <div class="row g-2">
        <div class="col-md-4"><input class="form-control" id="logQ" placeholder="Search description or action" /></div>
        <div class="col-md-3"><input class="form-control" id="logAction" placeholder="Action e.g. lead.create" /></div>
        <div class="col-md-2"><input class="form-control" id="logFrom" type="date" /></div>
        <div class="col-md-2"><input class="form-control" id="logTo" type="date" /></div>
        <div class="col-md-1"><button type="button" class="btn btn-outline-primary w-100" data-action="load-logs" data-page="1">Go</button></div>
      </div>
    </div>
    <div class="panel table-responsive">
      <table class="table">
        <thead><tr><th>Date/Time</th><th>User</th><th>Action</th><th>Description</th><th>IP Address</th></tr></thead>
        <tbody id="logsTable"></tbody>
      </table>
      <div id="logsPager"></div>
    </div>`;
  await loadLogs(1);
}

document.getElementById('pageContent').addEventListener('click', async (event) => {
  const btn = event.target.closest('[data-action]');
  if (!btn) return;
  event.preventDefault();
  const action = btn.dataset.action;
  const id = btn.dataset.id ? Number(btn.dataset.id) : undefined;
  const page = btn.dataset.page ? Number(btn.dataset.page) : 1;
  try {
    if (action === 'open-user-form') await openUserForm(id);
    else if (action === 'reset-user-password') resetUserPassword(id);
    else if (action === 'toggle-user-status') await toggleUserStatus(id, btn.dataset.extra);
    else if (action === 'delete-user') deleteUser(id);
    else if (action === 'load-users') await loadUsers(page);
    else if (action === 'save-permissions') await savePermissions();
    else if (action === 'view-lead') await viewLead(id);
    else if (action === 'open-lead-form') await openLeadForm(id);
    else if (action === 'delete-lead') deleteLead(id);
    else if (action === 'export-leads') await exportLeads();
    else if (action === 'load-leads') await loadLeads(page);
    else if (action === 'open-status-form') await openStatusForm(id);
    else if (action === 'delete-status') deleteStatus(id);
    else if (action === 'load-logs') await loadLogs(page);
  } catch (err) {
    toast(err.message || 'Action failed', 'danger');
  }
});

boot();
