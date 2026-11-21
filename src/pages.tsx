import { DonorCpf } from "./donor";
import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardList,
  Clock,
  Droplets,
  PackageCheck,
  Search,
  Truck,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  bagStatuses,
  bloodLabel,
  civil,
  components,
  dateTime,
  localInput,
  numeric,
  priorities,
  short,
  statuses,
  today,
  uuidPattern,
  type Allocation,
  type Bag,
  type BloodCenter,
  type Demand,
  type Donation,
  type Inventory,
  type Order,
  type OrderInput,
  type RouteInfo,
  type Status,
  type Transport,
  type Vehicle,
} from "./domain";
import {
  Add,
  Badge,
  BloodFields,
  Confirm,
  Failure,
  Metric,
  Options,
  QueryState,
  SearchSelect,
  Table,
  Title,
  useAction,
  useCatalog,
  useQuery,
  useSession,
  values,
} from "./ui";

function Back({ to, children }: { to: string; children: string }) {
  return (
    <Link className="back-link" to={to}>
      <ArrowLeft size={15} />
      {children}
    </Link>
  );
}

function OrderTable({ orders }: { orders: Order[] }) {
  return (
    <Table
      headers={[
        "Requisição",
        "Hemocomponente",
        "Prioridade",
        "Situação",
        "Detalhes",
      ]}
      rows={orders.map((order) => ({
        id: order.id,
        cells: [
          <>
            <strong>#{short(order.id)}</strong>
            <small>
              {order.quantity
                ? `${order.quantity} bolsa(s)`
                : "Quantidade indisponível"}
            </small>
          </>,
          <>
            {bloodLabel(order)}
            <small>
              {order.component
                ? components[order.component]
                : "Dados do pedido indisponíveis"}
            </small>
          </>,
          order.priority ? priorities[order.priority] : "—",
          <Badge status={order.status} />,
          <Link
            className="row-link"
            to={"/pedidos/" + order.id}
            aria-label={"Abrir requisição " + short(order.id)}
          >
            <ArrowRight />
          </Link>,
        ],
      }))}
    />
  );
}

export function Dashboard() {
  const { user, orders, isDemo } = useSession();
  const analytics = ["ADMIN", "HEMOCENTRO"].includes(user.role);
  const inventory = useQuery<Inventory>(
    analytics ? "/statistics/inventory" : null,
  );
  const demand = useQuery<Demand>(analytics ? "/statistics/demand" : null);
  return (
    <>
      <Title
        section="VISÃO GERAL"
        title={"Olá, " + user.name.split(" ")[0]}
        text="Acompanhe a operação e os próximos cuidados."
        action={
          user.role === "HOSPITAL" ? (
            <Add to="/pedidos/novo">Nova requisição</Add>
          ) : (
            <Link className="button primary" to="/estoque">
              Consultar estoque
              <ArrowRight size={16} />
            </Link>
          )
        }
      />
      <div className="metric-grid">
        <Metric
          icon={<Droplets />}
          label={analytics ? "Bolsas disponíveis" : "Requisições acompanhadas"}
          value={analytics ? numeric(inventory.data?.totalBags) : orders.length}
          tone="red"
        />
        <Metric
          icon={<Clock />}
          label="Aguardando atendimento"
          value={orders.filter((order) => order.status === "PENDING").length}
          tone="amber"
        />
        <Metric
          icon={<Truck />}
          label="Em transporte"
          value={orders.filter((order) => order.status === "IN_TRANSIT").length}
          tone="blue"
        />
        <Metric
          icon={<PackageCheck />}
          label="Entregas concluídas"
          value={orders.filter((order) => order.status === "DELIVERED").length}
          tone="green"
        />
      </div>
      <p className="muted">
        {isDemo
          ? "Indicadores da operação demonstrativa."
          : "Acompanhamento desta sessão. O estoque disponível representa o resumo fornecido pela API."}
      </p>
      <div className="section-grid">
        <section>
          <div className="card-header">
            <h2>Requisições recentes</h2>
            <Link to="/pedidos">
              Ver requisições
              <ArrowRight size={14} />
            </Link>
          </div>
          <OrderTable orders={orders.slice(0, 5)} />
          {analytics && (
            <div className="card chart-card">
              <div className="card-header">
                <h2>Estoque por grupo sanguíneo</h2>
                <span className="muted">Bolsas elegíveis</span>
              </div>
              {inventory.data ? (
                <InventoryBars inventory={inventory.data} />
              ) : (
                <QueryState query={inventory} />
              )}
            </div>
          )}
        </section>
        <aside className="card attention-card">
          <span className="big-icon">
            <ClipboardList />
          </span>
          <h2>Seu próximo passo</h2>
          <p className="muted">
            {user.role === "HOSPITAL"
              ? "Informe o hemocomponente, a quantidade e o prazo de entrega para iniciar uma solicitação."
              : user.role === "HEMOCENTRO"
                ? "Consulte as requisições recebidas e solicite à plataforma a alocação das bolsas compatíveis."
                : user.role === "ADMIN"
                  ? "Mantenha unidades, usuários e a rede logística atualizados."
                  : "Consulte as informações dos transportes disponíveis para seu veículo."}
          </p>
          <Link
            className="button secondary full"
            to={user.role === "ADMIN" ? "/unidades" : "/pedidos"}
          >
            Acessar operação
            <ArrowRight size={16} />
          </Link>
          {analytics && (
            <>
              <hr />
              <p className="muted">Bolsas requisitadas</p>
              <h2>{numeric(demand.data?.overall.totalBags)}</h2>
              <Failure error={demand.error} />
            </>
          )}
        </aside>
      </div>
    </>
  );
}

