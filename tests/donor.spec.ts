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
    else if (path === `/requests/${id}`) body = {request, allocations:[{id:'10000000-0000-4000-8000-000000000012', status:'ALLOCATED', createdAt:'2026-01-02T12:00:00Z', bags:[{id:'10000000-0000-4000-8000-000000000013', status:'RESERVED'}], route:{distanceKm:2, estimatedDurationSeconds:60, coordinates:[[1,2],[3,4]]}, transportId:null},{id:'10000000-0000-4000-8000-000000000014',status:'CANCELLED',createdAt:'2026-01-01T12:00:00Z',bags:[],route:null,transportId:null}]};
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
  await expect(page.getByRole('region',{name:'Histórico de alocações'}).getByText(/10000000-0000-4000-8000-000000000014/)).toBeVisible();
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
test('recebimento aguarda consulta do transporte', async ({page}) => {
  const id='10000000-0000-4000-8000-000000000010', transportId='10000000-0000-4000-8000-000000000030';
  const request={id, hospitalId:'10000000-0000-4000-8000-000000000001', bloodType:'O', rhFactor:'POSITIVE', component:'RED_BLOOD_CELLS', quantity:1, priority:'HIGH', status:'IN_TRANSIT', createdAt:'2026-01-01T12:00:00Z', deliveryDeadline:'2027-01-01T12:00:00Z'};
  let release!: () => void; const gate = new Promise<void>(resolve => { release=resolve; });
  await page.route('**/api/v1/**', async route => {
    const path=new URL(route.request().url()).pathname.replace('/api/v1',''); let body: unknown;
    if (path==='/auth/me') body={id:'10000000-0000-4000-8000-000000000004',name:'Hospital',role:'HOSPITAL',hospitalId:request.hospitalId};
    else if (path==='/requests') body={content:[request],totalPages:1};
    else if (path==='/transports') body={content:[],totalPages:0};
    else if (path===`/requests/${id}`) body={request,allocations:[{id:'10000000-0000-4000-8000-000000000012',status:'IN_TRANSIT',createdAt:'2026-01-01T12:00:00Z',bags:[],route:{distanceKm:2,estimatedDurationSeconds:60,coordinates:[]},transportId}]};
    else if (path===`/transports/${transportId}`) { await gate; body={transport:{id:transportId,requestId:id,allocationId:'10000000-0000-4000-8000-000000000012',vehicleId:'10000000-0000-4000-8000-000000000003',status:'IN_TRANSIT',startedAt:'2026-01-01T12:00:00Z'},route:null,bloodBagIds:[]}; }
    else body={};
    await route.fulfill({json:body});
  });
  await page.goto(`http://127.0.0.1:5179/pedidos/${id}`, {waitUntil:"commit"});
  const button=page.getByRole('button',{name:'Confirmar entrega'});
  await expect(button).toBeDisabled();
  await expect(page.getByText('Carregando transporte…')).toBeVisible();
  release();
  await expect(button).toBeEnabled();
});
test('troca de identidade não exibe pedidos da sessão anterior', async ({page}) => {
  const id='10000000-0000-4000-8000-000000000010';
  const userA={id:'10000000-0000-4000-8000-000000000004',name:'Sessão A',role:'HOSPITAL',hospitalId:'10000000-0000-4000-8000-000000000001'};
  const userB={id:'10000000-0000-4000-8000-000000000005',name:'Sessão B',role:'HOSPITAL',hospitalId:'10000000-0000-4000-8000-000000000002'};
  const order={id,hospitalId:userA.hospitalId,bloodType:'O',rhFactor:'POSITIVE',component:'RED_BLOOD_CELLS',quantity:1,priority:'HIGH',status:'PENDING'};
  let current=userA; let release!: () => void; const gate=new Promise<void>(resolve => {release=resolve;});
  await page.route('**/api/v1/**', async route => {
    const path=new URL(route.request().url()).pathname.replace('/api/v1',''); let body: unknown;
    if(path==='/auth/me') body=userA;
    else if(path==='/auth/login') {current=userB; body=userB;}
    else if(path==='/requests') { if(current===userB) await gate; body={content:current===userA?[order]:[],totalPages:1}; }
    else if(path==='/transports') body={content:[],totalPages:0};
    else body={};
    await route.fulfill({json:body});
  });
  await page.goto('http://127.0.0.1:5179/');
  await page.getByRole('link',{name:'Requisições',exact:true}).click();
  await expect(page.getByText('#10000000')).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event('hemovia:expired')));
  await page.getByLabel('E-mail ou CPF').fill('b@example.org');
  await page.getByLabel('Senha',{exact:true}).fill('senha');
  await page.getByRole('button',{name:/Entrar na plataforma/}).click();
  await page.getByRole('link',{name:'Requisições',exact:true}).click();
  await expect(page.getByText('#10000000')).toHaveCount(0);
  release();
  await expect(page.getByText('Nenhum registro encontrado.')).toBeVisible();
});
test('@spec:AC-098 @spec:AC-099 hemocentro vinculado preenche coleta sem sobrescrever edição', async ({page}) => {
  await page.goto('http://127.0.0.1:5179/'); await page.getByRole('button',{name:'Hemocentro',exact:true}).click();
  await page.evaluate(() => { const key='hemovia.demo.v1'; const state=JSON.parse(localStorage.getItem(key)!); state.catalogs['/blood-centers'].push({id:'10000000-0000-4000-8000-000000000099',name:'Outra Unidade',city:'Olinda'}); localStorage.setItem(key,JSON.stringify(state)); });
  await page.getByRole('link',{name:'Doações',exact:true}).click(); await page.getByRole('link',{name:'Registrar doação'}).click();
  await expect(page.getByLabel('Hemocentro')).toHaveValue('Hemope Recife · Recife');
  await expect(page.getByLabel('Centro de coleta')).toHaveValue('Hemope Recife');
  await page.getByLabel('Hemocentro').fill('Outra'); await page.getByRole('button',{name:/Outra Unidade/}).click();
  await expect(page.getByLabel('Centro de coleta')).toHaveValue('Outra Unidade');
  await page.getByLabel('Centro de coleta').fill('Coleta móvel');
  await page.getByLabel('Hemocentro').fill('Hemope'); await page.getByRole('button',{name:/Hemope Recife/}).click();
  await expect(page.getByLabel('Centro de coleta')).toHaveValue('Coleta móvel');
  await expect(page.locator('input[name=bloodCenterId]')).toHaveValue('10000000-0000-4000-8000-000000000002');
});

