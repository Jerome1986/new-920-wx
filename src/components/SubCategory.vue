<script setup lang="ts">
import { ref } from 'vue'
import type { CateItem } from '@/types/CateItem'

const props = defineProps({
  list: {
    type: Array as () => CateItem[],
    required: true,
    default: () => [],
  },
})

const activeIndex = ref(0)
const emits = defineEmits(['changePhone'])
const handleSelect = (phoneId: number, index: number) => {
  activeIndex.value = index
  emits('changePhone', phoneId)
}

// 重置高亮
const resetActive = () => {
  activeIndex.value = 0
}

defineExpose({
  resetActive,
})
</script>

<template>
  <view class="category-bar">
    <scroll-view :scroll-x="true" :enhanced="true" :show-scrollbar="false" class="scroll-wrapper">
      <view class="scroll-content">
        <view
          v-for="(item, index) in list"
          :key="item.id"
          class="category-item"
          :class="{ active: index === activeIndex }"
          @click="handleSelect(item.id, index)"
        >
          {{ item.name }}
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<style scoped lang="scss">
.category-bar {
  height: fit-content;
  margin-bottom: 24rpx;
}

.scroll-wrapper {
  white-space: nowrap;
  /* 关键 */
}

.scroll-content {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.category-item {
  padding: 8rpx 24rpx;
  font-size: 24rpx;
  color: $jel-font-dec2;
  background-color: #ffffff;
  border-radius: 4rpx;
}

.category-item.active {
  border: 1px solid $jel-brandColor;
  background-color: #ffebec;
  color: $jel-brandColor;
  box-sizing: border-box;
  border-radius: 4rpx;
}
</style>
