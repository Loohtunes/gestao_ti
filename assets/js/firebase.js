// ===== FIREBASE — Inicialização e conexão =====

const _isTestEnv = window.location.hostname === 'localhost'
  || window.location.hostname === '127.0.0.1';

// Produção — chamados-p
const _configProd = {
  apiKey: "AIzaSyA33N0DWxQsABkhR7WzT6TNNr8OieRwO2E",
  authDomain: "chamados-p.firebaseapp.com",
  projectId: "chamados-p",
  storageBucket: "chamados-p.firebasestorage.app",
  messagingSenderId: "329118055612",
  appId: "1:329118055612:web:c1ec9670160e6b9d9ea4b9"
};

// Desenvolvimento — chamados-dev-1650a
const _configDev = {
  apiKey: "AIzaSyCECHRG7t-v3EnQCFpX2SlvDxaHiFDCrPo",
  authDomain: "chamados-dev-1650a.firebaseapp.com",
  projectId: "chamados-dev-1650a",
  storageBucket: "chamados-dev-1650a.firebasestorage.app",
  messagingSenderId: "650347835887",
  appId: "1:650347835887:web:cb36264cdcaf48cea6461a"
};

const firebaseConfig = _isTestEnv ? _configDev : _configProd;

console.log(`[Firebase] Ambiente: ${_isTestEnv ? '🧪 Desenvolvimento (chamados-dev)' : '🚀 Produção (chamados-p)'}`);

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const auth = firebase.auth();

// Persistência offline com sincronização entre abas
db.enablePersistence({ synchronizeTabs: true }).catch(() => { });

// Monitor de conexão
db.collection('_ping').doc('status')
  .onSnapshot(() => updateFirebaseStatus(true), () => updateFirebaseStatus(false));

function updateFirebaseStatus(online) {
  const btn = document.getElementById('sync-fab-nav');
  const icon = document.getElementById('sync-icon-nav');
  if (!btn || !icon) return;
  icon.innerHTML = online ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" x2="12.01" y1="20" y2="20"/></svg>` : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h.01"/><path d="M8.5 16.429a5 5 0 0 1 7.072 0"/><path d="M5 12.859a10 10 0 0 1 5.17-2.69"/><path d="M19.05 12.859a10 10 0 0 0-2.007-1.523"/><path d="M10.71 5.05A16 16 0 0 1 22.56 9"/><path d="M1.42 9a15.91 15.91 0 0 1 5.7-4.5"/><path d="m2 2 20 20"/></svg>`;
  btn.title = online
    ? 'Firebase: Conectado — dados em tempo real'
    : 'Firebase: Sem conexão — trabalhando offline';
}

// Hash de senha com SHA-256
async function hashPassword(password) {
  const buf = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}