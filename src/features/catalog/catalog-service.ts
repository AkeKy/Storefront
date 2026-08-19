import { createApiCatalogService } from './api-catalog-service';
import { fixtureCatalogService } from './fixture-catalog-service';
import type { CatalogService } from './types';

const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

const withFixtureFallback = (apiService: CatalogService): CatalogService => ({
  async listProducts(filter) {
    try {
      return await apiService.listProducts(filter);
    } catch {
      console.warn('Catalog API unavailable; using demo data.');
      return fixtureCatalogService.listProducts(filter);
    }
  },

  async listCategories() {
    try {
      return await apiService.listCategories();
    } catch {
      console.warn('Catalog API unavailable; using demo data.');
      return fixtureCatalogService.listCategories();
    }
  },
});

const createCatalogService = (): CatalogService => {
  if (!apiUrl) return fixtureCatalogService;

  try {
    return withFixtureFallback(createApiCatalogService(apiUrl));
  } catch {
    console.warn('Catalog API unavailable; using demo data.');
    return fixtureCatalogService;
  }
};

export const catalogService: CatalogService = createCatalogService();
