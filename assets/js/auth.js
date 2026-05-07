function getSectorBadge(user) {
  const SETOR_ICON = {
    'TI': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>',
    'Contabilidade': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v16"/><path d="M17.196 5.804 6.804 18.196"/><path d="M4 8h16"/><path d="M4 16h16"/></svg>',
    'Engenharia': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z"/><path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5"/><path d="M4 15v-3a6 6 0 0 1 6-6h0"/><path d="M14 6h0a6 6 0 0 1 6 6v3"/></svg>',
    'Comercial': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-1"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/></svg>',
    'Financeiro': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    'PCP': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h10"/><path d="M6 12h9"/><path d="M11 18h7"/></svg>',
    'Orçamento': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M14 8H8"/><path d="M16 12H8"/><path d="M13 16H8"/></svg>',
    'Segurança do Trabalho': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>',
    'Suprimentos': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/><rect width="13" height="13" x="9" y="11" rx="2"/><path d="M9 17H8a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h1"/><path d="M21 17h1a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-1"/></svg>',
    'RH': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 21a8 8 0 0 0-16 0"/><circle cx="10" cy="8" r="5"/><path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3"/></svg>',
  };
  const icon = SETOR_ICON[user.setor] || '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" stroke-dasharray="4 2"/></svg>';
  const label = user.setor || 'Sem setor';
  return `<span style="display:inline-flex;align-items:center;gap:5px;">${icon} ${label}</span>`;
}

// ===== AUTH — Gerenciamento de usuários e autenticação (Firebase) =====

async function loadUsers() {
  try {
    const snapshot = await db.collection('users').get();
    users = snapshot.docs.map(doc => doc.data());
    migrateSuperAdmin();
  } catch (e) { console.error('[Auth] Erro ao carregar usuários:', e); }
}

function migrateSuperAdmin() {
  if (!users.length) return;
  if (users.some(u => u.isSuperAdmin)) return;
  const candidate = users.find(u => u.isAdmin) || users[0];
  candidate.isSuperAdmin = true;
  candidate.isAdmin = true;
  db.collection('users').doc(candidate.id).set(candidate).catch(console.error);
}

function saveUsers() {
  const batch = db.batch();
  users.forEach(user => batch.set(db.collection('users').doc(user.id), user));
  batch.commit().catch(console.error);
  const btn = document.getElementById('first-user-btn');
  const hasSuperAdmin = users.some(u => u.isSuperAdmin);
  if (btn) btn.style.display = (!hasSuperAdmin) ? 'inline-block' : 'none';
}

function isSuperAdmin() { return !!(currentUser && currentUser.isSuperAdmin); }

