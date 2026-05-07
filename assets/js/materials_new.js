// ===== MATERIALS NEW — Página materiais.html =====

// ── Sidebar retrátil ──
function toggleMenuSidebar() {
  const sidebar = document.getElementById('chamados-sidebar');
  const icon = document.getElementById('sidebar-toggle-icon');
  if (!sidebar) return;
  const isCollapsed = sidebar.classList.toggle('collapsed');
  if (icon) icon.textContent = isCollapsed ? '›' : '‹';
  localStorage.setItem('chamados-sidebar-collapsed', isCollapsed ? '1' : '0');
}

// ── Estado ──
let matMaterials = [];
let matFilter = 'all';
let matSearch = '';
let matUnsubscribe = null;
let matDetailUnsub = null;
let matSearchOpen = false;
let matActiveId = null;
let matJustifCallback = null;
let matPage = 1;
const MAT_PER_PAGE = 20; // 5 colunas × 4 linhas

// ── Mapa de status (nome diferente de MAT_STATUS que existe no state.js) ──
const MATERIAIS_STATUS = {
  'solicitado': { label: 'Solicitado', cls: 'msb-solicitado' },
  'visto': { label: 'Visto', cls: 'msb-visto' },
  'reservado': { label: 'Reservado', cls: 'msb-reservado' },
  'em-compra': { label: 'Em Compra', cls: 'msb-em-compra' },
  'ag-confirm': { label: 'Ag. Confirmação', cls: 'msb-ag-confirm' },
  'entregue': { label: 'Entregue', cls: 'msb-entregue' },
  'cancelado': { label: 'Cancelado', cls: 'msb-cancelado' },
  'recusado': { label: 'Recusado', cls: 'msb-recusado' },
  'proc-troca': { label: 'Proc. de Troca', cls: 'msb-proc-troca' },
  'garantia': { label: 'Garantia', cls: 'msb-garantia' },
};

// ── Unidades ──
const MAT_UNITS = {
  'un': 'un.',
  'm': 'm',
  'pct': 'pct.',
  'cx': 'cx.',
};

// ───────────────────────────────────────────
//  INIT
// ───────────────────────────────────────────

async function _initMateriaisPage() {
  await loadUsers();

  const savedId = localStorage.getItem('chamados-current-user-id');
  if (!savedId) { window.location.href = 'login.html'; return; }

  const user = users.find(u => u.id === savedId);
  if (!user) { window.location.href = 'login.html'; return; }

  currentUser = user;

  const acessos = user.isSuperAdmin
    ? ['chamados', 'materiais', 'inventario', 'configuracoes']
    : (user.acessos || ['chamados']);

  if (!acessos.includes('materiais')) {
    window.location.href = 'menu.html';
    return;
  }

  if (typeof initDarkMode === 'function') initDarkMode();
  if (typeof initSessionTimer === 'function') initSessionTimer(user.role);

  // Sidebar
  const collapsed = localStorage.getItem('chamados-sidebar-collapsed') === '1';
  const sidebar = document.getElementById('chamados-sidebar');
  const toggleIcon = document.getElementById('sidebar-toggle-icon');
  if (sidebar) {
    sidebar.classList.add('no-transition');
    if (collapsed) { sidebar.classList.add('collapsed'); if (toggleIcon) toggleIcon.textContent = '›'; }
    requestAnimationFrame(() => requestAnimationFrame(() => sidebar.classList.remove('no-transition')));
  }

  const syncBtn = document.getElementById('sync-fab-nav');
  const configBtn = document.getElementById('sidebar-config-btn');
  if (syncBtn) syncBtn.style.display = user.isSuperAdmin ? 'flex' : 'none';
  if (configBtn) configBtn.style.display = (user.isAdmin || user.isSuperAdmin) ? 'flex' : 'none';

  ['materiais', 'inventario'].forEach(mod => {
    const el = document.getElementById('cs-mod-' + mod);
    if (el) el.style.display = acessos.includes(mod) ? 'flex' : 'none';
  });

  const avatar = document.getElementById('mat-sidebar-avatar');
  const name = document.getElementById('mat-sidebar-name');
  const role = document.getElementById('mat-sidebar-role');
  if (avatar) avatar.textContent = user.username.charAt(0).toUpperCase();
  if (name) name.textContent = user.username;
  if (role) role.textContent = user.setor || (user.role === 'attendant' ? 'Atendente' : 'Solicitante');

  matLoadMaterials();
}

document.addEventListener('DOMContentLoaded', _initMateriaisPage);

function matLogout() {
  if (!confirm('Deseja realmente sair do sistema?')) return;
  if (typeof stopSessionTimer === 'function') stopSessionTimer();
  if (matUnsubscribe) { matUnsubscribe(); matUnsubscribe = null; }
  if (matDetailUnsub) { matDetailUnsub(); matDetailUnsub = null; }
  localStorage.removeItem('chamados-current-user-id');
  window.location.href = 'login.html';
}

// ───────────────────────────────────────────
//  FIRESTORE — Lista
// ───────────────────────────────────────────

