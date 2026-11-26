import { allPages } from "./queries";
import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  Activity,
  ArrowRight,
  Building2,
  ChartColumn,
  ClipboardList,
  Droplets,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Network,
  Sun,
  Truck,
  Users,
  X,
} from "lucide-react";
import {
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { demo, demoOrders, demoUnit, demoUsers } from "./demo";
import { http, ApiError } from "./http";
import { roles, type Order, type Role, type User, type Transport } from "./domain";
import { Failure, Logo, SessionContext, useAction, type Client } from "./ui";
import {
  Dashboard,
  OrderDetail,
  OrderForm,
  Orders,
  Reports,
  RoutePlanner,
  Stock,
  StockForm,
  Tracking,
} from "./pages";
import { Catalog, Graph, Registries } from "./registries";
import { Registration, registrationToken } from "./registration";
import { DonorAccount, donorAccountPath } from "./donor-account";

type Identity = { user: User; isDemo: boolean };

function AccessLayout({ children }: { children: ReactNode }) {
  return (
    <main className="login-page">
      <section className="login-brand">
        <Logo />
        <div>
          <p className="eyebrow light">CONECTANDO O CUIDADO</p>
          <h1>Cada entrega faz a vida seguir.</h1>
          <p>
            Estoque, requisições e distribuição de hemocomponentes em um só
            lugar.
          </p>
        </div>
        <div className="trust-row">
          <span>
            <Droplets size={18} /> Gestão de hemocomponentes
          </span>
          <span>
            <Truck size={18} /> Logística integrada
          </span>
        </div>
      </section>
      <section className="login-panel">
        <div className="login-card">{children}</div>
      </section>
    </main>
  );
}

function Login({ onLogin }: { onLogin: (identity: Identity) => void }) {
  const action = useAction();
  const [creating, setCreating] = useState(false);
  const [registered, setRegistered] = useState(false);
  const { hash } = useLocation();
  const navigate = useNavigate();
  const token = registrationToken(hash);

  function closeRegistration(completed = false) {
    setCreating(false);
    setRegistered(completed);
    if (token !== null) {
      navigate({ hash: "" }, { replace: true });
    }
  }

  function requestAnotherLink() {
    closeRegistration();
    setCreating(true);
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void action.run(async () => {
      const user = await http<User>("/auth/login", "POST", {
        identifier: data.get("identifier"),
        password: data.get("password"),
      });
      onLogin({ user, isDemo: false });
    });
  }
  return (
    <AccessLayout>
      {creating || token !== null ? (
        <Registration
          key={token ?? "start"}
          token={token}
          onBack={() => closeRegistration()}
          onRestart={requestAnotherLink}
          onComplete={() => closeRegistration(true)}
        />
      ) : (
        <>
          <h2>Bem-vindo de volta</h2>
          <p className="muted">Acesse sua conta na Hemovia.</p>
          {registered && <p role="status">Conta criada. Entre com seu e-mail ou CPF e a senha escolhida.</p>}
          <form onSubmit={submit}>
            <label>
              E-mail ou CPF
              <input
                name="identifier"
                autoComplete="username"
                required
                autoFocus
              />
            </label>
            <label>
              Senha
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </label>
            <Failure error={action.error} />
            <button className="primary full" disabled={action.busy}>
              {action.busy ? "Entrando…" : "Entrar na plataforma"}
              <ArrowRight size={17} />
            </button>
          </form>
          <button
            type="button"
            className="secondary full login-follow-up"
            onClick={() => {
              setCreating(true);
              setRegistered(false);
              action.clear();
            }}
          >
            Criar conta
          </button>
          <div className="divider">EXPLORE A PLATAFORMA</div>
          <p className="muted">
            Demonstração com dados fictícios, salva neste navegador.
          </p>
          <div className="demo-grid">
            {Object.entries(roles).map(([role, label]) => (
              <button
                key={role}
                onClick={() =>
                  onLogin({ user: demoUsers[role as Role], isDemo: true })
                }
              >
                <Building2 size={16} />
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </AccessLayout>
  );
}

const navigation = [
  { to: "/", label: "Visão geral", icon: LayoutDashboard },
  { to: "/estoque", label: "Estoque", icon: Droplets },
  { to: "/doacoes", label: "Doações", icon: Activity },
  { to: "/pedidos", label: "Requisições", icon: ClipboardList },
  {
    to: "/logistica",
    label: "Planejar rota",
    icon: Network,
    allowed: ["HEMOCENTRO"],
  },
  { to: "/rastreio", label: "Transportes", icon: Truck },
  {
    to: "/relatorios",
    label: "Estatísticas",
    icon: ChartColumn,
    allowed: ["ADMIN", "HEMOCENTRO"],
  },
  { to: "/unidades", label: "Cadastros", icon: Building2, allowed: ["ADMIN"] },
];

export default function App() {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [checking, setChecking] = useState(true);
  const [receipts, setReceipts] = useState<Order[]>([]);
  const [revision, setRevision] = useState(0);
  const [remoteOrders, setRemoteOrders] = useState<Order[]>([]);
  const [remoteIdentity, setRemoteIdentity] = useState<Identity | null>(null);
  const [orderError, setOrderError] = useState<unknown>();
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderRetry, setOrderRetry] = useState(0);
  const [menu, setMenu] = useState(false);
  const [dark, setDark] = useState(
    () => localStorage.getItem("hemovia.theme") === "dark",
  );
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAction();

  useEffect(() => {
    let active = true;
    http<User>("/auth/me")
      .then((user) => {
        if (active) setIdentity({ user, isDemo: false });
      })
      .catch(() => {})
      .finally(() => {
        if (active) setChecking(false);
      });
    const expired = () => {
      setIdentity(null);
      setRemoteIdentity(null); setRemoteOrders([]); setOrderError(undefined);
      setReceipts([]);
    };
    window.addEventListener("hemovia:expired", expired);
    return () => {
      active = false;
      window.removeEventListener("hemovia:expired", expired);
    };
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem("hemovia.theme", dark ? "dark" : "light");
  }, [dark]);
  useEffect(() => {
    setMenu(false);
    document.getElementById("main-content")?.focus();
  }, [location.pathname]);

  const call: Client = useCallback(
    async <T,>(path: string, method = "GET", body?: unknown) => {
      if (!identity) throw new ApiError("Entre na plataforma.", 401);
      const result = identity.isDemo
        ? await demo<T>(identity.user, path, method, body)
        : await http<T>(path, method, body);
      if (method !== "GET") setRevision((value) => value + 1);
      return result;
    },
    [identity],
  );
  useEffect(() => {
    let active = true;
    if (!identity || identity.isDemo || identity.user.role === "DOADOR") return () => { active = false; };
    setOrdersLoading(true); setOrderError(undefined); setRemoteOrders([]); setRemoteIdentity(null);
    Promise.all([allPages<Order>(call, "/requests"), allPages<Transport>(call, "/transports")]).then(([requests, transports]) => {
      if (active) { setRemoteOrders(requests.map((request) => ({ ...request, transport: transports.filter((trip) => trip.requestId === request.id).sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0] }))); setRemoteIdentity(identity); }
    }).catch((error) => { if (active) { setOrderError(error); setRemoteIdentity(identity); } }).finally(() => { if (active) setOrdersLoading(false); });
    return () => { active = false; };
  }, [identity, call, revision, orderRetry]);
  const remember = (order: Order) =>
    setReceipts((current) => {
      const previous = current.find((item) => item.id === order.id);
      return [
        { ...previous, ...order },
        ...current.filter((item) => item.id !== order.id),
      ];
    });
  function login(next: Identity) {
    setIdentity(next);
    setRemoteIdentity(null); setRemoteOrders([]); setOrderError(undefined);
    setReceipts([]);
    navigate(next.user.role === "DOADOR" ? donorAccountPath : "/");
  }
  function leave() {
    void logout.run(async () => {
      if (!identity?.isDemo) await http("/auth/logout", "POST");
      setIdentity(null);
      setRemoteIdentity(null); setRemoteOrders([]); setOrderError(undefined);
      setReceipts([]);
      navigate("/");
    });
  }

  if (checking)
    return (
      <main className="empty" role="status">
        <Droplets />
        <p>Preparando sua área de trabalho…</p>
      </main>
    );
  if (!identity || registrationToken(location.hash) !== null) return <Login onLogin={login} />;
  const { user, isDemo } = identity;
  if (user.role === "DOADOR") {
    return location.pathname === donorAccountPath ? (
      <DonorAccount
        user={user}
        dark={dark}
        onToggleTheme={() => setDark((value) => !value)}
        onLogout={leave}
        logoutBusy={logout.busy}
        logoutError={logout.error}
      />
    ) : (
      <Navigate to={donorAccountPath} replace />
    );
  }
  const orders = isDemo ? demoOrders(user) : remoteIdentity === identity ? remoteOrders : [];
  const unit = isDemo ? demoUnit[user.role] : roles[user.role];
  const analytics = ["ADMIN", "HEMOCENTRO"].includes(user.role);
  return (
    <SessionContext.Provider
      value={{ user, isDemo, call, orders, remember, revision, unit, orderError: remoteIdentity === identity ? orderError : undefined, ordersLoading, reloadOrders: () => setOrderRetry((n) => n + 1) }}
    >
      <a className="skip-link" href="#main-content">
        Pular para o conteúdo
      </a>
      <div className="app-shell">
        {menu && (
          <button
            className="overlay"
            aria-label="Fechar navegação"
            onClick={() => setMenu(false)}
          />
        )}
        <aside
          className={"sidebar " + (menu ? "open" : "")}
          aria-label="Navegação principal"
        >
          <div className="sidebar-top">
            <Logo />
            <button
              className="icon-button mobile-only"
              aria-label="Fechar menu"
              onClick={() => setMenu(false)}
            >
              <X size={18} />
            </button>
          </div>
          <div className="unit-card">
            <span className="unit-icon">
              <Building2 size={18} />
            </span>
            <div>
              <small>Unidade de atendimento</small>
              <strong>{unit}</strong>
            </div>
          </div>
          <nav>
            <small>OPERAÇÃO</small>
            {navigation
              .filter(
                (item) => !item.allowed || item.allowed.includes(user.role),
              )
              .map((item) => (
                <NavLink key={item.to} to={item.to} end={item.to === "/"}>
                  <item.icon size={18} />
                  {item.label}
                </NavLink>
              ))}
          </nav>
          <div className="sidebar-bottom">
            <button onClick={leave} disabled={logout.busy}>
              <LogOut size={17} />
              Sair da plataforma
            </button>
            <Failure error={logout.error} />
            <div className="profile">
              <span className="avatar">
                {user.name
                  .split(" ")
                  .slice(0, 2)
                  .map((name) => name[0])
                  .join("")}
              </span>
              <div>
                <strong>{user.name}</strong>
                <small>{roles[user.role]}</small>
              </div>
            </div>
          </div>
        </aside>
        <div className="page-area">
          <header className="topbar">
            <button
              className="icon-button mobile-only"
              aria-label="Abrir menu"
              aria-expanded={menu}
              onClick={() => setMenu(true)}
            >
              <Menu size={20} />
            </button>
            {isDemo ? (
              <label className="role-switch">
                <span>Demonstração</span>
                <select
                  aria-label="Perfil da demonstração"
                  value={user.role}
                  onChange={(event) =>
                    login({
                      user: demoUsers[event.target.value as Role],
                      isDemo: true,
                    })
                  }
                >
                  {Object.entries(roles).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <span className="muted">{roles[user.role]}</span>
            )}
            <button
              className="icon-button"
              onClick={() => setDark((value) => !value)}
              aria-label={dark ? "Ativar tema claro" : "Ativar tema escuro"}
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </header>
          <main id="main-content" className="content" tabIndex={-1}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/estoque" element={<Stock />} />
              <Route path="/estoque/novo" element={<StockForm />} />
              <Route path="/doacoes" element={<Stock donations />} />
              <Route path="/doacoes/nova" element={<StockForm donation />} />
              <Route path="/pedidos" element={<Orders />} />
              <Route
                path="/pedidos/novo"
                element={
                  user.role === "HOSPITAL" ? (
                    <OrderForm />
                  ) : (
                    <Navigate to="/pedidos" replace />
                  )
                }
              />
              <Route path="/pedidos/:id" element={<OrderDetail />} />
              <Route path="/rastreio" element={<Tracking />} />
              <Route
                path="/logistica"
                element={
                  user.role === "HEMOCENTRO" ? (
                    <RoutePlanner />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
              <Route
                path="/relatorios"
                element={analytics ? <Reports /> : <Navigate to="/" replace />}
              />
              <Route
                path="/unidades"
                element={
                  user.role === "ADMIN" ? (
                    <Registries />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
              <Route
                path="/unidades/grafo"
                element={
                  user.role === "ADMIN" ? (
                    <Graph />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
              <Route
                path="/unidades/:kind"
                element={
                  user.role === "ADMIN" ? (
                    <Catalog />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
              <Route
                path="*"
                element={
                  <div className="empty card">
                    <h1>Página não encontrada</h1>
                    <Link className="button primary" to="/">
                      Voltar ao início
                    </Link>
                  </div>
                }
              />
            </Routes>
          </main>
        </div>
      </div>
    </SessionContext.Provider>
  );
}
