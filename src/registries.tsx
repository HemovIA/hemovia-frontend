import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Network,
  Truck,
  Users,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { roles, uuidPattern } from "./domain";
import {
  Confirm,
  Failure,
  Options,
  QueryState,
  Table,
  Title,
  useAction,
  useQuery,
  useSession,
  values,
} from "./ui";

type RecordRow = { id: string; [field: string]: unknown };
type Kind = "hemocentros" | "hospitais" | "veiculos" | "usuarios";
const catalogs = {
  hemocentros: {
    name: "Hemocentros",
    path: "/blood-centers",
    icon: Building2,
    description: "Unidades de coleta e distribuição.",
  },
  hospitais: {
    name: "Hospitais",
    path: "/hospitals",
    icon: Building2,
    description: "Cadastro das unidades de atendimento.",
  },
  veiculos: {
    name: "Veículos",
    path: "/vehicles",
    icon: Truck,
    description: "Frota e capacidade de transporte.",
  },
  usuarios: {
    name: "Usuários",
    path: "/users",
    icon: Users,
    description: "Contas, perfis e vínculos de acesso.",
  },
};

export function Registries() {
  return (
    <>
      <Title
        section="ADMINISTRAÇÃO"
        title="Cadastros da rede"
        text="Mantenha a estrutura da operação atualizada."
      />
      <div className="registry-grid">
        {Object.entries(catalogs).map(([key, item]) => (
          <Link
            key={key}
            className="card registry-card"
            to={"/unidades/" + key}
          >
            <span>
              <item.icon />
            </span>
            <div>
              <h2>{item.name}</h2>
              <p>{item.description}</p>
            </div>
            <ArrowRight size={18} />
          </Link>
        ))}
        <Link className="card registry-card" to="/unidades/grafo">
          <span>
            <Network />
          </span>
          <div>
            <h2>Rede logística</h2>
            <p>Pontos e conexões usados no cálculo das rotas.</p>
          </div>
          <ArrowRight size={18} />
        </Link>
      </div>
    </>
  );
}

function LocationFields({ initial }: { initial?: RecordRow }) {
  return (
    <>
      <label>
        Nome
        <input
          name="name"
          maxLength={255}
          required
          defaultValue={String(initial?.name || "")}
        />
      </label>
      <label>
        Cidade
        <input
          name="city"
          maxLength={255}
          required
          defaultValue={String(initial?.city || "")}
        />
      </label>
      <div className="field-grid">
        <label>
          Latitude
          <input
            name="latitude"
            type="number"
            min="-90"
            max="90"
            step="any"
            required
            defaultValue={initial?.latitude as number}
          />
        </label>
        <label>
          Longitude
          <input
            name="longitude"
            type="number"
            min="-180"
            max="180"
            step="any"
            required
            defaultValue={initial?.longitude as number}
          />
        </label>
      </div>
    </>
  );
}

export function Catalog() {
  const { kind = "" } = useParams();
  if (!(kind in catalogs))
    return (
      <div className="card padded">
        <h1>Cadastro não encontrado</h1>
        <Link to="/unidades">Voltar aos cadastros</Link>
      </div>
    );
  return <CatalogContent key={kind} kind={kind as Kind} />;
}

