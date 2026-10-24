"use client";

import {
  ArrowDownLeft, ArrowLeft, ArrowRight, ArrowUpRight, BadgeEuro, Banknote, BarChart3,
  BriefcaseBusiness, Brush, BusFront, CalendarDays, CarFront, CarTaxiFront, Cat, Check,
  ChevronDown, CircleHelp, CreditCard, Download, Eye, EyeOff, LayoutDashboard, LogOut,
  Gift, House, Landmark, Martini, Menu, Pencil, PersonStanding, Phone, PiggyBank, Plus,
  Search, Settings2, ShieldCheck, Shirt, ShoppingBasket, Sparkles, Tag, Thermometer, Trash2,
  Utensils, Wallet, X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Cell, Pie, PieChart, ResponsiveContainer,
} from "recharts";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { defaultExpenseCategories } from "@/lib/default-categories";

type Category = { id: string; name: string; icon: string; type: "income" | "expense"; isCustom: boolean; canManage?: boolean; transactionCount?: number };
type Transaction = {
  id: string; type: "income" | "expense"; amount: number; date: string;
  description: string | null; category: Category;
};
type ActivityItem = {
  id: string; type: "income" | "expense"; amount: number; date: string;
  description: string | null; category: Category; source: "transaction" | "savings";
  savingsType?: "deposit" | "withdrawal";
};
type SavingsMovement = {
  id: string; type: "deposit" | "withdrawal"; amount: number; date: string; description: string | null;
};
type SavingsData = {
  period: string; monthlySavingsBalance: number; monthlyAvailableBalance: number; movements: SavingsMovement[];
};
type User = { id: string; name?: string | null; email: string };
type Tab = "overview" | "transactions" | "categories" | "savings";
type Notice = { kind: "error" | "success"; message: string };
type ExpenseGroup = { id: string; name: string; icon: string; amount: number; color: string };

const euro = new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" });
const percentage = new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 1 });
const monthName = new Intl.DateTimeFormat("pt-PT", { month: "long", year: "numeric" });
const dateFormat = new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: "short", year: "numeric" });
const iconComponents: Record<string, LucideIcon> = {
  BadgeEuro, Banknote, BriefcaseBusiness, Brush, BusFront, CarFront, CarTaxiFront, Cat,
  Gift, House, Landmark, Martini, PersonStanding, Phone, PiggyBank, Shirt, ShoppingBasket,
  Sparkles, Tag, Thermometer, Utensils,
};
const expenseCategoryColors = new Map(defaultExpenseCategories.map(({ icon, color }) => [icon, color]));
const icons = Object.keys(iconComponents);

function CategoryMark({ icon, size = 18 }: { icon: string; size?: number }) {
  const Icon = iconComponents[icon] ?? Tag;
  return <Icon size={size} strokeWidth={1.8} aria-hidden="true" />;
}

function categoryColor(icon: string) {
  return expenseCategoryColors.get(icon) ?? "#8E899D";
}

function categoryVisualStyle(icon: string) {
  const color = categoryColor(icon);
  return {
    color,
    backgroundColor: `${color}1A`,
  };
}

function CategoryVisual({ icon, size = 18, className = "" }: { icon: string; size?: number; className?: string }) {
  return <span className={`category-visual ${className}`.trim()} style={categoryVisualStyle(icon)}><CategoryMark icon={icon} size={size} /></span>;
}

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Ocorreu um erro inesperado.");
  return data as T;
}

function Avatar({ name, email }: { name: string; email: string }) {
  return <div className="avatar">{(name || email).slice(0, 1).toUpperCase()}</div>;
}

