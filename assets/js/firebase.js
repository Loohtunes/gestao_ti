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
  icon.textContent = online ? '🟢' : '🔴';
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