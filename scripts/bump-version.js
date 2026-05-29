// ── bump-version.js ───────────────────────────────────────────────────────────
// Roda automaticamente após cada `firebase deploy` (postdeploy hook)
// Incrementa a versão em /config/versao no Firestore de produção

const https = require('https');

const PROJECT_ID = 'chamados-p';
const API_KEY = 'AIzaSyA33N0DWxQsABkhR7WzT6TNNr8OieRwO2E';
const DOC_PATH = `projects/${PROJECT_ID}/databases/(default)/documents/config/versao`;

function request(method, path, body) {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : null;
        const opts = {
            hostname: 'firestore.googleapis.com',
            path: `/v1/${path}?key=${API_KEY}`,
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
            },
        };
        const req = https.request(opts, res => {
            let raw = '';
            res.on('data', c => raw += c);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
                catch { resolve({ status: res.statusCode, body: raw }); }
            });
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

async function bumpVersion() {
    console.log('\n🔢 [Premovale] Atualizando versão do sistema...');

    // 1. Ler versão atual
    let versaoAtual = '1.0';
    const get = await request('GET', DOC_PATH);
    console.log(`   GET status: ${get.status}`);

    if (get.status === 200 && get.body?.fields?.versao?.stringValue) {
        versaoAtual = get.body.fields.versao.stringValue;
        console.log(`   Versão atual no Firestore: ${versaoAtual}`);
    } else {
        console.log('   Documento não encontrado — criando com versão 1.0');
    }

    // 2. Incrementar
    const [major, minor] = versaoAtual.split('.').map(Number);
    const novoMinor = (minor || 0) + 1;
    const novoMajor = novoMinor >= 100 ? major + 1 : major;
    const novaVersao = `${novoMajor}.${novoMinor >= 100 ? 0 : novoMinor}`;

    // 3. Salvar
    const body = {
        fields: {
            versao: { stringValue: novaVersao },
            atualizadoEm: { stringValue: new Date().toISOString() },
        },
    };

    const patch = await request(
        'PATCH',
        `${DOC_PATH}?updateMask.fieldPaths=versao&updateMask.fieldPaths=atualizadoEm`,
        body
    );

    if (patch.status === 200) {
        console.log(`   ✅ Versão atualizada: ${versaoAtual} → ${novaVersao}`);
        console.log('   Todos os usuários verão o modal na próxima ação.\n');
    } else {
        console.error(`   ❌ Falha ao salvar. Status: ${patch.status}`);
        console.error('   Resposta:', JSON.stringify(patch.body).slice(0, 300));
    }
}

bumpVersion().catch(err => {
    console.error('   ❌ Erro inesperado:', err.message || err);
    process.exit(0); // Não quebrar o deploy
});