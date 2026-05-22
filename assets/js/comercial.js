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
  cno: {
    id:'cno', nome:'CNO/SBOBRAS', short:'CNO', opcional:false, cor:'#f97316',
    subEtapas:[
      {id:'conclusao', nome:'Conclusão', dias:10, refEtapa:'contrato', refSub:'assinatura',        isNovaDataZero:false, dateLivre:false},
    ]
  },
  aditivos: {
    id:'aditivos', nome:'Aditivos / Termo', short:'Aditivos', opcional:true, cor:'#ec4899',
    subEtapas:[
      {id:'em_analise',             nome:'Em Análise',               dias:0, refEtapa:null,       refSub:null,                     isNovaDataZero:false, dateLivre:true,  isAnalise:true},
      {id:'comparativo_recebimento', nome:'Recebimento do Comparativo',  dias:0, refEtapa:null,       refSub:null,                     isNovaDataZero:true,  dateLivre:false},
      {id:'carta_envio',             nome:'Envio da Carta Aditiva',      dias:2, refEtapa:'aditivos', refSub:'comparativo_recebimento', isNovaDataZero:false, dateLivre:false},
      {id:'carta_aprovacao',         nome:'Aprovação da Carta Aditiva',  dias:3, refEtapa:'aditivos', refSub:'carta_envio',             isNovaDataZero:false, dateLivre:false},
      {id:'termo_envio',             nome:'Envio do Termo Aditivo',      dias:3, refEtapa:'aditivos', refSub:'carta_aprovacao',         isNovaDataZero:false, dateLivre:false},
      {id:'termo_assinatura',        nome:'Assinatura do Termo Aditivo', dias:5, refEtapa:'aditivos', refSub:'carta_envio',             isNovaDataZero:false, dateLivre:false},
    ]
  },
  medicao: {
    id:'medicao', nome:'Medição', short:'Medição', opcional:true, cor:'#6b7280',
    subEtapas:[
      {id:'em_analise', nome:'Em Análise', dias:0, refEtapa:null,      refSub:null,    isNovaDataZero:false, dateLivre:true, isAnalise:true},
      {id:'envio',      nome:'Envio',      dias:0, refEtapa:null,      refSub:null,    isNovaDataZero:false, dateLivre:true},
      {id:'aprovacao',  nome:'Aprovação',  dias:2, refEtapa:'medicao', refSub:'envio', isNovaDataZero:false, dateLivre:false},
    ]
  },
};

const ETAPAS_ORDER = ['proposta','contrato','cno','aditivos','medicao'];

const REPRESENTANTES = ['Verdile','Ricardo','Sebastião','Ângelo','Sérgio','Matheus','Henrique','Flávio','Gazzo'];

