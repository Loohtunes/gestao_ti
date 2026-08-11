/* ============================================================================
 * dashboard.js — lógica do Dashboard (extraído do inline de dashboard.html)
 * Passo 1 do app-shell: vira arquivo para poder ser carregado pela casca.
 * Comportamento idêntico ao inline anterior.
 *
 * NAV: a navegação (NAV_MODULOS, ícones, filtro de acesso e montagem das abas)
 * vive em ui.js e é a FONTE ÚNICA. Para adicionar um submódulo, edite apenas
 * NAV_MODULOS em ui.js — não recrie listas de abas aqui.
 * ========================================================================== */

function dashLogout() {
    if (typeof logout === 'function') logout();
    else { localStorage.removeItem('chamados-current-user-id'); if (typeof broadcastLogout === 'function') broadcastLogout(); window.location.href = 'login.html'; }
}

// ===== Painel Comercial: dados, métricas e alertas =====
const ETAPA_LABELS = { proposta: 'Proposta', contrato: 'Contrato', documentacoes: 'Documentações', aditivos: 'Aditivos', medicao: 'Medição' };
const SUB_LABELS = { elaboracao: 'Elaboração', envio: 'Envio', analise_cliente: 'Análise do Cliente', assinatura: 'Assinatura', em_analise: 'Em Análise', coc: 'COC', art: 'ART', cno_sfobras: 'CNO/SFOBRAS', serasa: 'Serasa', comparativo_recebimento: 'Recebimento do Comparativo', analise_comparativo: 'Em Análise', carta_envio: 'Envio da Carta Aditiva', carta_aprovacao: 'Aprovação da Carta Aditiva', carta_assinatura: 'Assinatura da Carta Aditiva', termo_envio: 'Envio do Termo Aditivo', termo_assinatura: 'Assinatura do Termo Aditivo', em_aprovacao: 'Em aprovação', aprovacao: 'Aprovação do Cliente' };
function _refAtrasoSub(sub, item) {
    if (!sub) return null;
    return sub.dataLimite || sub.dataPrevista || (sub.status === 'active' && item ? item.dataPrevista : null) || null;
}
function _etapaEmAtraso(e, hoje) {
    if (!e) return false;
    if (Array.isArray(e.lista)) {
        return e.lista.some(item => item.status !== 'done' && item.status !== 'pulada' && (
            (item.dataPrevista && item.dataPrevista < hoje) ||
            Object.values(item.subEtapas || {}).some(s => { const r = _refAtrasoSub(s, item); return s.status !== 'done' && s.status !== 'pulada' && r && r < hoje; })
        ));
    }
    return Object.values(e.subEtapas || {}).some(s => !s.isCocLista && s.status !== 'done' && s.status !== 'pulada' && (s.dataLimite || s.dataPrevista) && (s.dataLimite || s.dataPrevista) < hoje)
        || (e.cocLista || []).some(ci => ci.status !== 'done' && ci.status !== 'pulada' && ci.dataPrevista && ci.dataPrevista < hoje);
}
function _coletarPrazosObra(o) {
    const out = [];
    Object.entries(o.etapas || {}).forEach(([etapaKey, e]) => {
        if (!e || !e.ativa || e.status === 'done' || e.status === 'pulada') return;
        if (Array.isArray(e.lista)) {
            e.lista.forEach(item => {
                if (item.status === 'done' || item.status === 'pulada') return;
                if (item.dataPrevista) out.push({ ref: item.dataPrevista, status: item.status, etapaKey, subLabel: item.titulo || '' });
                Object.entries(item.subEtapas || {}).forEach(([sid, s]) => { const r = _refAtrasoSub(s, item); if (r) out.push({ ref: r, status: s.status, etapaKey, subLabel: (item.titulo ? item.titulo + ' · ' : '') + (SUB_LABELS[sid] || sid) }); });
            });
        } else {
            Object.entries(e.subEtapas || {}).forEach(([sid, s]) => { if (s.isCocLista) return; const r = s.dataLimite || s.dataPrevista; if (r) out.push({ ref: r, status: s.status, etapaKey, subLabel: (SUB_LABELS[sid] || sid) }); });
            (e.cocLista || []).forEach(ci => { if (ci.dataPrevista) out.push({ ref: ci.dataPrevista, status: ci.status, etapaKey, subLabel: ci.nome ? 'COC · ' + ci.nome : 'COC' }); });
        }
    });
    return out;
}
function _temRespD(o, u) { return !!u && o && (Array.isArray(o.responsaveis) ? o.responsaveis.includes(u) : o.responsavel === u); }
function _renderTarefas(obras, hoje, dHoje) {
    const cont = document.getElementById('cpain-tarefas-cont');
    if (!cont) return;
    const u = currentUser?.username;
    const tarefas = [];
    if (u) obras.filter(o => !_obraFinalizada(o)).forEach(o => {
        Object.entries(o.etapas || {}).forEach(([etapaKey, e]) => {
            if (!e || !e.ativa || e.status === 'pulada') return;
            if (Array.isArray(e.lista)) {
                e.lista.forEach(item => {
                    if (item.status === 'done' || item.status === 'pulada') return;
                    Object.entries(item.subEtapas || {}).forEach(([sid, s]) => {
                        if (s.status !== 'done' && _temRespD(s, u)) tarefas.push({ o, etapaKey, ref: _refAtrasoSub(s, item), subLabel: (item.titulo ? item.titulo + ' \u00b7 ' : '') + (SUB_LABELS[sid] || sid) });
                    });
                });
            } else {
                Object.entries(e.subEtapas || {}).forEach(([sid, s]) => {
                    if (s.isCocLista) return;
                    if (s.status !== 'done' && _temRespD(s, u)) tarefas.push({ o, etapaKey, ref: s.dataLimite || s.dataPrevista, subLabel: (SUB_LABELS[sid] || sid) });
                });
                (e.cocLista || []).forEach(ci => {
                    if (ci.status !== 'done' && _temRespD(ci, u)) tarefas.push({ o, etapaKey, ref: ci.dataPrevista, subLabel: ci.nome ? 'COC \u00b7 ' + ci.nome : 'COC' });
                });
            }
        });
    });
    tarefas.sort((a, b) => {
        const aV = !!(a.ref && a.ref < hoje), bV = !!(b.ref && b.ref < hoje);
        if (aV !== bV) return aV ? -1 : 1;
        if (!a.ref && !b.ref) return 0;
        if (!a.ref) return 1; if (!b.ref) return -1;
        return a.ref < b.ref ? -1 : 1;
    });
    if (!tarefas.length) { cont.style.display = 'block'; cont.innerHTML = `<div class="cpain-vazio">Você não tem tarefas atribuídas no momento. 🎉</div>`; return; }
    cont.innerHTML = tarefas.map(t => {
        const nome = `#${t.o.numero || t.o.id.slice(-6).toUpperCase()} ${t.o.nome || ''}`.trim();
        const etpTxt = `${ETAPA_LABELS[t.etapaKey] || t.etapaKey || ''} \u00b7 ${t.subLabel}`;
        let badge;
        if (t.ref && t.ref < hoje) badge = `<span class="cpain-tarefa-badge" style="background:#fee2e2;color:#b91c1c;">⚠ Atrasada</span>`;
        else if (t.ref) { const dias = Math.round((new Date(t.ref + 'T12:00:00') - dHoje) / 86400000); badge = `<span class="cpain-tarefa-badge" style="background:#fef3c7;color:#b45309;">${dias === 0 ? 'Vence hoje' : 'Vence em ' + dias + 'd'}</span>`; }
        else badge = `<span class="cpain-tarefa-badge" style="background:var(--surface3);color:var(--muted);">Sem prazo</span>`;
        return `<div class="cpain-tarefa-card" onclick="window.location.href='comercial.html?obra=${t.o.id}&etapa=${t.etapaKey}'">
          <div class="cpain-tarefa-nome" title="${nome}">${nome}</div>
          <div class="cpain-tarefa-etapa" title="${etpTxt}">${etpTxt}</div>
          ${badge}
        </div>`;
    }).join('');
}

