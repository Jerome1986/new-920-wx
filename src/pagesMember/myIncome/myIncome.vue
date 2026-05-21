<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { formatAmount, formatTimestamp } from '@/utils/formatTimestamp.ts'
import { storeDashboardApi, storeTransactionGetApi } from '@/api/storeTransaction'
import { useManagerStore } from '@/stores'
import type {
  StoreTransaction,
  StoreTransactionFilterType,
  TimeRangePreset,
} from '@/types/ManagerStore'

const managerStore = useManagerStore()

const timePresetList: { id: string; value: TimeRangePreset; label: string }[] = [
  { id: 'today', value: 'today', label: '今日' },
  { id: 'month', value: 'month', label: '本月' },
  { id: 'year', value: 'year', label: '本年' },
]

// 当前快捷时间
const activeTimePreset = ref<TimeRangePreset>('month')
// 概览副标题时间
const timeRangeLabel = ref('本月')

const handleTimePresetChange = async (preset: TimeRangePreset) => {
  resetTransactionListPage()
  activeTimePreset.value = preset
  const labelMap: Record<TimeRangePreset, string> = { today: '今日', month: '本月', year: '本年' }
  timeRangeLabel.value = labelMap[preset]

  if (managerStore.managerStoreInfo) {
    await Promise.all([
      fetchStoreIncomeOverview(
        managerStore.managerStoreInfo.id,
        managerStore.managerStoreInfo.managerId,
        activeTimePreset.value,
      ),
      fetchStoreTransactionList(
        activeTransactionFilter.value,
        activeTimePreset.value,
        transactionListParams.value.pageNum,
        transactionListParams.value.pageSize,
      ),
    ])
  }
}

// 营业额
const turnoverAmount = ref('0')
// 服务数
const serviceCount = ref(0)
// 客单价
const averageOrderValue = ref('0')
// 进货支出
const purchaseExpenseAmount = ref('0')
// 经营利润
const operatingProfit = ref<string | null>(null)

// 拉取经营概览
const fetchStoreIncomeOverview = async (
  storeId: string,
  userId: string,
  timeRangePreset: TimeRangePreset,
) => {
  const res = await storeDashboardApi(storeId, userId, timeRangePreset)
  turnoverAmount.value = res.data.turnoverAmount
  serviceCount.value = res.data.serviceCount
  averageOrderValue.value = res.data.avgCustomerPrice
  purchaseExpenseAmount.value = res.data.purchaseExpense
  operatingProfit.value = res.data.profitAmount
}

// 门店流水列表
const transactionListParams = ref({
  pageNum: 1,
  pageSize: 10,
})
const transactionListFinished = ref(false)
const transactionListLoading = ref(false)
// 流水列表
const storeTransactionList = ref<StoreTransaction[]>([])

// 拉取流水
const fetchStoreTransactionList = async (
  filterType: StoreTransactionFilterType,
  timeRangePreset: TimeRangePreset,
  pageNum: number,
  pageSize: number,
) => {
  transactionListLoading.value = true
  if (transactionListFinished.value || !transactionListLoading.value) return
  try {
    const res = await storeTransactionGetApi(
      managerStore.managerStoreInfo?.id as string,
      filterType,
      timeRangePreset,
      pageNum,
      pageSize,
    )
    console.log('store', res)
    if (transactionListParams.value.pageNum === 1) {
      storeTransactionList.value = res.data.list
    } else {
      storeTransactionList.value.push(...res.data.list)
    }

    if (transactionListParams.value.pageNum < res.data.totalPage) {
      transactionListParams.value.pageNum++
    } else {
      transactionListFinished.value = true
    }
  } catch (err) {
    console.error(err)
  } finally {
    transactionListLoading.value = false
  }
}

// 流水触底加载
const handleTransactionListScrollToLower = () => {
  if (transactionListFinished.value) return
  fetchStoreTransactionList(
    activeTransactionFilter.value,
    activeTimePreset.value,
    transactionListParams.value.pageNum,
    transactionListParams.value.pageSize,
  )
}

// 重置流水分页
const resetTransactionListPage = () => {
  transactionListFinished.value = false
  transactionListLoading.value = false
  transactionListParams.value.pageNum = 1
}

