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
const FERIADOS_BR = ['01-01','04-21','05-01','09-07','10-12','11-02','11-15','11-20','12-25'];

function isDiaUtil(date) {
  const dow = date.getDay();
  if (dow === 0 || dow === 6) return false;
  const mmdd = `${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  return !FERIADOS_BR.includes(mmdd);
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
    id:'proposta', nome:'Proposta Consolidada', short:'Proposta', opcional:false, cor:'#3b82f6',
    subEtapas:[
      {id:'envio',      nome:'Envio',      dias:2,  refEtapa:null,       refSub:null,              isNovaDataZero:false, dateLivre:false},
      {id:'assinatura', nome:'Assinatura', dias:5,  refEtapa:'proposta', refSub:'envio',           isNovaDataZero:false, dateLivre:false},
    ]
  },
  contrato: {
    id:'contrato', nome:'Contrato', short:'Contrato', opcional:false, cor:'#8b5cf6',
    subEtapas:[
      {id:'em_analise', nome:'Em Análise', dias:0, refEtapa:null, refSub:null, isNovaDataZero:false, dateLivre:true, isAnalise:true},
      {id:'envio',      nome:'Envio',      dias:3,  refEtapa:'proposta', refSub:'assinatura',      isNovaDataZero:false, dateLivre:false},
      {id:'assinatura', nome:'Assinatura', dias:5,  refEtapa:'contrato', refSub:'envio',           isNovaDataZero:false, dateLivre:false},
    ]
  },
  documentacoes: {
    id:'documentacoes', nome:'Documentações', short:'Docs', opcional:false, cor:'#f97316',
    isIndependente:true,
    subEtapas:[
      {id:'coc',       nome:'COC',         dias:0, refEtapa:null, refSub:null, isNovaDataZero:false, dateLivre:true, isAnalise:true, isIndependente:true},
      {id:'art',       nome:'ART',         dias:0, refEtapa:null, refSub:null, isNovaDataZero:false, dateLivre:true, isAnalise:true, isIndependente:true},
      {id:'cno_sfobras',nome:'CNO/SFOBRAS', dias:0, refEtapa:null, refSub:null, isNovaDataZero:false, dateLivre:true, isAnalise:true, isIndependente:true},
      {id:'serasa',    nome:'Serasa',      dias:0, refEtapa:null, refSub:null, isNovaDataZero:false, dateLivre:true, isAnalise:true, isIndependente:true},
    ]
  },
  aditivos: {
    id:'aditivos', nome:'Aditivos / Termo', short:'Aditivos', opcional:true, cor:'#ec4899',
    isLista:true,
    subEtapasTemplate:[
      {id:'em_analise',              nome:'Em Análise',               isAnalise:true, dateLivre:true},
      {id:'comparativo_recebimento', nome:'Recebimento do Comparativo', isNovaDataZero:true, dateLivre:false, dias:0},
      {id:'carta_envio',             nome:'Envio da Carta Aditiva',    dias:2, dateLivre:false},
      {id:'carta_aprovacao',         nome:'Aprovação da Carta Aditiva',dias:3, dateLivre:false},
      {id:'termo_envio',             nome:'Envio do Termo Aditivo',    dias:3, dateLivre:false},
      {id:'termo_assinatura',        nome:'Assinatura do Termo Aditivo',dias:5, dateLivre:false},
    ]
  },
  medicao: {
    id:'medicao', nome:'Medição', short:'Medição', opcional:true, cor:'#6b7280',
    isLista:true,
    subEtapasTemplate:[
      {id:'em_analise', nome:'Em Análise', isAnalise:true, dateLivre:true},
      {id:'envio',      nome:'Envio',      dateLivre:true, dias:0},
      {id:'aprovacao',  nome:'Aprovação',  dias:2, dateLivre:false},
    ]
  },
};

const ETAPAS_ORDER = ['proposta','contrato','documentacoes','aditivos','medicao'];

const REPRESENTANTES = ['Verdile','Ricardo','Sebastião','Ângelo','Sérgio','Matheus','Henrique','Flávio','Gazzo'];


// ── Helper lista aditivos/medições ───────────────────────────────────────────
function criarItemLista(etapaId, titulo, dataPrevista) {
  const cfg = ETAPAS_CONFIG[etapaId];
  const subEtapas = {};
  (cfg.subEtapasTemplate||[]).forEach((sub,i) => {
    subEtapas[sub.id] = {status:i===0?'active':'pending', dataLimite:null, dataConclusao:null, motivoAtraso:null, revisoes:[], observacoes:[]};
  });
  return { id:`${etapaId}_${Date.now()}`, titulo, dataPrevista:dataPrevista||null, status:'active', subEtapas };
}


function _migrateObraToV3(obra) {
  const etapas = obra.etapas ? JSON.parse(JSON.stringify(obra.etapas)) : {};

  // 1. Renomear cno → documentacoes
  if (etapas['cno'] && !etapas['documentacoes']) {
    etapas['documentacoes'] = {
      status: etapas['cno'].status || 'pending',
      ativa:  etapas['cno'].ativa !== false,
      revisoes: etapas['cno'].revisoes || [],
      observacoes: etapas['cno'].observacoes || [],
      subEtapas: {
        coc:        {status:'pending',dataLimite:null,dataConclusao:null,motivoAtraso:null,revisoes:[],observacoes:[]},
        art:        {status:'pending',dataLimite:null,dataConclusao:null,motivoAtraso:null,revisoes:[],observacoes:[]},
        cno_sfobras:{status:'pending',dataLimite:null,dataConclusao:null,motivoAtraso:null,revisoes:[],observacoes:[]},
        serasa:     {status:'pending',dataLimite:null,dataConclusao:null,motivoAtraso:null,revisoes:[],observacoes:[]},
      }
    };
    delete etapas['cno'];
  }

  // 2. Converter aditivos de objeto para lista
  if (etapas['aditivos'] && !Array.isArray(etapas['aditivos']?.lista)) {
    const old = etapas['aditivos'];
    const lista = [];
    if (old.status && old.status !== 'pending') {
      lista.push({
        id: 'aditivo_1', titulo: 'Aditivo 1', dataPrevista: null,
        status: old.status,
        subEtapas: old.subEtapas || {},
      });
    }
    etapas['aditivos'] = { status: old.status||'pending', ativa: old.ativa||false, lista };
  }

  // 3. Converter medicao de objeto para lista
  if (etapas['medicao'] && !Array.isArray(etapas['medicao']?.lista)) {
    const old = etapas['medicao'];
    const lista = [];
    if (old.status && old.status !== 'pending') {
      lista.push({
        id: 'medicao_1', titulo: 'Medição 1', dataPrevista: null,
        status: old.status,
        subEtapas: old.subEtapas || {},
      });
    }
    etapas['medicao'] = { status: old.status||'pending', ativa: old.ativa||false, lista };
  }

  return { etapas };
}

// ── Init estrutura etapas ─────────────────────────────────────────────────────
function initObraEtapas(dataFechamento) {
  const etapas = {};
  ETAPAS_ORDER.forEach(etapaId => {
    const cfg   = ETAPAS_CONFIG[etapaId];
    const isFirst = etapaId === 'proposta';
    if (cfg.isLista) {
      etapas[etapaId] = { status:'pending', ativa:false, lista:[] };
      return;
    }
    etapas[etapaId] = { status: isFirst ? 'active' : 'pending', ativa: !cfg.opcional, subEtapas:{}, revisoes:[], observacoes:[] };
    const subs = cfg.subEtapas || [];
    subs.forEach((sub, idx) => {
      const isFirstSub = isFirst && idx === 0;
      etapas[etapaId].subEtapas[sub.id] = {
        status:        isFirstSub ? 'active' : 'pending',
        dataInicio:    isFirstSub ? dataFechamento : null,
        dataLimite:    isFirstSub && sub.dias ? addDiasUteis(dataFechamento, sub.dias) : null,
        dataConclusao: null,
        motivoAtraso:  null,
        revisoes:      [],
        observacoes:   [],
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
let _obras=[], _obraAtual=null, _filtroRep='', _filtroEtapa='', _unsubObras=null;
let _filtroDataDe='', _filtroDataAte='', _filtroEtapaAtraso='', _filtroBusca='';
let _ordenacao='recente';
let _filtroPeriodoDe='', _filtroPeriodoAte='';
let _filtroMinhasPendencias=false;
let _paginaAtual=0;
let _obrasPorPagina=parseInt(localStorage.getItem('comercial-per-page')||'12');

function setFiltroRep(val)     { _filtroRep=val;     _paginaAtual=0; renderObras(); }
function setFiltroEtapa(val)   { _filtroEtapa=val;   _paginaAtual=0; renderObras(); }
function setFiltroDataDe(val)  { _filtroDataDe=val;  _paginaAtual=0; renderObras(); }
function setFiltroDataAte(val)    { _filtroDataAte=val;      _paginaAtual=0; renderObras(); }
function setFiltroEtapaAtraso(val) { _filtroEtapaAtraso=val; _paginaAtual=0; renderObras(); }
function setFiltroBusca(val)       { _filtroBusca=val.toLowerCase().trim(); _paginaAtual=0; renderObras(); }
function setOrdenacao(val)         { _ordenacao=val; _paginaAtual=0; renderObras(); }
function setFiltroPeriodoDe(val)   { _filtroPeriodoDe=val; _paginaAtual=0; renderObras(); }
function setFiltroPeriodoAte(val)  { _filtroPeriodoAte=val; _paginaAtual=0; renderObras(); }
function setObrasPorPagina(val){ _obrasPorPagina=parseInt(val); localStorage.setItem('comercial-per-page',val); _paginaAtual=0; renderObras(); }
function irParaPagina(p)       { _paginaAtual=p; renderObras(); window.scrollTo({top:0,behavior:'smooth'}); }

// ── Migração automática de schema ─────────────────────────────────────────────
const SCHEMA_VERSION = 3;

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
        if (ver < 2) migrated = {...migrated, ..._migrateObraToV2(migrated)};
        if (ver < 3) migrated = {...migrated, ..._migrateObraToV3(migrated)};
        migrated._schemaVersion = SCHEMA_VERSION;
        await doc.ref.update(migrated);
      } catch(e) {
        console.warn(`[Migração] Erro na obra ${doc.id}:`, e);
      }
    }
    console.log(`[Migração] Concluída! ${toMigrate.length} obra(s) migrada(s).`);
  } catch(e) {
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
    || (obra.createdAt?.toDate ? obra.createdAt.toDate().toISOString().slice(0,10) : new Date().toISOString().slice(0,10));

  const novasEtapas = {};
  ETAPAS_ORDER.forEach((etapaId, idx) => {
    const cfg = ETAPAS_CONFIG[etapaId];
    const antigaEtapa = etapasAntigas[idx] || {};
    let etapaStatus = 'pending';
    if (idx < etapaAtualIdx)   etapaStatus = 'done';
    if (idx === etapaAtualIdx) etapaStatus = 'active';
    if (obra.concluida)        etapaStatus = 'done';
    const eraAtiva = idx <= etapaAtualIdx || obra.concluida;
    novasEtapas[etapaId] = {
      status:   etapaStatus,
      ativa:    cfg.opcional ? eraAtiva : true,
      revisoes: antigaEtapa.revisoes || [],
      subEtapas: {},
    };
    if (cfg.isLista) { novasEtapas[etapaId].lista = []; return; }
    (cfg.subEtapas||[]).forEach((sub, subIdx) => {
      let subStatus = 'pending';
      if (idx < etapaAtualIdx)   subStatus = 'done';
      if (idx === etapaAtualIdx) subStatus = subIdx === 0 ? 'active' : 'pending';
      if (obra.concluida)        subStatus = 'done';
      novasEtapas[etapaId].subEtapas[sub.id] = {
        status:        subStatus,
        dataLimite:    null,
        dataConclusao: subStatus === 'done' ? (antigaEtapa.dataConclusao || null) : null,
        motivoAtraso:  null,
        revisoes:      [],
      };
    });
  });

  // Não usar FieldValue.delete() para evitar erros — sobrescrever com undefined é suficiente
  return {
    _schemaVersion: SCHEMA_VERSION,
    etapas:         novasEtapas,
    dataFechamento: dataFechamento,
    numero:         String(obra.numero || obra.id?.slice(-6).toUpperCase() || '—'),
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
      try { renderObras(); highlightObraFromUrl(); } catch(e) {
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
        <span style="font-size:0.78rem;color:var(--muted);">Verifique as regras do Firestore para a coleção "obras" no projeto <strong>${e.code||'?'}</strong></span>
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
        try { renderObras(); } catch(e) { console.error('[renderObras snap]', e); }
        if (_obraAtual) {
          const obra = _obras.find(o => o.id === _obraAtual);
          if (obra) try { renderObraModal(obra); } catch(e) { console.error('[renderObraModal]', e); }
        }
      },
      err => console.error('[onSnapshot obras]', err)
    );
  } catch(e) {
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
    if (e?.ativa && e?.status === 'active') return id;
  }
  let ultimaDone = null;
  for (const id of ETAPAS_ORDER) {
    if (obra.etapas[id]?.status === 'done') ultimaDone = id;
  }
  if (obra.concluida) return 'concluida';
  return ultimaDone || 'proposta';
}

function getPrazoInfo(prazo) {
  if (!prazo) return {texto:'Sem prazo definido', cls:''};
  const d=new Date(prazo+'T12:00:00'), hoje=new Date(); hoje.setHours(0,0,0,0);
  const diff=Math.ceil((d-hoje)/(1000*60*60*24));
  const fmt=d.toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'});
  if (diff<0)  return {texto:`Vencido em ${fmt}`, cls:'vencido'};
  if (diff<=3) return {texto:`Vencendo em ${diff} dia${diff!==1?'s':''}`, cls:'urgente'};
  return {texto:`Prazo: ${fmt}`, cls:''};
}


function hasEtapaAtrasadaPorId(obra, etapaId) {
  if (!obra.etapas) return false;
  const hoje = new Date().toISOString().slice(0, 10);
  const e = obra.etapas[etapaId];
  if (!e?.ativa) return false;
  if (Array.isArray(e.lista)) {
    return e.lista.some(item => Object.values(item.subEtapas||{}).some(
      sub => sub.status!=='done' && sub.dataLimite && sub.dataLimite < hoje));
  }
  return Object.values(e.subEtapas || {}).some(
    sub => sub.status !== 'done' && sub.dataLimite && sub.dataLimite < hoje);
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
          if (sub.status !== 'done' && sub.dataLimite && sub.dataLimite < hoje) return true;
        }
      }
    } else {
      for (const sub of Object.values(e.subEtapas || {})) {
        if (sub.status !== 'done' && sub.dataLimite && sub.dataLimite < hoje) return true;
      }
    }
  }
  return false;
}

// ── Renderizar cards ──────────────────────────────────────────────────────────
function renderObras() {
  const el = document.getElementById('obras-grid');
  if (!el) return;

  // Aplicar filtros
  let lista = [..._obras];
  if (_filtroRep)     lista = lista.filter(o => o.representante===_filtroRep);
  if (_filtroEtapa)   lista = lista.filter(o => getEtapaAtualId(o)===_filtroEtapa);
  if (_filtroDataDe)      lista = lista.filter(o => o.dataFechamento && o.dataFechamento >= _filtroDataDe);
  if (_filtroDataAte)     lista = lista.filter(o => o.dataFechamento && o.dataFechamento <= _filtroDataAte);
  if (_filtroEtapaAtraso) lista = lista.filter(o => hasEtapaAtrasadaPorId(o, _filtroEtapaAtraso));
  // Ordenação
  if (_ordenacao === 'num-asc')  lista = [...lista].sort((a,b) => (parseInt(a.numero)||0)-(parseInt(b.numero)||0));
  if (_ordenacao === 'num-desc') lista = [...lista].sort((a,b) => (parseInt(b.numero)||0)-(parseInt(a.numero)||0));
  // Filtro por período — obras com sub-etapas pendentes com dataLimite no intervalo
  if (_filtroPeriodoDe || _filtroPeriodoAte) {
    lista = lista.filter(obra => {
      if (obra.concluida) return false;
      return ETAPAS_ORDER.some(etapaId => {
        const e   = obra.etapas?.[etapaId];
        const cfg = ETAPAS_CONFIG[etapaId];
        if (!e?.ativa) return false;
        const checkSub = sub => {
          if (sub.status==='done'||!sub.dataLimite) return false;
          if (_filtroPeriodoDe && sub.dataLimite < _filtroPeriodoDe) return false;
          if (_filtroPeriodoAte && sub.dataLimite > _filtroPeriodoAte) return false;
          return true;
        };
        if (cfg.isLista) return (e.lista||[]).some(item=>Object.values(item.subEtapas||{}).some(checkSub));
        return Object.values(e.subEtapas||{}).some(checkSub);
      });
    });
  }
  if (_filtroMinhasPendencias) {
    lista = lista.filter(obra => {
      if (obra.concluida) return false;
      return ETAPAS_ORDER.some(etapaId => {
        const e=obra.etapas?.[etapaId];const cfg=ETAPAS_CONFIG[etapaId]; if(!e?.ativa) return false;
        if(cfg.isLista) return (e.lista||[]).some(item=>Object.values(item.subEtapas||{}).some(s=>s.status!=='done'&&s.responsavel===currentUser.username));
        return Object.values(e.subEtapas||{}).some(sub=>sub.status!=='done'&&sub.responsavel===currentUser.username);
      });
    });
  }
  if (_filtroBusca)      lista = lista.filter(o =>
    String(o.numero||'').toLowerCase().includes(_filtroBusca) ||
    (o.nome||'').toLowerCase().includes(_filtroBusca) ||
    (o.representante||'').toLowerCase().includes(_filtroBusca));

  const total      = lista.length;
  const totalPags  = Math.max(1, Math.ceil(total / _obrasPorPagina));
  _paginaAtual     = Math.min(_paginaAtual, totalPags - 1);
  const inicio     = _paginaAtual * _obrasPorPagina;
  const paginada   = lista.slice(inicio, inicio + _obrasPorPagina);

  // Atualizar contador
  const counter = document.getElementById('obras-counter');
  if (counter) counter.textContent = `${total} obra${total!==1?'s':''}`;

  if (!total) {
    el.innerHTML=`<div class="obras-empty">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect width="20" height="14" x="2" y="7" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
      <h3>${_filtroRep||_filtroEtapa||_filtroDataDe||_filtroDataAte?'Nenhuma obra com esses filtros':'Nenhuma obra cadastrada'}</h3>
      <span style="font-size:0.78rem;">Clique em "+ Nova Obra" para começar</span>
    </div>`;
    _renderPaginacao(0, 0, 0);
    return;
  }

  el.innerHTML = paginada.map(obra => {
    const etapaId   = getEtapaAtualId(obra);
    const cfg       = ETAPAS_CONFIG[etapaId];
    const cor       = obra.concluida ? '#22c55e' : cfg?.cor || 'var(--muted)';
    const etapaNome = obra.concluida ? 'Concluída' : (cfg?.short || '—');
    const prazoInfo = obra.concluida
      ? { texto: obra.dataConclusao
            ? `Concluída em ${new Date(obra.dataConclusao+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'})}`
            : 'Concluída', cls: 'concluida' }
      : getPrazoInfo(obra.prazoEstimado);
    const hoje2 = new Date().toISOString().slice(0, 10);

    // Stripe: semáforo de prazo (vermelho > amarelo > azul > verde)
    let corBorda = '#3b82f6'; // azul padrão
    if (obra.concluida) {
      corBorda = '#22c55e'; // verde — concluída
    } else {
      // Vermelho: sub-etapa atrasada OU prazo geral vencido
      const temAtrasada = hasSubEtapaAtrasada(obra);
      const prazoVencido = obra.prazoEstimado && obra.prazoEstimado < hoje2;
      if (temAtrasada || prazoVencido) {
        corBorda = '#ef4444';
      } else {
        // Amarelo: prazo geral vencendo em ≤3 dias
        if (obra.prazoEstimado) {
          const d    = new Date(obra.prazoEstimado + 'T12:00:00');
          const agora= new Date(); agora.setHours(0,0,0,0);
          const diff = Math.ceil((d - agora) / (1000*60*60*24));
          if (diff <= 3) corBorda = '#f59e0b';
        }
      }
    }

    // Linhas de status por etapa
    const etapaLinhas = ETAPAS_ORDER.map(id => {
      const cfg2  = ETAPAS_CONFIG[id];
      const eData = obra.etapas?.[id];
      if (!eData?.ativa) return `
        <div class="card-etapa-row inativa">
          <span class="card-etapa-dot" style="background:var(--surface3);border-color:var(--border2);">·</span>
          <span class="card-etapa-nome">${cfg2.short}</span>
          <span class="card-etapa-info">—</span>
        </div>`;
      const eStatus = eData.status || 'pending';
      let dot='', dotStyle='', info='';
      // Lista (aditivos/medicao)
      if (cfg2.isLista) {
        const lista = eData.lista || [];
        const total = lista.length;
        const done  = lista.filter(i=>i.status==='done').length;
        if (!eData.ativa || eStatus==='pulada') {
          dot='⏭'; dotStyle='background:var(--surface3);border-color:var(--border2);color:var(--muted);';
          info='<span style="font-size:0.65rem;color:var(--muted);">Pulada</span>';
        } else if (obra.concluida || eStatus==='done') {
          dot='✓'; dotStyle='background:#22c55e;border-color:#22c55e;color:#fff;';
          info=`<span style="color:#22c55e;font-size:0.65rem;">${done}/${total} concluídos</span>`;
        } else if (total===0) {
          dot='·'; dotStyle='background:var(--surface3);border-color:var(--border2);color:var(--muted);';
          info='<span style="font-size:0.65rem;color:var(--muted);">Não iniciado</span>';
        } else {
          dot='›'; dotStyle=`background:${cfg2.cor};border-color:${cfg2.cor};color:#fff;`;
          info=`<span style="font-family:var(--font-mono);font-size:0.65rem;color:var(--muted);">${done}/${total} concluídos</span>`;
        }
        return `<div class="card-etapa-row">
          <span class="card-etapa-dot" style="${dotStyle}">${dot}</span>
          <span class="card-etapa-nome">${cfg2.short}</span>
          ${info}
        </div>`;
      }
      // Documentações independentes
      if (cfg2.isIndependente) {
        const subs = Object.values(eData.subEtapas||{});
        const done = subs.filter(s=>s.status==='done').length;
        const atras = subs.some(s=>s.status!=='done'&&s.dataLimite&&s.dataLimite<hoje2);
        if (obra.concluida || eStatus==='done') {
          dot='✓'; dotStyle='background:#22c55e;border-color:#22c55e;color:#fff;';
          info=`<span style="color:#22c55e;font-size:0.65rem;">${done}/${subs.length} concluídas</span>`;
        } else if (atras) {
          dot='!'; dotStyle='background:#ef4444;border-color:#ef4444;color:#fff;';
          info=`<span style="color:#ef4444;font-size:0.65rem;font-weight:700;">⚠ Atrasada</span>`;
        } else {
          dot='›'; dotStyle=`background:${cfg2.cor};border-color:${cfg2.cor};color:#fff;`;
          info=`<span style="font-size:0.65rem;color:var(--muted);">${done}/${subs.length} concluídas</span>`;
        }
        return `<div class="card-etapa-row">
          <span class="card-etapa-dot" style="${dotStyle}">${dot}</span>
          <span class="card-etapa-nome">${cfg2.short}</span>
          ${info}
        </div>`;
      }
      // Sub-etapas normais
      const subs    = Object.values(eData.subEtapas || {});
      const atras   = subs.some(s=>s.status!=='done'&&s.dataLimite&&s.dataLimite<hoje2);
      const ultima  = subs.findLast?.(s=>s.status==='active')||subs.find(s=>s.status==='active');
      const limite  = ultima?.dataLimite;
      const concl   = eData.status==='done'?subs.findLast?.(s=>s.dataConclusao)?.dataConclusao:null;
      if (obra.concluida||eStatus==='done') {
        dot='✓'; dotStyle='background:#22c55e;border-color:#22c55e;color:#fff;';
        info=concl?`<span style="color:#22c55e;font-family:var(--font-mono);font-size:0.65rem;">✓ ${new Date(concl+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})}</span>`:'<span style="color:#22c55e;font-size:0.68rem;">Concluída</span>';
      } else if (atras) {
        dot='!'; dotStyle='background:#ef4444;border-color:#ef4444;color:#fff;';
        const lFmt=limite?new Date(limite+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short'}):'?';
        info=`<span style="color:#ef4444;font-family:var(--font-mono);font-size:0.65rem;font-weight:700;">⚠ ${lFmt}</span>`;
      } else if (eStatus==='active') {
        dot='›'; dotStyle=`background:${cfg2.cor};border-color:${cfg2.cor};color:#fff;`;
        info=limite?`<span style="font-family:var(--font-mono);font-size:0.65rem;color:var(--muted);">${new Date(limite+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})}</span>`:'<span style="font-size:0.65rem;color:var(--muted);">Em andamento</span>';
      } else {
        dot='·'; dotStyle='background:var(--surface3);border-color:var(--border2);color:var(--muted);';
        info='<span style="font-size:0.65rem;color:var(--muted);">Pendente</span>';
      }
      return `<div class="card-etapa-row">
          <span class="card-etapa-dot" style="${dotStyle}">${dot}</span>
          <span class="card-etapa-nome">${cfg2.short}</span>
          ${info}
        </div>`;
    }).join('');

    return `
    <div class="obra-card" data-obra-id="${obra.id}" style="border-left:4px solid ${corBorda};" onclick="openObraModal('${obra.id}')">
      <div class="obra-card-header">
        <div>
          <div class="obra-card-numero">#${obra.numero||obra.id.slice(-6).toUpperCase()}</div>
          <div class="obra-card-nome">${obra.nome}</div>
        </div>
        ${obra.concluida?'<span class="obra-etapa-badge etapa-concluida">Concluída</span>':''}
      </div>
      ${(() => {
        const n = contarMinhasPendencias(obra);
        return n > 0 ? `
          <div style="position:absolute;top:-6px;right:-6px;background:var(--accent);color:#fff;font-size:0.62rem;font-family:var(--font-mono);font-weight:700;min-width:18px;height:18px;border-radius:9px;display:flex;align-items:center;justify-content:center;padding:0 4px;box-shadow:0 2px 6px #00000030;z-index:2;">
            ${n}
          </div>` : '';
      })()}
      ${(() => {
        const n = contarMinhasPendencias(obra);
        return n > 0 ? `<div style="font-size:0.65rem;color:var(--accent);font-weight:700;margin-bottom:0.2rem;display:flex;align-items:center;gap:0.3rem;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ${n} pendência${n>1?'s':''} atribuída${n>1?'s':''} a você</div>` : '';
      })()}
      <div class="obra-card-rep" style="justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:0.35rem;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span style="color:var(--muted);margin-right:0.2rem;">Representante:</span>${obra.representante||'—'}
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

  if (total === 0) { el.style.display='none'; return; }
  el.style.display = 'flex';

  const fim = Math.min(inicio + _obrasPorPagina, total);

  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:0.5rem;font-size:0.78rem;color:var(--muted);">
      Mostrando <strong style="color:var(--text);">${inicio+1}–${fim}</strong> de <strong style="color:var(--text);">${total}</strong> obras
    </div>
    <div style="display:flex;align-items:center;gap:0.4rem;">
      <button class="pag-btn" onclick="irParaPagina(0)" ${_paginaAtual===0?'disabled':''} title="Primeira">«</button>
      <button class="pag-btn" onclick="irParaPagina(${_paginaAtual-1})" ${_paginaAtual===0?'disabled':''} title="Anterior">‹</button>
      ${Array.from({length:totalPags},(_,i)=>i).filter(i=>Math.abs(i-_paginaAtual)<=2).map(i=>`
        <button class="pag-btn${i===_paginaAtual?' active':''}" onclick="irParaPagina(${i})">${i+1}</button>
      `).join('')}
      <button class="pag-btn" onclick="irParaPagina(${_paginaAtual+1})" ${_paginaAtual>=totalPags-1?'disabled':''} title="Próxima">›</button>
      <button class="pag-btn" onclick="irParaPagina(${totalPags-1})" ${_paginaAtual>=totalPags-1?'disabled':''} title="Última">»</button>
    </div>`;
}

// ── Modal nova obra ───────────────────────────────────────────────────────────
function openNovaObraModal()  { document.getElementById('nova-obra-modal').style.display='flex'; document.body.style.overflow='hidden'; }
function closeNovaObraModal() { document.getElementById('nova-obra-modal').style.display='none'; document.body.style.overflow=''; document.getElementById('nova-obra-form').reset(); }

async function saveNovaObra() {
  const numero=document.getElementById('nova-obra-numero')?.value.trim();
  const nome=document.getElementById('nova-obra-nome')?.value.trim();
  const rep=document.getElementById('nova-obra-rep')?.value;
  const fechamento=document.getElementById('nova-obra-fechamento')?.value;
  const prazo=document.getElementById('nova-obra-prazo')?.value;
  const obs=document.getElementById('nova-obra-obs')?.value.trim();
  if (!numero)     {showComercialToast('Informe o número da obra.','error');return;}
  if (!nome)       {showComercialToast('Informe o nome da obra.','error');return;}
  if (!rep)        {showComercialToast('Selecione o representante.','error');return;}
  if (!fechamento) {showComercialToast('Informe a data de fechamento.','error');return;}
  if (!prazo)       {showComercialToast('Informe o prazo estimado de finalização.','error');return;}
  const btn=document.getElementById('btn-save-nova-obra');
  if(btn){btn.disabled=true;btn.textContent='Salvando...';}
  try {
    const etapas = initObraEtapas(fechamento);
    await db.collection('obras').add({
      numero, nome, representante:rep, dataFechamento:fechamento,
      prazoEstimado:prazo||null, obs:obs||'', concluida:false, etapas,
      createdAt:firebase.firestore.FieldValue.serverTimestamp(), createdBy:currentUser.username,
    });
    showComercialToast(`Obra #${numero} cadastrada! ✅`,'success');
    closeNovaObraModal();
  } catch(e) {showComercialToast('Erro ao salvar.','error');console.error(e);}
  finally {if(btn){btn.disabled=false;btn.textContent='Cadastrar Obra';}}
}

