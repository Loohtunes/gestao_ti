// ===== SUBMÓDULO INFRAESTRUTURA (T.I) — Premovale =====
// Fase 1: Equipamentos (inventário estruturado de racks, câmeras, switches,
// pontos de rede/telefone). A aba Mapa entra na Fase 2 (placeholder por ora).
// Padrões: modais custom (zero confirm/alert/prompt nativo), ícones Lucide inline.

function toggleMenuSidebar() {
    const sidebar = document.getElementById('chamados-sidebar');
    const icon = document.getElementById('sidebar-toggle-icon');
    if (!sidebar) return;
    sidebar.classList.toggle('collapsed');
    const collapsed = sidebar.classList.contains('collapsed');
    if (icon) icon.textContent = collapsed ? '\u203A' : '\u2039';
    try { localStorage.setItem('chamados-sidebar-collapsed', collapsed ? '1' : '0'); } catch (e) { }
}

function infraLogout() {
    if (typeof logout === 'function') logout();
    else {
        sessionStorage.removeItem('chamados-current-user-id');
        if (typeof broadcastLogout === 'function') broadcastLogout();
        window.location.href = 'login.html';
    }
}

// ── Estado ───────────────────────────────────────────────────────────────────
let _infraTipos = [];
let _infraEquip = [];
let _infraTipoEditId = null;
let _infraEquipEditId = null;
let _infraBusca = '';
let _infraFiltroTipo = '';
let _infraCanManage = false;
let _unsubInfraTipos = null;
let _unsubInfraEquip = null;

// Status possíveis do equipamento (manual e independente do CFTV nesta fase)
const INFRA_STATUS = [
    { key: 'ativo', label: 'Ativo', cor: '#22c55e' },
    { key: 'inativo', label: 'Inativo', cor: '#ef4444' },
    { key: 'manutencao', label: 'Em manuten\u00e7\u00e3o', cor: '#f59e0b' },
    { key: 'reserva', label: 'Reserva', cor: '#9ca3af' },
];
function _infraStatus(key) { return INFRA_STATUS.find(s => s.key === key) || INFRA_STATUS[0]; }

