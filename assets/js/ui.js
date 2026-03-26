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
  const arrow = document.querySelector('#actions-dropdown-btn span');
  if (!menu) return;
  const isOpen = menu.dataset.open === 'true';
  if (isOpen) {
    _closeDropdownAnimate(menu, arrow);
  } else {
    _openDropdownAnimate(menu, arrow);
    setTimeout(() => {
      document.addEventListener('click', closeActionsDropdownOutside, { once: true });
    }, 10);
  }
}

function _openDropdownAnimate(menu, arrow) {
  menu.style.display = 'block';
  menu.dataset.open  = 'true';
  menu.style.pointerEvents = 'auto';
  // Força reflow para a transição funcionar
  menu.getBoundingClientRect();
  menu.style.transform = 'scaleY(1) scaleX(1)';
  menu.style.opacity   = '1';
  if (arrow) arrow.textContent = '▲';
}

function _closeDropdownAnimate(menu, arrow) {
  menu.style.transform = 'scaleY(0.7) scaleX(0.95)';
  menu.style.opacity   = '0';
  menu.style.pointerEvents = 'none';
  menu.dataset.open = 'false';
  if (arrow) arrow.textContent = '▼';
  setTimeout(() => {
    if (menu.dataset.open !== 'true') menu.style.display = 'none';
  }, 200);
}

function closeActionsDropdown() {
  const menu  = document.getElementById('actions-dropdown-menu');
  const arrow = document.querySelector('#actions-dropdown-btn span');
  if (menu && menu.dataset.open === 'true') _closeDropdownAnimate(menu, arrow);
}

function closeActionsDropdownOutside(e) {
  const wrapper = document.getElementById('actions-dropdown-wrapper');
  if (wrapper && !wrapper.contains(e.target)) closeActionsDropdown();
}

// ════════════════════════════════════════════
// AUTO FORMATAR
// ════════════════════════════════════════════

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

// ════════════════════════════════════════════
// ALTERNAR VISUALIZAÇÃO CARDS / LISTA
// ════════════════════════════════════════════

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

// ════════════════════════════════════════════
// NOTAS DE ATUALIZAÇÃO (CHANGELOG)
// ════════════════════════════════════════════

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
    list.innerHTML = snap.docs.map(doc => {
      const d = doc.data();
      const notes = (d.notes || '').split('\n').filter(Boolean);
      return `<div style="margin-bottom:1rem;padding-bottom:1rem;border-bottom:1px solid var(--border);">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.5rem;">
          <span style="font-size:0.82rem;font-weight:800;color:var(--accent);">${d.version || ''}</span>
          <span style="font-size:0.7rem;font-family:var(--font-mono);color:var(--muted);">${d.date || ''}</span>
        </div>
        <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:0.3rem;">
          ${notes.map(n => `<li style="font-size:0.8rem;color:var(--text);line-height:1.5;">${n}</li>`).join('')}
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
    const latest    = snap.docs[0].data();
    const lastSeen  = localStorage.getItem('changelog-last-seen');
    if (latest.date && latest.date !== lastSeen) {
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
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
  document.getElementById('changelog-modal').classList.remove('open');
}

async function saveChangelog() {
  const version = document.getElementById('cl-version-input').value.trim();
  const date    = document.getElementById('cl-date-input').value;
  const notes   = document.getElementById('cl-notes-input').value.trim();
  if (!version || !date || !notes) { showNotification('Preencha todos os campos.', 'error'); return; }
  try {
    await db.collection('changelog').add({ version, date, notes, createdAt: new Date().toISOString() });
    closeChangelogManager();
    showNotification('Notas publicadas com sucesso! 📋', 'success');
    if (_changelogOpen) loadChangelogEntries();
  } catch(e) {
    showNotification('Erro ao publicar notas.', 'error');
  }
}
