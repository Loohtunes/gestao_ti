// ===== ROTINAS v2 =====

function toggleMenuSidebar() {
  const s = document.getElementById('chamados-sidebar'), i = document.getElementById('sidebar-toggle-icon');
  if (!s) return;
  const c = s.classList.toggle('collapsed');
  if (i) i.textContent = c ? '›' : '‹';
  localStorage.setItem('chamados-sidebar-collapsed', c ? '1' : '0');
}

let _rotinaTab = 'checklist', _subTab = 'servidor';
let _impressoras = [], _dvrs = [], _cameras = [], _servidores = [];
let _historico = [], _histFiltroModulo = 'todos', _histFiltroMes = '';
let _cftvStatus = {}, _ultimosReg = {}, _histExp = {};

// ── Abas ────────────────────────────────────────────────────────────────────
function openRotinaTab(tab) {
  _rotinaTab = tab;
  document.querySelectorAll('.config-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.config-panel').forEach(p => p.classList.toggle('active', p.id === 'panel-' + tab));
  if (tab === 'historico') loadHistorico();
}
function openChecklistSubTab(sub) {
  _subTab = sub;
  document.querySelectorAll('.rotinas-subtab').forEach(b => b.classList.toggle('active', b.dataset.sub === sub));
  document.querySelectorAll('.rotinas-subpanel').forEach(p => p.classList.toggle('active', p.id === 'subpanel-' + sub));
}

// ── Config ───────────────────────────────────────────────────────────────────
async function loadRotinasConfig() {
  try {
    const [i, dv, c, s] = await Promise.all([
      db.collection('rotinas_config').doc('impressoras').get(),
      db.collection('rotinas_config').doc('dvrs').get(),
      db.collection('rotinas_config').doc('cameras').get(),
      db.collection('rotinas_config').doc('servidores').get(),
    ]);
    _impressoras = i.exists ? (i.data().lista || []) : [];
    _dvrs = dv.exists ? (dv.data().lista || []) : [];
    _cameras = c.exists ? (c.data().lista || []) : [];
    _servidores = s.exists ? (s.data().lista || []) : [];
  } catch (e) { _impressoras = []; _dvrs = []; _cameras = []; _servidores = []; }
}

// ── Seed ─────────────────────────────────────────────────────────────────────
async function seedRotinasDados() {
  const [iSnap, dSnap] = await Promise.all([
    db.collection('rotinas_config').doc('impressoras').get(),
    db.collection('rotinas_config').doc('dvrs').get(),
  ]);
  if (iSnap.exists && dSnap.exists) return;

  if (!iSnap.exists) {
    const lista = [
      { id: 'imp01', tipo: 'COLOR', marca: 'Brother', modelo: 'MFC-9330CDW', ip: '205', departamento: 'Engenharia', sn: 'U63480B4J348209', ativo: 'ACATV75577' },
      { id: 'imp02', tipo: 'COLOR', marca: 'HP', modelo: 'M254DW', ip: '209', departamento: 'Comercial', sn: 'BRBSL8R2WB', ativo: 'MAATV75857' },
      { id: 'imp03', tipo: 'MONO', marca: 'Brother', modelo: 'DCP-8152DN', ip: '203', departamento: 'Orçamento', sn: 'U63263K4N892137', ativo: 'MAATV75462' },
      { id: 'imp04', tipo: 'MONO', marca: 'Brother', modelo: 'DCP-8112DN', ip: '217', departamento: 'Backup', sn: 'U63262E4N750438', ativo: 'MAATV75645' },
      { id: 'imp05', tipo: 'MONO', marca: 'Brother', modelo: 'HL-5452DN', ip: '218', departamento: 'Backup', sn: 'U63257F5N153846', ativo: 'ACATV75906' },
      { id: 'imp06', tipo: 'MONO', marca: 'Brother', modelo: 'HL-6182DW', ip: '202', departamento: 'Diretoria', sn: 'U63260H4N792261', ativo: 'MAATV75907' },
      { id: 'imp07', tipo: 'MONO', marca: 'Brother', modelo: 'MFC-7460DN', ip: '59', departamento: 'Comercial', sn: 'U62701E3N519283', ativo: 'ACATV75524' },
      { id: 'imp08', tipo: 'MONO', marca: 'Samsung', modelo: 'SCX-5637FR', ip: '201', departamento: 'Compras', sn: 'Z5W1BAIC201643R', ativo: 'MAATV75705' },
      { id: 'imp09', tipo: 'MONO', marca: 'Samsung', modelo: 'SCX-5637FR', ip: '253', departamento: 'Produção', sn: 'Z5W1BJAD100005D', ativo: 'ACATV75670' },
      { id: 'imp10', tipo: 'MONO', marca: 'Samsung', modelo: 'SCX-5637FR', ip: '215', departamento: 'Contábil', sn: 'Z5W1BJAC3000ZJL', ativo: 'MAATV75671' },
      { id: 'imp11', tipo: 'MONO', marca: 'Samsung', modelo: 'SCX-5637FR', ip: '249', departamento: 'RH', sn: 'Z5W1BJDC7000WXJ', ativo: 'MAATV75696' },
      { id: 'imp12', tipo: 'MONO', marca: 'Brother', modelo: 'DCP-8157DN', ip: 'USB', departamento: 'Medicina do Trabalho', sn: 'U63264-M2N328493', ativo: 'ACATV75548' },
      { id: 'imp13', tipo: 'MONO', marca: 'Samsung', modelo: 'SCX-5637FR', ip: '226', departamento: 'Financeiro', sn: 'Z5W1BAHC200050X', ativo: 'MAATV75694' },
      { id: 'imp14', tipo: 'MONO', marca: 'Samsung', modelo: 'SCX-5637FR', ip: '220', departamento: 'Produção', sn: 'Z5W1BJAC9000ZFL', ativo: 'ACATV75785' },
      { id: 'imp15', tipo: 'MONO', marca: 'Samsung', modelo: 'SL-M4070FR', ip: '230', departamento: 'Seg. do Trabalho', sn: 'ZER4BQAF6001WCZ', ativo: 'MAATV75914' },
    ];
    await db.collection('rotinas_config').doc('impressoras').set({ lista });
    _impressoras = lista;
  }

  if (!dSnap.exists) {
    const dvrs = [
      { id: 'dvr1', nome: 'DVR 1 (ADM)', rack: 'ADM' },
      { id: 'dvr2', nome: 'DVR 2 (Perímetro)', rack: '' },
      { id: 'dvr3', nome: 'DVR 3 (Produção Setores)', rack: '' },
      { id: 'dvr4', nome: 'DVR 4 (Produção)', rack: '' },
      { id: 'dvr5', nome: 'DVR 5 (Celular/Torres)', rack: '' },
    ];
    const cameras = [
      { id: 'c101', dvrId: 'dvr1', nome: 'Compras', canal: 1, rack: 'ADM' },
      { id: 'c102', dvrId: 'dvr1', nome: 'Entrada ADM', canal: 2, rack: 'ADM' },
      { id: 'c103', dvrId: 'dvr1', nome: 'PCP (Corredor)', canal: 3, rack: 'ADM' },
      { id: 'c104', dvrId: 'dvr1', nome: 'PCP (Produção)', canal: 4, rack: 'ADM' },
      { id: 'c105', dvrId: 'dvr1', nome: 'Orçamento (Corredor)', canal: 5, rack: 'ADM' },
      { id: 'c106', dvrId: 'dvr1', nome: 'Orçamento (Rampa)', canal: 6, rack: 'ADM' },
      { id: 'c107', dvrId: 'dvr1', nome: 'Comercial', canal: 7, rack: 'ADM' },
      { id: 'c108', dvrId: 'dvr1', nome: 'Financeiro', canal: 8, rack: 'ADM' },
      { id: 'c109', dvrId: 'dvr1', nome: 'Engenharia (Corredor)', canal: 9, rack: 'ADM' },
      { id: 'c110', dvrId: 'dvr1', nome: 'Engenharia (Produção)', canal: 10, rack: 'ADM' },
      { id: 'c111', dvrId: 'dvr1', nome: 'Copa', canal: 11, rack: 'ADM' },
      { id: 'c112', dvrId: 'dvr1', nome: 'Arquivo Morto', canal: 12, rack: 'ADM' },
      { id: 'c113', dvrId: 'dvr1', nome: 'Recepção', canal: 13, rack: 'ADM' },
      { id: 'c114', dvrId: 'dvr1', nome: 'Contabilidade', canal: 14, rack: 'ADM' },
      { id: 'c115', dvrId: 'dvr1', nome: 'RH', canal: 15, rack: 'ADM' },
      { id: 'c116', dvrId: 'dvr1', nome: 'RH Frente', canal: 16, rack: 'ADM' },
      { id: 'c117', dvrId: 'dvr1', nome: 'Refeitório (Porta)', canal: 17, rack: 'ADM' },
      { id: 'c118', dvrId: 'dvr1', nome: 'Refeitório (Cozinha)', canal: 18, rack: 'ADM' },
      { id: 'c119', dvrId: 'dvr1', nome: 'Cozinha', canal: 19, rack: 'ADM' },
      { id: 'c120', dvrId: 'dvr1', nome: 'Escada/Sala Treinamento', canal: 20, rack: 'ADM' },
      { id: 'c121', dvrId: 'dvr1', nome: 'Corredor 1 (CAM 1)', canal: 21, rack: 'ADM' },
      { id: 'c122', dvrId: 'dvr1', nome: 'Corredor 1 (CAM 2)', canal: 22, rack: 'ADM' },
      { id: 'c123', dvrId: 'dvr1', nome: 'Corredor 1 (CAM 3)', canal: 23, rack: 'ADM' },
      { id: 'c124', dvrId: 'dvr1', nome: 'Corredor 1 (CAM 4)', canal: 24, rack: 'ADM' },
      { id: 'c125', dvrId: 'dvr1', nome: 'Corredor 2 (CAM 1)', canal: 25, rack: 'ADM' },
      { id: 'c126', dvrId: 'dvr1', nome: 'Corredor 2 (CAM 2)', canal: 26, rack: 'ADM' },
      { id: 'c127', dvrId: 'dvr1', nome: 'Corredor 2 (CAM 3)', canal: 27, rack: 'ADM' },
      { id: 'c128', dvrId: 'dvr1', nome: 'Corredor 2 (CAM 4)', canal: 28, rack: 'ADM' },
      { id: 'c129', dvrId: 'dvr1', nome: 'Corredor 3 (CAM 1)', canal: 29, rack: 'ADM' },
      { id: 'c130', dvrId: 'dvr1', nome: 'Corredor 3 (CAM 2)', canal: 30, rack: 'ADM' },
      { id: 'c131', dvrId: 'dvr1', nome: 'Corredor 3 (CAM 3)', canal: 31, rack: 'ADM' },
      { id: 'c132', dvrId: 'dvr1', nome: 'Corredor 3 (CAM 4)', canal: 32, rack: 'ADM' },
      { id: 'c201', dvrId: 'dvr2', nome: 'Câmera 17', canal: 1, rack: '01' },
      { id: 'c202', dvrId: 'dvr2', nome: 'Câmera 16', canal: 2, rack: '01' },
      { id: 'c203', dvrId: 'dvr2', nome: 'Câmera 15', canal: 3, rack: '05' },
      { id: 'c204', dvrId: 'dvr2', nome: 'Câmera 14', canal: 4, rack: '03' },
      { id: 'c205', dvrId: 'dvr2', nome: 'Câmera 13', canal: 5, rack: '03' },
      { id: 'c206', dvrId: 'dvr2', nome: 'Estoque', canal: 6, rack: '06' },
      { id: 'c207', dvrId: 'dvr2', nome: 'Câmera 12', canal: 7, rack: '06' },
      { id: 'c208', dvrId: 'dvr2', nome: 'Câmera 11', canal: 8, rack: '06' },
      { id: 'c209', dvrId: 'dvr2', nome: 'Câmera 6', canal: 9, rack: '12' },
      { id: 'c210', dvrId: 'dvr2', nome: 'Câmera 5', canal: 10, rack: '13' },
      { id: 'c211', dvrId: 'dvr2', nome: 'Câmera 4', canal: 11, rack: '13' },
      { id: 'c212', dvrId: 'dvr2', nome: 'Câmera 1 (Estrad. Lateral)', canal: 12, rack: '08' },
      { id: 'c213', dvrId: 'dvr2', nome: 'Câmera 19', canal: 13, rack: '09' },
      { id: 'c214', dvrId: 'dvr2', nome: 'Guarita', canal: 14, rack: '09' },
      { id: 'c215', dvrId: 'dvr2', nome: 'Rampa Saída Fábrica', canal: 15, rack: '10' },
      { id: 'c216', dvrId: 'dvr2', nome: 'Rampa Entrada Fábrica', canal: 16, rack: '10' },
      { id: 'c301', dvrId: 'dvr3', nome: 'Seg. do Trabalho', canal: 1, rack: 'ADM' },
      { id: 'c302', dvrId: 'dvr3', nome: 'Almoxarifado (Interno)', canal: 2, rack: 'ADM' },
      { id: 'c303', dvrId: 'dvr3', nome: 'Almoxarifado (Frente)', canal: 3, rack: 'ADM' },
      { id: 'c304', dvrId: 'dvr3', nome: 'Almoxarifado Fundo', canal: 4, rack: '08' },
      { id: 'c305', dvrId: 'dvr3', nome: 'Central de concreto Perímetro', canal: 5, rack: '11' },
      { id: 'c306', dvrId: 'dvr3', nome: 'Sala central de concreto', canal: 6, rack: '11' },
      { id: 'c307', dvrId: 'dvr3', nome: 'Laboratório', canal: 7, rack: '11' },
      { id: 'c308', dvrId: 'dvr3', nome: 'Mecanica Diesel', canal: 8, rack: '12' },
      { id: 'c309', dvrId: 'dvr3', nome: 'Borracharia', canal: 9, rack: '12' },
      { id: 'c310', dvrId: 'dvr3', nome: 'Borracharia Ext.', canal: 10, rack: '12' },
      { id: 'c311', dvrId: 'dvr3', nome: 'Elétrica', canal: 11, rack: '08' },
      { id: 'c312', dvrId: 'dvr3', nome: 'Mecânica Interno', canal: 12, rack: '08' },
      { id: 'c313', dvrId: 'dvr3', nome: 'Mecânica Externo', canal: 13, rack: '08' },
      { id: 'c314', dvrId: 'dvr3', nome: 'Almox. Fundo Ext.', canal: 14, rack: '08' },
      { id: 'c315', dvrId: 'dvr3', nome: 'Calderaria Ext.', canal: 15, rack: '08' },
      { id: 'c316', dvrId: 'dvr3', nome: 'Calderaria', canal: 16, rack: '08' },
      { id: 'c401', dvrId: 'dvr4', nome: 'Camera 2 (estribadeira)', canal: 1, rack: '01' },
      { id: 'c402', dvrId: 'dvr4', nome: 'Camera 1 (Armação)', canal: 2, rack: '05' },
      { id: 'c403', dvrId: 'dvr4', nome: 'Camera 4 (Armação)', canal: 3, rack: '05' },
      { id: 'c404', dvrId: 'dvr4', nome: 'Camera 5 (Armação)', canal: 4, rack: '05' },
      { id: 'c405', dvrId: 'dvr4', nome: 'Camera 8 (Carpintaria)', canal: 5, rack: '05' },
      { id: 'c406', dvrId: 'dvr4', nome: 'Camera 9', canal: 6, rack: '05' },
      { id: 'c407', dvrId: 'dvr4', nome: 'Camera 12', canal: 7, rack: '05' },
      { id: 'c408', dvrId: 'dvr4', nome: 'Camera 13', canal: 8, rack: '05' },
      { id: 'c409', dvrId: 'dvr4', nome: 'Camera 16', canal: 9, rack: '03' },
      { id: 'c410', dvrId: 'dvr4', nome: 'Camera 17', canal: 10, rack: '03' },
      { id: 'c411', dvrId: 'dvr4', nome: 'Camera 20', canal: 11, rack: '03' },
      { id: 'c412', dvrId: 'dvr4', nome: 'Camera 22', canal: 12, rack: '03' },
      { id: 'c413', dvrId: 'dvr4', nome: 'Camera 23', canal: 13, rack: '03' },
      { id: 'c414', dvrId: 'dvr4', nome: 'Camera 26', canal: 14, rack: '03' },
      { id: 'c415', dvrId: 'dvr4', nome: 'Camera 27', canal: 15, rack: '06' },
      { id: 'c416', dvrId: 'dvr4', nome: 'Camera 3', canal: 16, rack: '01' },
      { id: 'c417', dvrId: 'dvr4', nome: 'Camera 6', canal: 17, rack: '01' },
      { id: 'c418', dvrId: 'dvr4', nome: 'Camera 7', canal: 18, rack: '01' },
      { id: 'c419', dvrId: 'dvr4', nome: 'Camera 10', canal: 19, rack: '01' },
      { id: 'c420', dvrId: 'dvr4', nome: 'Camera 11', canal: 20, rack: '02' },
      { id: 'c421', dvrId: 'dvr4', nome: 'Camera 14', canal: 21, rack: '02' },
      { id: 'c422', dvrId: 'dvr4', nome: 'Camera 15', canal: 22, rack: '02' },
      { id: 'c423', dvrId: 'dvr4', nome: 'Camera 18', canal: 23, rack: '02' },
      { id: 'c424', dvrId: 'dvr4', nome: 'Camera 19', canal: 24, rack: '02' },
      { id: 'c425', dvrId: 'dvr4', nome: 'Camera 21', canal: 25, rack: '02' },
      { id: 'c426', dvrId: 'dvr4', nome: 'Camera 24', canal: 26, rack: '04' },
      { id: 'c427', dvrId: 'dvr4', nome: 'Camera 25', canal: 27, rack: '04' },
      { id: 'c428', dvrId: 'dvr4', nome: 'Camera 28', canal: 28, rack: '04' },
      { id: 'c429', dvrId: 'dvr4', nome: 'Camera 30', canal: 29, rack: '04' },
      { id: 'c430', dvrId: 'dvr4', nome: 'Camera 31', canal: 30, rack: '04' },
      { id: 'c431', dvrId: 'dvr4', nome: 'Camera 32', canal: 31, rack: '04' },
      { id: 'c432', dvrId: 'dvr4', nome: 'Camera 33', canal: 32, rack: '02' },
      { id: 'c501', dvrId: 'dvr5', nome: 'Câmera 38', canal: 1, rack: '10' },
      { id: 'c502', dvrId: 'dvr5', nome: 'Câmera 39', canal: 2, rack: '02' },
      { id: 'c503', dvrId: 'dvr5', nome: 'Câmera 40', canal: 3, rack: '01' },
      { id: 'c504', dvrId: 'dvr5', nome: 'Câmera 41', canal: 4, rack: 'ADM' },
      { id: 'c505', dvrId: 'dvr5', nome: 'Câmera 42', canal: 5, rack: '10' },
      { id: 'c506', dvrId: 'dvr5', nome: 'Câmera 07', canal: 6, rack: '10' },
      { id: 'c507', dvrId: 'dvr5', nome: 'Câmera 08', canal: 7, rack: '10' },
      { id: 'c508', dvrId: 'dvr5', nome: 'Câmera 09', canal: 8, rack: '10' },
      { id: 'c509', dvrId: 'dvr5', nome: 'Câmera 10', canal: 9, rack: '07' },
      { id: 'c510', dvrId: 'dvr5', nome: 'Câmera 20', canal: 10, rack: '07' },
      { id: 'c511', dvrId: 'dvr5', nome: 'Câmera 21', canal: 11, rack: '07' },
      { id: 'c512', dvrId: 'dvr5', nome: 'Câmera 22', canal: 12, rack: '07' },
      { id: 'c513', dvrId: 'dvr5', nome: 'Câmera 02', canal: 13, rack: '13' },
      { id: 'c514', dvrId: 'dvr5', nome: 'Câmera 03', canal: 14, rack: '13' },
      { id: 'c515', dvrId: 'dvr5', nome: 'Câmera 04', canal: 15, rack: '09' },
      { id: 'c516', dvrId: 'dvr5', nome: 'Câmera -', canal: 16, rack: '09' },
    ];
    await Promise.all([
      db.collection('rotinas_config').doc('dvrs').set({ lista: dvrs }),
      db.collection('rotinas_config').doc('cameras').set({ lista: cameras }),
    ]);
    _dvrs = dvrs; _cameras = cameras;
  }
}