function InventoryBars({ inventory }: { inventory: Inventory }) {
  if (!inventory.totalBags)
    return <p className="padded muted">Estoque elegível vazio.</p>;
  const max = Math.max(1, ...inventory.byBloodType.map((group) => group.count));
  return (
    <div className="bars">
      {inventory.byBloodType.map((group) => (
        <div className="bar" key={bloodLabel(group)}>
          <span>{bloodLabel(group)}</span>
          <i aria-hidden="true">
            <b style={{ width: `${(group.count / max) * 100}%` }} />
          </i>
          <strong>{group.count}</strong>
        </div>
      ))}
    </div>
  );
}

export function Orders() {
  const { orders, user, isDemo } = useSession();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const navigate = useNavigate();
  const filtered = orders.filter(
    (order) =>
      (!status || order.status === status) &&
      (order.id + bloodLabel(order))
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <>
      <Title
        section="OPERAÇÃO"
        title="Requisições"
        text="Do pedido à confirmação de recebimento."
        action={
          user.role === "HOSPITAL" && (
            <Add to="/pedidos/novo">Nova requisição</Add>
          )
        }
      />
      {!isDemo && (
        <p className="info">
          A API atual oferece criação, alocação e cancelamento. Os registros
          abaixo são os acompanhados nesta sessão. Para operar uma requisição
          recebida por outro canal, informe seu identificador.
        </p>
      )}
      <div className="toolbar card">
        <label className="search">
          <Search size={17} />
          <input
            aria-label="Buscar requisição"
            placeholder="Buscar por identificador ou tipo sanguíneo"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <select
          aria-label="Filtrar por situação"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="">Todas as situações</option>
          <Options items={statuses} />
        </select>
      </div>
      <OrderTable orders={filtered} />
      <form
        className="card form-card lookup"
        onSubmit={(event) => {
          event.preventDefault();
          navigate("/pedidos/" + values(event.currentTarget).id);
        }}
      >
        <label>
          Abrir operação por identificador
          <input
            name="id"
            placeholder="UUID da requisição"
            pattern={uuidPattern}
            required
          />
        </label>
        <button className="secondary">
          Abrir requisição
          <ArrowRight size={15} />
        </button>
      </form>
    </>
  );
}

