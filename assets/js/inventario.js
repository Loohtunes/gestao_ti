// ── Sidebar toggle ─────────────────────────────────────────────────────────
function toggleMenuSidebar() {
  const sidebar = document.getElementById('chamados-sidebar');
  const icon = document.getElementById('sidebar-toggle-icon');
  if (!sidebar) return;
  const isCollapsed = sidebar.classList.toggle('collapsed');
  if (icon) icon.textContent = isCollapsed ? '›' : '‹';
  localStorage.setItem('chamados-sidebar-collapsed', isCollapsed ? '1' : '0');
}
// ===== INVENTÁRIO — Ativos =====

let _ativoEditingId = null;
let _ativos = [];
let _setoresInv = [];

// ── Inicialização ──────────────────────────────────────────────────────────
function initInventario() {
  const canManage = currentUser?.isAdmin || currentUser?.isSuperAdmin ||
    currentUser?.role === 'attendant';

  // Sidebar: mostrar/esconder config btn
  const configBtn = document.getElementById('sidebar-config-btn');
  if (configBtn) configBtn.style.display = canManage ? 'flex' : 'none';

  // Sidebar: avatar e setor
  const avatar = document.getElementById('inv-sidebar-avatar');
  const name = document.getElementById('inv-sidebar-name');
  const role = document.getElementById('inv-sidebar-role');
  if (avatar) avatar.textContent = (currentUser?.username?.[0] || '?').toUpperCase();
  if (name) name.textContent = capitalizeName(currentUser?.username || '—');
  if (role) role.innerHTML = getSectorBadge(currentUser);

  // Sidebar: módulos visíveis por acesso
  const acessos = currentUser?.isSuperAdmin
    ? ['chamados', 'materiais', 'inventario']
    : (currentUser?.acessos || []);

  ['materiais', 'inventario'].forEach(mod => {
    const el = document.getElementById(`cs-mod-${mod}`);
    if (el) el.style.display = (currentUser?.isSuperAdmin || acessos.includes(mod)) ? 'flex' : 'none';
  });

  // Verificar parâmetros da URL (ex: ?tab=insumos&id=XXX)
  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get('tab');
  const idParam = urlParams.get('id');

  openInvTab(tabParam || 'ativos');

  // Destacar item específico se vier da URL
  if (idParam && tabParam === 'insumos') {
    setTimeout(() => highlightInsumo(idParam), 600);
  }
}

function invLogout() {
  if (typeof logout === 'function') logout();
  else { localStorage.removeItem('chamados-current-user-id'); window.location.href = 'login.html'; }
}

// ── Abas ───────────────────────────────────────────────────────────────────
function openInvTab(tab) {
  document.querySelectorAll('.config-tab').forEach(t =>
    t.classList.toggle('active', t.dataset.tab === tab));
  document.querySelectorAll('.config-panel').forEach(p =>
    p.classList.toggle('active', p.id === 'panel-' + tab));

  if (tab === 'ativos') renderAtivos();
  if (tab === 'insumos') renderInsumos();
}

// ══════════════════════════════════════════════════════════════════
// ABA INSUMOS
// ══════════════════════════════════════════════════════════════════
let _insumoEditingId = null;
let _insumos = [];
let _entradaInsumoId = null;
let _historicoInsumoId = null;

async function renderInsumos() {
  const panel = document.getElementById('panel-insumos');
  if (!panel) return;

  const canManage = currentUser?.isAdmin || currentUser?.isSuperAdmin ||
    currentUser?.role === 'attendant';

  panel.innerHTML = `
    <div class="config-users-header">
      <div class="config-users-title">Controle de Insumos</div>
      ${canManage ? `
      <div style="display:flex;align-items:center;gap:0.5rem;">
        <div style="position:relative;">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);color:var(--muted);pointer-events:none"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input type="text" id="insumo-search" class="form-input" placeholder="Buscar insumo..."
            oninput="filterInsumos()"
            style="padding-left:28px;font-size:0.8rem;width:180px;">
        </div>
        <select id="insumo-filter-cat" class="form-input" onchange="filterInsumos()"
          style="font-size:0.8rem;width:195px;">
          <option value="">Todas as Categorias</option>
          <option value="Toner/Cilindro">Toner/Cilindro</option>
          <option value="Periférico">Periférico</option>
          <option value="Diversos">Diversos</option>
        </select>
        <button class="config-new-user-btn" onclick="openInsumoForm()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
          Novo Insumo
        </button>
      </div>` : ''}
    </div>
    <div id="insumos-list" style="position:relative;display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;width:100%;min-height:300px;align-items:start;"></div>
    <div id="insumos-pagination" style="margin-top:0.75rem;"></div>`;

  await loadInsumos(canManage);
}

const INSUMOS_PER_PAGE = 10;
let _insumosPage = 1;