test('@spec:AC-100 @spec:AC-103 bolsa por teclado exige opção e envia identificador', async ({page}) => {
  await page.goto('http://127.0.0.1:5179/'); await page.getByRole('button',{name:'Hemocentro',exact:true}).click();
  await page.getByRole('link',{name:'Doações',exact:true}).click(); await page.getByRole('link',{name:'Registrar doação'}).click();
  await page.getByLabel('Origem da bolsa').selectOption('existing');
  const bag=page.getByRole('combobox',{name:'Bolsa',exact:true}); await bag.fill('10000000');
  await page.getByRole('button',{name:'Salvar registro'}).click();
  await expect(page.locator('input[name=bloodBagId]')).toHaveValue('');
  await expect(bag).toBeFocused();
  await bag.press('ArrowDown'); await bag.press('Enter');
  const selected=await page.locator('input[name=bloodBagId]').inputValue(); expect(selected).toMatch(/^[0-9a-f-]{36}$/);
  await page.getByRole('button',{name:'Salvar registro'}).click();
  await expect(page.getByRole('heading',{name:'Doações'})).toBeVisible();
  const ids=await page.evaluate(() => JSON.parse(localStorage.getItem('hemovia.demo.v1')!).donations[0].bloodBags.map((x:{bloodBagId:string}) => x.bloodBagId));
  expect(ids).toContain(selected);
});

test('@spec:AC-102 carregamento, falha, tentativa e catálogo vazio são distintos', async ({page}) => {
  let attempts=0, fail=true, release!: () => void; const gate=new Promise<void>(resolve=>{release=resolve;});
  await page.route('**/api/v1/**', async route => {
    const path=new URL(route.request().url()).pathname.replace('/api/v1','');
    if(path==='/hospitals') { attempts++; if(fail) { await gate; await route.fulfill({status:503,json:{message:'Serviço indisponível'}}); } else await route.fulfill({json:{content:[],totalPages:0}}); return; }
    if(path==='/auth/me') return route.fulfill({json:{id:'10000000-0000-4000-8000-000000000005',name:'Operador',role:'HEMOCENTRO',bloodCenterId:'10000000-0000-4000-8000-000000000002'}});
    return route.fulfill({json:{content:[],totalPages:0}});
  });
  await page.goto('http://127.0.0.1:5179/logistica', {waitUntil:'commit'});
  await page.getByLabel('Hospital de destino').focus();
  await expect(page.getByRole('status').filter({hasText:'Carregando'})).toBeVisible();
  release();
  await expect(page.getByRole('alert')).toContainText('Serviço indisponível');
  fail=false;
  await page.getByRole('button',{name:'Tentar novamente'}).click();
  await expect(page.getByText('Nenhum resultado encontrado.')).toBeVisible();
  expect(attempts).toBeGreaterThanOrEqual(2);
});
test('@spec:AC-106 demonstração opera doador, pedido e transporte sem API real', async ({page}) => {
  await page.goto('http://127.0.0.1:5179/'); await page.getByRole('button',{name:'Hemocentro',exact:true}).click();
  let calls=0; page.on('request', request => { if(new URL(request.url()).pathname.startsWith('/api/')) calls++; });
  await expect(page.getByText(/Demonstração/).first()).toBeVisible();
  await page.getByRole('link',{name:'Doações',exact:true}).click(); await page.getByRole('link',{name:'Registrar doação'}).click();
  await page.getByLabel('CPF do doador (opcional)').fill('11144477735'); await page.getByRole('button',{name:'Buscar doador'}).click();
  await page.getByRole('button',{name:'Cadastrar doador'}).click(); await page.getByLabel('Nome',{exact:true}).fill('Doador Demo'); await page.getByRole('button',{name:'Confirmar cadastro'}).click();
  await expect(page.getByText(/Doador selecionado: Doador Demo/)).toBeVisible();
  await page.getByRole('link',{name:'Requisições',exact:true}).click(); await page.getByRole('link',{name:/Abrir requisição/}).first().click();
  await page.getByRole('button',{name:'Alocar bolsas'}).click(); await page.getByRole('dialog').getByRole('button',{name:'Alocar bolsas'}).click();
  await expect(page.getByRole('heading',{name:'Iniciar transporte'})).toBeVisible();
  await page.getByLabel('Veículo').fill('HMV'); await page.getByRole('button',{name:/HMV-04/}).click();
  await page.getByRole('button',{name:'Iniciar transporte'}).click(); await expect(page.getByText('Em trânsito').first()).toBeVisible();
  await page.getByLabel('Perfil da demonstração').selectOption('HOSPITAL');
  await page.getByRole('complementary',{name:'Navegação principal'}).getByRole('link',{name:'Requisições',exact:true}).click(); await page.getByRole('link',{name:/Abrir requisição/}).first().click();
  await page.getByRole('button',{name:'Confirmar entrega'}).click(); await page.getByRole('dialog').getByRole('button',{name:'Confirmar entrega'}).click();
  await expect(page.getByText('Entregue').first()).toBeVisible(); expect(calls).toBe(0);
});