// ── Servidor ──────────────────────────────────────────────────────────────────
function _fmtUnidade(val, unidade) {
  return `${val} ${unidade || 'GB'}`;
}

function renderServidoresChecklist() {
  const el = document.getElementById('servidores-grid');
  if (!el) return;
  if (!_servidores.length) {
    el.innerHTML = `<div class="rotinas-empty" style="flex:1;justify-content:center;">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect width="20" height="8" x="2" y="2" rx="2"/><rect width="20" height="8" x="2" y="14" rx="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>
      <span>Nenhum servidor configurado.</span>
      ${currentUser?.isSuperAdmin ? '<span style="font-size:0.75rem;">Configure em <strong>Configurações → Administração</strong>.</span>' : ''}
    </div>`;
    return;
  }
  el.innerHTML = _servidores.map(srv => {
    const discos = srv.discos?.length ? srv.discos : [{ id: 'disco0', nome: 'C:', total: srv.totalGB || 0, unidade: 'GB' }];
    return `
    <div class="rotinas-form-card" style="max-width:360px;width:100%;">
      <div class="rotinas-form-card-title">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="8" x="2" y="2" rx="2"/><rect width="20" height="8" x="2" y="14" rx="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>
        ${srv.nome}
      </div>
      ${discos.map(disco => `
        <div class="srv-disco-block">
          <div class="srv-disco-label">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="12" rx="10" ry="5"/><path d="M2 12c0 2.76 4.48 5 10 5s10-2.24 10-5"/><path d="M2 7c0 2.76 4.48 5 10 5s10-2.24 10-5"/></svg>
            Disco ${disco.nome}
            <span style="color:var(--muted);font-size:0.65rem;">Total: ${_fmtUnidade(disco.total, disco.unidade)}</span>
          </div>
          <div class="rotinas-bar-input-row">
            <input type="number" id="srv-disp-${srv.id}-${disco.id}"
              min="0" placeholder="0"
              oninput="updateServidorBar('${srv.id}','${disco.id}',${disco.total},'${disco.unidade || 'GB'}')">
            <select id="srv-disp-un-${srv.id}-${disco.id}"
              onchange="updateServidorBar('${srv.id}','${disco.id}',${disco.total},'${disco.unidade || 'GB'}')"
              style="padding:0.25rem 0.35rem;font-size:0.72rem;font-family:var(--font-mono);background:var(--surface2);border:1px solid var(--border2);border-radius:5px;color:var(--text);outline:none;flex-shrink:0;">
              <option value="GB">GB</option>
              <option value="TB">TB</option>
            </select>
            <div class="rotinas-bar-track"><div class="rotinas-bar-fill" id="srv-bar-${srv.id}-${disco.id}" style="width:0%;background:#22c55e;"></div></div>
            <span class="rotinas-bar-pct" id="srv-pct-${srv.id}-${disco.id}">0%</span>
          </div>
        </div>`).join('')}
      <div class="form-group" style="margin-top:0.85rem;">
        <label class="form-label">Observações</label>
        <textarea id="srv-obs-${srv.id}" class="form-input" rows="2" placeholder="Alertas, anomalias..." style="resize:none;"></textarea>
      </div>
    </div>`;
  }).join('');
}

