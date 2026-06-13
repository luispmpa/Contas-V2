const CONFIG_KEY = "contasDomesticas.config.v1";
const RECORDS_KEY = "contasDomesticas.records.v1";
const DRIVE_KEY = "contasDomesticas.drive.v1";
const OVERRIDES_KEY = "contasDomesticas.overrides.v1";
const STANDARD_ACCOUNTS_KEY = "contasDomesticas.standardAccounts.v1";
const VIEW_KEY = "contasDomesticas.view.v1";
const THEME_KEY = "contas-theme";
const APP_VERSION = "20260612-2";
const MANUAL_RECURRENCE_HORIZON_MONTHS = 36;
const INCREMENTAL_SYNC_OVERLAP_DAYS = 3;

const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/drive",
].join(" ");

const RUNTIME_CONFIG = window.CONTAS_DOMESTICAS_CONFIG || {};

const DEFAULT_EXTRACTION_RULES = {
  nubankInvoice: {
    enabled: true,
    source: "gmail",
    recordType: "bill",
    provider: "Nubank",
    category: "Cartão",
    email: "todomundo@nubank.com.br",
    subject: "A fatura do seu cartão Nubank está fechada",
    readBody: false,
    readAttachments: true,
    attachmentPassword: "",
  },
  nubankPayment: {
    enabled: true,
    source: "gmail",
    recordType: "proof",
    provider: "Nubank",
    category: "Cartão",
    email: "todomundo@nubank.com.br",
    subject: "Débito automático realizado com sucesso | Pagamento de fatura realizado com sucesso",
    readBody: true,
    readAttachments: false,
    attachmentPassword: "",
  },
  sommaInvoice: {
    enabled: true,
    source: "gmail",
    recordType: "bill",
    provider: "Somma",
    category: "Condomínio",
    email: "portal@portal.somma-rs.com.br",
    subject: "Aviso de Boleto Disponivel",
    readBody: true,
    readAttachments: true,
    attachmentPassword: "",
  },
  sommaPayment: {
    enabled: true,
    source: "gmail",
    recordType: "proof",
    provider: "Somma",
    category: "Condomínio",
    email: "",
    subject: "Recebemos seu pagamento",
    readBody: true,
    readAttachments: false,
    attachmentPassword: "",
  },
  iptuInvoice: {
    enabled: true,
    source: "gmail",
    recordType: "bill",
    provider: "IPTU Porto Alegre",
    category: "Impostos",
    email: "noreply-iptu@procempa.com.br",
    subject: "Receita Municipal de Porto Alegre - Guia de IPTU/TCL",
    readBody: true,
    readAttachments: false,
    attachmentPassword: "",
  },
  claroInvoice: {
    enabled: true,
    source: "gmail",
    recordType: "bill",
    provider: "Claro",
    category: "Internet",
    email: "faturadigital@minhaclaro.com.br",
    subject: "Sua Fatura Digital Claro chegou",
    readBody: true,
    readAttachments: true,
    attachmentPassword: "01413",
  },
};

const DEFAULT_CONFIG = {
  gmailAccount: RUNTIME_CONFIG.gmailAccount || "luispaulo.carraro@gmail.com",
  gmailLabelName: RUNTIME_CONFIG.gmailLabelName || "Dashboard Contas",
  driveFolderId: RUNTIME_CONFIG.driveFolderId || "1KNqdNGCW5sKdFqy5JG236rwXlk4M8vEQ",
  googleClientId: RUNTIME_CONFIG.googleClientId || "",
  firebaseProfileId: RUNTIME_CONFIG.firebaseProfileId || "casa-luis-camila",
  firebaseConfigRaw: RUNTIME_CONFIG.firebaseConfig
    ? JSON.stringify(RUNTIME_CONFIG.firebaseConfig, null, 2)
    : RUNTIME_CONFIG.firebaseConfigRaw || "",
  syncMonthsBack: RUNTIME_CONFIG.syncMonthsBack || 18,
  incomes: {
    luis: RUNTIME_CONFIG.incomes?.luis || 10000,
    camila: RUNTIME_CONFIG.incomes?.camila || 8500,
  },
  extractionRules: normalizeExtractionRules(RUNTIME_CONFIG.extractionRules),
  displayNames: {
    nubankInvoice: "Cartão - Nubank",
    sommaInvoice: "Condomínio Solar de Ibiza - Somma",
    iptuInvoice: "IPTU - Porto Alegre",
    ...(RUNTIME_CONFIG.displayNames || {}),
  },
  lastSyncAt: "",
};

const CATEGORIES = [
  "Moradia",
  "Condomínio",
  "Energia",
  "Água",
  "Internet",
  "Telefone",
  "Cartão",
  "Mercado",
  "Saúde",
  "Transporte",
  "Impostos",
  "Serviços",
  "Outros",
];

const CATEGORY_RULES = [
  { category: "Energia", regex: /\b(luz|energia|enel|cpfl|cemig|edp|neoenergia|equatorial)\b/i },
  { category: "Água", regex: /\b(água|agua|sabesp|saneamento|dae|cedae|copasa)\b/i },
  { category: "Condomínio", regex: /\b(condom[ií]nio|administradora|síndico|sindico)\b/i },
  { category: "Internet", regex: /\b(internet|fibra|vivo fibra|claro net|tim live|oi fibra|provedor)\b/i },
  { category: "Telefone", regex: /\b(celular|telefone|vivo|claro|tim|oi)\b/i },
  { category: "Cartão", regex: /\b(cartão|cartao|fatura|nubank|itaucard|visa|mastercard|elo|amex)\b/i },
  { category: "Mercado", regex: /\b(mercado|supermercado|hortifruti|atacad|carrefour|pão de açúcar|pao de acucar)\b/i },
  { category: "Saúde", regex: /\b(saúde|saude|plano de saúde|unimed|amil|bradesco saúde|odontológico)\b/i },
  { category: "Transporte", regex: /\b(ipva|seguro auto|combustível|combustivel|sem parar|pedágio|pedagio)\b/i },
  { category: "Impostos", regex: /\b(iptu|dar|darf|guia|tributo|imposto)\b/i },
  { category: "Moradia", regex: /\b(aluguel|imobiliária|imobiliaria|financiamento)\b/i },
  { category: "Serviços", regex: /\b(assinatura|serviço|servico|streaming|spotify|netflix|amazon|google|apple)\b/i },
];

const STATUS_LABELS = {
  open: "Em aberto",
  paid: "Paga",
  overdue: "Atrasada",
  "needs-review": "A revisar",
  "pending-proof": "Sem comprovante",
};

const COLOR_SET = ["#16836e", "#356ac3", "#c95645", "#bd7a16", "#7257a6", "#2b8aa0", "#697338"];
const NUBANK_COLOR_SET = ["#820ad1", "#b24bf3", "#5c16a4", "#d78aff", "#3f0a75", "#a568d4", "#6d3a91"];
const NUBANK_MONTHS = {
  jan: 0,
  fev: 1,
  mar: 2,
  abr: 3,
  mai: 4,
  jun: 5,
  jul: 6,
  ago: 7,
  set: 8,
  out: 9,
  nov: 10,
  dez: 11,
};
const NUBANK_CATEGORY_RULES = [
  { category: "Alimentação", regex: /\b(ifood|restaurante|lanch|pizza|burger|mcdonald|cafe|cafeteria|padaria|delivery|food)\b/i },
  { category: "Mercado", regex: /\b(mercado|supermercado|carrefour|z ?affari|assun|atacad|hortifruti|rissul|nacional)\b/i },
  { category: "Transporte", regex: /\b(uber|99app|cabify|posto|combust|shell|ipiranga|estacion|pedagio|sem parar)\b/i },
  { category: "Saúde", regex: /\b(farmacia|drogaria|panvel|raia|drogasil|hospital|clinica|laboratorio|medic)\b/i },
  { category: "Assinaturas", regex: /\b(netflix|spotify|amazon prime|prime video|youtube|google one|icloud|apple\.com|disney|hbo|max\.com)\b/i },
  { category: "Compras", regex: /\b(amazon|mercado livre|shopee|magalu|magazine|renner|riachuelo|centauro|loja|store)\b/i },
  { category: "Casa", regex: /\b(leroy|tok.?stok|madeira|casa|moveis|construc|ferragem)\b/i },
  { category: "Lazer", regex: /\b(cinema|ingresso|show|teatro|game|steam|playstation|xbox|livraria)\b/i },
  { category: "Educação", regex: /\b(escola|curso|udemy|alura|faculdade|universidade|livro)\b/i },
  { category: "Financeiro", regex: /\b(iof|juros|multa|encargo|anuidade|tarifa)\b/i },
];
const NUBANK_STATEMENT_SUMMARY_REGEX =
  /\b(?:total(?: da fatura| de compras)?|pagamentos?|fatura paga|credito(?:s)?(?: de atraso| recebido| na fatura| da fatura| por pagamento| de pagamento| rotativo)?|ajuste a credito|estorno|reembolso|cashback|desconto|abatimento|devolucao|cancelamento|saldo (?:anterior|em atraso|em aberto|devedor|financiado|remanescente|restante|total)|valor (?:em aberto|pendente|total)|fatura anterior|limite (?:disponivel|total)|subtotal|vencimento|melhor dia de compra|resumo da fatura|pagamento minimo|minimo da fatura)\b/i;
const AUTOCOMPLETE_LIMIT = 12;

const BILL_DOCUMENT_REGEX =
  /\b(fatura|boleto|guia|conta|cobran[cç]a|vencimento|vence|vcto|total a pagar|valor a pagar|d[ée]bito|mensalidade|condom[ií]nio|aluguel|iptu|ipva|darf|energia|[aá]gua|internet)\b/i;
const STRONG_BILL_DOCUMENT_REGEX =
  /\b(fatura(?:\s+do\s+seu\s+cart[aã]o)?|fatura fechada|cart[aã]o nubank est[aá] fechad[ao]|boleto|boleto emitido|novo boleto emitido|guia(?:\s+de)?|iptu|tcl|ipva|darf|tributo|vencimento|vence em|total a pagar|valor a pagar|mensalidade|aluguel|conta de (?:luz|energia|[aá]gua|internet))\b/i;
const PROOF_DOCUMENT_REGEX =
  /\b(comprovante|recibo|pagamento efetuado|pagamento confirmado|pagamento realizado|pagamento conclu[ií]do|pagamento (?:de|da) fatura (?:realizado|efetuado|confirmado|conclu[ií]do)|seu pagamento foi conclu[ií]do|fatura paga|fatura (?:foi )?paga|d[eé]bito autom[aá]tico realizado|recebemos seu pagamento|pago em|quitad[oa]|liquidad[oa]|pix|transfer[eê]ncia)\b/i;
const SERVICE_NOTICE_REGEX =
  /\b(d[eé]bito autom[aá]tico da fatura ativado|ativado com sucesso|nucel|dados extras|empr[eé]stimo pessoal|informe de rendimentos)\b/i;

const els = {
  dashboardNavButtons: Array.from(document.querySelectorAll("[data-dashboard-view]")),
  dashboardPanels: Array.from(document.querySelectorAll("[data-dashboard-panel]")),
  monthSelect: document.querySelector("#monthSelect"),
  syncButton: document.querySelector("#syncButton"),
  fabSyncButton: document.querySelector("#fabSyncButton"),
  themeToggleButton: document.querySelector("#themeToggleButton"),
  pullIndicator: document.querySelector("#pullIndicator"),
  exportButton: document.querySelector("#exportButton"),
  auditToggleButton: document.querySelector("#auditToggleButton"),
  allRecordsButton: document.querySelector("#allRecordsButton"),
  settingsButton: document.querySelector("#settingsButton"),
  universalSearchInput: document.querySelector("#universalSearchInput"),
  universalSuggestions: document.querySelector("#universalSuggestions"),
  statusFilter: document.querySelector("#statusFilter"),
  searchInput: document.querySelector("#searchInput"),
  recordSuggestions: document.querySelector("#recordSuggestions"),
  recordsBody: document.querySelector("#recordsBody"),
  emptyState: document.querySelector("#emptyState"),
  googleDot: document.querySelector("#googleDot"),
  firebaseDot: document.querySelector("#firebaseDot"),
  googleStatus: document.querySelector("#googleStatus"),
  firebaseStatus: document.querySelector("#firebaseStatus"),
  lastSyncLabel: document.querySelector("#lastSyncLabel"),
  auditPanel: document.querySelector("#auditPanel"),
  monthlyAuditBody: document.querySelector("#monthlyAuditBody"),
  metricMonthTotal: document.querySelector("#metricMonthTotal"),
  metricTotal: document.querySelector("#metricTotal"),
  metricPaid: document.querySelector("#metricPaid"),
  metricOverdue: document.querySelector("#metricOverdue"),
  metricMonthCard: document.querySelector("#metricMonthCard"),
  metricTotalCard: document.querySelector("#metricTotalCard"),
  metricPaidCard: document.querySelector("#metricPaidCard"),
  metricOverdueCard: document.querySelector("#metricOverdueCard"),
  metricMonthHint: document.querySelector("#metricMonthHint"),
  metricTotalHint: document.querySelector("#metricTotalHint"),
  metricPaidHint: document.querySelector("#metricPaidHint"),
  metricOverdueHint: document.querySelector("#metricOverdueHint"),
  incomeLuis: document.querySelector("#incomeLuis"),
  incomeCamila: document.querySelector("#incomeCamila"),
  incomeCaption: document.querySelector("#incomeCaption"),
  incomeSettingsButton: document.querySelector("#incomeSettingsButton"),
  incomeLuisContribution: document.querySelector("#incomeLuisContribution"),
  incomeCamilaContribution: document.querySelector("#incomeCamilaContribution"),
  shareLuis: document.querySelector("#shareLuis"),
  shareCamila: document.querySelector("#shareCamila"),
  barLuis: document.querySelector("#barLuis"),
  barCamila: document.querySelector("#barCamila"),
  tableCaption: document.querySelector("#tableCaption"),
  evolutionChart: document.querySelector("#evolutionChart"),
  categoryChart: document.querySelector("#categoryChart"),
  chartRangeSelect: document.querySelector("#chartRangeSelect"),
  nubankInvoiceCaption: document.querySelector("#nubankInvoiceCaption"),
  nubankMetricTotal: document.querySelector("#nubankMetricTotal"),
  nubankMetricTotalHint: document.querySelector("#nubankMetricTotalHint"),
  nubankMetricTotalCard: document.querySelector("#nubankMetricTotalCard"),
  nubankMetricAverage: document.querySelector("#nubankMetricAverage"),
  nubankMetricAverageHint: document.querySelector("#nubankMetricAverageHint"),
  nubankMetricAverageCard: document.querySelector("#nubankMetricAverageCard"),
  nubankMetricLargest: document.querySelector("#nubankMetricLargest"),
  nubankMetricLargestHint: document.querySelector("#nubankMetricLargestHint"),
  nubankMetricLargestCard: document.querySelector("#nubankMetricLargestCard"),
  nubankMetricInstallments: document.querySelector("#nubankMetricInstallments"),
  nubankMetricInstallmentsHint: document.querySelector("#nubankMetricInstallmentsHint"),
  nubankMetricInstallmentsCard: document.querySelector("#nubankMetricInstallmentsCard"),
  nubankDailyChart: document.querySelector("#nubankDailyChart"),
  nubankEvolutionTitle: document.querySelector("#nubankEvolutionTitle"),
  nubankEvolutionCaption: document.querySelector("#nubankEvolutionCaption"),
  nubankChartModeButtons: Array.from(document.querySelectorAll("[data-nubank-chart-mode]")),
  nubankCategoryChart: document.querySelector("#nubankCategoryChart"),
  nubankCategoryFilter: document.querySelector("#nubankCategoryFilter"),
  nubankSearchInput: document.querySelector("#nubankSearchInput"),
  nubankSortSelect: document.querySelector("#nubankSortSelect"),
  nubankSortDirection: document.querySelector("#nubankSortDirection"),
  nubankTransactionsBody: document.querySelector("#nubankTransactionsBody"),
  nubankSortColumnButtons: Array.from(document.querySelectorAll("[data-nubank-sort-column]")),
  nubankTableCaption: document.querySelector("#nubankTableCaption"),
  nubankEmptyState: document.querySelector("#nubankEmptyState"),
  nubankInsightsList: document.querySelector("#nubankInsightsList"),
  nubankDetailDialog: document.querySelector("#nubankDetailDialog"),
  nubankDetailTitle: document.querySelector("#nubankDetailTitle"),
  nubankDetailCaption: document.querySelector("#nubankDetailCaption"),
  nubankDetailSummary: document.querySelector("#nubankDetailSummary"),
  nubankDetailBody: document.querySelector("#nubankDetailBody"),
  searchResultsDialog: document.querySelector("#searchResultsDialog"),
  searchResultsTitle: document.querySelector("#searchResultsTitle"),
  searchResultsCaption: document.querySelector("#searchResultsCaption"),
  searchResultsList: document.querySelector("#searchResultsList"),
  allRecordsDialog: document.querySelector("#allRecordsDialog"),
  allRecordsCaption: document.querySelector("#allRecordsCaption"),
  allRecordsSearchInput: document.querySelector("#allRecordsSearchInput"),
  allRecordsTypeFilter: document.querySelector("#allRecordsTypeFilter"),
  allRecordsStatusFilter: document.querySelector("#allRecordsStatusFilter"),
  allRecordsCategoryFilter: document.querySelector("#allRecordsCategoryFilter"),
  allRecordsSort: document.querySelector("#allRecordsSort"),
  allRecordsDirection: document.querySelector("#allRecordsDirection"),
  allRecordsBody: document.querySelector("#allRecordsBody"),
  allRecordsEmpty: document.querySelector("#allRecordsEmpty"),
  allRecordsSelectVisible: document.querySelector("#allRecordsSelectVisible"),
  allRecordsSelectionCaption: document.querySelector("#allRecordsSelectionCaption"),
  deleteSelectedRecordsButton: document.querySelector("#deleteSelectedRecordsButton"),
  monthArchiveDialog: document.querySelector("#monthArchiveDialog"),
  monthArchiveTitle: document.querySelector("#monthArchiveTitle"),
  monthArchiveList: document.querySelector("#monthArchiveList"),
  detailDialog: document.querySelector("#detailDialog"),
  detailStatus: document.querySelector("#detailStatus"),
  detailTitle: document.querySelector("#detailTitle"),
  detailSubtitle: document.querySelector("#detailSubtitle"),
  detailAmount: document.querySelector("#detailAmount"),
  detailDueDate: document.querySelector("#detailDueDate"),
  detailCategory: document.querySelector("#detailCategory"),
  detailReconciliation: document.querySelector("#detailReconciliation"),
  detailAttachments: document.querySelector("#detailAttachments"),
  detailSources: document.querySelector("#detailSources"),
  detailEvidence: document.querySelector("#detailEvidence"),
  detailProofs: document.querySelector("#detailProofs"),
  detailActions: document.querySelector("#detailActions"),
  detailTogglePaidButton: document.querySelector("#detailTogglePaidButton"),
  detailCategorySelect: document.querySelector("#detailCategorySelect"),
  detailRevertButton: document.querySelector("#detailRevertButton"),
  detailOverrideNote: document.querySelector("#detailOverrideNote"),
  editManualAccountButton: document.querySelector("#editManualAccountButton"),
  settingsDialog: document.querySelector("#settingsDialog"),
  gmailAccountInput: document.querySelector("#gmailAccountInput"),
  gmailLabelInput: document.querySelector("#gmailLabelInput"),
  driveFolderInput: document.querySelector("#driveFolderInput"),
  monthsBackInput: document.querySelector("#monthsBackInput"),
  googleClientInput: document.querySelector("#googleClientInput"),
  profileInput: document.querySelector("#profileInput"),
  incomeLuisInput: document.querySelector("#incomeLuisInput"),
  incomeCamilaInput: document.querySelector("#incomeCamilaInput"),
  firebaseConfigInput: document.querySelector("#firebaseConfigInput"),
  connectGoogleButton: document.querySelector("#connectGoogleButton"),
  saveSettingsButton: document.querySelector("#saveSettingsButton"),
  newRuleButton: document.querySelector("#newRuleButton"),
  cancelNewRuleButton: document.querySelector("#cancelNewRuleButton"),
  saveNewRuleButton: document.querySelector("#saveNewRuleButton"),
  ruleBuilder: document.querySelector("#ruleBuilder"),
  customRulesList: document.querySelector("#customRulesList"),
  displayNamesList: document.querySelector("#displayNamesList"),
  newRuleLabelInput: document.querySelector("#newRuleLabelInput"),
  newRuleProviderInput: document.querySelector("#newRuleProviderInput"),
  newRuleTypeInput: document.querySelector("#newRuleTypeInput"),
  newRuleCategoryInput: document.querySelector("#newRuleCategoryInput"),
  newRuleEmailInput: document.querySelector("#newRuleEmailInput"),
  newRuleSubjectInput: document.querySelector("#newRuleSubjectInput"),
  newRulePasswordInput: document.querySelector("#newRulePasswordInput"),
  newRuleReadBodyInput: document.querySelector("#newRuleReadBodyInput"),
  newRuleReadAttachmentsInput: document.querySelector("#newRuleReadAttachmentsInput"),
  settingsDialogActions: document.querySelector("#settingsDialogActions"),
  settingsTabs: Array.from(document.querySelectorAll("[data-settings-tab]")),
  settingsPanels: Array.from(document.querySelectorAll("[data-settings-panel]")),
  manualTitleInput: document.querySelector("#manualTitleInput"),
  manualDescriptionInput: document.querySelector("#manualDescriptionInput"),
  manualCompetencyInput: document.querySelector("#manualCompetencyInput"),
  manualDueDateInput: document.querySelector("#manualDueDateInput"),
  manualAmountInput: document.querySelector("#manualAmountInput"),
  manualCategoryInput: document.querySelector("#manualCategoryInput"),
  manualRecurringInput: document.querySelector("#manualRecurringInput"),
  manualRecurrenceIntervalInput: document.querySelector("#manualRecurrenceIntervalInput"),
  manualInvoiceFileInput: document.querySelector("#manualInvoiceFileInput"),
  manualProofFileInput: document.querySelector("#manualProofFileInput"),
  manualPaidInput: document.querySelector("#manualPaidInput"),
  manualFormTitle: document.querySelector("#manualFormTitle"),
  manualFormCaption: document.querySelector("#manualFormCaption"),
  manualAccountHint: document.querySelector("#manualAccountHint"),
  cancelManualEditButton: document.querySelector("#cancelManualEditButton"),
  saveManualAccountButton: document.querySelector("#saveManualAccountButton"),
  manualStandardPicker: document.querySelector("#manualStandardPicker"),
  manualStandardAccountInput: document.querySelector("#manualStandardAccountInput"),
  applyStandardAccountButton: document.querySelector("#applyStandardAccountButton"),
  newStandardAccountButton: document.querySelector("#newStandardAccountButton"),
  standardAccountsList: document.querySelector("#standardAccountsList"),
  standardAccountBuilder: document.querySelector("#standardAccountBuilder"),
  standardAccountFormTitle: document.querySelector("#standardAccountFormTitle"),
  standardAccountNameInput: document.querySelector("#standardAccountNameInput"),
  standardAccountTitleInput: document.querySelector("#standardAccountTitleInput"),
  standardAccountDescriptionInput: document.querySelector("#standardAccountDescriptionInput"),
  standardAccountAmountInput: document.querySelector("#standardAccountAmountInput"),
  standardAccountCategoryInput: document.querySelector("#standardAccountCategoryInput"),
  standardAccountDueDayInput: document.querySelector("#standardAccountDueDayInput"),
  standardAccountRecurrenceIntervalInput: document.querySelector("#standardAccountRecurrenceIntervalInput"),
  cancelStandardAccountButton: document.querySelector("#cancelStandardAccountButton"),
  saveStandardAccountButton: document.querySelector("#saveStandardAccountButton"),
  toast: document.querySelector("#toast"),
};

const VIEW_PREFS = readJSON(VIEW_KEY, {});

const state = {
  config: loadConfig(),
  records: readJSON(RECORDS_KEY, []),
  driveFiles: readJSON(DRIVE_KEY, []),
  overrides: readJSON(OVERRIDES_KEY, {}),
  standardAccounts: normalizeStandardAccounts(readJSON(STANDARD_ACCOUNTS_KEY, [])),
  activeDashboard: VIEW_PREFS.activeDashboard === "nubank" ? "nubank" : "household",
  selectedMonth: typeof VIEW_PREFS.selectedMonth === "string" ? VIEW_PREFS.selectedMonth : "",
  selectedRecordId: "",
  googleAccessToken: "",
  googleTokenClient: null,
  firebase: null,
  firebaseUser: null,
  firebaseAuthUnsubscriber: null,
  firebaseUnsubscribers: [],
  charts: {
    evolution: null,
    category: null,
    nubankDaily: null,
    nubankCategory: null,
  },
  filters: {
    status: typeof VIEW_PREFS.status === "string" ? VIEW_PREFS.status : "all",
    search: "",
    recordIds: [],
  },
  searchOptions: [],
  auditVisible: false,
  nubankFilters: {
    category: "all",
    search: "",
    sort: ["date", "amount", "merchant", "category"].includes(VIEW_PREFS.nubankSort) ? VIEW_PREFS.nubankSort : "date",
    direction: VIEW_PREFS.nubankDirection === "asc" ? "asc" : "desc",
  },
  nubankChartMode: VIEW_PREFS.nubankChartMode === "monthly" ? "monthly" : "daily",
  chartRange: typeof VIEW_PREFS.chartRange === "string" ? VIEW_PREFS.chartRange : "12",
  isSyncing: false,
  settingsTab: "integrations",
  editingManualRecordId: "",
  editingStandardAccountId: "",
  selectedAllRecordIds: [],
  allRecordsFilters: {
    search: "",
    type: "all",
    status: "all",
    category: "all",
    sort: "month",
    direction: "desc",
  },
};

init();

function init() {
  document.documentElement.dataset.appVersion = APP_VERSION;
  console.info(`Dashboard Contas ${APP_VERSION}`);
  setupTheme();
  populateSettingsForm();
  populateManualAccountForm();
  bindEvents();
  applyViewPrefsToControls();
  setupPullToRefresh();
  registerServiceWorker();
  connectFirebaseFromConfig();
  render();
  window.lucide?.createIcons();
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
      .then(() => ("caches" in window ? caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))) : undefined))
      .catch((error) => console.warn("Cache offline não removido:", error.message));
  });
}

function setupTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  const theme = stored === "light" || stored === "dark" ? stored : document.documentElement.dataset.theme || "light";
  applyTheme(theme);
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const meta = document.querySelector('meta[name="theme-color"]:not([media])') || null;
  if (meta) meta.setAttribute("content", theme === "dark" ? "#0f1714" : "#16836e");
  if (els.themeToggleButton) {
    els.themeToggleButton.setAttribute("aria-pressed", String(theme === "dark"));
  }
}

function toggleTheme() {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
  renderCharts();
}

