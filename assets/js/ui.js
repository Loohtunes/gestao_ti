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
