// ===== DETAIL — Modal de detalhe, chat e comentários =====

// ── Controle de notificações por ticket ──
function getSeenKey(ticketId) {
  return 'seen:' + ticketId + ':' + (currentUser?.username || '');
}

function getSeenCount(ticketId) {
  return parseInt(localStorage.getItem(getSeenKey(ticketId)) || '0');
}

function countNotifiableEvents(ticket) {
  const msgs = ticket.messages?.length || 0;
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
    const t = tickets.find(t => t.id === tid);
    if (!t || getUnseenCount(t) === 0) el.remove();
  });
}

function getUnseenCount(ticket) {
  return Math.max(0, countNotifiableEvents(ticket) - getSeenCount(ticket.id));
}


// ── @ Menções ──

// Extrai @nomes de um HTML de comentário
function extractMentions(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  const text = div.textContent || '';
  // Regex permissiva: captura qualquer caractere não-espaço após @
  const matches = text.match(/@([^\s@<]+)/g) || [];
  return [...new Set(matches.map(m => m.slice(1).toLowerCase()))];
}

// Formata @nome em azul no HTML do comentário
function formatMentions(html) {
  return html.replace(/@([^\s@<"']+)/g, (match, name) => {
    const exists = users.some(u => u.username.toLowerCase() === name.toLowerCase());
    return exists
      ? `<span class="mention-tag">@${name}</span>`
      : match;
  });
}

// Verifica se o usuário atual tem menção pendente (ack=false)
function getMentionKey(ticketId) {
  return 'mentionAck:' + ticketId + ':' + (currentUser?.username || '');
}

// Reconhece a menção — chamado pelo banner "Ciente"
function ackMention(ticketId) {
  const idx = tickets.findIndex(t => t.id === ticketId);
  if (idx === -1) return;
  const username = currentUser?.username;
  if (!username) return;

  // Marca todas as menções para este usuário como lidas (case-insensitive)
  const usernameLower = username.toLowerCase();
  (tickets[idx].mentions || []).forEach(m => {
    if (m.to && m.to.toLowerCase() === usernameLower) m.ack = true;
  });

  db.collection('tickets').doc(ticketId).set(tickets[idx])
    .then(() => {
      // Remove banner e faixa azul
      const banner = document.getElementById('mention-banner');
      if (banner) banner.remove();
      renderTickets();
    });
}

// Scroll até a primeira menção não lida
function scrollToMention(ticketId) {
  const ticket = tickets.find(t => t.id === ticketId);
  if (!ticket) return;
  const username = currentUser?.username;
  const pending = (ticket.mentions || []).filter(m => m.to === username && !m.ack);
  if (!pending.length) return;
  const msgId = pending[0].messageId;
  const el = document.getElementById('comment-' + msgId);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
    const idx = tickets.findIndex(t => t.id === id);
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
  const btn = document.getElementById('detail-info-toggle-btn');
  const icon = document.getElementById('detail-info-toggle-icon');
  if (!panel) return;
  const open = panel.classList.toggle('open');
  if (btn) btn.classList.toggle('active', open);
  if (icon) icon.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;vertical-align:middle"><path d="M3 12h.01"/><path d="M3 18h.01"/><path d="M3 6h.01"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M8 6h13"/></svg>';
}

function toggleHistSnap(id) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('open');
}

