import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { imageConfigDefault } from 'next/dist/shared/lib/image-config';

// Next injects this object at application build time. Vitest does not load
// next.config.mjs, so provide the same quality policy for component tests.
const testImageConfig = {
  ...imageConfigDefault,
  qualities: [75, 85, 100],
};

export default defineConfig({
  define: {
    'process.env.__NEXT_IMAGE_OPTS': JSON.stringify(testImageConfig),
  },
  esbuild: {
    jsx: 'automatic',
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