// ── Init estrutura etapas ─────────────────────────────────────────────────────
function initObraEtapas(dataFechamento) {
  const etapas = {};
  ETAPAS_ORDER.forEach(etapaId => {
    const cfg = ETAPAS_CONFIG[etapaId];
    const isFirst = etapaId === 'proposta';
    etapas[etapaId] = { status: isFirst ? 'active' : 'pending', ativa: !cfg.opcional, subEtapas: {} };
    cfg.subEtapas.forEach((sub, idx) => {
      const isFirstSub = isFirst && idx === 0;
      etapas[etapaId].subEtapas[sub.id] = {
        status:        isFirstSub ? 'active' : 'pending',
        dataLimite:    isFirstSub ? addDiasUteis(dataFechamento, sub.dias) : null,
        dataConclusao: null,
        motivoAtraso:  null,
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
let _paginaAtual=0;
let _obrasPorPagina=parseInt(localStorage.getItem('comercial-per-page')||'12');

function setFiltroRep(val)     { _filtroRep=val;     _paginaAtual=0; renderObras(); }
function setFiltroEtapa(val)   { _filtroEtapa=val;   _paginaAtual=0; renderObras(); }
function setFiltroDataDe(val)  { _filtroDataDe=val;  _paginaAtual=0; renderObras(); }
function setFiltroDataAte(val)    { _filtroDataAte=val;      _paginaAtual=0; renderObras(); }
function setFiltroEtapaAtraso(val) { _filtroEtapaAtraso=val; _paginaAtual=0; renderObras(); }
function setFiltroBusca(val)       { _filtroBusca=val.toLowerCase().trim(); _paginaAtual=0; renderObras(); }
function setObrasPorPagina(val){ _obrasPorPagina=parseInt(val); localStorage.setItem('comercial-per-page',val); _paginaAtual=0; renderObras(); }
function irParaPagina(p)       { _paginaAtual=p; renderObras(); window.scrollTo({top:0,behavior:'smooth'}); }

// ── Migração automática de schema ─────────────────────────────────────────────
const SCHEMA_VERSION = 2;

async function migrateObras() {
  try {
    const snap = await db.collection('obras').get();
    const toMigrate = snap.docs.filter(d => (d.data()._schemaVersion || 1) < SCHEMA_VERSION);
    if (!toMigrate.length) return;
    console.log(`[Migração] ${toMigrate.length} obra(s) para migrar para schema v${SCHEMA_VERSION}`);
    // Processar uma a uma para evitar erros de batch
    for (const doc of toMigrate) {
      try {
        const migrated = _migrateObraToV2(doc.data());
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
    cfg.subEtapas.forEach((sub, subIdx) => {
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
  return Object.values(e.subEtapas || {}).some(
    sub => sub.status !== 'done' && sub.dataLimite && sub.dataLimite < hoje
  );
}

function hasSubEtapaAtrasada(obra) {
  if (!obra.etapas || obra.concluida) return false;
  const hoje = new Date().toISOString().slice(0, 10);
  for (const id of ETAPAS_ORDER) {
    const e = obra.etapas[id];
    if (!e?.ativa) continue;
    for (const sub of Object.values(e.subEtapas || {})) {
      if (sub.status !== 'done' && sub.dataLimite && sub.dataLimite < hoje) return true;
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
      // Etapa opcional não iniciada — linha discreta
      if (!eData?.ativa) return `
        <div class="card-etapa-row inativa">
          <span class="card-etapa-dot" style="background:var(--surface3);border-color:var(--border2);">·</span>
          <span class="card-etapa-nome">${cfg2.short}</span>
          <span class="card-etapa-info">—</span>
        </div>`;
      const eStatus = eData.status || 'pending';
      const subs    = Object.values(eData.subEtapas || {});
      const atras   = subs.some(s=>s.status!=='done'&&s.dataLimite&&s.dataLimite<hoje2);
      const ultima  = subs.findLast?.(s=>s.status==='active') || subs.find(s=>s.status==='active');
      const limite  = ultima?.dataLimite;
      const concl   = eData.status==='done' ? subs.findLast?.(s=>s.dataConclusao)?.dataConclusao : null;
      let dot='', dotStyle='', info='';
      if (obra.concluida || eStatus==='done') {
        dot='✓'; dotStyle=`background:#22c55e;border-color:#22c55e;color:#fff;`;
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
      return `
        <div class="card-etapa-row">
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
  const btn=document.getElementById('btn-save-nova-obra');
  if(btn){btn.disabled=true;btn.textContent='Salvando...';}
  try {
    const etapas = initObraEtapas(fechamento);
    await db.collection('obras').add({
      numero, nome, representante:rep, dataFechamento:fechamento,
      cidade: cidade||'', estado: estado||'',
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
    if (!eData?.ativa) {
      // Etapa pulada — mostrar com badge especial e botão Iniciar
      const isPulada = eData?.status === 'pulada';
      const canIniciarOpc = !obra.concluida;
      return `<div class="etapa-item">
        <div class="etapa-icon pending" style="${isPulada?'opacity:0.5;':'opacity:0.4;'}">⏭</div>
        <div class="etapa-content">
          <div class="etapa-nome" style="opacity:${isPulada?'0.7':'0.6'};">
            ${cfg.nome}
            ${isPulada?`<span style="font-size:0.65rem;font-weight:700;color:#6b7280;background:var(--surface3);padding:0.1rem 0.4rem;border-radius:4px;margin-left:0.25rem;">Pulada</span>`:'<span style="font-size:0.65rem;font-weight:400;color:var(--muted);">(opcional)</span>'}
            ${canIniciarOpc?`<button class="sub-action-btn concluir" style="font-size:0.68rem;padding:0.15rem 0.5rem;" onclick="iniciarEtapa('${obra.id}','${etapaId}')">▶ Iniciar</button>`:''}
          </div>
          ${isPulada&&eData.puladaPor?`<div style="font-size:0.68rem;color:var(--muted);font-family:var(--font-mono);margin-top:0.2rem;">Pulada por ${eData.puladaPor}</div>`:''}
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
      const canConcluir=subStatus==='active'&&!obra.concluida;
      const canMotivo=atrasada&&!subData.motivoAtraso;
      const canRevisaoSub=subStatus!=='pending'&&!obra.concluida;
      const canProrrogar=subStatus==='active'&&!obra.concluida;
      const subRevisoes=(subData.revisoes||[]);

      let dataInfo='';
      // Sub-etapa Em Análise: mostrar "A X dias nessa sub-etapa"
      if (subCfg.isAnalise && subStatus==='active' && subData.dataInicio) {
        const ini  = new Date(subData.dataInicio+'T12:00:00');
        const agora= new Date(); agora.setHours(0,0,0,0);
        const dias = Math.floor((agora-ini)/(1000*60*60*24));
        dataInfo=`<span class="sub-data" style="color:#8b5cf6;font-weight:700;">🕐 A ${dias} dia${dias!==1?'s':''} nesta sub-etapa</span>`;
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

      const actions=[
        canConcluir?`<button class="sub-action-btn concluir" onclick="concluirSubEtapa('${obra.id}','${etapaId}','${subCfg.id}')">✓ Concluir</button>`:'',
        canMotivo?`<button class="sub-action-btn motivo" onclick="openMotivoAtrasoModal('${obra.id}','${etapaId}','${subCfg.id}')">📌 Registrar motivo</button>`:'',
        canRevisaoSub?`<button class="sub-action-btn revisao" onclick="openRevisaoModal('${obra.id}','${etapaId}','${subCfg.id}')">↩ Revisão${subRevisoes.length?` (${subRevisoes.length})`:''}</button>`:'',
        canProrrogar?`<button class="sub-action-btn prorrogar" onclick="openProrrogarModal('${obra.id}','${etapaId}','${subCfg.id}')">+ Prorrogar</button>`:'',
      ].filter(Boolean).join('');
      return `<div class="sub-etapa-item">
        <div class="sub-etapa-icon ${iconCls}" ${iconCls==='active'?`style="background:${cor};border-color:${cor};"`:iconCls==='atrasada'?'style="background:#ef4444;border-color:#ef4444;"':''}>${statusIcon}</div>
        <div class="sub-etapa-content">
          <div class="sub-etapa-nome">${subCfg.nome}${atrasada?' <span class="sub-atraso-label">ATRASADO</span>':''}</div>
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
        <div class="etapa-nome" style="${etapaStatus==='active'?`color:${cor};`:''}">
          ${cfg.nome}
          ${cfg.opcional?'<span style="font-size:0.65rem;font-weight:400;color:var(--muted);">(opcional)</span>':''}
          ${canIniciar?`<button class="sub-action-btn concluir" style="font-size:0.68rem;padding:0.2rem 0.55rem;" onclick="iniciarEtapa('${obra.id}','${etapaId}')">▶ Iniciar</button>`:''}
          ${!obra.concluida&&etapaStatus!=='done'?`<button class="sub-action-btn motivo" style="font-size:0.68rem;padding:0.2rem 0.55rem;" onclick="pularEtapa('${obra.id}','${etapaId}')">⏭ Pular</button>`:''}
          ${canRevisao?`<button class="etapa-revisao-btn" onclick="openRevisaoModal('${obra.id}','${etapaId}')">↩ Revisão</button>`:''}
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
  const adminBtns=canAdmin?`
    <button class="btn-secondary" onclick="openEditarObraModal('${obra.id}')" style="display:flex;align-items:center;gap:0.4rem;">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Editar
    </button>
    <button class="btn-secondary" onclick="excluirObra('${obra.id}')" style="display:flex;align-items:center;gap:0.4rem;color:#ef4444;border-color:#ef4444;">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg> Excluir
    </button>`:'';
  if (obra.concluida) {
    footer.innerHTML=`
      <div style="display:flex;gap:0.6rem;flex:1;flex-wrap:wrap;">${adminBtns}
        ${canAdmin?`<button class="btn-secondary" onclick="reabrirObra('${obra.id}')" style="display:flex;align-items:center;gap:0.4rem;">↩ Reabrir</button>`:''}
      </div>
      <div style="display:flex;gap:0.6rem;align-items:center;">
        <span style="font-size:0.78rem;color:var(--muted);">✅ Obra concluída</span>
        <button class="btn-secondary" onclick="closeObraModal()">Fechar</button>
      </div>`;
  } else {
    footer.innerHTML=`
      <div style="display:flex;gap:0.6rem;flex:1;flex-wrap:wrap;">${adminBtns}</div>
      <button class="btn-secondary" onclick="closeObraModal()">Fechar</button>`;
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
  etapas[etapaId].subEtapas[subId].status='done';
  etapas[etapaId].subEtapas[subId].dataConclusao=hoje;
  etapas[etapaId].subEtapas[subId].concluidoPor=currentUser.username;
  if (tipo) etapas[etapaId].subEtapas[subId].tipoConclusao=tipo;
  const subIdx=cfg.subEtapas.findIndex(s=>s.id===subId);
  const proxSub=cfg.subEtapas[subIdx+1];
  if (proxSub) {
    etapas[etapaId].subEtapas[proxSub.id].status='active';
    etapas[etapaId].subEtapas[proxSub.id].dataInicio=hoje;
    etapas[etapaId].subEtapas[proxSub.id].dataLimite=calcDataLimite(proxSub,etapas,obra.dataFechamento);
    await db.collection('obras').doc(obraId).update({etapas});
    showComercialToast(`"${proxSub.nome}" liberada! ✅`,'success');
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
  // Garantir que todas as sub-etapas existam (obras antigas podem não ter novas sub-etapas)
  if (!etapas[etapaId].subEtapas) etapas[etapaId].subEtapas = {};
  cfg.subEtapas.forEach((sub, idx) => {
    if (!etapas[etapaId].subEtapas[sub.id]) {
      etapas[etapaId].subEtapas[sub.id] = { status:'pending', dataLimite:null, dataConclusao:null, motivoAtraso:null, revisoes:[] };
    }
  });
  const primSub=cfg.subEtapas[0];
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
  await _concluirComTipo(_tipoConclObraId, _tipoConclEtapaId, _tipoConclSubId, tipo);
  _tipoConclObraId=_tipoConclEtapaId=_tipoConclSubId=null;
}

// ── Prorrogar sub-etapa ───────────────────────────────────────────────────────
let _prorrogarObraId=null,_prorrogarEtapaId=null,_prorrogarSubId=null;

function openProrrogarModal(obraId,etapaId,subId) {
  _prorrogarObraId=obraId;_prorrogarEtapaId=etapaId;_prorrogarSubId=subId;
  const subCfg=ETAPAS_CONFIG[etapaId].subEtapas.find(s=>s.id===subId);
  const obra=_obras.find(o=>o.id===obraId);
  const sub=obra?.etapas?.[etapaId]?.subEtapas?.[subId];
  const limFmt=sub?.dataLimite?new Date(sub.dataLimite+'T12:00:00').toLocaleDateString('pt-BR'):'—';
  const title=document.getElementById('prorrogar-modal-title');
  if(title) title.textContent=`Prorrogar — ${ETAPAS_CONFIG[etapaId].nome} · ${subCfg?.nome||''}`;
  const info=document.getElementById('prorrogar-modal-info');
  if(info) info.textContent=`Limite atual: ${limFmt}${sub?.diasProrrogados?` (já prorrogado ${sub.diasProrrogados}x)`:''}`; 
  // Definir mínimo como amanhã
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
  const sub=etapas[_prorrogarEtapaId].subEtapas[_prorrogarSubId];
  sub.dataLimite=novaData;
  sub.prorrogadoPor=currentUser.username;
  sub.prorrogadoEm=hoje;
  sub.diasProrrogados=(sub.diasProrrogados||0)+1;
  await db.collection('obras').doc(_prorrogarObraId).update({etapas});
  showComercialToast(`Prazo atualizado para ${new Date(novaData+'T12:00:00').toLocaleDateString('pt-BR')}! ✅`,'success');
  closeProrrogarModal();
}


// ── Modal motivo de atraso ────────────────────────────────────────────────────
let _motivoObraId=null,_motivoEtapaId=null,_motivoSubId=null;
function openMotivoAtrasoModal(obraId,etapaId,subId) {
  _motivoObraId=obraId;_motivoEtapaId=etapaId;_motivoSubId=subId;
  const subCfg=ETAPAS_CONFIG[etapaId].subEtapas.find(s=>s.id===subId);
  const title=document.getElementById('motivo-modal-title');
  if(title) title.textContent=`Motivo de Atraso — ${ETAPAS_CONFIG[etapaId].nome} · ${subCfg?.nome||''}`;
  document.getElementById('motivo-input').value='';
  document.getElementById('motivo-atraso-modal').style.display='flex';
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
    const subCfg=ETAPAS_CONFIG[etapaId].subEtapas.find(s=>s.id===subId);
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
    // Atualizar dataLimite para a data da revisão
    if (sub.status !== 'done') sub.dataLimite = novaRevisao.data;
  } else {
    // Revisão na etapa
    if(!etapas[_revisaoEtapaId].revisoes) etapas[_revisaoEtapaId].revisoes=[];
    novaRevisao.numero=etapas[_revisaoEtapaId].revisoes.length+1;
    etapas[_revisaoEtapaId].revisoes.push(novaRevisao);
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
  const NOMES = {proposta:'Proposta Consolidada',contrato:'Contrato',cno:'CNO/SBOBRAS',aditivos:'Aditivos/Termo',medicao:'Medição'};
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
      const dt   = s.dataConclusao
        ? `${new Date(s.dataConclusao+'T12:00:00').toLocaleDateString('pt-BR')}${por}`
        : s.dataLimite
          ? `Limite: ${new Date(s.dataLimite+'T12:00:00').toLocaleDateString('pt-BR')}`
          : '—';
      return `<tr>
        <td style="padding:4px 8px 4px 20px;color:${corSt};font-weight:600;white-space:nowrap;">${st}</td>
        <td style="padding:4px 8px;">${sub.nome}${tipo}</td>
        <td style="padding:4px 8px;font-family:monospace;font-size:10px;color:#6b7280;">${dt}</td>
      </tr>`;
    }).join('');
    return `<tr style="background:#f9fafb;"><td colspan="3" style="padding:6px 8px;font-weight:700;color:${corStatus};border-left:3px solid ${corStatus};">${cfg.nome} — ${statusEtapa}</td></tr>${subsHtml}`;
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
    <div class="meta"><span>👤 ${obra.representante||'—'}</span><span>📅 Fechamento: ${obra.dataFechamento?new Date(obra.dataFechamento+'T12:00:00').toLocaleDateString('pt-BR'):'—'}</span>${obra.prazoEstimado?`<span>⏱ Prazo: ${new Date(obra.prazoEstimado+'T12:00:00').toLocaleDateString('pt-BR')}</span>`:''}</div></div>
    <table><thead><tr><th>Status</th><th>Etapa / Sub-etapa</th><th>Data</th></tr></thead><tbody>${etapasHtml}</tbody></table>
    <div class="footer">Premovale T.I — Gerado em ${hoje}</div>
    <script>window.onload=()=>{window.print();}<\/script></body></html>`;
  const w=window.open('','_blank'); w.document.write(html); w.document.close();
}

// ── Relatório ─────────────────────────────────────────────────────────────────
function openRelatorioModal()  { document.getElementById('relatorio-modal').style.display='flex'; }
function closeRelatorioModal() { document.getElementById('relatorio-modal').style.display='none'; }

function _gerarDadosRelatorio() {
  const incluirTodas = document.getElementById('rel-todas')?.checked;
  const hoje = new Date().toISOString().slice(0,10);
  const linhas = [];
  const NOMES_ETAPA = {proposta:'Proposta Consolidada',contrato:'Contrato',cno:'CNO/SBOBRAS',aditivos:'Aditivos/Termo',medicao:'Medição'};

  _obras.filter(o => !o.concluida).forEach(obra => {
    ETAPAS_ORDER.forEach(etapaId => {
      const e = obra.etapas?.[etapaId];
      if (!e?.ativa) return;
      ETAPAS_CONFIG[etapaId].subEtapas.forEach(subCfg => {
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
      const cor = l.status==='Atrasada'?'#fee2e2':l.status==='Vencendo'?'#fef3c7':'#ffffff';
      const cols=[l.numero,l.nome,l.representante,l.etapa,l.subEtapa,l.status,l.dataLimite,l.diasAtraso];
      return `<tr style="background:${cor};">${cols.map(c=>`<td style="padding:5px 8px;border:1px solid #e5e7eb;">${escXml(c)}</td>`).join('')}</tr>`;
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
  const rows = linhas.map(l => `
    <tr>
      <td>#${l.numero}</td>
      <td><strong>${l.nome}</strong></td>
      <td>${l.representante}</td>
      <td>${l.etapa}</td>
      <td>${l.subEtapa}</td>
      <td><span class="badge ${l.status==='Atrasada'?'red':l.status==='Vencendo'?'amber':'blue'}">${l.status}</span></td>
      <td>${l.dataLimite}</td>
      <td>${l.diasAtraso}</td>
    </tr>`).join('');
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>Relatório de Obras — Premovale</title>
    <style>
      body{font-family:Arial,sans-serif;font-size:11px;color:#1f2937;margin:0;padding:24px;}
      .header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #ef4444;padding-bottom:12px;margin-bottom:20px;}
      .header h1{font-size:16px;margin:0;color:#ef4444;}
      .header span{font-size:10px;color:#6b7280;}
      table{width:100%;border-collapse:collapse;}
      th{background:#f3f4f6;padding:6px 8px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #e5e7eb;}
      td{padding:6px 8px;border-bottom:1px solid #f3f4f6;vertical-align:top;}
      tr:nth-child(even) td{background:#fafafa;}
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
      <thead><tr><th>Nº</th><th>Obra</th><th>Representante</th><th>Etapa</th><th>Sub-etapa</th><th>Status</th><th>Data Limite</th><th>Atraso</th></tr></thead>
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

document.addEventListener('DOMContentLoaded',_initComercialPage);