function toggleHistoryPanel() {
  const panel = document.getElementById('hist-panel');
  const btn = document.getElementById('detail-hist-btn');
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
  const prio = ticket.priority || 'medium';
  const num = ticket.number ? `#${String(ticket.number).padStart(4, '0')}` : '';
  const reqName = capitalizeName(ticket.requester || '—');
  const attName = ticket.attendant ? capitalizeName(ticket.attendant) : null;

  const isTestTicket = ticket.ticketType === 'test';
  document.getElementById('detail-modal-body').innerHTML = `
    <div class="detail-header-strip ${isTestTicket ? 'test-strip' : 'prio-' + prio}">
      <div class="detail-header-left">
        <div class="detail-num-badge">${num}</div>
        <div>
          <div class="detail-title">${ticket.title}</div>
          <div class="detail-badges">
            <span class="ticket-status-badge ${status}">${STATUS_LABEL[status]}</span>
            <span class="ticket-priority-badge prio-${prio}">${PRIORITY_LABEL[prio]}</span>
            ${ticket.setor ? `<span class="detail-setor-badge" style="display:inline-flex;align-items:center;gap:4px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;vertical-align:middle"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg> ${ticket.setor}</span>` : ''}
            <span class="detail-people-pill" style="display:inline-flex;align-items:center;gap:4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;vertical-align:middle"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> ${reqName}</span>
            ${attName ? `<span class="detail-people-pill attendant" style="display:inline-flex;align-items:center;gap:4px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;vertical-align:middle"><path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/></svg> ${attName}</span>` : ''}
            <button class="detail-info-toggle-btn" id="detail-info-toggle-btn"
              onclick="toggleDetailInfo()" title="Ver detalhes do chamado">
              <span id="detail-info-toggle-icon" style="display:inline-flex;align-items:center;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;vertical-align:middle"><path d="M3 12h.01"/><path d="M3 18h.01"/><path d="M3 6h.01"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M8 6h13"/></svg></span> Detalhes
            </button>
          </div>
        </div>
      </div>
      <div class="detail-header-btns">
        <button class="detail-hist-btn" id="detail-hist-btn"
          onclick="toggleHistoryPanel()" title="Ver Histórico de Atualizações" style="display:inline-flex;align-items:center;justify-content:center;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;vertical-align:middle"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l3 3"/><path d="M22 2 12 12"/></svg></button>
        <button class="detail-close-btn" onclick="closeTicketDetail()">✕</button>
      </div>
    </div>

    <div class="detail-info-panel" id="detail-info-panel">
      <div class="detail-info-panel-inner">
        ${ticket.description ? `
          <div class="dip-section">
            <div class="dip-label" style="display:flex;align-items:center;gap:5px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;vertical-align:middle"><path d="M15 12H3"/><path d="M17 18H3"/><path d="M21 6H3"/></svg> Descrição</div>
            <div class="dip-text">${ticket.description}</div>
          </div>` : ''}
        <div class="dip-section">
          <div class="dip-label" style="display:flex;align-items:center;gap:5px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;vertical-align:middle"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg> Cronograma</div>
          <div class="dip-dates">
            ${ticket.date ? `<div class="dip-date-row"><span class="ddi"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;vertical-align:middle"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg></span><span>Aberto em</span><strong>${ticket.date}</strong></div>` : ''}
            ${ticket.startedAt ? `<div class="dip-date-row started"><span class="ddi"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;vertical-align:middle"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg></span><span>Iniciado em</span><strong>${ticket.startedAt}</strong></div>` : ''}
            ${ticket.completedAt ? `<div class="dip-date-row done"><span class="ddi"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;vertical-align:middle"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg></span><span>Concluído em</span><strong>${ticket.completedAt}</strong></div>` : ''}
          </div>
        </div>
        ${ticket.attachments?.length ? `
          <div class="dip-section">
            <div class="dip-label" style="display:flex;align-items:center;gap:5px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;vertical-align:middle"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg> Anexos (${ticket.attachments.length})</div>
            <div class="dip-attachments">
              ${ticket.attachments.map(f => `<span class="dip-attach-chip" onclick="openAttachment('${ticket.id}','${f.id}')" style="cursor:pointer;display:inline-flex;align-items:center;gap:4px;" title="Clique para visualizar"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;vertical-align:middle"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg> ${f.name}</span>`).join('')}
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
  setupMentionListener();

  // Banner de menção pendente
  const existingBanner = document.getElementById('mention-banner');
  if (existingBanner) existingBanner.remove();
  if (hasPendingMention(ticket)) {
    const chatFull = document.querySelector('.detail-chat-full');
    if (chatFull) {
      const banner = document.createElement('div');
      banner.id = 'mention-banner';
      banner.className = 'mention-banner';
      banner.innerHTML = `
        <span class="mention-banner-text" style="display:inline-flex;align-items:center;gap:5px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;vertical-align:middle"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg> Você foi mencionado neste chamado</span>
        <div class="mention-banner-btns">
          <button class="mention-banner-see" onclick="scrollToMention('${ticket.id}')">↓ Ver</button>
          <button class="mention-banner-ack" onclick="ackMention('${ticket.id}')"> Ciente</button>
        </div>`;
      chatFull.insertBefore(banner, chatFull.firstChild);
    }
  }
}

function renderMessagesHTML(ticket) {
  const msgs = ticket.messages || [];
  if (!msgs.length) {
    return `<div class="detail-chat-empty">Nenhuma mensagem ainda.<br>Seja o primeiro a escrever!</div>`;
  }
  return msgs.map(m => {
    const isMine = m.username === currentUser?.username;
    const isSystem = m.type === 'system';
    if (isSystem) {
      return `<div class="chat-msg system"><span>${m.html || escapeHtml(m.text || '')}</span><span class="chat-time">${m.timestamp}</span></div>`;
    }
    const roleLabel = (m.role === 'superadmin' || m.role === 'attendant') ? 'Atendente' : 'Solicitante';
    const content = m.html || escapeHtml(m.text || '');  // já formatado com <span class="mention-tag">
    const canManage = currentUser && (m.username === currentUser.username || currentUser.isSuperAdmin);
    const ticketId = activeDetailId;
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


// ── Dropdown de @ menção no editor ──
function removeMentionDropdown() {
  const d = document.getElementById('mention-dropdown');
  if (d) d.remove();
}

function setupMentionListener() {
  const editor = document.getElementById('detail-chat-editor');
  if (!editor) return;

  editor.addEventListener('input', function () {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    const text = range.startContainer.textContent || '';
    const caret = range.startOffset;

    // Encontrar @ antes do cursor
    const before = text.slice(0, caret);
    const atMatch = before.match(/@(\w*)$/);

    removeMentionDropdown();
    if (!atMatch) return;

    const query = atMatch[1].toLowerCase();
    const filtered = users.filter(u =>
      u.username.toLowerCase() !== currentUser?.username.toLowerCase() &&
      (query === '' || u.username.toLowerCase().startsWith(query))
    ).slice(0, 6);

    if (!filtered.length) return;

    // Posicionar dropdown com fixed — independente do container pai
    const rect = range.getBoundingClientRect();

    const dropdown = document.createElement('div');
    dropdown.id = 'mention-dropdown';
    dropdown.className = 'mention-dropdown';
    dropdown.style.cssText = `position:fixed;top:${rect.bottom + 4}px;left:${rect.left}px;z-index:9999;`;

    filtered.forEach(u => {
      const item = document.createElement('div');
      item.className = 'mention-dropdown-item';
      item.innerHTML = `<span class="mention-dd-user">@${u.username}</span><span class="mention-dd-setor">${u.setor || ''}</span>`;
      item.onmousedown = function (e) {
        e.preventDefault();
        // Substituir @query pelo @nome formatado
        const newRange = sel.getRangeAt(0);
        const node = newRange.startContainer;
        const txt = node.textContent;
        const caretPos = newRange.startOffset;
        const start = txt.lastIndexOf('@', caretPos - 1);
        node.textContent = txt.slice(0, start) + '@' + u.username + ' ' + txt.slice(caretPos);
        // Mover cursor para após o nome inserido
        const newPos = start + u.username.length + 2;
        const r = document.createRange();
        r.setStart(node, Math.min(newPos, node.textContent.length));
        r.collapse(true);
        sel.removeAllRanges();
        sel.addRange(r);
        removeMentionDropdown();
      };
      dropdown.appendChild(item);
    });

    // Fechar ao clicar fora
    setTimeout(() => document.addEventListener('click', removeMentionDropdown, { once: true }), 0);

    document.body.appendChild(dropdown);
  });

  editor.addEventListener('keydown', function (e) {
    const dd = document.getElementById('mention-dropdown');
    if (!dd) return;
    if (e.key === 'Escape') { removeMentionDropdown(); e.preventDefault(); }
    if (e.key === 'ArrowDown') {
      const items = dd.querySelectorAll('.mention-dropdown-item');
      const active = dd.querySelector('.mention-dropdown-item.active');
      if (!active) items[0]?.classList.add('active');
      else {
        active.classList.remove('active');
        (active.nextElementSibling || items[0])?.classList.add('active');
      }
      e.preventDefault();
    }
    if (e.key === 'ArrowUp') {
      const items = dd.querySelectorAll('.mention-dropdown-item');
      const active = dd.querySelector('.mention-dropdown-item.active');
      if (!active) items[items.length - 1]?.classList.add('active');
      else {
        active.classList.remove('active');
        (active.previousElementSibling || items[items.length - 1])?.classList.add('active');
      }
      e.preventDefault();
    }
    if (e.key === 'Enter') {
      const active = dd.querySelector('.mention-dropdown-item.active');
      if (active) { active.dispatchEvent(new MouseEvent('mousedown')); e.preventDefault(); }
    }
  });
}

// ── Comentários ──
function sendChatMessage() {
  const editor = document.getElementById('detail-chat-editor');
  if (!editor) return;
  const html = editor.innerHTML.trim();
  const stripped = html.replace(/<br\s*\/?>/gi, '').replace(/<[^>]+>/g, '').trim();
  if (!stripped || !activeDetailId || !currentUser) return;

  const idx = tickets.findIndex(t => t.id === activeDetailId);
  if (idx === -1) return;
  if (!tickets[idx].messages) tickets[idx].messages = [];

  const msgId = Date.now().toString();
  const formattedHtml = formatMentions(html);
  tickets[idx].messages.push({
    id: msgId,
    username: currentUser.username,
    role: currentUser.isSuperAdmin ? 'superadmin' : currentUser.role,
    html: formattedHtml,
    timestamp: new Date().toLocaleString('pt-BR', {
      hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
    })
  });

  // Salvar menções no ticket
  const mentionedNames = extractMentions(html);
  if (mentionedNames.length) {
    if (!tickets[idx].mentions) tickets[idx].mentions = [];
    mentionedNames.forEach(name => {
      const mentioned = users.find(u => u.username.toLowerCase() === name.toLowerCase());
      if (mentioned && mentioned.username !== currentUser.username) {
        tickets[idx].mentions.push({
          to: mentioned.username,
          from: currentUser.username,
          messageId: msgId,
          ack: false,
          timestamp: new Date().toISOString()
        });
      }
    });
  }

  logTicketEvent(tickets[idx], `Comentário adicionado por ${capitalizeName(currentUser.username)}`);
  editor.innerHTML = '';
  removeMentionDropdown();

  // Salva direto no Firestore e renderiza imediatamente
  db.collection('tickets').doc(tickets[idx].id).set(tickets[idx])
    .then(() => {
      renderDetailMessages(tickets[idx]);
      updateHistoryPanel(tickets[idx]);
      scrollChatToBottom();
      renderTickets(); // atualiza badges de menção nos cards
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
    const saveBtn = document.createElement('button');
    const cancelBtn = document.createElement('button');
    saveBtn.className = 'tc-action-btn save'; saveBtn.title = 'Salvar (Ctrl+Enter)'; saveBtn.textContent = '✓';
    cancelBtn.className = 'tc-action-btn cancel'; cancelBtn.title = 'Cancelar'; cancelBtn.textContent = '✕';
    saveBtn.onclick = () => saveCommentEdit(ticketId, msgId);
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
  const newHtml = contentEl.innerHTML.trim();
  const stripped = newHtml.replace(/<br\s*\/?>/gi, '').replace(/<[^>]+>/g, '').trim();
  if (!stripped) { alert('O comentário não pode ficar vazio.'); return; }
  const msgIdx = tickets[idx].messages.findIndex(m => m.id === msgId);
  if (msgIdx !== -1) {
    const prevHtml = tickets[idx].messages[msgIdx].html || '';
    tickets[idx].messages[msgIdx].html = newHtml;
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