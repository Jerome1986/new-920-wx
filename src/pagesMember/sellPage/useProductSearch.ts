import type { StoreInventoryItem } from '@/types/StoreInventory'
import { pinyin } from 'pinyin-pro'

// 搜索产品函数（支持：苹果 ↔ iPhone 互通搜索 + 没找到返回空数组）
export const searchInventoryProduct = (model: string, list: StoreInventoryItem[]) => {
  // 1. 空搜索直接返回空数组
  if (!model || model.trim() === '') {
    return []
  }

  const products = JSON.parse(JSON.stringify(list)) as StoreInventoryItem[]
  const searchKey = normalize(model)

  // 2. 先筛选出【至少有一个型号匹配】的商品
  const matchedProducts = products.filter((product) => {
    return product.models?.some((m) => isMatch(searchKey, m.name)) ?? false
  })

  // 3. 如果没有任何匹配 → 直接返回空数组
  if (matchedProducts.length === 0) {
    return []
  }

  // 4. 对匹配到的商品调整 models 顺序（匹配的放第一个）
  matchedProducts.forEach((product) => {
    if (!product.models || product.models.length === 0) return

    const matchIndex = product.models.findIndex((m) => isMatch(searchKey, m.name))

    if (matchIndex !== -1) {
      const [matched] = product.models.splice(matchIndex, 1)
      product.models.unshift(matched)
    }
  })

  // 5. 排序（匹配度高的放前面）
  matchedProducts.sort((a, b) => {
    const aMatch = a.models?.some((m) => isMatch(searchKey, m.name)) ?? false
    const bMatch = b.models?.some((m) => isMatch(searchKey, m.name)) ?? false
    return (bMatch ? 1 : 0) - (aMatch ? 1 : 0)
  })

  return matchedProducts
}

// ------------------------------
// 核心：多品牌同义词匹配
// ------------------------------
export function isMatch(searchKey: string, targetName: string): boolean {
  const targetKey = normalize(targetName)

  // 完全匹配
  if (searchKey === targetKey) return true

  // 苹果 ↔ iPhone
  const iphoneWords = ['iphone', 'pingguo', '苹果', 'apple']
  const isSearchIphone = iphoneWords.some((w) => searchKey.includes(normalize(w)))
  const isTargetIphone = iphoneWords.some((w) => targetKey.includes(normalize(w)))
  if (isSearchIphone && isTargetIphone) return true

  // 华为 ↔ huawei ↔ hw
  const huaweiWords = ['huawei', '华为', 'hw']
  const isSearchHuawei = huaweiWords.some((w) => searchKey.includes(normalize(w)))
  const isTargetHuawei = huaweiWords.some((w) => targetKey.includes(normalize(w)))
  if (isSearchHuawei && isTargetHuawei) return true

  return false
}

// ------------------------------
// 标准化
// ------------------------------
export function normalize(text: string) {
  if (!text) return ''

  const result = pinyin(text, {
    type: 'string',
    toneType: 'none',
    nonZh: 'consecutive',
    v: false,
  })

  return result
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '')
}
