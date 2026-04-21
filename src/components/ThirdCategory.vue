<script setup lang="ts">
import type { CateItem } from '@/types/CateItem'

const props = defineProps({
  list: {
    type: Array as () => CateItem[],
    default: () => [],
  },
})

const emits = defineEmits(['selectedType'])

// 点击选择手机型号
const handleType = (typeId: number) => {
  emits('selectedType', typeId)
}
</script>

<template>
  <view class="TypeList">
    <view class="item" v-for="item in list" :key="item.id" @click="handleType(item.id)">
      <view class="cover">
        <image class="coverImg" src="/static/images/phone.png" mode="aspectFill"></image>
      </view>
      <view class="name">{{ item.name }}</view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.TypeList {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;

  .item {
    padding: 16rpx;
    display: flex;
    align-items: center;
    gap: 16rpx;
    width: 342rpx;
    background-color: #ffffff;
    border-radius: 8rpx;

    .cover {
      padding: 10rpx 0;
      text-align: center;
      width: 116rpx;
      height: 116rpx;
      border: 1px solid #f1f1f1;
      border-radius: 8rpx;

      .coverImg {
        width: 74rpx;
        border-radius: 8rpx;
      }
    }

    .name {
      @include ellipsis(2);
      flex: 1;
      min-width: 0; // 关键：允许flex item缩小
      font-size: 28rpx;
      color: $jel-font-title;

      white-space: normal; // 允许正常换行
      word-break: break-all; // 长单词/长串字母也能断开
    }
  }
}
</style>
