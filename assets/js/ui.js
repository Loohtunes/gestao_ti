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

function formatWhatsApp(input) {
  let v = input.value.replace(/\D/g, '').slice(0, 11);
  if (v.length <= 2) input.value = v.length ? '(' + v : v;
  else if (v.length <= 3) input.value = '(' + v.slice(0, 2) + ') ' + v.slice(2);
  else if (v.length <= 7) input.value = '(' + v.slice(0, 2) + ') ' + v.slice(2, 3) + ' ' + v.slice(3);
  else if (v.length <= 11) input.value = '(' + v.slice(0, 2) + ') ' + v.slice(2, 3) + ' ' + v.slice(3, 7) + '-' + v.slice(7);
  else input.value = '(' + v.slice(0, 2) + ') ' + v.slice(2, 3) + ' ' + v.slice(3, 7) + '-' + v.slice(7, 11);
}

function formatAnyDesk(input) {
  let v = input.value.replace(/\D/g, '').slice(0, 10);
  if (v.length <= 1) input.value = v;
  else if (v.length <= 4) input.value = v.slice(0, 1) + ' ' + v.slice(1);
  else if (v.length <= 7) input.value = v.slice(0, 1) + ' ' + v.slice(1, 4) + ' ' + v.slice(4);
  else input.value = v.slice(0, 1) + ' ' + v.slice(1, 4) + ' ' + v.slice(4, 7) + ' ' + v.slice(7);
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

function newChangelogEntry() {
  // Limpar campos e abrir modal para nova entrada
  const modal = document.getElementById('changelog-modal');
  if (modal) delete modal.dataset.editId;
  const versionInput = document.getElementById('cl-version-input');
  const dateInput = document.getElementById('cl-date-input');
  const notesInput = document.getElementById('cl-notes-input');
  if (versionInput) versionInput.value = '';
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
  if (notesInput) notesInput.value = '';
  document.getElementById('changelog-modal').classList.add('open');
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
  if (!confirm('Excluir esta entrada de novidades?')) return;
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
const SESSION_CONFIG = {
  requester: { bgTimeout: 15 * 60 * 1000, warnBefore: 3 * 60 * 1000 }, // 15min / aviso 3min
  attendant: { bgTimeout: 30 * 60 * 1000, warnBefore: 5 * 60 * 1000 }, // 30min / aviso 5min
  default: { bgTimeout: 15 * 60 * 1000, warnBefore: 3 * 60 * 1000 }, // fallback
};

let _sessionBgTimeout = SESSION_CONFIG.default.bgTimeout;
let _sessionWarnBefore = SESSION_CONFIG.default.warnBefore;
let _sessionBgStart = null;   // quando foi para segundo plano
let _sessionBgTimer = null;   // timer do logout em segundo plano
let _sessionWarnTimer = null;   // timer do aviso
let _sessionWarning = false;
let _sessionVisualTimer = null;   // intervalo do countdown visual
let _sessionLastHide = 0;  // timestamp da última saída (deduplicação)
let _sessionLastFocus = 0;  // timestamp do último retorno
let _sessionFocusCheck = null; // timeout para verificar perda de foco real

function initSessionTimer(role) {
  const isAttendant = role === 'attendant' || role === 'admin' || role === 'superadmin';
  const cfg = isAttendant ? SESSION_CONFIG.attendant : SESSION_CONFIG.requester;
  _sessionBgTimeout = cfg.bgTimeout;
  _sessionWarnBefore = cfg.warnBefore;

  // Detectar troca de aba
  document.addEventListener('visibilitychange', onVisibilityChange);

  // Detectar saída da janela (inclui contenteditable, modais, etc)
  document.addEventListener('blur', onDocumentBlur, true); // capture
  document.addEventListener('focus', onDocumentFocus, true); // capture
  window.addEventListener('blur', onWindowBlur);
  window.addEventListener('focus', onWindowFocus);


}

function stopSessionTimer() {
  clearTimeout(_sessionBgTimer);
  clearTimeout(_sessionWarnTimer);
  clearInterval(_sessionVisualTimer);
  document.removeEventListener('visibilitychange', onVisibilityChange);
  document.removeEventListener('blur', onDocumentBlur, true);
  document.removeEventListener('focus', onDocumentFocus, true);
  window.removeEventListener('blur', onWindowBlur);
  window.removeEventListener('focus', onWindowFocus);

  clearTimeout(_sessionFocusCheck);
  dismissSessionWarning();
  hideVisualTimer();
  _sessionBgStart = null;
  _sessionWarning = false;
  _sessionLastHide = 0;
  _sessionLastFocus = 0;
}

function onVisibilityChange() {
  if (document.hidden) {
    const now = Date.now();
    if (now - _sessionLastHide < 500) return; // deduplicar com blur
    _sessionLastHide = now;
    console.log('[Session] visibilitychange → hidden');
    startBackgroundTimer();
  } else {
    const now = Date.now();
    if (now - _sessionLastFocus < 500) return; // deduplicar com focus
    _sessionLastFocus = now;
    console.log('[Session] visibilitychange → visible');
    onReturnToTab();
  }
}

function onWindowBlur() {
  const now = Date.now();
  if (now - _sessionLastHide < 500) return; // deduplicar com visibilitychange
  _sessionLastHide = now;
  console.log('[Session] blur → segundo plano');
  startBackgroundTimer();
}

function onWindowFocus() {
  const now = Date.now();
  if (now - _sessionLastFocus < 500) return; // deduplicar com visibilitychange
  _sessionLastFocus = now;
  // Só age se havia um timer rodando
  if (!_sessionBgStart) return;
  console.log('[Session] focus → voltou');
  onReturnToTab();
}

function onDocumentBlur() {
  // Verificar com delay se o foco realmente saiu da janela
  // (evita falsos positivos de blur entre elementos internos)
  clearTimeout(_sessionFocusCheck);
  _sessionFocusCheck = setTimeout(() => {
    if (!document.hasFocus()) {
      const now = Date.now();
      if (now - _sessionLastHide < 500) return;
      _sessionLastHide = now;
      console.log('[Session] document blur → janela perdeu foco');
      startBackgroundTimer();
    }
  }, 200);
}

function onDocumentFocus() {
  clearTimeout(_sessionFocusCheck);
  if (!_sessionBgStart) return;
  const now = Date.now();
  if (now - _sessionLastFocus < 500) return;
  _sessionLastFocus = now;
  console.log('[Session] document focus → janela ganhou foco');
  onReturnToTab();
}

function startBackgroundTimer() {
  // Não iniciar se já está rodando
  if (_sessionBgStart) return;
  _sessionBgStart = Date.now();
  console.log('[Session] timer iniciado —', new Date().toLocaleTimeString('pt-BR'));
  showVisualTimer();

  clearTimeout(_sessionWarnTimer);
  clearTimeout(_sessionBgTimer);

  // Aviso antes do logout
  _sessionWarnTimer = setTimeout(() => {
    showAfkWarning();
  }, _sessionBgTimeout - _sessionWarnBefore);

  // Logout automático
  _sessionBgTimer = setTimeout(() => {
    triggerAfkLogout();
  }, _sessionBgTimeout);
}

function onReturnToTab() {
  const elapsed = _sessionBgStart ? Date.now() - _sessionBgStart : 0;
  console.log('[Session] voltou — ausente por', Math.round(elapsed / 1000) + 's');

  clearTimeout(_sessionBgTimer);
  clearTimeout(_sessionWarnTimer);
  hideVisualTimer();

  if (elapsed >= _sessionBgTimeout) {
    triggerAfkLogout();
  } else {
    dismissSessionWarning();
    _sessionBgStart = null;
  }
}

// ── Timer visual na navbar ──
function showVisualTimer() {
  const el = document.getElementById('session-timer');
  if (el) el.style.display = 'flex';
  _sessionBgStart = _sessionBgStart || Date.now();
  clearInterval(_sessionVisualTimer);
  updateVisualTimer();
  _sessionVisualTimer = setInterval(updateVisualTimer, 1000);
}

function hideVisualTimer() {
  clearInterval(_sessionVisualTimer);
  const el = document.getElementById('session-timer');
  if (el) el.style.display = 'none';
}

function updateVisualTimer() {
  const countdown = document.getElementById('session-countdown');
  const barFill = document.getElementById('session-bar-fill');
  if (!countdown || !barFill || !_sessionBgStart) return;

  const elapsed = Date.now() - _sessionBgStart;
  const remaining = Math.max(0, _sessionBgTimeout - elapsed);
  const pct = (remaining / _sessionBgTimeout) * 100;

  const totalSecs = Math.ceil(remaining / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = String(totalSecs % 60).padStart(2, '0');
  countdown.textContent = `${mins}:${secs}`;
  barFill.style.width = `${pct}%`;

  const isWarn = remaining <= _sessionWarnBefore;
  const isDanger = remaining <= 60000;
  countdown.className = isDanger ? 'danger' : isWarn ? 'warn' : '';
  barFill.className = isDanger ? 'danger' : isWarn ? 'warn' : '';
}



function showAfkWarning() {
  if (_sessionWarning) return;
  _sessionWarning = true;

  const overlay = document.createElement('div');
  overlay.id = 'afk-warning-overlay';
  overlay.innerHTML = `
    <div class="afk-warning-box">
      <div class="afk-warning-icon">⏰</div>
      <div class="afk-warning-title">Sessão expirando</div>
      <div class="afk-warning-text">
        Você está ausente há algum tempo.<br>
        Sua sessão encerrará em <strong id="afk-warn-mins"></strong>.
      </div>
      <div class="afk-warning-countdown" id="afk-countdown"></div>
      <button class="afk-warning-btn" onclick="dismissSessionWarning()">
        <span style="display:inline-flex;align-items:center;gap:6px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg> Continuar conectado</span>
      </button>
    </div>`;
  document.body.appendChild(overlay);

  const warnMins = Math.round(_sessionWarnBefore / 60000);
  const warnMinsEl = document.getElementById('afk-warn-mins');
  if (warnMinsEl) warnMinsEl.textContent = `${warnMins} minuto${warnMins > 1 ? 's' : ''}`;

  let secsLeft = _sessionWarnBefore / 1000;
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
    if (countEl) countEl.textContent = `${m}:${s}`;
    if (secsLeft <= 60 && countEl) countEl.style.color = '#ef4444';
  }, 1000);
  overlay.dataset.interval = interval;
}

function dismissSessionWarning() {
  _sessionWarning = false;
  const overlay = document.getElementById('afk-warning-overlay');
  if (!overlay) return;
  clearInterval(parseInt(overlay.dataset.interval));
  overlay.remove();
}

function triggerAfkLogout() {
  stopSessionTimer();
  saveSessionState();
  performAutoLogout();
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