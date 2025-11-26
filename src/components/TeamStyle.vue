<script setup lang="ts">
import NavTitle from '@/components/NavTitle.vue'
import { formatTimestamp } from '@/utils/formatTimestamp.ts'
import type { TeamItem } from '@/types/TeamItem'

defineProps({
  list: {
    type: Array as () => TeamItem[],
    default: () => [],
  },
})
</script>

<template>
  <NavTitle title="团队风采" :is-more="false"></NavTitle>
  <view class="item-list" v-for="item in list" :key="item._id">
    <image class="cover" :src="item.image" mode="aspectFill"></image>
    <view class="mask">
      <view class="name">{{ item.name }}</view>
      <view class="publicTime">{{ formatTimestamp(item.createdAt) }}</view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.item-list {
  position: relative;
  width: 100%;
  height: 340rpx;
  border-radius: 8rpx;
  margin-bottom: 16rpx;

  .cover {
    width: 100%;
    height: 100%;
    border-radius: 8rpx;
  }

  .mask {
    padding: 24rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    height: 70rpx;
    border-radius: 0 0 8rpx 8rpx;
    background: linear-gradient(180deg, rgba(180, 180, 180, 0.5) 0%, rgba(0, 0, 0, 0.5) 100%);
    font-size: 28rpx;
    color: #fff;

    .publicTime {
      font-size: 24rpx;
    }
  }
}
</style>
