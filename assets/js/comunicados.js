// ===== COMUNICADOS — Linha do tempo =====

const COMUNICADOS_EXPIRY_DAYS = 15;
const COMUNICADOS_STALE_DAYS = 5;

const PRIO_ICON = { normal: `<svg width="10" height="10" viewBox="0 0 24 24" style="flex-shrink:0"><circle cx="12" cy="12" r="10" fill="#3b82f6"/></svg>`, importante: `<svg width="10" height="10" viewBox="0 0 24 24" style="flex-shrink:0"><circle cx="12" cy="12" r="10" fill="#f59e0b"/></svg>`, urgente: `<svg width="10" height="10" viewBox="0 0 24 24" style="flex-shrink:0"><circle cx="12" cy="12" r="10" fill="#ef4444"/></svg>` };
const PRIO_LABEL = { normal: 'Normal', importante: 'Importante', urgente: 'Urgente' };

let _comunicadosHistoryOpen = false;
let _comunicadosUnsubscribe = null;
let _selectedPrio = 'normal';

// ── Inicializar listener em tempo real ──
function initComunicados() {
  const canAdmin = menuCurrentUser?.isAdmin || menuCurrentUser?.isSuperAdmin ||
    (menuCurrentUser?.acessos || []).includes('pub_comunicados');

  // Mostrar botão de nova publicação para admins
  const newBtn = document.querySelector('.comunicados-new-btn');
  if (newBtn) newBtn.style.display = canAdmin ? 'flex' : 'none';

  // Listener em tempo real do Firestore
  _comunicadosUnsubscribe = db.collection('comunicados')
    .orderBy('criadoEm', 'desc')
    .onSnapshot(snap => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderComunicados(docs);
    }, err => {
      console.error('[Comunicados]', err);
    });
}

// ── Renderizar feed ──
function renderComunicados(docs) {
  const feed = document.getElementById('comunicados-feed');
  const history = document.getElementById('comunicados-history');
  if (!feed) return;

  const now = Date.now();
  const canAdmin = menuCurrentUser?.isAdmin || menuCurrentUser?.isSuperAdmin ||
    (menuCurrentUser?.acessos || []).includes('pub_comunicados');

  // Separar fixados, ativos e arquivados
  const fixados = docs.filter(d => d.fixado && !d.arquivado);
  const ativos = docs.filter(d => !d.fixado && !d.arquivado);
  const arquivados = docs.filter(d => d.arquivado);

  // Arquivar automaticamente expirados
  ativos.forEach(d => {
    if (d.criadoEm) {
      const created = d.criadoEm.toDate ? d.criadoEm.toDate().getTime() : d.criadoEm;
      const days = (now - created) / 86400000;
      if (days > COMUNICADOS_EXPIRY_DAYS) {
        db.collection('comunicados').doc(d.id).update({ arquivado: true, arquivadoEm: new Date() });
      }
    }
  });

  // Verificar se há publicações recentes (últimos STALE_DAYS)
  const hasRecent = [...fixados, ...ativos].some(d => {
    if (!d.criadoEm) return false;
    const created = d.criadoEm.toDate ? d.criadoEm.toDate().getTime() : d.criadoEm;
    return (now - created) / 86400000 <= COMUNICADOS_STALE_DAYS;
  });

  // Montar HTML do feed
  let html = '';

  if (fixados.length === 0 && ativos.length === 0) {
    html = `<div class="comunicados-empty">
      <span class="comunicados-empty-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg></span>
      <span>Sem publicações atualizadas!</span>
    </div>`;
  } else {
    // Fixados primeiro
    if (fixados.length) {
      html += `<div class="comunicados-date-sep" style="display:flex;align-items:center;gap:6px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg> Fixados</div>`;
      html += fixados.map(d => buildComunicadoCard(d, canAdmin)).join('');
    }

    // Ativos agrupados por data
    const grupos = groupByDate(ativos);
    for (const [label, items] of Object.entries(grupos)) {
      html += `<div class="comunicados-date-sep">${label}</div>`;
      html += items.map(d => buildComunicadoCard(d, canAdmin)).join('');
    }

    // Aviso de sem publicações recentes
    if (!hasRecent && (fixados.length || ativos.length)) {
      html += `<div class="comunicados-empty" style="padding:1rem;">
        <span style="font-size:0.75rem;display:inline-flex;align-items:center;gap:4px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg> Sem publicações nos últimos ${COMUNICADOS_STALE_DAYS} dias</span>
      </div>`;
    }
  }

  feed.innerHTML = html;

  // Histórico
  if (history) {
    history.innerHTML = arquivados.length
      ? arquivados.map(d => buildComunicadoCard(d, canAdmin, true)).join('')
      : `<div class="comunicados-empty" style="padding:1rem;">
           <span>Nenhuma publicação arquivada.</span>
         </div>`;
  }
}

