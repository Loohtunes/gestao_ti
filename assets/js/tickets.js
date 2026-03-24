// ===== TICKETS — CRUD, renderização e ações =====

function getNextTicketNumber(type) {
  if (type === 'material') {
    let mc = parseInt(localStorage.getItem('chamados-material-counter') || '0') + 1;
    localStorage.setItem('chamados-material-counter', mc.toString());
    return 'M' + String(mc).padStart(4, '0');
  }
  let counter = parseInt(localStorage.getItem('chamados-ticket-counter') || '0') + 1;
  localStorage.setItem('chamados-ticket-counter', counter.toString());
  return counter;
}

function loadTickets() {
  const saved = localStorage.getItem('chamados-tickets');
  if (saved) tickets = JSON.parse(saved);
  renderTickets();
  updateStats();
}

function saveTickets() {
  localStorage.setItem('chamados-tickets', JSON.stringify(tickets));
  renderTickets();
  updateStats();
  autoSaveToCloud();
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
  const src = currentUser.role === 'requester'
    ? tickets.filter(t => t.requester === currentUser.username)
    : tickets;
  document.getElementById('stat-available').textContent    = src.filter(t => t.status === 'available').length;
  document.getElementById('stat-in-progress').textContent  = src.filter(t => t.status === 'in-progress' || SUB_STATUS.has(t.status)).length;
  document.getElementById('stat-completed').textContent    = src.filter(t => t.status === 'completed').length;
}