// ── Modal detalhes ────────────────────────────────────────────────────────────
function openObraModal(obraId) {
  const obra=_obras.find(o=>o.id===obraId); if(!obra) return;
  _obraAtual=obraId; renderObraModal(obra);
  document.getElementById('obra-modal-overlay').style.display='flex';
  document.body.style.overflow='hidden';
}
function closeObraModal() {
  document.getElementById('obra-modal-overlay').style.display='none';
  document.body.style.overflow=''; _obraAtual=null;
}

function renderObraModal(obra) {
  document.getElementById('obra-modal-numero').textContent=`#${obra.numero||obra.id.slice(-6).toUpperCase()}`;
  document.getElementById('obra-modal-nome').textContent=obra.nome;
  const prazoInfo=getPrazoInfo(obra.prazoEstimado);
  const canAdmin=currentUser?.isSuperAdmin||
    (currentUser?.acessos||[]).includes('adminComercial');
  document.getElementById('obra-modal-meta').innerHTML=`
    <span>👤 ${obra.representante||'—'}</span>
    <span>📅 Fechamento: ${obra.dataFechamento?new Date(obra.dataFechamento+'T12:00:00').toLocaleDateString('pt-BR'):'—'}</span>
    <span class="${prazoInfo.cls}">⏱ ${prazoInfo.texto}</span>`;
  const tl=document.getElementById('obra-timeline'); if(!tl) return;
  const hoje=new Date().toISOString().slice(0,10);
  tl.innerHTML=ETAPAS_ORDER.map(etapaId => {
    const cfg=ETAPAS_CONFIG[etapaId];
    const eData=obra.etapas?.[etapaId];
    // ── Etapa pulada ou inativa: mostrar antes de qualquer outro check ──────
    if (!eData?.ativa || eData?.status === 'pulada') {
      const isPulada = eData?.status === 'pulada';
      const canIniciarX = !obra.concluida;
      return `<div class="etapa-item">
        <div class="etapa-icon pending" style="${isPulada?'opacity:0.5;':'opacity:0.4;'}">⏭</div>
        <div class="etapa-content">
          <div class="etapa-nome" style="opacity:${isPulada?'0.7':'0.6'};">
            ${cfg.nome}
            ${isPulada?`<span style="font-size:0.65rem;font-weight:700;color:#6b7280;background:var(--surface3);padding:0.1rem 0.4rem;border-radius:4px;margin-left:0.25rem;">Pulada</span>`:'<span style="font-size:0.65rem;font-weight:400;color:var(--muted);">(opcional)</span>'}
            ${canIniciarX?`<button class="sub-action-btn concluir" style="font-size:0.68rem;padding:0.15rem 0.5rem;" onclick="iniciarEtapa('${obra.id}','${etapaId}')">▶ Iniciar</button>`:''}
          </div>
          ${isPulada&&eData.puladaPor?`<div style="font-size:0.68rem;color:var(--muted);font-family:var(--font-mono);margin-top:0.2rem;">Pulada por ${eData.puladaPor}</div>`:''}
        </div>
      </div>`;
    }
    // ── Etapas com lista (aditivos/medicao)
    if (cfg.isLista) {
      const eActive = eData?.ativa;
      const eStatus = eData?.status || 'pending';
      const cor2 = cfg.cor;
      const listaIconCls = eStatus==='done'?'done':eStatus==='active'?'active':'pending';
      const listaIconStyle = eStatus==='active'?`style="background:${cor2};border-color:${cor2};"`:eStatus==='done'?`style="background:${cor2};border-color:${cor2};"` :'';
      return `<div class="etapa-item">
        <div class="etapa-icon ${listaIconCls}" ${listaIconStyle}>${eStatus==='done'?'✓':''}</div>
        <div class="etapa-content">
          <div class="etapa-nome" style="${eStatus==='active'?`color:${cor2};`:''}">
            ${cfg.nome}
            ${cfg.opcional?'<span style="font-size:0.65rem;font-weight:400;color:var(--muted);">(opcional)</span>':''}
            ${!obra.concluida&&eStatus!=='done'?`<button class="sub-action-btn motivo" style="font-size:0.68rem;padding:0.2rem 0.55rem;" onclick="pularEtapa('${obra.id}','${etapaId}')">⏭ Pular</button>`:''}
          </div>
          <div>${renderListaEtapa(obra, etapaId, hoje)}</div>
        </div>
      </div>`;
    }

    const etapaStatus=eData.status||'pending';
    const cor=cfg.cor;
    const subsHtml=cfg.subEtapas.map(subCfg => {
      const subData=eData.subEtapas?.[subCfg.id]||{};
      const subStatus=subData.status||'pending';
      const limite=subData.dataLimite;
      const atrasada=subStatus!=='done'&&limite&&limite<hoje;
      const isIndependenteSub = subCfg.isIndependente || cfg.isIndependente;
      const canConcluir = (subStatus==='active' || (isIndependenteSub && subStatus==='pending')) && !obra.concluida;
      const canIniciarSub = isIndependenteSub && subStatus==='pending' && !obra.concluida;
      const canMotivo=atrasada&&!subData.motivoAtraso;
      const canRevisaoSub=subStatus!=='pending'&&!obra.concluida;
      const canProrrogar=subStatus==='active'&&!obra.concluida;
      const subRevisoes=(subData.revisoes||[]);

      // Badge responsável na sub-etapa
      const respBadge = subData.responsavel
        ? subData.responsavel===currentUser?.username
          ? `<span style="display:inline-flex;align-items:center;gap:0.25rem;background:color-mix(in srgb,var(--accent) 12%,transparent);color:var(--accent);border:1px solid color-mix(in srgb,var(--accent) 30%,transparent);border-radius:5px;font-size:0.62rem;font-weight:700;padding:0.1rem 0.45rem;font-family:var(--font-mono);"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> Você</span>`
          : `<span style="display:inline-flex;align-items:center;gap:0.25rem;background:var(--surface2);color:var(--muted);border:1px solid var(--border2);border-radius:5px;font-size:0.62rem;font-weight:600;padding:0.1rem 0.45rem;font-family:var(--font-mono);"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> ${subData.responsavel}</span>`
        : '';

      let dataInfo='';
      // Sub-etapa Em Análise: mostrar "A X dias nessa sub-etapa"
      if (subCfg.isAnalise && subStatus==='active' && subData.dataInicio) {
        const ini  = new Date(subData.dataInicio+'T12:00:00');
        const agora= new Date(); agora.setHours(0,0,0,0);
        const dias = Math.floor((agora-ini)/(1000*60*60*24));
        const prevStr = subData.dataPrevista ? new Date(subData.dataPrevista+'T12:00:00').toLocaleDateString('pt-BR') : '';
        dataInfo=`<span class="sub-data" style="color:#8b5cf6;font-weight:700;display:flex;align-items:center;gap:0.4rem;">
          🕐 A ${dias} dia${dias!==1?'s':''} nesta sub-etapa
          ${prevStr?`<span style="font-size:0.65rem;color:var(--muted);font-weight:400;">· Previsto: ${prevStr}</span>`:''}
        </span>`;
      } else if (subData.dataConclusao) {
        const por  = subData.concluidoPor ? ` — por ${subData.concluidoPor}` : '';
        const tipo = subData.tipoConclusao ? ` · <strong>${subData.tipoConclusao}</strong>` : '';
        dataInfo=`<span class="sub-data concluida">✓ ${new Date(subData.dataConclusao+'T12:00:00').toLocaleDateString('pt-BR')}${por}${tipo}</span>`;
      } else if (limite) {
        const limFmt=new Date(limite+'T12:00:00').toLocaleDateString('pt-BR');
        dataInfo=atrasada?`<span class="sub-data atrasada">⚠ Limite: ${limFmt}</span>`:`<span class="sub-data">Limite: ${limFmt}</span>`;
      } else if (subCfg.dateLivre||subCfg.isNovaDataZero) {
        dataInfo=`<span class="sub-data" style="color:var(--muted);">Data livre</span>`;
      }
      const statusIcon=subStatus==='done'?'✓':atrasada?'!':subStatus==='active'?'›':'·';
      const iconCls=subStatus==='done'?'done':atrasada?'atrasada':subStatus==='active'?'active':'pending';
      const motivoBadge=subData.motivoAtraso?`<div class="sub-motivo-atraso">📌 ${subData.motivoAtraso}</div>`:'';

      // Revisões da sub-etapa
      const subRevHtml=subRevisoes.length?`<div class="sub-revisoes">
        ${subRevisoes.map(r=>`<div class="sub-revisao-item">
          <span class="etapa-revisao-badge">REV.${r.numero}</span>
          <div class="etapa-revisao-info">
            <div class="etapa-revisao-motivo">${r.motivo}</div>
            <div class="etapa-revisao-data">${r.data?new Date(r.data+'T12:00:00').toLocaleDateString('pt-BR'):'—'} — por ${r.por||'—'}</div>
          </div>
        </div>`).join('')}
      </div>`:'';

      const dropId=`acao-sub-${etapaId}-${subCfg.id}`;
      const resp=subData.responsavel||'';
      const _menuItems=[
        canConcluir?`<button class="acao-item concluir" data-action="concluir" data-obra="${obra.id}" data-etapa="${etapaId}" data-sub="${subCfg.id}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Concluir</button>`:'',
        canIniciarSub?`<button class="acao-item concluir" data-action="iniciar-sub" data-obra="${obra.id}" data-etapa="${etapaId}" data-sub="${subCfg.id}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg> Iniciar</button>`:'',
        canRevisaoSub?`<button class="acao-item revisao" data-action="revisao" data-obra="${obra.id}" data-etapa="${etapaId}" data-sub="${subCfg.id}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.2"/></svg> Revisão${subRevisoes.length?' ('+subRevisoes.length+')':''}</button>`:'',
        canProrrogar?`<button class="acao-item" data-action="prorrogar" data-obra="${obra.id}" data-etapa="${etapaId}" data-sub="${subCfg.id}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Prorrogar</button>`:'',
        `<button class="acao-item" data-action="atribuir" data-obra="${obra.id}" data-etapa="${etapaId}" data-sub="${subCfg.id}" data-resp="${resp}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> ${resp||'Atribuir'}</button>`,
        `<button class="acao-item" data-action="obs" data-obra="${obra.id}" data-etapa="${etapaId}" data-sub="${subCfg.id}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Observações</button>`,
        subCfg.isAnalise&&subStatus!=='done'?`<button class="acao-item" data-action="dataprevista" data-obra="${obra.id}" data-etapa="${etapaId}" data-sub="${subCfg.id}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> Data Prevista</button>`:'',
        canMotivo?`<button class="acao-item" data-action="motivo" data-obra="${obra.id}" data-etapa="${etapaId}" data-sub="${subCfg.id}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/></svg> Registrar motivo</button>`:'',
      ].filter(Boolean).join('');
      const actions = (subStatus==='done'&&!isIndependenteSub)||obra.concluida ? '' : `<div style="position:relative;display:inline-block;"><button class="sub-action-btn" data-dropdown="${dropId}" style="font-size:0.68rem;padding:0.2rem 0.55rem;background:var(--surface2);border-color:var(--border2);color:var(--text);display:inline-flex;align-items:center;gap:0.25rem;">Ações<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></button><div id="${dropId}" class="acao-dropdown-menu" style="display:none;position:absolute;right:0;top:calc(100% + 4px);z-index:300;background:var(--surface);border:1px solid var(--border2);border-radius:8px;box-shadow:0 8px 24px #00000022;min-width:165px;overflow:hidden;">${_menuItems}</div></div>`;
      return `<div class="sub-etapa-item">
        <div class="sub-etapa-icon ${iconCls}" ${iconCls==='active'?`style="background:${cor};border-color:${cor};"`:iconCls==='atrasada'?'style="background:#ef4444;border-color:#ef4444;"':''}>${statusIcon}</div>
        <div class="sub-etapa-content">
          <div class="sub-etapa-nome">${subCfg.nome}${atrasada?' <span class="sub-atraso-label">ATRASADO</span>':''}${respBadge}</div>
          <div class="sub-etapa-meta">${dataInfo}</div>
          ${motivoBadge}
          ${subRevHtml}
          ${actions?`<div class="sub-etapa-actions">${actions}</div>`:''}
        </div>
      </div>`;
    }).join('');
    const etapaIconCls=etapaStatus==='done'?'done':etapaStatus==='active'?'active':'pending';
    const etapaIconStyle=etapaStatus==='active'?`style="background:${cor};border-color:${cor};"`:etapaStatus==='done'?`style="background:${cor};border-color:${cor};"` :'';
    const canRevisao=etapaStatus!=='pending'&&!obra.concluida;
    const canIniciar=etapaStatus==='pending'&&!obra.concluida;
    return `<div class="etapa-item">
      <div class="etapa-icon ${etapaIconCls}" ${etapaIconStyle}>${etapaStatus==='done'?'✓':''}</div>
      <div class="etapa-content">
        <div class="etapa-nome" style="${etapaStatus==='active'?`color:${cor};`:''}" title="${(eData.observacoes||[]).length} observação(ões)">
          ${cfg.nome}
          ${cfg.opcional?'<span style="font-size:0.65rem;font-weight:400;color:var(--muted);">(opcional)</span>':''}
          ${canIniciar?`<button class="sub-action-btn concluir" style="font-size:0.68rem;padding:0.2rem 0.55rem;" onclick="iniciarEtapa('${obra.id}','${etapaId}')">▶ Iniciar</button>`:''}
          ${!obra.concluida&&etapaStatus!=='done'?`
            <div style="position:relative;display:inline-block;">
              <button class="sub-action-btn" data-dropdown="acao-etapa-${etapaId}"
                style="font-size:0.68rem;padding:0.2rem 0.55rem;background:var(--surface2);border-color:var(--border2);color:var(--text);display:inline-flex;align-items:center;gap:0.25rem;">
                Ações<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <div id="acao-etapa-${etapaId}" class="acao-dropdown-menu" style="display:none;position:absolute;left:0;top:calc(100% + 4px);z-index:300;background:var(--surface);border:1px solid var(--border2);border-radius:8px;box-shadow:0 8px 24px #00000022;min-width:155px;overflow:hidden;">
                ${canRevisao?`<button class="acao-item revisao" data-action="revisao-etapa" data-obra="${obra.id}" data-etapa="${etapaId}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.2"/></svg> Revisão</button>`:''}
                <button class="acao-item" data-action="obs-etapa" data-obra="${obra.id}" data-etapa="${etapaId}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Observações</button>
                <button class="acao-item" data-action="pular-etapa" data-obra="${obra.id}" data-etapa="${etapaId}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg> Pular</button>
              </div>
            </div>`:''}
        </div>
        ${(eData.revisoes||[]).length?`<div class="etapa-revisoes">${(eData.revisoes||[]).map((r,ri)=>`
          <div class="etapa-revisao-item">
            <span class="etapa-revisao-badge">REV.${ri+1}</span>
            <div class="etapa-revisao-info">
              <div class="etapa-revisao-motivo">${r.motivo}</div>
              <div class="etapa-revisao-data">${r.data?new Date(r.data+'T12:00:00').toLocaleDateString('pt-BR'):'—'} — por ${r.por||'—'}</div>
            </div>
          </div>`).join('')}</div>`:''}
        <div class="sub-etapas-container">${subsHtml}</div>
      </div>
    </div>`;
  }).join('');
  _renderObraFooter(obra, canAdmin);

}

