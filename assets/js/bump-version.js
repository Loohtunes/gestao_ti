// ── bump-version.js ───────────────────────────────────────────────────────────
// Roda automaticamente após cada `firebase deploy` (postdeploy hook)
// Incrementa a versão em /config/versao no Firestore de produção
// Usa a REST API do Firestore — sem necessidade de instalar dependências

const https = require('https');

const PROJECT_ID = 'chamados-p';
const API_KEY = 'AIzaSyA33N0DWxQsABkhR7WzT6TNNr8OieRwO2E';
const DOC_PATH = `projects/${PROJECT_ID}/databases/(default)/documents/config/versao`;
const BASE_URL = 'firestore.googleapis.com';

function firestoreRequest(method, path, body) {
    return new Promise((resolve, reject) => {
        const url = `/v1/${path}?key=${API_KEY}`;
        const data = body ? JSON.stringify(body) : null;
        const opts = {
            hostname: BASE_URL,
            path: url,
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
            },
        };
        const req = https.request(opts, res => {
            let raw = '';
            res.on('data', chunk => raw += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(raw)); }
                catch { resolve(raw); }
            });
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

async function bumpVersion() {
    console.log('\n🔢 Atualizando versão do sistema...');

    // 1. Ler versão atual
    let versaoAtual = '1.0';
    try {
        const doc = await firestoreRequest('GET', DOC_PATH);
        if (doc.fields?.versao?.stringValue) {
            versaoAtual = doc.fields.versao.stringValue;
        }
    } catch {
        console.log('   Documento não encontrado — criando pela primeira vez.');
    }

    // 2. Incrementar (ex: "1.4" → "1.5", "1.9" → "2.0")
    const parts = versaoAtual.split('.').map(Number);
    parts[1] = (parts[1] || 0) + 1;
    if (parts[1] >= 10) { parts[0]++; parts[1] = 0; }
    const novaVersao = parts.join('.');

    // 3. Salvar nova versão
    const body = {
        fields: {
            versao: { stringValue: novaVersao },
            atualizadoEm: { stringValue: new Date().toISOString() },
        },
    };

    await firestoreRequest(
        'PATCH',
        `${DOC_PATH}?updateMask.fieldPaths=versao&updateMask.fieldPaths=atualizadoEm`,
        body
    );

    console.log(`   ✅ Versão: ${versaoAtual} → ${novaVersao}`);
    console.log('   Todos os usuários verão o modal de atualização no próximo acesso.\n');
}

bumpVersion().catch(err => {
    console.error('   ❌ Erro ao atualizar versão:', err.message || err);
    // Não quebrar o deploy por falha no script
    process.exit(0);
});