async function loadInsumos(canManage) {
  try {
    const [insSnap, movSnap] = await Promise.all([
      db.collection('insumos').get(),
      db.collection('insumos_mov').get()
    ]);

    // Agrupar movimentações por insumoId, ordenadas por data desc
    const movMap = {};
    movSnap.docs.forEach(d => {
      const m = { id: d.id, ...d.data() };
      if (!movMap[m.insumoId]) movMap[m.insumoId] = [];
      movMap[m.insumoId].push(m);
    });
    Object.values(movMap).forEach(arr =>
      arr.sort((a, b) => (b.data || '').localeCompare(a.data || '')));

    _insumos = insSnap.docs
      .map(d => ({ id: d.id, ...d.data(), _movRecentes: movMap[d.id] || [] }))
      .sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR'));

    renderInsumosList(_insumos, canManage);
  } catch (e) {
    console.error('[Inventário] Erro ao carregar insumos:', e);
    const list = document.getElementById('insumos-list');
    if (list) list.innerHTML = '<div style="color:var(--muted);font-size:0.8rem;padding:1rem 0;">Erro ao carregar insumos.</div>';
  }
}

function renderInsumosList(list, canManage) {
  const container = document.getElementById('insumos-list');
  const pagEl = document.getElementById('insumos-pagination');
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = `
      <div class="ativos-empty" style="grid-column:1/-1;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"/></svg>
        <span>Nenhum insumo cadastrado ainda.</span>
      </div>`;
    if (pagEl) pagEl.innerHTML = '';
    return;
  }

  const totalPages = Math.ceil(list.length / INSUMOS_PER_PAGE);
  if (_insumosPage > totalPages) _insumosPage = 1;
  const start = (_insumosPage - 1) * INSUMOS_PER_PAGE;
  const paged = list.slice(start, start + INSUMOS_PER_PAGE);

  container.innerHTML = paged.map(i => {
    const qtd = i.qtdFisica ?? 0;
    const minimo = i.qtdMinima ?? 0;
    const disponivel = i.qtdDisponivel ?? qtd;
    const alerta = qtd <= minimo && minimo > 0;
    const zerado = qtd <= 0;
    const pct = minimo > 0 ? Math.min(100, Math.round((qtd / minimo) * 100)) : 100;
    const barColor = zerado ? '#ef4444' : alerta ? '#f59e0b' : '#22c55e';

    // Resumo últimos 15 dias
    const quinze = Date.now() - 15 * 24 * 3600000;
    const movs15 = (i._movRecentes || []).filter(m => m.data && new Date(m.data).getTime() >= quinze);
    const totalEntradas = movs15.filter(m => m.tipo === 'entrada').reduce((s, m) => s + (m.qtd || 0), 0);
    const totalSaidas = movs15.filter(m => m.tipo !== 'entrada').reduce((s, m) => s + (m.qtd || 0), 0);
    const movSummaryHtml = `<div class="insumo-mov-summary">
        <span class="insumo-mov-sum-item entrada">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          ${totalEntradas} entrada${totalEntradas !== 1 ? 's' : ''}
        </span>
        <span class="insumo-mov-sum-sep">·</span>
        <span class="insumo-mov-sum-item saida">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/></svg>
          ${totalSaidas} saída${totalSaidas !== 1 ? 's' : ''}
        </span>
        <span class="insumo-mov-sum-sep">·</span>
        <span class="insumo-mov-sum-periodo">últimos 15 dias</span>
      </div>`;

    return `
      <div class="insumo-card${alerta ? ' insumo-card--alerta' : ''}${zerado ? ' insumo-card--zerado' : ''}">
        <div class="insumo-card-header">
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
              <span class="insumo-card-nome">${i.nome}</span>
              <span class="insumo-cat-badge">${i.categoria || 'Diversos'}</span>
              ${zerado ? `<span class="insumo-status-badge insumo-status--zerado">Zerado</span>` : ''}
              ${!zerado && alerta ? `<span class="insumo-status-badge insumo-status--alerta">No limite</span>` : ''}
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:0.35rem;flex-shrink:0;">
            ${canManage ? `
            <button class="insumo-action-btn" onclick="openEntradaForm('${i.id}')" title="Registrar entrada de estoque">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              Entrada
            </button>
            <button class="insumo-action-btn" onclick="openSaidaForm('${i.id}')" title="Registrar saída manual"
              style="color:#ef4444;border-color:#ef444433;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/></svg>
              Saída
            </button>
            <button class="config-user-edit-btn" onclick="openInsumoForm('${i.id}')" title="Editar insumo">✎</button>
            <button class="config-user-del-btn" onclick="deleteInsumo('${i.id}')" title="Excluir insumo">✕</button>` : ''}
            <button class="insumo-action-btn" onclick="openHistoricoInsumo('${i.id}','${i.nome}')" title="Ver histórico completo">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Histórico
            </button>
          </div>
        </div>
        <div class="insumo-card-body">
          <!-- Estoque -->
          <div class="insumo-estoque-row">
            <div class="insumo-estoque-info">
              <span class="insumo-estoque-num" style="color:${barColor};">${qtd}</span>
              <span class="insumo-estoque-label">em estoque</span>
              <span class="insumo-estoque-sep">·</span>
              <span class="insumo-estoque-label">Mínimo: <strong>${minimo}</strong></span>
              <span class="insumo-estoque-sep">·</span>
              <span class="insumo-estoque-label">Unidade: <strong>${i.unidade || 'Unidade'}</strong></span>
              ${disponivel !== qtd ? `<span class="insumo-estoque-sep">·</span><span class="insumo-estoque-label">Disponível: <strong>${disponivel}</strong></span>` : ''}
            </div>
          </div>
          <!-- Barra de progresso -->
          <div class="insumo-bar-track">
            <div class="insumo-bar-fill" style="width:${Math.min(100, qtd <= 0 ? 100 : (minimo > 0 ? Math.min(100, Math.round(qtd / minimo * 100)) : 100))}%;background:${barColor};"></div>
          </div>
          <!-- Movimentações recentes -->
          <div class="insumo-movs-label">Movimentações — 15 dias</div>
          ${movSummaryHtml}
        </div>
      </div>`;
  }).join('');

  // Renderizar paginação
  if (pagEl) {
    if (totalPages <= 1) { pagEl.innerHTML = ''; return; }
    const prev = _insumosPage > 1;
    const next = _insumosPage < totalPages;
    pagEl.innerHTML = `
      <div class="config-users-pagination">
        <span class="config-page-info">${start + 1}–${Math.min(start + INSUMOS_PER_PAGE, list.length)} de ${list.length} insumos</span>
        <div class="config-page-btns">
          <button class="config-page-btn" onclick="changeInsumosPage(${_insumosPage - 1})" ${!prev ? 'disabled' : ''}>‹</button>
          ${Array.from({ length: totalPages }, (_, i) => `
            <button class="config-page-btn ${i + 1 === _insumosPage ? 'active' : ''}" onclick="changeInsumosPage(${i + 1})">${i + 1}</button>`).join('')}
          <button class="config-page-btn" onclick="changeInsumosPage(${_insumosPage + 1})" ${!next ? 'disabled' : ''}>›</button>
        </div>
      </div>`;
  }
}

