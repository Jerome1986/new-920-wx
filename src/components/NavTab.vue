<script setup lang="ts">
import type { CateItem } from '@/types/CateItem'
import { ref } from 'vue'

defineProps({
  list: {
    type: Array as () => CateItem[],
    required: true,
    default: () => [],
  },
})
const emits = defineEmits(['cateSelected'])
// 激活下标
const activeIndex = ref(0)
// 处理分类点击
const handelChange = (cateId: string, index: number) => {
  activeIndex.value = index
  emits('cateSelected', cateId)
}
</script>

<template>
  <view class="tab">
    <view class="left">
      <!--  符号  -->
      <view class="icon"></view>
      <view
        class="item"
        v-for="(item, index) in list"
        :key="item.id"
        @click="handelChange(item.id, index)"
      >
        <!--  文字  -->
        <view class="text" :class="{ activeText: activeIndex === index }">{{ item.name }}</view>
        <!--   浮标   -->
        <view class="float" v-if="activeIndex === index"></view>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.tab {
  margin-bottom: 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;

  /*左侧标题*/
  .left {
    position: relative;
    display: flex;
    align-items: center;
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

    .item {
      position: relative;
      margin-right: 32rpx;

      .text {
        margin-bottom: 8rpx;
        color: $jel-font-dec2;
        font-weight: bold;
      }

      .activeText {
        color: $jel-font-title;
        font-weight: bold;
      }

      .float {
        position: absolute;
        left: 50%;
        bottom: 0;
        transform: translateX(-50%);
        width: 20rpx;
        height: 4rpx;
        background-color: $jel-font-title;
      }
    }
  }
}
</style>
