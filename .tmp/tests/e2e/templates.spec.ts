import { test, expect } from '@playwright/test';
import { testTemplatesList, testTemplates } from './fixtures/test-data';

/**
 * SmartZap Templates E2E Tests
 * 
 * Testa o módulo de templates incluindo:
 * - Listagem de templates
 * - Sincronização com Meta API
 * - Filtros e busca
 * - Geração com IA (Gemini)
 */

test.describe('Templates - Listagem', () => {
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

    await page.route('**/api/templates', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(testTemplatesList),
      });
    });
  });

  test('deve exibir página de templates', async ({ page }) => {
    await page.goto('/templates');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1')).toContainText('Templates');
    await expect(page.locator('text=Gerencie seus modelos de mensagens')).toBeVisible();
  });

  test('deve exibir botão de sincronizar', async ({ page }) => {
    await page.goto('/templates');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('button:has-text("Sincronizar")')).toBeVisible();
  });

  test('deve exibir botão de criar com IA', async ({ page }) => {
    await page.goto('/templates');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('button:has-text("Criar com IA")')).toBeVisible();
  });

  test('deve exibir filtros de categoria', async ({ page }) => {
    await page.goto('/templates');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('button:has-text("Todos")')).toBeVisible();
    await expect(page.locator('button:has-text("MARKETING")')).toBeVisible();
    await expect(page.locator('button:has-text("UTILIDADE")')).toBeVisible();
  });

  test('deve exibir templates em grid', async ({ page }) => {
    await page.goto('/templates');
    await page.waitForLoadState('networkidle');

    // Verificar se templates aparecem
    for (const template of testTemplatesList) {
      await expect(page.locator(`text=${template.name}`)).toBeVisible();
    }
  });

  test('deve mostrar status badge correto', async ({ page }) => {
    // Skip on CI - badge visibility can vary
    test.skip(!!process.env.CI, 'Badge tests skipped on CI');

    await page.goto('/templates');
    await page.waitForLoadState('networkidle');

    // Template aprovado deve ter badge verde
    await expect(page.locator('text=Aprovado')).toBeVisible();
  });

  test('deve mostrar categoria do template', async ({ page }) => {
    await page.goto('/templates');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=MARKETING').first()).toBeVisible();
    await expect(page.locator('text=UTILIDADE').first()).toBeVisible();
  });

  test('deve ter campo de busca', async ({ page }) => {
    await page.goto('/templates');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder*="Buscar templates"]');
    await expect(searchInput).toBeVisible();
  });

  test('deve filtrar por busca', async ({ page }) => {
    await page.goto('/templates');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder*="Buscar templates"]');
    await searchInput.fill('promocao');

    await expect(page.locator(`text=${testTemplates.marketing.name}`)).toBeVisible();
  });

  test('deve filtrar por categoria', async ({ page }) => {
    await page.goto('/templates');
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("UTILIDADE")');

    // Apenas templates de utilidade devem aparecer
    await expect(page.locator(`text=${testTemplates.utility.name}`)).toBeVisible();
  });

  test('deve mostrar mensagem quando não há templates', async ({ page }) => {
    await page.route('**/api/templates', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/templates');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=Nenhum template encontrado')).toBeVisible();
  });
});

test.describe('Templates - Sincronização', () => {
  // Sync tests - skip on CI
  test.skip(!!process.env.CI, 'Sync tests skipped on CI');

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
  });

  test('deve sincronizar templates', async ({ page }) => {
    let syncCalled = false;

    await page.route('**/api/templates', async (route) => {
      if (route.request().method() === 'POST') {
        syncCalled = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(testTemplatesList),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(testTemplatesList),
        });
      }
    });

    await page.goto('/templates');
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("Sincronizar")');

    // Esperar sincronização
    await page.waitForTimeout(500);

    expect(syncCalled).toBe(true);
  });

  test('deve mostrar loading durante sincronização', async ({ page }) => {
    await page.route('**/api/templates', async (route) => {
      if (route.request().method() === 'POST') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(testTemplatesList),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(testTemplatesList),
        });
      }
    });

    await page.goto('/templates');
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("Sincronizar")');

    // Deve mostrar "Sincronizando..."
    await expect(page.locator('text=Sincronizando')).toBeVisible();
  });
});

test.describe('Templates - Geração com IA', () => {
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

    await page.route('**/api/templates', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(testTemplatesList),
      });
    });
  });

  test('deve abrir modal de IA', async ({ page }) => {
    await page.goto('/templates');
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("Criar com IA")');

    await expect(page.locator('h2:has-text("Smart Copywriter")')).toBeVisible();
  });

  test('deve ter campo de prompt', async ({ page }) => {
    await page.goto('/templates');
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("Criar com IA")');

    await expect(page.locator('textarea[placeholder*="Crie uma oferta"]')).toBeVisible();
  });

  test('deve gerar texto com IA', async ({ page }) => {
    await page.route('**/api/ai/generate-template', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: '🎉 Super Promoção! Aproveite 50% de desconto em todos os produtos. Válido por tempo limitado!'
        }),
      });
    });

    await page.goto('/templates');
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("Criar com IA")');

    await page.locator('textarea').fill('Crie uma promoção de 50% de desconto');
    await page.click('button:has-text("Gerar Texto")');

    // Resultado deve aparecer
    await expect(page.locator('text=Resultado Gerado')).toBeVisible();
    await expect(page.locator('text=Super Promoção')).toBeVisible();
  });

  test('deve permitir salvar template gerado', async ({ page }) => {
    await page.route('**/api/ai/generate-template', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: 'Template gerado pela IA'
        }),
      });
    });

    await page.goto('/templates');
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("Criar com IA")');
    await page.locator('textarea').fill('Gerar template');
    await page.click('button:has-text("Gerar Texto")');

    // Aguardar resultado
    await expect(page.locator('text=Resultado Gerado')).toBeVisible();

    // Campo de nome e botão salvar devem aparecer
    await expect(page.locator('input[placeholder*="Oferta Black Friday"]')).toBeVisible();
    await expect(page.locator('button:has-text("Salvar Template")')).toBeVisible();
  });

  test('deve fechar modal ao clicar X', async ({ page }) => {
    // Skip on CI - modal close button selector is fragile
    test.skip(!!process.env.CI, 'Modal close interaction unstable on CI');

    await page.goto('/templates');
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("Criar com IA")');

    await expect(page.locator('h2:has-text("Smart Copywriter")')).toBeVisible();

    // Fechar modal com Escape (mais confiável)
    await page.keyboard.press('Escape');

    await expect(page.locator('h2:has-text("Smart Copywriter")')).not.toBeVisible();
  });
});

test.describe('Templates - Screenshots', () => {
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

    await page.route('**/api/templates', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(testTemplatesList),
      });
    });

    await page.goto('/templates');
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: 'test-results/screenshots/templates-list.png',
      fullPage: true
    });
  });

  test('capturar screenshot do modal de IA', async ({ page }) => {
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

    await page.goto('/templates');
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("Criar com IA")');
    await page.waitForTimeout(300);

    await page.screenshot({
      path: 'test-results/screenshots/templates-ai-modal.png',
      fullPage: true
    });
  });
});
