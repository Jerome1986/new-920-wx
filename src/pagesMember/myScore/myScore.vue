<script setup lang="ts">
import { ref } from 'vue'
import { useMemberStore } from '@/stores'
import { onLoad } from '@dcloudio/uni-app'
import type { ScoreItem } from '@/types/ScoreDetails'
import { scoreListGetApi } from '@/api/scoreDetail.ts'
import { userInfoGetApi } from '@/api/user.ts'
import { formatTimestamp } from '@/utils/formatTimestamp.ts'

// 定义store
const userStore = useMemberStore()

// 获取安全区域
const { safeAreaInsets } = uni.getSystemInfoSync()

// 用户当前积分
const currentScore = ref(userStore.profile.score)
const userInfoGet = async () => {
  const userRes = await userInfoGetApi(userStore.profile.id)
  currentScore.value = userRes.data.score
}

onLoad(() => userInfoGet()) // 进页面重新拉取用户积分 即时更新积分

// tag列表
const tagList = ref([
  { id: 'tag1', text: 'ALL', label: '全部' },
  { id: 'tag2', text: 'INCOME', label: '收入' },
  { id: 'tag3', text: 'EXPENSE', label: '支出' },
])

// 当前激活的tag
const activeTag = ref('ALL')

// 积分明细列表
const scoreList = ref<ScoreItem[]>([])

// 切换tag
const handleTag = (tag: string) => {
  console.log(tag)

  activeTag.value = tag
  if (userStore.profile?.id) {
    finish.value = false
    loading.value = false
    params.value.pageNum = 1
    getScoreList(userStore.profile.id, tag)
  }
}

const params = ref({
  pageNum: 1,
  pageSize: 10,
})

// 获取积分明细列表
const finish = ref(false)
const loading = ref(false)
const getScoreList = async (userId: string, tag: string) => {
  if (finish.value || loading.value) return // 防抖+退出分页
  loading.value = true
  // 开始请求
  const res = await scoreListGetApi(userId, tag, params.value.pageNum, params.value.pageSize)
  console.log('积分', res)
  // 如果是首页，直接赋值，如果是>1页，那就是加载更多，直接追加数组
  if (params.value.pageNum === 1) {
    scoreList.value = res.data.list
  } else {
    scoreList.value.push(...res.data.list)
  }

  // 如果当前页小于总页数，就++ 代表翻页
  if (params.value.pageNum < res.data.totalPage) {
    console.log('小于', params.value.pageNum)
    params.value.pageNum++
  } else {
    finish.value = true
  }

  loading.value = false
}

// 触底加载更多
const handleScrolltolower = () => {
  getScoreList(userStore.profile.id, activeTag.value)
}

onLoad(() => {
  if (userStore.profile?.id) {
    getScoreList(userStore.profile.id, 'ALL')
  }
})
</script>

<template>
  <view class="score-page">
    <!-- 积分总览卡片 -->
    <view class="score-summary">
      <view class="summary-card">
        <view class="icon">🏆</view>
        <view class="info">
          <text class="label">当前积分</text>
          <text class="value">{{ currentScore.toFixed(2) }}</text>
        </view>
      </view>
    </view>

    <!-- 筛选标签 -->
    <view class="filter-bar">
      <view
        class="tag"
        :class="{ active: activeTag === item.text }"
        v-for="item in tagList"
        :key="item.id"
        @click="handleTag(item.text)"
      >
        {{ item.label }}
      </view>
    </view>

    <!-- 积分明细列表 -->
    <scroll-view
      v-if="scoreList.length > 0"
      class="score-list"
      :scroll-y="true"
      :style="{ paddingBottom: `calc(24rpx + ${safeAreaInsets?.bottom || 0}px)` }"
      @scrolltolower="handleScrolltolower"
    >
      <!-- 有数据 -->
      <view class="list-content" v-if="scoreList.length > 0">
        <view class="score-item" v-for="item in scoreList" :key="item._id">
          <view class="item-left">
            <view class="source">{{ item.source }}</view>
            <view class="time">{{ formatTimestamp(item.createdAt, 2) }}</view>
          </view>
          <view class="item-right">
            <view
              class="amount"
              :class="{ income: item.type === 'INCOME', expense: item.type === 'EXPENSE' }"
            >
              {{ item.type === 'INCOME' ? '+' : '-' }}{{ item.amount.toFixed(2) }}
            </view>
            <view class="balance">余额: {{ item.balance.toFixed(2) }}</view>
          </view>
        </view>
      </view>

      <!--   触底提示   -->
      <view class="tips" v-if="!finish">加载更多</view>
      <view class="tips" v-else>没有更多数据~</view>
    </scroll-view>
    <!-- 空状态 -->
    <view class="empty" v-else>
      <image class="empty-img" src="@/static/images/empty.png" mode="aspectFit"></image>
      <text class="empty-text">暂无积分记录</text>
    </view>
  </view>
</template>

<style scoped lang="scss">
.score-page {
  min-height: 100vh;
  background-color: $jel-pageBackGroundColor;
}

// 积分总览卡片
.score-summary {
  padding: 24rpx;
  background: linear-gradient(135deg, #ff6b6b 0%, $jel-brandColor 100%);

  .summary-card {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 16rpx;
    padding: 32rpx;
    display: flex;
    align-items: center;
    gap: 24rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);

    .icon {
      font-size: 64rpx;
      line-height: 1;
    }

    .info {
      display: flex;
      flex-direction: column;
      gap: 8rpx;

      .label {
        font-size: 28rpx;
        color: $jel-font-dec2;
      }

      .value {
        font-size: 48rpx;
        font-weight: bold;
        color: $jel-brandColor;
      }
    }
  }
}

// 筛选标签
.filter-bar {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 24rpx;
  background-color: #fff;
  margin-top: 16rpx;

  .tag {
    padding: 12rpx 32rpx;
    border-radius: 32rpx;
    font-size: 28rpx;
    color: $jel-font-dec2;
    background-color: $jel-pageBackGroundColor;
    transition: all 0.3s;

    &.active {
      color: #fff;
      background-color: $jel-brandColor;
    }
  }
}

// 积分明细列表
.score-list {
  height: calc(100vh - 320rpx);
  padding: 0 24rpx;

  .list-content {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
    margin-top: 16rpx;
  }

  .score-item {
    background-color: #fff;
    border-radius: 16rpx;
    padding: 24rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);

    .item-left {
      display: flex;
      flex-direction: column;
      gap: 12rpx;
      flex: 1;
      min-width: 0;

      .source {
        font-size: 30rpx;
        color: $jel-font-title;
        font-weight: 500;
      }

      .time {
        font-size: 24rpx;
        color: $jel-font-dec;
      }
    }

    .item-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 12rpx;
      flex-shrink: 0;

      .amount {
        font-size: 32rpx;
        font-weight: bold;

        &.income {
          color: $jel-brandColor;
        }

        &.expense {
          color: $jel-font-success;
        }
      }

      .balance {
        font-size: 24rpx;
        color: $jel-font-dec;
      }
    }
  }

  /* 加载见底提示 */
  .tips {
    margin-top: 24rpx;
    text-align: center;
    color: $jel-font-dec;
    font-size: 24rpx;
  }
}

// 空状态
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;

  .empty-img {
    width: 300rpx;
    height: 300rpx;
    margin-bottom: 24rpx;
  }

  .empty-text {
    font-size: 28rpx;
    color: $jel-font-dec;
  }
}
</style>