// 流水方向筛选标签
const transactionFilterTagList = ref([
  { id: 'all', value: 'ALL' as const, label: '全部' },
  { id: 'income', value: 'INCOME' as const, label: '收入' },
  { id: 'expense', value: 'EXPENSE' as const, label: '支出' },
])
const activeTransactionFilter = ref<StoreTransactionFilterType>('ALL')
const transactionFilterMap: Record<StoreTransactionFilterType, string> = {
  ALL: '全部',
  EXPENSE: '支出',
  INCOME: '收入',
}

// 判断流水是否为收入
const isIncomeTransaction = (row: StoreTransaction) => row.type === 'INCOME'

// 流水标签（收入/支出）
const handleTransactionFilterChange = (tag: StoreTransactionFilterType) => {
  resetTransactionListPage()
  activeTransactionFilter.value = tag
  fetchStoreTransactionList(
    activeTransactionFilter.value,
    activeTimePreset.value,
    transactionListParams.value.pageNum,
    transactionListParams.value.pageSize,
  )
}

// 安全区
const { safeAreaInsets } = uni.getSystemInfoSync()

onLoad(async () => {
  if (managerStore.managerStoreInfo) {
    await Promise.all([
      fetchStoreIncomeOverview(
        managerStore.managerStoreInfo.id,
        managerStore.managerStoreInfo.managerId,
        activeTimePreset.value,
      ),
      fetchStoreTransactionList(
        activeTransactionFilter.value,
        activeTimePreset.value,
        transactionListParams.value.pageNum,
        transactionListParams.value.pageSize,
      ),
    ])
  }
})
</script>

<template>
  <view class="store-income-page">
    <view class="metrics-section">
      <view class="time-range-bar">
        <view
          v-for="item in timePresetList"
          :key="item.id"
          class="time-range-item"
          :class="{ 'time-range-item--active': activeTimePreset === item.value }"
          @click="handleTimePresetChange(item.value)"
        >
          {{ item.label }}
        </view>
      </view>

      <view class="metrics-card">
        <view class="metrics-title-row">
          <text class="metrics-title">门店经营概览</text>
          <text class="metrics-title-sub">（{{ timeRangeLabel }}）</text>
        </view>
        <view class="metrics-grid">
          <view class="metric-cell">
            <text class="metric-label">营业额</text>
            <text class="metric-value">{{ formatAmount(turnoverAmount) }}</text>
          </view>
          <view class="metric-cell">
            <text class="metric-label">服务数</text>
            <text class="metric-value metric-value--plain">{{ serviceCount }}</text>
          </view>
          <view class="metric-cell">
            <text class="metric-label">客单价</text>
            <text class="metric-value">{{ formatAmount(averageOrderValue) }}</text>
          </view>
          <view class="metric-cell">
            <text class="metric-label">进货支出</text>
            <text class="metric-value metric-value--expense">{{
              formatAmount(purchaseExpenseAmount)
            }}</text>
          </view>
          <view class="metric-cell">
            <text class="metric-label">经营利润</text>
            <text class="metric-value">
              {{ operatingProfit === null ? '—' : formatAmount(operatingProfit) }}
            </text>
          </view>
        </view>
      </view>
    </view>

    <view class="filter-bar">
      <view
        v-for="item in transactionFilterTagList"
        :key="item.id"
        class="filter-tag"
        :class="{ 'filter-tag--active': activeTransactionFilter === item.value }"
        @click="handleTransactionFilterChange(item.value)"
      >
        {{ item.label }}
      </view>
    </view>

    <scroll-view
      v-if="storeTransactionList.length > 0"
      class="transaction-scroll"
      :scroll-y="true"
      :style="{ paddingBottom: `calc(24rpx + ${safeAreaInsets?.bottom || 0}px)` }"
      @scrolltolower="handleTransactionListScrollToLower"
    >
      <view class="transaction-list">
        <view v-for="row in storeTransactionList" :key="row.id" class="transaction-row">
          <view class="transaction-row__main">
            <text class="transaction-row__remark">{{ row.remark }}</text>
            <view class="transaction-row__meta">
              <text class="transaction-row__time">{{ formatTimestamp(row.createdAt, 2) }}</text>
              <text class="transaction-row__badge">{{ transactionFilterMap[row.type] }}</text>
            </view>
            <text v-if="row.relatedOrderId" class="transaction-row__related"
              >单号 {{ row.relatedOrderId }}</text
            >
          </view>
          <text
            class="transaction-row__amount"
            :class="isIncomeTransaction(row) ? 'is-in' : 'is-out'"
          >
            {{ isIncomeTransaction(row) ? '+' : '-' }}¥{{ formatAmount(row.amount) }}
          </text>
        </view>
      </view>
      <view class="list-footer-tip">
        {{ transactionListFinished ? '没有更多了' : '加载更多' }}
      </view>
    </scroll-view>

    <view v-else class="empty-state">
      <image class="empty-state__img" src="@/static/images/empty.png" mode="aspectFit" />
      <text class="empty-state__text">暂无流水记录</text>
    </view>
  </view>
