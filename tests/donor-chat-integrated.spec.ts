import { createServer } from "node:http";
import { expect, test } from "@playwright/test";

test.use({
  launchOptions: { executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" },
});

test("@spec:AC-135 a pergunta sobre tatuagem passa pelo navegador, API e provedor isolado", async ({ page }) => {
  const question = "Fiz uma tatuagem há três meses. Posso doar sangue?";
  const port = Number(process.env.HEMOVIA_TEST_CHAT_MODEL_PORT);
  expect(port, "Execute com o ambiente isolado test-formularios.ps1").toBeGreaterThan(0);
  const requests: string[] = [];
  const provider = createServer(async (request, response) => {
    if (request.method !== "POST" || request.url !== "/api/chat") {
      response.writeHead(404).end();
      return;
    }
    request.setEncoding("utf8");
    let body = "";
    for await (const chunk of request) body += chunk;
    requests.push(body);
    response.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({
      message: { content: JSON.stringify({ cards: ["tatuagem-tres-meses"] }) },
    }));
  });
  try {
    await new Promise<void>((resolve, reject) => {
      provider.once("error", reject);
      provider.listen(port, "127.0.0.1", resolve);
    });
    await page.goto("http://127.0.0.1:5180/");
    await page.getByLabel("E-mail ou CPF").fill("qa-doadora-chat@example.org");
    await page.getByLabel("Senha", { exact: true }).fill("SenhaTeste123!");
    await page.getByRole("button", { name: /Entrar na plataforma/ }).click();
    await page.getByLabel("Sua pergunta").fill(question);
    await page.getByRole("button", { name: "Enviar pergunta" }).click();

    const chat = page.getByRole("log", { name: "Conversa com o assistente" });
    await expect(chat).toContainText(/(?:7|sete) dias/i);
    await expect(chat).toContainText(/(?:4|quatro) meses/i);
    await expect(chat).toContainText(/hemocentro/i);
    await expect(chat.getByRole("link", { name: /Portaria/ })).toHaveAttribute(
      "href",
      "https://bvsms.saude.gov.br/bvs/saudelegis/gm/2026/prt11685_03_07_2026.html",
    );
    expect(requests).toHaveLength(1);
    const providerRequest = JSON.parse(requests[0]);
    expect(providerRequest.messages.at(-1)).toEqual({ role: "user", content: question });
    expect(requests[0]).not.toMatch(/qa-doadora-chat@example\.org|11144477735|Doadora Chat Sintetica/);
  } finally {
    if (provider.listening) await new Promise<void>(resolve => provider.close(() => resolve()));
  }
});
