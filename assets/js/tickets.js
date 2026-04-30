// ===== TICKETS — CRUD, renderização e ações (Firebase Firestore) =====

async function getNextTicketNumber(type) {
  const counterRef = db.collection('meta').doc('counters');
  return db.runTransaction(async (transaction) => {
    const doc = await transaction.get(counterRef);
    const field = type === 'material' ? 'material' : type === 'test' ? 'test' : 'ticket';
    const current = (doc.exists ? (doc.data()[field] || 0) : 0);
    const next = current + 1;
    transaction.set(counterRef, { [field]: next }, { merge: true });
    if (type === 'material') return 'M' + String(next).padStart(4, '0');
    if (type === 'test') return 'T' + String(next).padStart(3, '0');
    return next;
  });
}

function loadTickets() {
  if (window._ticketsUnsubscribe) window._ticketsUnsubscribe();
  window._ticketsUnsubscribe = db.collection('tickets').onSnapshot(snapshot => {
    if (_pendingWrite) return;
    tickets = snapshot.docs.map(doc => doc.data());
    renderTickets();
    updateStats();
    updateMaterialTabBadge();
    if (activeDetailId) {
      const t = tickets.find(t => t.id === activeDetailId);
      if (t) renderDetailMessages(t);
    }
  }, err => console.error('[Tickets] Erro no listener:', err));
}

function saveTickets() {
  _pendingWrite = true;
  renderTickets();
  updateStats();
  const batch = db.batch();
  tickets.forEach(ticket => batch.set(db.collection('tickets').doc(ticket.id), ticket));
  batch.commit()
    .then(() => { setTimeout(() => { _pendingWrite = false; }, 1500); })
    .catch(err => { console.error('[Tickets] Erro ao salvar:', err); _pendingWrite = false; });
}

async function saveTicket(ticketId) {
  const ticket = tickets.find(t => t.id === ticketId);
  if (!ticket) return;
  await db.collection('tickets').doc(ticketId).set(ticket);
}

function filterTickets(filter, event) {
  currentFilter = filter;
  // Resetar filtro de setor ao trocar de aba
  currentSetorFilter = '';
  const sel = document.getElementById('setor-filter-select');
  if (sel) sel.value = '';
  // Fechar menus dropdown se abertos
  const mAtt = document.getElementById('filter-dropdown-menu');
  const mReq = document.getElementById('filter-requester-menu');
  if (mAtt) mAtt.style.display = 'none';
  if (mReq) mReq.style.display = 'none';
  currentPage = 1; // reset paginação ao mudar filtro
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (event && event.target) event.target.classList.add('active');
  if (filter === 'material') markMaterialTabSeen();
  renderTickets();
}

function updateStats() {
  if (!currentUser) return;
  const src = currentUser.role === 'requester' ? tickets.filter(t => t.requester === currentUser.username) : tickets;
  document.getElementById('stat-available').textContent = src.filter(t => t.status === 'available').length;
  document.getElementById('stat-in-progress').textContent = src.filter(t => t.status === 'in-progress' || SUB_STATUS.has(t.status)).length;
  // Arquivados também contam como concluídos — todo arquivado já passou pelo estado concluído
  document.getElementById('stat-completed').textContent = src.filter(t => t.status === 'completed' || t.status === 'archived').length;
}


// Verifica se o usuário atual é mencionado num chamado (e ele está ativo)
function isMentionedIn(ticket) {
  if (!currentUser) return false;
  if (ticket.status === 'archived' || ticket.status === 'completed') return false;
  const me = currentUser.username.toLowerCase();
  return (ticket.mentions || []).some(m => m.to && m.to.toLowerCase() === me);
}

// Ordem de prioridade para ordenação
const PRIO_ORDER = { urgent: 0, high: 1, medium: 2, low: 3, none: 4 };

// ── Dropdown de filtro principal ──
let _filterDropdownOpen = false;

function toggleFilterDropdown() {
  const wAtt = document.getElementById('filter-dropdown-wrapper');
  const wReq = document.getElementById('filter-requester-wrapper');
  const menuAtt = document.getElementById('filter-dropdown-menu');
  const menuReq = document.getElementById('filter-requester-menu');

  // Determinar qual menu usar baseado no wrapper visível
  const attVisible = wAtt && wAtt.style.display !== 'none';
  const menu = attVisible ? menuAtt : menuReq;
  if (!menu) return;

  const isOpen = menu.style.display === 'block';
  if (menuAtt) menuAtt.style.display = 'none';
  if (menuReq) menuReq.style.display = 'none';
  if (!isOpen) {
    menu.style.display = 'block';
    setTimeout(() => document.addEventListener('click', closeFilterDropdownOutside, { once: true }), 10);
  }
}

function closeFilterDropdownOutside(e) {
  const wAtt = document.getElementById('filter-dropdown-wrapper');
  const wReq = document.getElementById('filter-requester-wrapper');
  if ((!wAtt || !wAtt.contains(e.target)) && (!wReq || !wReq.contains(e.target))) {
    const mAtt = document.getElementById('filter-dropdown-menu');
    const mReq = document.getElementById('filter-requester-menu');
    if (mAtt) mAtt.style.display = 'none';
    if (mReq) mReq.style.display = 'none';
  }
}

function selectFilter(filter, label) {
  const mAtt = document.getElementById('filter-dropdown-menu');
  const mReq = document.getElementById('filter-requester-menu');
  if (mAtt) mAtt.style.display = 'none';
  if (mReq) mReq.style.display = 'none';

  const labelAtt = document.getElementById('filter-dropdown-label');
  const labelReq = document.getElementById('filter-requester-label');
  const isReqVisible = document.getElementById('filter-requester-wrapper')?.style.display !== 'none';
  const isAttVisible = document.getElementById('filter-dropdown-wrapper')?.style.display !== 'none';

  // Buscar o botão selecionado para pegar o innerHTML (com SVG)
  const selectedBtn = document.querySelector(`.filter-dd-item[data-filter="${filter}"]`);
  const btnHTML = selectedBtn ? selectedBtn.innerHTML : label;

  if (labelAtt && isAttVisible) labelAtt.innerHTML = btnHTML;
  if (labelReq && isReqVisible) labelReq.innerHTML = btnHTML;

  document.querySelectorAll('.filter-dd-item').forEach(b => {
    b.classList.toggle('active', b.dataset.filter === filter);
  });
  filterTickets(filter);
}

// Versão sem SVG no onclick — lê label do data-label
function selectFilterBtn(btn) {
  const filter = btn.dataset.filter;
  const label = btn.dataset.label || btn.textContent.trim();
  selectFilter(filter, label);
}

// Filtro de setor na aba principal
let currentSetorFilter = '';

// ── Estado dos filtros de Concluídos ──
let _arcSort = { col: 'date', dir: 'desc' }; // ordenação padrão: mais recente primeiro
let _arcSetor = '';
let _arcPrio = '';
let _arcFrom = '';
let _arcTo = '';