function matLoadMaterials() {
  if (matUnsubscribe) matUnsubscribe();

  matUnsubscribe = db.collection('materials')
    .orderBy('createdAt', 'desc')
    .onSnapshot(snap => {
      matMaterials = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      matUpdateStats();
      matRenderCards();
    }, err => {
      console.error('[Mat] Erro Firestore:', err);
      const grid = document.getElementById('mat-grid');
      if (grid) grid.innerHTML = `
        <div class="mat-empty">
          <div class="mat-empty-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
          <div class="mat-empty-text">Erro ao carregar materiais</div>
          <div class="mat-empty-hint">Verifique as regras do Firestore ou a conexão</div>
        </div>`;
    });
}

async function matGetNextNumber() {
  const year = new Date().getFullYear().toString().slice(-2);
  try {
    const snap = await db.collection('materials').get();
    const nums = snap.docs
      .map(d => d.data().number || '')
      .filter(n => n.endsWith('/' + year))
      .map(n => parseInt(n.replace('M', '').split('/')[0]) || 0);
    const next = nums.length ? Math.max(...nums) + 1 : 1;
    return `M${String(next).padStart(4, '0')}/${year}`;
  } catch (e) {
    return `M0001/${year}`;
  }
}

// ───────────────────────────────────────────
//  STATS
// ───────────────────────────────────────────

function matUpdateStats() {
  const s = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  s('mat-stat-solicitados', matMaterials.filter(m => m.status === 'solicitado').length);
  s('mat-stat-andamento', matMaterials.filter(m => ['visto', 'reservado'].includes(m.status)).length);
  s('mat-stat-em-compra', matMaterials.filter(m => m.status === 'em-compra').length);
  s('mat-stat-entregues', matMaterials.filter(m => m.status === 'entregue').length);
  s('mat-stat-cancelados', matMaterials.filter(m => ['cancelado', 'recusado'].includes(m.status)).length);
}

// ───────────────────────────────────────────
//  FILTROS E BUSCA
// ───────────────────────────────────────────

function matToggleStatusDropdown() {
  const btn = document.getElementById('mat-status-dropdown-btn');
  const menu = document.getElementById('mat-status-dropdown-menu');
  if (!btn || !menu) return;
  const isOpen = menu.classList.toggle('open');
  btn.classList.toggle('open', isOpen);
}

// Fecha dropdown ao clicar fora
document.addEventListener('click', e => {
  const wrap = document.getElementById('mat-status-dropdown-wrap');
  if (wrap && !wrap.contains(e.target)) {
    document.getElementById('mat-status-dropdown-menu')?.classList.remove('open');
    document.getElementById('mat-status-dropdown-btn')?.classList.remove('open');
  }
});

function matSetFilter(filter, el) {
  matFilter = filter;

  // Atualiza itens do dropdown
  document.querySelectorAll('.mat-status-dropdown-item').forEach(i => i.classList.remove('active'));
  if (el) el.classList.add('active');

  // Atualiza label e estado do botão
  const label = document.getElementById('mat-status-dropdown-label');
  const btn = document.getElementById('mat-status-dropdown-btn');
  const isAll = filter === 'all';
  if (label) label.textContent = el?.dataset.label || 'Todos os status';
  if (btn) btn.classList.toggle('active', !isAll);

  // Fecha o dropdown
  document.getElementById('mat-status-dropdown-menu')?.classList.remove('open');
  document.getElementById('mat-status-dropdown-btn')?.classList.remove('open');

  matPage = 1;
  matRenderCards();
}

function matToggleSearch() {
  matSearchOpen = !matSearchOpen;
  const wrap = document.getElementById('mat-search-wrap');
  const input = document.getElementById('mat-search-input');
  if (wrap) wrap.classList.toggle('open', matSearchOpen);
  if (input) {
    if (matSearchOpen) { input.focus(); }
    else { input.value = ''; matSearch = ''; matRenderCards(); }
  }
}

function matOnSearch(val) {
  matSearch = val.toLowerCase().trim();
  matPage = 1;
  matRenderCards();
}

// ───────────────────────────────────────────
//  RENDER CARDS
// ───────────────────────────────────────────

function matRenderCards() {
  const grid = document.getElementById('mat-grid');
  if (!grid) return;

  let list = [...matMaterials];
  if (matFilter !== 'all') list = list.filter(m => m.status === matFilter);
  if (matSearch) {
    list = list.filter(m =>
      (m.title || '').toLowerCase().includes(matSearch) ||
      (m.number || '').toLowerCase().includes(matSearch) ||
      (m.setor || '').toLowerCase().includes(matSearch) ||
      (m.requesterName || '').toLowerCase().includes(matSearch)
    );
  }

  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / MAT_PER_PAGE));
  if (matPage > totalPages) matPage = totalPages;

  const start = (matPage - 1) * MAT_PER_PAGE;
  const paged = list.slice(start, start + MAT_PER_PAGE);

  if (!total) {
    grid.innerHTML = `
      <div class="mat-empty" style="grid-column:1/-1;">
        <div class="mat-empty-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0
            0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/>
          <path d="M12 22V12"/>
          <path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"/>
        </svg></div>
        <div class="mat-empty-text">Nenhuma solicitação encontrada</div>
        <div class="mat-empty-hint">Tente outro filtro ou crie uma nova solicitação</div>
      </div>`;
    matRenderPagination(0, 1);
    return;
  }

  grid.innerHTML = paged.map(matBuildCard).join('');
  matRenderPagination(total, totalPages);
}