function changeInsumosPage(page) {
  const canManage = currentUser?.isAdmin || currentUser?.isSuperAdmin || currentUser?.role === 'attendant';
  const q = (document.getElementById('insumo-search')?.value || '').toLowerCase().trim();
  const cat = document.getElementById('insumo-filter-cat')?.value || '';
  const list = _insumos.filter(i => {
    const matchQ = !q || (i.nome || '').toLowerCase().includes(q);
    const matchCat = !cat || (i.categoria || '') === cat;
    return matchQ && matchCat;
  });
  const totalPages = Math.ceil(list.length / INSUMOS_PER_PAGE);
  if (page < 1 || page > totalPages) return;
  _insumosPage = page;
  renderInsumosList(list, canManage);
}

// ── Filtro ─────────────────────────────────────────────────────────────────
function filterInsumos() {
  const q = (document.getElementById('insumo-search')?.value || '').toLowerCase().trim();
  const cat = document.getElementById('insumo-filter-cat')?.value || '';
  const canManage = currentUser?.isAdmin || currentUser?.isSuperAdmin || currentUser?.role === 'attendant';
  _insumosPage = 1;
  const filtered = _insumos.filter(i => {
    const matchQ = !q || (i.nome || '').toLowerCase().includes(q);
    const matchCat = !cat || (i.categoria || '') === cat;
    return matchQ && matchCat;
  });
  renderInsumosList(filtered, canManage);
}

// ── CRUD Insumo ────────────────────────────────────────────────────────────
let _insumoFormDirty = false;

function _watchInsumoForm() {
  ['insumo-nome-input', 'insumo-categoria-input', 'insumo-unidade-input', 'insumo-qtd-input', 'insumo-minimo-input']
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', () => { _insumoFormDirty = true; }, { once: false });
    });
}

function openInsumoForm(id = null) {
  _insumoEditingId = id;
  _insumoFormDirty = false;
  document.getElementById('insumo-form-title').textContent = id ? 'Editar Insumo' : 'Novo Insumo';
  const ins = id ? _insumos.find(i => i.id === id) : null;
  document.getElementById('insumo-nome-input').value = ins?.nome || '';
  document.getElementById('insumo-categoria-input').value = ins?.categoria || 'Periférico';
  document.getElementById('insumo-unidade-input').value = ins?.unidade || 'Unidade';
  document.getElementById('insumo-qtd-input').value = ins ? (ins.qtdFisica ?? 0) : '';
  document.getElementById('insumo-minimo-input').value = ins?.qtdMinima ?? '';
  // Ao editar, esconder qty inicial (já tem estoque)
  const qtdGroup = document.getElementById('insumo-qtd-input').closest('.form-group');
  if (qtdGroup) qtdGroup.style.display = id ? 'none' : 'flex';
  document.getElementById('insumo-form-modal').classList.add('open');

  // Overlay click — verificar alterações
  const overlay = document.getElementById('insumo-form-modal');
  overlay.onclick = (e) => { if (e.target === overlay) tryCloseInsumoForm(); };

  // Iniciar detecção de alterações após render
  setTimeout(_watchInsumoForm, 100);
}

