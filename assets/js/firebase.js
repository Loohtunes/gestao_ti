// ===== FIREBASE — Inicialização e conexão =====

const firebaseConfig = {
  apiKey: "AIzaSyA33N0DWxQsABkhR7WzT6TNNr8OieRwO2E",
  authDomain: "chamados-p.firebaseapp.com",
  projectId: "chamados-p",
  storageBucket: "chamados-p.firebasestorage.app",
  messagingSenderId: "329118055612",
  appId: "1:329118055612:web:c1ec9670160e6b9d9ea4b9"
};

firebase.initializeApp(firebaseConfig);

const db   = firebase.firestore();
const auth = firebase.auth();

// Persistência offline com sincronização entre abas
db.enablePersistence({ synchronizeTabs: true }).catch(() => {});

// Monitor de conexão
db.collection('_ping').doc('status')
  .onSnapshot(() => updateFirebaseStatus(true), () => updateFirebaseStatus(false));

function updateFirebaseStatus(online) {
  const btn  = document.getElementById('sync-fab-nav');
  const icon = document.getElementById('sync-icon-nav');
  if (!btn || !icon) return;
  icon.textContent = online ? '🟢' : '🔴';
  btn.title = online
    ? 'Firebase: Conectado — dados em tempo real'
    : 'Firebase: Sem conexão — trabalhando offline';
}

// Hash de senha com SHA-256
async function hashPassword(password) {
  const buf  = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