function matRenderPagination(total, totalPages) {
  // Remove paginação anterior se existir
  const old = document.getElementById('mat-pagination');
  if (old) old.remove();
  if (totalPages <= 1 && total <= MAT_PER_PAGE) return;

  const start = (matPage - 1) * MAT_PER_PAGE + 1;
  const end = Math.min(matPage * MAT_PER_PAGE, total);

  // Gerar botões de página (máx 5 visíveis)
  let pagesBtns = '';
  const range = 2;
  for (let p = 1; p <= totalPages; p++) {
    const isActive = p === matPage;
    const show = p === 1 || p === totalPages
      || (p >= matPage - range && p <= matPage + range);

    if (!show) {
      if (p === matPage - range - 1 || p === matPage + range + 1) {
        pagesBtns += `<span style="color:var(--muted);font-size:0.7rem;padding:0 2px;">…</span>`;
      }
      continue;
    }

    pagesBtns += `<button class="mat-page-btn ${isActive ? 'active' : ''}"
      onclick="matGoToPage(${p})">${p}</button>`;
  }

  const pag = document.createElement('div');
  pag.id = 'mat-pagination';
  pag.className = 'mat-pagination';
  pag.innerHTML = `
    <span class="mat-pagination-info">${start}–${end} de ${total} solicitações</span>
    <div class="mat-pagination-btns">
      <button class="mat-page-arrow" onclick="matGoToPage(${matPage - 1})"
        ${matPage === 1 ? 'disabled' : ''}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m15 18-6-6 6-6"/>
        </svg>
      </button>
      ${pagesBtns}
      <button class="mat-page-arrow" onclick="matGoToPage(${matPage + 1})"
        ${matPage === totalPages ? 'disabled' : ''}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m9 18 6-6-6-6"/>
        </svg>
      </button>
    </div>`;

  document.getElementById('mat-grid').after(pag);
}

function matGoToPage(page) {
  const totalPages = Math.ceil(
    matMaterials.filter(m =>
      (matFilter === 'all' || m.status === matFilter) &&
      (!matSearch || (m.title || '').toLowerCase().includes(matSearch) ||
        (m.number || '').toLowerCase().includes(matSearch))
    ).length / MAT_PER_PAGE
  );
  if (page < 1 || page > totalPages) return;
  matPage = page;
  matRenderCards();
  document.querySelector('.config-content')?.scrollTo({ top: 0, behavior: 'smooth' });
}

function matBuildCard(m) {
  const st = MATERIAIS_STATUS[m.status] || { label: m.status, cls: 'msb-solicitado' };
  const dateStr = m.needByDate
    ? new Date(m.needByDate + 'T12:00:00').toLocaleDateString('pt-BR') : null;

  const qtyBadge = m.qty ? `<span class="mat-badge-qty">
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round">
      <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0
        0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/>
      <path d="M12 22V12"/>
      <path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"/>
    </svg> ${m.qty} ${matEsc(MAT_UNITS[m.unit] || m.unitText || 'un.')}
  </span>` : '';

  const dateBadge = dateStr ? `<span class="mat-badge-date">
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
      <line x1="16" x2="16" y1="2" y2="6"/>
      <line x1="8" x2="8" y1="2" y2="6"/>
      <line x1="3" x2="21" y1="10" y2="10"/>
    </svg> ${dateStr}
  </span>` : '';

  return `
    <div class="mat-card" onclick="matOpenDetail('${m.id}')">
      <div class="mat-card-top">
        <span class="mat-status-badge ${st.cls}">● ${st.label}</span>
        <span class="mat-card-num">${matEsc(m.number || '')}</span>
      </div>
      <div class="mat-card-title">${matEsc(m.title || 'Sem título')}</div>
      <div class="mat-card-badges">${qtyBadge}${dateBadge}</div>
      <div class="mat-card-divider"></div>
      <div class="mat-card-footer">
        <div class="mat-card-people">
          <div class="mat-card-person"><span class="lbl">Setor</span>${matEsc(m.setor || '—')}</div>
          <div class="mat-card-person"><span class="lbl">Solicitante</span>${matEsc(m.requesterName || '—')}</div>
        </div>
        <div class="mat-card-time">${matTimeAgo(m.createdAt)}</div>
      </div>
    </div>`;
}

// ───────────────────────────────────────────
//  MODAL NOVA SOLICITAÇÃO
// ───────────────────────────────────────────

function matOpenNew() {
  document.getElementById('mat-new-title').value = '';
  document.getElementById('mat-new-desc').value = '';
  document.getElementById('mat-new-qty').value = '';
  document.getElementById('mat-new-unit').value = 'un';
  document.getElementById('mat-new-setor').value = currentUser?.setor || '';
  document.getElementById('mat-new-date').value = '';

  // Setor bloqueado se usuário já tem setor e não é superadmin
  const setorInput = document.getElementById('mat-new-setor');
  setorInput.disabled = !!(currentUser?.setor && !currentUser?.isSuperAdmin);

  document.getElementById('mat-new-modal').classList.add('open');
  setTimeout(() => document.getElementById('mat-new-title').focus(), 80);
}