function themeColor(name, fallback = "#64736d") {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function setupPullToRefresh() {
  const indicator = els.pullIndicator;
  if (!indicator) return;
  const scroller = document.scrollingElement || document.documentElement;
  const THRESHOLD = 70;
  let startY = 0;
  let distance = 0;
  let pulling = false;

  const reset = () => {
    pulling = false;
    distance = 0;
    indicator.classList.remove("armed", "refreshing");
    indicator.style.opacity = "0";
    indicator.style.transform = "translateY(-60px)";
  };

  window.addEventListener(
    "touchstart",
    (event) => {
      if (state.isSyncing || event.touches.length !== 1 || scroller.scrollTop > 0) return;
      startY = event.touches[0].clientY;
      distance = 0;
      pulling = true;
    },
    { passive: true },
  );

  window.addEventListener(
    "touchmove",
    (event) => {
      if (!pulling) return;
      distance = event.touches[0].clientY - startY;
      if (distance <= 0 || scroller.scrollTop > 0) {
        reset();
        return;
      }
      const pull = Math.min(distance, 110);
      indicator.style.opacity = String(Math.min(pull / THRESHOLD, 1));
      indicator.style.transform = `translateY(${Math.min(pull - 60, 14)}px)`;
      indicator.classList.toggle("armed", pull >= THRESHOLD);
    },
    { passive: true },
  );

  window.addEventListener("touchend", () => {
    if (!pulling) return;
    const shouldRefresh = distance >= THRESHOLD;
    pulling = false;
    if (shouldRefresh && !state.isSyncing) {
      indicator.classList.remove("armed");
      indicator.classList.add("refreshing");
      indicator.style.opacity = "1";
      indicator.style.transform = "translateY(14px)";
      Promise.resolve(syncSources()).finally(reset);
    } else {
      reset();
    }
  });
}

function bindEvents() {
  window.matchMedia("(max-width: 760px)").addEventListener("change", renderCharts);
  els.dashboardNavButtons.forEach((button) => {
    button.addEventListener("click", () => selectDashboard(button.dataset.dashboardView));
  });
  els.syncButton.addEventListener("click", (event) => syncSources({ full: event.shiftKey }));
  els.fabSyncButton?.addEventListener("click", (event) => syncSources({ full: event.shiftKey }));
  els.themeToggleButton?.addEventListener("click", toggleTheme);
  els.exportButton.addEventListener("click", exportCurrentCsv);
  els.auditToggleButton.addEventListener("click", toggleAuditPanel);
  els.allRecordsButton.addEventListener("click", openAllRecords);
  els.allRecordsSelectVisible.addEventListener("change", toggleAllVisibleRecords);
  els.deleteSelectedRecordsButton.addEventListener("click", deleteSelectedRecords);
  els.chartRangeSelect.addEventListener("change", () => {
    state.chartRange = els.chartRangeSelect.value;
    saveViewPrefs();
    renderEvolutionChart();
  });
  els.nubankCategoryFilter.addEventListener("change", () => {
    state.nubankFilters.category = els.nubankCategoryFilter.value;
    renderNubankTable();
  });
  els.nubankSearchInput.addEventListener("input", () => {
    state.nubankFilters.search = normalizeText(els.nubankSearchInput.value);
    renderNubankTable();
  });
  els.nubankSortSelect.addEventListener("change", () => {
    state.nubankFilters.sort = els.nubankSortSelect.value;
    saveViewPrefs();
    renderNubankTable();
  });
  els.nubankSortDirection.addEventListener("change", () => {
    state.nubankFilters.direction = els.nubankSortDirection.value;
    saveViewPrefs();
    renderNubankTable();
  });
  els.nubankSortColumnButtons.forEach((button) => {
    button.addEventListener("click", () => sortNubankByColumn(button.dataset.nubankSortColumn));
  });
  els.nubankChartModeButtons.forEach((button) => {
    button.addEventListener("click", () => selectNubankChartMode(button.dataset.nubankChartMode));
  });
  bindDrilldownCard(els.nubankMetricTotalCard, () => openNubankMetricDetail("total"));
  bindDrilldownCard(els.nubankMetricAverageCard, () => openNubankMetricDetail("average"));
  bindDrilldownCard(els.nubankMetricLargestCard, () => openNubankMetricDetail("largest"));
  bindDrilldownCard(els.nubankMetricInstallmentsCard, () => openNubankMetricDetail("installments"));
  els.settingsButton.addEventListener("click", openSettings);
  els.incomeSettingsButton.addEventListener("click", openIncomeSettings);
  els.settingsTabs.forEach((button) => {
    button.addEventListener("click", () => selectSettingsTab(button.dataset.settingsTab));
  });
  els.manualProofFileInput.addEventListener("change", () => {
    if (els.manualProofFileInput.files?.length) els.manualPaidInput.checked = true;
  });
  els.manualRecurringInput.addEventListener("change", updateManualRecurrenceControls);
  els.manualCompetencyInput.addEventListener("change", updateManualDueDateFromSelectedStandard);
  els.cancelManualEditButton.addEventListener("click", resetManualAccountForm);
  els.detailTogglePaidButton?.addEventListener("click", toggleDetailPaid);
  els.detailCategorySelect?.addEventListener("change", changeDetailCategory);
  els.detailRevertButton?.addEventListener("click", revertDetailOverride);
  els.editManualAccountButton.addEventListener("click", openManualRecordEditor);
  els.saveManualAccountButton.addEventListener("click", saveManualAccount);
  els.applyStandardAccountButton.addEventListener("click", applySelectedStandardAccount);
  els.newStandardAccountButton.addEventListener("click", openStandardAccountBuilder);
  els.cancelStandardAccountButton.addEventListener("click", resetStandardAccountBuilder);
  els.saveStandardAccountButton.addEventListener("click", saveStandardAccount);
  els.universalSearchInput.addEventListener("input", () => {
    updateSearchSuggestions(els.universalSearchInput, els.universalSuggestions, { scope: "all" });
  });
  els.universalSearchInput.addEventListener("focus", () => {
    updateSearchSuggestions(els.universalSearchInput, els.universalSuggestions, { scope: "all" });
  });
  els.universalSearchInput.addEventListener("change", () => {
    openSearchMatch(els.universalSearchInput.value, { input: els.universalSearchInput, scope: "all" });
  });
  els.universalSearchInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    openSearchResults(els.universalSearchInput.value, { scope: "all" });
  });
  els.statusFilter.addEventListener("change", () => {
    state.filters.status = els.statusFilter.value;
    state.filters.recordIds = [];
    saveViewPrefs();
    updateSearchSuggestions(els.searchInput, els.recordSuggestions, { scope: "current" });
    renderTable();
  });
  els.searchInput.addEventListener("input", () => {
    state.filters.search = els.searchInput.value.trim().toLowerCase();
    state.filters.recordIds = [];
    updateSearchSuggestions(els.searchInput, els.recordSuggestions, { scope: "current" });
    renderTable();
  });
  els.searchInput.addEventListener("focus", () => {
    updateSearchSuggestions(els.searchInput, els.recordSuggestions, { scope: "current" });
  });
  els.searchInput.addEventListener("change", () => {
    openSearchMatch(els.searchInput.value, { input: els.searchInput, scope: "current" });
  });
  els.searchInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    openSearchResults(els.searchInput.value, { scope: "current" });
  });
  bindDrilldownCard(els.metricMonthCard, () => openMetricDrilldown("month"));
  bindDrilldownCard(els.metricTotalCard, () => openMetricDrilldown("payable"));
  bindDrilldownCard(els.metricPaidCard, () => openMetricDrilldown("paid"));
  bindDrilldownCard(els.metricOverdueCard, () => openMetricDrilldown("overdue"));
  els.monthSelect.addEventListener("change", () => {
    if (els.monthSelect.value.startsWith("year:")) {
      openMonthArchive(els.monthSelect.value.slice(5));
      els.monthSelect.value = state.selectedMonth;
      return;
    }
    state.selectedMonth = els.monthSelect.value;
    state.filters.recordIds = [];
    saveViewPrefs();
    render();
  });
  els.saveSettingsButton.addEventListener("click", saveSettings);
  [
    els.allRecordsSearchInput,
    els.allRecordsTypeFilter,
    els.allRecordsStatusFilter,
    els.allRecordsCategoryFilter,
    els.allRecordsSort,
    els.allRecordsDirection,
  ].forEach((control) => control?.addEventListener(control === els.allRecordsSearchInput ? "input" : "change", renderAllRecords));
  els.newRuleButton.addEventListener("click", openNewRuleBuilder);
  els.cancelNewRuleButton.addEventListener("click", resetNewRuleBuilder);
  els.saveNewRuleButton.addEventListener("click", saveNewExtractionRule);
  els.connectGoogleButton.addEventListener("click", async () => {
    try {
      await requestGoogleToken();
      showToast("Google conectado.");
      renderConnectionStatus();
    } catch (error) {
      showToast(error.message);
    }
  });
}