function setArcSort(col) {
  if (_arcSort.col === col) {
    _arcSort.dir = _arcSort.dir === 'asc' ? 'desc' : 'asc';
  } else {
    _arcSort.col = col;
    _arcSort.dir = col === 'date' ? 'desc' : 'asc';
  }
  renderTickets();
}

function clearArcFilters() {
  _arcSetor = ''; _arcPrio = ''; _arcFrom = ''; _arcTo = '';
  const s = document.getElementById('arc-filter-setor');
  const p = document.getElementById('arc-filter-prio');
  const f = document.getElementById('arc-filter-from');
  const t = document.getElementById('arc-filter-to');
  if (s) s.value = '';
  if (p) p.value = '';
  if (f) f.value = '';
  if (t) t.value = '';
  renderTickets();
}

function applyArcFilters(list) {
  let out = [...list];

  // Filtro setor
  if (_arcSetor) out = out.filter(t => t.setor === _arcSetor);

  // Filtro prioridade
  if (_arcPrio) out = out.filter(t => (t.priority || 'medium') === _arcPrio);

  // Filtro data de/até
  if (_arcFrom || _arcTo) {
    out = out.filter(t => {
      const raw = t.completedAt || t.archivedAt || '';
      if (!raw) return false;
      // Extrair data dd/mm/yyyy
      const parts = raw.split(/[,\s]+/);
      const [d, m, y] = (parts[0] || '').split('/');
      if (!d || !m || !y) return false;
      const ts = new Date(+y, +m - 1, +d).getTime();
      if (_arcFrom) {
        const [fy, fm, fd] = _arcFrom.split('-');
        if (ts < new Date(+fy, +fm - 1, +fd).getTime()) return false;
      }
      if (_arcTo) {
        const [ty, tm, td] = _arcTo.split('-');
        if (ts > new Date(+ty, +tm - 1, +td).getTime()) return false;
      }
      return true;
    });
  }

  // Ordenação
  out.sort((a, b) => {
    const dir = _arcSort.dir === 'asc' ? 1 : -1;
    if (_arcSort.col === 'num') {
      const na = parseInt(String(a.number).replace(/\D/g, '')) || 0;
      const nb = parseInt(String(b.number).replace(/\D/g, '')) || 0;
      return (na - nb) * dir;
    }
    if (_arcSort.col === 'setor') {
      return ((a.setor || '').localeCompare(b.setor || '')) * dir;
    }
    if (_arcSort.col === 'prio') {
      return ((PRIO_ORDER[a.priority || 'medium'] || 2) - (PRIO_ORDER[b.priority || 'medium'] || 2)) * dir;
    }
    if (_arcSort.col === 'date') {
      const da = a.completedAt || a.archivedAt || '';
      const db = b.completedAt || b.archivedAt || '';
      const toTs = s => {
        const p = s.split(/[,\s]+/);
        const [d, m, y] = (p[0] || '').split('/');
        return d && m && y ? new Date(+y, +m - 1, +d).getTime() : 0;
      };
      return (toTs(da) - toTs(db)) * dir;
    }
    return 0;
  });

  return out;
}

function sortByPriority(list) {
  return [...list].sort((a, b) => {
    // VIP sempre no topo
    const aVip = !!(users.find(u => u.username === a.requester)?.isVip);
    const bVip = !!(users.find(u => u.username === b.requester)?.isVip);
    if (aVip !== bVip) return aVip ? -1 : 1;
    // Depois por prioridade
    const ap = PRIO_ORDER[a.priority] ?? 4;
    const bp = PRIO_ORDER[b.priority] ?? 4;
    if (ap !== bp) return ap - bp;
    // Dentro da mesma prioridade, mais recente primeiro
    return (b.createdAt || b.date || '').localeCompare(a.createdAt || a.date || '');
  });
}

function changePage(dir) {
  const totalPages = Math.ceil(window._lastCardListLength / CARDS_PER_PAGE);
  currentPage = Math.max(1, Math.min(currentPage + dir, totalPages));
  renderTickets();
}

function goToPage(page) {
  currentPage = page;
  renderTickets();
}
// ── Verifica menções pendentes para o usuário atual ──
function hasPendingMention(ticket) {
  if (!currentUser) return false;
  const mentions = ticket.mentions || [];
  const me = currentUser.username.toLowerCase();
  return mentions.some(m => m.to && m.to.toLowerCase() === me && !m.ack);
}

function renderTickets() {
  const board = document.getElementById('tickets-board');
  const empty = document.getElementById('empty-state');
  if (!currentUser) return;
  let list = tickets;
  const isRequester = currentUser.role === 'requester';

  if (currentFilter === 'my-requests') {
    // Meus chamados abertos + chamados onde fui mencionado
    list = tickets.filter(t =>
      (t.requester === currentUser.username || isMentionedIn(t)) &&
      t.status !== 'archived' && t.status !== 'completed'
    );
  } else if (currentFilter === 'my-completed') {
    // Meus chamados concluídos — disponível para solicitantes
    list = tickets.filter(t =>
      t.requester === currentUser.username &&
      (t.status === 'completed' || t.status === 'archived')
    );
  } else if (isRequester && currentFilter === 'completed') {
    // Solicitante vendo seus concluídos — inclui archived (auto-arquivados)
    list = tickets.filter(t => t.requester === currentUser.username && (t.status === 'completed' || t.status === 'archived'));
  } else if (isRequester && currentFilter === 'archived') {
    // fallback — não usado mais, absorbed pelo completed
    list = tickets.filter(t => t.requester === currentUser.username && t.status === 'archived');
  } else if (currentFilter === 'available') { list = tickets.filter(t => t.status === 'available' && t.ticketType !== 'material'); }
  else if (currentFilter === 'material') { list = tickets.filter(t => t.ticketType === 'material' && t.status !== 'archived'); }
  else if (currentFilter === 'in-progress') { list = tickets.filter(t => (t.status === 'in-progress' || SUB_STATUS.has(t.status)) && t.ticketType !== 'material'); }
  else if (currentFilter === 'completed') { list = tickets.filter(t => (t.status === 'completed' || t.status === 'archived') && t.ticketType !== 'material' && t.ticketType !== 'test'); }
  else if (currentFilter === 'test') { list = tickets.filter(t => t.ticketType === 'test'); }
  else if (currentFilter === 'archived') { list = tickets.filter(t => t.status === 'archived'); }  // fallback
  else { list = tickets.filter(t => t.status !== 'archived' && t.ticketType !== 'material' && t.ticketType !== 'test'); }

  // Garantir que chamados onde o usuário foi mencionado sempre apareçam (exceto concluídos)
  if (!['archived', 'completed', 'test', 'material'].includes(currentFilter)) {
    const mentionedIds = new Set(list.map(t => t.id));
    tickets.forEach(t => {
      if (!mentionedIds.has(t.id) && isMentionedIn(t)) list = [...list, t];
    });
  }

  const searchVal = (document.getElementById('ticket-search')?.value || '').toLowerCase().trim();
  if (searchVal) {
    list = list.filter(t => {
      const numStr = t.number ? String(t.number).padStart(4, '0') : '';
      return t.title.toLowerCase().includes(searchVal) || numStr.includes(searchVal.replace('#', ''));
    });
  }

  // Filtro por setor — nunca para solicitantes, nunca na aba Concluídos
  const isCompletedFilter = currentFilter === 'archived' || currentFilter === 'completed' || currentFilter === 'my-completed';
  const isAttendantUser = currentUser.role !== 'requester';
  const setorWrapper = document.getElementById('setor-filter-wrapper');
  if (setorWrapper) {
    setorWrapper.style.display = (isAttendantUser && !isCompletedFilter) ? 'flex' : 'none';
  }
  if (currentSetorFilter && isAttendantUser && !isCompletedFilter) {
    list = list.filter(t => t.setor === currentSetorFilter);
  }

  // Controlar visibilidade da barra de filtros — só na aba Concluídos
  const _filterBar = document.getElementById('arc-filter-bar');
  const _isArc = currentFilter === 'archived' || currentFilter === 'completed' || currentFilter === 'my-completed';
  if (_filterBar) _filterBar.style.display = _isArc ? 'block' : 'none';

  if (!list.length) { board.style.display = 'none'; empty.style.display = 'block'; return; }
  empty.style.display = 'none';
  // Forçar lista se viewMode = list (exceto filtros que já são lista)
  const forceList = (typeof viewMode !== 'undefined') && viewMode === 'list';
  const useList = currentUser.role === 'requester' || currentFilter === 'archived' || currentFilter === 'completed' || currentFilter === 'my-completed';

  if (useList) {
    renderTicketsList(board, list);
  } else if (forceList) {
    renderTicketsList(board, list);
  } else {
    // Ordenar por prioridade com VIP no topo
    const sorted = sortByPriority(list);
    const total = sorted.length;
    const totalPages = Math.ceil(total / CARDS_PER_PAGE);
    if (currentPage > totalPages) currentPage = Math.max(1, totalPages);
    const start = (currentPage - 1) * CARDS_PER_PAGE;
    const paged = sorted.slice(start, start + CARDS_PER_PAGE);
    window._lastCardListLength = total;
    renderTicketsCards(board, paged);
    renderPagination(total, totalPages);
  }
  updateMaterialTabBadge();
}

