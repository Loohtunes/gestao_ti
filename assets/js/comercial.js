// ===== COMERCIAL v2 — Sub-etapas, Dias Úteis, Feriados =====

// ── Logout (contexto Comercial — sem closeTicketDetail) ───────────────────────
function performLogout() {
  if (!confirm('Deseja realmente sair do sistema?')) return;
  if (_unsubObras) { _unsubObras(); _unsubObras = null; }
  if (typeof stopSessionTimer === 'function') stopSessionTimer();
  currentUser = null;
  localStorage.removeItem('chamados-current-user-id');
  window.location.href = 'login.html';
}

function toggleMenuSidebar() {
  const s = document.getElementById('chamados-sidebar'), i = document.getElementById('sidebar-toggle-icon');
  if (!s) return;
  const c = s.classList.toggle('collapsed');
  if (i) i.textContent = c ? '›' : '‹';
  localStorage.setItem('chamados-sidebar-collapsed', c ? '1' : '0');
}

// ── Feriados nacionais fixos BR ───────────────────────────────────────────────
const FERIADOS_BR = ['01-01', '04-21', '05-01', '09-07', '10-12', '11-02', '11-15', '11-20', '12-25'];

function isDiaUtil(date) {
  const dow = date.getDay();
  if (dow === 0 || dow === 6) return false;
  const mmdd = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return !FERIADOS_BR.includes(mmdd);
}

function addDiasCorridos(dataStr, dias) {
  if (!dataStr) return null;
  const d = new Date(dataStr + 'T12:00:00');
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}
function addDiasUteis(dataStr, dias) {
  if (!dataStr || dias === 0) return dataStr || null;
  const d = new Date(dataStr + 'T12:00:00');
  let count = 0;
  while (count < dias) { d.setDate(d.getDate() + 1); if (isDiaUtil(d)) count++; }
  return d.toISOString().slice(0, 10);
}

// ── Config etapas/sub-etapas ──────────────────────────────────────────────────
const ETAPAS_CONFIG = {
  proposta: {
    id: 'proposta', nome: 'Proposta Consolidada', short: 'Proposta', opcional: false, cor: '#3b82f6',
    subEtapas: [
      { id: 'elaboracao', nome: 'Elaboração', dias: 2, refEtapa: null, refSub: null, isNovaDataZero: false, dateLivre: false },
      { id: 'envio', nome: 'Envio', dias: 2, refEtapa: 'proposta', refSub: 'elaboracao', isNovaDataZero: false, dateLivre: false },
      { id: 'analise_cliente', nome: 'Análise do Cliente', dias: 3, refEtapa: 'proposta', refSub: 'envio', isNovaDataZero: false, dateLivre: false, isAprovacaoRecusa: true },
      { id: 'assinatura', nome: 'Assinatura', dias: 5, refEtapa: 'proposta', refSub: 'analise_cliente', isNovaDataZero: false, dateLivre: false, isAprovacaoRecusa: true },
    ]
  },
  contrato: {
    id: 'contrato', nome: 'Contrato', short: 'Contrato', opcional: false, cor: '#8b5cf6',
    subEtapas: [
      { id: 'elaboracao', nome: 'Elaboração', dias: 2, refEtapa: null, refSub: null, isNovaDataZero: false, dateLivre: false },
      { id: 'em_analise', nome: 'Em Análise', dias: 0, refEtapa: null, refSub: null, isNovaDataZero: false, dateLivre: true, isAnalise: true },
      { id: 'envio', nome: 'Envio', dias: 3, refEtapa: 'contrato', refSub: 'em_analise', isNovaDataZero: false, dateLivre: false },
      { id: 'analise_cliente', nome: 'Análise do Cliente', dias: 3, refEtapa: 'contrato', refSub: 'envio', isNovaDataZero: false, dateLivre: false, isAprovacaoRecusa: true },
      { id: 'assinatura', nome: 'Assinatura', dias: 5, refEtapa: 'contrato', refSub: 'analise_cliente', isNovaDataZero: false, dateLivre: false, isAprovacaoRecusa: true },
    ]
  },
  documentacoes: {
    id: 'documentacoes', nome: 'Documentações', short: 'Docs', opcional: false, cor: '#f97316',
    isIndependente: true,
    subEtapas: [
      { id: 'coc', nome: 'COC', dias: 0, refEtapa: null, refSub: null, isNovaDataZero: false, dateLivre: true, isAnalise: true, isIndependente: true, isCocLista: true },
      { id: 'art', nome: 'ART', dias: 0, refEtapa: null, refSub: null, isNovaDataZero: false, dateLivre: true, isAnalise: true, isIndependente: true, isCancelavel: true },
      { id: 'cno_sfobras', nome: 'CNO/SFOBRAS', dias: 0, refEtapa: null, refSub: null, isNovaDataZero: false, dateLivre: true, isAnalise: true, isIndependente: true, isCancelavel: true },
      { id: 'serasa', nome: 'Serasa', dias: 0, refEtapa: null, refSub: null, isNovaDataZero: false, dateLivre: true, isAnalise: true, isIndependente: true, isCancelavel: true },
    ]
  },
  aditivos: {
    id: 'aditivos', nome: 'Aditivos / Termo', short: 'Aditivos', opcional: true, cor: '#ec4899',
    isLista: true,
    subEtapasTemplate: [
      { id: 'comparativo_recebimento', nome: 'Recebimento do Comparativo', dias: 0, dateLivre: true },
      { id: 'elaboracao', nome: 'Elaboração', dias: 2, dateLivre: false },
      { id: 'analise_comparativo', nome: 'Em Análise', dias: 0, dateLivre: true },
      { id: 'carta_envio', nome: 'Envio da Carta Aditiva', dias: 2, dateLivre: false },
      { id: 'carta_aprovacao', nome: 'Aprovação da Carta Aditiva', dias: 3, dateLivre: false, isAprovacaoRecusa: true },
      { id: 'carta_assinatura', nome: 'Assinatura da Carta Aditiva', dias: 2, dateLivre: false, isAprovacaoRecusa: true, podeEncerrar: true },
      { id: 'termo_elaboracao', nome: 'Elaboração', dias: 2, dateLivre: false },
      { id: 'termo_analise', nome: 'Em Análise', dias: 0, dateLivre: true },
      { id: 'termo_envio', nome: 'Envio do Termo Aditivo', dias: 3, dateLivre: false },
      { id: 'termo_assinatura', nome: 'Assinatura do Termo Aditivo', dias: 5, dateLivre: false, isAprovacaoRecusa: true },
    ]
  },
  medicao: {
    id: 'medicao', nome: 'Medição', short: 'Medição', opcional: true, cor: '#6b7280',
    isLista: true,
    subEtapasTemplate: [
      { id: 'elaboracao', nome: 'Elaboração', dias: 2, dateLivre: false },
      { id: 'em_aprovacao', nome: 'Em aprovação', dias: 2, dateLivre: false },
      { id: 'envio', nome: 'Envio', dias: 0, dateLivre: true },
      { id: 'aprovacao', nome: 'Aprovação do Cliente', dias: 2, dateLivre: false, isAprovacaoRecusa: true },
    ]
  },
};

const ETAPAS_ORDER = ['proposta', 'contrato', 'documentacoes', 'aditivos', 'medicao'];

const REPRESENTANTES = ['Verdile', 'Ricardo', 'Sebastião', 'Ângelo', 'Sérgio', 'Matheus', 'Henrique', 'Flávio', 'Gazzo'];


// ── Helper lista aditivos/medições ───────────────────────────────────────────
function criarItemLista(etapaId, titulo, dataPrevista) {
  const cfg = ETAPAS_CONFIG[etapaId];
  const subEtapas = {};
  (cfg.subEtapasTemplate || []).forEach((sub, i) => {
    subEtapas[sub.id] = { status: i === 0 ? 'active' : 'pending', dataLimite: null, dataConclusao: null, motivoAtraso: null, revisoes: [], observacoes: [] };
  });
  return { id: `${etapaId}_${Date.now()}`, titulo, dataPrevista: dataPrevista || null, status: 'active', subEtapas };
}


// ── Responsáveis (multi-atribuição) ─────────────────────────────
function _getResponsaveis(o) {
  if (!o) return [];
  if (Array.isArray(o.responsaveis)) return o.responsaveis.filter(Boolean);
  if (o.responsavel) return [o.responsavel];
  return [];
}
function _temResp(o, u) { return !!u && _getResponsaveis(o).includes(u); }
function _respBtnLabel(o) {
  const a = _getResponsaveis(o);
  if (!a.length) return 'Atribuir';
  if (a.length === 1) return a[0];
  return a.length + ' pessoas';
}
function _respBadges(o, fs, alvo) {
  const arr = _getResponsaveis(o);
  if (!arr.length) return '';
  fs = fs || '0.62rem';
  const me = currentUser?.username;
  const destaque = alvo || (typeof _filtroUsuarioPendencia !== 'undefined' ? _filtroUsuarioPendencia : null) || me;
  const icoP = '<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';
  const icoU = '<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
  return arr.map(r => (r === destaque)
    ? `<span style="display:inline-flex;align-items:center;gap:0.25rem;background:color-mix(in srgb,var(--accent) 12%,transparent);color:var(--accent);border:1px solid color-mix(in srgb,var(--accent) 30%,transparent);border-radius:5px;font-size:${fs};font-weight:700;padding:0.1rem 0.45rem;font-family:var(--font-mono);">${icoP} ${r === me ? 'Você' : r}</span>`
    : `<span style="display:inline-flex;align-items:center;gap:0.25rem;background:var(--surface2);color:var(--muted);border:1px solid var(--border2);border-radius:5px;font-size:${fs};font-weight:600;padding:0.1rem 0.45rem;font-family:var(--font-mono);">${icoU} ${r}</span>`
  ).join(' ');
}


function _migrateObraToV3(obra) {
  const etapas = obra.etapas ? JSON.parse(JSON.stringify(obra.etapas)) : {};

  // 1. Renomear cno → documentacoes
  if (etapas['cno'] && !etapas['documentacoes']) {
    etapas['documentacoes'] = {
      status: etapas['cno'].status || 'pending',
      ativa: etapas['cno'].ativa !== false,
      revisoes: etapas['cno'].revisoes || [],
      observacoes: etapas['cno'].observacoes || [],
      subEtapas: {
        coc: { status: 'pending', dataLimite: null, dataConclusao: null, motivoAtraso: null, revisoes: [], observacoes: [] },
        art: { status: 'pending', dataLimite: null, dataConclusao: null, motivoAtraso: null, revisoes: [], observacoes: [] },
        cno_sfobras: { status: 'pending', dataLimite: null, dataConclusao: null, motivoAtraso: null, revisoes: [], observacoes: [] },
        serasa: { status: 'pending', dataLimite: null, dataConclusao: null, motivoAtraso: null, revisoes: [], observacoes: [] },
      }
    };
    delete etapas['cno'];
  }

  // 2. Converter aditivos de objeto para lista
  if (etapas['aditivos'] && !Array.isArray(etapas['aditivos']?.lista)) {
    const old = etapas['aditivos'];
    const lista = [];
    if (old.status && old.status !== 'pending') {
      lista.push({ id: 'aditivo_1', titulo: 'Aditivo 1', dataPrevista: null, status: old.status, subEtapas: old.subEtapas || {} });
    }
    etapas['aditivos'] = { status: old.status || 'pending', ativa: old.ativa || false, lista };
  }

  // 3. Converter medicao de objeto para lista
  if (etapas['medicao'] && !Array.isArray(etapas['medicao']?.lista)) {
    const old = etapas['medicao'];
    const lista = [];
    if (old.status && old.status !== 'pending') {
      lista.push({ id: 'medicao_1', titulo: 'Medição 1', dataPrevista: null, status: old.status, subEtapas: old.subEtapas || {} });
    }
    etapas['medicao'] = { status: old.status || 'pending', ativa: old.ativa || false, lista };
  }

  return { etapas };
}


function _migrateObraToV9(obra) {
  // Multi-atribuição: responsavel (texto) → responsaveis (lista).
  const etapas = obra.etapas ? JSON.parse(JSON.stringify(obra.etapas)) : {};
  const conv = (o) => {
    if (!o) return;
    if (!Array.isArray(o.responsaveis)) o.responsaveis = o.responsavel ? [o.responsavel] : [];
    if ('responsavel' in o) delete o.responsavel;
  };
  Object.values(etapas).forEach(e => {
    if (!e) return;
    if (Array.isArray(e.lista)) e.lista.forEach(item => Object.values(item.subEtapas || {}).forEach(conv));
    if (Array.isArray(e.cocLista)) e.cocLista.forEach(conv);
    if (e.subEtapas) Object.values(e.subEtapas).forEach(conv);
  });
  return { etapas };
}

function _migrateObraToV8(obra) {
  // Aditivos: adiciona "Elaboração" (termo_elaboracao) e "Em Análise" (termo_analise) ANTES de termo_envio.
  // Item já concluído → subs novas concluídas automaticamente; item em andamento → subs pendentes
  // e a sub ativa é re-derivada para a 1ª não finalizada (ações liberadas, sequência consistente).
  const etapas = obra.etapas ? JSON.parse(JSON.stringify(obra.etapas)) : {};
  const hoje = new Date().toISOString().slice(0, 10);
  const ordem = ['comparativo_recebimento', 'elaboracao', 'analise_comparativo', 'carta_envio', 'carta_aprovacao', 'carta_assinatura', 'termo_elaboracao', 'termo_analise', 'termo_envio', 'termo_assinatura'];
  const novos = ['termo_elaboracao', 'termo_analise'];
  (etapas.aditivos?.lista || []).forEach(item => {
    if (!item.subEtapas) return;
    const itemConcluido = item.status === 'done'
      || item.subEtapas.termo_envio?.status === 'done'
      || item.subEtapas.termo_assinatura?.status === 'done';
    novos.forEach(id => {
      if (item.subEtapas[id]) return;
      if (itemConcluido) {
        item.subEtapas[id] = { status: 'done', autoConcluida: true, dataInicio: null, dataLimite: null, dataConclusao: item.dataConclusao || hoje, motivoAtraso: null, revisoes: [], observacoes: [] };
      } else {
        item.subEtapas[id] = { status: 'pending', dataInicio: null, dataLimite: null, dataConclusao: null, motivoAtraso: null, revisoes: [], observacoes: [] };
      }
    });
    if (!itemConcluido) {
      let achouAtiva = false;
      ordem.forEach(id => {
        const s = item.subEtapas[id];
        if (!s) return;
        if (s.status === 'done' || s.status === 'pulada' || s.bloqueada) return;
        if (!achouAtiva) {
          if (s.status !== 'active') { s.status = 'active'; if (!s.dataInicio) s.dataInicio = hoje; }
          achouAtiva = true;
        } else if (s.status === 'active') {
          s.status = 'pending';
        }
      });
    }
  });
  return { etapas };
}

function _migrateObraToV7(obra) {
  // Insere as sub-etapas novas (Em aprovação / Em Análise) nas obras existentes,
  // TRAVADAS: aparecem mas não interagem nem bloqueiam o avanço.
  const etapas = obra.etapas ? JSON.parse(JSON.stringify(obra.etapas)) : {};
  const locked = () => ({ status: 'pending', bloqueada: true, dataLimite: null, dataConclusao: null, motivoAtraso: null, revisoes: [], observacoes: [] });
  (etapas.medicao?.lista || []).forEach(item => {
    if (item.subEtapas && !item.subEtapas.em_aprovacao) item.subEtapas.em_aprovacao = locked();
  });
  (etapas.aditivos?.lista || []).forEach(item => {
    if (item.subEtapas && !item.subEtapas.analise_comparativo) item.subEtapas.analise_comparativo = locked();
  });
  return { etapas };
}

function _migrateObraToV6(obra) {
  // Adiciona carta_assinatura nos aditivos existentes
  const etapas = obra.etapas ? JSON.parse(JSON.stringify(obra.etapas)) : {};
  const blank = () => ({ status: 'pending', dataLimite: null, dataConclusao: null, motivoAtraso: null, revisoes: [], observacoes: [] });
  (etapas.aditivos?.lista || []).forEach(item => {
    if (!item.subEtapas.carta_assinatura) {
      item.subEtapas.carta_assinatura = { ...blank() };
      // Se carta_aprovacao está done, carta_assinatura fica active
      if (item.subEtapas.carta_aprovacao?.status === 'done' &&
        (item.subEtapas.termo_envio?.status === 'pending' || !item.subEtapas.termo_envio)) {
        item.subEtapas.carta_assinatura.status = 'active';
      }
    }
  });
  return { etapas };
}

function _migrateObraToV5(obra) {
  const etapas = obra.etapas ? JSON.parse(JSON.stringify(obra.etapas)) : {};
  ['aditivos', 'medicao'].forEach(etapaId => {
    const lista = etapas[etapaId]?.lista || [];
    lista.forEach(item => {
      const subs = item.subEtapas || {};
      // Renomear em_analise → elaboracao nos aditivos e medicao
      if (subs['em_analise'] && !subs['elaboracao']) {
        subs['elaboracao'] = { ...subs['em_analise'] };
        delete subs['em_analise'];
      }
      item.subEtapas = subs;
    });
  });
  return { etapas };
}

function _migrateObraToV4(obra) {
  const etapas = obra.etapas ? JSON.parse(JSON.stringify(obra.etapas)) : {};
  const hoje = new Date().toISOString().slice(0, 10);
  const blank = () => ({ status: 'pending', dataLimite: null, dataConclusao: null, motivoAtraso: null, revisoes: [], observacoes: [] });

  // Proposta: add elaboracao and analise_cliente if missing
  if (etapas.proposta?.subEtapas) {
    if (!etapas.proposta.subEtapas.elaboracao) {
      // Insert elaboracao as done (old obras already had envio)
      etapas.proposta.subEtapas.elaboracao = { ...blank(), status: etapas.proposta.subEtapas.envio ? 'done' : 'pending' };
    }
    if (!etapas.proposta.subEtapas.analise_cliente) {
      etapas.proposta.subEtapas.analise_cliente = { ...blank() };
    }
  }

  // Contrato: add elaboracao and analise_cliente if missing
  if (etapas.contrato?.subEtapas) {
    if (!etapas.contrato.subEtapas.elaboracao) {
      etapas.contrato.subEtapas.elaboracao = { ...blank(), status: etapas.contrato.subEtapas.em_analise ? 'done' : 'pending' };
    }
    if (!etapas.contrato.subEtapas.analise_cliente) {
      etapas.contrato.subEtapas.analise_cliente = { ...blank() };
    }
  }

  return { etapas };
}


// ── Init estrutura etapas ─────────────────────────────────────────────────────
function initObraEtapas(dataFechamento) {
  const etapas = {};
  ETAPAS_ORDER.forEach(etapaId => {
    const cfg = ETAPAS_CONFIG[etapaId];
    const isFirst = etapaId === 'proposta';
    if (cfg.isLista) {
      etapas[etapaId] = { status: 'pending', ativa: false, lista: [] };
      return;
    }
    etapas[etapaId] = { status: isFirst ? 'active' : 'pending', ativa: !cfg.opcional, subEtapas: {}, revisoes: [], observacoes: [] };
    const subs = cfg.subEtapas || [];
    subs.forEach((sub, idx) => {
      const isFirstSub = isFirst && idx === 0;
      etapas[etapaId].subEtapas[sub.id] = {
        status: isFirstSub ? 'active' : 'pending',
        dataInicio: isFirstSub ? dataFechamento : null,
        dataLimite: isFirstSub && sub.dias ? addDiasUteis(dataFechamento, sub.dias) : null,
        dataConclusao: null,
        motivoAtraso: null,
        revisoes: [],
        observacoes: [],
      };
    });
  });
  return etapas;
}

function calcDataLimite(subConfig, etapasData, dataFechamento) {
  if (subConfig.dateLivre || subConfig.isNovaDataZero) return null;
  if (subConfig.refEtapa === null) return addDiasUteis(dataFechamento, subConfig.dias);
  const refData = etapasData?.[subConfig.refEtapa]?.subEtapas?.[subConfig.refSub]?.dataConclusao;
  if (!refData) return null;
  return addDiasUteis(refData, subConfig.dias);
}

// ── Estado ────────────────────────────────────────────────────────────────────
let _obras = [], _obraAtual = null, _filtroRep = '', _filtroEtapa = '', _unsubObras = null;
let _filtroDataDe = '', _filtroDataAte = '', _filtroEtapaAtraso = '', _filtroBusca = '';
let _ordenacao = 'recente';
let _filtroPeriodoDe = '', _filtroPeriodoAte = '';
let _filtroMinhasPendencias = false;
let _currentObraId = null; // ID da obra aberta no modal
let _filtroUsuarioPendencia = ''; // Para visualização do gestor
let _paginaAtual = 0;
let _obrasPorPagina = parseInt(localStorage.getItem('comercial-per-page') || '12');

function setFiltroRep(val) { _filtroRep = val; _paginaAtual = 0; renderObras(); }
function setFiltroEtapa(val) { _filtroEtapa = val; _paginaAtual = 0; renderObras(); }
function setFiltroDataDe(val) { _filtroDataDe = val; _paginaAtual = 0; renderObras(); }
function setFiltroDataAte(val) { _filtroDataAte = val; _paginaAtual = 0; renderObras(); }
function setFiltroEtapaAtraso(val) { _filtroEtapaAtraso = val; _paginaAtual = 0; renderObras(); }
function setFiltroBusca(val) { _filtroBusca = val.toLowerCase().trim(); _paginaAtual = 0; renderObras(); }
function setOrdenacao(val) { _ordenacao = val; _paginaAtual = 0; renderObras(); }
function setFiltroPeriodoDe(val) { _filtroPeriodoDe = val; _paginaAtual = 0; renderObras(); }
function setFiltroPeriodoAte(val) { _filtroPeriodoAte = val; _paginaAtual = 0; renderObras(); }
function setObrasPorPagina(val) { _obrasPorPagina = parseInt(val); localStorage.setItem('comercial-per-page', val); _paginaAtual = 0; renderObras(); }
function irParaPagina(p) { _paginaAtual = p; renderObras(); window.scrollTo({ top: 0, behavior: 'smooth' }); }

// ── Migração automática de schema ─────────────────────────────────────────────
const SCHEMA_VERSION = 9;

async function migrateObras() {
  try {
    const snap = await db.collection('obras').get();
    const toMigrate = snap.docs.filter(d => (d.data()._schemaVersion || 1) < SCHEMA_VERSION);
    if (!toMigrate.length) return;
    console.log(`[Migração] ${toMigrate.length} obra(s) para migrar para schema v${SCHEMA_VERSION}`);
    for (const doc of toMigrate) {
      try {
        const data = doc.data();
        const ver = data._schemaVersion || 1;
        let migrated = data;
        if (ver < 2) migrated = { ...migrated, ..._migrateObraToV2(migrated) };
        if (ver < 3) migrated = { ...migrated, ..._migrateObraToV3(migrated) };
        if (ver < 4) migrated = { ...migrated, ..._migrateObraToV4(migrated) };
        if (ver < 5) migrated = { ...migrated, ..._migrateObraToV5(migrated) };
        if (ver < 6) migrated = { ...migrated, ..._migrateObraToV6(migrated) };
        if (ver < 7) migrated = { ...migrated, ..._migrateObraToV7(migrated) };
        if (ver < 8) migrated = { ...migrated, ..._migrateObraToV8(migrated) };
        if (ver < 9) migrated = { ...migrated, ..._migrateObraToV9(migrated) };
        migrated._schemaVersion = SCHEMA_VERSION;
        await doc.ref.update(migrated);
      } catch (e) {
        console.warn(`[Migração] Erro na obra ${doc.id}:`, e);
      }
    }
    console.log(`[Migração] Concluída! ${toMigrate.length} obra(s) migrada(s).`);
  } catch (e) {
    console.error('[Migração] Erro geral:', e);
    // Não relançar — onSnapshot deve iniciar mesmo se migração falhar
  }
}

function _migrateObraToV2(obra) {
  if (obra.etapas && !Array.isArray(obra.etapas) && obra.etapas['proposta']) {
    return { _schemaVersion: SCHEMA_VERSION };
  }
  const etapaAtualIdx = obra.etapaAtual ?? 0;
  const etapasAntigas = Array.isArray(obra.etapas) ? obra.etapas : [];
  const dataFechamento = obra.dataFechamento
    || (obra.createdAt?.toDate ? obra.createdAt.toDate().toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));

  const novasEtapas = {};
  ETAPAS_ORDER.forEach((etapaId, idx) => {
    const cfg = ETAPAS_CONFIG[etapaId];
    const antigaEtapa = etapasAntigas[idx] || {};
    let etapaStatus = 'pending';
    if (idx < etapaAtualIdx) etapaStatus = 'done';
    if (idx === etapaAtualIdx) etapaStatus = 'active';
    if (obra.concluida) etapaStatus = 'done';
    const eraAtiva = idx <= etapaAtualIdx || obra.concluida;
    novasEtapas[etapaId] = {
      status: etapaStatus,
      ativa: cfg.opcional ? eraAtiva : true,
      revisoes: antigaEtapa.revisoes || [],
      subEtapas: {},
    };
    if (cfg.isLista) { novasEtapas[etapaId].lista = []; return; }
    (cfg.subEtapas || []).forEach((sub, subIdx) => {
      let subStatus = 'pending';
      if (idx < etapaAtualIdx) subStatus = 'done';
      if (idx === etapaAtualIdx) subStatus = subIdx === 0 ? 'active' : 'pending';
      if (obra.concluida) subStatus = 'done';
      novasEtapas[etapaId].subEtapas[sub.id] = {
        status: subStatus,
        dataLimite: null,
        dataConclusao: subStatus === 'done' ? (antigaEtapa.dataConclusao || null) : null,
        motivoAtraso: null,
        revisoes: [],
      };
    });
  });

  // Não usar FieldValue.delete() para evitar erros — sobrescrever com undefined é suficiente
  return {
    _schemaVersion: SCHEMA_VERSION,
    etapas: novasEtapas,
    dataFechamento: dataFechamento,
    numero: String(obra.numero || obra.id?.slice(-6).toUpperCase() || '—'),
  };
}

function initComercial() {
  if (_unsubObras) { _unsubObras(); _unsubObras = null; }

  // 1. Carga imediata via get() — garante que obras aparecem mesmo se onSnapshot demorar
  db.collection('obras').get()
    .then(snap => {
      _obras = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return tb - ta;
        });
      try { renderObras(); highlightObraFromUrl(); } catch (e) {
        console.error('[renderObras get]', e);
        const el = document.getElementById('obras-grid');
        if (el) el.innerHTML = `<div class="obras-empty"><h3 style="color:#ef4444;">Erro ao renderizar obras</h3><span style="font-size:0.78rem;">${e.message}</span></div>`;
      }
    })
    .catch(e => {
      console.error('[initComercial get]', e);
      const el = document.getElementById('obras-grid');
      if (el) el.innerHTML = `<div class="obras-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <h3 style="color:#ef4444;">Sem permissão para ler obras</h3>
        <span style="font-size:0.78rem;color:var(--muted);">Verifique as regras do Firestore para a coleção "obras" no projeto <strong>${e.code || '?'}</strong></span>
      </div>`;
    });

  // 2. onSnapshot para atualizações em tempo real
  try {
    _unsubObras = db.collection('obras').onSnapshot(
      snap => {
        _obras = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return tb - ta;
          });
        try { renderObras(); } catch (e) { console.error('[renderObras snap]', e); }
        if (_obraAtual) {
          const obra = _obras.find(o => o.id === _obraAtual);
          if (obra) try { _saveAccordionState(); renderObraModal(obra); _restoreAccordionState(); } catch (e) { console.error('[renderObraModal]', e); }
        }
      },
      err => console.error('[onSnapshot obras]', err)
    );
  } catch (e) {
    console.error('[initComercial onSnapshot setup]', e);
  }

  // 3. Migração em background — totalmente isolada
  setTimeout(() => migrateObras(), 2000);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getEtapaAtualId(obra) {
  if (!obra.etapas) return 'proposta';
  for (const id of ETAPAS_ORDER) {
    const e = obra.etapas[id];
    const cfg = ETAPAS_CONFIG[id];
    if (!e?.ativa || e?.status === 'done') continue;
    if (cfg.isLista) {
      if ((e.lista || []).some(item => item.status === 'active')) return id;
      // Lista ativa com itens mas nenhum active — ainda é a etapa atual
      if ((e.lista || []).length > 0) return id;
    } else if (cfg.isIndependente) {
      // Documentações: qualquer estado ativo/pending = etapa atual
      return id;
    } else if (e?.status === 'active') return id;
  }
  let ultimaDone = null;
  for (const id of ETAPAS_ORDER) {
    if (obra.etapas[id]?.status === 'done') ultimaDone = id;
  }
  if (obra.concluida) return 'concluida';
  return ultimaDone || 'proposta';
}

function getPrazoInfo(prazo) {
  if (!prazo) return { texto: 'Sem prazo definido', cls: '' };
  const d = new Date(prazo + 'T12:00:00'), hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const diff = Math.ceil((d - hoje) / (1000 * 60 * 60 * 24));
  const fmt = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  if (diff <= 0) return { texto: diff === 0 ? 'Vencido hoje!' : `Vencido em ${fmt}`, cls: 'vencido' };
  if (diff <= 7) return { texto: `Vencendo em ${diff} dia${diff !== 1 ? 's' : ''}`, cls: 'urgente' };
  return { texto: `Prazo: ${fmt}`, cls: '' };
}


// Data de referência p/ atraso de uma sub-etapa: dataLimite OU dataPrevista (subs isAnalise/data livre),
// e, em itens de lista ativos, a dataPrevista do item.
function _refAtraso(sub, item) {
  if (!sub) return null;
  return sub.dataLimite || sub.dataPrevista || (sub.status === 'active' && item ? item.dataPrevista : null) || null;
}
function _vencido(ref, status, hoje) {
  return status !== 'done' && status !== 'pulada' && status !== 'cancelado' && !!ref && ref < hoje;
}

function hasEtapaAtrasadaPorId(obra, etapaId) {
  if (!obra.etapas) return false;
  const hoje = new Date().toISOString().slice(0, 10);
  const e = obra.etapas[etapaId];
  if (!e?.ativa) return false;
  if (Array.isArray(e.lista)) {
    return e.lista.some(item => Object.values(item.subEtapas || {}).some(sub => _vencido(_refAtraso(sub, item), sub.status, hoje)));
  }
  return Object.values(e.subEtapas || {}).some(sub => !sub.isCocLista && _vencido(sub.dataLimite || sub.dataPrevista, sub.status, hoje))
    || (e.cocLista || []).some(ci => _vencido(ci.dataPrevista, ci.status, hoje));
}

function hasSubEtapaAtrasada(obra) {
  if (!obra.etapas || obra.concluida) return false;
  const hoje = new Date().toISOString().slice(0, 10);
  for (const id of ETAPAS_ORDER) {
    const e = obra.etapas[id];
    if (!e?.ativa) continue;
    // Lista (aditivos/medicao)
    if (Array.isArray(e.lista)) {
      for (const item of e.lista) {
        for (const sub of Object.values(item.subEtapas || {})) {
          if (_vencido(_refAtraso(sub, item), sub.status, hoje)) return true;
        }
      }
    } else {
      for (const sub of Object.values(e.subEtapas || {})) {
        if (!sub.isCocLista && _vencido(sub.dataLimite || sub.dataPrevista, sub.status, hoje)) return true;
      }
      for (const ci of (e.cocLista || [])) {
        if (_vencido(ci.dataPrevista, ci.status, hoje)) return true;
      }
    }
  }
  return false;
}