// ===== Quadro de Avisos (post-its persistidos, tempo real) =====
const CORES_AVISO = ['#ffd43b', '#ff922b', '#ff6b6b', '#f06595', '#9775fa', '#4dabf7', '#ced4da'];
const AVISO_CANVAS_W = 960, AVISO_CANVAS_H = 640;
let _avisosTime = {}, _avisosPessoal = {}, _unsubAT = null, _unsubAP = null, _avisoBusy = false, _avisoPending = false, _avisoZ = 100;
let _dashObras = [];
function _ehGestorComercial() {
    const u = currentUser; if (!u) return false;
    return !!(u.isSuperAdmin || u.role === 'superAdmin' || (u.acessos || []).includes('adminComercial'));
}
function _escAviso(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }
function _initAvisos() {
    const board = document.getElementById('cpain-board');
    if (!board) return;
    const addBtn = document.getElementById('cpain-add-aviso');
    if (addBtn) addBtn.onclick = (ev) => { ev.stopPropagation(); _toggleAddMenu(); };
    document.addEventListener('click', () => { const m = document.getElementById('cpain-add-menu'); if (m) m.remove(); });
    if (_unsubAT) _unsubAT(); if (_unsubAP) _unsubAP();
    _unsubAT = db.collection('avisos').where('escopo', '==', 'time').onSnapshot(snap => {
        _avisosTime = {}; snap.forEach(d => _avisosTime[d.id] = Object.assign({ id: d.id }, d.data())); _renderAvisos();
    }, e => console.error('[avisos time]', e));
    const u = currentUser?.username;
    if (u) _unsubAP = db.collection('avisos').where('autor', '==', u).onSnapshot(snap => {
        _avisosPessoal = {}; snap.forEach(d => { const x = d.data(); if (x.escopo === 'pessoal') _avisosPessoal[d.id] = Object.assign({ id: d.id }, x); }); _renderAvisos();
    }, e => console.error('[avisos pessoal]', e));
}
function _toggleAddMenu() {
    const head = document.querySelector('.cpain-avisos-head');
    let m = document.getElementById('cpain-add-menu');
    if (m) { m.remove(); return; }
    m = document.createElement('div'); m.className = 'cpain-add-menu'; m.id = 'cpain-add-menu';
    m.innerHTML = `<button data-esc="time">Aviso do Time</button><button data-esc="pessoal">Lembrete Pessoal</button>`;
    m.querySelectorAll('button').forEach(b => b.onclick = (ev) => { ev.stopPropagation(); _criarAviso(b.dataset.esc); m.remove(); });
    head.appendChild(m);
}
async function _criarAviso(escopo) {
    const u = currentUser?.username; if (!u) return;
    const n = Object.keys(_avisosTime).length + Object.keys(_avisosPessoal).length;
    try {
        await db.collection('avisos').add({ texto: '', cor: CORES_AVISO[0], x: 16 + (n % 6) * 26, y: 16 + (n % 6) * 26, escopo, autor: u, createdAt: Date.now(), updatedAt: Date.now() });
    } catch (e) { console.error('[criar aviso]', e); }
}
function _renderAvisos() {
    if (_avisoBusy) { _avisoPending = true; return; }
    const board = document.getElementById('cpain-board'); if (!board) return;
    const all = Object.values(_avisosTime).concat(Object.values(_avisosPessoal)).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    if (!all.length) { board.innerHTML = `<div class="cpain-board-canvas" id="cpain-canvas"><div class="cpain-board-vazio">Sem avisos ainda. Clique em "+ Aviso" para começar.</div></div>`; return; }
    const me = currentUser?.username, gestor = _ehGestorComercial();
    board.innerHTML = `<div class="cpain-board-canvas" id="cpain-canvas">` + all.map(a => {
        if (a.type === 'obra') return _renderObraCard(a, me);
        const canEdit = a.autor === me;
        const canMover = a.escopo === 'time' ? true : (a.autor === me);
        const canDel = a.escopo === 'pessoal' ? a.autor === me : (gestor || a.autor === me);
        const tag = a.escopo === 'time' ? 'Time' : 'Pessoal';
        return `<div class="cpain-postit" data-id="${a.id}" style="left:${a.x || 16}px;top:${a.y || 16}px;background:${a.cor || CORES_AVISO[0]};">
          <div class="cpain-postit-head" data-drag="${canMover ? '1' : '0'}">
            <span class="cpain-postit-tag">${tag}</span>
            <div class="cpain-postit-actions">
              ${canEdit ? `<button data-act="cor" title="Cor">●</button>` : ''}
              ${canDel ? `<button data-act="del" title="Excluir">×</button>` : ''}
            </div>
          </div>
          <div class="cpain-postit-text" ${canEdit ? 'contenteditable="true"' : ''}>${_escAviso(a.texto)}</div>
          <div class="cpain-postit-autor">— ${_escAviso(a.autor)}</div>
        </div>`;
    }).join('') + `</div>`;
    board.querySelectorAll('.cpain-postit').forEach(el => _bindPostit(el));
    board.querySelectorAll('.cpain-obra-card').forEach(el => _bindObraCard(el));
}
function _bindPostit(el) {
    const id = el.dataset.id;
    const a = Object.assign({}, _avisosTime, _avisosPessoal)[id]; if (!a) return;
    const head = el.querySelector('.cpain-postit-head');
    if (head && head.dataset.drag === '1') {
        head.addEventListener('mousedown', (e) => {
            if (e.target.closest('button')) return;
            e.preventDefault(); _avisoBusy = true; el.style.zIndex = ++_avisoZ;
            const offX = e.clientX - el.offsetLeft, offY = e.clientY - el.offsetTop;
            const move = (ev) => {
                let nx = ev.clientX - offX, ny = ev.clientY - offY;
                nx = Math.max(0, Math.min(nx, AVISO_CANVAS_W - el.offsetWidth));
                ny = Math.max(0, Math.min(ny, AVISO_CANVAS_H - el.offsetHeight));
                el.style.left = nx + 'px'; el.style.top = ny + 'px';
            };
            const up = async () => {
                document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up);
                const nx = parseInt(el.style.left) || 0, ny = parseInt(el.style.top) || 0;
                try { await db.collection('avisos').doc(id).update({ x: nx, y: ny, updatedAt: Date.now() }); } catch (err) { console.error(err); }
                _avisoBusy = false; if (_avisoPending) { _avisoPending = false; _renderAvisos(); }
            };
            document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
        });
    }
    const txt = el.querySelector('.cpain-postit-text');
    if (txt && txt.isContentEditable) {
        txt.addEventListener('focus', () => { _avisoBusy = true; });
        txt.addEventListener('blur', async () => {
            const novo = txt.textContent.trim();
            if (novo !== (a.texto || '')) { try { await db.collection('avisos').doc(id).update({ texto: novo, updatedAt: Date.now() }); } catch (e) { console.error(e); } }
            _avisoBusy = false; if (_avisoPending) { _avisoPending = false; _renderAvisos(); }
        });
    }
    const corBtn = el.querySelector('[data-act="cor"]');
    if (corBtn) corBtn.addEventListener('click', (e) => { e.stopPropagation(); _abrirPaleta(el, id); });
    const delBtn = el.querySelector('[data-act="del"]');
    if (delBtn) delBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!await showConfirm('Excluir aviso', 'Excluir este aviso?', { okText: 'Excluir', danger: true })) return;
        try { await db.collection('avisos').doc(id).delete(); } catch (err) { console.error(err); }
    });
}
function _statusEtapaObra(o, etapaKey, hoje) {
    const e = o.etapas[etapaKey];
    if (!e || !e.ativa || e.status === 'pulada') return null;
    if (e.status === 'done') return 'done';
    if (_etapaEmAtraso(e, hoje)) return 'atrasada';
    const _lim = (() => { const x = new Date(hoje + 'T12:00:00'); x.setDate(x.getDate() + 7); return x.toISOString().slice(0, 10); })();
    const refs = [];
    if (Array.isArray(e.lista)) {
        e.lista.forEach(item => {
            if (item.status === 'done' || item.status === 'pulada') return;
            if (item.dataPrevista) refs.push(item.dataPrevista);
            Object.values(item.subEtapas || {}).forEach(s => { const r = _refAtrasoSub(s, item); if (r && s.status !== 'done' && s.status !== 'pulada') refs.push(r); });
        });
    } else {
        Object.values(e.subEtapas || {}).forEach(s => { if (s.isCocLista) return; const r = s.dataLimite || s.dataPrevista; if (r && s.status !== 'done' && s.status !== 'pulada') refs.push(r); });
        (e.cocLista || []).forEach(ci => { if (ci.status === 'done' || ci.status === 'pulada') return; if (ci.dataPrevista) refs.push(ci.dataPrevista); });
    }
    if (refs.some(r => r >= hoje && r <= _lim)) return 'perto';
    if (e.status === 'active') return 'prazo';
    return 'pendente';
}
const _ETAPA_ST_ICO = {
    done: { cor: '#22c55e', svg: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>' },
    prazo: { cor: '#22c55e', svg: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>' },
    perto: { cor: '#f59e0b', svg: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 7 12 12 15 14"/></svg>' },
    atrasada: { cor: '#ef4444', svg: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' },
    pendente: { cor: '#9ca3af', svg: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3 3"><circle cx="12" cy="12" r="9"/></svg>' }
};
function _etapasObraHtml(obraId) {
    const o = _dashObras.find(x => x.id === obraId);
    if (!o || !o.etapas) return '<div class="cpain-obra-etapas-vazio">—</div>';
    if (o.concluida) return `<div class="cpain-et-row" style="color:#22c55e;"><span class="cpain-et-ico" style="color:#22c55e;">${_ETAPA_ST_ICO.done.svg}</span><span>Obra concluída</span></div>`;
    const hoje = new Date().toISOString().slice(0, 10);
    const rows = ['proposta', 'contrato', 'documentacoes', 'aditivos', 'medicao']
        .filter(k => { const e = o.etapas[k]; return e && e.ativa && e.status !== 'pulada'; })
        .map(k => {
            const st = _statusEtapaObra(o, k, hoje) || 'pendente';
            const ic = _ETAPA_ST_ICO[st];
            return `<div class="cpain-et-row"><span class="cpain-et-ico" style="color:${ic.cor};">${ic.svg}</span><span>${ETAPA_LABELS[k] || k}</span></div>`;
        });
    return rows.length ? rows.join('') : '<div class="cpain-obra-etapas-vazio">Sem etapa ativa</div>';
}
function _renderObraCard(a, me) {
    const canDel = a.autor === me;
    const num = a.numero ? `#${_escAviso(String(a.numero))}` : '#—';
    return `<div class="cpain-obra-card" data-id="${a.id}" data-obra="${_escAviso(a.obraId || '')}" style="left:${a.x || 16}px;top:${a.y || 16}px;border-left:4px solid ${a.cor || '#3b82f6'};">
          <div class="cpain-obra-head" data-drag="1">
            <span class="cpain-obra-num">${num}</span>
            ${canDel ? `<button data-act="del" title="Desfixar">\u00d7</button>` : ''}
          </div>
          <div class="cpain-obra-nome" title="${_escAviso(a.nome || '')}">${_escAviso(a.nome || '')}</div>
          ${(() => { const _o = _dashObras.find(x => x.id === a.obraId); return (_o && _o.emEspera) ? _esperaContadorHTML(_o) : ''; })()}
          <div class="cpain-obra-etapas">${_etapasObraHtml(a.obraId)}</div>
          <button class="cpain-obra-abrir" data-act="abrir">Abrir obra \u2192</button>
        </div>`;
}
function _bindObraCard(el) {
    const id = el.dataset.id;
    const head = el.querySelector('.cpain-obra-head');
    if (head) {
        head.addEventListener('mousedown', (e) => {
            if (e.target.closest('button')) return;
            e.preventDefault(); _avisoBusy = true; el.style.zIndex = ++_avisoZ;
            const offX = e.clientX - el.offsetLeft, offY = e.clientY - el.offsetTop;
            const move = (ev) => {
                let nx = ev.clientX - offX, ny = ev.clientY - offY;
                nx = Math.max(0, Math.min(nx, AVISO_CANVAS_W - el.offsetWidth));
                ny = Math.max(0, Math.min(ny, AVISO_CANVAS_H - el.offsetHeight));
                el.style.left = nx + 'px'; el.style.top = ny + 'px';
            };
            const up = async () => {
                document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up);
                const nx = parseInt(el.style.left) || 0, ny = parseInt(el.style.top) || 0;
                try { await db.collection('avisos').doc(id).update({ x: nx, y: ny, updatedAt: Date.now() }); } catch (err) { console.error(err); }
                _avisoBusy = false; if (_avisoPending) { _avisoPending = false; _renderAvisos(); }
            };
            document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
        });
    }
    const delBtn = el.querySelector('[data-act="del"]');
    if (delBtn) delBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        try { await db.collection('avisos').doc(id).delete(); } catch (err) { console.error(err); }
    });
    const abrir = el.querySelector('[data-act="abrir"]');
    if (abrir) abrir.addEventListener('click', (e) => { e.stopPropagation(); const oid = el.dataset.obra; if (oid) window.location.href = `comercial.html?obra=${oid}`; });
}
function _abrirPaleta(el, id) {
    let pal = el.querySelector('.cpain-postit-cores');
    if (pal) { pal.remove(); return; }
    pal = document.createElement('div'); pal.className = 'cpain-postit-cores';
    pal.innerHTML = CORES_AVISO.map(c => `<span class="cpain-cor-swatch" data-cor="${c}" style="background:${c};"></span>`).join('');
    pal.querySelectorAll('.cpain-cor-swatch').forEach(s => s.addEventListener('click', async (e) => {
        e.stopPropagation();
        try { await db.collection('avisos').doc(id).update({ cor: s.dataset.cor, updatedAt: Date.now() }); } catch (err) { console.error(err); }
    }));
    el.appendChild(pal);
}

async function renderPainelComercial() {
    const cont = document.getElementById('dash-content');
    cont.innerHTML = `
        <div class="cpain-grid">
          <section class="cpain-avisos">
            <div class="cpain-avisos-head">
              <div class="cpain-block-title">Quadro de Avisos</div>
              <button class="cpain-add-btn" id="cpain-add-aviso" title="Novo aviso">+ Aviso</button>
            </div>
            <div class="cpain-board" id="cpain-board"></div>
          </section>
          <div class="cpain-right">
            <section class="cpain-metricas" id="cpain-metricas"></section>
            <section class="cpain-alertas">
              <div class="cpain-block-title">Alertas Comerciais</div>
              <div class="cpain-alertas-row" id="cpain-alertas-row"><div class="cpain-vazio">Carregando…</div></div>
            </section>
            <section class="cpain-tarefas">
              <div class="cpain-block-title">Tarefas atribuídas a você</div>
              <div class="cpain-tarefas-cont" id="cpain-tarefas-cont"><div class="cpain-vazio">Carregando…</div></div>
            </section>
          </div>
        </div>`;
    let obras = [];
    try {
        const snap = await db.collection('obras').get();
        snap.forEach(d => obras.push(Object.assign({ id: d.id }, d.data())));
    } catch (e) { console.error('Erro ao carregar obras', e); }
    obras = obras.filter(o => !o.arquivada);
    const hoje = new Date().toISOString().slice(0, 10);
    const dHoje = new Date(hoje + 'T12:00:00');
    let mObras = 0, mAnd = 0, mAtr = 0, mConc = 0;
    obras.forEach(o => {
        if (!_obraFinalizada(o)) mObras++;
        Object.values(o.etapas || {}).forEach(e => {
            if (!e) return;
            if (e.status === 'done') mConc++;
            if (e.ativa && e.status === 'active') mAnd++;
            if (!_obraFinalizada(o) && e.ativa && e.status !== 'done' && e.status !== 'pulada' && _etapaEmAtraso(e, hoje)) mAtr++;
        });
    });
    const mets = [
        { n: mObras, l: 'Obras em andamento', c: 'var(--accent)' },
        { n: mAnd, l: 'Etapas em andamento', c: '#3b82f6' },
        { n: mAtr, l: 'Etapas em atraso', c: '#ef4444' },
        { n: mConc, l: 'Etapas concluídas', c: '#22c55e' }
    ];
    document.getElementById('cpain-metricas').innerHTML = mets.map(m =>
        `<div class="cpain-metrica"><div class="cpain-metrica-num" style="color:${m.c};">${m.n}</div><div class="cpain-metrica-label">${m.l}</div></div>`).join('');
    const alertas = [];
    obras.filter(o => !_obraFinalizada(o)).forEach(o => {
        let pAtr = null, pVenc = null, diasVenc = null;
        _coletarPrazosObra(o).forEach(p => {
            if (p.status === 'done' || p.status === 'pulada' || !p.ref) return;
            if (p.ref < hoje) { if (!pAtr || p.ref < pAtr.ref) pAtr = p; }
            else { const dias = Math.round((new Date(p.ref + 'T12:00:00') - dHoje) / 86400000); if (dias <= 7 && (pVenc === null || dias < diasVenc)) { pVenc = p; diasVenc = dias; } }
        });
        if (pAtr) alertas.push({ o, tipo: 'atraso', data: pAtr.ref, etapaKey: pAtr.etapaKey, subLabel: pAtr.subLabel });
        else if (pVenc) alertas.push({ o, tipo: 'vence', dias: diasVenc, etapaKey: pVenc.etapaKey, subLabel: pVenc.subLabel });
    });
    alertas.sort((a, b) => ((a.tipo === 'atraso' ? 0 : 1) - (b.tipo === 'atraso' ? 0 : 1)) || ((a.data || '') < (b.data || '') ? -1 : 1));
    const row = document.getElementById('cpain-alertas-row');
    if (!alertas.length) {
        row.style.display = 'block';
        row.innerHTML = `<div class="cpain-vazio">Nenhuma obra com etapa em atraso ou vencendo nos próximos 7 dias. 🎉</div>`;
    } else {
        const MAX_AL = 20;
        const extra = alertas.length - MAX_AL;
        row.innerHTML = alertas.slice(0, MAX_AL).map(a => {
            const nome = `#${a.o.numero || a.o.id.slice(-6).toUpperCase()} ${a.o.nome || ''}`.trim();
            const atraso = a.tipo === 'atraso';
            const badge = atraso
                ? `<span class="cpain-alerta-badge" style="background:#fee2e2;color:#b91c1c;">⚠ Atrasada</span>`
                : `<span class="cpain-alerta-badge" style="background:#fef3c7;color:#b45309;">Vence em ${a.dias}d</span>`;
            const dataTxt = atraso ? `desde ${new Date(a.data + 'T12:00:00').toLocaleDateString('pt-BR')}` : '';
            const etpNome = ETAPA_LABELS[a.etapaKey] || a.etapaKey || '';
            const etpTxt = a.subLabel ? `${etpNome} · ${a.subLabel}` : etpNome;
            return `<div class="cpain-alerta-card" onclick="window.location.href='comercial.html?obra=${a.o.id}'" style="border-left:3px solid ${atraso ? '#ef4444' : '#f59e0b'};">
            <div class="cpain-alerta-nome" title="${nome}">${nome}</div>
            ${etpTxt ? `<div class="cpain-alerta-etapa" title="${etpTxt}">${etpTxt}</div>` : ''}
            ${badge}
            ${dataTxt ? `<div style="font-size:0.6rem;color:var(--muted);margin-top:0.3rem;font-family:var(--font-mono);">${dataTxt}</div>` : ''}
          </div>`;
        }).join('') + (extra > 0 ? `<div class="cpain-alerta-card cpain-alerta-mais" onclick="window.location.href='comercial.html'"><div class="cpain-alerta-mais-num">+${extra}</div><div class="cpain-alerta-mais-txt">ver todas no Controle de Obras</div></div>` : '');
    }
    _renderTarefas(obras, hoje, dHoje);
    _dashObras = obras;
    _initAvisos();
}

async function renderPainelTI() {
    const cont = document.getElementById('dash-content');
    const u = currentUser;
    const acessos = (u && u.acessos) || [];
    const podeRotinas = !!(u && (u.isSuperAdmin || acessos.includes('rotinas')));
    const podeEstoque = !!(u && (u.isAdmin || u.isSuperAdmin || u.role === 'attendant'));
    cont.innerHTML = `
        <div class="tipain-grid">
          <section class="tipain-block">
            <div class="cpain-block-title">Rotinas pendentes</div>
            <div class="tipain-list" id="tipain-rotinas"><div class="cpain-vazio">Carregando…</div></div>
          </section>
          <section class="tipain-block">
            <div class="cpain-block-title">Alertas de Estoque</div>
            <div class="tipain-list" id="tipain-estoque"><div class="cpain-vazio">Carregando…</div></div>
          </section>
        </div>`;
    _renderRotinasPendentes(podeRotinas);
    _renderAlertasEstoque(podeEstoque);
}

async function _renderRotinasPendentes(pode) {
    const box = document.getElementById('tipain-rotinas');
    if (!box) return;
    if (!pode) { box.innerHTML = '<div class="cpain-vazio">Sem permissão para visualizar rotinas.</div>'; return; }
    let ultS = null, ultI = null, ultC = null;
    try {
        const [s, i, c] = await Promise.all([
            db.collection('rotinas_servidor').orderBy('registradoEm', 'desc').limit(1).get(),
            db.collection('rotinas_impressoras').orderBy('mesAno', 'desc').limit(1).get(),
            db.collection('rotinas_cftv').orderBy('registradoEm', 'desc').limit(1).get(),
        ]);
        if (!s.empty) ultS = s.docs[0].data();
        if (!i.empty) ultI = i.docs[0].data();
        if (!c.empty) ultC = c.docs[0].data();
    } catch (e) { console.error('Erro ao carregar rotinas', e); }
    const hoje = new Date().toISOString().slice(0, 10);
    const mesAtual = hoje.slice(0, 7);
    const fmtData = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : null;
    const fmtMes = (m) => {
        if (!m) return null;
        const partes = m.split('-');
        const nomes = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
        return nomes[parseInt(partes[1], 10) - 1] + '/' + partes[0];
    };
    const SVG_SERVER = '<svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect width=\"20\" height=\"8\" x=\"2\" y=\"2\" rx=\"2\" ry=\"2\"/><rect width=\"20\" height=\"8\" x=\"2\" y=\"14\" rx=\"2\" ry=\"2\"/><line x1=\"6\" x2=\"6.01\" y1=\"6\" y2=\"6\"/><line x1=\"6\" x2=\"6.01\" y1=\"18\" y2=\"18\"/></svg>';
    const SVG_PRINTER = '<svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polyline points=\"6 9 6 2 18 2 18 9\"/><path d=\"M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2\"/><rect width=\"12\" height=\"8\" x=\"6\" y=\"14\"/></svg>';
    const SVG_CFTV = '<svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"m22 8-6 4 6 4V8Z\"/><rect width=\"14\" height=\"12\" x=\"2\" y=\"6\" rx=\"2\" ry=\"2\"/></svg>';
    const itens = [
        { nome: 'Servidor', ic: SVG_SERVER, pend: !ultS || ultS.data !== hoje, ult: ultS ? fmtData(ultS.data) : null, por: ultS ? ultS.registradoPor : null, msg: 'Verificação de hoje pendente' },
        { nome: 'CFTV', ic: SVG_CFTV, pend: !ultC || ultC.data !== hoje, ult: ultC ? fmtData(ultC.data) : null, por: ultC ? ultC.registradoPor : null, msg: 'Checagem de hoje pendente' },
        { nome: 'Impressoras', ic: SVG_PRINTER, pend: !ultI || ultI.mesAno !== mesAtual, ult: ultI ? fmtMes(ultI.mesAno) : null, por: ultI ? ultI.registradoPor : null, msg: 'Leitura do mês pendente' },
    ];
    const pendentes = itens.filter(x => x.pend);
    if (pendentes.length === 0) {
        box.innerHTML = '<div class="tipain-ok"><svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"m9 12 2 2 4-4\"/></svg> Todas as rotinas em dia</div>';
        return;
    }
    box.innerHTML = pendentes.map(x => {
        const nunca = !x.ult;
        const badgeTxt = nunca ? 'Nunca registrado' : 'Pendente';
        const badgeCls = nunca ? 'tipain-badge-vermelho' : 'tipain-badge-amarelo';
        const ultTxt = nunca ? 'Sem registros' : ('Último: ' + x.ult + (x.por ? ' · ' + x.por : ''));
        return `
          <a href="rotinas.html" class="tipain-card">
            <div class="tipain-card-ic">${x.ic}</div>
            <div class="tipain-card-info">
              <span class="tipain-card-nome">${x.nome}</span>
              <span class="tipain-card-sub">${x.msg}</span>
              <span class="tipain-card-meta">${ultTxt}</span>
            </div>
            <span class="tipain-badge ${badgeCls}">${badgeTxt}</span>
          </a>`;
    }).join('');
}

async function _renderAlertasEstoque(pode) {
    const box = document.getElementById('tipain-estoque');
    if (!box) return;
    if (!pode) { box.innerHTML = '<div class="cpain-vazio">Sem permissão para visualizar estoque.</div>'; return; }
    let alertas = [];
    try {
        const snap = await db.collection('insumos').get();
        alertas = snap.docs.map(d => Object.assign({ id: d.id }, d.data()))
            .filter(i => { const q = i.qtdFisica != null ? i.qtdFisica : 0, m = i.qtdMinima != null ? i.qtdMinima : 0; return m > 0 && q <= m; })
            .sort((a, b) => (((a.qtdFisica != null ? a.qtdFisica : 0) / (a.qtdMinima || 1)) - ((b.qtdFisica != null ? b.qtdFisica : 0) / (b.qtdMinima || 1))));
    } catch (e) { console.error('Erro ao carregar insumos', e); }
    if (alertas.length === 0) {
        box.innerHTML = '<div class="tipain-ok"><svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"m9 12 2 2 4-4\"/></svg> Estoque sem alertas</div>';
        return;
    }
    box.innerHTML = alertas.map(i => {
        const qtd = i.qtdFisica != null ? i.qtdFisica : 0;
        const minimo = i.qtdMinima != null ? i.qtdMinima : 0;
        const zerado = qtd <= 0;
        const badgeCls = zerado ? 'tipain-badge-vermelho' : 'tipain-badge-amarelo';
        const icCls = zerado ? 'tipain-ic-vermelho' : 'tipain-ic-amarelo';
        const label = zerado ? 'Zerado' : 'No limite';
        return `
          <a href="inventario.html?tab=insumos&id=${i.id}" class="tipain-card">
            <div class="tipain-card-ic ${icCls}"><svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z\"/><line x1=\"12\" x2=\"12\" y1=\"9\" y2=\"13\"/><line x1=\"12\" x2=\"12.01\" y1=\"17\" y2=\"17\"/></svg></div>
            <div class="tipain-card-info">
              <span class="tipain-card-nome">${i.nome}</span>
              <span class="tipain-card-meta">${qtd} ${i.unidade || 'un'} · mín. ${minimo}</span>
            </div>
            <span class="tipain-badge ${badgeCls}">${label}</span>
          </a>`;
    }).join('');
}

async function _initDashboardModulo() {
    if (typeof loadUsers === 'function') await loadUsers();
    const savedId = await ensureSession();
    const user = (savedId && typeof users !== 'undefined') ? users.find(u => u.id === savedId) : null;
    if (!user) { window.location.href = 'login.html'; return; }
    currentUser = user;

    if (typeof initDarkMode === 'function') initDarkMode();
    if (typeof initSessionTimer === 'function') initSessionTimer(user.role);

    // Sidebar retrátil — restaura estado salvo (anti-flash)
    const collapsed = localStorage.getItem('chamados-sidebar-collapsed') === '1';
    const sidebar = document.getElementById('chamados-sidebar');
    const tIcon = document.getElementById('sidebar-toggle-icon');
    if (sidebar) {
        sidebar.classList.add('no-transition');
        if (collapsed) { sidebar.classList.add('collapsed'); if (tIcon) tIcon.textContent = '›'; }
        requestAnimationFrame(() => requestAnimationFrame(() => sidebar.classList.remove('no-transition')));
    }

    // Firebase btn / Configurações btn
    const syncBtn = document.getElementById('sync-fab-nav');
    if (syncBtn) syncBtn.style.display = user.isSuperAdmin ? 'flex' : 'none';
    const configBtn = document.getElementById('sidebar-config-btn');
    if (configBtn) configBtn.style.display = (user.isAdmin || user.isSuperAdmin) ? 'flex' : 'none';

    // Usuário na sidebar
    const avatar = document.getElementById('dash-sidebar-avatar');
    const name = document.getElementById('dash-sidebar-name');
    const role = document.getElementById('dash-sidebar-role');
    if (avatar) avatar.textContent = (user.username?.[0] || '?').toUpperCase();
    if (name) name.textContent = (typeof capitalizeName === 'function') ? capitalizeName(user.username || '—') : (user.username || '—');
    if (role && typeof getSectorBadge === 'function') role.innerHTML = getSectorBadge(user);

    // Comercial na sidebar — só com acesso
    const canComercial = (typeof _wgtPodeComercial === 'function')
        ? _wgtPodeComercial(user)
        : (user.isSuperAdmin || (user.acessos || []).includes('comercial'));
    const comBtn = document.getElementById('dash-mod-comercial');
    if (comBtn) comBtn.style.display = canComercial ? 'flex' : 'none';

    // Escopo do painel
    const params = new URLSearchParams(window.location.search);
    let escopo = params.get('modulo') || 'geral';
    if (!NAV_MODULOS[escopo]) escopo = 'geral';
    if (escopo === 'comercial' && !canComercial) escopo = 'geral';

    // Marcar módulo ativo na sidebar
    const ativoEl = document.getElementById('dash-mod-' + escopo);
    if (ativoEl) ativoEl.classList.add('active');

    // Cabeçalho + abas + widgets (nav unificada em ui.js)
    montarSubmodTabs('submod-tabs', escopo, 'painel', user);
    if (typeof montarBotaoAcessos === 'function') montarBotaoAcessos(user, escopo);
    if (escopo === 'comercial') {
        document.getElementById('dash-content').style.display = '';
        renderPainelComercial();
    } else if (escopo === 'ti') {
        // Painel T.I visível só para admins e atendentes; demais veem "Em construção"
        const podeVerTI = !!(user && (user.isAdmin || user.isSuperAdmin || user.role === 'attendant'));
        if (podeVerTI) {
            document.getElementById('dash-content').style.display = '';
            renderPainelTI();
        } else {
            document.getElementById('dash-construcao').style.display = '';
        }
    } else {
        document.getElementById('dash-construcao').style.display = '';
    }
}

function _teardownDashboardModulo() {
    if (_unsubAT) { _unsubAT(); _unsubAT = null; }
    if (_unsubAP) { _unsubAP(); _unsubAP = null; }
}
if (window.AppShell) {
    window.AppShell.register('dashboard.html', 'dashboard', _initDashboardModulo, _teardownDashboardModulo);
} else {
    document.addEventListener('DOMContentLoaded', _initDashboardModulo);
}