function capitalizeName(name) {
  if (!name) return name;
  return name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function openUserManagerModal() {
  editingUserId = null;
  document.getElementById('user-modal').classList.add('open');
  document.getElementById('user-modal-title').textContent = 'Gerenciamento de Usuários';
  resetUserForm();
  renderUserList();
}

function closeUserModal() {
  document.getElementById('user-modal').classList.remove('open');
  editingUserId = null;
  resetUserForm();
}


function openUserFormCard(title) {
  document.getElementById('user-form-modal-title').textContent = title;
  document.getElementById('user-form-modal').classList.add('open');
}

function closeUserFormCard() {
  document.getElementById('user-form-modal').classList.remove('open');
  editingUserId = null;
  resetUserForm();
}
function cancelUserForm() {
  closeUserFormCard();
}

function resetUserForm() {
  document.getElementById('user-name-input').value = '';
  document.getElementById('user-pass-input').value = '';
  document.getElementById('user-role-input').value = 'requester';
  document.getElementById('user-admin-input').checked = false;
  document.getElementById('user-role-group').style.display = 'flex';
  document.getElementById('user-admin-group').style.display = 'none';
  document.getElementById('user-email-input').value = '';
  document.getElementById('user-whatsapp-input').value = '';
  document.getElementById('user-setor-input').value = '';
  document.getElementById('anydesk-no').checked = true;
  document.getElementById('user-anydesk-input').value = '';
  document.getElementById('user-anydesk-input').style.display = 'none';
  document.getElementById('user-vip-input').checked = false;
  document.getElementById('user-pass-input').placeholder = 'Nova senha';
}

function toggleAdminCheckbox() {
  const role = document.getElementById('user-role-input').value;
  const adminGroup = document.getElementById('user-admin-group');
  const vipGroup = document.getElementById('user-vip-group');
  if (isSuperAdmin()) {
    if (role === 'attendant') { adminGroup.style.display = 'flex'; }
    else { adminGroup.style.display = 'none'; document.getElementById('user-admin-input').checked = false; }
    if (vipGroup) vipGroup.style.display = 'flex';
  } else {
    adminGroup.style.display = 'none';
    if (vipGroup) vipGroup.style.display = 'none';
  }
}

function toggleAnydeskInput() {
  const hasAnydesk = document.getElementById('anydesk-yes').checked;
  const input = document.getElementById('user-anydesk-input');
  input.style.display = hasAnydesk ? 'block' : 'none';
  if (!hasAnydesk) input.value = '';
}

function showUserForm() {
  editingUserId = null;
  resetUserForm();
  document.getElementById('user-pass-input').placeholder = 'Senha (obrigatória)';
  toggleAdminCheckbox();
  openUserFormCard('Novo Usuário');
}

function openUserForm(isFirstUser = false) {
  editingUserId = null;
  resetUserForm();
  openUserFormCard(isFirstUser ? 'Criar Administrador Geral' : 'Novo Usuário');
  document.getElementById('user-pass-input').placeholder = 'Senha (obrigatória)';
  if (isFirstUser) {
    document.getElementById('user-role-input').value = 'attendant';
    document.getElementById('user-admin-input').checked = true;
    document.getElementById('user-role-group').style.display = 'none';
    document.getElementById('user-admin-group').style.display = 'none';
    const vipGroup = document.getElementById('user-vip-group');
    if (vipGroup) vipGroup.style.display = 'none'; // não mostra VIP na criação do primeiro usuário
  } else {
    toggleAdminCheckbox(); // garante VIP visível para superadmin
  }
}

function openEditUser(userId) {
  const user = users.find(u => u.id === userId);
  if (!user) return;
  if (user.isSuperAdmin && !isSuperAdmin()) { showNotification('Apenas o Administrador Geral pode editar esta conta.', 'error'); return; }
  editingUserId = userId;
  document.getElementById('user-name-input').value = user.username;
  document.getElementById('user-pass-input').value = '';
  document.getElementById('user-pass-input').placeholder = 'Deixe vazio para manter a senha atual';
  document.getElementById('user-role-input').value = user.role;
  document.getElementById('user-admin-input').checked = !!user.isAdmin;
  document.getElementById('user-email-input').value = user.email || '';
  document.getElementById('user-whatsapp-input').value = user.whatsapp || '';
  document.getElementById('user-setor-input').value = user.setor || '';
  const hasAnydesk = !!user.anydesk;
  document.getElementById(hasAnydesk ? 'anydesk-yes' : 'anydesk-no').checked = true;
  document.getElementById('user-anydesk-input').value = user.anydesk || '';
  document.getElementById('user-anydesk-input').style.display = hasAnydesk ? 'block' : 'none';
  document.getElementById('user-vip-input').checked = !!user.isVip;
  toggleAdminCheckbox();
  openUserFormCard('Editar Usuário');
}

async function saveUser() {
  const name = document.getElementById('user-name-input').value.trim();
  const passRaw = document.getElementById('user-pass-input').value.trim();
  const role = document.getElementById('user-role-input').value;
  const email = document.getElementById('user-email-input').value.trim();
  const whatsapp = document.getElementById('user-whatsapp-input').value.trim();
  const setor = document.getElementById('user-setor-input').value;
  const hasAnydesk = document.getElementById('anydesk-yes').checked;
  const anydesk = hasAnydesk ? document.getElementById('user-anydesk-input').value.trim() : '';
  const isVip = isSuperAdmin() ? (document.getElementById('user-vip-input')?.checked || false) : false;
  const isAdmin = isSuperAdmin()
    ? (document.getElementById('user-admin-input').checked || document.getElementById('user-role-group').style.display === 'none')
    : (editingUserId ? (users.find(u => u.id === editingUserId)?.isAdmin || false) : false);

  if (!name) { alert('Preencha o nome de usuário'); return; }
  if (!editingUserId && !passRaw) { alert('Preencha a senha para criar o usuário'); return; }
  if (hasAnydesk && !anydesk) { alert('Digite o ID do AnyDesk ou selecione "Não tenho AnyDesk"'); return; }

  if (editingUserId) {
    const duplicate = users.find(u => u.username === name && u.id !== editingUserId);
    if (duplicate) { alert('Esse nome de usuário já existe!'); return; }
    const idx = users.findIndex(u => u.id === editingUserId);
    if (idx !== -1) {
      const wasSuperAdmin = users[idx].isSuperAdmin;
      const finalPass = passRaw ? await hashPassword(passRaw) : users[idx].password;
      users[idx] = { ...users[idx], username: name, password: finalPass, role, isAdmin: wasSuperAdmin ? true : isAdmin, email, whatsapp, anydesk, setor, isVip };
    }
    saveUsers();
    if (currentUser && currentUser.id === editingUserId) {
      currentUser = users.find(u => u.id === editingUserId);
      localStorage.setItem('chamados-current-user-id', currentUser.id);
    }
    closeUserFormCard();
    openUserManagerModal();
    showNotification('Usuário atualizado com sucesso.', 'success');
  } else {
    if (users.find(u => u.username === name)) { alert('Esse nome de usuário já existe!'); return; }
    const isFirst = users.length === 0;
    const hashedPass = await hashPassword(passRaw);
    users.push({ id: Date.now().toString(), username: name, password: hashedPass, role, isAdmin: isFirst ? true : isAdmin, isSuperAdmin: isFirst, email, whatsapp, anydesk, setor, isVip: isFirst ? false : isVip });
    saveUsers();
    closeUserFormCard();
    if (!currentUser) { closeUserModal(); showNotification('Administrador Geral criado! Faça login para continuar.', 'success'); }
    else { openUserManagerModal(); showNotification('Usuário adicionado com sucesso.', 'success'); }
  }
}

async function removeUser(userId) {
  const u = users.find(u => u.id === userId);
  if (!u) return;
  if (u.isSuperAdmin) { showNotification('O Administrador Geral não pode ser removido.', 'error'); return; }
  if (!confirm('Deletar este usuário?')) return;
  users = users.filter(u => u.id !== userId);
  await db.collection('users').doc(userId).delete();
  renderUserList();
  if (currentUser && currentUser.id === userId) { closeUserModal(); performLogout(); }
}

function toggleUserDetails(userId) {
  const details = document.getElementById('uid-' + userId);
  const chev = document.getElementById('chev-' + userId);
  if (!details) return;
  const open = details.style.display === 'block';
  details.style.display = open ? 'none' : 'block';
  if (chev) { chev.textContent = open ? '›' : '⌄'; chev.classList.toggle('open', !open); }
}

function renderUserList() {
  const container = document.getElementById('users-list');
  if (!users.length) { container.innerHTML = '<div style="color:var(--muted);font-size:0.8rem;padding:0.5rem;">Nenhum usuário cadastrado.</div>'; return; }
  container.innerHTML = users.map(u => {
    const roleLabel = u.role === 'attendant' ? 'Atendente' : 'Solicitante';
    const extras = [u.setor ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;vertical-align:middle"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg> ${u.setor}` : '', u.anydesk ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;vertical-align:middle"><rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg> ' + u.anydesk : '', u.email ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;vertical-align:middle"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg> ' + u.email : '', u.whatsapp ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;vertical-align:middle"><rect width="14" height="20" x="5" y="2" rx="2"/><path d="M12 18h.01"/></svg> ' + u.whatsapp : ''].filter(Boolean).join(' · ');
    const superBadge = u.isSuperAdmin ? `<span class="ubadge super">★ Super Admin</span>` : '';
    const adminBadge = !u.isSuperAdmin && u.isAdmin ? `<span class="ubadge admin">Admin</span>` : '';
    const canEdit = isSuperAdmin() || (!u.isSuperAdmin && currentUser?.isAdmin);
    const canRemove = isSuperAdmin() && !u.isSuperAdmin;
    return `<div class="user-list-item" id="uli-${u.id}">
      <div class="uli-summary" onclick="toggleUserDetails('${u.id}')">
        <div class="uli-main"><strong class="uli-name">${u.username}</strong>${superBadge}${adminBadge}<span class="uli-role">· ${roleLabel}</span>${u.setor ? `<span class="uli-setor-tag" style="display:inline-flex;align-items:center;gap:3px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;vertical-align:middle"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg> ${u.setor}</span>` : ''}</div>
        <div class="uli-actions">
          ${canEdit ? `<button onclick="event.stopPropagation();openEditUser('${u.id}')" class="uli-edit-btn" title="Editar">✎</button>` : ''}
          ${canRemove ? `<button onclick="event.stopPropagation();removeUser('${u.id}')" class="uli-del-btn" title="Remover">✕</button>` : ''}
          <span class="uli-chevron" id="chev-${u.id}">›</span>
        </div>
      </div>
      <div class="uli-details" id="uid-${u.id}" style="display:none;">
        ${extras ? `<div class="uli-extras">${extras.split(' · ').map(e => `<span>${e}</span>`).join('')}</div>` : '<div class="uli-no-extras">Sem informações de contato cadastradas.</div>'}
      </div>
    </div>`;
  }).join('');
}

async function performLogin() {
  await loadUsers();
  const name = document.getElementById('attendant-name').value.trim().toLowerCase();
  const pass = document.getElementById('attendant-pass').value.trim();
  if (!name || !pass) { alert('Preencha o nome de usuário e a senha.'); return; }
  const hashedPass = await hashPassword(pass);
  const user = users.find(u => u.username.toLowerCase() === name && u.password === hashedPass);
  if (!user) { alert('Usuário ou senha incorretos.'); return; }
  currentUser = user;
  localStorage.setItem('chamados-current-user-id', user.id);
  document.getElementById('attendant-pass').value = '';
  // Salvar setor no localStorage para uso nos módulos
  localStorage.setItem('premovale-current-setor', user.setor || '');
  // Redirecionar para menu principal após login
  window.location.href = 'menu.html';
}

function applyRoleUI() {
  if (!currentUser) return;
  // Botão admin-shield removido — configurações centralizadas em configuracoes.html

  const newTicketBtn = document.getElementById('new-ticket-btn');
  if (newTicketBtn) newTicketBtn.style.display = 'inline-flex';

  const isAdmin = !!(currentUser.isAdmin || currentUser.isSuperAdmin);
  const isAttendant = currentUser.role !== 'requester';

  // Botão alternar visualização
  const viewToggleBtn = document.getElementById('view-toggle-btn');
  if (viewToggleBtn) viewToggleBtn.style.display = isAttendant ? 'flex' : 'none';

  // Botão gerenciar changelog — só super admin
  const changelogManageBtn = document.getElementById('changelog-manage-btn');
  if (changelogManageBtn) changelogManageBtn.style.display = currentUser.isSuperAdmin ? 'flex' : 'none';

  // Firebase — só superadmin
  const syncFab = document.getElementById('sync-fab-nav');
  if (syncFab) syncFab.style.display = currentUser.isSuperAdmin ? 'inline-flex' : 'none';

  // Dropdown de Ações
  const actionsWrapper = document.getElementById('actions-dropdown-wrapper');
  if (actionsWrapper) actionsWrapper.style.display = isAttendant ? 'block' : 'none';

  // Grupo de testes no dropdown de ações
  const testGroup = document.getElementById('test-actions-group');
  if (testGroup) testGroup.style.display = isAdmin ? 'block' : 'none';

  // Testes no dropdown de filtros — só admins
  const filterDdTest = document.getElementById('filter-dd-test');
  if (filterDdTest) filterDdTest.style.display = isAdmin ? 'flex' : 'none';

  // Materiais no dropdown de filtros — só atendentes
  const filterDdMaterial = document.getElementById('filter-dd-material');
  if (filterDdMaterial) filterDdMaterial.style.display = isAttendant ? 'flex' : 'none';

  if (currentUser.role === 'requester') {
    // Solicitante — mostra dropdown de solicitante
    const ddAtt = document.getElementById('filter-dropdown-wrapper');
    const ddReq = document.getElementById('filter-requester-wrapper');
    if (ddAtt) ddAtt.style.display = 'none';
    if (ddReq) ddReq.style.display = 'block';
    currentFilter = 'my-requests';
  } else {
    // Atendente/Admin — mostra dropdown de atendente
    const ddAtt = document.getElementById('filter-dropdown-wrapper');
    const ddReq = document.getElementById('filter-requester-wrapper');
    if (ddAtt) ddAtt.style.display = 'block';
    if (ddReq) ddReq.style.display = 'none';
    currentFilter = 'all';
    // Atualizar label padrão
    const label = document.getElementById('filter-dropdown-label');
    if (label) label.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;vertical-align:middle"><path d="M3 12h.01"/><path d="M3 18h.01"/><path d="M3 6h.01"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M8 6h13"/></svg> Todos';
  }
}

function performAutoLogout() {
  closeTicketDetail();
  if (window._ticketsUnsubscribe) { window._ticketsUnsubscribe(); window._ticketsUnsubscribe = null; }
  currentUser = null;
  localStorage.removeItem('chamados-current-user-id');
  localStorage.setItem('premovale-logout-reason', 'inatividade');
  // Redirecionar para login com mensagem de inatividade
  window.location.href = 'login.html?reason=inatividade';
  loadUsers().then(() => {
    const hasSA = users.some(u => u.isSuperAdmin);
    document.getElementById('first-user-btn').style.display = (!hasSA) ? 'inline-block' : 'none';
  });
}

function performLogout() {
  if (!confirm('Deseja realmente sair do sistema?')) return;
  closeTicketDetail();
  if (window._ticketsUnsubscribe) { window._ticketsUnsubscribe(); window._ticketsUnsubscribe = null; }
  if (typeof stopSessionTimer === 'function') stopSessionTimer();
  currentUser = null;
  localStorage.removeItem('chamados-current-user-id');
  window.location.href = 'login.html';
}

async function checkLoginStatus() {
  await loadUsers();

  const savedId = localStorage.getItem('chamados-current-user-id');
  if (!savedId) {
    // Não logado — redirecionar para login.html
    if (!window.location.pathname.includes('login')) {
      window.location.href = 'login.html';
    }
    return;
  }

  const fresh = users.find(u => u.id === savedId);
  if (!fresh) {
    localStorage.removeItem('chamados-current-user-id');
    window.location.href = 'login.html';
    return;
  }

  currentUser = fresh;
  document.getElementById('current-attendant').textContent = capitalizeName(currentUser.username);
  applyRoleUI();
  loadTickets();
  // Inicializar SLA
  if (typeof loadSlaConfig === 'function') loadSlaConfig();
  if (typeof initSlaChecker === 'function') initSlaChecker();

  // Mostrar setor na navbar
  const setorBadge = document.getElementById('current-setor-badge');
  const setorEl = document.getElementById('current-setor');
  if (setorEl && currentUser.setor) {
    setorEl.textContent = currentUser.setor;
    if (setorBadge) setorBadge.style.display = 'inline-flex';
  }

  if (typeof initSessionTimer === 'function') initSessionTimer(currentUser.role);
  if (typeof initChamadosSidebar === 'function') initChamadosSidebar();
  if (typeof restoreSessionState === 'function') setTimeout(restoreSessionState, 800);
}

// ══ Sidebar retrátil — Chamados ══
function initChamadosSidebar() {
  const collapsed = localStorage.getItem('chamados-sidebar-collapsed') === '1';
  const sidebar = document.getElementById('chamados-sidebar');
  const icon = document.getElementById('sidebar-toggle-icon');

  // Suprimir transição no carregamento — evita piscar
  if (sidebar) {
    sidebar.classList.add('no-transition');
    if (collapsed) {
      sidebar.classList.add('collapsed');
      if (icon) icon.textContent = '›';
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        sidebar.classList.remove('no-transition');
      });
    });
  }
  if (!currentUser) return;
  const acessos = currentUser.isSuperAdmin
    ? ['chamados', 'materiais', 'inventario', 'configuracoes']
    : (currentUser.acessos || ['chamados']);

  ['materiais', 'inventario'].forEach(mod => {
    const el = document.getElementById('cs-mod-' + mod);
    if (el) el.style.display = acessos.includes(mod) ? 'flex' : 'none';
  });

  const configItem = document.getElementById('cs-mod-config');
  if (configItem) {
    configItem.style.display = (currentUser.isAdmin || currentUser.isSuperAdmin) ? 'flex' : 'none';
  }

  // Preencher rodapé da sidebar
  const avatar = document.getElementById('cs-sidebar-avatar');
  const nameEl = document.getElementById('cs-sidebar-name');
  const roleEl = document.getElementById('cs-sidebar-role');
  if (avatar) avatar.textContent = currentUser.username.charAt(0).toUpperCase();
  if (nameEl) nameEl.textContent = capitalizeName(currentUser.username);
  if (roleEl) roleEl.innerHTML = getSectorBadge(currentUser);
}

function toggleChamadosSidebar() {
  const sidebar = document.getElementById('chamados-sidebar');
  const icon = document.getElementById('sidebar-toggle-icon');
  if (!sidebar) return;
  const isCollapsed = sidebar.classList.toggle('collapsed');
  if (icon) icon.textContent = isCollapsed ? '›' : '‹';
  localStorage.setItem('chamados-sidebar-collapsed', isCollapsed ? '1' : '0');
}