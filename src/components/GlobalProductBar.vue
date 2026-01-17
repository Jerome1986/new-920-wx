<script setup lang="ts">
import type { ProductItem } from '@/types/ProductItem'
import { ref, watch } from 'vue'
import { autoLookNumApi } from '@/api/product.ts'

const props = defineProps<{
  models: 'toB' | 'toC'
  list: ProductItem[]
  finish: boolean
}>()

// 左右两列数据
const leftList = ref<ProductItem[]>([])
const rightList = ref<ProductItem[]>([])

// 分配数据到左右两列的函数
const distributeItems = (items: ProductItem[]) => {
  items.forEach((item) => {
    if (leftList.value.length <= rightList.value.length) {
      leftList.value.push(item)
    } else {
      rightList.value.push(item)
    }
  })
}

// 监听列表变化，分配数据到左右两列
watch(
  () => props.list,
  (newList) => {
    const currentTotal = leftList.value.length + rightList.value.length

    // 场景1: 新列表为空，清空显示
    if (newList.length === 0) {
      leftList.value = []
      rightList.value = []
      return
    }

    // 场景2: 列表被重置（新列表长度小于当前显示的总数）
    if (newList.length < currentTotal) {
      leftList.value = []
      rightList.value = []
      distributeItems(newList)
      return
    }

    // 场景3: 首次加载或重新加载（当前为空但新列表有数据）
    if (currentTotal === 0 && newList.length > 0) {
      leftList.value = []
      rightList.value = []
      distributeItems(newList)
      return
    }

    // 场景4: 增量追加（新列表长度大于当前总数）
    if (newList.length > currentTotal) {
      const newItems = newList.slice(currentTotal)
      distributeItems(newItems)
      return
    }
  },
  { deep: true, immediate: true },
)

const emits = defineEmits(['update:lookNum', 'update:loadMore'])
// 点击跳转详情
const handleItemDetail = async (productId: string) => {
  const updateLook = await autoLookNumApi(productId)
  if (props.models === 'toC') {
    await uni.navigateTo({
      url: `/pages/productDetail/productDetailToc?productId=${productId}`,
    })
  } else if (props.models === 'toB') {
    await uni.navigateTo({
      url: `/pages/productDetail/productDetailTob?productId=${productId}`,
    })
  }

  emits('update:lookNum', updateLook.data.lookNum, productId)
}

// 触底操作
const handleScrollToLower = () => {
  // 触发父组件加载更多
  emits('update:loadMore')
}
</script>

<template>
  <scroll-view
    :enhanced="true"
    :show-scrollbar="false"
    :scroll-y="true"
    class="scroll-container"
    @scrolltolower="handleScrollToLower"
  >
    <view class="product-list">
      <!-- 左列 -->
      <view class="column">
        <view
          class="item"
          v-for="item in leftList"
          :key="item._id"
          @click="handleItemDetail(item._id!)"
        >
          <image class="cover" :src="item.cover" mode="widthFix"></image>
          <view class="title">{{ item.skuNo }} {{ item.name }}</view>
          <view class="desc">{{ item.dec }}</view>
          <view class="footer">
            <view class="price">{{ ((item.minPrice ?? 0) / 100).toFixed(2) }}</view>
            <view class="views">
              <text class="iconfont icon-zongliulanliang"></text>
              <text>{{ 'lookView' in item ? item.lookView : item.lookNum }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 右列 -->
      <view class="column">
        <view
          class="item"
          v-for="item in rightList"
          :key="item._id"
          @click="handleItemDetail(item._id!)"
        >
          <image class="cover" :src="item.cover" mode="widthFix"></image>
          <view class="title">{{ item.skuNo }} {{ item.name }}</view>
          <view class="desc">{{ item.dec }}</view>
          <view class="footer">
            <view class="price">{{ ((item.minPrice ?? 0) / 100).toFixed(2) }}</view>
            <view class="views">
              <text class="iconfont icon-zongliulanliang"></text>
              <text>{{ 'lookView' in item ? item.lookView : item.lookNum }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>
    <!--   触底提示   -->
    <view class="tips" v-if="!finish">加载更多</view>
    <view class="tips" v-else>没有更多数据~</view>
  </scroll-view>
</template>

<style scoped lang="scss">
/* 滚动容器 - 设置基础高度和盒模型 */
.scroll-container {
  height: 100%; // 占满父容器高度
  box-sizing: border-box; // 边框和内边距计入总高度
}

/* 商品列表 - 两列布局容器 */
.product-list {
  display: flex; // 开启弹性布局，使子元素水平排列
  gap: 16rpx; // 列间距

  /* 单列容器 - 左右两列的基础样式 */
  .column {
    flex: 1; // 均分容器宽度
    display: flex; // 开启弹性布局
    flex-direction: column; // 列内元素垂直排列
    gap: 16rpx; // 商品项之间的间距
  }

  /* 商品项 - 单个商品卡片样式 */
  .item {
    width: 347rpx; // 占满列宽
    background-color: #fff; // 白色背景
    border-radius: 8rpx; // 圆角边框
    overflow: hidden; // 超出部分隐藏
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05); // 轻微阴影效果

    /* 商品封面图 */
    .cover {
      width: 100%; // 图片宽度占满容器
      display: block; // 块级元素，避免图片下方空隙
      border-radius: 8rpx 8rpx 0 0; // 上方圆角
    }

    /* 商品标题 */
    .title {
      padding: 16rpx 16rpx 0;
      font-size: 28rpx; // 标题字号
      font-weight: 600; // 加粗
      color: $jel-font-title; // 标题颜色
      @include ellipsis(2); // 超出两行显示省略号
    }

    /* 商品描述 */
    .desc {
      padding: 0 16rpx; // 左右内边距
      font-size: 24rpx; // 描述文字大小
      color: $jel-font-dec2; // 描述文字颜色
      @include ellipsis(1); // 超出一行显示省略号
    }

    /* 底部信息栏 */
    .footer {
      padding: 16rpx;
      display: flex;
      justify-content: space-between;
      align-items: center;

      /* 价格 */
      .price {
        font-weight: bold;
        color: $jel-brandColor;
        line-height: 1;

        &::before {
          content: '￥';
          font-size: 28rpx;
        }
      }

      /* 浏览量 */
      .views {
        display: flex;
        align-items: flex-end;
        gap: 4rpx;
        font-size: 24rpx;
        color: $jel-font-dec;

        .iconfont {
          font-size: 28rpx;
          line-height: 1;
        }

        text {
          line-height: 1;
        }
      }
    }
  }
}
/* 加载见底提示 */
.tips {
  margin-top: 24rpx;
  text-align: center;
  color: $jel-font-dec;
  font-size: 24rpx;
}
</style>