// Stripe do card — fonte única: semáforo vermelho > amarelo > azul > verde.
// Percorre TODAS as etapas ativas (listas, normais e Docs independentes),
// descartando sub-etapas/itens pulados e concluídos.
function getCorStripe(obra) {
  if (obra.concluida) return '#22c55e'; // verde
  const hoje = new Date().toISOString().slice(0, 10);
  const d7 = new Date(); d7.setDate(d7.getDate() + 7);
  const d7s = d7.toISOString().slice(0, 10);
  let temAtraso = false, temVencendo = false;
  // Avalia uma sub-etapa/item genérico a partir de status + data de referência
  const avaliar = (status, ref) => {
    if (status === 'done' || status === 'pulada' || status === 'cancelado') return;
    if (!ref) return;
    if (ref < hoje) temAtraso = true;
    else if (ref >= hoje && ref <= d7s) temVencendo = true;
  };
  for (const id of ETAPAS_ORDER) {
    const e = obra.etapas?.[id];
    const cfg = ETAPAS_CONFIG[id];
    if (!e?.ativa || e.status === 'pulada') continue;
    if (cfg?.isLista) {
      (e.lista || []).forEach(item => {
        if (item.status === 'done' || item.status === 'pulada') return;
        // Prioriza o prazo das sub-etapas; o item.dataPrevista entra só como fallback da sub ativa
        Object.values(item.subEtapas || {}).forEach(s => avaliar(s.status, s.dataLimite || s.dataPrevista || (s.status === 'active' ? item.dataPrevista : null)));
      });
    } else {
      Object.values(e.subEtapas || {}).forEach(s => { if (!s.isCocLista) avaliar(s.status, s.dataLimite || s.dataPrevista); });
      (e.cocLista || []).forEach(ci => avaliar(ci.status, ci.dataPrevista));
    }
  }
  if (temAtraso) return '#ef4444';   // vermelho
  // Amarelo: apenas se alguma sub-etapa/item estiver vencendo em ≤7d (independe do prazo estimado da obra)
  if (temVencendo) return '#f59e0b';
  return '#3b82f6';                  // azul padrão
}

// ── Renderizar cards ──────────────────────────────────────────────────────────
function renderObras() {
  const el = document.getElementById('obras-grid');
  if (!el) return;

  // Aplicar filtros
  let lista = [..._obras];
  if (_filtroRep) lista = lista.filter(o => o.representante === _filtroRep);
  if (_filtroEtapa) lista = lista.filter(o => getEtapaAtualId(o) === _filtroEtapa);
  if (_filtroDataDe || _filtroDataAte) {
    lista = lista.filter(obra => {
      return ETAPAS_ORDER.some(etapaId => {
        const e = obra.etapas?.[etapaId]; if (!e?.ativa) return false;
        const cfg = ETAPAS_CONFIG[etapaId];
        const checkSub = sub => {
          if (!sub || sub.status === 'done' || !sub.dataLimite) return false;
          if (_filtroDataDe && sub.dataLimite < _filtroDataDe) return false;
          if (_filtroDataAte && sub.dataLimite > _filtroDataAte) return false;
          return true;
        };
        if (cfg.isLista) return (e.lista || []).some(item => Object.values(item.subEtapas || {}).some(checkSub));
        return Object.values(e.subEtapas || {}).some(checkSub);
      });
    });
  }
  if (_filtroEtapaAtraso) lista = lista.filter(o => hasEtapaAtrasadaPorId(o, _filtroEtapaAtraso));
  // Ordenação
  if (_ordenacao === 'num-asc') lista = [...lista].sort((a, b) => (parseInt(a.numero) || 0) - (parseInt(b.numero) || 0));
  if (_ordenacao === 'num-desc') lista = [...lista].sort((a, b) => (parseInt(b.numero) || 0) - (parseInt(a.numero) || 0));
  // Filtro por período — obras com sub-etapas pendentes com dataLimite no intervalo
  if (_filtroPeriodoDe || _filtroPeriodoAte) {
    lista = lista.filter(obra => {
      if (obra.concluida) return false;
      return ETAPAS_ORDER.some(etapaId => {
        const e = obra.etapas?.[etapaId];
        const cfg = ETAPAS_CONFIG[etapaId];
        if (!e?.ativa) return false;
        const checkSub = sub => {
          if (sub.status === 'done' || !sub.dataLimite) return false;
          if (_filtroPeriodoDe && sub.dataLimite < _filtroPeriodoDe) return false;
          if (_filtroPeriodoAte && sub.dataLimite > _filtroPeriodoAte) return false;
          return true;
        };
        if (cfg.isLista) return (e.lista || []).some(item => Object.values(item.subEtapas || {}).some(checkSub));
        return Object.values(e.subEtapas || {}).some(checkSub);
      });
    });
  }
  if (_filtroMinhasPendencias) {
    const alvo = _filtroUsuarioPendencia || currentUser?.username;
    lista = lista.filter(obra => {
      if (obra.concluida) return false;
      return ETAPAS_ORDER.some(etapaId => {
        const e = obra.etapas?.[etapaId]; const cfg = ETAPAS_CONFIG[etapaId]; if (!e?.ativa) return false;
        if (cfg.isLista) return (e.lista || []).some(item => Object.values(item.subEtapas || {}).some(s => s.status !== 'done' && _temResp(s, alvo)));
        return Object.values(e.subEtapas || {}).some(sub => sub.status !== 'done' && sub.status !== 'cancelado' && _temResp(sub, alvo));
      });
    });
  }
  if (_filtroBusca) lista = lista.filter(o =>
    String(o.numero || '').toLowerCase().includes(_filtroBusca) ||
    (o.nome || '').toLowerCase().includes(_filtroBusca) ||
    (o.representante || '').toLowerCase().includes(_filtroBusca));

  const total = lista.length;
  const totalPags = Math.max(1, Math.ceil(total / _obrasPorPagina));
  _paginaAtual = Math.min(_paginaAtual, totalPags - 1);
  const inicio = _paginaAtual * _obrasPorPagina;
  const paginada = lista.slice(inicio, inicio + _obrasPorPagina);

  // Atualizar contador
  const counter = document.getElementById('obras-counter');
  if (counter) counter.textContent = `${total} obra${total !== 1 ? 's' : ''}`;

  if (!total) {
    el.innerHTML = `<div class="obras-empty">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect width="20" height="14" x="2" y="7" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
      <h3>${_filtroRep || _filtroEtapa || _filtroDataDe || _filtroDataAte ? 'Nenhuma obra com esses filtros' : 'Nenhuma obra cadastrada'}</h3>
      <span style="font-size:0.78rem;">Clique em "+ Nova Obra" para começar</span>
    </div>`;
    _renderPaginacao(0, 0, 0);
    return;
  }

  el.innerHTML = paginada.map(obra => {
    const etapaId = getEtapaAtualId(obra);
    const cfg = ETAPAS_CONFIG[etapaId];
    const cor = obra.concluida ? '#22c55e' : cfg?.cor || 'var(--muted)';
    const etapaNome = obra.concluida ? 'Concluída' : (cfg?.short || '—');
    const prazoInfo = obra.concluida
      ? {
        texto: obra.dataConclusao
          ? `Concluída em ${new Date(obra.dataConclusao + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`
          : 'Concluída', cls: 'concluida'
      }
      : getPrazoInfo(obra.prazoEstimado);
    const hoje2 = new Date().toISOString().slice(0, 10);

    // Stripe: semáforo — fonte única (getCorStripe)
    const corBorda = getCorStripe(obra);

    // Linhas de status por etapa
    const etapaLinhas = ETAPAS_ORDER.map(id => {
      const cfg2 = ETAPAS_CONFIG[id];
      const eData = obra.etapas?.[id];
      if (!eData?.ativa || eData?.status === 'pulada') {
        const _pulada = eData?.status === 'pulada';
        return `
        <div class="card-etapa-row inativa">
          <span class="card-etapa-dot" style="background:var(--surface3);border-color:var(--border2);color:var(--muted);">${_pulada ? '⊘' : '·'}</span>
          <span class="card-etapa-nome" style="${_pulada ? 'opacity:0.6;text-decoration:line-through;' : ''}">${cfg2.short}</span>
          ${_pulada
            ? `<span style="font-size:0.65rem;color:var(--muted);opacity:0.7;display:inline-flex;align-items:center;"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px;margin-right:2px;opacity:0.7;"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>Pulada</span>`
            : '<span class="card-etapa-info">—</span>'}
        </div>`;
      }
      const eStatus = eData.status || 'pending';
      let dot = '', dotStyle = '', info = '';
      // Lista (aditivos/medicao)
      if (cfg2.isLista) {
        const lista = eData.lista || [];
        const total = lista.length;
        const done = lista.filter(i => i.status === 'done').length;
        if (!eData.ativa || eStatus === 'pulada') {
          dot = '⊘'; dotStyle = 'background:var(--surface3);border-color:var(--border2);color:var(--muted);';
          info = '<span style="font-size:0.65rem;color:var(--muted);opacity:0.7;display:inline-flex;align-items:center;"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px;margin-right:2px;opacity:0.7;"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>Pulada</span>';
        } else if (obra.concluida || (total > 0 && done === total)) {
          dot = '✓'; dotStyle = 'background:#22c55e;border-color:#22c55e;color:#fff;';
          info = `<span style="color:#22c55e;font-size:0.65rem;">${done}/${total} concluídos</span>`;
        } else if (total === 0) {
          dot = '·'; dotStyle = 'background:var(--surface3);border-color:var(--border2);color:var(--muted);';
          info = '<span style="font-size:0.65rem;color:var(--muted);">Não iniciado</span>';
        } else {
          // Verificar vencidas e próximas do vencimento
          let vencidas = 0, vencendo = 0;
          const _hj7 = new Date(); _hj7.setDate(_hj7.getDate() + 7);
          const _hj7s = _hj7.toISOString().slice(0, 10);
          lista.forEach(item => {
            if (item.status === 'done') return;
            // Sub-etapa ativa
            const cfg3 = ETAPAS_CONFIG[id];
            (cfg3.subEtapasTemplate || []).forEach(st => {
              const s = item.subEtapas?.[st.id];
              if (!s || s.status === 'done' || s.status === 'pulada') return;
              // Usar dataLimite da sub-etapa ou dataPrevista do item como fallback
              const ref = s.dataLimite || (s.status === 'active' ? item.dataPrevista : null);
              if (!ref) return;
              if (ref < hoje2) vencidas++;
              else if (ref <= _hj7s) vencendo++;
            });
          });
          if (vencidas > 0) {
            dot = '!'; dotStyle = 'background:#ef4444;border-color:#ef4444;color:#fff;';
            info = `<span style="color:#ef4444;font-size:0.65rem;font-weight:700;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px;"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg> ${vencidas} ${vencidas > 1 ? 'Itens Vencidos' : 'Item Vencido'}</span>`;
          } else if (vencendo > 0) {
            dot = '!'; dotStyle = 'background:#f59e0b;border-color:#f59e0b;color:#fff;';
            info = `<span style="color:#f59e0b;font-size:0.65rem;font-weight:700;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px;"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg> ${vencendo} ${vencendo > 1 ? 'Itens Próximos do Vencimento' : 'Item Próximo do Vencimento'}</span>`;
          } else {
            dot = '›'; dotStyle = `background:${cfg2.cor};border-color:${cfg2.cor};color:#fff;`;
            info = `<span style="font-family:var(--font-mono);font-size:0.65rem;color:var(--muted);">${done}/${total} concluídos</span>`;
          }
        }
        return `<div class="card-etapa-row">
          <span class="card-etapa-dot" style="${dotStyle}">${dot}</span>
          <span class="card-etapa-nome">${cfg2.short}</span>
          ${(() => { const _rv = _revCountEtapa(eData, cfg2); return _rv > 0 ? `<span style="background:#f59e0b;color:#fff;font-size:0.55rem;font-weight:800;padding:0.05rem 0.3rem;border-radius:4px;font-family:var(--font-mono);white-space:nowrap;margin-right:0.3rem;" title="${_rv} revisão(ões) nesta etapa">REV.${_rv}</span>` : ''; })()}
          ${info}
        </div>`;
      }
      // Documentações independentes
      if (cfg2.isIndependente) {
        const subVals = Object.values(eData.subEtapas || {}).filter(s => !s.isCocLista);
        const cocItems = (eData.cocLista || []);
        const done = subVals.filter(s => s.status === 'done').length + cocItems.filter(ci => ci.status === 'done').length;
        const total = subVals.filter(s => s.status !== 'cancelado').length + (cocItems.length || 0);
        const daqui7doc = new Date(); daqui7doc.setDate(daqui7doc.getDate() + 7);
        const daqui7docs = daqui7doc.toISOString().slice(0, 10);
        const nAtras = subVals.filter(s => s.status !== 'done' && s.status !== 'cancelado' && s.dataLimite && s.dataLimite < hoje2).length
          + cocItems.filter(ci => ci.status !== 'done' && ci.dataPrevista && ci.dataPrevista < hoje2).length;
        const nVenc = subVals.filter(s => s.status !== 'done' && s.status !== 'cancelado' && s.dataLimite && s.dataLimite >= hoje2 && s.dataLimite <= daqui7docs).length
          + cocItems.filter(ci => ci.status !== 'done' && ci.dataPrevista && ci.dataPrevista >= hoje2 && ci.dataPrevista <= daqui7docs).length;
        if (obra.concluida || eStatus === 'done') {
          dot = '✓'; dotStyle = 'background:#22c55e;border-color:#22c55e;color:#fff;';
          info = `<span style="color:#22c55e;font-size:0.65rem;">${done}/${total} concluídas</span>`;
        } else if (cocItems.length === 0) {
          dot = '·'; dotStyle = 'background:var(--surface3);border-color:var(--border2);color:var(--muted);';
          info = `<span style="font-size:0.65rem;color:var(--muted);">Não iniciada</span>`;
        } else if (nAtras > 0) {
          dot = '!'; dotStyle = 'background:#ef4444;border-color:#ef4444;color:#fff;';
          info = `<span style="color:#ef4444;font-size:0.65rem;font-weight:700;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px;"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg> ${nAtras} ${nAtras > 1 ? 'Itens Vencidos' : 'Item Vencido'}</span>`;
        } else if (nVenc > 0) {
          dot = '!'; dotStyle = 'background:#f59e0b;border-color:#f59e0b;color:#fff;';
          info = `<span style="color:#f59e0b;font-size:0.65rem;font-weight:700;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px;"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg> ${nVenc} ${nVenc > 1 ? 'Itens Próximos do Vencimento' : 'Item Próximo do Vencimento'}</span>`;
        } else {
          dot = '›'; dotStyle = `background:${cfg2.cor};border-color:${cfg2.cor};color:#fff;`;
          info = `<span style="font-size:0.65rem;color:var(--muted);">${done}/${total} concluídas</span>`;
        }
        return `<div class="card-etapa-row">
          <span class="card-etapa-dot" style="${dotStyle}">${dot}</span>
          <span class="card-etapa-nome">${cfg2.short}</span>
          ${(() => { const _rv = _revCountEtapa(eData, cfg2); return _rv > 0 ? `<span style="background:#f59e0b;color:#fff;font-size:0.55rem;font-weight:800;padding:0.05rem 0.3rem;border-radius:4px;font-family:var(--font-mono);white-space:nowrap;margin-right:0.3rem;" title="${_rv} revisão(ões) nesta etapa">REV.${_rv}</span>` : ''; })()}
          ${info}
        </div>`;
      }
      // Sub-etapas normais
      const subs = Object.values(eData.subEtapas || {});
      const atras = subs.some(s => s.status !== 'done' && s.dataLimite && s.dataLimite < hoje2);
      const ultima = subs.findLast?.(s => s.status === 'active') || subs.find(s => s.status === 'active');
      const limite = ultima?.dataLimite;
      const concl = eData.status === 'done' ? subs.findLast?.(s => s.dataConclusao)?.dataConclusao : null;
      if (obra.concluida || eStatus === 'done') {
        dot = '✓'; dotStyle = 'background:#22c55e;border-color:#22c55e;color:#fff;';
        info = concl ? `<span style="color:#22c55e;font-family:var(--font-mono);font-size:0.65rem;">✓ ${new Date(concl + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>` : '<span style="color:#22c55e;font-size:0.68rem;">Concluída</span>';
      } else if (atras) {
        dot = '!'; dotStyle = 'background:#ef4444;border-color:#ef4444;color:#fff;';
        // Mostrar nome da sub-etapa vencida + prazo
        const subAtras = cfg2.subEtapas?.find(sc => {
          const sd = eData.subEtapas?.[sc.id];
          return sd?.status !== 'done' && sd?.dataLimite && sd.dataLimite < hoje2;
        });
        const sdAtras = subAtras ? eData.subEtapas?.[subAtras.id] : null;
        const nomeAtras = subAtras?.nome || '';
        const dtAtras = sdAtras?.dataLimite ? new Date(sdAtras.dataLimite + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '?';
        info = `<span style="color:#ef4444;font-size:0.65rem;font-weight:700;" title="${nomeAtras}"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px;"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg> ${nomeAtras.length > 22 ? nomeAtras.slice(0, 22) + '…' : nomeAtras} · ${dtAtras}</span>`;
      } else if (eStatus === 'active') {
        dot = '›'; dotStyle = `background:${cfg2.cor};border-color:${cfg2.cor};color:#fff;`;
        // Mostrar se há sub-etapa próxima do vencimento
        const daqui7s2 = new Date(); daqui7s2.setDate(daqui7s2.getDate() + 7);
        const daqui7str2 = daqui7s2.toISOString().slice(0, 10);
        const subVenc = cfg2.subEtapas?.find(sc => {
          const sd = eData.subEtapas?.[sc.id];
          return sd?.status !== 'done' && sd?.dataLimite && sd.dataLimite >= hoje2 && sd.dataLimite <= daqui7str2;
        });
        if (subVenc) {
          const sdVenc = eData.subEtapas?.[subVenc.id];
          const dias2 = sdVenc?.dataLimite ? Math.ceil((new Date(sdVenc.dataLimite + 'T12:00:00') - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24)) : null;
          const prazoLabel = dias2 === 0 ? 'hoje' : dias2 === 1 ? 'amanhã' : `${dias2}d`;
          const nomeVenc = subVenc.nome.length > 20 ? subVenc.nome.slice(0, 20) + '…' : subVenc.nome;
          dot = '!'; dotStyle = 'background:#f59e0b;border-color:#f59e0b;color:#fff;';
          info = `<span style="color:#f59e0b;font-size:0.65rem;font-weight:700;" title="${subVenc.nome}"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px;"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg> ${nomeVenc} · ${prazoLabel}</span>`;
        } else {
          info = limite ? `<span style="font-family:var(--font-mono);font-size:0.65rem;color:var(--muted);">${new Date(limite + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>` : '<span style="font-size:0.65rem;color:var(--muted);">Em andamento</span>';
        }
      } else {
        dot = '·'; dotStyle = 'background:var(--surface3);border-color:var(--border2);color:var(--muted);';
        info = '<span style="font-size:0.65rem;color:var(--muted);">Pendente</span>';
      }
      return `<div class="card-etapa-row">
          <span class="card-etapa-dot" style="${dotStyle}">${dot}</span>
          <span class="card-etapa-nome">${cfg2.short}</span>
          ${(() => { const _rv = _revCountEtapa(eData, cfg2); return _rv > 0 ? `<span style="background:#f59e0b;color:#fff;font-size:0.55rem;font-weight:800;padding:0.05rem 0.3rem;border-radius:4px;font-family:var(--font-mono);white-space:nowrap;margin-right:0.3rem;" title="${_rv} revisão(ões) nesta etapa">REV.${_rv}</span>` : ''; })()}
          ${info}
        </div>`;
    }).join('');

    return `
    <div class="obra-card" data-obra-id="${obra.id}" style="border-left:4px solid ${corBorda};position:relative;" onclick="openObraModal('${obra.id}')">
      ${(() => {
        const azul = _contarTarefasAtribuidas(obra);
        return azul > 0
          ? `<span style="position:absolute;top:-7px;left:8px;background:#3b82f6;color:#fff;font-size:0.58rem;font-family:var(--font-mono);font-weight:800;min-width:18px;height:18px;border-radius:9px;display:inline-flex;align-items:center;justify-content:center;padding:0 4px;box-shadow:0 2px 6px #00000040;z-index:2;" title="${azul} tarefa${azul > 1 ? 's' : ''} atribuída${azul > 1 ? 's' : ''} a você">${azul}</span>`
          : '';
      })()}
      ${(() => {
        // Badge vermelho — sub-etapas em atraso
        let atraso = 0;
        const hj = new Date().toISOString().slice(0, 10);
        ETAPAS_ORDER.forEach(etapaId => {
          const e = obra.etapas?.[etapaId]; const cfg = ETAPAS_CONFIG[etapaId];
          if (!e?.ativa || e.status === 'done' || e.status === 'pulada') return;
          if (cfg.isLista) {
            (e.lista || []).forEach(item => {
              if (item.status === 'done' || item.status === 'pulada') return;
              const _sa = Object.values(item.subEtapas || {}).some(s => _vencido(_refAtraso(s, item), s.status, hj));
              if (_sa || _vencido(item.dataPrevista, item.status, hj)) atraso++;
            });
          } else {
            Object.values(e.subEtapas || {}).forEach(s => { if (!s.isCocLista && _vencido(s.dataLimite || s.dataPrevista, s.status, hj)) atraso++; });
            (e.cocLista || []).forEach(ci => { if (_vencido(ci.dataPrevista, ci.status, hj)) atraso++; });
          }
        });
        return atraso > 0
          ? `<span style="position:absolute;top:-7px;right:8px;background:#ef4444;color:#fff;font-size:0.58rem;font-family:var(--font-mono);font-weight:800;min-width:18px;height:18px;border-radius:9px;display:inline-flex;align-items:center;justify-content:center;padding:0 4px;box-shadow:0 2px 6px #00000040;z-index:2;" title="${atraso} sub-etapa${atraso > 1 ? 's' : ''} em atraso">${atraso}</span>`
          : '';
      })()}
      <div class="obra-card-header">
        <div>
          <div class="obra-card-numero">#${obra.numero || obra.id.slice(-6).toUpperCase()}</div>
          <div class="obra-card-nome">${obra.nome}</div>
        </div>
        ${obra.concluida ? '<span class="obra-etapa-badge etapa-concluida">Concluída</span>' : ''}
      </div>
      ${(() => {
        const n = _contarTarefasAtribuidas(obra);
        return n > 0
          ? `<div style="font-size:0.65rem;color:var(--accent);font-weight:700;margin-bottom:0.2rem;display:flex;align-items:center;gap:0.3rem;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ${n} pendência${n > 1 ? 's' : ''} atribuída${n > 1 ? 's' : ''} a você</div>`
          : '';
      })()}
      <div class="obra-card-rep" style="justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:0.35rem;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span style="color:var(--muted);margin-right:0.2rem;">Representante:</span>${obra.representante || '—'}
        </div>
        <button onclick="event.stopPropagation();exportarObraPDF('${obra.id}')"
          title="Exportar PDF da obra"
          style="background:none;border:1px solid var(--border2);border-radius:5px;padding:0.15rem 0.4rem;cursor:pointer;color:var(--muted);display:flex;align-items:center;gap:0.25rem;font-size:0.68rem;transition:all 0.15s;"
          onmouseover="this.style.borderColor='#ef4444';this.style.color='#ef4444';"
          onmouseout="this.style.borderColor='var(--border2)';this.style.color='var(--muted)';">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>PDF
        </button>
      </div>
      <div class="card-etapas-grid">${etapaLinhas}</div>
      <div class="obra-prazo ${prazoInfo.cls}">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        ${prazoInfo.texto}
      </div>
    </div>`;
  }).join('');

  _renderPaginacao(total, totalPags, inicio);
}

function _renderPaginacao(total, totalPags, inicio) {
  const el = document.getElementById('obras-paginacao');
  if (!el) return;

  if (total === 0) { el.style.display = 'none'; return; }
  el.style.display = 'flex';

  const fim = Math.min(inicio + _obrasPorPagina, total);

  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:0.5rem;font-size:0.78rem;color:var(--muted);">
      Mostrando <strong style="color:var(--text);">${inicio + 1}–${fim}</strong> de <strong style="color:var(--text);">${total}</strong> obras
    </div>
    <div style="display:flex;align-items:center;gap:0.4rem;">
      <button class="pag-btn" onclick="irParaPagina(0)" ${_paginaAtual === 0 ? 'disabled' : ''} title="Primeira">«</button>
      <button class="pag-btn" onclick="irParaPagina(${_paginaAtual - 1})" ${_paginaAtual === 0 ? 'disabled' : ''} title="Anterior">‹</button>
      ${Array.from({ length: totalPags }, (_, i) => i).filter(i => Math.abs(i - _paginaAtual) <= 2).map(i => `
        <button class="pag-btn${i === _paginaAtual ? ' active' : ''}" onclick="irParaPagina(${i})">${i + 1}</button>
      `).join('')}
      <button class="pag-btn" onclick="irParaPagina(${_paginaAtual + 1})" ${_paginaAtual >= totalPags - 1 ? 'disabled' : ''} title="Próxima">›</button>
      <button class="pag-btn" onclick="irParaPagina(${totalPags - 1})" ${_paginaAtual >= totalPags - 1 ? 'disabled' : ''} title="Última">»</button>
    </div>`;
}

// ── Modal nova obra ───────────────────────────────────────────────────────────
function _revCountEtapa(e, cfg) {
  if (!e) return 0;
  if (cfg && cfg.isIndependente) return 0; // Documentações não têm revisão
  let n = (e.revisoes || []).length;
  Object.values(e.subEtapas || {}).forEach(s => { n += (s.revisoes || []).length; });
  (e.cocLista || []).forEach(ci => { n += (ci.revisoes || []).length; });
  if (cfg && cfg.isLista) (e.lista || []).forEach(it => {
    n += (it.revisoes || []).length;
    Object.values(it.subEtapas || {}).forEach(s => { n += (s.revisoes || []).length; });
  });
  return n;
}

function podeEditarComercial() {
  return !!(currentUser && (currentUser.isSuperAdmin || currentUser.role === 'superAdmin'
    || (currentUser.acessos || []).includes('adminComercial')
    || (currentUser.acessos || []).includes('atribuivelComercial')));
}

function openNovaObraModal() { document.getElementById('nova-obra-modal').style.display = 'flex'; document.body.style.overflow = 'hidden'; }
function closeNovaObraModal() { document.getElementById('nova-obra-modal').style.display = 'none'; document.body.style.overflow = ''; document.getElementById('nova-obra-form').reset(); }

async function saveNovaObra() {
  if (!podeEditarComercial()) { showComercialToast('Acesso somente leitura — você não pode alterar obras.', 'error'); return; }
  const numero = document.getElementById('nova-obra-numero')?.value.trim();
  const nome = document.getElementById('nova-obra-nome')?.value.trim();
  const rep = document.getElementById('nova-obra-rep')?.value;
  const fechamento = document.getElementById('nova-obra-fechamento')?.value;
  const prazo = document.getElementById('nova-obra-prazo')?.value;
  if (!numero) { showComercialToast('Informe o número da obra.', 'error'); return; }
  if (_obras.some(o => String(o.numero).trim() === String(numero).trim())) {
    showComercialToast(`Já existe uma obra com o número #${numero}.`, 'error');
    return;
  }
  if (!nome) { showComercialToast('Informe o nome da obra.', 'error'); return; }
  if (!rep) { showComercialToast('Selecione o representante.', 'error'); return; }
  if (!fechamento) { showComercialToast('Informe a data de fechamento.', 'error'); return; }
  // prazo estimado é opcional
  const btn = document.getElementById('btn-save-nova-obra');
  if (btn) { btn.disabled = true; btn.textContent = 'Salvando...'; }
  try {
    const etapas = initObraEtapas(fechamento);
    await db.collection('obras').add({
      numero, nome, representante: rep, dataFechamento: fechamento,
      prazoEstimado: prazo || null, concluida: false, etapas,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(), createdBy: currentUser.username,
    });
    showComercialToast(`Obra #${numero} cadastrada! ✅`, 'success');
    closeNovaObraModal();
  } catch (e) { showComercialToast('Erro ao salvar.', 'error'); console.error(e); }
  finally { if (btn) { btn.disabled = false; btn.textContent = 'Cadastrar Obra'; } }
}

// ── Modal detalhes ────────────────────────────────────────────────────────────
function openObraModal(obraId) {
  _currentObraId = obraId;
  const obra = _obras.find(o => o.id === obraId); if (!obra) return;
  try {
    _obraAtual = obraId; renderObraModal(obra);
    document.getElementById('obra-modal-overlay').style.display = 'flex';
    document.body.style.overflow = 'hidden';
  } catch (e) {
    console.error('[openObraModal] ERRO:', e.message, e.stack);
    showComercialToast('Erro ao abrir obra: ' + e.message, 'error');
  }
}
function closeObraModal() {
  _currentObraId = null;
  document.getElementById('obra-modal-overlay').style.display = 'none';
  document.body.style.overflow = ''; _obraAtual = null;
}

// ── Accordion state preservation ─────────────────────────────────────────────
let _accordionState = new Set(); // IDs dos accordions abertos

function _saveAccordionState() {
  _accordionState = new Set();
  document.querySelectorAll('[id^="lista-item-"]').forEach(el => {
    if (el.style.display !== 'none') _accordionState.add(el.id);
  });
}

function _restoreAccordionState() {
  _accordionState.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'block';
  });
}

