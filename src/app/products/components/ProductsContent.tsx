'use client';

import React, { useState, useMemo } from 'react';

import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

interface Product {
  id: number;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  image: string;
  alt: string;
  tag?: string;
  tagType?: 'neon' | 'cyan';
  category: string;
  inStock: boolean;
}

const allProducts: Product[] = [
  {
    id: 1,
    name: 'Razer DeathAdder V3 Pro',
    brand: 'Razer',
    price: 149.99,
    originalPrice: 179.99,
    rating: 4.9,
    reviewCount: 2847,
    image: 'https://images.unsplash.com/photo-1700825238348-f76468dc6e81',
    alt: 'Black ergonomic gaming mouse on dark surface with subtle ambient lighting',
    tag: 'Best Seller',
    tagType: 'neon',
    category: 'Mice',
    inStock: true,
  },
  {
    id: 2,
    name: 'Logitech G Pro X2 Superlight',
    brand: 'Logitech',
    price: 159.99,
    rating: 4.8,
    reviewCount: 1654,
    image: 'https://img.rocket.new/generatedImages/rocket_gen_img_1028cb4b2-1772845470794.png',
    alt: 'Ultra-lightweight white gaming mouse on dark mousepad with clean background',
    category: 'Mice',
    inStock: true,
  },
  {
    id: 3,
    name: 'SteelSeries Rival 650 Wireless',
    brand: 'SteelSeries',
    price: 119.99,
    originalPrice: 139.99,
    rating: 4.6,
    reviewCount: 987,
    image: 'https://images.unsplash.com/photo-1657284204755-6fd630355b40',
    alt: 'Wireless gaming mouse with RGB accents on dark desk surface',
    category: 'Mice',
    inStock: true,
  },
  {
    id: 4,
    name: 'SteelSeries Apex Pro TKL',
    brand: 'SteelSeries',
    price: 179.99,
    rating: 4.8,
    reviewCount: 3104,
    image: 'https://img.rocket.new/generatedImages/rocket_gen_img_15083c845-1772818435986.png',
    alt: 'Compact TKL mechanical keyboard with RGB backlighting on dark desk, moody lighting',
    tag: 'Top Pick',
    tagType: 'neon',
    category: 'Keyboards',
    inStock: true,
  },
  {
    id: 5,
    name: 'Corsair K100 RGB Optical',
    brand: 'Corsair',
    price: 229.99,
    rating: 4.7,
    reviewCount: 2341,
    image: 'https://img.rocket.new/generatedImages/rocket_gen_img_15ab5292a-1772313919951.png',
    alt: 'Full-size gaming keyboard with per-key RGB lighting and media controls in dim room',
    category: 'Keyboards',
    inStock: true,
  },
  {
    id: 6,
    name: 'Ducky One 3 TKL',
    brand: 'Ducky',
    price: 109.99,
    rating: 4.7,
    reviewCount: 1823,
    image: 'https://images.unsplash.com/photo-1725755751265-6a7b23077316',
    alt: 'Tenkeyless keyboard with pastel keycaps on white desk, clean studio lighting',
    category: 'Keyboards',
    inStock: false,
  },
  {
    id: 7,
    name: 'HyperX Cloud III Wireless',
    brand: 'HyperX',
    price: 199.99,
    rating: 4.8,
    reviewCount: 1923,
    image: 'https://img.rocket.new/generatedImages/rocket_gen_img_1d5ff1a26-1770408083454.png',
    alt: 'Black wireless gaming headset with large cushioned ear cups on dark background',
    tag: 'New',
    tagType: 'cyan',
    category: 'Headsets',
    inStock: true,
  },
  {
    id: 8,
    name: 'Astro A50 Gen 4',
    brand: 'Astro',
    price: 299.99,
    originalPrice: 329.99,
    rating: 4.7,
    reviewCount: 1245,
    image: 'https://images.unsplash.com/photo-1636487658531-16237360bc30',
    alt: 'Premium gaming headset with charging base station on dark desk with dim ambient lighting',
    category: 'Headsets',
    inStock: true,
  },
  {
    id: 9,
    name: 'SteelSeries Arctis Nova Pro',
    brand: 'SteelSeries',
    price: 349.99,
    rating: 4.9,
    reviewCount: 876,
    image: 'https://images.unsplash.com/photo-1586837033998-87881d891d49',
    alt: 'High-end gaming headset with DAC audio hub on dark background, deep shadows',
    tag: 'Premium',
    tagType: 'neon',
    category: 'Headsets',
    inStock: true,
  },
  {
    id: 10,
    name: 'ASUS ROG Swift 360Hz',
    brand: 'ASUS ROG',
    price: 699.99,
    originalPrice: 799.99,
    rating: 4.7,
    reviewCount: 876,
    image: 'https://img.rocket.new/generatedImages/rocket_gen_img_1c6bb3733-1767732378691.png',
    alt: 'Slim-bezel gaming monitor with vivid display in darkened gaming room with neon glow',
    tag: '360Hz',
    tagType: 'neon',
    category: 'Monitors',
    inStock: true,
  },
  {
    id: 11,
    name: 'LG UltraGear 27GP950',
    brand: 'LG',
    price: 549.99,
    rating: 4.8,
    reviewCount: 2134,
    image: 'https://img.rocket.new/generatedImages/rocket_gen_img_1c19815f9-1772297947676.png',
    alt: 'UltraGear gaming monitor with 4K display in dark room with atmospheric backlight',
    category: 'Monitors',
    inStock: true,
  },
  {
    id: 12,
    name: 'Samsung Odyssey G9',
    brand: 'Samsung',
    price: 1199.99,
    originalPrice: 1399.99,
    rating: 4.6,
    reviewCount: 654,
    image: 'https://images.unsplash.com/photo-1603481546164-959efb269a4e',
    alt: 'Curved ultrawide monitor with dramatic RGB ambient lighting in dark gaming setup',
    tag: 'Ultrawide',
    tagType: 'cyan',
    category: 'Monitors',
    inStock: false,
  },
  {
    id: 13,
    name: 'NVIDIA RTX 5090 FE',
    brand: 'NVIDIA',
    price: 1999.99,
    rating: 4.9,
    reviewCount: 542,
    image: 'https://img.rocket.new/generatedImages/rocket_gen_img_1376f55e3-1768553548960.png',
    alt: 'Flagship graphics card with large heatsink and green LED accents on dark background',
    tag: 'New',
    tagType: 'cyan',
    category: 'GPUs',
    inStock: true,
  },
  {
    id: 14,
    name: 'AMD Radeon RX 9900 XTX',
    brand: 'AMD',
    price: 1099.99,
    rating: 4.7,
    reviewCount: 389,
    image: 'https://img.rocket.new/generatedImages/rocket_gen_img_109c8ab00-1785003620971.png',
    alt: 'Red-accented AMD graphics card with triple fan cooler on dark studio surface',
    category: 'GPUs',
    inStock: true,
  },
  {
    id: 15,
    name: 'ASUS ROG Strix RTX 5080',
    brand: 'ASUS ROG',
    price: 1299.99,
    originalPrice: 1499.99,
    rating: 4.8,
    reviewCount: 712,
    image: 'https://images.unsplash.com/photo-1617119895955-d72466fe95b0',
    alt: 'ROG gaming GPU with ARGB lighting and thick heatsink on dark background',
    tag: 'Sale',
    tagType: 'cyan',
    category: 'GPUs',
    inStock: true,
  },
  {
    id: 16,
    name: 'Elgato Stream Deck MK.2',
    brand: 'Elgato',
    price: 149.99,
    originalPrice: 169.99,
    rating: 4.6,
    reviewCount: 4217,
    image: 'https://img.rocket.new/generatedImages/rocket_gen_img_1727c2045-1764792423119.png',
    alt: 'Stream deck with 15 LCD programmable buttons on white desk in bright studio',
    tag: 'Sale',
    tagType: 'cyan',
    category: 'Streaming',
    inStock: true,
  },
  {
    id: 17,
    name: 'Elgato 4K60 Pro Capture Card',
    brand: 'Elgato',
    price: 199.99,
    rating: 4.7,
    reviewCount: 1876,
    image: 'https://images.unsplash.com/photo-1647860966746-8f2749001d01',
    alt: 'PCIe capture card in slim form factor with Elgato branding on neutral background',
    category: 'Streaming',
    inStock: true,
  },
  {
    id: 18,
    name: 'Blue Yeti X USB Microphone',
    brand: 'Blue',
    price: 169.99,
    rating: 4.8,
    reviewCount: 3421,
    image: 'https://img.rocket.new/generatedImages/rocket_gen_img_1d5cd4375-1774517467109.png',
    alt: 'Professional USB condenser microphone on desk stand with dark background studio setup',
    category: 'Streaming',
    inStock: true,
  },
  {
    id: 19,
    name: 'Corsair RM1000x PSU',
    brand: 'Corsair',
    price: 189.99,
    originalPrice: 219.99,
    rating: 4.9,
    reviewCount: 2987,
    image: 'https://img.rocket.new/generatedImages/rocket_gen_img_11737b286-1772446021488.png',
    alt: 'Modular power supply with white cables on dark background, PC components setup',
    category: 'Components',
    inStock: true,
  },
  {
    id: 20,
    name: 'Samsung 990 Pro 2TB NVMe',
    brand: 'Samsung',
    price: 219.99,
    originalPrice: 249.99,
    rating: 4.8,
    reviewCount: 1654,
    image: 'https://img.rocket.new/generatedImages/rocket_gen_img_158627142-1770937534812.png',
    alt: 'M.2 NVMe SSD with Samsung label on dark reflective surface',
    tag: 'Fast',
    tagType: 'neon',
    category: 'Components',
    inStock: true,
  },
  {
    id: 21,
    name: 'Corsair Vengeance DDR5 32GB',
    brand: 'Corsair',
    price: 149.99,
    rating: 4.7,
    reviewCount: 987,
    image: 'https://img.rocket.new/generatedImages/rocket_gen_img_1aa900a5a-1772374574759.png',
    alt: 'DDR5 RAM modules with RGB diffuser on dark background with subtle glow',
    category: 'Components',
    inStock: true,
  },
  {
    id: 22,
    name: 'Razer Viper V3 HyperSpeed',
    brand: 'Razer',
    price: 99.99,
    rating: 4.7,
    reviewCount: 2341,
    image: 'https://images.unsplash.com/photo-1701794474241-5aa5e55afe6f',
    alt: 'Lightweight symmetric gaming mouse in black with Razer logo on dark desk',
    category: 'Mice',
    inStock: true,
  },
  {
    id: 23,
    name: 'Logitech G915 TKL Wireless',
    brand: 'Logitech',
    price: 219.99,
    rating: 4.8,
    reviewCount: 1456,
    image: 'https://images.unsplash.com/photo-1641611895204-ed582ce8b53f',
    alt: 'Low-profile wireless TKL keyboard with thin keycaps and aluminum frame in dim lighting',
    tag: 'Wireless',
    tagType: 'cyan',
    category: 'Keyboards',
    inStock: true,
  },
  {
    id: 24,
    name: 'BenQ Zowie XL2566K 360Hz',
    brand: 'BenQ',
    price: 799.99,
    rating: 4.8,
    reviewCount: 432,
    image: 'https://images.unsplash.com/photo-1630201129622-a8e8ef3f7245',
    alt: 'Esports monitor with DyAc technology and adjustable stand in dark gaming room',
    tag: 'Esports',
    tagType: 'neon',
    category: 'Monitors',
    inStock: true,
  },
];

