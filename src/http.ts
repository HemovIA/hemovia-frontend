const base = (import.meta.env.VITE_API_BASE_URL || "/api/v1").replace(
  /\/$/,
  "",
);
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly fields: Record<string, string> = {},
  ) {
    super(message);
  }
}
async function send<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (method !== "GET" && path !== "/auth/login") {
    let token = csrfCookie();
    if (!token) {
      await send("/auth/csrf");
      token = csrfCookie();
    }
    if (!token)
      throw new ApiError(
        "O navegador não recebeu o cookie de proteção. Verifique a origem da API e as configurações de cookies.",
        403,
      );
    headers["X-XSRF-TOKEN"] = token;
  }
  let response: Response;
  try {
    response = await fetch(base + path, {
      method,
      headers,
      credentials: "include",
      signal: AbortSignal.timeout(15000),
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      method === "GET"
        ? "Não foi possível conectar à API."
        : "Conexão interrompida. Verifique o resultado antes de repetir a operação.",
      0,
    );
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(
      error.message ||
        (response.status === 401
          ? "Credenciais ou sessão inválidas."
          : "Falha na API (HTTP " + response.status + ")."),
      response.status,
      error.fieldErrors,
    );
  }
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}
const csrfCookie = () =>
  decodeURIComponent(
    document.cookie
      .split("; ")
      .find((x) => x.startsWith("XSRF-TOKEN="))
      ?.slice(11) || "",
  );
let refreshing: Promise<unknown> | undefined;
export async function http<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  try {
    return await send<T>(path, method, body);
  } catch (error) {
    if (
      !(error instanceof ApiError) ||
      error.status !== 401 ||
      path === "/auth/login"
    )
      throw error;
    refreshing ??= send("/auth/refresh", "POST").finally(() => {
      refreshing = undefined;
    });
    try {
      await refreshing;
      return await send<T>(path, method, body);
    } catch (retry) {
      if (retry instanceof ApiError && retry.status === 401)
        window.dispatchEvent(new Event("hemovia:expired"));
      throw retry;
    }
  }
}