function tryCloseInsumoForm() {
  if (_insumoFormDirty) {
    document.getElementById('discard-warning-modal').classList.add('open');
  } else {
    closeInsumoForm();
  }
}

function closeDiscardWarning() {
  document.getElementById('discard-warning-modal').classList.remove('open');
}

function confirmDiscard() {
  closeDiscardWarning();
  closeInsumoForm();
}

function closeInsumoForm() {
  document.getElementById('insumo-form-modal').classList.remove('open');
  _insumoEditingId = null;
  _insumoFormDirty = false;
}

async function saveInsumo() {
  const nome = document.getElementById('insumo-nome-input').value.trim();
  const categoria = document.getElementById('insumo-categoria-input').value;
  const unidade = document.getElementById('insumo-unidade-input').value;
  const qtdInicial = parseInt(document.getElementById('insumo-qtd-input').value) || 0;
  const minimo = parseInt(document.getElementById('insumo-minimo-input').value) || 0;

  if (!nome) { showNotification('Informe o nome do insumo.', 'error'); return; }

  try {
    if (_insumoEditingId) {
      await db.collection('insumos').doc(_insumoEditingId).update({
        nome, categoria, unidade, qtdMinima: minimo,
        updatedAt: new Date().toISOString()
      });
      showNotification('Insumo atualizado! ✅', 'success');
    } else {
      const docRef = await db.collection('insumos').add({
        nome, categoria, unidade,
        qtdFisica: qtdInicial, qtdDisponivel: qtdInicial, qtdMinima: minimo,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
      });
      // Registrar entrada inicial no histórico se qtd > 0
      if (qtdInicial > 0) {
        await db.collection('insumos_mov').add({
          insumoId: docRef.id, insumoNome: nome,
          tipo: 'entrada', qtd: qtdInicial,
          desc: 'Estoque inicial', nf: '',
          responsavel: currentUser?.username || '—',
          data: new Date().toISOString()
        });
      }
      showNotification('Insumo cadastrado! ✅', 'success');
    }
    closeInsumoForm();
    await renderInsumos();
  } catch (e) {
    console.error('[Inventário] Erro ao salvar insumo:', e);
    showNotification('Erro ao salvar insumo.', 'error');
  }
}

async function deleteInsumo(id) {
  const ins = _insumos.find(i => i.id === id);
  if (!ins) return;
  if (!confirm(`Excluir o insumo "${ins.nome}"?\nEsta ação não pode ser desfeita.`)) return;
  try {
    await db.collection('insumos').doc(id).delete();
    showNotification('Insumo excluído.', 'success');
    await renderInsumos();
  } catch (e) {
    showNotification('Erro ao excluir insumo.', 'error');
  }
}

// ── Entrada de estoque ─────────────────────────────────────────────────────
function openEntradaForm(insumoId) {
  _entradaInsumoId = insumoId;
  const ins = _insumos.find(i => i.id === insumoId);
  if (!ins) return;
  document.getElementById('entrada-form-title').textContent = `Entrada — ${ins.nome}`;
  document.getElementById('entrada-insumo-info').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:1rem;">
      <div>
        <div style="font-weight:700;color:var(--text);font-size:0.85rem;">${ins.nome}</div>
        <div style="font-size:0.7rem;margin-top:2px;">${ins.categoria} · ${ins.unidade}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:0.72rem;">Estoque atual</div>
        <div style="font-weight:800;font-size:1.1rem;color:var(--text);">${ins.qtdFisica ?? 0} <span style="font-size:0.7rem;font-weight:400;">${ins.unidade}</span></div>
      </div>
    </div>`;
  document.getElementById('entrada-qtd-input').value = '';
  document.getElementById('entrada-nf-input').value = '';
  document.getElementById('entrada-obs-input').value = '';
  document.getElementById('entrada-form-modal').classList.add('open');
}

function closeEntradaForm() {
  document.getElementById('entrada-form-modal').classList.remove('open');
  _entradaInsumoId = null;
}

// ── Saída manual ───────────────────────────────────────────────────────────
let _saidaInsumoId = null;

function openSaidaForm(insumoId) {
  _saidaInsumoId = insumoId;
  const ins = _insumos.find(i => i.id === insumoId);
  if (!ins) return;
  document.getElementById('saida-form-title').textContent = `Saída — ${ins.nome}`;
  document.getElementById('saida-insumo-info').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:1rem;">
      <div>
        <div style="font-weight:700;color:var(--text);font-size:0.85rem;">${ins.nome}</div>
        <div style="font-size:0.7rem;margin-top:2px;">${ins.categoria} · ${ins.unidade}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:0.72rem;">Disponível</div>
        <div style="font-weight:800;font-size:1.1rem;color:var(--text);">${ins.qtdDisponivel ?? ins.qtdFisica ?? 0} <span style="font-size:0.7rem;font-weight:400;">${ins.unidade}</span></div>
      </div>
    </div>`;
  document.getElementById('saida-qtd-input').value = '';
  document.getElementById('saida-just-input').value = '';
  document.getElementById('saida-form-modal').classList.add('open');
}

