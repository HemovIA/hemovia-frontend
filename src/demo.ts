import {
  today,
  uid,
  type Allocation,
  type Bag,
  type Count,
  type Demand,
  type Donation,
  type Inventory,
  type Metrics,
  type Order,
  type OrderInput,
  type Role,
  type RouteInfo,
  type Transport,
  type User,
} from "./domain";

const fixed = (n: number) =>
  "10000000-0000-4000-8000-" + String(n).padStart(12, "0");
const hospital = fixed(1),
  center = fixed(2),
  vehicle = fixed(3);
export const demoUsers: Record<Role, User> = {
  HOSPITAL: {
    id: fixed(4),
    name: "Marina Costa",
    role: "HOSPITAL",
    hospitalId: hospital,
  },
  HEMOCENTRO: {
    id: fixed(5),
    name: "Rafael Lima",
    role: "HEMOCENTRO",
    bloodCenterId: center,
  },
  TRANSPORTADOR: {
    id: fixed(6),
    name: "João Melo",
    role: "TRANSPORTADOR",
    vehicleId: vehicle,
  },
  ADMIN: { id: fixed(7), name: "Camila Alves", role: "ADMIN" },
};
export const demoUnit = {
  HOSPITAL: "Hospital da Restauração",
  HEMOCENTRO: "Hemope Recife",
  TRANSPORTADOR: "Veículo HMV-04",
  ADMIN: "Rede Hemovia",
};
const route: RouteInfo = {
  distanceKm: 2.4,
  estimatedDurationSeconds: 540,
  geometry: {
    coordinates: [
      [-34.898, -8.052],
      [-34.897, -8.053],
      [-34.895, -8.052],
      [-34.891, -8.055],
    ],
  },
};
export type Row = { id: string } & Record<
  string,
  string | number | boolean | null
>;
type State = {
  orders: Order[];
  bags: Bag[];
  donations: Donation[];
  catalogs: Record<string, Row[]>;
};
function seed(): State {
  const now = new Date().toISOString();
  return {
    orders: [
      {
        id: fixed(10),
        hospitalId: hospital,
        bloodType: "O",
        rhFactor: "POSITIVE",
        component: "RED_BLOOD_CELLS",
        quantity: 1,
        priority: "MEDIUM",
        status: "PENDING",
        createdAt: now,
        deliveryDeadline: new Date(Date.now() + 86400000).toISOString(),
      },
    ],
    bags: Array.from({ length: 32 }, (_, index) => ({
      bloodBagId: fixed(100 + index),
      status: "AVAILABLE",
      bloodType: ["O", "A", "B", "AB"][index % 4],
      rhFactor: index % 3 ? "POSITIVE" : "NEGATIVE",
      component: "RED_BLOOD_CELLS",
      collectionDate: today(),
      expirationDate: new Date(Date.now() + (10 + index) * 86400000)
        .toISOString()
        .slice(0, 10),
      bloodCenterId: center,
    })),
    donations: [],
    catalogs: {
      "/vehicles": [{ id: vehicle, code: "HMV-04", capacity: 4 }],
      "/hospitals": [
        {
          id: hospital,
          name: demoUnit.HOSPITAL,
          city: "Recife",
          latitude: -8.055,
          longitude: -34.891,
          priority: 3,
        },
      ],
      "/blood-centers": [
        {
          id: center,
          name: demoUnit.HEMOCENTRO,
          city: "Recife",
          latitude: -8.052,
          longitude: -34.898,
        },
      ],
      "/users": Object.values(demoUsers).map((u, i) => ({
        ...u,
        active: true,
        email: "demo" + i + "@example.org",
      })),
      "/route-graph/nodes": [
        {
          id: fixed(11),
          name: demoUnit.HEMOCENTRO,
          bloodCenterId: center,
          latitude: -8.052,
          longitude: -34.898,
        },
        {
          id: fixed(12),
          name: demoUnit.HOSPITAL,
          hospitalId: hospital,
          latitude: -8.055,
          longitude: -34.891,
        },
      ],
      "/route-graph/edges": [
        {
          id: fixed(13),
          fromNodeId: fixed(11),
          toNodeId: fixed(12),
          distanceKm: route.distanceKm,
          travelSeconds: route.estimatedDurationSeconds,
        },
      ],
    },
  };
}
const key = "hemovia.demo.v1";
export function resetDemo() {
  localStorage.setItem(key, JSON.stringify(seed()));
}
function read(): State {
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      const state = JSON.parse(saved) as State;
      if (
        Array.isArray(state.orders) &&
        Array.isArray(state.bags) &&
        Array.isArray(state.donations) &&
        state.catalogs
      )
        return state;
    } catch {
      /* A demonstração pode ser reconstruída quando seus dados locais estão corrompidos. */
    }
  }
  const state = seed();
  localStorage.setItem(key, JSON.stringify(state));
  return state;
}
function required<T>(v: T | null | undefined, message: string): T {
  if (v == null) throw Error(message);
  return v;
}
const eligible = (b: Bag) =>
  b.status === "AVAILABLE" && b.expirationDate.slice(0, 10) > today();
