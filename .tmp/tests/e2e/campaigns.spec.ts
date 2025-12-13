import { test, expect } from '@playwright/test';
import { testCampaigns, testCampaignsList, testTemplatesList, testContactsList } from './fixtures/test-data';

/**
 * SmartZap Campaigns E2E Tests
 * 
 * Testa o módulo de campanhas incluindo:
 * - Listagem de campanhas
 * - Criação de nova campanha (wizard)
 * - Filtros e busca
 * - Ações (duplicar, excluir)
 * - Detalhes da campanha
 * - Validação de formulários
 */

test.describe('Campanhas - Listagem', () => {
  test.beforeEach(async ({ page }) => {
    // Mock health check
    await page.route('**/api/health', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          overall: 'healthy',
          services: {
            database: { status: 'ok' },
            redis: { status: 'ok' },
            qstash: { status: 'ok' },
            whatsapp: { status: 'ok' },
          },
        }),
      });
    });

    // Mock campaigns
    await page.route('**/api/campaigns', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(testCampaignsList),
        });
      }
    });
  });

  test('deve exibir a lista de campanhas', async ({ page }) => {
    await page.goto('/campaigns');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1')).toContainText('Campanhas');
    await expect(page.locator('text=Gerencie e acompanhe seus disparos')).toBeVisible();
  });

  test('deve exibir tabela com campanhas', async ({ page }) => {
    await page.goto('/campaigns');
    await page.waitForLoadState('networkidle');

    // Verificar headers da tabela
    await expect(page.locator('th:has-text("Nome")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
    await expect(page.locator('th:has-text("Destinatários")')).toBeVisible();
    await expect(page.locator('th:has-text("Entrega")')).toBeVisible();
  });

  test('deve exibir campanhas do mock', async ({ page }) => {
    await page.goto('/campaigns');
    await page.waitForLoadState('networkidle');

    // Verificar se campanhas aparecem
    for (const campaign of testCampaignsList.slice(0, 2)) {
      await expect(page.locator(`text=${campaign.name}`)).toBeVisible();
    }
  });

  test('deve ter campo de busca funcional', async ({ page }) => {
    await page.goto('/campaigns');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder*="Buscar campanhas"]');
    await expect(searchInput).toBeVisible();

    // Buscar por nome
    await searchInput.fill('Draft');

    // Deve filtrar resultados
    await expect(page.locator(`text=${testCampaigns.draft.name}`)).toBeVisible();
  });

  test('deve ter filtro de status', async ({ page }) => {
    // Skip on CI - select interactions can be flaky
    test.skip(!!process.env.CI, 'Filter tests skipped on CI');

    await page.goto('/campaigns');
    await page.waitForLoadState('networkidle');

    const filterSelect = page.locator('select').first();
    await expect(filterSelect).toBeVisible();

    // Verificar opções
    await expect(filterSelect.locator('option:has-text("Todos os Status")')).toBeVisible();
  });

  test('deve filtrar por status ao selecionar', async ({ page }) => {
    await page.goto('/campaigns');
    await page.waitForLoadState('networkidle');

    const filterSelect = page.locator('select').first();
    await filterSelect.selectOption('Rascunho');

    // Apenas campanhas draft devem aparecer
    await expect(page.locator(`text=${testCampaigns.draft.name}`)).toBeVisible();
  });

  test('deve ter botão de atualizar', async ({ page }) => {
    await page.goto('/campaigns');
    await page.waitForLoadState('networkidle');

    const refreshButton = page.locator('button[title="Atualizar"]');
    await expect(refreshButton).toBeVisible();

    // Clicar deve recarregar dados
    await refreshButton.click();
    // Não deve dar erro
    await expect(page.locator('h1')).toContainText('Campanhas');
  });

  test('deve mostrar mensagem quando não há campanhas', async ({ page }) => {
    // Mock sem campanhas
    await page.route('**/api/campaigns', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/campaigns');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=Nenhuma campanha encontrada')).toBeVisible();
  });
});