function CatalogContent({ kind }: { kind: Kind }) {
  const config = catalogs[kind];
  const { call, isDemo } = useSession();
  const listable = kind !== "hospitais" || isDemo;
  const query = useQuery<RecordRow[]>(listable ? config.path : null);
  const [form, setForm] = useState(false);
  const [editing, setEditing] = useState<RecordRow>();
  const [role, setRole] = useState("HOSPITAL");
  const [created, setCreated] = useState<RecordRow[]>([]);
  const [pending, setPending] = useState<{
    row: RecordRow;
    action: "delete" | "deactivate";
  }>();
  const action = useAction();
  const records = listable ? query.data : created;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = values(event.currentTarget);
    const body: Record<string, unknown> = { ...fields };
    for (const field of ["latitude", "longitude", "priority", "capacity"])
      if (fields[field]) body[field] = Number(fields[field]);
    void action.run(async () => {
      const row = await call<RecordRow>(
        config.path + (editing ? "/" + editing.id : ""),
        editing ? "PUT" : "POST",
        body,
      );
      if (!listable) setCreated((previous) => [row, ...previous]);
      setForm(false);
      setEditing(undefined);
    });
  }

  return (
    <>
      <Link className="back-link" to="/unidades">
        <ArrowLeft size={15} />
        Cadastros
      </Link>
      <Title
        section="ADMINISTRAÇÃO"
        title={config.name}
        text={config.description}
        action={
          <button
            className="primary"
            onClick={() => {
              setEditing(undefined);
              setForm(true);
              action.clear();
            }}
          >
            Novo cadastro
          </button>
        }
      />
      {form && (
        <form
          className="card form-card narrow-form space-bottom"
          onSubmit={submit}
        >
          <h2>{editing ? "Editar cadastro" : "Novo cadastro"}</h2>
          {(kind === "hemocentros" || kind === "hospitais") && (
            <LocationFields initial={editing} />
          )}
          {kind === "hospitais" && (
            <label>
              Prioridade de atendimento
              <input name="priority" type="number" step="1" required />
            </label>
          )}
          {kind === "veiculos" && (
            <>
              <label>
                Código do veículo
                <input name="code" maxLength={255} required />
              </label>
              <label>
                Capacidade em bolsas
                <input
                  name="capacity"
                  type="number"
                  min="1"
                  step="1"
                  required
                />
              </label>
            </>
          )}
          {kind === "usuarios" && (
            <>
              <label>
                Nome
                <input
                  name="name"
                  required
                  defaultValue={String(editing?.name || "")}
                />
              </label>
              <label>
                E-mail
                <input
                  name="email"
                  type="email"
                  required
                  defaultValue={String(editing?.email || "")}
                />
              </label>
              <label>
                Telefone
                <input
                  name="phoneNumber"
                  type="tel"
                  defaultValue={String(editing?.phoneNumber || "")}
                />
              </label>
              {!editing && (
                <>
                  <label>
                    CPF
                    <input
                      name="cpf"
                      pattern="[0-9]{11}"
                      maxLength={11}
                      inputMode="numeric"
                      required
                      placeholder="11 dígitos"
                    />
                  </label>
                  <label>
                    Senha inicial
                    <input
                      name="password"
                      type="password"
                      minLength={6}
                      autoComplete="new-password"
                      required
                    />
                  </label>
                  <label>
                    Perfil
                    <select
                      name="role"
                      value={role}
                      onChange={(event) => setRole(event.target.value)}
                    >
                      <Options items={roles} />
                    </select>
                  </label>
                  {role !== "ADMIN" && (
                    <label>
                      Identificador do vínculo{" "}
                      {role === "HOSPITAL"
                        ? "hospitalar"
                        : role === "HEMOCENTRO"
                          ? "com hemocentro"
                          : "com veículo"}
                      <input
                        key={role}
                        name={
                          role === "HOSPITAL"
                            ? "hospitalId"
                            : role === "HEMOCENTRO"
                              ? "bloodCenterId"
                              : "vehicleId"
                        }
                        pattern={uuidPattern}
                        required
                      />
                    </label>
                  )}
                </>
              )}
            </>
          )}
          <Failure error={action.error} />
          <div className="form-actions">
            <button
              type="button"
              className="secondary"
              onClick={() => setForm(false)}
              disabled={action.busy}
            >
              Voltar
            </button>
            <button className="primary" disabled={action.busy}>
              {action.busy ? "Salvando…" : "Salvar cadastro"}
            </button>
          </div>
        </form>
      )}
      {!listable && (
        <p className="info">
          A API permite cadastrar hospitais. Esta lista apresenta os registros
          criados nesta sessão.
        </p>
      )}
      {!records ? (
        <QueryState query={query} />
      ) : (
        <Table
          headers={[
            "Identificador",
            kind === "veiculos" ? "Código" : "Nome",
            kind === "usuarios"
              ? "Perfil"
              : kind === "veiculos"
                ? "Capacidade"
                : "Cidade",
            "Ações",
          ]}
          rows={records.map((row) => ({
            id: row.id,
            cells: [
              <span className="id-text">{row.id}</span>,
              String(row.name || row.code || "—"),
              String(
                kind === "usuarios"
                  ? roles[row.role as keyof typeof roles] +
                      (row.active === false ? " · Inativo" : "")
                  : kind === "veiculos"
                    ? row.capacity
                    : row.city,
              ),
              <div className="row-actions">
                {(kind === "usuarios" || kind === "hemocentros") && (
                  <button
                    className="secondary"
                    onClick={() => {
                      setEditing(row);
                      setForm(true);
                      action.clear();
                    }}
                  >
                    Editar
                  </button>
                )}
                {kind === "hemocentros" && (
                  <button
                    className="danger-link"
                    onClick={() => {
                      setPending({ row, action: "delete" });
                      action.clear();
                    }}
                  >
                    Excluir
                  </button>
                )}
                {kind === "usuarios" && row.active !== false && (
                  <button
                    className="danger-link"
                    onClick={() => {
                      setPending({ row, action: "deactivate" });
                      action.clear();
                    }}
                  >
                    Desativar
                  </button>
                )}
              </div>,
            ],
          }))}
        />
      )}
      {pending && (
        <Confirm
          title={
            pending.action === "delete"
              ? "Excluir hemocentro?"
              : "Desativar usuário?"
          }
          action="Confirmar"
          busy={action.busy}
          error={action.error}
          onClose={() => setPending(undefined)}
          onConfirm={() =>
            void action.run(async () => {
              await call(
                config.path +
                  "/" +
                  pending.row.id +
                  (pending.action === "deactivate" ? "/deactivate" : ""),
                pending.action === "delete" ? "DELETE" : "PATCH",
              );
              setPending(undefined);
            })
          }
        >
          <p className="muted">
            Confirme a alteração do cadastro de {String(pending.row.name)}.
          </p>
        </Confirm>
      )}
    </>
  );
}

