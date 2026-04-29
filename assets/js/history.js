// ===== HISTORY — Histórico de auditoria =====

function logTicketEvent(ticket, action, originalSnapshot) {
  if (!ticket) return;
  if (!ticket.history) ticket.history = [];
  const entry = {
    action,
    user: capitalizeName(currentUser?.username) || 'Sistema',
    role: currentUser?.isSuperAdmin ? 'superadmin' : (currentUser?.role || 'system'),
    ts: new Date().toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    })
  };
  if (originalSnapshot) entry.snapshot = originalSnapshot;
  ticket.history.push(entry);
}

function renderHistory(ticket) {
  const log = ticket.history || [];
  if (!log.length) {
    return '<div class="hist-empty">Nenhuma atualização registrada ainda.</div>';
  }
  const ICON = {
    criado: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;vertical-align:middle"><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="M12 12 3.3 7"/><path d="M12 12l8.7-5"/><path d="M12 7V2"/></svg>`, assumido: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;vertical-align:middle"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>`, concluido: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;vertical-align:middle"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`, devolvido: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;vertical-align:middle"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"/></svg>`,
    reaberto: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;vertical-align:middle"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>`, arquivado: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;vertical-align:middle"><rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg>`, editado: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;vertical-align:middle"><path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/></svg>`, prioridade: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;vertical-align:middle"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>`,
    comentario: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;vertical-align:middle"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>`, comentario_editado: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;vertical-align:middle"><path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/></svg>`, comentario_excluido: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;vertical-align:middle"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`
  };
  return [...log].reverse().map(function (e, i) {
    const icon = Object.entries(ICON).find(function (p) { return e.action.toLowerCase().includes(p[0]); });
    const roleLabel = (e.role === 'superadmin' || e.role === 'attendant') ? 'Atendente' : 'Solicitante';
    let snapshotHtml = '';
    if (e.snapshot) {
      const snapId = 'snap-' + i + '-' + Date.now();
      snapshotHtml =
        '<div class="hist-snapshot-toggle" onclick="toggleHistSnap(\'' + snapId + '\')">' +
        '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;vertical-align:middle"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg> Ver mensagem original</div>' +
        '<div class="hist-snapshot" id="' + snapId + '">' + e.snapshot + '</div>';
    }
    return '<div class="hist-entry">' +
      '<div class="hist-icon">' + (icon ? icon[1] : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;vertical-align:middle"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>`) + '</div>' +
      '<div class="hist-body">' +
      '<div class="hist-action">' + e.action + '</div>' +
      '<div class="hist-meta">' +
      '<span class="hist-user">' + e.user + '</span>' +
      '<span class="hist-role ' + e.role + '">' + roleLabel + '</span>' +
      '<span class="hist-ts">' + e.ts + '</span>' +
      '</div>' +
      snapshotHtml +
      '</div>' +
      '</div>';
  }).join('');
}