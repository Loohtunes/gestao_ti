// ===== COMERCIAL v2 — Sub-etapas, Dias Úteis, Feriados =====

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
      {id:'envio',     nome:'Envio',     dias:0, refEtapa:null,      refSub:null,    isNovaDataZero:false, dateLivre:true},
      {id:'aprovacao', nome:'Aprovação', dias:2, refEtapa:'medicao', refSub:'envio', isNovaDataZero:false, dateLivre:false},
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
let _filtroDataDe='', _filtroDataAte='';
let _paginaAtual=0;
let _obrasPorPagina=parseInt(localStorage.getItem('comercial-per-page')||'12');

function setFiltroRep(val)     { _filtroRep=val;     _paginaAtual=0; renderObras(); }
function setFiltroEtapa(val)   { _filtroEtapa=val;   _paginaAtual=0; renderObras(); }
function setFiltroDataDe(val)  { _filtroDataDe=val;  _paginaAtual=0; renderObras(); }
function setFiltroDataAte(val) { _filtroDataAte=val; _paginaAtual=0; renderObras(); }
function setObrasPorPagina(val){ _obrasPorPagina=parseInt(val); localStorage.setItem('comercial-per-page',val); _paginaAtual=0; renderObras(); }
function irParaPagina(p)       { _paginaAtual=p; renderObras(); window.scrollTo({top:0,behavior:'smooth'}); }

// ── Migração automática de schema ─────────────────────────────────────────────
const SCHEMA_VERSION = 2;

async function migrateObras() {
  try {
    // Buscar obras com schema antigo (sem _schemaVersion ou versão < atual)
    const snap = await db.collection('obras').get();
    const toMigrate = snap.docs.filter(d => {
      const data = d.data();
      return (data._schemaVersion || 1) < SCHEMA_VERSION;
    });

    if (!toMigrate.length) return; // Nada a migrar

    console.log(`[Migração] ${toMigrate.length} obra(s) para migrar para schema v${SCHEMA_VERSION}`);

    const batch = db.batch();
    for (const doc of toMigrate) {
      const obra = doc.data();
      const migrated = _migrateObraToV2(obra);
      batch.update(doc.ref, migrated);
    }
    await batch.commit();
    console.log(`[Migração] Concluída com sucesso! ${toMigrate.length} obra(s) migrada(s).`);
  } catch (e) {
    console.error('[Migração] Erro:', e);
  }
}

function _migrateObraToV2(obra) {
  // Schema v1 → v2: array de etapas → objeto com sub-etapas
  // Detectar se já é v2 (etapas como objeto com chave 'proposta')
  if (obra.etapas && !Array.isArray(obra.etapas) && obra.etapas['proposta']) {
    return { _schemaVersion: SCHEMA_VERSION };
  }

  const etapaAtualIdx = obra.etapaAtual ?? 0;
  const etapasAntigas = Array.isArray(obra.etapas) ? obra.etapas : [];
  const dataFechamento = obra.dataFechamento
    || (obra.createdAt?.toDate ? obra.createdAt.toDate().toISOString().slice(0,10) : new Date().toISOString().slice(0,10));

  // Mapear índice antigo → id novo
  const idxToId = ['proposta','contrato','cno','aditivos','medicao'];

  const novasEtapas = {};
  ETAPAS_ORDER.forEach((etapaId, idx) => {
    const cfg = ETAPAS_CONFIG[etapaId];
    const antigaEtapa = etapasAntigas[idx] || {};
    // Status baseado no índice vs etapa atual
    let etapaStatus = 'pending';
    if (idx < etapaAtualIdx)  etapaStatus = 'done';
    if (idx === etapaAtualIdx) etapaStatus = 'active';
    if (obra.concluida)        etapaStatus = 'done';

    // Etapas opcionais: marcar ativa apenas se estava no fluxo original
    const eraAtiva = idx <= etapaAtualIdx || obra.concluida;

    novasEtapas[etapaId] = {
      status: etapaStatus,
      ativa:  cfg.opcional ? eraAtiva : true,
      revisoes: antigaEtapa.revisoes || [],
      subEtapas: {},
    };

    cfg.subEtapas.forEach((sub, subIdx) => {
      let subStatus = 'pending';
      if (idx < etapaAtualIdx)  subStatus = 'done';
      if (idx === etapaAtualIdx) subStatus = subIdx === 0 ? 'active' : 'pending';
      if (obra.concluida)        subStatus = 'done';

      novasEtapas[etapaId].subEtapas[sub.id] = {
        status:        subStatus,
        dataLimite:    null, // Não temos como recalcular retroativamente
        dataConclusao: subStatus === 'done' ? (antigaEtapa.dataConclusao || null) : null,
        motivoAtraso:  null,
        revisoes:      [],
      };
    });
  });

  return {
    _schemaVersion: SCHEMA_VERSION,
    etapas:         novasEtapas,
    dataFechamento: dataFechamento,
    numero:         obra.numero || obra.id?.slice(-6).toUpperCase() || '—',
    // Limpar campos do schema antigo
    etapaAtual:     firebase.firestore.FieldValue.delete(),
  };
}

