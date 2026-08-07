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
  badge?: 'New' | 'Sale' | 'Limited';
};

export type Category = {
  id: string;
  name: string;
};

export type CatalogFilter = {
  query?: string;
  categoryId?: string;
  brand?: string;
  sort?: 'featured' | 'price-asc' | 'price-desc';
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
