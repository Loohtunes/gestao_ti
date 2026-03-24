// ===== FORMS — Modal de criação e edição de chamados =====

function openTicketModal(ticketId = null) {
  editingTicketId = ticketId;
  ticketFiles     = [];

  const prioGroup = document.getElementById('ticket-priority-group');
  if (prioGroup) prioGroup.style.display = (currentUser?.role === 'requester') ? 'none' : 'flex';

  if (ticketId) {
    const t = tickets.find(t => t.id === ticketId);
    if (t) {
      document.getElementById('modal-title').textContent            = 'Editar Chamado';
      document.getElementById('ticket-title-input').value          = t.title;
      document.getElementById('ticket-description-input').value    = t.description || '';
      document.getElementById('ticket-priority-input').value       = t.priority || 'medium';
      document.getElementById('ticket-setor-input').value          = t.setor || '';
      document.getElementById('ticket-setor-input').disabled       = !isSuperAdmin();
      const hint = document.getElementById('setor-locked-hint');
      if (hint) hint.style.display = 'none';
      ticketFiles = [...(t.attachments || [])];
      renderTicketFiles();
    }
  } else {
    document.getElementById('modal-title').textContent         = 'Novo Chamado';
    document.getElementById('ticket-title-input').value        = '';
    document.getElementById('ticket-description-input').value  = '';
    document.getElementById('ticket-priority-input').value     = 'medium';
    document.getElementById('ticket-files-list').innerHTML     = '';
    setTicketType('error');

    const qtyInput  = document.getElementById('ticket-material-qty');
    const unitInput = document.getElementById('ticket-material-unit');
    const dateInput = document.getElementById('ticket-material-date');
    const unitBadge = document.getElementById('material-unit-badge');
    if (qtyInput)  qtyInput.value  = '';
    if (unitInput) unitInput.value = 'un';
    if (dateInput) dateInput.value = '';
    if (unitBadge) unitBadge.textContent = 'un.';

    const userSetor  = currentUser?.setor || '';
    const setorInput = document.getElementById('ticket-setor-input');
    const setorHint  = document.getElementById('setor-locked-hint');
    setorInput.value = userSetor;
    const locked = !!userSetor && !isSuperAdmin();
    setorInput.disabled = locked;
    if (setorHint) setorHint.style.display = locked ? 'block' : 'none';
  }
  document.getElementById('ticket-modal').classList.add('open');
}

function setTicketType(type) {
  const isError    = type === 'error';
  const isMaterial = type === 'material';
  const titleGroup   = document.getElementById('ticket-title-group');
  const prioGroup    = document.getElementById('ticket-priority-group');
  const attachGroup  = document.getElementById('ticket-attach-group');
  const materialGroup = document.getElementById('ticket-material-fields');
  const typeInput    = document.getElementById('ticket-type-input');
  const descLabel    = document.getElementById('ticket-desc-label');

  if (titleGroup)    titleGroup.style.display    = isError ? 'flex' : 'none';
  if (prioGroup)     prioGroup.style.display     = (isError && currentUser?.role !== 'requester') ? 'flex' : 'none';
  if (attachGroup)   attachGroup.style.display   = isError ? 'flex' : 'none';
  if (materialGroup) materialGroup.style.display = isMaterial ? 'flex' : 'none';
  if (typeInput)     typeInput.value             = type;
  if (descLabel)     descLabel.textContent       = isMaterial ? 'Material(is) a solicitar' : 'Descrição';

  document.getElementById('ticket-description-input').placeholder = isMaterial
    ? 'Ex: Resma de papel A4, cartucho HP 664...'
    : 'Descreva o chamado em detalhes...';

  if (isMaterial) {
    const dateInput = document.getElementById('ticket-material-date');
    if (dateInput) {
      const today = new Date().toISOString().split('T')[0];
      dateInput.min = today;
      if (!dateInput.value) dateInput.value = today;
    }
  }
}

