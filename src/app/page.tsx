"use client";

import {
  ArrowDownLeft, ArrowLeft, ArrowRight, ArrowUpRight, BarChart3, CalendarDays, Check,
  ChevronDown, CircleHelp, CreditCard, Download, Eye, EyeOff, LayoutDashboard, LogOut,
  Menu, Plus, Search, Settings2, ShieldCheck, Sparkles, Trash2, TrendingUp, Wallet, X,
} from "lucide-react";
import {
  Cell, Pie, PieChart, ResponsiveContainer, Tooltip,
} from "recharts";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Category = { id: string; name: string; icon: string; type: "income" | "expense"; isCustom: boolean };
type Transaction = {
  id: string; type: "income" | "expense"; amount: number; savings: number; date: string;
  description: string | null; category: Category;
};
type User = { id: string; email: string };
type Tab = "overview" | "transactions" | "categories";
type Notice = { kind: "error" | "success"; message: string };

const euro = new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" });
const monthName = new Intl.DateTimeFormat("pt-PT", { month: "long", year: "numeric" });
const dateFormat = new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: "short", year: "numeric" });
const colors = ["#7656e8", "#39b994", "#f4a65b", "#ef7380", "#56a6db", "#d292d4", "#a5b367", "#f0cc63"];
const icons = ["💼", "🏦", "💶", "✨", "🥑", "🏠", "🚆", "🎉", "💊", "🛍️", "🧾", "📦", "🐾", "🎓", "☕", "✈️", "🎁", "💻"];

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Ocorreu um erro inesperado.");
  return data as T;
}

function Avatar({ email }: { email: string }) {
  return <div className="avatar">{email.slice(0, 1).toUpperCase()}</div>;
}

function AuthScreen({ onLogin }: { onLogin: (user: User) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await api<{ user: User }>(`/api/auth/${mode}`, {
        method: "POST", body: JSON.stringify({ email, password }),
      });
      onLogin(result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível entrar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-showcase">
        <a className="brand brand-light" href="#"><span className="brand-mark"><Wallet size={19} /></span> contas<span className="brand-dot">.</span></a>
        <div className="showcase-copy">
          <span className="eyebrow light-eyebrow"><Sparkles size={14} /> FINANÇAS, SEM COMPLICAÇÕES</span>
          <h1>O teu dinheiro.<br /><span>Mais claro.</span></h1>
          <p>Uma relação mais tranquila com as tuas finanças começa por saber para onde vai cada euro.</p>
          <div className="showcase-note"><span className="note-icon"><ShieldCheck size={19} /></span><span><strong>Os teus dados são teus.</strong><small>Privados, seguros e só para ti.</small></span></div>
        </div>
        <div className="showcase-art" aria-hidden="true">
          <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
          <div className="art-card"><div className="art-card-top"><span>Saldo disponível</span><span className="art-dots">•••</span></div><strong>2 840,50 €</strong><div className="art-card-bottom"><span>↗ 12,8%</span><span>este mês</span></div></div>
          <div className="art-spark spark-a">✳</div><div className="art-spark spark-b">✳</div>
        </div>
        <span className="auth-footnote">FEITO PARA A TUA VIDA REAL&nbsp; · &nbsp;EM EUROS, SEMPRE</span>
      </section>
      <section className="auth-panel">
        <div className="auth-form-wrap">
          <div className="auth-mobile-brand"><a className="brand" href="#"><span className="brand-mark"><Wallet size={19} /></span> contas<span className="brand-dot">.</span></a></div>
          <span className="eyebrow">BEM-VINDO/A DE VOLTA</span>
          <h2>{mode === "login" ? "Olá outra vez." : "Vamos começar."}</h2>
          <p className="auth-subtitle">{mode === "login" ? "Entra na tua conta e retoma o controlo." : "Cria a tua conta e começa a simplificar."}</p>
          <form className="auth-form" onSubmit={submit}>
            <label>Email<input type="email" autoComplete="email" placeholder="tu@email.pt" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
            <label>Palavra-passe<div className="password-wrap"><input type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="Mínimo de 8 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} minLength={mode === "register" ? 8 : undefined} required /><button type="button" className="password-toggle" aria-label="Mostrar ou ocultar palavra-passe" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
            {error && <div className="inline-error">{error}</div>}
            <button className="button button-primary auth-submit" type="submit" disabled={busy}>{busy ? "A processar..." : mode === "login" ? "Entrar na minha conta" : "Criar conta"}<ArrowRight size={17} /></button>
          </form>
          <div className="auth-switch">{mode === "login" ? "Ainda não tens conta?" : "Já tens uma conta?"} <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>{mode === "login" ? "Criar conta" : "Iniciar sessão"}</button></div>
          <div className="auth-privacy"><ShieldCheck size={15} /> Os teus dados financeiros nunca são partilhados.</div>
        </div>
      </section>
    </main>
  );
}

function AppModal({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onClose]);
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-heading"><div><h2 id="modal-title">{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="icon-button" onClick={onClose} aria-label="Fechar"><X size={19} /></button></div>{children}</section></div>;
}

