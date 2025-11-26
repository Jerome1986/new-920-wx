<script lang="ts" setup>
import { ref } from 'vue'
import { useHistoryStore } from '@/stores'

// 定义store
const historyStore = useHistoryStore()

// 搜索
const searchValue = ref('')
const setSearchValue = (value: string) => {
  searchValue.value = value
}
// 提供设置搜索值的方法
defineExpose({
  setSearchValue,
})
// 清除按钮
const clearBtn = ref(false)

const emits = defineEmits(['search', 'historySearch', 'clear'])
// 点击搜索按钮
const handleSearch = () => {
  console.log(searchValue.value)
  historyStore.setHistoryList(searchValue.value)
  emits('search', searchValue.value)
}

// 点击历史搜索
const handleHistory = (item: string) => {
  searchValue.value = item
  emits('historySearch', searchValue.value)
}

// 输入框改变事件
const handleIpt = () => {
  clearBtn.value = !!searchValue.value
}

// 聚焦
const handleFocus = () => {
  searchValue.value ? (clearBtn.value = true) : (clearBtn.value = false)
}

// 处理清除
const handleClear = () => {
  console.log('清空')
  searchValue.value = ''
  clearBtn.value = false
  emits('clear')
}

// 清除全部历史记录
const handleClearAll = () => {
  historyStore.clearHistory()
}
</script>

<template>
  <!-- 搜索 -->
  <view class="search" style="margin-bottom: 24rpx">
    <view class="searchInput">
      <view class="left">
        <text class="iconfont icon-sousuo" style="color: #cccccc; margin-right: 8rpx"></text>
        <input
          @input="handleIpt"
          @focus="handleFocus"
          type="text"
          placeholder="请根据货号或商品名称搜索"
          v-model="searchValue"
        />
      </view>
      <view class="right" v-if="clearBtn" @click="handleClear">
        <text style="color: #aaaaaa" class="iconfont icon-a-1-Clear"></text>
      </view>
    </view>

    <view class="searchBtn" @click="handleSearch">搜索</view>
  </view>
  <!-- 历史搜索列表 -->
  <view class="searchHistory" v-if="historyStore.historyList.length > 0">
    <!-- title -->
    <view class="title">
      <text>历史搜索</text>
      <text class="iconfont icon-shanchu" style="color: #aaaaaa" @click="handleClearAll"></text>
    </view>
    <view class="list">
      <view
        class="item"
        v-for="item in historyStore.historyList"
        :key="item"
        @click="handleHistory(item)"
      >
        {{ item }}
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
/* 搜索区域 */
.search {
  display: flex;
  justify-content: space-between;
  align-items: center;

  /* 搜索框 */
  .searchInput {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex: 1;
    height: 64rpx;
    background-color: #fff;
    border-radius: 8rpx;
    margin-right: 24rpx;
    padding: 0 24rpx;

    .left {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;

      input {
        width: 100%;
        height: 100%;
        border: none;
        outline: none;
        font-size: 28rpx;

        &::placeholder {
          color: #ccc;
        }
      }
    }

    .right {
      padding: 8rpx;
    }
  }

  /* 按钮 */
  .searchBtn {
    text-align: center;
    width: 84rpx;
    height: 64rpx;
    line-height: 64rpx;
    font-size: 24rpx;
    background-color: $jel-brandColor;
    color: #fff;
    border-radius: 8rpx;
  }
}

/* 搜索历史 */
.searchHistory {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  padding: 24rpx;
  font-size: 28rpx;
  color: $jel-font-dec2;

  .title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 28rpx;
    font-weight: bold;
    color: $jel-font-dec;
  }

  .list {
    display: flex;
    flex-wrap: wrap;
    gap: 24rpx;

    .item {
      padding: 4rpx 16rpx;
      width: fit-content;
      border: 1px solid $jel-font-dec;
      border-radius: 8rpx;
    }
  }
}
</style>