// Ícones Lucide curados para infraestrutura (inner SVG apenas). Ampliável sob demanda.
const INFRA_ICONES = {
    'server': '<rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/>',
    'hard-drive': '<line x1="22" x2="2" y1="12" y2="12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" x2="6.01" y1="16" y2="16"/><line x1="10" x2="10.01" y1="16" y2="16"/>',
    'router': '<rect width="20" height="8" x="2" y="14" rx="2"/><path d="M6.01 18H6"/><path d="M10.01 18H10"/><path d="M15 10v4"/><path d="M17.84 7.17a4 4 0 0 0-5.66 0"/><path d="M20.66 4.34a8 8 0 0 0-11.31 0"/>',
    'network': '<rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/>',
    'video': '<path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
    'cctv': '<path d="M16.75 12h3.632a1 1 0 0 1 .894 1.447l-2.034 4.069a1 1 0 0 1-1.708.134l-2.124-2.97"/><path d="M17.106 9.053a1 1 0 0 1 .447 1.341l-3.106 6.211a1 1 0 0 1-1.342.447L3.61 12.3a2.92 2.92 0 0 1-1.3-3.91L3.69 5.6a2.92 2.92 0 0 1 3.92-1.3z"/><path d="M2 19h3.76a2 2 0 0 0 1.8-1.1L9 15"/><path d="M2 21v-4"/><circle cx="9" cy="9" r="2"/>',
    'monitor': '<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>',
    'cpu': '<rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/>',
    'wifi': '<path d="M12 20h.01"/><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M5 12.859a10 10 0 0 1 14 0"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/>',
    'radio-tower': '<path d="M4.9 16.1C1 12.2 1 5.8 4.9 1.9"/><path d="M7.8 4.7a6.14 6.14 0 0 0-.8 7.5"/><circle cx="12" cy="9" r="2"/><path d="M16.2 4.8c2 2 2.26 5.11.8 7.47"/><path d="M19.1 1.9a9.96 9.96 0 0 1 0 14.1"/><path d="M9.5 18h5"/><path d="m8 22 4-11 4 11"/>',
    'database': '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>',
    'printer': '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/>',
    'phone': '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.99 15a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.92 4h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 11.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 18v-.08z"/>',
    'smartphone': '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',
    'plug': '<path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/>',
    'plug-zap': '<path d="M6.3 20.3a2.4 2.4 0 0 0 3.4 0L12 18l-6-6-2.3 2.3a2.4 2.4 0 0 0 0 3.4Z"/><path d="m2 22 3-3"/><path d="M7.5 13.5 10 11"/><path d="M10.5 16.5 13 14"/><path d="m18 3-4 4h6l-4 4"/>',
    'power': '<path d="M12 2v10"/><path d="M18.4 6.6a9 9 0 1 1-12.77.04"/>',
    'thermometer': '<path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>',
    'shield': '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
    'box': '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
    'boxes': '<path d="M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z"/><path d="m7 16.5-4.74-2.85"/><path d="m7 16.5 5-3"/><path d="M7 16.5v5.17"/><path d="M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z"/><path d="m17 16.5-5-3"/><path d="m17 16.5 4.74-2.85"/><path d="M17 16.5v5.17"/><path d="M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3 5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0l-3 1.8Z"/><path d="M12 8 7.26 5.15"/><path d="m12 8 4.74-2.85"/><path d="M12 13.5V8"/>',
    'cable': '<path d="M4 9a2 2 0 0 1-2-2V5h6v2a2 2 0 0 1-2 2Z"/><path d="M3 5V3"/><path d="M7 5V3"/><path d="M19 15a2 2 0 0 0-2 2v2h6v-2a2 2 0 0 0-2-2Z"/><path d="M17 21v2"/><path d="M21 21v2"/><path d="M11 6h4a2 2 0 0 1 2 2v7"/><path d="M9 18H4a2 2 0 0 0-2 2v-3"/>',
    'ethernet-port': '<path d="m15 20 3-3h2a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h2l3 3z"/><path d="M6 8v1"/><path d="M10 8v1"/><path d="M14 8v1"/><path d="M18 8v1"/>',
    'antenna': '<path d="M2 12 7 2"/><path d="m7 12 5-10"/><path d="m12 12 5-10"/><path d="m17 12 5-10"/><path d="M4.5 7h15"/><path d="M12 16v6"/>',
    'lock': '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    'zap': '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
};
function _infraIco(nome, size) {
    size = size || 16;
    const inner = INFRA_ICONES[nome] || INFRA_ICONES['box'];
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}
function _infraEsc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ── Bootstrap (padrão das páginas do sistema) ──────────────────────────────────
async function _initInfraPage() {
    await loadUsers();
    const savedId = await ensureSession();
    if (!savedId) { window.location.href = 'login.html'; return; }
    const user = users.find(u => u.id === savedId);
    if (!user) { window.location.href = 'login.html'; return; }
    currentUser = user;

    // Gate de acesso: restrito ao T.I (admins/superadmin ou acesso 'infraestrutura')
    const podeInfra = !!(user.isAdmin || user.isSuperAdmin || (user.acessos || []).includes('infraestrutura'));
    if (!podeInfra) { window.location.href = 'menu.html'; return; }
    _infraCanManage = !!(user.isAdmin || user.isSuperAdmin);

    if (typeof initDarkMode === 'function') initDarkMode();
    if (typeof initSessionTimer === 'function') initSessionTimer(user.role);

    // Sidebar retrátil
    const collapsed = localStorage.getItem('chamados-sidebar-collapsed') === '1';
    const sidebar = document.getElementById('chamados-sidebar');
    const icon = document.getElementById('sidebar-toggle-icon');
    if (sidebar) {
        sidebar.classList.add('no-transition');
        if (collapsed) { sidebar.classList.add('collapsed'); if (icon) icon.textContent = '\u203A'; }
        requestAnimationFrame(() => requestAnimationFrame(() => sidebar.classList.remove('no-transition')));
    }

    // Firebase btn — só superadmin
    const syncBtn = document.getElementById('sync-fab-nav');
    if (syncBtn) syncBtn.style.display = user.isSuperAdmin ? 'flex' : 'none';
    // Config btn — admins
    const configBtn = document.getElementById('sidebar-config-btn');
    if (configBtn) configBtn.style.display = (user.isAdmin || user.isSuperAdmin) ? 'flex' : 'none';

    initInfra();
}
document.addEventListener('DOMContentLoaded', _initInfraPage);

