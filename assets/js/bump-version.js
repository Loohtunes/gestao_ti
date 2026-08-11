#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════════════
   bump-version.js — incrementa a versão do sistema (APP_BUILD) no deploy

   USO:   node bump-version.js
          node bump-version.js 42     (define um número específico)

   O que faz:
   • Localiza  const APP_BUILD = N;  em assets/js/ui.js
   • Incrementa N em +1 (ou usa o número passado como argumento)
   • Regrava o arquivo preservando o final de linha (LF)
   • Valida a sintaxe com node --check

   Depois de rodar: faça o deploy normal. Ao acessar o sistema como Super Admin
   (com Ctrl+Shift+R para pegar o código novo), a versão é publicada sozinha e
   os demais usuários logados recebem o splash de atualização.
   ══════════════════════════════════════════════════════════════════════════ */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const UI = path.join(__dirname, 'assets', 'js', 'ui.js');

if (!fs.existsSync(UI)) {
    console.error('✗ Não encontrei assets/js/ui.js. Rode este comando na raiz do projeto.');
    process.exit(1);
}

const raw = fs.readFileSync(UI);
const usaCRLF = raw.includes(Buffer.from('\r\n'));
let texto = raw.toString('utf8');

const re = /const APP_BUILD = (\d+);/;
const m = texto.match(re);
if (!m) {
    console.error('✗ Não encontrei "const APP_BUILD = N;" no ui.js.');
    process.exit(1);
}

const atual = parseInt(m[1], 10);
const arg = process.argv[2] ? parseInt(process.argv[2], 10) : null;
const novo = (arg !== null && !Number.isNaN(arg)) ? arg : atual + 1;

if (novo <= atual && arg === null) {
    console.error(`✗ Novo valor (${novo}) não é maior que o atual (${atual}).`);
    process.exit(1);
}

texto = texto.replace(re, `const APP_BUILD = ${novo};`);

// Preserva o final de linha original
let saida = texto;
if (usaCRLF) saida = saida.replace(/(?<!\r)\n/g, '\r\n');
else saida = saida.replace(/\r\n/g, '\n');

fs.writeFileSync(UI, saida, 'utf8');

try {
    execSync(`node --check "${UI}"`, { stdio: 'pipe' });
} catch (e) {
    console.error('✗ Sintaxe inválida após a edição! Revertendo.');
    fs.writeFileSync(UI, raw);
    process.exit(1);
}

console.log(`✓ APP_BUILD: ${atual} → ${novo}`);
console.log('  Próximos passos:');
console.log('   1) Faça o deploy normal (Firebase Hosting).');
console.log('   2) Acesse como Super Admin e dê Ctrl+Shift+R.');
console.log('   3) A versão publica sozinha; os demais logados verão o splash. 🔔');