// ===== COMUNICADOS — Linha do tempo =====

const COMUNICADOS_EXPIRY_DAYS = 15;
const COMUNICADOS_STALE_DAYS  = 5;

const PRIO_ICON  = { normal: '🔵', importante: '🟡', urgente: '🔴' };
const PRIO_LABEL = { normal: 'Normal', importante: 'Importante', urgente: 'Urgente' };

let _comunicadosHistoryOpen = false;
let _comunicadosUnsubscribe = null;
let _selectedPrio = 'normal';

// ── Inicializar listener em tempo real ──
function initComunicados() {
  const canAdmin = menuCurrentUser?.isAdmin || menuCurrentUser?.isSuperAdmin;

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
  const feed    = document.getElementById('comunicados-feed');
  const history = document.getElementById('comunicados-history');
  if (!feed) return;

  const now     = Date.now();
  const canAdmin = menuCurrentUser?.isAdmin || menuCurrentUser?.isSuperAdmin;

  // Separar fixados, ativos e arquivados
  const fixados   = docs.filter(d => d.fixado && !d.arquivado);
  const ativos    = docs.filter(d => !d.fixado && !d.arquivado);
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
      <span class="comunicados-empty-icon">📭</span>
      <span>Sem publicações atualizadas!</span>
    </div>`;
  } else {
    // Fixados primeiro
    if (fixados.length) {
      html += `<div class="comunicados-date-sep">📌 Fixados</div>`;
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
        <span style="font-size:0.75rem;">📅 Sem publicações nos últimos ${COMUNICADOS_STALE_DAYS} dias</span>
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
  const today     = new Date(); today.setHours(0,0,0,0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);

  docs.forEach(d => {
    const ts = d.criadoEm?.toDate ? d.criadoEm.toDate() : new Date(d.criadoEm || Date.now());
    const day = new Date(ts); day.setHours(0,0,0,0);

    let label;
    if (day.getTime() === today.getTime())     label = 'Hoje';
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
  const time = ts.toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
  const prio = d.prioridade || 'normal';
  const icon = PRIO_ICON[prio] || '🔵';

  const fixBadge = d.fixado ? `<span class="comunicado-fixed-badge">📌 Fixado</span>` : '';

  const adminActions = canAdmin && !archived ? `
    <div class="comunicado-actions">
      ${!d.fixado
        ? `<button class="comunicado-action-btn" onclick="fixarComunicado('${d.id}', true)">📌 Fixar</button>`
        : `<button class="comunicado-action-btn" onclick="fixarComunicado('${d.id}', false)">📌 Desafixar</button>`
      }
      <button class="comunicado-action-btn danger" onclick="arquivarComunicado('${d.id}')">🗑️ Arquivar</button>
    </div>` : '';

  return `
    <div class="comunicado-card prio-${prio}${archived ? ' archived' : ''}">
      ${fixBadge}
      <div class="comunicado-card-header">
        <span class="comunicado-prio-icon">${icon}</span>
        <div class="comunicado-meta">
          <span class="comunicado-author">👤 ${capitalizeName(d.autor || '—')} · ${d.autorRole || ''}</span>
          <span class="comunicado-timestamp">🕐 ${time}</span>
        </div>
      </div>
      <div class="comunicado-title">${d.titulo || ''}</div>
      <div class="comunicado-message">${(d.mensagem || '').replace(/</g,'&lt;')}</div>
      ${adminActions}
    </div>`;
}

// ── Abrir modal de nova publicação ──
function openNovaComunicado() {
  _selectedPrio = 'normal';
  document.getElementById('com-titulo-input').value   = '';
  document.getElementById('com-mensagem-input').value = '';
  document.getElementById('com-fixado-input').checked = false;
  updatePrioSelect('normal');
  document.getElementById('comunicado-modal').classList.add('open');
}

function closeComunicadoModal() {
  document.getElementById('comunicado-modal').classList.remove('open');
}

function selectPrio(prio) {
  _selectedPrio = prio;
  updatePrioSelect(prio);
}

function updatePrioSelect(prio) {
  document.querySelectorAll('.comunicado-prio-option').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.prio === prio);
    if (btn.dataset.prio === prio) btn.classList.add(prio);
    else ['normal','importante','urgente'].forEach(p => btn.classList.remove(p));
  });
}

// ── Salvar comunicado ──
async function salvarComunicado() {
  const titulo   = document.getElementById('com-titulo-input').value.trim();
  const mensagem = document.getElementById('com-mensagem-input').value.trim();
  const fixado   = document.getElementById('com-fixado-input').checked;

  if (!titulo || !mensagem) {
    showMenuNotification('Preencha o título e a mensagem!', 'error');
    return;
  }

  const roleLabel = menuCurrentUser.isSuperAdmin ? 'Super Admin'
    : menuCurrentUser.isAdmin ? 'Admin' : 'Atendente';

  try {
    await db.collection('comunicados').add({
      titulo,
      mensagem,
      prioridade: _selectedPrio,
      autor:      menuCurrentUser.username,
      autorRole:  roleLabel,
      criadoEm:   new Date(),
      fixado,
      arquivado:  false,
      arquivadoEm: null,
    });
    closeComunicadoModal();
    showMenuNotification('Comunicado publicado! 📢', 'success');
  } catch(e) {
    showMenuNotification('Erro ao publicar comunicado.', 'error');
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

// ── Histórico toggle ──
function toggleComunicadosHistory() {
  _comunicadosHistoryOpen = !_comunicadosHistoryOpen;
  const section = document.getElementById('comunicados-history-section');
  const btn     = document.getElementById('comunicados-history-btn');
  if (section) section.classList.toggle('open', _comunicadosHistoryOpen);
  if (btn) btn.textContent = _comunicadosHistoryOpen ? '📁 Ocultar Histórico' : '📁 Ver Histórico';
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
