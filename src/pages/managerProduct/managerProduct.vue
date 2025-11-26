<script setup lang="ts">
import { ref } from 'vue'
import type { ProductItem } from '@/types/ProductItem.d.ts'
import GlobalProductBar from '@/components/GlobalProductBar.vue'
import { onLoad } from '@dcloudio/uni-app'
import { productListBySubCateIdGetApi } from '@/api/product.ts'

const params = ref({
  pageNum: 1,
  pageSize: 10,
})

// 根据三级分类ID获取商品
const thirdCateId = ref('')
const finish = ref(false) // 标记退出分页
const productList = ref<ProductItem[]>([])
const productListGet = async (subCateId: string, pageNum: number, pageSize: number) => {
  if (finish.value) return
  const res = await productListBySubCateIdGetApi(subCateId, pageNum, pageSize)
  productList.value.push(...res.data.list)
  if (params.value.pageNum < res.data.totalPage) {
    params.value.pageNum++
  } else {
    finish.value = true
  }
}
// 触底加载更多
const handleScrolltolower = () => {
  console.log('触底')
  productListGet(thirdCateId.value, params.value.pageNum, params.value.pageSize)
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

onLoad((options: any) => {
  console.log(options)
  thirdCateId.value = options.thirdCategoryId
  productListGet(options.thirdCategoryId, params.value.pageNum, params.value.pageSize)
})
</script>

<template>
  <view class="managerProduct">
    <GlobalProductBar
      :list="productList"
      @update:load-more="handleScrolltolower"
      :finish="finish"
      :cate-type="1"
      @update:lookNum="handleNewLook"
    ></GlobalProductBar>
  </view>
</template>

<style scoped lang="scss">
.managerProduct {
  height: 100%;
  padding: 24rpx 24rpx 60rpx 24rpx;
}
</style>