function initInfra() {
    // Avatar/nome/setor na sidebar
    const avatar = document.getElementById('cs-sidebar-avatar');
    const name = document.getElementById('cs-sidebar-name');
    const role = document.getElementById('cs-sidebar-role');
    if (avatar) avatar.textContent = (currentUser?.username?.[0] || '?').toUpperCase();
    if (name && typeof capitalizeName === 'function') name.textContent = capitalizeName(currentUser?.username || '\u2014');
    else if (name) name.textContent = currentUser?.username || '\u2014';
    if (role && typeof getSectorBadge === 'function') role.innerHTML = getSectorBadge(currentUser);

    // Esconder botão "Novo Equipamento" e "Gerenciar tipos" p/ quem não gerencia
    const nb = document.getElementById('infra-btn-novo');
    const gt = document.getElementById('infra-btn-tipos');
    if (nb) nb.style.display = _infraCanManage ? 'inline-flex' : 'none';
    if (gt) gt.style.display = _infraCanManage ? 'inline-flex' : 'none';

    _initInfraListeners();
    openInfraTab('equipamentos');
}

function openInfraTab(tab) {
    document.querySelectorAll('.config-tab').forEach(t =>
        t.classList.toggle('active', t.dataset.tab === tab));
    document.querySelectorAll('.config-panel').forEach(p =>
        p.classList.toggle('active', p.id === 'panel-' + tab));
    if (tab === 'equipamentos') renderInfraEquip();
}

// ── Listeners Firestore ────────────────────────────────────────────────────────
function _initInfraListeners() {
    if (_unsubInfraTipos) { _unsubInfraTipos(); _unsubInfraTipos = null; }
    if (_unsubInfraEquip) { _unsubInfraEquip(); _unsubInfraEquip = null; }
    _unsubInfraTipos = db.collection('infra_tipos').onSnapshot(snap => {
        _infraTipos = snap.docs.map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (a.ordem || 0) - (b.ordem || 0) || (a.nome || '').localeCompare(b.nome || ''));
        _preencherFiltroTipo();
        if (document.getElementById('panel-equipamentos')?.classList.contains('active')) renderInfraEquip();
    }, err => { console.error('[infra_tipos]', err); showNotification('Erro ao carregar tipos.', 'error'); });

    _unsubInfraEquip = db.collection('infra_equipamentos').onSnapshot(snap => {
        _infraEquip = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (document.getElementById('panel-equipamentos')?.classList.contains('active')) renderInfraEquip();
    }, err => { console.error('[infra_equipamentos]', err); showNotification('Erro ao carregar equipamentos.', 'error'); });
}

function _infraTipo(id) { return _infraTipos.find(t => t.id === id) || null; }

function _preencherFiltroTipo() {
    const sel = document.getElementById('infra-filtro-tipo');
    if (!sel) return;
    const atual = sel.value;
    sel.innerHTML = '<option value="">Todos os tipos</option>' +
        _infraTipos.map(t => `<option value="${t.id}">${_infraEsc(t.nome)}</option>`).join('');
    sel.value = atual;
}

