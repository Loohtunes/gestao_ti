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

  // Alertas de estoque
  loadAlertasEstoque();

  // Alertas Comercial — sempre chamar, permissão verificada dentro
  loadAlertasComercial(user);

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
  const btn     = document.getElementById('mod-pai-' + id + '-btn');
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
  const btn     = document.getElementById('mod-pai-' + id + '-btn');
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

// ══════════════════════════════════════════════════════════════════
// ALERTAS DE ESTOQUE
// ══════════════════════════════════════════════════════════════════
async function loadAlertasEstoque() {
  const section = document.getElementById('alertas-estoque-section');
  const list = document.getElementById('alertas-estoque-list');
  if (!section || !list) return;

  // Apenas admins, superadmin e atendentes visualizam alertas de estoque
  const canSee = menuCurrentUser?.isAdmin ||
    menuCurrentUser?.isSuperAdmin ||
    menuCurrentUser?.role === 'attendant';
  if (!canSee) return;

  try {
    const snap = await db.collection('insumos').get();
    if (snap.empty) return;

    const alertas = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(i => {
        const qtd = i.qtdFisica ?? 0;
        const minimo = i.qtdMinima ?? 0;
        return minimo > 0 && qtd <= minimo;
      })
      .sort((a, b) => {
        // Zerados primeiro, depois por % de estoque
        const pctA = (a.qtdFisica ?? 0) / (a.qtdMinima || 1);
        const pctB = (b.qtdFisica ?? 0) / (b.qtdMinima || 1);
        return pctA - pctB;
      });

    if (alertas.length === 0) return;

    const MAX_VISIBLE = 4;
    const hasMore = alertas.length > MAX_VISIBLE;
    const hidden = alertas.length - MAX_VISIBLE;
    const isUrgent = hidden >= 5;
    const visible = alertas.slice(0, MAX_VISIBLE);

    section.style.display = 'block';

    // Reconstruir header com botão de atalho + badge
    const headerEl = section.querySelector('.alertas-header');
    if (headerEl) {
      const badgeHtml = hasMore ? `
        <span class="alertas-mais-badge ${isUrgent ? 'urgente' : ''}">
          +${alertas.length - MAX_VISIBLE}
          <span class="alertas-pulse ${isUrgent ? 'urgente' : ''}"></span>
        </span>` : '';

      headerEl.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
        Alertas de Estoque
        ${badgeHtml}
        <a href="inventario.html?tab=insumos" class="alertas-ver-btn" title="Ver todos os insumos">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </a>`;
    }

    list.innerHTML = visible.map(i => {
      const qtd = i.qtdFisica ?? 0;
      const minimo = i.qtdMinima ?? 0;
      const zerado = qtd <= 0;
      const cor = zerado ? '#ef4444' : '#f59e0b';
      const bgCor = zerado ? '#fee2e2' : '#fef3c7';
      const label = zerado ? 'Zerado' : 'No limite';
      return `
        <a href="inventario.html?tab=insumos&id=${i.id}" class="alerta-estoque-item">
          <div class="alerta-estoque-icon" style="background:${bgCor};">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${cor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
          </div>
          <div class="alerta-estoque-info">
            <span class="alerta-estoque-nome">${i.nome}</span>
            <span class="alerta-estoque-detalhe">${qtd} ${i.unidade || 'un'} · mín. ${minimo}</span>
          </div>
          <span class="alerta-estoque-badge" style="background:${bgCor};color:${cor};border-color:${cor}44;">${label}</span>
        </a>`;
    }).join('');
  } catch (e) {
    console.error('[Menu] Erro ao carregar alertas de estoque:', e);
  }
}
// ── Alertas Comercial ──────────────────────────────────────────────────────────
function loadAlertasComercial(user) {
  // Verificar permissão
  const canVer = user?.isSuperAdmin || user?.isAdminComercial || user?.isComercial ||
    (user?.acessos||[]).includes('comercial') || (user?.acessos||[]).includes('adminComercial');
  if (!canVer) return;

  const section = document.getElementById('alertas-comercial-section');
  const list    = document.getElementById('alertas-comercial-list');
  if (!section || !list) return;

  // Mostrar seção imediatamente com estado de carregamento
  section.style.display = 'block';
  list.innerHTML = '<div style="font-size:0.75rem;color:var(--muted);padding:0.4rem 0;">Verificando alertas...</div>';

  db.collection('obras').get().then(snap => {
    const hoje  = new Date();
    hoje.setHours(0,0,0,0);
    const hojeStr = hoje.toISOString().slice(0,10);
    const alertas = [];

    snap.docs.forEach(doc => {
      const obra = { id: doc.id, ...doc.data() };
      if (!obra.etapas) return;
      // Ignorar obras concluídas — campo explícito OU todas as etapas ativas finalizadas
      if (obra.concluida) return;
      const ETAPAS_IDS = ['proposta','contrato','documentacoes','aditivos','medicao'];
      const ativas = ETAPAS_IDS.filter(id => obra.etapas[id]?.ativa);
      const todasDone = ativas.length > 0 && ativas.every(id => obra.etapas[id]?.status === 'done');
      if (todasDone) return;

      // ── Prazo geral ───────────────────────────────────────────────
      if (obra.prazoEstimado) {
        const prazoDate = new Date(obra.prazoEstimado + 'T12:00:00');
        const diffMs    = prazoDate.getTime() - hoje.getTime();
        const diff      = Math.ceil(diffMs / (1000*60*60*24));

        if (diff < 0) {
          alertas.push({ tipo:'vencido', id:obra.id,
            numero: obra.numero || doc.id.slice(-6),
            nome:   obra.nome,
            msg:    `Prazo vencido há ${Math.abs(diff)} dia${Math.abs(diff)!==1?'s':''}` });
        } else if (diff <= 7) {
          alertas.push({ tipo:'vencendo', id:obra.id,
            numero: obra.numero || doc.id.slice(-6),
            nome:   obra.nome,
            msg:    diff === 0 ? 'Vence hoje!' : `Vencendo em ${diff} dia${diff!==1?'s':''}` });
        }
      }

      // ── Sub-etapas atrasadas ──────────────────────────────────────
      const ORDEM = ['proposta','contrato','documentacoes','aditivos','medicao'];
      const NOMES = { proposta:'Proposta', contrato:'Contrato', documentacoes:'Documentações', aditivos:'Aditivos', medicao:'Medição' };
      ORDEM.forEach(etapaId => {
        const e = obra.etapas?.[etapaId];
        if (!e?.ativa || e.status === 'done') return;
        let temAtraso = false;
        if (Array.isArray(e.lista)) {
          // isLista: aditivos, medicao
          temAtraso = e.lista.some(item =>
            Object.values(item.subEtapas||{}).some(sub => sub.status!=='done' && sub.dataLimite && sub.dataLimite < hojeStr)
          );
        } else {
          temAtraso = Object.values(e.subEtapas || {}).some(
            sub => sub.status !== 'done' && sub.dataLimite && sub.dataLimite < hojeStr
          );
        }
        if (temAtraso) {
          alertas.push({ tipo:'atrasada', id:obra.id,
            numero: obra.numero || doc.id.slice(-6),
            nome:   obra.nome,
            msg:    `${NOMES[etapaId]} em atraso` });
        }
      });
    });

    if (!alertas.length) {
      list.innerHTML = '<div style="font-size:0.75rem;color:var(--muted);padding:0.5rem 0;">✓ Sem alertas no momento</div>';
      return;
    }

    // Deduplicar por obra — manter alerta mais crítico
    const mapa = new Map();
    alertas.forEach(a => {
      if (!mapa.has(a.id) || a.tipo === 'vencido') mapa.set(a.id, a);
    });
    const uniq = [...mapa.values()];

    list.innerHTML = uniq.slice(0,6).map(a => {
      const cor   = a.tipo === 'vencido' || a.tipo === 'atrasada' ? '#ef4444' : '#f59e0b';
      const bgCor = a.tipo === 'vencido' || a.tipo === 'atrasada' ? '#fee2e2' : '#fef3c7';
      return `<a href="comercial.html?obra=${a.id}" class="alerta-estoque-item" style="border-left:3px solid ${cor};">
        <div class="alerta-estoque-icon" style="background:${bgCor};">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${cor}" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <rect width="20" height="14" x="2" y="7" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
          </svg>
        </div>
        <div class="alerta-estoque-info">
          <span class="alerta-estoque-nome">${a.nome}</span>
          <span class="alerta-estoque-detalhe">#${a.numero} · ${a.msg}</span>
        </div>
        <span class="alerta-estoque-badge" style="background:${bgCor};color:${cor};border-color:${cor}44;">${a.tipo==='vencido'?'Vencido':a.tipo==='atrasada'?'Atrasada':'Urgente'}</span>
      </a>`;
    }).join('');

    if (uniq.length > 6) {
      list.innerHTML += `<a href="comercial.html" style="display:block;font-size:0.72rem;color:var(--accent);text-align:center;padding:0.35rem;text-decoration:none;">+${uniq.length-6} mais — ver em Comercial</a>`;
    }
  }).catch(e => {
    console.error('[Alertas Comercial]', e);
    list.innerHTML = `<div style="font-size:0.72rem;color:#ef4444;padding:0.4rem 0;">Erro ao carregar alertas: ${e.code||e.message||'?'}</div>`;
  });
}