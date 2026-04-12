<script setup lang="ts">
import NavTab from '@/components/NavTab.vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import GlobalProductBar from '@/components/GlobalProductBar.vue'
import { cateListTocGetApi } from '@/api/cate'
import { ref } from 'vue'
import type { CateItem } from '@/types/CateItem'
import { productListByCateIdTocGetApi } from '@/api/product'
import type { ProductItem } from '@/types/ProductItem'

// 处理搜索
const handleSearch = () => {
  uni.navigateTo({
    url: '/pages/search/searchToC',
  })
}

// 获取C端分类
const tocCate = ref<CateItem[]>([])
const currentCateId = ref(0)
const tocCategoryGet = async () => {
  const res = await cateListTocGetApi(1, 100, 0, 1)
  console.log('分类', res)
  const list = res.data.list ?? []
  tocCate.value = list
  if (!list.length) {
    currentCateId.value = 0
    return
  }
  currentCateId.value = list[0].id
}

// 选择toc分类
const selectCate = async (cateId: number) => {
  console.log('提交', cateId)
  // 重置
  pageNum.value = 1
  finish.value = false
  tocProductList.value = []
  // 请求
  currentCateId.value = cateId
  await tocProductGet(currentCateId.value)
}

// toc商品
const tocProductList = ref<ProductItem[]>([])
const pageNum = ref(1)
const pageSize = ref(10)
const finish = ref(false)
const loadingMore = ref(false)
const tocProductGet = async (cateId: number) => {
  if (finish.value) return
  const res = await productListByCateIdTocGetApi(cateId, pageNum.value, pageSize.value)
  console.log('list', res)
  if (pageNum.value === 1) {
    tocProductList.value = res.data.list
  } else {
    tocProductList.value.push(...res.data.list)
  }

  if (pageNum.value < res.data.totalPage) {
    pageNum.value++
  } else {
    finish.value = true
  }
}

// 加载更多
const loadMore = async () => {
  if (finish.value) return
  if (loadingMore.value) return
  loadingMore.value = true
  try {
    await tocProductGet(currentCateId.value)
  } finally {
    loadingMore.value = false
  }
}

// 点击+阅读量
const handleNewLook = (lookNum: number, productId: number) => {
  console.log('look', lookNum, productId)
  const item = tocProductList.value.find((p) => p.id === productId)
  if (item) {
    item.lookNum = lookNum
  }
}

onLoad(async () => {
  await tocCategoryGet()
  if (currentCateId.value) {
    await tocProductGet(currentCateId.value)
  }
})
</script>
<template>
  <view class="shopPage">
    <!-- 搜索 -->
    <view class="search" style="margin-bottom: 24rpx" @click="handleSearch">
      <uni-search-bar :readonly="true" placeholder="根据商品名称或货号来搜索" bgColor="#EEEEEE" />
    </view>
    <!-- 一级分类 -->
    <NavTab :list="tocCate" @cateSelected="selectCate"></NavTab>

    <view class="list">
      <GlobalProductBar
        :models="'toC'"
        :list="tocProductList as ProductItem[]"
        :finish="finish"
        @update:loadMore="loadMore"
        @update:lookNum="handleNewLook"
      ></GlobalProductBar>
    </view>
  </view>
</template>

<style scoped lang="scss">
.shopPage {
  height: 100%;
  padding: 24rpx;
  display: flex;
  flex-direction: column;

  .list {
    flex: 1;
    overflow: hidden;
  }
}
</style>
