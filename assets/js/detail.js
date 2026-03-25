// ===== DETAIL — Modal de detalhe, chat e comentários =====

// ── Controle de notificações por ticket ──
function getSeenKey(ticketId) {
  return 'seen:' + ticketId + ':' + (currentUser?.username || '');
}

function getSeenCount(ticketId) {
  return parseInt(localStorage.getItem(getSeenKey(ticketId)) || '0');
}

function countNotifiableEvents(ticket) {
  const msgs     = ticket.messages?.length || 0;
  const relevant = (ticket.history || []).filter(function (e) {
    const a = e.action.toLowerCase();
    return a.includes('assumido') || a.includes('concluido') || a.includes('devolvido') ||
           a.includes('reaberto') || a.includes('arquivado') || a.includes('prioridade');
  }).length;
  return msgs + relevant;
}

function markTicketSeen(ticket) {
  localStorage.setItem(getSeenKey(ticket.id), String(countNotifiableEvents(ticket)));
  // Atualiza badge imediatamente sem esperar o próximo ciclo do Firestore
  const wrapper = document.querySelector(`[data-ticket-id="${ticket.id}"] .card-notif-badge`);
  if (wrapper) wrapper.remove();
  // Re-renderiza só os badges sem redesenhar tudo
  document.querySelectorAll('.card-notif-badge').forEach(el => {
    const card = el.closest('[data-ticket-id]');
    if (!card) return;
    const tid = card.dataset.ticketId;
    const t   = tickets.find(t => t.id === tid);
    if (!t || getUnseenCount(t) === 0) el.remove();
  });
}

function getUnseenCount(ticket) {
  return Math.max(0, countNotifiableEvents(ticket) - getSeenCount(ticket.id));
}

// ── Helper para atualizar painel de histórico ──
function updateHistoryPanel(ticket) {
  const histBody = document.getElementById('hist-panel-body-content');
  if (histBody) histBody.innerHTML = renderHistory(ticket);
}

// ── Abertura e fechamento do modal ──
function openTicketDetail(id) {
  const ticket = tickets.find(t => t.id === id);
  if (!ticket) return;

  activeDetailId = id;
  markTicketSeen(ticket);
  renderTickets(); // Garante que o badge some imediatamente

  // Material visto automaticamente
  if (ticket.ticketType === 'material' && ticket.status === 'available' &&
      currentUser && currentUser.role !== 'requester') {
    ticket.status = 'mat-seen';
    logTicketEvent(ticket, 'Visualizado por ' + capitalizeName(currentUser.username));
    updateStats();
    updateMaterialTabBadge();
    db.collection('tickets').doc(ticket.id).set(ticket).catch(console.error);
  }

  document.getElementById('detail-modal').classList.add('open');
  renderDetailContent(ticket);

  // Listener em tempo real via Firestore — substitui o polling de localStorage
  clearInterval(detailPollInterval);
  if (window._detailUnsubscribe) { window._detailUnsubscribe(); window._detailUnsubscribe = null; }

  window._detailUnsubscribe = db.collection('tickets').doc(id).onSnapshot(docSnap => {
    if (!docSnap.exists) return;
    const fresh = docSnap.data();
    const idx   = tickets.findIndex(t => t.id === id);
    if (idx !== -1) tickets[idx] = fresh;
    // Só atualiza mensagens se o modal ainda estiver aberto nesse ticket
    if (activeDetailId === id) {
      renderDetailMessages(fresh);
      updateHistoryPanel(fresh);
      markTicketSeen(fresh);
    }
  });
}

function closeTicketDetail() {
  clearInterval(detailPollInterval);
  detailPollInterval = null;
  if (window._detailUnsubscribe) { window._detailUnsubscribe(); window._detailUnsubscribe = null; }
  activeDetailId = null;
  const overlay = document.getElementById('detail-modal');
  if (overlay) overlay.classList.remove('open');
}

// ── Toggles do painel ──
function toggleDetailInfo() {
  const panel = document.getElementById('detail-info-panel');
  const btn   = document.getElementById('detail-info-toggle-btn');
  const icon  = document.getElementById('detail-info-toggle-icon');
  if (!panel) return;
  const open = panel.classList.toggle('open');
  if (btn)  btn.classList.toggle('active', open);
  if (icon) icon.textContent = '📋';
}

function toggleHistSnap(id) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('open');
}

