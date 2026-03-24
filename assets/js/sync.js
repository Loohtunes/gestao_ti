// ===== SYNC — Sincronização com Dropbox =====

function openSyncModal() {
  document.getElementById('dropbox-token-input').value = dropboxToken;
  document.getElementById('sync-modal').classList.add('open');
  updateSyncStatus();
  updateLastSyncTime();
}

function closeSyncModal() {
  document.getElementById('sync-modal').classList.remove('open');
}

function saveToken() {
  const token = document.getElementById('dropbox-token-input').value.trim();
  if (!token) { showNotification('Por favor, insira um token válido', 'error'); return; }
  dropboxToken = token;
  localStorage.setItem('chamados-dropbox-token', token);
  updateSyncStatus();
  showNotification('Token salvo com sucesso!', 'success');
}

async function testConnection() {
  if (!dropboxToken) { showNotification('Configure o token primeiro', 'error'); return; }
  try {
    updateSyncIcon('syncing');
    const res = await fetch('https://api.dropboxapi.com/2/users/get_current_account', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${dropboxToken}` }
    });
    if (res.ok) {
      const data = await res.json();
      showNotification(`✅ Conectado como: ${data.name.display_name}`, 'success');
      updateSyncStatus(true);
    } else { throw new Error('Token inválido ou expirado'); }
  } catch (e) {
    showNotification('❌ Erro: ' + e.message, 'error');
    updateSyncStatus(false);
  } finally {
    setTimeout(() => updateSyncIcon('default'), 2000);
  }
}

async function syncToCloud() {
  if (!dropboxToken) { showNotification('Configure o token primeiro', 'error'); return; }
  try {
    updateSyncIcon('syncing');
    const payload = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: {
        tickets:         localStorage.getItem('chamados-tickets'),
        users:           localStorage.getItem('chamados-users'),
        ticketCounter:   localStorage.getItem('chamados-ticket-counter'),
        materialCounter: localStorage.getItem('chamados-material-counter')
      }
    };
    const res = await fetch('https://content.dropboxapi.com/2/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${dropboxToken}`,
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': JSON.stringify({
          path: DROPBOX_FILE_PATH, mode: 'overwrite', autorename: false, mute: false
        })
      },
      body: JSON.stringify(payload, null, 2)
    });
    if (res.ok) {
      localStorage.setItem('chamados-last-sync', new Date().toLocaleString('pt-BR'));
      updateLastSyncTime();
      showNotification('✅ Dados enviados com sucesso!', 'success');
    } else { throw new Error('Falha no upload: ' + res.status); }
  } catch (e) {
    showNotification('❌ Erro ao enviar: ' + e.message, 'error');
  } finally {
    setTimeout(() => updateSyncIcon('default'), 2000);
  }
}

async function syncFromCloud() {
  if (!dropboxToken) { showNotification('Configure o token primeiro', 'error'); return; }
  if (!confirm('Isso substituirá todos os dados locais pelos dados da nuvem. Continuar?')) return;
  try {
    updateSyncIcon('syncing');
    const res = await fetch('https://content.dropboxapi.com/2/files/download', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${dropboxToken}`,
        'Dropbox-API-Arg': JSON.stringify({ path: DROPBOX_FILE_PATH })
      }
    });
    if (res.ok) {
      const data = JSON.parse(await res.text());
      if (data.data) {
        if (data.data.tickets)         localStorage.setItem('chamados-tickets',          data.data.tickets);
        if (data.data.users)           localStorage.setItem('chamados-users',            data.data.users);
        if (data.data.ticketCounter)   localStorage.setItem('chamados-ticket-counter',   data.data.ticketCounter);
        if (data.data.materialCounter) localStorage.setItem('chamados-material-counter', data.data.materialCounter);
      }
      localStorage.setItem('chamados-last-sync', new Date().toLocaleString('pt-BR'));
      updateLastSyncTime();
      showNotification('Dados restaurados! Recarregando...', 'success');
      setTimeout(() => location.reload(), 1500);
    } else { throw new Error('Arquivo não encontrado ou erro de permissão'); }
  } catch (e) {
    showNotification('Erro ao baixar: ' + e.message, 'error');
  } finally {
    setTimeout(() => updateSyncIcon('default'), 2000);
  }
}

async function autoSyncFromCloud() {
  if (!dropboxToken) return;
  try {
    const res = await fetch('https://content.dropboxapi.com/2/files/download', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${dropboxToken}`,
        'Dropbox-API-Arg': JSON.stringify({ path: DROPBOX_FILE_PATH })
      }
    });
    if (res.ok) {
      const data = JSON.parse(await res.text());
      if (data.data) {
        if (data.data.tickets) {
          tickets = JSON.parse(data.data.tickets);
          localStorage.setItem('chamados-tickets', data.data.tickets);
        }
        if (data.data.users) {
          users = JSON.parse(data.data.users);
          localStorage.setItem('chamados-users', data.data.users);
        }
        if (data.data.ticketCounter) localStorage.setItem('chamados-ticket-counter', data.data.ticketCounter);
      }
      renderTickets();
      updateStats();
      if (activeDetailId) {
        const t = tickets.find(t => t.id === activeDetailId);
        if (t) renderDetailMessages(t);
      }
    }
  } catch (e) { /* silent */ }
}

function autoSaveToCloud() {
  if (dropboxToken && currentUser) setTimeout(() => syncToCloud(), 2000);
}

function startAutoSync() {
  autoSyncInterval = setInterval(() => {
    if (dropboxToken && currentUser) autoSyncFromCloud();
  }, 30000);
  if (dropboxToken) autoSyncFromCloud();
}

function stopAutoSync() {
  if (autoSyncInterval) { clearInterval(autoSyncInterval); autoSyncInterval = null; }
}

function disconnectDropbox() {
  if (!confirm('Deseja desconectar do Dropbox?')) return;
  dropboxToken = '';
  localStorage.removeItem('chamados-dropbox-token');
  document.getElementById('dropbox-token-input').value = '';
  document.getElementById('sync-upload-btn').disabled   = true;
  document.getElementById('sync-download-btn').disabled = true;
  updateSyncStatus(false);
  showNotification('Desconectado do Dropbox', 'success');
}

function updateSyncStatus(connected = null) {
  if (connected === null) connected = !!dropboxToken;
  const el = document.getElementById('sync-status');
  el.className = 'sync-status ' + (connected ? 'connected' : 'disconnected');
  el.innerHTML = connected
    ? `<div class="sync-status-icon">✅</div>
       <div class="sync-status-text">
         <div style="font-weight:600;color:var(--accent2);">Status: Conectado</div>
         <div style="font-size:0.75rem;color:var(--muted);">Pronto para sincronizar</div>
       </div>`
    : `<div class="sync-status-icon">⚪</div>
       <div class="sync-status-text">
         <div style="font-weight:600;">Status: Não Configurado</div>
         <div style="font-size:0.75rem;color:var(--muted);">Configure o token para habilitar</div>
       </div>`;
  document.getElementById('sync-upload-btn').disabled   = !connected;
  document.getElementById('sync-download-btn').disabled = !connected;
}

function updateLastSyncTime() {
  const t = localStorage.getItem('chamados-last-sync');
  document.getElementById('sync-last-sync').textContent = t
    ? `Última sincronização: ${t}` : 'Nunca sincronizado';
}

function updateSyncIcon(state) {
  const el = document.getElementById('sync-icon-nav');
  if (!el) return;
  el.textContent = state === 'syncing' ? '🔄' : '☁️';
}
