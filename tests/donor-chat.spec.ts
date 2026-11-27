import { expect, test, type Page, type Route } from "@playwright/test";

test.use({ launchOptions: { executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" } });

const baseUrl = process.env.HEMOVIA_FRONTEND_URL || "http://127.0.0.1:5179";
const faqUrl = "https://www.gov.br/saude/pt-br/composicao/saes/doacao-de-sangue/faq";
const answer = {
  answer: "O hemocentro confirma os requisitos na triagem.",
  sources: [{ title: "Ministério da Saúde", url: faqUrl }],
};
const donor = {
  id: "10000000-0000-4000-8000-000000000141",
  name: "Doadora Exemplo",
  role: "DOADOR",
  email: "doadora@example.org",
};

type Message = { role: string; content: string };

async function openDonorArea(page: Page, reply: (route: Route) => Promise<void>) {
  let currentUser: typeof donor | undefined = donor;
  await page.route("**/api/v1/**", async (route) => {
    switch (new URL(route.request().url()).pathname) {
      case "/api/v1/auth/me":
        return currentUser ? route.fulfill({ json: currentUser }) : route.fulfill({ status: 401 });
      case "/api/v1/auth/csrf":
        return route.fulfill({ headers: { "Set-Cookie": "XSRF-TOKEN=teste-chat; Path=/" } });
      case "/api/v1/auth/logout":
        currentUser = undefined;
        return route.fulfill({ status: 204 });
      case "/api/v1/auth/login":
        currentUser = { ...donor, id: "10000000-0000-4000-8000-000000000142", name: "Outra doadora" };
        return route.fulfill({ json: currentUser });
      case "/api/v1/donation-chat/messages":
        return reply(route);
      default:
        return route.fulfill({ status: 404 });
    }
  });
  await page.goto(baseUrl);
  await expect(page).toHaveURL(/\/area-do-doador$/);
  await expect(page.getByRole("heading", { name: "Área do doador" })).toBeVisible();
}

async function ask(page: Page, question: string) {
  await page.getByLabel("Sua pergunta").fill(question);
  await page.getByRole("button", { name: "Enviar pergunta" }).click();
}

test("@spec:AC-132 doadora envia pergunta e recebe resposta com fonte oficial", async ({ page }) => {
  const question = "Como me preparo para a primeira doação?";
  await page.setViewportSize({ width: 360, height: 760 });
  await openDonorArea(page, async (route) => {
    expect(route.request().method()).toBe("POST");
    expect(route.request().headers()["x-xsrf-token"]).toBe("teste-chat");
    expect(route.request().postDataJSON()).toEqual({ messages: [{ role: "user", content: question }] });
    await route.fulfill({ json: answer });
  });

  await expect(page.getByRole("heading", { name: "Dados da conta" })).toBeVisible();
  await expect(page.getByText(donor.name)).toBeVisible();
  await page.getByRole("button", { name: "Ativar tema escuro" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: question }).click();
  await expect(page.getByLabel("Sua pergunta")).toBeFocused();
  await expect(page.getByLabel("Sua pergunta")).toHaveValue(question);
  await page.getByRole("button", { name: "Enviar pergunta" }).click();

  const log = page.getByRole("log", { name: "Conversa com o assistente" });
  await expect(log.getByText(question, { exact: true })).toBeVisible();
  await expect(log.getByText(answer.answer, { exact: true })).toBeVisible();
  await expect(log.getByRole("link", { name: "Ministério da Saúde" })).toHaveAttribute("href", faqUrl);
  expect(await page.locator("body").evaluate((body) => body.scrollWidth)).toBeLessThanOrEqual(360);
});

test("@spec:AC-133 chat envia o contexto e limpa ao recomeçar, recarregar ou sair", async ({ page }) => {
  const requests: Message[][] = [];
  await openDonorArea(page, async (route) => {
    requests.push(route.request().postDataJSON().messages);
    await route.fulfill({ json: answer });
  });
  const log = page.getByRole("log");
  const first = "Posso fazer minha primeira doação?";
  const followUp = "E quanto ao preparo?";
  await ask(page, first);
  await expect(log.getByText(answer.answer)).toHaveCount(1);
  await ask(page, followUp);
  await expect(log.getByText(answer.answer)).toHaveCount(2);
  expect(requests[1]).toEqual([
    { role: "user", content: first },
    { role: "assistant", content: answer.answer },
    { role: "user", content: followUp },
  ]);

  await page.getByRole("button", { name: "Nova conversa" }).click();
  await expect(log).toBeEmpty();
  await expect(page.getByLabel("Sua pergunta")).toBeFocused();
  await ask(page, first);
  await expect(log.getByText(answer.answer)).toBeVisible();
  expect(requests[2]).toEqual([{ role: "user", content: first }]);

  await page.reload();
  await expect(log).toBeEmpty();
  await ask(page, first);
  await expect(log.getByText(answer.answer)).toBeVisible();
  await page.getByRole("button", { name: "Sair", exact: true }).click();

  await page.getByLabel("E-mail ou CPF").fill("outra@example.org");
  await page.getByLabel("Senha", { exact: true }).fill("senha-sintetica");
  await page.getByRole("button", { name: "Entrar na plataforma" }).click();
  await expect(page.getByText("Outra doadora")).toBeVisible();
  await expect(log).toBeEmpty();
  await expect(page.getByLabel("Sua pergunta")).toBeEmpty();
});

test("@spec:AC-134 falha preserva a pergunta, mostra o FAQ e permite repetir o envio", async ({ page }) => {
  let release!: () => void;
  const failureGate = new Promise<void>((resolve) => { release = resolve; });
  const requests: Message[][] = [];
  const question = "Onde posso doar?";
  await openDonorArea(page, async (route) => {
    requests.push(route.request().postDataJSON().messages);
    if (requests.length > 1) return route.fulfill({ json: answer });
    await failureGate;
    return route.fulfill({ status: 503, json: { message: "Assistente indisponível" } });
  });

  await ask(page, question);
  try {
    await expect(page.getByRole("status").filter({ hasText: "Buscando orientação" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Enviar pergunta" })).toBeDisabled();
    await expect(page.getByRole("log").getByText(question)).toBeVisible();
  } finally {
    release();
  }
  await expect(page.getByRole("alert")).toContainText("O assistente está indisponível");
  await expect(page.getByRole("link", { name: "FAQ do Ministério da Saúde" })).toHaveAttribute("href", faqUrl);
  await expect(page.getByLabel("Sua pergunta")).toHaveValue(question);
  await page.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(page.getByRole("log").getByText(answer.answer)).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("log").getByText(question)).toHaveCount(1);
  expect(requests[1]).toEqual(requests[0]);
});

test("@spec:AC-138 envio limita o contexto recente sem persistir a conversa", async ({ page }) => {
  const requests: Message[][] = [];
  await openDonorArea(page, async (route) => {
    requests.push(route.request().postDataJSON().messages);
    await route.fulfill({ json: { answer: answer.answer.repeat(30), sources: answer.sources } });
  });
  const input = page.getByLabel("Sua pergunta");
  const send = page.getByRole("button", { name: "Enviar pergunta" });
  const privateQuestion = "Pergunta particular sintética";

  await expect(input).toHaveAttribute("maxlength", "1000");
  await input.fill("   ");
  await expect(send).toBeDisabled();
  await ask(page, `${privateQuestion} 1`);
  await expect(page.getByRole("log").getByText(answer.answer.repeat(30), { exact: true })).toHaveCount(1);
  for (let index = 2; index <= 6; index += 1) {
    await ask(page, `  ${privateQuestion} ${index}  `);
    await expect(page.getByRole("log").getByText(answer.answer.repeat(30), { exact: true })).toHaveCount(index);
  }

  const last = requests.at(-1)!;
  expect(last).toHaveLength(9);
  expect(last.filter(({ role }) => role === "user").map(({ content }) => content)).toEqual(
    [2, 3, 4, 5, 6].map((index) => `${privateQuestion} ${index}`),
  );
  expect(last.every(({ content }) => content.length <= 1000)).toBe(true);
  expect(JSON.stringify(last)).not.toContain(donor.email);
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }))).not.toContain(privateQuestion);
});
