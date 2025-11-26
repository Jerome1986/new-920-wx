<script setup lang="ts">
import { ref, onMounted } from 'vue'

// 导航栏高度
const navBarHeight = ref(0)
// 状态栏高度
const statusBarHeight = ref(0)

onMounted(() => {
  const systemInfo = uni.getSystemInfoSync()
  console.log(systemInfo)
  const menuButtonInfo = uni.getMenuButtonBoundingClientRect()
  const isAndroid = systemInfo.platform.toLowerCase() === 'android'

  statusBarHeight.value = systemInfo.statusBarHeight || 0

  if (isAndroid) {
    // Android 固定胶囊高度
    navBarHeight.value = statusBarHeight.value + 48
  } else {
    // iOS 精准计算
    navBarHeight.value =
      statusBarHeight.value +
      (menuButtonInfo.top - statusBarHeight.value) * 2 +
      menuButtonInfo.height
  }
})
</script>

<template>
  <view
    class="custom-nav"
    :style="{
      height: navBarHeight + 'px',
      paddingTop: statusBarHeight + 'px',
    }"
  >
    <view class="nav-content">
      <text class="title">920科技</text>
    </view>
  </view>
</template>

<style scoped lang="scss">
.custom-nav {
  width: 100%;
  background-color: $jel-brandColor;

  .nav-content {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24rpx;

    .title {
      color: #ffffff;
      font-family: 'YouSheBiaoTiHei', 'Microsoft YaHei', sans-serif;
      font-size: 40rpx;
    }
  }
}
</style>
