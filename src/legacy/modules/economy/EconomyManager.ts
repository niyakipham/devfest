/**
 * Economy Module
 * Currency, shops, crafting, trading, auction house
 */

export interface ShopItem {
  itemId: string
  name: string
  price: number
  stock: number
  maxStock: number
  currency: 'xu' | 'ngoc'
  category: 'consumable' | 'equipment' | 'companion' | 'material' | 'cosmetic'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export interface CraftingRecipe {
  id: string
  name: string
  description: string
  materials: { itemId: string; quantity: number }[]
  product: { itemId: string; quantity: number }
  craftTime: number // seconds
  levelRequired: number
  xpReward: number
}

export interface MarketplaceListing {
  id: string
  sellerId: string
  sellerName: string
  itemId: string
  itemName: string
  quantity: number
  price: number
  status: 'active' | 'sold' | 'expired' | 'cancelled'
  createdAt: Date
  expiresAt: Date
}

export class EconomyManager {
  private shops: Map<string, ShopItem[]> // zoneId -> items
  private recipes: Map<string, CraftingRecipe>
  private listings: Map<string, MarketplaceListing>
  private taxRate: number = 0.05 // 5% tax on sales
  
  constructor() {
    this.shops = new Map()
    this.recipes = new Map()
    this.listings = new Map()
    
    this.initializeShops()
    this.initializeRecipes()
  }
  
  private initializeShops(): void {
    // Phố Cổ Shop
    this.shops.set('zone_pho_co', [
      { itemId: 'potion_small', name: 'Thuốc Hồi Phục Nhỏ', price: 50, stock: 99, maxStock: 99, currency: 'xu', category: 'consumable', rarity: 'common' },
      { itemId: 'potion_large', name: 'Thuốc Hồi Phục Lớn', price: 200, stock: 20, maxStock: 50, currency: 'xu', category: 'consumable', rarity: 'rare' },
      { itemId: 'companion_food', name: 'Thức Ăn Linh Thú', price: 30, stock: 50, maxStock: 100, currency: 'xu', category: 'companion', rarity: 'common' },
      { itemId: 'capture_net_basic', name: 'Lồng Thần Cơ Bản', price: 100, stock: 10, maxStock: 30, currency: 'xu', category: 'companion', rarity: 'common' },
      { itemId: 'capture_net_pro', name: 'Lồng Thần Cao Cấp', price: 500, stock: 5, maxStock: 10, currency: 'xu', category: 'companion', rarity: 'rare' },
      { itemId: 'map_pho_co', name: 'Bản Đồ Phố Cổ', price: 150, stock: 5, maxStock: 5, currency: 'xu', category: 'equipment', rarity: 'rare' },
      { itemId: 'ao_yếm_truyen', name: 'Áo Yếm Truyền Thống', price: 5000, stock: 3, maxStock: 5, currency: 'ngoc', category: 'cosmetic', rarity: 'epic' }
    ])
    
    // Hồ Tây Shop
    this.shops.set('zone_ho_tay', [
      { itemId: 'potion_special', name: 'Thuốc Đặc Biệt Hồ Tây', price: 300, stock: 15, maxStock: 30, currency: 'xu', category: 'consumable', rarity: 'rare' },
      { itemId: 'fishing_rod', name: 'Cần Câu Cá', price: 800, stock: 5, maxStock: 10, currency: 'xu', category: 'equipment', rarity: 'rare' },
      { itemId: 'boat_ticket', name: 'Vé Thuyền Hồ Tây', price: 200, stock: 20, maxStock: 50, currency: 'xu', category: 'consumable', rarity: 'common' }
    ])
  }
  
  private initializeRecipes(): void {
    this.recipes.set('craft_potion_large', {
      id: 'craft_potion_large',
      name: 'Thuốc Hồi Phục Lớn',
      description: 'Hồi phục 100 HP',
      materials: [
        { itemId: 'herb', quantity: 3 },
        { itemId: 'pure_water', quantity: 1 }
      ],
      product: { itemId: 'potion_large', quantity: 1 },
      craftTime: 30,
      levelRequired: 3,
      xpReward: 20
    })
    
    this.recipes.set('craft_capture_net', {
      id: 'craft_capture_net',
      name: 'Lồng Thần Tốt',
      description: 'Tỉ lệ thu phục cao hơn',
      materials: [
        { itemId: 'iron_ingot', quantity: 5 },
        { itemId: 'crystal_shard', quantity: 2 },
        { itemId: 'magic_thread', quantity: 3 }
      ],
      product: { itemId: 'capture_net_pro', quantity: 1 },
      craftTime: 120,
      levelRequired: 5,
      xpReward: 50
    })
  }
  