// ── Agrupar por data ──
function groupByDate(docs) {
  const groups = {};
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);

  docs.forEach(d => {
    const ts = d.criadoEm?.toDate ? d.criadoEm.toDate() : new Date(d.criadoEm || Date.now());
    const day = new Date(ts); day.setHours(0, 0, 0, 0);

    let label;
    if (day.getTime() === today.getTime()) label = 'Hoje';
    else if (day.getTime() === yesterday.getTime()) label = 'Ontem';
    else label = day.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

    if (!groups[label]) groups[label] = [];
    groups[label].push(d);
  });

  return groups;
}

// ── Construir card ──
function buildComunicadoCard(d, canAdmin, archived = false) {
  const ts = d.criadoEm?.toDate ? d.criadoEm.toDate() : new Date(d.criadoEm || Date.now());
  const time = ts.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const prio = d.prioridade || 'normal';
  const icon = PRIO_ICON[prio] || `<svg width="10" height="10" viewBox="0 0 24 24" style="flex-shrink:0"><circle cx="12" cy="12" r="10" fill="#3b82f6"/></svg>`;

  const fixBadge = d.fixado ? `<span class="comunicado-fixed-badge" style="display:inline-flex;align-items:center;gap:4px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg> Fixado</span>` : '';

  const adminActions = canAdmin && !archived ? `
    <div class="comunicado-actions">
      ${!d.fixado
      ? `<button class="comunicado-action-btn" onclick="fixarComunicado('${d.id}', true)" style="display:inline-flex;align-items:center;gap:4px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg> Fixar</button>`
      : `<button class="comunicado-action-btn" onclick="fixarComunicado('${d.id}', false)" style="display:inline-flex;align-items:center;gap:4px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg> Desafixar</button>`
    }
      <button class="comunicado-action-btn" onclick="editarComunicado('${d.id}')">✎ Editar</button>
      <button class="comunicado-action-btn danger" onclick="arquivarComunicado('${d.id}')" style="display:inline-flex;align-items:center;gap:4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg> Arquivar</button>
      <button class="comunicado-action-btn danger" onclick="excluirComunicado('${d.id}')" style="display:inline-flex;align-items:center;gap:4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg> Excluir</button>
    </div>` : '';

  return `
    <div class="comunicado-card prio-${prio}${archived ? ' archived' : ''}">
      ${fixBadge}
      <div class="comunicado-card-header">
        <span class="comunicado-prio-icon">${icon}</span>
        <div class="comunicado-meta">
          <span class="comunicado-author" style="display:inline-flex;align-items:center;gap:4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> ${capitalizeName(d.autor || '—')} · ${d.autorSetor || d.autorRole || '—'}</span>
          <span class="comunicado-timestamp" style="display:inline-flex;align-items:center;gap:4px;"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${time}</span>
        </div>
      </div>
      <div class="comunicado-title">${d.titulo || ''}</div>
      <div class="comunicado-message">${(d.mensagem || '').replace(/</g, '&lt;')}</div>
      ${adminActions}
    </div>`;
}

// ── Abrir modal de nova publicação ──
function openNovaComunicado() {
  _selectedPrio = 'normal';
  document.getElementById('com-titulo-input').value = '';
  document.getElementById('com-mensagem-input').value = '';
  document.getElementById('com-fixado-input').checked = false;
  updatePrioSelect('normal');
  document.getElementById('comunicado-modal').classList.add('open');
}

function closeComunicadoModal() {
  const modal = document.getElementById('comunicado-modal');
  if (modal) { modal.classList.remove('open'); delete modal.dataset.editId; }
}

function selectPrio(prio) {
  _selectedPrio = prio;
  updatePrioSelect(prio);
}

function updatePrioSelect(prio) {
  document.querySelectorAll('.comunicado-prio-option').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.prio === prio);
    if (btn.dataset.prio === prio) btn.classList.add(prio);
    else['normal', 'importante', 'urgente'].forEach(p => btn.classList.remove(p));
  });
}

// ── Salvar comunicado ──
async function salvarComunicado() {
  const titulo = document.getElementById('com-titulo-input').value.trim();
  const mensagem = document.getElementById('com-mensagem-input').value.trim();
  const fixado = document.getElementById('com-fixado-input').checked;
  const modal = document.getElementById('comunicado-modal');
  const editId = modal?.dataset?.editId || '';

  if (!titulo || !mensagem) {
    showMenuNotification('Preencha o título e a mensagem!', 'error');
    return;
  }

  const roleLabel = menuCurrentUser.isSuperAdmin ? 'Super Admin'
    : menuCurrentUser.isAdmin ? 'Admin' : 'Atendente';

  try {
    if (editId) {
      // Editar publicação existente
      await db.collection('comunicados').doc(editId).update({
        titulo, mensagem, prioridade: _selectedPrio, fixado,
        editadoEm: new Date(),
        editadoPor: menuCurrentUser.username,
      });
      delete modal.dataset.editId;
      showMenuNotification('Publicação atualizada! ✅', 'success');
    } else {
      // Nova publicação
      await db.collection('comunicados').add({
        titulo, mensagem,
        prioridade: _selectedPrio,
        autor: menuCurrentUser.username,
        autorRole: roleLabel,
        autorSetor: menuCurrentUser.setor || '',
        criadoEm: new Date(),
        fixado,
        arquivado: false,
        arquivadoEm: null,
      });
      showMenuNotification('Comunicado publicado! 📢', 'success');
    }
    closeComunicadoModal();
  } catch (e) {
    showMenuNotification('Erro ao salvar comunicado.', 'error');
  }
}

// ── Fixar / Desafixar ──
async function fixarComunicado(id, fixar) {
  await db.collection('comunicados').doc(id).update({ fixado: fixar });
  showMenuNotification(fixar ? 'Comunicado fixado! 📌' : 'Comunicado desafixado!', 'success');
}

// ── Arquivar ──
async function arquivarComunicado(id) {
  if (!confirm('Arquivar este comunicado?')) return;
  await db.collection('comunicados').doc(id).update({ arquivado: true, arquivadoEm: new Date() });
  showMenuNotification('Comunicado arquivado!', 'success');
}

async function editarComunicado(id) {
  try {
    const doc = await db.collection('comunicados').doc(id).get();
    if (!doc.exists) { showMenuNotification('Comunicado não encontrado.', 'error'); return; }
    const d = doc.data();

    // Preencher modal com dados existentes
    document.getElementById('com-titulo-input').value = d.titulo || '';
    document.getElementById('com-mensagem-input').value = d.mensagem || '';
    document.getElementById('com-fixado-input').checked = d.fixado || false;
    _selectedPrio = d.prioridade || 'normal';
    updatePrioSelect(_selectedPrio);

    // Guardar ID sendo editado
    document.getElementById('comunicado-modal').dataset.editId = id;
    document.getElementById('comunicado-modal').classList.add('open');
  } catch (e) {
    showMenuNotification('Erro ao carregar comunicado.', 'error');
  }
}

async function excluirComunicado(id) {
  if (!confirm('Excluir permanentemente esta publicação? Esta ação não pode ser desfeita!')) return;
  try {
    await db.collection('comunicados').doc(id).delete();
    showMenuNotification('Publicação excluída!', 'success');
  } catch (e) {
    showMenuNotification('Erro ao excluir publicação.', 'error');
  }
}

// ── Histórico toggle ──
function toggleComunicadosHistory() {
  document.getElementById('comunicados-history-modal').classList.add('open');
}

function closeComunicadosHistory() {
  document.getElementById('comunicados-history-modal').classList.remove('open');
}

// ── Notificação simples para o menu ──
function showMenuNotification(msg, type) {
  const el = document.createElement('div');
  el.textContent = msg;
  el.style.cssText = `position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;
    padding:0.7rem 1.2rem;border-radius:10px;font-size:0.82rem;font-weight:700;
    font-family:var(--font-display);box-shadow:0 4px 16px rgba(0,0,0,0.15);
    background:${type === 'success' ? '#16a34a' : '#dc2626'};color:#fff;
    animation:slideUpDetail 0.3s ease;`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}