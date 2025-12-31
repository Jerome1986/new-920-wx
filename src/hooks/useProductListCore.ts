import type { ProductItem, ProductPageResult } from '@/types/ProductItem'
import { ref } from 'vue'
import type { Data } from '@/utils/http.ts'

export const useProductListCore = (options: {
  fetchList: (cateId: string, pageNum: number, pageSize: number) => Promise<Data<ProductPageResult>>
}) => {
  // 产品分页
  const pageNum = ref(1)
  const pageSize = ref(10)

  // 如果没有二级分类或三级分类则直接渲染商品
  const finish = ref(false)
  const productList = ref<ProductItem[]>([])

  const productListGet = async (cateId: string) => {
    // 退出分页判断
    if (finish.value) {
      return
    }
    const res = await options.fetchList(cateId, pageNum.value, pageSize.value)
    console.log('产品', res)
    productList.value.push(...res.data.list)
    if (pageNum.value < res.data.totalPage) {
      pageNum.value++
    } else {
      finish.value = true
    }
  }

  const reset = () => {
    pageNum.value = 1 // 重置产品页码
    finish.value = false // 重置产品退出分页
    productList.value = [] // 重置产品列表
  }

  /**
   * 处理阅读量的更新
   * @description 接受子组件的列表项点击事件，并获取更新当前项阅读量的参数，同步更新父组件的阅读量
   * @param newLook - 更新后从服务端返回的阅读量
   * @param productId - 点击当前项的id
   */
  const handleNewLook = (newLook: number, productId: string) => {
    console.log('更新后的阅读量', newLook, productId)
    const item = productList.value.find((p) => p._id === productId)
    if (item) item.lookNum = newLook
  }

  return {
    finish,
    productList,
    productListGet,
    reset,
    handleNewLook,
  }
}