function matCloseNew() {
  document.getElementById('mat-new-modal').classList.remove('open');
}

async function matSaveNew() {
  const title = document.getElementById('mat-new-title').value.trim();
  const desc = document.getElementById('mat-new-desc').value.trim();
  const qty = parseInt(document.getElementById('mat-new-qty').value) || 0;
  const unit = document.getElementById('mat-new-unit').value;
  const setor = document.getElementById('mat-new-setor').value.trim();
  const date = document.getElementById('mat-new-date').value;

  if (!title) { matToast('Informe o título do material.', 'error'); return; }
  if (!qty || qty < 1) { matToast('Informe uma quantidade válida.', 'error'); return; }

  const btn = document.getElementById('mat-new-save-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Salvando...'; }

  try {
    const number = await matGetNextNumber();
    const now = new Date();

    const doc = {
      number,
      title,
      description: desc || '',
      qty,
      unit,
      unitText: MAT_UNITS[unit] || unit,
      setor: setor || currentUser?.setor || '',
      needByDate: date || null,
      status: 'solicitado',
      requesterId: currentUser.id,
      requesterName: currentUser.username,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      history: [{
        action: 'Solicitação criada',
        user: matCapitalize(currentUser.username),
        role: currentUser.isSuperAdmin ? 'superadmin' : (currentUser.role || 'requester'),
        ts: now.toLocaleString('pt-BR', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        })
      }]
    };

    await db.collection('materials').add(doc);
    matCloseNew();
    matToast(`Solicitação ${number} criada com sucesso!`, 'success');
  } catch (e) {
    console.error('[Mat] Erro ao criar solicitação:', e);
    matToast('Erro ao criar solicitação. Tente novamente.', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Enviar Solicitação'; }
  }
}

// ───────────────────────────────────────────
//  MODAL DETALHE
// ───────────────────────────────────────────

function matOpenDetail(id) {
  const m = matMaterials.find(x => x.id === id);
  if (!m) return;

  matActiveId = id;
  document.getElementById('mat-detail-modal').classList.add('open');
  matRenderDetail(m);

  // Marcar como "Visto" automaticamente se atendente abrir pela 1ª vez
  const isAttendant = currentUser?.role === 'attendant' || currentUser?.isAdmin || currentUser?.isSuperAdmin;
  if (isAttendant && m.status === 'solicitado') {
    matTransitionStatus(id, 'visto', 'Visualizado por ' + matCapitalize(currentUser.username), null, true);
  }

  // Listener em tempo real
  if (matDetailUnsub) matDetailUnsub();
  matDetailUnsub = db.collection('materials').doc(id).onSnapshot(snap => {
    if (!snap.exists) return;
    const fresh = { id: snap.id, ...snap.data() };
    const idx = matMaterials.findIndex(x => x.id === id);
    if (idx !== -1) matMaterials[idx] = fresh;
    if (matActiveId === id) matRenderDetail(fresh);
  });
}

function matCloseDetail() {
  matActiveId = null;
  if (matDetailUnsub) { matDetailUnsub(); matDetailUnsub = null; }
  document.getElementById('mat-detail-modal').classList.remove('open');
}

function matRenderDetail(m) {
  const st = MATERIAIS_STATUS[m.status] || { label: m.status, cls: 'msb-solicitado' };

  // Header
  const numEl = document.getElementById('mat-detail-num');
  const badgeEl = document.getElementById('mat-detail-status-badge');
  if (numEl) numEl.textContent = m.number || '—';
  if (badgeEl) { badgeEl.textContent = '● ' + st.label; badgeEl.className = 'mat-status-badge ' + st.cls; }

  // Título
  const titleEl = document.getElementById('mat-detail-title');
  if (titleEl) titleEl.textContent = m.title || 'Sem título';

  // Descrição
  const descEl = document.getElementById('mat-detail-desc');
  if (descEl) {
    if (m.description) {
      descEl.textContent = m.description;
      descEl.style.display = 'block';
    } else {
      descEl.style.display = 'none';
    }
  }

  // Meta
  const metaEl = document.getElementById('mat-detail-meta');
  if (metaEl) {
    const dateStr = m.needByDate
      ? new Date(m.needByDate + 'T12:00:00').toLocaleDateString('pt-BR') : null;
    const criado = m.createdAt?.toDate
      ? m.createdAt.toDate().toLocaleDateString('pt-BR') : '—';

    metaEl.innerHTML = `
      ${m.qty ? matMetaItem('Quantidade', `${m.qty} ${MAT_UNITS[m.unit] || m.unitText || 'un.'}`) : ''}
      ${matMetaItem('Setor', m.setor || '—')}
      ${matMetaItem('Solicitante', matCapitalize(m.requesterName || '—'))}
      ${dateStr ? matMetaItem('Necessário até', dateStr) : ''}
      ${matMetaItem('Criado em', criado)}
      ${m.attendantName ? matMetaItem('Atendente', matCapitalize(m.attendantName)) : ''}
      ${m.justification ? matMetaItem('Justificativa', m.justification, true) : ''}
    `;
  }

  // Botões de ação
  const actionsEl = document.getElementById('mat-detail-actions');
  if (actionsEl) actionsEl.innerHTML = matBuildActions(m);

  // Seção de vínculo com inventário
  matUpdateInsumoSection(m);

  // Histórico
  const histEl = document.getElementById('mat-detail-hist-body');
  if (histEl) histEl.innerHTML = matRenderHistory(m);
}

