<script setup lang="ts">
import CustomNav from '@/pages/home/components/CustomNav.vue'
import { ref } from 'vue'
import { productsListGetApi } from '@/api/product.ts'
import type { ProductItem } from '@/types/ProductItem.d.ts'
import StockInProduct from '@/components/StockInProduct.vue'
import { bannerListGetApi } from '@/api/banner.ts'
import { onLoad } from '@dcloudio/uni-app'
import { useMemberStore, useRateStore } from '@/stores'
import TeamStyle from '@/components/TeamStyle.vue'
import type { TeamItem } from '@/types/TeamItem'
import { teamListGetApi } from '@/api/team.ts'

// 定义 store
const userStore = useMemberStore()
const rateStore = useRateStore()

// 轮播图数据
const swiperData = ref<string[]>([])
const bannerListGet = async () => {
  const res = await bannerListGetApi()
  swiperData.value = res.data.map((u) => u.url)
}

// 手机膜
const stockProductList = ref<ProductItem[]>([])
const stockProductListGet = async () => {
  const res = await productsListGetApi('手机膜')
  stockProductList.value = res.data.slice(0, 4)
}

// 手机壳
const userProductList = ref<ProductItem[]>([])
const userProductListGet = async () => {
  const res = await productsListGetApi('手机壳')
  userProductList.value = res.data.slice(0, 4)
}

// 团队风采
const teamList = ref<TeamItem[]>([])
const teamListGet = async () => {
  const res = await teamListGetApi()
  teamList.value = res.data
}

/**
 * 处理阅读量的更新
 * @description 接受子组件的列表项点击事件，并获取更新当前项阅读量的参数，同步更新父组件的阅读量
 * @param newLook - 更新后从服务端返回的阅读量
 * @param productId - 点击当前项的id
 */
const handleNewLook = (newLook: number, productId: string) => {
  console.log('更新后的阅读量', newLook, productId)
  const item = stockProductList.value.find((p) => p._id === productId)
  if (item) item.lookNum = newLook
}

onLoad(
  async () =>
    await Promise.all([
      bannerListGet(), // 轮播图
      stockProductListGet(), // 手机膜
      userProductListGet(), // 手机壳
      teamListGet(), // 团队风采
      rateStore.rateRuleGet(), // 积分规则
    ]),
)
</script>

<template>
  <view class="home">
    <!-- 自定义头部  -->
    <CustomNav></CustomNav>
    <!--  滚动区域  -->
    <scroll-view class="scrollView" :scroll-y="true" :enhanced="true" :show-scrollbar="false">
      <!--  轮播图  -->
      <tn-swiper
        :data="swiperData"
        width="100%"
        height="380"
        indicator
        indicator-type="dot"
        :loop="true"
        autoplay
      >
        <template #default="{ data }">
          <image class="image" :src="data" mode="widthFix" />
        </template>
      </tn-swiper>
      <!--  产品展示  -->
      <view class="content">
        <StockInProduct
          :list="stockProductList"
          title="进货入口"
          v-if="userStore.profile?.role === 'manager'"
          @update:look-num="handleNewLook"
        ></StockInProduct>
        <StockInProduct :list="userProductList" title="热门商品"></StockInProduct>
        <!--  团队风采   -->
        <TeamStyle :list="teamList"></TeamStyle>
      </view>
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.home {
  padding-bottom: 160rpx;
  height: 100%;
  /* 滚动区域 */
  .scrollView {
    flex: 1;
    overflow: hidden;

    .content {
      margin-top: 20rpx;
      padding: 16rpx;
    }
  }
}
</style>