export function OrderForm() {
  const { call, remember } = useSession();
  const action = useAction();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = values(event.currentTarget);
    const input: OrderInput = {
      bloodType: fields.bloodType,
      rhFactor: fields.rhFactor as OrderInput["rhFactor"],
      component: fields.component as OrderInput["component"],
      quantity: Number(fields.quantity),
      priority: fields.priority as OrderInput["priority"],
      deliveryDeadline: new Date(fields.deliveryDeadline).toISOString(),
    };
    void action.run(async () => {
      const order = await call<Order>("/requests", "POST", input);
      remember({ ...input, ...order });
      navigate("/pedidos/" + order.id);
    });
  }
  return (
    <>
      <Back to="/pedidos">Requisições</Back>
      <Title
        section="NOVA SOLICITAÇÃO"
        title="Solicitar hemocomponentes"
        text="A requisição será vinculada ao hospital da sua conta."
      />
      <div className="form-layout">
        <form className="card form-card" onSubmit={submit}>
          <h2>Dados da requisição</h2>
          <div className="field-grid">
            <BloodFields />
          </div>
          <label>
            Hemocomponente
            <select name="component">
              <Options items={components} />
            </select>
          </label>
          <div className="field-grid">
            <label>
              Quantidade de bolsas
              <input
                name="quantity"
                type="number"
                min="1"
                step="1"
                required
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value))}
              />
            </label>
            <label>
              Prioridade
              <select name="priority" defaultValue="MEDIUM">
                <Options items={priorities} />
              </select>
            </label>
          </div>
          <label>
            Prazo de entrega
            <input
              name="deliveryDeadline"
              type="datetime-local"
              required
              min={localInput(new Date())}
              defaultValue={localInput(new Date(Date.now() + 86400000))}
            />
          </label>
          <Failure error={action.error} />
          <div className="form-actions">
            <Link className="button secondary" to="/pedidos">
              Voltar
            </Link>
            <button className="primary" disabled={action.busy}>
              {action.busy ? "Enviando…" : "Criar requisição"}
              <ArrowRight size={16} />
            </button>
          </div>
        </form>
        <aside className="card summary-card">
          <h2>Resumo da solicitação</h2>
          <dl>
            <div>
              <dt>Quantidade</dt>
              <dd>{quantity} bolsa(s)</dd>
            </div>
            <div>
              <dt>Situação inicial</dt>
              <dd>Pendente</dd>
            </div>
          </dl>
          <p className="info">
            A compatibilidade e a escolha das bolsas são calculadas pelo backend
            durante a alocação. O prazo utiliza seu horário local.
          </p>
        </aside>
      </div>
    </>
  );
}