function _renderObraFooter(obra, canAdmin) {
  const footer=document.getElementById('obra-modal-footer'); if(!footer) return;
  const adminBtns=canAdmin&&!obra.concluida?`
    <button class="btn-secondary" onclick="openEditarObraModal('${obra.id}')" style="display:flex;align-items:center;gap:0.4rem;">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Editar
    </button>
    <button class="btn-secondary" onclick="excluirObra('${obra.id}')" style="display:flex;align-items:center;gap:0.4rem;color:#ef4444;border-color:#ef4444;">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg> Excluir
    </button>`:'';
  const _histNovo = _historicoTemNovos(obra);
  const histBtn=`<button class="btn-secondary" onclick="openHistoricoModal('${obra.id}')" style="display:flex;align-items:center;gap:0.4rem;position:relative;">
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
    Histórico
    ${_histNovo?`<span style="position:absolute;top:-5px;right:-5px;width:12px;height:12px;background:#ef4444;border-radius:50%;border:2px solid var(--surface);box-shadow:0 0 0 1px #ef4444;"></span>`:''}
  </button>`;
  if (obra.concluida) {
    footer.innerHTML=`
      <div style="display:flex;gap:0.6rem;flex:1;flex-wrap:wrap;">${adminBtns}
        ${canAdmin?`<button class="btn-secondary" onclick="reabrirObra('${obra.id}')" style="display:flex;align-items:center;gap:0.4rem;">↩ Reabrir</button>`:''}
        ${histBtn}
      </div>
      <div style="display:flex;gap:0.6rem;align-items:center;">
        <span style="font-size:0.78rem;color:var(--muted);">✅ Obra concluída</span>
        <button class="btn-secondary" onclick="closeObraModal()">Fechar</button>
      </div>`;
  } else {
    footer.innerHTML=`
      <div style="display:flex;gap:0.6rem;flex:1;flex-wrap:wrap;">${adminBtns}${histBtn}</div>
      <button class="btn-secondary" onclick="closeObraModal()">Fechar</button>`;
  }
}