function renderPagination(total, totalPages) {
  // Remove paginação anterior
  const old = document.getElementById('tickets-pagination');
  if (old) old.remove();
  if (totalPages <= 1) return;

  const nav = document.createElement('div');
  nav.id = 'tickets-pagination';
  nav.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:0.5rem;margin-top:1.5rem;flex-wrap:wrap;';

  // Botão anterior
  const prev = document.createElement('button');
  prev.textContent = '← Anterior';
  prev.disabled = currentPage === 1;
  prev.onclick = () => changePage(-1);
  prev.style.cssText = `padding:0.45rem 0.9rem;border-radius:8px;font-size:0.8rem;font-family:var(--font-display);
    cursor:pointer;border:1px solid var(--border2);background:var(--surface);color:var(--muted);
    transition:all 0.15s;${currentPage === 1 ? 'opacity:0.4;cursor:not-allowed;' : ''}`;
  nav.appendChild(prev);

  // Números de página
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    const isActive = i === currentPage;
    btn.style.cssText = `width:32px;height:32px;border-radius:8px;font-size:0.82rem;font-family:var(--font-mono);
      font-weight:700;cursor:pointer;transition:all 0.15s;
      ${isActive
        ? 'background:var(--accent);color:#fff;border:1px solid var(--accent);'
        : 'background:var(--surface);color:var(--muted);border:1px solid var(--border2);'}`;
    btn.onclick = () => goToPage(i);
    nav.appendChild(btn);
  }

  // Botão próximo
  const next = document.createElement('button');
  next.textContent = 'Próxima →';
  next.disabled = currentPage === totalPages;
  next.onclick = () => changePage(1);
  next.style.cssText = `padding:0.45rem 0.9rem;border-radius:8px;font-size:0.8rem;font-family:var(--font-display);
    cursor:pointer;border:1px solid var(--border2);background:var(--surface);color:var(--muted);
    transition:all 0.15s;${currentPage === totalPages ? 'opacity:0.4;cursor:not-allowed;' : ''}`;
  nav.appendChild(next);

  // Indicador
  const info = document.createElement('div');
  const start = (currentPage - 1) * CARDS_PER_PAGE + 1;
  const end = Math.min(currentPage * CARDS_PER_PAGE, total);
  info.style.cssText = 'width:100%;text-align:center;font-size:0.72rem;font-family:var(--font-mono);color:var(--muted);margin-top:0.25rem;';
  info.textContent = `Página ${currentPage} de ${totalPages} — exibindo ${start}–${end} de ${total} chamados`;
  nav.appendChild(info);

  // Inserir após o board
  const board = document.getElementById('tickets-board');
  board.insertAdjacentElement('afterend', nav);
}

function buildArchivedRow(ticket) {
  const num = ticket.number ? (typeof ticket.number === 'string' ? ticket.number : '#' + String(ticket.number).padStart(4, '0')) : '—';
  const prio = ticket.priority || 'medium';
  const setorHtml = ticket.setor ? '<span class="tl-setor-tag">' + ticket.setor + '</span>' : '<span class="tl-empty">—</span>';
  const dateHtml = ticket.completedAt || ticket.archivedAt || '—';
  return '<div class="tl-row archived arc-row" onclick="openTicketDetail(\'' + ticket.id + '\')" style="cursor:pointer">' +
    '<span class="tl-col tl-num"><span class="tl-num-badge">' + num + '</span></span>' +
    '<span class="tl-col tl-title"><span class="tl-title-text">' + ticket.title + '</span></span>' +
    '<span class="tl-col tl-setor">' + setorHtml + '</span>' +
    '<span class="tl-col tl-prio"><span class="tl-prio-tag ' + prio + '">' + (PRIORITY_LABEL[prio] || '—') + '</span></span>' +
    '<span class="tl-col tl-date"><span class="tl-date-done">' + dateHtml + '</span></span>' +
    '<span class="tl-col tl-arc-actions" onclick="event.stopPropagation()">' +
    '<button class="tl-btn arc-unarchive" onclick="reopenTicket(\'' + ticket.id + '\')" title="Desarquivar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M8 16H3v5"/></svg></button>' +
    '<button class="tl-btn arc-delete" onclick="deleteTicket(\'' + ticket.id + '\')" title="Excluir"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg></button>' +
    '</span></div>';
}