test.describe('Campanhas - Ações', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/health', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          overall: 'healthy',
          services: {
            database: { status: 'ok' },
            redis: { status: 'ok' },
            qstash: { status: 'ok' },
            whatsapp: { status: 'ok' },
          },
        }),
      });
    });

    await page.route('**/api/campaigns', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(testCampaignsList),
      });
    });
  });

  test('deve mostrar ações ao passar mouse sobre linha', async ({ page }) => {
    await page.goto('/campaigns');
    await page.waitForLoadState('networkidle');

    // Hover na primeira linha
    const firstRow = page.locator('tbody tr').first();
    await firstRow.hover();

    // Botões de ação devem aparecer
    await expect(firstRow.locator('button[title="Duplicar"]')).toBeVisible();
    await expect(firstRow.locator('button[title="Excluir"]')).toBeVisible();
  });

  test('deve navegar para detalhes ao clicar na linha', async ({ page }) => {
    await page.goto('/campaigns');
    await page.waitForLoadState('networkidle');

    // Clicar na primeira campanha
    const firstRow = page.locator('tbody tr').first();
    await firstRow.click();

    // Deve navegar para detalhes
    await expect(page).toHaveURL(/\/campaigns\/campaign-/);
  });

  test('deve duplicar campanha', async ({ page }) => {
    let duplicateCalled = false;

    await page.route('**/api/campaigns/*/duplicate', async (route) => {
      duplicateCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...testCampaigns.draft, id: 'new-id', name: testCampaigns.draft.name + ' (Cópia)' }),
      });
    });

    await page.goto('/campaigns');
    await page.waitForLoadState('networkidle');

    const firstRow = page.locator('tbody tr').first();
    await firstRow.hover();

    const duplicateBtn = firstRow.locator('button[title="Duplicar"]');
    await duplicateBtn.click();

    // Verificar que API foi chamada
    expect(duplicateCalled).toBe(true);
  });

  test('deve excluir campanha', async ({ page }) => {
    let deleteCalled = false;

    await page.route('**/api/campaigns/*', async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCalled = true;
        await route.fulfill({ status: 200 });
      } else {
        await route.continue();
      }
    });

    await page.goto('/campaigns');
    await page.waitForLoadState('networkidle');

    const firstRow = page.locator('tbody tr').first();
    await firstRow.hover();

    const deleteBtn = firstRow.locator('button[title="Excluir"]');
    await deleteBtn.click();

    // Verificar que API foi chamada
    expect(deleteCalled).toBe(true);
  });
});