function loadConfig() {
  const saved = readJSON(CONFIG_KEY, {});
  return {
    ...DEFAULT_CONFIG,
    ...saved,
    incomes: {
      ...DEFAULT_CONFIG.incomes,
      ...(saved.incomes || {}),
    },
    extractionRules: normalizeExtractionRules(saved.extractionRules || DEFAULT_CONFIG.extractionRules),
    displayNames: {
      ...DEFAULT_CONFIG.displayNames,
      ...(saved.displayNames || {}),
    },
  };
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function saveViewPrefs() {
  writeJSON(VIEW_KEY, {
    activeDashboard: state.activeDashboard,
    status: state.filters.status,
    chartRange: state.chartRange,
    selectedMonth: state.selectedMonth,
    nubankSort: state.nubankFilters.sort,
    nubankDirection: state.nubankFilters.direction,
    nubankChartMode: state.nubankChartMode,
  });
}

function applyViewPrefsToControls() {
  if (els.statusFilter) els.statusFilter.value = state.filters.status;
  if (els.chartRangeSelect) els.chartRangeSelect.value = state.chartRange;
  if (els.nubankSortSelect) els.nubankSortSelect.value = state.nubankFilters.sort;
  if (els.nubankSortDirection) els.nubankSortDirection.value = state.nubankFilters.direction;
}

function normalizeStandardAccounts(value = []) {
  if (!Array.isArray(value)) return [];
  return value
    .map((account) => ({
      id: String(account?.id || "").trim(),
      name: String(account?.name || account?.title || "").trim(),
      title: String(account?.title || "").trim(),
      description: String(account?.description || "").trim(),
      amount: Math.max(0, Number(account?.amount || 0)),
      category: CATEGORIES.includes(account?.category) ? account.category : "Outros",
      dueDay: clampNumber(Number(account?.dueDay), 1, 31, 1),
      recurrenceIntervalMonths: [0, 1, 2, 3, 6, 12].includes(Number(account?.recurrenceIntervalMonths))
        ? Number(account.recurrenceIntervalMonths)
        : 0,
      createdAt: String(account?.createdAt || ""),
      updatedAt: String(account?.updatedAt || ""),
    }))
    .filter((account) => account.id && account.name && account.title)
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

function normalizeExtractionRules(value = {}) {
  const rules = JSON.parse(JSON.stringify(DEFAULT_EXTRACTION_RULES));
  Object.entries(value || {}).forEach(([ruleId, overrides]) => {
    if (!rules[ruleId]) {
      if (overrides?.custom || ruleId.startsWith("custom-")) rules[ruleId] = normalizeCustomExtractionRule(overrides, ruleId);
      return;
    }
    const normalizedOverrides = { ...(overrides || {}) };
    if (
      ruleId === "nubankPayment" &&
      ["Débito automático realizado com sucesso", "Pagamento de fatura realizado com sucesso"].includes(normalizedOverrides.subject)
    ) {
      normalizedOverrides.subject = rules[ruleId].subject;
    }
    rules[ruleId] = {
      ...rules[ruleId],
      ...normalizedOverrides,
      source: rules[ruleId].source,
      recordType: rules[ruleId].recordType,
      readBody: rules[ruleId].readBody,
      readAttachments: rules[ruleId].readAttachments,
      provider: normalizedOverrides.provider || rules[ruleId].provider,
      category: normalizedOverrides.category || rules[ruleId].category,
    };
  });
  return rules;
}

function normalizeCustomExtractionRule(value = {}, ruleId = "") {
  return {
    enabled: value.enabled !== false,
    custom: true,
    label: String(value.label || value.provider || "Regra personalizada").trim(),
    source: "gmail",
    recordType: value.recordType === "proof" ? "proof" : "bill",
    provider: String(value.provider || value.label || "Fornecedor").trim(),
    category: CATEGORIES.includes(value.category) ? value.category : "Outros",
    email: String(value.email || "").trim(),
    subject: String(value.subject || "").trim(),
    readBody: value.readBody !== false,
    readAttachments: value.readAttachments !== false,
    attachmentPassword: String(value.attachmentPassword || "").trim(),
    id: ruleId,
  };
}

function populateExtractionRuleFields() {
  const rules = normalizeExtractionRules(state.config.extractionRules);
  document.querySelectorAll("[data-rule-field]").forEach((input) => {
    const [ruleId, field] = input.dataset.ruleField.split(".");
    const value = rules[ruleId]?.[field];
    if (input.type === "checkbox") {
      input.checked = Boolean(value);
      return;
    }
    input.value = value ?? "";
  });
  renderCustomExtractionRules(rules);
}

function renderCustomExtractionRules(rules = normalizeExtractionRules(state.config.extractionRules)) {
  const customRules = Object.entries(rules).filter(([, rule]) => rule.custom);
  els.customRulesList.innerHTML = customRules
    .map(([ruleId, rule]) => renderCustomRuleCard(ruleId, rule))
    .join("");
  els.customRulesList.querySelectorAll("[data-delete-custom-rule]").forEach((button) => {
    button.addEventListener("click", () => deleteCustomExtractionRule(button.dataset.deleteCustomRule));
  });
  window.lucide?.createIcons();
}

function renderCustomRuleCard(ruleId, rule) {
  const categoryOptions = CATEGORIES.map(
    (category) => `<option value="${escapeAttribute(category)}" ${category === rule.category ? "selected" : ""}>${escapeHtml(category)}</option>`,
  ).join("");
  return `
    <article class="rule-card custom-rule-card" data-custom-rule-id="${escapeAttribute(ruleId)}">
      <header>
        <label class="check-line">
          <input type="checkbox" data-custom-rule-field="enabled" ${rule.enabled ? "checked" : ""} />
          <span>${escapeHtml(rule.label)}</span>
        </label>
        <button class="icon-button ghost small" type="button" data-delete-custom-rule="${escapeAttribute(ruleId)}" title="Excluir regra">
          <i data-lucide="trash-2"></i>
        </button>
      </header>
      <div class="rule-fields custom-rule-fields">
        <label><span>Nome</span><input data-custom-rule-field="label" value="${escapeAttribute(rule.label)}" /></label>
        <label><span>Fornecedor</span><input data-custom-rule-field="provider" value="${escapeAttribute(rule.provider)}" /></label>
        <label>
          <span>Tipo</span>
          <select data-custom-rule-field="recordType">
            <option value="bill" ${rule.recordType === "bill" ? "selected" : ""}>Conta / fatura / boleto</option>
            <option value="proof" ${rule.recordType === "proof" ? "selected" : ""}>Comprovante</option>
          </select>
        </label>
        <label><span>Categoria</span><select data-custom-rule-field="category">${categoryOptions}</select></label>
        <label><span>E-mail</span><input data-custom-rule-field="email" value="${escapeAttribute(rule.email)}" /></label>
        <label><span>Assunto contém</span><input data-custom-rule-field="subject" value="${escapeAttribute(rule.subject)}" /></label>
        <label><span>Senha PDF</span><input data-custom-rule-field="attachmentPassword" value="${escapeAttribute(rule.attachmentPassword)}" /></label>
        <div class="rule-read-options compact-options">
          <label class="check-line"><input type="checkbox" data-custom-rule-field="readBody" ${rule.readBody ? "checked" : ""} /><span>Corpo</span></label>
          <label class="check-line"><input type="checkbox" data-custom-rule-field="readAttachments" ${rule.readAttachments ? "checked" : ""} /><span>Anexos</span></label>
        </div>
      </div>
    </article>
  `;
}

function readExtractionRuleFields() {
  const rules = normalizeExtractionRules(state.config.extractionRules);
  document.querySelectorAll("[data-rule-field]").forEach((input) => {
    const [ruleId, field] = input.dataset.ruleField.split(".");
    if (!rules[ruleId]) return;
    rules[ruleId][field] = input.type === "checkbox" ? input.checked : input.value.trim();
  });
  els.customRulesList.querySelectorAll("[data-custom-rule-id]").forEach((card) => {
    const ruleId = card.dataset.customRuleId;
    const current = normalizeCustomExtractionRule(rules[ruleId], ruleId);
    card.querySelectorAll("[data-custom-rule-field]").forEach((input) => {
      current[input.dataset.customRuleField] = input.type === "checkbox" ? input.checked : input.value.trim();
    });
    rules[ruleId] = normalizeCustomExtractionRule(current, ruleId);
  });
  return normalizeExtractionRules(rules);
}

function populateSettingsForm() {
  els.gmailAccountInput.value = state.config.gmailAccount;
  els.gmailLabelInput.value = state.config.gmailLabelName;
  els.driveFolderInput.value = state.config.driveFolderId;
  els.monthsBackInput.value = state.config.syncMonthsBack;
  els.googleClientInput.value = state.config.googleClientId;
  els.profileInput.value = state.config.firebaseProfileId;
  els.incomeLuisInput.value = formatNumberInput(state.config.incomes.luis);
  els.incomeCamilaInput.value = formatNumberInput(state.config.incomes.camila);
  els.firebaseConfigInput.value = state.config.firebaseConfigRaw;
  populateExtractionRuleFields();
  renderDisplayNameFields();
  renderStandardAccounts();
}

function renderDisplayNameFields() {
  const rules = normalizeExtractionRules(state.config.extractionRules);
  els.displayNamesList.innerHTML = Object.entries(rules)
    .filter(([, rule]) => rule.recordType === "bill")
    .map(([ruleId, rule]) => {
      const currentName = state.config.displayNames?.[ruleId] || defaultDisplayNameForRule(rule);
      return `
        <label class="display-name-row">
          <span>
            <strong>${escapeHtml(rule.provider || rule.label || "Credor")}</strong>
            <small>${escapeHtml(rule.subject || rule.label || "Regra de extração")}</small>
          </span>
          <input data-display-name-rule="${escapeAttribute(ruleId)}" value="${escapeAttribute(currentName)}" placeholder="${escapeAttribute(defaultDisplayNameForRule(rule))}" />
        </label>
      `;
    })
    .join("");
}

function readDisplayNameFields() {
  const names = { ...(state.config.displayNames || {}) };
  els.displayNamesList.querySelectorAll("[data-display-name-rule]").forEach((input) => {
    const ruleId = input.dataset.displayNameRule;
    const value = input.value.trim();
    if (value) names[ruleId] = value;
    else delete names[ruleId];
  });
  return names;
}

function defaultDisplayNameForRule(rule = {}) {
  return String(rule.provider || rule.label || rule.subject || "Conta").trim();
}

function populateManualAccountForm() {
  const categoryOptions = CATEGORIES.map(
    (category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`,
  ).join("");
  els.manualCategoryInput.innerHTML = categoryOptions;
  els.newRuleCategoryInput.innerHTML = categoryOptions;
  els.standardAccountCategoryInput.innerHTML = categoryOptions;
  els.manualCategoryInput.value = "Outros";
  els.standardAccountCategoryInput.value = "Outros";
  els.manualCompetencyInput.value = state.selectedMonth || monthKeyFromDate(toISODate(new Date()));
  renderManualStandardOptions();
}

function openSettings() {
  populateSettingsForm();
  selectSettingsTab(state.settingsTab || "integrations");
  els.settingsDialog.showModal();
  window.lucide?.createIcons();
}

function selectSettingsTab(tab) {
  state.settingsTab = tab || "integrations";
  if (state.settingsTab === "manual" && !els.manualCompetencyInput.value) {
    els.manualCompetencyInput.value = state.selectedMonth || monthKeyFromDate(toISODate(new Date()));
  }
  if (state.settingsTab === "standards") renderStandardAccounts();
  els.settingsTabs.forEach((button) => {
    const active = button.dataset.settingsTab === state.settingsTab;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });
  els.settingsPanels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.settingsPanel === state.settingsTab);
  });
  els.settingsDialogActions.hidden = state.settingsTab === "manual" || state.settingsTab === "standards";
  window.lucide?.createIcons();
}

function renderStandardAccounts() {
  const accounts = normalizeStandardAccounts(state.standardAccounts);
  els.standardAccountsList.innerHTML = accounts.length
    ? accounts
        .map(
          (account) => `
            <article class="standard-account-card">
              <div>
                <h4>${escapeHtml(account.name)}</h4>
                <p>${escapeHtml(account.title)} · ${escapeHtml(account.category)} · ${account.amount > 0 ? formatCurrency(account.amount) : "valor a informar"} · vence dia ${account.dueDay}${account.recurrenceIntervalMonths ? ` · ${escapeHtml(formatRecurrenceInterval(account.recurrenceIntervalMonths))}` : ""}</p>
              </div>
              <div class="standard-account-card-actions">
                <button class="icon-button ghost small" type="button" data-use-standard-account="${escapeAttribute(account.id)}" title="Usar no cadastro">
                  <i data-lucide="file-plus-2"></i>
                </button>
                <button class="icon-button ghost small" type="button" data-edit-standard-account="${escapeAttribute(account.id)}" title="Editar conta padrão">
                  <i data-lucide="pencil"></i>
                </button>
                <button class="icon-button ghost small" type="button" data-delete-standard-account="${escapeAttribute(account.id)}" title="Excluir conta padrão">
                  <i data-lucide="trash-2"></i>
                </button>
              </div>
            </article>
          `,
        )
        .join("")
    : `<div class="standard-accounts-empty">Nenhuma conta padrão cadastrada. Crie um modelo para agilizar os próximos lançamentos.</div>`;
  els.standardAccountsList.querySelectorAll("[data-use-standard-account]").forEach((button) => {
    button.addEventListener("click", () => applyStandardAccount(button.dataset.useStandardAccount, { openManualTab: true }));
  });
  els.standardAccountsList.querySelectorAll("[data-edit-standard-account]").forEach((button) => {
    button.addEventListener("click", () => editStandardAccount(button.dataset.editStandardAccount));
  });
  els.standardAccountsList.querySelectorAll("[data-delete-standard-account]").forEach((button) => {
    button.addEventListener("click", () => deleteStandardAccount(button.dataset.deleteStandardAccount));
  });
  renderManualStandardOptions();
  window.lucide?.createIcons();
}

function renderManualStandardOptions() {
  const selectedId = els.manualStandardAccountInput.value;
  els.manualStandardAccountInput.innerHTML = [
    `<option value="">Selecione uma conta padrão</option>`,
    ...state.standardAccounts.map(
      (account) => `<option value="${escapeAttribute(account.id)}">${escapeHtml(account.name)} · ${escapeHtml(account.title)}</option>`,
    ),
  ].join("");
  els.manualStandardAccountInput.value = state.standardAccounts.some((account) => account.id === selectedId) ? selectedId : "";
  els.applyStandardAccountButton.disabled = !state.standardAccounts.length;
}

function openStandardAccountBuilder() {
  resetStandardAccountBuilder();
  els.standardAccountBuilder.hidden = false;
  els.newStandardAccountButton.hidden = true;
  els.standardAccountNameInput.focus();
  window.lucide?.createIcons();
}

function resetStandardAccountBuilder() {
  state.editingStandardAccountId = "";
  els.standardAccountBuilder.hidden = true;
  els.newStandardAccountButton.hidden = false;
  els.standardAccountFormTitle.textContent = "Nova conta padrão";
  els.standardAccountNameInput.value = "";
  els.standardAccountTitleInput.value = "";
  els.standardAccountDescriptionInput.value = "";
  els.standardAccountAmountInput.value = "";
  els.standardAccountCategoryInput.value = "Outros";
  els.standardAccountDueDayInput.value = "";
  els.standardAccountRecurrenceIntervalInput.value = "0";
}

function editStandardAccount(accountId) {
  const account = state.standardAccounts.find((item) => item.id === accountId);
  if (!account) return;
  state.editingStandardAccountId = account.id;
  els.standardAccountBuilder.hidden = false;
  els.newStandardAccountButton.hidden = true;
  els.standardAccountFormTitle.textContent = "Editar conta padrão";
  els.standardAccountNameInput.value = account.name;
  els.standardAccountTitleInput.value = account.title;
  els.standardAccountDescriptionInput.value = account.description;
  els.standardAccountAmountInput.value = account.amount > 0 ? formatNumberInput(account.amount) : "";
  els.standardAccountCategoryInput.value = account.category;
  els.standardAccountDueDayInput.value = String(account.dueDay);
  els.standardAccountRecurrenceIntervalInput.value = String(account.recurrenceIntervalMonths);
  els.standardAccountNameInput.focus();
}

async function saveStandardAccount() {
  const name = els.standardAccountNameInput.value.trim();
  const title = els.standardAccountTitleInput.value.trim();
  const amount = parseCurrencyInput(els.standardAccountAmountInput.value);
  const dueDay = Number(els.standardAccountDueDayInput.value);
  if (!name || !title || !Number.isFinite(amount) || amount < 0 || !Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) {
    showToast("Informe nome, título, um valor válido e dia do vencimento entre 1 e 31.");
    return;
  }
  const current = state.standardAccounts.find((account) => account.id === state.editingStandardAccountId);
  const now = new Date().toISOString();
  const account = {
    id: current?.id || `standard-${crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`,
    name,
    title,
    description: els.standardAccountDescriptionInput.value.trim(),
    amount,
    category: els.standardAccountCategoryInput.value || "Outros",
    dueDay,
    recurrenceIntervalMonths: Number(els.standardAccountRecurrenceIntervalInput.value || 0),
    createdAt: current?.createdAt || now,
    updatedAt: now,
  };
  state.standardAccounts = normalizeStandardAccounts([...state.standardAccounts.filter((item) => item.id !== account.id), account]);
  writeJSON(STANDARD_ACCOUNTS_KEY, state.standardAccounts);
  await persistStandardAccountToFirebase(account);
  resetStandardAccountBuilder();
  renderStandardAccounts();
  showToast(current ? "Conta padrão atualizada." : "Conta padrão cadastrada.");
}

async function deleteStandardAccount(accountId) {
  const account = state.standardAccounts.find((item) => item.id === accountId);
  if (!account || !window.confirm(`Excluir a conta padrão "${account.name}"?`)) return;
  state.standardAccounts = state.standardAccounts.filter((item) => item.id !== accountId);
  writeJSON(STANDARD_ACCOUNTS_KEY, state.standardAccounts);
  await deleteStandardAccountFromFirebase(accountId);
  if (state.editingStandardAccountId === accountId) resetStandardAccountBuilder();
  renderStandardAccounts();
  showToast("Conta padrão excluída.");
}

function applySelectedStandardAccount() {
  const accountId = els.manualStandardAccountInput.value;
  if (!accountId) {
    showToast("Selecione uma conta padrão.");
    return;
  }
  applyStandardAccount(accountId);
}

function applyStandardAccount(accountId, { openManualTab = false } = {}) {
  const account = state.standardAccounts.find((item) => item.id === accountId);
  if (!account) return;
  if (state.editingManualRecordId) resetManualAccountForm();
  const monthKey = els.manualCompetencyInput.value || state.selectedMonth || monthKeyFromDate(toISODate(new Date()));
  els.manualStandardAccountInput.value = account.id;
  els.manualTitleInput.value = account.title;
  els.manualDescriptionInput.value = account.description;
  els.manualCompetencyInput.value = monthKey;
  els.manualDueDateInput.value = dateInMonth(monthKey, account.dueDay);
  els.manualAmountInput.value = account.amount > 0 ? formatNumberInput(account.amount) : "";
  els.manualCategoryInput.value = account.category;
  els.manualRecurringInput.checked = account.recurrenceIntervalMonths > 0;
  els.manualRecurrenceIntervalInput.value = String(account.recurrenceIntervalMonths || 1);
  updateManualRecurrenceControls();
  if (openManualTab) selectSettingsTab("manual");
  showToast(`Modelo "${account.name}" aplicado.`);
}

function updateManualDueDateFromSelectedStandard() {
  const account = state.standardAccounts.find((item) => item.id === els.manualStandardAccountInput.value);
  if (!account || !els.manualCompetencyInput.value) return;
  els.manualDueDateInput.value = dateInMonth(els.manualCompetencyInput.value, account.dueDay);
}

async function saveSettings() {
  const nextConfig = collectSettingsConfig(readExtractionRuleFields());
  if (nextConfig.firebaseConfigRaw && !isValidJsonObject(nextConfig.firebaseConfigRaw)) {
    showToast("A configuração do Firebase deve ser um objeto JSON válido.");
    return;
  }

  state.config = nextConfig;
  writeJSON(CONFIG_KEY, state.config);
  await connectFirebaseFromConfig();
  els.settingsDialog.close();
  render();
  showToast("Configurações salvas.");
}

function collectSettingsConfig(extractionRules) {
  return {
    ...state.config,
    gmailAccount: els.gmailAccountInput.value.trim() || DEFAULT_CONFIG.gmailAccount,
    gmailLabelName: els.gmailLabelInput.value.trim() || DEFAULT_CONFIG.gmailLabelName,
    driveFolderId: els.driveFolderInput.value.trim() || DEFAULT_CONFIG.driveFolderId,
    syncMonthsBack: clampNumber(Number(els.monthsBackInput.value), 1, 60, DEFAULT_CONFIG.syncMonthsBack),
    googleClientId: els.googleClientInput.value.trim(),
    firebaseProfileId: els.profileInput.value.trim() || DEFAULT_CONFIG.firebaseProfileId,
    firebaseConfigRaw: els.firebaseConfigInput.value.trim(),
    incomes: {
      luis: parseNonNegativeCurrencyInput(els.incomeLuisInput.value, DEFAULT_CONFIG.incomes.luis),
      camila: parseNonNegativeCurrencyInput(els.incomeCamilaInput.value, DEFAULT_CONFIG.incomes.camila),
    },
    extractionRules: normalizeExtractionRules(extractionRules),
    displayNames: readDisplayNameFields(),
  };
}

function openNewRuleBuilder() {
  els.ruleBuilder.hidden = false;
  els.newRuleButton.hidden = true;
  els.newRuleProviderInput.focus();
  window.lucide?.createIcons();
}

function resetNewRuleBuilder() {
  els.ruleBuilder.hidden = true;
  els.newRuleButton.hidden = false;
  els.newRuleLabelInput.value = "";
  els.newRuleProviderInput.value = "";
  els.newRuleTypeInput.value = "bill";
  els.newRuleCategoryInput.value = "Outros";
  els.newRuleEmailInput.value = "";
  els.newRuleSubjectInput.value = "";
  els.newRulePasswordInput.value = "";
  els.newRuleReadBodyInput.checked = true;
  els.newRuleReadAttachmentsInput.checked = true;
}

async function saveNewExtractionRule() {
  const provider = els.newRuleProviderInput.value.trim();
  const email = els.newRuleEmailInput.value.trim();
  const subject = els.newRuleSubjectInput.value.trim();
  if (!provider || (!email && !subject) || (!els.newRuleReadBodyInput.checked && !els.newRuleReadAttachmentsInput.checked)) {
    showToast("Informe fornecedor, e-mail ou assunto, e selecione onde os dados devem ser lidos.");
    return;
  }

  const rules = readExtractionRuleFields();
  const ruleId = `custom-${Date.now()}-${normalizeText(provider).replace(/\s+/g, "-").slice(0, 24) || "regra"}`;
  rules[ruleId] = normalizeCustomExtractionRule(
    {
      enabled: true,
      custom: true,
      label: els.newRuleLabelInput.value.trim() || `${provider} · ${els.newRuleTypeInput.value === "proof" ? "Comprovante" : "Conta"}`,
      provider,
      recordType: els.newRuleTypeInput.value,
      category: els.newRuleCategoryInput.value,
      email,
      subject,
      attachmentPassword: els.newRulePasswordInput.value.trim(),
      readBody: els.newRuleReadBodyInput.checked,
      readAttachments: els.newRuleReadAttachmentsInput.checked,
    },
    ruleId,
  );

  els.saveNewRuleButton.disabled = true;
  try {
    state.config = collectSettingsConfig(rules);
    state.config.displayNames[ruleId] = rules[ruleId].provider || rules[ruleId].label;
    writeJSON(CONFIG_KEY, state.config);
    resetNewRuleBuilder();
    els.settingsDialog.close();
    render();
    showToast("Regra adicionada. Iniciando sincronização completa...");
    await syncSources({ full: true });
  } finally {
    els.saveNewRuleButton.disabled = false;
  }
}

async function deleteCustomExtractionRule(ruleId) {
  const rules = readExtractionRuleFields();
  delete rules[ruleId];
  state.config = collectSettingsConfig(rules);
  writeJSON(CONFIG_KEY, state.config);
  populateExtractionRuleFields();
  showToast("Regra removida. Sincronizando novamente...");
  els.settingsDialog.close();
  await syncSources({ full: true });
}

async function saveManualAccount() {
  const title = els.manualTitleInput.value.trim();
  const description = els.manualDescriptionInput.value.trim();
  const monthKey = els.manualCompetencyInput.value;
  const dueDate = els.manualDueDateInput.value;
  const amount = parseCurrencyInput(els.manualAmountInput.value);
  const category = els.manualCategoryInput.value || "Outros";
  const invoiceFile = els.manualInvoiceFileInput.files?.[0] || null;
  const proofFile = els.manualProofFileInput.files?.[0] || null;
  const paid = els.manualPaidInput.checked;
  const recurring = els.manualRecurringInput.checked;
  const recurrenceIntervalMonths = recurring ? Number(els.manualRecurrenceIntervalInput.value || 1) : 0;
  const editingRecord = state.editingManualRecordId
    ? state.records.find((record) => record.id === state.editingManualRecordId && isManualRecord(record))
    : null;

  if (!title || !monthKey || !dueDate || !Number.isFinite(amount) || amount <= 0) {
    showToast("Informe título, competência, vencimento e um valor válido.");
    return;
  }

  els.saveManualAccountButton.disabled = true;
  els.saveManualAccountButton.innerHTML = `<i data-lucide="loader-circle"></i> ${editingRecord ? "Salvando..." : "Cadastrando..."}`;
  window.lucide?.createIcons();
  try {
    const uploadedDocuments = [];
    if (invoiceFile || proofFile || (state.firebase && !state.firebaseUser)) await requestGoogleToken();
    if (invoiceFile) uploadedDocuments.push(await uploadManualDocument(invoiceFile, title, monthKey, "Fatura manual"));
    if (proofFile) uploadedDocuments.push(await uploadManualDocument(proofFile, title, monthKey, "Comprovante manual"));

    const createdAt = new Date().toISOString();
    const seriesId =
      editingRecord?.recurrenceSeriesId ||
      (recurring ? `manual-series-${crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}` : "");
    const recordId =
      editingRecord?.id ||
      (recurring ? `${seriesId}-${monthKey}` : `manual-${crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`);
    const sources = mergeManualDocumentSources(editingRecord?.sources || [], uploadedDocuments, { recordId, title, createdAt });
    const attachments = mergeManualAttachments(editingRecord?.attachments || [], uploadedDocuments);
    const manualRecord = buildManualRecord({
      baseRecord: editingRecord,
      id: recordId,
      title,
      description,
      category,
      amount,
      dueDate,
      monthKey,
      paid,
      sources,
      attachments,
      recurring,
      recurrenceIntervalMonths,
      recurrenceSeriesId: seriesId,
      createdAt,
    });
    const previousRecordIds = new Set(state.records.map((record) => record.id).filter(Boolean));
    const preservedRecords = editingRecord
      ? state.records.filter(
          (record) =>
            record.id !== editingRecord.id &&
            !(
              editingRecord.recurrenceSeriesId &&
              record.recurrenceSeriesId === editingRecord.recurrenceSeriesId &&
              record.monthKey >= editingRecord.monthKey
            ),
        )
      : state.records;
    const existingSeries = new Map(
      state.records
        .filter((record) => seriesId && record.recurrenceSeriesId === seriesId)
        .map((record) => [record.monthKey, record]),
    );
    const nextManualRecords = recurring
      ? buildManualRecurrenceSeries(manualRecord, existingSeries)
      : [manualRecord];

    state.records = sanitizeRecordList([...preservedRecords, ...nextManualRecords], { includeProofs: true });
    writeJSON(RECORDS_KEY, state.records);
    await persistRecordsToFirebase(state.records, previousRecordIds);
    state.selectedMonth = monthKey;
    resetManualAccountForm();
    els.settingsDialog.close();
    render();
    showToast(
      editingRecord
        ? recurring
          ? "Conta e ocorrências futuras atualizadas."
          : "Conta manual atualizada."
        : recurring
          ? `Conta recorrente cadastrada como ${formatRecurrenceInterval(recurrenceIntervalMonths).toLowerCase()}.`
          : "Conta cadastrada manualmente.",
    );
  } catch (error) {
    showToast(`Não foi possível salvar a conta: ${error.message}`);
  } finally {
    els.saveManualAccountButton.disabled = false;
    els.saveManualAccountButton.innerHTML = state.editingManualRecordId
      ? `<i data-lucide="save"></i> Salvar alterações`
      : `<i data-lucide="file-plus-2"></i> Cadastrar conta`;
    window.lucide?.createIcons();
  }
}

function mergeManualDocumentSources(existingSources, uploadedDocuments, { recordId, title, createdAt }) {
  const manualSource = {
    type: "manual",
    label: "Cadastro manual",
    id: recordId,
    title,
    date: existingSources.find((source) => source.type === "manual")?.date || createdAt,
  };
  const existingDriveSources = existingSources.filter((source) => source.type === "drive");
  const newDriveSources = uploadedDocuments.map((document) => ({
    type: "drive",
    label: document.label,
    id: document.id,
    title: document.name,
    url: document.webViewLink,
    date: document.createdTime || createdAt,
    thumbnailLink: document.thumbnailLink || "",
    mimeType: document.mimeType,
  }));
  return [manualSource, ...existingDriveSources, ...newDriveSources];
}

function mergeManualAttachments(existingAttachments, uploadedDocuments) {
  return [
    ...existingAttachments,
    ...uploadedDocuments.map((document) => ({
      fileName: document.name,
      mimeType: document.mimeType,
      size: Number(document.size || 0),
      url: document.webViewLink,
    })),
  ];
}

function buildManualRecord({
  baseRecord = null,
  id,
  title,
  description,
  category,
  amount,
  dueDate,
  monthKey,
  paid,
  sources,
  attachments,
  recurring,
  recurrenceIntervalMonths,
  recurrenceSeriesId,
  createdAt,
}) {
  return {
    ...(baseRecord || {}),
    id,
    recordType: "bill",
    sourceRuleId: "manual",
    title,
    provider: title,
    description,
    category,
    amount,
    amountConfirmed: true,
    dueDate,
    paidDate: paid ? baseRecord?.paidDate || toISODate(new Date()) : "",
    monthKey,
    periodKey: monthKey,
    status: paid ? "paid" : dueDate < toISODate(new Date()) ? "overdue" : "open",
    cnpjs: findCnpjs(description),
    installment: findInstallment(description, { sourceRuleId: "manual" }),
    sourceTypes: inferSourceTypes(sources),
    sources,
    attachments,
    recurrenceEnabled: recurring,
    recurrenceIntervalMonths: recurring ? recurrenceIntervalMonths : 0,
    recurrenceSeriesId: recurring ? recurrenceSeriesId : "",
    recurrenceAnchorMonth: recurring ? monthKey : "",
    recurrenceHorizonMonths: recurring ? MANUAL_RECURRENCE_HORIZON_MONTHS : 0,
    evidence: description || "Conta cadastrada manualmente.",
    confidence: "alta",
    createdAt: baseRecord?.createdAt || createdAt,
    updatedAt: createdAt,
  };
}

function buildManualRecurrenceSeries(baseRecord, existingSeries = new Map()) {
  const interval = Number(baseRecord.recurrenceIntervalMonths || 1);
  const occurrences = [];
  for (let offset = 0; offset <= MANUAL_RECURRENCE_HORIZON_MONTHS; offset += interval) {
    const monthKey = addMonthsToMonthKey(baseRecord.monthKey, offset);
    const existing = existingSeries.get(monthKey);
    const isBase = offset === 0;
    const dueDate = dateInMonth(monthKey, Number(baseRecord.dueDate.slice(-2)));
    const recordId = `${baseRecord.recurrenceSeriesId}-${monthKey}`;
    const sources = isBase
      ? baseRecord.sources
      : existing?.sources?.length
        ? existing.sources
        : [{ type: "manual", label: "Recorrência manual", id: recordId, title: baseRecord.title, date: baseRecord.updatedAt }];
    const attachments = isBase ? baseRecord.attachments : existing?.attachments || [];
    const paid = isBase ? baseRecord.status === "paid" : existing?.status === "paid";
    occurrences.push(
      buildManualRecord({
        baseRecord: existing || null,
        id: recordId,
        title: baseRecord.title,
        description: baseRecord.description,
        category: baseRecord.category,
        amount: baseRecord.amount,
        dueDate,
        monthKey,
        paid,
        sources,
        attachments,
        recurring: true,
        recurrenceIntervalMonths: interval,
        recurrenceSeriesId: baseRecord.recurrenceSeriesId,
        createdAt: baseRecord.updatedAt,
      }),
    );
  }
  return occurrences;
}

async function uploadManualDocument(file, title, monthKey, label) {
  const metadata = {
    name: `${monthKey} - ${cleanTitle(title)} - ${file.name}`.slice(0, 220),
    mimeType: file.type || "application/octet-stream",
    parents: [state.config.driveFolderId],
    description: `${label} da conta cadastrada manualmente: ${title}`,
  };
  const sessionResponse = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,webViewLink,mimeType,size,thumbnailLink,createdTime",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${state.googleAccessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": metadata.mimeType,
        "X-Upload-Content-Length": String(file.size),
      },
      body: JSON.stringify(metadata),
    },
  );

  if (!sessionResponse.ok) {
    const error = await sessionResponse.json().catch(() => ({}));
    throw new Error(error.error?.message || `${sessionResponse.status} ${sessionResponse.statusText}`);
  }

  const uploadUrl = sessionResponse.headers.get("Location");
  if (!uploadUrl) throw new Error("O Google Drive não retornou a sessão de upload.");

  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": metadata.mimeType,
    },
    body: file,
  });

  if (!uploadResponse.ok) {
    const error = await uploadResponse.json().catch(() => ({}));
    throw new Error(error.error?.message || `${uploadResponse.status} ${uploadResponse.statusText}`);
  }

  return { ...(await uploadResponse.json()), label };
}

function resetManualAccountForm() {
  state.editingManualRecordId = "";
  els.manualTitleInput.value = "";
  els.manualDescriptionInput.value = "";
  els.manualCompetencyInput.value = state.selectedMonth || monthKeyFromDate(toISODate(new Date()));
  els.manualDueDateInput.value = "";
  els.manualAmountInput.value = "";
  els.manualCategoryInput.value = "Outros";
  els.manualRecurringInput.checked = false;
  els.manualRecurrenceIntervalInput.value = "1";
  els.manualInvoiceFileInput.value = "";
  els.manualProofFileInput.value = "";
  els.manualPaidInput.checked = false;
  els.manualStandardAccountInput.value = "";
  els.manualStandardPicker.hidden = false;
  els.manualFormTitle.textContent = "Cadastrar conta manualmente";
  els.manualFormCaption.textContent = "Preencha os dados da conta e, se necessário, configure a recorrência.";
  els.manualAccountHint.textContent = "Os documentos serão enviados para a pasta do Drive configurada.";
  els.cancelManualEditButton.hidden = true;
  els.saveManualAccountButton.innerHTML = `<i data-lucide="file-plus-2"></i> Cadastrar conta`;
  updateManualRecurrenceControls();
  window.lucide?.createIcons();
}

function updateManualRecurrenceControls() {
  els.manualRecurrenceIntervalInput.disabled = !els.manualRecurringInput.checked;
  if (state.editingManualRecordId) return;
  els.manualAccountHint.textContent = els.manualRecurringInput.checked
    ? "As ocorrências serão geradas automaticamente para os próximos 3 anos."
    : "Os documentos serão enviados para a pasta do Drive configurada.";
}

function openManualRecordEditor() {
  const record = state.records.find((item) => item.id === state.selectedRecordId && isManualRecord(item));
  if (!record) return;
  state.editingManualRecordId = record.id;
  els.manualTitleInput.value = record.title || "";
  els.manualDescriptionInput.value = record.description || record.evidence || "";
  els.manualCompetencyInput.value = record.monthKey || "";
  els.manualDueDateInput.value = record.dueDate || "";
  els.manualAmountInput.value = formatNumberInput(record.amount || 0);
  els.manualCategoryInput.value = record.category || "Outros";
  els.manualRecurringInput.checked = Boolean(record.recurrenceEnabled);
  els.manualRecurrenceIntervalInput.value = String(record.recurrenceIntervalMonths || 1);
  els.manualPaidInput.checked = record.status === "paid";
  els.manualStandardAccountInput.value = "";
  els.manualStandardPicker.hidden = true;
  els.manualInvoiceFileInput.value = "";
  els.manualProofFileInput.value = "";
  els.manualFormTitle.textContent = "Editar conta manual";
  els.manualFormCaption.textContent = record.recurrenceEnabled
    ? "As alterações serão aplicadas nesta ocorrência e nas ocorrências futuras da série."
    : "Altere os dados salvos desta conta manual.";
  els.manualAccountHint.textContent = "Novos documentos serão acrescentados aos documentos já salvos.";
  els.cancelManualEditButton.hidden = false;
  els.saveManualAccountButton.innerHTML = `<i data-lucide="save"></i> Salvar alterações`;
  updateManualRecurrenceControls();
  els.detailDialog.close();
  selectSettingsTab("manual");
  els.settingsDialog.showModal();
  window.lucide?.createIcons();
}

function clampNumber(value, min, max, fallback) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, value));
}

async function connectFirebaseFromConfig() {
  teardownFirebase();

  if (!state.config.firebaseConfigRaw) {
    state.firebase = null;
    state.firebaseUser = null;
    renderConnectionStatus();
    return;
  }

  let parsedConfig;
  try {
    parsedConfig = JSON.parse(state.config.firebaseConfigRaw);
  } catch {
    state.firebase = null;
    state.firebaseUser = null;
    renderConnectionStatus("Firebase config inválida", "bad");
    return;
  }

  try {
    const firebaseVersion = "10.12.4";
    const appModule = await import(`https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-app.js`);
    const firestoreModule = await import(`https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-firestore.js`);
    const authModule = await import(`https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-auth.js`);
    const appName = `contas-domesticas-${state.config.firebaseProfileId}`;
    const app = appModule.getApps().find((item) => item.name === appName) || appModule.initializeApp(parsedConfig, appName);
    const db = firestoreModule.getFirestore(app);
    const auth = authModule.getAuth(app);
    const provider = new authModule.GoogleAuthProvider();
    GOOGLE_SCOPES.split(" ").forEach((scope) => provider.addScope(scope));
    provider.setCustomParameters({ prompt: "select_account" });

    state.firebase = {
      db,
      auth,
      provider,
      collection: firestoreModule.collection,
      doc: firestoreModule.doc,
      setDoc: firestoreModule.setDoc,
      deleteDoc: firestoreModule.deleteDoc,
      onSnapshot: firestoreModule.onSnapshot,
      serverTimestamp: firestoreModule.serverTimestamp,
      signInWithPopup: authModule.signInWithPopup,
      GoogleAuthProvider: authModule.GoogleAuthProvider,
      onAuthStateChanged: authModule.onAuthStateChanged,
    };

    state.firebaseAuthUnsubscriber = state.firebase.onAuthStateChanged(auth, (user) => {
      state.firebaseUser = user;
      teardownFirebaseDataListeners();
      if (user) startFirebaseListeners();
      renderConnectionStatus();
    });

    renderConnectionStatus("Firebase pronto", "warn");
  } catch (error) {
    state.firebase = null;
    state.firebaseUser = null;
    renderConnectionStatus(`Firebase indisponível: ${error.message}`, "bad");
  }
}

function startFirebaseListeners() {
  if (!state.firebase || !state.firebaseUser) return;

  const { db } = state.firebase;
  const recordsRef = state.firebase.collection(db, "householdDashboards", state.config.firebaseProfileId, "records");
  const overridesRef = state.firebase.collection(db, "householdDashboards", state.config.firebaseProfileId, "overrides");
  const standardAccountsRef = state.firebase.collection(db, "householdDashboards", state.config.firebaseProfileId, "standardAccounts");

  state.firebaseUnsubscribers.push(
    state.firebase.onSnapshot(
      recordsRef,
      (snapshot) => {
        if (snapshot.empty) return;
        const rawRecords = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...stripFirestoreMeta(docSnap.data()),
        }));
        const sanitizedRecords = sanitizeRecordList(rawRecords, { includeProofs: true });
        const dedupedRecords = dedupeRecords(sanitizedRecords);
        const sanitizedIds = new Set(sanitizedRecords.map((record) => record.id));
        const keptIds = new Set(dedupedRecords.map((record) => record.id));
        const invalidIds = rawRecords.map((record) => record.id).filter((id) => !sanitizedIds.has(id));
        // Registros duplicados já persistidos no Firestore (ex.: IPTU puxado 2x) são unificados
        // ao carregar e os documentos redundantes são removidos para não voltarem a aparecer.
        const duplicateIds = sanitizedRecords.map((record) => record.id).filter((id) => !keptIds.has(id));
        const removableIds = Array.from(new Set([...invalidIds, ...duplicateIds]));

        if (removableIds.length) deleteRecordsFromFirebase(removableIds);

        state.records = dedupedRecords.filter((record) => !state.overrides[record.id]?.deleted);
        const latestRecordUpdate = state.records.map((record) => record.updatedAt).filter(Boolean).sort().at(-1);
        if (latestRecordUpdate && (!state.config.lastSyncAt || latestRecordUpdate > state.config.lastSyncAt)) {
          state.config.lastSyncAt = latestRecordUpdate;
          writeJSON(CONFIG_KEY, state.config);
        }
        writeJSON(RECORDS_KEY, state.records);
        render();
      },
      (error) => renderConnectionStatus(`Firebase: ${error.message}`, "bad"),
    ),
  );

  state.firebaseUnsubscribers.push(
    state.firebase.onSnapshot(
      overridesRef,
      (snapshot) => {
        const overrides = { ...state.overrides };
        snapshot.docs.forEach((docSnap) => {
          overrides[docSnap.id] = stripFirestoreMeta(docSnap.data());
        });
        state.overrides = overrides;
        writeJSON(OVERRIDES_KEY, state.overrides);
        render();
      },
      (error) => renderConnectionStatus(`Firebase: ${error.message}`, "bad"),
    ),
  );

  state.firebaseUnsubscribers.push(
    state.firebase.onSnapshot(
      standardAccountsRef,
      (snapshot) => {
        if (snapshot.empty && state.standardAccounts.length) {
          Promise.all(state.standardAccounts.map((account) => persistStandardAccountToFirebase(account))).catch((error) =>
            renderConnectionStatus(`Firebase: ${error.message}`, "bad"),
          );
          return;
        }
        state.standardAccounts = normalizeStandardAccounts(
          snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...stripFirestoreMeta(docSnap.data()),
          })),
        );
        writeJSON(STANDARD_ACCOUNTS_KEY, state.standardAccounts);
        renderStandardAccounts();
      },
      (error) => renderConnectionStatus(`Firebase: ${error.message}`, "bad"),
    ),
  );
}

function teardownFirebaseDataListeners() {
  state.firebaseUnsubscribers.forEach((unsubscribe) => unsubscribe());
  state.firebaseUnsubscribers = [];
}

function teardownFirebase() {
  teardownFirebaseDataListeners();
  if (state.firebaseAuthUnsubscriber) state.firebaseAuthUnsubscriber();
  state.firebaseAuthUnsubscriber = null;
  state.firebaseUser = null;
}

function stripFirestoreMeta(value) {
  const copy = { ...value };
  delete copy.syncedAt;
  return copy;
}

async function syncSources({ full = false } = {}) {
  if (state.isSyncing) return;

  if (!state.config.googleClientId && !state.firebase) {
    openSettings();
    showToast("Informe o OAuth Client ID ou configure o Firebase.");
    return;
  }

  state.isSyncing = true;
  els.syncButton.classList.add("spinning");
  els.fabSyncButton?.classList.add("spinning");
  showSkeletons();
  const incrementalSince = full ? "" : getIncrementalSyncSince();
  const syncMode = incrementalSince ? "incremental" : "completa";
  renderConnectionStatus(`Sincronização ${syncMode}...`, "warn");

  try {
    const previousRecordIds = new Set(state.records.map((record) => record.id).filter(Boolean));
    const previousRecordsById = new Map(state.records.map((record) => [record.id, record]));
    const manualRecords = state.records.filter((record) => isManualRecord(record) && !state.overrides[record.id]?.deleted);
    await requestGoogleToken();
    const [gmailRecords, driveFiles] = await Promise.all([
      fetchGmailRecords({ since: incrementalSince }),
      fetchDriveFiles({ since: incrementalSince }),
    ]);
    const driveRecords = buildDriveRecords(driveFiles);
    const baseRecords = incrementalSince ? state.records : manualRecords;
    const records = attachProofs(dedupeRecords([...gmailRecords, ...driveRecords, ...baseRecords]));

    state.records = sanitizeRecordList(records, { includeProofs: true }).filter(
      (record) => !state.overrides[record.id]?.deleted,
    );
    state.driveFiles = incrementalSince ? mergeDriveFiles(state.driveFiles, driveFiles) : driveFiles;
    state.config.lastSyncAt = new Date().toISOString();
    state.filters.recordIds = [];
    writeJSON(RECORDS_KEY, state.records);
    writeJSON(DRIVE_KEY, state.driveFiles);
    writeJSON(CONFIG_KEY, state.config);
    const recordsToPersist = incrementalSince
      ? state.records.filter((record) => recordSyncFingerprint(record) !== recordSyncFingerprint(previousRecordsById.get(record.id)))
      : state.records;
    await persistRecordsToFirebase(state.records, previousRecordIds, { recordsToWrite: recordsToPersist });
    const billsCount = state.records.filter((record) => record.recordType === "bill").length;
    const proofsCount = state.records.filter((record) => record.recordType === "proof").length;
    const sommaCount = state.records.filter((record) => record.recordType === "bill" && record.sourceRuleId === "sommaInvoice").length;
    const nubankTransactionCount = state.records.reduce((count, record) => count + (record.nubankTransactions?.length || 0), 0);
    showToast(
      `Sincronização ${syncMode} concluída: ${gmailRecords.length} e-mails, ${driveFiles.length} arquivos e ${recordsToPersist.length} registros atualizados · ${billsCount} contas, ${nubankTransactionCount} compras Nubank, Somma: ${sommaCount} e ${proofsCount} comprovantes não conciliados.`,
    );
  } catch (error) {
    renderConnectionStatus(`Google: ${error.message}`, "bad");
    showToast(error.message);
  } finally {
    state.isSyncing = false;
    els.syncButton.classList.remove("spinning");
    els.fabSyncButton?.classList.remove("spinning");
    hideSkeletons();
    render();
  }
}

function showSkeletons() {
  document.querySelectorAll(".metric-card").forEach((card) => card.classList.add("is-loading"));
  if (els.recordsBody) {
    els.recordsBody.innerHTML = Array.from({ length: 6 })
      .map(
        () =>
          '<tr class="skeleton-row"><td colspan="6"><span class="skeleton title"></span><span class="skeleton sub"></span></td></tr>',
      )
      .join("");
  }
  if (els.emptyState) els.emptyState.hidden = true;
}

function hideSkeletons() {
  document.querySelectorAll(".metric-card.is-loading").forEach((card) => card.classList.remove("is-loading"));
}

async function persistRecordsToFirebase(records, previousRecordIds = new Set(), { recordsToWrite = records } = {}) {
  if (!state.firebase || !state.firebaseUser) return;
  const { db, doc, setDoc, deleteDoc, serverTimestamp } = state.firebase;
  const activeRecords = records.filter((record) => !state.overrides[record.id]?.deleted);
  const nextRecordIds = new Set(activeRecords.map((record) => record.id));
  const staleRecordIds = Array.from(previousRecordIds).filter((id) => !nextRecordIds.has(id));
  await Promise.all([
    ...staleRecordIds.map((id) => deleteDoc(doc(db, "householdDashboards", state.config.firebaseProfileId, "records", id))),
    ...recordsToWrite.filter((record) => !state.overrides[record.id]?.deleted).map((record) =>
      setDoc(doc(db, "householdDashboards", state.config.firebaseProfileId, "records", record.id), {
        ...record,
        syncedAt: serverTimestamp(),
      }),
    ),
  ]);
}

function recordSyncFingerprint(record) {
  if (!record) return "";
  const copy = { ...record };
  delete copy.syncedAt;
  return JSON.stringify(copy);
}

async function persistSingleRecordToFirebase(record) {
  if (!state.firebase || !state.firebaseUser) return;
  const { db, doc, setDoc, serverTimestamp } = state.firebase;
  await setDoc(doc(db, "householdDashboards", state.config.firebaseProfileId, "records", record.id), {
    ...record,
    syncedAt: serverTimestamp(),
  });
}

async function deleteRecordsFromFirebase(recordIds) {
  if (!state.firebase || !state.firebaseUser || !recordIds.length) return;
  const { db, doc, deleteDoc } = state.firebase;
  await Promise.all(
    recordIds.map((id) => deleteDoc(doc(db, "householdDashboards", state.config.firebaseProfileId, "records", id))),
  );
}

async function persistOverrideToFirebase(recordId, override) {
  if (!state.firebase || !state.firebaseUser) return;
  const { db, doc, setDoc, serverTimestamp } = state.firebase;
  await setDoc(doc(db, "householdDashboards", state.config.firebaseProfileId, "overrides", recordId), {
    ...override,
    syncedAt: serverTimestamp(),
  });
}

async function persistStandardAccountToFirebase(account) {
  if (!state.firebase || !state.firebaseUser) return;
  const { db, doc, setDoc, serverTimestamp } = state.firebase;
  await setDoc(doc(db, "householdDashboards", state.config.firebaseProfileId, "standardAccounts", account.id), {
    ...account,
    syncedAt: serverTimestamp(),
  });
}

async function deleteStandardAccountFromFirebase(accountId) {
  if (!state.firebase || !state.firebaseUser) return;
  const { db, doc, deleteDoc } = state.firebase;
  await deleteDoc(doc(db, "householdDashboards", state.config.firebaseProfileId, "standardAccounts", accountId));
}

async function requestGoogleToken() {
  if (state.googleAccessToken) return state.googleAccessToken;

  if (state.firebase) {
    return requestFirebaseGoogleToken();
  }

  if (!window.google?.accounts?.oauth2) {
    throw new Error("Biblioteca do Google ainda não carregou.");
  }

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error("Tempo esgotado ao conectar o Google.")), 90000);
    state.googleTokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: state.config.googleClientId,
      scope: GOOGLE_SCOPES,
      hint: state.config.gmailAccount,
      callback: (response) => {
        window.clearTimeout(timeout);
        if (response.error) {
          reject(new Error(response.error_description || response.error));
          return;
        }
        state.googleAccessToken = response.access_token;
        renderConnectionStatus("Google conectado", "ok");
        resolve(state.googleAccessToken);
      },
    });
    state.googleTokenClient.requestAccessToken({ prompt: "consent" });
  });
}

async function requestFirebaseGoogleToken() {
  const { auth, provider, signInWithPopup, GoogleAuthProvider } = state.firebase;
  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);

  if (!credential?.accessToken) {
    throw new Error("Login concluído, mas o Google não retornou token de leitura.");
  }

  state.firebaseUser = result.user;
  state.googleAccessToken = credential.accessToken;
  renderConnectionStatus("Google conectado", "ok");
  return state.googleAccessToken;
}

async function fetchGmailRecords({ since = "" } = {}) {
  const labels = await googleFetch("gmail/v1/users/me/labels");
  const label = labels.labels?.find((item) => item.name.toLowerCase() === state.config.gmailLabelName.toLowerCase());

  if (!label) {
    throw new Error(`Marcador "${state.config.gmailLabelName}" não encontrado no Gmail.`);
  }

  const messageMap = new Map();
  const baseQuery = since ? `after:${formatGmailQueryDate(since)}` : `newer_than:${state.config.syncMonthsBack}m`;
  const searches = [
    { labelIds: label.id, q: baseQuery },
    ...Object.values(normalizeExtractionRules(state.config.extractionRules))
      .filter((rule) => rule.enabled && rule.source === "gmail")
      .flatMap((rule) => [
        rule.email ? { labelIds: label.id, q: `${baseQuery} from:(${rule.email})` } : null,
        ...configuredSubjectCandidates(rule.subject).map((subject) => ({
          labelIds: label.id,
          q: `${baseQuery} subject:"${escapeGmailQuery(subject)}"`,
        })),
      ])
      .filter(Boolean),
  ];

  for (const search of searches) {
    let pageToken = "";
    do {
      const page = await googleFetch("gmail/v1/users/me/messages", {
        labelIds: search.labelIds,
        maxResults: 500,
        q: search.q,
        pageToken,
      });
      (page.messages || []).forEach((message) => messageMap.set(message.id, message));
      pageToken = page.nextPageToken || "";
    } while (pageToken);
  }
  const messages = Array.from(messageMap.values());

  const fullMessages = await mapLimit(messages, 6, (message) =>
    googleFetch(`gmail/v1/users/me/messages/${message.id}`, { format: "full" }),
  );

  const parsedMessages = await mapLimit(fullMessages, 3, parseGmailMessageSafely);
  return parsedMessages.filter(Boolean);
}

function formatGmailQueryDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getUTCFullYear()}/${String(date.getUTCMonth() + 1).padStart(2, "0")}/${String(date.getUTCDate()).padStart(2, "0")}`;
}

async function parseGmailMessageSafely(message) {
  try {
    return await parseGmailMessage(message);
  } catch {
    return buildGmailFallbackRecord(message);
  }
}

function buildGmailFallbackRecord(message) {
  const headers = Object.fromEntries((message.payload?.headers || []).map((header) => [header.name.toLowerCase(), header.value]));
  const subject = headers.subject || "Sem assunto";
  const from = headers.from || "";
  const to = headers.to || "";
  const rule = findGmailExtractionRule({ subject, from, to });
  if (!rule) return null;
  const sentDate = parseEmailDate(headers.date) || new Date(Number(message.internalDate || Date.now()));
  const createdAt = sentDate.toISOString();
  const parsed = parseSourceText(`${subject}\n${message.snippet || ""}`, createdAt, rule);
  const dueDate = parsed.dueDate || toISODate(sentDate);
  return {
    id: `gmail-${message.id}`,
    recordType: rule.recordType,
    title: cleanTitle(subject),
    provider: rule.provider,
    category: rule.category || parsed.category || "Outros",
    amount: parsed.amount,
    amountConfirmed: parsed.amountConfirmed,
    dueDate,
    paidDate: parsed.paidDate,
    monthKey: deriveRecordMonthKey({ recordType: rule.recordType, periodKey: parsed.periodKey, dueDate, paidDate: parsed.paidDate, createdAt }),
    status: rule.recordType === "proof" ? "paid" : "needs-review",
    cnpjs: parsed.cnpjs,
    periodKey: parsed.periodKey,
    installment: parsed.installment,
    sourceTypes: ["gmail"],
    sourceRuleId: rule.id,
    sources: [
      {
        type: "gmail",
        label: `${rule.provider} Gmail`,
        id: message.id,
        threadId: message.threadId,
        title: subject,
        url: `https://mail.google.com/mail/u/0/#all/${message.threadId}`,
        from,
        date: createdAt,
      },
    ],
    attachments: [],
    evidence: summarizeEvidence(message.snippet, "Registro recuperado pelo modo de compatibilidade."),
    confidence: "média",
    createdAt,
    updatedAt: new Date().toISOString(),
  };
}

async function fetchDriveFiles({ since = "" } = {}) {
  const files = [];
  let pageToken = "";
  const query = [
    `'${state.config.driveFolderId}' in parents`,
    "trashed = false",
    since ? `modifiedTime > '${new Date(since).toISOString()}'` : "",
  ]
    .filter(Boolean)
    .join(" and ");

  do {
    const page = await googleFetch("drive/v3/files", {
      q: query,
      pageSize: 1000,
      fields:
        "nextPageToken,files(id,name,mimeType,webViewLink,webContentLink,thumbnailLink,iconLink,createdTime,modifiedTime,size,description)",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
      pageToken,
    });
    files.push(...(page.files || []));
    pageToken = page.nextPageToken || "";
  } while (pageToken);

  return mapLimit(files, 3, async (file) => {
    const fileText = await extractDriveFileText(file);
    return {
      ...file,
      sourceType: "drive",
      extractedText: fileText,
      parsed: parseSourceText(`${file.name}\n${file.description || ""}\n${fileText}`, file.modifiedTime || file.createdTime, { recordType: "proof" }),
    };
  });
}

async function googleFetch(path, params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value)) {
      value.forEach((item) => query.append(key, item));
      return;
    }
    query.append(key, value);
  });

  const url = `https://www.googleapis.com/${path}${query.toString() ? `?${query.toString()}` : ""}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${state.googleAccessToken}`,
    },
  });

  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    try {
      const errorBody = await response.json();
      message = errorBody.error?.message || message;
    } catch {
      message = await response.text();
    }
    throw new Error(message);
  }

  return response.json();
}

