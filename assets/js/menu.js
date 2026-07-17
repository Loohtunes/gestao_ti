// ===== MENU PRINCIPAL — Lógica de navegação =====

let menuCurrentUser = null;

async function initMenu() {
  // Verificar login
  await loadUsers();
  const savedId = await ensureSession();
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

  // Sidebar retrátil
  initMenuSidebar(user);

  // Inicializar comunicados
  if (typeof initComunicados === 'function') initComunicados();

  // Widgets pessoais (escopo geral) — motor de widgets
  if (typeof renderWidgets === 'function') {
    renderWidgets('geral', document.getElementById('widgets-geral'), user);
  }

  // Alinhar coluna direita com o topo dos comunicados
  requestAnimationFrame(() => {
    const greeting = document.querySelector('.menu-greeting');
    const colRight = document.querySelector('.menu-col-right');
    if (greeting && colRight) {
      const h = greeting.getBoundingClientRect().height;
      const gap = parseFloat(getComputedStyle(document.querySelector('.menu-col-left')).gap) || 24;
      colRight.style.marginTop = (h + gap) + 'px';
    }
  });
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
  if (roleEl) roleEl.innerHTML = getSectorBadge(user);

  // Firebase — só superadmin
  const firebaseBtn = document.getElementById('sync-fab-nav');
  if (firebaseBtn) firebaseBtn.style.display = user.isSuperAdmin ? 'inline-flex' : 'none';

  // Configurações — só admins e superadmin
  const configBtn = document.getElementById('sidebar-config-btn');
  if (configBtn) configBtn.style.display = (user.isAdmin || user.isSuperAdmin) ? 'flex' : 'none';

  // Botão publicar novidades — só superadmin
  const changelogManageBtn = document.getElementById('changelog-manage-btn');
  if (changelogManageBtn) changelogManageBtn.style.display = user.isSuperAdmin ? 'flex' : 'none';

  // Submódulos do T.I — controla visibilidade por acessos
  const acessos = user.isSuperAdmin
    ? ['chamados', 'materiais', 'inventario', 'rotinas']
    : (user.acessos || ['chamados']);

  // Chamados — sempre visível se no T.I
  const subChamados = document.getElementById('sub-chamados');
  if (subChamados) subChamados.style.display = 'flex';

  // Materiais, Inventário e Rotinas — conforme acessos
  ['materiais', 'inventario', 'rotinas'].forEach(mod => {
    const el = document.getElementById('sub-' + mod);
    if (el) el.style.display = (user.isSuperAdmin || acessos.includes(mod)) ? 'flex' : 'none';
  });

  // Módulo Comercial
  const canComercial = user.isSuperAdmin || user.isAdminComercial || user.isComercial ||
    acessos.includes('comercial') || acessos.includes('adminComercial') ||
    acessos.includes('canVerTodasPendencias') || !!user.canVerTodasPendencias;
  const modComercialBtn = document.getElementById('mod-pai-comercial-btn');
  if (modComercialBtn) modComercialBtn.style.display = canComercial ? 'flex' : 'none';

  // Abrir submenu T.I automaticamente ao carregar
  _openModPai('ti');
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

// ── Módulos Pai ──

// Fecha submenu flutuante ao clicar fora
document.addEventListener('click', e => {
  const inSidebar = e.target.closest('.chamados-sidebar');
  if (!inSidebar) {
    document.querySelectorAll('.mod-pai-submenu').forEach(s => {
      s.classList.remove('open-float');
      s.classList.remove('open');
    });
    document.querySelectorAll('.mod-pai-btn').forEach(b => b.classList.remove('open'));
  }
});

async function menuLogout() {
  if (!await showConfirm('Sair do sistema', 'Deseja realmente sair do sistema?', { okText: 'Sair' })) return;
  if (typeof stopSessionTimer === 'function') stopSessionTimer();
  sessionStorage.removeItem('chamados-current-user-id'); if (typeof broadcastLogout === 'function') broadcastLogout();
  window.location.href = 'index.html';
}

// Inicializar ao carregar
document.addEventListener('DOMContentLoaded', initMenu);

// ── Sidebar retrátil — Menu ──
function initMenuSidebar(user) {
  const collapsed = localStorage.getItem('chamados-sidebar-collapsed') === '1';
  const sidebar = document.getElementById('chamados-sidebar');
  const icon = document.getElementById('sidebar-toggle-icon');

  // Suprimir transição no carregamento
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

  // Avatar e nome no rodapé
  const avatar = document.getElementById('sidebar-avatar');
  const nameEl = document.getElementById('sidebar-user-name');
  const roleEl = document.getElementById('sidebar-user-role');
  if (avatar) avatar.textContent = user.username.charAt(0).toUpperCase();
  if (nameEl) nameEl.textContent = capitalizeName(user.username);
  if (roleEl) roleEl.innerHTML = getSectorBadge(user);

  // Módulos por acessos
  const acessos = user.isSuperAdmin
    ? ['chamados', 'materiais', 'inventario', 'rotinas', 'configuracoes']
    : (user.acessos || ['chamados']);

  ['materiais', 'inventario', 'rotinas'].forEach(mod => {
    const el = document.getElementById('sidebar-mod-' + mod);
    if (el) el.style.display = (user.isSuperAdmin || acessos.includes(mod)) ? 'flex' : 'none';
  });

  // Configurações — só admins
  const configBtn = document.getElementById('sidebar-config-btn');
  if (configBtn) configBtn.style.display = (user.isAdmin || user.isSuperAdmin) ? 'flex' : 'none';
}

function toggleMenuSidebar() {
  const sidebar = document.getElementById('chamados-sidebar');
  const icon = document.getElementById('sidebar-toggle-icon');
  if (!sidebar) return;
  const isCollapsed = sidebar.classList.toggle('collapsed');
  if (icon) icon.textContent = isCollapsed ? '›' : '‹';
  localStorage.setItem('chamados-sidebar-collapsed', isCollapsed ? '1' : '0');
}