function matMetaItem(label, value, full = false) {
  return `<div class="mat-meta-item ${full ? 'mat-meta-full' : ''}">
    <div class="mat-meta-label">${label}</div>
    <div class="mat-meta-value">${matEsc(value)}</div>
  </div>`;
}

function matBuildActions(m) {
  const isAttendant = currentUser?.role === 'attendant' || currentUser?.isAdmin || currentUser?.isSuperAdmin;
  const isRequester = currentUser?.id === m.requesterId || currentUser?.username === m.requesterName;
  const s = m.status;

  let btns = [];

  // ── AÇÕES DO ATENDENTE ──
  if (isAttendant) {
    if (s === 'visto') {
      btns.push(matActionBtn('Reservar Estoque', 'reservado', '#f97316', 'reservado'));
      btns.push(matActionBtn('Iniciar Compra', 'em-compra', '#eab308', 'shopping-cart'));
      btns.push(matActionBtn('Recusar', 'recusado', '#f43f5e', 'x-circle', true));
    }
    if (s === 'reservado') {
      // Material já em estoque — vai direto para aguardar confirmação do solicitante
      btns.push(matActionBtn('Ag. Confirmação', 'ag-confirm', '#22c55e', 'clock'));
      btns.push(matActionBtn('Cancelar', 'cancelado', '#ef4444', 'x-circle', true));
    }
    if (s === 'em-compra') {
      btns.push(matActionBtn('Aguardar Confirmação', 'ag-confirm', '#22c55e', 'clock'));
      btns.push(matActionBtn('Cancelar', 'cancelado', '#ef4444', 'x-circle', true));
    }
    // ag-confirm: atendente só aguarda — quem confirma é o solicitante
    if (['proc-troca', 'garantia'].includes(s)) {
      btns.push(matActionBtn('Retornar p/ Em Compra', 'em-compra', '#eab308', 'shopping-cart'));
    }
  }

  // ── AÇÕES DO SOLICITANTE ──
  if (isRequester) {
    if (['solicitado', 'visto', 'reservado', 'em-compra'].includes(s)) {
      btns.push(matActionBtn('Cancelar Pedido', 'cancelado', '#ef4444', 'x-circle', true));
    }
    if (s === 'ag-confirm') {
      // Solicitante confirma o recebimento
      btns.push(matActionBtn('Confirmar Recebimento', 'entregue', '#16a34a', 'check-circle'));
    }
    if (s === 'entregue') {
      // Pós-entrega: solicitante pode relatar problema
      btns.push(matActionBtn('Proc. de Troca', 'proc-troca', '#06b6d4', 'refresh-cw', true));
      btns.push(matActionBtn('Acionar Garantia', 'garantia', '#7c3aed', 'shield', true));
    }
  }

  if (!btns.length) return '';

  return `<div class="mat-actions-row">${btns.join('')}</div>`;
}

function matActionBtn(label, targetStatus, color, _icon, needsJustif = false) {
  const justifArg = needsJustif ? 'true' : 'false';
  return `<button class="mat-action-btn" style="--btn-color:${color}"
    onclick="matRequestTransition('${matActiveId}','${targetStatus}',${justifArg})">${label}</button>`;
}

// ───────────────────────────────────────────
//  TRANSIÇÕES DE STATUS
// ───────────────────────────────────────────

const TRANSITION_LABELS = {
  'visto': 'Visualizado',
  'reservado': 'Estoque reservado',
  'em-compra': 'Em processo de compra',
  'ag-confirm': 'Entregue — aguardando confirmação',
  'entregue': 'Entrega confirmada',
  'cancelado': 'Cancelado',
  'recusado': 'Recusado',
  'proc-troca': 'Processo de troca iniciado',
  'garantia': 'Garantia acionada',
};

const JUSTIF_CONFIG = {
  'cancelado': { title: 'Cancelar Solicitação', desc: 'Por que este pedido está sendo cancelado?' },
  'recusado': { title: 'Recusar Solicitação', desc: 'Por que este pedido está sendo recusado?' },
  'proc-troca': { title: 'Processo de Troca', desc: 'Descreva o problema encontrado com o material.' },
  'garantia': { title: 'Acionar Garantia', desc: 'Descreva o defeito ou problema para acionar a garantia.' },
};

function matRequestTransition(id, targetStatus, needsJustif) {
  if (needsJustif) {
    const cfg = JUSTIF_CONFIG[targetStatus] || { title: 'Justificativa', desc: 'Informe o motivo.' };
    matOpenJustif(cfg.title, cfg.desc, (justif) => {
      matTransitionStatus(id, targetStatus, TRANSITION_LABELS[targetStatus] || targetStatus, justif);
    });
  } else {
    matTransitionStatus(id, targetStatus, TRANSITION_LABELS[targetStatus] || targetStatus, null);
  }
}

