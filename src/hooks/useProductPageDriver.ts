// /hooks/useProductPageDriver.ts
import { ref, computed } from 'vue'
import { useProductListCore } from './useProductListCore'
import { useCategoryFetcher } from './useCategoryFetcher'
import type { Data } from '@/utils/http.ts'
import type { CateItem } from '@/types/CateItem'
import type { ProductPageResult } from '@/types/ProductItem'

export function useProductPageDriver(options: {
  fetchCategory: (level: number, parentId?: string) => Promise<Data<CateItem[]>>
  fetchProductList: (
    cateId: string,
    pageNum: number,
    pageSize: number,
  ) => Promise<Data<ProductPageResult>>
  // 点击三级分类时的跳转回调
  onNavigateToThirdCategory?: (thirdCategoryId: string) => void
}) {
  // 分类状态
  const { fetchLevel1, fetchLevel2, fetchLevel3 } = useCategoryFetcher(options.fetchCategory)

  const level1List = ref<CateItem[]>([])
  const level2List = ref<CateItem[]>([])
  const level3List = ref<CateItem[]>([])

  const currentLevel1 = ref<string | null>(null)
  const currentLevel2 = ref<string | null>(null)
  const currentLevel3 = ref<string | null>(null)

  // 跳转中标志（防止跳转瞬间闪现商品列表）
  const isNavigating = ref(false)

  // 是否显示商品列表（有三级分类时不显示，跳转时也不显示）
  const showProductList = computed(() => !isNavigating.value && level3List.value.length === 0)

  // 商品列表核心
  const productCore = useProductListCore({
    fetchList: options.fetchProductList,
  })

  // 当前"生效分类"计算（关键）
  const getActiveCategoryId = () => {
    return currentLevel3.value || currentLevel2.value || currentLevel1.value || undefined
  }

  // 商品请求
  const fetchProduct = async () => {
    const cateId = getActiveCategoryId()
    if (cateId) {
      await productCore.productListGet(cateId)
    }
  }

  // 一级分类点击
  const selectLevel1 = async (id: string) => {
    isNavigating.value = false // 重置跳转标志
    currentLevel1.value = id
    currentLevel2.value = null
    currentLevel3.value = null
    level2List.value = []
    level3List.value = []
    productCore.reset()

    // 请求二级分类
    const list2 = (await fetchLevel2(id)).data
    console.log('二级分类', list2)
    level2List.value = list2

    if (list2.length === 0) {
      // 没有二级分类，直接显示商品
      await fetchProduct()
    }
    // 有二级分类时，等用户点击二级分类
  }

  // 二级分类点击
  const selectLevel2 = async (id: string) => {
    isNavigating.value = false // 重置跳转标志
    currentLevel2.value = id
    currentLevel3.value = null
    level3List.value = []
    productCore.reset()

    // 请求三级分类
    const list3 = (await fetchLevel3(id)).data
    console.log('三级分类', list3)
    level3List.value = list3

    if (list3.length === 0) {
      // 没有三级分类，直接显示商品
      await fetchProduct()
    }
    // 有三级分类时，不显示商品列表（computed 自动处理）
  }

  // 三级分类点击 - 跳转到详情页
  const selectLevel3 = (id: string) => {
    // 设置跳转标志，防止跳转瞬间闪现商品列表
    isNavigating.value = true
    if (options.onNavigateToThirdCategory) {
      options.onNavigateToThirdCategory(id)
    }
  }

  // 初始化 - 逐层加载并选中第一个分类
  const init = async () => {
    // 1. 加载一级分类
    const list1 = (await fetchLevel1()).data
    console.log('一级分类', list1)
    level1List.value = list1

    if (list1.length === 0) return

    // 选中第一个一级分类
    const firstLevel1Id = list1[0].id
    currentLevel1.value = firstLevel1Id

    // 2. 加载二级分类
    const list2 = (await fetchLevel2(firstLevel1Id)).data
    console.log('二级分类', list2)
    level2List.value = list2

    if (list2.length === 0) {
      // 只有一级分类，直接加载商品（showProductList 由 computed 自动处理）
      await fetchProduct()
      return
    }

    // 选中第一个二级分类
    const firstLevel2Id = list2[0].id
    currentLevel2.value = firstLevel2Id

    // 3. 加载三级分类
    const list3 = (await fetchLevel3(firstLevel2Id)).data
    console.log('三级分类', list3)
    level3List.value = list3

    if (list3.length === 0) {
      // 只有一级+二级分类，直接加载商品（showProductList 由 computed 自动处理）
      await fetchProduct()
    }
    // 有三级分类时，不显示商品列表（computed 自动处理）
  }

  return {
    // 分类数据（返回 ref 本身，保持响应式）
    level1List,
    level2List,
    level3List,

    // 分类行为
    selectLevel1,
    selectLevel2,
    selectLevel3,

    // 商品（返回 ref 本身，保持响应式）
    showProductList,
    productList: productCore.productList,
    finish: productCore.finish,
    loadMore: fetchProduct,
    handleNewLook: productCore.handleNewLook,

    // 生命周期
    init,
  }
}