</template>

<style scoped lang="scss">
.store-income-page {
  min-height: 100vh;
  background-color: $jel-pageBackGroundColor;
}

.metrics-section {
  padding: 24rpx;
  padding-bottom: 16rpx;
  background: linear-gradient(135deg, #ff9a56 0%, #ff6b6b 50%, $jel-brandColor 100%);
}

.time-range-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.time-range-item {
  padding: 14rpx 36rpx;
  border-radius: 32rpx;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.95);
  background-color: rgba(255, 255, 255, 0.22);
  border: 2rpx solid transparent;
}

.time-range-item--active {
  color: $jel-brandColor;
  background-color: #fff;
  font-weight: 600;
  border-color: #fff;
}

.metrics-card {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 20rpx;
  padding: 28rpx 24rpx 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(214, 39, 49, 0.12);
}

.metrics-title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8rpx;
  margin-bottom: 24rpx;
}

.metrics-title {
  font-size: 30rpx;
  font-weight: 600;
  color: $jel-font-title;
}

.metrics-title-sub {
  font-size: 24rpx;
  color: $jel-font-dec2;
  font-weight: 400;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20rpx 16rpx;
}

.metric-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8rpx;
  min-width: 0;
}

.metric-label {
  font-size: 22rpx;
  color: $jel-font-dec;
}

.metric-value {
  font-size: 30rpx;
  font-weight: 600;
  color: $jel-font-title;
  word-break: break-all;
}

.metric-value--plain {
  font-size: 34rpx;
  color: $jel-brandColor;
}

.metric-value--expense {
  color: $jel-font-success;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 20rpx 24rpx;
  background-color: #fff;
}

.filter-tag {
  padding: 12rpx 28rpx;
  border-radius: 32rpx;
  font-size: 26rpx;
  color: $jel-font-dec2;
  background-color: $jel-pageBackGroundColor;
}

.filter-tag--active {
  color: #fff;
  background-color: $jel-brandColor;
}

.transaction-scroll {
  height: calc(100vh - 500rpx);
  padding: 0 24rpx 24rpx;
  box-sizing: border-box;
}

.transaction-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  padding-top: 16rpx;
}

.transaction-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
  background-color: #fff;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.transaction-row__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.transaction-row__remark {
  font-size: 28rpx;
  color: $jel-font-title;
  font-weight: 500;
}

.transaction-row__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12rpx;
}

.transaction-row__time {
  font-size: 22rpx;
  color: $jel-font-dec;
}

.transaction-row__badge {
  font-size: 20rpx;
  color: $jel-brandColor;
  background-color: rgba(214, 39, 49, 0.08);
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}

.transaction-row__badge--biz {
  color: $jel-font-dec2;
  background-color: $jel-pageBackGroundColor;
}

.transaction-row__related {
  font-size: 22rpx;
  color: $jel-font-dec2;
}

.transaction-row__amount {
  font-size: 32rpx;
  font-weight: 700;
  line-height: 1.3;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;

  &.is-in {
    color: $jel-brandColor;
  }

  &.is-out {
    color: #2a2a2a;
  }
}

.list-footer-tip {
  text-align: center;
  font-size: 24rpx;
  color: $jel-font-dec;
  padding: 24rpx 0 8rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
}

.empty-state__img {
  width: 280rpx;
  height: 280rpx;
  margin-bottom: 20rpx;
}

.empty-state__text {
  font-size: 28rpx;
  color: $jel-font-dec;
}
</style>