export function demoOrders(user: User) {
  return read().orders.filter((o) =>
    user.role === "HOSPITAL"
      ? o.hospitalId === user.hospitalId
      : user.role === "TRANSPORTADOR"
        ? o.transport?.vehicleId === user.vehicleId
        : true,
  );
}
function inventory(bags: Bag[]): Inventory {
  const available = bags.filter(eligible);
  function group(keys: (keyof Bag)[]) {
    const groups = new Map<string, Count>();
    for (const bag of available) {
      const fields = Object.fromEntries(keys.map((k) => [k, bag[k]])),
        id = JSON.stringify(fields);
      const entry = groups.get(id) || { ...fields, count: 0, percentage: 0 };
      entry.count++;
      entry.percentage = (100 * entry.count) / available.length;
      groups.set(id, entry);
    }
    return [...groups.values()];
  }
  return {
    referenceDate: today(),
    totalBags: available.length,
    byBloodType: group(["bloodType", "rhFactor"]),
    byComponent: group(["component"]),
    byBloodTypeAndComponent: group(["bloodType", "rhFactor", "component"]),
  };
}
function metrics(orders: Order[]): Metrics {
  const q = orders.map((o) => o.quantity!).sort((a, b) => a - b),
    n = q.length,
    total = q.reduce((a, b) => a + b, 0);
  const mean = n ? total / n : 0,
    squares = q.reduce((s, v) => s + (v - mean) ** 2, 0);
  return {
    requestCount: n,
    totalBags: total,
    mean,
    median: n ? (q[Math.floor((n - 1) / 2)] + q[Math.floor(n / 2)]) / 2 : 0,
    populationVariance: n ? squares / n : 0,
    sampleVariance: n > 1 ? squares / (n - 1) : 0,
    populationStandardDeviation: n ? Math.sqrt(squares / n) : 0,
    sampleStandardDeviation: n > 1 ? Math.sqrt(squares / (n - 1)) : 0,
    warning: n < 2 ? "Amostra insuficiente para dispersão (n < 2)." : undefined,
  };
}
function preview(hospitalId: string, deadline: string) {
  if (
    hospitalId !== hospital ||
    Date.parse(deadline) < Date.now() + route.estimatedDurationSeconds * 1000
  )
    throw Error(
      "Não há trajeto demonstrativo viável para este destino e prazo.",
    );
  return route;
}
type Values = Record<string, string | number>;
function execute(
  state: State,
  user: User,
  url: string,
  method: string,
  data: Values,
): unknown {
  const [path, query] = url.split("?"),
    parts = path.split("/"),
    now = new Date().toISOString();
  if (path === "/statistics/inventory") return inventory(state.bags);
  if (path === "/statistics/demand") {
    const params = new URLSearchParams(query),
      from = params.get("from"),
      to = params.get("to");
    const orders = state.orders.filter(
      (o) => (!from || o.createdAt! >= from) && (!to || o.createdAt! < to),
    );
    const overall = metrics(orders);
    return {
      overall,
      byHospital: orders.length
        ? [
            {
              hospitalId: hospital,
              hospitalName: demoUnit.HOSPITAL,
              metrics: overall,
            },
          ]
        : [],
    } satisfies Demand;
  }
  if (path === "/routes/calculate")
    return preview(String(data.hospitalId), String(data.deliveryDeadline));
  if (path === "/requests" && method === "POST") {
    if (user.role !== "HOSPITAL" || !user.hospitalId)
      throw Error("É necessário um vínculo hospitalar.");
    const input = data as unknown as OrderInput;
    if (
      !Number.isInteger(input.quantity) ||
      input.quantity < 1 ||
      !(Date.parse(input.deliveryDeadline) > Date.now())
    )
      throw Error("Confira a quantidade e o prazo.");
    const order: Order = {
      ...input,
      id: uid(),
      hospitalId: user.hospitalId,
      createdAt: now,
      status: "PENDING",
    };
    state.orders.unshift(order);
    return order;
  }
  if (parts[1] === "requests" || parts[1] === "transports") {
    const order = required(
      state.orders.find((o) =>
        parts[1] === "requests"
          ? o.id === parts[2]
          : path === "/transports/start"
            ? o.allocation?.id === data.allocationId
            : o.transport?.id === parts[2],
      ),
      "Operação não encontrada.",
    );
    const assigned = state.bags.filter((b) =>
      order.allocation?.bloodBagIds.includes(b.bloodBagId),
    );
    if (
      parts[3] === "allocate" &&
      user.role === "HEMOCENTRO" &&
      order.status === "PENDING"
    ) {
      if (order.component !== "RED_BLOOD_CELLS")
        throw Error("A alocação atende somente hemácias.");
      const compatible = state.bags
        .filter(
          (b) =>
            eligible(b) &&
            b.bloodCenterId === user.bloodCenterId &&
            b.component === order.component &&
            (b.bloodType === "O" ||
              b.bloodType === order.bloodType ||
              order.bloodType === "AB") &&
            (b.rhFactor === "NEGATIVE" || order.rhFactor === "POSITIVE"),
        )
        .sort((a, b) => a.expirationDate.localeCompare(b.expirationDate));
      if (compatible.length < order.quantity!)
        throw Error("Estoque compatível insuficiente para atender ao pedido.");
      const chosen = compatible.slice(0, order.quantity);
      const allocation: Allocation = {
        id: uid(),
        requestId: order.id,
        status: "ALLOCATED",
        bloodBagIds: chosen.map((b) => b.bloodBagId),
        route: preview(order.hospitalId!, order.deliveryDeadline!),
      };
      chosen.forEach((b) => (b.status = "RESERVED"));
      order.allocation = allocation;
      order.status = "ALLOCATED";
      return allocation;
    }
    if (
      parts[3] === "cancel" &&
      user.hospitalId === order.hospitalId &&
      user.role === "HOSPITAL" &&
      ["ALLOCATED", "PENDING"].includes(order.status)
    ) {
      assigned.forEach((b) => (b.status = "AVAILABLE"));
      order.status = "CANCELLED";
      return order;
    }
    if (
      path === "/transports/start" &&
      user.role === "HEMOCENTRO" &&
      order.status === "ALLOCATED"
    ) {
      const selected = required(
        state.catalogs["/vehicles"].find((v) => v.id === data.vehicleId),
        "Selecione um veículo.",
      );
      if (
        Number(selected.capacity) < assigned.length ||
        state.orders.some(
          (o) =>
            o.status === "IN_TRANSIT" && o.transport?.vehicleId === selected.id,
        )
      )
        throw Error("Veículo ocupado ou com capacidade insuficiente.");
      const trip: Transport = {
        id: uid(),
        requestId: order.id,
        allocationId: order.allocation!.id,
        vehicleId: selected.id,
        status: "IN_TRANSIT",
        startedAt: now,
      };
      assigned.forEach((b) => (b.status = "IN_TRANSIT"));
      order.status = "IN_TRANSIT";
      order.transport = trip;
      return trip;
    }
    if (
      parts[3] === "complete" &&
      user.hospitalId === order.hospitalId &&
      user.role === "HOSPITAL" &&
      order.status === "IN_TRANSIT"
    ) {
      assigned.forEach((b) => (b.status = "DELIVERED"));
      order.status = "DELIVERED";
      Object.assign(order.transport!, {
        status: "DELIVERED",
        completedAt: now,
      });
      return order.transport;
    }
    throw Error("Ação indisponível para este perfil ou situação.");
  }
  if (parts[1] === "blood-bags" || parts[1] === "donations") {
    const donation = parts[1] === "donations";
    if (method === "GET") {
      const records = donation ? state.donations : state.bags;
      if (!parts[2]) return records;
      return required(
        records.find(
          (r) => ("bloodBagId" in r ? r.bloodBagId : r.donationId) === parts[2],
        ),
        "Registro não encontrado.",
      );
    }
    let bag: Bag;
    if (donation && data.bloodBagId) {
      bag = required(
        state.bags.find((b) => b.bloodBagId === data.bloodBagId),
        "Bolsa não encontrada.",
      );
      if (
        state.donations.some((d) =>
          d.bloodBags.some((b) => b.bloodBagId === bag.bloodBagId),
        )
      )
        throw Error("Bolsa já vinculada a uma doação.");
    } else {
      bag = {
        bloodBagId: uid(),
        bloodType: String(data.bloodTypeEnum ?? data.bloodType),
        rhFactor: data.rhFactor as Bag["rhFactor"],
        component: data.component as Bag["component"],
        collectionDate: String(data.collectionDate).slice(0, 10),
        expirationDate: String(data.expirationDate).slice(0, 10),
        status: "AVAILABLE",
        bloodCenterId: String(data.bloodCenterId || center),
      };
      state.bags.unshift(bag);
    }
    if (!donation) return bag;
    const record = {
      donationId: uid(),
      collectionDate: String(data.collectionDate),
      collectionCenter: String(data.collectionCenter),
      bloodBags: [bag],
    };
    state.donations.unshift(record);
    return record;
  }
  const resource = Object.keys(state.catalogs).find(
    (key) => path === key || path.startsWith(key + "/"),
  );
  if (!resource) throw Error("Consulta indisponível.");
  const rows = state.catalogs[resource],
    [id, operation] = path.slice(resource.length + 1).split("/");
  if (method === "GET")
    return id
      ? required(
          rows.find((r) => r.id === id),
          "Registro não encontrado.",
        )
      : rows;
  if (user.role !== "ADMIN") throw Error("Acesso restrito à administração.");
  const { password, ...fields } = data;
  if (method === "POST") {
    const row: Row = { ...fields, id: uid() };
    if (resource === "/users") row.active = true;
    if (resource === "/vehicles" && rows.some((r) => r.code === row.code))
      throw Error("Código de veículo já cadastrado.");
    if (resource === "/route-graph/edges") {
      const nodes = state.catalogs["/route-graph/nodes"];
      if (
        row.fromNodeId === row.toNodeId ||
        ![row.fromNodeId, row.toNodeId].every((v) =>
          nodes.some((n) => n.id === v),
        )
      )
        throw Error("Selecione dois nós distintos da rede.");
      if (row.fromNodeId !== fixed(11) || row.toNodeId !== fixed(12))
        throw Error(
          "A demonstração possui geometria apenas para o trajeto Hemope → Hospital da Restauração.",
        );
      Object.assign(row, {
        distanceKm: route.distanceKm,
        travelSeconds: route.estimatedDurationSeconds,
      });
    }
    rows.push(row);
    return row;
  }
  const row = required(
    rows.find((r) => r.id === id),
    "Registro não encontrado.",
  );
  if (method === "DELETE") {
    rows.splice(rows.indexOf(row), 1);
    return;
  }
  if (operation === "deactivate") {
    row.active = false;
    return;
  }
  if (operation === "role")
    Object.assign(row, {
      hospitalId: null,
      bloodCenterId: null,
      vehicleId: null,
    });
  Object.assign(row, fields);
  return row;
}
export async function demo<T>(
  user: User,
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const perform = () => {
    const state = read(),
      result = execute(state, user, path, method, (body ?? {}) as Values);
    if (method !== "GET") localStorage.setItem(key, JSON.stringify(state));
    return result as T;
  };
  return method !== "GET" && navigator.locks
    ? navigator.locks.request(key, perform)
    : perform();
}
