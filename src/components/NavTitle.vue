<script setup lang="ts">
const props = defineProps({
  title: {
    type: String,
    required: true,
    default: '标题',
  },
  isMore: {
    type: Boolean,
    default: true,
  },
})

// 处理点击更多
const handleMore = () => {
  console.log('handleMore', props.title)
  switch (props.title) {
    case '进货入口':
      uni.switchTab({
        url: '/pages/shop/shop',
      })
      break
    case '热门商品':
      uni.switchTab({
        url: '/pages/shop/shop',
      })
      break
    case '团队风采':
      console.log('跳转团队活动')
      break
  }
}
</script>

<template>
  <view class="title">
    <view class="left">
      <!--  符号  -->
      <view class="icon"></view>
      <!--  文字  -->
      <view class="text">{{ title }}</view>
    </view>
    <view class="right" v-if="isMore" @click="handleMore">
      <text>更多</text>
      <text style="font-size: 20rpx; margin-left: 8rpx" class="iconfont icon-bianzu"></text>
    </view>
  </view>
</template>

<style scoped lang="scss">
.title {
  margin-bottom: 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;

  /*左侧标题*/
  .left {
    display: flex;
    align-items: center;
    position: relative;
    padding: 6rpx 24rpx;

    .icon {
      position: absolute;
      left: 0;
      top: 0;
      width: 56rpx;
      height: 56rpx;
      border-radius: 50%;
      opacity: 0.4;
      background: linear-gradient(
        122.18deg,
        rgba(255, 123, 130, 1) 0%,
        rgba(255, 255, 255, 0) 100%
      );
    }

    .text {
      color: $jel-font-title;
      font-weight: bold;
    }
  }

  /*查看更多*/
  .right {
    font-size: 24rpx;
    color: $jel-font-dec2;
  }
}
</style>