export function OrderDetail() {
  const { id = "" } = useParams();
  const { orders, user, call, remember, isDemo } = useSession();
  const order = orders.find((item) => item.id === id);
  const vehicles = useQuery<Vehicle[]>(
    user.role === "HEMOCENTRO" ? "/vehicles" : null,
  );
  const [confirm, setConfirm] = useState<
    "allocate" | "cancel" | "complete" | null
  >(null);
  const [vehicleId, setVehicleId] = useState("");
  const [allocationId, setAllocationId] = useState("");
  const [transportId, setTransportId] = useState("");
  const action = useAction();
  async function perform(operation: "allocate" | "cancel" | "complete") {
    await action.run(async () => {
      if (operation === "allocate") {
        const allocation = await call<Allocation>(
          `/requests/${id}/allocate`,
          "POST",
        );
        remember({ ...order, id, status: allocation.status, allocation });
      } else if (operation === "cancel") {
        const updated = await call<Order>(`/requests/${id}/cancel`, "POST");
        remember({ ...order, ...updated });
      } else {
        const transport = await call<Transport>(
          `/transports/${order?.transport?.id || transportId}/complete`,
          "POST",
        );
        remember({
          ...order,
          id: transport.requestId,
          status: "DELIVERED",
          transport,
        });
      }
      setConfirm(null);
    });
  }
  function start(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = values(event.currentTarget);
    void action.run(async () => {
      const transport = await call<Transport>("/transports/start", "POST", {
        allocationId: order?.allocation?.id || allocationId,
        vehicleId: fields.vehicleId,
      });
      remember({
        ...order,
        id: transport.requestId,
        status: "IN_TRANSIT",
        transport,
      });
    });
  }
  if (!new RegExp("^" + uuidPattern + "$").test(id))
    return (
      <div className="card padded">
        <h1>Identificador inválido</h1>
        <Back to="/pedidos">Voltar às requisições</Back>
      </div>
    );
  const status = order?.status;
  return (
    <>
      <Back to="/pedidos">Requisições</Back>
      <div className="detail-heading">
        <div>
          <p className="eyebrow">ACOMPANHAMENTO</p>
          <div className="title-line">
            <h1>Requisição #{short(id)}</h1>
            {status && <Badge status={status} />}
          </div>
        </div>
        {user.role === "HEMOCENTRO" && (!status || status === "PENDING") && (
          <button
            className="primary"
            onClick={() => {
              action.clear();
              setConfirm("allocate");
            }}
          >
            Alocar bolsas
            <ArrowRight size={17} />
          </button>
        )}
      </div>
      {!order && (
        <p className="info">
          Informe os identificadores necessários para operar. Os detalhes
          históricos desta requisição dependem de uma consulta de leitura ainda
          ausente na API.
        </p>
      )}
      <div className="detail-grid">
        <section className="card span-2">
          <h2>Dados do atendimento</h2>
          <p className="muted id-text">{id}</p>
          <div className="detail-values">
            <div>
              <small>Tipo sanguíneo</small>
              <strong>{bloodLabel(order || {})}</strong>
            </div>
            <div>
              <small>Componente</small>
              <strong>
                {order?.component ? components[order.component] : "—"}
              </strong>
            </div>
            <div>
              <small>Quantidade</small>
              <strong>{order?.quantity ?? "—"} bolsas</strong>
            </div>
            <div>
              <small>Prioridade</small>
              <strong>
                {order?.priority ? priorities[order.priority] : "—"}
              </strong>
            </div>
          </div>
          <p className="muted">
            Prazo de entrega · {dateTime(order?.deliveryDeadline)}
          </p>
          {order?.allocation && (
            <p className="info id-text">
              Alocação {order.allocation.id} ·{" "}
              {order.allocation.bloodBagIds.length} bolsa(s) reservada(s)
            </p>
          )}
          <h2 className="space-top">Etapas do atendimento</h2>
          <div className="timeline">
            {(
              ["PENDING", "ALLOCATED", "IN_TRANSIT", "DELIVERED"] as Status[]
            ).map((step, index, steps) => (
              <div
                key={step}
                className={
                  "timeline-item " +
                  (status &&
                  status !== "CANCELLED" &&
                  steps.indexOf(status) >= index
                    ? "done"
                    : "")
                }
              >
                <i>
                  {status &&
                  status !== "CANCELLED" &&
                  steps.indexOf(status) >= index ? (
                    <Check size={12} />
                  ) : (
                    ""
                  )}
                </i>
                <div>
                  <strong>{statuses[step]}</strong>
                  <small>
                    {step === "PENDING"
                      ? dateTime(order?.createdAt)
                      : step === "IN_TRANSIT"
                        ? dateTime(order?.transport?.startedAt)
                        : step === "DELIVERED"
                          ? dateTime(order?.transport?.completedAt)
                          : ""}
                  </small>
                </div>
              </div>
            ))}
          </div>
          {status === "CANCELLED" && (
            <p className="warning">Requisição cancelada.</p>
          )}
          {user.role === "HOSPITAL" &&
            (!status || ["PENDING", "ALLOCATED"].includes(status)) && (
              <button
                className="danger-link"
                onClick={() => {
                  action.clear();
                  setConfirm("cancel");
                }}
              >
                Cancelar requisição
              </button>
            )}
        </section>
        <aside className="card route-card">
          <h2>Rota de distribuição</h2>
          {order?.allocation?.route ? (
            <RouteView route={order.allocation.route} />
          ) : (
            <p className="muted">
              A rota será apresentada quando a alocação for concluída.
            </p>
          )}
        </aside>
        {user.role === "HEMOCENTRO" && (!status || status === "ALLOCATED") && (
          <form className="card form-card span-2" onSubmit={start}>
            <h2>Iniciar transporte</h2>
            {!order?.allocation && (
              <label>
                Identificador da alocação
                <input
                  pattern={uuidPattern}
                  required
                  value={allocationId}
                  onChange={(event) => setAllocationId(event.target.value)}
                />
              </label>
            )}
            <SearchSelect label="Veículo" name="vehicleId" required value={vehicleId} onChange={setVehicleId} options={(vehicles.data || []).map((vehicle) => ({ id: vehicle.id, label: `${vehicle.code} · ${vehicle.capacity} bolsas` }))} loading={!vehicles.data && !vehicles.error} error={vehicles.error} retry={vehicles.reload} />
            <Failure error={action.error} />
            <button
              className="primary"
              disabled={action.busy || !vehicles.data?.length}
            >
              Iniciar transporte
              <Truck size={16} />
            </button>
          </form>
        )}
        {user.role === "HOSPITAL" && (!status || status === "IN_TRANSIT") && (
          <section className="card form-card span-2">
            <h2>Confirmar recebimento</h2>
            {!order?.transport && (
              <label>
                Identificador do transporte
                <input
                  pattern={uuidPattern}
                  value={transportId}
                  onChange={(event) => setTransportId(event.target.value)}
                />
              </label>
            )}
            <button
              className="primary"
              disabled={
                !order?.transport &&
                !new RegExp("^" + uuidPattern + "$").test(transportId)
              }
              onClick={() => {
                action.clear();
                setConfirm("complete");
              }}
            >
              Confirmar entrega
              <PackageCheck size={16} />
            </button>
          </section>
        )}
      </div>
      {isDemo && (
        <p className="muted">
          As ações atualizam apenas os dados fictícios da demonstração.
        </p>
      )}
      {confirm && (
        <Confirm
          title={
            confirm === "allocate"
              ? "Alocar bolsas compatíveis?"
              : confirm === "cancel"
                ? "Cancelar esta requisição?"
                : "Confirmar recebimento?"
          }
          action={
            confirm === "allocate"
              ? "Alocar bolsas"
              : confirm === "cancel"
                ? "Confirmar cancelamento"
                : "Confirmar entrega"
          }
          busy={action.busy}
          error={action.error}
          onClose={() => setConfirm(null)}
          onConfirm={() => void perform(confirm)}
        >
          <p className="muted">
            {confirm === "allocate"
              ? "A plataforma verificará o estoque, a compatibilidade e a viabilidade da rota."
              : confirm === "cancel"
                ? "As reservas ativas serão liberadas conforme as regras do backend."
                : "Confirme após conferir o recebimento das bolsas no hospital de destino."}
          </p>
        </Confirm>
      )}
    </>
  );
}

