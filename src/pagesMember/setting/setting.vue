<script setup lang="ts">
// 定义store

import { useMemberStore } from '@/stores'

const userStore = useMemberStore()

// 处理点击
const handleClick = (val: string) => {
  switch (val) {
    case 'profile':
      console.log('个人资料')
      uni.navigateTo({
        url: '/pagesMember/profile/profile',
      })
      break
    case 'share':
      console.log('分享')
      break
    case 'admin':
      console.log('后台管理')
      break
  }
}

// 退出登录
const onLogout = () => {
  uni.showModal({
    title: '提示',
    content: '确定退出登录吗？',
    confirmColor: '#d62731',
    success: (result) => {
      if (result.confirm) {
        userStore.clearProfile()
        uni.showToast({
          icon: 'success',
          title: '退出成功',
        })
        setTimeout(() => {
          uni.navigateBack()
        }, 800)
      }
    },
  })
}
</script>

<template>
  <view class="viewport">
    <!-- 列表2 -->
    <view class="list">
      <button hover-class="none" class="item" @click="handleClick('profile')">修改个人资料</button>
    </view>
    <!-- 操作按钮 -->
    <view class="action">
      <view class="button" @tap="onLogout">退出登录</view>
    </view>
  </view>
</template>

<style lang="scss">
.viewport {
  padding: 24rpx;
}

/* 列表 */
.list {
  .item {
    margin-bottom: 24rpx;
    height: 90rpx;
    line-height: 90rpx;
    font-size: 28rpx;
    color: $jel-font-title;
    text-align: left;
    border-radius: 8rpx;
    background-color: #fff;
  }
}

/* 操作按钮 */
.action {
  text-align: center;
  line-height: 90rpx;
  height: 90rpx;
  margin-top: 40rpx;
  font-size: 32rpx;
  color: #333;

  .button {
    background-color: #fff;
    margin-bottom: 20rpx;
    border-radius: 10rpx;
  }
}
</style>