function closeSaidaForm() {
  document.getElementById('saida-form-modal').classList.remove('open');
  _saidaInsumoId = null;
}

async function saveSaida() {
  const qtd = parseInt(document.getElementById('saida-qtd-input').value);
  const just = document.getElementById('saida-just-input').value.trim();

  if (!qtd || qtd < 1) { showNotification('Informe a quantidade retirada.', 'error'); return; }
  if (!just) { showNotification('Justificativa obrigatória para saída manual.', 'error'); return; }

  const ins = _insumos.find(i => i.id === _saidaInsumoId);
  if (!ins) return;

  const disponivel = ins.qtdDisponivel ?? ins.qtdFisica ?? 0;
  if (qtd > disponivel) {
    showNotification(`Quantidade insuficiente. Disponível: ${disponivel} ${ins.unidade}.`, 'error');
    return;
  }

  const novaFisica = Math.max(0, (ins.qtdFisica ?? 0) - qtd);
  const novaDisp = Math.max(0, disponivel - qtd);

  try {
    await db.collection('insumos').doc(_saidaInsumoId).update({
      qtdFisica: novaFisica, qtdDisponivel: novaDisp,
      updatedAt: new Date().toISOString()
    });
    await db.collection('insumos_mov').add({
      insumoId: _saidaInsumoId, insumoNome: ins.nome,
      tipo: 'saida_manual', qtd,
      desc: just,
      responsavel: currentUser?.username || '—',
      data: new Date().toISOString()
    });
    showNotification(`-${qtd} ${ins.unidade} registrado em ${ins.nome}! ✅`, 'success');
    closeSaidaForm();
    await renderInsumos();
  } catch (e) {
    console.error('[Inventário] Erro ao registrar saída:', e);
    showNotification('Erro ao registrar saída.', 'error');
  }
}

async function saveEntrada() {
  const qtd = parseInt(document.getElementById('entrada-qtd-input').value);
  const nf = document.getElementById('entrada-nf-input').value.trim();
  const obs = document.getElementById('entrada-obs-input').value.trim();

  if (!qtd || qtd < 1) { showNotification('Informe a quantidade recebida.', 'error'); return; }

  const ins = _insumos.find(i => i.id === _entradaInsumoId);
  if (!ins) return;

  const novaQtd = (ins.qtdFisica ?? 0) + qtd;
  const novaDisp = (ins.qtdDisponivel ?? ins.qtdFisica ?? 0) + qtd;

  try {
    // Atualizar estoque
    await db.collection('insumos').doc(_entradaInsumoId).update({
      qtdFisica: novaQtd, qtdDisponivel: novaDisp,
      updatedAt: new Date().toISOString()
    });
    // Registrar no histórico imutável
    await db.collection('insumos_mov').add({
      insumoId: _entradaInsumoId, insumoNome: ins.nome,
      tipo: 'entrada', qtd,
      desc: obs || (nf ? `NF ${nf}` : 'Entrada de estoque'),
      nf, responsavel: currentUser?.username || '—',
      data: new Date().toISOString()
    });
    showNotification(`+${qtd} ${ins.unidade} registrados em ${ins.nome}! ✅`, 'success');
    closeEntradaForm();
    await renderInsumos();
  } catch (e) {
    console.error('[Inventário] Erro ao registrar entrada:', e);
    showNotification('Erro ao registrar entrada.', 'error');
  }
}

// ── Histórico ──────────────────────────────────────────────────────────────
async function openHistoricoInsumo(insumoId, nome) {
  _historicoInsumoId = insumoId;
  document.getElementById('historico-insumo-title').textContent = `Histórico — ${nome}`;
  document.getElementById('historico-insumo-list').innerHTML =
    '<div style="color:var(--muted);font-size:0.8rem;text-align:center;padding:1rem;">Carregando...</div>';
  document.getElementById('historico-insumo-modal').classList.add('open');

  try {
    let snap;
    try {
      snap = await db.collection('insumos_mov')
        .where('insumoId', '==', insumoId)
        .orderBy('data', 'desc').limit(50).get();
    } catch (e) {
      snap = await db.collection('insumos_mov')
        .where('insumoId', '==', insumoId).limit(50).get();
    }

    const list = document.getElementById('historico-insumo-list');
    if (snap.empty) {
      list.innerHTML = '<div style="color:var(--muted);font-size:0.8rem;text-align:center;padding:1rem;">Nenhuma movimentação registrada.</div>';
      return;
    }

    const docs = snap.docs.map(d => d.data()).sort((a, b) => (b.data || '').localeCompare(a.data || ''));
    list.innerHTML = docs.map(m => {
      const isEntrada = m.tipo === 'entrada';
      const dt = m.data ? new Date(m.data).toLocaleString('pt-BR') : '—';
      return `
        <div class="hist-insumo-row">
          <div class="hist-insumo-badge" style="background:${isEntrada ? '#dcfce7' : '#fee2e2'};color:${isEntrada ? '#15803d' : '#b91c1c'};">
            ${isEntrada ? '+' : '-'}${m.qtd}
          </div>
          <div class="hist-insumo-info">
            <div class="hist-insumo-desc">${m.desc || (isEntrada ? 'Entrada' : 'Saída')}</div>
            <div class="hist-insumo-meta">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              ${m.responsavel || '—'}
              ${m.nf ? `· <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> NF ${m.nf}` : ''}
            </div>
          </div>
          <div class="hist-insumo-date">${dt}</div>
        </div>`;
    }).join('');
  } catch (e) {
    document.getElementById('historico-insumo-list').innerHTML =
      '<div style="color:var(--muted);font-size:0.8rem;text-align:center;padding:1rem;">Erro ao carregar histórico.</div>';
  }
}