export function Stock({ donations = false }: { donations?: boolean }) {
  const bags = useQuery<Bag[]>(donations ? null : "/blood-bags");
  const records = useQuery<Donation[]>(donations ? "/donations" : null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const query = donations ? records : bags;
  return (
    <>
      <Title
        section="HEMOCOMPONENTES"
        title={donations ? "Doações" : "Estoque de bolsas"}
        text={
          donations
            ? "Registros de coleta e bolsas de origem."
            : "Consulte o estoque e acompanhe a validade dos hemocomponentes."
        }
        action={
          <Add to={donations ? "/doacoes/nova" : "/estoque/novo"}>
            {donations ? "Registrar doação" : "Cadastrar bolsa"}
          </Add>
        }
      />
      <div className="toolbar card">
        <label className="search">
          <Search size={17} />
          <input
            aria-label="Buscar registros"
            placeholder="Buscar por identificador ou tipo sanguíneo"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        {!donations && (
          <select
            aria-label="Situação da bolsa"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">Todas as situações</option>
            <Options items={bagStatuses} />
          </select>
        )}
      </div>
      {!query.data ? (
        <QueryState query={query} />
      ) : donations ? (
        <Table
          headers={["Doação", "Centro de coleta", "Data", "Bolsas"]}
          rows={records
            .data!.filter((record) =>
              (record.donationId + record.collectionCenter)
                .toLowerCase()
                .includes(search.toLowerCase()),
            )
            .map((record) => ({
              id: record.donationId,
              cells: [
                short(record.donationId),
                record.collectionCenter,
                civil(record.collectionDate),
                record.bloodBags?.length ?? 0,
              ],
            }))}
        />
      ) : (
        <Table
          headers={["Bolsa", "Tipo", "Componente", "Validade", "Situação"]}
          rows={bags
            .data!.filter(
              (bag) =>
                (!status || bag.status === status) &&
                (bag.bloodBagId + bloodLabel(bag))
                  .toLowerCase()
                  .includes(search.toLowerCase()),
            )
            .map((bag) => ({
              id: bag.bloodBagId,
              cells: [
                short(bag.bloodBagId),
                <strong>{bloodLabel(bag)}</strong>,
                components[bag.component],
                <>
                  {civil(bag.expirationDate)}
                  {bag.expirationDate.slice(0, 10) <= today() && (
                    <small>Validade atingida</small>
                  )}
                </>,
                bagStatuses[bag.status],
              ],
            }))}
        />
      )}
    </>
  );
}

export function StockForm({ donation = false }: { donation?: boolean }) {
  const { user, call } = useSession();
  const action = useAction();
  const navigate = useNavigate();
  const [existing, setExisting] = useState(false);
  const centers = useQuery<BloodCenter[]>("/blood-centers");
  const bags = useQuery<Bag[]>(donation && existing ? "/blood-bags" : null);
  const [centerId, setCenterId] = useState(user.bloodCenterId || "");
  const [bagId, setBagId] = useState("");
  const [collectionCenter, setCollectionCenter] = useState("");
  const [editedCenter, setEditedCenter] = useState(false);
  const selectedCenter = centers.data?.find((center) => center.id === centerId);
  const back = donation ? "/doacoes" : "/estoque";
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = values(event.currentTarget);
    const body: Record<string, unknown> = { ...fields };
    if (donation) {
      if (!existing) body.bloodType = fields.bloodType;
    } else {
      body.bloodTypeEnum = fields.bloodType;
      delete body.bloodType;
      body.status = "AVAILABLE";
      body.collectionDate = new Date(fields.collectionDate).toISOString();
      body.expirationDate = new Date(fields.expirationDate).toISOString();
    }
    if (fields.volumeMl) body.volumeMl = Number(fields.volumeMl);
    void action.run(async () => {
      await call(donation ? "/donations" : "/blood-bags", "POST", body);
      navigate(back);
    });
  }
  return (
    <>
      <Back to={back}>{donation ? "Doações" : "Estoque"}</Back>
      <Title
        section="REGISTRO"
        title={donation ? "Registrar doação" : "Cadastrar bolsa"}
      />
      <form className="card form-card narrow-form" onSubmit={submit}>
        <SearchSelect label="Hemocentro" name="bloodCenterId" value={centerId} onChange={setCenterId} options={(centers.data || []).map((center) => ({ id: center.id, label: `${center.name} · ${center.city}` }))} loading={!centers.data && !centers.error} error={centers.error} retry={centers.reload} />
        {donation && (
          <>
            <label>
              Centro de coleta
              <input name="collectionCenter" required value={editedCenter ? collectionCenter : (selectedCenter?.name || "")} onChange={(event) => { setEditedCenter(true); setCollectionCenter(event.target.value); }} />
            </label>
            <label>
              Origem da bolsa
              <select
                value={existing ? "existing" : "new"}
                onChange={(event) =>
                  { setExisting(event.target.value === "existing"); setBagId(""); }
                }
              >
                <option value="new">Criar bolsa junto à doação</option>
                <option value="existing">Vincular uma bolsa cadastrada</option>
              </select>
            </label>
          </>
        )}
        {existing ? (
          <SearchSelect label="Bolsa" name="bloodBagId" required value={bagId} onChange={setBagId} options={(bags.data || []).map((bag) => ({ id: bag.bloodBagId, label: `${short(bag.bloodBagId)} · ${bloodLabel(bag)} · ${components[bag.component]} · ${civil(bag.expirationDate)}` }))} loading={!bags.data && !bags.error} error={bags.error} retry={bags.reload} />
        ) : (
          <>
            <div className="field-grid">
              <BloodFields />
            </div>
            <label>
              Hemocomponente
              <select name="component">
                <Options items={components} />
              </select>
            </label>
          </>
        )}
        <div className="field-grid">
          <label>
            Data de coleta
            <input
              name="collectionDate"
              type={donation ? "date" : "datetime-local"}
              required
              defaultValue={donation ? today() : localInput(new Date())}
            />
          </label>
          {!existing && (
            <label>
              Data de validade
              <input
                name="expirationDate"
                type={donation ? "date" : "datetime-local"}
                required
                min={donation ? today() : localInput(new Date())}
              />
            </label>
          )}
        </div>
        <DonorCpf />
        {!donation && (
          <label>
            Volume em mL
            <input name="volumeMl" type="number" min="1" step="0.1" />
          </label>
        )}
        <Failure error={action.error} />
        <div className="form-actions">
          <Link className="button secondary" to={back}>
            Voltar
          </Link>
          <button className="primary" disabled={action.busy}>
            {action.busy ? "Salvando…" : "Salvar registro"}
          </button>
        </div>
      </form>
    </>
  );
}