function _toGB(val, unidade) {
  return unidade === 'TB' ? val * 1024 : val;
}

function updateServidorBar(srvId, discoId, totalRaw, totalUnidade) {
  const disp = parseFloat(document.getElementById(`srv-disp-${srvId}-${discoId}`)?.value) || 0;
  const dispUn = document.getElementById(`srv-disp-un-${srvId}-${discoId}`)?.value || totalUnidade || 'GB';
  const totalGB = _toGB(totalRaw, totalUnidade || 'GB');
  const dispGB = _toGB(disp, dispUn);
  const pct = totalGB > 0 ? Math.round(((totalGB - dispGB) / totalGB) * 100) : 0;
  const clamped = Math.max(0, Math.min(100, pct));
  const bar = document.getElementById(`srv-bar-${srvId}-${discoId}`);
  const pctEl = document.getElementById(`srv-pct-${srvId}-${discoId}`);
  if (bar) { bar.style.width = clamped + '%'; bar.style.backgroundColor = clamped >= 90 ? '#ef4444' : clamped >= 75 ? '#f59e0b' : '#22c55e'; }
  if (pctEl) pctEl.textContent = clamped + '%';
}

async function saveServidorRegisto() {
  if (!_servidores.length) { showRotinasToast('Nenhum servidor configurado.', 'error'); return; }
  const btn = document.getElementById('btn-save-servidor');
  if (btn) { btn.disabled = true; btn.textContent = 'Salvando...'; }
  try {
    const leituras = _servidores.map(srv => {
      const discos = srv.discos?.length ? srv.discos : [{ id: 'disco0', nome: 'C:', total: srv.totalGB || 0, unidade: 'GB' }];
      const discoLeituras = discos.map(disco => {
        const disp = parseFloat(document.getElementById(`srv-disp-${srv.id}-${disco.id}`)?.value) || 0;
        const dispUn = document.getElementById(`srv-disp-un-${srv.id}-${disco.id}`)?.value || disco.unidade || 'GB';
        const totalGB = _toGB(disco.total, disco.unidade || 'GB');
        const dispGB = _toGB(disp, dispUn);
        const usadoGB = Math.max(0, totalGB - dispGB);
        const pct = totalGB > 0 ? Math.round((usadoGB / totalGB) * 100) : 0;
        return {
          discoId: disco.id, nome: disco.nome,
          total: disco.total, unidade: disco.unidade || 'GB',
          disponivel: disp, disponivelUnidade: dispUn,
          disponivelGB: Math.round(dispGB), usadoGB: Math.round(usadoGB), pct
        };
      });
      return {
        srvId: srv.id, nome: srv.nome, discos: discoLeituras,
        obs: document.getElementById(`srv-obs-${srv.id}`)?.value.trim() || ''
      };
    });
    await db.collection('rotinas_servidor').add({
      tipo: 'servidor', data: new Date().toISOString().slice(0, 10),
      registradoEm: firebase.firestore.FieldValue.serverTimestamp(),
      registradoPor: currentUser.username, leituras
    });
    showRotinasToast('Registro do servidor salvo! ✅', 'success');
    _ultimosReg.servidor = new Date().toISOString().slice(0, 10); _ultimosReg.servidor_por = currentUser.username;
    renderUltimoReg('servidor');
    // Reset — direto para 0% sem recalcular
    _servidores.forEach(srv => {
      const discos = srv.discos?.length ? srv.discos : [{ id: 'disco0' }];
      discos.forEach(disco => {
        const e = document.getElementById(`srv-disp-${srv.id}-${disco.id}`); if (e) e.value = '';
        const u = document.getElementById(`srv-disp-un-${srv.id}-${disco.id}`); if (u) u.value = 'GB';
        const bar = document.getElementById(`srv-bar-${srv.id}-${disco.id}`);
        if (bar) { bar.style.width = '0%'; bar.style.backgroundColor = '#22c55e'; }
        const pctEl = document.getElementById(`srv-pct-${srv.id}-${disco.id}`);
        if (pctEl) pctEl.textContent = '0%';
      });
      const o = document.getElementById(`srv-obs-${srv.id}`); if (o) o.value = '';
    });
  } catch (e) { showRotinasToast('Erro ao salvar.', 'error'); console.error(e); }
  finally { if (btn) { btn.disabled = false; btn.textContent = 'Salvar Registro'; } }
}

// ── Impressoras — swipe reveal na leitura anterior ───────────────────────────
function renderImpressorasChecklist() {
  const el = document.getElementById('impressoras-checklist-rows');
  if (!el) return;
  const isAdmin = currentUser?.isAdmin || currentUser?.isSuperAdmin;
  if (!_impressoras.length) {
    el.innerHTML = `<div class="rotinas-empty"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg><span>Nenhuma impressora cadastrada.</span></div>`;
    return;
  }
  const isSA = currentUser?.isSuperAdmin;
  el.innerHTML = `
    <div class="imp-table-header">
      <div class="imp-col-info">Impressora</div>
      <div class="imp-col-num">Leitura Anterior</div>
      <div class="imp-col-num">Leitura Atual</div>
      <div class="imp-col-num">Páginas Impressas</div>
    </div>
    ${_impressoras.map(imp => `
    <div class="imp-table-row${isSA ? ' has-slide' : ''}" id="imp-row-${imp.id}">
      <div class="imp-row-wrap">
        <div class="imp-col-info">
          <span class="imp-tipo-badge ${imp.tipo === 'COLOR' ? 'color' : 'mono'}">${imp.tipo}</span>
          <div class="imp-info-block">
            <span class="imp-nome">${imp.marca} ${imp.modelo}</span>
            <span class="imp-meta">${imp.departamento} · IP: ${imp.ip} · ${imp.ativo}</span>
          </div>
        </div>
        <div class="imp-col-num imp-ant-wrap">
          <div class="imp-ant-display" id="imp-ant-${imp.id}">—</div>
          <input class="imp-ant-input imp-input" type="number" min="0" id="imp-ant-input-${imp.id}"
            style="display:none;width:90px;" placeholder="0"
            onblur="saveLeituraAnterior('${imp.id}')"
            onkeydown="if(event.key==='Enter')this.blur()">
        </div>
        <div class="imp-col-num"><input class="imp-input" type="number" min="0" id="imp-atual-${imp.id}" placeholder="0" oninput="calcImpressora('${imp.id}')"></div>
        <div class="imp-col-num imp-paginas" id="imp-pag-${imp.id}">—</div>
      </div>
      ${isSA ? `<button class="imp-slide-btn" onclick="editLeituraAnterior('${imp.id}')" title="Editar leitura anterior">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>`: ''}
    </div>`).join('')}`;
  calcTotais();
}

function editLeituraAnterior(impId) {
  const display = document.getElementById(`imp-ant-${impId}`);
  const input = document.getElementById(`imp-ant-input-${impId}`);
  if (!display || !input) return;
  const currentVal = display.textContent.replace(/\./g, '').replace(',', '');
  input.value = currentVal !== '—' ? currentVal : '';
  display.style.display = 'none';
  input.style.display = 'block';
  input.focus();
}

function saveLeituraAnterior(impId) {
  const display = document.getElementById(`imp-ant-${impId}`);
  const input = document.getElementById(`imp-ant-input-${impId}`);
  if (!display || !input) return;
  const val = parseInt(input.value) || 0;
  display.textContent = val > 0 ? val.toLocaleString('pt-BR') : '—';
  display.style.display = 'block';
  input.style.display = 'none';
  calcImpressora(impId);
}

// ── Modal gerenciamento impressoras + faturamento + paginação ─────────────────
const IMP_PER_PAGE = 4;
let _impModalPage = 0;
let _impFaturamento = { franquiaPags: 0, franquiaValor: 0, valorPorPag: 0, obs: '' };

function switchModalTab(tab) {
  const tabs = ['impressoras', 'faturamento'];
  tabs.forEach(t => {
    const btn = document.getElementById(`modal-tab-${t}`);
    const panel = document.getElementById(`modal-panel-${t}`);
    const isActive = t === tab;
    if (btn) {
      btn.style.color = isActive ? 'var(--accent)' : 'var(--muted)';
      btn.style.borderBottom = isActive ? '2px solid var(--accent)' : '2px solid transparent';
    }
    if (panel) panel.style.display = isActive ? 'flex' : 'none';
  });
  // panel-faturamento usa block não flex
  const fatPanel = document.getElementById('modal-panel-faturamento');
  if (fatPanel && tab === 'faturamento') fatPanel.style.display = 'block';
}

function openImpressorasModal() {
  _impModalPage = 0;
  switchModalTab('impressoras');
  renderModalImpressorasList();
  renderModalFaturamento();
  const modal = document.getElementById('rotinas-imp-modal');
  if (modal) { modal.style.display = 'flex'; document.body.style.overflow = 'hidden'; }
}

function saveFaturamento() {
  _impFaturamento.franquiaPags = parseFloat(document.getElementById('modal-franquia-pag')?.value) || 0;
  _impFaturamento.franquiaValor = parseFloat(document.getElementById('modal-franquia-val')?.value) || 0;
  _impFaturamento.valorPorPag = parseFloat(document.getElementById('modal-valor-pag')?.value) || 0;
  _impFaturamento.obs = document.getElementById('modal-imp-obs')?.value.trim() || '';
  const t = document.createElement('div');
  t.textContent = '✅ Faturamento salvo!';
  t.style.cssText = 'position:fixed;bottom:1.5rem;right:1.5rem;background:var(--surface);border:1px solid var(--border2);border-left:3px solid #22c55e;border-radius:8px;padding:0.7rem 1.1rem;font-size:0.82rem;z-index:9999;box-shadow:0 4px 16px #00000018;transition:opacity 0.3s;';
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 2000);
}

