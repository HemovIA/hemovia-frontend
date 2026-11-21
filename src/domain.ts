export const roles = {
  HOSPITAL: "Hospital",
  HEMOCENTRO: "Hemocentro",
  TRANSPORTADOR: "Transportador",
  ADMIN: "Administrador",
};
export type Role = keyof typeof roles;
export const components = {
  RED_BLOOD_CELLS: "Hemácias",
  WHOLE_BLOOD: "Sangue total",
  PLASMA: "Plasma",
  PLATELETS: "Plaquetas",
  CRYOPRECIPITATE: "Crioprecipitado",
};
export const priorities = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
  CRITICAL: "Crítica",
};
export const statuses = {
  PENDING: "Pendente",
  ALLOCATED: "Alocado",
  IN_TRANSIT: "Em trânsito",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
};
export const bagStatuses = {
  AVAILABLE: "Disponível",
  RESERVED: "Reservada",
  IN_TRANSIT: "Em trânsito",
  DELIVERED: "Entregue",
  DISCARDED: "Descartada",
};
export type Component = keyof typeof components;
export type Blood = {
  bloodType: string;
  rhFactor: "POSITIVE" | "NEGATIVE";
  component: Component;
};
export type User = {
  id: string;
  name: string;
  role: Role;
  hospitalId?: string;
  bloodCenterId?: string;
  vehicleId?: string;
};
export type OrderInput = Blood & {
  quantity: number;
  priority: keyof typeof priorities;
  deliveryDeadline: string;
};
export type RouteInfo = {
  distanceKm: number;
  estimatedDurationSeconds: number;
  geometry?: { coordinates: number[][] };
};
export type Allocation = {
  id: string;
  requestId: string;
  status: Status;
  bloodBagIds: string[];
  route?: RouteInfo;
};
export type Transport = {
  id: string;
  requestId: string;
  allocationId: string;
  vehicleId: string;
  status: "IN_TRANSIT" | "DELIVERED";
  startedAt: string;
  completedAt?: string;
};
export type Status = keyof typeof statuses;
export type Order = Partial<OrderInput> & {
  id: string;
  status: Status;
  hospitalId?: string;
  createdAt?: string;
  allocation?: Allocation;
  transport?: Transport;
};
export type Bag = Blood & {
  bloodBagId: string;
  status: keyof typeof bagStatuses;
  collectionDate: string;
  expirationDate: string;
  bloodCenterId?: string;
  donorId?: string;
};
export type Donation = {
  donationId: string;
  donorId?: string;
  bloodCenterId?: string;
  collectionCenter: string;
  collectionDate: string;
  bloodBags: Bag[];
};
export type Vehicle = { id: string; code: string; capacity: number };
export type Count = Partial<Blood> & { count: number; percentage: number };
export type Inventory = {
  referenceDate: string;
  totalBags: number;
  byComponent: Count[];
  byBloodType: Count[];
  byBloodTypeAndComponent: Count[];
};
export type Metrics = {
  requestCount: number;
  totalBags: number;
  mean: number | null;
  median: number | null;
  populationVariance: number | null;
  sampleVariance: number | null;
  populationStandardDeviation: number | null;
  sampleStandardDeviation: number | null;
  warning?: string;
};
export type Demand = {
  overall: Metrics;
  byHospital: { hospitalId: string; hospitalName: string; metrics: Metrics }[];
};
export const bloodLabel = (
  b: Pick<Partial<Blood>, "bloodType" | "rhFactor">,
) =>
  b.bloodType ? b.bloodType + (b.rhFactor === "POSITIVE" ? "+" : "−") : "—";
export const dateTime = (value?: string) =>
  value
    ? new Date(value).toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "Horário indisponível";
export const localInput = (date: Date) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
export const civil = (iso: string) =>
  iso.slice(0, 10).split("-").reverse().join("/");
export const today = () => new Date().toISOString().slice(0, 10);
export const short = (id: string) => id.slice(0, 8).toUpperCase();
export const uid = () => crypto.randomUUID();
export const uuidPattern =
  "[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}";
export const numeric = (n?: number | null) =>
  n == null ? "—" : n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });

export type Donor = { id: string; name: string; cpf: string; email?: string | null; phoneNumber?: string | null };
export type BloodCenter = { id: string; name: string; city: string };
export type Hospital = { id: string; name: string; city: string };
export type Page<T> = { content: T[]; page: number; size: number; totalElements: number; totalPages: number };
export function validCpf(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;
  for (let length = 9; length <= 10; length++) {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += Number(digits[i]) * (length + 1 - i);
    const remainder = sum % 11;
    if (Number(digits[length]) !== (remainder < 2 ? 0 : 11 - remainder)) return false;
  }
  return true;
}