// ── Render dos equipamentos ────────────────────────────────────────────────────
function renderInfraEquip() {
    const grid = document.getElementById('infra-equip-grid');
    if (!grid) return;

    if (!_infraTipos.length && !_infraEquip.length) {
        grid.innerHTML = _infraEmptyState(
            'box',
            'Nenhum equipamento ainda',
            _infraCanManage
                ? 'Comece cadastrando os tipos (rack, c\u00e2mera, switch\u2026) e depois adicione os equipamentos.'
                : 'Ainda n\u00e3o h\u00e1 equipamentos cadastrados.'
        );
        return;
    }

    let lista = _infraEquip.slice();
    if (_infraFiltroTipo) lista = lista.filter(e => e.tipoId === _infraFiltroTipo);
    if (_infraBusca) {
        const b = _infraBusca;
        lista = lista.filter(e =>
            (e.identificacao || '').toLowerCase().includes(b) ||
            (e.localizacao || '').toLowerCase().includes(b) ||
            (_infraTipo(e.tipoId)?.nome || '').toLowerCase().includes(b));
    }
    lista.sort((a, b) => (a.identificacao || '').localeCompare(b.identificacao || '', 'pt-BR'));

    if (!lista.length) {
        grid.innerHTML = _infraEmptyState('box', 'Nada encontrado', 'Ajuste a busca ou o filtro de tipo.');
        return;
    }
    grid.innerHTML = lista.map(e => _infraEquipCard(e)).join('');
}

function _infraEmptyState(ico, titulo, msg) {
    return `<div class="infra-empty">
    <div class="infra-empty-ico">${_infraIco(ico, 30)}</div>
    <div class="infra-empty-title">${_infraEsc(titulo)}</div>
    <div class="infra-empty-msg">${_infraEsc(msg)}</div>
  </div>`;
}

function _infraEquipCard(e) {
    const tipo = _infraTipo(e.tipoId);
    const st = _infraStatus(e.status);
    const ico = tipo ? tipo.icone : 'box';
    const acoes = _infraCanManage ? `
    <div class="infra-card-actions">
      <button class="infra-icon-btn" title="Editar" onclick="openInfraEquipForm('${e.id}')">${_infraPencil(14)}</button>
      <button class="infra-icon-btn danger" title="Excluir" onclick="askDeleteInfraEquip('${e.id}')">${_infraTrash(14)}</button>
    </div>` : '';
    const foto = e.fotoUrl ? `<a class="infra-card-foto" href="${_infraEsc(e.fotoUrl)}" target="_blank" rel="noopener" title="Abrir foto">${_infraIco('monitor', 13)} foto</a>` : '';
    return `<div class="infra-card">
    <div class="infra-card-top">
      <div class="infra-card-ico">${_infraIco(ico, 22)}</div>
      <div class="infra-card-head">
        <div class="infra-card-id">${_infraEsc(e.identificacao || '\u2014')}</div>
        <div class="infra-card-tipo">${_infraEsc(tipo?.nome || 'Sem tipo')}</div>
      </div>
      ${acoes}
    </div>
    <div class="infra-card-body">
      <div class="infra-card-line">${_infraIco('radio-tower', 13)}<span>${_infraEsc(e.localizacao || 'Localiza\u00e7\u00e3o n\u00e3o informada')}</span></div>
      ${e.observacoes ? `<div class="infra-card-line obs">${_infraEsc(e.observacoes)}</div>` : ''}
    </div>
    <div class="infra-card-foot">
      <span class="infra-status-badge" style="--st:${st.cor};">${st.label}</span>
      ${foto}
    </div>
  </div>`;
}

function filterInfraEquip(v) { _infraBusca = (v || '').trim().toLowerCase(); renderInfraEquip(); }
function setInfraFiltroTipo(v) { _infraFiltroTipo = v || ''; renderInfraEquip(); }

// ── Overlay helper ─────────────────────────────────────────────────────────────
function _infraOverlay(html, opts) {
    opts = opts || {};
    const ov = document.createElement('div');
    ov.className = 'infra-overlay';
    ov.innerHTML = `<div class="infra-modal" style="${opts.width ? 'width:' + opts.width + ';' : ''}">${html}</div>`;
    document.body.appendChild(ov);
    const close = () => ov.remove();
    ov.addEventListener('mousedown', ev => { if (ev.target === ov && !opts.noBackdropClose) close(); });
    requestAnimationFrame(() => ov.classList.add('show'));
    return { ov, close };
}

