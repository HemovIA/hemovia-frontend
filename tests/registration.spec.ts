import { expect, test, type Page } from "@playwright/test";

test.use({ launchOptions: { executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" } });

const app = "http://127.0.0.1:5179";
const token = "a".repeat(43);
const email = "doadora@example.org";
const password = "SenhaSegura!2026";

async function mockRegistration(page: Page) {
  const writes: { path: string; body: unknown; csrf: string | undefined }[] = [];
  const operationalRequests: string[] = [];
  let registered = false;
  let signedIn = false;
  const donor = { id: "conta-doadora", name: "Pessoa Doadora", role: "DOADOR" };
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace("/api/v1", "");
    switch (path) {
      case "/auth/csrf":
        return route.fulfill({ status: 204, headers: { "Set-Cookie": "XSRF-TOKEN=csrf-teste; Path=/" } });
      case "/auth/register":
      case "/auth/register/confirm":
        writes.push({ path, body: request.postDataJSON(), csrf: request.headers()["x-xsrf-token"] });
        if (path === "/auth/register") return route.fulfill({ status: 202 });
        if (request.postDataJSON().cpf === "11111111111") {
          return route.fulfill({ status: 400, json: { message: "CPF inválido." } });
        }
        registered = true;
        return route.fulfill({ status: 201 });
      case "/auth/login":
        if (registered && request.postDataJSON().password === password) {
          signedIn = true;
          return route.fulfill({ json: donor });
        }
        return route.fulfill({ status: 401 });
      case "/auth/me":
        return signedIn ? route.fulfill({ json: donor }) : route.fulfill({ status: 401 });
      case "/auth/logout":
        signedIn = false;
        return route.fulfill({ status: 204 });
      case "/auth/refresh":
        return route.fulfill({ status: 401 });
      default:
        operationalRequests.push(path);
        return route.fulfill({ status: 403 });
    }
  });
  return { writes, operationalRequests };
}

test("@spec:AC-124 login oferece cadastro por e-mail e mantém o acesso público", async ({ page }) => {
  const { writes } = await mockRegistration(page);
  await page.goto(app);
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByRole("button", { name: "Enviar link de confirmação" }).click();
  await expect(page.getByRole("status")).toContainText("receberá um link de confirmação");
  expect(writes).toEqual([{ path: "/auth/register", body: { email }, csrf: "csrf-teste" }]);
  await page.getByRole("button", { name: "Voltar ao login" }).click();
  await expect(page.getByRole("button", { name: "Entrar na plataforma" })).toBeVisible();
});

test("@spec:AC-130 confirma o cadastro, corrige dados inválidos e entra sem abrir a operação", async ({ page }) => {
  const { writes, operationalRequests } = await mockRegistration(page);
  await page.goto(app + "/#confirmar-cadastro=" + token);
  await expect(page.getByRole("heading", { name: "Concluir cadastro" })).toBeVisible();
  await page.getByLabel("Nome completo").fill("Pessoa Doadora");
  await page.getByLabel("CPF", { exact: true }).fill("111.111.111-11");
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByLabel("Confirmar senha").fill("SenhaDiferente!");
  await page.getByRole("button", { name: "Criar minha conta" }).click();
  await expect(page.getByRole("alert")).toHaveText("As duas senhas precisam ser iguais.");
  expect(writes).toHaveLength(0);

  await page.getByLabel("Confirmar senha").fill(password);
  await page.getByRole("button", { name: "Criar minha conta" }).click();
  await expect(page.getByRole("alert")).toHaveText("CPF inválido.");
  await page.getByLabel("CPF", { exact: true }).fill("529.982.247-25");
  await page.getByRole("button", { name: "Criar minha conta" }).click();
  await expect(page.getByRole("status")).toContainText("Conta criada.");
  expect(new URL(page.url()).hash).toBe("");
  expect(writes.at(-1)).toEqual({
    path: "/auth/register/confirm",
    body: { token, name: "Pessoa Doadora", cpf: "52998224725", password },
    csrf: "csrf-teste",
  });

  await page.getByLabel("E-mail ou CPF").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar na plataforma" }).click();
  await expect(page.getByRole("heading", { name: "Conta de doador" })).toBeVisible();
  await page.goto(app + "/estoque");
  await expect(page.getByRole("heading", { name: "Conta de doador" })).toBeVisible();
  expect(operationalRequests).toEqual([]);
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(page.getByRole("button", { name: "Entrar na plataforma" })).toBeVisible();
});
