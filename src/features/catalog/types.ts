export type Product = {
  id: number;
  slug: string;
  name: string;
  brand: string;
  categoryId: string;
  categoryName: string;
  priceTHB: number;
  image: string;
  imageAlt: string;
  stockQuantity: number;
  badge?: string;
};

export type Category = {
  id: string;
  name: string;
};

export type CatalogSortOption = 'featured' | 'price-asc' | 'price-desc';

export type CatalogFilter = {
  query?: string;
  categoryId?: string;
  brand?: string;
  maxPrice?: number;
  sort?: CatalogSortOption;
  inStockOnly?: boolean;
};

export type CatalogResult = {
  products: Product[];
  total: number;
};

export type CatalogService = {
  listProducts(filter?: CatalogFilter): Promise<CatalogResult>;
  listCategories(): Promise<Category[]>;
};
