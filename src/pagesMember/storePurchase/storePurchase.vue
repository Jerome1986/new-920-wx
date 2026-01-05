<script setup lang="ts">
import NavTab from '@/components/NavTab.vue'
import SubCategory from '@/components/SubCategory.vue'
import ThirdCategory from '@/components/ThirdCategory.vue'
import { onLoad } from '@dcloudio/uni-app'
import { cateListGetApi } from '@/api/cate.ts'
import GlobalProductBar from '@/components/GlobalProductBar.vue'
import { useProductPageDriver } from '@/hooks/useProductPageDriver.ts'
import { productListByCateIdGetApi } from '@/api/product.ts'

// 商品列表驱动器（解构使 ref 成为顶层变量，模板自动解包）
const {
  level1List,
  level2List,
  level3List,
  selectLevel1,
  selectLevel2,
  selectLevel3,
  showProductList,
  productList,
  finish,
  loadMore,
  init,
} = useProductPageDriver({
  fetchCategory: cateListGetApi,
  fetchProductList: productListByCateIdGetApi,
  // 点击三级分类时跳转到商品列表页
  onNavigateToThirdCategory: (thirdCategoryId: string) => {
    uni.navigateTo({
      url: `/pages/managerProduct/managerProduct?thirdCategoryId=${thirdCategoryId}`,
    })
  },
})

// 处理搜索
const handleSearch = () => {
  uni.navigateTo({
    url: '/pages/search/search',
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
    <!-- 二级分类 -->
    <SubCategory :list="level2List" @changePhone="selectLevel2"></SubCategory>
    <!-- 三级分类 -->
    <ThirdCategory :list="level3List" @selectedType="selectLevel3"></ThirdCategory>
    <!-- 商品列表（只有没有三级分类时显示） -->
    <view class="list" v-if="showProductList">
      <GlobalProductBar
        :models="'toB'"
        :list="productList"
        :finish="finish"
        @update:loadMore="loadMore"
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
