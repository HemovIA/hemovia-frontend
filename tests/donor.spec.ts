import { test, expect } from '@playwright/test';
test.use({ launchOptions: { executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' } });
test('@spec:AC-096 @spec:AC-097 cadastro preserva formulário e vincula doador', async ({page}) => {
  await page.goto('http://127.0.0.1:5179/');
  await page.getByRole('button', {name:'Hemocentro', exact:true}).click();
  await page.getByRole('link', {name:'Doações', exact:true}).click();
  await page.getByRole('link', {name:'Registrar doação'}).click();
  await expect(page.getByLabel('Centro de coleta')).toHaveValue('Hemope Recife');
  await page.getByLabel('Centro de coleta').fill('Coleta externa');
  await page.getByLabel('CPF do doador (opcional)').fill('111.444.777-35');
  await page.getByRole('button',{name:'Buscar doador'}).click();
  await page.getByRole('button',{name:'Cadastrar doador'}).click();
  await page.getByLabel('Nome',{exact:true}).fill('Pessoa Sintética');
  await page.getByRole('button',{name:'Confirmar cadastro'}).click();
  await expect(page.getByText(/Doador selecionado: Pessoa Sintética/)).toBeVisible();
  await expect(page.getByLabel('Centro de coleta')).toHaveValue('Coleta externa');
  await expect(page.locator('input[name=donorId]')).not.toHaveValue('');
  await page.getByLabel('CPF do doador (opcional)').fill('529.982.247-25');
  await expect(page.locator('input[name=donorId]')).toHaveValue('');
  await page.getByRole('button',{name:'Buscar doador'}).click();
  await expect(page.getByText(/Doador selecionado: Doador Exemplo/)).toBeVisible();
});


