<script setup lang="ts">
import { useMemberStore } from '@/stores'
import { configData, managerHandleClickGird, userHandleClickGird } from '@/pages/my/config.ts'

// 定义store
const userStore = useMemberStore()

// 处理功能区域
const handleGrid = (val: string) => {
  console.log('功能', val)
  // 检查用户是否登录
  if (!userStore.profile._id)
    return uni.showToast({ icon: 'none', title: '登录后可查看', mask: true })

  // 如果是用户操作，就使用用户的点击功能函数
  if (userStore.profile.role === 'vip' || userStore.profile.role === 'user') {
    userHandleClickGird(val)
  }

  // 如果是店长，就是用店长对应的点击功能函数
  if (userStore.profile.role === 'manager') {
    managerHandleClickGird(val)
  }
}
</script>

<template>
  <view class="nav-grid">
    <view
      class="navItem"
      v-for="(item, index) in configData()"
      :key="index"
      @click="handleGrid(item.name)"
    >
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
