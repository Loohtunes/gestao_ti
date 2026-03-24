// ===== STATE — Variáveis e constantes compartilhadas =====

// Usuários
let users         = [];
let currentUser   = null;
let editingUserId = null;

// Tickets
let tickets         = [];
let editingTicketId = null;
let ticketFiles     = [];
let currentFilter   = 'all';

// Modal de detalhe
let activeDetailId     = null;
let detailPollInterval = null;

// Controle de escrita no Firestore (evita re-render do próprio write)
let _pendingWrite = false;

// Labels de prioridade
const PRIORITY_LABEL = {
  low:    '🟢 Baixa',
  medium: '🟡 Média',
  high:   '🔴 Alta',
  urgent: '🚨 Urgente'
};

// Labels de status
const STATUS_LABEL = {
  available:      'Aberto',
  'in-progress':  'Em Atendimento',
  completed:      'Concluído',
  archived:       'Arquivado',
  'waiting':      'Em Espera',
  'waiting-info': 'Aguardando Informações',
  'in-analysis':  'Em Análise',
  'requested':    'Solicitado',
  'mat-seen':     'Visto',
  'mat-ordered':  'Solicitado',
};

// Sub-statuses que contam como "em atendimento"
const SUB_STATUS = new Set(['waiting', 'waiting-info', 'in-analysis', 'requested']);

// Statuses de material
const MAT_STATUS = new Set(['available', 'mat-seen', 'mat-ordered', 'archived']);
