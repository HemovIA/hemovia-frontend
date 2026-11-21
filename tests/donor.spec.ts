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


test('@spec:AC-101 seleção de vínculo limpa ao trocar perfil', async ({page}) => {
  await page.goto('http://127.0.0.1:5179/');
  await page.getByRole('button', {name:'Administrador', exact:true}).click();
  await page.getByRole('link', {name:'Cadastros', exact:true}).click();
  await page.getByRole('link', {name:/Usuários/}).click();
  await page.getByRole('button', {name:'Novo cadastro'}).click();
  await page.getByLabel('Vínculo').fill('Restauração');
  await page.getByRole('button', {name:/Hospital da Restauração/}).click();
  await expect(page.locator('input[name=hospitalId]')).not.toHaveValue('');
  await page.locator('select[name=role]').selectOption('HEMOCENTRO');
  await expect(page.locator('input[name=bloodCenterId]')).toHaveValue('');
  await page.getByLabel('Vínculo').fill('Hemope');
  await page.getByRole('button', {name:/Hemope Recife/}).click();
  await expect(page.locator('input[name=bloodCenterId]')).not.toHaveValue('');
});

test('@spec:AC-104 consultas persistidas sobrevivem à recarga', async ({page}) => {
  const id = '10000000-0000-4000-8000-000000000010';
  const request = { id, hospitalId:'10000000-0000-4000-8000-000000000001', bloodType:'O', rhFactor:'POSITIVE', component:'RED_BLOOD_CELLS', quantity:1, priority:'HIGH', status:'ALLOCATED', createdAt:'2026-01-01T12:00:00Z', deliveryDeadline:'2027-01-01T12:00:00Z' };
  await page.route('**/api/v1/**', async route => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace('/api/v1','');
    let body: unknown;
    if (path === '/auth/me') body = {id:'10000000-0000-4000-8000-000000000005', name:'Operador', role:'HEMOCENTRO', bloodCenterId:'10000000-0000-4000-8000-000000000002'};
    else if (path === '/requests') body = {content:[request], page:0, size:100, totalElements:1, totalPages:1};
    else if (path === '/transports') body = {content:[], page:0, size:100, totalElements:0, totalPages:0};
    else if (path === `/requests/${id}`) body = {request, allocations:[{id:'10000000-0000-4000-8000-000000000012', status:'ALLOCATED', createdAt:'2026-01-01T12:00:00Z', bags:[{id:'10000000-0000-4000-8000-000000000013', status:'RESERVED'}], route:{distanceKm:2, estimatedDurationSeconds:60, coordinates:[[1,2],[3,4]]}, transportId:null}]};
    else if (path === '/vehicles') body = [{id:'10000000-0000-4000-8000-000000000003', code:'V-01', capacity:2}];
    else if (path === '/statistics/inventory') body = {totalBags:1, byComponent:[], byBloodType:[], byBloodTypeAndComponent:[]};
    else if (path === '/statistics/demand') body = {overall:{requestCount:0,totalBags:0,mean:0,median:0,populationVariance:0,sampleVariance:0,populationStandardDeviation:0,sampleStandardDeviation:0},byHospital:[]};
    else body = {};
    await route.fulfill({json:body});
  });
  await page.goto('http://127.0.0.1:5179/');
  await page.getByRole('link', {name:'Requisições', exact:true}).click();
  await expect(page.getByText('#10000000')).toBeVisible();
  await page.getByRole('link', {name:/Abrir requisição/}).click();
  await expect(page.getByText(/1 bolsa\(s\) reservada/)).toBeVisible();
  await expect(page.getByText('2 km', {exact:false})).toBeVisible();
  await page.reload();
  await expect(page.getByText(/1 bolsa\(s\) reservada/)).toBeVisible();
  await expect(page.getByLabel('Veículo')).toBeVisible();
});

test('@spec:AC-102 @spec:AC-105 hospitais além da primeira página estão acessíveis', async ({page}) => {
  await page.route('**/api/v1/**', async route => {
    const url = new URL(route.request().url()); const path = url.pathname.replace('/api/v1','');
    let body: unknown;
    if (path === '/auth/me') body = {id:'10000000-0000-4000-8000-000000000007', name:'Admin', role:'ADMIN'};
    else if (path === '/hospitals') body = url.searchParams.get('page') === '0' ? {content:[{id:'10000000-0000-4000-8000-000000000001',name:'Hospital Primeiro',city:'Recife'}],totalPages:2} : {content:[{id:'10000000-0000-4000-8000-000000000002',name:'Hospital Distante',city:'Olinda'}],totalPages:2};
    else if (path === '/requests' || path === '/transports') body = {content:[],totalPages:0};
    else if (path === '/statistics/inventory') body = {totalBags:0,byComponent:[],byBloodType:[],byBloodTypeAndComponent:[]};
    else if (path === '/statistics/demand') body = {overall:{requestCount:0,totalBags:0,mean:0,median:0,populationVariance:0,sampleVariance:0,populationStandardDeviation:0,sampleStandardDeviation:0},byHospital:[]};
    else body = [];
    await route.fulfill({json:body});
  });
  await page.goto('http://127.0.0.1:5179/');
  await page.getByRole('link', {name:'Cadastros', exact:true}).click();
  await page.getByRole('link', {name:/Hospitais/}).click();
  await expect(page.getByText('Hospital Distante')).toBeVisible();
});