// ── Formulário de Equipamento ──────────────────────────────────────────────────
function openInfraEquipForm(id) {
    if (!_infraCanManage) return;
    if (!_infraTipos.length) {
        showNotification('Cadastre ao menos um tipo antes (Gerenciar tipos).', 'warn');
        return openInfraTiposModal();
    }
    _infraEquipEditId = id || null;
    const e = id ? _infraEquip.find(x => x.id === id) : null;
    const tipoOpts = _infraTipos.map(t =>
        `<option value="${t.id}" ${e && e.tipoId === t.id ? 'selected' : ''}>${_infraEsc(t.nome)}</option>`).join('');
    const stOpts = INFRA_STATUS.map(s =>
        `<option value="${s.key}" ${(e?.status || 'ativo') === s.key ? 'selected' : ''}>${s.label}</option>`).join('');

    const html = `
    <div class="infra-modal-head">
      <div class="infra-modal-title">${id ? 'Editar equipamento' : 'Novo equipamento'}</div>
      <button class="infra-x" onclick="_infraCloseTop()">\u00d7</button>
    </div>
    <div class="infra-modal-body">
      <label class="infra-lbl">Tipo</label>
      <select id="infra-f-tipo" class="infra-inp">${tipoOpts}</select>

      <label class="infra-lbl">Identifica\u00e7\u00e3o</label>
      <input id="infra-f-id" class="infra-inp" type="text" maxlength="80" placeholder="Ex.: Switch SW-ADM-01" value="${_infraEsc(e?.identificacao || '')}">

      <label class="infra-lbl">Localiza\u00e7\u00e3o</label>
      <input id="infra-f-loc" class="infra-inp" type="text" maxlength="120" placeholder="Ex.: Rack ADM \u2014 U12" value="${_infraEsc(e?.localizacao || '')}">

      <label class="infra-lbl">Status</label>
      <select id="infra-f-status" class="infra-inp">${stOpts}</select>

      <label class="infra-lbl">Foto <span class="infra-lbl-opt">(opcional \u2014 link/URL por ora)</span></label>
      <input id="infra-f-foto" class="infra-inp" type="url" placeholder="https://\u2026" value="${_infraEsc(e?.fotoUrl || '')}">

      <label class="infra-lbl">Observa\u00e7\u00f5es</label>
      <textarea id="infra-f-obs" class="infra-inp" rows="3" maxlength="500" placeholder="Notas, IP, patrim\u00f4nio\u2026">${_infraEsc(e?.observacoes || '')}</textarea>
    </div>
    <div class="infra-modal-foot">
      <button class="btn-secondary" onclick="_infraTryCloseEquipForm()">Cancelar</button>
      <button class="btn-primary" onclick="saveInfraEquip()">${id ? 'Salvar' : 'Cadastrar'}</button>
    </div>`;
    const { ov, close } = _infraOverlay(html, { width: 'min(480px,94vw)', noBackdropClose: true });
    _infraEquipFormOv = ov; _infraEquipFormClose = close;
    _infraEquipDirty = false;
    ov.querySelectorAll('.infra-inp').forEach(el => el.addEventListener('input', () => { _infraEquipDirty = true; }));
    setTimeout(() => ov.querySelector('#infra-f-id')?.focus(), 40);
}
let _infraEquipFormOv = null, _infraEquipFormClose = null, _infraEquipDirty = false;

function _infraCloseTop() { _infraTryCloseEquipForm(); }
function _infraTryCloseEquipForm() {
    if (!_infraEquipFormClose) return;
    if (_infraEquipDirty) {
        _infraConfirm('Descartar altera\u00e7\u00f5es?', 'Voc\u00ea tem altera\u00e7\u00f5es n\u00e3o salvas neste equipamento.', { ok: 'Descartar', danger: true })
            .then(ok => { if (ok) { _infraEquipFormClose(); _infraEquipFormClose = null; _infraEquipFormOv = null; } });
    } else { _infraEquipFormClose(); _infraEquipFormClose = null; _infraEquipFormOv = null; }
}

