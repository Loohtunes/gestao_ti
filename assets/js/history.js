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
    criado: '🆕', assumido: '🎯', concluido: '✅', devolvido: '↩️',
    reaberto: '🔄', arquivado: '📦', editado: '✏️', prioridade: '🔺',
    comentario: '💬', comentario_editado: '✏️💬', comentario_excluido: '🗑️💬'
  };
  return [...log].reverse().map(function (e, i) {
    const icon = Object.entries(ICON).find(function (p) { return e.action.toLowerCase().includes(p[0]); });
    const roleLabel = (e.role === 'superadmin' || e.role === 'attendant') ? 'Atendente' : 'Solicitante';
    let snapshotHtml = '';
    if (e.snapshot) {
      const snapId = 'snap-' + i + '-' + Date.now();
      snapshotHtml =
        '<div class="hist-snapshot-toggle" onclick="toggleHistSnap(\'' + snapId + '\')">' +
        '👁 Ver mensagem original</div>' +
        '<div class="hist-snapshot" id="' + snapId + '">' + e.snapshot + '</div>';
    }
    return '<div class="hist-entry">' +
      '<div class="hist-icon">' + (icon ? icon[1] : '📌') + '</div>' +
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
