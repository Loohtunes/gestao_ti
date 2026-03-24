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