async function googleDownload(path, params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.append(key, value);
  });

  const url = `https://www.googleapis.com/${path}${query.toString() ? `?${query.toString()}` : ""}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${state.googleAccessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  return response.arrayBuffer();
}

async function mapLimit(items, limit, mapper) {
  const results = [];
  let index = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const currentIndex = index;
      index += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  });
  await Promise.all(workers);
  return results;
}

function findGmailExtractionRule({ subject, from, to }) {
  const rules = normalizeExtractionRules(state.config.extractionRules);
  const candidates = Object.entries(rules)
    .map(([id, rule]) => ({ id, ...rule }))
    .filter((rule) => rule.enabled && rule.source === "gmail" && matchesConfiguredSubject(rule.subject, subject));
  return candidates.find((rule) => matchesConfiguredEmail(rule.email, `${from} ${to}`)) || (candidates.length === 1 ? candidates[0] : null);
}

function escapeGmailQuery(value) {
  return String(value || "").replace(/["\\]/g, " ");
}

function matchesConfiguredEmail(configuredEmail, headerText) {
  const expected = String(configuredEmail || "").trim().toLowerCase();
  if (!expected) return true;
  return String(headerText || "").toLowerCase().includes(expected);
}

function matchesConfiguredSubject(configuredSubject, subject) {
  const expectedSubjects = configuredSubjectCandidates(configuredSubject);
  if (!expectedSubjects.length) return true;
  const normalizedSubject = normalizeText(subject);
  return expectedSubjects.some((expected) => normalizedSubject.includes(normalizeText(expected)));
}

function configuredSubjectCandidates(value) {
  return String(value || "")
    .split(/[|\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

async function parseGmailMessage(message) {
  const headers = Object.fromEntries(
    (message.payload?.headers || []).map((header) => [header.name.toLowerCase(), header.value]),
  );
  const subject = headers.subject || "Sem assunto";
  const from = headers.from || "";
  const to = headers.to || "";
  const rule = findGmailExtractionRule({ subject, from, to });
  if (!rule) return null;

  const sentDate = parseEmailDate(headers.date) || new Date(Number(message.internalDate || Date.now()));
  const content = extractPayloadContent(message.payload);
  const attachmentText = rule.readAttachments
    ? await extractGmailAttachmentText(message.id, content.attachments, rule.attachmentPassword)
    : "";
  const bodyText = rule.readBody ? content.text : "";
  const combinedText = [
    subject,
    from,
    to,
    message.snippet || "",
    bodyText,
    attachmentText,
    content.attachments.map((attachment) => attachment.fileName).join(" "),
  ].join("\n");
  const parsed = parseSourceText(combinedText, sentDate.toISOString(), rule);
  const recordType = rule.recordType;

  const sourceUrl = `https://mail.google.com/mail/u/0/#all/${message.threadId}`;
  const title = cleanTitle(subject);
  const provider = rule.provider;
  const category = rule.category || parsed.category || classifyCategory(`${subject} ${from}`);
  const createdAt = sentDate.toISOString();
  const dueDate = recordType === "proof" ? parsed.paidDate || parsed.dueDate || toISODate(sentDate) : parsed.dueDate || toISODate(sentDate);
  const nubankTransactions =
    rule.id === "nubankInvoice" ? parseNubankInvoiceTransactions(attachmentText, { dueDate, messageId: message.id }) : [];
  const status =
    recordType === "proof" || (parsed.amountConfirmed && parsed.amount === 0)
      ? "paid"
      : computeAutoStatus({
          text: combinedText,
          dueDate,
          paidDate: parsed.paidDate,
          hasDriveProof: false,
        });

  return {
    id: `gmail-${message.id}`,
    recordType,
    title,
    provider,
    category,
    amount: parsed.amount,
    amountConfirmed: parsed.amountConfirmed,
    dueDate,
    paidDate: parsed.paidDate,
    monthKey: deriveRecordMonthKey({ recordType, periodKey: parsed.periodKey, dueDate, paidDate: parsed.paidDate, createdAt }),
    status,
    cnpjs: parsed.cnpjs,
    periodKey: parsed.periodKey,
    installment: parsed.installment,
    nubankTransactions,
    sourceTypes: ["gmail"],
    sourceRuleId: rule.id,
    sources: [
      {
        type: "gmail",
        label: `${provider} Gmail`,
        id: message.id,
        threadId: message.threadId,
        title: subject,
        url: sourceUrl,
        from,
        date: sentDate.toISOString(),
      },
    ],
    attachments: content.attachments.map((attachment) => ({
      ...attachment,
      messageId: message.id,
      url: sourceUrl,
    })),
    evidence: summarizeEvidence(message.snippet, `${bodyText}\n${attachmentText}`),
    confidence: parsed.confidence,
    createdAt,
    updatedAt: new Date().toISOString(),
  };
}

function extractPayloadContent(payload) {
  const result = { text: "", attachments: [], links: [] };

  function walk(part) {
    if (!part) return;
    const bodyData = part.body?.data;
    if (bodyData && /text\/plain|text\/html/i.test(part.mimeType || "")) {
      const decoded = decodeBase64Url(bodyData);
      if (part.mimeType === "text/html") {
        result.links.push(...extractHtmlLinks(decoded));
        result.text += `\n${stripHtml(decoded)}`;
      } else {
        result.text += `\n${decoded}`;
      }
    }

    if (part.filename) {
      result.attachments.push({
        fileName: part.filename,
        mimeType: normalizeMimeType(part.filename, part.mimeType),
        attachmentId: part.body?.attachmentId || "",
        size: part.body?.size || 0,
      });
    }

    (part.parts || []).forEach(walk);
  }

  walk(payload);
  result.links = Array.from(new Set(result.links));
  return result;
}

async function extractGmailAttachmentText(messageId, attachments, password = "") {
  const extractable = attachments.filter((attachment) => isExtractableFile(attachment.fileName, attachment.mimeType, attachment.size));
  const texts = await mapLimit(extractable, 2, async (attachment) => {
    if (!attachment.attachmentId) return "";
    try {
      const payload = await googleFetch(`gmail/v1/users/me/messages/${messageId}/attachments/${attachment.attachmentId}`);
      const bytes = decodeBase64UrlBytes(payload.data || "");
      return extractBytesText(bytes, attachment.mimeType, attachment.fileName, password);
    } catch {
      return "";
    }
  });
  return texts.filter(Boolean).join("\n");
}

function parseNubankInvoiceTransactions(text, { dueDate = "", messageId = "" } = {}) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const transactions = [];
  const datePattern = /^(\d{1,2})\s+(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\b/i;
  const amountPattern = /(?:R\$\s*)?(-?(?:\d{1,3}(?:\.\d{3})*|\d+),\d{2}(?:\s*[-−–])?)(?!\d)/i;

  for (let index = 0; index < lines.length; index += 1) {
    const dateMatch = lines[index].match(datePattern);
    if (!dateMatch) continue;

    const candidateLines = [lines[index]];
    for (let offset = 1; offset <= 4 && index + offset < lines.length; offset += 1) {
      if (datePattern.test(lines[index + offset])) break;
      candidateLines.push(lines[index + offset]);
      if (amountPattern.test(lines[index + offset])) break;
    }

    const candidate = candidateLines.join(" ");
    const amountMatches = Array.from(candidate.matchAll(new RegExp(amountPattern.source, "gi")));
    const amountSelection = selectNubankPurchaseAmount(candidate, amountMatches);
    const amountMatch = amountSelection.amountMatch;
    if (!amountMatch) continue;

    const amount = parseCurrencyInput(amountMatch[1]);
    if (!Number.isFinite(amount) || amount <= 0) continue;

    const dateLabel = dateMatch[0];
    const description = cleanNubankTransactionDescription(candidate.slice(dateLabel.length, amountMatch.index));
    if (!description || isNubankInvoiceSummaryLine(description) || !isNubankPurchaseDescription(description)) continue;

    const date = buildNubankTransactionDate(Number(dateMatch[1]), dateMatch[2], dueDate);
    const installment = findNubankTransactionInstallment(description);
    const merchant = description.replace(/\s*[-·]?\s*(?:parcela\s*)?\d{1,2}\s*(?:\/|de)\s*\d{1,2}\s*$/i, "").trim();
    transactions.push({
      id: `nubank-${messageId}-${transactions.length + 1}`,
      date,
      merchant: merchant || description,
      description,
      amount: roundCurrency(amount),
      category: classifyNubankTransaction(description),
      installment,
      linkedPaymentAmount: amountSelection.linkedPaymentAmount,
      parserAdjustment: amountSelection.linkedPaymentAmount ? "split-payment-column" : "",
    });
  }

  return transactions.sort((a, b) => a.date.localeCompare(b.date) || a.merchant.localeCompare(b.merchant, "pt-BR"));
}

function cleanNubankTransactionDescription(value) {
  return String(value || "")
    .replace(/\b\d{1,2}\s+(?:jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\b/gi, " ")
    .replace(/\b(?:R\$|BRL)\b/gi, " ")
    .replace(/\s+/g, " ")
    .replace(/^[\-·:|\s]+|[\-·:|\s]+$/g, "")
    .trim();
}

function isNubankInvoiceSummaryLine(value) {
  return NUBANK_STATEMENT_SUMMARY_REGEX.test(normalizeText(value)) || /\bfatura fechada\b/i.test(normalizeText(value));
}

function selectNubankPurchaseAmount(candidate, amountMatches) {
  const paymentIndex = candidate.search(/\bpagamentos?\b/i);
  if (paymentIndex >= 0) {
    const purchaseMatch = amountMatches.filter((match) => Number(match.index) < paymentIndex).at(-1);
    const paymentMatch = amountMatches.filter((match) => Number(match.index) > paymentIndex).at(-1);
    if (purchaseMatch && paymentMatch) {
      return {
        amountMatch: purchaseMatch,
        linkedPaymentAmount: parseCurrencyInput(paymentMatch[1]),
      };
    }
  }
  return { amountMatch: amountMatches.at(-1), linkedPaymentAmount: 0 };
}

function isNubankPurchaseDescription(value) {
  const normalized = normalizeText(value);
  if (!normalized) return false;
  return !NUBANK_STATEMENT_SUMMARY_REGEX.test(normalized) && !/\bencargos da fatura\b/.test(normalized);
}

function isNubankPurchaseTransaction(transaction) {
  return (
    Number(transaction?.amount || 0) > 0 &&
    isNubankPurchaseDescription(`${transaction?.merchant || ""} ${transaction?.description || ""}`)
  );
}

function buildNubankTransactionDate(day, monthLabel, dueDate) {
  const due = new Date(`${String(dueDate || toISODate(new Date())).slice(0, 10)}T12:00:00`);
  const month = NUBANK_MONTHS[normalizeText(monthLabel).slice(0, 3)];
  let candidate = new Date(due.getFullYear(), month, day, 12);
  if (candidate.getTime() > due.getTime() + 45 * 86400000) {
    candidate = new Date(due.getFullYear() - 1, month, day, 12);
  }
  return toISODate(candidate);
}

function findNubankTransactionInstallment(value) {
  const match = String(value || "").match(/\b(?:parcela\s*)?(\d{1,2})\s*(?:\/|de)\s*(\d{1,2})\b/i);
  if (!match) return "";
  const current = Number(match[1]);
  const total = Number(match[2]);
  return current >= 1 && total >= current && total <= 60 ? `${current}/${total}` : "";
}

function classifyNubankTransaction(value) {
  return NUBANK_CATEGORY_RULES.find((rule) => rule.regex.test(value))?.category || "Outros";
}

async function extractDriveFileText(file) {
  if (!isExtractableFile(file.name, file.mimeType, Number(file.size || 0))) return "";

  try {
    const bytes = await googleDownload(`drive/v3/files/${file.id}`, { alt: "media", supportsAllDrives: "true" });
    return extractBytesText(new Uint8Array(bytes), file.mimeType, file.name);
  } catch {
    return "";
  }
}

function isExtractableFile(fileName = "", mimeType = "", size = 0) {
  const maxBytes = 8 * 1024 * 1024;
  if (size && size > maxBytes) return false;
  return isPdfFile(fileName, mimeType) || isTextLikeFile(fileName, mimeType) || isImageFile(fileName, mimeType);
}

function isPdfFile(fileName = "", mimeType = "") {
  return mimeType === "application/pdf" || /\.pdf$/i.test(fileName);
}

function isTextLikeFile(fileName = "", mimeType = "") {
  return (
    /^text\//i.test(mimeType) ||
    /\/(json|xml|csv|html)$/i.test(mimeType) ||
    /\.(txt|csv|json|xml|html?)$/i.test(fileName)
  );
}

function isImageFile(fileName = "", mimeType = "") {
  return /^image\//i.test(mimeType) || /\.(jpe?g|png|webp)$/i.test(fileName);
}

async function extractBytesText(bytes, mimeType = "", fileName = "", password = "") {
  if (!bytes?.length) return "";
  if (isPdfFile(fileName, mimeType)) {
    const text = await extractPdfText(bytes, password);
    return text.trim().length >= 40 ? text : extractPdfOcrText(bytes, password);
  }
  if (isImageFile(fileName, mimeType)) return extractImageOcrText(bytes, normalizeMimeType(fileName, mimeType));
  if (isTextLikeFile(fileName, mimeType)) {
    const text = new TextDecoder("utf-8").decode(bytes);
    return /html?/i.test(mimeType) || /\.html?$/i.test(fileName) ? stripHtml(text) : text;
  }
  return "";
}

async function extractPdfOcrText(bytes, password = "") {
  try {
    const pdfjs = await loadPdfJs();
    const pdf = await pdfjs.getDocument({ data: bytes, password: password || undefined }).promise;
    const pages = [];
    for (let pageNumber = 1; pageNumber <= Math.min(pdf.numPages, 3); pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.8 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
      pages.push(await recognizeImageText(canvas));
    }
    return pages.join("\n").slice(0, 30000);
  } catch {
    return "";
  }
}

async function extractImageOcrText(bytes, mimeType) {
  try {
    const blob = new Blob([bytes], { type: mimeType || "image/png" });
    return (await recognizeImageText(blob)).slice(0, 30000);
  } catch {
    return "";
  }
}

async function recognizeImageText(image) {
  await loadTesseract();
  const result = await window.Tesseract.recognize(image, "por");
  return result?.data?.text || "";
}

async function loadTesseract() {
  if (window.Tesseract) return window.Tesseract;
  await new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
    script.onload = resolve;
    script.onerror = () => reject(new Error("Não foi possível carregar o leitor OCR."));
    document.head.appendChild(script);
  });
  return window.Tesseract;
}

async function extractPdfText(bytes, password = "") {
  try {
    const pdfjs = await loadPdfJs();
    const pdf = await pdfjs.getDocument({ data: bytes, password: password || undefined }).promise;
    const pages = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(extractPdfPageText(content.items));
    }

    return pages.join("\n").slice(0, 30000);
  } catch {
    return "";
  }
}

function extractPdfPageText(items) {
  const lines = [];
  let currentLine = [];
  let currentY = null;

  (items || []).forEach((item) => {
    const value = String(item?.str || "").trim();
    if (!value) return;
    const y = Number(item?.transform?.[5]);
    if (currentLine.length && Number.isFinite(y) && Number.isFinite(currentY) && Math.abs(y - currentY) > 3) {
      lines.push(currentLine.join(" "));
      currentLine = [];
    }
    currentLine.push(value);
    if (Number.isFinite(y)) currentY = y;
  });

  if (currentLine.length) lines.push(currentLine.join(" "));
  return lines.join("\n");
}