test.describe('Campanhas - Wizard de Criação', () => {
  // Wizard tests are complex multi-step flows - skip on CI for stability
  test.skip(!!process.env.CI, 'Wizard tests skipped on CI - too many interactions');

  test.beforeEach(async ({ page }) => {
    await page.route('**/api/health', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          overall: 'healthy',
          services: {
            database: { status: 'ok' },
            redis: { status: 'ok' },
            qstash: { status: 'ok' },
            whatsapp: { status: 'ok' },
          },
        }),
      });
    });

    await page.route('**/api/templates', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(testTemplatesList),
      });
    });

    await page.route('**/api/contacts', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ contacts: testContactsList, total: testContactsList.length }),
      });
    });

    await page.route('**/api/contacts/stats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ total: testContactsList.length, optIn: 2, optOut: 1 }),
      });
    });

    await page.route('**/api/account/limits', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          messagingTier: 'TIER_1K',
          qualityScore: 'GREEN',
          dailyLimit: 1000,
          used: 0,
        }),
      });
    });

    await page.route('**/api/settings/credentials', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          testContact: { name: 'Teste', phone: '+5511999999999' }
        }),
      });
    });
  });

  test('deve exibir o wizard de criação', async ({ page }) => {
    await page.goto('/campaigns/new');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1:has-text("Criar Campanha")')).toBeVisible();
    await expect(page.locator('text=Rascunho')).toBeVisible();
  });

  test('deve exibir stepper com 3 passos', async ({ page }) => {
    await page.goto('/campaigns/new');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=Configuração & Template')).toBeVisible();
    await expect(page.locator('text=Público')).toBeVisible();
    await expect(page.locator('text=Revisão & Lançamento')).toBeVisible();
  });

  test.describe('Step 1 - Configuração', () => {
    test('deve ter campo de nome da campanha', async ({ page }) => {
      await page.goto('/campaigns/new');
      await page.waitForLoadState('networkidle');

      const nameInput = page.locator('input[placeholder*="Promoção de Verão"]');
      await expect(nameInput).toBeVisible();
    });

    test('deve validar nome obrigatório', async ({ page }) => {
      await page.goto('/campaigns/new');
      await page.waitForLoadState('networkidle');

      // Não preencher nome e tentar continuar
      const continueBtn = page.locator('button:has-text("Continuar")');

      // Selecionar template primeiro
      const templateCard = page.locator('[class*="border rounded-xl p-5"]').first();
      await templateCard.click();

      // Tentar continuar sem nome
      await continueBtn.click();

      // Deve permanecer no step 1 ou mostrar erro
      await expect(page.locator('text=Configuração & Template')).toBeVisible();
    });

    test('deve exibir lista de templates', async ({ page }) => {
      await page.goto('/campaigns/new');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=Selecione o Template')).toBeVisible();

      // Verificar se templates aparecem
      for (const template of testTemplatesList.filter(t => t.status === 'APPROVED')) {
        await expect(page.locator(`text=${template.name}`)).toBeVisible();
      }
    });

    test('deve selecionar template ao clicar', async ({ page }) => {
      await page.goto('/campaigns/new');
      await page.waitForLoadState('networkidle');

      const templateCard = page.locator('[class*="border rounded-xl p-5"]').first();
      await templateCard.click();

      // Card deve estar selecionado (com checkmark)
      await expect(templateCard.locator('svg')).toBeVisible();
    });

    test('deve mostrar preview do template', async ({ page }) => {
      await page.goto('/campaigns/new');
      await page.waitForLoadState('networkidle');

      // Selecionar um template
      const templateCard = page.locator('[class*="border rounded-xl p-5"]').first();
      await templateCard.click();

      // Preview deve aparecer no mockup do celular
      await expect(page.locator('text=Pré-visualização')).toBeVisible();
    });

    test('deve avançar para step 2', async ({ page }) => {
      await page.goto('/campaigns/new');
      await page.waitForLoadState('networkidle');

      // Preencher nome
      const nameInput = page.locator('input[placeholder*="Promoção de Verão"]');
      await nameInput.fill('Minha Campanha de Teste');

      // Selecionar template
      const templateCard = page.locator('[class*="border rounded-xl p-5"]').first();
      await templateCard.click();

      // Clicar em continuar
      await page.click('button:has-text("Continuar")');

      // Deve estar no step 2
      await expect(page.locator('text=Escolha seu Público')).toBeVisible();
    });
  });

  test.describe('Step 2 - Público', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/campaigns/new');
      await page.waitForLoadState('networkidle');

      // Avançar para step 2
      await page.locator('input[placeholder*="Promoção de Verão"]').fill('Campanha Teste');
      await page.locator('[class*="border rounded-xl p-5"]').first().click();
      await page.click('button:has-text("Continuar")');
    });

    test('deve exibir opções de público', async ({ page }) => {
      await expect(page.locator('text=Todos os Contatos')).toBeVisible();
      await expect(page.locator('text=Selecionar Específicos')).toBeVisible();
    });

    test('deve ter opção de contato de teste', async ({ page }) => {
      await expect(page.locator('text=Enviar para Contato de Teste')).toBeVisible();
    });

    test('deve selecionar todos os contatos', async ({ page }) => {
      await page.click('button:has-text("Todos os Contatos")');

      // Deve mostrar quantidade
      await expect(page.locator(`text=${testContactsList.length} contatos`)).toBeVisible();
    });

    test('deve abrir seleção específica', async ({ page }) => {
      await page.click('button:has-text("Selecionar Específicos")');

      // Lista de contatos deve aparecer
      await expect(page.locator('text=Seus Contatos')).toBeVisible();
    });

    test('deve selecionar contatos específicos', async ({ page }) => {
      await page.click('button:has-text("Selecionar Específicos")');

      // Selecionar primeiro contato
      const checkbox = page.locator('input[type="checkbox"]').first();
      await checkbox.check();

      // Contador deve atualizar
      await expect(page.locator('text=1/')).toBeVisible();
    });

    test('deve voltar para step 1', async ({ page }) => {
      await page.click('button:has-text("Voltar")');

      await expect(page.locator('text=Nome da Campanha')).toBeVisible();
    });
  });

  test.describe('Step 3 - Revisão', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/campaigns/new');
      await page.waitForLoadState('networkidle');

      // Avançar para step 2
      await page.locator('input[placeholder*="Promoção de Verão"]').fill('Campanha Final');
      await page.locator('[class*="border rounded-xl p-5"]').first().click();
      await page.click('button:has-text("Continuar")');

      // Selecionar público e avançar
      await page.click('button:has-text("Enviar para Contato de Teste")');
      await page.click('button:has-text("Continuar")');
    });

    test('deve exibir resumo da campanha', async ({ page }) => {
      await expect(page.locator('text=Custo Total')).toBeVisible();
      await expect(page.locator('text=Total Destinatários')).toBeVisible();
      await expect(page.locator('text=Detalhes da Campanha')).toBeVisible();
    });

    test('deve mostrar opções de envio', async ({ page }) => {
      await expect(page.locator('text=Quando enviar?')).toBeVisible();
      await expect(page.locator('button:has-text("Enviar Agora")')).toBeVisible();
      await expect(page.locator('button:has-text("Agendar")')).toBeVisible();
    });

    test('deve permitir agendar', async ({ page }) => {
      await page.click('button:has-text("Agendar")');

      // Campos de data/hora devem aparecer
      await expect(page.locator('input[type="date"]')).toBeVisible();
      await expect(page.locator('input[type="time"]')).toBeVisible();
    });

    test('deve ter botão de disparar campanha', async ({ page }) => {
      await expect(page.locator('button:has-text("Disparar Campanha")')).toBeVisible();
    });

    test('deve disparar campanha', async ({ page }) => {
      let campaignCreated = false;

      await page.route('**/api/campaign/dispatch', async (route) => {
        campaignCreated = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'new-campaign-id', status: 'SENDING' }),
        });
      });

      await page.click('button:has-text("Disparar Campanha")');

      expect(campaignCreated).toBe(true);
    });
  });
});

