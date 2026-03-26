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
  document.getElementById('user-list-container').style.display = 'block';
  document.getElementById('user-form-container').style.display = 'none';
  document.getElementById('user-modal-title').textContent = 'Gerenciamento de Usuários';
  resetUserForm();
  renderUserList();
}

function closeUserModal() {
  document.getElementById('user-modal').classList.remove('open');
  editingUserId = null;
  resetUserForm();
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
  const role     = document.getElementById('user-role-input').value;
  const row      = document.getElementById('user-admin-vip-row');
  const adminGrp = document.getElementById('user-admin-group');
  if (!isSuperAdmin()) {
    if (row) { row.style.display = 'none'; row.style.marginTop = '-0.75rem'; }
    return;
  }
  // Mostrar linha — remove margem negativa que cancela o espaço fantasma
  if (row) { row.style.display = 'grid'; row.style.marginTop = '0.5rem'; }
  // Admin só visível para atendentes
  if (adminGrp) {
    adminGrp.style.display = (role === 'attendant') ? 'flex' : 'none';
    if (role !== 'attendant') document.getElementById('user-admin-input').checked = false;
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
  document.getElementById('user-list-container').style.display = 'none';
  document.getElementById('user-form-container').style.display = 'block';
  document.getElementById('user-modal-title').textContent = 'Novo Usuário';
  resetUserForm();
  document.getElementById('user-pass-input').placeholder = 'Senha (obrigatória)';
  toggleAdminCheckbox(); // garante que VIP apareça para superadmin desde o início
}

function openUserForm(isFirstUser = false) {
  editingUserId = null;
  document.getElementById('user-modal').classList.add('open');
  document.getElementById('user-list-container').style.display = 'none';
  document.getElementById('user-form-container').style.display = 'block';
  document.getElementById('user-modal-title').textContent = isFirstUser ? 'Criar Administrador Geral' : 'Novo Usuário';
  resetUserForm();
  document.getElementById('user-pass-input').placeholder = 'Senha (obrigatória)';
  if (isFirstUser) {
    document.getElementById('user-role-input').value = 'attendant';
    document.getElementById('user-admin-input').checked = true;
    document.getElementById('user-role-group').style.display = 'none';
    document.getElementById('user-admin-group').style.display = 'none';
    const row = document.getElementById('user-admin-vip-row');
    if (row) row.style.display = 'none'; // não mostra na criação do primeiro usuário
  } else {
    toggleAdminCheckbox(); // garante VIP visível para superadmin
  }
}

function openEditUser(userId) {
  const user = users.find(u => u.id === userId);
  if (!user) return;
  if (user.isSuperAdmin && !isSuperAdmin()) { showNotification('Apenas o Administrador Geral pode editar esta conta.', 'error'); return; }
  editingUserId = userId;
  document.getElementById('user-list-container').style.display = 'none';
  document.getElementById('user-form-container').style.display = 'block';
  document.getElementById('user-modal-title').textContent = 'Editar Usuário';
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
    openUserManagerModal();
    showNotification('Usuário atualizado com sucesso.', 'success');
  } else {
    if (users.find(u => u.username === name)) { alert('Esse nome de usuário já existe!'); return; }
    const isFirst = users.length === 0;
    const hashedPass = await hashPassword(passRaw);
    users.push({ id: Date.now().toString(), username: name, password: hashedPass, role, isAdmin: isFirst ? true : isAdmin, isSuperAdmin: isFirst, email, whatsapp, anydesk, setor, isVip: isFirst ? false : isVip });
    saveUsers();
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
    const extras = [u.setor ? `🏢 ${u.setor}` : '', u.anydesk ? `🖥️ ${u.anydesk}` : '', u.email ? `✉️ ${u.email}` : '', u.whatsapp ? `📱 ${u.whatsapp}` : ''].filter(Boolean).join(' · ');
    const superBadge = u.isSuperAdmin ? `<span class="ubadge super">★ Super Admin</span>` : '';
    const adminBadge = !u.isSuperAdmin && u.isAdmin ? `<span class="ubadge admin">Admin</span>` : '';
    const canEdit = isSuperAdmin() || (!u.isSuperAdmin && currentUser?.isAdmin);
    const canRemove = isSuperAdmin() && !u.isSuperAdmin;
    return `<div class="user-list-item" id="uli-${u.id}">
      <div class="uli-summary" onclick="toggleUserDetails('${u.id}')">
        <div class="uli-main"><strong class="uli-name">${u.username}</strong>${superBadge}${adminBadge}<span class="uli-role">· ${roleLabel}</span>${u.setor ? `<span class="uli-setor-tag">🏢 ${u.setor}</span>` : ''}</div>
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
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('tickets-main').style.display = 'block';
  document.getElementById('current-attendant').textContent = user.username;
  document.getElementById('attendant-pass').value = '';
  applyRoleUI();
  loadTickets();
  showNotification(`Bem-vindo(a), ${user.username}! 👋`, 'success');
}

function applyRoleUI() {
  if (!currentUser) return;
  const adminBtn = document.getElementById('admin-shield-btn');
  if (currentUser.isSuperAdmin) { adminBtn.style.display = 'inline-flex'; adminBtn.textContent = '★ Super Admin'; adminBtn.classList.add('super-admin-btn'); }
  else if (currentUser.isAdmin) { adminBtn.style.display = 'inline-flex'; adminBtn.textContent = '⚙️ Configurações'; adminBtn.classList.remove('super-admin-btn'); }
  else { adminBtn.style.display = 'none'; }

  const newTicketBtn   = document.getElementById('new-ticket-btn');
  const filtersWrapper = document.getElementById('tickets-filter');
  if (newTicketBtn) newTicketBtn.style.display = 'inline-flex';

  const isAdmin = !!(currentUser.isAdmin || currentUser.isSuperAdmin);
  const isAttendant = currentUser.role !== 'requester';

  // Dropdown de Ações — visível para atendentes e admins
  // Botao alternar visualizacao
  const viewToggleBtn = document.getElementById('view-toggle-btn');
  if (viewToggleBtn) viewToggleBtn.style.display = isAttendant ? 'flex' : 'none';

  // Botao gerenciar changelog — so super admin
  const changelogManageBtn = document.getElementById('changelog-manage-btn');
  if (changelogManageBtn) changelogManageBtn.style.display = currentUser.isSuperAdmin ? 'flex' : 'none';

  const actionsWrapper = document.getElementById('actions-dropdown-wrapper');
  if (actionsWrapper) actionsWrapper.style.display = isAttendant ? 'block' : 'none';

  // Grupo de testes dentro do dropdown — só para admins
  const testGroup = document.getElementById('test-actions-group');
  if (testGroup) testGroup.style.display = isAdmin ? 'block' : 'none';

  // Aba Testes nos filtros — só para admins
  const testFilterBtn = document.getElementById('filter-btn-test');
  if (testFilterBtn) testFilterBtn.style.display = isAdmin ? 'inline-flex' : 'none';

  if (currentUser.role === 'requester') {
    // Solicitante: mostra filtros próprios, esconde os de atendente
    filtersWrapper.style.display = 'flex';
    document.querySelectorAll('[data-attendant-only]').forEach(b => b.style.display = 'none');
    document.querySelectorAll('[data-requester-filter]').forEach(b => b.style.display = 'inline-flex');
    // Ativa "Meus Chamados" como padrão
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    const myBtn = document.querySelector('[data-requester-filter]');
    if (myBtn) myBtn.classList.add('active');
    currentFilter = 'my-requests';
  } else {
    // Atendente/Admin: mostra todos os filtros de atendente, esconde os de solicitante
    filtersWrapper.style.display = 'flex';
    document.querySelectorAll('[data-attendant-only]').forEach(b => b.style.display = 'inline-flex');
    document.querySelectorAll('[data-requester-filter]').forEach(b => b.style.display = 'none');
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    const firstAttendantBtn = document.querySelector('[data-attendant-only]');
    if (firstAttendantBtn) firstAttendantBtn.classList.add('active');
    currentFilter = 'all';
  }
}

function performLogout() {
  if (!confirm('Deseja realmente sair do sistema?')) return;
  closeTicketDetail();
  if (window._ticketsUnsubscribe) { window._ticketsUnsubscribe(); window._ticketsUnsubscribe = null; }
  currentUser = null;
  localStorage.removeItem('chamados-current-user-id');
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('tickets-main').style.display = 'none';
  document.getElementById('attendant-name').value = '';
  loadUsers().then(() => {
    const hasSA = users.some(u => u.isSuperAdmin);
    document.getElementById('first-user-btn').style.display = (!hasSA) ? 'inline-block' : 'none';
  });
}

async function checkLoginStatus() {
  await loadUsers();
  const hasSuperAdmin = users.some(u => u.isSuperAdmin);
  document.getElementById('first-user-btn').style.display = (!hasSuperAdmin) ? 'inline-block' : 'none';
  const savedId = localStorage.getItem('chamados-current-user-id');
  if (savedId) {
    const fresh = users.find(u => u.id === savedId);
    if (fresh) {
      currentUser = fresh;
      document.getElementById('login-screen').style.display = 'none';
      document.getElementById('tickets-main').style.display = 'block';
      document.getElementById('current-attendant').textContent = currentUser.username;
      applyRoleUI();
      loadTickets();
    } else {
      localStorage.removeItem('chamados-current-user-id');
    }
  }
}