function renderTicketsList(board, list) {
  const isArchived = currentFilter === 'archived' || currentFilter === 'completed' || currentFilter === 'my-completed';
  board.style.display = 'block';
  board.className = isArchived ? 'tickets-board list-view archived-list' : 'tickets-board list-view';
  if (isArchived) {
    // Atualizar botão limpar e contador
    const clearBtn = document.getElementById('arc-filter-clear-btn');
    const countEl = document.getElementById('arc-filter-count');
    const filtered = applyArcFilters(list);
    if (clearBtn) clearBtn.style.display = (_arcSetor || _arcPrio || _arcFrom || _arcTo) ? 'inline-flex' : 'none';
    if (countEl) countEl.textContent = `${filtered.length} chamado${filtered.length !== 1 ? 's' : ''}`;

    // Renderizar apenas o cabeçalho e linhas (sem re-criar os inputs)
    const sortArrow = dir => dir === 'asc' ? ' ↑' : ' ↓';
    const thNum = `<span class="tl-col tl-num arc-sortable" onclick="setArcSort('num')">#${_arcSort.col === 'num' ? sortArrow(_arcSort.dir) : ''}</span>`;
    const thTitle = `<span class="tl-col tl-title">Título</span>`;
    const thSetor = `<span class="tl-col tl-setor arc-sortable" onclick="setArcSort('setor')">Setor${_arcSort.col === 'setor' ? sortArrow(_arcSort.dir) : ''}</span>`;
    const thPrio = `<span class="tl-col tl-prio arc-sortable" onclick="setArcSort('prio')">Prioridade${_arcSort.col === 'prio' ? sortArrow(_arcSort.dir) : ''}</span>`;
    const thDate = `<span class="tl-col tl-date arc-sortable" onclick="setArcSort('date')">Concluído em${_arcSort.col === 'date' ? sortArrow(_arcSort.dir) : ''}</span>`;
    const thAct = `<span class="tl-col tl-arc-actions"></span>`;

    board.innerHTML =
      `<div class="tl-header arc-header">${thNum}${thTitle}${thSetor}${thPrio}${thDate}${thAct}</div>` +
      (filtered.length ? filtered.map(buildArchivedRow).join('') :
        '<div class="arc-empty">Nenhum chamado encontrado com os filtros selecionados.</div>');
    return;
  }


  board.innerHTML = `<div class="tl-header"><span class="tl-col tl-num">#</span><span class="tl-col tl-title">Título / Descrição</span><span class="tl-col tl-setor">Setor</span><span class="tl-col tl-prio">Prioridade</span><span class="tl-col tl-status">Status</span><span class="tl-col tl-date">Datas</span><span class="tl-col tl-actions"></span></div>
  ${list.map(ticket => {
    const status = ticket.status || 'available';
    const num = ticket.number ? (typeof ticket.number === 'string' ? ticket.number : '#' + String(ticket.number).padStart(4, '0')) : '—';
    const canEdit = ticket.requester === currentUser.username && status === 'available';
    const dateBlock = [ticket.date ? `<span class="tl-date-text" style="display:inline-flex;align-items:center;gap:3px;"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>${ticket.date}</span>` : '', ticket.startedAt ? `<span class="tl-date-sub" style="display:inline-flex;align-items:center;gap:3px;"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>${ticket.startedAt}</span>` : '', ticket.completedAt ? `<span class="tl-date-done" style="display:inline-flex;align-items:center;gap:3px;"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>${ticket.completedAt}</span>` : ''].filter(Boolean).join('');
    const tlMentionBadge = hasPendingMention(ticket) ? `<span class="card-mention-badge" style="top:-8px;left:-8px;">@</span>` : '';
    const isFollowing = isMentionedIn(ticket) && ticket.requester !== currentUser.username;
    const isDoneRow = status === 'completed' || status === 'archived';
    return `<div class="tl-row-wrapper" style="position:relative;display:block;" data-ticket-id="${ticket.id}">${tlMentionBadge}<div class="tl-row ${status}${isDoneRow ? '' : ' prio-' + (ticket.priority || 'medium')}${isFollowing ? ' tl-following' : ''}" onclick="openTicketDetail('${ticket.id}')" style="cursor:pointer">
      <span class="tl-col tl-num"><span class="tl-num-badge">${num}</span></span>
      <span class="tl-col tl-title"><span class="tl-title-text">${ticket.title}</span>${ticket.description ? `<span class="tl-desc">${ticket.description}</span>` : ''}${ticket.attachments?.length ? `<span class="tl-attach" style="display:inline-flex;align-items:center;gap:3px;"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>${ticket.attachments.length} anexo(s)</span>` : ''}</span>
      <span class="tl-col tl-setor">${ticket.setor ? `<span class="tl-setor-tag">${ticket.setor}</span>` : '<span class="tl-empty">—</span>'}</span>
      <span class="tl-col tl-prio"><span class="tl-prio-tag ${ticket.priority || 'medium'}">${PRIORITY_LABEL[ticket.priority] || '—'}</span></span>
      <span class="tl-col tl-status"><span class="ticket-status-badge ${status}">${STATUS_LABEL[status]}</span>${ticket.attendant ? `<span class="tl-attendant-tag" style="display:inline-flex;align-items:center;gap:3px;"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>${capitalizeName(ticket.attendant)}</span>` : ''}</span>
      <span class="tl-col tl-date">${dateBlock}</span>
      <span class="tl-col tl-actions" onclick="event.stopPropagation()">${canEdit ? `<button class="tl-btn edit" onclick="editTicket('${ticket.id}')">✎</button><button class="tl-btn del" onclick="deleteTicket('${ticket.id}')">✕</button>` : ''}</span>
    </div></div>`;
  }).join('')}`;
}

// ── Tempo em aberto ──
function tempoEmAberto(dateStr) {
  if (!dateStr) return null;
  // dateStr vem em formato "dd/mm/yyyy, HH:MM" ou "dd/mm/yyyy HH:MM:SS"
  const parts = dateStr.split(/[,\s]+/);
  const datePart = parts[0]; // dd/mm/yyyy
  const timePart = parts[1] || '0:0'; // HH:MM ou HH:MM:SS
  const [d, m, y] = datePart.split('/');
  if (!d || !m || !y) return null;
  const [h, min] = timePart.split(':');
  const opened = new Date(+y, +m - 1, +d, +(h || 0), +(min || 0));
  const now = new Date();
  const diffMs = now - opened;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  if (diffSec < 60) return `agora`;
  if (diffMin < 60) return `há ${diffMin}min`;
  if (diffHour < 24) return `há ${diffHour}h`;
  if (diffDay === 1) return `há 1 dia`;
  if (diffDay < 7) return `há ${diffDay} dias`;
  if (diffWeek === 1) return `há 1 semana`;
  if (diffWeek < 4) return `há ${diffWeek} semanas`;
  if (diffMonth === 1) return `há 1 mês`;
  return `há ${diffMonth} meses`;
}