export function RouteView({ route }: { route: RouteInfo }) {
  const coordinates = route.geometry?.coordinates || [];
  const xs = coordinates.map((point) => point[0]),
    ys = coordinates.map((point) => point[1]);
  const minX = Math.min(...xs),
    minY = Math.min(...ys);
  const width = Math.max(...xs) - minX || 1,
    height = Math.max(...ys) - minY || 1;
  const points = coordinates
    .map(
      (point) =>
        `${20 + ((point[0] - minX) / width) * 360},${180 - ((point[1] - minY) / height) * 150}`,
    )
    .join(" ");
  return (
    <>
      {coordinates.length > 1 ? (
        <figure className="route-geometry">
          <svg
            viewBox="0 0 400 210"
            role="img"
            aria-label="Geometria do trajeto calculado"
          >
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinejoin="round"
              points={points}
            />
          </svg>
          <figcaption>
            Traçado da rota · coordenadas fornecidas pela plataforma
          </figcaption>
        </figure>
      ) : (
        <p className="muted">Geometria indisponível para este trajeto.</p>
      )}
      <div className="route-data">
        <span>
          <small>Distância</small>
          <strong>{numeric(route.distanceKm)} km</strong>
        </span>
        <span>
          <small>Duração estimada</small>
          <strong>{Math.ceil(route.estimatedDurationSeconds / 60)} min</strong>
        </span>
      </div>
    </>
  );
}