// ── Iniciar sub-etapa independente (Documentações) ───────────────────────────
async function iniciarSubEtapa(obraId, etapaId, subId) {
  const obra=_obras.find(o=>o.id===obraId); if(!obra) return;
  const etapas=JSON.parse(JSON.stringify(obra.etapas));
  const sub=etapas[etapaId].subEtapas[subId]; if(!sub) return;
  sub.status='active';
  sub.dataInicio=new Date().toISOString().slice(0,10);
  await db.collection('obras').doc(obraId).update({etapas});
  showComercialToast('Sub-etapa iniciada! ✅','success');
}


let _addItemEtapaId=null, _addItemObraId=null;

function openAddItemModal(obraId, etapaId) {
  _addItemObraId=obraId; _addItemEtapaId=etapaId;
  const cfg=ETAPAS_CONFIG[etapaId];
  const obra=_obras.find(o=>o.id===obraId);
  const n=(obra?.etapas?.[etapaId]?.lista?.length||0)+1;
  const label=cfg.nome==='Aditivos / Termo'?'Aditivo':'Medição';
  document.getElementById('add-item-title').textContent=`Adicionar ${label}`;
  document.getElementById('add-item-nome').value=`${label} ${n}`;
  document.getElementById('add-item-data').value='';
  document.getElementById('add-item-modal').style.display='flex';
}
function closeAddItemModal() {
  document.getElementById('add-item-modal').style.display='none';
  _addItemObraId=_addItemEtapaId=null;
}
async function saveAddItem() {
  const titulo=document.getElementById('add-item-nome')?.value.trim();
  if(!titulo){showComercialToast('Informe o título.','error');return;}
  const dataPrevista=document.getElementById('add-item-data')?.value||null;
  const obra=_obras.find(o=>o.id===_addItemObraId); if(!obra) return;
  const etapas=JSON.parse(JSON.stringify(obra.etapas));
  if(!etapas[_addItemEtapaId].lista) etapas[_addItemEtapaId].lista=[];
  etapas[_addItemEtapaId].ativa=true;
  if(etapas[_addItemEtapaId].status==='pending') etapas[_addItemEtapaId].status='active';
  etapas[_addItemEtapaId].lista.push(criarItemLista(_addItemEtapaId, titulo, dataPrevista));
  await db.collection('obras').doc(_addItemObraId).update({etapas});
  showComercialToast(`"${titulo}" adicionado! ✅`,'success');
  closeAddItemModal();
}

async function adicionarItemLista(obraId, etapaId) {
  openAddItemModal(obraId, etapaId);
}

// ── Excluir item da lista ──────────────────────────────────────────────────────
let _excluirObraId=null, _excluirEtapaId=null, _excluirItemId=null;

function confirmarExcluirItem(obraId, etapaId, itemId, titulo) {
  _excluirObraId=obraId; _excluirEtapaId=etapaId; _excluirItemId=itemId;
  document.getElementById('excluir-item-titulo').textContent=titulo;
  document.getElementById('excluir-item-modal').style.display='flex';
}
function closeExcluirItemModal() {
  document.getElementById('excluir-item-modal').style.display='none';
  _excluirObraId=_excluirEtapaId=_excluirItemId=null;
}
async function confirmarExcluir() {
  const obra=_obras.find(o=>o.id===_excluirObraId); if(!obra) return;
  const etapas=JSON.parse(JSON.stringify(obra.etapas));
  etapas[_excluirEtapaId].lista=(etapas[_excluirEtapaId].lista||[]).filter(i=>i.id!==_excluirItemId);
  if(etapas[_excluirEtapaId].lista.length===0){
    etapas[_excluirEtapaId].status='pending';
    etapas[_excluirEtapaId].ativa=false;
  }
  await db.collection('obras').doc(_excluirObraId).update({etapas});
  showComercialToast('Item excluído. ✅','success');
  closeExcluirItemModal();
}

async function concluirItemLista(obraId, etapaId, itemId) {
  const obra = _obras.find(o=>o.id===obraId); if(!obra) return;
  const hoje = new Date().toISOString().slice(0,10);
  const etapas = JSON.parse(JSON.stringify(obra.etapas));
  const item = etapas[etapaId].lista.find(i=>i.id===itemId);
  if(!item) return;
  item.status='done'; item.dataConclusao=hoje; item.concluidoPor=currentUser.username;
  // Verificar se todos itens done → etapa done → verificar conclusão obra
  const todosDone = etapas[etapaId].lista.every(i=>i.status==='done');
  if(todosDone) etapas[etapaId].status='done';
  const todasDone=ETAPAS_ORDER.filter(id=>etapas[id]?.ativa&&etapas[id]?.status!=='pulada').every(id=>etapas[id]?.status==='done');
  if(todasDone){
    await db.collection('obras').doc(obraId).update({etapas,concluida:true,dataConclusao:hoje});
    showComercialToast('Obra concluída! 🎉','success');
  } else {
    await db.collection('obras').doc(obraId).update({etapas});
    showComercialToast('Item concluído! ✅','success');
  }
}

