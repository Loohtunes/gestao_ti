// ===== MOTOR DE WIDGETS — Premovale =====
// Etapa A (somente leitura): renderiza widgets por escopo (geral, ti, comercial...)
// lendo a config pessoal do usuário em Firestore, com fallback para um layout padrão.
// Personalização (add/remover/reordenar + persistência) entra na Etapa B.
//
// Dependências globais já presentes no sistema: db (Firestore), users[], localStorage.
// Autossuficiente: funciona em qualquer página que o inclua (menu.html, dashboard.html).

// ── Ícones (Lucide inline — nunca CDN) ──────────────────────────────────────────
const _WGT_ICONS = {
  'ticket': '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/>',
  'triangle-alert': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/>',
  'package': '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"/>',
  'shelving-unit': '<path d="M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z"/><path d="m7 16.5-4.74-2.85"/><path d="m7 16.5 5-3"/><path d="M7 16.5v5.17"/><path d="M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z"/><path d="m17 16.5-5-3"/><path d="m17 16.5 4.74-2.85"/><path d="M17 16.5v5.17"/><path d="M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3 5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0l-3 1.8Z"/><path d="M12 8 7.26 5.15"/><path d="m12 8 4.74-2.85"/><path d="M12 13.5V8"/>',
  'list-check': '<path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>',
  'zap': '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
  'briefcase': '<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>',
  'trending-down': '<path d="M16 17h6v-6"/><path d="m22 17-8.5-8.5-5 5L2 7"/>',
};

function _wgtIcon(name, size = 16, stroke = 'currentColor') {
  const path = _WGT_ICONS[name] || '';
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}

// ── Permissões (espelham a lógica já usada no menu.js) ──────────────────────────
function _wgtPodeChamados(u) {
  return !!(u && (u.isSuperAdmin || u.isAdmin || u.role === 'attendant'));
}
function _wgtPodeEstoque(u) {
  return !!(u && (u.isSuperAdmin || u.isAdmin || u.role === 'attendant'));
}
function _wgtPodeComercial(u) {
  const a = (u && u.acessos) || [];
  return !!(u && (u.isSuperAdmin || u.isAdminComercial || u.isComercial ||
    a.includes('comercial') || a.includes('adminComercial')));
}

// ── Atalhos padrão por escopo (Acesso Rápido) ───────────────────────────────────
function _wgtAtalhosPadrao(escopo, user) {
  const acessos = user && user.isSuperAdmin
    ? ['chamados', 'materiais', 'inventario', 'rotinas']
    : ((user && user.acessos) || ['chamados']);

  if (escopo === 'ti' || escopo === 'geral') {
    const todos = [
      { label: 'Chamados', href: 'index.html', icone: 'ticket', mod: 'chamados' },
      { label: 'Materiais', href: 'materiais.html', icone: 'package', mod: 'materiais' },
      { label: 'Inventário', href: 'inventario.html', icone: 'shelving-unit', mod: 'inventario' },
      { label: 'Rotinas', href: 'rotinas.html', icone: 'list-check', mod: 'rotinas' },
    ];
    return todos.filter(a => a.mod === 'chamados' || (user && user.isSuperAdmin) || acessos.includes(a.mod));
  }
  if (escopo === 'comercial') {
    return [{ label: 'Controle de Obras', href: 'comercial.html', icone: 'briefcase', mod: 'comercial' }];
  }
  return [];
}