function renderTickets() {
  const board = document.getElementById('tickets-board');
  const empty = document.getElementById('empty-state');
  if (!currentUser) return;

  let list = tickets;
  if (currentUser.role === 'requester' || currentFilter === 'my-requests') {
    list = tickets.filter(t => t.requester === currentUser.username && t.status !== 'archived');
  } else if (currentFilter === 'available') {
    list = tickets.filter(t => t.status === 'available' && t.ticketType !== 'material');
  } else if (currentFilter === 'material') {
    list = tickets.filter(t => t.ticketType === 'material' && t.status !== 'archived');
  } else if (currentFilter === 'in-progress') {
    list = tickets.filter(t => (t.status === 'in-progress' || SUB_STATUS.has(t.status)) && t.ticketType !== 'material');
  } else if (currentFilter === 'completed') {
    list = tickets.filter(t => t.status === 'completed' && t.ticketType !== 'material');
  } else if (currentFilter === 'archived') {
    list = tickets.filter(t => t.status === 'archived');
  } else {
    list = tickets.filter(t => t.status !== 'archived' && t.ticketType !== 'material');
  }

  // Filtro de busca
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

// ── Lista (solicitante + arquivados) ──
function buildArchivedRow(ticket) {
  const num      = ticket.number ? (typeof ticket.number === 'string' ? ticket.number : '#' + String(ticket.number).padStart(4, '0')) : '—';
  const prio     = ticket.priority || 'medium';
  const setorHtml = ticket.setor
    ? '<span class="tl-setor-tag">' + ticket.setor + '</span>'
    : '<span class="tl-empty">—</span>';
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
    '</span>' +
    '</div>';
}

function renderTicketsList(board, list) {
  const isArchived = currentFilter === 'archived';
  board.style.display = 'block';
  board.className = isArchived ? 'tickets-board list-view archived-list' : 'tickets-board list-view';

  if (isArchived) {
    board.innerHTML =
      '<div class="tl-header arc-header">' +
      '<span class="tl-col tl-num">#</span>' +
      '<span class="tl-col tl-title">Título</span>' +
      '<span class="tl-col tl-setor">Setor</span>' +
      '<span class="tl-col tl-prio">Prioridade</span>' +
      '<span class="tl-col tl-date">Concluído em</span>' +
      '<span class="tl-col tl-arc-actions"></span>' +
      '</div>' +
      list.map(buildArchivedRow).join('');
    return;
  }

  board.innerHTML = `
    <div class="tl-header">
      <span class="tl-col tl-num">#</span>
      <span class="tl-col tl-title">Título / Descrição</span>
      <span class="tl-col tl-setor">Setor</span>
      <span class="tl-col tl-prio">Prioridade</span>
      <span class="tl-col tl-status">Status</span>
      <span class="tl-col tl-date">Datas</span>
      <span class="tl-col tl-actions"></span>
    </div>
    ${list.map(ticket => {
      const status = ticket.status || 'available';
      const num    = ticket.number ? (typeof ticket.number === 'string' ? ticket.number : '#' + String(ticket.number).padStart(4, '0')) : '—';
      const canEdit = ticket.requester === currentUser.username && status === 'available';
      const dateBlock = [
        ticket.date        ? `<span class="tl-date-text">📅 ${ticket.date}</span>`          : '',
        ticket.startedAt   ? `<span class="tl-date-sub">▶️ ${ticket.startedAt}</span>`      : '',
        ticket.completedAt ? `<span class="tl-date-done">✅ ${ticket.completedAt}</span>`   : ''
      ].filter(Boolean).join('');
      return `
        <div class="tl-row ${SUB_STATUS.has(status) ? 'in-progress' : status} prio-${ticket.priority || 'medium'}"
             onclick="openTicketDetail('${ticket.id}')" style="cursor:pointer" title="Clique para ver detalhes">
          <span class="tl-col tl-num"><span class="tl-num-badge">${num}</span></span>
          <span class="tl-col tl-title">
            <span class="tl-title-text">${ticket.title}</span>
            ${ticket.description ? `<span class="tl-desc">${ticket.description}</span>` : ''}
            ${ticket.attachments?.length ? `<span class="tl-attach">📎 ${ticket.attachments.length} anexo(s)</span>` : ''}
          </span>
          <span class="tl-col tl-setor">
            ${ticket.setor ? `<span class="tl-setor-tag">${ticket.setor}</span>` : '<span class="tl-empty">—</span>'}
          </span>
          <span class="tl-col tl-prio">
            <span class="tl-prio-tag ${ticket.priority || 'medium'}">${PRIORITY_LABEL[ticket.priority] || '—'}</span>
          </span>
          <span class="tl-col tl-status">
            <span class="ticket-status-badge ${status}">${STATUS_LABEL[status]}</span>
            ${ticket.attendant ? `<span class="tl-attendant-tag">👤 ${capitalizeName(ticket.attendant)}</span>` : ''}
          </span>
          <span class="tl-col tl-date">${dateBlock}</span>
          <span class="tl-col tl-actions" onclick="event.stopPropagation()">
            ${canEdit ? `
              <button class="tl-btn edit" onclick="editTicket('${ticket.id}')" title="Editar">✎</button>
              <button class="tl-btn del"  onclick="deleteTicket('${ticket.id}')" title="Excluir">✕</button>
            ` : ''}
          </span>
        </div>`;
    }).join('')}
  `;
}

// ── Cards (atendente) ──
function renderTicketsCards(board, list) {
  board.style.display = 'grid';
  board.className = 'tickets-board';
  board.innerHTML = list.map(ticket => {
    const status = ticket.status || 'available';
    const prio   = ticket.priority || 'medium';
    const canEdit = currentUser.isAdmin || currentUser.isSuperAdmin ||
      ticket.requester === currentUser.username ||
      (status === 'in-progress' && ticket.attendant === currentUser.username);

    let actions = '';
    const isMat = ticket.ticketType === 'material';
    if (isMat) {
      if ((status === 'mat-seen' || status === 'available') &&
          (currentUser.isAdmin || currentUser.isSuperAdmin || currentUser.role === 'attendant')) {
        actions = `<div class="ticket-actions-bottom">
          <button class="ticket-pull-btn" onclick="event.stopPropagation();setMatStatus('${ticket.id}','mat-ordered')">✅ Marcar Solicitado</button>
          <button class="ticket-archive-btn" onclick="event.stopPropagation();archiveTicket('${ticket.id}')">📦 Arquivar</button>
        </div>`;
      } else if (status === 'mat-ordered' && (currentUser.isAdmin || currentUser.isSuperAdmin)) {
        actions = `<div class="ticket-actions-bottom">
          <button class="ticket-archive-btn" onclick="event.stopPropagation();archiveTicket('${ticket.id}')">📦 Arquivar</button>
        </div>`;
      }
    } else if (status === 'available') {
      actions = `<div class="ticket-actions-bottom">
        <button class="ticket-pull-btn" onclick="event.stopPropagation();pullTicket('${ticket.id}')">🎯 Assumir</button>
      </div>`;
    } else if ((status === 'in-progress' || SUB_STATUS.has(status)) &&
               (ticket.attendant === currentUser.username || currentUser.isAdmin || currentUser.isSuperAdmin)) {
      actions = `<div class="ticket-actions-bottom">
        <select class="ticket-substatus-select" onchange="event.stopPropagation();setSubStatus('${ticket.id}',this.value);this.blur()" onclick="event.stopPropagation()" title="Alterar sub-status">
          <option value="in-progress"  ${status === 'in-progress'  ? 'selected' : ''}>⚙️ Em Atendimento</option>
          <option value="in-analysis"  ${status === 'in-analysis'  ? 'selected' : ''}>🔍 Em Análise</option>
          <option value="waiting-info" ${status === 'waiting-info' ? 'selected' : ''}>💬 Aguard. Informações</option>
          <option value="waiting"      ${status === 'waiting'      ? 'selected' : ''}>⏸️ Em Espera</option>
          <option value="requested"    ${status === 'requested'    ? 'selected' : ''}>📋 Solicitado</option>
        </select>
        <button class="ticket-complete-btn" onclick="event.stopPropagation();completeTicket('${ticket.id}')">✅ Concluir</button>
        <button class="ticket-release-btn"  onclick="event.stopPropagation();releaseTicket('${ticket.id}')">↩️ Devolver</button>
      </div>`;
    } else if (status === 'completed' &&
               (currentUser.isAdmin || currentUser.isSuperAdmin || ticket.attendant === currentUser.username)) {
      actions = `<div class="ticket-actions-bottom">
        <button class="ticket-reopen-btn"  onclick="event.stopPropagation();reopenTicket('${ticket.id}')">🔄 Reabrir</button>
        <button class="ticket-archive-btn" onclick="event.stopPropagation();archiveTicket('${ticket.id}')">📦 Arquivar</button>
      </div>`;
    } else if (status === 'archived' && (currentUser.isAdmin || currentUser.isSuperAdmin)) {
      actions = `<div class="ticket-actions-bottom">
        <button class="ticket-reopen-btn" onclick="event.stopPropagation();reopenTicket('${ticket.id}')">🔄 Reabrir</button>
      </div>`;
    }

    const numDisplay = ticket.number
      ? (typeof ticket.number === 'string' ? ticket.number : '#' + String(ticket.number).padStart(4, '0'))
      : '';
    const ticketNum  = numDisplay ? `<span class="ticket-number">${numDisplay}</span>` : '';
    const setorBadge = ticket.setor ? `<span class="ticket-setor-badge">🏢 ${ticket.setor}</span>` : '';
    const matBadge   = ticket.materialData?.qty
      ? `<div class="mat-info-row">
           <span class="mat-qty-badge">📦 ${ticket.materialData.qty} ${ticket.materialData.unitText || ticket.materialData.unit}</span>
           ${ticket.materialData.needByDate ? `<span class="mat-date-badge">📅 Necessário: ${new Date(ticket.materialData.needByDate + 'T12:00:00').toLocaleDateString('pt-BR')}</span>` : ''}
         </div>` : '';
    const dates = [
      ticket.startedAt   ? `<div class="ticket-date-row started"><span class="date-icon">▶️</span><span>Início: ${ticket.startedAt}</span></div>`      : '',
      ticket.completedAt ? `<div class="ticket-date-row done"><span class="date-icon">✅</span><span>Concluído: ${ticket.completedAt}</span></div>` : ''
    ].filter(Boolean).join('');

    const isDone         = status === 'completed' || status === 'archived';
    const isMaterialCard = ticket.ticketType === 'material';
    const cardStyle      = isDone ? 'cursor:pointer;background:#f0fdf4;border-color:#86efac;' : 'cursor:pointer;';
    const unseen = getUnseenCount(ticket);
    const badge  = unseen > 0 ? `<span class="card-notif-badge">${unseen > 99 ? '99+' : unseen}</span>` : '';

    return `
      <div class="ticket-card-wrapper" style="position:relative;">
        ${badge}
        <div class="ticket-card ${status}${isDone ? '' : ' prio-' + prio}${isMaterialCard ? ' material-card' : ''}"
             onclick="openTicketDetail('${ticket.id}')" style="${cardStyle}" title="Clique para ver detalhes">
          <div class="ticket-prio-stripe" style="${isDone ? 'background:#22c55e;' : ''}"></div>
          <div class="ticket-card-inner">
            <div class="ticket-badges-row">
              <span class="ticket-status-badge ${SUB_STATUS.has(status) ? 'in-progress' : status} ${status}">
                ${STATUS_LABEL[status] || status}
              </span>
              ${ticket.ticketType === 'material' ? '<span class="ticket-type-badge">📦 Material</span>' : ''}
              <span class="ticket-priority-badge prio-${prio}">${PRIORITY_LABEL[prio]}</span>
              ${ticketNum}
            </div>
            <div class="ticket-header">
              <div class="ticket-title">${ticket.title}</div>
              ${canEdit ? `
                <div class="ticket-actions">
                  <button class="ticket-edit-btn"   onclick="event.stopPropagation();editTicket('${ticket.id}')"   title="Editar">✎</button>
                  <button class="ticket-delete-btn" onclick="event.stopPropagation();deleteTicket('${ticket.id}')" title="Excluir">✕</button>
                </div>` : ''}
            </div>
            ${setorBadge}
            ${matBadge}
            ${ticket.description ? `<div class="ticket-description">${ticket.description}</div>` : ''}
            ${ticket.attachments?.length ? `
              <div class="ticket-attachments">
                ${ticket.attachments.map(f => `<div class="ticket-attachment-chip">📎 ${f.name}</div>`).join('')}
              </div>` : ''}
            <div class="ticket-meta">
              ${ticket.requester ? `<span class="ticket-meta-row"><span class="ticket-meta-label">Solicitante:</span> ${capitalizeName(ticket.requester)}</span>` : ''}
              ${ticket.attendant ? `<span class="ticket-meta-row"><span class="ticket-meta-label">Atendente:</span> ${capitalizeName(ticket.attendant)}</span>` : ''}
            </div>
            <div class="ticket-dates">${dates}</div>
            ${actions}
          </div>
        </div>
      </div>`;
  }).join('');
}

// ── Ações nos tickets ──
function setMatStatus(id, newStatus) {
  const t = tickets.find(t => t.id === id);
  if (!t) return;
  t.status = newStatus;
  const label = STATUS_LABEL[newStatus] || newStatus;
  logTicketEvent(t, 'Material ' + label.toLowerCase() + ' por ' + capitalizeName(currentUser.username));
  saveTickets();
  if (activeDetailId === id) openTicketDetail(id);
  showNotification('Status: ' + label, 'success');
}

function setSubStatus(id, subStatus) {
  const t = tickets.find(t => t.id === id);
  if (!t) return;
  t.status = subStatus;
  if (!t.startedAt) t.startedAt = new Date().toLocaleString('pt-BR');
  if (!t.attendant) t.attendant = currentUser.username;
  const label = STATUS_LABEL[subStatus] || subStatus;
  logTicketEvent(t, 'Status alterado para "' + label + '" por ' + capitalizeName(currentUser.username));
  saveTickets();
  if (activeDetailId === id) openTicketDetail(id);
  showNotification('Status: ' + label, 'success');
}

function pullTicket(id) {
  const t = tickets.find(t => t.id === id);
  if (!t) return;
  if (t.status !== 'available') { showNotification('Este chamado não está mais disponível', 'error'); return; }
  t.status     = 'in-progress';
  t.attendant  = currentUser.username;
  t.startedAt  = new Date().toLocaleString('pt-BR');
  logTicketEvent(t, `Chamado assumido por ${capitalizeName(currentUser.username)}`);
  saveTickets();
  if (activeDetailId === id) openTicketDetail(id);
  showNotification(`Chamado "${t.title}" assumido! 🎯`, 'success');
}

function completeTicket(id) {
  const t = tickets.find(t => t.id === id);
  if (!t || !confirm(`Concluir o chamado "${t.title}"?`)) return;
  t.status      = 'completed';
  t.completedAt = new Date().toLocaleString('pt-BR');
  t.subStatus   = null;
  logTicketEvent(t, `Chamado concluído por ${capitalizeName(currentUser.username)}`);
  saveTickets();
  if (activeDetailId === id) openTicketDetail(id);
  showNotification(`Chamado "${t.title}" concluído! ✅`, 'success');
}

function releaseTicket(id) {
  const t = tickets.find(t => t.id === id);
  if (!t || !confirm(`Devolver o chamado "${t.title}" para a fila?`)) return;
  t.status    = 'available';
  t.attendant = null;
  t.startedAt = null;
  t.subStatus = null;
  logTicketEvent(t, `Chamado devolvido à fila por ${capitalizeName(currentUser.username)}`);
  saveTickets();
  if (activeDetailId === id) openTicketDetail(id);
  showNotification(`Chamado "${t.title}" devolvido à fila`, 'success');
}

function reopenTicket(id) {
  const t = tickets.find(t => t.id === id);
  if (!t || !confirm(`Reabrir o chamado "${t.title}"?`)) return;
  t.status      = 'available';
  t.attendant   = null;
  t.startedAt   = null;
  t.completedAt = null;
  logTicketEvent(t, `Chamado reaberto por ${capitalizeName(currentUser.username)}`);
  saveTickets();
  if (activeDetailId === id) openTicketDetail(id);
  showNotification(`Chamado "${t.title}" reaberto! 🔄`, 'success');
}

function archiveTicket(id) {
  const t = tickets.find(t => t.id === id);
  if (!t || !confirm(`Arquivar o chamado "${t.title}"?`)) return;
  t.status     = 'archived';
  t.archivedAt = new Date().toLocaleString('pt-BR');
  logTicketEvent(t, `Chamado arquivado por ${capitalizeName(currentUser.username)}`);
  saveTickets();
  closeTicketDetail();
  showNotification(`Chamado "${t.title}" arquivado. 📦`, 'success');
}

function deleteTicket(id) {
  if (!confirm('Tem certeza que deseja excluir este chamado?')) return;
  tickets = tickets.filter(t => t.id !== id);
  if (activeDetailId === id) closeTicketDetail();
  saveTickets();
}