function renderListaEtapa(obra, etapaId, hoje) {
  const cfg    = ETAPAS_CONFIG[etapaId];
  const e      = obra.etapas?.[etapaId];
  const lista  = e?.lista || [];
  const canAdd = !obra.concluida;
  const label  = cfg.nome === 'Aditivos / Termo' ? 'Aditivo' : 'Medição';

  const itemsHtml = lista.map((item, idx) => {
    const isDone  = item.status === 'done';
    const corItem = isDone ? '#22c55e' : cfg.cor;
    const dtPrev  = item.dataPrevista
      ? `<span style="font-size:0.65rem;color:var(--muted);font-family:var(--font-mono);">
           <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
           ${new Date(item.dataPrevista+'T12:00:00').toLocaleDateString('pt-BR')}</span>` : '';
    const dtConc  = item.dataConclusao
      ? `<span style="font-size:0.65rem;color:#22c55e;font-family:var(--font-mono);">✓ ${new Date(item.dataConclusao+'T12:00:00').toLocaleDateString('pt-BR')}</span>` : '';
    const toggleId = `lista-item-${etapaId}-${idx}`;

    // Sub-etapas do item
    const subsHtml = (cfg.subEtapasTemplate||[]).map(subCfg => {
      const sub    = item.subEtapas?.[subCfg.id];
      if (!sub) return '';
      const subStatus  = sub.status || 'pending';
      const atrasada   = subStatus!=='done' && sub.dataLimite && sub.dataLimite < hoje;
      const diasCount  = sub.dataInicio ? Math.floor((new Date()-new Date(sub.dataInicio+'T12:00:00'))/(1000*60*60*24)) : 0;
      let dataInfo = '';
      if (subCfg.isAnalise && subStatus==='active' && sub.dataInicio) {
        dataInfo = `<span style="color:#8b5cf6;font-family:var(--font-mono);font-size:0.65rem;font-weight:700;">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          ${diasCount}d nesta sub-etapa</span>`;
      } else if (sub.dataConclusao) {
        const por = sub.concluidoPor ? ` · ${sub.concluidoPor}` : '';
        const tipo = sub.tipoConclusao ? ` (${sub.tipoConclusao})` : '';
        dataInfo = `<span style="color:#22c55e;font-family:var(--font-mono);font-size:0.65rem;">✓ ${new Date(sub.dataConclusao+'T12:00:00').toLocaleDateString('pt-BR')}${por}${tipo}</span>`;
      } else if (atrasada && sub.dataLimite) {
        dataInfo = `<span style="color:#ef4444;font-family:var(--font-mono);font-size:0.65rem;font-weight:700;">⚠ ${new Date(sub.dataLimite+'T12:00:00').toLocaleDateString('pt-BR')}</span>`;
      } else if (sub.dataLimite) {
        dataInfo = `<span style="color:var(--muted);font-family:var(--font-mono);font-size:0.65rem;">${new Date(sub.dataLimite+'T12:00:00').toLocaleDateString('pt-BR')}</span>`;
      }

      const dotColor  = subStatus==='done'?'#22c55e':atrasada?'#ef4444':subStatus==='active'?cfg.cor:'var(--muted)';
      const dotSymbol = subStatus==='done'?'✓':atrasada?'!':subStatus==='active'?'›':'·';
      const dropId    = `acao-lista-${etapaId}-${item.id}-${subCfg.id}`;
      const canConc   = subStatus!=='done' && !obra.concluida;
      const resp      = sub.responsavel;

      const acoesDropdown = !obra.concluida && subStatus !== 'done' ? (() => {
        const _dId = `acao-lista-${etapaId}-${item.id}-${subCfg.id}`;
        const _resp = sub.responsavel||'';
        const _items = [
          subStatus==='active'?`<button class="acao-item concluir" data-action="concluir-lista" data-obra="${obra.id}" data-etapa="${etapaId}" data-item="${item.id}" data-sub="${subCfg.id}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Concluir</button>`:'',
          subStatus==='active'?`<button class="acao-item revisao" data-action="revisao" data-obra="${obra.id}" data-etapa="${etapaId}" data-sub="${subCfg.id}" data-item="${item.id}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.2"/></svg> Revisão</button>`:'',
          subStatus==='active'?`<button class="acao-item" data-action="prorrogar" data-obra="${obra.id}" data-etapa="${etapaId}" data-sub="${subCfg.id}" data-item="${item.id}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Prorrogar</button>`:'',
          `<button class="acao-item" data-action="atribuir" data-obra="${obra.id}" data-etapa="${etapaId}" data-sub="${subCfg.id}" data-item="${item.id}" data-resp="${_resp}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> ${_resp||'Atribuir'}</button>`,
          `<button class="acao-item" data-action="obs" data-obra="${obra.id}" data-etapa="${etapaId}" data-sub="${subCfg.id}" data-item="${item.id}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Observações</button>`,
        ].join('');
        return `<div style="position:relative;display:inline-block;"><button class="sub-action-btn" data-dropdown="${_dId}" style="font-size:0.68rem;padding:0.2rem 0.55rem;background:var(--surface2);border-color:var(--border2);color:var(--text);display:flex;align-items:center;gap:0.25rem;">Ações<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></button><div id="${_dId}" class="acao-dropdown-menu" style="display:none;position:absolute;right:0;top:calc(100% + 4px);z-index:300;background:var(--surface);border:1px solid var(--border2);border-radius:8px;box-shadow:0 8px 24px #00000022;min-width:165px;overflow:hidden;">${_items}</div></div>`;
      })() : '';

      return `<div style="display:flex;align-items:center;gap:0.5rem;padding:0.3rem 0;border-bottom:1px solid var(--border2);">
        <span style="width:16px;height:16px;border-radius:50%;background:${dotColor};color:#fff;display:flex;align-items:center;justify-content:center;font-size:0.6rem;font-weight:700;flex-shrink:0;">${dotSymbol}</span>
        <span style="flex:1;font-size:0.78rem;">${subCfg.nome}</span>
        <div style="display:flex;align-items:center;gap:0.4rem;">${dataInfo}${acoesDropdown}</div>
      </div>`;
    }).join('');

    return `
    <div style="border:1px solid var(--border2);border-radius:8px;margin-top:0.5rem;">
      <div onclick="document.getElementById('${toggleId}').style.display=document.getElementById('${toggleId}').style.display==='none'?'block':'none'"
        style="display:flex;align-items:center;gap:0.6rem;padding:0.55rem 0.75rem;cursor:pointer;background:var(--surface2);">
        <span style="font-size:0.8rem;font-weight:700;color:${corItem};flex:1;">${isDone?'✓ ':''} ${item.titulo}</span>
        ${dtConc}${!isDone?dtPrev:''}
        ${canAdd?`<button
            onclick="event.stopPropagation();confirmarExcluirItem('${obra.id}','${etapaId}','${item.id}','${item.titulo}')"
            title="Excluir ${item.titulo}"
            style="background:none;border:none;cursor:pointer;padding:0.15rem 0.25rem;color:var(--muted);border-radius:4px;flex-shrink:0;"
            onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='var(--muted)'">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>`:''}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--muted);flex-shrink:0;"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div id="${toggleId}" style="display:none;padding:0.5rem 0.75rem;">${subsHtml}</div>
    </div>`;
  }).join('');

  const addBtn = canAdd ? `
    <button class="sub-action-btn concluir" style="margin-top:0.5rem;width:100%;justify-content:center;" onclick="adicionarItemLista('${obra.id}','${etapaId}')">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      ${label}
    </button>` : '';

  return `${itemsHtml}${addBtn}`;
}


// ── Dropdown Ações ─────────────────────────────────────────────────────────

// ── Contar pendências atribuídas ao usuário logado ───────────────────────────
function contarMinhasPendencias(obra) {
  if (!obra.etapas || obra.concluida) return 0;
  let count = 0;
  ETAPAS_ORDER.forEach(id => {
    const e   = obra.etapas[id];
    const cfg = ETAPAS_CONFIG[id];
    if (!e?.ativa) return;
    if (cfg.isLista) {
      (e.lista||[]).forEach(item => {
        Object.values(item.subEtapas||{}).forEach(s => {
          if (s.status!=='done' && s.responsavel===currentUser?.username) count++;
        });
      });
    } else {
      Object.values(e.subEtapas||{}).forEach(s => {
        if (s.status!=='done' && s.responsavel===currentUser?.username) count++;
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
    const e = obra.etapas?.[etapaId]; if(!e) return;
    const cfg = ETAPAS_CONFIG[etapaId];
    total += (e.observacoes||[]).length + (e.revisoes||[]).length;
    if (!cfg.isLista) {
      (cfg.subEtapas||[]).forEach(sub => {
        const sd = e.subEtapas?.[sub.id];
        total += (sd?.observacoes||[]).length + (sd?.revisoes||[]).length;
      });
    } else {
      (e.lista||[]).forEach(item => {
        (cfg.subEtapasTemplate||[]).forEach(sub => {
          const sd = item.subEtapas?.[sub.id];
          total += (sd?.observacoes||[]).length + (sd?.revisoes||[]).length;
        });
      });
    }
  });
  return total;
}

function _historicoTemNovos(obra) {
  const key    = _getHistKey(obra.id);
  const visto  = parseInt(localStorage.getItem(key)||'0');
  const total  = _contarHistoricoTotal(obra);
  return total > visto;
}

function _marcarHistoricoVisto(obra) {
  localStorage.setItem(_getHistKey(obra.id), _contarHistoricoTotal(obra));
}

// ── Dropdown Ações — event delegation ────────────────────────────────────────
let _acaoListenerActive = false;

function _acaoCloseAll(e) {
  if (!e.target.closest('[data-dropdown]') && !e.target.closest('.acao-dropdown-menu')) {
    document.querySelectorAll('.acao-dropdown-menu').forEach(d => d.style.display='none');
  }
}

function toggleAcaoDropdown(id) {} // mantido para compatibilidade

function closeAcaoDropdown(id) {
  const el = document.getElementById(id); if(el) el.style.display='none';
}

function _initAcaoDelegate() {
  if (_acaoListenerActive) return;
  _acaoListenerActive = true;

  // Toggle ao clicar no botão Ações
  document.addEventListener('click', e => {
    const trigger = e.target.closest('[data-dropdown]');
    if (trigger) {
      e.stopPropagation();
      const id  = trigger.dataset.dropdown;
      const menu = document.getElementById(id);
      if (!menu) return;
      const isOpen = menu.style.display === 'block';
      document.querySelectorAll('.acao-dropdown-menu').forEach(d => d.style.display='none');
      if (!isOpen) menu.style.display = 'block';
      return;
    }
    // Fechar ao clicar fora
    if (!e.target.closest('.acao-dropdown-menu')) {
      document.querySelectorAll('.acao-dropdown-menu').forEach(d => d.style.display='none');
    }
  });

  // Executar ação ao clicar num item
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    e.stopPropagation();
    document.querySelectorAll('.acao-dropdown-menu').forEach(d => d.style.display='none');

    const action = btn.dataset.action;
    const obraId = btn.dataset.obra;
    const etapaId= btn.dataset.etapa;
    const subId  = btn.dataset.sub;
    const itemId = btn.dataset.item;
    const resp   = btn.dataset.resp;

    switch(action) {
      case 'concluir':       concluirSubEtapa(obraId, etapaId, subId); break;
      case 'iniciar-sub':    iniciarSubEtapa(obraId, etapaId, subId); break;
      case 'concluir-lista': concluirSubEtapaDeLista(obraId, etapaId, itemId, subId); break;
      case 'revisao':        openRevisaoModal(obraId, etapaId, subId, itemId); break;
      case 'prorrogar':      openProrrogarModal(obraId, etapaId, subId, itemId); break;
      case 'atribuir':       openAtribuirModal(obraId, etapaId, subId, resp?'reatribuir':'atribuir', itemId); break;
      case 'obs':            openObsModal(obraId, etapaId, subId, itemId); break;
      case 'motivo':         openMotivoAtrasoModal(obraId, etapaId, subId, itemId); break;
      case 'revisao-etapa':  openRevisaoModal(obraId, etapaId); break;
      case 'obs-etapa':      openObsModal(obraId, etapaId); break;
      case 'pular-etapa':    pularEtapa(obraId, etapaId); break;
      case 'dataprevista':   openDataPrevistaModal(obraId, etapaId, subId); break;
    }
  });
}


// ── Concluir sub-etapa de dentro de uma lista (aditivo/medicao) ───────────
async function concluirSubEtapaDeLista(obraId, etapaId, itemId, subId) {
  const cfg = ETAPAS_CONFIG[etapaId];
  const precisaTipo = subId==='termo_assinatura';
  if (precisaTipo) {
    _tipoConclObraId=obraId; _tipoConclEtapaId=etapaId; _tipoConclSubId=subId;
    _tipoConclItemId=itemId;
    document.getElementById('tipo-conclusao-modal').style.display='flex';
    return;
  }
  await _concluirSubDeLista(obraId, etapaId, itemId, subId, null);
}
let _tipoConclItemId=null;
async function _concluirSubDeLista(obraId, etapaId, itemId, subId, tipo) {
  const obra=_obras.find(o=>o.id===obraId); if(!obra) return;
  const hoje=new Date().toISOString().slice(0,10);
  const etapas=JSON.parse(JSON.stringify(obra.etapas));
  const item=etapas[etapaId].lista.find(i=>i.id===itemId); if(!item) return;
  const cfg=ETAPAS_CONFIG[etapaId];
  const sub=item.subEtapas[subId];
  sub.status='done'; sub.dataConclusao=hoje; sub.concluidoPor=currentUser.username;
  if(tipo) sub.tipoConclusao=tipo;
  // Ativar próxima sub-etapa
  const subArr=cfg.subEtapasTemplate||[];
  const idx=subArr.findIndex(s=>s.id===subId);
  const prox=subArr[idx+1];
  if(prox && !item.subEtapas[prox.id]) item.subEtapas[prox.id]={status:'pending',dataLimite:null,dataConclusao:null,motivoAtraso:null,revisoes:[],observacoes:[]};
  if(prox) { item.subEtapas[prox.id].status='active'; item.subEtapas[prox.id].dataInicio=hoje; }
  // Verificar se todas as sub-etapas do item estão done
  const todasSubDone=subArr.every(s=>item.subEtapas[s.id]?.status==='done');
  if(todasSubDone){ item.status='done'; item.dataConclusao=hoje; item.concluidoPor=currentUser.username; }
  // Verificar conclusão da etapa
  const todosItensDone=(etapas[etapaId].lista||[]).every(i=>i.status==='done');
  if(todosItensDone) etapas[etapaId].status='done';
  const todasEtapasDone=ETAPAS_ORDER.filter(id=>etapas[id]?.ativa&&etapas[id]?.status!=='pulada').every(id=>etapas[id]?.status==='done');
  if(todasEtapasDone){
    await db.collection('obras').doc(obraId).update({etapas,concluida:true,dataConclusao:hoje});
    showComercialToast('Obra concluída! 🎉','success');
  } else {
    await db.collection('obras').doc(obraId).update({etapas});
    showComercialToast('Sub-etapa concluída! ✅','success');
  }
}

// ── Concluir sub-etapa ────────────────────────────────────────────────────────
async function concluirSubEtapa(obraId, etapaId, subId) {
  // Sub-etapas com escolha de tipo (Aditivos/Contrato assinatura)
  const precisaTipo = (etapaId==='aditivos'&&subId==='termo_assinatura') ||
                      (etapaId==='contrato'&&subId==='assinatura');
  if (precisaTipo) { openTipoConclusaoModal(obraId,etapaId,subId); return; }
  await _concluirComTipo(obraId,etapaId,subId,null);
}

async function _concluirComTipo(obraId, etapaId, subId, tipo) {
  const obra=_obras.find(o=>o.id===obraId); if(!obra) return;
  const hoje=new Date().toISOString().slice(0,10);
  const etapas=JSON.parse(JSON.stringify(obra.etapas));
  const cfg=ETAPAS_CONFIG[etapaId];
  const subCfg=cfg.subEtapas?.find(s=>s.id===subId)||(cfg.subEtapasTemplate||[]).find(s=>s.id===subId);
  etapas[etapaId].subEtapas[subId].status='done';
  etapas[etapaId].subEtapas[subId].dataConclusao=hoje;
  etapas[etapaId].subEtapas[subId].concluidoPor=currentUser.username;
  if (tipo) etapas[etapaId].subEtapas[subId].tipoConclusao=tipo;
  const subIdx=cfg.subEtapas.findIndex(s=>s.id===subId);
  const proxSub=cfg.subEtapas[subIdx+1];
  // Sub-etapas independentes (Documentações): não ativar a próxima automaticamente
  const isIndSub = subCfg?.isIndependente || cfg.isIndependente;
  if (proxSub && !isIndSub) {
    etapas[etapaId].subEtapas[proxSub.id].status='active';
    etapas[etapaId].subEtapas[proxSub.id].dataInicio=hoje;
    etapas[etapaId].subEtapas[proxSub.id].dataLimite=calcDataLimite(proxSub,etapas,obra.dataFechamento);
    await db.collection('obras').doc(obraId).update({etapas});
    showComercialToast(`"${proxSub.nome}" liberada! ✅`,'success');
  } else if (isIndSub || !proxSub) {
    // Independente ou última sub: verificar se todas as sub-etapas da etapa estão done
    const todasSubDone = cfg.subEtapas.every(s => etapas[etapaId].subEtapas[s.id]?.status==='done');
    if (todasSubDone) etapas[etapaId].status='done';
    else etapas[etapaId].status='active';
    // Verificar conclusão geral da obra
    const todasDone=ETAPAS_ORDER.filter(id=>etapas[id]?.ativa&&etapas[id]?.status!=='pulada').every(id=>etapas[id]?.status==='done');
    if (todasSubDone && todasDone) {
      await db.collection('obras').doc(obraId).update({etapas,concluida:true,dataConclusao:hoje});
      showComercialToast('Obra concluída! 🎉','success');
    } else {
      await db.collection('obras').doc(obraId).update({etapas});
      showComercialToast(`"${subCfg?.nome||''}" concluída! ✅`,'success');
    }
  } else {
    etapas[etapaId].status='done';
    const todasDone=ETAPAS_ORDER.filter(id=>etapas[id]?.ativa&&etapas[id]?.status!=='pulada').every(id=>etapas[id]?.status==='done');
    if (todasDone) {
      await db.collection('obras').doc(obraId).update({etapas,concluida:true,dataConclusao:hoje});
      showComercialToast('Obra concluída! 🎉','success');
    } else {
      await db.collection('obras').doc(obraId).update({etapas});
      showComercialToast(`Etapa "${cfg.nome}" concluída! ✅`,'success');
    }
  }
}

// ── Iniciar etapa manualmente ─────────────────────────────────────────────────
async function iniciarEtapa(obraId, etapaId) {
  const obra=_obras.find(o=>o.id===obraId); if(!obra) return;
  const etapas=JSON.parse(JSON.stringify(obra.etapas));
  const cfg=ETAPAS_CONFIG[etapaId];
  etapas[etapaId].ativa=true;
  etapas[etapaId].status='active';
  // Etapas com lista — adicionar primeiro item
  if (cfg.isLista) {
    etapas[etapaId].ativa=true;
    etapas[etapaId].status='active';
    etapas[etapaId].puladaEm=null;
    etapas[etapaId].puladaPor=null;
    if(!etapas[etapaId].lista) etapas[etapaId].lista=[];
    await db.collection('obras').doc(obraId).update({etapas});
    // Abrir modal para nomear e definir data do primeiro item
    openAddItemModal(obraId, etapaId);
    return;
  }
  // Garantir que todas as sub-etapas existam (obras antigas podem não ter novas sub-etapas)
  if (!etapas[etapaId].subEtapas) etapas[etapaId].subEtapas = {};
  const subEtapasArr = cfg.subEtapas || cfg.subEtapasTemplate || [];
  subEtapasArr.forEach((sub, idx) => {
    if (!etapas[etapaId].subEtapas[sub.id]) {
      etapas[etapaId].subEtapas[sub.id] = { status:'pending', dataLimite:null, dataConclusao:null, motivoAtraso:null, revisoes:[], observacoes:[] };
    }
  });
  // Sub-etapas independentes: nenhuma é ativada automaticamente — cada uma tem seu Iniciar
  if (cfg.isIndependente) {
    await db.collection('obras').doc(obraId).update({etapas});
    showComercialToast(`"${cfg.nome}" iniciada! ✅`,'success');
    return;
  }
  const primSub=(cfg.subEtapas||cfg.subEtapasTemplate||[])[0];
  etapas[etapaId].subEtapas[primSub.id].status='active';
  etapas[etapaId].subEtapas[primSub.id].dataInicio=new Date().toISOString().slice(0,10);
  etapas[etapaId].subEtapas[primSub.id].dataLimite=calcDataLimite(primSub,etapas,obra.dataFechamento);
  await db.collection('obras').doc(obraId).update({etapas});
  showComercialToast(`"${cfg.nome}" iniciada! ✅`,'success');
}

// ── Pular etapa ───────────────────────────────────────────────────────────────
async function pularEtapa(obraId, etapaId) {
  if (!confirm(`Pular a etapa "${ETAPAS_CONFIG[etapaId].nome}"? Ela ficará desabilitada e poderá ser reiniciada depois.`)) return;
  const obra=_obras.find(o=>o.id===obraId); if(!obra) return;
  const hoje=new Date().toISOString().slice(0,10);
  const etapas=JSON.parse(JSON.stringify(obra.etapas));
  etapas[etapaId].status='pulada';
  etapas[etapaId].ativa=false;
  etapas[etapaId].puladaEm=hoje;
  etapas[etapaId].puladaPor=currentUser.username;
  // Verificar se todas as etapas ativas (não puladas) estão done
  const todasDone=ETAPAS_ORDER
    .filter(id=>etapas[id]?.ativa && etapas[id]?.status!=='pulada')
    .every(id=>etapas[id]?.status==='done');
  if (todasDone) {
    await db.collection('obras').doc(obraId).update({etapas,concluida:true,dataConclusao:hoje});
    showComercialToast('Etapa pulada — obra concluída! 🎉','success');
  } else {
    await db.collection('obras').doc(obraId).update({etapas});
    showComercialToast(`Etapa "${ETAPAS_CONFIG[etapaId].nome}" pulada ✅`,'success');
  }
}

// ── Modal Aprovado/Assinado (Aditivo) ────────────────────────────────────────
let _tipoConclObraId=null, _tipoConclEtapaId=null, _tipoConclSubId=null;

function openTipoConclusaoModal(obraId, etapaId, subId) {
  _tipoConclObraId=obraId; _tipoConclEtapaId=etapaId; _tipoConclSubId=subId;
  document.getElementById('tipo-conclusao-modal').style.display='flex';
}

async function salvarTipoConclusao(tipo) {
  document.getElementById('tipo-conclusao-modal').style.display='none';
  if (_tipoConclItemId) {
    await _concluirSubDeLista(_tipoConclObraId, _tipoConclEtapaId, _tipoConclItemId, _tipoConclSubId, tipo);
    _tipoConclItemId=null;
  } else {
    await _concluirComTipo(_tipoConclObraId, _tipoConclEtapaId, _tipoConclSubId, tipo);
  }
  _tipoConclObraId=_tipoConclEtapaId=_tipoConclSubId=null;
}

// ── Prorrogar sub-etapa ───────────────────────────────────────────────────────
let _prorrogarObraId=null,_prorrogarEtapaId=null,_prorrogarSubId=null;

let _prorrogarItemId=null;
function openProrrogarModal(obraId,etapaId,subId,itemId) {
  _prorrogarItemId=itemId||null;
  _prorrogarObraId=obraId;_prorrogarEtapaId=etapaId;_prorrogarSubId=subId;
  const cfg=ETAPAS_CONFIG[etapaId];
  const subCfg=(cfg.subEtapas||cfg.subEtapasTemplate||[]).find(s=>s.id===subId);
  const obra=_obras.find(o=>o.id===obraId);
  // Sub pode estar diretamente em subEtapas ou dentro de um item da lista
  let sub = obra?.etapas?.[etapaId]?.subEtapas?.[subId];
  if (!sub && cfg.isLista) {
    const lista = obra?.etapas?.[etapaId]?.lista || [];
    for (const item of lista) { if (item.subEtapas?.[subId]) { sub = item.subEtapas[subId]; break; } }
  }
  const limFmt=sub?.dataLimite?new Date(sub.dataLimite+'T12:00:00').toLocaleDateString('pt-BR'):'—';
  const title=document.getElementById('prorrogar-modal-title');
  if(title) title.textContent=`Prorrogar — ${cfg.nome} · ${subCfg?.nome||''}`;
  const info=document.getElementById('prorrogar-modal-info');
  if(info) info.textContent=`Limite atual: ${limFmt}${sub?.diasProrrogados?` (já prorrogado ${sub.diasProrrogados}x)`:''}`; 
  const amanha = new Date(); amanha.setDate(amanha.getDate()+1);
  const input = document.getElementById('prorrogar-data-input');
  if(input){ input.min=amanha.toISOString().slice(0,10); input.value=''; }
  document.getElementById('prorrogar-modal').style.display='flex';
}

function closeProrrogarModal() {
  document.getElementById('prorrogar-modal').style.display='none';
  _prorrogarObraId=_prorrogarEtapaId=_prorrogarSubId=null;
}

async function saveProrrogacao() {
  const novaData=document.getElementById('prorrogar-data-input')?.value;
  if(!novaData){showComercialToast('Selecione uma data válida.','error');return;}
  // Validar que não é retroativa
  const hoje=new Date().toISOString().slice(0,10);
  if(novaData<=hoje){showComercialToast('A data deve ser futura.','error');return;}
  const obra=_obras.find(o=>o.id===_prorrogarObraId); if(!obra) return;
  const etapas=JSON.parse(JSON.stringify(obra.etapas));
  const ref=_findSubRef(etapas,_prorrogarEtapaId,_prorrogarSubId,_prorrogarItemId);
  if(!ref){showComercialToast('Sub-etapa não encontrada.','error');return;}
  ref.sub.dataLimite=novaData;
  ref.sub.prorrogadoPor=currentUser.username;
  ref.sub.prorrogadoEm=hoje;
  ref.sub.diasProrrogados=(ref.sub.diasProrrogados||0)+1;
  await db.collection('obras').doc(_prorrogarObraId).update({etapas});
  showComercialToast(`Prazo atualizado para ${new Date(novaData+'T12:00:00').toLocaleDateString('pt-BR')}! ✅`,'success');
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
let _motivoObraId=null,_motivoEtapaId=null,_motivoSubId=null;
function openMotivoAtrasoModal(obraId,etapaId,subId) {
  _motivoObraId=obraId;_motivoEtapaId=etapaId;_motivoSubId=subId;
  const _cfg=ETAPAS_CONFIG[etapaId];
  const subCfg=(_cfg.subEtapas||_cfg.subEtapasTemplate||[]).find(s=>s.id===subId);
  const title=document.getElementById('motivo-modal-title');
  if(title) title.textContent=`Motivo de Atraso — ${ETAPAS_CONFIG[etapaId].nome} · ${subCfg?.nome||''}`;
  const mInput=document.getElementById('motivo-input'); if(mInput) mInput.value='';
  const mModal=document.getElementById('motivo-atraso-modal');
  if(!mModal){ showComercialToast('Modal de motivo não encontrado.','error'); return; }
  mModal.style.display='flex';
}
function closeMotivoAtrasoModal() {
  document.getElementById('motivo-atraso-modal').style.display='none';
  _motivoObraId=_motivoEtapaId=_motivoSubId=null;
}
async function saveMotivoAtraso() {
  const motivo=document.getElementById('motivo-input')?.value.trim();
  if(!motivo){showComercialToast('Informe o motivo.','error');return;}
  const obra=_obras.find(o=>o.id===_motivoObraId); if(!obra) return;
  const etapas=JSON.parse(JSON.stringify(obra.etapas));
  etapas[_motivoEtapaId].subEtapas[_motivoSubId].motivoAtraso=motivo;
  await db.collection('obras').doc(_motivoObraId).update({etapas});
  showComercialToast('Motivo registrado! ✅','success');
  closeMotivoAtrasoModal();
}

// ── Revisão de etapa ou sub-etapa ────────────────────────────────────────────
let _revisaoObraId=null, _revisaoEtapaId=null, _revisaoSubId=null;

function openRevisaoModal(obraId, etapaId, subId) {
  _revisaoObraId=obraId; _revisaoEtapaId=etapaId; _revisaoSubId=subId||null;
  const obra=_obras.find(o=>o.id===obraId);
  let revs=0, titulo='';
  if (subId) {
    revs=obra?.etapas?.[etapaId]?.subEtapas?.[subId]?.revisoes?.length||0;
    const _cfgA=ETAPAS_CONFIG[etapaId];
  const subCfg=(_cfgA.subEtapas||_cfgA.subEtapasTemplate||[]).find(s=>s.id===subId);
    titulo=`REV.${revs+1} — ${ETAPAS_CONFIG[etapaId].nome} · ${subCfg?.nome||''}`;
  } else {
    revs=obra?.etapas?.[etapaId]?.revisoes?.length||0;
    titulo=`REV.${revs+1} — ${ETAPAS_CONFIG[etapaId].nome}`;
  }
  const title=document.getElementById('revisao-modal-title');
  if(title) title.textContent=titulo;
  document.getElementById('revisao-motivo-input').value='';
  document.getElementById('revisao-mini-modal').style.display='flex';
}

function closeRevisaoModal() {
  document.getElementById('revisao-mini-modal').style.display='none';
  _revisaoObraId=_revisaoEtapaId=_revisaoSubId=null;
}

async function saveRevisao() {
  const motivo=document.getElementById('revisao-motivo-input')?.value.trim();
  if(!motivo){showComercialToast('Informe o motivo da revisão.','error');return;}
  const obra=_obras.find(o=>o.id===_revisaoObraId); if(!obra) return;
  const etapas=JSON.parse(JSON.stringify(obra.etapas));
  const novaRevisao={numero:0, motivo, data:new Date().toISOString().slice(0,10), por:currentUser.username};

  if (_revisaoSubId) {
    const sub=etapas[_revisaoEtapaId].subEtapas[_revisaoSubId];
    if(!sub.revisoes) sub.revisoes=[];
    novaRevisao.numero=sub.revisoes.length+1;
    sub.revisoes.push(novaRevisao);
    if (sub.status !== 'done') sub.dataLimite = novaRevisao.data;
  } else {
    // Revisão na etapa — reinicia TODAS as sub-etapas
    if(!etapas[_revisaoEtapaId].revisoes) etapas[_revisaoEtapaId].revisoes=[];
    novaRevisao.numero=etapas[_revisaoEtapaId].revisoes.length+1;
    etapas[_revisaoEtapaId].revisoes.push(novaRevisao);
    // Reiniciar sub-etapas: primeira ativa, restantes pendentes
    const cfg=ETAPAS_CONFIG[_revisaoEtapaId];
    const hoje=novaRevisao.data;
    if (!cfg.isLista) {
      const subs=cfg.subEtapas||[];
      subs.forEach((s,idx)=>{
        if(!etapas[_revisaoEtapaId].subEtapas[s.id]) return;
        etapas[_revisaoEtapaId].subEtapas[s.id].status = idx===0 ? 'active' : 'pending';
        etapas[_revisaoEtapaId].subEtapas[s.id].dataConclusao = null;
        etapas[_revisaoEtapaId].subEtapas[s.id].motivoAtraso  = null;
        if(idx===0){
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

  await db.collection('obras').doc(_revisaoObraId).update({etapas});
  showComercialToast('Revisão registrada! ✅','success');
  closeRevisaoModal();
}

// ── Editar obra ───────────────────────────────────────────────────────────────
let _editandoObraId=null;
function openEditarObraModal(obraId) {
  const obra=_obras.find(o=>o.id===obraId); if(!obra) return;
  _editandoObraId=obraId;
  document.getElementById('editar-obra-numero').value    =obra.numero||'';
  document.getElementById('editar-obra-nome').value      =obra.nome||'';
  document.getElementById('editar-obra-rep').value       =obra.representante||'';
  document.getElementById('editar-obra-fechamento').value=obra.dataFechamento||'';
  document.getElementById('editar-obra-prazo').value     =obra.prazoEstimado||'';
  document.getElementById('editar-obra-obs').value       =obra.obs||'';
  document.getElementById('editar-obra-modal').style.display='flex';
}
function closeEditarObraModal() {
  document.getElementById('editar-obra-modal').style.display='none';
  _editandoObraId=null;
}
async function saveEditarObra() {
  if(!_editandoObraId) return;
  const nome=document.getElementById('editar-obra-nome')?.value.trim();
  if(!nome){showComercialToast('Informe o nome da obra.','error');return;}
  await db.collection('obras').doc(_editandoObraId).update({
    numero:        document.getElementById('editar-obra-numero')?.value.trim()||'',
    nome,
    representante: document.getElementById('editar-obra-rep')?.value||'',
    dataFechamento:document.getElementById('editar-obra-fechamento')?.value||null,
    prazoEstimado: document.getElementById('editar-obra-prazo')?.value||null,
    obs:           document.getElementById('editar-obra-obs')?.value.trim()||'',
  });
  showComercialToast('Obra atualizada! ✅','success');
  closeEditarObraModal();
}

// ── Excluir / Reabrir ─────────────────────────────────────────────────────────
async function excluirObra(obraId) {
  const obra=_obras.find(o=>o.id===obraId);
  if(!confirm(`Excluir "${obra?.nome}"? Não pode ser desfeita.`)) return;
  await db.collection('obras').doc(obraId).delete();
  showComercialToast('Obra excluída.','success');
  closeObraModal();
}

async function reabrirObra(obraId) {
  if(!confirm('Reabrir esta obra? Etapas subsequentes voltam para pendente.')) return;
  const obra=_obras.find(o=>o.id===obraId); if(!obra) return;
  const etapas=JSON.parse(JSON.stringify(obra.etapas));
  let reativarId='proposta';
  ETAPAS_ORDER.forEach(id=>{if(etapas[id]?.ativa&&etapas[id]?.status==='done') reativarId=id;});
  let found=false;
  ETAPAS_ORDER.forEach(id=>{
    if(id===reativarId){
      found=true; etapas[id].status='active';
      const cfg=ETAPAS_CONFIG[id];
      let lastDone=null;
      cfg.subEtapas.forEach(s=>{if(etapas[id].subEtapas[s.id]?.status==='done') lastDone=s.id;});
      if(lastDone){etapas[id].subEtapas[lastDone].status='active';etapas[id].subEtapas[lastDone].dataConclusao=null;}
    } else if(found) {
      etapas[id].status='pending';
      ETAPAS_CONFIG[id].subEtapas.forEach(s=>{
        etapas[id].subEtapas[s.id]={status:'pending',dataLimite:null,dataConclusao:null,motivoAtraso:null};
      });
    }
  });
  await db.collection('obras').doc(obraId).update({etapas,concluida:false,dataConclusao:null});
  showComercialToast('Obra reaberta! ✅','success');
}

// ── PDF individual da obra ────────────────────────────────────────────────────
function exportarObraPDF(obraId) {
  const obra = _obras.find(o => o.id === obraId);
  if (!obra) return;
  const hoje = new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'});
  const NOMES = {proposta:'Proposta Consolidada',contrato:'Contrato',documentacoes:'Documentações',aditivos:'Aditivos/Termo',medicao:'Medição'};
  const hoje2 = new Date().toISOString().slice(0, 10);
  const etapasHtml = ETAPAS_ORDER.map(etapaId => {
    const cfg  = ETAPAS_CONFIG[etapaId];
    const e    = obra.etapas?.[etapaId];
    if (!e?.ativa && e?.status !== 'pulada') return '';
    // Status da etapa: verificar atraso nas sub-etapas
    const temAtrasoEtapa = Object.values(e.subEtapas||{}).some(
      s => s.status!=='done' && s.dataLimite && s.dataLimite < hoje2);
    const statusEtapa = e.status==='done'   ? '✓ Concluída'
                      : e.status==='pulada' ? '⏭ Pulada'
                      : temAtrasoEtapa      ? '⚠ Em atraso'
                      : e.status==='active' ? '► Em andamento'
                      : '○ Não iniciada';
    const corStatus   = e.status==='done'   ? '#22c55e'
                      : e.status==='pulada' ? '#6b7280'
                      : temAtrasoEtapa      ? '#ef4444'
                      : e.status==='active' ? cfg.cor
                      : '#9ca3af';
    // Lista (aditivos/medicao)
    if (cfg.isLista) {
      const lista = e.lista || [];
      const listaHtml = lista.map(item => {
        const itemDone = item.status==='done';
        const dtPrev = item.dataPrevista?`Previsto: ${new Date(item.dataPrevista+'T12:00:00').toLocaleDateString('pt-BR')}`:'';
        const dtConc = item.dataConclusao?`✓ ${new Date(item.dataConclusao+'T12:00:00').toLocaleDateString('pt-BR')}`:'';
        const subsItem = (cfg.subEtapasTemplate||[]).map(sub => {
          const s = item.subEtapas?.[sub.id]; if(!s) return '';
          const atrasada2 = s.status!=='done'&&s.dataLimite&&s.dataLimite<hoje2;
          let st2,corSt2;
          if(s.status==='done'){st2='✓ Concluída';corSt2='#22c55e';}
          else if(atrasada2){st2='⚠ Atrasada';corSt2='#ef4444';}
          else if(s.status==='active'){st2='► Em andamento';corSt2=cfg.cor;}
          else{st2='○ Pendente';corSt2='#9ca3af';}
          const tipo2=s.tipoConclusao?` (${s.tipoConclusao})`:'';
          const dt2=s.dataConclusao?new Date(s.dataConclusao+'T12:00:00').toLocaleDateString('pt-BR'):s.dataLimite?new Date(s.dataLimite+'T12:00:00').toLocaleDateString('pt-BR'):'—';
          const dias2=atrasada2?`${Math.ceil((new Date()-new Date(s.dataLimite+'T12:00:00'))/(1000*60*60*24))} dias`:'—';
          return `<tr><td style="padding:4px 8px 4px 32px;color:${corSt2};font-weight:600;">${st2}</td><td style="padding:4px 8px;">${sub.nome}${tipo2}</td><td style="padding:4px 8px;font-family:monospace;font-size:10px;">${dt2}</td><td style="padding:4px 8px;font-family:monospace;font-size:10px;color:${atrasada2?'#ef4444':'#6b7280'}">${dias2}</td></tr>`;
        }).join('');
        return `<tr style="background:#f0f9ff;"><td colspan="4" style="padding:5px 8px 5px 20px;font-weight:700;color:${cfg.cor};">${item.titulo}${dtPrev?` — ${dtPrev}`:''}${dtConc?` — ${dtConc}`:''}</td></tr>${subsItem}`;
      }).join('');
      return `<tr style="background:#f9fafb;"><td colspan="4" style="padding:6px 8px;font-weight:700;color:${corStatus};border-left:3px solid ${corStatus};">${cfg.nome} — ${statusEtapa}</td></tr>${listaHtml}`;
    }
    const subsHtml = cfg.subEtapas.map(sub => {
      const s = e.subEtapas?.[sub.id]; if(!s) return '';
      const atrasada = s.status !== 'done' && s.dataLimite && s.dataLimite < hoje2;
      let st, corSt;
      if      (s.status === 'done')  { st = '✓ Concluída';   corSt = '#22c55e'; }
      else if (atrasada)             { st = '⚠ Atrasada';    corSt = '#ef4444'; }
      else if (s.status === 'active'){ st = '► Em andamento'; corSt = cfg.cor; }
      else                           { st = '○ Pendente';    corSt = '#9ca3af'; }
      const tipo = s.tipoConclusao ? ` (${s.tipoConclusao})` : '';
      const por  = s.concluidoPor  ? ` — por ${s.concluidoPor}` : '';
      const dtConc = s.dataConclusao
        ? `${new Date(s.dataConclusao+'T12:00:00').toLocaleDateString('pt-BR')}${por}`
        : s.dataLimite
          ? new Date(s.dataLimite+'T12:00:00').toLocaleDateString('pt-BR')
          : '—';
      const diasAt = atrasada ? (() => {
        const d=new Date(s.dataLimite+'T12:00:00'),ag=new Date();ag.setHours(0,0,0,0);
        return Math.ceil((ag-d)/(1000*60*60*24))+' dias';
      })() : '—';
      return `<tr>
        <td style="padding:4px 8px 4px 20px;color:${corSt};font-weight:600;white-space:nowrap;">${st}</td>
        <td style="padding:4px 8px;">${sub.nome}${tipo}</td>
        <td style="padding:4px 8px;font-family:monospace;font-size:10px;color:#6b7280;">${dtConc}</td>
        <td style="padding:4px 8px;font-family:monospace;font-size:10px;color:${atrasada?'#ef4444':'#6b7280'};font-weight:${atrasada?'700':'400'};">${diasAt}</td>
      </tr>`;
    }).join('');
    return `<tr style="background:#f9fafb;"><td colspan="3" style="padding:6px 8px;font-weight:700;color:${corStatus};border-left:3px solid ${corStatus};" colspan="4">${cfg.nome} — ${statusEtapa}</td></tr>${subsHtml}`;
  }).join('');
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Obra #${obra.numero} — ${obra.nome}</title>
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
    <div class="meta"><span>👤 ${obra.representante||'—'}</span><span>📅 Fechamento: ${obra.dataFechamento?new Date(obra.dataFechamento+'T12:00:00').toLocaleDateString('pt-BR'):'—'}</span>${obra.prazoEstimado?`<span>⏱ Prazo estimado: ${new Date(obra.prazoEstimado+'T12:00:00').toLocaleDateString('pt-BR')}</span>`:''}</div></div>
    <table><thead><tr><th>Status</th><th>Etapa / Sub-etapa</th><th>Data Conclusão / Limite</th><th>Dias em Atraso</th></tr></thead><tbody>${etapasHtml}</tbody></table>
    <div class="footer">Premovale T.I — Gerado em ${hoje}</div>
    <script>window.onload=()=>{window.print();}<\/script></body></html>`;
  const w=window.open('','_blank'); w.document.write(html); w.document.close();
}

// ── Relatório ─────────────────────────────────────────────────────────────────
function openRelatorioModal()  { document.getElementById('relatorio-modal').style.display='flex'; }
function closeRelatorioModal() { document.getElementById('relatorio-modal').style.display='none'; }

function _gerarDadosRelatorio() {
  const incluirTodas  = document.getElementById('rel-todas')?.checked;
  const filtroRep     = document.getElementById('rel-representante')?.value||'';
  const hoje = new Date().toISOString().slice(0,10);
  const linhas = [];
  const NOMES_ETAPA = {proposta:'Proposta Consolidada',contrato:'Contrato',documentacoes:'Documentações',aditivos:'Aditivos/Termo',medicao:'Medição'};

  _obras.filter(o => !o.concluida && (!filtroRep || o.representante===filtroRep)).forEach(obra => {
    ETAPAS_ORDER.forEach(etapaId => {
      const e   = obra.etapas?.[etapaId];
      const cfg = ETAPAS_CONFIG[etapaId];
      if (!e?.ativa) return;
      // Lista (aditivos/medicao)
      if (cfg.isLista) {
        (e.lista||[]).forEach(item => {
          (cfg.subEtapasTemplate||[]).forEach(subCfg => {
            const sub = item.subEtapas?.[subCfg.id];
            if (!sub || sub.status==='done') return;
            const atrasada = sub.dataLimite && sub.dataLimite < hoje;
            const vencendo = sub.dataLimite && !atrasada && (() => {
              const d=new Date(sub.dataLimite+'T12:00:00'),ag=new Date();ag.setHours(0,0,0,0);
              return Math.ceil((d-ag)/(1000*60*60*24))<=3;
            })();
            if (!incluirTodas && !atrasada && !vencendo) return;
            const diasAtraso = atrasada ? (() => {
              const d=new Date(sub.dataLimite+'T12:00:00'),ag=new Date();ag.setHours(0,0,0,0);
              return Math.ceil((ag-d)/(1000*60*60*24));
            })() : 0;
            linhas.push({
              numero:obra.numero||obra.id.slice(-6), nome:obra.nome,
              representante:obra.representante||'—',
              prazoObra:obra.prazoEstimado?new Date(obra.prazoEstimado+'T12:00:00').toLocaleDateString('pt-BR'):'—',
              etapa:`${NOMES_ETAPA[etapaId]} — ${item.titulo}`,
              subEtapa:subCfg.nome,
              status:atrasada?'Atrasada':vencendo?'Vencendo':'Em andamento',
              dataLimite:sub.dataLimite?new Date(sub.dataLimite+'T12:00:00').toLocaleDateString('pt-BR'):'—',
              diasAtraso:atrasada?`${diasAtraso} dias`:'—',
            });
          });
        });
        return;
      }
      // Sub-etapas normais
      const subEtapasArr = cfg.subEtapas || [];
      subEtapasArr.forEach(subCfg => {
        const sub = e.subEtapas?.[subCfg.id];
        if (!sub || sub.status === 'done') return;
        const atrasada = sub.dataLimite && sub.dataLimite < hoje;
        const vencendo = sub.dataLimite && !atrasada && (() => {
          const d=new Date(sub.dataLimite+'T12:00:00'),ag=new Date();ag.setHours(0,0,0,0);
          return Math.ceil((d-ag)/(1000*60*60*24))<=3;
        })();
        if (!incluirTodas && !atrasada && !vencendo) return;
        const diasAtraso = atrasada ? (() => {
          const d=new Date(sub.dataLimite+'T12:00:00'),ag=new Date();ag.setHours(0,0,0,0);
          return Math.ceil((ag-d)/(1000*60*60*24));
        })() : 0;
        linhas.push({
          numero:       obra.numero || obra.id.slice(-6),
          nome:         obra.nome,
          representante:obra.representante || '—',
          etapa:        NOMES_ETAPA[etapaId],
          subEtapa:     subCfg.nome,
          status:       atrasada ? 'Atrasada' : vencendo ? 'Vencendo' : 'Em andamento',
          dataLimite:   sub.dataLimite ? new Date(sub.dataLimite+'T12:00:00').toLocaleDateString('pt-BR') : '—',
          diasAtraso:   atrasada ? `${diasAtraso}d` : '—',
        });
      });
    });
  });
  return linhas;
}

function exportarRelatorioXLS() {
  const linhas = _gerarDadosRelatorio();
  if (!linhas.length) { showComercialToast('Nenhuma obra encontrada para o relatório.','error'); return; }
  try {
    const hoje = new Date().toLocaleDateString('pt-BR');
    const headers = ['No','Obra','Representante','Etapa','Sub-etapa','Status','Data Limite','Dias em atraso'];
    const escXml = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const headerRow = headers.map(h=>`<th style="background:#374151;color:#fff;padding:6px 8px;border:1px solid #d1d5db;">${escXml(h)}</th>`).join('');
    const dataRows = linhas.map(l => {
      const bgCor2 = l.status==='Atrasada'?'#fee2e2':l.status==='Vencendo'?'#fef3c7':rowIdx%2===0?'#ffffff':'#f9fafb';
      const cols=[l.numero,l.nome,l.representante,l.etapa,l.subEtapa,l.status,l.dataLimite,l.diasAtraso];
      return `<tr>${cols.map((v, ci) => {
        const isAtraso = ci === cols.length - 1;
        const cellBg   = l.status==='Atrasada' ? '#fee2e2' : l.status==='Vencendo' ? '#fef3c7' : rowIdx%2===0 ? '#ffffff' : '#f9fafb';
        const cellColor= isAtraso && l.diasAtraso && l.diasAtraso!=='—' ? '#dc2626' : '#1f2937';
        const cellWeight=isAtraso && l.diasAtraso && l.diasAtraso!=='—' ? 'bold' : 'normal';
        return `<td style="padding:5px 8px;border:1px solid #e5e7eb;background:${cellBg};color:${cellColor};font-weight:${cellWeight};">${escXml(v)}</td>`;
      }).join('')}</tr>`;
    }).join('');
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Relatorio</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
      <body><table><thead><tr>${headerRow}</tr></thead><tbody>${dataRows}</tbody></table></body></html>`;
    const blob = new Blob(['﻿'+html], {type:'application/vnd.ms-excel;charset=utf-8'});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `relatorio_obras_${new Date().toISOString().slice(0,10)}.xls`;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
    closeRelatorioModal();
    showComercialToast('XLS exportado! ✅','success');
  } catch(e) {
    console.error('XLS error:', e);
    showComercialToast(`Erro: ${e.message}`,'error');
  }
}

function exportarRelatorioPDF() {
  const linhas = _gerarDadosRelatorio();
  if (!linhas.length) { showComercialToast('Nenhuma obra encontrada para o relatório.','error'); return; }
  const hoje = new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'});
  const rows = linhas.map((l, ri) => {
    const bg = l.status==='Atrasada'?'#fee2e2':l.status==='Vencendo'?'#fef3c7':ri%2===0?'#ffffff':'#f9fafb';
    const td = `style="padding:6px 8px;border-bottom:1px solid #e5e7eb;background:${bg};"`;
    const tdRed = l.diasAtraso&&l.diasAtraso!=='—'
      ? `style="padding:6px 8px;border-bottom:1px solid #e5e7eb;background:${bg};color:#dc2626;font-weight:700;"`
      : `style="padding:6px 8px;border-bottom:1px solid #e5e7eb;background:${bg};color:#6b7280;"`;
    return `<tr>
      <td ${td}>#${l.numero}</td>
      <td ${td}><strong>${l.nome}</strong></td>
      <td ${td}>${l.representante}</td>
      <td ${td}>${l.prazoObra}</td>
      <td ${td}>${l.etapa}</td>
      <td ${td}>${l.subEtapa}</td>
      <td ${td}><span class="badge ${l.status==='Atrasada'?'red':l.status==='Vencendo'?'amber':'blue'}">${l.status}</span></td>
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
      .footer{margin-top:20px;font-size:9px;color:#9ca3af;text-align:center;}
    </style></head><body>
    <div class="header">
      <h1>📋 Relatório de Obras — Premovale</h1>
      <span>Gerado em ${hoje}</span>
    </div>
    <table>
      <thead><tr><th>Nº</th><th>Obra</th><th>Representante</th><th>Prazo da Obra</th><th>Etapa</th><th>Sub-etapa</th><th>Status</th><th>Data Limite</th><th>Atraso</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="footer">Premovale T.I — ${linhas.length} item(s) • ${hoje}</div>
    <script>window.onload=()=>{window.print();}<\/script>
  </body></html>`;
  const w = window.open('','_blank');
  w.document.write(html);
  w.document.close();
  closeRelatorioModal();
}


// ── Observações por etapa/sub-etapa ──────────────────────────────────────────
let _obsObraId=null, _obsEtapaId=null, _obsSubId=null;

let _obsItemId=null;
function openObsModal(obraId, etapaId, subId, itemId) {
  _obsObraId=obraId; _obsEtapaId=etapaId; _obsSubId=subId||null; _obsItemId=itemId||null;
  const cfg=ETAPAS_CONFIG[etapaId];
  const subCfg=subId?(cfg.subEtapas||cfg.subEtapasTemplate||[]).find(s=>s.id===subId):null;
  const titulo=subCfg?`Observação — ${cfg.nome} · ${subCfg.nome}`:`Observação — ${cfg.nome}`;
  document.getElementById('obs-modal-title').textContent=titulo;
  document.getElementById('obs-input').value='';
  document.getElementById('obs-modal').style.display='flex';
}
function closeObsModal() {
  document.getElementById('obs-modal').style.display='none';
  _obsObraId=_obsEtapaId=_obsSubId=_obsItemId=null;
}
async function saveObs() {
  const texto=document.getElementById('obs-input')?.value.trim();
  if(!texto){showComercialToast('Informe a observação.','error');return;}
  const obra=_obras.find(o=>o.id===_obsObraId); if(!obra) return;
  const etapas=JSON.parse(JSON.stringify(obra.etapas));
  const novaObs={texto,data:new Date().toISOString().slice(0,10),
    hora:new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}),
    por:currentUser.username};
  if(_obsSubId){
    const refObs=_findSubRef(etapas,_obsEtapaId,_obsSubId,_obsItemId);
    if(refObs){
      if(!refObs.sub.observacoes) refObs.sub.observacoes=[];
      refObs.sub.observacoes.push(novaObs);
    }
  } else {
    if(!etapas[_obsEtapaId].observacoes) etapas[_obsEtapaId].observacoes=[];
    etapas[_obsEtapaId].observacoes.push(novaObs);
  }
  await db.collection('obras').doc(_obsObraId).update({etapas});
  showComercialToast('Observação registrada! ✅','success');
  closeObsModal();
}
function openHistoricoModal(obraId) {
  const obra=_obras.find(o=>o.id===obraId); if(!obra) return;
  const el=document.getElementById('historico-modal-body');
  if(!el) return;
  const NOMES={proposta:'Proposta Consolidada',contrato:'Contrato',documentacoes:'Documentações',aditivos:'Aditivos/Termo',medicao:'Medição'};
  let html='';
  ETAPAS_ORDER.forEach(etapaId=>{
    const e=obra.etapas?.[etapaId]; if(!e) return;
    const cfg=ETAPAS_CONFIG[etapaId];
    const itens=[];
    (e.observacoes||[]).forEach(o=>itens.push({tipo:'obs',badge:'📝 Etapa',texto:o.texto,meta:`${o.data} ${o.hora||''} — ${o.por}`}));
    (e.revisoes||[]).forEach(r=>itens.push({tipo:'rev',badge:`REV.${r.numero}`,texto:r.motivo,meta:`${r.data||'—'} — ${r.por||'—'}`}));
    // Sub-etapas normais
    if (!cfg.isLista) {
      (cfg.subEtapas||[]).forEach(sub=>{
        const sd=e.subEtapas?.[sub.id];
        (sd?.observacoes||[]).forEach(o=>itens.push({tipo:'obs',badge:`📝 ${sub.nome}`,texto:o.texto,meta:`${o.data} ${o.hora||''} — ${o.por}`}));
        (sd?.revisoes||[]).forEach(r=>itens.push({tipo:'rev',badge:`REV.${r.numero} ${sub.nome}`,texto:r.motivo,meta:`${r.data||'—'} — ${r.por||'—'}`}));
      });
    } else {
      // Lista (aditivos/medicao)
      (e.lista||[]).forEach(item=>{
        (cfg.subEtapasTemplate||[]).forEach(sub=>{
          const sd=item.subEtapas?.[sub.id];
          (sd?.observacoes||[]).forEach(o=>itens.push({tipo:'obs',badge:`📝 ${item.titulo} · ${sub.nome}`,texto:o.texto,meta:`${o.data} ${o.hora||''} — ${o.por}`}));
          (sd?.revisoes||[]).forEach(r=>itens.push({tipo:'rev',badge:`REV.${r.numero} ${item.titulo}`,texto:r.motivo,meta:`${r.data||'—'} — ${r.por||'—'}`}));
        });
      });
    }
    if(!itens.length) return;
    html+=`<div style="margin-bottom:1.25rem;"><div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted);font-family:var(--font-mono);margin-bottom:0.5rem;padding-bottom:0.3rem;border-bottom:1px solid var(--border2);">${NOMES[etapaId]||etapaId}</div>`;
    itens.forEach(s=>html+=`<div class="hist-item ${s.tipo}"><span class="hist-badge ${s.tipo}">${s.badge}</span><div class="hist-content"><div>${s.texto}</div><div class="hist-meta">${s.meta}</div></div></div>`);
    html+='</div>';
  });
  if(!html) html='<div style="color:var(--muted);font-size:0.82rem;text-align:center;padding:1rem;">Nenhum histórico registrado.</div>';
  el.innerHTML=html;
  _marcarHistoricoVisto(obra);
  document.getElementById('historico-modal').style.display='flex';
  // Atualizar footer para remover badge
  const o=_obras.find(x=>x.id===obraId); if(o) renderObraModal(o);
}
function closeHistoricoModal(){ document.getElementById('historico-modal').style.display='none'; }

let _atribObraId=null,_atribEtapaId=null,_atribSubId=null,_atribModo=null;
let _atribItemId=null;
function openAtribuirModal(obraId,etapaId,subId,modo,itemId){
  _atribItemId=itemId||null;
  _atribObraId=obraId;_atribEtapaId=etapaId;_atribSubId=subId;_atribModo=modo||'atribuir';
  const cfg=ETAPAS_CONFIG[etapaId];
  const subCfg=(cfg.subEtapas||cfg.subEtapasTemplate||[]).find(s=>s.id===subId);
  document.getElementById('atrib-modal-title').textContent=(_atribModo==='reatribuir'?'Reatribuir':'Atribuir')+` — ${cfg.nome} · ${subCfg?.nome||subId}`;
  const jw=document.getElementById('atrib-justificativa-wrap'); if(jw) jw.style.display=_atribModo==='reatribuir'?'block':'none';
  const je=document.getElementById('atrib-justificativa'); if(je) je.value='';
  const sel=document.getElementById('atrib-usuario-sel');
  const allUsers=typeof users!=='undefined'?users:[];
  const usrs=allUsers.filter(u=>u.isSuperAdmin||(u.acessos||[]).includes('adminComercial')||(u.acessos||[]).includes('comercial')||u.role==='admin'||u.role==='superAdmin');
  const lista=usrs.length>0?usrs:allUsers;
  sel.innerHTML=`<option value="">Selecione o responsável...</option>`+lista.map(u=>`<option value="${u.username}">${u.username}${u.username===currentUser?.username?' (você)':''}</option>`).join('');
  const obra=_obras.find(o=>o.id===obraId);
  const ref=obra?_findSubRef(obra.etapas||{},etapaId,subId,_atribItemId):null;
  if(ref?.sub?.responsavel) sel.value=ref.sub.responsavel;
  document.getElementById('atrib-modal').style.display='flex';
}
function closeAtribuirModal(){ document.getElementById('atrib-modal').style.display='none'; _atribObraId=_atribEtapaId=_atribSubId=_atribModo=null; }
async function saveAtribuicao(){
  const usuario=document.getElementById('atrib-usuario-sel')?.value;
  if(!usuario){showComercialToast('Selecione um responsável.','error');return;}
  if(_atribModo==='reatribuir'){const j=document.getElementById('atrib-justificativa')?.value.trim();if(!j){showComercialToast('Informe a justificativa.','error');return;}}
  const obra=_obras.find(o=>o.id===_atribObraId); if(!obra) return;
  const etapas=JSON.parse(JSON.stringify(obra.etapas));
  const ref=_findSubRef(etapas,_atribEtapaId,_atribSubId,_atribItemId);
  if(!ref){showComercialToast('Sub-etapa não encontrada.','error');return;}
  const anterior=ref.sub.responsavel||null;
  ref.sub.responsavel=usuario;
  if(!ref.sub.historicoAtribuicao) ref.sub.historicoAtribuicao=[];
  ref.sub.historicoAtribuicao.push({de:anterior||currentUser.username,para:usuario,data:new Date().toISOString().slice(0,10),justificativa:_atribModo==='reatribuir'?(document.getElementById('atrib-justificativa')?.value.trim()||null):null,por:currentUser.username});
  await db.collection('obras').doc(_atribObraId).update({etapas});
  showComercialToast(`Atribuído para ${usuario}! ✅`,'success');
  closeAtribuirModal();
}


// ── Filtro Minhas Pendências + Período ────────────────────────────────────────
let _dropdownAberto = false;

function toggleMinhasPendencias() {
  const btn  = document.getElementById('btn-minhas-pendencias');
  const wrap = document.getElementById('periodo-wrap');

  if (_dropdownAberto) {
    // Fechar dropdown
    _dropdownAberto = false;
    if(wrap) wrap.style.display = 'none';
  } else {
    // Abrir dropdown e ativar filtro
    _dropdownAberto = true;
    _filtroMinhasPendencias = true;
    _paginaAtual = 0;
    if(wrap) wrap.style.display = 'flex';
    renderObras();
  }

  if(btn){
    if(_filtroMinhasPendencias){
      btn.style.background='var(--accent)';
      btn.style.color='#fff';
      btn.style.borderColor='var(--accent)';
    } else {
      btn.style.background='';
      btn.style.color='';
      btn.style.borderColor='';
    }
  }
}

function limparPeriodo() {
  _filtroPeriodoDe=''; _filtroPeriodoAte='';
  const de=document.getElementById('periodo-de'), ate=document.getElementById('periodo-ate');
  if(de) de.value=''; if(ate) ate.value='';
  // Desativar filtro e fechar dropdown
  _filtroMinhasPendencias=false; _dropdownAberto=false;
  const btn=document.getElementById('btn-minhas-pendencias');
  const wrap=document.getElementById('periodo-wrap');
  if(wrap) wrap.style.display='none';
  if(btn){ btn.style.background=''; btn.style.color=''; btn.style.borderColor=''; }
  renderObras();
}

// Fechar dropdown ao clicar fora
document.addEventListener('click', e => {
  if(!_dropdownAberto) return;
  const btn  = document.getElementById('btn-minhas-pendencias');
  const wrap = document.getElementById('periodo-wrap');
  if(btn && !btn.contains(e.target) && wrap && !wrap.contains(e.target)){
    _dropdownAberto = false;
    wrap.style.display = 'none';
  }
});


let _cToast=null;
function showComercialToast(msg,type='success') {
  let t=document.getElementById('comercial-toast');
  if(!t){t=document.createElement('div');t.id='comercial-toast';t.className='comercial-toast';document.body.appendChild(t);}
  t.textContent=msg; t.className=`comercial-toast ${type}`;
  requestAnimationFrame(()=>t.classList.add('show'));
  if(_cToast) clearTimeout(_cToast);
  _cToast=setTimeout(()=>t.classList.remove('show'),3200);
}

// ── Destaque de card via URL ─────────────────────────────────────────────────
function highlightObraFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const obraId = params.get('obra');
  if (!obraId) return;
  // Aguardar o DOM renderizar os cards
  setTimeout(() => {
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
  const savedId=localStorage.getItem('chamados-current-user-id');
  if(!savedId){window.location.href='login.html';return;}
  const user=users.find(u=>u.id===savedId);
  if(!user){window.location.href='login.html';return;}
  const acessos=user.acessos||[];
  if(!user.isSuperAdmin&&!user.isAdminComercial&&!user.isComercial&&!acessos.includes('comercial')&&!acessos.includes('adminComercial')){
    window.location.href='menu.html';return;
  }
  currentUser=user;
  if(typeof initDarkMode==='function') initDarkMode();
  if(typeof initSessionTimer==='function') initSessionTimer(user.role);
  const collapsed=localStorage.getItem('chamados-sidebar-collapsed')==='1';
  const sidebar=document.getElementById('chamados-sidebar'),icon=document.getElementById('sidebar-toggle-icon');
  if(sidebar){sidebar.classList.add('no-transition');if(collapsed){sidebar.classList.add('collapsed');if(icon)icon.textContent='›';}requestAnimationFrame(()=>requestAnimationFrame(()=>sidebar.classList.remove('no-transition')));}
  const syncBtn=document.getElementById('sync-fab-nav'),configBtn=document.getElementById('sidebar-config-btn');
  if(syncBtn) syncBtn.style.display=user.isSuperAdmin?'flex':'none';
  if(configBtn) configBtn.style.display=(user.isAdmin||user.isSuperAdmin)?'flex':'none';
  const acessosTI=user.isSuperAdmin?['chamados','materiais','inventario','rotinas']:(user.acessos||[]);
  ['materiais','inventario','rotinas'].forEach(mod=>{const el=document.getElementById('sub-'+mod);if(el)el.style.display=(user.isSuperAdmin||acessosTI.includes(mod))?'flex':'none';});
  const canComercial=user.isSuperAdmin||user.isAdminComercial||user.isComercial||acessos.includes('comercial')||acessos.includes('adminComercial');
  const modBtn=document.getElementById('mod-pai-comercial-btn');
  if(modBtn) modBtn.style.display=canComercial?'flex':'none';
  if(typeof initModPai==='function') initModPai('comercial');
  const avatar=document.getElementById('cs-sidebar-avatar'),nameEl=document.getElementById('cs-sidebar-name'),roleEl=document.getElementById('cs-sidebar-role');
  if(avatar) avatar.textContent=user.username.charAt(0).toUpperCase();
  if(nameEl) nameEl.textContent=capitalizeName(user.username);
  if(roleEl) roleEl.innerHTML=getSectorBadge(user);
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
let _dpObraId=null, _dpEtapaId=null, _dpSubId=null;

function openDataPrevistaModal(obraId, etapaId, subId) {
  _dpObraId=obraId; _dpEtapaId=etapaId; _dpSubId=subId;
  const cfg=ETAPAS_CONFIG[etapaId];
  const subCfg=(cfg.subEtapas||[]).find(s=>s.id===subId);
  const obra=_obras.find(o=>o.id===obraId);
  const sub=obra?.etapas?.[etapaId]?.subEtapas?.[subId];
  const titleEl=document.getElementById('dp-modal-title');
  if(titleEl) titleEl.textContent=`Data Prevista — ${subCfg?.nome||subId}`;
  const input=document.getElementById('dp-data-input');
  if(input){ input.value=sub?.dataPrevista||''; }
  const modal=document.getElementById('dp-modal');
  if(modal) modal.style.display='flex';
}

function closeDataPrevistaModal() {
  const modal=document.getElementById('dp-modal');
  if(modal) modal.style.display='none';
  _dpObraId=_dpEtapaId=_dpSubId=null;
}

async function saveDataPrevista() {
  const data=document.getElementById('dp-data-input')?.value;
  if(!data){ showComercialToast('Selecione uma data.','error'); return; }
  const obra=_obras.find(o=>o.id===_dpObraId); if(!obra) return;
  const etapas=JSON.parse(JSON.stringify(obra.etapas));
  if(etapas[_dpEtapaId]?.subEtapas?.[_dpSubId]) {
    etapas[_dpEtapaId].subEtapas[_dpSubId].dataPrevista=data;
  }
  await db.collection('obras').doc(_dpObraId).update({etapas});
  showComercialToast('Data prevista salva! ✅','success');
  closeDataPrevistaModal();
}

document.addEventListener('DOMContentLoaded',_initComercialPage);
document.addEventListener('DOMContentLoaded',_initAcaoDelegate);