function toggleHistoryPanel() {
  const panel = document.getElementById('hist-panel');
  const btn   = document.getElementById('detail-hist-btn');
  if (!panel) return;
  const open = panel.classList.toggle('open');
  if (btn) {
    btn.classList.toggle('active', open);
    btn.title = open ? 'Fechar Histórico' : 'Ver Histórico de Atualizações';
  }
}

// ── Renderização do conteúdo ──
function renderDetailContent(ticket) {
  const status = ticket.status || 'available';
  const prio   = ticket.priority || 'medium';
  const num    = ticket.number ? `#${String(ticket.number).padStart(4, '0')}` : '';
  const reqName = capitalizeName(ticket.requester || '—');
  const attName = ticket.attendant ? capitalizeName(ticket.attendant) : null;

  document.getElementById('detail-modal-body').innerHTML = `
    <div class="detail-header-strip prio-${prio}">
      <div class="detail-header-left">
        <div class="detail-num-badge">${num}</div>
        <div>
          <div class="detail-title">${ticket.title}</div>
          <div class="detail-badges">
            <span class="ticket-status-badge ${status}">${STATUS_LABEL[status]}</span>
            <span class="ticket-priority-badge prio-${prio}">${PRIORITY_LABEL[prio]}</span>
            ${ticket.setor ? `<span class="detail-setor-badge">🏢 ${ticket.setor}</span>` : ''}
            <span class="detail-people-pill">📝 ${reqName}</span>
            ${attName ? `<span class="detail-people-pill attendant">👤 ${attName}</span>` : ''}
            <button class="detail-info-toggle-btn" id="detail-info-toggle-btn"
              onclick="toggleDetailInfo()" title="Ver detalhes do chamado">
              <span id="detail-info-toggle-icon">📋</span> Detalhes
            </button>
          </div>
        </div>
      </div>
      <div class="detail-header-btns">
        <button class="detail-hist-btn" id="detail-hist-btn"
          onclick="toggleHistoryPanel()" title="Ver Histórico de Atualizações">🕵️</button>
        <button class="detail-close-btn" onclick="closeTicketDetail()">✕</button>
      </div>
    </div>

    <div class="detail-info-panel" id="detail-info-panel">
      <div class="detail-info-panel-inner">
        ${ticket.description ? `
          <div class="dip-section">
            <div class="dip-label">📝 Descrição</div>
            <div class="dip-text">${ticket.description}</div>
          </div>` : ''}
        <div class="dip-section">
          <div class="dip-label">📅 Cronograma</div>
          <div class="dip-dates">
            ${ticket.date        ? `<div class="dip-date-row"><span class="ddi">📅</span><span>Aberto em</span><strong>${ticket.date}</strong></div>` : ''}
            ${ticket.startedAt   ? `<div class="dip-date-row started"><span class="ddi">▶️</span><span>Iniciado em</span><strong>${ticket.startedAt}</strong></div>` : ''}
            ${ticket.completedAt ? `<div class="dip-date-row done"><span class="ddi">✅</span><span>Concluído em</span><strong>${ticket.completedAt}</strong></div>` : ''}
          </div>
        </div>
        ${ticket.attachments?.length ? `
          <div class="dip-section">
            <div class="dip-label">📎 Anexos (${ticket.attachments.length})</div>
            <div class="dip-attachments">
              ${ticket.attachments.map(f => `<span class="dip-attach-chip" onclick="openAttachment('${ticket.id}','${f.id}')" style="cursor:pointer;" title="Clique para visualizar">📄 ${f.name}</span>`).join('')}
            </div>
          </div>` : ''}
      </div>
    </div>

    <div class="detail-chat-full">
      <div class="detail-chat-messages" id="detail-chat-messages">
        ${renderMessagesHTML(ticket)}
      </div>
      <div class="comment-toolbar">
        <button class="ct-btn" onclick="applyFormat('bold')"  title="Negrito"><strong>B</strong></button>
        <button class="ct-btn" onclick="applyFormat('italic')" title="Itálico"><em>I</em></button>
        <div class="ct-sep"></div>
        <select class="ct-select" onchange="applyFormat('fontSize',this.value);this.value=''" title="Tamanho">
          <option value="">Tamanho</option>
          <option value="1">Pequeno</option>
          <option value="3">Normal</option>
          <option value="5">Grande</option>
          <option value="7">Extra Grande</option>
        </select>
      </div>
      <div class="detail-chat-input-area">
        <div class="detail-chat-editor" id="detail-chat-editor" contenteditable="true"
          data-placeholder="Escreva um comentário..."
          onkeydown="if(event.key==='Enter'&&(event.ctrlKey||event.metaKey)){event.preventDefault();sendChatMessage()}"
        ></div>
        <button class="detail-chat-send" onclick="sendChatMessage()" title="Ctrl+Enter para enviar">Comentar ↵</button>
      </div>
    </div>
  `;

  updateHistoryPanel(ticket);
  scrollChatToBottom();
}

