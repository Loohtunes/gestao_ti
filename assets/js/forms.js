// ===== FORMS — Modal de criação e edição de chamados =====

function openTicketModal(ticketId = null) {
  editingTicketId = ticketId;
  ticketFiles = [];
  const prioGroup = document.getElementById('ticket-priority-group');
  if (prioGroup) prioGroup.style.display = (currentUser?.role === 'requester') ? 'none' : 'flex';
  // Campo "Abrir em nome de" — só admins/superadmins
  const onBehalfGroup = document.getElementById('ticket-onbehalf-group');
  const onBehalfSelect = document.getElementById('ticket-onbehalf-input');
  if (onBehalfGroup && onBehalfSelect) {
    const canOpenForOthers = currentUser?.isAdmin || currentUser?.isSuperAdmin;
    onBehalfGroup.style.display = canOpenForOthers ? 'flex' : 'none';
    if (canOpenForOthers) {
      // Popular com todos os usuários exceto o próprio admin
      onBehalfSelect.innerHTML = `<option value="">Abrir como eu mesmo (${currentUser.username})</option>` +
        users
          .filter(u => u.id !== currentUser.id)
          .map(u => `<option value="${u.username}">${u.username} — ${u.setor || 'Sem setor'}</option>`)
          .join('');
      onBehalfSelect.value = '';
    }
  }

  if (ticketId) {
    const t = tickets.find(t => t.id === ticketId);
    if (t) {
      document.getElementById('modal-title').textContent = 'Editar Chamado';
      document.getElementById('ticket-title-input').value = t.title;
      document.getElementById('ticket-description-input').value = t.description || '';
      document.getElementById('ticket-priority-input').value = t.priority || 'medium';
      document.getElementById('ticket-setor-input').value = t.setor || '';
      document.getElementById('ticket-setor-input').disabled = !isSuperAdmin();
      const hint = document.getElementById('setor-locked-hint');
      if (hint) hint.style.display = 'none';
      ticketFiles = [...(t.attachments || [])];
      renderTicketFiles();
      // Pré-selecionar o solicitante atual no campo onBehalf
      if (onBehalfSelect && (currentUser?.isAdmin || currentUser?.isSuperAdmin)) {
        const isOwnTicket = t.requester === currentUser.username;
        onBehalfSelect.value = isOwnTicket ? '' : (t.requester || '');
      }
    }
  } else {
    document.getElementById('modal-title').textContent = 'Novo Chamado';
    document.getElementById('ticket-title-input').value = '';
    document.getElementById('ticket-description-input').value = '';
    document.getElementById('ticket-priority-input').value = 'medium';
    document.getElementById('ticket-files-list').innerHTML = '';
    setTicketType('error');
    const qtyInput = document.getElementById('ticket-material-qty');
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
  const titleGroup    = document.getElementById('ticket-title-group');
  const prioGroup     = document.getElementById('ticket-priority-group');
  const attachGroup   = document.getElementById('ticket-attach-group');
  const materialGroup = document.getElementById('ticket-material-fields');
  const typeInput     = document.getElementById('ticket-type-input');
  const descLabel     = document.getElementById('ticket-desc-label');
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

function updateMaterialUnit(val) {}

function closeTicketModal() {
  document.getElementById('ticket-modal').classList.remove('open');
  const setorInput = document.getElementById('ticket-setor-input');
  if (setorInput) setorInput.disabled = false;
  editingTicketId = null;
  ticketFiles = [];
}

let _savingTicket = false;

async function saveTicket() {
  // Proteção contra duplo clique
  if (_savingTicket) return;
  _savingTicket = true;
  const saveBtn = document.querySelector('#ticket-modal .btn-save');
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Salvando...'; }
  const title      = document.getElementById('ticket-title-input').value.trim();
  const desc       = document.getElementById('ticket-description-input').value.trim();
  const setor      = document.getElementById('ticket-setor-input').value;
  const isRequester = currentUser?.role === 'requester';
  const prio       = isRequester ? 'medium' : document.getElementById('ticket-priority-input').value;
  const ticketType = document.getElementById('ticket-type-input')?.value || 'error';
  const isMaterial = ticketType === 'material';
  const matQty     = isMaterial ? (document.getElementById('ticket-material-qty')?.value  || '') : '';
  const matUnit    = isMaterial ? (document.getElementById('ticket-material-unit')?.value || 'un') : '';
  const matUnitText = isMaterial
    ? (document.getElementById('ticket-material-unit')?.options[document.getElementById('ticket-material-unit')?.selectedIndex]?.text?.split(' — ')[0] || matUnit)
    : '';
  const matDate = isMaterial ? (document.getElementById('ticket-material-date')?.value || '') : '';
  if (!isMaterial && !title) { alert('Por favor, adicione um título ao chamado'); return; }
  if (isMaterial  && !desc)  { alert('Descreva os materiais a solicitar'); return; }

  // Solicitante: admin pode abrir em nome de outro usuário
  const onBehalfVal = document.getElementById('ticket-onbehalf-input')?.value?.trim();
  const effectiveRequester = (onBehalfVal && (currentUser?.isAdmin || currentUser?.isSuperAdmin))
    ? onBehalfVal
    : currentUser?.username || 'Desconhecido';

  // Setor do solicitante efetivo
  const requesterUser = users.find(u => u.username === effectiveRequester);
  const effectiveSetor = setor || requesterUser?.setor || '';

  const now = new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (editingTicketId) {
    const idx = tickets.findIndex(t => t.id === editingTicketId);
    if (idx !== -1) {
      const finalPrio = isRequester ? tickets[idx].priority : prio;
      // Se admin selecionou um solicitante diferente, atualiza; senão mantém o original
      const finalRequester = (onBehalfVal && (currentUser?.isAdmin || currentUser?.isSuperAdmin))
        ? onBehalfVal
        : tickets[idx].requester;
      const prevRequester = tickets[idx].requester;
      tickets[idx] = { ...tickets[idx], title, description: desc, priority: finalPrio, setor, attachments: ticketFiles, requester: finalRequester, updatedAt: now };
      if (finalRequester !== prevRequester) {
        logTicketEvent(tickets[idx], `Solicitante alterado de "${capitalizeName(prevRequester)}" para "${capitalizeName(finalRequester)}" por ${capitalizeName(currentUser?.username)}`);
      }
      logTicketEvent(tickets[idx], 'Chamado editado por ' + capitalizeName(currentUser?.username));
    }
  } else {
    const number = await getNextTicketNumber(ticketType);
    const finalTitle   = isMaterial ? ('Solicitação de material — ' + (effectiveSetor || 'Geral')) : title;
    const materialData = isMaterial ? { qty: matQty, unit: matUnit, unitText: matUnitText, needByDate: matDate } : null;
    const newTicket = {
      id: Date.now().toString(), number, title: finalTitle, description: desc,
      priority: isMaterial ? 'low' : 'none', setor, ticketType, materialData,
      attachments: isMaterial ? [] : ticketFiles, date: now, createdAt: now,
      status: 'available', requester: effectiveRequester,
      attendant: null, startedAt: null, completedAt: null, messages: [], history: []
    };
    logTicketEvent(newTicket, `Chamado aberto por ${capitalizeName(currentUser?.username)}`);
    tickets.unshift(newTicket);
    // Salva direto no Firestore — evita reescrever todos os tickets e disparar duplicatas
    try {
      await db.collection('tickets').doc(newTicket.id).set(newTicket);
      closeTicketModal();
      showNotification('Chamado salvo com sucesso! 📝', 'success');
    } catch (err) {
      console.error('[Forms] Erro ao salvar chamado:', err);
      tickets.shift(); // reverte o unshift em caso de erro
      showNotification('Erro ao salvar chamado. Tente novamente.', 'error');
    } finally {
      _savingTicket = false;
      if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Salvar Chamado'; }
    }
    return;
  }

  // Edição — salva via batch normalmente
  saveTickets();
  closeTicketModal();
  showNotification('Chamado salvo com sucesso! 📝', 'success');
  _savingTicket = false;
  if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Salvar Chamado'; }
}

function editTicket(id) { openTicketModal(id); }

function handleTicketFiles(input) {
  const maxSizeKB = 500;
  Array.from(input.files).forEach(file => {
    if (file.size > maxSizeKB * 1024) {
      showNotification(`"${file.name}" excede ${maxSizeKB}KB. Reduza o tamanho do arquivo.`, 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      ticketFiles.push({
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        name: file.name,
        size: file.size,
        type: file.type,
        data: e.target.result // base64 data URL
      });
      renderTicketFiles();
    };
    reader.readAsDataURL(file);
  });
  input.value = '';
}

function renderTicketFiles() {
  document.getElementById('ticket-files-list').innerHTML = ticketFiles.map(f =>
    `<div class="file-item">
      <span style="cursor:pointer;" onclick="openAttachmentPreview('${f.id}')">📎 ${f.name} <span style="color:var(--muted);font-size:0.7rem;">(${(f.size/1024).toFixed(1)}KB)</span></span>
      <span class="file-remove" onclick="removeTicketFile('${f.id}')">✕</span>
    </div>`
  ).join('');
}

function removeTicketFile(fid) {
  ticketFiles = ticketFiles.filter(f => f.id !== fid);
  renderTicketFiles();
}

// Abre preview de arquivo ainda não salvo (na tela de criação)
function openAttachmentPreview(fid) {
  const f = ticketFiles.find(f => f.id === fid);
  if (!f || !f.data) return;
  openAttachmentData(f.data, f.name, f.type);
}

// Abre anexo já salvo no chamado
function openAttachment(ticketId, fileId) {
  const ticket = tickets.find(t => t.id === ticketId);
  if (!ticket) return;
  const f = (ticket.attachments || []).find(a => String(a.id) === String(fileId));
  if (!f || !f.data) { showNotification('Arquivo não disponível.', 'error'); return; }
  openAttachmentData(f.data, f.name, f.type);
}

// Visualizador universal de anexos
function openAttachmentData(dataUrl, name, type) {
  const isImage = type && type.startsWith('image/');
  const isPdf   = type === 'application/pdf';
  if (isImage || isPdf) {
    // Abre em nova aba para visualização direta
    const win = window.open();
    win.document.write(`<html><head><title>${name}</title></head><body style="margin:0;background:#111;">
      ${isImage
        ? `<img src="${dataUrl}" style="max-width:100%;display:block;margin:auto;">`
        : `<embed src="${dataUrl}" type="application/pdf" width="100%" height="100%" style="height:100vh;">`
      }
    </body></html>`);
  } else {
    // Para outros tipos, força download
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = name;
    a.click();
  }
}
