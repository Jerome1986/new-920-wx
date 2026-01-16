<script setup lang="ts">
import NavTab from '@/components/NavTab.vue'
import { onLoad } from '@dcloudio/uni-app'
import { cateListTocGetApi } from '@/api/cate.ts'
import GlobalProductBar from '@/components/GlobalProductBar.vue'
import { useProductPageDriver } from '@/hooks/useProductPageDriver.ts'
import { productListByCateIdTocGetApi } from '@/api/product.ts'

// 商品列表驱动器（解构使 ref 成为顶层变量，模板自动解包）

const {
  level1List,
  selectLevel1,
  showProductList,
  productList,
  finish,
  loadMore,
  init,
  handleNewLook,
} = useProductPageDriver({
  fetchCategory: cateListTocGetApi,
  fetchProductList: productListByCateIdTocGetApi,
})

// 处理搜索
const handleSearch = () => {
  uni.navigateTo({
    url: '/pages/search/searchToC',
  })
}

onLoad(async () => {
  await init()
})
</script>
<template>
  <view class="shopPage">
    <!-- 搜索 -->
    <div class="search" style="margin-bottom: 24rpx" @click="handleSearch">
      <uni-search-bar :readonly="true" placeholder="根据商品名称或货号来搜索" bgColor="#EEEEEE" />
    </div>
    <!-- 一级分类 -->
    <NavTab :list="level1List" @cateSelected="selectLevel1"></NavTab>

    <!-- 商品列表（只有没有三级分类时显示） -->
    <view class="list" v-if="showProductList">
      <GlobalProductBar
        :models="'toC'"
        :list="productList"
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