// ── Catálogo de widgets disponíveis ─────────────────────────────────────────────
const WIDGETS_DISPONIVEIS = {

  'metrica-chamados': {
    titulo: 'Chamados abertos',
    icone: 'ticket',
    escopos: ['geral', 'ti'],
    permitido: _wgtPodeChamados,
    preencher: async (corpo) => {
      const snap = await db.collection('tickets').get();
      const abertos = snap.docs
        .map(d => d.data())
        .filter(t => t.ticketType !== 'test'
          && t.status !== 'archived' && t.status !== 'completed' && t.status !== 'force-closed')
        .length;
      corpo.innerHTML =
        `<div class="wgt-metric">
           <div class="wgt-metric-value">${abertos}</div>
           <div class="wgt-metric-sub">${abertos === 1 ? 'chamado em aberto' : 'chamados em aberto'}</div>
         </div>
         <a class="wgt-vermais" href="index.html">Abrir Chamados ${_wgtIcon('ticket', 12)}</a>`;
    }
  },

  'alerta-estoque': {
    titulo: 'Alertas de estoque',
    icone: 'triangle-alert',
    escopos: ['geral', 'ti'],
    permitido: _wgtPodeEstoque,
    preencher: async (corpo) => {
      const snap = await db.collection('insumos').get();
      const alertas = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(i => {
          const qtd = i.qtdFisica ?? 0, min = i.qtdMinima ?? 0;
          return min > 0 && qtd <= min;
        })
        .sort((a, b) =>
          ((a.qtdFisica ?? 0) / (a.qtdMinima || 1)) - ((b.qtdFisica ?? 0) / (b.qtdMinima || 1)));

      if (!alertas.length) { corpo.innerHTML = '<div class="wgt-empty">✓ Estoque em dia</div>'; return; }

      const vis = alertas.slice(0, 4);
      corpo.innerHTML = `<div class="wgt-lista">${vis.map(i => {
        const qtd = i.qtdFisica ?? 0, min = i.qtdMinima ?? 0;
        const zerado = qtd <= 0;
        const cor = zerado ? '#ef4444' : '#f59e0b';
        const bg = zerado ? '#fee2e2' : '#fef3c7';
        const label = zerado ? 'Zerado' : 'No limite';
        return `<a href="inventario.html?tab=insumos&id=${i.id}" class="alerta-estoque-item">
          <div class="alerta-estoque-icon" style="background:${bg};">${_wgtIcon('triangle-alert', 12, cor)}</div>
          <div class="alerta-estoque-info">
            <span class="alerta-estoque-nome">${i.nome}</span>
            <span class="alerta-estoque-detalhe">${qtd} ${i.unidade || 'un'} · mín. ${min}</span>
          </div>
          <span class="alerta-estoque-badge" style="background:${bg};color:${cor};border-color:${cor}44;">${label}</span>
        </a>`;
      }).join('')}</div>${alertas.length > 4
        ? `<a class="wgt-vermais" href="inventario.html?tab=insumos">+${alertas.length - 4} insumo(s) · ver todos</a>` : ''}`;
    }
  },

  'alerta-comercial': {
    titulo: 'Alertas comercial',
    icone: 'briefcase',
    escopos: ['geral', 'comercial'],
    permitido: _wgtPodeComercial,
    preencher: async (corpo) => {
      const snap = await db.collection('obras').get();
      const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
      const hojeStr = hoje.toISOString().slice(0, 10);
      const ETAPAS_IDS = ['proposta', 'contrato', 'documentacoes', 'aditivos', 'medicao'];
      const NOMES = { proposta: 'Proposta', contrato: 'Contrato', documentacoes: 'Documentações', aditivos: 'Aditivos', medicao: 'Medição' };
      const alertas = [];

      snap.docs.forEach(doc => {
        const obra = { id: doc.id, ...doc.data() };
        if (!obra.etapas || _obraFinalizada(obra)) return;
        const ativas = ETAPAS_IDS.filter(id => obra.etapas[id]?.ativa);
        const todasDone = ativas.length > 0 && ativas.every(id => obra.etapas[id]?.status === 'done');
        if (todasDone) return;
        const numero = obra.numero || doc.id.slice(-6);

        if (obra.prazoEstimado) {
          const prazo = new Date(obra.prazoEstimado + 'T12:00:00');
          const diff = Math.ceil((prazo.getTime() - hoje.getTime()) / 86400000);
          if (diff < 0) {
            alertas.push({ tipo: 'vencido', id: obra.id, numero, nome: obra.nome, msg: `Prazo vencido há ${Math.abs(diff)} dia${Math.abs(diff) !== 1 ? 's' : ''}` });
          } else if (diff <= 7) {
            alertas.push({ tipo: 'vencendo', id: obra.id, numero, nome: obra.nome, msg: diff === 0 ? 'Vence hoje!' : `Vencendo em ${diff} dia${diff !== 1 ? 's' : ''}` });
          }
        }

        ETAPAS_IDS.forEach(etapaId => {
          const e = obra.etapas?.[etapaId];
          if (!e?.ativa || e.status === 'done') return;
          let temAtraso = false;
          if (Array.isArray(e.lista)) {
            temAtraso = e.lista.some(item =>
              Object.values(item.subEtapas || {}).some(s => s.status !== 'done' && s.dataLimite && s.dataLimite < hojeStr));
          } else {
            temAtraso = Object.values(e.subEtapas || {}).some(s => s.status !== 'done' && s.dataLimite && s.dataLimite < hojeStr);
          }
          if (temAtraso) alertas.push({ tipo: 'atrasada', id: obra.id, numero, nome: obra.nome, msg: `${NOMES[etapaId]} em atraso` });
        });
      });

      if (!alertas.length) { corpo.innerHTML = '<div class="wgt-empty">✓ Sem alertas no momento</div>'; return; }

      const prioridade = { vencido: 3, atrasada: 2, vencendo: 1 };
      const mapa = new Map();
      alertas.forEach(a => {
        const atual = mapa.get(a.id);
        if (!atual || (prioridade[a.tipo] || 0) > (prioridade[atual.tipo] || 0)) mapa.set(a.id, a);
      });
      const uniq = [...mapa.values()];

      corpo.innerHTML = `<div class="wgt-lista">${uniq.slice(0, 6).map(a => {
        const crit = a.tipo === 'vencido' || a.tipo === 'atrasada';
        const cor = crit ? '#ef4444' : '#f59e0b';
        const bg = crit ? '#fee2e2' : '#fef3c7';
        const label = a.tipo === 'vencido' ? 'Vencido' : a.tipo === 'atrasada' ? 'Atrasada' : 'Urgente';
        return `<a href="comercial.html?obra=${a.id}" class="alerta-estoque-item" style="border-left:3px solid ${cor};">
          <div class="alerta-estoque-icon" style="background:${bg};">${_wgtIcon('briefcase', 12, cor)}</div>
          <div class="alerta-estoque-info">
            <span class="alerta-estoque-nome">${a.nome}</span>
            <span class="alerta-estoque-detalhe">#${a.numero} · ${a.msg}</span>
          </div>
          <span class="alerta-estoque-badge" style="background:${bg};color:${cor};border-color:${cor}44;">${label}</span>
        </a>`;
      }).join('')}</div>`;
    }
  },

  'acesso-rapido': {
    titulo: 'Acesso rápido',
    icone: 'zap',
    escopos: ['geral', 'ti', 'comercial'],
    permitido: () => true,
    preencher: async (corpo, inst, ctx) => {
      const atalhos = (inst.config && Array.isArray(inst.config.atalhos) && inst.config.atalhos.length)
        ? inst.config.atalhos
        : _wgtAtalhosPadrao(ctx.escopo, ctx.user);
      if (!atalhos.length) { corpo.innerHTML = '<div class="wgt-empty">Sem atalhos.</div>'; return; }
      corpo.innerHTML = `<div class="wgt-atalhos">${atalhos.map(a =>
        `<a class="wgt-atalho" href="${a.href}">${_wgtIcon(a.icone || 'zap', 14)}<span>${a.label}</span></a>`
      ).join('')}</div>`;
    }
  },

};