async function matTransitionStatus(id, newStatus, actionLabel, justification = null, silent = false) {
  const m = matMaterials.find(x => x.id === id);
  if (!m) return;

  // ── Operações de estoque ──
  if (newStatus === 'reservado') {
    const ok = await matReserveStock(m);
    if (!ok) return; // bloqueado por estoque insuficiente
  }
  if (newStatus === 'entregue') {
    await matDeliverStock(m);
  }
  if (['cancelado', 'recusado'].includes(newStatus)) {
    await matReleaseStock(m); // devolve disponível se estava reservado
  }

  const now = new Date();
  const tsStr = now.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
  const userName = matCapitalize(currentUser?.username || 'Sistema');
  const userRole = currentUser?.isSuperAdmin ? 'superadmin' : (currentUser?.role || 'requester');

  const histEntry = {
    action: actionLabel + (justification ? ` — "${justification}"` : ''),
    user: userName,
    role: userRole,
    ts: tsStr
  };

  const updates = {
    status: newStatus,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    history: firebase.firestore.FieldValue.arrayUnion(histEntry),
  };

  if (justification) updates.justification = justification;

  const isAttAction = ['visto', 'reservado', 'em-compra', 'ag-confirm', 'entregue', 'recusado'].includes(newStatus);
  if (isAttAction && !m.attendantName) {
    updates.attendantName = currentUser.username;
    updates.attendantId = currentUser.id;
  }

  try {
    await db.collection('materials').doc(id).update(updates);
    if (!silent) matToast(`Status atualizado: ${TRANSITION_LABELS[newStatus] || newStatus}`, 'success');
  } catch (e) {
    console.error('[Mat] Erro ao atualizar status:', e);
    matToast('Erro ao atualizar status.', 'error');
  }
}

// ───────────────────────────────────────────
//  MODAL JUSTIFICATIVA
// ───────────────────────────────────────────

function matOpenJustif(title, desc, callback) {
  matJustifCallback = callback;
  document.getElementById('mat-justif-title').textContent = title;
  document.getElementById('mat-justif-desc').textContent = desc;
  document.getElementById('mat-justif-input').value = '';
  document.getElementById('mat-justif-modal').classList.add('open');
  setTimeout(() => document.getElementById('mat-justif-input').focus(), 80);
}

function matCloseJustif() {
  matJustifCallback = null;
  document.getElementById('mat-justif-modal').classList.remove('open');
}

function matConfirmJustif() {
  const justif = document.getElementById('mat-justif-input').value.trim();
  if (!justif) { matToast('Informe o motivo antes de confirmar.', 'error'); return; }
  const cb = matJustifCallback;
  matCloseJustif();
  if (cb) cb(justif);
}

// ───────────────────────────────────────────
//  HISTÓRICO
// ───────────────────────────────────────────