function closeHistoricoInsumo() {
  document.getElementById('historico-insumo-modal').classList.remove('open');
}

// ── Renderização da lista de Ativos ────────────────────────────────────────
async function renderAtivos() {
  const panel = document.getElementById('panel-ativos');
  if (!panel) return;

  const canManage = currentUser?.isAdmin || currentUser?.isSuperAdmin ||
    currentUser?.role === 'attendant';

  panel.innerHTML = `
    <div class="config-users-header">
      <div class="config-users-title">Equipamentos Cadastrados</div>
      ${canManage ? `
      <div style="display:flex;align-items:center;gap:0.5rem;">
        <div style="position:relative;">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);color:var(--muted);pointer-events:none"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input type="text" id="ativo-search" class="form-input" placeholder="Buscar ativo..."
            oninput="filterAtivos(this.value)"
            style="padding-left:28px;font-size:0.8rem;width:200px;">
        </div>
        <select id="ativo-filter-setor" class="form-input" onchange="filterAtivos()"
          style="font-size:0.8rem;width:170px;">
          <option value="">Todos os Setores</option>
        </select>
        <button class="config-new-user-btn" onclick="openAtivoForm()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
          Novo Ativo
        </button>
      </div>` : ''}
    </div>
    <div id="ativos-grid" class="ativos-grid"></div>`;

  await loadSetoresInv();
  await loadAtivos(canManage);
}

async function loadSetoresInv() {
  try {
    const snap = await db.collection('setores').get();
    _setoresInv = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(s => s.ativo !== false)
      .sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR'));

    // Preencher selects
    const selForm = document.getElementById('ativo-setor-input');
    const selFilter = document.getElementById('ativo-filter-setor');
    _setoresInv.forEach(s => {
      if (selForm) selForm.innerHTML += `<option value="${s.nome}">${s.nome}</option>`;
      if (selFilter) selFilter.innerHTML += `<option value="${s.nome}">${s.nome}</option>`;
    });
  } catch (e) { console.error('[Inventário] Erro ao carregar setores:', e); }
}

async function loadAtivos(canManage) {
  try {
    const snap = await db.collection('ativos').get();
    _ativos = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.setor || '').localeCompare(b.setor || '', 'pt-BR') ||
        (a.nome || '').localeCompare(b.nome || '', 'pt-BR'));
    renderAtivosList(_ativos, canManage);
  } catch (e) {
    console.error('[Inventário] Erro ao carregar ativos:', e);
    const grid = document.getElementById('ativos-grid');
    if (grid) grid.innerHTML = '<div style="color:var(--muted);font-size:0.8rem;padding:1rem 0;">Erro ao carregar ativos.</div>';
  }
}

function renderAtivosList(list, canManage) {
  const grid = document.getElementById('ativos-grid');
  if (!grid) return;

  if (list.length === 0) {
    grid.innerHTML = `
      <div class="ativos-empty">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>
        <span>Nenhum ativo cadastrado ainda.</span>
      </div>`;
    return;
  }

  // Agrupar por setor
  const bySetor = {};
  list.forEach(a => {
    const s = a.setor || 'Sem Setor';
    if (!bySetor[s]) bySetor[s] = [];
    bySetor[s].push(a);
  });

  grid.innerHTML = Object.entries(bySetor).map(([setor, ativos]) => `
    <div class="ativos-setor-group">
      <div class="ativos-setor-label">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>
        ${setor}
        <span class="ativos-setor-count">${ativos.length} ativo${ativos.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="ativos-cards-row">
        ${ativos.map(a => renderAtivoCard(a, canManage)).join('')}
      </div>
    </div>`).join('');
}

