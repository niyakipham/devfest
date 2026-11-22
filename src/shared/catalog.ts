/**
 * Server-authoritative price list.
 *
 * F4 of the blueprint: the old `POST /api/shop/purchase` trusted a `price` field
 * sent by the client, so any player could buy anything for 1 đồng. Prices now live
 * here, shared by client (to render the tag) and server (to charge). The client may
 * only send a SKU.
 *
 * Money rules (see shared/formulas):
 *  - prices are positive integers in đồng
 *  - reputation discounts are applied server-side via priceWithReputation
 *  - a SKU that is not in this table cannot be bought — no fallback to body.price
 */
export interface CatalogEntry {
  /** stable id the client sends */
  sku: string
  /** Vietnamese display name */
  name: string
  /** base price in đồng */
  price: number
  /** what the player gets */
  kind: 'food' | 'cosmetic' | 'tool' | 'transport' | 'experience'
  /** optional linkage to a POI payload key */
  note?: string
}

export const CATALOG: readonly CatalogEntry[] = [
  { sku: 'food:pho', name: 'Phở bò', price: 45, kind: 'food', note: 'FOOD.pho' },
  { sku: 'food:bun-cha', name: 'Bún chả', price: 40, kind: 'food', note: 'FOOD.bunCha' },
  { sku: 'food:ca-phe-trung', name: 'Cà phê trứng', price: 30, kind: 'food', note: 'FOOD.caPheTrung' },
  { sku: 'food:banh-mi', name: 'Bánh mì', price: 25, kind: 'food', note: 'FOOD.banhMi' },
  { sku: 'food:tra-da', name: 'Trà đá', price: 10, kind: 'food', note: 'FOOD.traDa' },

  { sku: 'tool:camera-film', name: 'Cuộn phim', price: 60, kind: 'tool' },
  { sku: 'tool:cyclo-fare', name: 'Vé xích lô một vòng hồ', price: 80, kind: 'transport' },

  { sku: 'cosmetic:non-la', name: 'Nón lá', price: 220, kind: 'cosmetic' },
  { sku: 'cosmetic:ao-dai', name: 'Áo dài', price: 480, kind: 'cosmetic' },
  { sku: 'cosmetic:ao-ba-ba', name: 'Áo bà ba', price: 260, kind: 'cosmetic' },
  { sku: 'cosmetic:dep-lot', name: 'Dép lốp', price: 90, kind: 'cosmetic' },

  { sku: 'experience:photo-print', name: 'In một tấm ảnh', price: 150, kind: 'experience' },
] as const

const BY_SKU = new Map(CATALOG.map((entry) => [entry.sku, entry]))

export const findSku = (sku: string): CatalogEntry | undefined => BY_SKU.get(sku)

export interface PriceQuote {
  sku: string
  name: string
  listPrice: number
  charged: number
  discount: number
}

/**
 * Server-side quote. `reputation` is the merchant faction standing, 0..100.
 * Discount is capped at 15% by priceWithReputation — never free.
 */
export const quote = (sku: string, reputation = 0, priceWithReputation: (base: number, rep: number) => number): PriceQuote | null => {
  const entry = BY_SKU.get(sku)
  if (!entry) return null
  const charged = priceWithReputation(entry.price, reputation)
  return {
    sku: entry.sku,
    name: entry.name,
    listPrice: entry.price,
    charged,
    discount: entry.price - charged,
  }
}
