<script setup lang="ts">
import { ref } from 'vue'
import { navList } from '@/pagesMember/StoreManager/config.ts'
import { useManagerStore } from '@/stores/modules/manager.ts'
import { useMemberStore } from '@/stores/modules/member.ts'
import { onLoad } from '@dcloudio/uni-app'

// 门店名称（可以从store中获取）
const managerStore = useManagerStore()
const userStore = useMemberStore()

const primaryRestrictedPaths = new Set([
  '/pagesMember/myIncome/myIncome',
  '/pagesMember/storeReport/storeReport',
  '/pagesMember/storeWallet/storeWallet',
  '/pagesMember/storeMembers/storeMembers',
])

// App.vue 中 page 为 overflow:hidden，需用 scroll-view + 固定高度才能滚动
const scrollHeight = ref(0)
const initScrollHeight = () => {
  scrollHeight.value = uni.getSystemInfoSync().windowHeight
}
initScrollHeight()

// 处理导航跳转
const handleNavigation = (path: string) => {
  const url = path.startsWith('/') ? path : `/${path}`
  if (userStore.profile.role === 'MANAGER_PRIMARY' && primaryRestrictedPaths.has(url)) {
    uni.showToast({
      title: '请升级店长权限后再试',
      icon: 'none',
    })
    return
  }

  uni.navigateTo({
    url,
    success: () => {
      console.log('navigateTo', url)
    },
    fail: (err) => {
      console.error('navigateTo fail', url, err)
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
  <scroll-view
    class="page-scroll"
    :scroll-y="true"
    :enhanced="true"
    :show-scrollbar="false"
    :style="{ height: scrollHeight + 'px' }"
  >
    <view class="container" :style="{ minHeight: scrollHeight + 'px' }">
      <!-- 顶部信息卡片 -->
      <view class="header-card">
        <view class="store-info">
          <text class="store-name">{{ managerStore.managerStoreInfo?.name }}</text>
          <text class="store-desc">门店管理中心</text>
        </view>
      </view>

      <!-- 功能导航网格 -->
      <view class="nav-grid">
        <view
          class="nav-item"
          v-for="item in navList"
          :key="item.id"
          @click.stop="handleNavigation(item.path)"
        >
          <view class="nav-icon">{{ item.icon }}</view>
          <text class="nav-title">{{ item.title }}</text>
          <text class="nav-desc">{{ item.desc }}</text>
        </view>
      </view>
    </view>
  </scroll-view>
</template>

<style scoped lang="scss">
.page-scroll {
  width: 100%;
  box-sizing: border-box;
}

.container {
  background: linear-gradient(180deg, #f8f8f8 0%, #ffffff 100%);
  padding: 32rpx;
  padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
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