async function saveInfraEquip() {
    const tipoId = document.getElementById('infra-f-tipo')?.value || '';
    const identificacao = (document.getElementById('infra-f-id')?.value || '').trim();
    const localizacao = (document.getElementById('infra-f-loc')?.value || '').trim();
    const status = document.getElementById('infra-f-status')?.value || 'ativo';
    const fotoUrl = (document.getElementById('infra-f-foto')?.value || '').trim();
    const observacoes = (document.getElementById('infra-f-obs')?.value || '').trim();

    if (!tipoId) { showNotification('Selecione um tipo.', 'error'); return; }
    if (!identificacao) { showNotification('Informe a identifica\u00e7\u00e3o.', 'error'); return; }

    const data = { tipoId, identificacao, localizacao, status, fotoUrl, observacoes };
    try {
        if (_infraEquipEditId) {
            await db.collection('infra_equipamentos').doc(_infraEquipEditId).update(data);
            showNotification('Equipamento atualizado! \u2705', 'success');
        } else {
            data.criadoEm = firebase.firestore.FieldValue.serverTimestamp();
            data.criadoPor = currentUser?.username || '';
            await db.collection('infra_equipamentos').add(data);
            showNotification('Equipamento cadastrado! \u2705', 'success');
        }
        _infraEquipDirty = false;
        if (_infraEquipFormClose) { _infraEquipFormClose(); _infraEquipFormClose = null; _infraEquipFormOv = null; }
    } catch (err) {
        console.error('[saveInfraEquip]', err);
        showNotification('Erro ao salvar. Verifique as regras do Firestore.', 'error');
    }
}

function askDeleteInfraEquip(id) {
    if (!_infraCanManage) return;
    const e = _infraEquip.find(x => x.id === id);
    _infraConfirm('Excluir equipamento?', `"${_infraEsc(e?.identificacao || 'este equipamento')}" ser\u00e1 removido permanentemente.`, { ok: 'Excluir', danger: true })
        .then(async ok => {
            if (!ok) return;
            try {
                await db.collection('infra_equipamentos').doc(id).delete();
                showNotification('Equipamento exclu\u00eddo.', 'success');
            } catch (err) { console.error('[delInfraEquip]', err); showNotification('Erro ao excluir.', 'error'); }
        });
}

// ── Gerenciar Tipos ────────────────────────────────────────────────────────────
function openInfraTiposModal() {
    if (!_infraCanManage) return;
    const html = `
    <div class="infra-modal-head">
      <div class="infra-modal-title">Gerenciar tipos</div>
      <button class="infra-x" onclick="_infraCloseTiposModal()">\u00d7</button>
    </div>
    <div class="infra-modal-body">
      <div class="infra-tipos-list" id="infra-tipos-list"></div>
    </div>
    <div class="infra-modal-foot">
      <button class="btn-secondary" onclick="_infraCloseTiposModal()">Fechar</button>
      <button class="btn-primary" onclick="openInfraTipoForm()">+ Novo tipo</button>
    </div>`;
    const { ov, close } = _infraOverlay(html, { width: 'min(460px,94vw)' });
    _infraTiposOv = ov; _infraTiposClose = close;
    renderInfraTiposList();
}
let _infraTiposOv = null, _infraTiposClose = null;
function _infraCloseTiposModal() { if (_infraTiposClose) { _infraTiposClose(); _infraTiposClose = null; _infraTiposOv = null; } }

