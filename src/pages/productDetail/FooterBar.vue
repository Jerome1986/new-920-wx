<script setup lang="ts">
//获取安全距离

import { useCartStore } from '@/stores'

const { safeAreaInsets } = uni.getSystemInfoSync()

// 定义store
const cartStore = useCartStore()

const emits = defineEmits(['addCart', 'nowAdd'])

// 加入库存
const addCart = () => {
  console.log('子组件addCart')
  emits('addCart')
}

// 立即添加
const buyNow = () => {
  console.log('buyNow')
  emits('nowAdd')
}
</script>

<template>
  <!-- 用户操作 -->
  <view class="toolbar" :style="{ paddingBottom: safeAreaInsets?.bottom + 'px' }">
    <view class="icons">
      <button class="icons-button" open-type="contact">
        <text style="font-size: 40rpx" class="iconfont icon-kefu"></text>
        <text class="label">客服</text>
      </button>
      <navigator class="icons-button" url="/pages/cart/cart" open-type="switchTab">
        <text style="font-size: 40rpx" class="iconfont icon-a-ziyuan1"></text>
        <!-- 当前购物车数量 -->
        <text class="cratNum" v-if="cartStore.totalQuantity">
          {{ cartStore.totalQuantity ?? 0 }}
        </text>
        <text class="label">购物车</text>
      </navigator>
    </view>
    <view class="buttons">
      <view class="addcart" @tap="addCart">加入购物车</view>
      <view class="buynow" @tap="buyNow">立即添加</view>
    </view>
  </view>
</template>

<style scoped lang="scss">
/* 底部工具栏 */
.toolbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
  height: 170rpx;
  background-color: #fff;
  display: flex;
  justify-content: space-between;
  align-items: start;
  box-sizing: border-box;
  border-top: 1px solid $jel-border;
  /** 左侧按钮 */
  .icons {
    display: flex;
    align-items: center;
    height: 100rpx;

    /** 左侧功能按钮 */
    .icons-button {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8rpx;
      background-color: rgba(0, 0, 0, 0);
      font-size: 28rpx;
      width: 160rpx;
      height: 100%;
      border-radius: 8rpx;
      margin-right: 8rpx;
      padding: 0;
      box-sizing: border-box;

      /** 购物车右上角角标 */
      .cratNum {
        position: absolute;
        left: 50rpx;
        top: 10rpx;
        width: 30rpx;
        height: 30rpx;
        line-height: 30rpx;
        text-align: center;
        border-radius: 50%;
        font-size: 24rpx;
        background-color: $jel-brandColor;
        color: #fff;
      }
    }
  }

  /** 右侧加入库存 */
  .buttons {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16rpx;
    height: 100rpx;
    font-size: 28rpx;

    .addcart {
      padding: 18rpx 40rpx;
      background-color: #1a2251;
      color: #fff;
      border-radius: 38rpx;
    }

    .buynow {
      padding: 18rpx 40rpx;
      background-color: $jel-brandColor;
      color: #fff;
      border-radius: 38rpx;
    }
  }
}
</style>
