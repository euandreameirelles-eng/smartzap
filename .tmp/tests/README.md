# SmartZap Test Suite 🧪

Suíte completa de testes E2E e unitários para o SmartZap.

## Arquitetura de Testes

```
tests/
├── e2e/                    # Testes End-to-End (Playwright)
│   ├── fixtures/           # Dados de teste e seletores
│   │   └── test-data.ts    # Mocks compartilhados
│   ├── dashboard.spec.ts   # Testes do Dashboard
│   ├── campaigns.spec.ts   # Testes de Campanhas
│   ├── contacts.spec.ts    # Testes de Contatos
│   ├── templates.spec.ts   # Testes de Templates
│   ├── settings.spec.ts    # Testes de Configurações
│   ├── navigation.spec.ts  # Testes de Navegação
│   └── accessibility.spec.ts # Testes de Acessibilidade
├── unit/                   # Testes Unitários (Vitest)
│   ├── hooks/              # Testes de hooks
│   ├── lib/                # Testes de utilitários
│   └── services/           # Testes de serviços
├── integration/            # Testes de Integração
│   └── api/                # Testes de API routes
└── setup.tsx               # Configuração global de testes
```

## Instalação

```bash
# Instalar dependências
npm install

# Instalar browsers do Playwright
npx playwright install
```

## Comandos

### Testes Unitários (Vitest)

```bash
# Rodar todos os testes unitários
npm run test

# Modo watch (desenvolvimento)
npm run test -- --watch

# Com interface visual
npm run test:ui

# Com cobertura de código
npm run test:coverage
```

### Testes E2E (Playwright)

```bash
# Rodar todos os testes E2E
npm run test:e2e

# Com interface visual do Playwright
npm run test:e2e:ui

# Em modo headed (ver browser)
npm run test:e2e:headed

# Ver relatório HTML
npm run test:e2e:report

# Rodar testes específicos
npx playwright test dashboard
npx playwright test campaigns
npx playwright test contacts
```

### Todos os Testes

```bash
npm run test:all
```

## Cobertura de Código

### Metas de Cobertura

| Métrica     | Meta   | Crítico |
|-------------|--------|---------|
| Statements  | 70%    | 50%     |
| Branches    | 70%    | 50%     |
| Functions   | 70%    | 50%     |
| Lines       | 70%    | 50%     |

### Áreas Prioritárias

1. **Hooks de Controlador** (`hooks/`)
   - `useCampaigns.ts` - Lógica de campanhas
   - `useContacts.ts` - Gerenciamento de contatos
   - `useTemplates.ts` - Sincronização de templates

2. **Biblioteca Core** (`lib/`)
   - `phone-formatter.ts` - Formatação de telefone
   - `csv-parser.ts` - Importação de CSV
   - `errors.ts` - Tratamento de erros
   - `storage.ts` - Persistência local

3. **Serviços** (`services/`)
   - `campaignService.ts` - API de campanhas
   - `contactService.ts` - API de contatos

## Estrutura de Testes E2E

### Padrão de Teste

```typescript
test.describe('Módulo - Funcionalidade', () => {
  test.beforeEach(async ({ page }) => {
    // Configurar mocks de API
    await page.route('**/api/**', handler);
  });

  test('deve fazer X quando Y', async ({ page }) => {
    // Arrange
    await page.goto('/rota');
    
    // Act
    await page.click('button');
    
    // Assert
    await expect(page.locator('elemento')).toBeVisible();
  });
});
```

### Fixtures Disponíveis

```typescript
import {
  testContacts,        // Dados de contatos
  testContactsList,    // Lista de contatos
  testCampaigns,       // Dados de campanhas
  testCampaignsList,   // Lista de campanhas
  testTemplates,       // Dados de templates
  testTemplatesList,   // Lista de templates
  testMessages,        // Mensagens simuladas
  testSettings,        // Configurações
  SELECTORS,           // Seletores de UI
  API_RESPONSES,       // Respostas de API
} from './fixtures/test-data';
```

## Screenshots

Os testes capturam screenshots automaticamente em:
- `test-results/screenshots/` - Screenshots manuais
- `test-results/` - Screenshots de falha (automático)

## CI/CD

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:all
```

## Boas Práticas

### ✅ Fazer

- Usar `data-testid` para seletores estáveis
- Aguardar elementos com `waitForLoadState`
- Isolar testes com mocks de API
- Capturar screenshots em cenários importantes
- Testar estados de loading e erro

### ❌ Evitar

- Seletores frágeis baseados em classe CSS
- Timeouts fixos (`waitForTimeout`)
- Testes dependentes de ordem
- Compartilhar estado entre testes
- Ignorar testes flaky

## Troubleshooting

### Teste flaky

```bash
# Rodar com retry
npx playwright test --retries=2

# Debug específico
npx playwright test nome-do-teste --debug
```

### Timeout

```typescript
// Aumentar timeout do teste
test('teste demorado', async ({ page }) => {
  test.setTimeout(60000); // 60s
  // ...
});
```

### Screenshots não salvando

```bash
# Criar diretório
mkdir -p test-results/screenshots
```

## Relatórios

### HTML Report (Playwright)
```bash
npm run test:e2e:report
# Abre http://localhost:9323
```

### Coverage Report (Vitest)
```bash
npm run test:coverage
# Gera em coverage/index.html
```

## Contribuindo

1. Adicione testes para novas features
2. Mantenha cobertura acima de 70%
3. Teste cenários de erro
4. Documente fixtures compartilhados