async function loadPdfJs() {
  if (window.pdfjsLib) return window.pdfjsLib;
  const pdfjs = await import("https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.mjs";
  window.pdfjsLib = pdfjs;
  return pdfjs;
}

function decodeBase64Url(value) {
  const bytes = decodeBase64UrlBytes(value);
  return new TextDecoder("utf-8").decode(bytes);
}

function decodeBase64UrlBytes(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function stripHtml(html) {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}

function extractHtmlLinks(html) {
  const links = [];
  const regex = /\bhref\s*=\s*["']([^"']+)["']/gi;
  let match;
  while ((match = regex.exec(String(html || ""))) !== null) {
    const url = match[1].trim();
    if (/^https?:\/\//i.test(url)) links.push(url);
  }
  return links;
}

function isDisplayableEmailLink(url) {
  return (
    /^https?:\/\//i.test(url) &&
    !/(fonts\.googleapis|email\.nubank\.com\.br|google-analytics|doubleclick|facebook|pixel|tracking|unsubscribe)/i.test(url)
  );
}

function parseEmailDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function buildDriveRecords(files) {
  return files
    .filter(isDriveProof)
    .map((file) => {
      const sourceText = `${file.name}\n${file.description || ""}\n${file.extractedText || ""}`;
      const parsed = file.parsed || parseSourceText(sourceText, file.modifiedTime || file.createdTime, { recordType: "proof" });
      const recordType = "proof";
      const createdAt = file.createdTime || new Date().toISOString();
      const baseDate = parsed.dueDate || parsed.paidDate || toISODate(new Date(file.modifiedTime || createdAt || Date.now()));

      return {
        id: `drive-${file.id}`,
        recordType,
        title: `Comprovante: ${file.name}`,
        provider: inferProvider(file.name, ""),
        category: parsed.category || classifyCategory(file.name),
        amount: parsed.amount,
        amountConfirmed: parsed.amountConfirmed,
        dueDate: baseDate,
        paidDate: parsed.paidDate || baseDate,
        monthKey: deriveRecordMonthKey({ recordType, periodKey: parsed.periodKey, dueDate: baseDate, paidDate: parsed.paidDate, createdAt }),
        status: "paid",
        cnpjs: parsed.cnpjs,
        periodKey: parsed.periodKey,
        installment: parsed.installment,
        sourceTypes: ["drive"],
        sources: [
          {
            type: "drive",
            label: "Comprovante Drive",
            id: file.id,
            title: file.name,
            url: file.webViewLink,
            date: file.modifiedTime || file.createdTime,
            paymentDate: parsed.paidDate || baseDate,
            thumbnailLink: file.thumbnailLink || "",
            mimeType: file.mimeType,
          },
        ],
        attachments: [],
        evidence: summarizeEvidence(file.description || file.name, file.extractedText || ""),
        confidence: parsed.confidence,
        createdAt,
        updatedAt: new Date().toISOString(),
      };
    })
    .filter(Boolean);
}

function isDriveProof(file) {
  const text = getDriveSearchText(file);
  if (/cadastrada manualmente/i.test(file.description || "")) return false;
  if (isIgnoredDocumentText(text)) return false;
  const isDocumentCandidate =
    isPdfFile(file.name, file.mimeType) ||
    /^image\//i.test(file.mimeType || "") ||
    /\.(jpe?g|png|webp|heic|pdf)$/i.test(file.name || "");
  return PROOF_DOCUMENT_REGEX.test(text) || isDocumentCandidate;
}

function getDriveSearchText(file) {
  return [file.name, file.description || "", file.extractedText || ""].join("\n");
}

function attachProofs(records) {
  const proofs = records.filter((record) => record.recordType === "proof");
  const bills = records.filter((record) => record.recordType === "bill");
  const linkedProofIds = new Set();
  const assignments = new Map();
  const candidates = bills
    .flatMap((bill) =>
      proofs.map((proof) => ({
        bill,
        proof,
        score: scoreProofMatch(bill, proof),
      })),
    )
    .filter(({ bill, proof, score }) => isProofCompatible(bill, proof) && score >= proofMatchThreshold(bill, proof))
    .sort((a, b) => b.score - a.score);

  candidates.forEach(({ bill, proof }) => {
    if (assignments.has(bill.id) || linkedProofIds.has(proof.id)) return;
    assignments.set(bill.id, proof);
    linkedProofIds.add(proof.id);
  });

  const enriched = bills.map((record) => {
    const proof = assignments.get(record.id);
    if (!proof) return record;
    const matchedProofs = (proof.sources || [])
      .filter((source) => source.type === "gmail" || source.type === "drive")
      .map((source) => ({
        ...source,
        label: source.type === "gmail" ? "Comprovante Gmail" : "Comprovante Drive",
      }));
    const sources = mergeSources(record.sources, matchedProofs);
    return {
      ...record,
      status: "paid",
      paidDate: record.paidDate || proof.paidDate || toISODate(new Date(matchedProofs[0]?.date || Date.now())),
      sourceTypes: Array.from(new Set([...record.sourceTypes, ...matchedProofs.map((source) => source.type).filter(Boolean)])),
      sources,
    };
  });

  return [...enriched, ...proofs.filter((proof) => !linkedProofIds.has(proof.id))];
}

function isProofCompatible(record, proof) {
  if (!record || !proof || record.recordType !== "bill" || proof.recordType !== "proof") return false;
  const amountMatches =
    Number(record.amount || 0) > 0 &&
    Number(proof.amount || 0) > 0 &&
    Math.abs(Number(record.amount) - Number(proof.amount)) <= 0.05;
  if (!amountMatches) return false;

  const recordProvider = normalizeText(record.provider || "");
  const isNubank = record.sourceRuleId === "nubankInvoice" || recordProvider.includes("nubank");
  const recordDueMonth = monthKeyFromDate(record.dueDate || record.monthKey);
  const proofPaidMonth = monthKeyFromDate(proof.paidDate || proof.dueDate || proof.createdAt);
  const dateDistance = daysBetween(record.dueDate, proof.paidDate || proof.dueDate || proof.createdAt);
  const sameCnpj = arrayOverlap(record.cnpjs, proof.cnpjs);
  const samePeriod = Boolean(record.periodKey && proof.periodKey && record.periodKey === proof.periodKey);
  const sameInstallment = Boolean(record.installment && proof.installment && record.installment === proof.installment);
  const providerMatches = tokenOverlap(record.provider, proof.provider) >= 0.5;

  if (record.periodKey && proof.periodKey && record.periodKey !== proof.periodKey) return false;
  if (record.installment && proof.installment && record.installment !== proof.installment) return false;
  if (isIptuRecord(record)) {
    return recordDueMonth === proofPaidMonth && dateDistance <= 20 && sameCnpj && (sameInstallment || samePeriod || !proof.installment);
  }
  if (isNubank) return dateDistance <= 12;
  return recordDueMonth === proofPaidMonth && dateDistance <= 20 && (sameCnpj || samePeriod || sameInstallment || providerMatches);
}

function scoreProofMatch(record, proof) {
  const recordMonth = record.monthKey;
  const proofMonth = proof.monthKey || monthKeyFromDate(proof.paidDate || proof.dueDate || proof.createdAt);
  const amountScore = record.amount && proof.amount && Math.abs(record.amount - proof.amount) <= 1 ? 2.8 : 0;
  const monthScore = recordMonth && proofMonth && recordMonth === proofMonth ? 1.2 : 0;
  const cnpjScore = arrayOverlap(record.cnpjs, proof.cnpjs) ? 2.2 : 0;
  const periodScore = record.periodKey && proof.periodKey && record.periodKey === proof.periodKey ? 1.3 : 0;
  const installmentScore = record.installment && proof.installment && record.installment === proof.installment ? 0.9 : 0;
  const tokenScore = tokenOverlap(`${record.title} ${record.provider}`, `${proof.title} ${proof.provider}`) * 1.1;
  const providerScore = tokenOverlap(record.provider, proof.provider) * 1.5;
  const categoryScore = record.category === proof.category ? 0.7 : 0;
  const dateScore = record.dueDate && proof.paidDate && daysBetween(record.dueDate, proof.paidDate) <= 12 ? 0.7 : 0;
  return amountScore + monthScore + cnpjScore + periodScore + installmentScore + tokenScore + providerScore + categoryScore + dateScore;
}

function proofMatchThreshold(record, proof) {
  return record.amount && proof.amount ? 2.8 : Number.POSITIVE_INFINITY;
}

function mergeSources(existing, additions) {
  const byKey = new Map();
  [...existing, ...additions].forEach((source) => {
    byKey.set(`${source.type}-${source.id}`, source);
  });
  return Array.from(byKey.values());
}

function mergeAttachments(existing = [], additions = []) {
  const byKey = new Map();
  [...existing, ...additions].forEach((attachment) => {
    const key = `${attachment.messageId || ""}-${attachment.attachmentId || attachment.id || ""}-${attachment.fileName || attachment.name || ""}`;
    byKey.set(key, attachment);
  });
  return Array.from(byKey.values());
}

function mergeEvidence(existing, addition) {
  return Array.from(new Set([existing, addition].filter(Boolean))).join("\n\n");
}

function tokenOverlap(a, b) {
  const tokensA = new Set(normalizeText(a).split(/\s+/).filter((token) => token.length >= 4));
  const tokensB = new Set(normalizeText(b).split(/\s+/).filter((token) => token.length >= 4));
  if (!tokensA.size || !tokensB.size) return 0;
  let count = 0;
  tokensA.forEach((token) => {
    if (tokensB.has(token)) count += 1;
  });
  return count / Math.max(tokensA.size, tokensB.size);
}

function arrayOverlap(a = [], b = []) {
  const setA = new Set(a);
  return (b || []).some((item) => setA.has(item));
}

function daysBetween(a, b) {
  const dateA = new Date(`${String(a).slice(0, 10)}T12:00:00`);
  const dateB = new Date(`${String(b).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(dateA.getTime()) || Number.isNaN(dateB.getTime())) return Number.POSITIVE_INFINITY;
  return Math.abs(dateA.getTime() - dateB.getTime()) / 86400000;
}

function recordIdentityKey(record) {
  // Registros gerados por uma regra de extração configurada (IPTU, Nubank, Somma, Claro...)
  // chegam com o assunto do e-mail em record.title. Quando o mesmo boleto é enviado/reenviado
  // em mensagens com assuntos ligeiramente diferentes, o título varia e a deduplicação falhava,
  // duplicando a conta. Por isso ancoramos a identidade no id da regra, e não no assunto.
  if (record.sourceRuleId) {
    return `rule:${record.sourceRuleId}`;
  }
  return `title:${normalizeText(record.title)}`;
}

function dedupeRecords(records) {
  const seen = new Map();
  records.forEach((record) => {
    const amountCents = Math.round((record.amount || 0) * 100);
    const sourceKey = (record.sources || []).map((source) => source.id).filter(Boolean).join("-");
    const reviewKey = normalizeText([record.periodKey, record.installment, record.dueDate, sourceKey, record.createdAt].filter(Boolean).join(" "));
    const key = `${record.recordType}-${recordIdentityKey(record)}-${record.monthKey}-${amountCents || reviewKey}`;
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, record);
      return;
    }
    seen.set(key, {
      ...existing,
      status: existing.status === "paid" || record.status === "paid" ? "paid" : existing.status,
      amountConfirmed: existing.amountConfirmed || record.amountConfirmed,
      sourceTypes: Array.from(new Set([...existing.sourceTypes, ...record.sourceTypes])),
      sources: mergeSources(existing.sources, record.sources),
      attachments: mergeAttachments(existing.attachments, record.attachments),
      evidence: mergeEvidence(existing.evidence, record.evidence),
    });
  });
  return Array.from(seen.values()).sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));
}

function deriveRecordMonthKey(record) {
  if (record.recordType === "proof") {
    return monthKeyFromDate(record.paidDate || record.dueDate || record.createdAt);
  }
  return record.periodKey || monthKeyFromDate(record.dueDate || record.createdAt || record.paidDate);
}

function parseSourceText(text, fallbackDate, context = {}) {
  const amount = findBestAmount(text, context);
  const amountConfirmed = amount > 0 || isExplicitZeroAmount(text, context);
  const dueDate =
    findAuthoritativeDueDate(text, fallbackDate) ||
    findKeywordDate(text, /(venc|vence|vcto|pagar até|pagamento até|data limite|due date)/i, fallbackDate);
  const paidDate = findKeywordDate(
    text,
    /(pago em|pagamento em|pagamento efetuado|data do pagamento|data da transa[cç][aã]o|realizado em|efetivado em|quitado em|liquidado em|recebemos em|paid on)/i,
    fallbackDate,
  );
  const category = classifyCategory(text);
  const cnpjs = findCnpjs(text);
  const periodKey = findPeriodKey(text);
  const installment = findInstallment(text, context);
  const fallbackIso = fallbackDate ? toISODate(new Date(fallbackDate)) : "";

  return {
    amount,
    amountConfirmed,
    dueDate: dueDate || "",
    paidDate: paidDate || "",
    category,
    cnpjs,
    periodKey,
    installment,
    confidence: [amountConfirmed ? 1 : 0, dueDate || fallbackIso ? 1 : 0, category !== "Outros" ? 1 : 0, cnpjs.length ? 1 : 0].filter(Boolean).length >= 2 ? "alta" : "média",
  };
}

function findBestAmount(text, context = {}) {
  if (isExplicitZeroAmount(text, context)) return 0;
  const ruleAmount = findRuleSpecificAmount(text, context);
  if (ruleAmount) return ruleAmount;

  const candidates = findAmountCandidates(text);
  if (!candidates.length) return 0;

  const ranked = candidates
    .map((candidate) => ({
      ...candidate,
      score: scoreAmountCandidate(candidate, context),
    }))
    .filter((candidate) => candidate.score > Number.NEGATIVE_INFINITY)
    .sort((a, b) => b.score - a.score || a.amount - b.amount);

  return ranked.length ? roundCurrency(ranked[0].amount) : 0;
}

function isExplicitZeroAmount(text, context = {}) {
  const ruleId = context.id || context.sourceRuleId || "";
  const provider = normalizeText(context.provider || "");
  const recordType = context.recordType || "";
  if (recordType === "proof" || (ruleId !== "nubankInvoice" && !provider.includes("nubank"))) return false;

  const source = String(text || "").replace(/\s+/g, " ");
  return (
    /(?:sua|esta|a)\s+fatura[\s\S]{0,180}?(?:est[aá]\s+)?zerad[ao]\b/i.test(source) ||
    /n[aã]o\s+[ée]\s+necess[aá]rio[\s\S]{0,80}?qualquer\s+pagamento/i.test(source) ||
    /(?:fatura[\s\S]{0,80}?no\s+valor\s+de|valor\s+total\s+da\s+fatura|total\s+a\s+pagar)[\s\S]{0,35}?(?:R\$\s*)?0[,.]00\b/i.test(source)
  );
}

function findRuleSpecificAmount(text, context = {}) {
  const source = String(text || "").replace(/\s+/g, " ");
  const ruleId = context.id || context.sourceRuleId || "";
  const provider = normalizeText(context.provider || "");
  const recordType = context.recordType || "";
  const money = /((?:R\$\s*|BRL\s*)?(?:\d{1,3}(?:\.\d{3})*|\d+)(?:,\d{2}|\.\d{2}))/i;

  if (ruleId === "nubankInvoice" || provider.includes("nubank")) {
    if (recordType !== "proof") {
      return findAmountByPatterns(source, [
        new RegExp(`fatura\\s+de\\s+[a-zà-ÿç]+\\s*,?\\s+no\\s+valor\\s+de\\s+${money.source}`, "i"),
        new RegExp(`sua\\s+fatura[\\s\\S]{0,90}?no\\s+valor\\s+de\\s+${money.source}`, "i"),
        new RegExp(`valor\\s+total\\s+da\\s+fatura[\\s\\S]{0,50}?${money.source}`, "i"),
        new RegExp(`pagamento\\s+total\\s+da\\s+fatura[\\s\\S]{0,50}?${money.source}`, "i"),
        new RegExp(`total\\s+da\\s+fatura[\\s\\S]{0,50}?${money.source}`, "i"),
      ]);
    }

    return findAmountByPatterns(source, [
      new RegExp(`valor\\s+do\\s+pagamento[\\s\\S]{0,40}?${money.source}`, "i"),
      new RegExp(`pagamento\\s+(?:de|no\\s+valor\\s+de)[\\s\\S]{0,40}?${money.source}`, "i"),
      new RegExp(`fatura\\s+paga[\\s\\S]{0,60}?${money.source}`, "i"),
      new RegExp(`fatura[\\s\\S]{0,70}?no\\s+valor\\s+de\\s+${money.source}`, "i"),
    ]);
  }

  if (ruleId === "sommaInvoice" || provider.includes("somma")) {
    return findLabeledAmount(source, [
      /valor\s+(?:do\s+)?documento/i,
      /valor\s+(?:do\s+)?boleto/i,
      /valor\s+cobrado/i,
      /total\s+(?:do\s+)?boleto/i,
      /total\s+a\s+pagar/i,
      /valor\s+a\s+pagar/i,
    ], { largeAmountPenaltyAbove: 3000 }) || findAmountByPatterns(source, [
      new RegExp(`valor\\s+(?:do\\s+)?documento[\\s\\S]{0,40}?${money.source}`, "i"),
      new RegExp(`valor\\s+(?:do\\s+)?boleto[\\s\\S]{0,40}?${money.source}`, "i"),
      new RegExp(`valor\\s+cobrado[\\s\\S]{0,40}?${money.source}`, "i"),
      new RegExp(`total\\s+(?:do\\s+)?boleto[\\s\\S]{0,40}?${money.source}`, "i"),
      new RegExp(`total\\s+a\\s+pagar[\\s\\S]{0,40}?${money.source}`, "i"),
      new RegExp(`valor\\s+a\\s+pagar[\\s\\S]{0,40}?${money.source}`, "i"),
      new RegExp(`${money.source}[\\s\\S]{0,40}?valor\\s+(?:do\\s+)?documento`, "i"),
    ]);
  }

  if (ruleId === "iptuInvoice") {
    return findAmountByPatterns(source, [
      new RegExp(`valor\\s+(?:da\\s+)?guia[\\s\\S]{0,50}?${money.source}`, "i"),
      new RegExp(`valor\\s+total[\\s\\S]{0,50}?${money.source}`, "i"),
      new RegExp(`total\\s+a\\s+pagar[\\s\\S]{0,50}?${money.source}`, "i"),
      new RegExp(`valor\\s+a\\s+pagar[\\s\\S]{0,50}?${money.source}`, "i"),
      new RegExp(`valor\\s+do\\s+pagamento[\\s\\S]{0,50}?${money.source}`, "i"),
    ]);
  }

  if (ruleId === "claroInvoice" || provider.includes("claro")) {
    return findAmountByPatterns(source, [
      new RegExp(`total\\s+a\\s+pagar[\\s\\S]{0,50}?${money.source}`, "i"),
      new RegExp(`valor\\s+da\\s+fatura[\\s\\S]{0,50}?${money.source}`, "i"),
      new RegExp(`valor\\s+total[\\s\\S]{0,50}?${money.source}`, "i"),
      new RegExp(`valor\\s+a\\s+pagar[\\s\\S]{0,50}?${money.source}`, "i"),
    ]);
  }

  return 0;
}

function findLabeledAmount(source, labels, options = {}) {
  const amountMatches = [];
  const amountRegex = /((?:R\$\s*|BRL\s*)?(?:\d{1,3}(?:\.\d{3})*|\d+)(?:,\d{2}|\.\d{2}))/gi;
  let amountMatch;

  while ((amountMatch = amountRegex.exec(String(source || ""))) !== null) {
    const amount = parseCurrencyInput(amountMatch[1]);
    if (!Number.isFinite(amount) || amount <= 0) continue;
    amountMatches.push({
      amount,
      raw: amountMatch[1],
      start: amountMatch.index,
      end: amountMatch.index + amountMatch[0].length,
    });
  }

  if (!amountMatches.length) return 0;

  const labelMatches = [];
  labels.forEach((label) => {
    const flags = label.flags.includes("i") ? "gi" : "g";
    const regex = new RegExp(label.source, flags);
    let labelMatch;
    while ((labelMatch = regex.exec(source)) !== null) {
      labelMatches.push({
        raw: labelMatch[0],
        start: labelMatch.index,
        end: labelMatch.index + labelMatch[0].length,
      });
    }
  });

  const maxBefore = options.maxBefore ?? 50;
  const maxAfter = options.maxAfter ?? 70;
  const largeAmountPenaltyAbove = options.largeAmountPenaltyAbove || 0;
  const candidates = [];

  labelMatches.forEach((label) => {
    amountMatches.forEach((amount) => {
      const beforeDistance = label.start - amount.end;
      const afterDistance = amount.start - label.end;
      const isBefore = beforeDistance >= 0 && beforeDistance <= maxBefore;
      const isAfter = afterDistance >= 0 && afterDistance <= maxAfter;
      if (!isBefore && !isAfter) return;

      let score = isAfter ? 4 : 3.7;
      const distance = isAfter ? afterDistance : beforeDistance;
      score -= distance / 80;
      if (/valor\s+(?:do\s+)?documento/i.test(label.raw)) score += 0.5;
      if (largeAmountPenaltyAbove && amount.amount > largeAmountPenaltyAbove) score -= 2.2;
      candidates.push({ ...amount, score, distance });
    });
  });

  candidates.sort((a, b) => b.score - a.score || a.distance - b.distance || a.amount - b.amount);
  return candidates.length ? roundCurrency(candidates[0].amount) : 0;
}

function findAmountByPatterns(source, patterns) {
  for (const pattern of patterns) {
    const match = String(source || "").match(pattern);
    if (!match) continue;
    const amount = extractCurrencyFromMatch(match);
    if (amount) return amount;
  }
  return 0;
}

function extractCurrencyFromMatch(match) {
  const values = match.slice(1).filter(Boolean);
  for (const value of values) {
    const amount = parseCurrencyInput(value);
    if (Number.isFinite(amount) && amount > 0) return amount;
  }

  const raw = match[0].match(/(?:R\$\s*|BRL\s*)?(?:\d{1,3}(?:\.\d{3})*|\d+)(?:,\d{2}|\.\d{2})/i)?.[0] || "";
  const amount = parseCurrencyInput(raw);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

function findAmountCandidates(text) {
  const candidates = [];
  const regex = /(?:R\$\s*|BRL\s*)?(?:\d{1,3}(?:\.\d{3})*|\d+)(?:,\d{2}|\.\d{2})/gi;
  let match;
  const source = String(text || "");

  while ((match = regex.exec(source)) !== null) {
    const raw = match[0];
    const amount = parseCurrencyInput(raw);
    if (!amount || amount < 1) continue;
    const before = source.slice(Math.max(0, match.index - 160), match.index);
    const after = source.slice(match.index + raw.length, match.index + raw.length + 160);
    const nearby = `${before} ${raw} ${after}`;
    const compactNearby = normalizeText(nearby);
    candidates.push({
      amount,
      raw,
      before,
      after,
      nearby,
      compactNearby,
      hasCurrency: /R\$|BRL/i.test(raw) || /R\$|BRL/i.test(nearby),
    });
  }

  return candidates;
}

function scoreAmountCandidate(candidate, context = {}) {
  const ruleId = context.id || context.sourceRuleId || "";
  const provider = normalizeText(context.provider || "");
  const recordType = context.recordType || "";
  const nearby = candidate.compactNearby;
  const before = normalizeText(candidate.before.slice(-120));
  const after = normalizeText(candidate.after.slice(0, 80));
  let score = Math.log10(candidate.amount + 1);

  if (candidate.hasCurrency) score += 1.2;
  if (/\b(valor|total|fatura|boleto|documento|cobrado|pagamento|pagar|guia)\b/.test(before)) score += 1.5;
  if (/\b(valor|total|fatura|boleto|documento|cobrado|pagamento|pagar|guia)\b/.test(after)) score += 0.3;
  if (/\b(juros|multa|desconto|abatimento|acrescimo|saldo anterior|pagamento minimo|minimo|minimo da fatura|limite|credito|disponivel|total de compras|compras nacionais|compras internacionais|encargos|iof|cashback|pontos)\b/.test(before)) {
    score -= 5;
  }
  if (/\b(linha digitavel|codigo de barras|autenticacao|nosso numero|agencia|carteira|cedente|beneficiario)\b/.test(before)) {
    score -= 6;
  }

  if (ruleId === "nubankInvoice" || provider.includes("nubank")) {
    if (/\b(valor total da fatura|total da fatura|valor da fatura|fatura atual|total a pagar|valor a pagar)\b/.test(before)) score += 12;
    if (/\b(valor total da fatura|total da fatura|valor da fatura|fatura atual|total a pagar|valor a pagar)\b/.test(after)) score += 1;
    if (/\b(limite|saldo|credito|disponivel|compras|pagamento minimo|encargos|juros|multa|desconto|cashback|pontos)\b/.test(before)) score -= 12;
  }

  if (ruleId === "nubankPayment" || (provider.includes("nubank") && recordType === "proof")) {
    if (/\b(valor do pagamento|valor pago|pagamento de|fatura paga|debito automatico|debito automatico)\b/.test(before)) score += 10;
    if (/\b(valor do pagamento|valor pago|pagamento de|fatura paga|debito automatico|debito automatico)\b/.test(after)) score += 1;
    if (/\b(limite|credito|disponivel|saldo|compras)\b/.test(before)) score -= 10;
  }

  if (ruleId === "sommaInvoice" || provider.includes("somma")) {
    if (/\b(valor do documento|valor documento|valor cobrado|valor a cobrar|valor boleto|valor do boleto|total do boleto|total a pagar)\b/.test(before)) score += 12;
    if (/\b(valor do documento|valor documento|valor cobrado|valor a cobrar|valor boleto|valor do boleto|total do boleto|total a pagar)\b/.test(after)) score += 1;
    if (/\b(linha digitavel|codigo de barras|nosso numero|agencia|carteira|mora|multa|juros|desconto|taxa)\b/.test(before)) score -= 12;
    if (!/\b(valor|documento|cobrado|boleto|pagar|total)\b/.test(before) && candidate.amount > 3000) score -= 5;
  }

  if (ruleId === "iptuInvoice") {
    if (/\b(valor da guia|valor guia|valor total|total a pagar|valor a pagar|valor do pagamento|parcela)\b/.test(before)) score += 10;
    if (/\b(inscricao|cadastro|codigo)\b/.test(before)) score -= 7;
  }

  if (ruleId === "claroInvoice") {
    if (/\b(total a pagar|valor da fatura|valor total|valor a pagar|fatura claro)\b/.test(before)) score += 10;
    if (/\b(conta contrato|codigo|linha digitavel|desconto|juros|multa)\b/.test(before)) score -= 7;
  }

  if (recordType === "proof" && !/\b(pagamento|pago|valor|comprovante|transferencia|pix|debito)\b/.test(before)) {
    score -= 3;
  }

  return score;
}

function findKeywordDate(text, keywordRegex, fallbackDate) {
  const normalized = text.replace(/\s+/g, " ");
  const candidates = [];
  let match;

  const regex = /(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})/g;
  while ((match = regex.exec(normalized)) !== null) {
    const date = parseBrazilianDate(match[0]);
    if (!date) continue;
    candidates.push(scoreDateCandidate(normalized, match.index, match[0], date, keywordRegex));
  }

  const shortDateRegex = /(\d{1,2})[\/.-](\d{1,2})(?![\/.-]\d)/g;
  while ((match = shortDateRegex.exec(normalized)) !== null) {
    const date = parseBrazilianDayMonth(match[1], match[2], fallbackDate);
    if (!date) continue;
    candidates.push(scoreDateCandidate(normalized, match.index, match[0], date, keywordRegex));
  }

  const textDateRegex =
    /\b(\d{1,2})\s*(?:de\s*)?(jan(?:eiro)?|fev(?:ereiro)?|mar(?:[cç]o)?|abr(?:il)?|mai(?:o)?|jun(?:ho)?|jul(?:ho)?|ago(?:sto)?|set(?:embro)?|out(?:ubro)?|nov(?:embro)?|dez(?:embro)?)\.?(?:\s*(?:de\s*)?(\d{2,4}))?\b/gi;
  while ((match = textDateRegex.exec(normalized)) !== null) {
    const date = parseBrazilianTextDate(match[1], match[2], match[3], fallbackDate);
    if (!date) continue;
    candidates.push(scoreDateCandidate(normalized, match.index, match[0], date, keywordRegex));
  }

  if (!candidates.length) return "";
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0].score > 0 ? candidates[0].date : "";
}

function findAuthoritativeDueDate(text, fallbackDate) {
  const normalized = String(text || "").replace(/\s+/g, " ");
  const datePattern =
    "((?:\\d{1,2}[\\/.-]\\d{1,2}(?:[\\/.-]\\d{2,4})?)|(?:\\d{1,2}\\s*(?:de\\s*)?(?:jan(?:eiro)?|fev(?:ereiro)?|mar(?:[cç]o)?|abr(?:il)?|mai(?:o)?|jun(?:ho)?|jul(?:ho)?|ago(?:sto)?|set(?:embro)?|out(?:ubro)?|nov(?:embro)?|dez(?:embro)?)\\.?(?:\\s*(?:de\\s*)?\\d{2,4})?))";
  const patterns = [
    new RegExp(`\\bdata\\s+(?:do|de)\\s+vencimento\\s*[:\\-]?\\s*${datePattern}`, "i"),
    new RegExp(`\\bvencimento\\s*(?:em|que\\s+[ée])?\\s*[:\\-]?\\s*(?:dia\\s*)?${datePattern}`, "i"),
    new RegExp(`\\bvence(?:\\s+no\\s+dia)?\\s*[:\\-]?\\s*${datePattern}`, "i"),
    new RegExp(`\\bpagar\\s+at[eé]\\s*[:\\-]?\\s*${datePattern}`, "i"),
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    const date = parseFlexibleBrazilianDate(match?.[1], fallbackDate);
    if (date) return date;
  }
  return "";
}

function parseFlexibleBrazilianDate(value, fallbackDate) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}$/.test(raw)) return parseBrazilianDate(raw);
  const shortDate = raw.match(/^(\d{1,2})[\/.-](\d{1,2})$/);
  if (shortDate) return parseBrazilianDayMonth(shortDate[1], shortDate[2], fallbackDate);
  const textDate = raw.match(
    /^(\d{1,2})\s*(?:de\s*)?(jan(?:eiro)?|fev(?:ereiro)?|mar(?:[cç]o)?|abr(?:il)?|mai(?:o)?|jun(?:ho)?|jul(?:ho)?|ago(?:sto)?|set(?:embro)?|out(?:ubro)?|nov(?:embro)?|dez(?:embro)?)\.?(?:\s*(?:de\s*)?(\d{2,4}))?$/i,
  );
  return textDate ? parseBrazilianTextDate(textDate[1], textDate[2], textDate[3], fallbackDate) : "";
}

function scoreDateCandidate(text, index, raw, date, keywordRegex) {
  const before = text.slice(Math.max(0, index - 100), index);
  const after = text.slice(index + raw.length, index + raw.length + 70);
  const context = `${before} ${raw} ${after}`;
  let score = keywordRegex.test(before.slice(-60)) ? 5 : keywordRegex.test(context) ? 2 : 0;
  if (/emissão|emissao|gerado|postado|nota fiscal/i.test(before.slice(-60))) score -= 4;
  return { date, score };
}

function parseBrazilianDate(value) {
  const parts = value.split(/[\/.-]/).map((part) => Number(part));
  if (parts.length !== 3) return "";
  let [day, month, year] = parts;
  if (year < 100) year += 2000;
  if (year < 2000 || month < 1 || month > 12 || day < 1 || day > 31) return "";
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return "";
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseBrazilianDayMonth(dayValue, monthValue, fallbackDate) {
  const day = Number(dayValue);
  const month = Number(monthValue);
  const base = fallbackDate ? new Date(fallbackDate) : new Date();
  if (month < 1 || month > 12 || day < 1 || day > 31 || Number.isNaN(base.getTime())) return "";
  let year = base.getFullYear();
  if (month === 1 && base.getMonth() === 11) year += 1;
  return buildISODate(year, month, day);
}

function parseBrazilianTextDate(dayValue, monthName, yearValue, fallbackDate) {
  const day = Number(dayValue);
  const month = monthNumberFromName(monthName);
  const base = fallbackDate ? new Date(fallbackDate) : new Date();
  if (!month || day < 1 || day > 31 || Number.isNaN(base.getTime())) return "";
  let year = yearValue ? Number(yearValue) : base.getFullYear();
  if (year < 100) year += 2000;
  if (!yearValue && month === 1 && base.getMonth() === 11) year += 1;
  return buildISODate(year, month, day);
}

function monthNumberFromName(monthName) {
  const monthMap = {
    jan: 1,
    fev: 2,
    mar: 3,
    abr: 4,
    mai: 5,
    jun: 6,
    jul: 7,
    ago: 8,
    set: 9,
    out: 10,
    nov: 11,
    dez: 12,
  };
  return monthMap[normalizeText(monthName).slice(0, 3)] || 0;
}

function buildISODate(year, month, day) {
  if (year < 2000) return "";
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return "";
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function findCnpjs(text) {
  const matches = String(text || "").match(/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g) || [];
  return Array.from(new Set(matches.map((value) => value.replace(/\D/g, "")).filter((value) => value.length === 14)));
}

function findPeriodKey(text) {
  const normalized = String(text || "").replace(/\s+/g, " ");
  const match =
    normalized.match(/\b(?:compet[eê]ncia|refer[eê]ncia|ref\.?|per[ií]odo|m[eê]s)\D{0,30}(\d{1,2})\s*[\/.-]\s*(\d{4})\b/i) ||
    normalized.match(/\b(\d{1,2})\s*[\/.-]\s*(\d{4})\D{0,24}(?:compet[eê]ncia|refer[eê]ncia|ref\.?|per[ií]odo)\b/i);

  if (match) {
    const month = Number(match[1]);
    const year = Number(match[2]);
    if (month < 1 || month > 12 || year < 2000) return "";
    return `${year}-${String(month).padStart(2, "0")}`;
  }

  const textMatch =
    normalized.match(/\b(?:compet[eê]ncia|refer[eê]ncia|ref\.?|per[ií]odo|m[eê]s)\D{0,30}(jan(?:eiro)?|fev(?:ereiro)?|mar(?:[cç]o)?|abr(?:il)?|mai(?:o)?|jun(?:ho)?|jul(?:ho)?|ago(?:sto)?|set(?:embro)?|out(?:ubro)?|nov(?:embro)?|dez(?:embro)?)\.?\D{0,12}(\d{4})\b/i) ||
    normalized.match(/\b(jan(?:eiro)?|fev(?:ereiro)?|mar(?:[cç]o)?|abr(?:il)?|mai(?:o)?|jun(?:ho)?|jul(?:ho)?|ago(?:sto)?|set(?:embro)?|out(?:ubro)?|nov(?:embro)?|dez(?:embro)?)\.?\D{0,12}(\d{4})\D{0,24}(?:compet[eê]ncia|refer[eê]ncia|ref\.?|per[ií]odo|m[eê]s)\b/i);

  if (!textMatch) return "";
  const month = monthNumberFromName(textMatch[1]);
  const year = Number(textMatch[2]);
  if (month < 1 || month > 12 || year < 2000) return "";
  return `${year}-${String(month).padStart(2, "0")}`;
}

function findInstallment(text, context = {}) {
  const ruleId = context.id || context.sourceRuleId || "";
  const provider = normalizeText(context.provider || "");
  if (ruleId === "nubankInvoice" || ruleId === "nubankPayment" || provider.includes("nubank")) return "";

  const source = String(text || "");
  const regex =
    /\b(?:parcelas?|presta[cç][aã]o|presta[cç][oõ]es)\s*[:.-]?\s*(?:n[º°o.]?\s*)?(\d{1,2})\s*(?:\/|de)\s*(\d{1,2})\b/gi;
  let match;

  while ((match = regex.exec(source)) !== null) {
    const current = Number(match[1]);
    const total = Number(match[2]);
    if (current >= 1 && total >= 1 && current <= total && total <= 60) {
      return `${current}/${total}`;
    }
  }

  if (ruleId === "iptuInvoice") {
    const singleMatch = source.match(/\bparcelas?\s*[:.-]?\s*(?:n[º°o.]?\s*)?(\d{1,2})\b(?!\s*(?:\/|de)\s*\d)/i);
    const current = Number(singleMatch?.[1] || 0);
    if (current >= 1 && current <= 60) return String(current);
  }

  return "";
}

function computeAutoStatus({ text, dueDate, paidDate, hasDriveProof }) {
  if (hasDriveProof || paidDate) {
    return "paid";
  }
  const parsedAmount = findBestAmount(text);
  if (!parsedAmount && STRONG_BILL_DOCUMENT_REGEX.test(text)) return "needs-review";
  if (dueDate && dueDate < toISODate(new Date())) return "overdue";
  return "open";
}

function inferRecordType(text, parsed, options = {}) {
  if (isProofDocumentText(text) && (options.allowProofWithoutAmount || parsed.amount > 0 || parsed.paidDate)) return "proof";
  if (!isRelevantBillText(text, parsed)) return "ignore";
  return "bill";
}

function isRelevantBillText(text, parsed) {
  if (isIgnoredDocumentText(text)) return false;
  if (parsed.amount && parsed.amount > 0) return BILL_DOCUMENT_REGEX.test(text) || Boolean(parsed.dueDate);
  return STRONG_BILL_DOCUMENT_REGEX.test(text);
}

function isIgnoredDocumentText(text) {
  const value = String(text || "");
  const hasStrongBill = STRONG_BILL_DOCUMENT_REGEX.test(value);
  const hasProof = PROOF_DOCUMENT_REGEX.test(value);
  const hasExplicitPayable =
    /(fatura fechada|cart[aã]o nubank est[aá] fechad[ao]|boleto emitido|novo boleto emitido|guia|iptu|tcl|valor a pagar|total a pagar|vencimento)/i.test(value);

  if (SERVICE_NOTICE_REGEX.test(value) && !hasProof && !hasExplicitPayable) return true;
  if (/\b(informe de rendimentos|relat[oó]rio|demonstrativo)\b/i.test(value) && !hasStrongBill && !hasProof) return true;
  if (/\b(extrato|statement)\b/i.test(value) && !hasStrongBill && !hasProof) return true;
  return /\b(newsletter|promo[cç][aã]o|oferta|publicidade|aviso de acesso|login|seguran[cç]a)\b/i.test(value) && !hasStrongBill && !hasProof;
}

function isProofDocumentText(text) {
  return PROOF_DOCUMENT_REGEX.test(text);
}

function classifyCategory(text) {
  const match = CATEGORY_RULES.find((rule) => rule.regex.test(text));
  return match?.category || "Outros";
}

function cleanTitle(value) {
  return (value || "Conta")
    .replace(/\.(pdf|jpg|jpeg|png|webp|docx?|xlsx?)$/i, "")
    .replace(/^(fwd:|enc:|re:)\s*/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);
}

function inferProvider(subject, from) {
  const displayName = from.match(/^"?([^"<]+)"?\s*</)?.[1]?.trim();
  const emailDomain = from.match(/@([^>\s]+)/)?.[1]?.split(".")?.[0];
  const provider = displayName || emailDomain || subject.split(/[-|:]/)[0] || "Não identificado";
  return cleanTitle(provider).slice(0, 70);
}

function summarizeEvidence(snippet, text) {
  const body = [snippet || "", text || ""].join("\n").replace(/\s+/g, " ").trim();
  return body.slice(0, 900);
}

function sanitizeRecordList(records, { includeProofs = true } = {}) {
  return (records || [])
    .filter((record) => {
      if (!record?.id) return false;
      if (record.recordType === "proof") return includeProofs && isProofRecord(record);
      return isDisplayBillRecord(record);
    })
    .map((record) => ({
      ...record,
      amount: roundCurrency(record.amount || 0),
      category: record.category || "Outros",
      status: normalizeRecordStatus(record),
      sourceTypes: record.sourceTypes?.length ? record.sourceTypes : inferSourceTypes(record.sources || []),
      nubankTransactions: sanitizeNubankTransactions(record.nubankTransactions),
    }));
}

function sanitizeNubankTransactions(transactions) {
  return (transactions || [])
    .map((transaction, index) =>
      repairNubankTransaction({
        id: String(transaction?.id || `nubank-transaction-${index + 1}`),
        date: String(transaction?.date || "").slice(0, 10),
        merchant: String(transaction?.merchant || transaction?.description || "Compra não identificada").trim(),
        description: String(transaction?.description || transaction?.merchant || "").trim(),
        amount: roundCurrency(transaction?.amount || 0),
        category: String(transaction?.category || "Outros"),
        installment: String(transaction?.installment || ""),
        linkedPaymentAmount: roundCurrency(transaction?.linkedPaymentAmount || 0),
        parserAdjustment: String(transaction?.parserAdjustment || ""),
      }),
    )
    .filter((transaction) => transaction.date && transaction.merchant && isNubankPurchaseTransaction(transaction));
}

function repairNubankTransaction(transaction) {
  const source = `${transaction.description || transaction.merchant || ""}`.trim();
  const combinedMatch = source.match(
    /^(.*?)(?:R\$\s*|BRL\s*)?((?:\d{1,3}(?:\.\d{3})*|\d+),\d{2})\s+pagamentos?\b/i,
  );
  if (!combinedMatch) return transaction;

  const purchaseAmount = parseCurrencyInput(combinedMatch[2]);
  const merchant = cleanNubankTransactionDescription(combinedMatch[1]);
  if (!merchant || !Number.isFinite(purchaseAmount) || purchaseAmount <= 0 || purchaseAmount >= transaction.amount) return transaction;

  return {
    ...transaction,
    merchant,
    description: merchant,
    amount: purchaseAmount,
    linkedPaymentAmount: transaction.amount,
    parserAdjustment: "split-payment-column",
    category: classifyNubankTransaction(merchant),
  };
}

function normalizeRecordStatus(record) {
  if (record?.recordType === "proof") return "paid";
  return Object.hasOwn(STATUS_LABELS, record?.status) && record.status !== "pending-proof" ? record.status : "needs-review";
}

function isDisplayBillRecord(record) {
  if (!record || record.recordType === "proof") return false;
  if (record.sourceRuleId && normalizeExtractionRules(state.config.extractionRules)[record.sourceRuleId]?.recordType === "bill") return true;
  const text = [record.title, record.provider, record.category, record.evidence].join(" ");
  if (isIgnoredDocumentText(text)) return false;
  return hasConfirmedAmount(record) || record.status === "needs-review" || STRONG_BILL_DOCUMENT_REGEX.test(text);
}

function isManualRecord(record) {
  return record?.sourceRuleId === "manual" || record?.sourceTypes?.includes("manual");
}

function isFinancialBillRecord(record) {
  if (!isDisplayBillRecord(record)) return false;
  return Boolean(record.amount && record.amount > 0);
}

function isPayableRecord(record) {
  return isFinancialBillRecord(record) && (record.status === "open" || record.status === "overdue");
}

function hasConfirmedAmount(record) {
  return Number(record?.amount || 0) > 0 || record?.amountConfirmed === true;
}

function formatRecordAmount(record, fallback = "A revisar") {
  return hasConfirmedAmount(record) ? formatCurrency(record.amount) : fallback;
}

function isProofRecord(record) {
  if (!record || record.recordType !== "proof") return false;
  const text = [record.title, record.provider, record.evidence].join(" ");
  return isProofDocumentText(text) || (record.sources || []).some((source) => /comprovante|recibo|pagamento|pix|pago/i.test(`${source.label} ${source.title}`));
}

function inferSourceTypes(sources) {
  return Array.from(new Set((sources || []).map((source) => source.type).filter(Boolean)));
}

function getEffectiveRecords({ includeProofs = true } = {}) {
  const effectiveRecords = (state.records || []).filter((record) => !state.overrides[record.id]?.deleted).map((record) => {
    const override = state.overrides[record.id] || {};
    const hasAmountOverride = override.amountOverride === true && Number.isFinite(override.amount);
    const next = {
      ...record,
      ...override,
      status: override.status || record.status,
      amount: hasAmountOverride ? override.amount : record.amount,
      dueDate: override.dueDate || record.dueDate,
      category: override.category || record.category,
      title: override.title || record.title,
    };
    const authoritativeDueDate = isManualRecord(next) ? "" : findAuthoritativeDueDate(next.evidence, next.createdAt);
    if (authoritativeDueDate) next.dueDate = authoritativeDueDate;
    const authoritativePeriodKey = isManualRecord(next) ? "" : findPeriodKey(next.evidence);
    if (authoritativePeriodKey) next.periodKey = authoritativePeriodKey;
    if (isExplicitZeroAmount(next.evidence, next)) {
      next.amount = 0;
      next.amountConfirmed = true;
      next.status = "paid";
    }
    next.installment = normalizeRecordInstallment(next);
    const hadProofSource = (next.sources || []).some(isProofSource);
    next.sources = normalizeRecordSources(next);
    next.sourceTypes = inferSourceTypes(next.sources);
    if (hadProofSource && !hasProof(next) && next.sourceRuleId !== "manual") {
      next.paidDate = "";
      next.status = next.dueDate && next.dueDate < toISODate(new Date()) ? "overdue" : "open";
    }
    if (authoritativeDueDate && next.recordType !== "proof" && next.status !== "paid" && hasConfirmedAmount(next)) {
      next.status = next.dueDate < toISODate(new Date()) ? "overdue" : "open";
    }
    next.monthKey = deriveRecordMonthKey(next);
    return next;
  });

  return sanitizeRecordList(effectiveRecords, { includeProofs });
}

function normalizeRecordInstallment(record) {
  const provider = normalizeText(record.provider || "");
  if (record.sourceRuleId === "nubankInvoice" || record.sourceRuleId === "nubankPayment" || provider.includes("nubank")) return "";

  const evidenceInstallment = findInstallment(record.evidence || "", record);
  if (evidenceInstallment) return evidenceInstallment;

  const match = String(record.installment || "").match(/^(\d{1,2})\/(\d{1,2})$/);
  if (!match) return "";
  const current = Number(match[1]);
  const total = Number(match[2]);
  if (current < 1 || total < 1 || current > total || total > 60) return "";

  const dueDate = String(record.dueDate || "").match(/^\d{4}-(\d{2})-(\d{2})/);
  if (dueDate && current === Number(dueDate[2]) && total === Number(dueDate[1])) return "";
  return `${current}/${total}`;
}

function normalizeRecordSources(record) {
  let sources = record.sources || [];
  if (isIptuRecord(record)) sources = sources.filter((source) => source.type !== "link");
  if (record?.sourceRuleId === "manual") return sources;
  return sources.filter((source) => !isProofSource(source) || isProofSourceDateCompatible(record, source));
}

function isProofSourceDateCompatible(record, source) {
  const sourceDate = toISODate(new Date(source?.paymentDate || source?.date || ""));
  if (!sourceDate) return false;
  const recordProvider = normalizeText(record?.provider || "");
  const isNubank = record?.sourceRuleId === "nubankInvoice" || recordProvider.includes("nubank");
  if (isNubank) return daysBetween(record.dueDate, sourceDate) <= 12;
  return monthKeyFromDate(record.dueDate || record.monthKey) === monthKeyFromDate(sourceDate);
}

function isIptuRecord(record) {
  return (
    record?.sourceRuleId === "iptuInvoice" ||
    /\b(iptu|tcl|receita municipal de porto alegre)\b/i.test(`${record?.provider || ""} ${record?.title || ""}`)
  );
}

function render() {
  renderMonthSelect();
  renderDashboardNavigation();
  renderConnectionStatus();
  renderMetrics();
  renderIncomePanel();
  renderCharts();
  renderMonthlyAudit();
  renderAuditVisibility();
  renderSearchSuggestions();
  renderTable();
  if (state.activeDashboard === "nubank") renderNubankDashboard();
  window.lucide?.createIcons();
}

function selectDashboard(view) {
  state.activeDashboard = view === "nubank" ? "nubank" : "household";
  saveViewPrefs();
  renderDashboardNavigation();
  if (state.activeDashboard === "nubank") renderNubankDashboard();
  renderCharts();
  window.lucide?.createIcons();
}

function renderDashboardNavigation() {
  els.dashboardNavButtons.forEach((button) => {
    const active = button.dataset.dashboardView === state.activeDashboard;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });
  els.dashboardPanels.forEach((panel) => {
    const active = panel.dataset.dashboardPanel === state.activeDashboard;
    panel.hidden = !active;
    panel.classList.toggle("is-active", active);
  });
}

function renderMonthSelect() {
  const months = new Set(getEffectiveRecords({ includeProofs: true }).map((record) => record.monthKey).filter(Boolean));
  recentMonths(Math.min(Number(state.config.syncMonthsBack) || 18, 36)).forEach((month) => months.add(month));
  months.add(monthKeyFromDate(toISODate(new Date())));
  const sortedMonths = Array.from(months).sort().reverse();

  if (!state.selectedMonth || !months.has(state.selectedMonth)) {
    state.selectedMonth = sortedMonths[0] || monthKeyFromDate(toISODate(new Date()));
  }

  const currentYear = String(new Date().getFullYear());
  const currentYearMonths = sortedMonths.filter((month) => month.startsWith(`${currentYear}-`));
  const previousYears = Array.from(new Set(sortedMonths.map((month) => month.slice(0, 4)).filter((year) => year && year !== currentYear))).sort().reverse();
  const selectedYear = state.selectedMonth.slice(0, 4);
  const selectedMonthOutsideCurrentYear = selectedYear !== currentYear
    ? `<option value="${state.selectedMonth}" selected>${formatMonth(state.selectedMonth)}</option>`
    : "";

  els.monthSelect.innerHTML = [
    selectedMonthOutsideCurrentYear,
    ...currentYearMonths.map(
      (month) => `<option value="${month}" ${month === state.selectedMonth ? "selected" : ""}>${formatMonth(month)}</option>`,
    ),
    ...previousYears.map((year) => `<option value="year:${year}">${year} · ver meses</option>`),
  ].join("");
}

function openMonthArchive(year) {
  const months = Array.from(
    new Set(getEffectiveRecords({ includeProofs: true }).map((record) => record.monthKey).filter((month) => month?.startsWith(`${year}-`))),
  ).sort().reverse();
  if (!months.length) {
    showToast(`Nenhuma competência encontrada em ${year}.`);
    return;
  }
  els.monthArchiveTitle.textContent = `Competências de ${year}`;
  els.monthArchiveList.innerHTML = months
    .map((month) => {
      const count = getEffectiveRecords({ includeProofs: true }).filter((record) => record.monthKey === month).length;
      return `<button type="button" data-archive-month="${escapeAttribute(month)}"><strong>${escapeHtml(formatMonth(month))}</strong><span>${count} ${count === 1 ? "registro" : "registros"}</span><i data-lucide="chevron-right"></i></button>`;
    })
    .join("");
  els.monthArchiveList.querySelectorAll("[data-archive-month]").forEach((button) => {
    button.addEventListener("click", () => {
      els.monthArchiveDialog.close();
      selectMonth(button.dataset.archiveMonth);
    });
  });
  els.monthArchiveDialog.showModal();
  window.lucide?.createIcons();
}

function selectMonth(monthKey) {
  if (!monthKey) return;
  state.selectedMonth = monthKey;
  state.filters.recordIds = [];
  saveViewPrefs();
  render();
}

function bindDrilldownCard(element, handler) {
  if (!element) return;
  element.addEventListener("click", handler);
  element.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    handler();
  });
}

function openMetricDrilldown(kind) {
  const monthRecords = getMonthRecords({ includeProofs: true });
  const bills = monthRecords.filter((record) => record.recordType === "bill");
  const financial = getFinancialRecords(bills);
  const payable = financial.filter(isPayableRecord);
  const paidBills = financial.filter((record) => record.status === "paid");
  const overdue = financial.filter((record) => record.status === "overdue");

  if (kind === "month") {
    openRecordsDrilldown(financial, "Nenhuma despesa com valor encontrada neste mês.");
    return;
  }

  if (kind === "payable") {
    openRecordsDrilldown(payable, "Nenhuma conta pendente para pagar neste mês.");
    return;
  }

  if (kind === "paid") {
    openRecordsDrilldown(paidBills, "Nenhum valor pago encontrado neste mês.", { status: "paid" });
    return;
  }

  if (kind === "overdue") {
    openRecordsDrilldown(overdue, "Nenhum registro atrasado neste mês.", { status: "overdue" });
    return;
  }

  openRecordsDrilldown(financial, "Nenhuma conta com valor encontrada neste mês.", { status: "all" });
}

function drilldownCategory(category) {
  if (!category || category === "Sem registros") {
    showToast("Nenhuma categoria encontrada neste mês.");
    return;
  }

  const records = getFinancialRecords(getMonthRecords({ includeProofs: false })).filter((record) => record.category === category);
  openRecordsDrilldown(records, `Nenhum registro encontrado em ${category}.`, { search: category, status: "all" });
}

function openRecordsDrilldown(records, emptyMessage, { status = "all", search = "" } = {}) {
  const uniqueRecords = Array.from(new Map(records.filter(Boolean).map((record) => [record.id, record])).values());

  if (!uniqueRecords.length) {
    showToast(emptyMessage);
    return;
  }

  if (uniqueRecords.length === 1) {
    state.selectedMonth = uniqueRecords[0].monthKey || state.selectedMonth;
    state.filters.status = "all";
    state.filters.search = "";
    state.filters.recordIds = [];
    render();
    els.statusFilter.value = "all";
    els.searchInput.value = "";
    openDetail(uniqueRecords[0].id);
    return;
  }

  state.filters.status = status;
  state.filters.search = search ? normalizeText(search) : "";
  state.filters.recordIds = uniqueRecords.map((record) => record.id);
  renderTable();
  els.statusFilter.value = state.filters.status;
  els.searchInput.value = search;
  scrollRecordsIntoView();
  showToast(`${uniqueRecords.length} registros encontrados.`);
}

function scrollRecordsIntoView() {
  const panel = els.recordsBody.closest(".table-panel");
  panel?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function toggleAuditPanel() {
  state.auditVisible = !state.auditVisible;
  renderAuditVisibility();
}

function renderAuditVisibility() {
  if (!els.auditPanel || !els.auditToggleButton) return;
  els.auditPanel.hidden = !state.auditVisible;
  els.auditToggleButton.classList.toggle("is-active", state.auditVisible);
  els.auditToggleButton.setAttribute("aria-expanded", String(state.auditVisible));
}

function openIncomeSettings() {
  openSettings();
  window.setTimeout(() => {
    els.incomeLuisInput.focus();
    els.incomeLuisInput.select();
  }, 0);
}

function renderConnectionStatus(message, level = "") {
  const googleConnected = Boolean(state.googleAccessToken);
  els.googleStatus.textContent = message && message.startsWith("Google") ? message : googleConnected ? "Google conectado" : "Google desconectado";
  els.googleDot.className = `status-dot ${level || (googleConnected ? "ok" : "warn")}`;

  if (message && message.startsWith("Firebase")) {
    els.firebaseStatus.textContent = message;
    els.firebaseDot.className = `status-dot ${level}`;
  } else {
    els.firebaseStatus.textContent = state.firebase
      ? state.firebaseUser
        ? `Firebase: ${state.firebaseUser.email || "logado"}`
        : "Firebase pronto"
      : "Cache local";
    els.firebaseDot.className = `status-dot ${state.firebaseUser ? "ok" : "warn"}`;
  }

  els.lastSyncLabel.textContent = state.config.lastSyncAt
    ? `Última sync: ${formatDateTime(state.config.lastSyncAt)}`
    : "Aguardando sincronização";

  applyDotAccessibility(els.googleDot, els.googleStatus.textContent);
  applyDotAccessibility(els.firebaseDot, els.firebaseStatus.textContent);
}

function applyDotAccessibility(dot, label) {
  if (!dot) return;
  dot.setAttribute("role", "img");
  dot.setAttribute("aria-label", label);
}

function getMonthRecords({ includeProofs = true } = {}) {
  return getEffectiveRecords({ includeProofs }).filter((record) => {
    if (!includeProofs && record.recordType === "proof") return false;
    return record.monthKey === state.selectedMonth;
  });
}

function getFinancialRecords(records) {
  return records.filter(isFinancialBillRecord);
}

function renderMetrics() {
  const monthRecords = getMonthRecords({ includeProofs: true });
  const records = monthRecords.filter((record) => record.recordType === "bill");
  const proofRecords = monthRecords.filter((record) => record.recordType === "proof");
  const financialRecords = getFinancialRecords(records);
  const reviewRecords = records.filter((record) => !hasConfirmedAmount(record) || record.status === "needs-review");
  const monthTotal = sum(financialRecords, "amount");
  const payableRecords = financialRecords.filter(isPayableRecord);
  const payable = sum(payableRecords, "amount");
  const paidRecords = financialRecords.filter((record) => record.status === "paid");
  const overdueRecords = financialRecords.filter((record) => record.status === "overdue");
  const paid = sum(paidRecords, "amount");
  const overdue = sum(overdueRecords, "amount");

  els.metricMonthTotal.textContent = formatCurrency(monthTotal);
  els.metricTotal.textContent = formatCurrency(payable);
  els.metricPaid.textContent = formatCurrency(paid);
  els.metricOverdue.textContent = formatCurrency(overdue);
  els.metricMonthHint.textContent = `${financialRecords.length} ${financialRecords.length === 1 ? "conta com valor" : "contas com valor"}${reviewRecords.length ? ` · ${reviewRecords.length} a revisar` : ""}${proofRecords.length ? ` · ${proofRecords.length} comprovante${proofRecords.length === 1 ? "" : "s"}` : ""}`;
  els.metricTotalHint.textContent = `${payableRecords.length} ${payableRecords.length === 1 ? "conta pendente" : "contas pendentes"}`;
  els.metricPaidHint.textContent = `${paidRecords.length} ${paidRecords.length === 1 ? "conta paga" : "contas pagas"}`;
  els.metricOverdueHint.textContent = `${overdueRecords.length} ${overdueRecords.length === 1 ? "vencida" : "vencidas"}`;
}

function renderMonthlyAudit() {
  if (!els.monthlyAuditBody) return;
  const summaries = buildMonthlySummaries();
  els.monthlyAuditBody.innerHTML = summaries
    .map(
      (item) => `
        <tr data-month="${escapeHtml(item.monthKey)}" class="${item.monthKey === state.selectedMonth ? "is-selected" : ""}">
          <td>${formatMonth(item.monthKey)}</td>
          <td class="numeric">${formatCurrency(item.total)}</td>
          <td class="numeric">${formatCurrency(item.paid)}</td>
          <td class="numeric">${item.billCount}</td>
          <td class="numeric">${item.proofCount}</td>
          <td class="numeric">${item.reviewCount}</td>
        </tr>
      `,
    )
    .join("");

  els.monthlyAuditBody.querySelectorAll("tr[data-month]").forEach((row) => {
    row.addEventListener("click", () => selectMonth(row.dataset.month));
  });
}

function buildMonthlySummaries() {
  const records = getEffectiveRecords({ includeProofs: true });
  const months = new Set(recentMonths(Math.min(Number(state.config.syncMonthsBack) || 18, 36)));
  records.forEach((record) => {
    if (record.monthKey) months.add(record.monthKey);
  });

  return Array.from(months)
    .sort()
    .reverse()
    .map((monthKey) => {
      const monthRecords = records.filter((record) => record.monthKey === monthKey);
      const billRecords = monthRecords.filter((record) => record.recordType === "bill");
      const proofRecords = monthRecords.filter((record) => record.recordType === "proof");
      const financialBills = getFinancialRecords(billRecords);
      const paidBills = financialBills.filter((record) => record.status === "paid");
      const reviewCount = billRecords.filter((record) => !hasConfirmedAmount(record) || record.status === "needs-review").length;

      return {
        monthKey,
        total: sum(financialBills, "amount"),
        paid: sum(paidBills, "amount"),
        billCount: billRecords.length,
        proofCount: proofRecords.length,
        reviewCount,
      };
    });
}

function renderIncomePanel() {
  const ratios = getIncomeRatios();
  const monthTotal = sum(getFinancialRecords(getMonthRecords({ includeProofs: false })), "amount");
  els.incomeLuis.textContent = formatCurrency(state.config.incomes.luis);
  els.incomeCamila.textContent = formatCurrency(state.config.incomes.camila);
  els.incomeCaption.textContent = `Divisão para ${formatMonth(state.selectedMonth)}`;
  els.incomeLuisContribution.textContent = formatCurrency(monthTotal * ratios.luis);
  els.incomeCamilaContribution.textContent = formatCurrency(monthTotal * ratios.camila);
  els.shareLuis.textContent = formatPercent(ratios.luis);
  els.shareCamila.textContent = formatPercent(ratios.camila);
  els.barLuis.style.width = `${ratios.luis * 100}%`;
  els.barCamila.style.width = `${ratios.camila * 100}%`;
}

function renderCharts() {
  if (state.activeDashboard === "nubank") {
    renderNubankCharts();
    return;
  }
  renderEvolutionChart();
  renderCategoryChart();
}

function renderEvolutionChart() {
  if (!window.Chart) return;
  const allRecords = getEffectiveRecords({ includeProofs: true });
  const records = getFinancialRecords(allRecords);
  const monthKeys = getEvolutionMonthKeys(allRecords);
  const labels = monthKeys.map(formatMonthShort);
  const totals = monthKeys.map((month) => sum(records.filter((record) => record.monthKey === month), "amount"));
  const paid = monthKeys.map((month) => {
    return sum(records.filter((record) => record.monthKey === month && record.status === "paid"), "amount");
  });

  if (state.charts.evolution) state.charts.evolution.destroy();
  state.charts.evolution = new window.Chart(els.evolutionChart, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          type: "bar",
          label: "Total",
          data: totals,
          backgroundColor: "rgba(22, 131, 110, 0.25)",
          borderColor: themeColor("--teal", "#16836e"),
          borderWidth: 1,
          borderRadius: 6,
        },
        {
          type: "line",
          label: "Pago",
          data: paid,
          borderColor: themeColor("--blue", "#356ac3"),
          backgroundColor: themeColor("--blue", "#356ac3"),
          borderWidth: 3,
          tension: 0.35,
          pointRadius: 3,
        },
      ],
    },
    options: chartBaseOptions({
      onClick: (event, elements, chart) => {
        const points = elements.length
          ? elements
          : chart.getElementsAtEventForMode(event, "nearest", { intersect: false }, true);
        const point = points[0];
        if (point) selectMonth(monthKeys[point.index]);
      },
      scales: {
        y: {
          ticks: {
            callback: (value) => formatCompactCurrency(value),
          },
        },
      },
    }),
  });
}

function getEvolutionMonthKeys(records) {
  const recordMonths = records.map((record) => record.monthKey).filter(Boolean).sort();
  const currentMonth = monthKeyFromDate(toISODate(new Date()));
  const endMonth = [currentMonth, recordMonths.at(-1) || ""].sort().at(-1);
  if (state.chartRange !== "max") return monthsEndingAt(endMonth, Number(state.chartRange || 12));
  const months = records.map((record) => record.monthKey).filter(Boolean).sort();
  if (!months.length) return monthsEndingAt(endMonth, 12);
  return monthsBetween(months[0], endMonth);
}

function monthsEndingAt(endMonth, count) {
  const end = new Date(`${endMonth}-01T12:00:00`);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(end.getFullYear(), end.getMonth() - (count - 1 - index), 1);
    return monthKeyFromDate(toISODate(date));
  });
}

function monthsBetween(startMonth, endMonth) {
  const start = new Date(`${startMonth}-01T12:00:00`);
  const end = new Date(`${endMonth}-01T12:00:00`);
  const months = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cursor <= end && months.length < 120) {
    months.push(monthKeyFromDate(toISODate(cursor)));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
}

function renderCategoryChart() {
  if (!window.Chart) return;
  const records = getFinancialRecords(getMonthRecords({ includeProofs: false }));
  const totalsByCategory = new Map();
  records.forEach((record) => {
    totalsByCategory.set(record.category, (totalsByCategory.get(record.category) || 0) + record.amount);
  });

  let labels = Array.from(totalsByCategory.keys());
  let values = labels.map((label) => totalsByCategory.get(label));
  const isEmpty = !labels.length;

  if (isEmpty) {
    labels = ["Sem registros"];
    values = [1];
  }

  if (state.charts.category) state.charts.category.destroy();
  state.charts.category = new window.Chart(els.categoryChart, {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: labels.map((_, index) =>
            isEmpty ? themeColor("--line", "#d8e3df") : COLOR_SET[index % COLOR_SET.length],
          ),
          borderColor: themeColor("--surface", "#ffffff"),
          borderWidth: 3,
        },
      ],
    },
    options: chartBaseOptions({
      onClick: (event, elements, chart) => {
        if (isEmpty) return;
        const activeElements = elements || [];
        const points = activeElements.length
          ? activeElements
          : chart.getElementsAtEventForMode(event, "nearest", { intersect: true }, true);
        const point = points[0];
        if (point) drilldownCategory(labels[point.index]);
      },
      onHover: (event, elements) => {
        if (event.native?.target) {
          event.native.target.style.cursor = !isEmpty && (elements || []).length ? "pointer" : "default";
        }
      },
      scales: null,
      cutout: "64%",
      plugins: {
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.label}: ${labels[0] === "Sem registros" ? "R$ 0,00" : formatCurrency(ctx.raw)}`,
          },
        },
      },
    }),
  });
}

