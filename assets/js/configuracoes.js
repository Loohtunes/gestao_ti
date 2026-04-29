function getSectorBadge(user) {
  const SETOR_ICON = {
    'TI': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>',
    'Contabilidade': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v16"/><path d="M17.196 5.804 6.804 18.196"/><path d="M4 8h16"/><path d="M4 16h16"/></svg>',
    'Engenharia': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z"/><path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5"/><path d="M4 15v-3a6 6 0 0 1 6-6h0"/><path d="M14 6h0a6 6 0 0 1 6 6v3"/></svg>',
    'Comercial': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-1"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/></svg>',
    'Financeiro': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    'PCP': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h10"/><path d="M6 12h9"/><path d="M11 18h7"/></svg>',
    'Orçamento': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M14 8H8"/><path d="M16 12H8"/><path d="M13 16H8"/></svg>',
    'Segurança do Trabalho': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>',
    'Suprimentos': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/><rect width="13" height="13" x="9" y="11" rx="2"/><path d="M9 17H8a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h1"/><path d="M21 17h1a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-1"/></svg>',
    'RH': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 21a8 8 0 0 0-16 0"/><circle cx="10" cy="8" r="5"/><path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3"/></svg>',
  };
  const icon = SETOR_ICON[user.setor] || '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" stroke-dasharray="4 2"/></svg>';
  const label = user.setor || 'Sem setor';
  return `<span style="display:inline-flex;align-items:center;gap:5px;">${icon} ${label}</span>`;
}

// ===== CONFIGURAÇÕES — Lógica das abas =====

let configCurrentUser = null;
let configEditingId = null;
let configUsersPage = 1;
const CONFIG_USERS_PER_PAGE = 30; // 10 por coluna × 3 colunas

