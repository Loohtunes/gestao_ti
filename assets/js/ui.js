// ===== UI — Notificações, busca e utilitários de interface =====

function showNotification(message, type) {
  const notif = document.createElement('div');
  notif.style.cssText = `
    position:fixed;top:80px;right:2rem;z-index:9999;
    background:${type === 'success' ? '#00d4aa' : '#ff6b6b'};color:#fff;
    padding:1rem 1.5rem;border-radius:8px;font-size:0.85rem;
    font-family:'Space Mono',monospace;box-shadow:0 8px 24px rgba(0,0,0,0.3);
    animation:slideInRight 0.3s ease;max-width:320px;
  `;
  notif.textContent = message;
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 3500);
}

function toggleSearch() {
  const widget = document.getElementById('search-widget');
  const input  = document.getElementById('ticket-search');
  const btn    = document.getElementById('search-toggle-btn');
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
  const input  = document.getElementById('ticket-search');
  const widget = document.getElementById('search-widget');
  const btn    = document.getElementById('search-toggle-btn');
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

function formatWhatsApp(input) {
  let v = input.value.replace(/\D/g, '').slice(0, 11);
  if (v.length <= 2)       input.value = v.length ? '(' + v : v;
  else if (v.length <= 3)  input.value = '(' + v.slice(0,2) + ') ' + v.slice(2);
  else if (v.length <= 7)  input.value = '(' + v.slice(0,2) + ') ' + v.slice(2,3) + ' ' + v.slice(3);
  else if (v.length <= 11) input.value = '(' + v.slice(0,2) + ') ' + v.slice(2,3) + ' ' + v.slice(3,7) + '-' + v.slice(7);
  else                     input.value = '(' + v.slice(0,2) + ') ' + v.slice(2,3) + ' ' + v.slice(3,7) + '-' + v.slice(7,11);
}

function formatAnyDesk(input) {
  let v = input.value.replace(/\D/g, '').slice(0, 10);
  if (v.length <= 1)      input.value = v;
  else if (v.length <= 4) input.value = v.slice(0,1) + ' ' + v.slice(1);
  else if (v.length <= 7) input.value = v.slice(0,1) + ' ' + v.slice(1,4) + ' ' + v.slice(4);
  else                    input.value = v.slice(0,1) + ' ' + v.slice(1,4) + ' ' + v.slice(4,7) + ' ' + v.slice(7);
}

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
    panel.style.opacity   = '1';
    panel.style.pointerEvents = 'auto';
    loadChangelogEntries();
    markChangelogRead();
    setTimeout(() => {
      document.addEventListener('click', closeChangelogOutside, { once: true });
    }, 10);
  } else {
    panel.style.transform = 'scaleY(0.8) scaleX(0.95)';
    panel.style.opacity   = '0';
    panel.style.pointerEvents = 'none';
    setTimeout(() => { if (!_changelogOpen) panel.style.display = 'none'; }, 200);
  }
}

function closeChangelogOutside(e) {
  const panel = document.getElementById('changelog-panel');
  const btn   = document.getElementById('changelog-btn');
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
  } catch(e) {
    list.innerHTML = '<div style="text-align:center;color:var(--muted);font-size:0.82rem;padding:2rem;">Erro ao carregar.</div>';
  }
}

async function checkChangelogBadge() {
  const badge = document.getElementById('changelog-badge');
  if (!badge) return;
  try {
    const snap = await db.collection('changelog').orderBy('date', 'desc').limit(1).get();
    if (snap.empty) return;
    const latest   = snap.docs[0].data();
    const lastSeen = localStorage.getItem('changelog-last-seen');
    badge.style.display = (latest.date && latest.date !== lastSeen) ? 'flex' : 'none';
  } catch(e) {}
}

function markChangelogRead() {
  const badge = document.getElementById('changelog-badge');
  if (badge) badge.style.display = 'none';
  db.collection('changelog').orderBy('date', 'desc').limit(1).get()
    .then(snap => {
      if (!snap.empty) localStorage.setItem('changelog-last-seen', snap.docs[0].data().date);
    }).catch(() => {});
}