// ── Layouts padrão por escopo (usados enquanto o usuário não personalizou) ───────
const WIDGETS_LAYOUT_PADRAO = {
  geral: [],
  ti: [
    { tipo: 'metrica-chamados' },
    { tipo: 'alerta-estoque' },
    { tipo: 'acesso-rapido' },
  ],
  comercial: [
    { tipo: 'alerta-comercial' },
    { tipo: 'acesso-rapido' },
  ],
};

// ── Resolução do usuário atual (sessão) ─────────────────────────────────────────
function _wgtUsuarioAtual() {
  try {
    const id = localStorage.getItem('chamados-current-user-id');
    if (id && typeof users !== 'undefined' && Array.isArray(users)) {
      const u = users.find(x => x.id === id);
      if (u) return u;
    }
  } catch (e) { }
  if (typeof currentUser !== 'undefined' && currentUser) return currentUser;
  if (typeof menuCurrentUser !== 'undefined' && menuCurrentUser) return menuCurrentUser;
  return null;
}

// ── Leitura do layout salvo (Firestore) com fallback ────────────────────────────
async function _wgtCarregarLayout(userId, escopo) {
  try {
    const doc = await db.collection('widgets_usuario').doc(userId).get();
    if (doc.exists) {
      const data = doc.data() || {};
      if (Array.isArray(data[escopo])) return data[escopo];
    }
  } catch (e) {
    console.warn('[Widgets] Sem config salva, usando layout padrão:', e);
  }
  return WIDGETS_LAYOUT_PADRAO[escopo] || [];
}

// ── Render principal — a engine ─────────────────────────────────────────────────
async function renderWidgets(escopo, container, user) {
  if (typeof container === 'string') container = document.getElementById(container);
  if (!container) return;
  user = user || _wgtUsuarioAtual();
  if (!user) { console.warn('[Widgets] Sem usuário; render abortado.'); return; }

  container.classList.add('wgt-grid');
  container.innerHTML = '';

  const layout = await _wgtCarregarLayout(user.id, escopo);
  const visiveis = layout
    .map((inst, i) => ({ ...inst, _i: i }))
    .filter(inst => {
      const def = WIDGETS_DISPONIVEIS[inst.tipo];
      return def && def.escopos.includes(escopo) && def.permitido(user);
    })
    .sort((a, b) => (a.ordem ?? a._i) - (b.ordem ?? b._i));

  if (!visiveis.length) {
    container.innerHTML = '';
    return;
  }

  for (const inst of visiveis) {
    const def = WIDGETS_DISPONIVEIS[inst.tipo];
    const card = document.createElement('div');
    card.className = 'wgt';
    card.dataset.tipo = inst.tipo;
    card.innerHTML =
      `<div class="wgt-head">${_wgtIcon(def.icone, 15)}<span>${def.titulo}</span></div>
       <div class="wgt-body"><div class="wgt-loading">Carregando…</div></div>`;
    container.appendChild(card);
    const corpo = card.querySelector('.wgt-body');
    try {
      await def.preencher(corpo, inst, { user, escopo });
    } catch (e) {
      corpo.innerHTML = '<div class="wgt-empty">Não foi possível carregar este widget.</div>';
      console.error('[Widgets] Erro ao preencher', inst.tipo, e);
    }
  }
}