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
  // Limpar timestamps do localStorage
  localStorage.removeItem('premovale-session-hide-at');
  localStorage.removeItem('premovale-session-timeout');
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

  // Salva timestamp no localStorage — funciona mesmo com JS suspenso pelo browser
  localStorage.setItem('premovale-session-hide-at', String(_sessionBgStart));
  localStorage.setItem('premovale-session-timeout', String(_sessionBgTimeout));

  console.log('[Session] timer iniciado —', new Date().toLocaleTimeString('pt-BR'));
  showVisualTimer();

  clearTimeout(_sessionWarnTimer);
  clearTimeout(_sessionBgTimer);

  // Aviso antes do logout (funciona se a aba ficar ativa durante o período)
  _sessionWarnTimer = setTimeout(() => {
    showAfkWarning();
  }, _sessionBgTimeout - _sessionWarnBefore);

  // Logout automático como fallback (pode ser suspenso pelo browser)
  _sessionBgTimer = setTimeout(() => {
    triggerAfkLogout();
  }, _sessionBgTimeout);
}

function onReturnToTab() {
  // Verificar pelo localStorage — garante funcionamento mesmo com JS suspenso pelo browser
  const savedHideAt = parseInt(localStorage.getItem('premovale-session-hide-at') || '0');
  const savedTimeout = parseInt(localStorage.getItem('premovale-session-timeout') || '0');

  const referenceTime = savedHideAt || _sessionBgStart;
  const referenceTimeout = savedTimeout || _sessionBgTimeout;
  const elapsed = referenceTime ? Date.now() - referenceTime : 0;

  console.log('[Session] voltou — ausente por', Math.round(elapsed / 1000) + 's',
    '/ limite:', Math.round(referenceTimeout / 1000) + 's');

  clearTimeout(_sessionBgTimer);
  clearTimeout(_sessionWarnTimer);
  hideVisualTimer();

  // Limpar localStorage independente do resultado
  localStorage.removeItem('premovale-session-hide-at');
  localStorage.removeItem('premovale-session-timeout');

  if (elapsed >= referenceTimeout) {
    // Tempo esgotado — logout obrigatório
    triggerAfkLogout();
  } else if (elapsed >= referenceTimeout - _sessionWarnBefore) {
    // Ainda dentro do prazo mas no período de aviso — mostrar warning
    showAfkWarning();
    _sessionBgStart = null;
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
  ti: {
    tabs: [
      { label: 'Painel', href: 'dashboard.html?modulo=ti', ic: 'painel', pagina: 'painel' },
      { label: 'Chamados', href: 'index.html', ic: 'ticket', pagina: 'chamados', mod: 'chamados' },
      { label: 'Materiais', href: 'materiais.html', ic: 'package', pagina: 'materiais', mod: 'materiais' },
      { label: 'Inventário', href: 'inventario.html', ic: 'inventario', pagina: 'inventario', mod: 'inventario' },
      { label: 'Rotinas', href: 'rotinas.html', ic: 'rotinas', pagina: 'rotinas', mod: 'rotinas' },
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
  briefcase: '<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>',
};
function _navTabIco(n) {
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${_NAV_TAB_ICONS[n] || ''}</svg>`;
}
function _navAcessos(user) {
  return user.isSuperAdmin
    ? ['chamados', 'materiais', 'inventario', 'rotinas', 'comercial']
    : (user.acessos || ['chamados']);
}

function montarSubmodTabs(containerId, moduloAtivo, paginaAtiva, user) {
  const cont = document.getElementById(containerId);
  if (!cont || !NAV_MODULOS[moduloAtivo] || !user) return;
  const acessos = _navAcessos(user);
  const tabs = NAV_MODULOS[moduloAtivo].tabs.filter(t =>
    !t.mod || t.mod === 'chamados' || user.isSuperAdmin || acessos.includes(t.mod));
  cont.innerHTML = tabs.map(t =>
    `<a class="submod-tab${t.pagina === paginaAtiva ? ' ativo' : ''}" href="${t.href}">${_navTabIco(t.ic)}<span>${t.label}</span></a>`
  ).join('');
}

function aplicarSidebarPai(moduloAtivo, user) {
  if (!user) return;
  ['ti', 'comercial', 'geral'].forEach(m => {
    const el = document.getElementById('navpai-' + m);
    if (el) el.classList.toggle('active', m === moduloAtivo);
  });
  const canComercial = user.isSuperAdmin || user.isAdminComercial || user.isComercial ||
    (user.acessos || []).includes('comercial') || (user.acessos || []).includes('adminComercial');
  const comEl = document.getElementById('navpai-comercial');
  if (comEl) comEl.style.display = canComercial ? 'flex' : 'none';
}

// ===== BOOTSTRAP DE NAVEGAÇÃO (passo 2) =====
// Lê data-modulo/data-pagina do <body> e monta sidebar/abas em qualquer página,
// sem precisar editar o init de cada uma. Resolve o usuário pela sessão.
function _navResolveUser() {
  try {
    const id = localStorage.getItem('chamados-current-user-id');
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
    };
    const user = _navResolveUser();
    if (user) run(user);
    else if (typeof loadUsers === 'function') loadUsers().then(() => run(_navResolveUser())).catch(() => { });
  } catch (e) { console.error('[NavPai]', e); }
}

document.addEventListener('DOMContentLoaded', initNavPai);