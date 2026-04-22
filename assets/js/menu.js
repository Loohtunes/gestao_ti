// ===== MENU PRINCIPAL — Lógica de navegação =====

let menuCurrentUser = null;

async function initMenu() {
  // Verificar login
  await loadUsers();
  const savedId = localStorage.getItem('chamados-current-user-id');
  if (!savedId) { window.location.href = 'index.html'; return; }

  const user = users.find(u => u.id === savedId);
  if (!user) { window.location.href = 'index.html'; return; }

  menuCurrentUser = user;

  // Aplicar tema salvo
  if (typeof initDarkMode === 'function') initDarkMode();

  // Iniciar timer de sessão
  if (typeof initSessionTimer === 'function') initSessionTimer(user.role);

  // Preencher interface
  applyMenuUI(user);

  // Badge novidades
  if (typeof checkChangelogBadge === 'function') checkChangelogBadge();

  // Inicializar comunicados
  if (typeof initComunicados === 'function') initComunicados();
}

function applyMenuUI(user) {
  // Saudação
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const greetEl = document.getElementById('menu-greeting-title');
  if (greetEl) greetEl.textContent = `${greeting}, ${capitalizeName(user.username)}! 👋`;

  // Iniciar relógio de Brasília
  updateGreetingClock();
  setInterval(updateGreetingClock, 60000);

  // Avatar com inicial do nome
  const avatar = document.getElementById('sidebar-avatar');
  if (avatar) avatar.textContent = user.username.charAt(0).toUpperCase();

  const nameEl = document.getElementById('sidebar-user-name');
  if (nameEl) nameEl.textContent = capitalizeName(user.username);

  const roleEl = document.getElementById('sidebar-user-role');
  if (roleEl) {
    roleEl.textContent = user.isSuperAdmin ? '★ Super Admin'
      : user.isAdmin ? '⚙️ Admin'
      : user.role === 'attendant' ? '🎧 Atendente'
      : '👤 Solicitante';
  }

  // Firebase — só superadmin
  const firebaseBtn = document.getElementById('sync-fab-nav');
  if (firebaseBtn) firebaseBtn.style.display = user.isSuperAdmin ? 'inline-flex' : 'none';

  // Botão publicar novidades — só superadmin
  const changelogManageBtn = document.getElementById('changelog-manage-btn');
  if (changelogManageBtn) changelogManageBtn.style.display = user.isSuperAdmin ? 'flex' : 'none';
}

function updateGreetingClock() {
  const subEl = document.getElementById('menu-greeting-sub');
  if (!subEl) return;
  const now = new Date().toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
  // Capitalizar primeira letra
  subEl.textContent = '// ' + now.charAt(0).toUpperCase() + now.slice(1);
}

function goToChamados() {
  window.location.href = 'index.html';
}

function menuLogout() {
  if (!confirm('Deseja realmente sair do sistema?')) return;
  if (typeof stopSessionTimer === 'function') stopSessionTimer();
  localStorage.removeItem('chamados-current-user-id');
  window.location.href = 'index.html';
}

function menuAutoLogout() {
  if (typeof stopSessionTimer === 'function') stopSessionTimer();
  localStorage.removeItem('chamados-current-user-id');
  window.location.href = 'index.html?reason=inatividade';
}

// Inicializar ao carregar
document.addEventListener('DOMContentLoaded', initMenu);