function getNubankInvoiceRecords(monthKey = state.selectedMonth) {
  return getEffectiveRecords({ includeProofs: false }).filter(
    (record) => record.sourceRuleId === "nubankInvoice" && record.monthKey === monthKey,
  );
}

function getNubankTransactions(monthKey = state.selectedMonth) {
  return getNubankInvoiceRecords(monthKey).flatMap((invoice) =>
    sanitizeNubankTransactions(invoice.nubankTransactions).map((transaction) => ({
      ...transaction,
      invoiceId: invoice.id,
      invoiceDueDate: invoice.dueDate,
    })),
  );
}

function renderNubankDashboard() {
  const invoices = getNubankInvoiceRecords();
  const transactions = getNubankTransactions();
  const total = sum(transactions, "amount");
  const average = transactions.length ? total / transactions.length : 0;
  const largest = [...transactions].sort((a, b) => b.amount - a.amount)[0];
  const installments = transactions.filter((transaction) => transaction.installment);
  const installmentTotal = sum(installments, "amount");
  const invoiceTotal = sum(invoices, "amount");
  const netAdjustment = roundCurrency(invoiceTotal - total);

  els.nubankInvoiceCaption.textContent = invoices.length
    ? `${formatMonth(state.selectedMonth)} · ${formatCurrency(invoiceTotal)} na fatura · vencimento ${formatDate(invoices[0].dueDate)}`
    : `${formatMonth(state.selectedMonth)} · nenhuma fatura Nubank sincronizada`;
  els.nubankMetricTotal.textContent = formatCurrency(invoiceTotal);
  els.nubankMetricTotalHint.textContent = invoices.length
    ? `${formatCurrency(total)} em compras brutas · ajustes ${formatSignedCurrency(netAdjustment)}`
    : "Nenhuma fatura sincronizada";
  els.nubankMetricAverage.textContent = formatCurrency(average);
  els.nubankMetricAverageHint.textContent = transactions.length ? `Média de ${transactions.length} compras` : "Por compra";
  els.nubankMetricLargest.textContent = formatCurrency(largest?.amount || 0);
  els.nubankMetricLargestHint.textContent = largest?.merchant || "Sem dados";
  els.nubankMetricInstallments.textContent = formatCurrency(installmentTotal);
  els.nubankMetricInstallmentsHint.textContent = `${installments.length} ${installments.length === 1 ? "parcela identificada" : "parcelas identificadas"}`;

  renderNubankCategoryFilter(transactions);
  renderNubankTable();
  renderNubankInsights(invoices, transactions);
}