function matRenderHistory(m) {
  const log = m.history || [];
  if (!log.length) return '<div class="hist-empty">Nenhum registro ainda.</div>';

  return [...log].reverse().map(e => {
    const roleLabel = (e.role === 'superadmin' || e.role === 'attendant') ? 'Atendente' : 'Solicitante';
    return `<div class="hist-entry">
      <div class="hist-icon">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
        </svg>
      </div>
      <div class="hist-body">
        <div class="hist-action">${matEsc(e.action)}</div>
        <div class="hist-meta">
          <span class="hist-user">${matEsc(e.user)}</span>
          <span class="hist-role ${matEsc(e.role)}">${roleLabel}</span>
          <span class="hist-ts">${matEsc(e.ts)}</span>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ───────────────────────────────────────────
//  UTILS
// ───────────────────────────────────────────

function matEsc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function matCapitalize(str) {
  return String(str || '').replace(/\b\w/g, c => c.toUpperCase());
}

function matTimeAgo(ts) {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return 'agora';
  if (diff < 3600) return `há ${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`;
  if (diff < 86400 * 30) return `há ${Math.floor(diff / 86400)}d`;
  return date.toLocaleDateString('pt-BR');
}

function matToast(msg, type = 'success') {
  if (typeof showNotification === 'function') {
    showNotification(msg, type);
  } else {
    const el = document.getElementById('mat-toast');
    if (!el) return;
    el.textContent = msg;
    el.className = `mat-toast ${type} show`;
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 3000);
  }
}

// ───────────────────────────────────────────
//  VÍNCULO COM INVENTÁRIO
// ───────────────────────────────────────────

let _matInsumos = [];      // cache de insumos carregado uma vez por sessão
let _matSearchTimer = null;   // debounce da busca

// Carrega insumos do Firestore (uma vez por sessão)
async function matLoadInsumos() {
  if (_matInsumos.length) return _matInsumos;
  try {
    const snap = await db.collection('insumos').get();
    _matInsumos = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR'));
  } catch (e) {
    console.error('[Mat] Erro ao carregar insumos:', e);
  }
  return _matInsumos;
}

// Exibe / oculta o bloco de vínculo conforme papel e status
function matUpdateInsumoSection(m) {
  const section = document.getElementById('mat-insumo-link-section');
  if (!section) return;

  const isAttendant = currentUser?.role === 'attendant'
    || currentUser?.isAdmin || currentUser?.isSuperAdmin;

  // Só atendente vê, e só nos status onde ainda faz sentido vincular/desvincular
  const canLink = isAttendant && ['visto', 'reservado'].includes(m.status);
  section.style.display = canLink ? 'block' : 'none';
  if (!canLink) return;

  if (m.insumoId) {
    matShowLinkedInsumo(m);
  } else {
    matShowInsumoSearch();
  }
}

// Mostra o card do insumo já vinculado
async function matShowLinkedInsumo(m) {
  document.getElementById('mat-insumo-linked').style.display = 'block';
  document.getElementById('mat-insumo-search-wrap').style.display = 'none';

  // Busca dados frescos do insumo
  try {
    const doc = await db.collection('insumos').doc(m.insumoId).get();
    if (!doc.exists) return;
    const ins = doc.data();
    const disp = ins.qtdDisponivel ?? ins.qtdFisica ?? 0;
    const fis = ins.qtdFisica ?? 0;

    document.getElementById('mat-linked-nome').textContent = ins.nome || '—';
    document.getElementById('mat-linked-cat').textContent = ins.categoria || '—';
    document.getElementById('mat-linked-disp').textContent = `${disp} ${ins.unidade || 'un.'}`;
    document.getElementById('mat-linked-fis').textContent = `${fis} ${ins.unidade || 'un.'}`;
  } catch (e) {
    document.getElementById('mat-linked-nome').textContent = m.insumoNome || m.insumoId;
  }
}

// Mostra campo de busca de insumo
function matShowInsumoSearch() {
  document.getElementById('mat-insumo-linked').style.display = 'none';
  document.getElementById('mat-insumo-search-wrap').style.display = 'block';
  document.getElementById('mat-insumo-search-input').value = '';
  document.getElementById('mat-insumo-results').style.display = 'none';
  matLoadInsumos(); // pré-carrega em background
}

// Busca com debounce
function matSearchInsumos(query) {
  clearTimeout(_matSearchTimer);
  _matSearchTimer = setTimeout(() => matDoSearch(query), 220);
}

async function matDoSearch(query) {
  const resultsEl = document.getElementById('mat-insumo-results');
  if (!resultsEl) return;

  const q = (query || '').toLowerCase().trim();
  if (!q) { resultsEl.style.display = 'none'; return; }

  await matLoadInsumos();

  const found = _matInsumos.filter(i =>
    (i.nome || '').toLowerCase().includes(q) ||
    (i.categoria || '').toLowerCase().includes(q)
  ).slice(0, 8);

  if (!found.length) {
    resultsEl.innerHTML = `<div class="mat-insumo-result-empty">Nenhum insumo encontrado para "${matEsc(query)}"</div>`;
    resultsEl.style.display = 'block';
    return;
  }

  resultsEl.innerHTML = found.map(i => {
    const disp = i.qtdDisponivel ?? i.qtdFisica ?? 0;
    const isLow = disp <= 0;
    const dispStr = `${disp} ${i.unidade || 'un.'}`;
    return `<div class="mat-insumo-result-item" onclick="matLinkInsumo('${i.id}')">
      <div>
        <div class="mat-insumo-result-nome">${matEsc(i.nome)}</div>
        <div class="mat-insumo-result-meta">${matEsc(i.categoria || 'Sem categoria')}</div>
      </div>
      <span class="mat-insumo-result-disp ${isLow ? 'low' : ''}">${dispStr}</span>
    </div>`;
  }).join('');

  resultsEl.style.display = 'block';
}

// Fechar resultados ao clicar fora
document.addEventListener('click', e => {
  const wrap = document.getElementById('mat-insumo-search-wrap');
  const results = document.getElementById('mat-insumo-results');
  if (results && wrap && !wrap.contains(e.target)) {
    results.style.display = 'none';
  }
});

// Vincular insumo ao material
async function matLinkInsumo(insumoId) {
  const m = matMaterials.find(x => x.id === matActiveId);
  if (!m) return;

  const ins = _matInsumos.find(i => i.id === insumoId);
  if (!ins) return;

  try {
    await db.collection('materials').doc(matActiveId).update({
      insumoId: insumoId,
      insumoNome: ins.nome,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      history: firebase.firestore.FieldValue.arrayUnion({
        action: `Insumo vinculado: "${ins.nome}"`,
        user: matCapitalize(currentUser?.username || 'Sistema'),
        role: currentUser?.isSuperAdmin ? 'superadmin' : (currentUser?.role || 'attendant'),
        ts: new Date().toLocaleString('pt-BR', {
          day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        })
      })
    });
    // Invalida cache para recarregar dados frescos
    _matInsumos = [];
    matToast(`Insumo "${ins.nome}" vinculado!`, 'success');
  } catch (e) {
    console.error('[Mat] Erro ao vincular insumo:', e);
    matToast('Erro ao vincular insumo.', 'error');
  }
}

// Desvincular insumo
async function matUnlinkInsumo() {
  if (!confirm('Desvincular o insumo desta solicitação?')) return;
  try {
    await db.collection('materials').doc(matActiveId).update({
      insumoId: firebase.firestore.FieldValue.delete(),
      insumoNome: firebase.firestore.FieldValue.delete(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      history: firebase.firestore.FieldValue.arrayUnion({
        action: 'Insumo desvinculado',
        user: matCapitalize(currentUser?.username || 'Sistema'),
        role: currentUser?.isSuperAdmin ? 'superadmin' : (currentUser?.role || 'attendant'),
        ts: new Date().toLocaleString('pt-BR', {
          day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        })
      })
    });
    matToast('Insumo desvinculado.', 'success');
  } catch (e) {
    matToast('Erro ao desvincular.', 'error');
  }
}

// ───────────────────────────────────────────
//  OPERAÇÕES DE ESTOQUE
// ───────────────────────────────────────────

// Reserva: desconta qtdDisponivel
async function matReserveStock(m) {
  if (!m.insumoId) return true; // sem vínculo → compra externa → ok

  try {
    const doc = await db.collection('insumos').doc(m.insumoId).get();
    if (!doc.exists) return true; // insumo removido → segue como externo

    const ins = doc.data();
    const disp = ins.qtdDisponivel ?? ins.qtdFisica ?? 0;
    const solQtd = m.qty || 1;

    if (solQtd > disp) {
      // Estoque insuficiente — notifica e bloqueia
      matToast(
        `Estoque insuficiente! Disponível: ${disp} ${ins.unidade || 'un.'} / Solicitado: ${solQtd}`,
        'error'
      );
      // Registra no histórico que a reserva foi bloqueada
      await db.collection('materials').doc(m.id).update({
        history: firebase.firestore.FieldValue.arrayUnion({
          action: `Reserva bloqueada — estoque insuficiente (disp: ${disp}, solicitado: ${solQtd})`,
          user: matCapitalize(currentUser?.username || 'Sistema'),
          role: currentUser?.isSuperAdmin ? 'superadmin' : (currentUser?.role || 'attendant'),
          ts: new Date().toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
          })
        })
      });
      return false; // bloqueia transição
    }

    // Desconta disponível (estoque físico permanece intacto até entrega)
    const novaDisp = disp - solQtd;
    await db.collection('insumos').doc(m.insumoId).update({
      qtdDisponivel: novaDisp,
      updatedAt: new Date().toISOString()
    });

    // Registra movimentação no inventário
    await db.collection('insumos_mov').add({
      insumoId: m.insumoId,
      insumoNome: ins.nome,
      tipo: 'reserva_material',
      qtd: solQtd,
      desc: `Reservado para solicitação ${m.number}`,
      responsavel: currentUser?.username || '—',
      materialId: m.id,
      data: new Date().toISOString()
    });

    _matInsumos = []; // invalida cache
    return true;
  } catch (e) {
    console.error('[Mat] Erro ao reservar estoque:', e);
    matToast('Erro ao reservar estoque. Verifique o inventário.', 'error');
    return false;
  }
}

// Entrega: baixa definitiva em qtdFisica (e confirma o desconto em disponível)
async function matDeliverStock(m) {
  if (!m.insumoId) return; // sem vínculo → nada a fazer

  try {
    const doc = await db.collection('insumos').doc(m.insumoId).get();
    if (!doc.exists) return;

    const ins = doc.data();
    const solQtd = m.qty || 1;
    const novaFis = Math.max(0, (ins.qtdFisica ?? 0) - solQtd);

    await db.collection('insumos').doc(m.insumoId).update({
      qtdFisica: novaFis,
      updatedAt: new Date().toISOString()
    });

    await db.collection('insumos_mov').add({
      insumoId: m.insumoId,
      insumoNome: ins.nome,
      tipo: 'saida_material',
      qtd: solQtd,
      desc: `Entrega confirmada — solicitação ${m.number}`,
      responsavel: currentUser?.username || '—',
      materialId: m.id,
      data: new Date().toISOString()
    });

    _matInsumos = []; // invalida cache
  } catch (e) {
    console.error('[Mat] Erro ao registrar baixa no estoque:', e);
    matToast('Material entregue, mas erro ao baixar estoque. Verifique o inventário.', 'error');
  }
}

// Devolução do disponível se cancelado/recusado após reserva
async function matReleaseStock(m) {
  if (!m.insumoId || m.status !== 'reservado') return;

  try {
    const doc = await db.collection('insumos').doc(m.insumoId).get();
    if (!doc.exists) return;

    const ins = doc.data();
    const solQtd = m.qty || 1;
    const novaDisp = (ins.qtdDisponivel ?? ins.qtdFisica ?? 0) + solQtd;

    await db.collection('insumos').doc(m.insumoId).update({
      qtdDisponivel: novaDisp,
      updatedAt: new Date().toISOString()
    });

    await db.collection('insumos_mov').add({
      insumoId: m.insumoId,
      insumoNome: ins.nome,
      tipo: 'devolucao_reserva',
      qtd: solQtd,
      desc: `Reserva liberada — solicitação ${m.number} cancelada/recusada`,
      responsavel: currentUser?.username || '—',
      materialId: m.id,
      data: new Date().toISOString()
    });

    _matInsumos = [];
  } catch (e) {
    console.error('[Mat] Erro ao liberar reserva:', e);
  }
}