export function Graph() {
  const { call } = useSession();
  const nodes = useQuery<RecordRow[]>("/route-graph/nodes");
  const edges = useQuery<RecordRow[]>("/route-graph/edges");
  const [kind, setKind] = useState("crossing");
  const action = useAction();
  const edgeAction = useAction();
  function addNode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = values(event.currentTarget);
    const body: Record<string, unknown> = { ...fields };
    if (kind === "crossing") {
      body.latitude = Number(fields.latitude);
      body.longitude = Number(fields.longitude);
    }
    void action.run(async () => {
      await call("/route-graph/nodes", "POST", body);
    });
  }
  return (
    <>
      <Link className="back-link" to="/unidades">
        <ArrowLeft size={15} />
        Cadastros
      </Link>
      <Title
        section="ADMINISTRAÇÃO"
        title="Rede logística"
        text="Cadastre pontos e conexões direcionais entre as unidades."
      />
      <div className="registry-grid">
        <form className="card form-card" onSubmit={addNode}>
          <h2>Adicionar ponto</h2>
          <label>
            Nome
            <input name="name" required maxLength={255} />
          </label>
          <label>
            Tipo de ponto
            <select
              value={kind}
              onChange={(event) => setKind(event.target.value)}
            >
              <option value="crossing">Cruzamento</option>
              <option value="bloodCenterId">Hemocentro</option>
              <option value="hospitalId">Hospital</option>
            </select>
          </label>
          {kind === "crossing" ? (
            <div className="field-grid">
              <label>
                Latitude
                <input
                  name="latitude"
                  type="number"
                  min="-90"
                  max="90"
                  step="any"
                  required
                />
              </label>
              <label>
                Longitude
                <input
                  name="longitude"
                  type="number"
                  min="-180"
                  max="180"
                  step="any"
                  required
                />
              </label>
            </div>
          ) : (
            <label>
              Identificador da unidade
              <input key={kind} name={kind} pattern={uuidPattern} required />
            </label>
          )}
          <Failure error={action.error} />
          <button className="primary" disabled={action.busy}>
            {action.busy ? "Salvando…" : "Adicionar ponto"}
          </button>
        </form>
        <form
          className="card form-card"
          onSubmit={(event) => {
            event.preventDefault();
            const fields = values(event.currentTarget);
            void edgeAction.run(async () => {
              if (fields.fromNodeId === fields.toNodeId)
                throw Error("Selecione dois pontos distintos.");
              await call("/route-graph/edges", "POST", fields);
            });
          }}
        >
          <h2>Adicionar conexão</h2>
          <p className="muted">
            A plataforma calcula a geometria e os custos da conexão entre origem
            e destino.
          </p>
          {["fromNodeId", "toNodeId"].map((field, index) => (
            <label key={field}>
              {index ? "Destino" : "Origem"}
              <select name={field} required defaultValue="">
                <option value="" disabled>
                  Selecionar ponto
                </option>
                {nodes.data?.map((node) => (
                  <option key={node.id} value={node.id}>
                    {String(node.name)}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <Failure error={edgeAction.error} />
          <button
            className="primary"
            disabled={edgeAction.busy || !nodes.data?.length}
          >
            {edgeAction.busy ? "Calculando…" : "Adicionar conexão"}
          </button>
        </form>
      </div>
      <h2 className="space-top">Pontos cadastrados</h2>
      {nodes.data ? (
        <Table
          headers={["Nome", "Identificador"]}
          rows={nodes.data.map((node) => ({
            id: node.id,
            cells: [
              String(node.name),
              <span className="id-text">{node.id}</span>,
            ],
          }))}
        />
      ) : (
        <QueryState query={nodes} />
      )}
      <h2 className="space-top">Conexões cadastradas</h2>
      {edges.data ? (
        <Table
          headers={["Origem", "Destino", "Distância em km"]}
          rows={edges.data.map((edge) => ({
            id: edge.id,
            cells: [
              String(
                nodes.data?.find((node) => node.id === edge.fromNodeId)?.name ||
                  edge.fromNodeId,
              ),
              String(
                nodes.data?.find((node) => node.id === edge.toNodeId)?.name ||
                  edge.toNodeId,
              ),
              String(edge.distanceKm ?? "—"),
            ],
          }))}
        />
      ) : (
        <QueryState query={edges} />
      )}
    </>
  );
}