test('@spec:AC-096 resposta atrasada de CPF não substitui busca mais recente', async ({page}) => {
  let release!:()=>void; const gate=new Promise<void>(resolve=>{release=resolve;});
  await page.route('**/api/v1/**', async route=>{
    const url=new URL(route.request().url()), path=url.pathname.replace('/api/v1','');
    if(path==='/auth/me') return route.fulfill({json:{id:'10000000-0000-4000-8000-000000000007',name:'Admin',role:'ADMIN'}});
    if(path==='/donors') { const cpf=url.searchParams.get('cpf')!.replace(/\D/g,''); if(cpf==='52998224725') await gate; return route.fulfill({json:{id:cpf==='52998224725'?'10000000-0000-4000-8000-000000000020':'10000000-0000-4000-8000-000000000021',cpf,name:cpf==='52998224725'?'Pessoa Antiga':'Pessoa Atual'}}); }
    if(path==='/blood-centers') return route.fulfill({json:[]});
    return route.fulfill({json:{content:[],totalPages:0}});
  });
  await page.goto('http://127.0.0.1:5179/doacoes/nova');
  const cpf=page.getByLabel('CPF do doador (opcional)'); await cpf.fill('52998224725'); await page.getByRole('button',{name:'Buscar doador'}).click();
  await cpf.fill('11144477735'); await page.getByRole('button',{name:'Buscar doador'}).click();
  await expect(page.getByText(/Doador selecionado: Pessoa Atual/)).toBeVisible();
  const stale = page.waitForResponse(response => response.url().includes("52998224725")); release(); await stale;
  await expect(page.getByText(/Doador selecionado: Pessoa Atual/)).toBeVisible();
  await expect(page.locator('input[name=donorId]')).toHaveValue('10000000-0000-4000-8000-000000000021');
});
test('@spec:AC-097 conflito no cadastro não cria seleção nem apaga formulário', async ({page}) => {
  await page.route('**/api/v1/**', async route=>{
    const url=new URL(route.request().url()), path=url.pathname.replace('/api/v1','');
    if(path==='/auth/me') return route.fulfill({json:{id:'10000000-0000-4000-8000-000000000007',name:'Admin',role:'ADMIN'}});
    if(path==='/donors') return route.fulfill({status:route.request().method()==='GET'?404:409,json:{message:route.request().method()==='GET'?'Não encontrado':'CPF já cadastrado'}});
    if(path==='/auth/csrf') return route.fulfill({headers:{'set-cookie':'XSRF-TOKEN=teste; Path=/'},json:{}});
    if(path==='/blood-centers') return route.fulfill({json:[]});
    return route.fulfill({json:{content:[],totalPages:0}});
  });
  await page.goto('http://127.0.0.1:5179/doacoes/nova');
  await page.getByLabel('Centro de coleta').fill('Unidade móvel');
  await page.getByLabel('CPF do doador (opcional)').fill('52998224725'); await page.getByRole('button',{name:'Buscar doador'}).click();
  await page.getByRole('button',{name:'Cadastrar doador'}).click(); await page.getByLabel('Nome',{exact:true}).fill('Pessoa de teste');
  await page.getByRole('button',{name:'Confirmar cadastro'}).click();
  await expect(page.getByRole('alert')).toContainText('CPF já cadastrado');
  await expect(page.getByLabel('Centro de coleta')).toHaveValue('Unidade móvel');
  await expect(page.locator('input[name=donorId]')).toHaveValue('');
});