  buyItem(shopId: string, itemId: string, quantity: number, playerCurrency: number, currencyType: 'xu' | 'ngoc'): { success: boolean; error?: string; newBalance: number } {
    const shopItems = this.shops.get(shopId)
    if (!shopItems) return { success: false, error: 'Shop not found', newBalance: playerCurrency }
    
    const item = shopItems.find(i => i.itemId === itemId)
    if (!item) return { success: false, error: 'Item not found', newBalance: playerCurrency }
    
    if (item.stock < quantity) return { success: false, error: 'Out of stock', newBalance: playerCurrency }
    
    const totalCost = item.price * quantity
    if (totalCost > playerCurrency) return { success: false, error: 'Not enough currency', newBalance: playerCurrency }
    
    if (item.currency !== currencyType) return { success: false, error: 'Wrong currency type', newBalance: playerCurrency }
    
    item.stock -= quantity
    
    return {
      success: true,
      newBalance: playerCurrency - totalCost
    }
  }
  
  sellItem(itemId: string, quantity: number, basePrice: number): { earnings: number; afterTax: number } {
    const earnings = basePrice * quantity
    const tax = earnings * this.taxRate
    const afterTax = earnings - tax
    
    return { earnings, afterTax }
  }
  
  craft(recipeId: string, playerLevel: number): { success: boolean; error?: string; xpReward?: number } {
    const recipe = this.recipes.get(recipeId)
    if (!recipe) return { success: false, error: 'Recipe not found' }
    
    if (playerLevel < recipe.levelRequired) {
      return { success: false, error: `Level ${recipe.levelRequired} required` }
    }
    
    // In real implementation, check materials in inventory
    
    return {
      success: true,
      xpReward: recipe.xpReward
    }
  }
  
  createListing(sellerId: string, sellerName: string, itemId: string, itemName: string, quantity: number, price: number, durationHours: number = 24): MarketplaceListing {
    const listing: MarketplaceListing = {
      id: `listing_${Date.now()}`,
      sellerId,
      sellerName,
      itemId,
      itemName,
      quantity,
      price,
      status: 'active',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + durationHours * 3600000)
    }
    
    this.listings.set(listing.id, listing)
    return listing
  }
  
  buyListing(listingId: string, buyerCurrency: number): { success: boolean; error?: string; newBalance: number; sellerEarnings: number } {
    const listing = this.listings.get(listingId)
    if (!listing) return { success: false, error: 'Listing not found', newBalance: buyerCurrency, sellerEarnings: 0 }
    
    if (listing.status !== 'active') return { success: false, error: 'Listing not available', newBalance: buyerCurrency, sellerEarnings: 0 }
    
    if (listing.price > buyerCurrency) return { success: false, error: 'Not enough currency', newBalance: buyerCurrency, sellerEarnings: 0 }
    
    listing.status = 'sold'
    
    const tax = listing.price * this.taxRate
    const sellerEarnings = listing.price - tax
    
    return {
      success: true,
      newBalance: buyerCurrency - listing.price,
      sellerEarnings
    }
  }
  
  getShopItems(zoneId: string): ShopItem[] {
    return this.shops.get(zoneId) || []
  }
  
  getRecipes(): CraftingRecipe[] {
    return Array.from(this.recipes.values())
  }
  
  getActiveListings(): MarketplaceListing[] {
    return Array.from(this.listings.values()).filter(l => l.status === 'active')
  }
  
  cancelListing(listingId: string): boolean {
    const listing = this.listings.get(listingId)
    if (!listing || listing.status !== 'active') return false
    
    listing.status = 'cancelled'
    return true
  }
  
  getTaxRate(): number {
    return this.taxRate
  }
}
