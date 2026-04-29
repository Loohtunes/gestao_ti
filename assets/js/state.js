// ===== STATE — Variáveis e constantes compartilhadas =====

// Usuários
let users = [];
let currentUser = null;
let editingUserId = null;

// Tickets
let tickets = [];
let editingTicketId = null;
let ticketFiles = [];
let currentFilter = 'all';

// Modal de detalhe
let activeDetailId = null;
let detailPollInterval = null;

// Controle de escrita no Firestore (evita re-render do próprio write)
let _pendingWrite = false;

// Labels de prioridade (texto puro — usado em logs e mensagens)
const PRIORITY_LABEL = {
  none: 'Sem Prioridade',
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente'
};

// Labels de prioridade com ícones inline SVG (usado nos badges visuais dos cards)
const PRIORITY_ICON_LABEL = {
  none: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></svg><span>Nenhuma</span>',
  low: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><path d="m16 12-4-4-4 4"/><path d="M12 16V8"/></svg><span>Baixa</span>',
  medium: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg><span>Média</span>',
  high: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ff7b00" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg><span>Alta</span>',
  urgent: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg><span>Urgente</span>'
};

// Tickets selecionados para mesclagem
let selectedForMerge = new Set();
let mergeMode = false;

// Modo teste
let _isTestTicket = false;

// Paginação
let currentPage = 1;
const CARDS_PER_PAGE = 8;

// Labels de status
const STATUS_LABEL = {
  available: 'Aberto',
  'in-progress': 'Em Atendimento',
  completed: 'Concluído',
  archived: 'Concluído',
  'waiting': 'Em Espera',
  'waiting-info': 'Aguardando Informações',
  'requested': 'Solicitado',
  'mat-seen': 'Visto',
  'mat-ordered': 'Solicitado',
};

// Sub-statuses que contam como "em atendimento"
const SUB_STATUS = new Set(['waiting', 'waiting-info', 'requested']);

// Statuses de material
const MAT_STATUS = new Set(['available', 'mat-seen', 'mat-ordered', 'archived']);