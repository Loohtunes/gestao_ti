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
function toggleModPai(id) {
  const isCollapsed = document.getElementById('chamados-sidebar')?.classList.contains('collapsed');
  if (isCollapsed) {
    _toggleModPaiFloat(id);
  } else {
    _openModPai(id);
  }
}

function _openModPai(id) {
  const btn = document.getElementById('mod-pai-' + id + '-btn');
  const submenu = document.getElementById('mod-pai-' + id + '-submenu');
  if (!btn || !submenu) return;
  const isOpen = submenu.classList.contains('open');
  // Fecha todos os outros
  document.querySelectorAll('.mod-pai-submenu').forEach(s => s.classList.remove('open'));
  document.querySelectorAll('.mod-pai-btn').forEach(b => b.classList.remove('open'));
  if (!isOpen) {
    submenu.classList.add('open');
    btn.classList.add('open');
  }
}

function _toggleModPaiFloat(id) {
  const btn = document.getElementById('mod-pai-' + id + '-btn');
  const submenu = document.getElementById('mod-pai-' + id + '-submenu');
  if (!btn || !submenu) return;
  // Posiciona o float ao lado do botão
  const rect = btn.getBoundingClientRect();
  submenu.style.top = rect.top + 'px';
  const isOpen = submenu.classList.contains('open-float');
  // Fecha todos
  document.querySelectorAll('.mod-pai-submenu').forEach(s => s.classList.remove('open-float'));
  if (!isOpen) submenu.classList.add('open-float');
}

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