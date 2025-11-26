<script setup lang="ts">
import { useMemberStore } from '@/stores'

// 定义store
const userStore = useMemberStore()

const data = [
  { icon: 'icon-shouyi1', name: '我的收益' },
  { icon: 'icon-shenqing1', name: '我的订单' },
  { icon: 'icon-tuijian1', name: '我的推荐' },
  { icon: 'icon-huiyuan', name: '会员权益' },
]

// 处理功能区域
const handleGrid = (val: string) => {
  // 检查用户是否登录
  if (!userStore.profile._id)
    return uni.showToast({ icon: 'none', title: '登录后可查看', mask: true })

  // 点击功能
  switch (val) {
    case '我的订单':
      console.log('我的收益')
      break
    case '我的申请':
      console.log('我的订单')
      break
    case '我的推荐':
      console.log('我的推荐')
      break
    case '会员权益':
      console.log('会员权益')
      break
  }
}
</script>

<template>
  <view class="nav-grid">
    <view class="navItem" v-for="(item, index) in data" :key="index" @click="handleGrid(item.name)">
      <view class="navItem-link">
        <text style="color: #d62731; font-size: 40rpx" class="iconfont" :class="item.icon"></text>
      </view>
      <view class="name">{{ item.name }}</view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.nav-grid {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx 48rpx;
  margin-top: 24rpx;
  height: 190rpx;
  background-color: #ffffff;
  border-radius: 8rpx;

  .navItem {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12rpx;

    .navItem-link {
      width: 80rpx;
      height: 80rpx;
      line-height: 80rpx;
      text-align: center;
      border-radius: 50%;
      background-color: #fceeef;
    }

    .name {
      font-size: 24rpx;
      color: $jel-font-title;
    }
  }
}
</style>
