import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  workers: 1,
  reporter: [['json', { outputFile: 'test-results/resultados.json' }]],
});