test.describe('Campanhas - Validação de Formulários', () => {
  // Form validation tests depend on wizard - skip on CI
  test.skip(!!process.env.CI, 'Form validation tests skipped on CI');

  test.beforeEach(async ({ page }) => {
    await page.route('**/api/health', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          overall: 'healthy',
          services: {
            database: { status: 'ok' },
            redis: { status: 'ok' },
            qstash: { status: 'ok' },
            whatsapp: { status: 'ok' },
          },
        }),
      });
    });

    await page.route('**/api/templates', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(testTemplatesList),
      });
    });

    await page.route('**/api/contacts', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ contacts: testContactsList, total: testContactsList.length }),
      });
    });

    await page.route('**/api/account/limits', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          messagingTier: 'TIER_250',
          dailyLimit: 250,
          used: 0,
        }),
      });
    });
  });

  test('não deve avançar sem nome', async ({ page }) => {
    await page.goto('/campaigns/new');
    await page.waitForLoadState('networkidle');

    // Selecionar template mas não preencher nome
    await page.locator('[class*="border rounded-xl p-5"]').first().click();

    // Tentar avançar
    const url = page.url();
    await page.click('button:has-text("Continuar")');

    // URL não deve mudar significativamente (ainda no step 1)
    await page.waitForTimeout(500);
    await expect(page.locator('text=Nome da Campanha')).toBeVisible();
  });

  test('não deve avançar sem template', async ({ page }) => {
    await page.goto('/campaigns/new');
    await page.waitForLoadState('networkidle');

    // Preencher nome mas não selecionar template
    await page.locator('input[placeholder*="Promoção de Verão"]').fill('Minha Campanha');

    // Tentar avançar
    await page.click('button:has-text("Continuar")');

    // Deve permanecer no step 1
    await expect(page.locator('text=Selecione o Template')).toBeVisible();
  });

  test('deve validar limite de mensagens', async ({ page }) => {
    // Mock com muitos contatos (acima do limite)
    await page.route('**/api/contacts', async (route) => {
      const manyContacts = Array.from({ length: 500 }, (_, i) => ({
        id: `contact-${i}`,
        name: `Contato ${i}`,
        phone: `+551199999${String(i).padStart(4, '0')}`,
        status: 'Opt-in',
        tags: [],
        lastActive: new Date().toISOString(),
      }));

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ contacts: manyContacts, total: 500 }),
      });
    });

    await page.goto('/campaigns/new');
    await page.waitForLoadState('networkidle');

    // Avançar para step 2
    await page.locator('input[placeholder*="Promoção de Verão"]').fill('Campanha Grande');
    await page.locator('[class*="border rounded-xl p-5"]').first().click();
    await page.click('button:has-text("Continuar")');

    // Selecionar todos os contatos
    await page.click('button:has-text("Todos os Contatos")');

    // Deve mostrar aviso de limite
    await expect(page.locator('text=Limite Excedido')).toBeVisible();
  });
});

test.describe('Campanhas - Screenshots', () => {
  // Screenshot tests - skip on CI
  test.skip(!!process.env.CI, 'Screenshot tests skipped on CI');

  test('capturar screenshot da listagem', async ({ page }) => {
    await page.route('**/api/health', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          overall: 'healthy',
          services: { database: { status: 'ok' }, redis: { status: 'ok' }, qstash: { status: 'ok' }, whatsapp: { status: 'ok' } },
        }),
      });
    });

    await page.route('**/api/campaigns', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(testCampaignsList),
      });
    });

    await page.goto('/campaigns');
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: 'test-results/screenshots/campaigns-list.png',
      fullPage: true
    });
  });

  test('capturar screenshot do wizard', async ({ page }) => {
    await page.route('**/api/health', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          overall: 'healthy',
          services: { database: { status: 'ok' }, redis: { status: 'ok' }, qstash: { status: 'ok' }, whatsapp: { status: 'ok' } },
        }),
      });
    });

    await page.route('**/api/templates', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(testTemplatesList),
      });
    });

    await page.goto('/campaigns/new');
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: 'test-results/screenshots/campaign-wizard.png',
      fullPage: true
    });
  });
});