function renderInfraTiposList() {
    const box = document.getElementById('infra-tipos-list');
    if (!box) return;
    if (!_infraTipos.length) {
        box.innerHTML = `<div class="infra-tipos-empty">Nenhum tipo cadastrado. Crie o primeiro (rack, c\u00e2mera, switch\u2026).</div>`;
        return;
    }
    box.innerHTML = _infraTipos.map(t => {
        const uso = _infraEquip.filter(e => e.tipoId === t.id).length;
        return `<div class="infra-tipo-row">
      <div class="infra-tipo-ico">${_infraIco(t.icone, 18)}</div>
      <div class="infra-tipo-name">${_infraEsc(t.nome)}<span class="infra-tipo-uso">${uso} equip.</span></div>
      <button class="infra-icon-btn" title="Editar" onclick="openInfraTipoForm('${t.id}')">${_infraPencil(14)}</button>
      <button class="infra-icon-btn danger" title="Excluir" onclick="askDeleteInfraTipo('${t.id}')">${_infraTrash(14)}</button>
    </div>`;
    }).join('');
}

function openInfraTipoForm(id) {
    _infraTipoEditId = id || null;
    const t = id ? _infraTipo(id) : null;
    _infraIconePick = t ? (t.icone || 'box') : 'box';
    const html = `
    <div class="infra-modal-head">
      <div class="infra-modal-title">${id ? 'Editar tipo' : 'Novo tipo'}</div>
      <button class="infra-x" onclick="_infraCloseTipoForm()">\u00d7</button>
    </div>
    <div class="infra-modal-body">
      <label class="infra-lbl">Nome do tipo</label>
      <input id="infra-tf-nome" class="infra-inp" type="text" maxlength="40" placeholder="Ex.: Switch" value="${_infraEsc(t?.nome || '')}">
      <label class="infra-lbl">\u00cdcone</label>
      <button type="button" class="infra-icone-btn" id="infra-tf-icone-btn" onclick="openInfraIconPicker()">
        <span id="infra-tf-icone-prev">${_infraIco(_infraIconePick, 20)}</span>
        <span>Escolher \u00edcone</span>
      </button>
    </div>
    <div class="infra-modal-foot">
      <button class="btn-secondary" onclick="_infraCloseTipoForm()">Cancelar</button>
      <button class="btn-primary" onclick="saveInfraTipo()">${id ? 'Salvar' : 'Criar'}</button>
    </div>`;
    const { ov, close } = _infraOverlay(html, { width: 'min(400px,94vw)', noBackdropClose: true });
    _infraTipoFormOv = ov; _infraTipoFormClose = close;
    setTimeout(() => ov.querySelector('#infra-tf-nome')?.focus(), 40);
}
let _infraTipoFormOv = null, _infraTipoFormClose = null, _infraIconePick = 'box';
function _infraCloseTipoForm() { if (_infraTipoFormClose) { _infraTipoFormClose(); _infraTipoFormClose = null; _infraTipoFormOv = null; } }

async function saveInfraTipo() {
    const nome = (document.getElementById('infra-tf-nome')?.value || '').trim();
    if (!nome) { showNotification('Informe o nome do tipo.', 'error'); return; }
    const icone = _infraIconePick || 'box';
    try {
        if (_infraTipoEditId) {
            await db.collection('infra_tipos').doc(_infraTipoEditId).update({ nome, icone });
            showNotification('Tipo atualizado! \u2705', 'success');
        } else {
            const ordem = _infraTipos.length ? Math.max(..._infraTipos.map(t => t.ordem || 0)) + 1 : 0;
            await db.collection('infra_tipos').add({ nome, icone, ordem, criadoEm: firebase.firestore.FieldValue.serverTimestamp() });
            showNotification('Tipo criado! \u2705', 'success');
        }
        _infraCloseTipoForm();
        setTimeout(renderInfraTiposList, 60);
    } catch (err) { console.error('[saveInfraTipo]', err); showNotification('Erro ao salvar tipo. Verifique as regras do Firestore.', 'error'); }
}

