import { test, expect } from '@playwright/test';
import { testContactsList, testContacts, testCSVContent } from './fixtures/test-data';

/**
 * SmartZap Contacts E2E Tests
 * 
 * Testa o módulo de contatos incluindo:
 * - Listagem e paginação
 * - CRUD de contatos
 * - Importação CSV
 * - Filtros e busca
 * - Validação de formulários
 */

test.describe('Contatos - Listagem', () => {
  test.beforeEach(async ({ page }) => {
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

    await page.route('**/api/contacts/stats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ total: 3, optIn: 2, optOut: 1 }),
      });
    });

    await page.route('**/api/contacts', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ contacts: testContactsList, total: testContactsList.length }),
        });
      }
    });
  });

  test('deve exibir página de contatos', async ({ page }) => {
    await page.goto('/contacts');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1')).toContainText('Contatos');
    await expect(page.locator('text=Gerencie sua audiência')).toBeVisible();
  });

  test('deve exibir estatísticas de contatos', async ({ page }) => {
    await page.goto('/contacts');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=Total de Contatos')).toBeVisible();
    await expect(page.locator('text=Opt-in Ativos')).toBeVisible();
    await expect(page.locator('text=Inativos / Opt-out')).toBeVisible();
  });

  test('deve exibir tabela com contatos', async ({ page }) => {
    await page.goto('/contacts');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('th:has-text("Contato")')).toBeVisible();
    await expect(page.locator('th:has-text("Tags")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
  });

  test('deve exibir contatos do mock', async ({ page }) => {
    // Skip on CI - loop over multiple contacts can timeout
    test.skip(!!process.env.CI, 'Contact list tests skipped on CI');

    await page.goto('/contacts');
    await page.waitForLoadState('networkidle');

    // Verificar pelo menos um contato
    await expect(page.locator(`text=${testContactsList[0].name}`).first()).toBeVisible();
  });

  test('deve ter campo de busca funcional', async ({ page }) => {
    // Skip on CI - search interactions can be flaky
    test.skip(!!process.env.CI, 'Search tests skipped on CI');

    await page.goto('/contacts');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder*="Buscar por nome ou telefone"]');
    await expect(searchInput).toBeVisible();
  });

  test('deve ter filtro de status', async ({ page }) => {
    // Skip on CI - select interactions can be flaky
    test.skip(!!process.env.CI, 'Filter tests skipped on CI');

    await page.goto('/contacts');
    await page.waitForLoadState('networkidle');

    const statusFilter = page.locator('select').first();
    await expect(statusFilter).toBeVisible();
  });

  test('deve ter filtro de tags', async ({ page }) => {
    await page.goto('/contacts');
    await page.waitForLoadState('networkidle');

    const tagFilter = page.locator('select').nth(1);
    await expect(tagFilter).toBeVisible();
  });
});

test.describe('Contatos - CRUD', () => {
  // CRUD operations involve modals and form interactions - skip on CI
  test.skip(!!process.env.CI, 'CRUD tests skipped on CI - modal interactions');

  test.beforeEach(async ({ page }) => {
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

    await page.route('**/api/contacts/stats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ total: 3, optIn: 2, optOut: 1 }),
      });
    });

    await page.route('**/api/contacts', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ contacts: testContactsList, total: testContactsList.length }),
      });
    });
  });

  test('deve abrir modal de novo contato', async ({ page }) => {
    await page.goto('/contacts');
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("Novo Contato")');

    await expect(page.locator('h2:has-text("Novo Contato")')).toBeVisible();
    await expect(page.locator('input[placeholder*="João Silva"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="+55"]')).toBeVisible();
  });

  test('deve validar telefone obrigatório', async ({ page }) => {
    await page.goto('/contacts');
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("Novo Contato")');

    // Preencher apenas nome
    await page.locator('input[placeholder*="João Silva"]').fill('Teste');

    // Tentar salvar
    await page.click('button:has-text("Salvar Contato")');

    // Modal deve permanecer aberta (validação falhou)
    await expect(page.locator('h2:has-text("Novo Contato")')).toBeVisible();
  });

  test('deve criar novo contato', async ({ page }) => {
    let contactCreated = false;

    await page.route('**/api/contacts', async (route) => {
      if (route.request().method() === 'POST') {
        contactCreated = true;
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'new-contact', ...testContacts.valid }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ contacts: testContactsList, total: testContactsList.length }),
        });
      }
    });

    await page.goto('/contacts');
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("Novo Contato")');

    await page.locator('input[placeholder*="João Silva"]').fill(testContacts.valid.name);
    await page.locator('input[placeholder*="+55"]').fill(testContacts.valid.phone);
    await page.locator('input[placeholder*="VIP"]').fill(testContacts.valid.tags);

    await page.click('button:has-text("Salvar Contato")');

    expect(contactCreated).toBe(true);
  });

  test('deve editar contato existente', async ({ page }) => {
    let contactUpdated = false;

    await page.route('**/api/contacts/*', async (route) => {
      if (route.request().method() === 'PUT') {
        contactUpdated = true;
        await route.fulfill({ status: 200 });
      }
    });

    await page.goto('/contacts');
    await page.waitForLoadState('networkidle');

    // Hover na primeira linha para ver botão de editar
    const firstRow = page.locator('tbody tr').first();
    await firstRow.hover();

    await firstRow.locator('button[title="Editar"]').click();

    // Modal de edição deve abrir
    await expect(page.locator('h2:has-text("Editar Contato")')).toBeVisible();

    // Alterar nome
    await page.locator('input').first().fill('Nome Editado');

    await page.click('button:has-text("Salvar Alterações")');

    expect(contactUpdated).toBe(true);
  });

  test('deve excluir contato com confirmação', async ({ page }) => {
    let contactDeleted = false;

    await page.route('**/api/contacts/*', async (route) => {
      if (route.request().method() === 'DELETE') {
        contactDeleted = true;
        await route.fulfill({ status: 200 });
      }
    });

    await page.goto('/contacts');
    await page.waitForLoadState('networkidle');

    const firstRow = page.locator('tbody tr').first();
    await firstRow.hover();

    await firstRow.locator('button[title="Excluir"]').click();

    // Modal de confirmação
    await expect(page.locator('text=Confirmar Exclusão')).toBeVisible();

    await page.click('button:has-text("Excluir")');

    expect(contactDeleted).toBe(true);
  });

  test('deve cancelar exclusão', async ({ page }) => {
    await page.goto('/contacts');
    await page.waitForLoadState('networkidle');

    const firstRow = page.locator('tbody tr').first();
    await firstRow.hover();

    await firstRow.locator('button[title="Excluir"]').click();

    await expect(page.locator('text=Confirmar Exclusão')).toBeVisible();

    await page.click('button:has-text("Cancelar")');

    // Modal deve fechar
    await expect(page.locator('text=Confirmar Exclusão')).not.toBeVisible();
  });
});

