<script setup lang="ts">
import CustomNav from '@/pages/home/components/CustomNav.vue'
import { ref } from 'vue'
import { productsHotGetApi } from '@/api/product'
import type { ProductItem } from '@/types/ProductItem.d.ts'
import { bannerListGetApi } from '@/api/banner'
import { onLoad } from '@dcloudio/uni-app'
import { useRateStore } from '@/stores'
import TeamStyle from '@/components/TeamStyle.vue'
import type { TeamItem } from '@/types/TeamItem'
import { teamListGetApi } from '@/api/team'
import NavTitle from '@/components/NavTitle.vue'

// 定义 store
const rateStore = useRateStore()

// 轮播图数据
const swiperData = ref<string[]>([])
const bannerListGet = async () => {
  const res = await bannerListGetApi()
  swiperData.value = res.data.map((u) => u.url)
}

// 热门商品
const userProductList = ref<ProductItem[]>([])
const userProductListGet = async () => {
  const res = await productsHotGetApi(1, 4)
  userProductList.value = res.data.list
}

// 团队风采
const teamList = ref<TeamItem[]>([])
const teamListGet = async () => {
  const res = await teamListGetApi()
  teamList.value = res.data
}

// 跳转详情
const handleDetail = (productId: number) => {
  console.log(productId)

  uni.navigateTo({ url: `/pages/productDetail/productDetailToc?productId=${productId}` })
}

onLoad(
  async () =>
    await Promise.all([
      bannerListGet(), // 轮播图
      userProductListGet(), // 热门商品
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
        <NavTitle title="热门商品"></NavTitle>
        <!--   title   -->
        <view class="productList">
          <view
            class="item"
            v-for="item in userProductList"
            :key="item.id"
            @tap="handleDetail(item.id)"
          >
            <image class="coverImg" :src="item.cover" mode="widthFix"></image>
          </view>
        </view>
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

      .productList {
        margin-bottom: 20rpx;
        display: grid;
        grid-template-columns: repeat(2, 1fr); // 一行2个
        gap: 16rpx; // 间距（推荐用这个，不要再 margin 了）

        .item {
          .coverImg {
            width: 100%;
            display: block;
            border-radius: 16rpx;
          }
        }
      }
    }
  }
}
</style>