function closeImpressorasModal() {
  saveFaturamento();
  const modal = document.getElementById('rotinas-imp-modal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
}

function renderModalImpressorasList() {
  const el = document.getElementById('modal-impressoras-list');
  const nav = document.getElementById('modal-imp-paginacao');
  if (!el) return;

  const totalPages = Math.max(1, Math.ceil(_impressoras.length / IMP_PER_PAGE));
  _impModalPage = Math.min(_impModalPage, totalPages - 1);
  const start = _impModalPage * IMP_PER_PAGE;
  const slice = _impressoras.slice(start, start + IMP_PER_PAGE);

  if (!_impressoras.length) {
    el.innerHTML = '<div style="font-size:0.78rem;color:var(--muted);padding:0.5rem 0;">Nenhuma impressora cadastrada.</div>';
    if (nav) nav.style.display = 'none';
    return;
  }

  el.innerHTML = slice.map(imp => `
    <div style="display:flex;align-items:center;gap:0.6rem;padding:0.5rem 0.75rem;background:var(--surface2);border:1px solid var(--border2);border-radius:7px;">
      <span class="imp-tipo-badge ${imp.tipo === 'COLOR' ? 'color' : 'mono'}" style="font-size:0.6rem;flex-shrink:0;">${imp.tipo}</span>
      <div style="flex:1;min-width:0;">
        <div style="font-weight:600;font-size:0.82rem;">${imp.marca} ${imp.modelo}</div>
        <div style="font-size:0.7rem;color:var(--muted);font-family:var(--font-mono);">${imp.departamento} · IP: ${imp.ip}${imp.ativo ? ' · ' + imp.ativo : ''}</div>
      </div>
      <button onclick="removeImpressora('${imp.id}')" style="background:none;border:none;cursor:pointer;color:var(--muted);padding:0.2rem;border-radius:4px;flex-shrink:0;" title="Remover">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
      </button>
    </div>`).join('');

  if (nav) {
    nav.style.display = totalPages > 1 ? 'flex' : 'none';
    nav.innerHTML = `
      <button onclick="changeImpPage(-1)" ${_impModalPage === 0 ? 'disabled' : ''} class="imp-page-btn">‹</button>
      <span style="font-size:0.78rem;font-family:var(--font-mono);color:var(--muted);">${_impModalPage + 1} / ${totalPages}</span>
      <button onclick="changeImpPage(1)" ${_impModalPage >= totalPages - 1 ? 'disabled' : ''} class="imp-page-btn">›</button>`;
  }
}

function changeImpPage(dir) {
  const total = Math.max(1, Math.ceil(_impressoras.length / IMP_PER_PAGE));
  _impModalPage = Math.max(0, Math.min(total - 1, _impModalPage + dir));
  renderModalImpressorasList();
}

function renderModalFaturamento() {
  const el = document.getElementById('modal-faturamento-body');
  if (!el) return;
  el.innerHTML = `
    <div class="imp-fat-grid">
      <div class="imp-fat-field">
        <label>Franquia — Qtde de páginas</label>
        <input type="number" id="modal-franquia-pag" placeholder="20000" min="0" value="${_impFaturamento.franquiaPags || ''}">
      </div>
      <div class="imp-fat-field">
        <label>Franquia — Valor (R$)</label>
        <input type="number" id="modal-franquia-val" placeholder="0,00" min="0" step="0.01" value="${_impFaturamento.franquiaValor || ''}">
      </div>
      <div class="imp-fat-field">
        <label>Valor por página excedente (R$)</label>
        <input type="number" id="modal-valor-pag" placeholder="0,0744" min="0" step="0.0001" value="${_impFaturamento.valorPorPag || ''}">
      </div>
    </div>
    <div class="imp-fat-field" style="margin-top:0.5rem;">
      <label>Observações</label>
      <textarea id="modal-imp-obs" class="form-input" rows="2" placeholder="Troca de toner, manutenção, etc..." style="resize:none;margin-top:0.25rem;">${_impFaturamento.obs || ''}</textarea>
    </div>`;
}

async function addImpressora() {
  const marca = document.getElementById('new-imp-marca')?.value.trim();
  const modelo = document.getElementById('new-imp-modelo')?.value.trim();
  const ip = document.getElementById('new-imp-ip')?.value.trim();
  const depto = document.getElementById('new-imp-depto')?.value.trim();
  const tipo = document.getElementById('new-imp-tipo')?.value || 'MONO';
  const ativo = document.getElementById('new-imp-ativo')?.value.trim();
  if (!marca || !modelo) { showRotinasToast('Preencha ao menos Marca e Modelo.', 'error'); return; }
  _impressoras.push({ id: 'imp' + Date.now(), tipo, marca, modelo, ip: ip || '—', departamento: depto || '—', sn: '', ativo: ativo || '' });
  await db.collection('rotinas_config').doc('impressoras').set({ lista: _impressoras });
  ['new-imp-marca', 'new-imp-modelo', 'new-imp-ip', 'new-imp-depto', 'new-imp-ativo'].forEach(id => {
    const e = document.getElementById(id); if (e) e.value = '';
  });
  // Ir para última página para ver nova impressora
  _impModalPage = Math.floor((_impressoras.length - 1) / IMP_PER_PAGE);
  renderModalImpressorasList();
  renderImpressorasChecklist();
  showRotinasToast('Impressora adicionada! ✅', 'success');
}

async function removeImpressora(id) {
  if (!confirm('Remover esta impressora?')) return;
  _impressoras = _impressoras.filter(i => i.id !== id);
  await db.collection('rotinas_config').doc('impressoras').set({ lista: _impressoras });
  const totalPages = Math.ceil(_impressoras.length / IMP_PER_PAGE);
  if (_impModalPage >= totalPages) _impModalPage = Math.max(0, totalPages - 1);
  renderModalImpressorasList();
  renderImpressorasChecklist();
  showRotinasToast('Impressora removida.', 'success');
}

async function loadLeituraAnterior(mesAno) {
  if (!mesAno || !_impressoras.length) return;
  try {
    const snap = await db.collection('rotinas_impressoras').where('mesAno', '<', mesAno).orderBy('mesAno', 'desc').limit(1).get();
    if (snap.empty) return;
    const ant = snap.docs[0].data();
    _impressoras.forEach(imp => {
      const lAnt = ant.leituras?.find(l => l.impId === imp.id);
      const el = document.getElementById(`imp-ant-${imp.id}`);
      if (el) el.textContent = lAnt ? lAnt.atual.toLocaleString('pt-BR') : '—';
    });
    calcTotais();
  } catch (e) { }
}

function calcImpressora(id) {
  const antEl = document.getElementById(`imp-ant-${id}`);
  const pagEl = document.getElementById(`imp-pag-${id}`);
  const antTxt = (antEl?.textContent || '—').replace(/\./g, '').replace(',', '');
  const atual = parseInt(document.getElementById(`imp-atual-${id}`)?.value) || 0;
  if (antTxt !== '—' && antTxt !== '') {
    const pag = Math.max(0, atual - (parseInt(antTxt) || 0));
    if (pagEl) { pagEl.textContent = pag.toLocaleString('pt-BR'); pagEl.style.color = 'var(--text)'; }
  } else { if (pagEl) { pagEl.textContent = '—'; pagEl.style.color = 'var(--muted)'; } }
  calcTotais();
}

function calcTotais() {
  let color = 0, mono = 0;
  _impressoras.forEach(imp => {
    const v = parseInt((document.getElementById(`imp-pag-${imp.id}`)?.textContent || '0').replace(/\./g, '').replace(',', '')) || 0;
    if (document.getElementById(`imp-pag-${imp.id}`)?.textContent === '—') return;
    imp.tipo === 'COLOR' ? color += v : mono += v;
  });
  const el = document.getElementById('imp-totais');
  if (el) el.innerHTML = `
    <div class="imp-total-item"><span>🎨 Total COLOR</span><strong>${color.toLocaleString('pt-BR')} pgs</strong></div>
    <div class="imp-total-item"><span>⬛ Total MONO</span><strong>${mono.toLocaleString('pt-BR')} pgs</strong></div>
    <div class="imp-total-item total"><span>📄 Total Geral</span><strong>${mono.toLocaleString('pt-BR')} pgs</strong></div>`;
}

const _ETIQUETA_B64 = 'data:image/png;base64,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';
function exportarLevantamentoImpressorasPDF() {
  const mesAno = document.getElementById('imp-mes-ano')?.value || '';
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let color = 0, mono = 0;
  const linhas = _impressoras.map(imp => {
    const antTxt = (document.getElementById(`imp-ant-${imp.id}`)?.textContent || '—');
    const atual = document.getElementById(`imp-atual-${imp.id}`)?.value || '';
    const pagTxt = (document.getElementById(`imp-pag-${imp.id}`)?.textContent || '—');
    const pag = pagTxt === '—' ? 0 : (parseInt(pagTxt.replace(/\./g, '').replace(',', '')) || 0);
    if (pagTxt !== '—') { imp.tipo === 'COLOR' ? color += pag : mono += pag; }
    return `<tr>
      <td>${esc(imp.marca)} ${esc(imp.modelo)}</td>
      <td>${esc(imp.departamento || '—')}</td>
      <td style="text-align:center;"><span class="tag ${imp.tipo === 'COLOR' ? 'c' : 'm'}">${esc(imp.tipo)}</span></td>
      <td style="text-align:right;font-family:monospace;">${esc(antTxt)}</td>
      <td style="text-align:right;font-family:monospace;">${atual !== '' ? esc(atual) : '—'}</td>
      <td style="text-align:right;font-family:monospace;font-weight:700;">${esc(pagTxt)}</td>
    </tr>`;
  }).join('');
  const fmt = n => n.toLocaleString('pt-BR');
  const mesFmt = mesAno ? (() => { const [y, m] = mesAno.split('-'); return `${m}/${y}`; })() : '—';
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Levantamento de Impressoras — Premovale</title>
  <style>
    body{font-family:Arial,sans-serif;color:#1f2937;margin:0;padding:28px 28px 120px;}
    .header{border-bottom:2px solid #c0392b;padding-bottom:12px;margin-bottom:14px;}
    .header h1{font-size:17px;margin:0;color:#c0392b;font-weight:800;}
    .header .sub{font-size:11px;color:#6b7280;margin-top:3px;}
    table{width:100%;border-collapse:collapse;font-size:11px;}
    th{background:#f1f5f9;text-align:left;padding:6px 8px;font-size:9px;text-transform:uppercase;letter-spacing:.05em;color:#475569;border-bottom:1px solid #e5e7eb;}
    td{padding:6px 8px;border-bottom:1px solid #eef2f7;}
    .tag{display:inline-block;padding:1px 7px;border-radius:9px;font-size:8px;font-weight:700;color:#fff;}
    .tag.c{background:#8b5cf6;} .tag.m{background:#475569;}
    .totais{margin-top:16px;display:flex;gap:10px;justify-content:flex-end;}
    .tot{border:1px solid #e5e7eb;border-radius:8px;padding:8px 14px;font-size:11px;text-align:center;}
    .tot strong{display:block;font-size:14px;margin-top:2px;}
    .tot.geral{border-color:#c0392b;background:#fef2f2;}
    .footer{position:fixed;bottom:0;left:0;right:0;padding:10px 28px;border-top:1px solid #e5e7eb;display:flex;align-items:center;justify-content:space-between;background:#fff;}
    .footer img{height:46px;}
    .footer .stamp{font-size:8px;color:#9ca3af;text-align:right;line-height:1.4;}
  </style></head>
  <body>
    <div class="header"><h1>Levantamento de Impressoras</h1>
      <div class="sub">Mês/Ano de referência: <strong>${mesFmt}</strong> · Gerado em ${new Date().toLocaleDateString('pt-BR')}</div></div>
    <table>
      <thead><tr><th>Impressora</th><th>Departamento</th><th>Tipo</th><th style="text-align:right;">Anterior</th><th style="text-align:right;">Atual</th><th style="text-align:right;">Páginas</th></tr></thead>
      <tbody>${linhas}</tbody>
    </table>
    <div class="totais">
      <div class="tot"><span>🎨 Total COLOR</span><strong>${fmt(color)} pgs</strong></div>
      <div class="tot"><span>⬛ Total MONO</span><strong>${fmt(mono)} pgs</strong></div>
      <div class="tot geral"><span>📄 Total Geral (mono)</span><strong>${fmt(mono)} pgs</strong></div>
    </div>
    <div class="footer">
      <img src="${_ETIQUETA_B64}" alt="Premovale">
      <div class="stamp">Documento gerado pelo sistema Premovale T.I<br>${new Date().toLocaleString('pt-BR')}</div>
    </div>
    <script>window.onload=()=>{window.print();}<\/script>
  </body></html>`;
  const w = window.open('', '_blank');
  if (!w) { showRotinasToast('Permita pop-ups para exportar o PDF.', 'error'); return; }
  w.document.write(html); w.document.close();
}

async function saveImpressorasRegisto() {
  const mesAno = document.getElementById('imp-mes-ano')?.value;
  if (!mesAno) { showRotinasToast('Selecione o mês/ano.', 'error'); return; }
  const btn = document.getElementById('btn-save-impressoras');
  if (btn) { btn.disabled = true; btn.textContent = 'Salvando...'; }
  try {
    const isAdmin = currentUser?.isAdmin || currentUser?.isSuperAdmin;
    const leituras = _impressoras.map(imp => {
      const antTxt = (document.getElementById(`imp-ant-${imp.id}`)?.textContent || '0').replace(/\./g, '').replace(',', '');
      const ant = antTxt !== '—' ? (parseInt(antTxt) || 0) : 0;
      const atual = parseInt(document.getElementById(`imp-atual-${imp.id}`)?.value) || 0;
      return {
        impId: imp.id, nome: `${imp.marca} ${imp.modelo}`, tipo: imp.tipo,
        departamento: imp.departamento, anterior: ant, atual, paginas: Math.max(0, atual - ant),
        valor: isAdmin ? (parseFloat(document.getElementById(`imp-valor-${imp.id}`)?.value) || 0) : 0
      };
    });
    const isA = isAdmin;
    // Faturamento vem do estado _impFaturamento (preenchido no modal)
    const franquiaPags = isA ? (_impFaturamento.franquiaPags || parseFloat(document.getElementById('modal-franquia-pag')?.value) || 0) : 0;
    const franquiaVal = isA ? (_impFaturamento.franquiaValor || parseFloat(document.getElementById('modal-franquia-val')?.value) || 0) : 0;
    const valorPag = isA ? (_impFaturamento.valorPorPag || parseFloat(document.getElementById('modal-valor-pag')?.value) || 0) : 0;
    const obsImp = isA ? (_impFaturamento.obs || document.getElementById('modal-imp-obs')?.value.trim() || '') : '';
    const totalPags = leituras.reduce((s, l) => s + l.paginas, 0);
    const totalMono = leituras.filter(l => l.tipo === 'MONO').reduce((s, l) => s + l.paginas, 0);
    const excedente = Math.max(0, totalMono - franquiaPags);
    const excedenteVal = Math.round(excedente * valorPag * 100) / 100;
    const totalFatura = Math.round((franquiaVal + excedenteVal) * 100) / 100;
    await db.collection('rotinas_impressoras').add({
      tipo: 'impressoras', mesAno,
      registradoEm: firebase.firestore.FieldValue.serverTimestamp(),
      registradoPor: currentUser.username, leituras,
      faturamento: isA ? {
        franquiaPags, franquiaValor: franquiaVal, valorPorPag: valorPag,
        excedentePags: excedente, excedenteValor: excedenteVal, totalFatura,
        obs: obsImp
      } : null
    });
    showRotinasToast('Registro de impressoras salvo! ✅', 'success');
    _ultimosReg.impressoras = mesAno; _ultimosReg.impressoras_por = currentUser.username;
    renderUltimoReg('impressoras');
    // Recarregar leitura anterior para refletir o novo registro salvo
    await loadLeituraAnterior(mesAno);
  } catch (e) { showRotinasToast('Erro ao salvar.', 'error'); console.error(e); }
  finally { if (btn) { btn.disabled = false; btn.textContent = 'Salvar Registro'; } }
}

// ── CFTV — modal de gerenciamento ────────────────────────────────────────────
let _cftvModalDvr = null; // DVR selecionado no modal

function openCFTVModal() {
  _cftvModalDvr = null;
  const camsSection = document.getElementById('cftv-modal-cameras-section');
  const placeholder = document.getElementById('cftv-modal-cameras-placeholder');
  if (camsSection) camsSection.style.display = 'none';
  if (placeholder) placeholder.style.display = 'flex';
  renderCFTVModalDvrs();
  const modal = document.getElementById('rotinas-cftv-modal');
  if (modal) { modal.style.display = 'flex'; document.body.style.overflow = 'hidden'; }
}

function closeCFTVModal() {
  const modal = document.getElementById('rotinas-cftv-modal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
}

function renderCFTVModalDvrs() {
  const el = document.getElementById('cftv-modal-dvrs-list');
  if (!el) return;
  if (!_dvrs.length) {
    el.innerHTML = '<div style="font-size:0.78rem;color:var(--muted);padding:0.4rem 0;">Nenhum DVR cadastrado.</div>';
    return;
  }
  el.innerHTML = _dvrs.map(dvr => {
    const count = _cameras.filter(c => c.dvrId === dvr.id).length;
    const isSelected = _cftvModalDvr === dvr.id;
    return `
    <div style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem 0.75rem;background:${isSelected ? 'var(--surface3)' : 'var(--surface2)'};border:1px solid ${isSelected ? 'var(--accent)' : 'var(--border2)'};border-radius:7px;cursor:pointer;" onclick="selectCFTVModalDvr('${dvr.id}')">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${isSelected ? 'var(--accent)' : 'currentColor'}" stroke-width="2" style="flex-shrink:0;"><rect width="20" height="8" x="2" y="2" rx="2"/><rect width="20" height="8" x="2" y="14" rx="2"/></svg>
      <span style="flex:1;font-weight:600;font-size:0.82rem;${isSelected ? 'color:var(--accent)' : ''}">${dvr.nome}</span>
      <span style="font-size:0.7rem;font-family:var(--font-mono);color:var(--muted);">${count} câm.</span>
      <button onclick="event.stopPropagation();removeDvr('${dvr.id}')" style="background:none;border:none;cursor:pointer;color:var(--muted);padding:0.15rem;" title="Remover DVR">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
      </button>
    </div>`;
  }).join('');
}

function selectCFTVModalDvr(dvrId) {
  _cftvModalDvr = dvrId;
  renderCFTVModalDvrs();
  renderCFTVModalCameras();
  const camsSection = document.getElementById('cftv-modal-cameras-section');
  const placeholder = document.getElementById('cftv-modal-cameras-placeholder');
  const dvr = _dvrs.find(d => d.id === dvrId);
  const title = document.getElementById('cftv-modal-cameras-title');
  if (title && dvr) title.textContent = `Câmeras — ${dvr.nome}`;
  if (camsSection) camsSection.style.display = 'block';
  if (placeholder) placeholder.style.display = 'none';
}

function renderCFTVModalCameras() {
  const el = document.getElementById('cftv-modal-cameras-list');
  if (!el || !_cftvModalDvr) return;
  const cams = _cameras.filter(c => c.dvrId === _cftvModalDvr);
  if (!cams.length) {
    el.innerHTML = '<div style="font-size:0.78rem;color:var(--muted);padding:0.35rem 0;">Nenhuma câmera cadastrada neste DVR.</div>';
    return;
  }
  el.innerHTML = cams.map(cam => `
    <div style="display:flex;align-items:center;gap:0.5rem;padding:0.4rem 0.75rem;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;">
      <span style="font-family:var(--font-mono);font-size:0.72rem;color:var(--muted);min-width:28px;">CH${cam.canal}</span>
      <span style="flex:1;font-size:0.82rem;font-weight:500;">${cam.nome}</span>
      ${cam.rack ? `<span style="font-size:0.7rem;font-family:var(--font-mono);color:var(--muted);">Rack ${cam.rack}</span>` : ''}
      <button onclick="removeCamera('${cam.id}')" style="background:none;border:none;cursor:pointer;color:var(--muted);padding:0.15rem;" title="Remover câmera">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
      </button>
    </div>`).join('');
}

async function addDvr() {
  const nome = document.getElementById('new-dvr-nome')?.value.trim();
  if (!nome) { showRotinasToast('Informe o nome do DVR.', 'error'); return; }
  _dvrs.push({ id: 'dvr' + Date.now(), nome, rack: '' });
  await db.collection('rotinas_config').doc('dvrs').set({ lista: _dvrs });
  const e = document.getElementById('new-dvr-nome'); if (e) e.value = '';
  renderCFTVModalDvrs();
  renderCFTVChecklist();
  showRotinasToast('DVR adicionado! ✅', 'success');
}

async function removeDvr(id) {
  if (!confirm('Remover este DVR e todas as suas câmeras?')) return;
  _dvrs = _dvrs.filter(d => d.id !== id);
  _cameras = _cameras.filter(c => c.dvrId !== id);
  await Promise.all([
    db.collection('rotinas_config').doc('dvrs').set({ lista: _dvrs }),
    db.collection('rotinas_config').doc('cameras').set({ lista: _cameras }),
  ]);
  if (_cftvModalDvr === id) { _cftvModalDvr = null; document.getElementById('cftv-modal-cameras-section').style.display = 'none'; }
  renderCFTVModalDvrs();
  renderCFTVChecklist();
  showRotinasToast('DVR removido.', 'success');
}

async function addCamera() {
  if (!_cftvModalDvr) { showRotinasToast('Selecione um DVR primeiro.', 'error'); return; }
  const nome = document.getElementById('new-cam-nome')?.value.trim();
  const canal = parseInt(document.getElementById('new-cam-canal')?.value) || 0;
  const rack = document.getElementById('new-cam-rack')?.value.trim();
  if (!nome || !canal) { showRotinasToast('Informe nome e canal.', 'error'); return; }
  _cameras.push({ id: 'cam' + Date.now(), dvrId: _cftvModalDvr, nome, canal, rack: rack || '' });
  await db.collection('rotinas_config').doc('cameras').set({ lista: _cameras });
  ['new-cam-nome', 'new-cam-canal', 'new-cam-rack'].forEach(id => { const e = document.getElementById(id); if (e) e.value = ''; });
  renderCFTVModalCameras();
  renderCFTVModalDvrs();
  renderCFTVChecklist();
  showRotinasToast('Câmera adicionada! ✅', 'success');
}

async function removeCamera(id) {
  if (!confirm('Remover esta câmera?')) return;
  _cameras = _cameras.filter(c => c.id !== id);
  await db.collection('rotinas_config').doc('cameras').set({ lista: _cameras });
  renderCFTVModalCameras();
  renderCFTVModalDvrs();
  renderCFTVChecklist();
  showRotinasToast('Câmera removida.', 'success');
}

// ── CFTV ─────────────────────────────────────────────────────────────────────
const CFTV_STATUS = [
  { key: 'ATIVO', label: 'Ativo', cls: 'ativo' },
  { key: 'INATIVO', label: 'Inativo', cls: 'inativo' },
  { key: 'INTERMITENTE', label: 'Intermitente', cls: 'intermitente' },
  { key: 'NAO_INSTALADO', label: 'Não Instalado', cls: 'nao-instalado' },
];

let _dvrStatus = {}; // { dvrId: 'ATIVO'|'INATIVO'|'INTERMITENTE' }

const DVR_STATUS = [
  { key: 'ATIVO', label: 'Ativo', cls: 'ativo' },
  { key: 'INATIVO', label: 'Inativo', cls: 'inativo' },
  { key: 'INTERMITENTE', label: 'Intermitente', cls: 'intermitente' },
];

function setDVRStatus(dvrId, status) {
  if (status === 'ATIVO') {
    // Ativo — liberar câmeras, limpar status do DVR
    _dvrStatus[dvrId] = 'ATIVO';
    _updateDVRStatusUI(dvrId);
    _enableDVRCameras(dvrId);
    return;
  }
  // Inativo ou Intermitente — pedir observação
  const dvr = _dvrs.find(d => d.id === dvrId);
  const modal = document.getElementById('cftv-dvr-obs-modal');
  const title = document.getElementById('cftv-dvr-obs-title');
  const obs = document.getElementById('cftv-dvr-obs-input');
  if (!modal) return;
  if (title) title.textContent = `${status === 'INATIVO' ? '❌ Inativo' : '⚠️ Intermitente'} — ${dvr?.nome || dvrId}`;
  if (obs) obs.value = '';
  modal.dataset.dvrId = dvrId;
  modal.dataset.status = status;
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function confirmDVRStatus() {
  const modal = document.getElementById('cftv-dvr-obs-modal');
  if (!modal) return;
  const dvrId = modal.dataset.dvrId;
  const status = modal.dataset.status;
  const obs = document.getElementById('cftv-dvr-obs-input')?.value.trim() || '';
  _dvrStatus[dvrId] = status;
  // Guardar obs do DVR
  if (!window._dvrObs) window._dvrObs = {};
  window._dvrObs[dvrId] = obs;
  modal.style.display = 'none';
  document.body.style.overflow = '';
  _updateDVRStatusUI(dvrId);
  _disableDVRCameras(dvrId, status);
  updateCFTVCounters(dvrId);
}

function cancelDVRStatus(dvrId) {
  const modal = document.getElementById('cftv-dvr-obs-modal');
  if (modal) { modal.style.display = 'none'; document.body.style.overflow = ''; }
  // Reverter botão para ATIVO
  _dvrStatus[dvrId] = _dvrStatus[dvrId] || 'ATIVO';
  _updateDVRStatusUI(dvrId);
}

function _updateDVRStatusUI(dvrId) {
  DVR_STATUS.forEach(s => {
    const btn = document.getElementById(`dvr-status-btn-${s.key}-${dvrId}`);
    if (btn) btn.classList.toggle('selected', (_dvrStatus[dvrId] || 'ATIVO') === s.key);
  });
}

function _disableDVRCameras(dvrId, dvrStatusVal) {
  const cams = _cameras.filter(c => c.dvrId === dvrId);
  cams.forEach(cam => {
    _cftvStatus[cam.id] = dvrStatusVal;
    // Desabilitar botões
    const row = document.getElementById(`cftv-row-${cam.id}`);
    if (row) {
      row.querySelectorAll('.cftv-status-btn').forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.4';
        btn.style.cursor = 'not-allowed';
      });
      // Marcar status visualmente
      CFTV_STATUS.forEach(s => {
        const btn = document.querySelector(`#cftv-row-${cam.id} .cftv-status-btn.${s.cls}`);
        if (btn) btn.classList.toggle('selected', s.key === dvrStatusVal);
      });
    }
  });
}

function _enableDVRCameras(dvrId) {
  const cams = _cameras.filter(c => c.dvrId === dvrId);
  cams.forEach(cam => {
    _cftvStatus[cam.id] = 'ATIVO';
    const row = document.getElementById(`cftv-row-${cam.id}`);
    if (row) {
      row.querySelectorAll('.cftv-status-btn').forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = '';
        btn.style.cursor = '';
      });
      CFTV_STATUS.forEach(s => {
        const btn = document.querySelector(`#cftv-row-${cam.id} .cftv-status-btn.${s.cls}`);
        if (btn) btn.classList.toggle('selected', s.key === 'ATIVO');
      });
      const obs = document.getElementById(`cftv-obs-${cam.id}`);
      if (obs) { obs.style.display = 'none'; obs.value = ''; }
    }
  });
  // Atualizar counters em tempo real
  updateCFTVCounters(dvrId);
}

function toggleDvr(dvrId) {
  const body = document.getElementById(`cftv-dvr-body-${dvrId}`);
  const icon = document.getElementById(`cftv-dvr-icon-${dvrId}`);
  if (!body) return;
  const open = body.style.display === 'none';
  body.style.display = open ? 'block' : 'none';
  if (icon) icon.style.transform = open ? 'rotate(90deg)' : 'rotate(0deg)';
}

function renderCFTVChecklist() {
  const el = document.getElementById('cftv-dvrs-container');
  if (!el) return;
  if (!_dvrs.length) {
    el.innerHTML = `<div class="rotinas-empty"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg><span>Nenhum DVR cadastrado.</span></div>`;
    return;
  }
  el.innerHTML = _dvrs.map((dvr, idx) => {
    const cams = _cameras.filter(c => c.dvrId === dvr.id);
    const isFirst = idx === 0;
    const dvrSt = _dvrStatus[dvr.id] || 'ATIVO';
    const dvrOff = ['INATIVO', 'INTERMITENTE'].includes(dvrSt);
    return `<div class="cftv-dvr-block">
      <div class="cftv-dvr-header" style="cursor:pointer;">
        <span onclick="toggleDvr('${dvr.id}')" style="display:flex;align-items:center;gap:0.5rem;flex:1;min-width:0;">
          <svg id="cftv-dvr-icon-${dvr.id}" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="transition:transform 0.2s;transform:rotate(${isFirst ? 90 : 0}deg);flex-shrink:0;"><path d="m9 18 6-6-6-6"/></svg>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;"><rect width="20" height="8" x="2" y="2" rx="2"/><rect width="20" height="8" x="2" y="14" rx="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>
          ${dvr.nome}
          <span class="cftv-dvr-count">${cams.length} câmeras</span>
        </span>
        <div style="display:flex;align-items:center;gap:0.35rem;flex-shrink:0;">
          ${DVR_STATUS.map(s => `<button
            id="dvr-status-btn-${s.key}-${dvr.id}"
            class="cftv-dvr-status-btn ${s.cls}${dvrSt === s.key ? ' selected' : ''}"
            onclick="event.stopPropagation();setDVRStatus('${dvr.id}','${s.key}')">${s.label}</button>`).join('')}
        </div>
        <div class="cftv-dvr-counters" id="cftv-counters-${dvr.id}"></div>
      </div>
      <div id="cftv-dvr-body-${dvr.id}" style="display:${isFirst ? 'block' : 'none'};">
        <div class="cftv-cam-table">
          <div class="cftv-cam-table-header"><div>Canal</div><div>Câmera</div><div>Rack</div><div>Status</div><div>Obs.</div></div>
          ${cams.map(cam => {
      const camSt = _cftvStatus[cam.id] || 'ATIVO';
      return `
          <div class="cftv-cam-row" id="cftv-row-${cam.id}">
            <div class="cftv-cam-canal">${cam.canal}</div>
            <div class="cftv-cam-nome">${cam.nome}</div>
            <div class="cftv-cam-rack">${cam.rack || '—'}</div>
            <div class="cftv-cam-status-group">
              ${CFTV_STATUS.map(s => `<button class="cftv-status-btn ${s.cls}${camSt === s.key ? ' selected' : ''}"
                onclick="setCFTVStatus('${cam.id}','${dvr.id}','${s.key}')"
                ${dvrOff ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : ''}>${s.label}</button>`).join('')}
            </div>
            <div class="cftv-cam-obs">
              <textarea id="cftv-obs-${cam.id}" placeholder="Observação..."
                oninput="autoResizeTextarea(this)"
                style="display:${['INATIVO', 'INTERMITENTE'].includes(camSt) ? 'block' : 'none'}"></textarea>
            </div>
          </div>`;
    }).join('')}
        </div>
      </div>
    </div>`;
  }).join('');
  _cameras.forEach(c => { if (!_cftvStatus[c.id]) _cftvStatus[c.id] = 'ATIVO'; });
  _dvrs.forEach(dvr => updateCFTVCounters(dvr.id));
}

function autoResizeTextarea(el) {
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}

function setCFTVStatus(camId, dvrId, status) {
  _cftvStatus[camId] = status;
  CFTV_STATUS.forEach(s => {
    const btn = document.querySelector(`#cftv-row-${camId} .cftv-status-btn.${s.cls}`);
    if (btn) btn.classList.toggle('selected', s.key === status);
  });
  const obs = document.getElementById(`cftv-obs-${camId}`);
  if (obs) obs.style.display = ['INATIVO', 'INTERMITENTE'].includes(status) ? 'block' : 'none';
  updateCFTVCounters(dvrId);
}

function updateCFTVCounters(dvrId) {
  const el = document.getElementById(`cftv-counters-${dvrId}`);
  if (!el) return;
  const cams = _cameras.filter(c => c.dvrId === dvrId);
  const cnt = { ATIVO: 0, INATIVO: 0, INTERMITENTE: 0, NAO_INSTALADO: 0 };
  cams.forEach(c => { const s = _cftvStatus[c.id] || 'ATIVO'; cnt[s] = (cnt[s] || 0) + 1; });
  el.innerHTML = `
    <span class="cftv-counter ativo">✅ ${cnt.ATIVO}</span>
    <span class="cftv-counter inativo">❌ ${cnt.INATIVO}</span>
    <span class="cftv-counter intermitente">⚠️ ${cnt.INTERMITENTE}</span>
    <span class="cftv-counter nao-inst">🔧 ${cnt.NAO_INSTALADO}</span>`;
}

async function saveCFTVRegisto() {
  if (!_dvrs.length) { showRotinasToast('Nenhum DVR cadastrado.', 'error'); return; }
  const btn = document.getElementById('btn-save-cftv');
  if (btn) { btn.disabled = true; btn.textContent = 'Salvando...'; }
  try {
    const dvrs = _dvrs.map(dvr => {
      const cams = _cameras.filter(c => c.dvrId === dvr.id).map(cam => ({
        camId: cam.id, nome: cam.nome, canal: cam.canal, rack: cam.rack,
        status: _cftvStatus[cam.id] || 'ATIVO',
        obs: document.getElementById(`cftv-obs-${cam.id}`)?.value.trim() || ''
      }));
      const cnt = { ATIVO: 0, INATIVO: 0, INTERMITENTE: 0, NAO_INSTALADO: 0 };
      cams.forEach(c => cnt[c.status] = (cnt[c.status] || 0) + 1);
      return {
        dvrId: dvr.id, nome: dvr.nome, status: _dvrStatus[dvr.id] || 'ATIVO',
        obsD: window._dvrObs?.[dvr.id] || '', cameras: cams, ...cnt
      };
    });
    const totais = dvrs.reduce((a, d) => ({ ATIVO: a.ATIVO + d.ATIVO, INATIVO: a.INATIVO + d.INATIVO, INTERMITENTE: a.INTERMITENTE + d.INTERMITENTE, NAO_INSTALADO: a.NAO_INSTALADO + d.NAO_INSTALADO }), { ATIVO: 0, INATIVO: 0, INTERMITENTE: 0, NAO_INSTALADO: 0 });
    await db.collection('rotinas_cftv').add({
      tipo: 'cftv', data: new Date().toISOString().slice(0, 10),
      registradoEm: firebase.firestore.FieldValue.serverTimestamp(),
      registradoPor: currentUser.username, dvrs, ...totais,
      obs: document.getElementById('cftv-obs-geral')?.value.trim() || ''
    });
    showRotinasToast('Registro do CFTV salvo! ✅', 'success');
    _ultimosReg.cftv = new Date().toISOString().slice(0, 10); _ultimosReg.cftv_por = currentUser.username;
    renderUltimoReg('cftv');
    // Estado das câmeras/DVRs persiste entre relatórios; só as observações voltam a ficar em branco
    _cameras.forEach(cam => { const o = document.getElementById(`cftv-obs-${cam.id}`); if (o) o.value = ''; });
    window._dvrObs = {};
    const og = document.getElementById('cftv-obs-geral'); if (og) og.value = '';
  } catch (e) { showRotinasToast('Erro ao salvar.', 'error'); console.error(e); }
  finally { if (btn) { btn.disabled = false; btn.textContent = 'Salvar Registro'; } }
}

// ── Último registro ───────────────────────────────────────────────────────────
function renderUltimoReg(tipo) {
  const el = document.getElementById(`ultimo-reg-${tipo}`);
  if (!el) return;
  const val = _ultimosReg[tipo], por = _ultimosReg[`${tipo}_por`] || '';
  if (!val) { el.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Nenhum registro encontrado`; return; }
  const check = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
  if (tipo === 'impressoras') {
    const [ano, mes] = val.split('-');
    const nm = new Date(parseInt(ano), parseInt(mes) - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    el.innerHTML = `${check} Último registro: <strong>${nm}</strong>${por ? ' — por ' + por : ''}`;
  } else {
    const d = new Date(val + 'T12:00:00');
    el.innerHTML = `${check} Último registro: <strong>${d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</strong>${por ? ' — por ' + por : ''}`;
  }
}

async function loadUltimosRegs() {
  const [s, i, c] = await Promise.all([
    db.collection('rotinas_servidor').orderBy('registradoEm', 'desc').limit(1).get(),
    db.collection('rotinas_impressoras').orderBy('mesAno', 'desc').limit(1).get(),
    db.collection('rotinas_cftv').orderBy('registradoEm', 'desc').limit(1).get(),
  ]);
  if (!s.empty) { const d = s.docs[0].data(); _ultimosReg.servidor = d.data; _ultimosReg.servidor_por = d.registradoPor; }
  if (!i.empty) { const d = i.docs[0].data(); _ultimosReg.impressoras = d.mesAno; _ultimosReg.impressoras_por = d.registradoPor; }
  if (!c.empty) {
    const d = c.docs[0].data(); _ultimosReg.cftv = d.data; _ultimosReg.cftv_por = d.registradoPor;
    // Persistir o ESTADO das câmeras/DVRs entre relatórios (observações NÃO são carregadas — sempre em branco)
    (d.dvrs || []).forEach(dv => {
      if (dv.dvrId && dv.status) _dvrStatus[dv.dvrId] = dv.status;
      (dv.cameras || []).forEach(cam => { if (cam.camId && cam.status) _cftvStatus[cam.camId] = cam.status; });
    });
  }
  ['servidor', 'impressoras', 'cftv'].forEach(t => renderUltimoReg(t));
}

// ── Histórico ─────────────────────────────────────────────────────────────────
async function loadHistorico() {
  const el = document.getElementById('historico-tbody');
  if (!el) return;
  el.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--muted);">Carregando...</td></tr>`;
  try {
    const p = [];
    if (_histFiltroModulo === 'todos' || _histFiltroModulo === 'servidor')
      p.push(db.collection('rotinas_servidor').orderBy('registradoEm', 'desc').limit(50).get().then(s => s.docs.map(d => ({ ...d.data(), _id: d.id, _col: 'servidor' }))));
    else p.push(Promise.resolve([]));
    if (_histFiltroModulo === 'todos' || _histFiltroModulo === 'impressoras')
      p.push(db.collection('rotinas_impressoras').orderBy('mesAno', 'desc').limit(50).get().then(s => s.docs.map(d => ({ ...d.data(), _id: d.id, _col: 'impressoras' }))));
    else p.push(Promise.resolve([]));
    if (_histFiltroModulo === 'todos' || _histFiltroModulo === 'cftv')
      p.push(db.collection('rotinas_cftv').orderBy('registradoEm', 'desc').limit(50).get().then(s => s.docs.map(d => ({ ...d.data(), _id: d.id, _col: 'cftv' }))));
    else p.push(Promise.resolve([]));
    let todos = (await Promise.all(p)).flat();
    if (_histFiltroMes) todos = todos.filter(r => { const ref = r._col === 'impressoras' ? r.mesAno : (r.data || ''); return ref && ref.startsWith(_histFiltroMes); });
    todos.sort((a, b) => { const da = a._col === 'impressoras' ? a.mesAno : (a.data || ''); const db2 = b._col === 'impressoras' ? b.mesAno : (b.data || ''); return db2 > da ? 1 : -1; });
    _historico = todos;
    renderHistoricoTable();
  } catch (e) { el.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;color:#ef4444;">Erro ao carregar.</td></tr>`; }
}

function openHistModal(id) {
  const r = _historico.find(x => x._id === id);
  if (!r) return;
  const isAdmin = currentUser?.isAdmin || currentUser?.isSuperAdmin;
  const modal = document.getElementById('rotinas-hist-modal');
  const title = document.getElementById('rotinas-hist-modal-title');
  const body = document.getElementById('rotinas-hist-modal-body');
  if (!modal || !title || !body) return;

  let titleHtml, bodyHtml;

  if (r._col === 'servidor') {
    const d = new Date(r.data + 'T12:00:00');
    titleHtml = `<span class="rotinas-modulo-badge servidor">🖥️ Servidor</span> ${d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}`;
    bodyHtml = (r.leituras || []).map(l => {
      // Suporte a estrutura antiga (totalGB) e nova (discos[])
      const discos = l.discos?.length ? l.discos
        : [{ nome: 'C:', total: l.totalGB || 0, unidade: 'GB', disponivel: l.disponivelGB || 0, usado: l.usadoGB || 0, pct: l.pct || 0 }];
      return `
        <div style="margin-bottom:1.25rem;">
          <div style="font-size:0.78rem;font-weight:700;margin-bottom:0.5rem;display:flex;align-items:center;gap:0.4rem;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="8" x="2" y="2" rx="2"/><rect width="20" height="8" x="2" y="14" rx="2"/></svg>
            ${l.nome}
          </div>
          <table class="hist-detail-table" style="width:100%;">
            <thead><tr><th>Disco</th><th>Total</th><th>Disponível</th><th>Usado</th><th>% Uso</th></tr></thead>
            <tbody>${discos.map(disco => `<tr>
              <td style="font-weight:600;">${disco.nome}</td>
              <td style="font-family:var(--font-mono);">${disco.total} ${disco.unidade || 'GB'}</td>
              <td style="font-family:var(--font-mono);">${disco.disponivel} ${disco.disponivelUnidade || disco.unidade || 'GB'}</td>
              <td style="font-family:var(--font-mono);">${disco.usadoGB || disco.usado || 0} GB</td>
              <td><span style="font-family:var(--font-mono);font-weight:700;color:${disco.pct >= 90 ? '#ef4444' : disco.pct >= 75 ? '#f59e0b' : '#22c55e'};">${disco.pct}%</span></td>
            </tr>`).join('')}</tbody>
          </table>
          ${l.obs ? `<div style="font-size:0.75rem;color:var(--muted);margin-top:0.4rem;">📝 ${l.obs}</div>` : ''}
        </div>`;
    }).join('') + `<div style="font-size:0.75rem;color:var(--muted);margin-top:0.5rem;font-family:var(--font-mono);">Registrado por: ${r.registradoPor || '—'}</div>`;

  } else if (r._col === 'impressoras') {
    const [ano, mes] = (r.mesAno || '').split('-');
    const nomeMes = new Date(parseInt(ano), parseInt(mes) - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const tc = (r.leituras || []).filter(l => l.tipo === 'COLOR').reduce((s, l) => s + l.paginas, 0);
    const tm = (r.leituras || []).filter(l => l.tipo === 'MONO').reduce((s, l) => s + l.paginas, 0);
    titleHtml = `<span class="rotinas-modulo-badge impressoras">🖨️ Impressoras</span> ${nomeMes}`;
    bodyHtml = `
      <table class="hist-detail-table" style="width:100%;">
        <thead><tr><th>Tipo</th><th>Impressora</th><th>Departamento</th><th>Anterior</th><th>Atual</th><th>Páginas</th>${isAdmin && r.faturamento ? '<th>Valor</th>' : ''}</tr></thead>
        <tbody>${(r.leituras || []).map(l => `<tr>
          <td><span class="imp-tipo-badge ${l.tipo === 'COLOR' ? 'color' : 'mono'}" style="font-size:0.6rem;">${l.tipo}</span></td>
          <td style="font-weight:600;">${l.nome}</td>
          <td style="color:var(--muted);font-size:0.78rem;">${l.departamento || '—'}</td>
          <td style="font-family:var(--font-mono);font-size:0.78rem;">${(l.anterior || 0).toLocaleString('pt-BR')}</td>
          <td style="font-family:var(--font-mono);font-size:0.78rem;">${(l.atual || 0).toLocaleString('pt-BR')}</td>
          <td style="font-family:var(--font-mono);font-size:0.78rem;font-weight:700;">${(l.paginas || 0).toLocaleString('pt-BR')}</td>
          ${isAdmin && r.faturamento ? `<td style="font-family:var(--font-mono);font-size:0.78rem;">R$ ${(l.valor || 0).toFixed(2)}</td>` : ''}
        </tr>`).join('')}</tbody>
      </table>
      <div class="imp-totais-row" style="margin-top:0.75rem;">
        <div class="imp-total-item"><span>🎨 COLOR</span><strong>${tc.toLocaleString('pt-BR')} pgs</strong></div>
        <div class="imp-total-item"><span>⬛ MONO</span><strong>${tm.toLocaleString('pt-BR')} pgs</strong></div>
        <div class="imp-total-item total"><span>📄 Total</span><strong>${(tc + tm).toLocaleString('pt-BR')} pgs</strong></div>
      </div>
      ${isAdmin && r.faturamento ? `<div class="hist-faturamento">
        <div class="hist-fat-item"><span>Franquia</span><span>${(r.faturamento.franquiaPags || 0).toLocaleString('pt-BR')} pgs — R$ ${(r.faturamento.franquiaValor || 0).toFixed(2)}</span></div>
        <div class="hist-fat-item"><span>Excedente</span><span>${(r.faturamento.excedentePags || 0).toLocaleString('pt-BR')} pgs × R$ ${(r.faturamento.valorPorPag || 0).toFixed(4)} = R$ ${(r.faturamento.excedenteValor || 0).toFixed(2)}</span></div>
        <div class="hist-fat-item total"><span>💰 Valor Total da Fatura</span><strong>R$ ${(r.faturamento.totalFatura || 0).toFixed(2)}</strong></div>
      </div>` : ''}
      <div style="font-size:0.75rem;color:var(--muted);margin-top:1rem;font-family:var(--font-mono);">Registrado por: ${r.registradoPor || '—'}</div>`;

  } else {
    const d = new Date(r.data + 'T12:00:00');
    titleHtml = `<span class="rotinas-modulo-badge cftv">📷 CFTV</span> ${d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}`;
    const resumoTop = `<div style="display:flex;gap:0.75rem;margin-bottom:1.25rem;flex-wrap:wrap;">
      <span class="cftv-counter ativo" style="padding:0.3rem 0.75rem;">✅ ${r.ATIVO || 0} Ativo</span>
      <span class="cftv-counter inativo" style="padding:0.3rem 0.75rem;">❌ ${r.INATIVO || 0} Inativo</span>
      <span class="cftv-counter intermitente" style="padding:0.3rem 0.75rem;">⚠️ ${r.INTERMITENTE || 0} Intermitente</span>
      <span class="cftv-counter nao-inst" style="padding:0.3rem 0.75rem;">🔧 ${r.NAO_INSTALADO || 0} Não inst.</span>
    </div>`;
    bodyHtml = resumoTop + (r.dvrs || []).map(dvr => `
      <div style="margin-bottom:1.25rem;">
        <div style="font-size:0.72rem;font-family:var(--font-mono);text-transform:uppercase;color:var(--muted);margin-bottom:0.5rem;letter-spacing:0.08em;">${dvr.nome}</div>
        <table class="hist-detail-table" style="width:100%;">
          <thead><tr><th>Canal</th><th>Câmera</th><th>Rack</th><th>Status</th><th>Obs.</th></tr></thead>
          <tbody>${(dvr.cameras || []).map(c => `<tr>
            <td style="font-family:var(--font-mono);">${c.canal}</td>
            <td>${c.nome}</td>
            <td style="color:var(--muted);">${c.rack || '—'}</td>
            <td><span class="cftv-hist-status ${c.status.toLowerCase().replace('_', '-')}">${c.status.replace('_', ' ')}</span></td>
            <td style="color:var(--muted);font-size:0.75rem;">${c.obs || '—'}</td>
          </tr>`).join('')}</tbody>
        </table>
      </div>`).join('') +
      `<div style="font-size:0.75rem;color:var(--muted);margin-top:0.5rem;font-family:var(--font-mono);">Registrado por: ${r.registradoPor || '—'}${r.obs ? ` · Obs: ${r.obs}` : ''}</div>`;
  }

  title.innerHTML = titleHtml;
  body.innerHTML = bodyHtml;
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeHistModal() {
  const modal = document.getElementById('rotinas-hist-modal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
}

// Fechar modal ao clicar fora
document.addEventListener('click', e => {
  const modal = document.getElementById('rotinas-hist-modal');
  if (modal && e.target === modal) closeHistModal();
});

function renderHistoricoTable() {
  const el = document.getElementById('historico-tbody');
  if (!el) return;
  if (!_historico.length) { el.innerHTML = `<tr><td colspan="5"><div class="rotinas-hist-empty">Nenhum registro encontrado.</div></td></tr>`; return; }
  const isAdmin = currentUser?.isAdmin || currentUser?.isSuperAdmin;
  const canDel = currentUser?.isSuperAdmin;
  el.innerHTML = _historico.map(r => {
    let badge, dataStr, resumo;
    const _hora = r.registradoEm?.toDate ? r.registradoEm.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
    if (r._col === 'servidor') {
      badge = `<span class="rotinas-modulo-badge servidor">🖥️ Servidor</span>`;
      dataStr = r.data ? new Date(r.data + 'T12:00:00').toLocaleDateString('pt-BR') : '—';
      resumo = (r.leituras || []).map(l => {
        const discos = l.discos?.length ? l.discos : [{ nome: 'C:', pct: l.pct || 0, usado: l.usadoGB || 0, total: l.totalGB || 0, unidade: 'GB' }];
        return `${l.nome}: ` + discos.map(d => `${d.nome} ${d.pct}%`).join(' · ');
      }).join(' | ');
    } else if (r._col === 'impressoras') {
      badge = `<span class="rotinas-modulo-badge impressoras">🖨️ Impressoras</span>`;
      const [ano, mes] = (r.mesAno || '').split('-');
      dataStr = r.mesAno ? new Date(parseInt(ano), parseInt(mes) - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : '—';
      const tc = (r.leituras || []).filter(l => l.tipo === 'COLOR').reduce((s, l) => s + l.paginas, 0);
      const tm = (r.leituras || []).filter(l => l.tipo === 'MONO').reduce((s, l) => s + l.paginas, 0);
      resumo = `🎨 ${tc.toLocaleString('pt-BR')} · ⬛ ${tm.toLocaleString('pt-BR')} · Total: ${(tc + tm).toLocaleString('pt-BR')} pgs`;
    } else {
      badge = `<span class="rotinas-modulo-badge cftv">📷 CFTV</span>`;
      dataStr = r.data ? new Date(r.data + 'T12:00:00').toLocaleDateString('pt-BR') : '—';
      resumo = `✅ ${r.ATIVO || 0} · ❌ ${r.INATIVO || 0} · ⚠️ ${r.INTERMITENTE || 0} · 🔧 ${r.NAO_INSTALADO || 0}`;
    }
    return `<tr class="hist-main-row" onclick="openHistModal('${r._id}')" title="Clique para ver detalhes">
      <td>${badge}</td>
      <td style="font-family:var(--font-mono);font-size:0.78rem;">${dataStr}${_hora ? `<br><span style="font-size:0.68rem;color:var(--muted);">${_hora}</span>` : ''}</td>
      <td style="font-size:0.78rem;color:var(--muted);">${resumo}</td>
      <td style="font-size:0.78rem;">${r.registradoPor || '—'}</td>
      <td style="display:flex;gap:0.4rem;align-items:center;">
        <button class="hist-expand-btn" title="Ver detalhes">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
        </button>
        ${canDel ? `<button onclick="event.stopPropagation();deleteRotinaRecord('${r._id}','${r._col}')" style="background:none;border:none;cursor:pointer;color:var(--muted);padding:0.2rem;" title="Excluir">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
        </button>` : ''}
      </td>
    </tr>`;
  }).join('');
}

function toggleHistDetail(id) { _histExp[id] = !_histExp[id]; renderHistoricoTable(); }
function setHistFiltroModulo(v) { _histFiltroModulo = v; loadHistorico(); }
function setHistFiltroMes(v) { _histFiltroMes = v; loadHistorico(); }

async function deleteRotinaRecord(id, col) {
  if (!confirm('Excluir este registro?')) return;
  const m = { servidor: 'rotinas_servidor', impressoras: 'rotinas_impressoras', cftv: 'rotinas_cftv' };
  try { await db.collection(m[col]).doc(id).delete(); showRotinasToast('Excluído.', 'success'); loadHistorico(); }
  catch (e) { showRotinasToast('Erro ao excluir.', 'error'); }
}

// ── Exportar XLS ──────────────────────────────────────────────────────────────
function exportHistoricoXLS() {
  if (!_historico.length) { showRotinasToast('Nenhum dado.', 'error'); return; }
  const wb = XLSX.utils.book_new();
  const srv = _historico.filter(r => r._col === 'servidor');
  if (srv.length) { const rows = []; srv.forEach(r => (r.leituras || []).forEach(l => rows.push({ 'Data': r.data, 'Servidor': l.nome, 'Total (GB)': l.totalGB, 'Disponível': l.disponivelGB, 'Usado': l.usadoGB, '% Uso': l.pct + '%', 'Obs': l.obs || '', 'Por': r.registradoPor }))); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Servidor'); }
  const imp = _historico.filter(r => r._col === 'impressoras');
  if (imp.length) { const rows = []; imp.forEach(r => { (r.leituras || []).forEach(l => rows.push({ 'Mês': r.mesAno, 'Tipo': l.tipo, 'Impressora': l.nome, 'Depto': l.departamento || '', 'Anterior': l.anterior || 0, 'Atual': l.atual || 0, 'Páginas': l.paginas || 0, 'Valor': l.valor || 0, 'Por': r.registradoPor })); if (r.faturamento) rows.push({ 'Mês': r.mesAno, 'Tipo': 'FATURAMENTO TOTAL', 'Impressora': '', 'Depto': '', 'Anterior': '', 'Atual': '', 'Páginas': '', 'Valor': r.faturamento.totalFatura, 'Por': r.registradoPor }); }); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Impressoras'); }
  const cftv = _historico.filter(r => r._col === 'cftv');
  if (cftv.length) { const rows = []; cftv.forEach(r => (r.dvrs || []).forEach(dvr => (dvr.cameras || []).forEach(c => rows.push({ 'Data': r.data, 'DVR': dvr.nome, 'Canal': c.canal, 'Câmera': c.nome, 'Rack': c.rack || '', 'Status': c.status, 'Obs': c.obs || '', 'Por': r.registradoPor })))); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'CFTV'); }
  XLSX.writeFile(wb, `rotinas_${new Date().toISOString().slice(0, 10)}.xlsx`);
  showRotinasToast('Exportado! 📥', 'success');
}

// ── Toast ─────────────────────────────────────────────────────────────────────
let _tt = null;
function showRotinasToast(msg, type = 'success') {
  let t = document.getElementById('rotinas-toast');
  if (!t) { t = document.createElement('div'); t.id = 'rotinas-toast'; t.className = 'rotinas-toast'; document.body.appendChild(t); }
  t.textContent = msg; t.className = `rotinas-toast ${type}`;
  requestAnimationFrame(() => t.classList.add('show'));
  if (_tt) clearTimeout(_tt);
  _tt = setTimeout(() => t.classList.remove('show'), 3200);
}

// ── Init ──────────────────────────────────────────────────────────────────────
async function initRotinas() {
  await seedRotinasDados();
  await loadRotinasConfig();
  await loadUltimosRegs();
  renderServidoresChecklist();
  renderImpressorasChecklist();
  renderCFTVChecklist();
  const isAdmin = currentUser?.isAdmin || currentUser?.isSuperAdmin;
  const hoje = new Date();
  const mes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  const impMes = document.getElementById('imp-mes-ano');
  if (impMes) { impMes.value = mes; loadLeituraAnterior(mes); }
  const histMes = document.getElementById('hist-filtro-mes');
  if (histMes) histMes.value = mes;
  _histFiltroMes = mes;
  const fat = document.getElementById('imp-faturamento-section');
  if (fat) fat.style.display = isAdmin ? 'block' : 'none';
  const manageImpBtn = document.getElementById('btn-gerenciar-impressoras');
  if (manageImpBtn) manageImpBtn.style.display = isAdmin ? 'flex' : 'none';
  const manageCftvBtn = document.getElementById('btn-gerenciar-cftv');
  if (manageCftvBtn) manageCftvBtn.style.display = isAdmin ? 'flex' : 'none';
  const cftvData = document.getElementById('cftv-data-hoje');
  if (cftvData) cftvData.textContent = hoje.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
}

async function _initRotinasPage() {
  await loadUsers();
  const savedId = await ensureSession();
  if (!savedId) { window.location.href = 'login.html'; return; }
  const user = users.find(u => u.id === savedId);
  if (!user) { window.location.href = 'login.html'; return; }
  currentUser = user;
  if (typeof initDarkMode === 'function') initDarkMode();
  if (typeof initSessionTimer === 'function') initSessionTimer(user.role);
  const collapsed = localStorage.getItem('chamados-sidebar-collapsed') === '1';
  const sidebar = document.getElementById('chamados-sidebar');
  const icon = document.getElementById('sidebar-toggle-icon');
  if (sidebar) { sidebar.classList.add('no-transition'); if (collapsed) { sidebar.classList.add('collapsed'); if (icon) icon.textContent = '›'; } requestAnimationFrame(() => requestAnimationFrame(() => sidebar.classList.remove('no-transition'))); }
  const syncBtn = document.getElementById('sync-fab-nav');
  if (syncBtn) syncBtn.style.display = user.isSuperAdmin ? 'flex' : 'none';
  const configBtn = document.getElementById('sidebar-config-btn');
  if (configBtn) configBtn.style.display = (user.isAdmin || user.isSuperAdmin) ? 'flex' : 'none';
  const acessos = user.isSuperAdmin ? ['chamados', 'materiais', 'inventario', 'rotinas'] : (user.acessos || []);
  ['materiais', 'inventario', 'rotinas'].forEach(mod => {
    const el = document.getElementById('cs-mod-' + mod);
    const elSub = document.getElementById('sub-' + mod);
    const show = (user.isSuperAdmin || acessos.includes(mod)) ? 'flex' : 'none';
    if (el) el.style.display = show;
    if (elSub) elSub.style.display = show;
  });

  // Módulo Comercial — visibilidade na sidebar
  const canComercial = user.isSuperAdmin || user.isAdminComercial || user.isComercial ||
    (user.acessos || []).includes('comercial') || (user.acessos || []).includes('adminComercial');
  const modComercialBtn = document.getElementById('mod-pai-comercial-btn');
  if (modComercialBtn) modComercialBtn.style.display = canComercial ? 'flex' : 'none';
  if (typeof initModPai === 'function') initModPai('rotinas');
  const avatar = document.getElementById('cs-sidebar-avatar');
  const nameEl = document.getElementById('cs-sidebar-name');
  const roleEl = document.getElementById('cs-sidebar-role');
  if (avatar) avatar.textContent = user.username.charAt(0).toUpperCase();
  if (nameEl) nameEl.textContent = capitalizeName(user.username);
  if (roleEl) roleEl.innerHTML = getSectorBadge(user);
  initRotinas();
}

document.addEventListener('DOMContentLoaded', _initRotinasPage);