function askDeleteInfraTipo(id) {
    const uso = _infraEquip.filter(e => e.tipoId === id).length;
    if (uso > 0) {
        _infraConfirm('Tipo em uso', `Existem ${uso} equipamento(s) usando este tipo. Reatribua ou exclua-os antes de remover o tipo.`, { ok: 'Entendi', soloOk: true });
        return;
    }
    const t = _infraTipo(id);
    _infraConfirm('Excluir tipo?', `O tipo "${_infraEsc(t?.nome || '')}" ser\u00e1 removido.`, { ok: 'Excluir', danger: true })
        .then(async ok => {
            if (!ok) return;
            try {
                await db.collection('infra_tipos').doc(id).delete();
                showNotification('Tipo exclu\u00eddo.', 'success');
                setTimeout(renderInfraTiposList, 60);
            } catch (err) { console.error('[delInfraTipo]', err); showNotification('Erro ao excluir tipo.', 'error'); }
        });
}

// ── Seletor de ícone Lucide (curado) ───────────────────────────────────────────
function openInfraIconPicker() {
    const nomes = Object.keys(INFRA_ICONES);
    const grid = nomes.map(n =>
        `<button type="button" class="infra-icon-cell ${n === _infraIconePick ? 'sel' : ''}" data-ico="${n}" title="${n}" onclick="pickInfraIcon('${n}')">${_infraIco(n, 22)}</button>`).join('');
    const html = `
    <div class="infra-modal-head">
      <div class="infra-modal-title">Escolher \u00edcone</div>
      <button class="infra-x" onclick="_infraCloseIconPicker()">\u00d7</button>
    </div>
    <div class="infra-modal-body">
      <input id="infra-icon-search" class="infra-inp" type="text" placeholder="Buscar (server, camera, switch\u2026)" oninput="_infraFilterIcons(this.value)">
      <div class="infra-icon-grid" id="infra-icon-grid">${grid}</div>
      <div class="infra-icon-hint">A lista \u00e9 curada para infraestrutura. Precisa de outro \u00edcone? Me avisa que eu amplio. \u{1F604}</div>
    </div>`;
    const { ov, close } = _infraOverlay(html, { width: 'min(420px,94vw)', noBackdropClose: true });
    _infraIconOv = ov; _infraIconClose = close;
}
let _infraIconOv = null, _infraIconClose = null;
function _infraCloseIconPicker() { if (_infraIconClose) { _infraIconClose(); _infraIconClose = null; _infraIconOv = null; } }
function _infraFilterIcons(q) {
    q = (q || '').trim().toLowerCase();
    document.querySelectorAll('#infra-icon-grid .infra-icon-cell').forEach(c => {
        c.style.display = !q || c.dataset.ico.includes(q) ? '' : 'none';
    });
}
function pickInfraIcon(n) {
    _infraIconePick = n;
    const prev = document.getElementById('infra-tf-icone-prev');
    if (prev) prev.innerHTML = _infraIco(n, 20);
    _infraCloseIconPicker();
}

// ── Ícones de ação (lápis/lixeira) ─────────────────────────────────────────────
function _infraPencil(s) { s = s || 14; return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`; }
function _infraTrash(s) { s = s || 14; return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>`; }

// ── Confirmação genérica (modal custom, nunca confirm nativo) ──────────────────
function _infraConfirm(title, msg, opts) {
    opts = opts || {};
    return new Promise(resolve => {
        const okLabel = opts.ok || 'Confirmar';
        const danger = !!opts.danger;
        const solo = !!opts.soloOk;
        const html = `
      <div class="infra-modal-head">
        <div class="infra-modal-title">${_infraEsc(title)}</div>
      </div>
      <div class="infra-modal-body"><p class="infra-confirm-msg">${_infraEsc(msg)}</p></div>
      <div class="infra-modal-foot">
        ${solo ? '' : '<button class="btn-secondary" id="_infra-cf-no">Cancelar</button>'}
        <button class="${danger ? 'btn-danger' : 'btn-primary'}" id="_infra-cf-yes">${_infraEsc(okLabel)}</button>
      </div>`;
        const { ov, close } = _infraOverlay(html, { width: 'min(400px,92vw)', noBackdropClose: true });
        ov.querySelector('#_infra-cf-yes').onclick = () => { close(); resolve(true); };
        const no = ov.querySelector('#_infra-cf-no');
        if (no) no.onclick = () => { close(); resolve(false); };
    });
} e