function renderObraModal(obra) {
  document.getElementById('obra-modal-numero').textContent = `#${obra.numero || obra.id.slice(-6).toUpperCase()}`;
  document.getElementById('obra-modal-nome').textContent = obra.nome;
  const prazoInfo = getPrazoInfo(obra.prazoEstimado);
  const canAdmin = podeEditarComercial();
  const canEditar = podeEditarComercial();
  document.getElementById('obra-modal-meta').innerHTML = `
    <span>👤 ${obra.representante || '—'}</span>
    <span>📅 Fechamento: ${obra.dataFechamento ? new Date(obra.dataFechamento + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</span>
    <span class="${prazoInfo.cls}">⏱ ${prazoInfo.texto}</span>`;
  const tl = document.getElementById('obra-timeline'); if (!tl) return;
  const hoje = new Date().toISOString().slice(0, 10);
  tl.innerHTML = ETAPAS_ORDER.map(etapaId => {
    const cfg = ETAPAS_CONFIG[etapaId];
    const eData = obra.etapas?.[etapaId];
    // ── Etapa pulada ou inativa: mostrar antes de qualquer outro check ──────
    if (!eData?.ativa || eData?.status === 'pulada') {
      const isPulada = eData?.status === 'pulada';
      const canIniciarX = !obra.concluida;
      return `<div class="etapa-item" data-etapa-row="${etapaId}">
        <div class="etapa-icon pending" style="${isPulada ? 'opacity:0.5;' : 'opacity:0.4;'}">⏭</div>
        <div class="etapa-content">
          <div class="etapa-nome" style="opacity:${isPulada ? '0.7' : '0.6'};">
            ${cfg.nome}
            ${isPulada ? `<span style="font-size:0.65rem;font-weight:700;color:#6b7280;background:var(--surface3);padding:0.1rem 0.4rem;border-radius:4px;margin-left:0.25rem;">Pulada</span>` : '<span style="font-size:0.65rem;font-weight:400;color:var(--muted);">(opcional)</span>'}
            ${canIniciarX ? `<button class="sub-action-btn concluir" style="font-size:0.68rem;padding:0.15rem 0.5rem;" onclick="iniciarEtapa('${obra.id}','${etapaId}')">▶ Iniciar</button>` : ''}
          </div>
          ${isPulada && eData.puladaPor ? `<div style="font-size:0.68rem;color:var(--muted);font-family:var(--font-mono);margin-top:0.2rem;">Pulada por ${eData.puladaPor}</div>` : ''}
        </div>
      </div>`;
    }
    // ── Etapas com lista (aditivos/medicao)
    if (cfg.isLista) {
      const eActive = eData?.ativa;
      const eStatus = eData?.status || 'pending';
      const cor2 = cfg.cor;
      const _listaEtapa = eData?.lista || [];
      const etapaConcluida = obra.concluida || (_listaEtapa.length > 0 && _listaEtapa.every(i => i.status === 'done'));
      const listaIconCls = etapaConcluida ? 'done' : eStatus === 'active' ? 'active' : 'pending';
      const listaIconStyle = (etapaConcluida || eStatus === 'active') ? `style="background:${cor2};border-color:${cor2};"` : '';
      return `<div class="etapa-item" data-etapa-row="${etapaId}">
        <div class="etapa-icon ${listaIconCls}" ${listaIconStyle}>${etapaConcluida ? '✓' : ''}</div>
        <div class="etapa-content">
          <div class="etapa-nome" style="${eStatus === 'active' ? `color:${cor2};` : ''}">
            ${cfg.nome}
            ${cfg.opcional ? '<span style="font-size:0.65rem;font-weight:400;color:var(--muted);">(opcional)</span>' : ''}
            ${!obra.concluida && eStatus !== 'done' ? `<button class="sub-action-btn motivo" style="font-size:0.68rem;padding:0.2rem 0.55rem;" onclick="pularEtapa('${obra.id}','${etapaId}')">⏭ Pular</button>` : ''}
          </div>
          <div>${renderListaEtapa(obra, etapaId, hoje)}</div>
        </div>
      </div>`;
    }

    const etapaStatus = eData.status || 'pending';
    const cor = cfg.cor;
    const subsHtml = cfg.subEtapas.map(subCfg => {
      const subData = eData.subEtapas?.[subCfg.id] || {};
      const subStatus = subData.status || 'pending';
      const limite = subData.dataLimite || subData.dataPrevista;
      const atrasada = subStatus !== 'done' && subStatus !== 'pulada' && limite && limite < hoje;
      const isIndependenteSub = subCfg.isIndependente || cfg.isIndependente;
      const canConcluir = subStatus === 'active' && !obra.concluida;
      const canIniciarSub = isIndependenteSub && subStatus === 'pending' && !obra.concluida;
      const canMotivo = atrasada && !subData.motivoAtraso;
      const canRevisaoSub = subStatus !== 'pending' && !obra.concluida;
      const canProrrogar = subStatus === 'active' && !obra.concluida;
      const subRevisoes = (subData.revisoes || []);
      const subDotStyle = atrasada ? `style="background:#ef4444;border-color:#ef4444;"` : subStatus === 'done' ? `style="background:${cfg.cor};border-color:${cfg.cor};"` : subStatus === 'active' ? `style="background:${cfg.cor};border-color:${cfg.cor};"` : '';

      // Badge responsável na sub-etapa (multi-atribuição)
      const respBadge = subStatus !== 'done' ? _respBadges(subData, '0.62rem', (typeof _filtroUsuarioPendencia !== 'undefined' ? _filtroUsuarioPendencia : null) || currentUser?.username) : '';
      // COC com lista dinâmica — não precisa de subData
      if (subCfg.isCocLista) {
        const cocLst = eData.cocLista || [];
        const allDone = cocLst.length > 0 && cocLst.every(i => i.status === 'done');
        const hasActive = cocLst.some(i => i.status === 'active');
        const cocIconChar = allDone ? '✓' : hasActive ? '›' : '·';
        const cocIconCls = allDone ? 'done' : hasActive ? 'active' : 'pending';
        const cocIconInlineStyle = allDone
          ? 'background:#22c55e;border-color:#22c55e;'
          : hasActive
            ? `background:${cfg.cor};border-color:${cfg.cor};`
            : '';
        return `<div class="sub-etapa-item" style="align-items:flex-start;">
          <div class="sub-etapa-icon ${cocIconCls}" style="${cocIconInlineStyle}">${cocIconChar}</div>
          <div class="sub-etapa-content" style="flex:1;min-width:0;">
            <div class="sub-etapa-nome">${subCfg.nome}</div>
            <div style="margin-top:0.4rem;">${_renderCocLista(obra, etapaId, subCfg.id)}</div>
          </div>
        </div>`;
      }
      if (!subData) return '';

      let dataInfo = '';
      if (subStatus === 'cancelado') {
        dataInfo = `<span class="sub-data" style="color:var(--muted);">⊘ Cancelado${subData.motivoCancelamento ? ' · ' + subData.motivoCancelamento : ''}</span>`;
      } else if (subCfg.isAnalise && subStatus === 'active' && subData.dataInicio) {
        const ini = new Date(subData.dataInicio + 'T12:00:00');
        const agora = new Date(); agora.setHours(0, 0, 0, 0);
        const dias = Math.floor((agora - ini) / (1000 * 60 * 60 * 24));
        const _refPrev = subData.dataLimite || subData.dataPrevista;
        const prevStr = _refPrev ? new Date(_refPrev + 'T12:00:00').toLocaleDateString('pt-BR') : '';
        dataInfo = `<span class="sub-data" style="color:#8b5cf6;font-weight:700;display:flex;align-items:center;gap:0.4rem;">
          🕐 A ${dias} dia${dias !== 1 ? 's' : ''} nesta sub-etapa
          ${prevStr ? `<span style="font-size:0.65rem;color:var(--muted);font-weight:400;">· Previsto: ${prevStr}</span>` : ''}
        </span>`;
      } else if (subData.dataConclusao) {
        const por = subData.concluidoPor ? ` — por ${subData.concluidoPor}` : '';
        const tipo = subData.tipoConclusao ? ` · <strong>${subData.tipoConclusao}</strong>` : '';
        dataInfo = `<span class="sub-data concluida">✓ ${new Date(subData.dataConclusao + 'T12:00:00').toLocaleDateString('pt-BR')}${por}${tipo}</span>`;
      } else if (limite) {
        const limFmt = new Date(limite + 'T12:00:00').toLocaleDateString('pt-BR');
        dataInfo = atrasada ? `<span class="sub-data atrasada">⚠ Limite: ${limFmt}</span>` : `<span class="sub-data">Limite: ${limFmt}</span>`;
      } else if (subCfg.dateLivre || subCfg.isNovaDataZero) {
        dataInfo = `<span class="sub-data" style="color:var(--muted);">Data livre</span>`;
      }
      const statusIcon = subStatus === 'cancelado' ? '⊘' : subStatus === 'done' ? '✓' : atrasada ? '!' : subStatus === 'active' ? '›' : '·';
      const iconCls = subStatus === 'done' ? 'done' : atrasada ? 'atrasada' : subStatus === 'active' ? 'active' : 'pending';
      const motivoBadge = subData.motivoAtraso ? `<div class="sub-motivo-atraso">📌 ${subData.motivoAtraso}</div>` : '';

      // Revisões da sub-etapa
      const subRevHtml = (!cfg.isIndependente && subRevisoes.length) ? `<div class="sub-revisoes">
        ${subRevisoes.map(r => `<div class="sub-revisao-item">
          <span class="etapa-revisao-badge">REV.${r.numero}</span>
          <div class="etapa-revisao-info">
            <div class="etapa-revisao-motivo">${r.motivo}</div>
            <div class="etapa-revisao-data">${r.data ? new Date(r.data + 'T12:00:00').toLocaleDateString('pt-BR') : '—'} — por ${r.por || '—'}</div>
          </div>
        </div>`).join('')}
      </div>`: '';

      const dropId = `acao-sub-${etapaId}-${subCfg.id}`;
      const resp = _getResponsaveis(subData).join(',');
      const _menuItems = [
        canIniciarSub ? `<button class="acao-item concluir" data-action="iniciar-sub" data-obra="${obra.id}" data-etapa="${etapaId}" data-sub="${subCfg.id}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg> Iniciar</button>` : '',
        subCfg.isAprovacaoRecusa && canConcluir ? `<button class="acao-item concluir" data-action="aprovado" data-obra="${obra.id}" data-etapa="${etapaId}" data-sub="${subCfg.id}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Aprovado</button>` : '',
        subCfg.isAprovacaoRecusa && canConcluir ? `<button class="acao-item motivo" data-action="recusado" data-obra="${obra.id}" data-etapa="${etapaId}" data-sub="${subCfg.id}" style="color:#ef4444;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Recusado</button>` : '',
        !subCfg.isAprovacaoRecusa && canConcluir ? `<button class="acao-item concluir" data-action="concluir" data-obra="${obra.id}" data-etapa="${etapaId}" data-sub="${subCfg.id}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Concluir</button>` : '',
        (canProrrogar || (subCfg.isAnalise && subStatus !== 'done' && !obra.concluida)) ? `<button class="acao-item" data-action="prorrogar" data-obra="${obra.id}" data-etapa="${etapaId}" data-sub="${subCfg.id}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Prorrogar</button>` : '',
        `<button class="acao-item" data-action="atribuir" data-obra="${obra.id}" data-etapa="${etapaId}" data-sub="${subCfg.id}" data-resp="${resp}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> ${_respBtnLabel(subData)}</button>`,
        `<button class="acao-item" data-action="obs" data-obra="${obra.id}" data-etapa="${etapaId}" data-sub="${subCfg.id}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Observações</button>`,
        canMotivo ? `<button class="acao-item" data-action="motivo" data-obra="${obra.id}" data-etapa="${etapaId}" data-sub="${subCfg.id}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/></svg> Registrar motivo</button>` : '',
        (subCfg.isCancelavel && subStatus !== 'done' && subStatus !== 'cancelado' && !obra.concluida) ? `<button class="acao-item motivo" data-action="cancelar-doc" data-obra="${obra.id}" data-etapa="${etapaId}" data-sub="${subCfg.id}" style="color:#ef4444;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg> Cancelar</button>` : '',
        (subCfg.isCancelavel && subStatus === 'cancelado' && !obra.concluida) ? `<button class="acao-item concluir" data-action="reativar-doc" data-obra="${obra.id}" data-etapa="${etapaId}" data-sub="${subCfg.id}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg> Reativar</button>` : '',
      ].filter(Boolean).join('');
      const _reabrirDrop = (podeEditarComercial() && !isIndependenteSub) ? `<div style="position:relative;display:inline-block;"><button class="sub-action-btn" data-dropdown="reab-${dropId}" style="font-size:0.68rem;padding:0.2rem 0.55rem;background:var(--surface2);border-color:var(--border2);color:var(--text);display:inline-flex;align-items:center;gap:0.25rem;">Ações<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></button><div id="reab-${dropId}" class="acao-dropdown-menu" style="display:none;position:absolute;right:0;top:calc(100% + 4px);z-index:300;background:var(--surface);border:1px solid var(--border2);border-radius:8px;box-shadow:0 8px 24px #00000022;min-width:165px;overflow:hidden;"><button class="acao-item" data-action="reabrir-sub" data-obra="${obra.id}" data-etapa="${etapaId}" data-sub="${subCfg.id}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg> Reabrir</button><button class="acao-item" data-action="obs" data-obra="${obra.id}" data-etapa="${etapaId}" data-sub="${subCfg.id}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Observações</button></div></div>` : '';
      const actions = obra.concluida ? '' : (subStatus === 'done' && !isIndependenteSub) ? _reabrirDrop : `<div style="position:relative;display:inline-block;"><button class="sub-action-btn" data-dropdown="${dropId}" style="font-size:0.68rem;padding:0.2rem 0.55rem;background:var(--surface2);border-color:var(--border2);color:var(--text);display:inline-flex;align-items:center;gap:0.25rem;">Ações<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></button><div id="${dropId}" class="acao-dropdown-menu" style="display:none;position:absolute;right:0;top:calc(100% + 4px);z-index:300;background:var(--surface);border:1px solid var(--border2);border-radius:8px;box-shadow:0 8px 24px #00000022;min-width:165px;overflow:hidden;">${_menuItems}</div></div>`;
      return `<div class="sub-etapa-item">
        <div class="sub-etapa-icon ${iconCls}" ${iconCls === 'active' ? `style="background:${cor};border-color:${cor};"` : iconCls === 'atrasada' ? 'style="background:#ef4444;border-color:#ef4444;"' : ''}>${statusIcon}</div>
        <div class="sub-etapa-content">
          <div class="sub-etapa-nome"${subStatus === 'cancelado' ? ' style="opacity:0.55;text-decoration:line-through;"' : ''}>${subCfg.nome}${atrasada ? ' <span class="sub-atraso-label">ATRASADO</span>' : ''}${subStatus === 'cancelado' ? '' : respBadge}</div>
          <div class="sub-etapa-meta">${dataInfo}</div>
          ${motivoBadge}
          ${subRevHtml}
          ${actions ? `<div class="sub-etapa-actions">${actions}</div>` : ''}
        </div>
      </div>`;
    }).join('');
    const etapaIconCls = etapaStatus === 'done' ? 'done' : etapaStatus === 'active' ? 'active' : 'pending';
    const etapaIconStyle = etapaStatus === 'active' ? `style="background:${cor};border-color:${cor};"` : etapaStatus === 'done' ? `style="background:${cor};border-color:${cor};"` : '';
    const canRevisao = etapaStatus !== 'pending' && !obra.concluida;
    const canIniciar = etapaStatus === 'pending' && !obra.concluida;
    return `<div class="etapa-item" data-etapa-row="${etapaId}">
      <div class="etapa-icon ${etapaIconCls}" ${etapaIconStyle}>${etapaStatus === 'done' ? '✓' : ''}</div>
      <div class="etapa-content">
        <div class="etapa-nome" style="${etapaStatus === 'active' ? `color:${cor};` : ''}" title="${(eData.observacoes || []).length} observação(ões)">
          ${cfg.nome}
          ${(!cfg.isIndependente && (eData.revisoes || []).length > 0) ? `<span style="background:#f59e0b;color:#fff;font-size:0.6rem;font-weight:800;padding:0.1rem 0.4rem;border-radius:4px;font-family:var(--font-mono);">REV.${eData.revisoes.length}</span>` : ''}
          ${cfg.opcional ? '<span style="font-size:0.65rem;font-weight:400;color:var(--muted);">(opcional)</span>' : ''}
          ${canIniciar ? `<button class="sub-action-btn concluir" style="font-size:0.68rem;padding:0.2rem 0.55rem;" onclick="iniciarEtapa('${obra.id}','${etapaId}')">▶ Iniciar</button>` : ''}
          ${!obra.concluida && etapaStatus !== 'done' ? `
            <div style="position:relative;display:inline-block;">
              <button class="sub-action-btn" data-dropdown="acao-etapa-${etapaId}"
                style="font-size:0.68rem;padding:0.2rem 0.55rem;background:var(--surface2);border-color:var(--border2);color:var(--text);display:inline-flex;align-items:center;gap:0.25rem;">
                Ações<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <div id="acao-etapa-${etapaId}" class="acao-dropdown-menu" style="display:none;position:absolute;left:0;top:calc(100% + 4px);z-index:300;background:var(--surface);border:1px solid var(--border2);border-radius:8px;box-shadow:0 8px 24px #00000022;min-width:155px;overflow:hidden;">

                <button class="acao-item" data-action="obs-etapa" data-obra="${obra.id}" data-etapa="${etapaId}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Observações</button>
                <button class="acao-item" data-action="pular-etapa" data-obra="${obra.id}" data-etapa="${etapaId}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg> Pular</button>
              </div>
            </div>`: ''}
        </div>

        <div class="sub-etapas-container">${subsHtml}</div>
      </div>
    </div>`;
  }).join('');
  _renderObraFooter(obra, canAdmin);

}

function _renderObraFooter(obra, canAdmin) {
  const footer = document.getElementById('obra-modal-footer'); if (!footer) return;
  const adminBtns = canAdmin && !obra.concluida ? `
    <button class="btn-secondary" onclick="openEditarObraModal('${obra.id}')" style="display:flex;align-items:center;gap:0.4rem;">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Editar
    </button>
    <button class="btn-secondary" onclick="excluirObra('${obra.id}')" style="display:flex;align-items:center;gap:0.4rem;color:#ef4444;border-color:#ef4444;">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg> Excluir
    </button>`: '';
  const _histNovo = _historicoTemNovos(obra);
  const histBtn = `<button class="btn-secondary" onclick="openHistoricoModal('${obra.id}')" style="display:flex;align-items:center;gap:0.4rem;position:relative;">
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
    Histórico
    ${_histNovo ? `<span style="position:absolute;top:-5px;right:-5px;width:12px;height:12px;background:#ef4444;border-radius:50%;border:2px solid var(--surface);box-shadow:0 0 0 1px #ef4444;"></span>` : ''}
  </button>`;
  if (obra.concluida) {
    footer.innerHTML = `
      <div style="display:flex;gap:0.6rem;flex:1;flex-wrap:wrap;">${adminBtns}
        ${canAdmin ? `<button class="btn-secondary" onclick="reabrirObra('${obra.id}')" style="display:flex;align-items:center;gap:0.4rem;">↩ Reabrir</button>` : ''}
        ${histBtn}
      </div>
      <div style="display:flex;gap:0.6rem;align-items:center;">
        <span style="font-size:0.78rem;color:var(--muted);">✅ Obra concluída</span>
        <button class="btn-secondary" onclick="closeObraModal()">Fechar</button>
      </div>`;
  } else {
    footer.innerHTML = `
      <div style="display:flex;gap:0.6rem;flex:1;flex-wrap:wrap;">${adminBtns}${histBtn}</div>
      <button class="btn-secondary" onclick="closeObraModal()">Fechar</button>`;
  }
}



// ── Concluir com data retroativa ─────────────────────────────────────────────
let _conclObraId = null, _conclEtapaId = null, _conclSubId = null, _conclItemId = null, _conclCocIdx = null;

function concluirSubEtapaComData(obraId, etapaId, subId, itemId, cocIdx) {
  if (!podeEditarComercial()) { showComercialToast('Acesso somente leitura — você não pode alterar obras.', 'error'); return; }
  _conclObraId = obraId; _conclEtapaId = etapaId; _conclSubId = subId; _conclItemId = itemId || null; _conclCocIdx = (cocIdx !== undefined && cocIdx !== null) ? cocIdx : null;
  const cfg = ETAPAS_CONFIG[etapaId];
  const subCfg = (cfg.subEtapas || cfg.subEtapasTemplate || []).find(s => s.id === subId);
  const titleEl = document.getElementById('concl-modal-title');
  if (titleEl) titleEl.textContent = `Concluir — ${cfg.nome} · ${subCfg?.nome || subId}`;
  const input = document.getElementById('concl-data-input');
  if (input) {
    const hoje = new Date(), min7 = new Date(hoje);
    min7.setDate(min7.getDate() - 7);
    input.max = hoje.toISOString().slice(0, 10);
    input.min = min7.toISOString().slice(0, 10);
    input.value = hoje.toISOString().slice(0, 10);
  }
  document.getElementById('concl-modal').style.display = 'flex';
}
function closeConclModal() { document.getElementById('concl-modal').style.display = 'none'; _conclObraId = _conclEtapaId = _conclSubId = _conclItemId = _conclCocIdx = null; }
async function saveConclData() {
  if (!podeEditarComercial()) { showComercialToast('Acesso somente leitura — você não pode alterar obras.', 'error'); return; }
  const data = document.getElementById('concl-data-input')?.value;
  if (!data) { showComercialToast('Selecione uma data.', 'error'); return; }
  const obraId = _conclObraId, etapaId = _conclEtapaId, subId = _conclSubId, itemId = _conclItemId, cocIdx = _conclCocIdx;
  closeConclModal();
  if (cocIdx !== null && cocIdx !== undefined) {
    await _concluirCocItem(obraId, etapaId, cocIdx, data);
  } else if (itemId) {
    await _concluirSubDeLista(obraId, etapaId, itemId, subId, null, data);
  } else {
    await _concluirComTipo(obraId, etapaId, subId, null, data);
  }
}

// ── Aprovado / Recusado ───────────────────────────────────────────────────────
let _arObraId = null, _arEtapaId = null, _arSubId = null;

let _cancelDocObraId = null, _cancelDocEtapaId = null, _cancelDocSubId = null;
function _openCancelarDocModal(obraId, etapaId, subId) {
  if (!podeEditarComercial()) { showComercialToast('Acesso somente leitura — você não pode alterar obras.', 'error'); return; }
  _cancelDocObraId = obraId; _cancelDocEtapaId = etapaId; _cancelDocSubId = subId;
  const inp = document.getElementById('cancelar-doc-motivo'); if (inp) inp.value = '';
  document.getElementById('cancelar-doc-modal').style.display = 'flex';
}
function _closeCancelarDocModal() {
  document.getElementById('cancelar-doc-modal').style.display = 'none';
  _cancelDocObraId = _cancelDocEtapaId = _cancelDocSubId = null;
}
async function _saveCancelarDoc() {
  const motivo = document.getElementById('cancelar-doc-motivo')?.value.trim();
  if (!motivo) { showComercialToast('Informe o motivo do cancelamento.', 'error'); return; }
  const obra = _obras.find(o => o.id === _cancelDocObraId); if (!obra) return;
  const etapas = JSON.parse(JSON.stringify(obra.etapas));
  const sub = etapas[_cancelDocEtapaId] && etapas[_cancelDocEtapaId].subEtapas && etapas[_cancelDocEtapaId].subEtapas[_cancelDocSubId];
  if (!sub) return;
  sub.status = 'cancelado';
  sub.motivoCancelamento = motivo;
  sub.dataCancelamento = new Date().toISOString().slice(0, 10);
  sub.canceladoPor = currentUser?.username || null;
  await db.collection('obras').doc(_cancelDocObraId).update({ etapas });
  _audit(_cancelDocObraId, 'cancelamento', `Documentação cancelada (${_cancelDocSubId}): "${motivo}"`);
  showComercialToast('Documentação cancelada.', 'success');
  _closeCancelarDocModal();
}
async function _reativarDoc(obraId, etapaId, subId) {
  if (!podeEditarComercial()) { showComercialToast('Acesso somente leitura — você não pode alterar obras.', 'error'); return; }
  const obra = _obras.find(o => o.id === obraId); if (!obra) return;
  const etapas = JSON.parse(JSON.stringify(obra.etapas));
  const sub = etapas[etapaId] && etapas[etapaId].subEtapas && etapas[etapaId].subEtapas[subId];
  if (!sub) return;
  sub.status = 'active';
  delete sub.motivoCancelamento; delete sub.dataCancelamento; delete sub.canceladoPor;
  await db.collection('obras').doc(obraId).update({ etapas });
  _audit(obraId, 'cancelamento', `Documentação reativada (${subId})`);
  showComercialToast('Documentação reativada.', 'success');
}

function processarAprovacaoRecusa(obraId, etapaId, subId, tipo) {
  if (!podeEditarComercial()) { showComercialToast('Acesso somente leitura — você não pode alterar obras.', 'error'); return; }
  if (tipo === 'aprovado') {
    concluirSubEtapaComData(obraId, etapaId, subId);
  } else {
    _arObraId = obraId; _arEtapaId = etapaId; _arSubId = subId;
    const cfg = ETAPAS_CONFIG[etapaId];
    const subCfg = (cfg.subEtapas || []).find(s => s.id === subId);
    const titleEl = document.getElementById('recusa-modal-title');
    if (titleEl) titleEl.textContent = `Recusado — ${cfg.nome} · ${subCfg?.nome || subId}`;
    const input = document.getElementById('recusa-justificativa');
    if (input) input.value = '';
    document.getElementById('recusa-modal').style.display = 'flex';
  }
}
function closeRecusaModal() { document.getElementById('recusa-modal').style.display = 'none'; _arObraId = _arEtapaId = _arSubId = null; }
// ── Aprovado/Recusado em item de lista (aditivos/medicao) ─────────────────────
async function processarAprovacaoRecusaLista(obraId, etapaId, itemId, subId, tipo) {
  if (!podeEditarComercial()) { showComercialToast('Acesso somente leitura — você não pode alterar obras.', 'error'); return; }
  if (tipo === 'aprovado') {
    await _concluirSubDeLista(obraId, etapaId, itemId, subId, 'Aprovado');
  } else {
    const obra = _obras.find(o => o.id === obraId);
    const lista = obra?.etapas?.[etapaId]?.lista || [];
    const item = lista.find(i => i.id === itemId);
    const cfg = ETAPAS_CONFIG[etapaId];
    const subCfg = (cfg.subEtapasTemplate || []).find(s => s.id === subId);
    const titleEl = document.getElementById('recusa-modal-title');
    if (titleEl) titleEl.textContent = `Recusado — ${item?.titulo || cfg.nome} · ${subCfg?.nome || subId}`;
    const input = document.getElementById('recusa-justificativa');
    if (input) input.value = '';
    // Armazenar contexto para saveRecusa
    _arObraId = obraId; _arEtapaId = etapaId; _arSubId = subId;
    window._arListaItemId = itemId;
    document.getElementById('recusa-modal').style.display = 'flex';
  }
}

async function saveRecusaLista() {
  if (!podeEditarComercial()) { showComercialToast('Acesso somente leitura — você não pode alterar obras.', 'error'); return; }
  const just = document.getElementById('recusa-justificativa')?.value.trim();
  if (!just) { showComercialToast('Justificativa obrigatória.', 'error'); return; }
  const obraId = _arObraId, etapaId = _arEtapaId, itemId = window._arListaItemId;
  const obra = _obras.find(o => o.id === obraId); if (!obra) return;
  const hoje = new Date().toISOString().slice(0, 10);
  const etapas = JSON.parse(JSON.stringify(obra.etapas));
  const item = etapas[etapaId].lista.find(i => i.id === itemId); if (!item) return;
  const cfg = ETAPAS_CONFIG[etapaId];
  if (!item.revisoes) item.revisoes = [];
  const revNum = item.revisoes.length + 1;
  item.revisoes.push({ numero: revNum, motivo: `Recusado: ${just}`, data: hoje, por: currentUser.username });
  (cfg.subEtapasTemplate || []).forEach((s, i) => {
    if (!item.subEtapas[s.id]) return;
    item.subEtapas[s.id].status = i === 0 ? 'active' : 'pending';
    delete item.subEtapas[s.id].bloqueada; // revisão valida a sub-etapa retroativa
    item.subEtapas[s.id].dataConclusao = null; item.subEtapas[s.id].motivoAtraso = null;
    item.subEtapas[s.id].responsaveis = []; // Limpar atribuição na revisão
    if (i === 0) item.subEtapas[s.id].dataInicio = hoje;
    else { item.subEtapas[s.id].dataInicio = null; item.subEtapas[s.id].dataLimite = null; }
  });
  item.status = 'active';
  _audit(obraId, 'recusa', `REV.${revNum} — ${item.titulo}: recusado. Motivo: "${just}"`);
  window._arListaItemId = null;
  closeRecusaModal();
  await db.collection('obras').doc(obraId).update({ etapas });
  showComercialToast(`REV.${revNum} registrada — item reiniciado ✅`, 'success');
}

// ── Encerrar aditivo sem termo (conclui na carta_aprovacao) ──────────────────
let _encerrarObraId = null, _encerrarEtapaId = null, _encerrarItemId = null;

function openEncerrarAditivoModal(obraId, etapaId, itemId) {
  _encerrarObraId = obraId; _encerrarEtapaId = etapaId; _encerrarItemId = itemId;
  const obra = _obras.find(o => o.id === obraId);
  const item = (obra?.etapas?.[etapaId]?.lista || []).find(i => i.id === itemId);
  const titleEl = document.getElementById('encerrar-aditivo-title');
  if (titleEl) titleEl.textContent = `Encerrar: ${item?.titulo || 'Aditivo'}`;
  document.getElementById('encerrar-aditivo-modal').style.display = 'flex';
}
function closeEncerrarAditivoModal() {
  document.getElementById('encerrar-aditivo-modal').style.display = 'none';
  _encerrarObraId = _encerrarEtapaId = _encerrarItemId = null;
}
async function confirmarEncerrarAditivo() {
  if (!podeEditarComercial()) { showComercialToast('Acesso somente leitura — você não pode alterar obras.', 'error'); return; }
  const obraId = _encerrarObraId, etapaId = _encerrarEtapaId, itemId = _encerrarItemId;
  closeEncerrarAditivoModal();
  const obra = _obras.find(o => o.id === obraId); if (!obra) return;
  const hoje = new Date().toISOString().slice(0, 10);
  const etapas = JSON.parse(JSON.stringify(obra.etapas));
  const item = etapas[etapaId].lista.find(i => i.id === itemId); if (!item) return;
  const cfg = ETAPAS_CONFIG[etapaId];
  // Marcar sub-etapa atual (carta_aprovacao) como done e as posteriores como pulada
  const subs = cfg.subEtapasTemplate || [];
  let passouEncerramento = false;
  subs.forEach(s => {
    if (!item.subEtapas[s.id]) item.subEtapas[s.id] = { status: 'pending', dataLimite: null, dataConclusao: null };
    if (s.podeEncerrar) {
      // Concluir a sub-etapa de encerramento (carta_aprovacao)
      item.subEtapas[s.id].status = 'done';
      item.subEtapas[s.id].dataConclusao = hoje;
      item.subEtapas[s.id].concluidoPor = currentUser.username;
      passouEncerramento = true;
    } else if (passouEncerramento) {
      // Marcar sub-etapas POSTERIORES como puladas
      item.subEtapas[s.id].status = 'pulada';
      item.subEtapas[s.id].dataLimite = null;
      item.subEtapas[s.id].dataConclusao = null;
      item.subEtapas[s.id].puladoPor = currentUser.username;
      item.subEtapas[s.id].puladoEm = hoje;
    } else if (item.subEtapas[s.id].status === 'active') {
      // Marcar sub-etapas ativas anteriores como done (ex: carta_envio pode estar active)
      item.subEtapas[s.id].status = 'done';
      item.subEtapas[s.id].dataConclusao = hoje;
    }
  });
  item.status = 'done'; item.dataConclusao = hoje; item.concluidoPor = currentUser.username; item.encerradoSemTermo = true;
  const todosItemsDone = (etapas[etapaId].lista || []).every(i => i.status === 'done');
  if (todosItemsDone) etapas[etapaId].status = 'done';
  _audit(obraId, 'conclusao', `${item.titulo} encerrado sem Termo Aditivo`);
  await db.collection('obras').doc(obraId).update({ etapas });
  showComercialToast('Aditivo encerrado! ✅', 'success');
}

async function encerrarItemLista(obraId, etapaId, itemId) {
  if (!podeEditarComercial()) { showComercialToast('Acesso somente leitura — você não pode alterar obras.', 'error'); return; }
  openEncerrarAditivoModal(obraId, etapaId, itemId);
}

