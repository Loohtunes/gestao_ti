// ===== FIREBASE — Inicialização e conexão =====

// Ambiente de teste: localhost OU qualquer host do GitHub
// (Pages *.github.io, Codespaces *.github.dev, github.com, raw.githubusercontent.com)
const _fbHost = window.location.hostname;
const _isTestEnv = _fbHost === 'localhost'
  || _fbHost === '127.0.0.1'
  || _fbHost.includes('github');

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

console.log(`[Firebase] Ambiente: ${_isTestEnv ? '🧪 Desenvolvimento (chamados-dev)' : '🚀 Produção (chamados-p)'} · host: ${_fbHost || '(file)'}`);

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const auth = firebase.auth();

// Persistência offline com sincronização entre abas
db.enablePersistence({ synchronizeTabs: true }).catch(() => { });

/* ── Monitor de conexão do Firebase ─────────────────────────────────────────
 * O indicador antigo procurava um elemento #sync-icon-nav que não existe em
 * nenhum HTML, então saía cedo e NUNCA sinalizava. Reescrito:
 *   - O botão é montado/compactado por JS (ícone + pontinho), sem tocar nos HTMLs.
 *   - O sinal vem dos metadados do Firestore (snap.metadata.fromCache), que é
 *     confiável e não depende de uma coleção `_ping` com regra própria.
 * ------------------------------------------------------------------------- */
let _fbOnline = null;

function updateFirebaseStatus(online) {
  _fbOnline = online;
  const btn = document.getElementById('sync-fab-nav');
  if (!btn) return;
  const dot = btn.querySelector('.fb-dot') || _montarFabFirebase(btn);
  if (!dot) return;
  dot.style.background = online ? '#22c55e' : '#ef4444';
  dot.style.boxShadow = `0 0 0 3px ${online ? 'rgba(34,197,94,.18)' : 'rgba(239,68,68,.18)'}`;
  btn.title = online
    ? 'Firebase: conectado'
    : 'Firebase: sem conexão — trabalhando offline';
}

// Compacta o botão: mantém o ícone, remove o texto "Firebase", adiciona o pontinho.
function _montarFabFirebase(btn) {
  if (!btn) return null;
  // remove os nós de texto soltos (o rótulo "Firebase")
  [...btn.childNodes].forEach(n => {
    if (n.nodeType === Node.TEXT_NODE && n.textContent.trim()) n.remove();
  });
  btn.classList.add('fb-fab-compacto');
  const dot = document.createElement('span');
  dot.className = 'fb-dot';
  dot.style.cssText = 'width:7px;height:7px;border-radius:50%;background:#9ca3af;flex-shrink:0;transition:background .25s,box-shadow .25s;';
  btn.appendChild(dot);

  if (!document.getElementById('fb-fab-style')) {
    const st = document.createElement('style');
    st.id = 'fb-fab-style';
    st.textContent = '.fb-fab-compacto{gap:7px;padding-left:.55rem;padding-right:.55rem;cursor:default;}';
    document.head.appendChild(st);
  }
  return dot;
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('sync-fab-nav');
  if (btn) _montarFabFirebase(btn);
  if (_fbOnline !== null) updateFirebaseStatus(_fbOnline);
});

// Sinal de conexão: metadados do Firestore (fromCache = servindo do cache = offline)
db.collection('users').limit(1).onSnapshot(
  { includeMetadataChanges: true },
  snap => updateFirebaseStatus(!snap.metadata.fromCache),
  err => { console.warn('[Firebase] listener de status:', err.code || err); updateFirebaseStatus(false); }
);

// Reforço imediato pelos eventos do navegador
window.addEventListener('online', () => updateFirebaseStatus(true));
window.addEventListener('offline', () => updateFirebaseStatus(false));

// Hash de senha com SHA-256
async function hashPassword(password) {
  const buf = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}