function AuthScreen({ onLogin }: { onLogin: (user: User) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function switchMode() {
    setMode((current) => current === "login" ? "register" : "login");
    setName("");
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setError("");
    setBusy(false);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await api<{ user: User }>(`/api/auth/${mode}`, {
        method: "POST", body: JSON.stringify({ ...(mode === "register" ? { name } : {}), email, password }),
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
          <span className="eyebrow">{mode === "login" ? "BEM-VINDO/A DE VOLTA" : "A TUA CONTA COMEÇA AQUI"}</span>
          <h2>{mode === "login" ? "Olá outra vez." : "Vamos começar."}</h2>
          <p className="auth-subtitle">{mode === "login" ? "Entra na tua conta e retoma o controlo." : "Cria a tua conta e começa a simplificar."}</p>
          <form className="auth-form" onSubmit={submit}>
            {mode === "register" && <label>Nome<input type="text" autoComplete="name" placeholder="O teu nome" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required /></label>}
            <label>Email<input type="email" autoComplete="email" placeholder="tu@email.pt" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
            <label>Palavra-passe<div className="password-wrap"><input type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="Mínimo de 8 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} minLength={mode === "register" ? 8 : undefined} required /><button type="button" className="password-toggle" aria-label="Mostrar ou ocultar palavra-passe" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
            {error && <div className="inline-error" role="alert">{error}</div>}
            <button className="button button-primary auth-submit" type="submit" disabled={busy}>{busy ? "A processar..." : mode === "login" ? "Entrar na minha conta" : "Criar conta"}<ArrowRight size={17} /></button>
          </form>
          <div className="auth-switch">{mode === "login" ? "Ainda não tens conta?" : "Já tens uma conta?"} <button type="button" onClick={switchMode} disabled={busy}>{mode === "login" ? "Criar conta" : "Iniciar sessão"}</button></div>
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
      await api("/api/transactions", { method: "POST", body: JSON.stringify({ type, date: new Date(`${date}T12:00:00`).toISOString(), categoryId, amount, description }) });
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
      <div className="form-row"><label>Categoria<select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>{options.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label>Data<input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></label></div>
      <label>Nota <span className="optional">(opcional)</span><input maxLength={240} placeholder="Ex.: compras da semana" value={description} onChange={(e) => setDescription(e.target.value)} /></label>
      {error && <div className="inline-error">{error}</div>}
      <button className="button button-primary modal-submit" disabled={busy || !categoryId}>{busy ? "A guardar..." : "Guardar transação"}<Check size={17} /></button>
    </form>
  </AppModal>;
}

function SavingsForm({ initialType, onClose, onSaved }: { initialType: "deposit" | "withdrawal"; onClose: () => void; onSaved: () => void }) {
  const [type, setType] = useState<"deposit" | "withdrawal">(initialType);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const idempotencyKey = useRef("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    idempotencyKey.current ||= crypto.randomUUID();
    try {
      await api("/api/savings", {
        method: "POST",
        body: JSON.stringify({ type, amount, description, idempotencyKey: idempotencyKey.current }),
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível registar a transferência.");
    } finally {
      setBusy(false);
    }
  }

  function resetRequestKey() {
    idempotencyKey.current = "";
  }

  return <AppModal
    title={type === "deposit" ? "Adicionar às poupanças" : "Retirar das poupanças"}
    subtitle="Esta transferência interna não altera as receitas nem as despesas dos teus relatórios."
    onClose={onClose}
  >
    <form className="modal-form" onSubmit={submit}>
      <div className="segmented">
        <button type="button" className={type === "deposit" ? "selected income-selected" : ""} onClick={() => { setType("deposit"); resetRequestKey(); }}><ArrowDownLeft size={16} /> Poupar</button>
        <button type="button" className={type === "withdrawal" ? "selected expense-selected" : ""} onClick={() => { setType("withdrawal"); resetRequestKey(); }}><ArrowUpRight size={16} /> Levantar</button>
      </div>
      <label>Valor<div className="amount-input"><input inputMode="decimal" type="number" min="0.01" step="0.01" placeholder="0,00" value={amount} onChange={(event) => { setAmount(event.target.value); resetRequestKey(); }} required /><span>€</span></div></label>
      <label>Nota <span className="optional">(opcional)</span><input maxLength={240} placeholder={type === "deposit" ? "Ex.: poupança mensal" : "Ex.: levantamento para uma compra"} value={description} onChange={(event) => { setDescription(event.target.value); resetRequestKey(); }} /></label>
      {error && <div className="inline-error">{error}</div>}
      <button className="button button-primary modal-submit" disabled={busy}>{busy ? "A guardar..." : type === "deposit" ? "Adicionar às poupanças" : "Levantar das poupanças"}<Check size={17} /></button>
    </form>
  </AppModal>;
}

function CategoryForm({ category, onClose, onSaved }: { category?: Category; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(category?.name ?? "");
  const [type, setType] = useState<"expense" | "income">(category?.type ?? "expense");
  const [icon, setIcon] = useState(
    category && iconComponents[category.icon] ? category.icon : "Tag",
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(category ? `/api/categories/${category.id}` : "/api/categories", {
        method: category ? "PUT" : "POST",
        body: JSON.stringify({ name, type, icon }),
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar a categoria.");
    } finally {
      setBusy(false);
    }
  }
  return <AppModal title={category ? "Editar categoria" : "Nova categoria"} subtitle="Dá um nome e escolhe o ícone que a representa." onClose={onClose}><form className="modal-form" onSubmit={submit}>{!category && <div className="segmented"><button type="button" className={type === "expense" ? "selected expense-selected" : ""} onClick={() => setType("expense")}><ArrowUpRight size={16} /> Despesa</button><button type="button" className={type === "income" ? "selected income-selected" : ""} onClick={() => setType("income")}><ArrowDownLeft size={16} /> Receita</button></div>}<label>Nome da categoria<input maxLength={40} placeholder="Ex.: Formação" value={name} onChange={(e) => setName(e.target.value)} required /></label><fieldset className="emoji-field"><legend>Escolhe um ícone</legend><div className="emoji-grid">{icons.map((item) => {
    const itemStyle = categoryVisualStyle(item);
    return <button type="button" aria-label={`Escolher ícone ${item}`} aria-pressed={icon === item} className={icon === item ? "emoji-choice active category-visual" : "emoji-choice category-visual"} key={item} onClick={() => setIcon(item)} style={itemStyle}><CategoryMark icon={item} size={20} /></button>;
  })}</div></fieldset>{error && <div className="inline-error">{error}</div>}<button className="button button-primary modal-submit" disabled={busy}>{busy ? "A guardar..." : category ? "Guardar alterações" : "Criar categoria"}<Check size={17} /></button></form></AppModal>;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const loadRequest = useRef(0);
  const [tab, setTab] = useState<Tab>("overview");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [savingsData, setSavingsData] = useState<SavingsData>({ period: "", monthlySavingsBalance: 0, monthlyAvailableBalance: 0, movements: [] });
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [modal, setModal] = useState<"transaction" | "category" | "savings" | null>(null);
  const [savingsInitialType, setSavingsInitialType] = useState<"deposit" | "withdrawal">("deposit");
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [replacementCategoryId, setReplacementCategoryId] = useState("");
  const [deletingCategory, setDeletingCategory] = useState(false);
  const [categoryDeleteError, setCategoryDeleteError] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileNav, setMobileNav] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const [showAllExpenseGroups, setShowAllExpenseGroups] = useState(false);
  const [hoveredExpenseId, setHoveredExpenseId] = useState<string | null>(null);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);

  const start = useMemo(() => new Date(month.getFullYear(), month.getMonth(), 1), [month]);
  const end = useMemo(() => new Date(month.getFullYear(), month.getMonth() + 1, 1), [month]);
  const savingsPeriod = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;
  const savingsPeriodMatches = savingsData.period === savingsPeriod;
  const monthTransactions = useMemo(() => transactions.filter((item) => {
    const date = new Date(item.date);
    return date >= start && date < end;
  }), [transactions, start, end]);
  const monthSavingsMovements = useMemo(() => savingsPeriodMatches ? savingsData.movements.filter((item) => {
    const date = new Date(item.date);
    return date >= start && date < end;
  }) : [], [savingsData.movements, savingsPeriodMatches, start, end]);
  const monthSavingsDeposits = monthSavingsMovements.filter((item) => item.type === "deposit").reduce((total, item) => total + item.amount, 0);
  const monthSavingsWithdrawals = monthSavingsMovements.filter((item) => item.type === "withdrawal").reduce((total, item) => total + item.amount, 0);
  const monthSavingsBalance = savingsPeriodMatches ? savingsData.monthlySavingsBalance : 0;
  const monthlyAvailableBalance = savingsPeriodMatches ? savingsData.monthlyAvailableBalance : 0;
  const income = monthTransactions.filter((item) => item.type === "income").reduce((total, item) => total + item.amount, 0);
  const expenses = monthTransactions.filter((item) => item.type === "expense").reduce((total, item) => total + item.amount, 0);
  const balance = income - expenses - monthSavingsBalance;
  const expenseGroups = useMemo(() => {
    const groups = new Map<string, ExpenseGroup>();
    monthTransactions.filter((item) => item.type === "expense").forEach((item) => {
      const group = groups.get(item.category.id) || {
        id: item.category.id,
        name: item.category.name,
        icon: item.category.icon,
        amount: 0,
        color: categoryColor(item.category.icon),
      };
      group.amount += item.amount;
      groups.set(item.category.id, group);
    });
    return [...groups.values()].sort((a, b) => b.amount - a.amount);
  }, [monthTransactions]);
  const activeExpense = expenseGroups.find((item) => item.id === (hoveredExpenseId ?? selectedExpenseId));
  const monthActivity = useMemo<ActivityItem[]>(() => {
    const savingsEntries = monthSavingsMovements.map((movement) => ({
      id: movement.id,
      type: movement.type === "deposit" ? "income" as const : "expense" as const,
      amount: movement.amount,
      date: movement.date,
      description: movement.description,
      category: {
        id: `savings-${movement.id}`,
        name: movement.type === "deposit" ? "Poupanças" : "Levantamento",
        icon: "PiggyBank",
        type: movement.type === "deposit" ? "income" as const : "expense" as const,
        isCustom: false,
      },
      source: "savings" as const,
      savingsType: movement.type,
    }));
    return [...monthTransactions.map((item) => ({ ...item, source: "transaction" as const })), ...savingsEntries]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [monthTransactions, monthSavingsMovements]);
  const recentTransactions = monthActivity.slice(0, 5);
  const filteredTransactions = useMemo(() => monthActivity.filter((item) => (
    (filter === "all" || item.type === filter) &&
    `${item.category.name} ${item.description || ""}`.toLowerCase().includes(query.toLowerCase())
  )), [monthActivity, filter, query]);

  const loadData = useCallback(async () => {
    if (!user) return;
    const requestId = ++loadRequest.current;
    setLoading(true);
    try {
      const from = new Date(month.getFullYear(), month.getMonth(), 1).toISOString();
      const to = new Date(month.getFullYear(), month.getMonth() + 1, 1).toISOString();
      const [transactionData, categoryData, savingsResult] = await Promise.all([
        api<{ transactions: Transaction[] }>(`/api/transactions?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
        api<{ categories: Category[] }>("/api/categories"),
        api<Omit<SavingsData, "period">>(`/api/savings?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
      ]);
      if (requestId !== loadRequest.current) return;
      setTransactions(transactionData.transactions);
      setCategories(categoryData.categories);
      setSavingsData({ ...savingsResult, period: savingsPeriod });
    } catch (err) {
      if (requestId === loadRequest.current) {
        setNotice({ kind: "error", message: err instanceof Error ? err.message : "Não foi possível carregar os dados." });
      }
    } finally {
      if (requestId === loadRequest.current) setLoading(false);
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
  async function confirmDeleteTransaction() {
    if (!transactionToDelete || deletingTransaction) return;
    setDeletingTransaction(true);
    setDeleteError("");
    try {
      await api(`/api/transactions/${transactionToDelete.id}`, { method: "DELETE" });
      setTransactionToDelete(null);
      setNotice({ kind: "success", message: "Transação eliminada." });
      await loadData();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Não foi possível eliminar a transação.");
    } finally {
      setDeletingTransaction(false);
    }
  }
  async function confirmDeleteCategory() {
    if (!categoryToDelete || deletingCategory) return;
    const transactionCount = categoryToDelete.transactionCount ?? 0;
    if (transactionCount > 0 && !replacementCategoryId) {
      setCategoryDeleteError("Seleciona uma categoria de destino para reclassificar os movimentos.");
      return;
    }
    setDeletingCategory(true);
    setCategoryDeleteError("");
    try {
      const result = await api<{ reclassifiedCount: number }>(`/api/categories/${categoryToDelete.id}`, {
        method: "DELETE",
        body: JSON.stringify({ replacementCategoryId }),
      });
      setCategoryToDelete(null);
      setReplacementCategoryId("");
      setNotice({
        kind: "success",
        message: result.reclassifiedCount > 0
          ? `Categoria eliminada. ${result.reclassifiedCount} ${result.reclassifiedCount === 1 ? (categoryToDelete.type === "expense" ? "despesa reclassificada" : "receita reclassificada") : (categoryToDelete.type === "expense" ? "despesas reclassificadas" : "receitas reclassificadas")}.`
          : "Categoria eliminada com sucesso.",
      });
      await loadData();
    } catch (err) {
      setCategoryDeleteError(err instanceof Error ? err.message : "Não foi possível eliminar a categoria.");
    } finally {
      setDeletingCategory(false);
    }
  }
  function exportCsv() {
    const lines = [["Data", "Tipo", "Categoria", "Descrição", "Valor (€)"], ...monthTransactions.map((item) => [new Date(item.date).toLocaleDateString("pt-PT"), item.type === "income" ? "Receita" : "Despesa", item.category.name, item.description || "", item.amount.toFixed(2).replace(".", ",")])];
    const csv = "\uFEFF" + lines.map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(";")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    link.download = `contas-${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  if (!authChecked) return <div className="loading-screen"><span className="brand-mark"><Wallet size={19} /></span><span>A preparar o teu espaço...</span></div>;
  if (!user) return <AuthScreen onLogin={setUser} />;

  const displayName = (typeof user.name === "string" ? user.name.trim() : "") || user.email.split("@")[0];
  const renderTransaction = (item: ActivityItem, removable = false) => {
    const isSavings = item.source === "savings";
    const description = item.description || (isSavings ? (item.savingsType === "deposit" ? "Transferência para poupanças" : "Levantamento de poupanças") : item.category.name);
    const kindLabel = isSavings ? (item.savingsType === "deposit" ? "Entrada nas poupanças" : "Saída das poupanças") : item.category.name;
    return <div className="transaction-row" key={item.id}>
      <div className={`transaction-icon ${item.type}`} style={{ color: categoryColor(item.category.icon), backgroundColor: `${categoryColor(item.category.icon)}1A` }}><CategoryMark icon={item.category.icon} size={17} /></div>
      <div className="transaction-description"><strong>{description}</strong><span>{kindLabel} <i>·</i> {dateFormat.format(new Date(item.date))}</span></div>
      <strong className={`transaction-amount ${item.type}`}>{item.type === "income" ? "+" : "−"}{euro.format(item.amount)}</strong>
      {removable && item.source === "transaction" && <button className="icon-button delete-button" aria-label={`Eliminar ${item.description || item.category.name}`} onClick={() => { setDeleteError(""); setTransactionToDelete(item as Transaction); }}><Trash2 size={16} /></button>}
    </div>;
  };

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
      <a className="brand sidebar-brand" href="#"><span className="brand-mark"><Wallet size={19} /></span> contas<span className="brand-dot">.</span></a>
      <div className="workspace-label">ESPAÇO PESSOAL</div>
      <nav className="main-nav" aria-label="Navegação principal">
        <button className={tab === "overview" ? "nav-link active" : "nav-link"} onClick={() => { setTab("overview"); setMobileNav(false); }}><LayoutDashboard size={18} /> Visão geral</button>
        <button className={tab === "transactions" ? "nav-link active" : "nav-link"} onClick={() => { setTab("transactions"); setMobileNav(false); }}><ArrowUpRight size={18} /> Transações</button>
        <button className={tab === "categories" ? "nav-link active" : "nav-link"} onClick={() => { setTab("categories"); setMobileNav(false); }}><BarChart3 size={18} /> Categorias</button>
        <button className={tab === "savings" ? "nav-link active" : "nav-link"} onClick={() => { setTab("savings"); setMobileNav(false); }}><PiggyBank size={18} /> Poupanças</button>
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-tip"><span className="tip-icon"><Sparkles size={16} /></span><strong>Pequenos hábitos,<br />grandes mudanças.</strong><p>Regista as tuas despesas para veres o teu progresso crescer.</p></div>
        <button className="user-menu" onClick={() => void logout()}><Avatar name={displayName} email={user.email} /><span className="user-details"><strong>{displayName}</strong><small>{user.email}</small></span><LogOut size={16} className="logout-icon" /></button>
      </div>
    </aside>
    {mobileNav && <button className="mobile-scrim" aria-label="Fechar menu" onClick={() => setMobileNav(false)} />}
    <main className="main-area">
      <header className="topbar">
        <button className="mobile-menu icon-button" aria-label="Abrir menu" onClick={() => setMobileNav(true)}><Menu size={20} /></button>
        <div className="breadcrumb"><span>O meu espaço</span><span className="breadcrumb-separator">/</span><strong>{tab === "overview" ? "Visão geral" : tab === "transactions" ? "Transações" : tab === "savings" ? "Poupanças" : "Categorias"}</strong></div>
        <div className="topbar-right"><span className="privacy-badge"><ShieldCheck size={14} /> Espaço privado</span><Avatar name={displayName} email={user.email} /></div>
      </header>
      <div className="page-content">
        <div className="page-heading">
          <div><span className="eyebrow">{tab === "overview" ? "O TEU RESUMO FINANCEIRO" : tab === "transactions" ? "O TEU HISTÓRICO" : tab === "savings" ? "O TEU DINHEIRO RESERVADO" : "À TUA MANEIRA"}</span><h1>{tab === "overview" ? <>Bom dia, <span>{displayName}.</span></> : tab === "transactions" ? "As tuas transações." : tab === "savings" ? "As tuas poupanças." : "As tuas categorias."}</h1><p>{tab === "overview" ? "Aqui está o retrato das tuas finanças este mês." : tab === "transactions" ? "Tudo o que entra e sai, num só lugar." : tab === "savings" ? "Guarda dinheiro e acompanha todas as transferências." : "Organiza o teu dinheiro por categorias."}</p></div>
          {tab === "savings"
            ? <button className="button button-primary" onClick={() => { setSavingsInitialType("deposit"); setModal("savings"); }}><Plus size={17} /> Transferir dinheiro</button>
            : <button className="button button-primary" onClick={() => setModal("transaction")}><Plus size={17} /> Nova transação</button>}
        </div>
        {tab !== "categories" && <div className="toolbar">
          <div className="month-select"><button aria-label="Mês anterior" onClick={() => changeMonth(-1)}><ArrowLeft size={16} /></button><CalendarDays size={16} /><span>{monthName.format(month).replace(/^\p{L}/u, (letter) => letter.toLocaleUpperCase("pt-PT"))}</span><button aria-label="Mês seguinte" onClick={() => changeMonth(1)}><ArrowRight size={16} /></button><input aria-label="Selecionar mês" type="month" value={`${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`} onChange={(event) => { if (event.target.value) { const [year, selectedMonth] = event.target.value.split("-").map(Number); setMonth(new Date(year, selectedMonth - 1, 1)); } }} /></div>
          {tab !== "savings" && <button className="button button-secondary export-button" onClick={exportCsv}><Download size={16} /> Exportar</button>}
        </div>}
        {notice && <div className={`notice ${notice.kind}`}><span>{notice.message}</span><button aria-label="Fechar notificação" onClick={() => setNotice(null)}><X size={16} /></button></div>}
        {tab === "categories" ? <section className="categories-page">
          <div className="section-title-row"><div><h2>As tuas categorias</h2><p>As categorias personalizadas são só tuas.</p></div><button className="button button-secondary" onClick={() => { setCategoryToEdit(null); setModal("category"); }}><Plus size={16} /> Nova categoria</button></div>
          <div className="category-groups">{(["expense", "income"] as const).map((type) => <section className="category-group" key={type} aria-label={type === "expense" ? "Categorias de despesas" : "Categorias de receitas"}><div className="category-group-heading"><h3>{type === "expense" ? "Despesas" : "Receitas"}</h3><span>{categories.filter((item) => item.type === type).length}</span></div><div className="category-list">{categories.filter((item) => item.type === type).map((category) => <article className="category-row" key={category.id}><CategoryVisual icon={category.icon} size={20} /><div className="category-item-copy"><strong>{category.name}</strong>{category.isCustom && <span className="custom-tag">Personalizada</span>}</div>{category.canManage !== false && <div className="category-item-actions"><button className="icon-button" aria-label={`Editar categoria ${category.name}`} onClick={() => { setCategoryToEdit(category); setModal("category"); }}><Pencil size={15} /></button><button className="icon-button" aria-label={`Eliminar categoria ${category.name}`} onClick={() => { setCategoryDeleteError(""); setReplacementCategoryId(""); setCategoryToDelete(category); }}><Trash2 size={15} /></button></div>}</article>)}</div></section>)}</div>
          <div className="category-info"><CircleHelp size={18} /><span><strong>As categorias mantêm tudo organizado.</strong> Escolhe a que melhor descreve cada movimento quando registares uma transação.</span></div>
        </section> : tab === "transactions" ? <section className="transactions-page panel"><div className="section-title-row"><div><h2>Movimentos do mês</h2><p>{monthTransactions.length} {monthTransactions.length === 1 ? "movimento" : "movimentos"} registados</p></div><div className="list-controls"><label className="search-box"><Search size={16} /><input aria-label="Pesquisar transações" placeholder="Pesquisar" value={query} onChange={(e) => setQuery(e.target.value)} /></label><label className="filter-select"><select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} aria-label="Filtrar por tipo"><option value="all">Todos</option><option value="income">Receitas</option><option value="expense">Despesas</option></select><ChevronDown size={14} /></label></div></div><div className="transaction-list">{filteredTransactions.map((item) => renderTransaction(item, true))}{!filteredTransactions.length && <div className="empty-state"><span>🧾</span><strong>Sem transações por aqui.</strong><p>Experimenta outro mês ou regista o teu primeiro movimento.</p><button className="button button-primary" onClick={() => setModal("transaction")}><Plus size={16} /> Nova transação</button></div>}</div></section> : tab === "savings" ? <section className="savings-page">
          <div className="summary-grid savings-summary-grid">
            <article className="summary-card balance-card"><div className="summary-top"><span>Saldo disponível do mês</span><span className="summary-icon"><Wallet size={17} /></span></div><strong>{euro.format(monthlyAvailableBalance)}</strong><div className="summary-bottom"><span className="summary-dot purple-dot" /> <span>Receitas menos despesas e poupanças do mês</span></div><div className="card-decoration decoration-purple" /></article>
            <article className="summary-card income-card"><div className="summary-top"><span>Entradas do mês</span><span className="summary-icon"><ArrowDownLeft size={17} /></span></div><strong>{euro.format(monthSavingsDeposits)}</strong><div className="summary-bottom"><span className="summary-dot green-dot" /> <span>{monthSavingsMovements.filter((item) => item.type === "deposit").length} transferências para poupanças</span></div><div className="card-decoration decoration-green" /></article>
            <article className="summary-card expense-card"><div className="summary-top"><span>Saídas do mês</span><span className="summary-icon"><ArrowUpRight size={17} /></span></div><strong>{euro.format(monthSavingsWithdrawals)}</strong><div className="summary-bottom"><span className="summary-dot orange-dot" /> <span>{monthSavingsMovements.filter((item) => item.type === "withdrawal").length} levantamentos</span></div><div className="card-decoration decoration-orange" /></article>
            <article className="summary-card balance-card"><div className="summary-top"><span>Saldo do mês</span><span className="summary-icon"><Wallet size={17} /></span></div><strong>{euro.format(monthSavingsBalance)}</strong><div className="summary-bottom"><span className={`summary-dot ${monthSavingsBalance >= 0 ? "purple-dot" : "orange-dot"}`} /> <span>{monthSavingsBalance >= 0 ? "Aumento no mês" : "Redução no mês"}</span></div><div className="card-decoration decoration-purple" /></article>
          </div>
          <div className="savings-actions">
            <button className="button button-primary" onClick={() => { setSavingsInitialType("deposit"); setModal("savings"); }}><ArrowDownLeft size={16} /> Adicionar às poupanças</button>
            <button className="button button-secondary" onClick={() => { setSavingsInitialType("withdrawal"); setModal("savings"); }}><ArrowUpRight size={16} /> Levantar dinheiro</button>
          </div>
          <section className="transactions-page panel savings-history">
            <div className="section-title-row"><div><h2>Histórico de poupanças</h2><p>{monthSavingsMovements.length} {monthSavingsMovements.length === 1 ? "movimento" : "movimentos"} registados em {monthName.format(month)}</p></div></div>
            <div className="transaction-list">
              {monthSavingsMovements.map((movement) => {
                const deposit = movement.type === "deposit";
                return <div className="transaction-row" key={movement.id}>
                  <div className={`transaction-icon ${deposit ? "income" : "expense"}`}><PiggyBank size={17} /></div>
                  <div className="transaction-description"><strong>{movement.description || (deposit ? "Transferência para poupanças" : "Levantamento de poupanças")}</strong><span>{deposit ? "Entrada nas poupanças" : "Saída das poupanças"} <i>·</i> {dateFormat.format(new Date(movement.date))}</span></div>
                  <strong className={`transaction-amount ${deposit ? "income" : "expense"}`}>{deposit ? "+" : "−"}{euro.format(movement.amount)}</strong>
                </div>;
              })}
              {!monthSavingsMovements.length && <div className="empty-state"><span>🐷</span><strong>Sem movimentos neste mês.</strong><p>Transfere dinheiro do saldo disponível para começar.</p><button className="button button-primary" onClick={() => { setSavingsInitialType("deposit"); setModal("savings"); }}><Plus size={16} /> Fazer primeira transferência</button></div>}
            </div>
          </section>
        </section> : <>
          <section className="summary-grid">
            <article className="summary-card income-card"><div className="summary-top"><span>Receitas</span><span className="summary-icon"><ArrowDownLeft size={17} /></span></div><strong>{euro.format(income)}</strong><div className="summary-bottom"><span className="summary-dot green-dot" /> <span>{monthTransactions.filter((item) => item.type === "income").length} entradas este mês</span></div><div className="card-decoration decoration-green" /></article>
            <article className="summary-card expense-card"><div className="summary-top"><span>Despesas</span><span className="summary-icon"><ArrowUpRight size={17} /></span></div><strong>{euro.format(expenses)}</strong><div className="summary-bottom"><span className="summary-dot orange-dot" /> <span>{monthTransactions.filter((item) => item.type === "expense").length} saídas este mês</span></div><div className="card-decoration decoration-orange" /></article>
            <article className="summary-card balance-card"><div className="summary-top"><span>Saldo do mês</span><span className="summary-icon"><Wallet size={17} /></span></div><strong>{euro.format(balance)}</strong><div className="summary-bottom"><span className={`summary-dot ${balance >= 0 ? "purple-dot" : "orange-dot"}`} /> <span>{balance >= 0 ? "Saldo positivo" : "Saldo negativo"}</span></div><div className="card-decoration decoration-purple" /></article>
            <article className="summary-card savings-card"><div className="summary-top"><span>Poupanças do mês</span><span className="summary-icon"><PiggyBank size={17} /></span></div><strong>{euro.format(monthSavingsBalance)}</strong><div className="summary-bottom"><span className="summary-dot blue-dot" /> <span>Saldo líquido do mês</span></div><div className="card-decoration decoration-blue" /></article>
          </section>
          <section className="dashboard-grid">
            <article className="panel chart-panel"><div className="panel-heading"><div><h2>Despesas por categoria</h2><p>Onde foi o teu dinheiro</p></div><span className="panel-badge"><span className="summary-dot orange-dot" /> {monthTransactions.filter((item) => item.type === "expense").length} despesas</span></div>
              {expenseGroups.length ? <div className="chart-layout">
                <div className={`expense-tooltip${activeExpense ? " expense-tooltip-visible" : ""}`} role="status" aria-live="polite">
                  {activeExpense && <><span className="expense-tooltip-name"><span className="legend-swatch" style={{ background: activeExpense.color }} />{activeExpense.name}</span><strong>{euro.format(activeExpense.amount)}</strong><span className="expense-tooltip-share">{percentage.format(expenses ? activeExpense.amount / expenses * 100 : 0)}% do total</span></>}
                </div>
                <div className="donut-wrap">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseGroups}
                        dataKey="amount"
                        nameKey="name"
                        innerRadius="70%"
                        outerRadius="93%"
                        paddingAngle={1.5}
                        stroke="none"
                        cornerRadius={3}
                        activeShape={false}
                        onMouseEnter={(_, index) => setHoveredExpenseId(expenseGroups[index]?.id ?? null)}
                        onMouseLeave={() => setHoveredExpenseId(null)}
                        onClick={(_, index) => setSelectedExpenseId((current) => current === expenseGroups[index]?.id ? null : expenseGroups[index]?.id ?? null)}
                      >
                        {expenseGroups.map((item) => (
                          <Cell key={item.id} fill={item.color} opacity={activeExpense && activeExpense.id !== item.id ? 0.52 : 1} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="donut-center"><strong>{euro.format(expenses)}</strong><span>Total gasto</span></div>
                </div>
                <div className="legend-list" id="expense-category-list">
                  {expenseGroups.slice(0, showAllExpenseGroups ? expenseGroups.length : 5).map((item) => (
                    <div className="legend-item" key={item.id}>
                      <span className="legend-swatch" style={{ background: item.color }} />
                      <span className="legend-name"><CategoryVisual icon={item.icon} size={13} />{item.name}</span>
                      <strong>{euro.format(item.amount)}</strong>
                    </div>
                  ))}
                  {expenseGroups.length > 5 && <button type="button" className="legend-toggle" aria-expanded={showAllExpenseGroups} aria-controls="expense-category-list" onClick={() => setShowAllExpenseGroups((expanded) => !expanded)}>{showAllExpenseGroups ? "Ver menos" : "Ver todas"}<ChevronDown size={13} /></button>}
                </div>
              </div> : <div className="chart-empty"><span className="chart-empty-icon"><BarChart3 size={23} /></span><strong>O teu gráfico começa aqui</strong><p>Regista despesas para veres a distribuição por categoria.</p></div>}
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
    {modal === "savings" && <SavingsForm initialType={savingsInitialType} onClose={() => setModal(null)} onSaved={() => { setNotice({ kind: "success", message: "Transferência registada com sucesso." }); void loadData(); }} />}
    {modal === "category" && <CategoryForm category={categoryToEdit ?? undefined} onClose={() => { setModal(null); setCategoryToEdit(null); }} onSaved={() => { setNotice({ kind: "success", message: categoryToEdit ? "Categoria atualizada com sucesso." : "Categoria criada com sucesso." }); void loadData(); }} />}
    {transactionToDelete && <AppModal title="Eliminar transação?" subtitle="Esta ação não pode ser anulada." onClose={() => { if (!deletingTransaction) setTransactionToDelete(null); }}>
      <div className="delete-confirmation">
        <span className="delete-confirmation-icon"><Trash2 size={19} /></span>
        <p>Queres mesmo eliminar <strong>{transactionToDelete.description || transactionToDelete.category.name}</strong> no valor de <strong>{euro.format(transactionToDelete.amount)}</strong>?</p>
      </div>
      {deleteError && <div className="inline-error">{deleteError}</div>}
      <div className="delete-confirmation-actions">
        <button className="button button-secondary" disabled={deletingTransaction} onClick={() => setTransactionToDelete(null)}>Cancelar</button>
        <button className="button button-danger" disabled={deletingTransaction} onClick={() => void confirmDeleteTransaction()}><Trash2 size={15} />{deletingTransaction ? "A eliminar..." : "Eliminar transação"}</button>
      </div>
    </AppModal>}
    {categoryToDelete && <AppModal
      title="Eliminar categoria?"
      subtitle="As despesas associadas serão mantidas."
      onClose={() => {
        if (!deletingCategory) {
          setCategoryToDelete(null);
          setReplacementCategoryId("");
        }
      }}
    >
      <div className="delete-confirmation">
        <span className="delete-confirmation-icon"><Trash2 size={19} /></span>
        <p>Queres eliminar a categoria <strong>{categoryToDelete.name}</strong>? Esta ação não pode ser anulada.</p>
      </div>
      {(categoryToDelete.transactionCount ?? 0) > 0 && <>
        <div className="category-reassignment">
          <p><strong>{categoryToDelete.transactionCount} {categoryToDelete.type === "expense" ? (categoryToDelete.transactionCount === 1 ? "despesa está associada" : "despesas estão associadas") : (categoryToDelete.transactionCount === 1 ? "receita está associada" : "receitas estão associadas")}</strong> a esta categoria. Escolhe onde as reclassificar:</p>
          {categories.filter((category) => category.type === categoryToDelete.type && category.id !== categoryToDelete.id).length > 0
            ? <label>Nova categoria<select value={replacementCategoryId} onChange={(event) => setReplacementCategoryId(event.target.value)} required>
              <option value="">Selecionar categoria de destino</option>
              {categories.filter((category) => category.type === categoryToDelete.type && category.id !== categoryToDelete.id).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select></label>
            : <div className="inline-error">Não existem outras categorias de despesas. Cria uma categoria antes de eliminar esta.</div>}
        </div>
      </>}
      {categoryDeleteError && <div className="inline-error">{categoryDeleteError}</div>}
      <div className="delete-confirmation-actions">
        <button className="button button-secondary" disabled={deletingCategory} onClick={() => { setCategoryToDelete(null); setReplacementCategoryId(""); }}>Cancelar</button>
        <button
          className="button button-danger"
          disabled={deletingCategory || ((categoryToDelete.transactionCount ?? 0) > 0 && (!replacementCategoryId || !categories.some((category) => category.id === replacementCategoryId && category.type === categoryToDelete.type && category.id !== categoryToDelete.id)))}
          onClick={() => void confirmDeleteCategory()}
        ><Trash2 size={15} />{deletingCategory ? "A eliminar..." : "Eliminar categoria"}</button>
      </div>
    </AppModal>}
  </div>;
}