function renderMessagesHTML(ticket) {
  const msgs = ticket.messages || [];
  if (!msgs.length) {
    return `<div class="detail-chat-empty">Nenhuma mensagem ainda.<br>Seja o primeiro a escrever!</div>`;
  }
  return msgs.map(m => {
    const isMine   = m.username === currentUser?.username;
    const isSystem = m.type === 'system';
    if (isSystem) {
      return `<div class="chat-msg system"><span>${m.html || escapeHtml(m.text || '')}</span><span class="chat-time">${m.timestamp}</span></div>`;
    }
    const roleLabel = (m.role === 'superadmin' || m.role === 'attendant') ? 'Atendente' : 'Solicitante';
    const content   = m.html || escapeHtml(m.text || '');
    const canManage = currentUser && (m.username === currentUser.username || currentUser.isSuperAdmin);
    const ticketId  = activeDetailId;
    return `
      <div class="trello-comment${isMine ? ' mine' : ''}" id="comment-${m.id}">
        <div class="tc-avatar ${m.role}">${(m.username || '?')[0].toUpperCase()}</div>
        <div class="tc-body">
          <div class="tc-header">
            <span class="tc-author">${m.username}</span>
            <span class="tc-role ${m.role}">${roleLabel}</span>
            <span class="tc-ts">${m.timestamp}</span>
            ${canManage ? `
              <div class="tc-comment-actions">
                <button class="tc-action-btn edit"   onclick="editComment('${ticketId}','${m.id}')"   title="Editar">✎</button>
                <button class="tc-action-btn delete" onclick="deleteComment('${ticketId}','${m.id}')" title="Excluir">✕</button>
              </div>` : ''}
          </div>
          <div class="tc-content" id="tc-content-${m.id}">${content}</div>
        </div>
      </div>`;
  }).join('');
}

// ── Comentários ──
function sendChatMessage() {
  const editor = document.getElementById('detail-chat-editor');
  if (!editor) return;
  const html     = editor.innerHTML.trim();
  const stripped = html.replace(/<br\s*\/?>/gi, '').replace(/<[^>]+>/g, '').trim();
  if (!stripped || !activeDetailId || !currentUser) return;

  const idx = tickets.findIndex(t => t.id === activeDetailId);
  if (idx === -1) return;
  if (!tickets[idx].messages) tickets[idx].messages = [];

  tickets[idx].messages.push({
    id: Date.now().toString(),
    username: currentUser.username,
    role: currentUser.isSuperAdmin ? 'superadmin' : currentUser.role,
    html,
    timestamp: new Date().toLocaleString('pt-BR', {
      hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
    })
  });
  logTicketEvent(tickets[idx], `Comentário adicionado por ${capitalizeName(currentUser.username)}`);
  editor.innerHTML = '';

  // Salva direto no Firestore e renderiza imediatamente
  db.collection('tickets').doc(tickets[idx].id).set(tickets[idx])
    .then(() => {
      renderDetailMessages(tickets[idx]);
      updateHistoryPanel(tickets[idx]);
      scrollChatToBottom();
    })
    .catch(err => {
      console.error('[Chat] Erro ao salvar comentário:', err);
      showNotification('Erro ao enviar comentário. Tente novamente.', 'error');
    });
}

function deleteComment(ticketId, msgId) {
  if (!confirm('Excluir este comentário?')) return;
  const idx = tickets.findIndex(t => t.id === ticketId);
  if (idx === -1) return;
  const deletedMsg = (tickets[idx].messages || []).find(m => m.id === msgId);
  tickets[idx].messages = (tickets[idx].messages || []).filter(m => m.id !== msgId);
  logTicketEvent(tickets[idx], `Comentário excluído por ${capitalizeName(currentUser?.username)}`, deletedMsg?.html || '');

  db.collection('tickets').doc(ticketId).set(tickets[idx])
    .then(() => {
      renderDetailMessages(tickets[idx]);
      updateHistoryPanel(tickets[idx]);
    })
    .catch(err => console.error('[Chat] Erro ao excluir comentário:', err));
}

