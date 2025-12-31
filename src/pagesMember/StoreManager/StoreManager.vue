<script setup lang="ts">
import { navList } from '@/pagesMember/StoreManager/config.ts'
import { useManagerStore } from '@/stores/modules/manager.ts'
import { onLoad } from '@dcloudio/uni-app'

// 门店名称（可以从store中获取）
const managerStore = useManagerStore()

// 处理导航跳转
const handleNavigation = (path: string) => {
  console.log(path)
  uni.navigateTo({
    url: path,
    fail: () => {
      uni.showToast({
        title: '页面开发中',
        icon: 'none',
      })
    },
  })
}

onLoad(() => managerStore.managerStoreGet())
</script>

<template>
  <view class="container">
    <!-- 顶部信息卡片 -->
    <view class="header-card">
      <view class="store-info">
        <text class="store-name">{{ managerStore.managerStoreInfo?.storeName }}</text>
        <text class="store-desc">门店管理中心</text>
      </view>
    </view>

    <!-- 功能导航网格 -->
    <view class="nav-grid">
      <view
        class="nav-item"
        v-for="item in navList"
        :key="item.id"
        @click="handleNavigation(item.path)"
      >
        <view class="nav-icon">{{ item.icon }}</view>
        <text class="nav-title">{{ item.title }}</text>
        <text class="nav-desc">{{ item.desc }}</text>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.container {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8f8f8 0%, #ffffff 100%);
  padding: 32rpx;
  box-sizing: border-box;
}

.header-card {
  background: linear-gradient(135deg, #d62731 0%, #ff4757 100%);
  border-radius: 20rpx;
  padding: 40rpx 32rpx;
  margin-bottom: 32rpx;
  box-shadow: 0 8rpx 24rpx rgba(214, 39, 49, 0.25);

  .store-info {
    display: flex;
    flex-direction: column;
    gap: 12rpx;

    .store-name {
      font-size: 40rpx;
      font-weight: 600;
      color: #ffffff;
      line-height: 1.2;
    }

    .store-desc {
      font-size: 28rpx;
      color: rgba(255, 255, 255, 0.85);
      line-height: 1.2;
    }
  }
}

.nav-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
}

.nav-item {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 40rpx 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4rpx;
    background: linear-gradient(90deg, #d62731 0%, #ff4757 100%);
    transform: scaleX(0);
    transition: transform 0.3s ease;
  }

  &:active {
    transform: scale(0.98);
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);

    &::before {
      transform: scaleX(1);
    }
  }

  .nav-icon {
    font-size: 64rpx;
    line-height: 1;
    margin-bottom: 8rpx;
  }

  .nav-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #333333;
    line-height: 1.2;
  }

  .nav-desc {
    font-size: 24rpx;
    color: #aaaaaa;
    line-height: 1.2;
  }
}
</style>
