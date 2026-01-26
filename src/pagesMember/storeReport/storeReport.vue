<script setup lang="ts">
import { ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { formatAmount, formatMonth } from '@/utils/formatTimestamp.ts'
import { getTimeRangeReportApi, storeTotalReportApi } from '@/api/store.ts'
import { useManagerStore } from '@/stores'
import type { StoreTotalReport } from '@/types/ManagerStore'

// 获取安全区域
const { safeAreaInsets } = uni.getSystemInfoSync()

// store
const managerStore = useManagerStore()

// 统计卡片数据
const statCards = ref<StoreTotalReport>()

// 时间筛选
const timeActive = ref('today')
const timeFilters = ref([
  { id: 'today', label: '今日', active: true },
  { id: 'week', label: '本周', active: false },
  { id: 'month', label: '本月', active: false },
])

// 月份选择
const selectedMonth = ref('')

// 财务流水数据
const financeFlowData = ref<StoreTotalReport>()
const financeFlowDataGet = async () => {
  if (managerStore.managerStoreInfo?.storeId) {
    const res = await storeTotalReportApi(managerStore.managerStoreInfo?.storeId)
    console.log(res.data)
    financeFlowData.value = res.data
  }
}

onLoad(() => financeFlowDataGet())

// 根据时间筛选数据
const getTimeRangeReportGet = async (type: string) => {
  if (managerStore.managerStoreInfo?.storeId) {
    const res = await getTimeRangeReportApi(managerStore.managerStoreInfo?.storeId, type)
    statCards.value = res.data
  }
}
onShow(() => getTimeRangeReportGet(timeActive.value))

// 切换时间筛选
const handleTimeFilter = async (filterId: string) => {
  timeActive.value = filterId
  selectedMonth.value = ''
  console.log('切换时间筛选:', filterId)
  // 根据筛选条件重新获取数据
  await getTimeRangeReportGet(filterId)
}

// 处理月份选择
const handleMonthChange = async (e: any) => {
  selectedMonth.value = e.detail.value
  console.log('选择的月份:', selectedMonth.value)
  //  根据选择的月份重新获取数据
  if (managerStore.managerStoreInfo?.storeId && selectedMonth.value) {
    const currentYear = Number(selectedMonth.value.slice(0, 4))
    const currentMonth = Number(selectedMonth.value.slice(5, 7))
    console.log(currentYear, currentMonth)
    timeActive.value = ''
    const res = await getTimeRangeReportApi(
      managerStore.managerStoreInfo?.storeId,
      timeActive.value,
      currentYear,
      currentMonth,
    )
    console.log('筛选结果', res)
    statCards.value = res.data
  }
}
</script>

<template>
  <view class="report-page">
    <!-- 页面滚动容器 -->
    <scroll-view
      class="report-scroll"
      :scroll-y="true"
      :style="{ paddingBottom: `calc(24rpx + ${safeAreaInsets?.bottom || 0}px)` }"
    >
      <!-- 财务概览 -->
      <view class="finance-section">
        <view class="section-title"
          >财务概览<text style="font-size: 24rpx; color: #cccccc">(开业至今的合计数据)</text></view
        >
        <view class="finance-cards">
          <view class="finance-card service-income">
            <view class="finance-icon">📱</view>
            <view class="finance-info">
              <text class="finance-label">服务收入</text>
              <text class="finance-value">{{
                formatAmount(financeFlowData?.totalRevenue ?? 0)
              }}</text>
            </view>
          </view>
          <view class="finance-card commission-income">
            <view class="finance-icon">💰</view>
            <view class="finance-info">
              <text class="finance-label">佣金收入</text>
              <text class="finance-value">
                {{ formatAmount(financeFlowData?.totalCommission ?? 0) }}
              </text>
            </view>
          </view>
          <view class="finance-card total-income">
            <view class="finance-icon">📈</view>
            <view class="finance-info">
              <text class="finance-label">总收入</text>
              <text class="finance-value">{{ formatAmount(financeFlowData?.total ?? 0) }}</text>
            </view>
          </view>
          <view class="finance-card transactions">
            <view class="finance-icon">📋</view>
            <view class="finance-info">
              <text class="finance-label">服务笔数</text>
              <text class="finance-value">{{ financeFlowData?.totalServices }}</text>
            </view>
          </view>
        </view>
      </view>
      <!-- 时间筛选 -->
      <view class="filter-bar">
        <view class="filter-left">
          <view
            class="filter-tag"
            :class="{ active: filter.id === timeActive }"
            v-for="filter in timeFilters"
            :key="filter.id"
            @click="handleTimeFilter(filter.id)"
          >
            {{ filter.label }}
          </view>
        </view>
        <view class="filter-right">
          <picker
            mode="date"
            fields="month"
            :value="selectedMonth"
            @change="handleMonthChange"
            class="month-picker"
          >
            <view class="month-selector">
              <text class="month-text">{{
                selectedMonth ? formatMonth(selectedMonth) : '选择月份'
              }}</text>
              <text class="month-icon">📅</text>
            </view>
          </picker>
        </view>
      </view>

      <!-- 统计卡片 -->
      <view class="stat-cards">
        <view class="stat-card">
          <!--          <view class="card-header">-->
          <!--            <text class="card-icon">{{ statCards.icon }}</text>-->
          <!--            <text class="card-title">{{ statCards.title }}</text>-->
          <!--          </view>-->
          <view class="card-content">
            <view class="stat-row">
              <text class="stat-label">服务数</text>
              <text class="stat-value">{{ statCards?.totalServices }}</text>
            </view>
            <view class="stat-row">
              <text class="stat-label">贴膜营收</text>
              <text class="stat-value">{{ formatAmount(statCards?.totalRevenue ?? 0) }}</text>
            </view>
            <view class="stat-row">
              <text class="stat-label">好友返佣</text>
              <text class="stat-value">{{ formatAmount(statCards?.totalCommission ?? 0) }}</text>
            </view>
            <view class="stat-row">
              <text class="stat-label">合计收入</text>
              <text class="stat-value">{{ formatAmount(statCards?.total ?? 0) }}</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<style scoped lang="scss">
.report-page {
  min-height: 100vh;
  background-color: $jel-pageBackGroundColor;

  .report-scroll {
    height: 100vh;
    padding: 24rpx;
  }
}

// 时间筛选
.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
  background-color: #fff;
  margin-bottom: 24rpx;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);

  .filter-left {
    display: flex;
    align-items: center;
    gap: 16rpx;
  }

  .filter-right {
    flex: 1;
    display: flex;
    justify-content: flex-end;

    .month-picker {
      width: 100%;
      max-width: 300rpx;
    }

    .month-selector {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12rpx 20rpx;
      border: 1rpx solid #e9ecef;
      border-radius: 32rpx;
      background-color: $jel-pageBackGroundColor;
      transition: all 0.3s;
      width: 100%;

      &:active {
        border-color: $jel-brandColor;
        background-color: #fff;
      }

      .month-text {
        font-size: 26rpx;
        color: $jel-font-dec2;
        flex: 1;
        text-align: center;
      }

      .month-icon {
        font-size: 24rpx;
        color: $jel-font-dec;
        flex-shrink: 0;
      }
    }
  }

  .filter-tag {
    padding: 12rpx 24rpx;
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

// 统计卡片
.stat-cards {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-bottom: 24rpx;

  .stat-card {
    background-color: #fff;
    border-radius: 16rpx;
    padding: 24rpx;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
    border-left: 4rpx solid transparent;

    &:nth-child(1) {
      border-left-color: #ff9a56;
    }

    &:nth-child(2) {
      border-left-color: #ff6b6b;
    }

    &:nth-child(3) {
      border-left-color: $jel-brandColor;
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 12rpx;
      margin-bottom: 16rpx;

      .card-icon {
        font-size: 32rpx;
      }

      .card-title {
        font-size: 30rpx;
        font-weight: 600;
        color: $jel-font-title;
      }
    }

    .card-content {
      .stat-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12rpx;

        &:last-child {
          margin-bottom: 0;
        }

        .stat-label {
          font-size: 28rpx;
          color: $jel-font-dec2;
        }

        .stat-value {
          font-size: 28rpx;
          font-weight: 600;
          color: $jel-font-title;
        }
      }
    }
  }
}

// 财务概览
.finance-section {
  margin-bottom: 24rpx;

  .section-title {
    font-size: 32rpx;
    font-weight: 600;
    color: $jel-font-title;
    margin-bottom: 20rpx;
  }

  .finance-cards {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16rpx;

    .finance-card {
      background-color: #fff;
      border-radius: 16rpx;
      padding: 24rpx;
      display: flex;
      align-items: center;
      gap: 16rpx;
      box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);

      &.service-income {
        border-left: 4rpx solid #28a745;
      }

      &.commission-income {
        border-left: 4rpx solid $jel-brandColor;
      }

      &.total-income {
        border-left: 4rpx solid #007bff;
      }

      &.transactions {
        border-left: 4rpx solid #6f42c1;
      }

      .finance-icon {
        font-size: 36rpx;
        line-height: 1;
        flex-shrink: 0;
      }

      .finance-info {
        flex: 1;

        .finance-label {
          display: block;
          font-size: 26rpx;
          color: $jel-font-dec2;
          margin-bottom: 4rpx;
        }

        .finance-value {
          display: block;
          font-size: 28rpx;
          font-weight: 600;
          color: $jel-font-title;
        }
      }
    }
  }
}
</style>
