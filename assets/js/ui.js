// ===== UI — Notificações, busca e utilitários de interface =====

function showNotification(message, type) {
  let stack = document.getElementById('toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.id = 'toast-stack';
    stack.style.cssText = 'position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;display:flex;flex-direction:column;gap:8px;align-items:flex-end;pointer-events:none;';
    document.body.appendChild(stack);
  }
  // Remove o mais antigo se tiver mais de 4
  while (stack.children.length >= 4) stack.removeChild(stack.firstChild);

  const colors = {
    success: { bg: '#00d4aa', border: '#00b894' },
    error: { bg: '#ff6b6b', border: '#e05555' },
    info: { bg: '#378add', border: '#2563eb' },
    warn: { bg: '#f59e0b', border: '#d97706' }
  };
  const col = colors[type] || colors.info;

  const toast = document.createElement('div');
  toast.style.cssText = `
    background:${col.bg};border:1px solid ${col.border};color:#fff;
    padding:0.65rem 1.1rem;border-radius:10px;font-size:0.8rem;
    font-family:'Space Mono',monospace;max-width:300px;word-break:break-word;
    box-shadow:0 4px 16px rgba(0,0,0,0.18);pointer-events:all;
    animation:toastIn 0.25s cubic-bezier(0.34,1.56,0.64,1);
    transition:opacity 0.35s ease,transform 0.35s ease;
  `;
  toast.innerHTML = message;
  stack.appendChild(toast);

  const remove = () => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(16px)';
    setTimeout(() => toast.remove(), 360);
  };
  toast.addEventListener('click', remove);
  setTimeout(remove, 3500);
}

function toggleSearch() {
  const widget = document.getElementById('search-widget');
  const input = document.getElementById('ticket-search');
  const btn = document.getElementById('search-toggle-btn');
  if (!widget) return;
  const open = widget.classList.toggle('open');
  if (open) {
    setTimeout(() => input?.focus(), 80);
    btn.style.color = 'var(--accent)';
  } else {
    if (input) { input.value = ''; renderTickets(); }
    btn.style.color = '';
  }
}

function collapseSearchIfEmpty() {
  const input = document.getElementById('ticket-search');
  const widget = document.getElementById('search-widget');
  const btn = document.getElementById('search-toggle-btn');
  if (!input?.value.trim()) {
    setTimeout(() => {
      if (!input.value.trim() && document.activeElement !== input) {
        widget?.classList.remove('open');
        if (btn) btn.style.color = '';
        renderTickets();
      }
    }, 200);
  }
}

// ── Dropdown de Ações ──
function toggleActionsDropdown() {
  const menu = document.getElementById('actions-dropdown-menu');
  if (!menu) return;
  const isOpen = menu.style.display === 'block';
  menu.style.display = isOpen ? 'none' : 'block';
  // Fechar ao clicar fora
  if (!isOpen) {
    setTimeout(() => {
      document.addEventListener('click', closeActionsDropdownOutside, { once: true });
    }, 10);
  }
}

function closeActionsDropdown() {
  const menu = document.getElementById('actions-dropdown-menu');
  if (menu) menu.style.display = 'none';
}

function closeActionsDropdownOutside(e) {
  const wrapper = document.getElementById('actions-dropdown-wrapper');
  if (wrapper && !wrapper.contains(e.target)) closeActionsDropdown();
}

// ══════════════════════════════════════════════════════
// AUTO FORMATAR
// ══════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════
// ALTERNAR VISUALIZAÇÃO CARDS / LISTA
// ══════════════════════════════════════════════════════

let viewMode = localStorage.getItem('chamados-view-mode') || 'cards';

function applyViewMode() {
  const btn = document.getElementById('view-toggle-btn');
  if (!btn) return;
  btn.textContent = viewMode === 'cards' ? '☰' : '⊞';
  btn.title = viewMode === 'cards' ? 'Mudar para lista' : 'Mudar para cards';
  btn.style.color = viewMode === 'cards' ? 'var(--muted)' : 'var(--accent)';
}

function toggleViewMode() {
  viewMode = viewMode === 'cards' ? 'list' : 'cards';
  localStorage.setItem('chamados-view-mode', viewMode);
  applyViewMode();
  renderTickets();
}

// ══════════════════════════════════════════════════════
// NOTAS DE ATUALIZAÇÃO (CHANGELOG)
// ══════════════════════════════════════════════════════

let _changelogOpen = false;

function toggleChangelog() {
  const panel = document.getElementById('changelog-panel');
  if (!panel) return;
  _changelogOpen = !_changelogOpen;
  if (_changelogOpen) {
    panel.style.display = 'flex';
    panel.getBoundingClientRect();
    panel.style.transform = 'scaleY(1) scaleX(1)';
    panel.style.opacity = '1';
    panel.style.pointerEvents = 'auto';
    loadChangelogEntries();
    markChangelogRead();
    setTimeout(() => {
      document.addEventListener('click', closeChangelogOutside, { once: true });
    }, 10);
  } else {
    panel.style.transform = 'scaleY(0.8) scaleX(0.95)';
    panel.style.opacity = '0';
    panel.style.pointerEvents = 'none';
    setTimeout(() => { if (!_changelogOpen) panel.style.display = 'none'; }, 200);
  }
}

function closeChangelogOutside(e) {
  const panel = document.getElementById('changelog-panel');
  const btn = document.getElementById('changelog-btn');
  if (panel && btn && !panel.contains(e.target) && !btn.contains(e.target)) {
    _changelogOpen = true;
    toggleChangelog();
  }
}

