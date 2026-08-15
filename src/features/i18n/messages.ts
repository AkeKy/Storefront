export const DEFAULT_LOCALE = 'en' as const;
export const LOCALE_STORAGE_KEY = 'gadget-arena-locale';

export type Locale = 'en' | 'th';

export const messages = {
  en: {
    'nav.home': 'Home',
    'catalog.inStock': 'In stock',
    'catalog.outOfStock': 'Out of stock',
  },
  th: {
    'nav.home': 'หน้าหลัก',
    'catalog.inStock': 'มีสินค้า',
    'catalog.outOfStock': 'สินค้าหมด',
  },
} as const satisfies Record<Locale, Record<string, string>>;

export type MessageKey = keyof typeof messages.en;

export const categoryMessages: Record<Locale, Record<string, string>> = {
  en: {
    mice: 'Mice',
    keyboards: 'Keyboards',
    headsets: 'Headsets',
    monitors: 'Monitors',
  },
  th: {
    mice: 'เมาส์',
    keyboards: 'คีย์บอร์ด',
    headsets: 'หูฟัง',
    monitors: 'จอภาพ',
  },
};

export const badgeMessages: Record<Locale, Record<string, string>> = {
  en: { New: 'New', Sale: 'Sale', Limited: 'Limited' },
  th: { New: 'ใหม่', Sale: 'ลดราคา', Limited: 'จำนวนจำกัด' },
};
