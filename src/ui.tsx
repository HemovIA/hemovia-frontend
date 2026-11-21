import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ClipboardList, Droplets, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { ApiError } from "./http";
import { statuses, type Order, type Status, type User } from "./domain";

export type Client = <T>(
  path: string,
  method?: string,
  body?: unknown,
) => Promise<T>;
export type Session = {
  user: User;
  isDemo: boolean;
  unit: string;
  call: Client;
  orders: Order[];
  remember: (order: Order) => void;
  revision: number;
};
export const SessionContext = createContext<Session | null>(null);
export const useSession = () => useContext(SessionContext)!;
export function useQuery<T>(path: string | null) {
  const { call, revision } = useSession();
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<{
    path: string | null;
    data?: T;
    error?: unknown;
  }>();
  useEffect(() => {
    let active = true;
    setResult(undefined);
    if (path)
      call<T>(path).then(
        (data) => {
          if (active) setResult({ path, data });
        },
        (error) => {
          if (active) setResult({ path, error });
        },
      );
    return () => {
      active = false;
    };
  }, [path, call, revision, retry]);
  return {
    data: result?.path === path ? result?.data : undefined,
    error: result?.path === path ? result?.error : undefined,
    reload: () => setRetry((n) => n + 1),
  };
}
export function useAction() {
  const lock = useRef(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>();
  async function run(action: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(undefined);
    try {
      await action();
    } catch (e) {
      setError(e);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return { busy, error, run, clear: () => setError(undefined) };
}
export function Failure({ error }: { error: unknown }) {
  if (!error) return null;
  return (
    <div role="alert" className="warning">
      {error instanceof Error ? error.message : "Ocorreu uma falha."}
      {error instanceof ApiError &&
        Object.keys(error.fields || {}).length > 0 && (
          <ul>
            {Object.entries(error.fields).map(([field, message]) => (
              <li key={field}>
                {field} · {message}
              </li>
            ))}
          </ul>
        )}
    </div>
  );
}
export function QueryState({
  query,
}: {
  query: { error?: unknown; reload: () => void };
}) {
  return query.error ? (
    <div className="card padded">
      <Failure error={query.error} />
      <button className="secondary" onClick={query.reload}>
        Tentar novamente
      </button>
    </div>
  ) : (
    <p className="muted" role="status">
      Carregando…
    </p>
  );
}
export function Title({
  section,
  title,
  text,
  action,
}: {
  section: string;
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{section}</p>
        <h1>{title}</h1>
        {text && <p className="muted">{text}</p>}
      </div>
      {action}
    </div>
  );
}
export function Add({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link className="button primary" to={to}>
      <Plus size={18} />
      {children}
    </Link>
  );
}
export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="Hemovia — início">
      <span className="logo-mark">
        <Droplets size={21} fill="currentColor" />
      </span>
      hemovia
    </Link>
  );
}
export function Badge({ status }: { status: Status }) {
  return (
    <span className={"status " + status.toLowerCase()}>
      <i />
      {statuses[status]}
    </span>
  );
}
export function Metric({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  tone: string;
}) {
  return (
    <article className="metric card">
      <span className={"metric-icon " + tone}>{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </article>
  );
}
export function Table({
  headers,
  rows,
  empty = "Nenhum registro encontrado.",
}: {
  headers: string[];
  rows: { id: string; cells: ReactNode[] }[];
  empty?: string;
}) {
  if (!rows.length)
    return (
      <div className="card empty">
        <ClipboardList />
        <p>{empty}</p>
      </div>
    );
  return (
    <div className="card table-wrap">
      <table>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              {r.cells.map((c, i) => (
                <td key={headers[i]} data-label={headers[i]}>
                  {c ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function Confirm({
  title,
  children,
  action,
  busy,
  error,
  onClose,
  onConfirm,
}: {
  title: string;
  children: ReactNode;
  action: string;
  busy: boolean;
  error?: unknown;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      className="confirm"
      ref={ref}
      aria-labelledby="confirm-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      <h2 id="confirm-title">{title}</h2>
      {children}
      <Failure error={error} />
      <div className="form-actions">
        <button className="secondary" disabled={busy} onClick={onClose}>
          Voltar
        </button>
        <button className="primary" disabled={busy} onClick={onConfirm}>
          {busy ? "Enviando…" : action}
        </button>
      </div>
    </dialog>
  );
}
export function Options({ items }: { items: Record<string, string> }) {
  return (
    <>
      {Object.entries(items).map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </>
  );
}
export function BloodFields() {
  return (
    <>
      <label>
        Tipo sanguíneo
        <select name="bloodType" defaultValue="O">
          {["O", "A", "B", "AB"].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </label>
      <label>
        Fator Rh
        <select name="rhFactor">
          <option value="POSITIVE">Positivo (+)</option>
          <option value="NEGATIVE">Negativo (−)</option>
        </select>
      </label>
    </>
  );
}
export function values(form: HTMLFormElement) {
  return Object.fromEntries(
    Array.from(new FormData(form), ([k, v]) => [k, String(v).trim()]).filter(
      ([, v]) => v,
    ),
  ) as Record<string, string>;
}
