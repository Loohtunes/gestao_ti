// ===== MATERIALS — Badge e controle da aba de materiais =====

function getMaterialTabBadge() {
  if (!currentUser) return 0;
  const materials = tickets.filter(t => t.ticketType === 'material' && t.status !== 'archived');
  const seenKey   = 'mat-tab-seen:' + (currentUser.username || '');
  const seenCount = parseInt(localStorage.getItem(seenKey) || '0');
  return Math.max(0, materials.length - seenCount);
}

function markMaterialTabSeen() {
  if (!currentUser) return;
  const materials = tickets.filter(t => t.ticketType === 'material' && t.status !== 'archived');
  localStorage.setItem('mat-tab-seen:' + currentUser.username, String(materials.length));
  updateMaterialTabBadge();
}

function updateMaterialTabBadge() {
  const btn = document.getElementById('filter-btn-material');
  if (!btn) return;
  const count    = getMaterialTabBadge();
  const existing = btn.querySelector('.filter-notif-dot');
  if (existing) existing.remove();
  if (count > 0) {
    const dot = document.createElement('span');
    dot.className   = 'filter-notif-dot';
    dot.textContent = count > 99 ? '99+' : count;
    btn.appendChild(dot);
  }
}