async function saveRecusa() {
  if (!podeEditarComercial()) { showComercialToast('Acesso somente leitura — você não pode alterar obras.', 'error'); return; }
  if (window._arListaItemId) { await saveRecusaLista(); return; }
  const just = document.getElementById('recusa-justificativa')?.value.trim();
  if (!just) { showComercialToast('Justificativa obrigatória.', 'error'); return; }
  const obraId = _arObraId, etapaId = _arEtapaId, subId = _arSubId;
  const obra = _obras.find(o => o.id === obraId); if (!obra) return;
  const hoje = new Date().toISOString().slice(0, 10);
  const etapas = JSON.parse(JSON.stringify(obra.etapas));
  const cfg = ETAPAS_CONFIG[etapaId];
  // Registrar revisão
  if (!etapas[etapaId].revisoes) etapas[_arEtapaId].revisoes = [];
  const revNum = etapas[etapaId].revisoes.length + 1;
  etapas[etapaId].revisoes.push({ numero: revNum, motivo: `Recusado: ${just}`, data: hoje, por: currentUser.username });
  // Reiniciar todas as sub-etapas
  const subs = cfg.subEtapas || [];
  subs.forEach((s, idx) => {
    if (!etapas[etapaId].subEtapas[s.id]) return;
    etapas[etapaId].subEtapas[s.id].status = idx === 0 ? 'active' : 'pending';
    delete etapas[etapaId].subEtapas[s.id].bloqueada; // revisão valida a sub-etapa retroativa
    etapas[etapaId].subEtapas[s.id].dataConclusao = null;
    etapas[etapaId].subEtapas[s.id].motivoAtraso = null;
    etapas[etapaId].subEtapas[s.id].tipoConclusao = null;
    if (idx === 0) { etapas[etapaId].subEtapas[s.id].dataInicio = hoje; etapas[etapaId].subEtapas[s.id].dataLimite = s.dias ? addDiasUteis(hoje, s.dias) : null; }
    else { etapas[etapaId].subEtapas[s.id].dataInicio = null; etapas[etapaId].subEtapas[s.id].dataLimite = null; }
  });
  etapas[etapaId].status = 'active';
  await db.collection('obras').doc(obraId).update({ etapas });
  _audit(obraId, 'recusa', `REV.${revNum} — ${ETAPAS_CONFIG[etapaId]?.nome}: recusado. Motivo: "${just}"`);
  showComercialToast(`REV.${revNum} registrada — etapa reiniciada ✅`, 'success');
  closeRecusaModal();
}


// ── COC Lista — múltiplas COCs por obra ───────────────────────────────────────
let _cocObraId = null;