function renderNubankCategoryFilter(transactions) {
  const categories = Array.from(new Set(transactions.map((transaction) => transaction.category))).sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );
  if (state.nubankFilters.category !== "all" && !categories.includes(state.nubankFilters.category)) {
    state.nubankFilters.category = "all";
  }
  els.nubankCategoryFilter.innerHTML = [
    `<option value="all">Todas</option>`,
    ...categories.map(
      (category) =>
        `<option value="${escapeAttribute(category)}" ${category === state.nubankFilters.category ? "selected" : ""}>${escapeHtml(category)}</option>`,
    ),
  ].join("");
}

function renderNubankTable() {
  const transactions = getNubankTransactions()
    .filter((transaction) => state.nubankFilters.category === "all" || transaction.category === state.nubankFilters.category)
    .filter((transaction) => !state.nubankFilters.search || normalizeText(transaction.description).includes(state.nubankFilters.search))
    .sort(compareNubankTransactions);

  els.nubankTransactionsBody.innerHTML = renderNubankTransactionRows(transactions);
  els.nubankEmptyState.hidden = transactions.length > 0;
  els.nubankTableCaption.textContent = `${transactions.length} ${transactions.length === 1 ? "compra" : "compras"} em ${formatMonth(state.selectedMonth)}`;
  renderNubankSortHeaders();
}

function sortNubankByColumn(column) {
  if (!["date", "amount", "merchant", "category"].includes(column)) return;
  if (state.nubankFilters.sort === column) {
    state.nubankFilters.direction = state.nubankFilters.direction === "asc" ? "desc" : "asc";
  } else {
    state.nubankFilters.sort = column;
    state.nubankFilters.direction = column === "merchant" || column === "category" ? "asc" : "desc";
  }
  els.nubankSortSelect.value = state.nubankFilters.sort;
  els.nubankSortDirection.value = state.nubankFilters.direction;
  saveViewPrefs();
  renderNubankTable();
}

function renderNubankSortHeaders() {
  els.nubankSortColumnButtons.forEach((button) => {
    const active = button.dataset.nubankSortColumn === state.nubankFilters.sort;
    button.classList.toggle("is-active", active);
    button.dataset.direction = active ? state.nubankFilters.direction : "";
    button.setAttribute("aria-sort", active ? (state.nubankFilters.direction === "asc" ? "ascending" : "descending") : "none");
    const icon = button.querySelector("i, svg");
    if (icon) {
      const iconName = active ? (state.nubankFilters.direction === "asc" ? "arrow-up" : "arrow-down") : "chevrons-up-down";
      icon.outerHTML = `<i data-lucide="${iconName}"></i>`;
    }
  });
  window.lucide?.createIcons();
}

function compareNubankTransactions(a, b) {
  const direction = state.nubankFilters.direction === "asc" ? 1 : -1;
  const comparisons = {
    amount: () => a.amount - b.amount,
    merchant: () => a.merchant.localeCompare(b.merchant, "pt-BR"),
    category: () => a.category.localeCompare(b.category, "pt-BR"),
    date: () => a.date.localeCompare(b.date),
  };
  const comparison = (comparisons[state.nubankFilters.sort] || comparisons.date)();
  return comparison * direction || b.amount - a.amount || a.merchant.localeCompare(b.merchant, "pt-BR");
}

function renderNubankTransactionRows(transactions) {
  return transactions
    .map(
      (transaction) => `
        <tr>
          <td data-label="Data">${escapeHtml(formatDate(transaction.date))}</td>
          <td data-label="Estabelecimento" title="${escapeAttribute(transaction.description)}">${escapeHtml(transaction.merchant)}</td>
          <td data-label="Categoria"><span class="nubank-category-pill">${escapeHtml(transaction.category)}</span></td>
          <td data-label="Parcela">${escapeHtml(formatNubankInstallment(transaction))}</td>
          <td data-label="Valor" class="numeric">${escapeHtml(formatCurrency(transaction.amount))}</td>
        </tr>
      `,
    )
    .join("");
}

function formatNubankInstallment(transaction) {
  if (!transaction.installment) return "À vista";
  const remaining = getNubankRemainingInstallments(transaction);
  return remaining > 0 ? `${transaction.installment} · faltam ${remaining}` : transaction.installment;
}

function getNubankRemainingInstallments(transaction) {
  const match = String(transaction?.installment || "").match(/^(\d{1,2})\/(\d{1,2})$/);
  return match ? Math.max(0, Number(match[2]) - Number(match[1])) : 0;
}

function getNubankParserAdjustments(transactions) {
  return transactions
    .filter((transaction) => transaction.parserAdjustment === "split-payment-column" && transaction.linkedPaymentAmount > transaction.amount)
    .map((transaction) => ({
      ...transaction,
      removedAmount: roundCurrency(transaction.linkedPaymentAmount - transaction.amount),
    }));
}

function openNubankMetricDetail(kind) {
  const invoices = getNubankInvoiceRecords();
  const transactions = getNubankTransactions();
  const adjustments = getNubankParserAdjustments(transactions);
  const removedAmount = sum(adjustments, "removedAmount");
  const total = sum(transactions, "amount");
  const invoiceTotal = sum(invoices, "amount");
  const netAdjustment = roundCurrency(invoiceTotal - total);
  const average = transactions.length ? total / transactions.length : 0;
  const largest = [...transactions].sort((a, b) => b.amount - a.amount)[0];
  const installments = transactions.filter((transaction) => transaction.installment);
  let detailTransactions = transactions;
  let title = "Conciliação da fatura";
  let caption = "Valor final conciliado com compras brutas e ajustes líquidos";
  let summary = [
    { label: "Valor final", value: formatCurrency(invoiceTotal) },
    { label: "Compras brutas", value: formatCurrency(total) },
    { label: "Ajustes líquidos", value: formatSignedCurrency(netAdjustment) },
    { label: "Compras identificadas", value: String(transactions.length) },
    ...(removedAmount > 0 ? [{ label: "Pagamentos separados", value: formatCurrency(removedAmount) }] : []),
  ];

  if (kind === "average") {
    title = "Composição do ticket médio";
    caption = "Todas as compras consideradas no cálculo";
    summary = [
      { label: "Ticket médio", value: formatCurrency(average) },
      { label: "Total", value: formatCurrency(total) },
      { label: "Compras", value: String(transactions.length) },
    ];
  } else if (kind === "largest") {
    title = "Maior compra";
    detailTransactions = largest ? [largest] : [];
    caption = largest ? `${largest.merchant} · ${formatDate(largest.date)}` : "Nenhuma compra identificada";
    summary = largest
      ? [
          { label: "Valor", value: formatCurrency(largest.amount) },
          { label: "Categoria", value: largest.category },
          { label: "Parcela", value: formatNubankInstallment(largest) },
        ]
      : [];
  } else if (kind === "installments") {
    title = "Compras parceladas";
    detailTransactions = installments;
    const futureInstallments = installments.reduce((count, transaction) => count + getNubankRemainingInstallments(transaction), 0);
    const estimatedFuture = installments.reduce(
      (amount, transaction) => amount + transaction.amount * getNubankRemainingInstallments(transaction),
      0,
    );
    caption = "Parcelas presentes nesta fatura e projeção das restantes";
    summary = [
      { label: "Nesta fatura", value: formatCurrency(sum(installments, "amount")) },
      { label: "Parcelas atuais", value: String(installments.length) },
      { label: "Parcelas futuras", value: String(futureInstallments) },
      { label: "Saldo futuro estimado", value: formatCurrency(estimatedFuture) },
    ];
  }

  detailTransactions = [...detailTransactions].sort(compareNubankTransactions);
  els.nubankDetailTitle.textContent = title;
  els.nubankDetailCaption.textContent = `${formatMonth(state.selectedMonth)} · ${caption}`;
  els.nubankDetailSummary.innerHTML = summary
    .map((item) => `<div><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(item.value)}</strong></div>`)
    .join("");
  els.nubankDetailBody.innerHTML =
    renderNubankTransactionRows(detailTransactions) ||
    `<tr><td colspan="5" class="nubank-detail-empty">Nenhuma compra encontrada para este detalhamento.</td></tr>`;
  els.nubankDetailDialog.showModal();
  window.lucide?.createIcons();
}

function renderNubankInsights(invoices, transactions) {
  if (!transactions.length) {
    els.nubankInsightsList.innerHTML = `
      <div class="nubank-insight empty">
        <i data-lucide="scan-search"></i>
        <div><strong>Aguardando compras</strong><span>Use Sincronizar para analisar o PDF anexado à fatura.</span></div>
      </div>
    `;
    return;
  }

  const total = sum(transactions, "amount");
  const invoiceTotal = sum(invoices, "amount");
  const adjustments = getNubankParserAdjustments(transactions);
  const removedAmount = sum(adjustments, "removedAmount");
  const previousMonth = addMonthsToMonthKey(state.selectedMonth, -1);
  const previousTotal = sum(getNubankTransactions(previousMonth), "amount");
  const categoryTotals = aggregateNubankTransactions(transactions, "category");
  const merchantTotals = aggregateNubankTransactions(transactions, "merchant");
  const topCategory = categoryTotals[0];
  const topMerchant = merchantTotals[0];
  const difference = roundCurrency(invoiceTotal - total);
  const insights = [];

  if (adjustments.length) {
    insights.push({
      icon: "split",
      title: `${formatCurrency(removedAmount)} separados de compras`,
      text: `${adjustments.length} ${adjustments.length === 1 ? "linha combinava" : "linhas combinavam"} compra e pagamento. Ex.: ${adjustments[0].merchant}: ${formatCurrency(adjustments[0].linkedPaymentAmount)} corrigido para ${formatCurrency(adjustments[0].amount)}.`,
    });
  }
  if (Math.abs(difference) < 0.01) {
    insights.push({
      icon: "badge-check",
      title: "Compras conciliadas com a fatura",
      text: `${formatCurrency(total)} em compras identificadas, igual ao valor final da fatura.`,
    });
  }
  if (Math.abs(difference) >= 0.01) {
    insights.push({
      icon: difference > 0 ? "circle-plus" : "circle-minus",
      title: `Ajustes líquidos de ${formatSignedCurrency(difference)}`,
      text:
        difference > 0
          ? `${formatCurrency(total)} em compras brutas mais ${formatCurrency(difference)} em saldos, encargos ou itens não detalhados resultam em ${formatCurrency(invoiceTotal)}.`
          : `${formatCurrency(total)} em compras brutas menos ${formatCurrency(Math.abs(difference))} em créditos, descontos ou abatimentos resultam em ${formatCurrency(invoiceTotal)}.`,
    });
  }
  if (previousTotal > 0) {
    const change = (total - previousTotal) / previousTotal;
    insights.push({
      icon: change > 0 ? "trending-up" : "trending-down",
      title: `${change > 0 ? "Alta" : "Queda"} de ${formatPercent(Math.abs(change))}`,
      text: `Comparado às compras identificadas em ${formatMonth(previousMonth)}.`,
    });
  }
  if (topCategory) {
    insights.push({
      icon: "chart-pie",
      title: `${topCategory.label} lidera a fatura`,
      text: `${formatCurrency(topCategory.total)} · ${formatPercent(topCategory.total / total)} dos gastos identificados.`,
    });
  }
  if (topMerchant) {
    insights.push({
      icon: "store",
      title: `Mais gasto em ${topMerchant.label}`,
      text: `${formatCurrency(topMerchant.total)} somando ${topMerchant.count} ${topMerchant.count === 1 ? "compra" : "compras"}.`,
    });
  }
  els.nubankInsightsList.innerHTML = insights
    .slice(0, 5)
    .map(
      (insight) => `
        <div class="nubank-insight">
          <i data-lucide="${escapeAttribute(insight.icon)}"></i>
          <div><strong>${escapeHtml(insight.title)}</strong><span>${escapeHtml(insight.text)}</span></div>
        </div>
      `,
    )
    .join("");
}

function aggregateNubankTransactions(transactions, field) {
  const values = new Map();
  transactions.forEach((transaction) => {
    const label = transaction[field] || "Outros";
    const current = values.get(label) || { label, total: 0, count: 0 };
    current.total += transaction.amount;
    current.count += 1;
    values.set(label, current);
  });
  return Array.from(values.values()).sort((a, b) => b.total - a.total);
}

function renderNubankCharts() {
  if (!window.Chart || state.activeDashboard !== "nubank") return;
  const transactions = getNubankTransactions();
  renderNubankEvolutionChart();
  renderNubankCategoryChart(transactions);
}

function selectNubankChartMode(mode) {
  state.nubankChartMode = mode === "monthly" ? "monthly" : "daily";
  saveViewPrefs();
  renderNubankEvolutionChart();
}

function renderNubankEvolutionChart() {
  const monthly = state.nubankChartMode === "monthly";
  els.nubankChartModeButtons.forEach((button) => {
    const active = button.dataset.nubankChartMode === state.nubankChartMode;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  els.nubankEvolutionTitle.textContent = monthly ? "Evolução mensal das faturas" : "Gastos ao longo da fatura";
  els.nubankEvolutionCaption.textContent = monthly ? "Valor final da fatura comparado ao valor pago" : "Compras agrupadas por dia";
  if (monthly) {
    renderNubankMonthlyChart();
  } else {
    renderNubankDailyChart(getNubankTransactions());
  }
}

function getIncrementalSyncSince() {
  const candidates = [
    state.config.lastSyncAt,
    ...state.records.map((record) => record.updatedAt),
    ...state.driveFiles.map((file) => file.modifiedTime || file.createdTime),
  ]
    .filter(Boolean)
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()));
  if (!candidates.length) return "";
  const latest = new Date(Math.max(...candidates.map((date) => date.getTime())));
  latest.setDate(latest.getDate() - INCREMENTAL_SYNC_OVERLAP_DAYS);
  return latest.toISOString();
}

function renderNubankDailyChart(transactions) {
  const daily = aggregateNubankTransactions(transactions, "date").sort((a, b) => a.label.localeCompare(b.label));
  const labels = daily.length ? daily.map((item) => formatDate(item.label).slice(0, 5)) : ["Sem dados"];
  const values = daily.length ? daily.map((item) => item.total) : [0];
  if (state.charts.nubankDaily) state.charts.nubankDaily.destroy();
  state.charts.nubankDaily = new window.Chart(els.nubankDailyChart, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Gastos",
          data: values,
          borderColor: "#820ad1",
          backgroundColor: "rgba(130, 10, 209, 0.12)",
          fill: true,
          borderWidth: 3,
          tension: 0.3,
          pointRadius: daily.length > 20 ? 1 : 3,
        },
      ],
    },
    options: chartBaseOptions({
      scales: {
        y: { ticks: { callback: (value) => formatCompactCurrency(value) } },
      },
    }),
  });
}

function mergeDriveFiles(existing, additions) {
  const byId = new Map((existing || []).map((file) => [file.id, file]));
  (additions || []).forEach((file) => byId.set(file.id, file));
  return Array.from(byId.values());
}

function renderNubankMonthlyChart() {
  const invoices = getEffectiveRecords({ includeProofs: false }).filter((record) => record.sourceRuleId === "nubankInvoice");
  const months = Array.from(new Set(invoices.map((invoice) => invoice.monthKey).filter(Boolean))).sort();
  const labels = months.length ? months.map(formatMonthShort) : ["Sem dados"];
  const invoiceValues = months.length
    ? months.map((month) => sum(invoices.filter((invoice) => invoice.monthKey === month), "amount"))
    : [0];
  const paidValues = months.length
    ? months.map((month) => sum(invoices.filter((invoice) => invoice.monthKey === month && invoice.status === "paid"), "amount"))
    : [0];

  if (state.charts.nubankDaily) state.charts.nubankDaily.destroy();
  state.charts.nubankDaily = new window.Chart(els.nubankDailyChart, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          type: "bar",
          label: "Valor da fatura",
          data: invoiceValues,
          backgroundColor: "rgba(130, 10, 209, 0.28)",
          borderColor: "#820ad1",
          borderWidth: 1,
          borderRadius: 6,
        },
        {
          type: "line",
          label: "Valor pago",
          data: paidValues,
          borderColor: "#b24bf3",
          backgroundColor: "#b24bf3",
          borderWidth: 3,
          tension: 0.3,
          pointRadius: 4,
        },
      ],
    },
    options: chartBaseOptions({
      onClick: (event, elements, chart) => {
        const points = elements.length
          ? elements
          : chart.getElementsAtEventForMode(event, "nearest", { intersect: false }, true);
        const point = points[0];
        if (point && months[point.index]) selectMonth(months[point.index]);
      },
      onHover: (event, elements) => {
        if (event.native?.target) event.native.target.style.cursor = months.length && (elements || []).length ? "pointer" : "default";
      },
      scales: {
        y: { ticks: { callback: (value) => formatCompactCurrency(value) } },
      },
    }),
  });
}