function TransactionForm({ categories, onClose, onSaved }: { categories: Category[]; onClose: () => void; onSaved: () => void }) {
  const [type, setType] = useState<"expense" | "income">("expense");
  const today = new Date();
  const [date, setDate] = useState(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`);
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [savings, setSavings] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const options = categories.filter((category) => category.type === type);

  useEffect(() => { if (!options.some((category) => category.id === categoryId)) setCategoryId(options[0]?.id || ""); }, [type, categories, categoryId, options]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/transactions", { method: "POST", body: JSON.stringify({ type, date: new Date(`${date}T12:00:00`).toISOString(), categoryId, amount, savings: type === "income" ? savings || 0 : 0, description }) });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível guardar.");
    } finally {
      setBusy(false);
    }
  }

  return <AppModal title="Nova transação" subtitle="Cada pequeno registo ajuda-te a ver o todo." onClose={onClose}>
    <form className="modal-form" onSubmit={submit}>
      <div className="segmented"><button type="button" className={type === "expense" ? "selected expense-selected" : ""} onClick={() => setType("expense")}><ArrowUpRight size={16} /> Despesa</button><button type="button" className={type === "income" ? "selected income-selected" : ""} onClick={() => setType("income")}><ArrowDownLeft size={16} /> Receita</button></div>
      <label>Valor<div className="amount-input"><input inputMode="decimal" type="number" min="0.01" step="0.01" placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} required /><span>€</span></div></label>
      <div className="form-row"><label>Categoria<select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>{options.map((category) => <option key={category.id} value={category.id}>{category.icon} &nbsp;{category.name}</option>)}</select></label><label>Data<input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></label></div>
      {type === "income" && <label>Poupança desta receita <span className="optional">(opcional)</span><div className="amount-input"><input inputMode="decimal" type="number" min="0" step="0.01" placeholder="0,00" value={savings} onChange={(e) => setSavings(e.target.value)} /><span>€</span></div><span className="field-hint">Valor que queres reservar desta receita.</span></label>}
      <label>Nota <span className="optional">(opcional)</span><input maxLength={240} placeholder="Ex.: compras da semana" value={description} onChange={(e) => setDescription(e.target.value)} /></label>
      {error && <div className="inline-error">{error}</div>}
      <button className="button button-primary modal-submit" disabled={busy || !categoryId}>{busy ? "A guardar..." : "Guardar transação"}<Check size={17} /></button>
    </form>
  </AppModal>;
}

function CategoryForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [icon, setIcon] = useState("✨");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await api("/api/categories", { method: "POST", body: JSON.stringify({ name, type, icon }) });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar a categoria.");
    } finally {
      setBusy(false);
    }
  }
  return <AppModal title="Nova categoria" subtitle="Dá um nome e escolhe o ícone que a representa." onClose={onClose}><form className="modal-form" onSubmit={submit}><div className="segmented"><button type="button" className={type === "expense" ? "selected expense-selected" : ""} onClick={() => setType("expense")}><ArrowUpRight size={16} /> Despesa</button><button type="button" className={type === "income" ? "selected income-selected" : ""} onClick={() => setType("income")}><ArrowDownLeft size={16} /> Receita</button></div><label>Nome da categoria<input maxLength={40} placeholder="Ex.: Formação" value={name} onChange={(e) => setName(e.target.value)} required /></label><fieldset className="emoji-field"><legend>Escolhe um ícone</legend><div className="emoji-grid">{icons.map((item) => <button type="button" aria-label={`Escolher ${item}`} aria-pressed={icon === item} className={icon === item ? "emoji-choice active" : "emoji-choice"} key={item} onClick={() => setIcon(item)}>{item}</button>)}</div></fieldset>{error && <div className="inline-error">{error}</div>}<button className="button button-primary modal-submit" disabled={busy}>{busy ? "A criar..." : "Criar categoria"}<Check size={17} /></button></form></AppModal>;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [modal, setModal] = useState<"transaction" | "category" | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileNav, setMobileNav] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");

  const start = useMemo(() => new Date(month.getFullYear(), month.getMonth(), 1), [month]);
  const end = useMemo(() => new Date(month.getFullYear(), month.getMonth() + 1, 1), [month]);
  const monthTransactions = useMemo(() => transactions.filter((item) => {
    const date = new Date(item.date);
    return date >= start && date < end;
  }), [transactions, start, end]);
  const income = monthTransactions.filter((item) => item.type === "income").reduce((total, item) => total + item.amount, 0);
  const expenses = monthTransactions.filter((item) => item.type === "expense").reduce((total, item) => total + item.amount, 0);
  const savings = monthTransactions.reduce((total, item) => total + item.savings, 0);
  const balance = income - expenses;
  const expenseGroups = useMemo(() => {
    const groups = new Map<string, { name: string; icon: string; amount: number }>();
    monthTransactions.filter((item) => item.type === "expense").forEach((item) => {
      const group = groups.get(item.category.id) || { name: item.category.name, icon: item.category.icon, amount: 0 };
      group.amount += item.amount;
      groups.set(item.category.id, group);
    });
    return [...groups.values()].sort((a, b) => b.amount - a.amount);
  }, [monthTransactions]);
  const recentTransactions = monthTransactions.slice(0, 5);
  const filteredTransactions = useMemo(() => monthTransactions.filter((item) => (
    (filter === "all" || item.type === filter) &&
    `${item.category.name} ${item.description || ""}`.toLowerCase().includes(query.toLowerCase())
  )), [monthTransactions, filter, query]);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const from = new Date(month.getFullYear(), month.getMonth(), 1).toISOString();
      const to = new Date(month.getFullYear(), month.getMonth() + 1, 1).toISOString();
      const [transactionData, categoryData] = await Promise.all([
        api<{ transactions: Transaction[] }>(`/api/transactions?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
        api<{ categories: Category[] }>("/api/categories"),
      ]);
      setTransactions(transactionData.transactions);
      setCategories(categoryData.categories);
    } catch (err) {
      setNotice({ kind: "error", message: err instanceof Error ? err.message : "Não foi possível carregar os dados." });
    } finally {
      setLoading(false);
    }
  }, [user, month]);

  useEffect(() => {
    api<{ user: User | null }>("/api/auth/me").then((result) => setUser(result.user)).catch(() => setUser(null)).finally(() => setAuthChecked(true));
  }, []);
  useEffect(() => { if (user) void loadData(); }, [user, loadData]);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function changeMonth(amount: number) {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  }
  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    setUser(null);
  }
  async function deleteTransaction(id: string) {
    if (!window.confirm("Queres mesmo eliminar esta transação?")) return;
    try {
      await api(`/api/transactions/${id}`, { method: "DELETE" });
      setNotice({ kind: "success", message: "Transação eliminada." });
      await loadData();
    } catch (err) {
      setNotice({ kind: "error", message: err instanceof Error ? err.message : "Não foi possível eliminar." });
    }
  }
  function exportCsv() {
    const lines = [["Data", "Tipo", "Categoria", "Descrição", "Valor (€)", "Poupança (€)"], ...monthTransactions.map((item) => [new Date(item.date).toLocaleDateString("pt-PT"), item.type === "income" ? "Receita" : "Despesa", item.category.name, item.description || "", item.amount.toFixed(2).replace(".", ","), item.savings.toFixed(2).replace(".", ",")])];
    const csv = "\uFEFF" + lines.map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(";")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    link.download = `contas-${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  if (!authChecked) return <div className="loading-screen"><span className="brand-mark"><Wallet size={19} /></span><span>A preparar o teu espaço...</span></div>;
  if (!user) return <AuthScreen onLogin={setUser} />;

  const renderTransaction = (item: Transaction, removable = false) => (
    <div className="transaction-row" key={item.id}>
      <div className={`transaction-icon ${item.type}`}>{item.category.icon}</div>
      <div className="transaction-description"><strong>{item.description || item.category.name}</strong><span>{item.category.name} <i>·</i> {dateFormat.format(new Date(item.date))}</span></div>
      {item.savings > 0 && <span className="saved-pill">+{euro.format(item.savings)} poupado</span>}
      <strong className={`transaction-amount ${item.type}`}>{item.type === "income" ? "+" : "−"}{euro.format(item.amount)}</strong>
      {removable && <button className="icon-button delete-button" aria-label="Eliminar transação" onClick={() => void deleteTransaction(item.id)}><Trash2 size={16} /></button>}
    </div>
  );

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
      <a className="brand sidebar-brand" href="#"><span className="brand-mark"><Wallet size={19} /></span> contas<span className="brand-dot">.</span></a>
      <div className="workspace-label">ESPAÇO PESSOAL</div>
      <nav className="main-nav" aria-label="Navegação principal">
        <button className={tab === "overview" ? "nav-link active" : "nav-link"} onClick={() => { setTab("overview"); setMobileNav(false); }}><LayoutDashboard size={18} /> Visão geral</button>
        <button className={tab === "transactions" ? "nav-link active" : "nav-link"} onClick={() => { setTab("transactions"); setMobileNav(false); }}><ArrowUpRight size={18} /> Transações</button>
        <button className={tab === "categories" ? "nav-link active" : "nav-link"} onClick={() => { setTab("categories"); setMobileNav(false); }}><BarChart3 size={18} /> Categorias</button>
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-tip"><span className="tip-icon"><Sparkles size={16} /></span><strong>Pequenos hábitos,<br />grandes mudanças.</strong><p>Regista as tuas despesas para veres o teu progresso crescer.</p></div>
        <button className="user-menu" onClick={() => void logout()}><Avatar email={user.email} /><span className="user-details"><strong>{user.email.split("@")[0]}</strong><small>{user.email}</small></span><LogOut size={16} className="logout-icon" /></button>
      </div>
    </aside>
    {mobileNav && <button className="mobile-scrim" aria-label="Fechar menu" onClick={() => setMobileNav(false)} />}
    <main className="main-area">
      <header className="topbar">
        <button className="mobile-menu icon-button" aria-label="Abrir menu" onClick={() => setMobileNav(true)}><Menu size={20} /></button>
        <div className="breadcrumb"><span>O meu espaço</span><span className="breadcrumb-separator">/</span><strong>{tab === "overview" ? "Visão geral" : tab === "transactions" ? "Transações" : "Categorias"}</strong></div>
        <div className="topbar-right"><span className="privacy-badge"><ShieldCheck size={14} /> Espaço privado</span><Avatar email={user.email} /></div>
      </header>
      <div className="page-content">
        <div className="page-heading">
          <div><span className="eyebrow">{tab === "overview" ? "O TEU RESUMO FINANCEIRO" : tab === "transactions" ? "O TEU HISTÓRICO" : "À TUA MANEIRA"}</span><h1>{tab === "overview" ? <>Bom dia, <span>{user.email.split("@")[0]}.</span></> : tab === "transactions" ? "As tuas transações." : "As tuas categorias."}</h1><p>{tab === "overview" ? "Aqui está o retrato das tuas finanças este mês." : tab === "transactions" ? "Tudo o que entra e sai, num só lugar." : "Organiza o teu dinheiro por categorias."}</p></div>
          <button className="button button-primary" onClick={() => setModal("transaction")}><Plus size={17} /> Nova transação</button>
        </div>
        <div className="toolbar">
          <div className="month-select"><button aria-label="Mês anterior" onClick={() => changeMonth(-1)}><ArrowLeft size={16} /></button><CalendarDays size={16} /><span>{monthName.format(month).replace(/^\p{L}/u, (letter) => letter.toLocaleUpperCase("pt-PT"))}</span><button aria-label="Mês seguinte" onClick={() => changeMonth(1)}><ArrowRight size={16} /></button><input aria-label="Selecionar mês" type="month" value={`${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`} onChange={(event) => { if (event.target.value) { const [year, selectedMonth] = event.target.value.split("-").map(Number); setMonth(new Date(year, selectedMonth - 1, 1)); } }} /></div>
          <button className="button button-secondary export-button" onClick={exportCsv}><Download size={16} /> Exportar</button>
        </div>
        {notice && <div className={`notice ${notice.kind}`}><span>{notice.message}</span><button aria-label="Fechar notificação" onClick={() => setNotice(null)}><X size={16} /></button></div>}
        {tab === "categories" ? <section className="categories-page">
          <div className="section-title-row"><div><h2>As tuas categorias</h2><p>As categorias personalizadas são só tuas.</p></div><button className="button button-secondary" onClick={() => setModal("category")}><Plus size={16} /> Nova categoria</button></div>
          <div className="category-columns">{(["expense", "income"] as const).map((type) => <section className="category-panel" key={type}><div className="category-panel-heading"><h3>{type === "expense" ? "Despesas" : "Receitas"}</h3><span>{categories.filter((item) => item.type === type).length}</span></div>{categories.filter((item) => item.type === type).map((category) => <div className="category-list-item" key={category.id}><span className="category-list-icon">{category.icon}</span><span>{category.name}</span>{category.isCustom && <span className="custom-tag">Personalizada</span>}</div>)}</section>)}</div>
          <div className="category-info"><CircleHelp size={18} /><span><strong>As categorias mantêm tudo organizado.</strong> Escolhe a que melhor descreve cada movimento quando registares uma transação.</span></div>
        </section> : tab === "transactions" ? <section className="transactions-page panel"><div className="section-title-row"><div><h2>Movimentos do mês</h2><p>{monthTransactions.length} {monthTransactions.length === 1 ? "movimento" : "movimentos"} registados</p></div><div className="list-controls"><label className="search-box"><Search size={16} /><input aria-label="Pesquisar transações" placeholder="Pesquisar" value={query} onChange={(e) => setQuery(e.target.value)} /></label><label className="filter-select"><select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} aria-label="Filtrar por tipo"><option value="all">Todos</option><option value="income">Receitas</option><option value="expense">Despesas</option></select><ChevronDown size={14} /></label></div></div><div className="transaction-list">{filteredTransactions.map((item) => renderTransaction(item, true))}{!filteredTransactions.length && <div className="empty-state"><span>🧾</span><strong>Sem transações por aqui.</strong><p>Experimenta outro mês ou regista o teu primeiro movimento.</p><button className="button button-primary" onClick={() => setModal("transaction")}><Plus size={16} /> Nova transação</button></div>}</div></section> : <>
          <section className="summary-grid">
            <article className="summary-card income-card"><div className="summary-top"><span>Receitas</span><span className="summary-icon"><ArrowDownLeft size={17} /></span></div><strong>{euro.format(income)}</strong><div className="summary-bottom"><span className="summary-dot green-dot" /> <span>{monthTransactions.filter((item) => item.type === "income").length} entradas este mês</span></div><div className="card-decoration decoration-green" /></article>
            <article className="summary-card expense-card"><div className="summary-top"><span>Despesas</span><span className="summary-icon"><ArrowUpRight size={17} /></span></div><strong>{euro.format(expenses)}</strong><div className="summary-bottom"><span className="summary-dot orange-dot" /> <span>{monthTransactions.filter((item) => item.type === "expense").length} saídas este mês</span></div><div className="card-decoration decoration-orange" /></article>
            <article className="summary-card balance-card"><div className="summary-top"><span>Saldo do mês</span><span className="summary-icon"><Wallet size={17} /></span></div><strong>{euro.format(balance)}</strong><div className="summary-bottom"><span className={`summary-dot ${balance >= 0 ? "purple-dot" : "orange-dot"}`} /> <span>{balance >= 0 ? "Saldo positivo" : "Saldo negativo"}</span></div><div className="card-decoration decoration-purple" /></article>
            <article className="summary-card savings-card"><div className="summary-top"><span>Poupado</span><span className="summary-icon"><TrendingUp size={17} /></span></div><strong>{euro.format(savings)}</strong><div className="summary-bottom"><span className="summary-dot blue-dot" /> <span>Reservado este mês</span></div><div className="card-decoration decoration-blue" /></article>
          </section>
          <section className="dashboard-grid">
            <article className="panel chart-panel"><div className="panel-heading"><div><h2>Despesas por categoria</h2><p>Onde foi o teu dinheiro</p></div><span className="panel-badge"><span className="summary-dot orange-dot" /> {monthTransactions.filter((item) => item.type === "expense").length} despesas</span></div>
              {expenseGroups.length ? <div className="chart-layout"><div className="donut-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={expenseGroups} dataKey="amount" nameKey="name" innerRadius="70%" outerRadius="94%" paddingAngle={4} stroke="none" cornerRadius={5}>{expenseGroups.map((item, index) => <Cell key={item.name} fill={colors[index % colors.length]} />)}</Pie><Tooltip formatter={(value) => euro.format(Number(value))} contentStyle={{ border: "1px solid #eeedf3", borderRadius: 12, fontSize: 12, boxShadow: "0 8px 24px #25213914" }} /></PieChart></ResponsiveContainer><div className="donut-center"><strong>{euro.format(expenses)}</strong><span>total gasto</span></div></div><div className="legend-list">{expenseGroups.slice(0, 6).map((item, index) => <div className="legend-item" key={item.name}><span className="legend-swatch" style={{ background: colors[index % colors.length] }} /><span className="legend-name">{item.icon} &nbsp;{item.name}</span><strong>{euro.format(item.amount)}</strong></div>)}</div></div> : <div className="chart-empty"><span className="chart-empty-icon"><BarChart3 size={23} /></span><strong>O teu gráfico começa aqui</strong><p>Regista despesas para veres a distribuição por categoria.</p></div>}
            </article>
            <article className="panel recent-panel"><div className="panel-heading"><div><h2>Movimentos recentes</h2><p>Os últimos registos do mês</p></div><button className="text-link" onClick={() => setTab("transactions")}>Ver todos <ArrowRight size={14} /></button></div><div className="transaction-list">{recentTransactions.map((item) => renderTransaction(item))}{!recentTransactions.length && <div className="empty-state compact-empty"><span>🌱</span><strong>O primeiro passo é teu.</strong><p>Regista uma transação para começar.</p></div>}</div></article>
          </section>
          <section className="bottom-insight"><div className="insight-icon"><Sparkles size={19} /></div><div><strong>Um bom mês começa com bons hábitos.</strong><p>Já registaste {monthTransactions.length} {monthTransactions.length === 1 ? "movimento" : "movimentos"} em {monthName.format(month)}. Continua assim — estás no caminho certo.</p></div><button className="insight-action" onClick={() => setModal("transaction")} aria-label="Adicionar movimento"><Plus size={18} /></button></section>
        </>}
        {loading && <div className="loading-indicator"><span /> A atualizar os teus dados...</div>}
        <footer className="page-footer"><span><ShieldCheck size={14} /> Os teus dados estão protegidos e são só teus.</span><span>Feito com cuidado <span className="footer-heart">♥</span> para a tua vida financeira.</span></footer>
      </div>
    </main>
    {modal === "transaction" && <TransactionForm categories={categories} onClose={() => setModal(null)} onSaved={() => { setNotice({ kind: "success", message: "Transação guardada com sucesso." }); void loadData(); }} />}
    {modal === "category" && <CategoryForm onClose={() => setModal(null)} onSaved={() => { setNotice({ kind: "success", message: "Categoria criada com sucesso." }); void loadData(); }} />}
  </div>;
}