async function loadChangelogEntries() {
  const list = document.getElementById('changelog-list');
  if (!list) return;
  try {
    const snap = await db.collection('changelog').orderBy('date', 'desc').get();
    if (snap.empty) {
      list.innerHTML = '<div style="text-align:center;color:var(--muted);font-size:0.82rem;padding:2rem;">Nenhuma nota publicada ainda.</div>';
      return;
    }
    const isSA = typeof isSuperAdmin === 'function' && isSuperAdmin();
    list.innerHTML = snap.docs.map(doc => {
      const d = doc.data();
      const id = doc.id;
      const notes = (d.notes || '').split('\n').filter(Boolean);
      return `<div style="margin-bottom:1rem;padding-bottom:1rem;border-bottom:1px solid var(--border);">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.5rem;">
          <span style="font-size:0.82rem;font-weight:800;color:var(--accent);">${d.version || ''}</span>
          <div style="display:flex;align-items:center;gap:0.5rem;">
            <span style="font-size:0.7rem;font-family:var(--font-mono);color:var(--muted);">${d.date || ''}</span>
            ${isSA ? `
              <button onclick="editChangelogEntry('${id}')"
                style="font-size:0.7rem;font-family:var(--font-mono);font-weight:700;
                  padding:0.15rem 0.45rem;border-radius:5px;cursor:pointer;
                  background:var(--surface3);color:var(--muted);border:1px solid var(--border2);
                  transition:all 0.15s;" onmouseover="this.style.color='var(--accent)';this.style.borderColor='var(--accent)'"
                onmouseout="this.style.color='var(--muted)';this.style.borderColor='var(--border2)'">✎</button>
              <button onclick="deleteChangelogEntry('${id}')"
                style="font-size:0.7rem;font-family:var(--font-mono);font-weight:700;
                  padding:0.15rem 0.45rem;border-radius:5px;cursor:pointer;
                  background:var(--surface3);color:var(--muted);border:1px solid var(--border2);
                  transition:all 0.15s;" onmouseover="this.style.color='#ef4444';this.style.borderColor='#ef4444'"
                onmouseout="this.style.color='var(--muted)';this.style.borderColor='var(--border2)'">✕</button>
            ` : ''}
          </div>
        </div>
        <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:0.3rem;">
          ${notes.map(n => `<li style="font-size:0.8rem;color:var(--text);line-height:1.5;">• ${n}</li>`).join('')}
        </ul>
      </div>`;
    }).join('');
  } catch (e) {
    list.innerHTML = '<div style="text-align:center;color:var(--muted);font-size:0.82rem;padding:2rem;">Erro ao carregar.</div>';
  }
}

async function checkChangelogBadge() {
  const badge = document.getElementById('changelog-badge');
  if (!badge) return;
  try {
    const snap = await db.collection('changelog').orderBy('date', 'desc').limit(1).get();
    if (snap.empty) return;
    const latest = snap.docs[0].data();
    const lastSeen = localStorage.getItem('changelog-last-seen');
    badge.style.display = (latest.date && latest.date !== lastSeen) ? 'flex' : 'none';
  } catch (e) { }
}

function markChangelogRead() {
  const badge = document.getElementById('changelog-badge');
  if (badge) badge.style.display = 'none';
  db.collection('changelog').orderBy('date', 'desc').limit(1).get()
    .then(snap => {
      if (!snap.empty) localStorage.setItem('changelog-last-seen', snap.docs[0].data().date);
    }).catch(() => { });
}

function openChangelogManager() {
  document.getElementById('cl-version-input').value = '';
  document.getElementById('cl-notes-input').value = '';
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('cl-date-input').value = today;
  document.getElementById('changelog-modal').classList.add('open');
}

function closeChangelogManager() {
  const modal = document.getElementById('changelog-modal');
  if (modal) { modal.classList.remove('open'); delete modal.dataset.editId; }
}

async function saveChangelog() {
  const version = document.getElementById('cl-version-input').value.trim();
  const date = document.getElementById('cl-date-input').value;
  const notes = document.getElementById('cl-notes-input').value.trim();
  if (!version || !date || !notes) { showNotification('Preencha todos os campos.', 'error'); return; }
  const modal = document.getElementById('changelog-modal');
  const editId = modal?.dataset?.editId || '';
  try {
    if (editId) {
      // Edição de entrada existente
      await db.collection('changelog').doc(editId).update({ version, date, notes });
      delete modal.dataset.editId;
      showNotification('Novidade atualizada! 📋', 'success');
    } else {
      // Nova entrada
      await db.collection('changelog').add({ version, date, notes, createdAt: new Date().toISOString() });
      showNotification('Notas publicadas com sucesso! 📋', 'success');
    }
    closeChangelogManager();
    if (_changelogOpen) loadChangelogEntries();
  } catch (e) {
    console.error('[Changelog] Erro ao salvar:', e);
    const msg = e?.code === 'permission-denied'
      ? 'Sem permissão no Firestore. Verifique as regras de segurança da coleção "changelog".'
      : `Erro ao salvar: ${e?.message || 'desconhecido'}`;
    showNotification(msg, 'error');
  }
}

async function editChangelogEntry(docId) {
  try {
    const doc = await db.collection('changelog').doc(docId).get();
    if (!doc.exists) { showNotification('Entrada não encontrada.', 'error'); return; }
    const d = doc.data();
    document.getElementById('cl-version-input').value = d.version || '';
    document.getElementById('cl-date-input').value = d.date || '';
    document.getElementById('cl-notes-input').value = d.notes || '';
    // Guardar o ID sendo editado no modal
    document.getElementById('changelog-modal').dataset.editId = docId;
    document.getElementById('changelog-modal').classList.add('open');
  } catch (e) {
    showNotification('Erro ao carregar entrada.', 'error');
  }
}

async function deleteChangelogEntry(docId) {
  if (!await showConfirm('Excluir novidade', 'Excluir esta entrada de novidades?', { okText: 'Excluir', danger: true })) return;
  try {
    await db.collection('changelog').doc(docId).delete();
    showNotification('Entrada excluída!', 'success');
    loadChangelogEntries();
  } catch (e) {
    showNotification('Erro ao excluir entrada.', 'error');
  }
}

// ══════════════════════════════════════════════════════
// TEMA CLARO / ESCURO
// ══════════════════════════════════════════════════════

function applyDarkMode(dark) {
  // Aplicar em html E body — html para evitar flash, body para os estilos CSS
  document.documentElement.classList.toggle('dark-mode', dark);
  document.body.classList.toggle('dark-mode', dark);
  const track = document.getElementById('theme-switch-track');
  if (track) track.dataset.dark = dark ? '1' : '0';
}

function toggleDarkMode() {
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('premovale-theme', isDark ? 'light' : 'dark');
  applyDarkMode(!isDark);
}