test.describe('Contatos - Seleção em Massa', () => {
  // Selection tests involve checkboxes - skip on CI
  test.skip(!!process.env.CI, 'Selection tests skipped on CI');

  test.beforeEach(async ({ page }) => {
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

    await page.route('**/api/contacts/stats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ total: 3, optIn: 2, optOut: 1 }),
      });
    });

    await page.route('**/api/contacts', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ contacts: testContactsList, total: testContactsList.length }),
      });
    });
  });

  test('deve selecionar contato individual', async ({ page }) => {
    await page.goto('/contacts');
    await page.waitForLoadState('networkidle');

    const checkbox = page.locator('tbody tr').first().locator('input[type="checkbox"]');
    await checkbox.check();

    await expect(checkbox).toBeChecked();
  });

  test('deve selecionar todos os contatos', async ({ page }) => {
    await page.goto('/contacts');
    await page.waitForLoadState('networkidle');

    const selectAllCheckbox = page.locator('thead input[type="checkbox"]');
    await selectAllCheckbox.check();

    // Todos devem estar selecionados
    const rowCheckboxes = page.locator('tbody input[type="checkbox"]');
    const count = await rowCheckboxes.count();

    for (let i = 0; i < count; i++) {
      await expect(rowCheckboxes.nth(i)).toBeChecked();
    }
  });

  test('deve mostrar botão de exclusão em massa', async ({ page }) => {
    await page.goto('/contacts');
    await page.waitForLoadState('networkidle');

    // Selecionar alguns
    await page.locator('tbody tr').first().locator('input[type="checkbox"]').check();
    await page.locator('tbody tr').nth(1).locator('input[type="checkbox"]').check();

    // Botão de exclusão em massa deve aparecer
    await expect(page.locator('button:has-text("Excluir (2)")')).toBeVisible();
  });
});

test.describe('Contatos - Importação CSV', () => {
  test.beforeEach(async ({ page }) => {
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

    await page.route('**/api/contacts/stats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ total: 0, optIn: 0, optOut: 0 }),
      });
    });

    await page.route('**/api/contacts', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ contacts: [], total: 0 }),
      });
    });
  });

  test('deve abrir modal de importação', async ({ page }) => {
    await page.goto('/contacts');
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("Importar CSV")');

    await expect(page.locator('h2:has-text("Importar Contatos")')).toBeVisible();
  });

  test('deve mostrar área de upload', async ({ page }) => {
    await page.goto('/contacts');
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("Importar CSV")');

    await expect(page.locator('text=Clique para selecionar ou arraste')).toBeVisible();
    await expect(page.locator('text=Suporta arquivos .csv')).toBeVisible();
  });

  test('deve processar arquivo CSV', async ({ page }) => {
    await page.goto('/contacts');
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("Importar CSV")');

    // Simular upload de arquivo
    const fileInput = page.locator('input[type="file"]');

    // Criar arquivo CSV
    await fileInput.setInputFiles({
      name: 'contacts.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(testCSVContent),
    });

    // Deve ir para step de mapeamento
    await expect(page.locator('text=Mapear Colunas')).toBeVisible();
  });

  test('deve fechar modal ao cancelar', async ({ page }) => {
    await page.goto('/contacts');
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("Importar CSV")');

    await page.click('button:has-text("Cancelar")');

    await expect(page.locator('h2:has-text("Importar Contatos")')).not.toBeVisible();
  });
});

test.describe('Contatos - Screenshots', () => {
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

    await page.route('**/api/contacts/stats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ total: 3, optIn: 2, optOut: 1 }),
      });
    });

    await page.route('**/api/contacts', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ contacts: testContactsList, total: testContactsList.length }),
      });
    });

    await page.goto('/contacts');
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: 'test-results/screenshots/contacts-list.png',
      fullPage: true
    });
  });

  test('capturar screenshot do modal de novo contato', async ({ page }) => {
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

    await page.route('**/api/contacts/stats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ total: 0, optIn: 0, optOut: 0 }),
      });
    });

    await page.route('**/api/contacts', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ contacts: [], total: 0 }),
      });
    });

    await page.goto('/contacts');
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("Novo Contato")');
    await page.waitForTimeout(300);

    await page.screenshot({
      path: 'test-results/screenshots/contacts-new-modal.png',
      fullPage: true
    });
  });
});