function _toggleCocItem(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

function _renderCocLista(obra, etapaId, subId) {
  const e = obra.etapas?.[etapaId];
  const cocLista = e?.cocLista || [];
  // Dot status for COC is based on cocLista state
  // (subEtapas.coc is a stub — actual state in cocLista)
  const canAct = !obra.concluida;
  const hoje = new Date().toISOString().slice(0, 10);

  const itemsHtml = cocLista.map((item, idx) => {
    const isDone = item.status === 'done';
    const toggleId = `coc-item-${idx}`;
    const _cocAtras = item.status !== 'done' && item.dataPrevista && item.dataPrevista < hoje;
    const dtPrev = item.dataPrevista
      ? `<span style="font-size:0.65rem;color:${_cocAtras ? '#ef4444' : 'var(--muted)'};font-weight:${_cocAtras ? '700' : '400'};font-family:var(--font-mono);">${_cocAtras ? '⚠ ' : ''}${new Date(item.dataPrevista + 'T12:00:00').toLocaleDateString('pt-BR')}</span>` : '';
    const dtConc = item.dataConclusao
      ? `<span style="font-size:0.65rem;color:#22c55e;font-family:var(--font-mono);">✓ ${new Date(item.dataConclusao + 'T12:00:00').toLocaleDateString('pt-BR')}</span>` : '';
    const dropId = `acao-coc-${idx}`;
    const cocStatus = item.status || 'pending';
    const cocActive = cocStatus === 'active';
    const btnAcoes = canAct && !isDone ? `<div style="position:relative;display:inline-block;">
      <button class="sub-action-btn" data-dropdown="${dropId}" style="font-size:0.68rem;padding:0.15rem 0.45rem;background:var(--surface2);border-color:var(--border2);color:var(--text);display:inline-flex;align-items:center;gap:0.2rem;">
        Ações<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      <div id="${dropId}" class="acao-dropdown-menu" style="display:none;position:absolute;right:0;top:calc(100% + 4px);z-index:300;background:var(--surface);border:1px solid var(--border2);border-radius:8px;box-shadow:0 8px 24px #00000022;min-width:165px;overflow:hidden;">
        ${cocStatus === 'pending' ? `<button class="acao-item concluir" data-action="coc-iniciar" data-obra="${obra.id}" data-etapa="${etapaId}" data-coc="${idx}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg> Iniciar</button>` : ''}
        ${cocActive ? `<button class="acao-item concluir" data-action="coc-concluir" data-obra="${obra.id}" data-etapa="${etapaId}" data-coc="${idx}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Concluir</button>` : ''}
        ${cocActive ? `<button class="acao-item" data-action="coc-prorrogar" data-obra="${obra.id}" data-etapa="${etapaId}" data-coc="${idx}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Prorrogar</button>` : ''}
        <button class="acao-item" data-action="coc-atribuir" data-obra="${obra.id}" data-etapa="${etapaId}" data-coc="${idx}" data-resp="${_getResponsaveis(item).join(',')}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> ${_respBtnLabel(item)}</button>
        <button class="acao-item" data-action="coc-obs" data-obra="${obra.id}" data-etapa="${etapaId}" data-coc="${idx}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Observações</button>
        ${podeEditarComercial() ? `<button class="acao-item" data-action="coc-editar" data-obra="${obra.id}" data-etapa="${etapaId}" data-coc="${idx}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Editar</button>` : ''}
        ${podeEditarComercial() ? `<button class="acao-item" data-action="coc-excluir" data-obra="${obra.id}" data-etapa="${etapaId}" data-coc="${idx}" style="color:#ef4444;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg> Excluir</button>` : ''}
      </div>
    </div>` : '';

    const delBtn = canAct && !isDone ? `<button onclick="event.stopPropagation();_deleteCocItem('${obra.id}','${etapaId}',${idx})"
      title="Excluir" style="background:none;border:none;cursor:pointer;padding:0.15rem 0.25rem;color:var(--muted);border-radius:4px;flex-shrink:0;"
      onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='var(--muted)'">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
    </button>` : '';

    return `<div style="border:1px solid var(--border2);border-radius:8px;margin-top:0.5rem;">
      <div onclick="_toggleCocItem('${toggleId}')"
        style="display:flex;align-items:center;gap:0.6rem;padding:0.55rem 0.75rem;cursor:pointer;background:var(--surface2);">
        <span style="font-size:0.8rem;font-weight:700;color:${isDone ? '#22c55e' : '#f97316'};flex:1;">${isDone ? '✓ ' : ''} ${item.nome}</span>
        ${dtConc}${!isDone ? dtPrev : ''}
        ${!isDone ? _respBadges(item, '0.6rem') : ''}
        ${btnAcoes}${delBtn}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--muted);flex-shrink:0;"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div id="${toggleId}" style="display:none;padding:0.5rem 0.75rem;font-size:0.78rem;color:var(--muted);">
        ${(item.observacoes || []).length === 0
        ? `<div style="font-size:0.75rem;color:var(--muted);font-style:italic;">Nenhuma observação registrada.</div>`
        : `<div style="max-height:140px;overflow-y:auto;display:flex;flex-direction:column;gap:0.5rem;padding-right:0.25rem;">
              ${[...(item.observacoes || [])].reverse().map(o => `
                <div style="background:var(--surface3,var(--surface2));border-radius:6px;padding:0.45rem 0.6rem;">
                  <div style="font-size:0.8rem;color:var(--text);line-height:1.4;">${o.texto}</div>
                  <div style="font-size:0.65rem;color:var(--muted);margin-top:0.2rem;font-family:var(--font-mono);">${o.data}${o.hora ? ' · ' + o.hora : ''} — ${o.por}</div>
                </div>`).join('')}
             </div>`
      }
      </div>
    </div>`;
  }).join('');

  const addBtn = !canAct ? '' : (cocLista.length === 0
    ? `<div style="display:flex;justify-content:center;margin-top:0.4rem;">
      <button class="sub-action-btn concluir" onclick="_openAddCocModal('${obra.id}','${etapaId}')"
        style="font-size:0.72rem;padding:0.3rem 1rem;display:inline-flex;align-items:center;gap:0.4rem;">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        Iniciar Documentações (1ª COC)
      </button>
    </div>`
    : `<div style="display:flex;justify-content:center;margin-top:0.4rem;">
      <button class="sub-action-btn concluir" onclick="_openAddCocModal('${obra.id}','${etapaId}')"
        style="font-size:0.72rem;padding:0.25rem 0.9rem;display:inline-flex;align-items:center;gap:0.35rem;">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        COC
      </button>
    </div>`);

  return `${itemsHtml}${addBtn}`;
}

function _openAddCocModal(obraId, etapaId) {
  _cocObraId = obraId;
  document.getElementById('add-coc-obra-id').value = obraId;
  document.getElementById('add-coc-etapa-id').value = etapaId;
  document.getElementById('add-coc-nome').value = '';
  document.getElementById('add-coc-data').value = '';
  document.getElementById('add-coc-modal').style.display = 'flex';
}
function _closeAddCocModal() {
  document.getElementById('add-coc-modal').style.display = 'none';
}
async function _saveAddCoc() {
  if (!podeEditarComercial()) { showComercialToast('Acesso somente leitura — você não pode alterar obras.', 'error'); return; }
  const obraId = document.getElementById('add-coc-obra-id').value;
  const etapaId = document.getElementById('add-coc-etapa-id').value;
  const nome = document.getElementById('add-coc-nome').value.trim();
  const data = document.getElementById('add-coc-data').value || null;
  if (!nome) { showComercialToast('Informe o nome da COC.', 'error'); return; }
  const obra = _obras.find(o => o.id === obraId); if (!obra) return;
  const etapas = JSON.parse(JSON.stringify(obra.etapas));
  const _eraVaziaCoc = !etapas[etapaId].cocLista || etapas[etapaId].cocLista.length === 0;
  if (!etapas[etapaId].cocLista) etapas[etapaId].cocLista = [];
  etapas[etapaId].cocLista.push({ nome, dataPrevista: data, status: 'active', dataConclusao: null });
  // Se etapa ainda não foi iniciada, iniciar
  if (etapas[etapaId].status === 'pending') etapas[etapaId].status = 'active';
  // 1ª COC: ancora as demais documentações em +14 dias corridos a partir da data prevista da COC
  if (_eraVaziaCoc && data) {
    const _venc = addDiasCorridos(data, 14);
    ['art', 'cno_sfobras', 'serasa'].forEach(_id => {
      const _sd = etapas[etapaId].subEtapas && etapas[etapaId].subEtapas[_id];
      if (_sd && _sd.status !== 'done' && _sd.status !== 'cancelado') {
        _sd.status = 'active';
        if (!_sd.dataLimite) _sd.dataLimite = _venc;
        if (!_sd.dataPrevista) _sd.dataPrevista = _venc;
      }
    });
  }
  await db.collection('obras').doc(obraId).update({ etapas });
  _audit(obraId, 'aditivo_add', `COC adicionada: "${nome}"`);
  showComercialToast(`COC "${nome}" adicionada! ✅`, 'success');
  _closeAddCocModal();
}
async function _concluirCocItem(obraId, etapaId, idx, dataCustom) {
  if (!podeEditarComercial()) { showComercialToast('Acesso somente leitura — você não pode alterar obras.', 'error'); return; }
  const obra = _obras.find(o => o.id === obraId); if (!obra) return;
  const etapas = JSON.parse(JSON.stringify(obra.etapas));
  const item = etapas[etapaId].cocLista?.[idx]; if (!item) return;
  const hoje = dataCustom || new Date().toISOString().slice(0, 10);
  item.status = 'done';
  item.dataConclusao = hoje;
  item.concluidoPor = currentUser.username;

  // Garantir que subEtapas existe
  if (!etapas[etapaId].subEtapas) etapas[etapaId].subEtapas = {};
  if (!etapas[etapaId].subEtapas.coc) etapas[etapaId].subEtapas.coc = { status: 'pending', dataLimite: null, dataConclusao: null };

  // Verificar se TODOS os COCs estão done
  const allCocDone = (etapas[etapaId].cocLista || []).length > 0 &&
    (etapas[etapaId].cocLista || []).every(i => i.status === 'done');

  // Sincronizar subEtapas.coc com o estado real da cocLista
  etapas[etapaId].subEtapas.coc.status = allCocDone ? 'done' : 'active';
  if (allCocDone) etapas[etapaId].subEtapas.coc.dataConclusao = hoje;

  // Verificar se toda a etapa de Documentações está concluída
  const cfgDoc = ETAPAS_CONFIG[etapaId];
  if (cfgDoc?.isIndependente && allCocDone) {
    const todasDocDone = (cfgDoc.subEtapas || []).every(s =>
      etapas[etapaId].subEtapas?.[s.id]?.status === 'done'
    );
    if (todasDocDone) {
      etapas[etapaId].status = 'done';
    }
  }

  await db.collection('obras').doc(obraId).update({ etapas });
  showComercialToast('COC concluída! ✅', 'success');
}
async function _deleteCocItem(obraId, etapaId, idx) {
  if (!podeEditarComercial()) { showComercialToast('Acesso somente leitura — você não pode alterar obras.', 'error'); return; }
  if (!confirm('Excluir esta COC? Esta ação não pode ser desfeita.')) return;
  const obra = _obras.find(o => o.id === obraId); if (!obra) return;
  const etapas = JSON.parse(JSON.stringify(obra.etapas));
  const nome = etapas[etapaId].cocLista?.[idx]?.nome || '';
  etapas[etapaId].cocLista.splice(idx, 1);
  await db.collection('obras').doc(obraId).update({ etapas });
  _audit(obraId, 'aditivo_del', `COC excluída: "${nome}"`);
  showComercialToast('COC excluída. ✅', 'success');
}

async function _iniciarCocItem(obraId, etapaId, idx) {
  const obra = _obras.find(o => o.id === obraId); if (!obra) return;
  const etapas = JSON.parse(JSON.stringify(obra.etapas));
  const item = etapas[etapaId].cocLista?.[idx]; if (!item) return;
  item.status = 'active'; item.dataInicio = new Date().toISOString().slice(0, 10);
  await db.collection('obras').doc(obraId).update({ etapas });
  showComercialToast('COC iniciada! ✅', 'success');
}

// ── COC state para modais ────────────────────────────────────────────────────
let _cocActionObraId = null, _cocActionEtapaId = null, _cocActionIdx = null;

async function _prorrogarCocItem(obraId, etapaId, idx) {
  if (!podeEditarComercial()) { showComercialToast('Acesso somente leitura — você não pode alterar obras.', 'error'); return; }
  _cocActionObraId = obraId; _cocActionEtapaId = etapaId; _cocActionIdx = idx;
  const item = _obras.find(o => o.id === obraId)?.etapas?.[etapaId]?.cocLista?.[idx];
  const titleEl = document.getElementById('prorrogar-modal-title');
  if (titleEl) titleEl.textContent = `Prorrogar — COC · ${item?.nome || ''}`;
  const hojeCoc = new Date().toISOString().slice(0, 10);
  const input = document.getElementById('prorrogar-data-input');
  if (input) { input.min = hojeCoc; input.value = item?.dataPrevista || ''; }
  const info = document.getElementById('prorrogar-modal-info');
  if (info) { info.textContent = `Data prevista atual: ${item?.dataPrevista ? new Date(item.dataPrevista + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}`; }
  const just = document.getElementById('prorrogar-justificativa'); if (just) just.value = '';
  const _jwC = document.getElementById('prorrogar-just-wrap'); if (_jwC) _jwC.style.display = 'none';
  const _dlC = document.getElementById('prorrogar-data-label'); if (_dlC) _dlC.innerHTML = 'Data prevista <span style="color:var(--accent);">*</span>';
  document.getElementById('prorrogar-modal').dataset.analiseMode = '';
  document.getElementById('prorrogar-modal').dataset.cocMode = '1';
  document.getElementById('prorrogar-modal').style.display = 'flex';
}

async function _atribuirCocItem(obraId, etapaId, idx) {
  if (!podeEditarComercial()) { showComercialToast('Acesso somente leitura — você não pode alterar obras.', 'error'); return; }
  _cocActionObraId = obraId; _cocActionEtapaId = etapaId; _cocActionIdx = idx;
  const item = _obras.find(o => o.id === obraId)?.etapas?.[etapaId]?.cocLista?.[idx];
  _preencherAtribLista(_getResponsaveis(item));
  const titleEl = document.getElementById('atrib-modal-title');
  if (titleEl) titleEl.textContent = `Atribuir — COC · ${item?.nome || ''}`;
  const justWrap = document.getElementById('atrib-justificativa-wrap');
  if (justWrap) justWrap.style.display = 'none';
  document.getElementById('atrib-modal').dataset.cocMode = '1';
  document.getElementById('atrib-modal').style.display = 'flex';
}
async function _obsCocItem(obraId, etapaId, idx) {
  _openObsModalCoc(obraId, etapaId, idx);
}

async function _dataPrevistaCocItem(obraId, etapaId, idx) {
  if (!podeEditarComercial()) { showComercialToast('Acesso somente leitura — você não pode alterar obras.', 'error'); return; }
  _cocActionObraId = obraId; _cocActionEtapaId = etapaId; _cocActionIdx = idx;
  const item = _obras.find(o => o.id === obraId)?.etapas?.[etapaId]?.cocLista?.[idx];
  const titleEl = document.getElementById('dp-modal-title');
  if (titleEl) titleEl.textContent = `Data Prevista — COC · ${item?.nome || ''}`;
  const input = document.getElementById('dp-data-input');
  if (input) input.value = item?.dataPrevista || '';
  document.getElementById('dp-modal').dataset.cocMode = '1';
  document.getElementById('dp-modal').style.display = 'flex';
}

async function iniciarSubEtapa(obraId, etapaId, subId) {
  const obra = _obras.find(o => o.id === obraId); if (!obra) return;
  const etapas = JSON.parse(JSON.stringify(obra.etapas));
  const sub = etapas[etapaId].subEtapas[subId]; if (!sub) return;
  sub.status = 'active';
  sub.dataInicio = new Date().toISOString().slice(0, 10);
  await db.collection('obras').doc(obraId).update({ etapas });
  showComercialToast('Sub-etapa iniciada! ✅', 'success');
}


let _addItemEtapaId = null, _addItemObraId = null;

function openAddItemModal(obraId, etapaId) {
  _addItemObraId = obraId; _addItemEtapaId = etapaId;
  const cfg = ETAPAS_CONFIG[etapaId];
  const obra = _obras.find(o => o.id === obraId);
  const n = (obra?.etapas?.[etapaId]?.lista?.length || 0) + 1;
  const label = cfg.nome === 'Aditivos / Termo' ? 'Aditivo' : 'Medição';
  document.getElementById('add-item-title').textContent = `Adicionar ${label}`;
  document.getElementById('add-item-nome').value = `${label} ${n}`;
  document.getElementById('add-item-data').value = '';
  document.getElementById('add-item-modal').style.display = 'flex';
}
function closeAddItemModal() {
  document.getElementById('add-item-modal').style.display = 'none';
  _addItemObraId = _addItemEtapaId = null;
}
async function saveAddItem() {
  if (!podeEditarComercial()) { showComercialToast('Acesso somente leitura — você não pode alterar obras.', 'error'); return; }
  const titulo = document.getElementById('add-item-nome')?.value.trim();
  if (!titulo) { showComercialToast('Informe o título.', 'error'); return; }
  const dataPrevista = document.getElementById('add-item-data')?.value || null;
  const obra = _obras.find(o => o.id === _addItemObraId); if (!obra) return;
  const etapas = JSON.parse(JSON.stringify(obra.etapas));
  if (!etapas[_addItemEtapaId].lista) etapas[_addItemEtapaId].lista = [];
  etapas[_addItemEtapaId].ativa = true;
  etapas[_addItemEtapaId].status = 'active';
  etapas[_addItemEtapaId].lista.push(criarItemLista(_addItemEtapaId, titulo, dataPrevista));
  const tipoItem = ETAPAS_CONFIG[_addItemEtapaId]?.nome === 'Aditivos / Termo' ? 'aditivo_add' : 'medicao_add';
  _audit(_addItemObraId, tipoItem, `Novo item adicionado: "${titulo}"${dataPrevista ? ' (Previsto: ' + dataPrevista + ')' : ''}`);
  await db.collection('obras').doc(_addItemObraId).update({ etapas });
  showComercialToast(`"${titulo}" adicionado! ✅`, 'success');
  closeAddItemModal();
}

async function adicionarItemLista(obraId, etapaId) {
  if (!podeEditarComercial()) { showComercialToast('Acesso somente leitura — você não pode alterar obras.', 'error'); return; }
  openAddItemModal(obraId, etapaId);
}

// ── Excluir item da lista ──────────────────────────────────────────────────────
let _excluirObraId = null, _excluirEtapaId = null, _excluirItemId = null;

function confirmarExcluirItem(obraId, etapaId, itemId, titulo) {
  _excluirObraId = obraId; _excluirEtapaId = etapaId; _excluirItemId = itemId;
  document.getElementById('excluir-item-titulo').textContent = titulo;
  document.getElementById('excluir-item-modal').style.display = 'flex';
}
function closeExcluirItemModal() {
  document.getElementById('excluir-item-modal').style.display = 'none';
  _excluirObraId = _excluirEtapaId = _excluirItemId = null;
}
async function confirmarExcluir() {
  if (!podeEditarComercial()) { showComercialToast('Acesso somente leitura — você não pode alterar obras.', 'error'); return; }
  const obra = _obras.find(o => o.id === _excluirObraId); if (!obra) return;
  const etapas = JSON.parse(JSON.stringify(obra.etapas));
  etapas[_excluirEtapaId].lista = (etapas[_excluirEtapaId].lista || []).filter(i => i.id !== _excluirItemId);
  if (etapas[_excluirEtapaId].lista.length === 0) {
    etapas[_excluirEtapaId].status = 'pending';
    etapas[_excluirEtapaId].ativa = false;
  }
  const obraEx = _obras.find(o => o.id === _excluirObraId);
  const itemEx = (obraEx?.etapas?.[_excluirEtapaId]?.lista || []).find(i => i.id === _excluirItemId);
  const tipoEx = ETAPAS_CONFIG[_excluirEtapaId]?.nome === 'Aditivos / Termo' ? 'aditivo_del' : 'medicao_del';
  _audit(_excluirObraId, tipoEx, `Item excluído: "${itemEx?.titulo || _excluirItemId}"`);
  await db.collection('obras').doc(_excluirObraId).update({ etapas });
  showComercialToast('Item excluído. ✅', 'success');
  closeExcluirItemModal();
}

async function concluirItemLista(obraId, etapaId, itemId) {
  if (!podeEditarComercial()) { showComercialToast('Acesso somente leitura — você não pode alterar obras.', 'error'); return; }
  const obra = _obras.find(o => o.id === obraId); if (!obra) return;
  const hoje = new Date().toISOString().slice(0, 10);
  const etapas = JSON.parse(JSON.stringify(obra.etapas));
  const item = etapas[etapaId].lista.find(i => i.id === itemId);
  if (!item) return;
  item.status = 'done'; item.dataConclusao = hoje; item.concluidoPor = currentUser.username;
  // Verificar se todos itens done → etapa done → verificar conclusão obra
  const todosDone = etapas[etapaId].lista.every(i => i.status === 'done');
  if (todosDone) etapas[etapaId].status = 'done';
  const todasDone = ETAPAS_ORDER.filter(id => etapas[id]?.ativa && etapas[id]?.status !== 'pulada').every(id => etapas[id]?.status === 'done');
  if (todasDone) {
    await db.collection('obras').doc(obraId).update({ etapas, concluida: true, dataConclusao: hoje });
    showComercialToast('Obra concluída! 🎉', 'success');
  } else {
    await db.collection('obras').doc(obraId).update({ etapas });
    showComercialToast('Item concluído! ✅', 'success');
  }
}

function renderListaEtapa(obra, etapaId, hoje) {
  const cfg = ETAPAS_CONFIG[etapaId];
  const e = obra.etapas?.[etapaId];
  const lista = e?.lista || [];
  const canAdd = !obra.concluida;
  const label = cfg.nome === 'Aditivos / Termo' ? 'Aditivo' : 'Medição';

  const itemsHtml = lista.map((item, idx) => {
    const isDone = item.status === 'done';
    const corItem = isDone ? '#22c55e' : cfg.cor;
    const _itemAtras = item.status !== 'done' && item.dataPrevista && item.dataPrevista < hoje;
    const dtPrev = item.dataPrevista
      ? `<span style="font-size:0.65rem;color:${_itemAtras ? '#ef4444' : 'var(--muted)'};font-weight:${_itemAtras ? '700' : '400'};font-family:var(--font-mono);">
           <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
           ${_itemAtras ? '⚠ ' : ''}${new Date(item.dataPrevista + 'T12:00:00').toLocaleDateString('pt-BR')}</span>` : '';
    const dtConc = item.dataConclusao
      ? `<span style="font-size:0.65rem;color:#22c55e;font-family:var(--font-mono);">✓ ${new Date(item.dataConclusao + 'T12:00:00').toLocaleDateString('pt-BR')}</span>` : '';
    const toggleId = `lista-item-${etapaId}-${idx}`;

    // Sub-etapas do item
    const subsHtml = (cfg.subEtapasTemplate || []).map(subCfg => {
      const sub = item.subEtapas?.[subCfg.id];
      if (!sub) return '';
      const subStatus = sub.status || 'pending';
      // Sub-etapa RETROATIVA (adicionada depois a uma obra antiga): opcional, NÃO bloqueia a obra
      if (sub.bloqueada) {
        const _retroDone = sub.status === 'done';
        const _rid = `retro-${etapaId}-${item.id}-${subCfg.id}`;
        const _retroData = (_retroDone && sub.dataConclusao) ? `<span style="font-size:0.65rem;color:#22c55e;font-family:var(--font-mono);">✓ ${new Date(sub.dataConclusao + 'T12:00:00').toLocaleDateString('pt-BR')}</span>` : '';
        const _retroAcao = _retroDone
          ? `<button class="acao-item" data-action="retro-reabrir" data-obra="${obra.id}" data-etapa="${etapaId}" data-item="${item.id}" data-sub="${subCfg.id}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg> Reabrir</button>`
          : `<button class="acao-item concluir" data-action="retro-concluir" data-obra="${obra.id}" data-etapa="${etapaId}" data-item="${item.id}" data-sub="${subCfg.id}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Concluir</button>`;
        const _retroMenu = podeEditarComercial() ? `<div style="position:relative;display:inline-block;"><button class="sub-action-btn" data-dropdown="${_rid}" style="font-size:0.68rem;padding:0.2rem 0.55rem;background:var(--surface2);border-color:var(--border2);color:var(--text);display:flex;align-items:center;gap:0.25rem;">Ações<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></button><div id="${_rid}" class="acao-dropdown-menu" style="display:none;position:absolute;right:0;top:calc(100% + 4px);z-index:300;background:var(--surface);border:1px solid var(--border2);border-radius:8px;box-shadow:0 8px 24px #00000022;min-width:165px;overflow:hidden;">${_retroAcao}<button class="acao-item" data-action="obs" data-obra="${obra.id}" data-etapa="${etapaId}" data-item="${item.id}" data-sub="${subCfg.id}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Observações</button></div></div>` : '';
        return `<div style="display:flex;align-items:center;gap:0.5rem;padding:0.3rem 0;border-bottom:1px solid var(--border2);">
          <span style="width:16px;height:16px;border-radius:50%;background:${_retroDone ? '#22c55e' : 'var(--surface2)'};color:${_retroDone ? '#fff' : 'var(--muted)'};border:1px ${_retroDone ? 'solid #22c55e' : 'dashed var(--border2)'};display:flex;align-items:center;justify-content:center;font-size:0.6rem;font-weight:700;flex-shrink:0;">${_retroDone ? '✓' : ''}</span>
          <span style="flex:1;font-size:0.78rem;${_retroDone ? '' : 'color:var(--muted);'}">${subCfg.nome} <span style="font-size:0.55rem;font-weight:700;color:var(--muted);padding:0.05rem 0.35rem;border-radius:4px;font-family:var(--font-mono);border:1px solid var(--border2);vertical-align:middle;">RETROATIVA</span></span>
          <div style="display:flex;align-items:center;gap:0.4rem;">${_retroData}${_retroMenu}</div>
        </div>`;
      }
      // Sub-etapa pulada — card igual aos demais, mas com tachado e badge Pulado
      if (subStatus === 'pulada') {
        const puladoFmt = sub.puladoEm
          ? `<span style="font-size:0.65rem;color:var(--muted);font-family:var(--font-mono);flex-shrink:0;">⏭ ${new Date(sub.puladoEm + 'T12:00:00').toLocaleDateString('pt-BR')}${sub.puladoPor ? ' · ' + sub.puladoPor : ''}</span>`
          : `<span style="font-size:0.62rem;font-weight:700;color:var(--muted);padding:0.1rem 0.4rem;border-radius:4px;font-family:var(--font-mono);flex-shrink:0;border:1px solid var(--border2);">Pulada</span>`;
        return `<div style="display:flex;align-items:center;gap:0.5rem;padding:0.3rem 0;border-bottom:1px solid var(--border2);">
          <span style="width:16px;height:16px;border-radius:50%;background:#9ca3af;color:#fff;display:flex;align-items:center;justify-content:center;font-size:0.6rem;font-weight:700;flex-shrink:0;">⏭</span>
          <span style="flex:1;font-size:0.78rem;color:var(--muted);text-decoration:line-through;">${subCfg.nome}</span>
          ${puladoFmt}
        </div>`;
      }
      const _refSub = sub.dataLimite || sub.dataPrevista || (subStatus === 'active' ? item.dataPrevista : null);
      const atrasada = subStatus !== 'done' && subStatus !== 'pulada' && _refSub && _refSub < hoje;
      const diasCount = sub.dataInicio ? Math.floor((new Date() - new Date(sub.dataInicio + 'T12:00:00')) / (1000 * 60 * 60 * 24)) : 0;
      let dataInfo = '';
      if (subCfg.isAnalise && subStatus === 'active' && sub.dataInicio) {
        dataInfo = `<span style="color:#8b5cf6;font-family:var(--font-mono);font-size:0.65rem;font-weight:700;">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          ${diasCount}d nesta sub-etapa</span>`;
      } else if (sub.dataConclusao) {
        const por = sub.concluidoPor ? ` · ${sub.concluidoPor}` : '';
        const tipo = sub.tipoConclusao ? ` (${sub.tipoConclusao})` : '';
        dataInfo = `<span style="color:#22c55e;font-family:var(--font-mono);font-size:0.65rem;">✓ ${new Date(sub.dataConclusao + 'T12:00:00').toLocaleDateString('pt-BR')}${por}${tipo}</span>`;
      } else if (atrasada && sub.dataLimite) {
        dataInfo = `<span style="color:#ef4444;font-family:var(--font-mono);font-size:0.65rem;font-weight:700;">⚠ ${new Date(sub.dataLimite + 'T12:00:00').toLocaleDateString('pt-BR')}</span>`;
      } else if (sub.dataLimite) {
        dataInfo = `<span style="color:var(--muted);font-family:var(--font-mono);font-size:0.65rem;">${new Date(sub.dataLimite + 'T12:00:00').toLocaleDateString('pt-BR')}</span>`;
      }

      const dotColor = subStatus === 'done' ? '#22c55e' : atrasada ? '#ef4444' : subStatus === 'active' ? cfg.cor : 'var(--muted)';
      const dotSymbol = subStatus === 'done' ? '✓' : atrasada ? '!' : subStatus === 'active' ? '›' : '·';
      const dropId = `acao-lista-${etapaId}-${item.id}-${subCfg.id}`;
      const canConc = subStatus !== 'done' && !obra.concluida;

      const _reabrirDropLista = (podeEditarComercial() && subStatus === 'done' && !obra.concluida) ? `<div style="position:relative;display:inline-block;"><button class="sub-action-btn" data-dropdown="reab-acao-lista-${etapaId}-${item.id}-${subCfg.id}" style="font-size:0.68rem;padding:0.2rem 0.55rem;background:var(--surface2);border-color:var(--border2);color:var(--text);display:flex;align-items:center;gap:0.25rem;">Ações<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></button><div id="reab-acao-lista-${etapaId}-${item.id}-${subCfg.id}" class="acao-dropdown-menu" style="display:none;position:absolute;right:0;top:calc(100% + 4px);z-index:300;background:var(--surface);border:1px solid var(--border2);border-radius:8px;box-shadow:0 8px 24px #00000022;min-width:165px;overflow:hidden;"><button class="acao-item" data-action="reabrir-sub" data-obra="${obra.id}" data-etapa="${etapaId}" data-item="${item.id}" data-sub="${subCfg.id}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg> Reabrir</button><button class="acao-item" data-action="obs" data-obra="${obra.id}" data-etapa="${etapaId}" data-item="${item.id}" data-sub="${subCfg.id}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Observações</button></div></div>` : '';
      const acoesDropdown = !obra.concluida && subStatus !== 'done' ? (() => {
        const _dId = `acao-lista-${etapaId}-${item.id}-${subCfg.id}`;
        const _resp = _getResponsaveis(sub).join(',');
        const _items = [
          subStatus === 'active' && subCfg.podeEncerrar ? `<button class="acao-item" data-action="encerrar-lista" data-obra="${obra.id}" data-etapa="${etapaId}" data-item="${item.id}" data-sub="${subCfg.id}" style="color:#f59e0b;font-weight:600;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 8 8 12 12 16"/><line x1="16" y1="12" x2="8" y2="12"/></svg> Encerrar Aditivo</button>` : '',
          subStatus === 'active' && !subCfg.isAprovacaoRecusa ? `<button class="acao-item concluir" data-action="concluir-lista" data-obra="${obra.id}" data-etapa="${etapaId}" data-item="${item.id}" data-sub="${subCfg.id}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Concluir</button>` : '',
          subStatus === 'active' && subCfg.isAprovacaoRecusa ? `<button class="acao-item concluir" data-action="aprovado-lista" data-obra="${obra.id}" data-etapa="${etapaId}" data-item="${item.id}" data-sub="${subCfg.id}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Aprovado</button>` : '',
          subStatus === 'active' && subCfg.isAprovacaoRecusa ? `<button class="acao-item motivo" data-action="recusado-lista" data-obra="${obra.id}" data-etapa="${etapaId}" data-item="${item.id}" data-sub="${subCfg.id}" style="color:#ef4444;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Recusado</button>` : '',

          subStatus === 'active' ? `<button class="acao-item" data-action="prorrogar" data-obra="${obra.id}" data-etapa="${etapaId}" data-sub="${subCfg.id}" data-item="${item.id}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Prorrogar</button>` : '',
          `<button class="acao-item" data-action="atribuir" data-obra="${obra.id}" data-etapa="${etapaId}" data-sub="${subCfg.id}" data-item="${item.id}" data-resp="${_resp}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> ${_respBtnLabel(sub)}</button>`,
          `<button class="acao-item" data-action="obs" data-obra="${obra.id}" data-etapa="${etapaId}" data-sub="${subCfg.id}" data-item="${item.id}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Observações</button>`,
        ].join('');
        return `<div style="position:relative;display:inline-block;"><button class="sub-action-btn" data-dropdown="${_dId}" style="font-size:0.68rem;padding:0.2rem 0.55rem;background:var(--surface2);border-color:var(--border2);color:var(--text);display:flex;align-items:center;gap:0.25rem;">Ações<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></button><div id="${_dId}" class="acao-dropdown-menu" style="display:none;position:absolute;right:0;top:calc(100% + 4px);z-index:300;background:var(--surface);border:1px solid var(--border2);border-radius:8px;box-shadow:0 8px 24px #00000022;min-width:165px;overflow:hidden;">${_items}</div></div>`;
      })() : _reabrirDropLista;

      return `<div style="display:flex;align-items:center;gap:0.5rem;padding:0.3rem 0;border-bottom:1px solid var(--border2);">
        <span style="width:16px;height:16px;border-radius:50%;background:${dotColor};color:#fff;display:flex;align-items:center;justify-content:center;font-size:0.6rem;font-weight:700;flex-shrink:0;">${dotSymbol}</span>
        <span style="flex:1;font-size:0.78rem;">${subCfg.nome}${sub.autoConcluida ? ' <span style="font-size:0.55rem;font-weight:700;color:var(--muted);padding:0.05rem 0.35rem;border-radius:4px;font-family:var(--font-mono);border:1px solid var(--border2);vertical-align:middle;">CONCLUÍDA AUTOMATICAMENTE</span>' : ''}</span>
        ${_respBadges(sub, '0.6rem')}
        <div style="display:flex;align-items:center;gap:0.4rem;">${dataInfo}${acoesDropdown}</div>
      </div>`;
    }).join('');

    return `
    <div style="border:1px solid var(--border2);border-radius:8px;margin-top:0.5rem;">
      <div onclick="document.getElementById('${toggleId}').style.display=document.getElementById('${toggleId}').style.display==='none'?'block':'none'"
        style="display:flex;align-items:center;gap:0.6rem;padding:0.55rem 0.75rem;cursor:pointer;background:var(--surface2);">
        <span style="font-size:0.8rem;font-weight:700;color:${corItem};flex:1;">${isDone ? '✓ ' : ''} ${item.titulo}${(item.revisoes || []).length > 0 ? ` <span style="background:#f59e0b;color:#fff;font-size:0.58rem;font-weight:800;padding:0.1rem 0.35rem;border-radius:4px;font-family:var(--font-mono);vertical-align:middle;">REV.${item.revisoes.length}</span>` : ''}</span>
        ${dtConc}${!isDone ? dtPrev : ''}
        ${canAdd ? `<button
            onclick="event.stopPropagation();editarRegistro('${obra.id}','${etapaId}','${item.id}',null)"
            title="Editar ${item.titulo}"
            style="background:none;border:none;cursor:pointer;padding:0.15rem 0.25rem;color:var(--muted);border-radius:4px;flex-shrink:0;"
            onmouseover="this.style.color='var(--accent)'" onmouseout="this.style.color='var(--muted)'">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>`: ''}
        ${canAdd ? `<button
            onclick="event.stopPropagation();confirmarExcluirItem('${obra.id}','${etapaId}','${item.id}','${item.titulo}')"
            title="Excluir ${item.titulo}"
            style="background:none;border:none;cursor:pointer;padding:0.15rem 0.25rem;color:var(--muted);border-radius:4px;flex-shrink:0;"
            onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='var(--muted)'">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>`: ''}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--muted);flex-shrink:0;"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div id="${toggleId}" style="display:none;padding:0.5rem 0.75rem;">${subsHtml}</div>
    </div>`;
  }).join('');

  const addBtn = canAdd ? `<div style="display:flex;justify-content:center;margin-top:0.5rem;">
    <button class="sub-action-btn concluir" onclick="adicionarItemLista('${obra.id}','${etapaId}')"
      style="font-size:0.72rem;padding:0.25rem 0.9rem;display:inline-flex;align-items:center;gap:0.35rem;">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      ${label}
    </button>
  </div>` : '';

  return `${itemsHtml}${addBtn}`;
}


// ── Dropdown Ações ─────────────────────────────────────────────────────────

// ── Contar pendências atribuídas ao usuário logado ───────────────────────────
function contarMinhasPendencias(obra) {
  if (!obra.etapas || obra.concluida) return 0;
  let count = 0;
  ETAPAS_ORDER.forEach(id => {
    const e = obra.etapas[id];
    const cfg = ETAPAS_CONFIG[id];
    if (!e?.ativa) return;
    if (cfg.isLista) {
      (e.lista || []).forEach(item => {
        Object.values(item.subEtapas || {}).forEach(s => {
          if (s.status !== 'done' && _temResp(s, currentUser?.username)) count++;
        });
      });
    } else {
      Object.values(e.subEtapas || {}).forEach(s => {
        if (s.status !== 'done' && _temResp(s, currentUser?.username)) count++;
      });
    }
  });
  return count;
}


// ── Badge Histórico — itens novos desde última visualização ─────────────────
function _getHistKey(obraId) { return `hist-visto-${obraId}`; }

function _contarHistoricoTotal(obra) {
  let total = 0;
  ETAPAS_ORDER.forEach(etapaId => {
    const e = obra.etapas?.[etapaId]; if (!e) return;
    const cfg = ETAPAS_CONFIG[etapaId];
    total += (e.observacoes || []).length + (e.revisoes || []).length;
    if (!cfg.isLista) {
      (cfg.subEtapas || []).forEach(sub => {
        const sd = e.subEtapas?.[sub.id];
        total += (sd?.observacoes || []).length + (sd?.revisoes || []).length;
      });
    } else {
      (e.lista || []).forEach(item => {
        (cfg.subEtapasTemplate || []).forEach(sub => {
          const sd = item.subEtapas?.[sub.id];
          total += (sd?.observacoes || []).length + (sd?.revisoes || []).length;
        });
      });
    }
  });
  return total;
}

function _historicoTemNovos(obra) {
  const key = _getHistKey(obra.id);
  const visto = parseInt(localStorage.getItem(key) || '0');
  const total = _contarHistoricoTotal(obra);
  return total > visto;
}

function _marcarHistoricoVisto(obra) {
  localStorage.setItem(_getHistKey(obra.id), _contarHistoricoTotal(obra));
}


// ── Auditoria — registro imutável em subcoleção ───────────────────────────────
async function _audit(obraId, tipo, descricao, extra) {
  try {
    const entrada = {
      tipo, descricao,
      extra: extra || null,
      por: currentUser?.username || '—',
      em: new Date().toISOString(),
    };
    // Salva no array _auditoria dentro do documento da obra (sem subcoleção)
    await db.collection('obras').doc(obraId).update({
      _auditoria: firebase.firestore.FieldValue.arrayUnion(entrada)
    });
  } catch (e) { console.warn('[Auditoria]', e); }
}

let _auditoriaCache = {}; // { obraId: [{...}] }
async function _loadAuditoria(obraId) {
  try {
    const doc = await db.collection('obras').doc(obraId).get();
    const entries = doc.data()?._auditoria || [];
    // Ordenar do mais recente para o mais antigo
    entries.sort((a, b) => (b.em || '').localeCompare(a.em || ''));
    _auditoriaCache[obraId] = entries;
  } catch (e) {
    console.warn('[Auditoria load]', e);
    _auditoriaCache[obraId] = [];
  }
  return _auditoriaCache[obraId];
}

const _AUDIT_ICONS = {
  edicao: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  atribuicao: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  aditivo_add: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  aditivo_del: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/></svg>',
  medicao_add: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  medicao_del: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/></svg>',
  conclusao: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>',
  revisao: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.2"/></svg>',
  recusa: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  prorrogacao: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
};

const _AUDIT_CORES = {
  edicao: '#3b82f6', atribuicao: '#8b5cf6', aditivo_add: '#ec4899', aditivo_del: '#6b7280',
  medicao_add: '#ec4899', medicao_del: '#6b7280', conclusao: '#22c55e',
  revisao: '#f59e0b', recusa: '#ef4444', prorrogacao: '#f97316',
};


// ── Contar tarefas abertas atribuídas ao usuário no card ─────────────────────
function _contarTarefasAtribuidas(obra) {
  if (obra.concluida || !currentUser) return 0;
  let count = 0;
  const me = currentUser.username;
  ETAPAS_ORDER.forEach(etapaId => {
    const e = obra.etapas?.[etapaId];
    const cfg = ETAPAS_CONFIG[etapaId];
    if (!e?.ativa || e.status === 'done') return;
    if (cfg.isLista) {
      (e.lista || []).forEach(item => {
        if (item.status === 'done') return;
        Object.values(item.subEtapas || {}).forEach(s => {
          if (s.status !== 'done' && s.status !== 'pulada' && _temResp(s, me)) count++;
        });
      });
    } else if (cfg.isIndependente) {
      // COC
      (e.cocLista || []).forEach(coc => {
        if (coc.status !== 'done' && _temResp(coc, me)) count++;
      });
      // Outras sub-etapas de documentações
      Object.values(e.subEtapas || {}).forEach(s => {
        if (!s.isCocLista && s.status !== 'done' && s.status !== 'cancelado' && _temResp(s, me)) count++;
      });
    } else {
      Object.values(e.subEtapas || {}).forEach(s => {
        if (s.status !== 'done' && s.status !== 'pulada' && _temResp(s, me)) count++;
      });
    }
  });
  return count;
}

// ── Dropdown Ações — event delegation ────────────────────────────────────────
let _acaoListenerActive = false;

function _acaoCloseAll(e) {
  if (!e.target.closest('[data-dropdown]') && !e.target.closest('.acao-dropdown-menu')) {
    document.querySelectorAll('.acao-dropdown-menu').forEach(d => d.style.display = 'none');
  }
}

function toggleAcaoDropdown(id) { } // mantido para compatibilidade

function closeAcaoDropdown(id) {
  const el = document.getElementById(id); if (el) el.style.display = 'none';
}

function _initAcaoDelegate() {
  if (_acaoListenerActive) return;
  _acaoListenerActive = true;

  // Toggle ao clicar no botão Ações
  document.addEventListener('click', e => {
    const trigger = e.target.closest('[data-dropdown]');
    if (trigger) {
      e.stopPropagation();
      const id = trigger.dataset.dropdown;
      const menu = document.getElementById(id);
      if (!menu) return;
      const isOpen = menu.style.display === 'block';
      document.querySelectorAll('.acao-dropdown-menu').forEach(d => d.style.display = 'none');
      if (!isOpen) menu.style.display = 'block';
      return;
    }
    // Fechar ao clicar fora
    if (!e.target.closest('.acao-dropdown-menu')) {
      document.querySelectorAll('.acao-dropdown-menu').forEach(d => d.style.display = 'none');
    }
  });

  // Executar ação ao clicar num item
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    e.stopPropagation();
    document.querySelectorAll('.acao-dropdown-menu').forEach(d => d.style.display = 'none');

    const action = btn.dataset.action;
    const obraId = btn.dataset.obra;
    const etapaId = btn.dataset.etapa;
    const subId = btn.dataset.sub;
    const itemId = btn.dataset.item;
    const resp = btn.dataset.resp;

    switch (action) {
      case 'concluir': concluirSubEtapaComData(obraId, etapaId, subId); break;
      case 'aprovado': processarAprovacaoRecusa(obraId, etapaId, subId, 'aprovado'); break;
      case 'recusado': processarAprovacaoRecusa(obraId, etapaId, subId, 'recusado'); break;
      case 'iniciar-sub': iniciarSubEtapa(obraId, etapaId, subId); break;
      case 'cancelar-doc': _openCancelarDocModal(obraId, etapaId, subId); break;
      case 'reativar-doc': _reativarDoc(obraId, etapaId, subId); break;
      case 'reabrir-sub': reabrirSubEtapa(obraId, etapaId, subId, itemId); break;
      case 'retro-concluir': openConcluirRetroModal(obraId, etapaId, subId, itemId); break;
      case 'retro-reabrir': reabrirSubRetro(obraId, etapaId, subId, itemId); break;
      case 'coc-editar': { const _ce = parseInt(btn.dataset.coc); editarRegistro(obraId, etapaId, null, _ce); break; }
      case 'coc-excluir': { const _cx = parseInt(btn.dataset.coc); excluirCocItem(obraId, etapaId, _cx); break; }
      case 'coc-iniciar': {
        const ci = parseInt(btn.dataset.coc);
        _iniciarCocItem(obraId, etapaId, ci);
        break;
      }
      case 'coc-concluir': {
        const ci2 = parseInt(btn.dataset.coc);
        concluirSubEtapaComData(obraId, etapaId, 'coc', null, ci2);
        break;
      }
      case 'coc-prorrogar': {
        const ci3 = parseInt(btn.dataset.coc);
        _prorrogarCocItem(obraId, etapaId, ci3);
        break;
      }
      case 'coc-atribuir': {
        const ci4 = parseInt(btn.dataset.coc);
        _atribuirCocItem(obraId, etapaId, ci4, btn.dataset.resp);
        break;
      }
      case 'coc-obs': {
        const ci5 = parseInt(btn.dataset.coc);
        _obsCocItem(obraId, etapaId, ci5);
        break;
      }
      case 'coc-dataprevista': {
        const ci6 = parseInt(btn.dataset.coc);
        _dataPrevistaCocItem(obraId, etapaId, ci6);
        break;
      }
      case 'concluir-lista': concluirSubEtapaComData(obraId, etapaId, subId, itemId); break;
      case 'revisao': openRevisaoModal(obraId, etapaId, subId, itemId); break;
      case 'prorrogar': openProrrogarModal(obraId, etapaId, subId, itemId); break;
      case 'atribuir': openAtribuirModal(obraId, etapaId, subId, resp ? 'reatribuir' : 'atribuir', itemId); break;
      case 'obs': openObsModal(obraId, etapaId, subId, itemId); break;
      case 'motivo': openMotivoAtrasoModal(obraId, etapaId, subId, itemId); break;
      case 'revisao-etapa': openRevisaoModal(obraId, etapaId); break;
      case 'obs-etapa': openObsModal(obraId, etapaId); break;
      case 'pular-etapa': pularEtapa(obraId, etapaId); break;
      case 'dataprevista': openDataPrevistaModal(obraId, etapaId, subId); break;
      case 'aprovado-lista': processarAprovacaoRecusaLista(obraId, etapaId, itemId, subId, 'aprovado'); break;
      case 'recusado-lista': processarAprovacaoRecusaLista(obraId, etapaId, itemId, subId, 'recusado'); break;
      case 'encerrar-lista': encerrarItemLista(obraId, etapaId, itemId); break;
    }
  });
}


// ── Concluir sub-etapa de dentro de uma lista (aditivo/medicao) ───────────
async function concluirSubEtapaDeLista(obraId, etapaId, itemId, subId) {
  if (!podeEditarComercial()) { showComercialToast('Acesso somente leitura — você não pode alterar obras.', 'error'); return; }
  const cfg = ETAPAS_CONFIG[etapaId];
  const precisaTipo = subId === 'termo_assinatura';
  if (precisaTipo) {
    _tipoConclObraId = obraId; _tipoConclEtapaId = etapaId; _tipoConclSubId = subId;
    _tipoConclItemId = itemId;
    document.getElementById('tipo-conclusao-modal').style.display = 'flex';
    return;
  }
  await _concluirSubDeLista(obraId, etapaId, itemId, subId, null);
}
let _tipoConclItemId = null;
async function _concluirSubDeLista(obraId, etapaId, itemId, subId, tipo, dataCustom) {
  if (!podeEditarComercial()) { showComercialToast('Acesso somente leitura — você não pode alterar obras.', 'error'); return; }
  const obra = _obras.find(o => o.id === obraId); if (!obra) return;
  const hoje = dataCustom || new Date().toISOString().slice(0, 10);
  const etapas = JSON.parse(JSON.stringify(obra.etapas));
  const item = etapas[etapaId].lista.find(i => i.id === itemId); if (!item) return;
  const cfg = ETAPAS_CONFIG[etapaId];
  const sub = item.subEtapas[subId];
  sub.status = 'done'; sub.dataConclusao = hoje; sub.concluidoPor = currentUser.username;
  if (tipo) sub.tipoConclusao = tipo;
  // Ativar próxima sub-etapa
  const subArr = cfg.subEtapasTemplate || [];
  const idx = subArr.findIndex(s => s.id === subId);
  let _proxIdx = idx + 1;
  while (subArr[_proxIdx] && item.subEtapas[subArr[_proxIdx].id]?.bloqueada) _proxIdx++;
  const prox = subArr[_proxIdx];
  if (prox && !item.subEtapas[prox.id]) item.subEtapas[prox.id] = { status: 'pending', dataLimite: null, dataConclusao: null, motivoAtraso: null, revisoes: [], observacoes: [] };
  if (prox) { item.subEtapas[prox.id].status = 'active'; item.subEtapas[prox.id].dataInicio = hoje; }
  // Verificar se todas as sub-etapas do item estão done ou pulada
  const todasSubDone = subArr.every(s => {
    const _sb = item.subEtapas[s.id];
    if (_sb?.bloqueada) return true;
    return _sb?.status === 'done' || _sb?.status === 'pulada';
  });
  if (todasSubDone) { item.status = 'done'; item.dataConclusao = hoje; item.concluidoPor = currentUser.username; }
  // Verificar conclusão da etapa
  const todosItensDone = (etapas[etapaId].lista || []).every(i => i.status === 'done');
  if (todosItensDone) etapas[etapaId].status = 'done';
  const todasEtapasDone = ETAPAS_ORDER.filter(id => etapas[id]?.ativa && etapas[id]?.status !== 'pulada').every(id => etapas[id]?.status === 'done');
  if (todasEtapasDone) {
    await db.collection('obras').doc(obraId).update({ etapas, concluida: true, dataConclusao: hoje });
    showComercialToast('Obra concluída! 🎉', 'success');
  } else {
    const _cfgL = ETAPAS_CONFIG[etapaId];
    const _subNmL = (_cfgL.subEtapasTemplate || []).find(s => s.id === subId)?.nome || subId;
    _audit(obraId, 'conclusao', `${item.titulo} · ${_subNmL} concluída${tipo ? ' (' + tipo + ')' : ''}${dataCustom && dataCustom !== new Date().toISOString().slice(0, 10) ? ' com data ' + dataCustom : ''}`);
    await db.collection('obras').doc(obraId).update({ etapas });
    showComercialToast('Sub-etapa concluída! ✅', 'success');
    if (prox && (prox.dateLivre || prox.isAnalise || !prox.dias) && !item.subEtapas[prox.id]?.dataLimite) {
      setTimeout(() => openProrrogarModal(obraId, etapaId, prox.id, itemId), 300);
    }
  }
}

// ── Concluir sub-etapa ────────────────────────────────────────────────────────
async function concluirSubEtapa(obraId, etapaId, subId) {
  if (!podeEditarComercial()) { showComercialToast('Acesso somente leitura — você não pode alterar obras.', 'error'); return; }
  // Sub-etapas com escolha de tipo (Aditivos/Contrato assinatura)
  const precisaTipo = (etapaId === 'aditivos' && subId === 'termo_assinatura') ||
    (etapaId === 'contrato' && subId === 'assinatura');
  if (precisaTipo) { openTipoConclusaoModal(obraId, etapaId, subId); return; }
  await _concluirComTipo(obraId, etapaId, subId, null);
}

async function _concluirComTipo(obraId, etapaId, subId, tipo, dataCustom) {
  if (!podeEditarComercial()) { showComercialToast('Acesso somente leitura — você não pode alterar obras.', 'error'); return; }
  const obra = _obras.find(o => o.id === obraId); if (!obra) return;
  const hoje = dataCustom || new Date().toISOString().slice(0, 10);
  const etapas = JSON.parse(JSON.stringify(obra.etapas));
  const cfg = ETAPAS_CONFIG[etapaId];
  const subEtapasArr = cfg.subEtapas || [];
  const subCfg = subEtapasArr.find(s => s.id === subId) || (cfg.subEtapasTemplate || []).find(s => s.id === subId);
  etapas[etapaId].subEtapas[subId].status = 'done';
  etapas[etapaId].subEtapas[subId].dataConclusao = hoje;
  etapas[etapaId].subEtapas[subId].concluidoPor = currentUser.username;
  if (tipo) etapas[etapaId].subEtapas[subId].tipoConclusao = tipo;
  const subIdx = subEtapasArr.findIndex(s => s.id === subId);
  const proxSub = subEtapasArr[subIdx + 1];
  // Sub-etapas independentes (Documentações): não ativar a próxima automaticamente
  const isIndSub = subCfg?.isIndependente || cfg.isIndependente;
  if (proxSub && !isIndSub) {
    // Análise do cliente aprovada → avança para assinatura
    if (!etapas[etapaId].subEtapas[proxSub.id]) {
      etapas[etapaId].subEtapas[proxSub.id] = { status: 'pending', dataLimite: null, dataConclusao: null, motivoAtraso: null, revisoes: [], observacoes: [] };
    }
    etapas[etapaId].subEtapas[proxSub.id].status = 'active';
    etapas[etapaId].subEtapas[proxSub.id].dataInicio = hoje;
    etapas[etapaId].subEtapas[proxSub.id].dataLimite = calcDataLimite(proxSub, etapas, obra.dataFechamento);
    await db.collection('obras').doc(obraId).update({ etapas });
    showComercialToast(`"${proxSub.nome}" liberada! ✅`, 'success');
    if ((proxSub.dateLivre || proxSub.isAnalise || !proxSub.dias) && !etapas[etapaId].subEtapas[proxSub.id].dataLimite) {
      setTimeout(() => openProrrogarModal(obraId, etapaId, proxSub.id, null), 300);
    }
  } else if (isIndSub || !proxSub) {
    // Independente ou última sub: verificar se todas as sub-etapas da etapa estão done
    const todasSubDone = subEtapasArr.every(s => etapas[etapaId].subEtapas[s.id]?.status === 'done');
    if (todasSubDone) etapas[etapaId].status = 'done';
    else etapas[etapaId].status = 'active';
    const todasDone = ETAPAS_ORDER.filter(id => etapas[id]?.ativa && etapas[id]?.status !== 'pulada').every(id => etapas[id]?.status === 'done');
    if (todasSubDone && todasDone) {
      await db.collection('obras').doc(obraId).update({ etapas, concluida: true, dataConclusao: hoje });
      showComercialToast('Obra concluída! 🎉', 'success');
    } else {
      _audit(obraId, 'conclusao', `${cfg.nome} · ${subCfg?.nome || subId} concluída${tipo ? ' (' + tipo + ')' : ''}${dataCustom && dataCustom !== new Date().toISOString().slice(0, 10) ? ' com data ' + dataCustom : ''}`);
      await db.collection('obras').doc(obraId).update({ etapas });
      showComercialToast(`"${subCfg?.nome || ''}" concluída! ✅`, 'success');
    }
  } else {
    etapas[etapaId].status = 'done';
    const todasDone = ETAPAS_ORDER.filter(id => etapas[id]?.ativa && etapas[id]?.status !== 'pulada').every(id => etapas[id]?.status === 'done');
    if (todasDone) {
      await db.collection('obras').doc(obraId).update({ etapas, concluida: true, dataConclusao: hoje });
      showComercialToast('Obra concluída! 🎉', 'success');
    } else {
      await db.collection('obras').doc(obraId).update({ etapas });
      showComercialToast(`Etapa "${cfg.nome}" concluída! ✅`, 'success');
    }
  }
}

// ── Iniciar etapa manualmente ─────────────────────────────────────────────────
async function iniciarEtapa(obraId, etapaId) {
  if (!podeEditarComercial()) { showComercialToast('Acesso somente leitura — você não pode alterar obras.', 'error'); return; }
  const obra = _obras.find(o => o.id === obraId); if (!obra) return;
  const etapas = JSON.parse(JSON.stringify(obra.etapas));
  const cfg = ETAPAS_CONFIG[etapaId];
  etapas[etapaId].ativa = true;
  etapas[etapaId].status = 'active';
  // Etapas com lista — adicionar primeiro item
  if (cfg.isLista) {
    etapas[etapaId].ativa = true;
    etapas[etapaId].status = 'active';
    etapas[etapaId].puladaEm = null;
    etapas[etapaId].puladaPor = null;
    if (!etapas[etapaId].lista) etapas[etapaId].lista = [];
    await db.collection('obras').doc(obraId).update({ etapas });
    // Abrir modal para nomear e definir data do primeiro item
    openAddItemModal(obraId, etapaId);
    return;
  }
  // Garantir que todas as sub-etapas existam (obras antigas podem não ter novas sub-etapas)
  if (!etapas[etapaId].subEtapas) etapas[etapaId].subEtapas = {};
  const subEtapasArr = cfg.subEtapas || cfg.subEtapasTemplate || [];
  subEtapasArr.forEach((sub, idx) => {
    if (!etapas[etapaId].subEtapas[sub.id]) {
      etapas[etapaId].subEtapas[sub.id] = { status: 'pending', dataLimite: null, dataConclusao: null, motivoAtraso: null, revisoes: [], observacoes: [] };
    }
  });
  // Sub-etapas independentes: nenhuma é ativada automaticamente — cada uma tem seu Iniciar
  if (cfg.isIndependente) {
    await db.collection('obras').doc(obraId).update({ etapas });
    showComercialToast(`"${cfg.nome}" iniciada! ✅`, 'success');
    return;
  }
  const primSub = (cfg.subEtapas || cfg.subEtapasTemplate || [])[0];
  etapas[etapaId].subEtapas[primSub.id].status = 'active';
  etapas[etapaId].subEtapas[primSub.id].dataInicio = new Date().toISOString().slice(0, 10);
  etapas[etapaId].subEtapas[primSub.id].dataLimite = calcDataLimite(primSub, etapas, obra.dataFechamento);
  await db.collection('obras').doc(obraId).update({ etapas });
  showComercialToast(`"${cfg.nome}" iniciada! ✅`, 'success');
}

// ── Pular etapa ───────────────────────────────────────────────────────────────
async function pularEtapa(obraId, etapaId) {
  if (!podeEditarComercial()) { showComercialToast('Acesso somente leitura — você não pode alterar obras.', 'error'); return; }
  if (!confirm(`Pular a etapa "${ETAPAS_CONFIG[etapaId].nome}"? Ela ficará desabilitada e poderá ser reiniciada depois.`)) return;
  const obra = _obras.find(o => o.id === obraId); if (!obra) return;
  const hoje = new Date().toISOString().slice(0, 10);
  const etapas = JSON.parse(JSON.stringify(obra.etapas));
  etapas[etapaId].status = 'pulada';
  etapas[etapaId].ativa = false;
  etapas[etapaId].puladaEm = hoje;
  etapas[etapaId].puladaPor = currentUser.username;
  // Verificar se todas as etapas ativas (não puladas) estão done
  const todasDone = ETAPAS_ORDER
    .filter(id => etapas[id]?.ativa && etapas[id]?.status !== 'pulada')
    .every(id => etapas[id]?.status === 'done');
  if (todasDone) {
    await db.collection('obras').doc(obraId).update({ etapas, concluida: true, dataConclusao: hoje });
    showComercialToast('Etapa pulada — obra concluída! 🎉', 'success');
  } else {
    await db.collection('obras').doc(obraId).update({ etapas });
    showComercialToast(`Etapa "${ETAPAS_CONFIG[etapaId].nome}" pulada ✅`, 'success');
  }
}

// ── Modal Aprovado/Assinado (Aditivo) ────────────────────────────────────────
let _tipoConclObraId = null, _tipoConclEtapaId = null, _tipoConclSubId = null;

function openTipoConclusaoModal(obraId, etapaId, subId) {
  _tipoConclObraId = obraId; _tipoConclEtapaId = etapaId; _tipoConclSubId = subId;
  document.getElementById('tipo-conclusao-modal').style.display = 'flex';
}

async function salvarTipoConclusao(tipo) {
  if (!podeEditarComercial()) { showComercialToast('Acesso somente leitura — você não pode alterar obras.', 'error'); return; }
  document.getElementById('tipo-conclusao-modal').style.display = 'none';
  if (_tipoConclItemId) {
    await _concluirSubDeLista(_tipoConclObraId, _tipoConclEtapaId, _tipoConclItemId, _tipoConclSubId, tipo);
    _tipoConclItemId = null;
  } else {
    await _concluirComTipo(_tipoConclObraId, _tipoConclEtapaId, _tipoConclSubId, tipo);
  }
  _tipoConclObraId = _tipoConclEtapaId = _tipoConclSubId = null;
}

// ── Prorrogar sub-etapa ───────────────────────────────────────────────────────
let _prorrogarObraId = null, _prorrogarEtapaId = null, _prorrogarSubId = null;

let _prorrogarItemId = null;
function openProrrogarModal(obraId, etapaId, subId, itemId) {
  _prorrogarItemId = itemId || null;
  _prorrogarObraId = obraId; _prorrogarEtapaId = etapaId; _prorrogarSubId = subId;
  const cfg = ETAPAS_CONFIG[etapaId];
  const subCfg = (cfg.subEtapas || cfg.subEtapasTemplate || []).find(s => s.id === subId);
  const obra = _obras.find(o => o.id === obraId);
  // Sub pode estar diretamente em subEtapas ou dentro de um item da lista
  let sub = obra?.etapas?.[etapaId]?.subEtapas?.[subId];
  if (!sub && cfg.isLista) {
    const lista = obra?.etapas?.[etapaId]?.lista || [];
    for (const item of lista) { if (item.subEtapas?.[subId]) { sub = item.subEtapas[subId]; break; } }
  }
  const _modalP = document.getElementById('prorrogar-modal');
  const _freeMode = !!(subCfg && (subCfg.isAnalise || subCfg.dateLivre || subCfg.dias === 0));
  _modalP.dataset.analiseMode = _freeMode ? '1' : '';
  _modalP.dataset.cocMode = '';
  const _jw = document.getElementById('prorrogar-just-wrap'); if (_jw) _jw.style.display = _freeMode ? 'none' : '';
  const _dl = document.getElementById('prorrogar-data-label'); if (_dl) _dl.innerHTML = (_freeMode ? 'Data prevista' : 'Nova data limite') + ' <span style="color:var(--accent);">*</span>';
  const _dataAtual = sub?.dataLimite || sub?.dataPrevista || null;
  const title = document.getElementById('prorrogar-modal-title');
  if (title) title.textContent = `${_freeMode ? (_dataAtual ? 'Editar data' : 'Definir data') : 'Prorrogar'} — ${cfg.nome} · ${subCfg?.nome || ''}`;
  const amanha = new Date(); amanha.setDate(amanha.getDate() + 1);
  const input = document.getElementById('prorrogar-data-input');
  if (input) { input.min = _freeMode ? '' : amanha.toISOString().slice(0, 10); input.value = _dataAtual || ''; }
  const info2 = document.getElementById('prorrogar-modal-info');
  if (info2) {
    if (_freeMode) {
      info2.textContent = `Data prevista atual: ${_dataAtual ? new Date(_dataAtual + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}`;
    } else {
      const limFmt2 = sub?.dataLimite ? new Date(sub.dataLimite + 'T12:00:00').toLocaleDateString('pt-BR') : '—';
      const prorrCount = sub?.diasProrrogados || 0;
      info2.textContent = `Limite atual: ${limFmt2}${prorrCount ? ' (prorrogado ' + prorrCount + 'x)' : ''}`.trim();
    }
  }
  _modalP.style.display = 'flex';
}

function closeProrrogarModal() {
  document.getElementById('prorrogar-modal').style.display = 'none';
  _prorrogarObraId = _prorrogarEtapaId = _prorrogarSubId = null;
}

async function saveProrrogacao() {
  if (!podeEditarComercial()) { showComercialToast('Acesso somente leitura — você não pode alterar obras.', 'error'); return; }
  const novaData = document.getElementById('prorrogar-data-input')?.value;
  if (!novaData) { showComercialToast('Selecione uma data válida.', 'error'); return; }
  // Modo COC: salvar diretamente na cocLista
  if (document.getElementById('prorrogar-modal')?.dataset?.cocMode === '1') {
    const hojeCoc = new Date().toISOString().slice(0, 10);
    if (novaData < hojeCoc) { showComercialToast('A data não pode ser anterior a hoje.', 'error'); return; }
    document.getElementById('prorrogar-modal').dataset.cocMode = '';
    const obra2 = _obras.find(o => o.id === _cocActionObraId); if (!obra2) return;
    const etapas2 = JSON.parse(JSON.stringify(obra2.etapas));
    etapas2[_cocActionEtapaId].cocLista[_cocActionIdx].dataPrevista = novaData;
    await db.collection('obras').doc(_cocActionObraId).update({ etapas: etapas2 });
    closeProrrogarModal(); showComercialToast('Data prevista atualizada! ✅', 'success'); return;
  }
  // Modo data-prevista (subs isAnalise / Documentações): edita dataPrevista, sem justificativa
  if (document.getElementById('prorrogar-modal')?.dataset?.analiseMode === '1') {
    document.getElementById('prorrogar-modal').dataset.analiseMode = '';
    const obraA = _obras.find(o => o.id === _prorrogarObraId); if (!obraA) return;
    const etapasA = JSON.parse(JSON.stringify(obraA.etapas));
    const refA = _findSubRef(etapasA, _prorrogarEtapaId, _prorrogarSubId, _prorrogarItemId);
    if (!refA) { showComercialToast('Sub-etapa não encontrada.', 'error'); return; }
    refA.sub.dataLimite = novaData; refA.sub.dataPrevista = null;
    await db.collection('obras').doc(_prorrogarObraId).update({ etapas: etapasA });
    closeProrrogarModal(); showComercialToast('Data prevista atualizada! ✅', 'success'); return;
  }
  const justProrroga = document.getElementById('prorrogar-justificativa')?.value.trim();
  if (!justProrroga) { showComercialToast('Informe a justificativa da prorrogação.', 'error'); return; }
  const hoje = new Date().toISOString().slice(0, 10);
  if (novaData <= hoje) { showComercialToast('A data deve ser futura.', 'error'); return; }
  const obra = _obras.find(o => o.id === _prorrogarObraId); if (!obra) return;
  const etapas = JSON.parse(JSON.stringify(obra.etapas));
  const ref = _findSubRef(etapas, _prorrogarEtapaId, _prorrogarSubId, _prorrogarItemId);
  if (!ref) { showComercialToast('Sub-etapa não encontrada.', 'error'); return; }
  ref.sub.dataLimite = novaData;
  ref.sub.prorrogadoPor = currentUser.username;
  ref.sub.prorrogadoEm = hoje;
  ref.sub.diasProrrogados = (ref.sub.diasProrrogados || 0) + 1;
  ref.sub.prorrogacaoJustificativa = justProrroga;
  await db.collection('obras').doc(_prorrogarObraId).update({ etapas });
  showComercialToast(`Prazo atualizado para ${new Date(novaData + 'T12:00:00').toLocaleDateString('pt-BR')}! ✅`, 'success');
  closeProrrogarModal();
}



// ── Helper: encontrar sub-etapa em etapa normal ou lista ─────────────────────
function _findSubRef(etapas, etapaId, subId, itemId) {
  // Tenta direto (etapas normais)
  if (etapas[etapaId]?.subEtapas?.[subId]) {
    return { sub: etapas[etapaId].subEtapas[subId], isLista: false };
  }
  // Tenta dentro da lista — prioriza itemId específico
  const lista = etapas[etapaId]?.lista || [];
  for (const item of lista) {
    if (itemId && item.id !== itemId) continue;
    if (item.subEtapas?.[subId]) {
      return { sub: item.subEtapas[subId], isLista: true, item };
    }
  }
  return null;
}

// ── Modal motivo de atraso ────────────────────────────────────────────────────
let _motivoObraId = null, _motivoEtapaId = null, _motivoSubId = null;
function openMotivoAtrasoModal(obraId, etapaId, subId) {
  _motivoObraId = obraId; _motivoEtapaId = etapaId; _motivoSubId = subId;
  const _cfg = ETAPAS_CONFIG[etapaId];
  const subCfg = (_cfg.subEtapas || _cfg.subEtapasTemplate || []).find(s => s.id === subId);
  const title = document.getElementById('motivo-modal-title');
  if (title) title.textContent = `Motivo de Atraso — ${ETAPAS_CONFIG[etapaId].nome} · ${subCfg?.nome || ''}`;
  const mInput = document.getElementById('motivo-input'); if (mInput) mInput.value = '';
  const mModal = document.getElementById('motivo-atraso-modal');
  if (!mModal) { showComercialToast('Modal de motivo não encontrado.', 'error'); return; }
  mModal.style.display = 'flex';
}
function closeMotivoAtrasoModal() {
  document.getElementById('motivo-atraso-modal').style.display = 'none';
  _motivoObraId = _motivoEtapaId = _motivoSubId = null;
}
async function saveMotivoAtraso() {
  if (!podeEditarComercial()) { showComercialToast('Acesso somente leitura — você não pode alterar obras.', 'error'); return; }
  const motivo = document.getElementById('motivo-input')?.value.trim();
  if (!motivo) { showComercialToast('Informe o motivo.', 'error'); return; }
  const obra = _obras.find(o => o.id === _motivoObraId); if (!obra) return;
  const etapas = JSON.parse(JSON.stringify(obra.etapas));
  etapas[_motivoEtapaId].subEtapas[_motivoSubId].motivoAtraso = motivo;
  await db.collection('obras').doc(_motivoObraId).update({ etapas });
  showComercialToast('Motivo registrado! ✅', 'success');
  closeMotivoAtrasoModal();
}

// ── Revisão de etapa ou sub-etapa ────────────────────────────────────────────
let _revisaoObraId = null, _revisaoEtapaId = null, _revisaoSubId = null;

function openRevisaoModal(obraId, etapaId, subId) {
  _revisaoObraId = obraId; _revisaoEtapaId = etapaId; _revisaoSubId = subId || null;
  const obra = _obras.find(o => o.id === obraId);
  let revs = 0, titulo = '';
  if (subId) {
    revs = obra?.etapas?.[etapaId]?.subEtapas?.[subId]?.revisoes?.length || 0;
    const _cfgA = ETAPAS_CONFIG[etapaId];
    const subCfg = (_cfgA.subEtapas || _cfgA.subEtapasTemplate || []).find(s => s.id === subId);
    titulo = `REV.${revs + 1} — ${ETAPAS_CONFIG[etapaId].nome} · ${subCfg?.nome || ''}`;
  } else {
    revs = obra?.etapas?.[etapaId]?.revisoes?.length || 0;
    titulo = `REV.${revs + 1} — ${ETAPAS_CONFIG[etapaId].nome}`;
  }
  const title = document.getElementById('revisao-modal-title');
  if (title) title.textContent = titulo;
  document.getElementById('revisao-motivo-input').value = '';
  document.getElementById('revisao-mini-modal').style.display = 'flex';
}

function closeRevisaoModal() {
  document.getElementById('revisao-mini-modal').style.display = 'none';
  _revisaoObraId = _revisaoEtapaId = _revisaoSubId = null;
}

async function saveRevisao() {
  if (!podeEditarComercial()) { showComercialToast('Acesso somente leitura — você não pode alterar obras.', 'error'); return; }
  const motivo = document.getElementById('revisao-motivo-input')?.value.trim();
  if (!motivo) { showComercialToast('Informe o motivo da revisão.', 'error'); return; }
  const obra = _obras.find(o => o.id === _revisaoObraId); if (!obra) return;
  const etapas = JSON.parse(JSON.stringify(obra.etapas));
  const novaRevisao = { numero: 0, motivo, data: new Date().toISOString().slice(0, 10), por: currentUser.username };

  if (_revisaoSubId) {
    const sub = etapas[_revisaoEtapaId].subEtapas[_revisaoSubId];
    if (!sub.revisoes) sub.revisoes = [];
    novaRevisao.numero = sub.revisoes.length + 1;
    sub.revisoes.push(novaRevisao);
    if (sub.status !== 'done') sub.dataLimite = novaRevisao.data;
  } else {
    // Revisão na etapa — reinicia TODAS as sub-etapas
    if (!etapas[_revisaoEtapaId].revisoes) etapas[_revisaoEtapaId].revisoes = [];
    novaRevisao.numero = etapas[_revisaoEtapaId].revisoes.length + 1;
    etapas[_revisaoEtapaId].revisoes.push(novaRevisao);
    // Reiniciar sub-etapas: primeira ativa, restantes pendentes
    const cfg = ETAPAS_CONFIG[_revisaoEtapaId];
    const hoje = novaRevisao.data;
    if (!cfg.isLista) {
      const subs = cfg.subEtapas || [];
      subs.forEach((s, idx) => {
        if (!etapas[_revisaoEtapaId].subEtapas[s.id]) return;
        etapas[_revisaoEtapaId].subEtapas[s.id].status = idx === 0 ? 'active' : 'pending';
        etapas[_revisaoEtapaId].subEtapas[s.id].dataConclusao = null;
        etapas[_revisaoEtapaId].subEtapas[s.id].motivoAtraso = null;
        if (idx === 0) {
          etapas[_revisaoEtapaId].subEtapas[s.id].dataInicio = hoje;
          etapas[_revisaoEtapaId].subEtapas[s.id].dataLimite = s.dias ? addDiasUteis(hoje, s.dias) : null;
        } else {
          etapas[_revisaoEtapaId].subEtapas[s.id].dataInicio = null;
          etapas[_revisaoEtapaId].subEtapas[s.id].dataLimite = null;
        }
      });
      etapas[_revisaoEtapaId].status = 'active';
    }
  }

  await db.collection('obras').doc(_revisaoObraId).update({ etapas });
  showComercialToast('Revisão registrada! ✅', 'success');
  closeRevisaoModal();
}

// ── Editar obra ───────────────────────────────────────────────────────────────
let _editandoObraId = null;
function openEditarObraModal(obraId) {
  const obra = _obras.find(o => o.id === obraId); if (!obra) return;
  _editandoObraId = obraId;
  document.getElementById('editar-obra-numero').value = obra.numero || '';
  document.getElementById('editar-obra-nome').value = obra.nome || '';
  document.getElementById('editar-obra-rep').value = obra.representante || '';
  document.getElementById('editar-obra-fechamento').value = obra.dataFechamento || '';
  document.getElementById('editar-obra-prazo').value = obra.prazoEstimado || '';
  document.getElementById('editar-obra-modal').style.display = 'flex';
}
function closeEditarObraModal() {
  document.getElementById('editar-obra-modal').style.display = 'none';
  _editandoObraId = null;
}
async function saveEditarObra() {
  if (!podeEditarComercial()) { showComercialToast('Acesso somente leitura — você não pode alterar obras.', 'error'); return; }
  if (!_editandoObraId) return;
  const nome = document.getElementById('editar-obra-nome')?.value.trim();
  if (!nome) { showComercialToast('Informe o nome da obra.', 'error'); return; }
  const updates = {
    numero: document.getElementById('editar-obra-numero')?.value.trim() || '',
    nome,
    representante: document.getElementById('editar-obra-rep')?.value || '',
    dataFechamento: document.getElementById('editar-obra-fechamento')?.value || null,
    prazoEstimado: document.getElementById('editar-obra-prazo')?.value || null,
  };
  await db.collection('obras').doc(_editandoObraId).update(updates);
  _audit(_editandoObraId, 'edicao', 'Dados da obra editados por ' + currentUser.username);
  closeEditarObraModal();
  showComercialToast('Obra atualizada! ✅', 'success');
}

// ── Excluir / Reabrir ─────────────────────────────────────────────────────────
async function excluirObra(obraId) {
  if (!podeEditarComercial()) { showComercialToast('Acesso somente leitura — você não pode alterar obras.', 'error'); return; }
  const obra = _obras.find(o => o.id === obraId);
  if (!confirm(`Excluir "${obra?.nome}"? Não pode ser desfeita.`)) return;
  await db.collection('obras').doc(obraId).delete();
  showComercialToast('Obra excluída.', 'success');
  closeObraModal();
}

async function reabrirObra(obraId) {
  if (!podeEditarComercial()) { showComercialToast('Acesso somente leitura — você não pode alterar obras.', 'error'); return; }
  if (!confirm('Reabrir esta obra? Etapas subsequentes voltam para pendente.')) return;
  const obra = _obras.find(o => o.id === obraId); if (!obra) return;
  const etapas = JSON.parse(JSON.stringify(obra.etapas));
  let reativarId = 'proposta';
  ETAPAS_ORDER.forEach(id => { if (etapas[id]?.ativa && etapas[id]?.status === 'done') reativarId = id; });
  let found = false;
  ETAPAS_ORDER.forEach(id => {
    const cfg = ETAPAS_CONFIG[id];
    if (id === reativarId) {
      found = true; etapas[id].status = 'active';
      if (cfg.isLista) {
        // Reabrir último item da lista
        const lista = etapas[id].lista || [];
        if (lista.length > 0) lista[lista.length - 1].status = 'active';
      } else {
        const subs = cfg.subEtapas || [];
        let lastDone = null;
        subs.forEach(s => { if (etapas[id].subEtapas?.[s.id]?.status === 'done') lastDone = s.id; });
        if (lastDone && etapas[id].subEtapas[lastDone]) {
          etapas[id].subEtapas[lastDone].status = 'active';
          etapas[id].subEtapas[lastDone].dataConclusao = null;
        }
      }
    } else if (found) {
      etapas[id].status = 'pending';
      if (cfg.isLista) {
        (etapas[id].lista || []).forEach(item => { item.status = 'pending'; });
      } else {
        (cfg.subEtapas || []).forEach(s => {
          if (etapas[id].subEtapas?.[s.id])
            etapas[id].subEtapas[s.id] = { status: 'pending', dataLimite: null, dataConclusao: null, motivoAtraso: null };
        });
      }
    }
  });
  await db.collection('obras').doc(obraId).update({ etapas, concluida: false, dataConclusao: null });
  showComercialToast('Obra reaberta! ✅', 'success');
}

// ── Onda 2: Editar registro (COC / Aditivo / Medição) ───────────────────
function editarRegistro(obraId, etapaId, itemId, cocIdx) {
  if (!podeEditarComercial()) { showComercialToast('Acesso somente leitura — você não pode alterar obras.', 'error'); return; }
  const obra = _obras.find(o => o.id === obraId); if (!obra) return;
  const isCoc = (cocIdx !== null && cocIdx !== undefined && cocIdx !== '');
  let nome = '', data = '';
  if (isCoc) {
    const it = obra.etapas?.[etapaId]?.cocLista?.[cocIdx]; if (!it) return;
    nome = it.nome || ''; data = it.dataPrevista || '';
  } else {
    const it = (obra.etapas?.[etapaId]?.lista || []).find(i => i.id === itemId); if (!it) return;
    nome = it.titulo || ''; data = it.dataPrevista || '';
  }
  document.getElementById('editar-registro-obra').value = obraId;
  document.getElementById('editar-registro-etapa').value = etapaId;
  document.getElementById('editar-registro-item').value = itemId || '';
  document.getElementById('editar-registro-coc').value = (isCoc ? cocIdx : '');
  document.getElementById('editar-registro-label').innerHTML = (isCoc ? 'Nome / Identificação' : 'Título') + ' <span style="color:var(--accent);">*</span>';
  document.getElementById('editar-registro-title').textContent = 'Editar ' + (isCoc ? 'COC' : (ETAPAS_CONFIG[etapaId]?.nome || 'registro'));
  document.getElementById('editar-registro-nome').value = nome;
  document.getElementById('editar-registro-data').value = data;
  document.getElementById('editar-registro-modal').style.display = 'flex';
}
function closeEditarRegistroModal() { document.getElementById('editar-registro-modal').style.display = 'none'; }
async function salvarEditarRegistro() {
  if (!podeEditarComercial()) { showComercialToast('Acesso somente leitura — você não pode alterar obras.', 'error'); return; }
  const obraId = document.getElementById('editar-registro-obra').value;
  const etapaId = document.getElementById('editar-registro-etapa').value;
  const itemId = document.getElementById('editar-registro-item').value;
  const cocRaw = document.getElementById('editar-registro-coc').value;
  const nome = document.getElementById('editar-registro-nome').value.trim();
  const data = document.getElementById('editar-registro-data').value || null;
  if (!nome) { showComercialToast('Informe o título/nome.', 'error'); return; }
  const obra = _obras.find(o => o.id === obraId); if (!obra) return;
  const etapas = JSON.parse(JSON.stringify(obra.etapas));
  if (cocRaw !== '') {
    const it = etapas[etapaId]?.cocLista?.[parseInt(cocRaw)]; if (!it) return;
    it.nome = nome; it.dataPrevista = data;
    _audit(obraId, 'coc_edit', `COC editado: "${nome}"`);
  } else {
    const it = (etapas[etapaId]?.lista || []).find(i => i.id === itemId); if (!it) return;
    it.titulo = nome; it.dataPrevista = data;
    _audit(obraId, 'item_edit', `Registro editado: "${nome}"`);
  }
  await db.collection('obras').doc(obraId).update({ etapas });
  showComercialToast('Registro atualizado. ✅', 'success');
  closeEditarRegistroModal();
}

// ── Onda 2: Excluir COC ──────────────────────────────────
async function excluirCocItem(obraId, etapaId, cocIdx) {
  if (!podeEditarComercial()) { showComercialToast('Acesso somente leitura — você não pode alterar obras.', 'error'); return; }
  const obra = _obras.find(o => o.id === obraId); if (!obra) return;
  const it = obra.etapas?.[etapaId]?.cocLista?.[cocIdx]; if (!it) return;
  if (!confirm(`Excluir o COC "${it.nome || ''}"? Não pode ser desfeito.`)) return;
  const etapas = JSON.parse(JSON.stringify(obra.etapas));
  etapas[etapaId].cocLista.splice(cocIdx, 1);
  _audit(obraId, 'coc_del', `COC excluído: "${it.nome || ''}"`);
  await db.collection('obras').doc(obraId).update({ etapas });
  showComercialToast('COC excluído. ✅', 'success');
}

// ── Onda 2: Reabrir sub-etapa (volta p/ ativa; posteriores -> pendente) ─────
async function reabrirSubEtapa(obraId, etapaId, subId, itemId) {
  if (!podeEditarComercial()) { showComercialToast('Acesso somente leitura — você não pode alterar obras.', 'error'); return; }
  if (!confirm('Reabrir esta sub-etapa? As sub-etapas posteriores voltam para pendente.')) return;
  const obra = _obras.find(o => o.id === obraId); if (!obra) return;
  const cfg = ETAPAS_CONFIG[etapaId]; if (!cfg) return;
  const etapas = JSON.parse(JSON.stringify(obra.etapas));
  const tpl = cfg.subEtapasTemplate || cfg.subEtapas || [];
  let subsObj, item = null;
  if (itemId) {
    item = (etapas[etapaId]?.lista || []).find(i => i.id === itemId); if (!item) return;
    item.subEtapas = item.subEtapas || {}; subsObj = item.subEtapas;
  } else {
    etapas[etapaId].subEtapas = etapas[etapaId].subEtapas || {}; subsObj = etapas[etapaId].subEtapas;
  }
  const idx = tpl.findIndex(s => s.id === subId);
  if (idx < 0 || !subsObj[subId]) return;
  subsObj[subId].status = 'active';
  subsObj[subId].dataConclusao = null;
  subsObj[subId].concluidoPor = null;
  for (let i = idx + 1; i < tpl.length; i++) {
    const sid = tpl[i].id;
    if (!subsObj[sid] || subsObj[sid].bloqueada) continue;
    subsObj[sid].status = 'pending';
    subsObj[sid].dataLimite = null;
    subsObj[sid].dataConclusao = null;
    subsObj[sid].concluidoPor = null;
    if ('motivoAtraso' in subsObj[sid]) subsObj[sid].motivoAtraso = null;
  }
  if (item) { item.status = 'active'; item.dataConclusao = null; }
  if (etapas[etapaId]) etapas[etapaId].status = 'active';
  _audit(obraId, 'reabrir_sub', `Sub-etapa reaberta: "${(tpl[idx] && tpl[idx].nome) || subId}"`);
  await db.collection('obras').doc(obraId).update({ etapas, concluida: false, dataConclusao: null });
  showComercialToast('Sub-etapa reaberta. ✅', 'success');
}

// ── Onda 2.1: Sub-etapas retroativas (concluir c/ data livre + obs / reabrir) ──
let _retroRef = {};
function openConcluirRetroModal(obraId, etapaId, subId, itemId) {
  if (!podeEditarComercial()) { showComercialToast('Acesso somente leitura — você não pode alterar obras.', 'error'); return; }
  _retroRef = { obraId, etapaId, subId, itemId: itemId || null };
  const cfg = ETAPAS_CONFIG[etapaId];
  const tpl = (cfg && (cfg.subEtapasTemplate || cfg.subEtapas)) || [];
  const nome = (tpl.find(s => s.id === subId) || {}).nome || subId;
  document.getElementById('retro-concluir-title').textContent = 'Concluir: ' + nome;
  document.getElementById('retro-concluir-data').value = new Date().toISOString().slice(0, 10);
  document.getElementById('retro-concluir-obs').value = '';
  document.getElementById('retro-concluir-modal').style.display = 'flex';
}
function closeConcluirRetroModal() { document.getElementById('retro-concluir-modal').style.display = 'none'; }
async function salvarConclusaoRetro() {
  if (!podeEditarComercial()) { showComercialToast('Acesso somente leitura — você não pode alterar obras.', 'error'); return; }
  const data = document.getElementById('retro-concluir-data').value;
  if (!data) { showComercialToast('Informe a data de conclusão.', 'error'); return; }
  const obsTxt = document.getElementById('retro-concluir-obs').value.trim();
  const { obraId, etapaId, subId, itemId } = _retroRef;
  const obra = _obras.find(o => o.id === obraId); if (!obra) return;
  const etapas = JSON.parse(JSON.stringify(obra.etapas));
  let subsObj;
  if (itemId) { const it = (etapas[etapaId]?.lista || []).find(i => i.id === itemId); if (!it) return; it.subEtapas = it.subEtapas || {}; subsObj = it.subEtapas; }
  else { etapas[etapaId].subEtapas = etapas[etapaId].subEtapas || {}; subsObj = etapas[etapaId].subEtapas; }
  const sub = subsObj[subId]; if (!sub) return;
  sub.status = 'done';
  sub.dataConclusao = data;
  sub.concluidoPor = currentUser.username;
  if (obsTxt) {
    if (!sub.observacoes) sub.observacoes = [];
    sub.observacoes.push({ texto: obsTxt, data: new Date().toISOString().slice(0, 10), hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), por: currentUser.username });
  }
  _audit(obraId, 'retro_concluir', `Sub-etapa retroativa concluída: "${subId}" (${data})`);
  await db.collection('obras').doc(obraId).update({ etapas });
  showComercialToast('Sub-etapa concluída. ✅', 'success');
  closeConcluirRetroModal();
}
async function reabrirSubRetro(obraId, etapaId, subId, itemId) {
  if (!podeEditarComercial()) { showComercialToast('Acesso somente leitura — você não pode alterar obras.', 'error'); return; }
  const obra = _obras.find(o => o.id === obraId); if (!obra) return;
  const etapas = JSON.parse(JSON.stringify(obra.etapas));
  let subsObj;
  if (itemId) { const it = (etapas[etapaId]?.lista || []).find(i => i.id === itemId); if (!it) return; it.subEtapas = it.subEtapas || {}; subsObj = it.subEtapas; }
  else { etapas[etapaId].subEtapas = etapas[etapaId].subEtapas || {}; subsObj = etapas[etapaId].subEtapas; }
  const sub = subsObj[subId]; if (!sub) return;
  sub.status = 'pending';
  sub.dataConclusao = null;
  sub.concluidoPor = null;
  _audit(obraId, 'retro_reabrir', `Sub-etapa retroativa reaberta: "${subId}"`);
  await db.collection('obras').doc(obraId).update({ etapas });
  showComercialToast('Sub-etapa reaberta. ✅', 'success');
}

// ── PDF individual da obra ────────────────────────────────────────────────────
function exportarObraPDF(obraId) {
  const obra = _obras.find(o => o.id === obraId);
  if (!obra) return;
  const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const NOMES = { proposta: 'Proposta Consolidada', contrato: 'Contrato', documentacoes: 'Documentações', aditivos: 'Aditivos/Termo', medicao: 'Medição' };
  const hoje2 = new Date().toISOString().slice(0, 10);
  const etapasHtml = ETAPAS_ORDER.map(etapaId => {
    const cfg = ETAPAS_CONFIG[etapaId];
    const e = obra.etapas?.[etapaId];
    if (!e?.ativa && e?.status !== 'pulada') return '';
    // Status da etapa: verificar atraso nas sub-etapas
    const temAtrasoEtapa = Object.values(e.subEtapas || {}).some(s => !s.isCocLista && _vencido(s.dataLimite || s.dataPrevista, s.status, hoje2))
      || (e.cocLista || []).some(ci => _vencido(ci.dataPrevista, ci.status, hoje2))
      || (cfg.isLista && (e.lista || []).some(item => _vencido(item.dataPrevista, item.status, hoje2) || Object.values(item.subEtapas || {}).some(s => _vencido(_refAtraso(s, item), s.status, hoje2))));
    const _etapaDone = cfg.isLista
      ? ((e.lista || []).length > 0 && (e.lista || []).every(i => i.status === 'done'))
      : e.status === 'done';
    const statusEtapa = _etapaDone ? '✓ Concluída'
      : e.status === 'pulada' ? '⏭ Pulada'
        : temAtrasoEtapa ? '⚠ Em atraso'
          : e.status === 'active' ? '► Em andamento'
            : '○ Não iniciada';
    const corStatus = _etapaDone ? '#22c55e'
      : e.status === 'pulada' ? '#6b7280'
        : temAtrasoEtapa ? '#ef4444'
          : e.status === 'active' ? cfg.cor
            : '#9ca3af';
    // Lista (aditivos/medicao)
    if (cfg.isLista) {
      const lista = e.lista || [];
      const listaHtml = lista.map(item => {
        const itemDone = item.status === 'done';
        const dtPrev = item.dataPrevista ? `Previsto: ${new Date(item.dataPrevista + 'T12:00:00').toLocaleDateString('pt-BR')}` : '';
        const dtConc = item.dataConclusao ? `✓ ${new Date(item.dataConclusao + 'T12:00:00').toLocaleDateString('pt-BR')}` : '';
        const subsItem = (cfg.subEtapasTemplate || []).map(sub => {
          const s = item.subEtapas?.[sub.id]; if (!s) return '';
          const refData2 = s.dataLimite || (s.status === 'active' ? item.dataPrevista : null);
          const atrasada2 = s.status !== 'done' && refData2 && refData2 < hoje2;
          let st2, corSt2;
          if (s.status === 'done') { st2 = '✓ Concluída'; corSt2 = '#22c55e'; }
          else if (s.status === 'pulada') { st2 = '⏭ Pulada'; corSt2 = '#6b7280'; }
          else if (atrasada2) { st2 = '⚠ Atrasada'; corSt2 = '#ef4444'; }
          else if (s.status === 'active') { st2 = '► Em andamento'; corSt2 = cfg.cor; }
          else { st2 = '○ Pendente'; corSt2 = '#9ca3af'; }
          const tipo2 = s.tipoConclusao ? ` (${s.tipoConclusao})` : '';
          const dtInicio2 = s.dataInicio ? new Date(s.dataInicio + 'T12:00:00').toLocaleDateString('pt-BR') : '—';
          const dtConcl2 = s.dataConclusao ? new Date(s.dataConclusao + 'T12:00:00').toLocaleDateString('pt-BR') : '—';
          const dtPrev2 = refData2 ? new Date(refData2 + 'T12:00:00').toLocaleDateString('pt-BR') : '—';
          const dias2 = (() => {
            if (atrasada2) {
              return `${Math.ceil((new Date() - new Date(refData2 + 'T12:00:00')) / (1000 * 60 * 60 * 24))} dias`;
            }
            if (s.status === 'done' && s.dataConclusao && s.dataLimite && s.dataConclusao > s.dataLimite) {
              const dc = new Date(s.dataConclusao + 'T12:00:00'), dl = new Date(s.dataLimite + 'T12:00:00');
              return `${Math.ceil((dc - dl) / (1000 * 60 * 60 * 24))} dias`;
            }
            return '—';
          })();
          return `<tr><td style="padding:4px 8px 4px 32px;color:${corSt2};font-weight:600;">${st2}</td><td style="padding:4px 8px;">${sub.nome}${tipo2}</td><td style="padding:4px 8px;font-size:10px;color:#6b7280;">${_getResponsaveis(s).join(', ') || '—'}</td><td style="padding:4px 8px;font-family:monospace;font-size:10px;">${dtInicio2}</td><td style="padding:4px 8px;font-family:monospace;font-size:10px;">${dtConcl2}</td><td style="padding:4px 8px;font-family:monospace;font-size:10px;">${dtPrev2}</td><td style="padding:4px 8px;font-family:monospace;font-size:10px;color:${atrasada2 ? '#ef4444' : '#6b7280'}">${dias2}</td></tr>`;
        }).join('');
        return `<tr style="background:#f0f9ff;"><td colspan="7" style="padding:5px 8px 5px 20px;font-weight:700;color:${cfg.cor};">${item.titulo}${dtPrev ? ` — ${dtPrev}` : ''}${dtConc ? ` — ${dtConc}` : ''}</td></tr>${subsItem}`;
      }).join('');
      return `<tr style="background:#f9fafb;"><td colspan="7" style="padding:6px 8px;font-weight:700;color:${corStatus};border-left:3px solid ${corStatus};">${cfg.nome} — ${statusEtapa}${(() => { const _rv = _revCountEtapa(e, cfg); return _rv ? ` <span style="background:#f59e0b;color:#fff;font-size:9px;font-weight:700;padding:1px 5px;border-radius:4px;font-family:monospace;margin-left:6px;">REV.${_rv}</span>` : ''; })()}</td></tr>${listaHtml}`;
    }
    const subsHtml = cfg.subEtapas.map(sub => {
      // COC: renderizar cada item da cocLista
      if (sub.isCocLista) {
        const cocLst = e.cocLista || [];
        if (!cocLst.length) {
          return `<tr><td style="padding:4px 8px 4px 20px;color:#9ca3af;font-weight:600;">○ Pendente</td><td style="padding:4px 8px;">COC</td><td style="padding:4px 8px;font-size:10px;color:#6b7280;">—</td><td style="padding:4px 8px;font-family:monospace;font-size:10px;">—</td><td style="padding:4px 8px;font-family:monospace;font-size:10px;">—</td><td style="padding:4px 8px;font-family:monospace;font-size:10px;">—</td><td style="padding:4px 8px;font-family:monospace;font-size:10px;">—</td></tr>`;
        }
        return cocLst.map((cItem, ci) => {
          const isDone = cItem.status === 'done';
          const stCoc = isDone ? '✓ Concluída' : '► Em andamento';
          const corCoc = isDone ? '#22c55e' : '#f97316';
          const dtCocInicio = cItem.dataInicio ? new Date(cItem.dataInicio + 'T12:00:00').toLocaleDateString('pt-BR') : '—';
          const dtCoc = cItem.dataConclusao ? new Date(cItem.dataConclusao + 'T12:00:00').toLocaleDateString('pt-BR') : '—';
          const dtCocPrev = cItem.dataPrevista ? new Date(cItem.dataPrevista + 'T12:00:00').toLocaleDateString('pt-BR') : '—';
          const dtCocAtraso = (cItem.status === 'done' && cItem.dataConclusao && cItem.dataPrevista && cItem.dataConclusao > cItem.dataPrevista) ? `${Math.ceil((new Date(cItem.dataConclusao + 'T12:00:00') - new Date(cItem.dataPrevista + 'T12:00:00')) / (1000 * 60 * 60 * 24))} dias` : '—';
          const bg = ci % 2 === 0 ? '#fff9f0' : '#fff';
          return `<tr style="background:${bg};"><td style="padding:4px 8px 4px 20px;color:${corCoc};font-weight:600;">${stCoc}</td><td style="padding:4px 8px;">${cItem.nome || 'COC ' + (ci + 1)}</td><td style="padding:4px 8px;font-size:10px;color:#6b7280;">${_getResponsaveis(cItem).join(', ') || '—'}</td><td style="padding:4px 8px;font-family:monospace;font-size:10px;">${dtCocInicio}</td><td style="padding:4px 8px;font-family:monospace;font-size:10px;">${dtCoc}</td><td style="padding:4px 8px;font-family:monospace;font-size:10px;">${dtCocPrev}</td><td style="padding:4px 8px;font-family:monospace;font-size:10px;">${dtCocAtraso}</td></tr>`;
        }).join('');
      }
      const s = e.subEtapas?.[sub.id]; if (!s) return '';
      const refData = s.dataLimite || s.dataPrevista;
      const atrasada = s.status !== 'done' && refData && refData < hoje2;
      let st, corSt;
      if (s.status === 'done') { st = '✓ Concluída'; corSt = '#22c55e'; }
      else if (atrasada) { st = '⚠ Atrasada'; corSt = '#ef4444'; }
      else if (s.status === 'active') { st = '► Em andamento'; corSt = cfg.cor; }
      else { st = '○ Pendente'; corSt = '#9ca3af'; }
      const tipo = s.tipoConclusao ? ` (${s.tipoConclusao})` : '';
      const por = s.concluidoPor ? ` — por ${s.concluidoPor}` : '';
      const dtInicio = s.dataInicio ? new Date(s.dataInicio + 'T12:00:00').toLocaleDateString('pt-BR') : '—';
      const dtConcl = s.dataConclusao
        ? `${new Date(s.dataConclusao + 'T12:00:00').toLocaleDateString('pt-BR')}${por}`
        : '—';
      const dtPrev = refData ? new Date(refData + 'T12:00:00').toLocaleDateString('pt-BR') : '—';
      const diasAt = (() => {
        if (atrasada) {
          const d = new Date(refData + 'T12:00:00'), ag = new Date(); ag.setHours(0, 0, 0, 0);
          return Math.ceil((ag - d) / (1000 * 60 * 60 * 24)) + ' dias';
        }
        if (s.status === 'done' && s.dataConclusao && refData && s.dataConclusao > refData) {
          const dc = new Date(s.dataConclusao + 'T12:00:00'), dl = new Date(refData + 'T12:00:00');
          return Math.ceil((dc - dl) / (1000 * 60 * 60 * 24)) + ' dias';
        }
        return '—';
      })();
      return `<tr>
        <td style="padding:4px 8px 4px 20px;color:${corSt};font-weight:600;white-space:nowrap;">${st}</td>
        <td style="padding:4px 8px;">${sub.nome}${tipo}</td>
        <td style="padding:4px 8px;font-size:10px;color:#6b7280;">${_getResponsaveis(s).join(', ') || '—'}</td>
        <td style="padding:4px 8px;font-family:monospace;font-size:10px;color:#6b7280;">${dtInicio}</td>
        <td style="padding:4px 8px;font-family:monospace;font-size:10px;color:#6b7280;">${dtConcl}</td>
        <td style="padding:4px 8px;font-family:monospace;font-size:10px;color:#6b7280;">${dtPrev}</td>
        <td style="padding:4px 8px;font-family:monospace;font-size:10px;color:${atrasada ? '#ef4444' : '#6b7280'};font-weight:${atrasada ? '700' : '400'};">${diasAt}</td>
      </tr>`;
    }).join('');
    return `<tr style="background:#f9fafb;"><td colspan="7" style="padding:6px 8px;font-weight:700;color:${corStatus};border-left:3px solid ${corStatus};">${cfg.nome} — ${statusEtapa}${(() => { const _rv = _revCountEtapa(e, cfg); return _rv ? ` <span style="background:#f59e0b;color:#fff;font-size:9px;font-weight:700;padding:1px 5px;border-radius:4px;font-family:monospace;margin-left:6px;">REV.${_rv}</span>` : ''; })()}</td></tr>${subsHtml}`;
  }).join('');
  // Observações e Recusas agrupadas por etapa (cor da etapa correspondente)
  const _grupos = [];
  ETAPAS_ORDER.forEach(_id => {
    const _e = obra.etapas?.[_id]; if (!_e) return;
    const _cfg = ETAPAS_CONFIG[_id]; const _nome = _cfg?.nome || _id; const _cor = _cfg?.cor || '#6b7280';
    const _g = { nome: _nome, cor: _cor, obs: [], rec: [] };
    const _ao = (arr, sub) => (arr || []).forEach(o => _g.obs.push({ sub, texto: o.texto, data: o.data, hora: o.hora, por: o.por }));
    const _ar = (arr, sub) => (arr || []).forEach(r => _g.rec.push({ sub, numero: r.numero, motivo: r.motivo, data: r.data, por: r.por }));
    _ao(_e.observacoes, ''); _ar(_e.revisoes, '');
    if (_cfg?.isLista) {
      (_e.lista || []).forEach((it, ii) => {
        const _lbl = it.titulo || 'Item ' + (ii + 1);
        _ao(it.observacoes, _lbl); _ar(it.revisoes, _lbl);
        Object.values(it.subEtapas || {}).forEach(s => { _ao(s.observacoes, _lbl); _ar(s.revisoes, _lbl); });
      });
    } else {
      Object.values(_e.subEtapas || {}).forEach(s => { _ao(s.observacoes, ''); _ar(s.revisoes, ''); });
    }
    (_e.cocLista || []).forEach((ci, ci2) => { const _cl = ci.nome || 'COC ' + (ci2 + 1); _ao(ci.observacoes, _cl); _ar(ci.revisoes, _cl); });
    if (_g.obs.length || _g.rec.length) _grupos.push(_g);
  });
  const _fmtD = d => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '—';
  const _gruposRec = _grupos.filter(g => g.rec.length);
  const _gruposObs = _grupos.filter(g => g.obs.length);
  const _cab = (g) => `<div style="font-size:11px;font-weight:800;color:${g.cor};border-left:4px solid ${g.cor};padding:3px 8px;margin:0 0 5px;background:${g.cor}14;">${g.nome}</div>`;
  const _sub = (s) => s ? `<span style="color:#6b7280;font-weight:600;">${s} · </span>` : '';
  const obsRecHtml = (_gruposRec.length || _gruposObs.length) ? `
    <div style="margin-top:22px;page-break-inside:avoid;">
      <h2 style="font-size:13px;color:#111827;border-bottom:1px solid #e5e7eb;padding-bottom:5px;margin:0 0 12px;">Observações e Recusas</h2>
      ${_gruposRec.length ? `<div style="font-size:11px;font-weight:700;color:#b45309;margin:0 0 6px;">Recusas (REV)</div>` + _gruposRec.map(g => `
        <div style="margin:0 0 10px;page-break-inside:avoid;">
          ${_cab(g)}
          ${g.rec.map(r => `<div style="font-size:10px;margin:0 0 4px 8px;padding:4px 9px;border-left:3px solid ${g.cor}66;background:#fffbeb;">
            <span style="font-family:monospace;font-weight:700;color:#b45309;">REV.${r.numero}</span>
            ${r.sub ? ` <span style="color:#6b7280;font-weight:600;">· ${r.sub}</span>` : ''}
            <span style="color:#9ca3af;font-family:monospace;"> · ${_fmtD(r.data)} · ${r.por || '—'}</span>
            <div style="margin-top:2px;color:#dc2626;font-weight:600;">${r.motivo || ''}</div>
          </div>`).join('')}
        </div>`).join('') : ''}
      ${_gruposObs.length ? `<div style="font-size:11px;font-weight:700;color:#374151;margin:14px 0 6px;">Observações</div>` + _gruposObs.map(g => `
        <div style="margin:0 0 10px;page-break-inside:avoid;">
          ${_cab(g)}
          ${g.obs.map(o => `<div style="font-size:10px;margin:0 0 4px 8px;padding:4px 9px;border-left:3px solid ${g.cor}66;background:#f9fafb;">
            ${_sub(o.sub)}<span style="color:#9ca3af;font-family:monospace;">${_fmtD(o.data)}${o.hora ? ' ' + o.hora : ''} · ${o.por || '—'}</span>
            <div style="margin-top:2px;color:#1f2937;">${o.texto || ''}</div>
          </div>`).join('')}
        </div>`).join('') : ''}
    </div>` : ''; const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Obra #${obra.numero} — ${obra.nome}</title>
    <style>body{font-family:Arial,sans-serif;font-size:11px;color:#1f2937;margin:0;padding:24px;}
    .header{border-bottom:2px solid #ef4444;padding-bottom:12px;margin-bottom:20px;}
    h1{font-size:15px;margin:0 0 4px;color:#111827;}
    .meta{font-size:10px;color:#6b7280;display:flex;gap:16px;flex-wrap:wrap;}
    table{width:100%;border-collapse:collapse;margin-top:12px;}
    th{background:#f3f4f6;padding:6px 8px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #e5e7eb;}
    td{border-bottom:1px solid #f3f4f6;}
    .footer{margin-top:16px;font-size:9px;color:#9ca3af;text-align:center;}</style></head>
    <body>
    <div class="header"><h1>Obra #${obra.numero} — ${obra.nome}</h1>
    <div class="meta"><span>👤 ${obra.representante || '—'}</span><span>📅 Fechamento: ${obra.dataFechamento ? new Date(obra.dataFechamento + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</span>${obra.prazoEstimado ? `<span>⏱ Prazo estimado: ${new Date(obra.prazoEstimado + 'T12:00:00').toLocaleDateString('pt-BR')}</span>` : ''}</div></div>
    <table><thead><tr><th>Status</th><th>Etapa / Sub-etapa</th><th>Responsável</th><th>Data de Início</th><th>Data Conclusão</th><th>Data Prevista</th><th>Dias em Atraso</th></tr></thead><tbody>${etapasHtml}</tbody></table>
    ${obsRecHtml}
    <div class="footer">Premovale T.I — Gerado em ${hoje}</div>
    <script>window.onload=()=>{window.print();}<\/script></body></html>`;
  const w = window.open('', '_blank'); w.document.write(html); w.document.close();
}

// ── Relatório ─────────────────────────────────────────────────────────────────
function openRelatorioModal() {
  // Popular selects de responsável
  const resps = new Set();
  _obras.forEach(obra => {
    ETAPAS_ORDER.forEach(etapaId => {
      const e = obra.etapas?.[etapaId]; if (!e?.ativa) return;
      const cfg = ETAPAS_CONFIG[etapaId];
      if (cfg.isLista) (e.lista || []).forEach(item => Object.values(item.subEtapas || {}).forEach(s => _getResponsaveis(s).forEach(r => resps.add(r))));
      else Object.values(e.subEtapas || {}).forEach(s => _getResponsaveis(s).forEach(r => resps.add(r)));
    });
  });
  const opts = '<option value="">Todos</option>' + [...resps].sort().map(r => `<option value="${r}">${r}</option>`).join('');
  const sel = document.getElementById('rel-responsavel'); if (sel) sel.innerHTML = opts;
  const sel2 = document.getElementById('rel-responsavel-pend'); if (sel2) sel2.innerHTML = opts.replace('Todos', 'Todos os responsáveis');
  document.getElementById('relatorio-modal').style.display = 'flex';
  _switchRelTab('geral');
}

function _switchRelTab(tab) {
  const t1 = document.getElementById('rel-tab-geral');
  const t2 = document.getElementById('rel-tab-pend');
  const b1 = document.getElementById('rel-body-geral');
  const b2 = document.getElementById('rel-body-pend');
  if (!t1 || !b1) return;
  if (tab === 'geral') {
    t1.style.borderBottom = '2px solid var(--accent)'; t1.style.color = 'var(--accent)';
    t2.style.borderBottom = '2px solid transparent'; t2.style.color = 'var(--muted)';
    b1.style.display = 'flex'; b2.style.display = 'none';
  } else {
    t2.style.borderBottom = '2px solid var(--accent)'; t2.style.color = 'var(--accent)';
    t1.style.borderBottom = '2px solid transparent'; t1.style.color = 'var(--muted)';
    b1.style.display = 'none'; b2.style.display = 'flex';
  }
}
function closeRelatorioModal() { document.getElementById('relatorio-modal').style.display = 'none'; }

function _gerarDadosRelatorio() {
  const incluirTodas = document.getElementById('rel-todas')?.checked;
  const filtroRep = document.getElementById('rel-representante')?.value || '';
  const hoje = new Date().toISOString().slice(0, 10);
  const linhas = [];
  const NOMES_ETAPA = { proposta: 'Proposta Consolidada', contrato: 'Contrato', documentacoes: 'Documentações', aditivos: 'Aditivos/Termo', medicao: 'Medição' };

  _obras.filter(o => !o.concluida && (!filtroRep || o.representante === filtroRep)).forEach(obra => {
    ETAPAS_ORDER.forEach(etapaId => {
      const e = obra.etapas?.[etapaId];
      const cfg = ETAPAS_CONFIG[etapaId];
      if (!e?.ativa) return;
      // Lista (aditivos/medicao)
      if (cfg.isLista) {
        (e.lista || []).forEach(item => {
          (cfg.subEtapasTemplate || []).forEach(subCfg => {
            const sub = item.subEtapas?.[subCfg.id];
            if (!sub) return;
            if (sub.status === 'pending' || sub.status === 'pulada') return;
            const concluida = sub.status === 'done';
            const atrasada = !concluida && sub.dataLimite && sub.dataLimite < hoje;
            const vencendo = !concluida && sub.dataLimite && !atrasada && (() => {
              const d = new Date(sub.dataLimite + 'T12:00:00'), ag = new Date(); ag.setHours(0, 0, 0, 0);
              return Math.ceil((d - ag) / (1000 * 60 * 60 * 24)) <= 3;
            })();
            if (!incluirTodas && !atrasada && !vencendo) return;
            const diasAtrasoStr = (() => {
              if (atrasada) {
                const d = new Date(sub.dataLimite + 'T12:00:00'), ag = new Date(); ag.setHours(0, 0, 0, 0);
                return `${Math.ceil((ag - d) / (1000 * 60 * 60 * 24))} dias`;
              }
              if (concluida && sub.dataConclusao && sub.dataLimite && sub.dataConclusao > sub.dataLimite) {
                const dc = new Date(sub.dataConclusao + 'T12:00:00'), dl = new Date(sub.dataLimite + 'T12:00:00');
                return `${Math.ceil((dc - dl) / (1000 * 60 * 60 * 24))} dias`;
              }
              return '—';
            })();
            linhas.push({
              numero: obra.numero || obra.id.slice(-6), nome: obra.nome,
              representante: obra.representante || '—',
              responsaveis: _getResponsaveis(sub), responsavel: _getResponsaveis(sub).join(', ') || '—',
              etapa: `${NOMES_ETAPA[etapaId]} — ${item.titulo}`,
              subEtapa: subCfg.nome,
              status: concluida ? 'Concluída' : atrasada ? 'Em atraso' : vencendo ? 'Perto de vencer' : 'Em andamento',
              dataInicio: sub.dataInicio ? new Date(sub.dataInicio + 'T12:00:00').toLocaleDateString('pt-BR') : '—',
              dataConclusao: sub.dataConclusao ? new Date(sub.dataConclusao + 'T12:00:00').toLocaleDateString('pt-BR') : '—',
              dataLimite: sub.dataLimite ? new Date(sub.dataLimite + 'T12:00:00').toLocaleDateString('pt-BR') : '—',
              diasAtraso: diasAtrasoStr,
            });
          });
        });
        return;
      }
      // Sub-etapas normais
      const subEtapasArr = cfg.subEtapas || [];
      subEtapasArr.forEach(subCfg => {
        const sub = e.subEtapas?.[subCfg.id];
        if (!sub) return;
        if (sub.status === 'pending' || sub.status === 'pulada') return;
        const concluida = sub.status === 'done';
        const atrasada = !concluida && sub.dataLimite && sub.dataLimite < hoje;
        const vencendo = !concluida && sub.dataLimite && !atrasada && (() => {
          const d = new Date(sub.dataLimite + 'T12:00:00'), ag = new Date(); ag.setHours(0, 0, 0, 0);
          return Math.ceil((d - ag) / (1000 * 60 * 60 * 24)) <= 3;
        })();
        if (!incluirTodas && !atrasada && !vencendo) return;
        const diasAtrasoStr = (() => {
          if (atrasada) {
            const d = new Date(sub.dataLimite + 'T12:00:00'), ag = new Date(); ag.setHours(0, 0, 0, 0);
            return `${Math.ceil((ag - d) / (1000 * 60 * 60 * 24))} dias`;
          }
          if (concluida && sub.dataConclusao && sub.dataLimite && sub.dataConclusao > sub.dataLimite) {
            const dc = new Date(sub.dataConclusao + 'T12:00:00'), dl = new Date(sub.dataLimite + 'T12:00:00');
            return `${Math.ceil((dc - dl) / (1000 * 60 * 60 * 24))} dias`;
          }
          return '—';
        })();
        linhas.push({
          numero: obra.numero || obra.id.slice(-6),
          nome: obra.nome,
          representante: obra.representante || '—',
          responsaveis: _getResponsaveis(sub), responsavel: _getResponsaveis(sub).join(', ') || '—',
          etapa: NOMES_ETAPA[etapaId],
          subEtapa: subCfg.nome,
          status: concluida ? 'Concluída' : atrasada ? 'Em atraso' : vencendo ? 'Perto de vencer' : 'Em andamento',
          dataInicio: sub.dataInicio ? new Date(sub.dataInicio + 'T12:00:00').toLocaleDateString('pt-BR') : '—',
          dataConclusao: sub.dataConclusao ? new Date(sub.dataConclusao + 'T12:00:00').toLocaleDateString('pt-BR') : '—',
          dataLimite: sub.dataLimite ? new Date(sub.dataLimite + 'T12:00:00').toLocaleDateString('pt-BR') : '—',
          diasAtraso: diasAtrasoStr,
        });
      });
    });
  });
  return linhas;
}

function exportarRelatorioXLS() {
  const linhas = _gerarDadosRelatorio();
  if (!linhas.length) { showComercialToast('Nenhuma obra encontrada para o relatório.', 'error'); return; }
  try {
    const hoje = new Date().toLocaleDateString('pt-BR');
    const headers = ['Nº', 'Obra', 'Representante', 'Responsável', 'Etapa', 'Sub-etapa', 'Status', 'Data de Início', 'Data Conclusão', 'Data Prevista', 'Dias em atraso'];
    const escXml = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const headerRow = headers.map(h => `<th style="background:#374151;color:#fff;padding:6px 8px;border:1px solid #d1d5db;">${escXml(h)}</th>`).join('');
    const dataRows = linhas.map((l, rowIdx) => {
      const cols = [l.numero, l.nome, l.representante, l.responsavel || '—', l.etapa, l.subEtapa, l.status, l.dataInicio || '—', l.dataConclusao || '—', l.dataLimite, l.diasAtraso];
      return `<tr>${cols.map((v, ci) => {
        const isAtraso = ci === cols.length - 1;
        const cellBg = l.status === 'Em atraso' ? '#fee2e2' : l.status === 'Perto de vencer' ? '#fef3c7' : l.status === 'Concluída' ? '#dcfce7' : rowIdx % 2 === 0 ? '#ffffff' : '#f9fafb';
        const cellColor = isAtraso && l.status === 'Em atraso' && l.diasAtraso && l.diasAtraso !== '—' ? '#dc2626' : '#1f2937';
        const cellWeight = isAtraso && l.status === 'Em atraso' && l.diasAtraso && l.diasAtraso !== '—' ? 'bold' : 'normal';
        return `<td style="padding:5px 8px;border:1px solid #e5e7eb;background:${cellBg};color:${cellColor};font-weight:${cellWeight};">${escXml(v)}</td>`;
      }).join('')}</tr>`;
    }).join('');
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Relatorio</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
      <body><table><thead><tr>${headerRow}</tr></thead><tbody>${dataRows}</tbody></table></body></html>`;
    const blob = new Blob(['﻿' + html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_obras_${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
    closeRelatorioModal();
    showComercialToast('XLS exportado! ✅', 'success');
  } catch (e) {
    console.error('XLS error:', e);
    showComercialToast(`Erro: ${e.message}`, 'error');
  }
}

function exportarRelatorioPDF() {
  const linhas = _gerarDadosRelatorio();
  if (!linhas.length) { showComercialToast('Nenhuma obra encontrada para o relatório.', 'error'); return; }
  const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const rows = linhas.map((l, ri) => {
    const bg = l.status === 'Em atraso' ? '#fee2e2' : l.status === 'Perto de vencer' ? '#fef3c7' : l.status === 'Concluída' ? '#dcfce7' : ri % 2 === 0 ? '#ffffff' : '#f9fafb';
    const td = `style="padding:6px 8px;border-bottom:1px solid #e5e7eb;background:${bg};"`;
    const tdRed = l.status === 'Em atraso' && l.diasAtraso && l.diasAtraso !== '—'
      ? `style="padding:6px 8px;border-bottom:1px solid #e5e7eb;background:${bg};color:#dc2626;font-weight:700;"`
      : `style="padding:6px 8px;border-bottom:1px solid #e5e7eb;background:${bg};color:#6b7280;"`;
    return `<tr>
      <td ${td}>#${l.numero}</td>
      <td ${td}><strong>${l.nome}</strong></td>
      <td ${td}>${l.representante}</td>
      <td ${td}>${l.responsavel || '—'}</td>
      <td ${td}>${l.etapa}</td>
      <td ${td}>${l.subEtapa}</td>
      <td ${td}><span class="badge ${l.status === 'Em atraso' ? 'red' : l.status === 'Perto de vencer' ? 'amber' : l.status === 'Concluída' ? 'green' : 'blue'}">${l.status}</span></td>
      <td ${td}>${l.dataInicio || '—'}</td>
      <td ${td}>${l.dataConclusao || '—'}</td>
      <td ${td}>${l.dataLimite}</td>
      <td ${tdRed}>${l.diasAtraso}</td>
    </tr>`;
  }).join('');
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>Relatório de Obras — Premovale</title>
    <style>
      body{font-family:Arial,sans-serif;font-size:11px;color:#1f2937;margin:0;padding:24px;}
      .header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #ef4444;padding-bottom:12px;margin-bottom:20px;}
      .header h1{font-size:16px;margin:0;color:#ef4444;}
      .header span{font-size:10px;color:#6b7280;}
      table{width:100%;border-collapse:collapse;}
      th{background:#f3f4f6;padding:6px 8px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #e5e7eb;}
      td{padding:6px 8px;border-bottom:1px solid #e5e7eb;vertical-align:top;}
      small{color:#6b7280;font-size:9px;}
      .badge{padding:2px 6px;border-radius:4px;font-size:9px;font-weight:700;}
      .red{background:#fee2e2;color:#991b1b;}
      .amber{background:#fef3c7;color:#92400e;}
      .blue{background:#dbeafe;color:#1e40af;}
      .green{background:#dcfce7;color:#166534;}
      .footer{margin-top:20px;font-size:9px;color:#9ca3af;text-align:center;}
    </style></head><body>
    <div class="header">
      <h1>📋 Relatório de Obras — Premovale</h1>
      <span>Gerado em ${hoje}</span>
    </div>
    <table>
      <thead><tr><th>Nº</th><th>Obra</th><th>Representante</th><th>Responsável</th><th>Etapa</th><th>Sub-etapa</th><th>Status</th><th>Data de Início</th><th>Data Conclusão</th><th>Data Prevista</th><th>Atraso</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="footer">Premovale T.I — ${linhas.length} item(s) • ${hoje}</div>
    <script>window.onload=()=>{window.print();}<\/script>
  </body></html>`;
  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  closeRelatorioModal();
}


// ── Observações por etapa/sub-etapa ──────────────────────────────────────────
let _obsObraId = null, _obsEtapaId = null, _obsSubId = null;

let _obsItemId = null;
let _obsCocIdx = null;

function _openObsModalCoc(obraId, etapaId, cocIdx) {
  _obsObraId = obraId; _obsEtapaId = etapaId; _obsSubId = null; _obsItemId = null; _obsCocIdx = cocIdx;
  const obra = _obras.find(o => o.id === obraId);
  const nome = obra?.etapas?.[etapaId]?.cocLista?.[cocIdx]?.nome || 'COC';
  document.getElementById('obs-modal-title').textContent = `Observação — COC · ${nome}`;
  document.getElementById('obs-input').value = '';
  document.getElementById('obs-modal').style.display = 'flex';
}

function openObsModal(obraId, etapaId, subId, itemId) {
  _obsObraId = obraId; _obsEtapaId = etapaId; _obsSubId = subId || null; _obsItemId = itemId || null;
  const cfg = ETAPAS_CONFIG[etapaId];
  const subCfg = subId ? (cfg.subEtapas || cfg.subEtapasTemplate || []).find(s => s.id === subId) : null;
  const titulo = subCfg ? `Observação — ${cfg.nome} · ${subCfg.nome}` : `Observação — ${cfg.nome}`;
  document.getElementById('obs-modal-title').textContent = titulo;
  document.getElementById('obs-input').value = '';
  document.getElementById('obs-modal').style.display = 'flex';
}
function closeObsModal() {
  document.getElementById('obs-modal').style.display = 'none';
  _obsObraId = _obsEtapaId = _obsSubId = _obsItemId = _obsCocIdx = null;
}
async function saveObs() {
  if (!podeEditarComercial()) { showComercialToast('Acesso somente leitura — você não pode alterar obras.', 'error'); return; }
  const texto = document.getElementById('obs-input')?.value.trim();
  if (!texto) { showComercialToast('Informe a observação.', 'error'); return; }
  const obra = _obras.find(o => o.id === _obsObraId); if (!obra) return;
  const etapas = JSON.parse(JSON.stringify(obra.etapas));
  const novaObs = {
    texto, data: new Date().toISOString().slice(0, 10),
    hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    por: currentUser.username
  };
  if (_obsCocIdx !== null && _obsCocIdx !== undefined) {
    const _item = etapas[_obsEtapaId].cocLista?.[_obsCocIdx];
    if (_item) { if (!_item.observacoes) _item.observacoes = []; _item.observacoes.push(novaObs); }
  } else if (_obsSubId) {
    const refObs = _findSubRef(etapas, _obsEtapaId, _obsSubId, _obsItemId);
    if (refObs) { if (!refObs.sub.observacoes) refObs.sub.observacoes = []; refObs.sub.observacoes.push(novaObs); }
  } else {
    if (!etapas[_obsEtapaId].observacoes) etapas[_obsEtapaId].observacoes = [];
    etapas[_obsEtapaId].observacoes.push(novaObs);
  }
  await db.collection('obras').doc(_obsObraId).update({ etapas });
  showComercialToast('Observação registrada! ✅', 'success');
  closeObsModal();
}
function openHistoricoModal(obraId) {
  const obra = _obras.find(o => o.id === obraId); if (!obra) return;
  const el = document.getElementById('historico-modal-body');
  if (!el) return;
  // Renderizar aba Histórico
  _renderHistoricoAba(obra, el);
  // Marcar como visto
  _marcarHistoricoVisto(obra);
  const o = _obras.find(x => x.id === obraId); if (o) { _saveAccordionState(); renderObraModal(o); _restoreAccordionState(); }
  document.getElementById('historico-modal').style.display = 'flex';
  // Carregar auditoria em background
  _loadAuditoria(obraId).then(() => {
    const auditEl = document.getElementById('historico-auditoria-body');
    if (auditEl) _renderAuditoriaAba(obraId, auditEl);
  });
}

function _switchHistoricoTab(tab, obraId) {
  const t1 = document.getElementById('tab-historico-btn');
  const t2 = document.getElementById('tab-auditoria-btn');
  const b1 = document.getElementById('historico-modal-body');
  const b2 = document.getElementById('historico-auditoria-body');
  if (!t1 || !t2 || !b1 || !b2) return;
  if (tab === 'historico') {
    t1.style.borderBottom = '2px solid var(--accent)'; t1.style.color = 'var(--accent)';
    t2.style.borderBottom = '2px solid transparent'; t2.style.color = 'var(--muted)';
    b1.style.display = 'block'; b2.style.display = 'none';
  } else {
    t2.style.borderBottom = '2px solid var(--accent)'; t2.style.color = 'var(--accent)';
    t1.style.borderBottom = '2px solid transparent'; t1.style.color = 'var(--muted)';
    b1.style.display = 'none'; b2.style.display = 'block';
    _loadAuditoria(obraId).then(() => {
      const el = document.getElementById('historico-auditoria-body');
      if (el) _renderAuditoriaAba(obraId, el);
    });
  }
}

function _renderAuditoriaAba(obraId, el) {
  const entries = _auditoriaCache[obraId] || [];
  if (!entries.length) {
    el.innerHTML = '<div style="color:var(--muted);font-size:0.82rem;text-align:center;padding:1rem;">Nenhum registro de auditoria.</div>';
    return;
  }
  el.innerHTML = entries.map(e => {
    const cor = _AUDIT_CORES[e.tipo] || '#6b7280';
    const icon = _AUDIT_ICONS[e.tipo] || '';
    const dt = e.em ? new Date(e.em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
    return `<div style="display:flex;gap:0.75rem;padding:0.65rem 0;border-bottom:1px solid var(--border2);align-items:flex-start;">
      <span style="width:28px;height:28px;border-radius:50%;background:${cor}18;border:1.5px solid ${cor}40;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:${cor};">${icon}</span>
      <div style="flex:1;min-width:0;">
        <div style="font-size:0.8rem;color:var(--text);line-height:1.4;">${e.descricao}</div>
        <div style="font-size:0.68rem;color:var(--muted);margin-top:0.2rem;font-family:var(--font-mono);">${dt} — ${e.por}</div>
      </div>
    </div>`;
  }).join('') + '<div style="font-size:0.7rem;color:var(--muted);text-align:center;padding:0.75rem;"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px;"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Registro imutável — auditoria do sistema</div>';
}

function _renderHistoricoAba(obra, el) {
  const NOMES = { proposta: 'Proposta Consolidada', contrato: 'Contrato', documentacoes: 'Documentações', aditivos: 'Aditivos/Termo', medicao: 'Medição' };
  let html = '';
  ETAPAS_ORDER.forEach(etapaId => {
    const e = obra.etapas?.[etapaId]; if (!e) return;
    const cfg = ETAPAS_CONFIG[etapaId];
    const itens = [];
    (e.observacoes || []).forEach(o => itens.push({ tipo: 'obs', badge: '📝 Etapa', texto: o.texto, meta: `${o.data} ${o.hora || ''} — ${o.por}` }));
    (e.revisoes || []).forEach(r => itens.push({ tipo: 'rev', badge: `REV.${r.numero}`, texto: r.motivo, meta: `${r.data || '—'} — ${r.por || '—'}` }));
    // Sub-etapas normais
    if (!cfg.isLista) {
      (cfg.subEtapas || []).forEach(sub => {
        const sd = e.subEtapas?.[sub.id];
        (sd?.observacoes || []).forEach(o => itens.push({ tipo: 'obs', badge: `📝 ${sub.nome}`, texto: o.texto, meta: `${o.data} ${o.hora || ''} — ${o.por}` }));
        (sd?.revisoes || []).forEach(r => itens.push({ tipo: 'rev', badge: `REV.${r.numero} ${sub.nome}`, texto: r.motivo, meta: `${r.data || '—'} — ${r.por || '—'}` }));
      });
    } else {
      // Lista (aditivos/medicao)
      (e.lista || []).forEach(item => {
        (cfg.subEtapasTemplate || []).forEach(sub => {
          const sd = item.subEtapas?.[sub.id];
          (sd?.observacoes || []).forEach(o => itens.push({ tipo: 'obs', badge: `📝 ${item.titulo} · ${sub.nome}`, texto: o.texto, meta: `${o.data} ${o.hora || ''} — ${o.por}` }));
          (sd?.revisoes || []).forEach(r => itens.push({ tipo: 'rev', badge: `REV.${r.numero} ${item.titulo}`, texto: r.motivo, meta: `${r.data || '—'} — ${r.por || '—'}` }));
        });
      });
    }
    if (!itens.length) return;
    html += `<div style="margin-bottom:1.25rem;"><div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted);font-family:var(--font-mono);margin-bottom:0.5rem;padding-bottom:0.3rem;border-bottom:1px solid var(--border2);">${NOMES[etapaId] || etapaId}</div>`;
    itens.forEach(s => {
      const badgeMax = 48;
      const badgeLabel = s.badge.length > badgeMax ? s.badge.slice(0, badgeMax) + '…' : s.badge;
      html += `<div class="hist-entry">
        <div class="hist-entry-header">
          <span class="hist-entry-badge ${s.tipo}" title="${s.badge}">${badgeLabel}</span>
          <span class="hist-entry-meta">${s.meta}</span>
        </div>
        <div class="hist-entry-text">${s.texto.replace(/^(Recusado:)/, '<span style="color:#ef4444;font-weight:700;">$1</span>')}</div>
      </div>`;
    });
    html += '</div>';
  });
  if (!html) html = '<div style="color:var(--muted);font-size:0.82rem;text-align:center;padding:1rem;">Nenhum histórico registrado.</div>';
  el.innerHTML = html;
  _marcarHistoricoVisto(obra);
  document.getElementById('historico-modal').style.display = 'flex';
  // Atualizar footer para remover badge
  const o = _obras.find(x => x.id === obraId); if (o) { _saveAccordionState(); renderObraModal(o); _restoreAccordionState(); }
}
function closeHistoricoModal() { document.getElementById('historico-modal').style.display = 'none'; }

let _atribObraId = null, _atribEtapaId = null, _atribSubId = null, _atribModo = null;
let _atribItemId = null;
let _atribOrdem = [];
const _ATRIB_MAX = 2;
function _atribEnforceMax(chk) {
  if (chk.checked) {
    if (!_atribOrdem.includes(chk.value)) _atribOrdem.push(chk.value);
    let marcados = Array.from(document.querySelectorAll('#atrib-usuario-list .atrib-chk:checked'));
    while (marcados.length > _ATRIB_MAX) {
      const antigo = _atribOrdem.shift();
      if (antigo === chk.value) { _atribOrdem.push(antigo); continue; }
      const el = Array.from(document.querySelectorAll('#atrib-usuario-list .atrib-chk')).find(c => c.value === antigo);
      if (el) el.checked = false; else break;
      marcados = Array.from(document.querySelectorAll('#atrib-usuario-list .atrib-chk:checked'));
    }
  } else {
    _atribOrdem = _atribOrdem.filter(v => v !== chk.value);
  }
}
function _preencherAtribLista(selec) {
  const box = document.getElementById('atrib-usuario-list');
  if (!box) return;
  const allUsers = typeof users !== 'undefined' ? users : [];
  const lista = allUsers.filter(u => u.isSuperAdmin || u.role === 'superAdmin' || (u.acessos || []).includes('atribuivelComercial'));
  const sel = new Set(selec || []);
  _atribOrdem = (selec || []).slice();
  box.innerHTML = lista.map(u => `<label class="atrib-row">
      <span>${u.username}${u.username === currentUser?.username ? ' <span style="color:var(--muted);font-size:0.72rem;">(você)</span>' : ''}</span>
      <span class="atrib-toggle"><input type="checkbox" class="atrib-chk" value="${u.username}"${sel.has(u.username) ? ' checked' : ''} onchange="_atribEnforceMax(this)"><span class="atrib-toggle-slider"></span></span>
    </label>`).join('') || '<div style="color:var(--muted);font-size:0.8rem;">Nenhum usuário atribuível disponível.</div>';
}
function openAtribuirModal(obraId, etapaId, subId, modo, itemId) {
  _atribItemId = itemId || null;
  _atribObraId = obraId; _atribEtapaId = etapaId; _atribSubId = subId; _atribModo = modo || 'atribuir';
  const cfg = ETAPAS_CONFIG[etapaId];
  const subCfg = (cfg.subEtapas || cfg.subEtapasTemplate || []).find(s => s.id === subId);
  document.getElementById('atrib-modal-title').textContent = (_atribModo === 'reatribuir' ? 'Reatribuir' : 'Atribuir') + ` — ${cfg.nome} · ${subCfg?.nome || subId}`;
  const jw = document.getElementById('atrib-justificativa-wrap'); if (jw) jw.style.display = _atribModo === 'reatribuir' ? 'block' : 'none';
  const je = document.getElementById('atrib-justificativa'); if (je) je.value = '';
  const obra = _obras.find(o => o.id === obraId);
  const ref = obra ? _findSubRef(obra.etapas || {}, etapaId, subId, _atribItemId) : null;
  _preencherAtribLista(_getResponsaveis(ref?.sub));
  document.getElementById('atrib-modal').style.display = 'flex';
}
function closeAtribuirModal() { document.getElementById('atrib-modal').style.display = 'none'; _atribObraId = _atribEtapaId = _atribSubId = _atribModo = null; }
async function saveAtribuicao() {
  if (!podeEditarComercial()) { showComercialToast('Acesso somente leitura — você não pode alterar obras.', 'error'); return; }
  const selecionados = Array.from(document.querySelectorAll('#atrib-usuario-list .atrib-chk:checked')).map(c => c.value);
  const _lbl = selecionados.length ? selecionados.join(', ') : 'ninguém';
  // Modo COC: salvar diretamente na cocLista
  if (document.getElementById('atrib-modal')?.dataset?.cocMode === '1') {
    document.getElementById('atrib-modal').dataset.cocMode = '';
    const obra3 = _obras.find(o => o.id === _cocActionObraId); if (!obra3) return;
    const etapas3 = JSON.parse(JSON.stringify(obra3.etapas));
    etapas3[_cocActionEtapaId].cocLista[_cocActionIdx].responsaveis = selecionados; delete etapas3[_cocActionEtapaId].cocLista[_cocActionIdx].responsavel;
    await db.collection('obras').doc(_cocActionObraId).update({ etapas: etapas3 });
    _audit(_cocActionObraId, 'atribuicao', `COC "${etapas3[_cocActionEtapaId].cocLista[_cocActionIdx].nome}": atribuído a "${_lbl}"`);
    closeAtribuirModal(); showComercialToast(selecionados.length ? `Atribuído para ${_lbl}! ✅` : 'Atribuição removida.', 'success'); return;
  }
  if (_atribModo === 'reatribuir') { const j = document.getElementById('atrib-justificativa')?.value.trim(); if (!j) { showComercialToast('Informe a justificativa.', 'error'); return; } }
  const obra = _obras.find(o => o.id === _atribObraId); if (!obra) return;
  const etapas = JSON.parse(JSON.stringify(obra.etapas));
  const ref = _findSubRef(etapas, _atribEtapaId, _atribSubId, _atribItemId);
  if (!ref) { showComercialToast('Sub-etapa não encontrada.', 'error'); return; }
  const anterior = _getResponsaveis(ref.sub).join(', ') || null;
  ref.sub.responsaveis = selecionados; delete ref.sub.responsavel;
  if (!ref.sub.historicoAtribuicao) ref.sub.historicoAtribuicao = [];
  ref.sub.historicoAtribuicao.push({ de: anterior || currentUser.username, para: _lbl, data: new Date().toISOString().slice(0, 10), justificativa: _atribModo === 'reatribuir' ? (document.getElementById('atrib-justificativa')?.value.trim() || null) : null, por: currentUser.username });
  const _cfgAt = ETAPAS_CONFIG[_atribEtapaId];
  const _snAt = (_cfgAt.subEtapas || _cfgAt.subEtapasTemplate || []).find(s => s.id === _atribSubId)?.nome || _atribSubId;
  _audit(_atribObraId, 'atribuicao', `${_cfgAt.nome} · ${_snAt}: atribuído a "${_lbl}"${anterior ? ' (antes: "' + anterior + '")' : ''}`);
  await db.collection('obras').doc(_atribObraId).update({ etapas });
  showComercialToast(selecionados.length ? `Atribuído para ${_lbl}! ✅` : 'Atribuição removida.', 'success');
  closeAtribuirModal();
}



// ── Relatório de pendências ───────────────────────────────────────────────────
function exportarRelatorioPendencias() {
  const hoje = new Date().toISOString().slice(0, 10);
  const hojeFormatado = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const respFiltro = document.getElementById('rel-responsavel-pend')?.value || document.getElementById('rel-responsavel')?.value || '';
  const rows = [];
  _obras.filter(o => !o.concluida).forEach(obra => {
    ETAPAS_ORDER.forEach(etapaId => {
      const e = obra.etapas?.[etapaId];
      const cfg = ETAPAS_CONFIG[etapaId];
      if (!e?.ativa) return;
      const processSub = (sub, subNome, titulo, item) => {
        // Apenas etapas em andamento (exclui não iniciadas/pendentes e concluídas)
        if (sub.status !== 'active' || !_getResponsaveis(sub).length) return;
        const ref = sub.dataLimite || sub.dataPrevista || (item ? item.dataPrevista : null);
        rows.push({
          numero: obra.numero || obra.id.slice(-6),
          nome: obra.nome,
          representante: obra.representante || '—',
          etapa: titulo ? `${cfg.nome} — ${titulo}` : cfg.nome,
          subEtapa: subNome,
          responsaveis: _getResponsaveis(sub), responsavel: _getResponsaveis(sub).join(', ') || '—',
          status: ref && ref < hoje ? 'Atrasada' : 'Em andamento',
          dataLimite: ref ? new Date(ref + 'T12:00:00').toLocaleDateString('pt-BR') : '—',
        });
      };
      if (cfg.isLista) {
        (e.lista || []).forEach(item => {
          (cfg.subEtapasTemplate || []).forEach(s => processSub(item.subEtapas?.[s.id] || {}, s.nome, item.titulo, item));
        });
      } else {
        (cfg.subEtapas || []).forEach(s => processSub(e.subEtapas?.[s.id] || {}, s.nome, null, null));
      }
    });
  });
  let rowsFiltrados = respFiltro ? rows.filter(r => (r.responsaveis || []).includes(respFiltro)) : rows;
  if (!rowsFiltrados.length) { showComercialToast('Nenhuma pendência encontrada.', 'success'); return; }
  const rowsFinal = rowsFiltrados;
  if (!rows.length) { showComercialToast('Nenhuma pendência encontrada.', 'success'); return; }
  const rowsHtml = rowsFinal.map((r, i) => {
    const bg = r.status === 'Atrasada' ? '#fee2e2' : r.status === 'Em andamento' ? '#dbeafe' : i % 2 === 0 ? '#ffffff' : '#f9fafb';
    const badgeCls = r.status === 'Atrasada' ? 'red' : r.status === 'Em andamento' ? 'blue' : 'gray';
    const td = `style="padding:6px 10px;border-bottom:1px solid #e5e7eb;background:${bg};"`;
    return `<tr>
      <td ${td}>#${r.numero}</td>
      <td ${td}><strong>${r.nome}</strong></td>
      <td ${td}>${r.representante}</td>
      <td ${td}>${r.etapa}</td>
      <td ${td}>${r.subEtapa}</td>
      <td ${td} style="padding:6px 10px;border-bottom:1px solid #e5e7eb;background:${bg};font-weight:700;">${r.responsavel}</td>
      <td ${td}><span class="badge ${badgeCls}">${r.status}</span></td>
      <td ${td}>${r.dataLimite}</td>
    </tr>`;
  }).join('');
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Pendências — Premovale</title>
    <style>
      body{font-family:Arial,sans-serif;font-size:11px;color:#1f2937;margin:0;padding:24px;}
      .header{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #ef4444;padding-bottom:12px;margin-bottom:20px;}
      .header h1{font-size:16px;margin:0;color:#ef4444;font-weight:800;}
      .header span{font-size:10px;color:#6b7280;}
      table{width:100%;border-collapse:collapse;}
      th{background:#1e293b;color:#fff;padding:7px 10px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.06em;}
      td{padding:6px 10px;border-bottom:1px solid #e5e7eb;vertical-align:top;}
      .badge{padding:2px 7px;border-radius:4px;font-size:9px;font-weight:700;}
      .red{background:#fee2e2;color:#991b1b;}
      .blue{background:#dbeafe;color:#1e40af;}
      .green{background:#dcfce7;color:#166534;}
      .gray{background:#f3f4f6;color:#374151;}
      .footer{margin-top:16px;font-size:9px;color:#9ca3af;text-align:center;border-top:1px solid #e5e7eb;padding-top:10px;}
    </style></head>
    <body>
    <div class="header">
      <div><h1>Relatório de Pendências</h1><div style="font-size:10px;color:#6b7280;margin-top:3px;">${respFiltro ? `Responsável: ${respFiltro}` : 'Todos os responsáveis'}</div></div>
      <span>Gerado em ${hojeFormatado}</span>
    </div>
    <table>
      <thead><tr><th>Nº</th><th>Obra</th><th>Representante</th><th>Etapa</th><th>Sub-etapa</th><th>Responsável</th><th>Status</th><th>Data Limite</th></tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table>
    <div class="footer">Premovale T.I — ${rowsFinal.length} pendência(s)</div>
    <script>window.onload=()=>{window.print();}<\/script>
    </body></html>`;
  const w = window.open('', '_blank'); w.document.write(html); w.document.close();
}

// ── Filtro Minhas Pendências + Período ────────────────────────────────────────
let _dropdownAberto = false;

function togglePeriodoDropdown() {
  const btn = document.getElementById('btn-periodo');
  const dd = document.getElementById('periodo-dropdown');
  if (!dd) return;
  const open = dd.style.display === 'flex';
  // Fechar pendências se aberto
  const pdrop = document.getElementById('pendencias-dropdown');
  if (pdrop) pdrop.style.display = 'none';
  dd.style.display = open ? 'none' : 'flex';
  if (btn) {
    btn.style.background = !open ? 'var(--accent)' : '';
    btn.style.color = !open ? '#fff' : '';
    btn.style.borderColor = !open ? 'var(--accent)' : '';
  }
}

function toggleMinhasPendencias() {
  const btn = document.getElementById('btn-minhas-pendencias');
  const pdrop = document.getElementById('pendencias-dropdown');
  if (!pdrop) return;
  // Fechar período se aberto
  const perDrop = document.getElementById('periodo-dropdown');
  if (perDrop) perDrop.style.display = 'none';
  // Desligar: estado real está em _filtroMinhasPendencias (cobre gestor E usuário comum)
  const ativo = _filtroMinhasPendencias || pdrop.style.display === 'flex';
  if (ativo) {
    pdrop.style.display = 'none';
    const wrap = document.getElementById('pendencia-user-wrap');
    if (wrap) wrap.style.display = 'none';
    _filtroMinhasPendencias = false;
    _filtroUsuarioPendencia = '';
    _paginaAtual = 0;
    if (btn) { btn.style.background = ''; btn.style.color = ''; btn.style.borderColor = ''; }
    renderObras();
    return;
  }
  // Verificar se é gestor
  const isGestor = currentUser?.isSuperAdmin || (currentUser?.acessos || []).includes('adminComercial');
  if (isGestor) {
    // Gestor: mostrar seletor
    _atualizarSeletorPendencia();
    document.getElementById('pendencia-user-wrap').style.display = 'flex';
    pdrop.style.display = 'flex';
    if (btn) { btn.style.background = 'var(--accent)'; btn.style.color = '#fff'; btn.style.borderColor = 'var(--accent)'; }
  } else {
    // Usuário comum: aplicar direto
    _filtroMinhasPendencias = true;
    _filtroUsuarioPendencia = '';
    _paginaAtual = 0;
    renderObras();
    if (btn) { btn.style.background = 'var(--accent)'; btn.style.color = '#fff'; btn.style.borderColor = 'var(--accent)'; }
  }
}


function _atualizarSeletorPendencia() {
  const wrap = document.getElementById('pendencia-user-wrap');
  if (!wrap) return;
  const isGestor = currentUser?.isSuperAdmin || (currentUser?.acessos || []).includes('adminComercial');
  if (!isGestor) { wrap.style.display = 'none'; return; }
  const lista = (typeof users !== 'undefined' ? users : []).filter(u =>
    u.isSuperAdmin || (u.acessos || []).includes('adminComercial') || (u.acessos || []).includes('comercial')
  );
  const sel = document.getElementById('pendencia-user-sel');
  if (sel) {
    sel.innerHTML = lista.map(u => `<option value="${u.username}"${u.username === currentUser.username ? ' selected' : ''}>${u.username}${u.username === currentUser.username ? ' (você)' : ''}</option>`).join('');
    wrap.style.display = 'flex';
  }
}

function aplicarPendencias() {
  const sel = document.getElementById('pendencia-user-sel');
  const val = sel?.value || '';
  _filtroUsuarioPendencia = val === currentUser?.username ? '' : val;
  _filtroMinhasPendencias = true;
  _paginaAtual = 0;
  // Fechar dropdown
  const pdrop = document.getElementById('pendencias-dropdown');
  if (pdrop) pdrop.style.display = 'none';
  renderObras();
}

function setPendenciaUsuario(val) {
  _filtroUsuarioPendencia = val === currentUser?.username ? '' : val;
  _paginaAtual = 0; renderObras();
}

function limparPeriodo() {
  _filtroPeriodoDe = ''; _filtroPeriodoAte = ''; _filtroUsuarioPendencia = '';
  const de = document.getElementById('periodo-de'), ate = document.getElementById('periodo-ate');
  if (de) de.value = ''; if (ate) ate.value = '';
  _filtroMinhasPendencias = false; _dropdownAberto = false;
  const btn = document.getElementById('btn-minhas-pendencias');
  const perDrop = document.getElementById('periodo-dropdown');
  const pDrop = document.getElementById('pendencias-dropdown');
  if (perDrop) perDrop.style.display = 'none';
  if (pDrop) pDrop.style.display = 'none';
  if (btn) { btn.style.background = ''; btn.style.color = ''; btn.style.borderColor = ''; }
  const btnPer = document.getElementById('btn-periodo');
  if (btnPer) { btnPer.style.background = ''; btnPer.style.color = ''; btnPer.style.borderColor = ''; }
  renderObras();
}

// Fechar dropdown ao clicar fora
document.addEventListener('click', e => {
  if (!_dropdownAberto) return;
  const btn = document.getElementById('btn-minhas-pendencias');
  const wrap = document.getElementById('periodo-wrap');
  if (btn && !btn.contains(e.target) && wrap && !wrap.contains(e.target)) {
    _dropdownAberto = false;
    wrap.style.display = 'none';
  }
});


let _cToast = null;
function showComercialToast(msg, type = 'success') {
  let t = document.getElementById('comercial-toast');
  if (!t) { t = document.createElement('div'); t.id = 'comercial-toast'; t.className = 'comercial-toast'; document.body.appendChild(t); }
  t.textContent = msg; t.className = `comercial-toast ${type}`;
  requestAnimationFrame(() => t.classList.add('show'));
  if (_cToast) clearTimeout(_cToast);
  _cToast = setTimeout(() => t.classList.remove('show'), 3200);
}

// ── Destaque de card via URL ─────────────────────────────────────────────────
function highlightObraFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const obraId = params.get('obra');
  if (!obraId) return;
  const etapaAlvo = params.get('etapa');
  // Aguardar o DOM renderizar os cards
  setTimeout(() => {
    if (etapaAlvo) {
      openObraModal(obraId);
      setTimeout(() => {
        const row = document.querySelector(`[data-etapa-row="${etapaAlvo}"]`);
        if (row) {
          row.scrollIntoView({ behavior: 'smooth', block: 'center' });
          row.classList.add('etapa-row-highlight');
          setTimeout(() => row.classList.remove('etapa-row-highlight'), 2500);
        }
        const u = new URL(window.location); u.searchParams.delete('obra'); u.searchParams.delete('etapa'); window.history.replaceState({}, '', u);
      }, 280);
      return;
    }
    const card = document.querySelector(`.obra-card[data-obra-id="${obraId}"]`);
    if (!card) return;
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card.classList.add('obra-card-highlight');
    setTimeout(() => card.classList.remove('obra-card-highlight'), 3000);
    // Limpar parâmetro da URL sem recarregar
    const url = new URL(window.location);
    url.searchParams.delete('obra');
    window.history.replaceState({}, '', url);
  }, 400);
}

// ── Boot ──────────────────────────────────────────────────────────────────────
async function _initComercialPage() {
  await loadUsers();
  const savedId = localStorage.getItem('chamados-current-user-id');
  if (!savedId) { window.location.href = 'login.html'; return; }
  const user = users.find(u => u.id === savedId);
  if (!user) { window.location.href = 'login.html'; return; }
  const acessos = user.acessos || [];
  // Tolerância temporária: canVerTodasPendencias pode ter entrado no array por bug
  const temAcessoComercial = user.isSuperAdmin || user.isAdminComercial || user.isComercial ||
    acessos.includes('comercial') || acessos.includes('adminComercial') ||
    acessos.includes('canVerTodasPendencias') || !!user.canVerTodasPendencias;
  if (!temAcessoComercial) { window.location.href = 'menu.html'; return; }
  // Auto-corrigir dados corrompidos silenciosamente
  if (acessos.includes('canVerTodasPendencias')) {
    const nov = acessos.filter(a => a !== 'canVerTodasPendencias');
    if (!nov.includes('comercial') && !nov.includes('adminComercial') && !user.isSuperAdmin) nov.push('comercial');
    db.collection('users').doc(user.id).update({ acessos: nov, canVerTodasPendencias: true }).catch(() => { });
    user.acessos = nov; user.canVerTodasPendencias = true;
  }
  currentUser = user;
  // Modo telespectador: sem permissão de edição -> esconde controles de ação
  if (!podeEditarComercial()) {
    document.body.classList.add('comercial-readonly');
    if (!document.getElementById('comercial-readonly-style')) {
      const _st = document.createElement('style');
      _st.id = 'comercial-readonly-style';
      _st.textContent = '.comercial-readonly .sub-action-btn,.comercial-readonly [onclick^="openNovaObraModal"]{display:none !important;}';
      document.head.appendChild(_st);
    }
  }
  if (typeof initDarkMode === 'function') initDarkMode();
  if (typeof initSessionTimer === 'function') initSessionTimer(user.role);
  const collapsed = localStorage.getItem('chamados-sidebar-collapsed') === '1';
  const sidebar = document.getElementById('chamados-sidebar'), icon = document.getElementById('sidebar-toggle-icon');
  if (sidebar) { sidebar.classList.add('no-transition'); if (collapsed) { sidebar.classList.add('collapsed'); if (icon) icon.textContent = '›'; } requestAnimationFrame(() => requestAnimationFrame(() => sidebar.classList.remove('no-transition'))); }
  const syncBtn = document.getElementById('sync-fab-nav'), configBtn = document.getElementById('sidebar-config-btn');
  if (syncBtn) syncBtn.style.display = user.isSuperAdmin ? 'flex' : 'none';
  if (configBtn) configBtn.style.display = (user.isAdmin || user.isSuperAdmin) ? 'flex' : 'none';
  const acessosTI = user.isSuperAdmin ? ['chamados', 'materiais', 'inventario', 'rotinas'] : (user.acessos || []);
  ['materiais', 'inventario', 'rotinas'].forEach(mod => { const el = document.getElementById('sub-' + mod); if (el) el.style.display = (user.isSuperAdmin || acessosTI.includes(mod)) ? 'flex' : 'none'; });
  const canComercial = user.isSuperAdmin || user.isAdminComercial || user.isComercial || acessos.includes('comercial') || acessos.includes('adminComercial');
  const modBtn = document.getElementById('mod-pai-comercial-btn');
  if (modBtn) modBtn.style.display = canComercial ? 'flex' : 'none';
  if (typeof initModPai === 'function') initModPai('comercial');
  const avatar = document.getElementById('cs-sidebar-avatar'), nameEl = document.getElementById('cs-sidebar-name'), roleEl = document.getElementById('cs-sidebar-role');
  if (avatar) avatar.textContent = user.username.charAt(0).toUpperCase();
  if (nameEl) nameEl.textContent = capitalizeName(user.username);
  if (roleEl) roleEl.innerHTML = getSectorBadge(user);
  initComercial();

  // Restaurar preferência de cards por página
  const perPage = localStorage.getItem('comercial-per-page');
  if (perPage) {
    const sel = document.getElementById('per-page-select');
    if (sel) sel.value = perPage;
    _obrasPorPagina = parseInt(perPage);
  }
}

// ── Data Prevista sub-etapa (Documentações) ──────────────────────────────────
let _dpObraId = null, _dpEtapaId = null, _dpSubId = null;

function openDataPrevistaModal(obraId, etapaId, subId) {
  _dpObraId = obraId; _dpEtapaId = etapaId; _dpSubId = subId;
  const cfg = ETAPAS_CONFIG[etapaId];
  const subCfg = (cfg.subEtapas || []).find(s => s.id === subId);
  const obra = _obras.find(o => o.id === obraId);
  const sub = obra?.etapas?.[etapaId]?.subEtapas?.[subId];
  const titleEl = document.getElementById('dp-modal-title');
  if (titleEl) titleEl.textContent = `Data Prevista — ${subCfg?.nome || subId}`;
  const input = document.getElementById('dp-data-input');
  if (input) { input.value = sub?.dataPrevista || ''; }
  const modal = document.getElementById('dp-modal');
  if (modal) modal.style.display = 'flex';
}

function closeDataPrevistaModal() {
  const modal = document.getElementById('dp-modal');
  if (modal) modal.style.display = 'none';
  _dpObraId = _dpEtapaId = _dpSubId = null;
}

async function saveDataPrevista() {
  if (!podeEditarComercial()) { showComercialToast('Acesso somente leitura — você não pode alterar obras.', 'error'); return; }
  const data = document.getElementById('dp-data-input')?.value;
  if (!data) { showComercialToast('Selecione uma data.', 'error'); return; }
  // Modo COC
  if (document.getElementById('dp-modal')?.dataset?.cocMode === '1') {
    document.getElementById('dp-modal').dataset.cocMode = '';
    const obra4 = _obras.find(o => o.id === _cocActionObraId); if (!obra4) return;
    const etapas4 = JSON.parse(JSON.stringify(obra4.etapas));
    etapas4[_cocActionEtapaId].cocLista[_cocActionIdx].dataPrevista = data;
    await db.collection('obras').doc(_cocActionObraId).update({ etapas: etapas4 });
    closeDataPrevistaModal(); showComercialToast('Data prevista salva! ✅', 'success'); return;
  }
  if (!data) { showComercialToast('Selecione uma data.', 'error'); return; }
  const obra = _obras.find(o => o.id === _dpObraId); if (!obra) return;
  const etapas = JSON.parse(JSON.stringify(obra.etapas));
  if (etapas[_dpEtapaId]?.subEtapas?.[_dpSubId]) {
    etapas[_dpEtapaId].subEtapas[_dpSubId].dataPrevista = data;
  }
  await db.collection('obras').doc(_dpObraId).update({ etapas });
  showComercialToast('Data prevista salva! ✅', 'success');
  closeDataPrevistaModal();
}

document.addEventListener('DOMContentLoaded', _initComercialPage);
document.addEventListener('DOMContentLoaded', _initAcaoDelegate);