function updateMaterialUnit(val) {
  // badge atualizado via onchange do select — nada extra necessário
}

function closeTicketModal() {
  document.getElementById('ticket-modal').classList.remove('open');
  const setorInput = document.getElementById('ticket-setor-input');
  if (setorInput) setorInput.disabled = false;
  editingTicketId = null;
  ticketFiles     = [];
}

function saveTicket() {
  const title      = document.getElementById('ticket-title-input').value.trim();
  const desc       = document.getElementById('ticket-description-input').value.trim();
  const setor      = document.getElementById('ticket-setor-input').value;
  const isRequester = currentUser?.role === 'requester';
  const prio       = isRequester ? 'medium' : document.getElementById('ticket-priority-input').value;
  const ticketType = document.getElementById('ticket-type-input')?.value || 'error';
  const isMaterial = ticketType === 'material';

  const matQty      = isMaterial ? (document.getElementById('ticket-material-qty')?.value  || '')   : '';
  const matUnit     = isMaterial ? (document.getElementById('ticket-material-unit')?.value || 'un') : '';
  const matUnitText = isMaterial
    ? (document.getElementById('ticket-material-unit')?.options[document.getElementById('ticket-material-unit')?.selectedIndex]?.text?.split(' — ')[0] || matUnit)
    : '';
  const matDate = isMaterial ? (document.getElementById('ticket-material-date')?.value || '') : '';

  if (!isMaterial && !title) { alert('Por favor, adicione um título ao chamado'); return; }
  if (isMaterial  && !desc)  { alert('Descreva os materiais a solicitar'); return; }

  const now = new Date().toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  if (editingTicketId) {
    const idx = tickets.findIndex(t => t.id === editingTicketId);
    if (idx !== -1) {
      const finalPrio = isRequester ? tickets[idx].priority : prio;
      tickets[idx] = { ...tickets[idx], title, description: desc, priority: finalPrio, setor, attachments: ticketFiles, updatedAt: now };
      logTicketEvent(tickets[idx], 'Chamado editado por ' + capitalizeName(currentUser?.username));
    }
  } else {
    const finalTitle   = isMaterial ? ('Solicitação de material — ' + (currentUser?.setor || 'Geral')) : title;
    const materialData = isMaterial ? { qty: matQty, unit: matUnit, unitText: matUnitText, needByDate: matDate } : null;
    const newTicket    = {
      id: Date.now().toString(),
      number: getNextTicketNumber(ticketType),
      title: finalTitle,
      description: desc,
      priority: isMaterial ? 'low' : prio,
      setor,
      ticketType,
      materialData,
      attachments: isMaterial ? [] : ticketFiles,
      date: now, createdAt: now,
      status: 'available',
      requester: currentUser?.username || 'Desconhecido',
      attendant: null, startedAt: null, completedAt: null,
      messages: [], history: []
    };
    logTicketEvent(newTicket, `Chamado aberto por ${capitalizeName(currentUser?.username)}`);
    tickets.unshift(newTicket);
  }
  saveTickets();
  closeTicketModal();
  showNotification('Chamado salvo com sucesso! 📝', 'success');
}

function editTicket(id) { openTicketModal(id); }

function handleTicketFiles(input) {
  Array.from(input.files).forEach(file => {
    ticketFiles.push({ name: file.name, size: file.size, type: file.type, id: Date.now() + Math.random() });
  });
  renderTicketFiles();
  input.value = '';
}

function renderTicketFiles() {
  document.getElementById('ticket-files-list').innerHTML = ticketFiles.map(f =>
    `<div class="file-item">
       <span>📄 ${f.name}</span>
       <span class="file-remove" onclick="removeTicketFile(${f.id})">✕</span>
     </div>`
  ).join('');
}

function removeTicketFile(fid) {
  ticketFiles = ticketFiles.filter(f => f.id !== fid);
  renderTicketFiles();
}