// ── Carregar obras ────────────────────────────────────────────────────────────
function initComercial() {
  if (_unsubObras) _unsubObras();
  // Migrar obras antigas antes de começar a ouvir
  migrateObras().then(() => {
    _unsubObras = db.collection('obras').orderBy('createdAt','desc').onSnapshot(snap => {
      _obras = snap.docs.map(d => ({id:d.id,...d.data()}));
      renderObras();
      if (_obraAtual) { const obra=_obras.find(o=>o.id===_obraAtual); if(obra) renderObraModal(obra); }
    }, err => console.error(err));
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getEtapaAtualId(obra) {
  if (!obra.etapas) return 'proposta';
  // Verificar se CNO está aguardando escolha
  if (obra.etapas['cno']?.status === 'aguardando') return 'aguardando';
  // Procurar etapa ativa
  for (const id of ETAPAS_ORDER) {
    const e = obra.etapas[id];
    if (e?.ativa && e?.status === 'active') return id;
  }
  // Nenhuma ativa — retornar última done (evita fallback para proposta)
  let ultimaDone = null;
  for (const id of ETAPAS_ORDER) {
    if (obra.etapas[id]?.status === 'done') ultimaDone = id;
  }
  if (obra.concluida) return 'concluida';
  return ultimaDone || 'proposta';
}

function hasSubEtapaAtrasada(obra) {
  if (!obra.etapas || obra.concluida) return false;
  const hoje = new Date().toISOString().slice(0,10);
  for (const id of ETAPAS_ORDER) {
    const e = obra.etapas[id];
    if (!e?.ativa) continue;
    for (const sub of Object.values(e.subEtapas||{})) {
      if (sub.status !== 'done' && sub.dataLimite && sub.dataLimite < hoje) return true;
    }
  }
  return false;
}

function getPrazoInfo(prazo) {
  if (!prazo) return {texto:'Sem prazo definido', cls:''};
  const d=new Date(prazo+'T12:00:00'), hoje=new Date(); hoje.setHours(0,0,0,0);
  const diff=Math.ceil((d-hoje)/(1000*60*60*24));
  const fmt=d.toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'});
  if (diff<0)  return {texto:`Vencido em ${fmt}`, cls:'vencido'};
  if (diff<=7) return {texto:`${diff}d restantes — ${fmt}`, cls:'urgente'};
  return {texto:`Prazo: ${fmt}`, cls:''};
}

// ── Renderizar cards ──────────────────────────────────────────────────────────
function renderObras() {
  const el = document.getElementById('obras-grid');
  if (!el) return;

  // Aplicar filtros
  let lista = [..._obras];
  if (_filtroRep)     lista = lista.filter(o => o.representante===_filtroRep);
  if (_filtroEtapa)   lista = lista.filter(o => getEtapaAtualId(o)===_filtroEtapa);
  if (_filtroDataDe)  lista = lista.filter(o => o.dataFechamento && o.dataFechamento >= _filtroDataDe);
  if (_filtroDataAte) lista = lista.filter(o => o.dataFechamento && o.dataFechamento <= _filtroDataAte);

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
    const cor       = obra.concluida ? '#22c55e'
                    : etapaId === 'aguardando' ? '#f59e0b'
                    : cfg?.cor || 'var(--muted)';
    const etapaNome = obra.concluida ? 'Concluída'
                    : etapaId === 'aguardando' ? 'Em espera'
                    : (cfg?.short || '—');
    const badgeCls  = obra.concluida ? 'etapa-concluida'
                    : etapaId === 'aguardando' ? 'etapa-aguardando'
                    : `etapa-${etapaId}`;
    const prazoInfo = getPrazoInfo(obra.prazoEstimado);
    const atrasada  = hasSubEtapaAtrasada(obra);
    const etapasAtivas = ETAPAS_ORDER.filter(id => obra.etapas?.[id]?.ativa!==false);
    const progressBar  = etapasAtivas.map(id => {
      const status = obra.etapas?.[id]?.status||'pending';
      const cor2   = ETAPAS_CONFIG[id].cor;
      const style  = status==='active'?`style="background:${cor2};"` :'';
      const cls    = obra.concluida||status==='done'?'done':status==='active'?'active':'';
      return `<div class="obra-progress-step ${cls}" ${style}></div>`;
    }).join('');
    return `
    <div class="obra-card" style="border-left:4px solid ${cor};" onclick="openObraModal('${obra.id}')">
      ${atrasada?'<span class="obra-atrasado-badge">⚠ Atrasado</span>':''}
      <div class="obra-card-header">
        <div>
          <div class="obra-card-numero">#${obra.numero||obra.id.slice(-6).toUpperCase()}</div>
          <div class="obra-card-nome">${obra.nome}</div>
        </div>
        <span class="obra-etapa-badge ${badgeCls}">${etapaNome}</span>
      </div>
      <div class="obra-card-rep">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        ${obra.representante||'—'}
      </div>
      <div class="obra-progress"><div class="obra-progress-bar">${progressBar}</div></div>
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
  const canAdmin=currentUser?.isSuperAdmin||currentUser?.isAdminComercial;
  document.getElementById('obra-modal-meta').innerHTML=`
    <span>👤 ${obra.representante||'—'}</span>
    <span>📅 Fechamento: ${obra.dataFechamento?new Date(obra.dataFechamento+'T12:00:00').toLocaleDateString('pt-BR'):'—'}</span>
    <span class="${prazoInfo.cls}">⏱ ${prazoInfo.texto}</span>`;
  const tl=document.getElementById('obra-timeline'); if(!tl) return;
  const hoje=new Date().toISOString().slice(0,10);
  tl.innerHTML=ETAPAS_ORDER.map(etapaId => {
    const cfg=ETAPAS_CONFIG[etapaId];
    const eData=obra.etapas?.[etapaId];
    if (!eData?.ativa) return `<div class="etapa-item etapa-inativa">
      <div class="etapa-icon pending" style="opacity:0.35;">—</div>
      <div class="etapa-content" style="opacity:0.4;">
        <div class="etapa-nome">${cfg.nome} <span style="font-size:0.65rem;font-weight:400;color:var(--muted);">(não aplicável)</span></div>
      </div></div>`;
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
      const subRevisoes=(subData.revisoes||[]);

      let dataInfo='';
      if (subData.dataConclusao) {
        const por = subData.concluidoPor ? ` — por ${subData.concluidoPor}` : '';
        dataInfo=`<span class="sub-data concluida">✓ ${new Date(subData.dataConclusao+'T12:00:00').toLocaleDateString('pt-BR')}${por}</span>`;
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
    return `<div class="etapa-item">
      <div class="etapa-icon ${etapaIconCls}" ${etapaIconStyle}>${etapaStatus==='done'?'✓':''}</div>
      <div class="etapa-content">
        <div class="etapa-nome" style="${etapaStatus==='active'?`color:${cor};`:''}">
          ${cfg.nome}
          ${cfg.opcional?'<span style="font-size:0.65rem;font-weight:400;color:var(--muted);">(opcional)</span>':''}
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

  // Se CNO aguardando escolha, reabrir modal automaticamente
  if (obra.etapas?.['cno']?.status === 'aguardando' && !obra.concluida) {
    setTimeout(() => openProximaEtapaModal(obra.id), 300);
  }
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
  const obra=_obras.find(o=>o.id===obraId); if(!obra) return;
  const hoje=new Date().toISOString().slice(0,10);
  const etapas=JSON.parse(JSON.stringify(obra.etapas));
  const cfg=ETAPAS_CONFIG[etapaId];
  etapas[etapaId].subEtapas[subId].status='done';
  etapas[etapaId].subEtapas[subId].dataConclusao=hoje;
  etapas[etapaId].subEtapas[subId].concluidoPor=currentUser.username;
  const subIdx=cfg.subEtapas.findIndex(s=>s.id===subId);
  const proxSub=cfg.subEtapas[subIdx+1];
  if (proxSub) {
    etapas[etapaId].subEtapas[proxSub.id].status='active';
    etapas[etapaId].subEtapas[proxSub.id].dataLimite=calcDataLimite(proxSub,etapas,obra.dataFechamento);
    await db.collection('obras').doc(obraId).update({etapas});
    showComercialToast(`"${proxSub.nome}" liberada! ✅`,'success');
  } else {
    etapas[etapaId].status='done';
    if (etapaId==='cno') {
      etapas['cno'].status = 'aguardando';
      await db.collection('obras').doc(obraId).update({etapas});
      openProximaEtapaModal(obraId); return;
    }
    // Ao concluir Aditivos: se Medição já está marcada como ativa (seleção aditivos+medicao),
    // ativar Medição automaticamente sem mostrar o modal
    if (etapaId==='aditivos' && etapas['medicao']?.ativa && etapas['medicao']?.status==='pending') {
      etapas['medicao'].status='active';
      const primSub=ETAPAS_CONFIG['medicao'].subEtapas[0];
      etapas['medicao'].subEtapas[primSub.id].status='active';
      etapas['medicao'].subEtapas[primSub.id].dataLimite=calcDataLimite(primSub,etapas,obra.dataFechamento);
      await db.collection('obras').doc(obraId).update({etapas});
      showComercialToast('Aditivos concluído! Avançando para Medição ✅','success');
      return;
    }
    const etapaIdx=ETAPAS_ORDER.indexOf(etapaId);
    let proxEtapaId=null;
    for (let i=etapaIdx+1;i<ETAPAS_ORDER.length;i++) {
      if (etapas[ETAPAS_ORDER[i]]?.ativa) {proxEtapaId=ETAPAS_ORDER[i];break;}
    }
    if (proxEtapaId) {
      etapas[proxEtapaId].status='active';
      const primSub=ETAPAS_CONFIG[proxEtapaId].subEtapas[0];
      etapas[proxEtapaId].subEtapas[primSub.id].status='active';
      etapas[proxEtapaId].subEtapas[primSub.id].dataLimite=calcDataLimite(primSub,etapas,obra.dataFechamento);
      await db.collection('obras').doc(obraId).update({etapas});
      showComercialToast(`Avançado para "${ETAPAS_CONFIG[proxEtapaId].nome}"! ✅`,'success');
    } else {
      await db.collection('obras').doc(obraId).update({etapas,concluida:true,dataConclusao:hoje});
      showComercialToast('Obra concluída! 🎉','success');
    }
  }
}

// ── Modal próxima etapa (pós-CNO) ─────────────────────────────────────────────
function openProximaEtapaModal(obraId) {
  const modal=document.getElementById('proxima-etapa-modal');
  if(modal){modal.dataset.obraId=obraId;modal.style.display='flex';}
}
function closeProximaEtapaModal() {
  const modal=document.getElementById('proxima-etapa-modal');
  if(modal) modal.style.display='none';
}
async function escolherProximaEtapa(opcao) {
  const modal=document.getElementById('proxima-etapa-modal');
  const obraId=modal?.dataset.obraId; if(!obraId) return;
  closeProximaEtapaModal();
  const obra=_obras.find(o=>o.id===obraId); if(!obra) return;
  const hoje=new Date().toISOString().slice(0,10);
  const etapas=JSON.parse(JSON.stringify(obra.etapas));

  if (opcao==='em_espera') {
    // Mantém CNO como aguardando — card mostra "Em espera"
    showComercialToast('Obra em espera. Abra novamente para escolher o próximo passo.','success');
    return;
  }

  // Limpar status aguardando do CNO → done definitivo
  if (etapas['cno']?.status === 'aguardando') etapas['cno'].status = 'done';

  if (opcao==='concluir') {
    await db.collection('obras').doc(obraId).update({etapas, concluida:true, dataConclusao:hoje});
    showComercialToast('Obra concluída! 🎉','success');
  } else if (opcao==='aditivos_medicao') {
    etapas['aditivos'].ativa=true; etapas['aditivos'].status='active';
    etapas['medicao'].ativa=true;
    const primSub=ETAPAS_CONFIG['aditivos'].subEtapas[0];
    etapas['aditivos'].subEtapas[primSub.id].status='active';
    etapas['aditivos'].subEtapas[primSub.id].dataLimite=calcDataLimite(primSub,etapas,obra.dataFechamento);
    await db.collection('obras').doc(obraId).update({etapas});
    showComercialToast('Aditivos ativado! Medição virá em seguida ✅','success');
  } else {
    etapas[opcao].ativa=true; etapas[opcao].status='active';
    const primSub=ETAPAS_CONFIG[opcao].subEtapas[0];
    etapas[opcao].subEtapas[primSub.id].status='active';
    etapas[opcao].subEtapas[primSub.id].dataLimite=calcDataLimite(primSub,etapas,obra.dataFechamento);
    await db.collection('obras').doc(obraId).update({etapas});
    showComercialToast(`Avançado para "${ETAPAS_CONFIG[opcao].nome}"! ✅`,'success');
  }
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
    // Revisão na sub-etapa
    const sub=etapas[_revisaoEtapaId].subEtapas[_revisaoSubId];
    if(!sub.revisoes) sub.revisoes=[];
    novaRevisao.numero=sub.revisoes.length+1;
    sub.revisoes.push(novaRevisao);
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

// ── Toast ─────────────────────────────────────────────────────────────────────
let _cToast=null;
function showComercialToast(msg,type='success') {
  let t=document.getElementById('comercial-toast');
  if(!t){t=document.createElement('div');t.id='comercial-toast';t.className='comercial-toast';document.body.appendChild(t);}
  t.textContent=msg; t.className=`comercial-toast ${type}`;
  requestAnimationFrame(()=>t.classList.add('show'));
  if(_cToast) clearTimeout(_cToast);
  _cToast=setTimeout(()=>t.classList.remove('show'),3200);
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