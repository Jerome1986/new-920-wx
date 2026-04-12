<script setup lang="ts">
import { computed } from 'vue'
import type { ProductItem } from '@/types/ProductItem'
import NavTitle from '@/components/NavTitle.vue'
import { autoLookNumApi } from '@/api/product.ts'

// 接收父组件传入的商品列表
const props = defineProps({
  list: {
    type: Array as () => ProductItem[],
    default: () => [],
  },
  title: {
    type: String,
    default: '',
  },
})

// 使用计算属性处理瀑布流
const leftList = computed(() => {
  return props.list.filter((_, index) => index % 2 === 0)
})

const rightList = computed(() => {
  return props.list.filter((_, index) => index % 2 === 1)
})

const emits = defineEmits(['update:lookNum'])
// 处理点击跳转
const handleItem = async (productId: string) => {
  const updateLook = await autoLookNumApi(productId)
  await uni.navigateTo({
    url: `/pages/productDetail/productDetailToc?productId=${productId}`,
  })
  emits('update:lookNum', updateLook.data.lookNum, productId)
}
</script>

<template>
  <!--   title   -->
  <NavTitle :title="title"></NavTitle>
  <!-- 列表 -->
  <view class="preview">
    <!-- 左列 -->
    <view class="column">
      <view class="item" v-for="item in leftList" :key="item.id" @click="handleItem(item.id!)">
        <image class="coverImg" :src="item.cover" mode="widthFix"></image>
      </view>
    </view>

    <!-- 右列 -->
    <view class="column">
      <view class="item" v-for="item in rightList" :key="item.id" @click="handleItem(item.id!)">
        <image class="coverImg" :src="item.cover" mode="widthFix"></image>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.preview {
  display: flex;
  justify-content: space-between;
  margin-bottom: 24rpx;

  .column {
    width: calc(50% - 8rpx);

    .item {
      margin-bottom: 16rpx;

      .coverImg {
        width: 100%;
        display: block;
        border-radius: 16rpx;
      }
    }
  }
}
</style>
