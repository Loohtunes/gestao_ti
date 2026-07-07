# gestao_ti# Roadmap Consolidado — Premovale T.I.

> Plataforma interna de gestão multissetorial (fábrica).
> Stack: HTML/CSS/JS puro + Firebase Firestore (sem frameworks, sem Firebase Auth — gestão de usuários custom).
> Prod: `ti.premovale.com.br` (`chamados-p`) · Dev: `chamados-dev-1650a`.
>
> _Última revisão: alinhamento de roadmap — fusão das trilhas "Etapas" e "Fases" numa sequência única._

**Legenda:** ✅ concluído / em produção · 🟡 parcial (iniciado) · ⬜ planejado

---

## Princípios de execução

1. **Prioridade Comercial / T.I. (regra de ouro):** qualquer necessidade ou correção dos módulos **Comercial** ou **T.I.** interrompe a fila, é tratada imediatamente e a sequência é retomada depois. O roadmap orienta a ordem padrão, não a engessa.
2. **Aprovação antes da implementação (inviolável):** ideia/bug descrito ≠ autorização. Claude só diagnostica e propõe plano até receber "pode" / "sim" / "pode implementar".
3. **Sessões separadas:** sessões de ideias/alinhamento não produzem código; implementação acontece em sessões próprias.
4. **Front-first:** proteção de acesso por UI é cosmética; regras de segurança reais no Firestore ficam para a fase de servidor (junto da Análise de Contrato).
5. **Entrega incremental:** só os arquivos modificados são entregues, prontos para copiar na pasta do projeto.

---

## Estado atual

### Módulos em produção ✅

| Módulo | Arquivo principal | Observação |
|--------|-------------------|------------|
| Comercial / Controle de Obras | `comercial.js` (~4900 linhas) | Maduro — Blocos 1-5, Arquivo Morto, relatórios (Visão Geral, Pendências, Por Representante) |
| Chamados | `tickets.js` | Em produção |
| Estoque / Inventário | `inventario.js` + `materials_new.js` | Em produção |
| Rotinas | `rotinas.js` | Em produção |
| Configurações | `configuracoes.js` (5 abas) | Em produção |
| Comunicados | `comunicados.js` | Em produção |
| Dashboard / Menu / Login | `dashboard.html`, `menu.js`, `auth.js` | Navegação base + login custom |

### Peças iniciadas 🟡

- **`app-shell.js`** — esqueleto do roteador (`fetch` + History API, `register`/`navigate`/`teardown`, fallback para navegação clássica). Hoje incluído apenas em `comercial.html` e **inerte** (nenhuma página tem `#app-content` nem se registra).
- **`widgets.js`** — engine de widgets em modo **somente leitura** (`renderWidgets()` por escopo, atalhos padrão, helpers de permissão). Customização de layout pendente.

### Entregue recentemente (validar em prod)

- Migração dos 5 `confirm()` nativos do Comercial → modal custom `_showConfirm`.
- Novo relatório **"Por Representante"** (aba no modal; export PDF hierárquico + XLS tabular).
- Correção do bug **documentação cancelada contada como atraso** (6 pontos / 8 trechos no `comercial.js`).

---

## Sequência única (trilha consolidada)

> Ordem padrão, do mais habilitador ao mais pontual. Sujeita à regra de ouro (Comercial/T.I. fura a fila).

### P1 — App-shell 🟡 (desbloqueador)
Concluir a casca persistente: sidebar/navbar carregada uma vez, conteúdo de módulo injetado em `#app-content` via `fetch` + History API, com fallback clássico para páginas não migradas (migração incremental).
- Absorve o utilitário **`_showConfirm` global** → migração dos **26 `confirm()` nativos restantes** da plataforma.
- Resolve o flicker de navegação (MPA) e as leituras repetidas de permissão no Firestore.
- _Base já existe (`app-shell.js`); falta wiring (`#app-content`, registro das páginas, layout compartilhado)._

### P2 — Módulos pai + dashboards 📊
Dashboards de módulo pai (métricas + alertas + atalhos para submódulos), usando o `widgets.js` como engine. Evolui o widget de leitura para layout configurável.

### P3 — Acessos 🔐
- Aba **Grupos** em Configurações (permissões por grupo).
- Modal de exceções de acesso por módulo pai (sobrepõe regras do grupo).
- T.I. gerencia acessos não específicos de módulo.
- _Front/cosmético nesta fase; regras Firestore reais ficam para a fase de servidor (P5)._

### P4 — Notificações + Bug report 🔔
Notificações (e-mail / push) e canal de report de bugs dentro da plataforma.

### P5 — Análise de Contrato (IA) 🤖
Cloud Functions como proxy seguro de IA (evita exposição de API key). Firebase Blaze (pay-as-you-go — custo ~$0 no volume da fábrica). Inclui a implantação das **regras de segurança reais do Firestore** (acesso por grupo/módulo). Decisão de ativar o Blaze tomada aqui.

### P6 — Calculadora 🧮

### P7 — Orçamentos 📄

### P8 — Mobile / PWA 📱

---

## Itens transversais e dívida técnica

- **26 `confirm()` nativos restantes** (fora do Comercial) — absorvidos no P1 (app-shell + `_showConfirm` global).
- **Pendências soltas do Comercial:**
  - Painel de Filtros fechar ao clicar fora (preservando filtros ativos).
  - Bug: filtro de status de etapa "Concluído" mostra tudo *exceto* as concluídas.
- **Regras de Segurança do Firestore:** a coleção `caixas` já exige regra explícita (`read/write: if true`) em dev **e** prod; o controle de acesso real (por grupo/módulo) é implementado no P5.
- **Pós-Comercial:** módulo **Engenharia** e redesign completo de Configurações (hoje 5 abas).

---

## Convenções técnicas (constantes do projeto)

- **Line endings:** CRLF em todos os arquivos JS (validar por contagem de bytes em Python).
- **Edições:** scripts Python CRLF-aware, busca-substituição com assert de exatamente 1 ocorrência, escrita atômica `.tmp` → `os.replace()`, `node --check` após cada alteração.
- **UI:** fontes Plus Jakarta Sans + Space Mono; ícones Lucide (SVG inline, nunca emoji na UI); **proibido** `confirm()`/`alert()`/`prompt()` nativos — só modais custom.
- **Dados:** Firestore como BaaS; único trigger server-side necessário é a Análise de Contrato (P5).
- **Schema:** cada mudança incompatível incrementa `SCHEMA_VERSION` com função de migração (atual: **11**).
- **Ambiente:** `firebase.js` usa DB de dev quando host é localhost / 127.0.0.1 / contém "github"; produção caso contrário (`_isTestEnv` global).