import { catalogCategories, catalogProducts } from './catalog-fixtures';
import type { CatalogFilter, CatalogResult, CatalogService, Category, Product } from './types';

const normalize = (value: string) => value.trim().toLocaleLowerCase();

const sortProducts = (products: Product[], sort: CatalogFilter['sort']): Product[] => {
  if (sort === 'price-asc') {
    return [...products].sort((left, right) => left.priceTHB - right.priceTHB);
  }

  if (sort === 'price-desc') {
    return [...products].sort((left, right) => right.priceTHB - left.priceTHB);
  }

  return products;
};

export const fixtureCatalogService: CatalogService = {
  async listProducts(filter: CatalogFilter = {}): Promise<CatalogResult> {
    const query = filter.query ? normalize(filter.query) : undefined;
    const categoryId = filter.categoryId ? normalize(filter.categoryId) : undefined;
    const brand = filter.brand ? normalize(filter.brand) : undefined;

    const products = sortProducts(
      catalogProducts.filter((product) => {
        const matchesQuery =
          !query ||
          normalize(product.name).includes(query) ||
          normalize(product.brand).includes(query);
        const matchesCategory = !categoryId || normalize(product.categoryId) === categoryId;
        const matchesBrand = !brand || normalize(product.brand) === brand;
        const matchesPrice = filter.maxPrice === undefined || product.priceTHB <= filter.maxPrice;
        const matchesStock = !filter.inStockOnly || product.stockQuantity > 0;

        return matchesQuery && matchesCategory && matchesBrand && matchesPrice && matchesStock;
      }),
      filter.sort
    );

    return { products, total: products.length };
  },

  async listCategories(): Promise<Category[]> {
    return catalogCategories;
  },
};