const MODULOS = [
  { key: 'chamados', label: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;vertical-align:middle"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg> Chamados` },
  { key: 'materiais', label: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;vertical-align:middle"><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"/><path d="m7.5 4.27 9 5.15"/></svg> Materiais` },
  { key: 'inventario', label: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;vertical-align:middle"><path d="M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z"/><path d="m7 16.5-4.74-2.85"/><path d="m7 16.5 5-3"/><path d="M7 16.5v5.17"/><path d="M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z"/><path d="m17 16.5-5-3"/><path d="m17 16.5 4.74-2.85"/><path d="M17 16.5v5.17"/><path d="M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3 5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0l-3 1.8Z"/><path d="M12 8 7.26 5.15"/><path d="m12 8 4.74-2.85"/><path d="M12 13.5V8"/></svg> Inventário` },
  { key: 'pub_comunicados', label: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;vertical-align:middle"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg> Publicar Comunicados` },
];

// ── Inicializar ──
async function initConfiguracoes() {
  await loadUsers();
  const savedId = localStorage.getItem('chamados-current-user-id');
  if (!savedId) { window.location.href = 'index.html'; return; }
  const user = users.find(u => u.id === savedId);
  if (!user || (!user.isAdmin && !user.isSuperAdmin)) {
    window.location.href = 'menu.html'; return;
  }
  configCurrentUser = user;
  if (typeof initDarkMode === 'function') initDarkMode();
  if (typeof initSessionTimer === 'function') initSessionTimer(user.role);
  initConfigSidebar(user);

  // Preencher sidebar
  const avatar = document.getElementById('config-sidebar-avatar');
  if (avatar) avatar.textContent = user.username.charAt(0).toUpperCase();
  const nameEl = document.getElementById('config-sidebar-name');
  if (nameEl) nameEl.textContent = capitalizeName(user.username);
  const roleEl = document.getElementById('config-sidebar-role');
  if (roleEl) roleEl.innerHTML = getSectorBadge(user);

  // Firebase status
  const syncFab = document.getElementById('sync-fab-nav');
  if (syncFab) syncFab.style.display = user.isSuperAdmin ? 'inline-flex' : 'none';

  // Aba Administração — apenas SuperAdmin
  const adminTab = document.querySelector('[data-tab="administracao"]');
  if (adminTab) adminTab.style.display = user.isSuperAdmin ? 'flex' : 'none';

  openTab('usuarios');
}

// ── Abas ──
function openTab(tab) {
  // Bloquear aba Administração para não-SuperAdmin
  if (tab === 'administracao' && !configCurrentUser?.isSuperAdmin) return;

  document.querySelectorAll('.config-tab').forEach(t =>
    t.classList.toggle('active', t.dataset.tab === tab));
  document.querySelectorAll('.config-panel').forEach(p =>
    p.classList.toggle('active', p.id === 'panel-' + tab));

  if (tab === 'usuarios') renderConfigUsers();
  if (tab === 'acessos') renderAccessTable();
  if (tab === 'administracao') renderAdministracao();
  if (tab === 'setores') renderSetores();
  if (tab === 'sla') renderSlaPanel();        // compatibilidade
  if (tab === 'firebase') renderFirebaseInfo();    // compatibilidade
}

async function renderAdministracao() {
  const panel = document.getElementById('panel-administracao');
  if (!panel) return;
  panel.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:2.5rem;">
      <div id="admin-sla-section"></div>
      <div style="border-top:1px solid var(--border);padding-top:2rem;" id="admin-firebase-section"></div>
    </div>`;

  // Reutilizar renderizações existentes
  const origSla = document.getElementById('panel-sla');
  const origFb = document.getElementById('panel-firebase');

  // Temporariamente apontar para os novos containers
  if (!origSla) {
    const fakeSla = document.createElement('div');
    fakeSla.id = 'panel-sla';
    fakeSla.style.display = 'none';
    document.body.appendChild(fakeSla);
  }
  if (!origFb) {
    const fakeFb = document.createElement('div');
    fakeFb.id = 'panel-firebase';
    fakeFb.style.display = 'none';
    document.body.appendChild(fakeFb);
  }

  await renderSlaPanel();
  await renderFirebaseInfo();

  // Mover conteúdo para os containers corretos
  const slaEl = document.getElementById('panel-sla');
  const fbEl = document.getElementById('panel-firebase');
  const slaTarget = document.getElementById('admin-sla-section');
  const fbTarget = document.getElementById('admin-firebase-section');

  if (slaEl && slaTarget) slaTarget.innerHTML = slaEl.innerHTML;
  if (fbEl && fbTarget) fbTarget.innerHTML = fbEl.innerHTML;
}

// ══════════════════════════════
// ABA SLA
// ══════════════════════════════
const SLA_DEFAULTS = {
  urgent: { label: 'Urgente', color: '#ef4444', hours: 2, icon: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>' },
  high: { label: 'Alta', color: '#ff7b00', hours: 4, icon: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ff7b00" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>' },
  medium: { label: 'Média', color: '#f59e0b', hours: 8, icon: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>' },
  low: { label: 'Baixa', color: '#22c55e', hours: 24, icon: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m16 12-4-4-4 4"/><path d="M12 16V8"/></svg>' },
};

async function renderSlaPanel() {
  const panel = document.getElementById('panel-sla');
  if (!panel) return;

  const isSuperAdmin = currentUser?.isSuperAdmin;
  const isAdmin = currentUser?.isAdmin || isSuperAdmin;

  // Carregar config atual do Firestore (ou usar defaults)
  let slaConfig = {};
  try {
    const doc = await db.collection('config').doc('sla').get();
    slaConfig = doc.exists ? doc.data() : {};
  } catch (e) { slaConfig = {}; }

  panel.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;max-width:860px;">

      <!-- Configuração de tempos -->
      <div>
        <div class="sla-section-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Tempos por Prioridade
        </div>
        <div style="font-size:0.72rem;color:var(--muted);font-family:var(--font-mono);margin-bottom:1rem;">
          ${isSuperAdmin ? 'Apenas SuperAdmin pode alterar os tempos.' : 'Somente SuperAdmin pode editar esta configuração.'}
        </div>
        <div style="display:flex;flex-direction:column;gap:0.5rem;" id="sla-prio-list">
          ${Object.entries(SLA_DEFAULTS).map(([key, def]) => {
    const saved = slaConfig[key] || {};
    const hours = saved.hours ?? def.hours;
    return `
              <div class="sla-prio-row">
                <div style="display:flex;align-items:center;gap:0.5rem;flex:1;">
                  ${def.icon}
                  <span style="font-size:0.82rem;font-weight:700;color:var(--text);">${def.label}</span>
                </div>
                <div style="display:flex;align-items:center;gap:0.4rem;">
                  <input type="number" id="sla-input-${key}" class="sla-time-input"
                    value="${hours}" min="1" max="720"
                    ${isSuperAdmin ? '' : 'disabled'}
                    style="border-color:${def.color}22;">
                  <span style="font-size:0.72rem;color:var(--muted);font-family:var(--font-mono);">horas</span>
                </div>
              </div>`;
  }).join('')}
        </div>
        ${isSuperAdmin ? `
        <div style="display:flex;justify-content:flex-end;margin-top:0.75rem;">
          <button class="btn-save" onclick="saveSlaConfig()" style="padding:0.45rem 1.25rem;font-size:0.78rem;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Salvar Configuração
          </button>
        </div>` : ''}
      </div>

      <!-- Painel de justificativas -->
      <div>
        <div class="sla-section-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          Justificativas de Estouro
        </div>
        <div style="font-size:0.72rem;color:var(--muted);font-family:var(--font-mono);margin-bottom:1rem;">
          Histórico de chamados com SLA vencido.
        </div>
        <div id="sla-justificativas-list">
          <div class="sla-loading">Carregando...</div>
        </div>
      </div>

    </div>`;

  // Carregar justificativas
  if (isAdmin) renderSlaJustificativas();
}

async function renderSlaJustificativas() {
  const container = document.getElementById('sla-justificativas-list');
  if (!container) return;
  try {
    let snap;
    try {
      snap = await db.collection('sla_justificativas')
        .orderBy('createdAt', 'desc').limit(30).get();
    } catch (e) {
      // Coleção ainda não existe ou sem índice — busca sem ordenação
      snap = await db.collection('sla_justificativas').limit(30).get();
    }

    if (snap.empty) {
      container.innerHTML = `<div class="sla-empty">Nenhum estouro registrado.</div>`;
      return;
    }

    container.innerHTML = snap.docs.map(d => {
      const j = d.data();
      const dt = j.createdAt ? new Date(j.createdAt).toLocaleString('pt-BR') : '—';
      const def = SLA_DEFAULTS[j.priority] || {};
      const tipo = j.tipo === 'sobrevida' ? '⏱️ Sobrevida' : '🔴 SLA';
      return `
        <div class="sla-just-card">
          <div class="sla-just-header">
            <span class="sla-just-ticket">#${j.ticketNum || j.ticketId}</span>
            <span class="sla-just-prio" style="color:${def.color || 'var(--muted)'};">${def.label || j.priority}</span>
            <span class="sla-just-tipo">${tipo}</span>
            <span class="sla-just-date">${dt}</span>
          </div>
          <div class="sla-just-atendente">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            ${j.attendantName || '—'}
          </div>
          <div class="sla-just-text">"${j.justificativa}"</div>
        </div>`;
    }).join('');
  } catch (e) {
    container.innerHTML = `<div class="sla-empty">Erro ao carregar justificativas.</div>`;
  }
}

async function saveSlaConfig() {
  const config = {};
  let valid = true;
  Object.keys(SLA_DEFAULTS).forEach(key => {
    const val = parseInt(document.getElementById(`sla-input-${key}`)?.value);
    if (!val || val < 1) { valid = false; return; }
    config[key] = { hours: val };
  });

  if (!valid) { showConfigNotification('Informe tempos válidos (mín. 1h).', 'error'); return; }

  try {
    await db.collection('config').doc('sla').set(config);
    showConfigNotification('Configuração de SLA salva! ✅', 'success');
  } catch (e) {
    showConfigNotification('Erro ao salvar configuração.', 'error');
  }
}

// ══════════════════════════════
// ABA SETORES
// ══════════════════════════════
let _setorEditingId = null;
let _setores = [];

async function renderSetores() {
  const panel = document.getElementById('panel-setores');
  if (!panel) return;

  const canManage = currentUser?.isAdmin || currentUser?.isSuperAdmin;

  panel.innerHTML = `
    <div class="config-users-header">
      <div class="config-users-title">Setores Cadastrados</div>
      ${canManage ? `<button class="config-new-user-btn" onclick="openSetorForm()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
        Novo Setor
      </button>` : ''}
    </div>
    <div id="setores-list" style="display:flex;flex-direction:column;gap:0.5rem;max-width:600px;margin:0 auto;"></div>
  `;

  try {
    const snap = await db.collection('setores').get();
    _setores = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR'));
    renderSetoresList(canManage);
  } catch (e) {
    document.getElementById('setores-list').innerHTML =
      '<div style="color:var(--muted);font-size:0.8rem;">Erro ao carregar setores.</div>';
  }
}

function renderSetoresList(canManage) {
  const container = document.getElementById('setores-list');
  if (!container) return;

  if (_setores.length === 0) {
    container.innerHTML = `<div style="color:var(--muted);font-size:0.82rem;padding:1rem 0;">Nenhum setor cadastrado ainda.</div>`;
    return;
  }

  container.innerHTML = _setores.map(s => {
    const ramais = [...(s.ramais || [])].sort((a, b) =>
      (a.nome || '').localeCompare(b.nome || '', 'pt-BR'));
    const ramaisHtml = ramais.length
      ? ramais.map(r => `
          <div style="display:flex;align-items:center;gap:0.5rem;font-size:0.72rem;color:var(--muted);font-family:var(--font-mono);">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.99 15a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.92 4h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 11.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 18v-.08z"/></svg>
            <span style="flex:1">${r.nome}</span>
            <span style="font-weight:700;color:var(--text)">${r.ramal}</span>
          </div>`).join('')
      : `<div style="font-size:0.7rem;color:var(--muted);">Sem ramais cadastrados</div>`;

    const badgeAtivo = s.ativo === false
      ? `<span style="font-size:0.6rem;font-family:var(--font-mono);font-weight:700;padding:0.1rem 0.35rem;border-radius:4px;background:#fee2e2;color:#b91c1c;border:1px solid #fecaca;">Inativo</span>`
      : `<span style="font-size:0.6rem;font-family:var(--font-mono);font-weight:700;padding:0.1rem 0.35rem;border-radius:4px;background:#dcfce7;color:#15803d;border:1px solid #bbf7d0;">Ativo</span>`;

    return `
      <div class="setor-card${s.ativo === false ? ' setor-card--inactive' : ''}">
        <div class="setor-card-header">
          <div style="display:flex;align-items:center;gap:0.5rem;flex:1;min-width:0;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;color:var(--accent)"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>
            <span class="setor-card-nome">${s.nome}</span>
            ${badgeAtivo}
          </div>
          ${canManage ? `
          <div style="display:flex;gap:0.25rem;flex-shrink:0;">
            <button class="config-user-edit-btn" onclick="openSetorForm('${s.id}')" title="Editar setor">✎</button>
            <button class="config-user-del-btn" onclick="toggleSetorAtivo('${s.id}', ${s.ativo !== false})" title="${s.ativo === false ? 'Ativar' : 'Desativar'} setor" style="${s.ativo === false ? 'border-color:#16a34a;color:#16a34a;' : ''}">
              ${s.ativo === false
          ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" x2="12" y1="2" y2="12"/></svg>'
          : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" x2="12" y1="2" y2="12"/></svg>'}
            </button>
          </div>` : ''}
        </div>
        <div class="setor-card-body">
          ${s.responsavel ? `
          <div style="display:flex;align-items:center;gap:0.4rem;font-size:0.75rem;color:var(--muted);margin-bottom:0.5rem;">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Responsável: <strong style="color:var(--text)">${s.responsavel}</strong>
          </div>` : ''}
          <div class="setor-ramais-list">${ramaisHtml}</div>
        </div>
      </div>`;
  }).join('');
}


// ── Dirty check modal setor ────────────────────────────────────────────────
let _setorFormDirty = false;

function _watchSetorForm() {
  ['setor-nome-input', 'setor-responsavel-input', 'setor-ativo-input'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', () => { _setorFormDirty = true; });
    if (el && el.type !== 'checkbox') el.addEventListener('input', () => { _setorFormDirty = true; });
  });
  // Ramais
  const container = document.getElementById('setor-ramais-container');
  if (container) {
    const obs = new MutationObserver(() => { _setorFormDirty = true; });
    obs.observe(container, { childList: true, subtree: true, characterData: true });
  }
}

function tryCloseSetorForm() {
  if (_setorFormDirty) {
    document.getElementById('setor-discard-warning').classList.add('open');
  } else {
    closeSetorForm();
  }
}

function closeSetorDiscardWarning() {
  document.getElementById('setor-discard-warning').classList.remove('open');
}

function confirmSetorDiscard() {
  closeSetorDiscardWarning();
  closeSetorForm();
}

function openSetorForm(id = null) {
  _setorEditingId = id;
  _setorFormDirty = false;
  const title = id ? 'Editar Setor' : 'Novo Setor';
  document.getElementById('setor-form-title').textContent = title;

  const setor = id ? _setores.find(s => s.id === id) : null;

  document.getElementById('setor-nome-input').value = setor?.nome || '';
  document.getElementById('setor-responsavel-input').value = setor?.responsavel || '';
  document.getElementById('setor-ativo-input').checked = setor ? setor.ativo !== false : true;

  // Montar ramais
  const container = document.getElementById('setor-ramais-container');
  container.innerHTML = '';
  const ramais = setor?.ramais || [];
  if (ramais.length === 0) addRamalRow();
  else ramais.forEach(r => addRamalRow(r.nome, r.ramal));

  document.getElementById('setor-form-modal').classList.add('open');
  const overlay = document.getElementById('setor-form-modal');
  overlay.onclick = (e) => { if (e.target === overlay) tryCloseSetorForm(); };
  setTimeout(_watchSetorForm, 100);
}

function closeSetorForm() {
  document.getElementById('setor-form-modal').classList.remove('open');
  _setorEditingId = null;
  _setorFormDirty = false;
}

function addRamalRow(nome = '', ramal = '') {
  const container = document.getElementById('setor-ramais-container');
  const row = document.createElement('div');
  row.className = 'setor-ramal-row';
  row.innerHTML = `
    <input type="text" class="form-input setor-ramal-nome" placeholder="Nome da pessoa" value="${nome}" style="flex:1;">
    <input type="text" class="form-input setor-ramal-num"  placeholder="Ramal" value="${ramal}" style="width:90px;">
    <button type="button" class="config-user-del-btn" onclick="this.parentElement.remove()" title="Remover ramal" style="flex-shrink:0;">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
    </button>`;
  container.appendChild(row);
}

async function saveSetor() {
  const nome = document.getElementById('setor-nome-input').value.trim();
  const responsavel = document.getElementById('setor-responsavel-input').value.trim();
  const ativo = document.getElementById('setor-ativo-input').checked;

  if (!nome) { showConfigNotification('Informe o nome do setor.', 'error'); return; }

  // Coletar ramais
  const ramais = [];
  document.querySelectorAll('.setor-ramal-row').forEach(row => {
    const n = row.querySelector('.setor-ramal-nome').value.trim();
    const r = row.querySelector('.setor-ramal-num').value.trim();
    if (n || r) ramais.push({ nome: n, ramal: r });
  });

  const data = { nome, responsavel, ramais, ativo, updatedAt: new Date().toISOString() };

  try {
    if (_setorEditingId) {
      await db.collection('setores').doc(_setorEditingId).update(data);
      showConfigNotification('Setor atualizado! ✅', 'success');
    } else {
      data.createdAt = new Date().toISOString();
      await db.collection('setores').add(data);
      showConfigNotification('Setor criado! ✅', 'success');
    }
    closeSetorForm();
    renderSetores();
  } catch (e) {
    showConfigNotification('Erro ao salvar setor.', 'error');
  }
}

async function toggleSetorAtivo(id, currentAtivo) {
  const acao = currentAtivo ? 'desativar' : 'ativar';
  if (!confirm(`Deseja ${acao} este setor?`)) return;
  try {
    await db.collection('setores').doc(id).update({ ativo: !currentAtivo });
    showConfigNotification(`Setor ${currentAtivo ? 'desativado' : 'ativado'}! ✅`, 'success');
    renderSetores();
  } catch (e) {
    showConfigNotification('Erro ao atualizar setor.', 'error');
  }
}

// ══════════════════════════════
let _configUserSearch = '';

function filterConfigUsers(q) {
  _configUserSearch = (q || '').toLowerCase().trim();
  configUsersPage = 1;
  renderConfigUsers();
}

// ABA USUÁRIOS
// ══════════════════════════════
function renderConfigUsers() {
  showUserList();
  const container = document.getElementById('config-user-list');
  const paginationEl = document.getElementById('config-users-pagination');
  if (!container) return;

  // Filtrar por busca
  const filtered = _configUserSearch
    ? users.filter(u =>
      (u.username || '').toLowerCase().includes(_configUserSearch) ||
      (u.setor || '').toLowerCase().includes(_configUserSearch) ||
      (u.email || '').toLowerCase().includes(_configUserSearch))
    : users;

  // Ordenar alfabeticamente
  const sorted = [...filtered].sort((a, b) =>
    a.username.localeCompare(b.username, 'pt-BR', { sensitivity: 'base' })
  );

  const total = sorted.length;
  const totalPages = Math.ceil(total / CONFIG_USERS_PER_PAGE);
  if (configUsersPage > totalPages) configUsersPage = 1;

  const start = (configUsersPage - 1) * CONFIG_USERS_PER_PAGE;
  const page = sorted.slice(start, start + CONFIG_USERS_PER_PAGE);

  if (!total) {
    container.innerHTML = '<div style="color:var(--muted);font-size:0.82rem;padding:1rem;grid-column:span 2;">Nenhum usuário cadastrado.</div>';
    if (paginationEl) paginationEl.innerHTML = '';
    return;
  }

  container.innerHTML = page.map(u => {
    const role = u.isSuperAdmin ? 'Super Admin' : u.isAdmin ? 'Admin' : u.role === 'attendant' ? 'Atendente' : 'Solicitante';
    const meta = [u.setor, role].filter(Boolean).join(' · ');
    const superBadge = u.isSuperAdmin ? '<span class="config-user-badge super">★</span>' : '';
    const adminBadge = !u.isSuperAdmin && u.isAdmin ? '<span class="config-user-badge admin">Admin</span>' : '';
    const vipBadge = u.isVip ? '<span class="config-user-badge vip">⭐</span>' : '';
    const canEdit = configCurrentUser.isSuperAdmin || (!u.isSuperAdmin && configCurrentUser.isAdmin);
    const canRemove = configCurrentUser.isSuperAdmin && !u.isSuperAdmin;
    return `
      <div class="config-user-card">
        <div class="config-user-avatar">${u.username.charAt(0).toUpperCase()}</div>
        <div class="config-user-info">
          <div class="config-user-name-row">
            <span class="config-user-name">${capitalizeName(u.username)}</span>
            <span class="config-user-badges-inline">${superBadge}${adminBadge}${vipBadge}</span>
          </div>
          <div class="config-user-meta">${meta}</div>
        </div>
        <div class="config-user-actions">
          ${canEdit ? `<button class="config-user-edit-btn" onclick="openConfigEditUser('${u.id}')">✎</button>` : ''}
          ${canRemove ? `<button class="config-user-del-btn"  onclick="removeUser('${u.id}')">✕</button>` : ''}
        </div>
      </div>`;
  }).join('');

  // Paginação
  if (paginationEl) {
    if (totalPages <= 1) { paginationEl.innerHTML = ''; return; }
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    paginationEl.innerHTML = `
      <span class="config-page-info">${total} usuários</span>
      <div class="config-page-btns">
        <button class="config-page-btn" onclick="changeConfigPage(${configUsersPage - 1})"
          ${configUsersPage === 1 ? 'disabled' : ''}>‹</button>
        ${pages.map(p => `
          <button class="config-page-btn ${p === configUsersPage ? 'active' : ''}"
            onclick="changeConfigPage(${p})">${p}</button>`).join('')}
        <button class="config-page-btn" onclick="changeConfigPage(${configUsersPage + 1})"
          ${configUsersPage === totalPages ? 'disabled' : ''}>›</button>
      </div>`;
  }
}

function changeConfigPage(page) {
  const filtered = _configUserSearch
    ? users.filter(u =>
      (u.username || '').toLowerCase().includes(_configUserSearch) ||
      (u.setor || '').toLowerCase().includes(_configUserSearch))
    : users;
  const totalPages = Math.ceil(filtered.length / CONFIG_USERS_PER_PAGE);
  if (page < 1 || page > totalPages) return;
  configUsersPage = page;
  renderConfigUsers();
}

function showUserList() {
  document.getElementById('config-user-form-modal').classList.remove('open');
  configEditingId = null;
}

function closeConfigUserForm() {
  document.getElementById('config-user-form-modal').classList.remove('open');
  configEditingId = null;
  resetConfigUserForm();
}

function showNewUserForm() {
  configEditingId = null;
  resetConfigUserForm();
  document.getElementById('config-form-title').textContent = 'Novo Usuário';
  document.getElementById('config-user-pass-input').placeholder = 'Senha (obrigatória)';
  toggleConfigAdminCheckbox();
  document.getElementById('config-user-form-modal').classList.add('open');
}

function openConfigEditUser(userId) {
  const user = users.find(u => u.id === userId);
  if (!user) return;
  if (user.isSuperAdmin && !configCurrentUser.isSuperAdmin) {
    alert('Apenas o Super Admin pode editar esta conta.');
    return;
  }
  configEditingId = userId;
  document.getElementById('config-form-title').textContent = 'Editar Usuário';
  document.getElementById('config-user-name-input').value = user.username;
  document.getElementById('config-user-pass-input').value = '';
  document.getElementById('config-user-pass-input').placeholder = 'Deixe vazio para manter a senha atual';
  document.getElementById('config-user-role-input').value = user.role;
  document.getElementById('config-user-admin-input').checked = !!user.isAdmin;
  document.getElementById('config-user-email-input').value = user.email || '';
  document.getElementById('config-user-whatsapp-input').value = user.whatsapp || '';
  document.getElementById('config-user-setor-input').value = user.setor || '';
  const hasAnydesk = !!user.anydesk;
  document.getElementById(hasAnydesk ? 'config-anydesk-yes' : 'config-anydesk-no').checked = true;
  document.getElementById('config-user-anydesk-input').value = user.anydesk || '';
  document.getElementById('config-user-anydesk-input').style.display = hasAnydesk ? 'block' : 'none';
  const vipInput = document.getElementById('config-user-vip-input');
  if (vipInput) vipInput.checked = !!user.isVip;
  toggleConfigAdminCheckbox();
  document.getElementById('config-user-form-modal').classList.add('open');
}

function resetConfigUserForm() {
  ['config-user-name-input', 'config-user-pass-input', 'config-user-email-input',
    'config-user-whatsapp-input', 'config-user-anydesk-input'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
  document.getElementById('config-user-role-input').value = 'requester';
  document.getElementById('config-user-admin-input').checked = false;
  document.getElementById('config-anydesk-no').checked = true;
  document.getElementById('config-user-anydesk-input').style.display = 'none';
  const vipInput = document.getElementById('config-user-vip-input');
  if (vipInput) vipInput.checked = false;
}

function toggleConfigAdminCheckbox() {
  const role = document.getElementById('config-user-role-input').value;
  const adminGroup = document.getElementById('config-user-admin-group');
  const vipGroup = document.getElementById('config-user-vip-group');
  if (configCurrentUser.isSuperAdmin) {
    if (adminGroup) adminGroup.style.display = role === 'attendant' ? 'flex' : 'none';
    if (vipGroup) vipGroup.style.display = 'flex';
  } else {
    if (adminGroup) adminGroup.style.display = 'none';
    if (vipGroup) vipGroup.style.display = 'none';
  }
}

function toggleConfigAnydeskInput() {
  const hasAnydesk = document.getElementById('config-anydesk-yes').checked;
  const input = document.getElementById('config-user-anydesk-input');
  input.style.display = hasAnydesk ? 'block' : 'none';
  if (!hasAnydesk) input.value = '';
}

async function saveConfigUser() {
  const name = document.getElementById('config-user-name-input').value.trim();
  const passRaw = document.getElementById('config-user-pass-input').value.trim();
  const role = document.getElementById('config-user-role-input').value;
  const email = document.getElementById('config-user-email-input').value.trim();
  const whatsapp = document.getElementById('config-user-whatsapp-input').value.trim();
  const setor = document.getElementById('config-user-setor-input').value;
  const hasAnydesk = document.getElementById('config-anydesk-yes').checked;
  const anydesk = hasAnydesk ? document.getElementById('config-user-anydesk-input').value.trim() : '';
  const isVip = configCurrentUser.isSuperAdmin ? (document.getElementById('config-user-vip-input')?.checked || false) : false;
  const isAdmin = configCurrentUser.isSuperAdmin
    ? (document.getElementById('config-user-admin-input').checked)
    : (configEditingId ? (users.find(u => u.id === configEditingId)?.isAdmin || false) : false);

  if (!name) { alert('Preencha o nome de usuário'); return; }
  if (!configEditingId && !passRaw) { alert('Preencha a senha para criar o usuário'); return; }
  if (hasAnydesk && !anydesk) { alert('Digite o ID do AnyDesk ou selecione "Não tenho AnyDesk"'); return; }

  if (configEditingId) {
    const dup = users.find(u => u.username === name && u.id !== configEditingId);
    if (dup) { alert('Esse nome de usuário já existe!'); return; }
    const idx = users.findIndex(u => u.id === configEditingId);
    if (idx !== -1) {
      const wasSuperAdmin = users[idx].isSuperAdmin;
      const finalPass = passRaw ? await hashPassword(passRaw) : users[idx].password;
      users[idx] = { ...users[idx], username: name, password: finalPass, role, isAdmin: wasSuperAdmin ? true : isAdmin, email, whatsapp, anydesk, setor, isVip };
    }
    saveUsers();
    showUserList();
    renderConfigUsers();
    showConfigNotification('Usuário atualizado! ✅', 'success');
  } else {
    if (users.find(u => u.username === name)) { alert('Esse nome de usuário já existe!'); return; }
    const hashedPass = await hashPassword(passRaw);
    users.push({ id: Date.now().toString(), username: name, password: hashedPass, role, isAdmin, isSuperAdmin: false, email, whatsapp, anydesk, setor, isVip });
    saveUsers();
    showUserList();
    renderConfigUsers();
    showConfigNotification('Usuário criado! ✅', 'success');
  }
}

// ══════════════════════════════
// ABA ACESSOS
// ══════════════════════════════
function renderAccessTable() {
  const tbody = document.getElementById('access-tbody');
  if (!tbody) return;

  tbody.innerHTML = users.map(u => {
    const role = u.isSuperAdmin ? 'Super Admin' : u.isAdmin ? 'Admin' : u.role === 'attendant' ? 'Atendente' : 'Solicitante';
    const acessos = u.acessos || ['chamados'];
    const isSA = u.isSuperAdmin;

    const toggleCols = MODULOS.map(m => {
      const checked = isSA || acessos.includes(m.key);
      const disabled = m.key === 'chamados' || isSA; // chamados sempre ativo; SA tem tudo
      return `<td>
        <label class="access-toggle" title="${disabled ? 'Não pode ser alterado' : ''}">
          <input type="checkbox"
            ${checked ? 'checked' : ''}
            ${disabled ? 'disabled' : ''}
            onchange="toggleAcesso('${u.id}','${m.key}',this.checked)">
          <span class="access-toggle-slider"></span>
        </label>
      </td>`;
    }).join('');

    return `<tr>
      <td>
        <div class="access-user-name">${capitalizeName(u.username)}</div>
        <div class="access-user-role">${role}${u.setor ? ' · ' + u.setor : ''}</div>
      </td>
      ${toggleCols}
    </tr>`;
  }).join('');
}

async function toggleAcesso(userId, modulo, ativo) {
  const user = users.find(u => u.id === userId);
  if (!user) return;
  let acessos = [...(user.acessos || ['chamados'])];
  if (ativo && !acessos.includes(modulo)) acessos.push(modulo);
  if (!ativo) acessos = acessos.filter(a => a !== modulo);
  user.acessos = acessos;
  await db.collection('users').doc(userId).update({ acessos });
  showConfigNotification('Acesso atualizado! 🔐', 'success');
}

// ══════════════════════════════
// ABA FIREBASE
// ══════════════════════════════
function renderFirebaseInfo() {
  const projectId = _isTestEnv ? 'chamados-dev-1650a' : 'chamados-p';
  const ambiente = _isTestEnv ? '🧪 Desenvolvimento' : '🚀 Produção';
  const consoleUrl = `https://console.firebase.google.com/project/${projectId}/firestore`;

  const panel = document.getElementById('panel-firebase');
  if (!panel) return;

  panel.innerHTML = `
    <div class="config-firebase-card">
      <div class="config-firebase-status">
        <span class="config-firebase-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;vertical-align:middle"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg></span>
        <div class="config-firebase-info">
          <div class="config-firebase-label">Status da conexão</div>
          <div class="config-firebase-value" id="config-fb-status">Verificando...</div>
        </div>
        <div class="config-firebase-dot" id="config-fb-dot"></div>
      </div>
      <div class="config-firebase-details">
        <div class="config-firebase-detail-row">
          <span>Projeto</span>
          <span class="config-firebase-detail-val">${projectId}</span>
        </div>
        <div class="config-firebase-detail-row">
          <span>Ambiente</span>
          <span class="config-firebase-detail-val">${ambiente}</span>
        </div>
        <div class="config-firebase-detail-row">
          <span>Usuários cadastrados</span>
          <span class="config-firebase-detail-val">${users.length}</span>
        </div>
      </div>
      <a href="${consoleUrl}" target="_blank" class="config-firebase-link">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;vertical-align:middle"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 0 2-2h6"/></svg> Abrir Console do Firebase
      </a>
    </div>`;

  // Monitorar status
  db.collection('_ping').doc('status').onSnapshot(
    () => updateConfigFirebase(true),
    () => updateConfigFirebase(false)
  );
}

function updateConfigFirebase(online) {
  const statusEl = document.getElementById('config-fb-status');
  const dotEl = document.getElementById('config-fb-dot');
  if (statusEl) statusEl.textContent = online ? 'Conectado' : 'Sem conexão';
  if (dotEl) {
    dotEl.className = 'config-firebase-dot ' + (online ? 'online' : 'offline');
  }
  // Atualizar status global também
  if (typeof updateFirebaseStatus === 'function') updateFirebaseStatus(online);
}

// ── Notificação ──
function showConfigNotification(msg, type) {
  const el = document.createElement('div');
  el.textContent = msg;
  el.style.cssText = `position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;
    padding:0.7rem 1.2rem;border-radius:10px;font-size:0.82rem;font-weight:700;
    font-family:var(--font-display);box-shadow:0 4px 16px rgba(0,0,0,0.15);
    background:${type === 'success' ? '#16a34a' : '#dc2626'};color:#fff;`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// ── Logout ──
function configLogout() {
  if (!confirm('Deseja realmente sair do sistema?')) return;
  if (typeof stopSessionTimer === 'function') stopSessionTimer();
  localStorage.removeItem('chamados-current-user-id');
  window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', initConfiguracoes);

// ── Sidebar retrátil — Configurações ──
function initConfigSidebar(user) {
  const collapsed = localStorage.getItem('chamados-sidebar-collapsed') === '1';
  const sidebar = document.getElementById('chamados-sidebar');
  const icon = document.getElementById('sidebar-toggle-icon');

  // Suprimir transição no carregamento
  if (sidebar) {
    sidebar.classList.add('no-transition');
    if (collapsed) {
      sidebar.classList.add('collapsed');
      if (icon) icon.textContent = '›';
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        sidebar.classList.remove('no-transition');
      });
    });
  }

  // Avatar e nome
  const avatar = document.getElementById('config-sidebar-avatar');
  const nameEl = document.getElementById('config-sidebar-name');
  const roleEl = document.getElementById('config-sidebar-role');
  if (avatar) avatar.textContent = user.username.charAt(0).toUpperCase();
  if (nameEl) nameEl.textContent = capitalizeName(user.username);
  if (roleEl) roleEl.innerHTML = getSectorBadge(user);

  // Módulos por acessos
  const acessos = user.isSuperAdmin
    ? ['chamados', 'materiais', 'inventario']
    : (user.acessos || ['chamados']);

  ['materiais', 'inventario'].forEach(mod => {
    const el = document.getElementById('cs-mod-' + mod);
    if (el) el.style.display = acessos.includes(mod) ? 'flex' : 'none';
  });
}

function toggleMenuSidebar() {
  const sidebar = document.getElementById('chamados-sidebar');
  const icon = document.getElementById('sidebar-toggle-icon');
  if (!sidebar) return;
  const isCollapsed = sidebar.classList.toggle('collapsed');
  if (icon) icon.textContent = isCollapsed ? '›' : '‹';
  localStorage.setItem('chamados-sidebar-collapsed', isCollapsed ? '1' : '0');
}