// ===== FORMS — Modal de criação e edição de chamados =====

function openTicketModal(ticketId = null, isTest = false) {
  editingTicketId = ticketId;
  ticketFiles = [];
  _isTestTicket = isTest;

  // Mostrar/esconder botão de tipo teste
  const testTypeBtn = document.getElementById('type-btn-test');
  if (testTypeBtn) testTypeBtn.style.display = (currentUser?.isAdmin || currentUser?.isSuperAdmin) ? 'flex' : 'none';

  const prioGroup = document.getElementById('ticket-priority-group');
  if (prioGroup) prioGroup.style.display = 'none'; // prioridade definida pelo atendente após abertura
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
    // Ativa botão de tipo correspondente
    document.querySelectorAll('.ticket-type-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('type-btn-error')?.classList.add('active');
    // Carregar templates disponíveis
    loadTicketTemplates();
    const userSetor = currentUser?.setor || '';
    const setorInput = document.getElementById('ticket-setor-input');
    const setorHint = document.getElementById('setor-locked-hint');
    setorInput.value = userSetor;
    const locked = !!userSetor && !isSuperAdmin();
    setorInput.disabled = locked;
    if (setorHint) setorHint.style.display = locked ? 'block' : 'none';
  }
  document.getElementById('ticket-modal').classList.add('open');
}

function setTicketType(type) {
  const isError = type === 'error' || type === 'test';
  const titleGroup = document.getElementById('ticket-title-group');
  const prioGroup = document.getElementById('ticket-priority-group');
  const attachGroup = document.getElementById('ticket-attach-group');
  const typeInput = document.getElementById('ticket-type-input');
  const descLabel = document.getElementById('ticket-desc-label');
  if (titleGroup) titleGroup.style.display = isError ? 'flex' : 'none';
  if (prioGroup) prioGroup.style.display = 'none';
  if (attachGroup) attachGroup.style.display = isError ? 'flex' : 'none';
  if (typeInput) typeInput.value = type;
  if (descLabel) descLabel.textContent = 'Descrição';
  document.getElementById('ticket-description-input').placeholder = 'Descreva o chamado em detalhes...';
}


function closeTicketModal() {
  document.getElementById('ticket-modal').classList.remove('open');
  const tmplSelect = document.getElementById('ticket-template-input');
  if (tmplSelect) tmplSelect.value = '';
  const tmplGroup = document.getElementById('ticket-template-group');
  if (tmplGroup) tmplGroup.style.display = 'none';
  const setorInput = document.getElementById('ticket-setor-input');
  if (setorInput) setorInput.disabled = false;
  editingTicketId = null;
  ticketFiles = [];
  // Resetar flag de salvamento para evitar bloqueio em aberturas futuras
  _savingTicket = false;
  const saveBtn = document.querySelector('#ticket-modal .btn-save');
  if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Salvar Chamado'; }
}

let _savingTicket = false;

async function saveTicket() {
  // Proteção contra duplo clique
  if (_savingTicket) return;
  _savingTicket = true;
  const saveBtn = document.querySelector('#ticket-modal .btn-save');
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Salvando...'; }
  const title = document.getElementById('ticket-title-input').value.trim();
  const desc = document.getElementById('ticket-description-input').value.trim();
  const setor = document.getElementById('ticket-setor-input').value;
  const isRequester = currentUser?.role === 'requester';
  const prio = isRequester ? 'medium' : document.getElementById('ticket-priority-input').value;
  const rawType = document.getElementById('ticket-type-input')?.value || 'error';
  const ticketType = rawType === 'test' ? 'error' : rawType;
  if (!title) { alert('Por favor, adicione um título ao chamado'); return; }

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
    const newTicket = {
      id: Date.now().toString(), number, title, description: desc,
      priority: 'none', setor, ticketType, materialData: null,
      attachments: ticketFiles, date: now, createdAt: now,
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
      <span style="cursor:pointer;display:inline-flex;align-items:center;gap:4px;" onclick="openAttachmentPreview('${f.id}')"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg> ${f.name} <span style="color:var(--muted);font-size:0.7rem;">(${(f.size / 1024).toFixed(1)}KB)</span></span>
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
  const isPdf = type === 'application/pdf';
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

// ══════════════════════════════════════════════════════════════════
// TEMPLATES NO FORMULÁRIO DE CHAMADO
// ══════════════════════════════════════════════════════════════════
let _ticketTemplates = [];

async function loadTicketTemplates() {
  try {
    const snap = await db.collection('templates').get();
    _ticketTemplates = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(t => t.ativo !== false)
      .sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR'));
    updateTemplateSelector();
  } catch (e) {
    _ticketTemplates = [];
    const group = document.getElementById('ticket-template-group');
    if (group) group.style.display = 'none';
  }
}

function updateTemplateSelector() {
  const group = document.getElementById('ticket-template-group');
  const select = document.getElementById('ticket-template-input');
  if (!group || !select) return;

  // Tipo atual do chamado
  const currentType = document.getElementById('ticket-type-input')?.value || 'error';

  // Filtrar templates compatíveis com o tipo atual
  const compatíveis = _ticketTemplates.filter(t => t.tipo === currentType);

  if (!compatíveis.length) {
    group.style.display = 'none';
    return;
  }

  group.style.display = 'flex';
  select.innerHTML = `<option value="">Nenhum — preencher manualmente</option>` +
    compatíveis.map(t => `<option value="${t.id}">${t.nome}</option>`).join('');
  select.value = '';
}

function applyTemplate(templateId) {
  if (!templateId) {
    // Limpar campos se "Nenhum" for selecionado
    document.getElementById('ticket-title-input').value = '';
    document.getElementById('ticket-description-input').value = '';
    return;
  }

  const t = _ticketTemplates.find(x => x.id === templateId);
  if (!t) return;

  // Resolver variáveis
  const setor = document.getElementById('ticket-setor-input')?.value || currentUser?.setor || '';
  const solicitante = currentUser?.username || '';
  const data = new Date().toLocaleDateString('pt-BR');
  const ativo = ''; // será preenchido manualmente pelo usuário se necessário

  const resolve = (str) => (str || '')
    .replace(/\[setor\]/gi, setor)
    .replace(/\[solicitante\]/gi, solicitante)
    .replace(/\[data\]/gi, data)
    .replace(/\[ativo\]/gi, ativo);

  // Preencher título e descrição
  const titleInput = document.getElementById('ticket-title-input');
  const descInput = document.getElementById('ticket-description-input');

  if (titleInput) titleInput.value = resolve(t.titulo);
  if (descInput) descInput.value = resolve(t.descricao || '');

  // Aplicar prioridade do template se definida
  const prioInput = document.getElementById('ticket-priority-input');
  if (prioInput && t.prioridade && t.prioridade !== 'none') {
    prioInput.value = t.prioridade;
  }

  // Feedback visual — piscar o campo título
  if (titleInput) {
    titleInput.style.transition = 'box-shadow 0.3s';
    titleInput.style.boxShadow = '0 0 0 3px var(--accent)';
    setTimeout(() => { titleInput.style.boxShadow = ''; }, 1200);
  }
}