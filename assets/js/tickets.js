// ===== TICKETS — CRUD, renderização e ações (Firebase Firestore) =====

async function getNextTicketNumber(type) {
  const counterRef = db.collection('meta').doc('counters');
  return db.runTransaction(async (transaction) => {
    const doc = await transaction.get(counterRef);
    const field = type === 'material' ? 'material' : 'ticket';
    const current = (doc.exists ? (doc.data()[field] || 0) : 0);
    const next = current + 1;
    transaction.set(counterRef, { [field]: next }, { merge: true });
    return type === 'material' ? 'M' + String(next).padStart(4, '0') : next;
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
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (event && event.target) event.target.classList.add('active');
  if (filter === 'material') markMaterialTabSeen();
  renderTickets();
}

function updateStats() {
  if (!currentUser) return;
  const src = currentUser.role === 'requester' ? tickets.filter(t => t.requester === currentUser.username) : tickets;
  document.getElementById('stat-available').textContent   = src.filter(t => t.status === 'available').length;
  document.getElementById('stat-in-progress').textContent = src.filter(t => t.status === 'in-progress' || SUB_STATUS.has(t.status)).length;
  // Arquivados também contam como concluídos — todo arquivado já passou pelo estado concluído
  document.getElementById('stat-completed').textContent   = src.filter(t => t.status === 'completed' || t.status === 'archived').length;
}

function renderTickets() {
  const board = document.getElementById('tickets-board');
  const empty = document.getElementById('empty-state');
  if (!currentUser) return;
  let list = tickets;
  const isRequester = currentUser.role === 'requester';

  if (currentFilter === 'my-requests') {
    // Meus chamados abertos e em atendimento
    list = tickets.filter(t => t.requester === currentUser.username && t.status !== 'archived' && t.status !== 'completed');
  } else if (isRequester && currentFilter === 'completed') {
    // Solicitante vendo seus concluídos — inclui archived (auto-arquivados)
    list = tickets.filter(t => t.requester === currentUser.username && (t.status === 'completed' || t.status === 'archived'));
  } else if (isRequester && currentFilter === 'archived') {
    // fallback — não usado mais, absorbed pelo completed
    list = tickets.filter(t => t.requester === currentUser.username && t.status === 'archived');
  } else if (currentFilter === 'available')   { list = tickets.filter(t => t.status === 'available' && t.ticketType !== 'material'); }
  else if (currentFilter === 'material')    { list = tickets.filter(t => t.ticketType === 'material' && t.status !== 'archived'); }
  else if (currentFilter === 'in-progress') { list = tickets.filter(t => (t.status === 'in-progress' || SUB_STATUS.has(t.status)) && t.ticketType !== 'material'); }
  else if (currentFilter === 'completed')   { list = tickets.filter(t => (t.status === 'completed' || t.status === 'archived') && t.ticketType !== 'material'); }
  else if (currentFilter === 'archived')    { list = tickets.filter(t => t.status === 'archived'); }  // fallback, não usado mais
  else { list = tickets.filter(t => t.status !== 'archived' && t.ticketType !== 'material'); }

  const searchVal = (document.getElementById('ticket-search')?.value || '').toLowerCase().trim();
  if (searchVal) {
    list = list.filter(t => {
      const numStr = t.number ? String(t.number).padStart(4, '0') : '';
      return t.title.toLowerCase().includes(searchVal) || numStr.includes(searchVal.replace('#', ''));
    });
  }

  if (!list.length) { board.style.display = 'none'; empty.style.display = 'block'; return; }
  empty.style.display = 'none';
  const useList = currentUser.role === 'requester' || currentFilter === 'archived';
  useList ? renderTicketsList(board, list) : renderTicketsCards(board, list);
  updateMaterialTabBadge();
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
    '<button class="tl-btn arc-unarchive" onclick="reopenTicket(\'' + ticket.id + '\')" title="Desarquivar">🔄</button>' +
    '<button class="tl-btn arc-delete" onclick="deleteTicket(\'' + ticket.id + '\')" title="Excluir">🗑️</button>' +
    '</span></div>';
}

function renderTicketsList(board, list) {
  const isArchived = currentFilter === 'archived' || currentFilter === 'completed';
  board.style.display = 'block';
  board.className = isArchived ? 'tickets-board list-view archived-list' : 'tickets-board list-view';
  if (isArchived) {
    board.innerHTML = '<div class="tl-header arc-header"><span class="tl-col tl-num">#</span><span class="tl-col tl-title">Título</span><span class="tl-col tl-setor">Setor</span><span class="tl-col tl-prio">Prioridade</span><span class="tl-col tl-date">Concluído em</span><span class="tl-col tl-arc-actions"></span></div>' + list.map(buildArchivedRow).join('');
    return;
  }
  board.innerHTML = `<div class="tl-header"><span class="tl-col tl-num">#</span><span class="tl-col tl-title">Título / Descrição</span><span class="tl-col tl-setor">Setor</span><span class="tl-col tl-prio">Prioridade</span><span class="tl-col tl-status">Status</span><span class="tl-col tl-date">Datas</span><span class="tl-col tl-actions"></span></div>
  ${list.map(ticket => {
    const status = ticket.status || 'available';
    const num = ticket.number ? (typeof ticket.number === 'string' ? ticket.number : '#' + String(ticket.number).padStart(4, '0')) : '—';
    const canEdit = ticket.requester === currentUser.username && status === 'available';
    const dateBlock = [ticket.date ? `<span class="tl-date-text">📅 ${ticket.date}</span>` : '', ticket.startedAt ? `<span class="tl-date-sub">▶️ ${ticket.startedAt}</span>` : '', ticket.completedAt ? `<span class="tl-date-done">✅ ${ticket.completedAt}</span>` : ''].filter(Boolean).join('');
    return `<div class="tl-row ${SUB_STATUS.has(status) ? 'in-progress' : status} prio-${ticket.priority || 'medium'}" onclick="openTicketDetail('${ticket.id}')" style="cursor:pointer">
      <span class="tl-col tl-num"><span class="tl-num-badge">${num}</span></span>
      <span class="tl-col tl-title"><span class="tl-title-text">${ticket.title}</span>${ticket.description ? `<span class="tl-desc">${ticket.description}</span>` : ''}${ticket.attachments?.length ? `<span class="tl-attach">📎 ${ticket.attachments.length} anexo(s)</span>` : ''}</span>
      <span class="tl-col tl-setor">${ticket.setor ? `<span class="tl-setor-tag">${ticket.setor}</span>` : '<span class="tl-empty">—</span>'}</span>
      <span class="tl-col tl-prio"><span class="tl-prio-tag ${ticket.priority || 'medium'}">${PRIORITY_LABEL[ticket.priority] || '—'}</span></span>
      <span class="tl-col tl-status"><span class="ticket-status-badge ${status}">${STATUS_LABEL[status]}</span>${ticket.attendant ? `<span class="tl-attendant-tag">👤 ${capitalizeName(ticket.attendant)}</span>` : ''}</span>
      <span class="tl-col tl-date">${dateBlock}</span>
      <span class="tl-col tl-actions" onclick="event.stopPropagation()">${canEdit ? `<button class="tl-btn edit" onclick="editTicket('${ticket.id}')">✎</button><button class="tl-btn del" onclick="deleteTicket('${ticket.id}')">✕</button>` : ''}</span>
    </div>`;
  }).join('')}`;
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
        actions = `<div class="ticket-actions-bottom"><button class="ticket-pull-btn" onclick="event.stopPropagation();setMatStatus('${ticket.id}','mat-ordered')">✅ Marcar Solicitado</button><button class="ticket-archive-btn" onclick="event.stopPropagation();archiveTicket('${ticket.id}')">📦 Arquivar</button></div>`;
      } else if (status === 'mat-ordered' && (currentUser.isAdmin || currentUser.isSuperAdmin)) {
        actions = `<div class="ticket-actions-bottom"><button class="ticket-archive-btn" onclick="event.stopPropagation();archiveTicket('${ticket.id}')">📦 Arquivar</button></div>`;
      }
    } else if (status === 'available') {
      actions = `<div class="ticket-actions-bottom"><button class="ticket-pull-btn" onclick="event.stopPropagation();pullTicket('${ticket.id}')">🎯 Assumir</button></div>`;
    } else if ((status === 'in-progress' || SUB_STATUS.has(status)) && (ticket.attendant === currentUser.username || currentUser.isAdmin || currentUser.isSuperAdmin)) {
      actions = `<div class="ticket-actions-bottom">
        <select class="ticket-substatus-select" onchange="event.stopPropagation();setSubStatus('${ticket.id}',this.value);this.blur()" onclick="event.stopPropagation()">
          <option value="in-progress" ${status==='in-progress'?'selected':''}>⚙️ Em Atendimento</option>
          <option value="in-analysis" ${status==='in-analysis'?'selected':''}>🔍 Em Análise</option>
          <option value="waiting-info" ${status==='waiting-info'?'selected':''}>💬 Aguard. Informações</option>
          <option value="waiting" ${status==='waiting'?'selected':''}>⏸️ Em Espera</option>
          <option value="requested" ${status==='requested'?'selected':''}>📋 Solicitado</option>
        </select>
        <button class="ticket-complete-btn" onclick="event.stopPropagation();completeTicket('${ticket.id}')">✅ Concluir</button>
        <button class="ticket-release-btn" onclick="event.stopPropagation();releaseTicket('${ticket.id}')">↩️ Devolver</button>
      </div>`;
    } else if ((status === 'completed' || status === 'archived') && (currentUser.isAdmin || currentUser.isSuperAdmin || ticket.attendant === currentUser.username)) {
      actions = `<div class="ticket-actions-bottom"><button class="ticket-reopen-btn" onclick="event.stopPropagation();reopenTicket('${ticket.id}')">🔄 Reabrir</button></div>`;
    } else if (false && status === 'archived') {  // nunca cai aqui — bloco unificado acima
      actions = `<div class="ticket-actions-bottom"><button class="ticket-reopen-btn" onclick="event.stopPropagation();reopenTicket('${ticket.id}')">🔄 Reabrir</button></div>`;
    }
    const numDisplay = ticket.number ? (typeof ticket.number === 'string' ? ticket.number : '#' + String(ticket.number).padStart(4, '0')) : '';
    const ticketNum  = numDisplay ? `<span class="ticket-number">${numDisplay}</span>` : '';
    const setorBadge = ticket.setor ? `<span class="ticket-setor-badge">🏢 ${ticket.setor}</span>` : '';
    const matBadge   = ticket.materialData?.qty ? `<div class="mat-info-row"><span class="mat-qty-badge">📦 ${ticket.materialData.qty} ${ticket.materialData.unitText || ticket.materialData.unit}</span>${ticket.materialData.needByDate ? `<span class="mat-date-badge">📅 Necessário: ${new Date(ticket.materialData.needByDate + 'T12:00:00').toLocaleDateString('pt-BR')}</span>` : ''}</div>` : '';
    const dates = [ticket.startedAt ? `<div class="ticket-date-row started"><span class="date-icon">▶️</span><span>Início: ${ticket.startedAt}</span></div>` : '', ticket.completedAt ? `<div class="ticket-date-row done"><span class="date-icon">✅</span><span>Concluído: ${ticket.completedAt}</span></div>` : ''].filter(Boolean).join('');
    const isDone = status === 'completed' || status === 'archived';
    const isMaterialCard = ticket.ticketType === 'material';
    const unseen = getUnseenCount(ticket);
    const badge = unseen > 0 ? `<span class="card-notif-badge">${unseen > 99 ? '99+' : unseen}</span>` : '';
    // VIP — verifica se o solicitante tem flag isVip
    const requesterData = users.find(u => u.username === ticket.requester);
    const isVipTicket   = !isDone && !!requesterData?.isVip;
    const vipBadge      = isVipTicket ? `<span class="vip-badge">⭐ VIP</span>` : '';
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
    return `<div class="ticket-card-wrapper" style="position:relative;${isMergeSelected ? 'outline:2px solid var(--accent);border-radius:15px;' : ''}" data-ticket-id="${ticket.id}">${badge}${mergeCheckbox}
      <div class="ticket-card ${status}${isDone ? '' : ' prio-' + prio}${isMaterialCard ? ' material-card' : ''}${isVipTicket ? ' vip-card' : ''}" onclick="${mergeMode ? `toggleSelectForMerge('${ticket.id}', event)` : `openTicketDetail('${ticket.id}')`}" style="cursor:pointer;">
        <div class="ticket-prio-stripe" style="${isDone ? 'background:#22c55e;' : ''}"></div>
        <div class="ticket-card-inner">
          <div class="ticket-content-area">
            <div class="ticket-badges-row">
              <span class="ticket-status-badge ${SUB_STATUS.has(status) ? 'in-progress' : status}">${STATUS_LABEL[status] || status}</span>
              ${ticket.ticketType === 'material' ? '<span class="ticket-type-badge">📦 Material</span>' : ''}
              ${vipBadge}
              <span class="ticket-priority-badge prio-${prio}">${PRIORITY_LABEL[prio]}</span>
              ${ticketNum}
            </div>
            <div class="ticket-header">
              <div class="ticket-title">${ticket.title}</div>
              ${canEdit ? `<div class="ticket-actions"><button class="ticket-edit-btn" onclick="event.stopPropagation();editTicket('${ticket.id}')">✎</button><button class="ticket-delete-btn" onclick="event.stopPropagation();deleteTicket('${ticket.id}')">✕</button></div>` : ''}
            </div>
            ${setorBadge}${matBadge}
            ${ticket.description ? `<div class="ticket-description">${ticket.description}</div>` : ''}
            ${ticket.attachments?.length ? `<div class="ticket-attachments">${ticket.attachments.map(f => `<div class="ticket-attachment-chip" onclick="event.stopPropagation();openAttachment('${ticket.id}','${f.id}')" title="Clique para visualizar" style="cursor:pointer;">📎 ${f.name}</div>`).join('')}</div>` : ''}
            <div class="ticket-meta">
              ${ticket.requester ? `<span class="ticket-meta-row"><span class="ticket-meta-label">Solicitante:</span> ${capitalizeName(ticket.requester)}</span>` : ''}
              ${ticket.attendant ? `<span class="ticket-meta-row"><span class="ticket-meta-label">Atendente:</span> ${capitalizeName(ticket.attendant)}</span>` : ''}
            </div>
            <div class="ticket-dates">${dates}</div>
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
  logTicketEvent(t, 'Material ' + (STATUS_LABEL[newStatus]||newStatus).toLowerCase() + ' por ' + capitalizeName(currentUser.username));
  saveTickets(); if (activeDetailId === id) openTicketDetail(id);
  showNotification('Status: ' + (STATUS_LABEL[newStatus]||newStatus), 'success');
}

function setSubStatus(id, subStatus) {
  const t = tickets.find(t => t.id === id); if (!t) return;
  t.status = subStatus;
  if (!t.startedAt) t.startedAt = new Date().toLocaleString('pt-BR');
  if (!t.attendant) t.attendant = currentUser.username;
  logTicketEvent(t, 'Status alterado para "' + (STATUS_LABEL[subStatus]||subStatus) + '" por ' + capitalizeName(currentUser.username));
  saveTickets(); if (activeDetailId === id) openTicketDetail(id);
  showNotification('Status: ' + (STATUS_LABEL[subStatus]||subStatus), 'success');
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
        🎯 Assumir Chamado
      </div>
      <div style="font-size:0.8rem;color:var(--muted);margin-bottom:1.2rem;">
        Defina a prioridade antes de assumir
      </div>
      <div style="display:flex;flex-direction:column;gap:0.5rem;margin-bottom:1.2rem;">
        ${[
          ['low',    '🟢', 'Baixa',   '#dcfce7','#16a34a'],
          ['medium', '🟡', 'Média',   '#fef9c3','#d97706'],
          ['high',   '🔴', 'Alta',    '#ffedd5','#c2410c'],
          ['urgent', '🚨', 'Urgente', '#fee2e2','#b91c1c'],
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
          🎯 Assumir Chamado
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
  t.status    = 'in-progress';
  t.attendant = currentUser.username;
  t.startedAt = new Date().toLocaleString('pt-BR');
  t.priority  = prio;
  logTicketEvent(t, `Chamado assumido por ${capitalizeName(currentUser.username)} com prioridade ${PRIORITY_LABEL[prio]}`);
  saveTickets();
  if (activeDetailId === id) openTicketDetail(id);
  showNotification(`Chamado "${t.title}" assumido! 🎯`, 'success');
}

function completeTicket(id) {
  const t = tickets.find(t => t.id === id); if (!t || !confirm(`Concluir o chamado "${t.title}"?`)) return;
  // Auto-arquiva ao concluir — etapa única
  const now = new Date().toLocaleString('pt-BR');
  t.status      = 'archived';
  t.completedAt = now;
  t.archivedAt  = now;
  t.subStatus   = null;
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
  t.status      = 'available';
  t.attendant   = null;
  t.startedAt   = null;
  t.completedAt = null;
  t.archivedAt  = null;
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
// MESCLAR CHAMADOS
// ════════════════════════════════════════════

function toggleMergeMode() {
  mergeMode = !mergeMode;
  selectedForMerge.clear();
  renderTickets();
  const btn = document.getElementById('merge-mode-btn');
  if (btn) {
    btn.style.background   = mergeMode ? 'var(--accent)' : '';
    btn.style.color        = mergeMode ? '#fff' : '';
    btn.style.borderColor  = mergeMode ? 'var(--accent)' : '';
    btn.textContent        = mergeMode ? '✕ Cancelar Mesclagem' : '🔗 Mesclar Chamados';
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
      <div style="font-size:1rem;font-weight:800;margin-bottom:0.3rem;">🔗 Mesclar Chamados</div>
      <div style="font-size:0.8rem;color:var(--muted);margin-bottom:1rem;">
        Escolha o chamado principal. Os demais serão arquivados e vinculados ao novo.
      </div>

      <div style="font-size:0.7rem;font-family:var(--font-mono);text-transform:uppercase;
        letter-spacing:0.1em;color:var(--muted);margin-bottom:0.5rem;">
        Chamado Principal
      </div>
      <div style="display:flex;flex-direction:column;gap:0.4rem;margin-bottom:1rem;">
        ${selected.map((t, i) => {
          const num = t.number ? (typeof t.number === 'string' ? t.number : '#' + String(t.number).padStart(4,'0')) : '—';
          return `<label style="display:flex;align-items:center;gap:0.75rem;
            background:var(--surface2);border:1.5px solid var(--border2);border-radius:10px;
            padding:0.65rem 1rem;cursor:pointer;"
            onmouseover="this.style.borderColor='var(--accent)'"
            onmouseout="this.querySelector('input').checked ? null : (this.style.borderColor='var(--border2)')">
            <input type="radio" name="merge-main" value="${t.id}" ${i===0?'checked':''}
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
        ⚠️ Os chamados não selecionados como principal serão <strong>arquivados</strong> 
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
          🔗 Confirmar Mesclagem
        </button>
      </div>
    </div>
  `;
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
}

function executeMerge() {
  const mainId   = document.querySelector('input[name="merge-main"]:checked')?.value;
  const modal    = document.getElementById('merge-confirm-modal');
  if (!mainId) return;
  if (modal) modal.remove();

  const mainTicket   = tickets.find(t => t.id === mainId);
  const otherTickets = tickets.filter(t => selectedForMerge.has(t.id) && t.id !== mainId);
  if (!mainTicket || !otherTickets.length) return;

  const mergedNums = otherTickets.map(t =>
    t.number ? (typeof t.number === 'string' ? t.number : '#' + String(t.number).padStart(4,'0')) : t.id
  ).join(', ');

  const mainNum = mainTicket.number
    ? (typeof mainTicket.number === 'string' ? mainTicket.number : '#' + String(mainTicket.number).padStart(4,'0'))
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
    t.status     = 'archived';
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
  if (btn) { btn.textContent = '🔗 Mesclar Chamados'; btn.style.background = ''; btn.style.color = ''; btn.style.borderColor = ''; }
  const banner = document.getElementById('merge-banner');
  if (banner) banner.style.display = 'none';
}