export function RoutePlanner() {
  const { call } = useSession();
  const hospitals = useCatalog<{ id: string; name: string; city: string }>("/hospitals");
  const [hospitalId, setHospitalId] = useState("");
  const [route, setRoute] = useState<RouteInfo>();
  const action = useAction();
  return (
    <>
      <Title
        section="LOGÍSTICA"
        title="Planejar rota"
        text="Verifique um trajeto viável para o destino e o prazo de entrega."
      />
      <div className="form-layout">
        <form
          className="card form-card"
          onSubmit={(event) => {
            event.preventDefault();
            const fields = values(event.currentTarget);
            setRoute(undefined);
            void action.run(async () =>
              setRoute(
                await call<RouteInfo>("/routes/calculate", "POST", {
                  ...fields,
                  deliveryDeadline: new Date(
                    fields.deliveryDeadline,
                  ).toISOString(),
                }),
              ),
            );
          }}
        >
          <SearchSelect label="Hospital de destino" name="hospitalId" required value={hospitalId} onChange={setHospitalId} options={(hospitals.data || []).map((item) => ({id:item.id, label:`${item.name} · ${item.city}`}))} loading={!hospitals.data && !hospitals.error} error={hospitals.error} retry={hospitals.reload} />
          <label>
            Hemocomponente
            <select name="component">
              <Options items={components} />
            </select>
          </label>
          <label>
            Prazo de entrega
            <input
              type="datetime-local"
              name="deliveryDeadline"
              min={localInput(new Date())}
              required
            />
          </label>
          <Failure error={action.error} />
          <button className="primary" disabled={action.busy}>
            {action.busy ? "Calculando…" : "Calcular trajeto"}
            <ArrowRight size={17} />
          </button>
        </form>
        <aside className="card summary-card">
          <h2>Prévia do trajeto</h2>
          {route ? (
            <RouteView route={route} />
          ) : (
            <p className="muted">
              Preencha o destino para visualizar a estimativa da plataforma.
            </p>
          )}
        </aside>
      </div>
    </>
  );
}