const categories = [
  'All',
  'Mice',
  'Keyboards',
  'Headsets',
  'Monitors',
  'GPUs',
  'Streaming',
  'Components',
];
const brands = [
  'All Brands',
  'Razer',
  'Logitech',
  'SteelSeries',
  'ASUS ROG',
  'HyperX',
  'Corsair',
  'NVIDIA',
  'Samsung',
  'Elgato',
];
const sortOptions = [
  'Featured',
  'Price: Low to High',
  'Price: High to Low',
  'Best Rated',
  'Most Reviews',
];

const ProductsContent: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedBrand, setSelectedBrand] = useState('All Brands');
  const [sortBy, setSortBy] = useState('Featured');
  const [maxPrice, setMaxPrice] = useState(2000);
  const [searchQuery, setSearchQuery] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [addedId, setAddedId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 12;

  const filtered = useMemo(() => {
    let result = [...allProducts];
    if (selectedCategory !== 'All') result = result.filter((p) => p.category === selectedCategory);
    if (selectedBrand !== 'All Brands') result = result.filter((p) => p.brand === selectedBrand);
    if (inStockOnly) result = result.filter((p) => p.inStock);
    result = result.filter((p) => p.price <= maxPrice);
    if (searchQuery)
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.brand.toLowerCase().includes(searchQuery.toLowerCase())
      );
    if (sortBy === 'Price: Low to High') result.sort((a, b) => a.price - b.price);
    else if (sortBy === 'Price: High to Low') result.sort((a, b) => b.price - a.price);
    else if (sortBy === 'Best Rated') result.sort((a, b) => b.rating - a.rating);
    else if (sortBy === 'Most Reviews') result.sort((a, b) => b.reviewCount - a.reviewCount);
    return result;
  }, [selectedCategory, selectedBrand, sortBy, maxPrice, searchQuery, inStockOnly]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const handleAddToCart = (id: number) => {
    setAddedId(id);
    setTimeout(() => setAddedId(null), 1500);
  };

  const resetFilters = () => {
    setSelectedCategory('All');
    setSelectedBrand('All Brands');
    setMaxPrice(2000);
    setInStockOnly(false);
    setSearchQuery('');
    setPage(1);
  };

  return (
    <div className="pt-24 pb-16 px-6 max-w-screen-xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <span className="tag-neon mb-3 inline-block">Full Catalog</span>
        <h1 className="text-display-md">
          ALL <span className="gradient-text-primary">GEAR</span>
        </h1>
        <p className="text-muted-foreground mt-2 text-base">{filtered.length} products found</p>
      </div>

      {/* Search + Sort Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Icon
            name="MagnifyingGlassIcon"
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search products, brands..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="checkout-input pl-10"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="checkout-input sm:w-52 cursor-pointer"
        >
          {sortOptions.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="btn-outline py-3 px-5 text-sm sm:hidden"
        >
          <Icon name="AdjustmentsHorizontalIcon" size={16} />
          Filters
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Filters */}
        <aside
          className={`${sidebarOpen ? 'block' : 'hidden'} sm:block w-full sm:w-64 flex-shrink-0`}
        >
          <div className="filter-sidebar p-5 sticky top-24">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-foreground text-base">Filters</h2>
              <button
                onClick={resetFilters}
                className="text-xs text-primary font-bold hover:underline"
              >
                Reset All
              </button>
            </div>

            {/* Category */}
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                Category
              </p>
              <div className="flex flex-col gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setPage(1);
                    }}
                    className={`text-left text-sm px-3 py-2 rounded-lg transition-all font-medium ${
                      selectedCategory === cat
                        ? 'bg-primary/15 text-primary border border-primary/30'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Brand */}
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                Brand
              </p>
              <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto scrollbar-thin">
                {brands.map((brand) => (
                  <button
                    key={brand}
                    onClick={() => {
                      setSelectedBrand(brand);
                      setPage(1);
                    }}
                    className={`text-left text-sm px-3 py-2 rounded-lg transition-all font-medium ${
                      selectedBrand === brand
                        ? 'bg-primary/15 text-primary border border-primary/30'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Max Price
                </p>
                <span className="text-xs font-bold text-primary">${maxPrice.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min={50}
                max={2000}
                step={50}
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(Number(e.target.value));
                  setPage(1);
                }}
                className="range-slider"
              />

              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <span>$50</span>
                <span>$2,000</span>
              </div>
            </div>

            {/* In Stock */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div
                  onClick={() => {
                    setInStockOnly(!inStockOnly);
                    setPage(1);
                  }}
                  className={`w-10 h-5 rounded-full transition-all relative flex-shrink-0 ${inStockOnly ? 'bg-primary' : 'bg-muted'}`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${inStockOnly ? 'left-5' : 'left-0.5'}`}
                  />
                </div>
                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  In Stock Only
                </span>
              </label>
            </div>
          </div>
        </aside>

        {/* Products Grid */}
        <div className="flex-1 min-w-0">
          {paginated.length === 0 ? (
            <div className="text-center py-20">
              <Icon
                name="MagnifyingGlassIcon"
                size={40}
                className="text-muted-foreground mx-auto mb-4"
              />
              <p className="text-xl font-bold text-foreground mb-2">No products found</p>
              <p className="text-muted-foreground mb-6">
                Try adjusting your filters or search query.
              </p>
              <button onClick={resetFilters} className="btn-primary text-sm">
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {paginated.map((product) => (
                <div key={product.id} className="product-card card-dark overflow-hidden group">
                  {/* Image */}
                  <div className="relative overflow-hidden h-48 bg-muted">
                    <AppImage
                      src={product.image}
                      alt={product.alt}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      className="product-card-img object-cover"
                    />

                    {product.tag && (
                      <div className="absolute top-3 left-3 z-10">
                        <span className={product.tagType === 'cyan' ? 'tag-cyan' : 'tag-neon'}>
                          {product.tag}
                        </span>
                      </div>
                    )}
                    {!product.inStock && (
                      <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                        <span className="tag-cyan text-xs">Out of Stock</span>
                      </div>
                    )}
                    {product.inStock && (
                      <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <button
                          onClick={() => handleAddToCart(product.id)}
                          className="btn-primary text-xs py-2.5 px-5 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
                        >
                          {addedId === product.id ? (
                            <>
                              <Icon name="CheckIcon" size={14} /> Added!
                            </>
                          ) : (
                            <>
                              <Icon name="ShoppingCartIcon" size={14} /> Add to Cart
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {product.brand}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{product.category}</span>
                    </div>
                    <h3 className="font-bold text-foreground text-sm leading-tight mb-2">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mb-3">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Icon
                            key={i}
                            name="StarIcon"
                            size={11}
                            variant="solid"
                            className={
                              i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-muted'
                            }
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        ({product.reviewCount.toLocaleString()})
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-black text-primary">
                          ${product.price.toFixed(2)}
                        </span>
                        {product.originalPrice && (
                          <span className="text-xs text-muted-foreground line-through">
                            ${product.originalPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                      {product.inStock && (
                        <button
                          onClick={() => handleAddToCart(product.id)}
                          className="p-1.5 rounded-lg border border-border hover:border-primary hover:bg-primary/10 transition-all group/btn"
                          aria-label="Add to cart"
                        >
                          <Icon
                            name="PlusIcon"
                            size={14}
                            className="text-muted-foreground group-hover/btn:text-primary transition-colors"
                          />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2.5 rounded-xl border border-border hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <Icon name="ChevronLeftIcon" size={16} className="text-foreground" />
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                    page === i + 1
                      ? 'bg-primary text-primary-foreground neon-glow'
                      : 'border border-border text-muted-foreground hover:border-primary hover:text-foreground'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2.5 rounded-xl border border-border hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <Icon name="ChevronRightIcon" size={16} className="text-foreground" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsContent;
