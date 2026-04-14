// ===== SYNC — Status Firebase (substitui Dropbox) =====

function openSyncModal() {
  document.getElementById('sync-modal').classList.add('open');
}

function closeSyncModal() {
  document.getElementById('sync-modal').classList.remove('open');
}

// Funções mantidas como stub para não quebrar referências no HTML
function saveToken() {}
function testConnection() {}
function syncToCloud() {}
function syncFromCloud() {}
function disconnectDropbox() {}
function updateSyncStatus() {}
function updateLastSyncTime() {}
function updateSyncIcon() {}
function startAutoSync() {}
function stopAutoSync() {}
function autoSaveToCloud() {}
