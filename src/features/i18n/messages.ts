export const DEFAULT_LOCALE = 'en' as const;
export const LOCALE_STORAGE_KEY = 'gadget-arena-locale';

export type Locale = 'en' | 'th';

export const messages = {
  en: {
    'nav.home': 'Home',
    'nav.products': 'Products',
    'nav.checkout': 'Checkout',
    'language.switchToThai': 'Switch language to Thai',
    'language.switchToEnglish': 'Switch language to English',
    'header.switchToLight': 'Switch to light mode',
    'header.switchToDark': 'Switch to dark mode',
    'header.cart': 'Cart',
    'header.openMenu': 'Open menu',
    'header.closeMenu': 'Close menu',
    'header.shopNow': 'Shop now',
    'header.shopAll': 'Shop all products',
    'home.delivery.title': 'Delivery',
    'home.delivery.description':
      'Delivery quotes are unavailable in this demo. Checkout shows the item subtotal only, and no payment is collected.',
    'home.returns.title': 'Returns',
    'home.returns.description':
      'If an item arrives with a problem, contact Gadget Arena with your order details so we can review the next steps.',
    'hero.tag': 'Gaming gear & PC setup',
    'hero.heading.before': 'Play at',
    'hero.heading.highlight': 'the edge',
    'hero.heading.after': 'of power.',
    'hero.description':
      'Browse gaming peripherals and PC gear with current stock status and Thai baht pricing.',
    'hero.shopCatalog': 'Shop the catalog',
    'hero.seeFeatured': 'See featured gear',
    'hero.liveCatalog': 'Live catalog',
    'hero.stockAware': 'Stock-aware',
    'hero.addAvailable': 'Add available gear to cart',
    'categories.tag': 'Browse by category',
    'categories.heading.before': 'Gear',
    'categories.heading.highlight': 'up',
    'categories.all': 'All categories',
    'categories.mice.subtitle': 'Precision control',
    'categories.keyboards.subtitle': 'Mechanical feel',
    'categories.headsets.subtitle': 'Immersive audio',
    'categories.monitors.subtitle': 'High refresh rates',
    'homeCatalog.tag': 'Featured gear',
    'homeCatalog.heading': 'Top picks',
    'homeCatalog.description': 'A practical starting point from the current Gadget Arena catalog.',
    'homeCatalog.error': 'Selected products are unavailable right now. Please try again.',
    'footer.copyright': '© 2026 Gadget Arena',
    'catalog.inStock': 'In stock',
    'catalog.outOfStock': 'Out of stock',
  },
  th: {
    'nav.home': 'หน้าหลัก',
    'nav.products': 'สินค้า',
    'nav.checkout': 'สั่งซื้อ',
    'language.switchToThai': 'เปลี่ยนภาษาเป็นไทย',
    'language.switchToEnglish': 'เปลี่ยนภาษาเป็นอังกฤษ',
    'header.switchToLight': 'เปลี่ยนเป็นโหมดสว่าง',
    'header.switchToDark': 'เปลี่ยนเป็นโหมดมืด',
    'header.cart': 'ตะกร้าสินค้า',
    'header.openMenu': 'เปิดเมนู',
    'header.closeMenu': 'ปิดเมนู',
    'header.shopNow': 'เลือกซื้อ',
    'header.shopAll': 'ดูสินค้าทั้งหมด',
    'home.delivery.title': 'การจัดส่ง',
    'home.delivery.description':
      'เดโมนี้ยังไม่มีการคำนวณค่าจัดส่ง หน้าสั่งซื้อจะแสดงเฉพาะยอดรวมสินค้าและไม่มีการชำระเงิน',
    'home.returns.title': 'การคืนสินค้า',
    'home.returns.description':
      'หากสินค้าได้รับความเสียหาย โปรดติดต่อ Gadget Arena พร้อมรายละเอียดคำสั่งซื้อเพื่อให้เราตรวจสอบขั้นตอนถัดไป',
    'hero.tag': 'อุปกรณ์เกมมิงและชุดคอมพิวเตอร์',
    'hero.heading.before': 'ยกระดับ',
    'hero.heading.highlight': 'ขีดจำกัด',
    'hero.heading.after': 'ของการเล่น',
    'hero.description':
      'เลือกอุปกรณ์เกมมิงและพีซี พร้อมสถานะสต็อกปัจจุบันและราคาเงินบาทไทย',
    'hero.shopCatalog': 'เลือกดูสินค้า',
    'hero.seeFeatured': 'ดูสินค้าแนะนำ',
    'hero.liveCatalog': 'รายการสินค้าปัจจุบัน',
    'hero.stockAware': 'เช็กสต็อกได้',
    'hero.addAvailable': 'เพิ่มสินค้าที่พร้อมขายลงตะกร้า',
    'categories.tag': 'เลือกตามหมวดหมู่',
    'categories.heading.before': 'เติม',
    'categories.heading.highlight': 'อุปกรณ์',
    'categories.all': 'ทุกหมวดหมู่',
    'categories.mice.subtitle': 'ควบคุมได้แม่นยำ',
    'categories.keyboards.subtitle': 'สัมผัสแบบแมคคานิคัล',
    'categories.headsets.subtitle': 'เสียงเต็มอรรถรส',
    'categories.monitors.subtitle': 'รีเฟรชเรตสูง',
    'homeCatalog.tag': 'สินค้าแนะนำ',
    'homeCatalog.heading': 'สินค้าแนะนำ',
    'homeCatalog.description': 'จุดเริ่มต้นที่คัดสรรมาจากรายการสินค้าปัจจุบันของ Gadget Arena',
    'homeCatalog.error': 'ยังไม่สามารถแสดงสินค้าแนะนำได้ โปรดลองอีกครั้ง',
    'footer.copyright': '© 2026 Gadget Arena',
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
