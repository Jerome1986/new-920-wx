// 搜索产品函数
import { quickSellSearchProductApi } from '@/api/product.ts'
import type { ProductItem } from '@/types/ProductItem'
import type { CateItem } from '@/types/CateItem'

export const searchProduct = async (
  model: string,
  tagList: CateItem[],
  activeTagIndex: number,
  cateList: CateItem[],
  activeCateIndex: number,
) => {
  const res = await quickSellSearchProductApi(
    model,
    tagList[activeTagIndex]._id,
    cateList[activeCateIndex]._id,
  )

  // 处理搜索结果排序
  const searchKey = model.toLowerCase()
  const sortedList = res.data.map((product: ProductItem) => {
    // 1. 将匹配的型号移到 models 数组第一位
    if (product.models && product.models.length > 0) {
      const matchIndex = product.models.findIndex((m: string) => m.toLowerCase() === searchKey)
      if (matchIndex > 0) {
        const matched = product.models.splice(matchIndex, 1)[0]
        product.models.unshift(matched)
      }
    }
    return product
  })

  // 2. 将完全匹配的商品放到列表第一位
  sortedList.sort((a: ProductItem, b: ProductItem) => {
    const aHasExact = a.models?.some((m: string) => m.toLowerCase() === searchKey) ?? false
    const bHasExact = b.models?.some((m: string) => m.toLowerCase() === searchKey) ?? false
    if (aHasExact && !bHasExact) return -1
    if (!aHasExact && bHasExact) return 1
    return 0
  })

  return sortedList
}