function openChangelogManager() {
  document.getElementById('cl-version-input').value = '';
  document.getElementById('cl-notes-input').value   = '';
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
  const date    = document.getElementById('cl-date-input').value;
  const notes   = document.getElementById('cl-notes-input').value.trim();
  if (!version || !date || !notes) { showNotification('Preencha todos os campos.', 'error'); return; }
  const modal  = document.getElementById('changelog-modal');
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
  } catch(e) {
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
    document.getElementById('cl-date-input').value    = d.date    || '';
    document.getElementById('cl-notes-input').value   = d.notes   || '';
    // Guardar o ID sendo editado no modal
    document.getElementById('changelog-modal').dataset.editId = docId;
    document.getElementById('changelog-modal').classList.add('open');
  } catch(e) {
    showNotification('Erro ao carregar entrada.', 'error');
  }
}

async function deleteChangelogEntry(docId) {
  if (!confirm('Excluir esta entrada de novidades?')) return;
  try {
    await db.collection('changelog').doc(docId).delete();
    showNotification('Entrada excluída!', 'success');
    loadChangelogEntries();
  } catch(e) {
    showNotification('Erro ao excluir entrada.', 'error');
  }
}

// ══════════════════════════════════════════════════════
// TEMA CLARO / ESCURO
// ══════════════════════════════════════════════════════

function applyDarkMode(dark) {
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
// AUTO-LOGOUT POR INATIVIDADE
// ══════════════════════════════════════════════════════

const IS_TEST_ENV = window.location.hostname === 'localhost'
               || window.location.hostname === '127.0.0.1';

// Tempos por papel (role)
const AFK_CONFIG = {
  requester: { timeout: 15 * 60 * 1000, warnBefore:  3 * 60 * 1000 }, // 15min / aviso 3min
  attendant:  { timeout: 40 * 60 * 1000, warnBefore:  5 * 60 * 1000 }, // 40min / aviso 5min
  default:    { timeout: 15 * 60 * 1000, warnBefore:  3 * 60 * 1000 }, // fallback
};

let _afkTimeout   = AFK_CONFIG.default.timeout;
let _afkWarnBefore = AFK_CONFIG.default.warnBefore;
let _afkTimer     = null;
let _afkWarnTimer = null;
let _afkWarning   = false;
let _afkVisualTimer = null;   // intervalo do countdown visual
let _afkStartTime   = null;   // quando o timer foi iniciado

// Eventos que reiniciam o timer
const AFK_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];

function initAfkTimer(role) {
  if (IS_TEST_ENV) { initVisualTimerTest(); return; } // Mostra timer estático em teste
  const isAttendant = role === 'attendant' || role === 'admin';
  const cfg = isAttendant ? AFK_CONFIG.attendant : AFK_CONFIG.requester;
  _afkTimeout    = cfg.timeout;
  _afkWarnBefore = cfg.warnBefore;
  AFK_EVENTS.forEach(ev => document.removeEventListener(ev, resetAfkTimer));
  AFK_EVENTS.forEach(ev => document.addEventListener(ev, resetAfkTimer, { passive: true }));
  resetAfkTimer();
}

function resetAfkTimer() {
  if (IS_TEST_ENV) return;
  // Se o aviso já estava aberto e o usuário interagiu, fecha e renova
  if (_afkWarning) dismissAfkWarning();

  clearTimeout(_afkTimer);
  clearTimeout(_afkWarnTimer);

  // Aviso antes do logout
  _afkWarnTimer = setTimeout(() => {
    showAfkWarning();
  }, _afkTimeout - _afkWarnBefore);

  // Logout automático
  _afkTimer = setTimeout(() => {
    triggerAfkLogout();
  }, _afkTimeout);

  // Timer visual
  _afkStartTime = Date.now();
  startVisualTimer();
}

function stopAfkTimer() {
  clearTimeout(_afkTimer);
  clearTimeout(_afkWarnTimer);
  clearInterval(_afkVisualTimer);
  AFK_EVENTS.forEach(ev => document.removeEventListener(ev, resetAfkTimer));
  dismissAfkWarning();
  _afkWarning = false;
  hideVisualTimer();
}

// ── Timer visual na navbar ──
function startVisualTimer() {
  clearInterval(_afkVisualTimer);
  updateVisualTimer();
  _afkVisualTimer = setInterval(updateVisualTimer, 1000);

  // Mostrar timer na navbar
  const el = document.getElementById('session-timer');
  if (el) el.style.display = 'flex';
}

function hideVisualTimer() {
  clearInterval(_afkVisualTimer);
  const el = document.getElementById('session-timer');
  if (el) el.style.display = 'none';
}