function renderAtivoCard(a, canManage) {
  return `
    <div class="ativo-card" id="ativo-card-${a.id}" onclick="openAtivoDetail('${a.id}')" style="cursor:pointer;">
      <div class="ativo-card-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>
      </div>
      <div class="ativo-card-info">
        <div class="ativo-card-nome">${a.nomeAmigavel || a.nome}</div>
        ${a.nomeAmigavel ? `<div class="ativo-card-modelo">${a.nome}</div>` : ''}
        <div class="ativo-card-meta">
          ${a.patrimonio ? `
          <span class="ativo-meta-tag">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M14 8H8"/><path d="M16 12H8"/></svg>
            ${a.patrimonio}
          </span>` : ''}
          ${a.usuario ? `
          <span class="ativo-meta-tag">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            ${a.usuario}
          </span>` : ''}
        </div>
      </div>
      ${canManage ? `
      <div class="ativo-card-actions">
        <button class="config-user-edit-btn" onclick="event.stopPropagation();openAtivoForm('${a.id}')" title="Editar">✎</button>
        <button class="config-user-del-btn" onclick="event.stopPropagation();deleteAtivo('${a.id}')" title="Excluir">✕</button>
      </div>` : ''}
    </div>`;
}

// ── Filtro ─────────────────────────────────────────────────────────────────
function filterAtivos(q) {
  const query = (typeof q === 'string' ? q : document.getElementById('ativo-search')?.value || '').toLowerCase();
  const setor = document.getElementById('ativo-filter-setor')?.value || '';
  const canManage = currentUser?.isAdmin || currentUser?.isSuperAdmin || currentUser?.role === 'attendant';

  const filtered = _ativos.filter(a => {
    const matchSetor = !setor || a.setor === setor;
    const matchQ = !query ||
      (a.nome || '').toLowerCase().includes(query) ||
      (a.nomeAmigavel || '').toLowerCase().includes(query) ||
      (a.patrimonio || '').toLowerCase().includes(query) ||
      (a.usuario || '').toLowerCase().includes(query);
    return matchSetor && matchQ;
  });

  renderAtivosList(filtered, canManage);
}

// ── Formulário ─────────────────────────────────────────────────────────────
// ── Dirty check modal ativo ────────────────────────────────────────────────
let _ativoFormDirty = false;

function _watchAtivoForm() {
  ['ativo-nome-input', 'ativo-patrimonio-input', 'ativo-usuario-input',
    'ativo-setor-input', 'ativo-amigavel-input'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', () => { _ativoFormDirty = true; });
      if (el) el.addEventListener('change', () => { _ativoFormDirty = true; });
    });
}

function tryCloseAtivoForm() {
  if (_ativoFormDirty) {
    document.getElementById('ativo-discard-warning').classList.add('open');
  } else {
    closeAtivoForm();
  }
}
function closeAtivoDiscardWarning() {
  document.getElementById('ativo-discard-warning').classList.remove('open');
}
function confirmAtivoDiscard() {
  closeAtivoDiscardWarning();
  closeAtivoForm();
}

async function openAtivoForm(id = null) {
  _ativoEditingId = id;
  _ativoFormDirty = false;
  document.getElementById('ativo-form-title').textContent = id ? 'Editar Ativo' : 'Novo Ativo';

  const ativo = id ? _ativos.find(a => a.id === id) : null;
  document.getElementById('ativo-nome-input').value = ativo?.nome || '';
  document.getElementById('ativo-patrimonio-input').value = ativo?.patrimonio || '';
  document.getElementById('ativo-usuario-input').value = ativo?.usuario || '';
  document.getElementById('ativo-amigavel-input').value = ativo?.nomeAmigavel || '';

  // Popular select de setor
  const sel = document.getElementById('ativo-setor-input');
  sel.innerHTML = '<option value="">Selecione o Setor</option>';
  if (_setoresInv.length === 0) await loadSetoresInv();
  _setoresInv.forEach(s => {
    sel.innerHTML += `<option value="${s.nome}" ${ativo?.setor === s.nome ? 'selected' : ''}>${s.nome}</option>`;
  });

  document.getElementById('ativo-form-modal').classList.add('open');
  const overlay = document.getElementById('ativo-form-modal');
  overlay.onclick = (e) => { if (e.target === overlay) tryCloseAtivoForm(); };
  setTimeout(_watchAtivoForm, 100);
}

function closeAtivoForm() {
  document.getElementById('ativo-form-modal').classList.remove('open');
  _ativoEditingId = null;
  _ativoFormDirty = false;
}

async function saveAtivo() {
  const nome = document.getElementById('ativo-nome-input').value.trim();
  const patrimonio = document.getElementById('ativo-patrimonio-input').value.trim();
  const usuario = document.getElementById('ativo-usuario-input').value.trim();
  const setor = document.getElementById('ativo-setor-input').value;
  const nomeAmigavel = document.getElementById('ativo-amigavel-input').value.trim();

  if (!nome) { showNotification('Informe o nome do equipamento.', 'error'); return; }
  if (!setor) { showNotification('Selecione o setor.', 'error'); return; }

  const data = {
    nome, patrimonio, usuario, setor, nomeAmigavel,
    updatedAt: new Date().toISOString()
  };

  try {
    if (_ativoEditingId) {
      await db.collection('ativos').doc(_ativoEditingId).update(data);
      showNotification('Ativo atualizado! ✅', 'success');
    } else {
      data.createdAt = new Date().toISOString();
      await db.collection('ativos').add(data);
      showNotification('Ativo cadastrado! ✅', 'success');
    }
    closeAtivoForm();
    await renderAtivos();
  } catch (e) {
    console.error('[Inventário] Erro ao salvar ativo:', e);
    showNotification('Erro ao salvar ativo.', 'error');
  }
}

