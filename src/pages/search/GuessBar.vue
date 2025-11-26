<script setup lang="ts">
import { ref } from 'vue'
import type { GuessItem } from '@/types/GuessItem'
import { guessListGetApi } from '@/api/guess.ts'
import { onLoad } from '@dcloudio/uni-app'

// 猜你想搜列表
const guessList = ref<GuessItem[]>([])
const guessListGet = async () => {
  const res = await guessListGetApi()
  console.log('猜你想搜', res)
  guessList.value = res.data
}

// 点击猜你想搜
const emits = defineEmits(['selectGuess'])
const handleGuess = (guessName: string) => {
  emits('selectGuess', guessName)
}

onLoad(() => guessListGet())
</script>

<template>
  <view class="guess">
    <view class="head">猜你想搜</view>
    <view class="guessList">
      <view
        class="item"
        v-for="item in guessList"
        :key="item._id"
        @click="handleGuess(item.name)"
        >{{ item.name }}</view
      >
    </view>
  </view>
</template>

<style scoped lang="scss">
.guess {
  margin-bottom: 24rpx;
  .head {
    margin-bottom: 24rpx;
    font-size: 28rpx;
    color: $jel-font-title;
    font-weight: 800;
  }
  .guessList {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 24rpx;
    .item {
      width: 48%;
      font-size: 28rpx;
      color: $jel-font-dec2;
    }
  }
}
</style>