function initDarkMode() {
  const saved = localStorage.getItem('premovale-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyDarkMode(saved ? saved === 'dark' : prefersDark);
}

// ══════════════════════════════════════════════════════
// SESSÃO — LOGOUT POR SEGUNDO PLANO
// ══════════════════════════════════════════════════════

// Tempos em segundo plano por papel
// ══ Sessão compartilhada entre abas (Opção B) ══════════════════════════════
const _SESSION_KEY = 'chamados-current-user-id';
const _SETOR_KEY = 'premovale-current-setor';
let _sessionSyncReady = false;

function _sessionGet() { return sessionStorage.getItem(_SESSION_KEY); }
function _sessionSet(id, setor) {
  if (id != null) sessionStorage.setItem(_SESSION_KEY, id);
  if (setor != null) sessionStorage.setItem(_SETOR_KEY, setor);
}
function _sessionClear() {
  sessionStorage.removeItem(_SESSION_KEY);
  sessionStorage.removeItem(_SETOR_KEY);
}

function _requestSessionFromTabs(timeout) {
  return new Promise(function (resolve) {
    var reqId = 'r' + Date.now() + Math.random().toString(36).slice(2);
    var done = false;
    function onResp(e) {
      if (e.key === 'premovale-session-response' && e.newValue) {
        try {
          var r = JSON.parse(e.newValue);
          if (r.reqId === reqId && r.userId) {
            done = true;
            window.removeEventListener('storage', onResp);
            resolve({ userId: r.userId, setor: r.setor || '' });
          }
        } catch (_) { }
      }
    }
    window.addEventListener('storage', onResp);
    localStorage.setItem('premovale-session-request', JSON.stringify({ reqId: reqId, at: Date.now() }));
    localStorage.removeItem('premovale-session-request');
    setTimeout(function () {
      if (!done) { window.removeEventListener('storage', onResp); resolve(null); }
    }, timeout || 350);
  });
}

function setupSessionSync() {
  if (_sessionSyncReady) return;
  _sessionSyncReady = true;
  window.addEventListener('storage', function (e) {
    if (e.key === 'premovale-session-request' && e.newValue) {
      var id = _sessionGet();
      if (id) {
        try {
          var req = JSON.parse(e.newValue);
          localStorage.setItem('premovale-session-response', JSON.stringify({
            reqId: req.reqId, userId: id, setor: sessionStorage.getItem(_SETOR_KEY) || ''
          }));
          localStorage.removeItem('premovale-session-response');
        } catch (_) { }
      }
    }
    if (e.key === 'premovale-logout-signal' && e.newValue) {
      _sessionClear();
      if (typeof stopSessionTimer === 'function') stopSessionTimer();
      var p = location.pathname;
      if (p.indexOf('login') === -1 && p.indexOf('index') === -1) {
        window.location.href = 'login.html';
      }
    }
  });
}

async function ensureSession() {
  setupSessionSync();
  var id = _sessionGet();
  if (id) return id;
  var inherited = await _requestSessionFromTabs(350);
  if (inherited && inherited.userId) {
    _sessionSet(inherited.userId, inherited.setor);
    return inherited.userId;
  }
  return null;
}

function broadcastLogout() {
  localStorage.setItem('premovale-logout-signal', String(Date.now()));
  localStorage.removeItem('premovale-logout-signal');
}

const SESSION_CONFIG = {
  requester: { bgTimeout: 15 * 60 * 1000, warnBefore: 3 * 60 * 1000 }, // 15min / aviso 3min
  attendant: { bgTimeout: 30 * 60 * 1000, warnBefore: 5 * 60 * 1000 }, // 30min / aviso 5min
  default: { bgTimeout: 15 * 60 * 1000, warnBefore: 3 * 60 * 1000 }, // fallback
};

let _inacTimeout = SESSION_CONFIG.default.bgTimeout;   // limite de INATIVIDADE
let _inacWarnBefore = SESSION_CONFIG.default.warnBefore;
let _inacInterval = null;
let _inacWarning = false;
let _inacLastMark = 0;
const _LAST_ACTIVE_KEY = 'premovale-app-last-active';
const _ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

function initSessionTimer(role) {
  const isAttendant = role === 'attendant' || role === 'admin' || role === 'superadmin';
  const cfg = isAttendant ? SESSION_CONFIG.attendant : SESSION_CONFIG.requester;
  _inacTimeout = cfg.bgTimeout;
  _inacWarnBefore = cfg.warnBefore;
  _sessMarkActive(true);
  _ACTIVITY_EVENTS.forEach(function (ev) { window.addEventListener(ev, _sessOnActivity, { passive: true }); });
  window.addEventListener('storage', _sessOnStorageActivity);
  clearInterval(_inacInterval);
  _inacInterval = setInterval(_sessCheck, 5000);
}

function stopSessionTimer() {
  clearInterval(_inacInterval);
  _inacInterval = null;
  _ACTIVITY_EVENTS.forEach(function (ev) { window.removeEventListener(ev, _sessOnActivity, { passive: true }); });
  window.removeEventListener('storage', _sessOnStorageActivity);
  dismissSessionWarning();
  hideVisualTimer();
  _inacWarning = false;
}

// Carimbo de última atividade — compartilhado entre abas (presença do app inteiro)
function _sessMarkActive(force) {
  const now = Date.now();
  if (!force && now - _inacLastMark < 3000) return; // throttle: no máx. 1x/3s
  _inacLastMark = now;
  try { localStorage.setItem(_LAST_ACTIVE_KEY, String(now)); } catch (_) { }
  if (_inacWarning) { _inacWarning = false; dismissSessionWarning(); }
}

function _sessOnActivity() { _sessMarkActive(false); }

// Atividade em OUTRA aba (o carimbo compartilhado mudou) → mantém esta viva e some o aviso
function _sessOnStorageActivity(e) {
  if (e.key === _LAST_ACTIVE_KEY && e.newValue) {
    _inacLastMark = Date.now();
    if (_inacWarning) { _inacWarning = false; dismissSessionWarning(); }
  }
}

function _sessGetLastActive() {
  const v = parseInt(localStorage.getItem(_LAST_ACTIVE_KEY) || '0', 10);
  return v || Date.now();
}

function _sessCheck() {
  const idle = Date.now() - _sessGetLastActive();
  if (idle >= _inacTimeout) {
    triggerAfkLogout();
  } else if (idle >= _inacTimeout - _inacWarnBefore) {
    showAfkWarning();
  } else if (_inacWarning) {
    _inacWarning = false;
    dismissSessionWarning();
  }
}

function hideVisualTimer() {
  const el = document.getElementById('session-timer');
  if (el) el.style.display = 'none';
}

function showAfkWarning() {
  if (_inacWarning) return;
  _inacWarning = true;
  const overlay = document.createElement('div');
  overlay.id = 'afk-warning-overlay';
  overlay.innerHTML = `
    <div class="afk-warning-box">
      <div class="afk-warning-icon">⏰</div>
      <div class="afk-warning-title">Sessão expirando</div>
      <div class="afk-warning-text">
        Você está inativo há algum tempo.<br>
        Sua sessão encerrará em <strong id="afk-warn-mins"></strong>.
      </div>
      <div class="afk-warning-countdown" id="afk-countdown"></div>
      <button class="afk-warning-btn" onclick="_sessMarkActive(true)">
        <span style="display:inline-flex;align-items:center;gap:6px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg> Continuar conectado</span>
      </button>
    </div>`;
  document.body.appendChild(overlay);
  const warnMins = Math.round(_inacWarnBefore / 60000);
  const warnMinsEl = document.getElementById('afk-warn-mins');
  if (warnMinsEl) warnMinsEl.textContent = `${warnMins} minuto${warnMins > 1 ? 's' : ''}`;
  const countEl = document.getElementById('afk-countdown');
  const tick = function () {
    if (!document.getElementById('afk-countdown')) return;
    const idle = Date.now() - _sessGetLastActive();
    const restante = Math.max(0, Math.ceil((_inacTimeout - idle) / 1000));
    const m = Math.floor(restante / 60);
    const s = String(restante % 60).padStart(2, '0');
    if (countEl) { countEl.textContent = `${m}:${s}`; if (restante <= 60) countEl.style.color = '#ef4444'; }
  };
  tick();
  overlay.dataset.interval = setInterval(tick, 1000);
}

function dismissSessionWarning() {
  _inacWarning = false;
  const overlay = document.getElementById('afk-warning-overlay');
  if (!overlay) return;
  clearInterval(parseInt(overlay.dataset.interval));
  overlay.remove();
}

function triggerAfkLogout() {
  stopSessionTimer();
  saveSessionState();
  _sessionClear();
  try { localStorage.removeItem(_LAST_ACTIVE_KEY); } catch (_) { }
  localStorage.setItem('premovale-logout-reason', 'inatividade');
  if (typeof broadcastLogout === 'function') broadcastLogout();
  window.location.href = 'login.html?reason=inatividade';
}

function saveSessionState() {
  try {
    const state = {
      filter: typeof currentFilter !== 'undefined' ? currentFilter : 'all',
      viewMode: localStorage.getItem('chamados-view-mode') || 'cards',
    };
    localStorage.setItem('premovale-last-session', JSON.stringify(state));
  } catch (e) { }
}

function restoreSessionState() {
  try {
    const raw = localStorage.getItem('premovale-last-session');
    if (!raw) return;
    const state = JSON.parse(raw);
    // Restaurar filtro
    if (state.filter && typeof filterTickets === 'function') {
      const btn = document.querySelector(`[onclick*="filterTickets('${state.filter}')"]`);
      if (btn) btn.click();
      else if (typeof filterTickets === 'function') filterTickets(state.filter);
    }
    // viewMode já é restaurado pelo initDarkMode/applyViewMode via localStorage
    localStorage.removeItem('premovale-last-session');
  } catch (e) { }
}

// ══════════════════════════════
// DROPDOWN RAMAIS
// ══════════════════════════════
let _ramaisOpen = false;
let _ramaisListener = null;

function toggleRamaisDropdown() {
  const dd = document.getElementById('ramais-dropdown');
  if (!dd) return;
  _ramaisOpen = !_ramaisOpen;
  dd.style.display = _ramaisOpen ? 'block' : 'none';
  if (_ramaisOpen) {
    renderRamaisDropdown();
    // Fechar ao clicar fora
    setTimeout(() => {
      document.addEventListener('click', _closeRamaisOutside);
    }, 10);
  } else {
    document.removeEventListener('click', _closeRamaisOutside);
  }
}

function _closeRamaisOutside(e) {
  const wrapper = document.getElementById('ramais-wrapper');
  if (wrapper && !wrapper.contains(e.target)) {
    const dd = document.getElementById('ramais-dropdown');
    if (dd) dd.style.display = 'none';
    _ramaisOpen = false;
    document.removeEventListener('click', _closeRamaisOutside);
  }
}

async function renderRamaisDropdown() {
  const dd = document.getElementById('ramais-dropdown');
  if (!dd) return;

  dd.innerHTML = `
    <div class="ramais-search-wrap">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;color:var(--muted)"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      <input type="text" id="ramais-search" class="ramais-search-input" placeholder="Buscar nome ou ramal..." oninput="filterRamais(this.value)" autofocus>
      <button onclick="exportRamaisXLS()" title="Exportar para Excel"
        style="flex-shrink:0;border:none;background:none;cursor:pointer;color:var(--muted);display:flex;align-items:center;padding:0 2px;transition:color 0.15s;"
        onmouseover="this.style.color='var(--accent)'" onmouseout="this.style.color='var(--muted)'">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
      </button>
    </div>
    <div id="ramais-list" class="ramais-list">
      <div style="padding:0.75rem;font-size:0.75rem;color:var(--muted);text-align:center;">Carregando...</div>
    </div>`;

  // Garantir que db está disponível
  if (typeof db === 'undefined') {
    document.getElementById('ramais-list').innerHTML =
      '<div style="padding:0.75rem;font-size:0.75rem;color:var(--muted);text-align:center;">Firebase não inicializado.</div>';
    return;
  }

  try {
    const snap = await db.collection('setores').get();

    // Coleção vazia — ainda não há setores cadastrados
    if (snap.empty) {
      document.getElementById('ramais-list').innerHTML =
        '<div style="padding:0.75rem;font-size:0.75rem;color:var(--muted);text-align:center;">Nenhum setor cadastrado ainda.</div>';
      return;
    }

    const setores = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(s => s.ativo !== false && (s.ramais || []).length > 0)
      .sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR'));

    window._ramaisData = setores;
    renderRamaisList(setores);

  } catch (e) {
    console.error('[Premovale] Erro ao carregar ramais:', e?.code, e?.message);
    const list = document.getElementById('ramais-list');
    if (list) {
      const msg = e?.code === 'permission-denied'
        ? 'Sem permissão. Verifique as regras do Firestore.'
        : e?.code === 'unavailable'
          ? 'Sem conexão com o Firebase.'
          : 'Erro ao carregar ramais.';
      list.innerHTML = `<div style="padding:0.75rem;font-size:0.75rem;color:var(--muted);text-align:center;">${msg}</div>`;
    }
  }
}

function renderRamaisList(setores) {
  const list = document.getElementById('ramais-list');
  if (!list) return;

  if (setores.length === 0) {
    list.innerHTML = '<div style="padding:0.75rem;font-size:0.75rem;color:var(--muted);text-align:center;">Nenhum ramal encontrado.</div>';
    return;
  }

  list.innerHTML = setores.map(s => {
    const ramais = (s.ramais || []);
    if (ramais.length === 0) return '';
    return `
      <div class="ramais-setor-label">${s.nome}</div>
      ${ramais.map(r => `
        <div class="ramais-item">
          <span class="ramais-item-nome">${r.nome || '—'}</span>
          <span class="ramais-item-num">${r.ramal || '—'}</span>
        </div>`).join('')}`;
  }).join('');
}

function filterRamais(query) {
  if (!window._ramaisData) return;
  const q = query.toLowerCase().trim();

  if (!q) {
    renderRamaisList(window._ramaisData);
    return;
  }

  const filtered = window._ramaisData.map(s => ({
    ...s,
    ramais: (s.ramais || []).filter(r =>
      (r.nome || '').toLowerCase().includes(q) ||
      (r.ramal || '').toLowerCase().includes(q))
  })).filter(s => s.ramais.length > 0);

  renderRamaisList(filtered);
}

// ── Exportar ramais para XLS ───────────────────────────────────────────────
function exportRamaisXLS() {
  if (!window._ramaisData || !window._ramaisData.length) {
    showNotification('Nenhum ramal para exportar.', 'error');
    return;
  }

  // Montar linhas: Setor | Nome | Ramal
  const rows = [['Setor', 'Nome', 'Ramal']];
  window._ramaisData.forEach(s => {
    (s.ramais || []).forEach(r => {
      rows.push([s.nome || '—', r.nome || '—', r.ramal || '—']);
    });
  });

  // Criar workbook via SheetJS (disponível via CDN no projeto)
  try {
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 20 }, { wch: 30 }, { wch: 12 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ramais');
    XLSX.writeFile(wb, 'ramais_premovale.xlsx');
    showNotification('Ramais exportados! ✅', 'success');
  } catch (e) {
    // Fallback: CSV se SheetJS não estiver disponível
    const csv = rows.map(r => r.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'ramais_premovale.csv'; a.click();
    URL.revokeObjectURL(url);
    showNotification('Exportado como CSV! ✅', 'success');
  }
}
// ── Módulos Pai — funções globais (usadas em todas as páginas) ──
function toggleModPai(id) {
  const isCollapsed = document.getElementById('chamados-sidebar')?.classList.contains('collapsed');
  if (isCollapsed) {
    _toggleModPaiFloat(id);
  } else {
    _openModPai(id);
  }
}

function _openModPai(id) {
  const btn = document.getElementById('mod-pai-' + id + '-btn');
  const submenu = document.getElementById('mod-pai-' + id + '-submenu');
  if (!btn || !submenu) return;
  const isOpen = submenu.classList.contains('open');
  document.querySelectorAll('.mod-pai-submenu').forEach(s => s.classList.remove('open'));
  document.querySelectorAll('.mod-pai-btn').forEach(b => b.classList.remove('open'));
  if (!isOpen) {
    submenu.classList.add('open');
    btn.classList.add('open');
  }
}

function _toggleModPaiFloat(id) {
  const btn = document.getElementById('mod-pai-' + id + '-btn');
  const submenu = document.getElementById('mod-pai-' + id + '-submenu');
  if (!btn || !submenu) return;
  const rect = btn.getBoundingClientRect();
  submenu.style.top = rect.top + 'px';
  const isOpen = submenu.classList.contains('open-float');
  document.querySelectorAll('.mod-pai-submenu').forEach(s => s.classList.remove('open-float'));
  if (!isOpen) submenu.classList.add('open-float');
}

function initModPai(activeSubmod) {
  // Navegação nova (módulos pai sem submenu): se não há submenus na página, não faz nada.
  if (!document.querySelector('.mod-pai-submenu')) return;
  // Fecha submenu ao clicar fora
  document.addEventListener('click', e => {
    if (!e.target.closest('.chamados-sidebar')) {
      document.querySelectorAll('.mod-pai-submenu').forEach(s => {
        s.classList.remove('open-float');
        s.classList.remove('open');
      });
      document.querySelectorAll('.mod-pai-btn').forEach(b => b.classList.remove('open'));
    }
  });
  // Determinar qual módulo pai abrir com base no submódulo ativo
  const comercialSubs = ['comercial'];
  const tiSubs = ['chamados', 'materiais', 'inventario', 'rotinas'];
  if (activeSubmod && comercialSubs.includes(activeSubmod)) {
    _openModPai('comercial');
  } else {
    _openModPai('ti');
  }
  // Marcar submódulo ativo
  if (activeSubmod) {
    const el = document.getElementById('sub-' + activeSubmod);
    if (el) el.classList.add('active');
  }
}
// ===== NAVEGAÇÃO POR MÓDULOS PAI (chrome compartilhado — passo 2) =====
// montarSubmodTabs(): monta a barra de abas dos submódulos de um módulo pai.
// aplicarSidebarPai(): marca o pai ativo na sidebar e mostra/esconde o Comercial por acesso.
// Usado por index, materiais, inventario, rotinas e comercial.

const NAV_MODULOS = {
  geral: {
    tabs: [
      { label: 'Painel', href: 'dashboard.html?modulo=geral', ic: 'painel', pagina: 'painel' },
    ]
  },
  ti: {
    tabs: [
      { label: 'Painel', href: 'dashboard.html?modulo=ti', ic: 'painel', pagina: 'painel' },
      { label: 'Chamados', href: 'index.html', ic: 'ticket', pagina: 'chamados', mod: 'chamados' },
      { label: 'Materiais', href: 'materiais.html', ic: 'package', pagina: 'materiais', mod: 'materiais' },
      { label: 'Inventário', href: 'inventario.html', ic: 'inventario', pagina: 'inventario', mod: 'inventario' },
      { label: 'Rotinas', href: 'rotinas.html', ic: 'rotinas', pagina: 'rotinas', mod: 'rotinas' },
      { label: 'Infraestrutura', href: 'infraestrutura.html', ic: 'server', pagina: 'infraestrutura', mod: 'infraestrutura' },
    ]
  },
  comercial: {
    tabs: [
      { label: 'Painel', href: 'dashboard.html?modulo=comercial', ic: 'painel', pagina: 'painel' },
      { label: 'Controle de Obras', href: 'comercial.html', ic: 'briefcase', pagina: 'comercial', mod: 'comercial' },
    ]
  },
};

const _NAV_TAB_ICONS = {
  painel: '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
  ticket: '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2M13 17v2M13 11v2"/>',
  package: '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"/>',
  inventario: '<path d="M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z"/><path d="m7 16.5-4.74-2.85"/><path d="m7 16.5 5-3"/><path d="M7 16.5v5.17"/><path d="M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z"/><path d="m17 16.5-5-3"/><path d="m17 16.5 4.74-2.85"/><path d="M17 16.5v5.17"/><path d="M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3 5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0l-3 1.8Z"/><path d="M12 8 7.26 5.15"/><path d="m12 8 4.74-2.85"/><path d="M12 13.5V8"/>',
  rotinas: '<path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8M13 12h8M13 18h8"/>',
  server: '<rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/>',
  briefcase: '<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>',
};
function _navTabIco(n) {
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${_NAV_TAB_ICONS[n] || ''}</svg>`;
}
function _navAcessos(user) {
  // Super Admin acessa todo o sistema, sem exceção.
  if (user.isSuperAdmin) {
    return [...ACESSOS_POR_MODULO.ti, ...ACESSOS_POR_MODULO.comercial];
  }
  return user.acessos || ['chamados'];
}

function montarSubmodTabs(containerId, moduloAtivo, paginaAtiva, user) {
  const cont = document.getElementById(containerId);
  if (!cont || !NAV_MODULOS[moduloAtivo] || !user) return;
  const acessos = _navAcessos(user);
  // Painel (sem t.mod) sempre visível a quem tem o módulo; cada aba é liberada
  // individualmente pelo admin do módulo (allow-list). Super Admin vê tudo.
  const tabs = NAV_MODULOS[moduloAtivo].tabs.filter(t =>
    !t.mod || user.isSuperAdmin || acessos.includes(t.mod));
  cont.innerHTML = tabs.map(t =>
    `<a class="submod-tab${t.pagina === paginaAtiva ? ' ativo' : ''}" href="${t.href}">${_navTabIco(t.ic)}<span>${t.label}</span></a>`
  ).join('');
}

/* ── MÓDULOS PAI: fonte única de quem enxerga o quê ──────────────────────────
 * Modelo de acesso em 2 níveis:
 *   1) MÓDULO  (user.modulos = ['ti','comercial'])  -> concedido pelo Super Admin
 *                                                      em Configurações > Acessos
 *   2) ABAS    (user.acessos = ['chamados', ...])   -> concedidas pelo admin do
 *                                                      módulo, dentro do módulo
 * Ganhar o módulo dá acesso apenas ao Painel; cada aba é liberada uma a uma.
 * Super Admin acessa TUDO, sem exceção.
 * Regra: função nova sem módulo pai natural entra no T.I.
 * ------------------------------------------------------------------------- */
const MODULOS_PAI = ['ti', 'comercial'];

// Abas/permissões que pertencem a cada módulo pai (usado no fallback e no modal)
const ACESSOS_POR_MODULO = {
  ti: ['chamados', 'materiais', 'inventario', 'rotinas', 'infraestrutura', 'pub_comunicados'],
  comercial: ['comercial', 'adminComercial', 'atribuivelComercial'],
};

// Deriva os módulos a partir dos acessos antigos (retrocompatibilidade:
// usuários gravados antes do campo `modulos` continuam funcionando).
function _derivarModulos(user) {
  const ac = user.acessos || ['chamados'];
  const mods = [];
  if (user.isAdmin || ACESSOS_POR_MODULO.ti.some(k => ac.includes(k))) mods.push('ti');
  if (user.isAdminComercial || user.isComercial ||
    ACESSOS_POR_MODULO.comercial.some(k => ac.includes(k))) mods.push('comercial');
  return mods;
}

// Módulos pai que o usuário possui. Super Admin sempre tem todos.
function modulosDoUsuario(user) {
  if (!user) return [];
  if (user.isSuperAdmin) return [...MODULOS_PAI];
  if (Array.isArray(user.modulos)) return user.modulos.filter(m => MODULOS_PAI.includes(m));
  return _derivarModulos(user);
}

function temModulo(user, modulo) {
  return modulosDoUsuario(user).includes(modulo);
}

// Admin de um módulo (nomeado pelo Super Admin, gerencia as abas dos usuários)
function isAdminDoModulo(user, modulo) {
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  if (modulo === 'ti') return !!user.isAdmin;
  if (modulo === 'comercial') return !!user.isAdminComercial;
  return false;
}

function aplicarSidebarPai(moduloAtivo, user) {
  if (!user) return;
  ['ti', 'comercial', 'geral'].forEach(m => {
    const el = document.getElementById('navpai-' + m);
    if (el) el.classList.toggle('active', m === moduloAtivo);
  });
  MODULOS_PAI.forEach(m => {
    const el = document.getElementById('navpai-' + m);
    if (el) el.style.display = temModulo(user, m) ? 'flex' : 'none';
  });
}

// ===== BOOTSTRAP DE NAVEGAÇÃO (passo 2) =====
// Lê data-modulo/data-pagina do <body> e monta sidebar/abas em qualquer página,
// sem precisar editar o init de cada uma. Resolve o usuário pela sessão.
function _navResolveUser() {
  try {
    const id = sessionStorage.getItem('chamados-current-user-id');
    if (id && typeof users !== 'undefined' && Array.isArray(users)) {
      const u = users.find(x => x.id === id);
      if (u) return u;
    }
  } catch (e) { }
  return (typeof currentUser !== 'undefined' && currentUser) || null;
}

function initNavPai() {
  try {
    const modulo = document.body.getAttribute('data-modulo');
    const pagina = document.body.getAttribute('data-pagina');
    if (!modulo) return;
    const run = (user) => {
      if (!user) return;
      if (typeof aplicarSidebarPai === 'function') aplicarSidebarPai(modulo, user);
      if (typeof montarSubmodTabs === 'function') montarSubmodTabs('submod-tabs', modulo, pagina, user);
      if (typeof montarBotaoAcessos === 'function') montarBotaoAcessos(user);
    };
    const user = _navResolveUser();
    if (user) run(user);
    else if (typeof loadUsers === 'function') loadUsers().then(() => run(_navResolveUser())).catch(() => { });
  } catch (e) { console.error('[NavPai]', e); }
}

document.addEventListener('DOMContentLoaded', initNavPai);

/* ============================================================================
 * showConfirm() — modal de confirmação GLOBAL (substitui o confirm() nativo)
 * Autossuficiente: injeta o próprio CSS e DOM, funciona em qualquer página
 * que carregue ui.js, sem exigir HTML/CSS dedicado.
 *
 *   if (!await showConfirm('Excluir item', 'Esta ação não pode ser desfeita.',
 *                          { okText: 'Excluir', danger: true })) return;
 *
 * Regra do sistema: NUNCA usar confirm/alert/prompt nativos.
 * ========================================================================== */
let _pmConfirmResolve = null;

function _pmConfirmCSS() {
  if (document.getElementById('pm-confirm-style')) return;
  const st = document.createElement('style');
  st.id = 'pm-confirm-style';
  st.textContent = `
.pm-confirm-ov{position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:1rem;opacity:0;transition:opacity .16s}
.pm-confirm-ov.show{opacity:1}
.pm-confirm-box{background:var(--surface,#fff);border:1px solid var(--border2,#e5e7eb);border-radius:14px;width:min(420px,94vw);box-shadow:0 24px 64px rgba(0,0,0,.28);transform:translateY(8px) scale(.99);transition:transform .16s}
.pm-confirm-ov.show .pm-confirm-box{transform:none}
.pm-confirm-title{font-family:var(--font-display,'Plus Jakarta Sans',sans-serif);font-size:.95rem;font-weight:800;color:var(--text,#111);padding:1.15rem 1.3rem .35rem}
.pm-confirm-msg{font-family:var(--font-display,'Plus Jakarta Sans',sans-serif);font-size:.85rem;line-height:1.55;color:var(--muted,#6b7280);padding:0 1.3rem 1rem;margin:0;white-space:pre-line}
.pm-confirm-foot{display:flex;justify-content:flex-end;gap:.5rem;padding:0 1.3rem 1.2rem}
.pm-confirm-btn{font-family:var(--font-display,'Plus Jakarta Sans',sans-serif);font-size:.82rem;font-weight:700;padding:.55rem 1.15rem;border-radius:8px;cursor:pointer;border:1px solid transparent;transition:background .15s,transform .12s;white-space:nowrap}
.pm-confirm-btn:active{transform:translateY(1px)}
.pm-confirm-cancel{background:var(--surface2,#f3f4f6);border-color:var(--border2,#e5e7eb);color:var(--text,#111)}
.pm-confirm-cancel:hover{background:var(--surface3,#e5e7eb)}
.pm-confirm-ok{background:var(--accent,#3b82f6);color:#fff}
.pm-confirm-ok:hover{filter:brightness(.94)}
.pm-confirm-ok.danger{background:#ef4444}
.pm-confirm-ok.danger:hover{background:#dc2626}
`;
  document.head.appendChild(st);
}

function showConfirm(title, message, opts) {
  opts = opts || {};
  _pmConfirmCSS();
  return new Promise(resolve => {
    let done = false;
    const finish = (val) => {
      if (done) return;
      done = true;
      document.removeEventListener('keydown', onKey);
      ov.classList.remove('show');
      setTimeout(() => ov.remove(), 160);
      _pmConfirmResolve = null;
      resolve(val);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') finish(false);
      else if (e.key === 'Enter') finish(true);
    };

    const ov = document.createElement('div');
    ov.className = 'pm-confirm-ov';
    ov.innerHTML =
      '<div class="pm-confirm-box" role="alertdialog" aria-modal="true">' +
      '<div class="pm-confirm-title"></div>' +
      '<p class="pm-confirm-msg"></p>' +
      '<div class="pm-confirm-foot">' +
      '<button type="button" class="pm-confirm-btn pm-confirm-cancel"></button>' +
      '<button type="button" class="pm-confirm-btn pm-confirm-ok"></button>' +
      '</div></div>';

    ov.querySelector('.pm-confirm-title').textContent = title || 'Confirmar';
    ov.querySelector('.pm-confirm-msg').textContent = message || '';
    const btnCancel = ov.querySelector('.pm-confirm-cancel');
    const btnOk = ov.querySelector('.pm-confirm-ok');
    btnCancel.textContent = opts.cancelText || 'Cancelar';
    btnOk.textContent = opts.okText || 'Confirmar';
    if (opts.danger) btnOk.classList.add('danger');

    btnCancel.addEventListener('click', () => finish(false));
    btnOk.addEventListener('click', () => finish(true));
    ov.addEventListener('mousedown', e => { if (e.target === ov) finish(false); });
    document.addEventListener('keydown', onKey);

    document.body.appendChild(ov);
    _pmConfirmResolve = finish;
    requestAnimationFrame(() => { ov.classList.add('show'); btnOk.focus(); });
  });
}

/* ============================================================================
 * ACESSOS DO MÓDULO — botão na navbar + modal de abas por usuário
 * Nível 2 do modelo: o admin do módulo libera as ABAS de cada usuário que já
 * possui o módulo. O cargo de admin só o Super Admin concede.
 * ========================================================================== */
const ABAS_MODULO = {
  ti: [
    { key: 'chamados', label: 'Chamados' },
    { key: 'materiais', label: 'Materiais' },
    { key: 'inventario', label: 'Inventário' },
    { key: 'rotinas', label: 'Rotinas' },
    { key: 'infraestrutura', label: 'Infraestrutura' },
    { key: 'pub_comunicados', label: 'Publicar Comunicados' },
  ],
  comercial: [
    { key: 'comercial', label: 'Controle de Obras' },
    { key: 'atribuivelComercial', label: 'Atribuível' },
  ],
};

// Como o cargo de admin é gravado em cada módulo (histórico do sistema):
//   T.I       -> campo booleano user.isAdmin
//   Comercial -> acesso 'adminComercial' (é o que comercial.js consulta)
const ADMIN_MODULO = {
  ti: { tipo: 'campo', chave: 'isAdmin' },
  comercial: { tipo: 'acesso', chave: 'adminComercial' },
};

function _ehAdminModulo(user, modulo) {
  const def = ADMIN_MODULO[modulo];
  if (!def || !user) return false;
  return def.tipo === 'campo'
    ? !!user[def.chave]
    : (user.acessos || []).includes(def.chave);
}

function nomeModulo(m) { return m === 'ti' ? 'T.I' : m === 'comercial' ? 'Comercial' : m; }

// Injeta o botão "Gerenciar acessos" na navbar da página do módulo.
function montarBotaoAcessos(user, moduloExplicito) {
  // moduloExplicito: usado pelo Painel (dashboard), cujo escopo vem de ?modulo=
  const modulo = moduloExplicito || document.body.getAttribute('data-modulo');
  if (!modulo || !ABAS_MODULO[modulo] || !user) return;
  if (!isAdminDoModulo(user, modulo)) return;      // admin do módulo ou Super Admin
  if (document.getElementById('btn-acessos-modulo')) return;

  const right = document.querySelector('.nav-right');
  if (!right) return;
  const btn = document.createElement('button');
  btn.id = 'btn-acessos-modulo';
  btn.className = 'sync-fab-small';
  btn.title = 'Gerenciar acessos do módulo';
  btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M22 11h-6"/><path d="M19 8v6"/></svg> Acessos`;
  btn.onclick = () => abrirModalAcessos(modulo);
  right.insertBefore(btn, right.firstChild);
}

function abrirModalAcessos(modulo) {
  const eu = _navResolveUser();
  if (!eu || !isAdminDoModulo(eu, modulo)) return;
  _acModulo = modulo;

  const ov = document.createElement('div');
  ov.className = 'pm-ac-ov';
  ov.id = 'pm-ac-ov';
  ov.innerHTML = `
    <div class="pm-ac-box">
      <div class="pm-ac-head">
        <div class="pm-ac-title">Acessos · ${nomeModulo(modulo)}</div>
        <button class="pm-ac-x" onclick="fecharModalAcessos()">&times;</button>
      </div>
      <div class="pm-ac-body" id="pm-ac-body"></div>
    </div>`;
  ov.addEventListener('mousedown', e => { if (e.target === ov) fecharModalAcessos(); });
  document.body.appendChild(ov);
  _pmAcessosCSS();
  requestAnimationFrame(() => ov.classList.add('show'));
  renderModalAcessos();
}
let _acModulo = null;

function fecharModalAcessos() {
  const ov = document.getElementById('pm-ac-ov');
  if (!ov) return;
  ov.classList.remove('show');
  setTimeout(() => ov.remove(), 160);
  _acModulo = null;
}

function renderModalAcessos() {
  const body = document.getElementById('pm-ac-body');
  const modulo = _acModulo;
  if (!body || !modulo) return;
  const eu = _navResolveUser();
  const souSA = !!eu?.isSuperAdmin;
  const abas = ABAS_MODULO[modulo];

  // Só usuários que já possuem o módulo (o Super Admin concede isso em Configurações).
  const lista = (typeof users !== 'undefined' ? users : []).filter(u => temModulo(u, modulo));
  if (!lista.length) {
    body.innerHTML = `<div class="pm-ac-vazio">Nenhum usuário com este módulo.</div>`;
    return;
  }

  body.innerHTML = lista.map(u => {
    const isSA = !!u.isSuperAdmin;
    const isSelf = u.id === eu?.id;
    const trava = isSA || isSelf;               // SA tem tudo; ninguém edita a si mesmo
    const acessos = u.acessos || [];
    const ehAdmin = _ehAdminModulo(u, modulo);

    const chips = abas.map(a => {
      const on = isSA || acessos.includes(a.key);
      return `<label class="pm-ac-chip ${on ? 'on' : ''} ${trava ? 'lock' : ''}">
        <input type="checkbox" ${on ? 'checked' : ''} ${trava ? 'disabled' : ''}
          onchange="toggleAbaUsuario('${u.id}','${a.key}',this.checked)">
        <span>${a.label}</span>
      </label>`;
    }).join('');

    // Cargo de admin: só o Super Admin concede.
    const admChip = `<label class="pm-ac-chip adm ${(isSA || ehAdmin) ? 'on' : ''} ${(!souSA || trava) ? 'lock' : ''}"
        title="${souSA ? '' : 'Somente o Super Admin define admins'}">
        <input type="checkbox" ${(isSA || ehAdmin) ? 'checked' : ''} ${(!souSA || trava) ? 'disabled' : ''}
          onchange="toggleAdminModulo('${u.id}',this.checked)">
        <span>Admin</span>
      </label>`;

    const tag = isSA ? 'Super Admin' : ehAdmin ? 'Admin' : (u.setor || '');
    return `<div class="pm-ac-row">
      <div class="pm-ac-user">
        <div class="pm-ac-nome">${capitalizeName(u.username)}</div>
        ${tag ? `<div class="pm-ac-tag">${tag}</div>` : ''}
      </div>
      <div class="pm-ac-chips">${chips}${admChip}</div>
    </div>`;
  }).join('');
}

async function toggleAbaUsuario(userId, chave, ativo) {
  const eu = _navResolveUser();
  if (!eu || !isAdminDoModulo(eu, _acModulo)) return;
  const u = users.find(x => x.id === userId);
  if (!u || u.isSuperAdmin || u.id === eu.id) return;

  let acessos = [...(u.acessos || [])];
  if (ativo && !acessos.includes(chave)) acessos.push(chave);
  if (!ativo) acessos = acessos.filter(a => a !== chave);

  const idx = users.findIndex(x => x.id === userId);
  users[idx] = { ...u, acessos };
  try {
    await db.collection('users').doc(userId).update({ acessos });
    showNotification('Acesso atualizado. ✅', 'success');
  } catch (e) {
    console.error('[toggleAbaUsuario]', e);
    showNotification('Erro ao salvar.', 'error');
  }
  renderModalAcessos();
}

async function toggleAdminModulo(userId, ativo) {
  const eu = _navResolveUser();
  if (!eu?.isSuperAdmin) return;                 // só Super Admin nomeia admin
  const u = users.find(x => x.id === userId);
  if (!u || u.isSuperAdmin || u.id === eu.id) return;

  const def = ADMIN_MODULO[_acModulo];
  const patch = {};
  if (def.tipo === 'campo') {
    patch[def.chave] = ativo;
  } else {
    let acessos = [...(u.acessos || [])];
    if (ativo && !acessos.includes(def.chave)) acessos.push(def.chave);
    if (!ativo) acessos = acessos.filter(a => a !== def.chave);
    patch.acessos = acessos;
    patch.isAdminComercial = ativo;             // mantém o campo legado coerente
  }

  const idx = users.findIndex(x => x.id === userId);
  users[idx] = { ...u, ...patch };
  try {
    await db.collection('users').doc(userId).update(patch);
    showNotification(`Admin ${ativo ? 'concedido' : 'removido'}. ✅`, 'success');
  } catch (e) {
    console.error('[toggleAdminModulo]', e);
    showNotification('Erro ao salvar.', 'error');
  }
  renderModalAcessos();
}

function _pmAcessosCSS() {
  if (document.getElementById('pm-ac-style')) return;
  const st = document.createElement('style');
  st.id = 'pm-ac-style';
  st.textContent = `
.pm-ac-ov{position:fixed;inset:0;z-index:99990;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:1rem;opacity:0;transition:opacity .16s}
.pm-ac-ov.show{opacity:1}
.pm-ac-box{background:var(--surface);border:1px solid var(--border2);border-radius:16px;width:min(680px,96vw);max-height:86vh;display:flex;flex-direction:column;box-shadow:0 24px 64px rgba(0,0,0,.3);transform:translateY(8px);transition:transform .16s}
.pm-ac-ov.show .pm-ac-box{transform:none}
.pm-ac-head{display:flex;align-items:center;justify-content:space-between;padding:1.1rem 1.3rem .8rem;border-bottom:1px solid var(--border2)}
.pm-ac-title{font-family:var(--font-display);font-size:.95rem;font-weight:800;color:var(--text)}
.pm-ac-x{border:none;background:transparent;color:var(--muted);font-size:1.5rem;line-height:1;cursor:pointer}
.pm-ac-x:hover{color:var(--accent)}
.pm-ac-body{padding:.6rem 1.3rem 1.2rem;overflow-y:auto}
.pm-ac-vazio{padding:2rem;text-align:center;color:var(--muted);font-size:.85rem}
.pm-ac-row{display:flex;align-items:center;gap:1rem;padding:.8rem 0;border-bottom:1px solid var(--border2)}
.pm-ac-row:last-child{border-bottom:none}
.pm-ac-user{flex:0 0 150px;min-width:0}
.pm-ac-nome{font-family:var(--font-display);font-weight:700;font-size:.85rem;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pm-ac-tag{font-family:var(--font-mono);font-size:.62rem;text-transform:uppercase;letter-spacing:.05em;color:var(--muted)}
.pm-ac-chips{display:flex;flex-wrap:wrap;gap:.35rem;flex:1}
.pm-ac-chip{display:inline-flex;align-items:center;cursor:pointer;user-select:none}
.pm-ac-chip input{position:absolute;opacity:0;width:0;height:0}
.pm-ac-chip span{font-family:var(--font-display);font-size:.72rem;font-weight:600;padding:.3rem .6rem;border-radius:999px;border:1px solid var(--border2);background:var(--surface2);color:var(--muted);transition:all .13s}
.pm-ac-chip:hover span{border-color:var(--accent)}
.pm-ac-chip.on span{background:var(--accent);border-color:var(--accent);color:#fff}
.pm-ac-chip.adm.on span{background:#f59e0b;border-color:#f59e0b}
.pm-ac-chip.lock{cursor:not-allowed;opacity:.55}
.pm-ac-chip.lock:hover span{border-color:var(--border2)}
`;
  document.head.appendChild(st);
}