function renderTicketsCards(board, list) {
  board.style.display = 'grid';
  board.className = 'tickets-board';
  board.innerHTML = list.map(ticket => {
    const status = ticket.status || 'available';
    const prio = ticket.priority || 'medium';
    const canEdit = currentUser.isAdmin || currentUser.isSuperAdmin || ticket.requester === currentUser.username || (status === 'in-progress' && ticket.attendant === currentUser.username);
    let actions = '';
    const isMat = ticket.ticketType === 'material';
    if (isMat) {
      if ((status === 'mat-seen' || status === 'available') && (currentUser.isAdmin || currentUser.isSuperAdmin || currentUser.role === 'attendant')) {
        actions = `<div class="ticket-actions-bottom"><button class="ticket-pull-btn" onclick="event.stopPropagation();setMatStatus('${ticket.id}','mat-ordered')" style="display:inline-flex;align-items:center;justify-content:center;gap:5px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg> Marcar Solicitado</button><button class="ticket-archive-btn" onclick="event.stopPropagation();archiveTicket('${ticket.id}')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg> Arquivar</button></div>`;
      } else if (status === 'mat-ordered' && (currentUser.isAdmin || currentUser.isSuperAdmin)) {
        actions = `<div class="ticket-actions-bottom"><button class="ticket-archive-btn" onclick="event.stopPropagation();archiveTicket('${ticket.id}')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg> Arquivar</button></div>`;
      }
    } else if (status === 'available') {
      actions = `<div class="ticket-actions-bottom"><button class="ticket-pull-btn" onclick="event.stopPropagation();pullTicket('${ticket.id}')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m16 12-4-4-4 4"/><path d="M12 16V8"/></svg> Assumir</button></div>`;
    } else if ((status === 'in-progress' || SUB_STATUS.has(status)) && (ticket.attendant === currentUser.username || currentUser.isAdmin || currentUser.isSuperAdmin)) {
      actions = `<div class="ticket-actions-bottom">
        <div class="ticket-actions-selects">
          <select class="ticket-substatus-select" onchange="event.stopPropagation();setSubStatus('${ticket.id}',this.value);this.blur()" onclick="event.stopPropagation()">
            <option value="in-progress" ${status === 'in-progress' ? 'selected' : ''}> Em Atendimento</option>
            <option value="waiting-info" ${status === 'waiting-info' ? 'selected' : ''}>💬 Aguard. Informações</option>
            <option value="waiting" ${status === 'waiting' ? 'selected' : ''}>⏸️ Em Espera</option>
          </select>
          <select class="ticket-prio-select" onchange="event.stopPropagation();setTicketPriority('${ticket.id}',this.value);this.blur()" onclick="event.stopPropagation()">
            <option value="" disabled ${!prio ? 'selected' : ''}> Prioridade</option>
            <option value="urgent" ${prio === 'urgent' ? 'selected' : ''}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff0000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg> Urgente</option>
            <option value="high"   ${prio === 'high' ? 'selected' : ''}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff7b00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg> Alta</option>
            <option value="medium" ${prio === 'medium' ? 'selected' : ''}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg> Média</option>
            <option value="low"    ${prio === 'low' ? 'selected' : ''}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#36fa00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg> Baixa</option>
            <option value="none"   ${prio === 'none' ? 'selected' : ''}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg> Sem Prioridade</option>
          </select>
        </div>
        <div class="ticket-actions-btns">
          <button class="ticket-complete-btn" onclick="event.stopPropagation();completeTicket('${ticket.id}')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 17 2 2 4-4m-6-6 2 2 4-4M13 6h8M13 12h8M13 18h8"/></svg> Concluir</button>
          <button class="ticket-release-btn" onclick="event.stopPropagation();releaseTicket('${ticket.id}')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg> Devolver</button>
        </div>
      </div>`;
    } else if ((status === 'completed' || status === 'archived') && (currentUser.isAdmin || currentUser.isSuperAdmin || ticket.attendant === currentUser.username)) {
      actions = `<div class="ticket-actions-bottom"><button class="ticket-reopen-btn" onclick="event.stopPropagation();reopenTicket('${ticket.id}')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M8 16H3v5"/></svg> Reabrir</button></div>`;
    } else if (false && status === 'archived') {  // nunca cai aqui — bloco unificado acima
      actions = `<div class="ticket-actions-bottom"><button class="ticket-reopen-btn" onclick="event.stopPropagation();reopenTicket('${ticket.id}')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M8 16H3v5"/></svg> Reabrir</button></div>`;
    }
    const numDisplay = ticket.number ? (typeof ticket.number === 'string' ? ticket.number : '#' + String(ticket.number).padStart(4, '0')) : '';
    const ticketNum = numDisplay ? `<span class="ticket-number">${numDisplay}</span>` : '';
    const setorBadge = ticket.setor ? `<span class="ticket-setor-badge" style="display:inline-flex;align-items:center;gap:4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>${ticket.setor}</span>` : '';
    const matBadge = ticket.materialData?.qty ? `<div class="mat-info-row"><span class="mat-qty-badge" style="display:inline-flex;align-items:center;gap:4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"/><path d="m7.5 4.27 9 5.15"/></svg>${ticket.materialData.qty} ${ticket.materialData.unitText || ticket.materialData.unit}</span>${ticket.materialData.needByDate ? `<span class="mat-date-badge" style="display:inline-flex;align-items:center;gap:4px;"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>Necessário: ${new Date(ticket.materialData.needByDate + "T12:00:00").toLocaleDateString("pt-BR")}</span>` : ""}</div>` : '';
    const dates = [ticket.startedAt ? `<div class="ticket-date-row started"><span class="date-icon" style="display:inline-flex;align-items:center;"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg></span><span>Início: ${ticket.startedAt}</span></div>` : '', ticket.completedAt ? `<div class="ticket-date-row done"><span class="date-icon" style="display:inline-flex;align-items:center;"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg></span><span>Concluído: ${ticket.completedAt}</span></div>` : ''].filter(Boolean).join('');
    const isDone = status === 'completed' || status === 'archived';
    const isMaterialCard = ticket.ticketType === 'material';
    const unseen = getUnseenCount(ticket);
    const badge = unseen > 0 ? `<span class="card-notif-badge">${unseen > 99 ? '99+' : unseen}</span>` : '';
    const pendingMention = hasPendingMention(ticket);
    const mentionBadge = pendingMention ? `<span class="card-mention-badge">@</span>` : '';
    const mentionClass = pendingMention ? ' has-mention' : '';
    // VIP — verifica se o solicitante tem flag isVip
    const requesterData = users.find(u => u.username === ticket.requester);
    const isVipTicket = !isDone && !!requesterData?.isVip;
    const vipBadge = isVipTicket ? `<span class="vip-badge">⭐ VIP</span>` : '';
    const isTestTicket = false; // Tipo teste removido
    const testBadge = isTestTicket ? `<span class="test-badge" style="display:inline-flex;align-items:center;gap:4px;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M9 3h6l1 7H8L9 3z"/><path d="M8 10c-1.5 2-2 3.5-2 5a6 6 0 0 0 12 0c0-1.5-.5-3-2-5"/><path d="M7 3h10"/></svg> TESTE</span>` : '';
    const isMergeSelected = mergeMode && selectedForMerge.has(ticket.id);
    const mergeCheckbox = (mergeMode && !isDone && status !== 'archived') ? `
      <div onclick="event.stopPropagation();toggleSelectForMerge('${ticket.id}', event)"
        style="position:absolute;top:8px;left:8px;z-index:30;
          width:22px;height:22px;border-radius:6px;cursor:pointer;
          background:${isMergeSelected ? 'var(--accent)' : 'rgba(255,255,255,0.9)'};
          border:2px solid ${isMergeSelected ? 'var(--accent)' : 'var(--border2)'};
          display:flex;align-items:center;justify-content:center;
          font-size:0.75rem;font-weight:800;color:#fff;transition:all 0.15s;">
        ${isMergeSelected ? '✓' : ''}
      </div>` : '';
    // Indicadores extras no número (anexos, material, teste)
    const extraIcons = [
      ticket.attachments?.length ? `<span class="card-extra-icon" title="${ticket.attachments.length} anexo(s)" style="display:inline-flex;align-items:center;"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg></span>` : '',
      isMaterialCard ? `<span class="card-extra-icon" title="Solicitação de Material" style="display:inline-flex;align-items:center;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"/><path d="m7.5 4.27 9 5.15"/></svg></span>` : '',
      isTestTicket ? `<span class="card-extra-icon" title="Chamado de Teste" style="display:inline-flex;align-items:center;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M9 3h6l1 7H8L9 3z"/><path d="M8 10c-1.5 2-2 3.5-2 5a6 6 0 0 0 12 0c0-1.5-.5-3-2-5"/><path d="M7 3h10"/></svg></span>` : '',
    ].filter(Boolean).join('');
    return `<div class="ticket-card-wrapper" style="position:relative;${isMergeSelected ? 'outline:2px solid var(--accent);border-radius:15px;' : ''}" data-ticket-id="${ticket.id}">${badge}${mentionBadge}${mergeCheckbox}
      <div class="ticket-card ${status}${isDone ? '' : ' prio-' + prio}${isMaterialCard ? ' material-card' : ''}${isVipTicket ? ' vip-card' : ''}${isTestTicket ? ' test-card' : ''}${mentionClass}" onclick="${mergeMode ? `toggleSelectForMerge('${ticket.id}', event)` : `openTicketDetail('${ticket.id}')`}" style="cursor:pointer;">
        <div class="ticket-prio-stripe" style="${isDone ? 'background:#22c55e;' : ''}"></div>
        <div class="ticket-card-inner">
          <div class="ticket-content-area">
            <div class="card-top-row">
              <div class="card-top-left">
                <span class="ticket-status-badge ${status}">${STATUS_LABEL[status] || status}</span>
                <span class="ticket-priority-badge prio-${prio}">${PRIORITY_ICON_LABEL[prio] || PRIORITY_LABEL[prio]}</span>
              </div>
              <div class="card-top-right">
                ${extraIcons}
                ${vipBadge}
                ${numDisplay ? `<span class="ticket-number">${numDisplay}</span>` : ''}
                ${canEdit ? `<button class="ticket-edit-btn" onclick="event.stopPropagation();editTicket('${ticket.id}')">✎</button><button class="ticket-delete-btn" onclick="event.stopPropagation();deleteTicket('${ticket.id}')">✕</button>` : ''}
              </div>
            </div>
            <div class="ticket-title">${ticket.title}</div>
            <div class="card-meta-row">
              ${ticket.setor ? `<span class="card-setor-tag" style="display:inline-flex;align-items:center;gap:4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>${ticket.setor}</span>` : ''}
              ${ticket.materialData?.qty ? `<span class="card-meta-sep">•</span><span class="mat-qty-badge" style="display:inline-flex;align-items:center;gap:4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"/><path d="m7.5 4.27 9 5.15"/></svg>${ticket.materialData.qty} ${ticket.materialData.unitText || ticket.materialData.unit}</span>` : ''}
              ${!isDone && ticket.date ? `<span class="card-meta-sep">•</span><span class="card-time-open">⏱️ ${tempoEmAberto(ticket.date) || ''}</span>` : ''}
            </div>
            <div class="card-people-row">
              ${ticket.requester ? `<span class="card-person"><span class="card-person-label">Solicitante</span><span class="card-person-name">${capitalizeName(ticket.requester)}</span></span>` : ''}
              ${ticket.attendant ? `<span class="card-person"><span class="card-person-label attendant">Atendente</span><span class="card-person-name">${capitalizeName(ticket.attendant)}</span></span>` : ''}
            </div>
          </div>
          ${actions}
        </div>
      </div>
    </div>`;
  }).join('');
}

// ── Ações ──
function setMatStatus(id, newStatus) {
  const t = tickets.find(t => t.id === id); if (!t) return;
  t.status = newStatus;
  logTicketEvent(t, 'Material ' + (STATUS_LABEL[newStatus] || newStatus).toLowerCase() + ' por ' + capitalizeName(currentUser.username));
  saveTickets(); if (activeDetailId === id) openTicketDetail(id);
  showNotification('Status: ' + (STATUS_LABEL[newStatus] || newStatus), 'success');
}

function setTicketPriority(id, priority) {
  const t = tickets.find(t => t.id === id);
  if (!t) return;
  t.priority = priority;
  logTicketEvent(t, `Prioridade alterada para "${PRIORITY_LABEL[priority] || priority}" por ${capitalizeName(currentUser.username)}`);
  saveTickets();
  if (activeDetailId === id) openTicketDetail(id);
  showNotification('Prioridade atualizada!', 'success');
}

function setSubStatus(id, subStatus) {
  const t = tickets.find(t => t.id === id); if (!t) return;
  t.status = subStatus;
  if (!t.startedAt) t.startedAt = new Date().toLocaleString('pt-BR');
  if (!t.attendant) t.attendant = currentUser.username;
  logTicketEvent(t, 'Status alterado para "' + (STATUS_LABEL[subStatus] || subStatus) + '" por ' + capitalizeName(currentUser.username));
  saveTickets(); if (activeDetailId === id) openTicketDetail(id);
  showNotification('Status: ' + (STATUS_LABEL[subStatus] || subStatus), 'success');
}

function pullTicket(id) {
  const t = tickets.find(t => t.id === id); if (!t) return;
  if (t.status !== 'available') { showNotification('Este chamado não está mais disponível', 'error'); return; }
  // Abre modal de prioridade antes de assumir
  openPriorityModal(id);
}

function openPriorityModal(ticketId) {
  // Remove modal anterior se existir
  const existing = document.getElementById('priority-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'priority-modal';
  modal.style.cssText = `
    position:fixed;inset:0;z-index:900;
    background:rgba(0,0,0,0.5);backdrop-filter:blur(6px);
    display:flex;align-items:center;justify-content:center;padding:2rem;
  `;
  modal.innerHTML = `
    <div style="background:var(--surface);border:1px solid var(--border2);border-radius:16px;
      padding:1.5rem;width:100%;max-width:360px;animation:slideUpDetail 0.3s cubic-bezier(0.34,1.56,0.64,1);">
      <div style="font-size:1rem;font-weight:800;margin-bottom:0.4rem;letter-spacing:-0.02em;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m16 12-4-4-4 4"/><path d="M12 16V8"/></svg> Assumir Chamado
      </div>
      <div style="font-size:0.8rem;color:var(--muted);margin-bottom:1.2rem;">
        Defina a prioridade antes de assumir
      </div>
      <div style="display:flex;flex-direction:column;gap:0.5rem;margin-bottom:1.2rem;">
        ${[
      ['low', '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#36fa00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>', 'Baixa', '#dcfce7', '#16a34a'],
      ['medium', '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>', 'Média', '#fef9c3', '#d97706'],
      ['high', '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff7b00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>', 'Alta', '#ffedd5', '#c2410c'],
      ['urgent', '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff0000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>', 'Urgente', '#fee2e2', '#b91c1c'],
    ].map(([val, emoji, label, bg, tc]) => `
          <label style="display:flex;align-items:center;gap:0.75rem;
            background:${bg};border:1.5px solid ${tc}30;border-radius:10px;
            padding:0.65rem 1rem;cursor:pointer;transition:all 0.15s;"
            onmouseover="this.style.borderColor='${tc}'"
            onmouseout="this.style.borderColor='${tc}30'">
            <input type="radio" name="pull-prio" value="${val}"
              style="accent-color:${tc};width:16px;height:16px;cursor:pointer;">
            <span style="font-size:0.9rem;font-weight:700;color:${tc};">${emoji} ${label}</span>
          </label>`).join('')}
      </div>
      <div style="display:flex;gap:0.6rem;">
        <button onclick="document.getElementById('priority-modal').remove()"
          style="flex:1;padding:0.65rem;background:var(--surface3);border:1px solid var(--border2);
            border-radius:8px;font-family:var(--font-display);font-size:0.85rem;cursor:pointer;">
          Cancelar
        </button>
        <button onclick="confirmPullTicket('${ticketId}')"
          style="flex:2;padding:0.65rem;background:var(--accent);border:none;
            border-radius:8px;color:#fff;font-family:var(--font-display);
            font-size:0.85rem;font-weight:700;cursor:pointer;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m16 12-4-4-4 4"/><path d="M12 16V8"/></svg> Assumir Chamado
        </button>
      </div>
    </div>
  `;
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
}

function confirmPullTicket(id) {
  const selected = document.querySelector('input[name="pull-prio"]:checked');
  if (!selected) { showNotification('Selecione uma prioridade para assumir.', 'error'); return; }
  const prio = selected.value;
  const modal = document.getElementById('priority-modal');
  if (modal) modal.remove();

  const t = tickets.find(t => t.id === id); if (!t) return;
  if (t.status !== 'available') { showNotification('Este chamado não está mais disponível', 'error'); return; }
  t.status = 'in-progress';
  t.attendant = currentUser.username;
  t.startedAt = new Date().toLocaleString('pt-BR');
  t.priority = prio;
  logTicketEvent(t, `Chamado assumido por ${capitalizeName(currentUser.username)} com prioridade ${PRIORITY_LABEL[prio]}`);
  saveTickets();
  if (activeDetailId === id) openTicketDetail(id);
  showNotification(`Chamado "${t.title}" assumido! 🎯`, 'success');
}

function completeTicket(id) {
  const t = tickets.find(t => t.id === id); if (!t || !confirm(`Concluir o chamado "${t.title}"?`)) return;
  // Auto-arquiva ao concluir — etapa única
  const now = new Date().toLocaleString('pt-BR');
  t.status = 'archived';
  t.completedAt = now;
  t.archivedAt = now;
  t.subStatus = null;
  logTicketEvent(t, `Chamado concluido e arquivado por ${capitalizeName(currentUser.username)}`);
  saveTickets();
  closeTicketDetail();
  showNotification(`Chamado "${t.title}" concluido! ✅`, 'success');
}

function releaseTicket(id) {
  const t = tickets.find(t => t.id === id); if (!t || !confirm(`Devolver o chamado "${t.title}" para a fila?`)) return;
  t.status = 'available'; t.attendant = null; t.startedAt = null; t.subStatus = null;
  logTicketEvent(t, `Chamado devolvido à fila por ${capitalizeName(currentUser.username)}`);
  saveTickets(); if (activeDetailId === id) openTicketDetail(id);
  showNotification(`Chamado "${t.title}" devolvido à fila`, 'success');
}

function reopenTicket(id) {
  const t = tickets.find(t => t.id === id); if (!t || !confirm(`Reabrir o chamado "${t.title}"?`)) return;
  t.status = 'available';
  t.attendant = null;
  t.startedAt = null;
  t.completedAt = null;
  t.archivedAt = null;
  logTicketEvent(t, `Chamado reaberto por ${capitalizeName(currentUser.username)}`);
  saveTickets(); if (activeDetailId === id) openTicketDetail(id);
  showNotification(`Chamado "${t.title}" reaberto! 🔄`, 'success');
}

function archiveTicket(id) {
  const t = tickets.find(t => t.id === id); if (!t || !confirm(`Arquivar o chamado "${t.title}"?`)) return;
  t.status = 'archived'; t.archivedAt = new Date().toLocaleString('pt-BR');
  logTicketEvent(t, `Chamado arquivado por ${capitalizeName(currentUser.username)}`);
  saveTickets(); closeTicketDetail();
  showNotification(`Chamado "${t.title}" arquivado. 📦`, 'success');
}

function deleteTicket(id) {
  if (!confirm('Tem certeza que deseja excluir este chamado?')) return;
  tickets = tickets.filter(t => t.id !== id);
  if (activeDetailId === id) closeTicketDetail();
  db.collection('tickets').doc(id).delete().catch(console.error);
  saveTickets();
}

// ════════════════════════════════════════════
// CHAMADOS DE TESTE
// ════════════════════════════════════════════

function clearTestTickets() {
  const testList = tickets.filter(t => t.ticketType === 'test');
  if (!testList.length) { showNotification('Nenhum chamado de teste para limpar.', 'error'); return; }
  if (!confirm(`Excluir ${testList.length} chamado(s) de teste? Esta ação não pode ser desfeita.`)) return;
  const batch = db.batch();
  testList.forEach(t => batch.delete(db.collection('tickets').doc(t.id)));
  batch.commit()
    .then(() => {
      tickets = tickets.filter(t => t.ticketType !== 'test');
      showNotification(`${testList.length} chamado(s) de teste removidos! 🗑️`, 'success');
      if (currentFilter === 'test') filterTickets('all', null);
      else renderTickets();
      updateStats();
    })
    .catch(err => { console.error('[Test] Erro ao limpar:', err); showNotification('Erro ao limpar testes.', 'error'); });
}

// ════════════════════════════════════════════
// MESCLAR CHAMADOS
// ════════════════════════════════════════════

function toggleMergeMode() {
  mergeMode = !mergeMode;
  selectedForMerge.clear();
  closeActionsDropdown();
  renderTickets();
  const btn = document.getElementById('merge-mode-btn');
  if (btn) {
    btn.style.background = mergeMode ? 'var(--accent)' : '';
    btn.style.color = mergeMode ? '#fff' : '';
    btn.style.borderColor = mergeMode ? 'var(--accent)' : '';
    btn.textContent = mergeMode ? '✕ Cancelar Mesclagem' : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> Mesclar Chamados`;
  }
  const mergeBanner = document.getElementById('merge-banner');
  if (mergeBanner) mergeBanner.style.display = mergeMode ? 'flex' : 'none';
}

function toggleSelectForMerge(id, e) {
  e.stopPropagation();
  if (selectedForMerge.has(id)) { selectedForMerge.delete(id); }
  else { selectedForMerge.add(id); }
  // Atualiza contador no banner
  const count = document.getElementById('merge-count');
  if (count) count.textContent = selectedForMerge.size;
  const confirmBtn = document.getElementById('merge-confirm-btn');
  if (confirmBtn) confirmBtn.disabled = selectedForMerge.size < 2;
  renderTickets();
}

function openMergeConfirmModal() {
  if (selectedForMerge.size < 2) {
    showNotification('Selecione pelo menos 2 chamados para mesclar.', 'error');
    return;
  }
  const selected = tickets.filter(t => selectedForMerge.has(t.id));
  const existing = document.getElementById('merge-confirm-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'merge-confirm-modal';
  modal.style.cssText = `
    position:fixed;inset:0;z-index:900;
    background:rgba(0,0,0,0.5);backdrop-filter:blur(6px);
    display:flex;align-items:center;justify-content:center;padding:2rem;
  `;
  modal.innerHTML = `
    <div style="background:var(--surface);border:1px solid var(--border2);border-radius:16px;
      padding:1.5rem;width:100%;max-width:480px;animation:slideUpDetail 0.3s cubic-bezier(0.34,1.56,0.64,1);">
      <div style="font-size:1rem;font-weight:800;margin-bottom:0.3rem;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> Mesclar Chamados</div>
      <div style="font-size:0.8rem;color:var(--muted);margin-bottom:1rem;">
        Escolha o chamado principal. Os demais serão arquivados e vinculados ao novo.
      </div>

      <div style="font-size:0.7rem;font-family:var(--font-mono);text-transform:uppercase;
        letter-spacing:0.1em;color:var(--muted);margin-bottom:0.5rem;">
        Chamado Principal
      </div>
      <div style="display:flex;flex-direction:column;gap:0.4rem;margin-bottom:1rem;">
        ${selected.map((t, i) => {
    const num = t.number ? (typeof t.number === 'string' ? t.number : '#' + String(t.number).padStart(4, '0')) : '—';
    return `<label style="display:flex;align-items:center;gap:0.75rem;
            background:var(--surface2);border:1.5px solid var(--border2);border-radius:10px;
            padding:0.65rem 1rem;cursor:pointer;"
            onmouseover="this.style.borderColor='var(--accent)'"
            onmouseout="this.querySelector('input').checked ? null : (this.style.borderColor='var(--border2)')">
            <input type="radio" name="merge-main" value="${t.id}" ${i === 0 ? 'checked' : ''}
              style="accent-color:var(--accent);width:15px;height:15px;cursor:pointer;">
            <div style="min-width:0;">
              <div style="font-size:0.82rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                <span style="font-family:var(--font-mono);color:var(--muted);font-size:0.7rem;margin-right:0.4rem;">${num}</span>
                ${t.title}
              </div>
              <div style="font-size:0.72rem;color:var(--muted);font-family:var(--font-mono);">
                ${t.requester || '—'} · ${t.setor || 'Sem setor'}
              </div>
            </div>
          </label>`;
  }).join('')}
      </div>

      <div style="background:var(--surface2);border:1px solid var(--border2);border-radius:8px;
        padding:0.75rem;font-size:0.78rem;color:var(--muted);margin-bottom:1.2rem;line-height:1.6;">
        <span style="display:inline-flex;align-items:center;gap:5px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg> Os chamados não selecionados como principal serão</span> <strong>arquivados</strong> 
        automaticamente com uma nota no histórico indicando a mesclagem.
      </div>

      <div style="display:flex;gap:0.6rem;">
        <button onclick="document.getElementById('merge-confirm-modal').remove()"
          style="flex:1;padding:0.65rem;background:var(--surface3);border:1px solid var(--border2);
            border-radius:8px;font-family:var(--font-display);font-size:0.85rem;cursor:pointer;">
          Cancelar
        </button>
        <button onclick="executeMerge()"
          style="flex:2;padding:0.65rem;background:var(--accent);border:none;border-radius:8px;
            color:#fff;font-family:var(--font-display);font-size:0.85rem;font-weight:700;cursor:pointer;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> Confirmar Mesclagem
        </button>
      </div>
    </div>
  `;
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
}

function executeMerge() {
  const mainId = document.querySelector('input[name="merge-main"]:checked')?.value;
  const modal = document.getElementById('merge-confirm-modal');
  if (!mainId) return;
  if (modal) modal.remove();

  const mainTicket = tickets.find(t => t.id === mainId);
  const otherTickets = tickets.filter(t => selectedForMerge.has(t.id) && t.id !== mainId);
  if (!mainTicket || !otherTickets.length) return;

  const mergedNums = otherTickets.map(t =>
    t.number ? (typeof t.number === 'string' ? t.number : '#' + String(t.number).padStart(4, '0')) : t.id
  ).join(', ');

  const mainNum = mainTicket.number
    ? (typeof mainTicket.number === 'string' ? mainTicket.number : '#' + String(mainTicket.number).padStart(4, '0'))
    : mainTicket.id;

  // Mescla anexos dos outros chamados no principal
  const allAttachments = [...(mainTicket.attachments || [])];
  otherTickets.forEach(t => {
    (t.attachments || []).forEach(att => {
      if (!allAttachments.find(a => a.id === att.id)) allAttachments.push(att);
    });
  });
  mainTicket.attachments = allAttachments;

  // Registra no histórico do chamado principal
  logTicketEvent(mainTicket,
    `Chamados mesclados por ${capitalizeName(currentUser.username)}: ${mergedNums} foram incorporados a este chamado`);

  // Arquiva os chamados secundários
  otherTickets.forEach(t => {
    t.status = 'archived';
    t.archivedAt = new Date().toLocaleString('pt-BR');
    logTicketEvent(t,
      `Chamado arquivado por mesclagem — incorporado ao chamado ${mainNum} por ${capitalizeName(currentUser.username)}`);
  });

  // Sai do modo de mesclagem
  mergeMode = false;
  selectedForMerge.clear();

  saveTickets();
  showNotification(`${otherTickets.length + 1} chamados mesclados com sucesso! 🔗`, 'success');

  // Atualiza botão
  const btn = document.getElementById('merge-mode-btn');
  if (btn) { btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> Mesclar Chamados`; btn.style.background = ''; btn.style.color = ''; btn.style.borderColor = ''; }
  const banner = document.getElementById('merge-banner');
  if (banner) banner.style.display = 'none';
}