async function deleteAtivo(id) {
  const ativo = _ativos.find(a => a.id === id);
  if (!ativo) return;
  if (!confirm(`Excluir o ativo "${ativo.nomeAmigavel || ativo.nome}"?\nEsta ação não pode ser desfeita.`)) return;
  try {
    await db.collection('ativos').doc(id).delete();
    showNotification('Ativo excluído.', 'success');
    await renderAtivos();
  } catch (e) {
    showNotification('Erro ao excluir ativo.', 'error');
  }
}

// ── Inicialização própria — mesmo padrão de configuracoes.js e menu.js ──────
async function _initInventarioPage() {
  await loadUsers();
  const savedId = localStorage.getItem('chamados-current-user-id');
  if (!savedId) { window.location.href = 'login.html'; return; }
  const user = users.find(u => u.id === savedId);
  if (!user) { window.location.href = 'login.html'; return; }
  currentUser = user;

  if (typeof initDarkMode === 'function') initDarkMode();
  if (typeof initSessionTimer === 'function') initSessionTimer(user.role);

  // Sidebar retrátil
  const collapsed = localStorage.getItem('chamados-sidebar-collapsed') === '1';
  const sidebar = document.getElementById('chamados-sidebar');
  const icon = document.getElementById('sidebar-toggle-icon');
  if (sidebar) {
    sidebar.classList.add('no-transition');
    if (collapsed) { sidebar.classList.add('collapsed'); if (icon) icon.textContent = '›'; }
    requestAnimationFrame(() => requestAnimationFrame(() => sidebar.classList.remove('no-transition')));
  }

  // Firebase btn — só superadmin
  const syncBtn = document.getElementById('sync-fab-nav');
  if (syncBtn) syncBtn.style.display = user.isSuperAdmin ? 'flex' : 'none';

  // Config btn — admins
  const configBtn = document.getElementById('sidebar-config-btn');
  if (configBtn) configBtn.style.display = (user.isAdmin || user.isSuperAdmin) ? 'flex' : 'none';

  initInventario();
}

document.addEventListener('DOMContentLoaded', _initInventarioPage);

// ── Modal de detalhe do Ativo ──────────────────────────────────────────────
function openAtivoDetail(id) {
  const a = _ativos.find(x => x.id === id);
  if (!a) return;

  document.getElementById('ativo-detail-title').textContent = a.nomeAmigavel || a.nome;

  const row = (icon, label, value) => value ? `
    <div style="display:flex;align-items:center;gap:0.75rem;padding:0.75rem 0;border-bottom:0.5px solid var(--border);">
      <div style="width:32px;height:32px;border-radius:8px;background:var(--surface2);border:1px solid var(--border2);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--accent);">${icon}</div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:0.68rem;font-family:var(--font-mono);color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;">${label}</div>
        <div style="font-size:0.92rem;font-weight:700;color:var(--text);margin-top:2px;word-break:break-word;">${value}</div>
      </div>
    </div>` : '';

  const ICON_EQUIP = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>';
  const ICON_TAG = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M14 8H8"/><path d="M16 12H8"/></svg>';
  const ICON_USER = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
  const ICON_BUILD = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>';

  document.getElementById('ativo-detail-body').innerHTML = `
    <div style="padding-bottom:0.25rem;">
      ${row(ICON_EQUIP, 'Equipamento', a.nome)}
      ${a.nomeAmigavel && a.nomeAmigavel !== a.nome ? row(ICON_EQUIP, 'Nome Amigável', a.nomeAmigavel) : ''}
      ${row(ICON_TAG, 'Patrimônio', a.patrimonio)}
      ${row(ICON_USER, 'Responsável', a.usuario)}
      ${row(ICON_BUILD, 'Setor', a.setor)}
    </div>`;

  document.getElementById('ativo-detail-modal').classList.add('open');
}

function closeAtivoDetail() {
  document.getElementById('ativo-detail-modal').classList.remove('open');
}

// ── Destacar insumo vindo da URL ───────────────────────────────────────────
function highlightInsumo(id) {
  // Encontrar o card na grade
  const cards = document.querySelectorAll('.insumo-card');
  cards.forEach(card => {
    const btn = card.querySelector(`[onclick*="${id}"]`);
    if (btn || card.innerHTML.includes(id)) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.style.transition = 'box-shadow 0.3s, border-color 0.3s';
      card.style.boxShadow = '0 0 0 3px var(--accent)';
      card.style.borderColor = 'var(--accent)';
      setTimeout(() => {
        card.style.boxShadow = '';
        card.style.borderColor = '';
      }, 2500);
    }
  });
}