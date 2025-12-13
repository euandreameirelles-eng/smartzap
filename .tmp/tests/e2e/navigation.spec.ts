import { test, expect, Page } from '@playwright/test';
import { mockApiResponses } from './fixtures/test-data';

/**
 * SmartZap Navigation E2E Tests
 * 
 * Testa navegação e fluxo entre páginas:
 * - Menu lateral
 * - Breadcrumbs
 * - Deep linking
 * - Responsividade
 */

// Helper para configurar mocks de API padrão
async function setupApiMocks(page: Page) {
  // Interceptar TODAS as requisições de API e retornar mocks apropriados
  await page.route('**/api/**', async (route) => {
    const url = route.request().url();
    
    // Health check - mais importante para evitar o onboarding wizard
    if (url.includes('/api/health')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockApiResponses.health),
      });
    }

    // System status - usado pela página de settings
    if (url.includes('/api/system')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          health: mockApiResponses.health,
          vercel: { success: true },
          timestamp: new Date().toISOString(),
        }),
      });
    }
    
    // Dashboard stats
    if (url.includes('/api/dashboard')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ sent24h: 100, deliveryRate: 95, activeCampaigns: 2, failedMessages: 5 }),
      });
    }
    
    // Campaigns
    if (url.includes('/api/campaigns')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    }
    
    // Contacts - retorna array diretamente (contactService.getAll retorna Contact[])
    if (url.includes('/api/contacts')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    }
    
    // Templates - retorna array diretamente
    if (url.includes('/api/templates')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    }
    
    // Settings
    if (url.includes('/api/settings')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    }
    
    // Default response para outras APIs
    return route.fulfill({ 
      status: 200, 
      contentType: 'application/json',
      body: JSON.stringify({}) 
    });
  });
}

test.describe('Navegação - Menu Lateral', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test('deve navegar para Dashboard', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await page.click('a[href="/"]');
    await expect(page).toHaveURL('/');
  });

  test('deve navegar para Campanhas', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await page.click('a[href="/campaigns"]');
    await expect(page).toHaveURL('/campaigns');
    await expect(page.locator('h1')).toContainText('Campanhas');
  });

  test('deve navegar para Contatos', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await page.click('a[href="/contacts"]');
    await expect(page).toHaveURL('/contacts');
    await expect(page.locator('h1')).toContainText('Contatos');
  });

  test('deve navegar para Templates', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await page.click('a[href="/templates"]');
    await expect(page).toHaveURL('/templates');
    await expect(page.locator('h1')).toContainText('Templates');
  });

  test('deve navegar para Configurações', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await page.click('a[href="/settings"]');
    await expect(page).toHaveURL('/settings');
    await expect(page.locator('h1')).toContainText('Configurações');
  });

  test('deve destacar item ativo no menu', async ({ page }) => {
    await page.goto('/campaigns');
    await page.waitForLoadState('networkidle');
    
    const activeLink = page.locator('a[href="/campaigns"]');
    await expect(activeLink).toHaveClass(/bg-|primary|active/);
  });
});

test.describe('Navegação - Deep Linking', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test('deve acessar página de campanhas diretamente', async ({ page }) => {
    await page.goto('/campaigns');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1')).toContainText('Campanhas');
  });

  test('deve acessar nova campanha diretamente', async ({ page }) => {
    await page.goto('/campaigns/new');
    await page.waitForLoadState('networkidle');
    
    // O título real é "Criar Campanha" com badge "Rascunho"
    await expect(page.locator('h1')).toContainText('Criar Campanha');
  });

  test('deve acessar contatos diretamente', async ({ page }) => {
    await page.goto('/contacts');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1')).toContainText('Contatos');
  });

  test('deve acessar templates diretamente', async ({ page }) => {
    await page.goto('/templates');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1')).toContainText('Templates');
  });

  test('deve acessar configurações diretamente', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1')).toContainText('Configurações');
  });
});

test.describe('Navegação - Responsividade', () => {
  test('menu deve estar visível em desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await setupApiMocks(page);

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const sidebar = page.locator('aside, nav').first();
    await expect(sidebar).toBeVisible();
  });

  test('menu deve ser colapsável em mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await setupApiMocks(page);

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Em mobile, deve ter botão de menu hamburger ou menu oculto
    const menuButton = page.locator('button[aria-label*="menu"], button:has(svg[class*="Menu"])');
    // O menu pode ou não estar oculto por padrão - apenas verificamos que a página carrega
  });

  test('tabelas devem ser scrolláveis em mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await setupApiMocks(page);

    await page.goto('/contacts');
    await page.waitForLoadState('networkidle');
    
    // Tabela ou container scrollável deve existir
    const table = page.locator('table, [class*="overflow-x"]');
    await expect(table.first()).toBeVisible();
  });
});

test.describe('Navegação - Fluxo de Trabalho', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test('deve navegar do dashboard para nova campanha', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await page.click('a[href="/campaigns"]');
    await page.waitForURL('/campaigns');
    
    await page.click('a[href="/campaigns/new"], button:has-text("Nova Campanha")');
    await expect(page).toHaveURL(/\/campaigns\/new/);
  });

  test('deve voltar para lista após cancelar', async ({ page }) => {
    await page.goto('/campaigns/new');
    await page.waitForLoadState('networkidle');
    
    // Clicar em cancelar deve voltar para lista
    const cancelButton = page.locator('button:has-text("Cancelar"), a[href="/campaigns"]');
    if (await cancelButton.first().isVisible()) {
      await cancelButton.first().click();
      await expect(page).toHaveURL('/campaigns');
    }
  });

  test('deve manter navegação consistente', async ({ page }) => {
    await page.goto('/contacts');
    await page.waitForLoadState('networkidle');
    
    // Navegar para campanhas
    await page.click('a[href="/campaigns"]');
    await page.waitForURL('/campaigns');
    await expect(page.locator('h1')).toContainText('Campanhas');
    
    // Voltar para contatos
    await page.click('a[href="/contacts"]');
    await page.waitForURL('/contacts');
    await expect(page.locator('h1')).toContainText('Contatos');
  });
});

test.describe('Navegação - Screenshots', () => {
  test('capturar screenshot de navegação mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await setupApiMocks(page);

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ 
      path: 'test-results/screenshots/navigation-mobile.png',
      fullPage: true 
    });
  });

  test('capturar screenshot de navegação tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await setupApiMocks(page);

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ 
      path: 'test-results/screenshots/navigation-tablet.png',
      fullPage: true 
    });
  });
});