function editComment(ticketId, msgId) {
  const idx = tickets.findIndex(t => t.id === ticketId);
  if (idx === -1) return;
  const contentEl = document.getElementById('tc-content-' + msgId);
  if (!contentEl) return;

  contentEl.dataset.originalHtml = contentEl.innerHTML;
  contentEl.setAttribute('contenteditable', 'true');
  contentEl.classList.add('tc-editing');

  const range = document.createRange();
  range.selectNodeContents(contentEl);
  range.collapse(false);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  contentEl.focus();

  const actionsEl = contentEl.closest('.tc-body').querySelector('.tc-comment-actions');
  if (actionsEl) {
    const saveBtn   = document.createElement('button');
    const cancelBtn = document.createElement('button');
    saveBtn.className   = 'tc-action-btn save';   saveBtn.title   = 'Salvar (Ctrl+Enter)'; saveBtn.textContent   = '✓';
    cancelBtn.className = 'tc-action-btn cancel'; cancelBtn.title = 'Cancelar';             cancelBtn.textContent = '✕';
    saveBtn.onclick   = () => saveCommentEdit(ticketId, msgId);
    cancelBtn.onclick = () => cancelCommentEdit(msgId);
    actionsEl.innerHTML = '';
    actionsEl.appendChild(saveBtn);
    actionsEl.appendChild(cancelBtn);
    actionsEl.style.display = 'flex';
  }

  contentEl.onkeydown = function (e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); saveCommentEdit(ticketId, msgId); }
    if (e.key === 'Escape') { e.preventDefault(); cancelCommentEdit(msgId); }
  };
}

function saveCommentEdit(ticketId, msgId) {
  const idx = tickets.findIndex(t => t.id === ticketId);
  if (idx === -1) return;
  const contentEl = document.getElementById('tc-content-' + msgId);
  if (!contentEl) return;
  const newHtml  = contentEl.innerHTML.trim();
  const stripped = newHtml.replace(/<br\s*\/?>/gi, '').replace(/<[^>]+>/g, '').trim();
  if (!stripped) { alert('O comentário não pode ficar vazio.'); return; }
  const msgIdx = tickets[idx].messages.findIndex(m => m.id === msgId);
  if (msgIdx !== -1) {
    const prevHtml = tickets[idx].messages[msgIdx].html || '';
    tickets[idx].messages[msgIdx].html   = newHtml;
    tickets[idx].messages[msgIdx].edited = true;
    logTicketEvent(tickets[idx], `Comentário editado por ${capitalizeName(currentUser?.username)}`, prevHtml);
  }
  contentEl.setAttribute('contenteditable', 'false');
  contentEl.classList.remove('tc-editing');
  contentEl.onkeydown = null;

  db.collection('tickets').doc(ticketId).set(tickets[idx])
    .then(() => {
      renderDetailMessages(tickets[idx]);
      updateHistoryPanel(tickets[idx]);
    })
    .catch(err => console.error('[Chat] Erro ao editar comentário:', err));
}

function cancelCommentEdit(msgId) {
  const contentEl = document.getElementById('tc-content-' + msgId);
  if (!contentEl) return;
  if (contentEl.dataset.originalHtml !== undefined) {
    contentEl.innerHTML = contentEl.dataset.originalHtml;
    delete contentEl.dataset.originalHtml;
  }
  contentEl.setAttribute('contenteditable', 'false');
  contentEl.classList.remove('tc-editing');
  contentEl.onkeydown = null;
  const idx = tickets.findIndex(t => t.id === activeDetailId);
  if (idx !== -1) renderDetailMessages(tickets[idx]);
}

function renderDetailMessages(ticket) {
  const el = document.getElementById('detail-chat-messages');
  if (!el) return;
  const wasAtBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 60;
  el.innerHTML = renderMessagesHTML(ticket);
  if (wasAtBottom) scrollChatToBottom();
}

function scrollChatToBottom() {
  setTimeout(() => {
    const el = document.getElementById('detail-chat-messages');
    if (el) el.scrollTop = el.scrollHeight;
  }, 50);
}

function applyFormat(cmd, value) {
  document.getElementById('detail-chat-editor')?.focus();
  document.execCommand(cmd, false, value || null);
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}
