/**
 * Krushna Collection - Seed Data
 * Authentic Indian ethnic & contemporary clothing.
 * Prices are strictly stored in integer paise.
 */

import { db, runTransaction } from './db.ts';

export function seedDatabase(force = false): void {
  // If products already exist, ensure stock levels remain healthy without dropping tables
  const countRow = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  if (countRow && countRow.count > 0 && !force) {
    db.prepare('UPDATE product_variants SET stock = 25 WHERE stock < 5').run();
    return;
  }

  runTransaction(() => {
    if (force) {
      db.prepare('UPDATE product_variants SET stock = 25').run();
      return;
    }
    // 1. Seed Coupons
    const insertCoupon = db.prepare(`
      INSERT OR REPLACE INTO coupons (code, discount_type, discount_value, min_order_paise, description, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertCoupon.run(
      'UTSAV10',
      'percentage',
      10,
      149900, // Min ₹1,499
      '10% Festive Discount on orders above ₹1,499',
      '2028-12-31T23:59:59Z'
    );

    insertCoupon.run(
      'EXAMPLE500',
      'fixed',
      50000, // Flat ₹500
      299900, // Min ₹2,999
      'Flat ₹500 OFF on orders above ₹2,999',
      '2028-12-31T23:59:59Z'
    );

    insertCoupon.run(
      'KRUSHNA500',
      'fixed',
      50000, // Flat ₹500
      299900, // Min ₹2,999
      'Flat ₹500 OFF on orders above ₹2,999',
      '2028-12-31T23:59:59Z'
    );

    insertCoupon.run(
      'FIRSTBUY',
      'percentage',
      15,
      99900, // Min ₹999
      '15% Welcome Discount on orders above ₹999',
      '2028-12-31T23:59:59Z'
    );

    // 2. Seed Products and Variants
    const insertProduct = db.prepare(`
      INSERT INTO products (
        id, name, category, description, fabric, craft, occasion, color,
        price_paise, mrp_paise, images_json, rating, review_count, featured, is_new
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertVariant = db.prepare(`
      INSERT INTO product_variants (id, product_id, size, stock, sku)
      VALUES (?, ?, ?, ?, ?)
    `);

    const products = [
      {
        id: 'kc-prod-001',
        name: 'Royal Banarasi Katan Silk Saree in Vermilion Red',
        category: 'sarees',
        description: 'Handwoven pure Katan silk saree featuring intricate floral kadwa zari bootis and a resplendent floral jaal pallu. Handcrafted by master weavers in Varanasi over 28 days of meticulous loom work.',
        fabric: 'Pure Katan Silk',
        craft: 'Banarasi Kadwa Zari Weave',
        occasion: 'Bridal & Wedding Reception',
        color: 'Vermilion Red & Gold',
        price_paise: 799900, // ₹7,999
        mrp_paise: 1199900,  // ₹11,999
        images: [
          'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=80',
        ],
        rating: 4.9,
        review_count: 38,
        featured: 1,
        is_new: 1,
        variants: [
          { size: 'Free Size', stock: 8, sku: 'KC-SAR-001-FS' },
        ],
      },
      {
        id: 'kc-prod-002',
        name: 'Lucknowi Chikankari Hand-Embroidered Georgette Anarkali Set',
        category: 'kurtas',
        description: 'Exquisite pastel mint Anarkali suit set adorned with fine Bakhiya, Phanda, and Keel Kangan Chikankari stitches, paired with matching flared palazzos and a delicate Mukaish-embellished chiffon dupatta.',
        fabric: 'Pure Viscose Georgette',
        craft: 'Lucknowi Hand Chikankari & Mukaish',
        occasion: 'Festive / Haldi / Mehendi',
        color: 'Pastel Mint Green',
        price_paise: 449900, // ₹4,499
        mrp_paise: 649900,  // ₹6,499
        images: [
          'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=1000&q=80',
        ],
        rating: 4.8,
        review_count: 52,
        featured: 1,
        is_new: 1,
        variants: [
          { size: 'XS', stock: 4, sku: 'KC-KUR-002-XS' },
          { size: 'S', stock: 6, sku: 'KC-KUR-002-S' },
          { size: 'M', stock: 10, sku: 'KC-KUR-002-M' },
          { size: 'L', stock: 7, sku: 'KC-KUR-002-L' },
          { size: 'XL', stock: 5, sku: 'KC-KUR-002-XL' },
        ],
      },
      {
        id: 'kc-prod-003',
        name: 'Heritage Velvet Zardozi Bridal Lehenga in Deep Maroon',
        category: 'lehengas',
        description: 'Opulent micro-velvet bridal lehenga hand-embroidered with antique gold zardozi, dabka, sequins, and pearls. Includes an intricately worked velvet choli and dual dupattas in sheer net and organza.',
        fabric: 'Royal Micro-Velvet & Tissue Silk',
        craft: 'Handcrafted Zardozi & Dabka',
        occasion: 'Bridal & Sangeet',
        color: 'Deep Maroon & Antique Gold',
        price_paise: 1699900, // ₹16,999
        mrp_paise: 2499900,  // ₹24,999
        images: [
          'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1000&q=80',
        ],
        rating: 5.0,
        review_count: 24,
        featured: 1,
        is_new: 0,
        variants: [
          { size: 'S', stock: 3, sku: 'KC-LEH-003-S' },
          { size: 'M', stock: 5, sku: 'KC-LEH-003-M' },
          { size: 'L', stock: 4, sku: 'KC-LEH-003-L' },
          { size: 'XL', stock: 2, sku: 'KC-LEH-003-XL' },
        ],
      },
      {
        id: 'kc-prod-004',
        name: 'Men\'s Raw Silk Kurta Pajama with Embroidered Bundi Jacket',
        category: 'mens',
        description: 'Midnight navy blue pure raw silk kurta set accompanied by tailored ivory churidar pants and a bespoke silk Nehru bundi jacket adorned with gold threadwork buttons and pocket square.',
        fabric: '100% Pure Raw Silk',
        craft: 'Zari Threadwork & Hand Embroidery',
        occasion: 'Wedding Guest / Festive Evening',
        color: 'Midnight Navy & Gold',
        price_paise: 389900, // ₹3,899
        mrp_paise: 549900,  // ₹5,499
        images: [
          'https://images.unsplash.com/photo-1621786030685-2c977a694637?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?auto=format&fit=crop&w=1000&q=80',
        ],
        rating: 4.8,
        review_count: 41,
        featured: 1,
        is_new: 1,
        variants: [
          { size: 'S', stock: 5, sku: 'KC-MEN-004-S' },
          { size: 'M', stock: 8, sku: 'KC-MEN-004-M' },
          { size: 'L', stock: 12, sku: 'KC-MEN-004-L' },
          { size: 'XL', stock: 6, sku: 'KC-MEN-004-XL' },
          { size: 'XXL', stock: 3, sku: 'KC-MEN-004-XXL' },
        ],
      },
      {
        id: 'kc-prod-005',
        name: 'Kanjeevaram Pure Mulberry Silk Saree in Peacock Blue',
        category: 'sarees',
        description: 'Authentic Tamil Nadu Kanchipuram silk saree with interlocking korvai border, featuring temple motifs (Gopuram) in pure gold zari and a rich contrasting crimson red pallu.',
        fabric: 'Pure Mulberry Silk (Silk Mark Certified)',
        craft: 'Traditional Korvai Handloom Weave',
        occasion: 'Ceremonial / South Indian Wedding',
        color: 'Peacock Blue & Crimson Zari',
        price_paise: 949900, // ₹9,499
        mrp_paise: 1399900,  // ₹13,999
        images: [
          'https://images.unsplash.com/photo-1610030469668-93510cb28665?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=80',
        ],
        rating: 4.9,
        review_count: 67,
        featured: 0,
        is_new: 1,
        variants: [
          { size: 'Free Size', stock: 6, sku: 'KC-SAR-005-FS' },
        ],
      },
      {
        id: 'kc-prod-006',
        name: 'Festive Mirror Work Sharara Suit Set in Ochre Saffron',
        category: 'kurtas',
        description: 'Radiant ochre yellow straight kurta accented with real mirror embroidery along the neckline, paired with a flared tiered sharara and an ethereal organza dupatta with gota patti borders.',
        fabric: 'Chanderi Silk & Organza',
        craft: 'Abhla Mirror Handwork & Gota Patti',
        occasion: 'Diwali / Sangeet / Festive Celebrations',
        color: 'Ochre Saffron Yellow',
        price_paise: 329900, // ₹3,299
        mrp_paise: 499900,  // ₹4,999
        images: [
          'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=80',
        ],
        rating: 4.7,
        review_count: 29,
        featured: 0,
        is_new: 1,
        variants: [
          { size: 'XS', stock: 3, sku: 'KC-KUR-006-XS' },
          { size: 'S', stock: 5, sku: 'KC-KUR-006-S' },
          { size: 'M', stock: 9, sku: 'KC-KUR-006-M' },
          { size: 'L', stock: 6, sku: 'KC-KUR-006-L' },
          { size: 'XL', stock: 4, sku: 'KC-KUR-006-XL' },
        ],
      },
      {
        id: 'kc-prod-007',
        name: 'Floral Hand-Painted Pure Organza Silk Saree in Blush Rose',
        category: 'festive',
        description: 'Whisper-light pure organza saree featuring bespoke botanical rose motifs hand-painted by Kalamkari artisans, finished with handcrafted scalloped hand-cut embroidered borders.',
        fabric: 'Pure Silk Organza',
        craft: 'Artisanal Hand-Painting & Cutwork',
        occasion: 'Day Wedding / High Tea / Reception',
        color: 'Blush Rose & Silver',
        price_paise: 599900, // ₹5,999
        mrp_paise: 849900,  // ₹8,499
        images: [
          'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80',
        ],
        rating: 4.8,
        review_count: 19,
        featured: 1,
        is_new: 1,
        variants: [
          { size: 'Free Size', stock: 7, sku: 'KC-SAR-007-FS' },
        ],
      },
      {
        id: 'kc-prod-008',
        name: 'Royal Ivory Resham Embroidered Groom\'s Sherwani Set',
        category: 'mens',
        description: 'Impeccable bespoke ivory royal sherwani tailored from Italian jacquard brocade with tonal Resham embroidery, paired with a matching churidar, embellished stole, and royal safa fabric.',
        fabric: 'Pure Silk Jacquard Brocade',
        craft: 'Resham Hand Needlework & Muted Zari',
        occasion: 'Groom / Royal Wedding Ceremony',
        color: 'Ivory & Antique Pearl',
        price_paise: 1249900, // ₹12,499
        mrp_paise: 1899900,  // ₹18,999
        images: [
          'https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1621786030685-2c977a694637?auto=format&fit=crop&w=1000&q=80',
        ],
        rating: 4.9,
        review_count: 16,
        featured: 0,
        is_new: 0,
        variants: [
          { size: 'M', stock: 4, sku: 'KC-MEN-008-M' },
          { size: 'L', stock: 5, sku: 'KC-MEN-008-L' },
          { size: 'XL', stock: 3, sku: 'KC-MEN-008-XL' },
        ],
      },
      {
        id: 'kc-prod-009',
        name: 'Handblock Printed Chanderi Silk Saree in Indigo & Gold',
        category: 'sarees',
        description: 'Timeless Chanderi handloom silk cotton saree stamped with natural indigo Dabu block prints, accented with a shimmering golden tissue zari border and pallu.',
        fabric: 'Chanderi Handloom (Silk-Cotton)',
        craft: 'Natural Dabu Handblock Printing',
        occasion: 'Pooja / Office Festive / Celebrations',
        color: 'Royal Indigo & Antique Gold',
        price_paise: 279900, // ₹2,799
        mrp_paise: 399900,  // ₹3,999
        images: [
          'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80',
        ],
        rating: 4.7,
        review_count: 45,
        featured: 0,
        is_new: 0,
        variants: [
          { size: 'Free Size', stock: 12, sku: 'KC-SAR-009-FS' },
        ],
      },
    ];

    for (const p of products) {
      insertProduct.run(
        p.id,
        p.name,
        p.category,
        p.description,
        p.fabric,
        p.craft,
        p.occasion,
        p.color,
        p.price_paise,
        p.mrp_paise,
        JSON.stringify(p.images),
        p.rating,
        p.review_count,
        p.featured,
        p.is_new
      );

      for (const v of p.variants) {
        insertVariant.run(
          `${p.id}-${v.size.toLowerCase().replace(/\s+/g, '-')}`,
          p.id,
          v.size,
          v.stock,
          v.sku
        );
      }
    }
  });
}