function renderNubankCategoryChart(transactions) {
  const categories = aggregateNubankTransactions(transactions, "category");
  const labels = categories.length ? categories.map((item) => item.label) : ["Sem dados"];
  const values = categories.length ? categories.map((item) => item.total) : [1];
  if (state.charts.nubankCategory) state.charts.nubankCategory.destroy();
  state.charts.nubankCategory = new window.Chart(els.nubankCategoryChart, {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: labels.map((_, index) => (categories.length ? NUBANK_COLOR_SET[index % NUBANK_COLOR_SET.length] : "#e5d8ee")),
          borderColor: themeColor("--surface", "#ffffff"),
          borderWidth: 3,
        },
      ],
    },
    options: chartBaseOptions({
      scales: null,
      cutout: "64%",
      plugins: {
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.label}: ${categories.length ? formatCurrency(ctx.raw) : "R$ 0,00"}`,
          },
        },
      },
    }),
  });
}

function chartBaseOptions(extra = {}) {
  const mobile = window.matchMedia("(max-width: 760px)").matches;
  const tickColor = themeColor("--muted", "#64736d");
  const gridColor = themeColor("--line", "rgba(100, 115, 109, 0.16)");
  const baseScales = {
    x: {
      grid: { display: false },
      ticks: {
        color: tickColor,
        font: { weight: 700, size: mobile ? 10 : 12 },
        autoSkip: true,
        maxTicksLimit: mobile ? 6 : 12,
        maxRotation: 0,
        minRotation: 0,
      },
    },
    y: {
      beginAtZero: true,
      grid: { color: gridColor },
      ticks: { color: tickColor, font: { size: mobile ? 10 : 12 }, maxTicksLimit: mobile ? 6 : 11 },
    },
  };
  const mergedScales =
    extra.scales === null
      ? null
      : {
          x: {
            ...baseScales.x,
            ...(extra.scales?.x || {}),
            grid: { ...baseScales.x.grid, ...(extra.scales?.x?.grid || {}) },
            ticks: { ...baseScales.x.ticks, ...(extra.scales?.x?.ticks || {}) },
          },
          y: {
            ...baseScales.y,
            ...(extra.scales?.y || {}),
            grid: { ...baseScales.y.grid, ...(extra.scales?.y?.grid || {}) },
            ticks: { ...baseScales.y.ticks, ...(extra.scales?.y?.ticks || {}) },
          },
        };

  const base = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          boxWidth: 12,
          boxHeight: 12,
          usePointStyle: true,
          color: tickColor,
          font: { weight: 700, size: mobile ? 10 : 12 },
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset?.label || ctx.label}: ${formatCurrency(ctx.raw)}`,
        },
      },
    },
    scales: mergedScales,
    ...extra,
    scales: mergedScales,
    plugins: {
      ...{
        legend: {
          position: "bottom",
          labels: {
            boxWidth: 12,
            boxHeight: 12,
            usePointStyle: true,
            color: tickColor,
            font: { weight: 700, size: mobile ? 10 : 12 },
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset?.label || ctx.label}: ${formatCurrency(ctx.raw)}`,
          },
        },
      },
      ...(extra.plugins || {}),
    },
  };

  if (extra.scales === null) {
    delete base.scales;
  }

  return base;
}

function renderSearchSuggestions() {
  if (!els.recordSuggestions && !els.universalSuggestions) return;
  const records = getEffectiveRecords({ includeProofs: true }).sort((a, b) => {
    return (b.monthKey || "").localeCompare(a.monthKey || "") || sortRecords(a, b);
  });
  const options = [];
  const seen = new Set();

  records.forEach((record) => {
    const month = formatMonth(record.monthKey);
    const amount = formatRecordAmount(record);
    const displayName = getRecordDisplayName(record);
    addSearchOption(options, seen, `${displayName} · ${record.provider} · ${amount} · ${month}`, record);
    addSearchOption(options, seen, `${record.provider} · ${displayName} · ${month}`, record);
    addSearchOption(options, seen, `${month} · ${displayName} · ${amount}`, record);
    if (record.amount > 0) {
      addSearchOption(options, seen, `${formatNumberInput(record.amount)} · ${displayName} · ${month}`, record);
      addSearchOption(options, seen, `${amount} · ${displayName} · ${month}`, record);
    }
    (record.cnpjs || []).forEach((cnpj) => addSearchOption(options, seen, `${formatCnpj(cnpj)} · ${displayName} · ${month}`, record));
    (record.sources || []).forEach((source) => {
      addSearchOption(options, seen, `${source.title || source.label} · ${displayName} · ${month}`, record);
    });
    (record.attachments || []).forEach((attachment) => {
      addSearchOption(options, seen, `${attachment.fileName} · ${displayName} · ${month}`, record);
    });
  });

  state.searchOptions = options;
  updateSearchSuggestions(els.searchInput, els.recordSuggestions, { scope: "current" });
  updateSearchSuggestions(els.universalSearchInput, els.universalSuggestions, { scope: "all" });
}

function addSearchOption(options, seen, value, record) {
  const normalizedValue = String(value || "").replace(/\s+/g, " ").trim();
  if (!normalizedValue) return;
  const key = `${record.id}-${normalizeText(normalizedValue)}`;
  if (seen.has(key)) return;
  seen.add(key);
  options.push({ value: normalizedValue, recordId: record.id, record });
}

function updateSearchSuggestions(input, datalist, { scope = "all" } = {}) {
  if (!input || !datalist) return;
  const searchValue = String(input.value || "").trim();
  if (!searchValue) {
    datalist.innerHTML = "";
    return;
  }

  const matches = getAutocompleteMatches(searchValue, { scope });
  datalist.innerHTML = matches
    .map((option) => `<option value="${escapeAttribute(option.value)}" data-record-id="${escapeAttribute(option.recordId)}"></option>`)
    .join("");
}

function getAutocompleteMatches(value, { scope = "all", exact = false, limit = AUTOCOMPLETE_LIMIT } = {}) {
  const searchValue = String(value || "").trim();
  if (!searchValue) return [];
  const needle = normalizeText(searchValue);
  const digits = onlyDigits(searchValue);
  if (!needle && !digits) return [];

  return state.searchOptions
    .filter((option) => option.record && recordMatchesAutocompleteScope(option.record, scope))
    .map((option) => ({ option, score: scoreSearchOption(option, needle, digits, searchValue) }))
    .filter((item) => (exact ? item.option.value === searchValue : item.score > 0))
    .sort((a, b) => {
      return (
        b.score - a.score ||
        (b.option.record.monthKey || "").localeCompare(a.option.record.monthKey || "") ||
        a.option.value.length - b.option.value.length
      );
    })
    .slice(0, limit)
    .map((item) => item.option);
}

function recordMatchesAutocompleteScope(record, scope) {
  if (scope !== "current") return true;
  if (record.monthKey !== state.selectedMonth) return false;
  if (state.filters.status === "pending-proof") {
    return record.recordType === "bill" && !hasProof(record);
  }
  if (state.filters.status !== "all") {
    return record.status === state.filters.status;
  }
  return true;
}

function scoreSearchOption(option, needle, digits, originalValue) {
  const optionText = normalizeText(option.value);
  let score = scoreSearchRecord(option.record, needle, digits);

  if (needle && optionText === needle) score += 50;
  else if (needle && optionText.startsWith(needle)) score += 16;
  else if (needle && optionText.includes(needle)) score += 9;

  const optionDigits = onlyDigits(option.value);
  if (digits && optionDigits.includes(digits)) score += optionDigits === onlyDigits(originalValue) ? 20 : 10;

  return score;
}

function openSearchMatch(value, { fallbackToBest = false, input = els.searchInput, scope = "all" } = {}) {
  const searchValue = String(value || "").trim();
  if (!searchValue) return;
  const exactOption = getAutocompleteMatches(searchValue, { scope, exact: true, limit: 1 })[0];
  const record = exactOption
    ? getEffectiveRecords({ includeProofs: true }).find((item) => item.id === exactOption.recordId)
    : fallbackToBest
      ? findBestSearchRecord(searchValue, { scope })
      : null;

  if (!record) {
    if (fallbackToBest) showToast("Nenhum registro encontrado para essa busca.");
    return;
  }

  state.selectedMonth = record.monthKey || state.selectedMonth;
  state.filters.search = "";
  state.filters.recordIds = [];
  render();
  input.value = searchValue;
  openDetail(record.id);
}

function findBestSearchRecord(value, { scope = "all" } = {}) {
  const needle = normalizeText(value);
  const digits = onlyDigits(value);
  if (!needle && !digits) return null;
  const ranked = getEffectiveRecords({ includeProofs: true })
    .filter((record) => recordMatchesAutocompleteScope(record, scope))
    .map((record) => ({ record, score: scoreSearchRecord(record, needle, digits) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || (b.record.monthKey || "").localeCompare(a.record.monthKey || ""));
  return ranked[0]?.record || null;
}

function getSearchRecordMatches(value, { scope = "all" } = {}) {
  const needle = normalizeText(value);
  const digits = onlyDigits(value);
  if (!needle && !digits) return [];
  return getEffectiveRecords({ includeProofs: true })
    .filter((record) => recordMatchesAutocompleteScope(record, scope))
    .map((record) => ({ record, score: scoreSearchRecord(record, needle, digits) }))
    .filter((item) => item.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        (b.record.monthKey || "").localeCompare(a.record.monthKey || "") ||
        sortRecords(a.record, b.record),
    )
    .map((item) => item.record);
}

function openSearchResults(value, { scope = "all" } = {}) {
  const searchValue = String(value || "").trim();
  if (!searchValue) return;
  const matches = getSearchRecordMatches(searchValue, { scope });
  if (!matches.length) {
    showToast("Nenhum registro encontrado para essa busca.");
    return;
  }

  els.searchResultsTitle.textContent = `Resultados para “${searchValue}”`;
  els.searchResultsCaption.textContent = `${matches.length} ${matches.length === 1 ? "registro encontrado" : "registros encontrados"}${scope === "current" ? ` em ${formatMonth(state.selectedMonth)}` : ""}`;
  els.searchResultsList.innerHTML = matches.map(renderSearchResult).join("");
  els.searchResultsList.querySelectorAll("[data-search-result-id]").forEach((button) => {
    button.addEventListener("click", () => openSearchResultDetail(button.dataset.searchResultId));
  });
  els.searchResultsDialog.showModal();
  window.lucide?.createIcons();
}

function renderSearchResult(record) {
  const status = record.recordType === "proof" ? "proof" : record.status;
  const statusLabel = record.recordType === "proof" ? "Comprovante" : STATUS_LABELS[record.status] || record.status;
  return `
    <button class="search-result-row" type="button" data-search-result-id="${escapeAttribute(record.id)}">
      <div class="search-result-main">
        <strong>${escapeHtml(getRecordDisplayName(record))}</strong>
        <span>${escapeHtml(record.provider)} · ${escapeHtml(formatMonth(record.monthKey))} · ${escapeHtml(record.category)}</span>
      </div>
      <div class="search-result-meta">
        <strong>${escapeHtml(formatRecordAmount(record))}</strong>
        <span class="pill ${escapeAttribute(status)}">${escapeHtml(statusLabel)}</span>
        <small>${escapeHtml(formatSourceTypes(record.sourceTypes))}</small>
      </div>
      <i data-lucide="chevron-right"></i>
    </button>
  `;
}

function openSearchResultDetail(recordId) {
  const record = getEffectiveRecords({ includeProofs: true }).find((item) => item.id === recordId);
  if (!record) return;
  els.searchResultsDialog.close();
  state.selectedMonth = record.monthKey || state.selectedMonth;
  state.filters.recordIds = [];
  render();
  openDetail(record.id);
}

function openAllRecords() {
  const categoryOptions = ["all", ...CATEGORIES]
    .map((category) => `<option value="${escapeAttribute(category)}">${category === "all" ? "Todas" : escapeHtml(category)}</option>`)
    .join("");
  els.allRecordsCategoryFilter.innerHTML = categoryOptions;
  els.allRecordsSearchInput.value = state.allRecordsFilters.search;
  els.allRecordsTypeFilter.value = state.allRecordsFilters.type;
  els.allRecordsStatusFilter.value = state.allRecordsFilters.status;
  els.allRecordsCategoryFilter.value = state.allRecordsFilters.category;
  els.allRecordsSort.value = state.allRecordsFilters.sort;
  els.allRecordsDirection.value = state.allRecordsFilters.direction;
  state.selectedAllRecordIds = [];
  renderAllRecords();
  els.allRecordsDialog.showModal();
  window.lucide?.createIcons();
}

function renderAllRecords() {
  if (!els.allRecordsBody) return;
  state.allRecordsFilters = {
    search: els.allRecordsSearchInput.value.trim(),
    type: els.allRecordsTypeFilter.value,
    status: els.allRecordsStatusFilter.value,
    category: els.allRecordsCategoryFilter.value,
    sort: els.allRecordsSort.value,
    direction: els.allRecordsDirection.value,
  };
  const needle = normalizeText(state.allRecordsFilters.search);
  const digits = onlyDigits(state.allRecordsFilters.search);
  const records = getEffectiveRecords({ includeProofs: true })
    .filter((record) => state.allRecordsFilters.type === "all" || record.recordType === state.allRecordsFilters.type)
    .filter((record) => state.allRecordsFilters.status === "all" || record.status === state.allRecordsFilters.status)
    .filter((record) => state.allRecordsFilters.category === "all" || record.category === state.allRecordsFilters.category)
    .filter((record) => !needle || recordSearchHaystack(record).includes(needle) || Boolean(digits && recordNumericHaystack(record).includes(digits)))
    .sort(compareAllRecords);

  els.allRecordsCaption.textContent = `${records.length} ${records.length === 1 ? "registro encontrado" : "registros encontrados"} em todas as competências`;
  els.allRecordsBody.innerHTML = records.map(renderAllRecordRow).join("");
  els.allRecordsEmpty.hidden = records.length > 0;
  els.allRecordsBody.querySelectorAll("tr[data-id]").forEach((row) => {
    row.addEventListener("click", (event) => {
      if (event.target.closest("input, button, a, label")) return;
      const record = getEffectiveRecords({ includeProofs: true }).find((item) => item.id === row.dataset.id);
      if (!record) return;
      els.allRecordsDialog.close();
      state.selectedMonth = record.monthKey || state.selectedMonth;
      render();
      openDetail(record.id);
    });
  });
  els.allRecordsBody.querySelectorAll("[data-select-record]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => toggleSelectedRecord(checkbox.dataset.selectRecord, checkbox.checked));
  });
  updateAllRecordsSelectionControls(records);
  window.lucide?.createIcons();
}

function toggleSelectedRecord(recordId, selected) {
  const selectedIds = new Set(state.selectedAllRecordIds);
  if (selected) selectedIds.add(recordId);
  else selectedIds.delete(recordId);
  state.selectedAllRecordIds = Array.from(selectedIds);
  renderAllRecords();
}

function toggleAllVisibleRecords() {
  const visibleIds = Array.from(els.allRecordsBody.querySelectorAll("tr[data-id]"), (row) => row.dataset.id);
  const selectedIds = new Set(state.selectedAllRecordIds);
  if (els.allRecordsSelectVisible.checked) visibleIds.forEach((id) => selectedIds.add(id));
  else visibleIds.forEach((id) => selectedIds.delete(id));
  state.selectedAllRecordIds = Array.from(selectedIds);
  renderAllRecords();
}

function updateAllRecordsSelectionControls(visibleRecords) {
  const selectedIds = new Set(state.selectedAllRecordIds);
  const visibleIds = visibleRecords.map((record) => record.id);
  const selectedVisibleCount = visibleIds.filter((id) => selectedIds.has(id)).length;
  els.allRecordsSelectVisible.checked = Boolean(visibleIds.length && selectedVisibleCount === visibleIds.length);
  els.allRecordsSelectVisible.indeterminate = selectedVisibleCount > 0 && selectedVisibleCount < visibleIds.length;
  els.allRecordsSelectVisible.disabled = !visibleIds.length;
  els.allRecordsSelectionCaption.textContent = selectedIds.size
    ? `${selectedIds.size} ${selectedIds.size === 1 ? "registro selecionado" : "registros selecionados"}`
    : "Nenhum registro selecionado";
  els.deleteSelectedRecordsButton.disabled = !selectedIds.size;
}

async function deleteSelectedRecords() {
  const selectedIds = Array.from(new Set(state.selectedAllRecordIds));
  if (!selectedIds.length) return;
  const label = selectedIds.length === 1 ? "o registro selecionado" : `os ${selectedIds.length} registros selecionados`;
  if (!window.confirm(`Excluir ${label}? A exclusão será mantida nas próximas sincronizações.`)) return;

  els.deleteSelectedRecordsButton.disabled = true;
  try {
    const deletedAt = new Date().toISOString();
    selectedIds.forEach((recordId) => {
      state.overrides[recordId] = {
        ...(state.overrides[recordId] || {}),
        deleted: true,
        deletedAt,
      };
    });
    state.records = state.records.filter((record) => !selectedIds.includes(record.id));
    state.selectedAllRecordIds = [];
    writeJSON(RECORDS_KEY, state.records);
    writeJSON(OVERRIDES_KEY, state.overrides);
    await Promise.all([
      deleteRecordsFromFirebase(selectedIds),
      ...selectedIds.map((recordId) => persistOverrideToFirebase(recordId, state.overrides[recordId])),
    ]);
    render();
    renderAllRecords();
    showToast(`${selectedIds.length} ${selectedIds.length === 1 ? "registro excluído" : "registros excluídos"}.`);
  } catch (error) {
    showToast(`Não foi possível excluir os registros: ${error.message}`);
  } finally {
    els.deleteSelectedRecordsButton.disabled = !state.selectedAllRecordIds.length;
  }
}

function compareAllRecords(a, b) {
  const direction = state.allRecordsFilters.direction === "asc" ? 1 : -1;
  const statusWeight = { overdue: 0, open: 1, "needs-review": 2, paid: 3 };
  const comparisons = {
    month: () => (a.monthKey || "").localeCompare(b.monthKey || ""),
    dueDate: () => (a.dueDate || "").localeCompare(b.dueDate || ""),
    amount: () => Number(a.amount || 0) - Number(b.amount || 0),
    name: () => getRecordDisplayName(a).localeCompare(getRecordDisplayName(b), "pt-BR"),
    status: () => (statusWeight[a.status] ?? 4) - (statusWeight[b.status] ?? 4),
    category: () => String(a.category || "").localeCompare(String(b.category || ""), "pt-BR"),
  };
  return direction * (comparisons[state.allRecordsFilters.sort]?.() || 0) || sortRecords(a, b);
}

function renderAllRecordRow(record) {
  const status = record.recordType === "proof" ? "proof" : record.status;
  const statusLabel = record.recordType === "proof" ? "Comprovante" : STATUS_LABELS[record.status] || record.status;
  return `
    <tr data-id="${escapeAttribute(record.id)}" class="${state.selectedAllRecordIds.includes(record.id) ? "is-selected" : ""}">
      <td data-label="Selecionar" class="record-selection-cell">
        <input type="checkbox" data-select-record="${escapeAttribute(record.id)}" aria-label="Selecionar ${escapeAttribute(getRecordDisplayName(record))}" ${state.selectedAllRecordIds.includes(record.id) ? "checked" : ""} />
      </td>
      <td data-label="Registro" title="${escapeAttribute(getRecordDisplayName(record))}">
        <strong>${escapeHtml(getRecordDisplayName(record))}</strong>
        <small>${escapeHtml(record.provider || "")}</small>
      </td>
      <td data-label="Competência">${escapeHtml(formatMonth(record.monthKey))}</td>
      <td data-label="Categoria">${escapeHtml(record.category)}</td>
      <td data-label="Vencimento">${escapeHtml(formatDate(record.dueDate))}</td>
      <td data-label="Status"><span class="pill ${escapeAttribute(status)}">${escapeHtml(statusLabel)}</span></td>
      <td data-label="Valor" class="numeric">${escapeHtml(formatRecordAmount(record))}</td>
      <td data-label="Fonte">${escapeHtml(formatSourceTypes(record.sourceTypes))}</td>
    </tr>
  `;
}

function scoreSearchRecord(record, needle, digits = "") {
  if (!needle && !digits) return 0;
  const haystack = recordSearchHaystack(record);
  let score = needle && haystack.includes(needle) ? 2 : 0;
  if (needle && normalizeText(record.title).includes(needle)) score += 4;
  if (needle && normalizeText(getRecordDisplayName(record)).includes(needle)) score += 6;
  if (needle && normalizeText(record.provider).includes(needle)) score += 3;
  if (record.amount > 0) {
    const amountTexts = [formatCurrency(record.amount), formatNumberInput(record.amount), String(record.amount)];
    if (needle && amountTexts.some((amount) => normalizeText(amount).includes(needle))) score += 5;
  }
  if (digits && recordNumericHaystack(record).includes(digits)) score += 8;
  if (needle && normalizeText(formatMonth(record.monthKey)).includes(needle)) score += 1;
  return score;
}

function recordSearchHaystack(record) {
  return normalizeText([
    record.title,
    getRecordDisplayName(record),
    record.provider,
    record.category,
    record.evidence,
    hasConfirmedAmount(record) ? formatCurrency(record.amount) : "",
    hasConfirmedAmount(record) ? formatNumberInput(record.amount) : "",
    hasConfirmedAmount(record) ? onlyDigits(formatCurrency(record.amount)) : "",
    record.dueDate,
    formatDate(record.dueDate),
    record.paidDate,
    record.periodKey,
    formatMonth(record.periodKey),
    STATUS_LABELS[record.status] || record.status,
    record.monthKey,
    formatMonth(record.monthKey),
    record.cnpjs?.map(formatCnpj).join(" "),
    record.sources?.map((source) => `${source.title} ${source.label} ${source.url}`).join(" "),
    record.attachments?.map((attachment) => attachment.fileName).join(" "),
  ].join(" "));
}

function recordNumericHaystack(record) {
  return [
    hasConfirmedAmount(record) ? formatCurrency(record.amount) : "",
    hasConfirmedAmount(record) ? formatNumberInput(record.amount) : "",
    hasConfirmedAmount(record) ? String(record.amount) : "",
    record.dueDate,
    record.paidDate,
    record.periodKey,
    record.monthKey,
    record.installment,
    record.cnpjs?.join(" "),
    record.sources?.map((source) => `${source.title} ${source.label} ${source.url}`).join(" "),
    record.attachments?.map((attachment) => attachment.fileName).join(" "),
  ]
    .map(onlyDigits)
    .join(" ");
}

function renderTable() {
  const rows = getMonthRecords({ includeProofs: false }).filter(matchesCurrentFilters).sort(sortRecords);
  els.recordsBody.innerHTML = rows.map(renderRecordRow).join("");
  els.emptyState.hidden = rows.length > 0;
  els.tableCaption.textContent = `${rows.length} ${rows.length === 1 ? "registro" : "registros"} em ${formatMonth(state.selectedMonth)}`;

  els.recordsBody.querySelectorAll("tr[data-id]").forEach((row) => {
    row.addEventListener("click", () => openDetail(row.dataset.id));
  });
  window.lucide?.createIcons();
}

function matchesCurrentFilters(record) {
  if (state.filters.recordIds?.length && !state.filters.recordIds.includes(record.id)) {
    return false;
  }
  if (state.filters.status === "pending-proof") {
    if (record.recordType !== "bill" || hasProof(record)) return false;
  } else if (state.filters.status !== "all" && record.status !== state.filters.status) {
    return false;
  }
  if (!state.filters.search) return true;
  const needle = normalizeText(state.filters.search);
  const digits = onlyDigits(state.filters.search);
  return recordSearchHaystack(record).includes(needle) || Boolean(digits && recordNumericHaystack(record).includes(digits));
}

function sortRecords(a, b) {
  const statusWeight = { overdue: 0, open: 1, "needs-review": 2, paid: 3 };
  if (a.recordType !== b.recordType) return a.recordType === "bill" ? -1 : 1;
  return (statusWeight[a.status] ?? 3) - (statusWeight[b.status] ?? 3) || (a.dueDate || "").localeCompare(b.dueDate || "");
}

function renderRecordRow(record) {
  const sourceLabel = formatSourceTypes(record.sourceTypes);
  const status = record.recordType === "proof" ? "proof" : record.status;
  const amountLabel = formatRecordAmount(record);
  const statusLabel = record.recordType === "proof" ? "Comprovante" : STATUS_LABELS[record.status] || record.status;
  return `
    <tr data-id="${escapeHtml(record.id)}">
      <td data-label="Conta" title="${escapeAttribute(getRecordDisplayName(record))}">${escapeHtml(getRecordDisplayName(record))}</td>
      <td data-label="Categoria">${escapeHtml(record.category)}</td>
      <td data-label="Vencimento">${formatDate(record.dueDate)}</td>
      <td data-label="Status"><span class="pill ${escapeAttribute(status)}">${escapeHtml(statusLabel)}</span></td>
      <td data-label="Valor" class="numeric">${escapeHtml(amountLabel)}</td>
      <td data-label="Fonte">${escapeHtml(sourceLabel)}</td>
    </tr>
  `;
}

function formatSourceTypes(sourceTypes = []) {
  const labels = [];
  if (sourceTypes.includes("manual")) labels.push("Manual");
  if (sourceTypes.includes("gmail")) labels.push("Gmail");
  if (sourceTypes.includes("drive")) labels.push("Drive");
  return labels.join(" + ") || "Fonte";
}

function getRecordDisplayName(record = {}) {
  if (record.sourceRuleId && state.config.displayNames?.[record.sourceRuleId]) {
    return state.config.displayNames[record.sourceRuleId];
  }
  return record.title || record.provider || "Conta";
}

function openDetail(recordId) {
  const record = getEffectiveRecords().find((item) => item.id === recordId);
  if (!record) return;
  state.selectedRecordId = recordId;
  renderDetail(record);
  els.detailDialog.showModal();
}

function renderDetail(record) {
  els.editManualAccountButton.hidden = !isManualRecord(record);
  const statusForBadge = record.recordType === "proof" ? "proof" : record.status;

  els.detailStatus.className = `badge ${statusForBadge}`;
  els.detailStatus.textContent = record.recordType === "proof" ? "Comprovante" : STATUS_LABELS[record.status] || record.status;
  els.detailTitle.textContent = getRecordDisplayName(record);
  els.detailSubtitle.textContent = `${record.provider} · ${formatMonth(record.monthKey)}`;
  els.detailAmount.textContent = formatRecordAmount(record);
  els.detailDueDate.textContent = formatDate(record.dueDate);
  els.detailCategory.textContent = record.category;
  els.detailReconciliation.textContent = formatReconciliationSignals(record);
  els.detailAttachments.innerHTML = renderAttachments(record);
  bindAttachmentActions(record);
  els.detailSources.innerHTML = renderSources(record);
  els.detailEvidence.textContent = record.evidence || "Sem trecho extraído.";
  els.detailProofs.innerHTML = renderProofs(record.sources || []);
  renderDetailActions(record);
  window.lucide?.createIcons();
}

function renderDetailActions(record) {
  // Comprovantes não têm ações de status/categoria.
  const isProof = record.recordType === "proof";
  els.detailActions.hidden = isProof;
  if (isProof) return;

  const isPaid = record.status === "paid";
  els.detailTogglePaidButton.classList.toggle("is-paid", isPaid);
  els.detailTogglePaidButton.innerHTML = `<i data-lucide="${isPaid ? "rotate-ccw" : "check-circle-2"}"></i><span>${isPaid ? "Reabrir conta" : "Marcar como pago"}</span>`;

  const categories = getKnownCategories(record.category);
  els.detailCategorySelect.innerHTML = categories
    .map((category) => `<option value="${escapeAttribute(category)}" ${category === record.category ? "selected" : ""}>${escapeHtml(category)}</option>`)
    .join("");

  const override = state.overrides[record.id] || {};
  const hasManualEdit = Boolean(override.status || override.category || override.dueDate || override.title || override.amountOverride);
  els.detailRevertButton.hidden = !hasManualEdit;
  els.detailOverrideNote.hidden = !hasManualEdit;
}

function getKnownCategories(current) {
  const categories = new Set();
  getEffectiveRecords().forEach((record) => {
    if (record.category) categories.add(record.category);
  });
  state.standardAccounts.forEach((account) => {
    if (account.category) categories.add(account.category);
  });
  if (current) categories.add(current);
  return Array.from(categories).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

async function setRecordOverride(recordId, patch, { message } = {}) {
  const next = { ...(state.overrides[recordId] || {}), ...patch };
  state.overrides[recordId] = next;
  writeJSON(OVERRIDES_KEY, state.overrides);
  render();
  const updated = getEffectiveRecords().find((item) => item.id === recordId);
  if (updated && els.detailDialog.open && state.selectedRecordId === recordId) renderDetail(updated);
  if (message) showToast(message);
  try {
    await persistOverrideToFirebase(recordId, next);
  } catch (error) {
    showToast(`Não foi possível salvar a alteração: ${error.message}`);
  }
}

function toggleDetailPaid() {
  const record = getEffectiveRecords().find((item) => item.id === state.selectedRecordId);
  if (!record) return;
  const markPaid = record.status !== "paid";
  setRecordOverride(record.id, { status: markPaid ? "paid" : "open" }, {
    message: markPaid ? "Conta marcada como paga." : "Conta reaberta.",
  });
}

function changeDetailCategory() {
  const value = els.detailCategorySelect.value;
  const record = getEffectiveRecords().find((item) => item.id === state.selectedRecordId);
  if (!record || !value || value === record.category) return;
  setRecordOverride(record.id, { category: value }, { message: `Categoria alterada para "${value}".` });
}

function revertDetailOverride() {
  const recordId = state.selectedRecordId;
  const existing = state.overrides[recordId];
  if (!existing) return;
  // Mantém apenas a flag de exclusão (se existir); descarta os ajustes de conteúdo.
  if (existing.deleted) {
    state.overrides[recordId] = { deleted: existing.deleted, deletedAt: existing.deletedAt };
  } else {
    delete state.overrides[recordId];
  }
  writeJSON(OVERRIDES_KEY, state.overrides);
  render();
  const updated = getEffectiveRecords().find((item) => item.id === recordId);
  if (updated && els.detailDialog.open) renderDetail(updated);
  showToast("Ajustes revertidos.");
  persistOverrideToFirebase(recordId, state.overrides[recordId] || {}).catch(() => undefined);
}

function renderAttachments(record) {
  const attachments = record.attachments || [];
  if (!attachments.length) return `<p class="evidence">Sem anexos extraídos para este registro.</p>`;
  const fallbackUrl = safeExternalUrl(record.sources?.find((source) => source.url)?.url);
  return attachments
    .map((attachment, index) => {
      const url = safeExternalUrl(attachment.url) || fallbackUrl;
      const title = getAttachmentDisplayName(record, attachment, index);
      const mimeType = normalizeMimeType(title, attachment.mimeType);
      const meta = [formatMimeType(mimeType), attachment.size ? formatBytes(attachment.size) : ""].filter(Boolean).join(" · ");
      const content = `
        <i data-lucide="paperclip"></i>
        <div>
          <strong>${escapeHtml(title)}</strong>
          <span>${escapeHtml(meta || "Anexo da fonte original")}</span>
        </div>
        <span class="attachment-action">Abrir</span>
      `;
      if (attachment.attachmentId) {
        return `<button class="attachment-row" type="button" data-attachment-index="${index}">${content}</button>`;
      }
      return url
        ? `<a class="attachment-row" href="${escapeAttribute(url)}" target="_blank" rel="noopener">${content}</a>`
        : `<div class="attachment-row">${content}</div>`;
    })
    .join("");
}

function bindAttachmentActions(record) {
  els.detailAttachments.querySelectorAll("[data-attachment-index]").forEach((button) => {
    button.addEventListener("click", () => openRecordAttachment(record, Number(button.dataset.attachmentIndex), button));
  });
}

async function openRecordAttachment(record, index, button) {
  const attachment = record.attachments?.[index];
  if (!attachment) return;
  const messageId =
    attachment.messageId ||
    record.sources?.find((source) => source.type === "gmail" && source.id)?.id ||
    (String(record.id || "").startsWith("gmail-") ? String(record.id).slice(6) : "");

  if (!attachment.attachmentId || !messageId) {
    const fallbackUrl = safeExternalUrl(attachment.url) || safeExternalUrl(record.sources?.find((source) => source.url)?.url);
    if (fallbackUrl) window.open(fallbackUrl, "_blank", "noopener");
    return;
  }

  const previewWindow = window.open("about:blank", "_blank");
  if (previewWindow) {
    previewWindow.document.title = attachment.fileName || "Anexo";
    previewWindow.document.body.textContent = "Abrindo anexo...";
  }

  button.disabled = true;
  try {
    await requestGoogleToken();
    const payload = await googleFetch(`gmail/v1/users/me/messages/${messageId}/attachments/${attachment.attachmentId}`);
    const bytes = decodeBase64UrlBytes(payload.data || "");
    const blobUrl = URL.createObjectURL(new Blob([bytes], { type: normalizeMimeType(attachment.fileName, attachment.mimeType) }));

    if (previewWindow) {
      previewWindow.location.href = blobUrl;
    } else {
      window.open(blobUrl, "_blank", "noopener");
    }
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
  } catch (error) {
    previewWindow?.close();
    showToast(`Não foi possível abrir o anexo: ${error.message}`);
  } finally {
    button.disabled = false;
  }
}

function renderSources(record) {
  const sources = normalizeRecordSources(record).filter((source) => !isProofSource(source));
  if (!sources.length) return `<p class="evidence">Sem fonte registrada.</p>`;
  return sources
    .map((source) => {
      const url = safeExternalUrl(source.url);
      return `
        <div class="source-row">
          <div>
            <strong>${escapeHtml(getSourceDisplayName(record, source))}</strong>
            <span>${escapeHtml(source.label)}${source.date ? ` · ${formatDateTime(source.date)}` : ""}</span>
          </div>
          ${url ? `<a href="${escapeAttribute(url)}" target="_blank" rel="noopener">Abrir</a>` : ""}
        </div>
      `;
    })
    .join("");
}

function renderProofs(sources) {
  const proofs = sources.filter(isProofSource);
  if (!proofs.length) return `<p class="evidence">Nenhum comprovante conciliado com esta conta.</p>`;
  return proofs
    .map((source) => {
      const url = safeExternalUrl(source.url);
      const thumbnailUrl = safeExternalUrl(source.thumbnailLink);
      const tag = url ? "a" : "div";
      const linkAttributes = url ? ` href="${escapeAttribute(url)}" target="_blank" rel="noopener"` : "";
      return `
        <${tag} class="proof-card"${linkAttributes}>
          ${thumbnailUrl ? `<img src="${escapeAttribute(thumbnailUrl)}" alt="">` : `<i data-lucide="${source.type === "drive" ? "file-check-2" : "mail-check"}"></i>`}
          <div>
            <strong>${escapeHtml(getProofDisplayName(source))}</strong>
            <span>${escapeHtml(source.label)}${source.date ? ` · ${formatDateTime(source.date)}` : ""}</span>
          </div>
          ${url ? `<span class="attachment-action">Abrir</span>` : ""}
        </${tag}>
      `;
    })
    .join("");
}

function getAttachmentDisplayName(record, attachment, index) {
  if (record?.sourceRuleId === "nubankInvoice") return "Fatura Nubank";
  if (record?.sourceRuleId === "sommaInvoice") return "Boleto Condomínio Solar de Ibiza - Somma";
  if (record?.sourceRuleId === "iptuInvoice") return "Guia IPTU - Porto Alegre";
  if (record?.sourceRuleId === "claroInvoice") return "Fatura Claro";
  return attachment.fileName || `Anexo ${index + 1}`;
}

function getSourceDisplayName(record, source) {
  if (source?.type === "gmail") return `E-mail ${getRecordDisplayName(record)}`;
  if (source?.type === "drive") return `Arquivo ${getRecordDisplayName(record)}`;
  return source?.title || source?.label || "Fonte";
}

function getProofDisplayName(source) {
  const text = normalizeText(`${source?.title || ""} ${source?.label || ""}`);
  if (text.includes("debito automatico")) return "Comprovante pagamento - Débito automático";
  return `Comprovante pagamento${source?.title ? ` - ${source.title}` : ""}`;
}

function isProofSource(source) {
  return /comprovante/i.test(`${source?.label || ""} ${source?.title || ""}`);
}

function exportCurrentCsv() {
  const rows = getMonthRecords({ includeProofs: false }).filter(matchesCurrentFilters).sort(sortRecords);
  const headers = ["id", "mes", "titulo", "categoria", "vencimento", "status", "valor", "fonte", "url"];
  const csvRows = [
    headers.join(","),
    ...rows.map((record) =>
      [
        record.id,
        record.monthKey,
        getRecordDisplayName(record),
        record.category,
        record.dueDate,
        record.status,
        String(record.amount || 0).replace(".", ","),
        record.sourceTypes.join("+"),
        record.sources?.[0]?.url || "",
      ]
        .map(csvCell)
        .join(","),
    ),
  ];
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `contas-${state.selectedMonth}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function getIncomeRatios() {
  const total = state.config.incomes.luis + state.config.incomes.camila;
  if (!total) return { luis: 0.5, camila: 0.5 };
  return {
    luis: state.config.incomes.luis / total,
    camila: state.config.incomes.camila / total,
  };
}

function hasProof(record) {
  return (record.sources || []).some((source) => /comprovante|recibo|pago|pagamento|pix|fatura paga|d[eé]bito autom[aá]tico/i.test(`${source.label} ${source.title}`));
}

function lastMonths(count) {
  const base = state.selectedMonth ? new Date(`${state.selectedMonth}-01T12:00:00`) : new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(base.getFullYear(), base.getMonth() - (count - 1 - index), 1);
    return monthKeyFromDate(toISODate(date));
  });
}

function recentMonths(count) {
  const base = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(base.getFullYear(), base.getMonth() - index, 1);
    return monthKeyFromDate(toISODate(date));
  });
}

function monthKeyFromDate(value) {
  if (!value) return "";
  if (/^\d{4}-\d{2}/.test(value)) return value.slice(0, 7);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function toISODate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatMonth(monthKey) {
  if (!monthKey) return "-";
  const date = new Date(`${monthKey}-01T12:00:00`);
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(date);
}

function formatMonthShort(monthKey) {
  if (!monthKey) return "-";
  const date = new Date(`${monthKey}-01T12:00:00`);
  return new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit" }).format(date);
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return formatDate(value);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatReconciliationSignals(record) {
  const signals = [];
  if (record.cnpjs?.length) signals.push(`CNPJ ${record.cnpjs.map(formatCnpj).join(", ")}`);
  if (record.periodKey) signals.push(`Competência ${formatMonth(record.periodKey)}`);
  if (record.installment) signals.push(`Parcela ${record.installment}`);
  if (record.recurrenceEnabled) signals.push(`Recorrência ${formatRecurrenceInterval(record.recurrenceIntervalMonths).toLowerCase()}`);
  return signals.length ? signals.join(" · ") : "Sem CNPJ/competência/parcela extraídos";
}

function formatRecurrenceInterval(intervalMonths) {
  const labels = {
    1: "Mensal",
    2: "Bimestral",
    3: "Trimestral",
    6: "Semestral",
    12: "Anual",
  };
  return labels[Number(intervalMonths)] || `A cada ${Number(intervalMonths) || 1} meses`;
}

function addMonthsToMonthKey(monthKey, months) {
  const date = new Date(`${monthKey}-01T12:00:00`);
  date.setMonth(date.getMonth() + Number(months || 0));
  return monthKeyFromDate(toISODate(date));
}

function dateInMonth(monthKey, day) {
  const [year, month] = String(monthKey || "").split("-").map(Number);
  if (!year || !month) return "";
  const lastDay = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(Math.min(Math.max(Number(day) || 1, 1), lastDay)).padStart(2, "0")}`;
}

function formatCnpj(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length !== 14) return value || "";
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));
}

function formatCompactCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value || 0));
}

function formatPercent(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function formatNumberInput(value) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatBytes(value) {
  const bytes = Number(value || 0);
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1).replace(".", ",")} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

function normalizeMimeType(fileName = "", mimeType = "") {
  const current = String(mimeType || "").toLowerCase();
  if (current && current !== "application/octet-stream") return current;
  if (/\.pdf$/i.test(fileName)) return "application/pdf";
  if (/\.jpe?g$/i.test(fileName)) return "image/jpeg";
  if (/\.png$/i.test(fileName)) return "image/png";
  if (/\.webp$/i.test(fileName)) return "image/webp";
  return current || "application/octet-stream";
}

function formatMimeType(mimeType = "") {
  const labels = {
    "application/pdf": "PDF",
    "image/jpeg": "Imagem JPEG",
    "image/png": "Imagem PNG",
    "image/webp": "Imagem WebP",
    "application/octet-stream": "Arquivo",
  };
  return labels[mimeType] || mimeType || "Arquivo";
}

function parseCurrencyInput(value) {
  if (typeof value === "number") return roundCurrency(value);
  const source = String(value || "").trim();
  const trailingNegative = /[-−–]\s*$/.test(source);
  const normalized = source
    .replace(/[^\d,.-]/g, "")
    .replace(/-+$/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");
  const parsed = Number(`${trailingNegative && !normalized.startsWith("-") ? "-" : ""}${normalized}`);
  return Number.isFinite(parsed) ? roundCurrency(parsed) : NaN;
}

function formatSignedCurrency(value) {
  const amount = roundCurrency(value);
  if (Math.abs(amount) < 0.01) return formatCurrency(0);
  return `${amount > 0 ? "+" : "−"} ${formatCurrency(Math.abs(amount))}`;
}

function parseNonNegativeCurrencyInput(value, fallback) {
  const parsed = parseCurrencyInput(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function isValidJsonObject(value) {
  try {
    const parsed = JSON.parse(value);
    return Boolean(parsed && typeof parsed === "object" && !Array.isArray(parsed));
  } catch {
    return false;
  }
}

function roundCurrency(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function sum(items, field) {
  return items.reduce((total, item) => total + Number(item[field] || 0), 0);
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

function safeExternalUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
  } catch {
    return "";
  }
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.hidden = false;
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => {
    els.toast.hidden = true;
  }, 5200);
}