function updateVisualTimer() {
  const countdown = document.getElementById('session-countdown');
  const barFill   = document.getElementById('session-bar-fill');
  if (!countdown || !barFill) return;

  const elapsed  = Date.now() - (_afkStartTime || Date.now());
  const remaining = Math.max(0, _afkTimeout - elapsed);
  const pct = (remaining / _afkTimeout) * 100;

  // Formatar mm:ss
  const totalSecs = Math.ceil(remaining / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = String(totalSecs % 60).padStart(2, '0');
  countdown.textContent = `${mins}:${secs}`;

  // Atualizar barra
  barFill.style.width = `${pct}%`;

  // Estados de cor
  const isWarn   = remaining <= _afkWarnBefore;
  const isDanger = remaining <= 60000; // último minuto

  countdown.className = isDanger ? 'danger' : isWarn ? 'warn' : '';
  barFill.className   = isDanger ? 'danger' : isWarn ? 'warn' : '';
}

function initVisualTimerTest() {
  // Em ambiente teste — mostra o timer zerado/estático
  const el = document.getElementById('session-timer');
  if (el) el.style.display = 'flex';
  const countdown = document.getElementById('session-countdown');
  const barFill   = document.getElementById('session-bar-fill');
  if (countdown) countdown.textContent = '∞';
  if (barFill)   { barFill.style.width = '100%'; barFill.style.background = 'var(--border2)'; }
}

function showAfkWarning() {
  if (_afkWarning) return;
  _afkWarning = true;

  // Criar modal de aviso
  const overlay = document.createElement('div');
  overlay.id = 'afk-warning-overlay';
  overlay.innerHTML = `
    <div class="afk-warning-box">
      <div class="afk-warning-icon">⏰</div>
      <div class="afk-warning-title">Sessão expirando</div>
      <div class="afk-warning-text">
        Sua sessão encerrará em <strong id="afk-warn-mins"></strong> por inatividade.<br>
        Clique em continuar para permanecer conectado.
      </div>
      <div class="afk-warning-countdown" id="afk-countdown"></div>
      <button class="afk-warning-btn" onclick="dismissAfkWarning()">
        ✅ Continuar conectado
      </button>
    </div>`;
  document.body.appendChild(overlay);

  // Preencher texto dinâmico com minutos corretos
  const warnMins = Math.round(_afkWarnBefore / 60000);
  const warnMinsEl = document.getElementById('afk-warn-mins');
  if (warnMinsEl) warnMinsEl.textContent = `${warnMins} minuto${warnMins > 1 ? 's' : ''}`;

  // Countdown visual
  let secsLeft = _afkWarnBefore / 1000;
  const countEl = document.getElementById('afk-countdown');
  if (countEl) {
    const m0 = Math.floor(secsLeft / 60);
    const s0 = String(Math.floor(secsLeft % 60)).padStart(2, '0');
    countEl.textContent = `${m0}:${s0}`;
  }
  const interval = setInterval(() => {
    secsLeft--;
    if (secsLeft <= 0 || !document.getElementById('afk-countdown')) {
      clearInterval(interval);
      return;
    }
    const m = Math.floor(secsLeft / 60);
    const s = String(secsLeft % 60).padStart(2, '0');
    countEl.textContent = `${m}:${s}`;
    // Fica vermelho nos últimos 60s
    if (secsLeft <= 60) countEl.style.color = '#ef4444';
  }, 1000);
  overlay.dataset.interval = interval;
}

function dismissAfkWarning() {
  _afkWarning = false;
  const overlay = document.getElementById('afk-warning-overlay');
  if (!overlay) return;
  clearInterval(parseInt(overlay.dataset.interval));
  overlay.remove();
  resetAfkTimer(); // Renova o timer completo
}

function triggerAfkLogout() {
  stopAfkTimer();
  // Salvar estado atual antes de deslogar
  saveSessionState();
  // Deslogar silenciosamente (sem confirm)
  performAutoLogout();
}

function saveSessionState() {
  try {
    const state = {
      filter: typeof currentFilter !== 'undefined' ? currentFilter : 'all',
      viewMode: localStorage.getItem('chamados-view-mode') || 'cards',
    };
    localStorage.setItem('premovale-last-session', JSON.stringify(state));
  } catch(e) {}
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
  } catch(e) {}
}