export function Tracking() {
  const { orders, isDemo } = useSession();
  return (
    <>
      <Title
        section="LOGÍSTICA"
        title="Transportes"
        text="Acompanhe os transportes registrados na operação."
      />
      <Table
        headers={["Transporte", "Requisição", "Saída", "Situação", "Detalhes"]}
        rows={orders
          .filter((order) => order.transport)
          .map((order) => ({
            id: order.transport!.id,
            cells: [
              short(order.transport!.id),
              short(order.id),
              dateTime(order.transport!.startedAt),
              <Badge status={order.transport!.status} />,
              <Link
                className="row-link"
                aria-label="Abrir transporte"
                to={"/pedidos/" + order.id}
              >
                <ArrowRight />
              </Link>,
            ],
          }))}
      />
      <p className="info">
        {isDemo
          ? "A demonstração acompanha os transportes fictícios criados no fluxo de alocação."
          : "Acompanhamento dos comprovantes desta sessão. Consultas históricas de transportes e telemetria aguardam endpoints de leitura na API."}
      </p>
    </>
  );
}

export function Reports() {
  const [period, setPeriod] = useState("");
  const inventory = useQuery<Inventory>("/statistics/inventory");
  const demand = useQuery<Demand>("/statistics/demand" + period);
  return (
    <>
      <Title
        section="INDICADORES"
        title="Estatísticas da rede"
        text="Disponibilidade de estoque e distribuição da demanda."
      />
      <form
        className="toolbar card"
        onSubmit={(event) => {
          event.preventDefault();
          const fields = values(event.currentTarget);
          const query = new URLSearchParams();
          if (fields.from)
            query.set("from", new Date(fields.from).toISOString());
          if (fields.to) query.set("to", new Date(fields.to).toISOString());
          setPeriod(query.size ? "?" + query.toString() : "");
        }}
      >
        <label>
          De
          <input name="from" type="datetime-local" />
        </label>
        <label>
          Até
          <input name="to" type="datetime-local" />
        </label>
        <button className="secondary">Aplicar período à demanda</button>
      </form>
      {demand.data ? (
        <>
          <div className="metric-grid">
            <Metric
              label="Requisições"
              value={numeric(demand.data.overall.requestCount)}
              icon={<ClipboardList />}
              tone="red"
            />
            <Metric
              label="Bolsas solicitadas"
              value={numeric(demand.data.overall.totalBags)}
              icon={<Droplets />}
              tone="blue"
            />
            <Metric
              label="Média de bolsas"
              value={numeric(demand.data.overall.mean)}
              icon={<Clock />}
              tone="amber"
            />
            <Metric
              label="Mediana de bolsas"
              value={numeric(demand.data.overall.median)}
              icon={<PackageCheck />}
              tone="green"
            />
          </div>
          {demand.data.overall.warning && (
            <p className="warning">{demand.data.overall.warning}</p>
          )}
          <Table
            headers={["Hospital", "Requisições", "Bolsas", "Média", "Mediana"]}
            rows={demand.data.byHospital.map((hospital) => ({
              id: hospital.hospitalId,
              cells: [
                hospital.hospitalName,
                hospital.metrics.requestCount,
                hospital.metrics.totalBags,
                numeric(hospital.metrics.mean),
                numeric(hospital.metrics.median),
              ],
            }))}
          />
          <div className="card padded space-top">
            <h2>Dispersão da demanda</h2>
            <dl className="statistics-values">
              <div>
                <dt>Variância populacional · bolsas²</dt>
                <dd>{numeric(demand.data.overall.populationVariance)}</dd>
              </div>
              <div>
                <dt>Desvio padrão populacional · bolsas</dt>
                <dd>
                  {numeric(demand.data.overall.populationStandardDeviation)}
                </dd>
              </div>
              <div>
                <dt>Variância amostral · bolsas²</dt>
                <dd>{numeric(demand.data.overall.sampleVariance)}</dd>
              </div>
              <div>
                <dt>Desvio padrão amostral · bolsas</dt>
                <dd>{numeric(demand.data.overall.sampleStandardDeviation)}</dd>
              </div>
            </dl>
          </div>
        </>
      ) : (
        <QueryState query={demand} />
      )}
      <div className="card chart-card">
        <div className="card-header">
          <h2>Estoque disponível por tipo</h2>
        </div>
        {inventory.data ? (
          <InventoryBars inventory={inventory.data} />
        ) : (
          <QueryState query={inventory} />
        )}
      </div>
    </>
  );
}

