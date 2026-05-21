<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { formatAmount, formatTimestamp } from '@/utils/formatTimestamp'
import { userWalletApi, walletTransactionByUser } from '@/api/wallet'
import { useMemberStore } from '@/stores'
import type {
  UserWallet,
  WalletBizType,
  WalletFilterTab,
  WalletTransaction,
  WalletTransactionType,
} from '@/types/Wallet'

const userStore = useMemberStore()

const wallet = ref<UserWallet>({
  userId: '',
  balance: '0',
  availableBalance: '0',
  frozenBalance: '0',
})

const transactionList = ref<WalletTransaction[]>([])
const listLoading = ref(false)
const listFinished = ref(false)
const listParams = ref({ pageNum: 1, pageSize: 20 })
const activeFilterTab = ref<WalletFilterTab>('ALL')
let transactionListRequestSeq = 0

const typeLabel: Record<WalletTransactionType, string> = {
  IN: '进账',
  OUT: '出账',
}

const bizTypeLabel: Record<WalletBizType, string> = {
  SETTLEMENT: '结算',
  COMMISSION: '佣金',
  WITHDRAW: '提现',
}

const filterTabOptions: { key: WalletFilterTab; name: string }[] = [
  { key: 'ALL', name: '全部' },
  { key: 'IN', name: '进账' },
  { key: 'OUT', name: '出账' },
]

/** 当前 Tab 下的展示列表（提现等业务类型仍属 OUT，归在「出账」里） */
const filteredTransactionList = computed(() => {
  const tab = activeFilterTab.value
  const list = transactionList.value
  if (tab === 'ALL') return list
  if (tab === 'IN') return list.filter((t) => t.type === 'IN')
  return list.filter((t) => t.type === 'OUT')
})

const isIncome = (t: WalletTransaction) => t.type === 'IN'

/** 主标题：接口 remark 为主，空时退回业务类型文案 */
const txTitle = (row: WalletTransaction) =>
  (row.remark && row.remark.trim()) || bizTypeLabel[row.bizType]

/** 拉取钱包余额 */
const loadWallet = async () => {
  console.log('loadWallet')
  const res = await userWalletApi(userStore.profile.id)
  console.log('钱包', res)
  wallet.value = res.data
}

// 拉取流水列表
const loadTransactionList = async () => {
  if (listFinished.value || listLoading.value) return

  const userId = userStore.profile?.id
  if (!userId) {
    transactionList.value = []
    listFinished.value = true
    return
  }

  listLoading.value = true
  const requestSeq = ++transactionListRequestSeq
  const { pageNum, pageSize } = listParams.value
  const tab = activeFilterTab.value
  try {
    console.log(tab)

    const res = await walletTransactionByUser(userId, tab, pageNum, pageSize)
    if (requestSeq !== transactionListRequestSeq) return

    if (pageNum === 1) {
      transactionList.value = res.data.list
    } else {
      transactionList.value.push(...res.data.list)
    }

    if (pageNum < res.data.totalPage) {
      listParams.value.pageNum++
    } else {
      listFinished.value = true
    }
  } catch {
    if (requestSeq === transactionListRequestSeq) {
      listFinished.value = true
    }
  } finally {
    if (requestSeq === transactionListRequestSeq) {
      listLoading.value = false
    }
  }
}

/** 重置流水分页状态 */
const resetTransactionListPage = () => {
  transactionListRequestSeq++
  listFinished.value = false
  listLoading.value = false
  listParams.value.pageNum = 1
  transactionList.value = []
}

/** 进入页 */
const onPageLoad = () => {
  resetTransactionListPage()
  loadWallet()
  loadTransactionList()
}

/** 申请提现 */
const handleApplyWithdraw = () => {
  console.log('handleApplyWithdraw', wallet.value.availableBalance)
  uni.navigateTo({
    url: `/pagesMember/storeWallet/applyWithdraw?availableBalance=${wallet.value.availableBalance}`,
  })
}

/** 切换流水筛选 */
const handleFilterTabChange = (tab: WalletFilterTab) => {
  if (activeFilterTab.value === tab) return

  activeFilterTab.value = tab
  console.log('handleFilterTabChange', tab)
  resetTransactionListPage()
  loadTransactionList()
}

/** 列表触底加载更多 */
const handleTransactionScrollToLower = () => {
  loadTransactionList()
}

onLoad(() => {
  onPageLoad()
})
</script>

<template>
  <view class="page">
    <!-- 余额概览 -->
    <view class="summary">
      <view class="summary__main">
        <text class="summary__label">总余额（元）</text>
        <text class="summary__balance">¥{{ formatAmount(wallet.balance) }}</text>
      </view>
      <view class="summary__sub">
        <view class="summary__cell">
          <text class="summary__sub-label">可用余额</text>
          <text class="summary__sub-value">¥{{ formatAmount(wallet.availableBalance) }}</text>
        </view>
        <view class="summary__sub-split" />
        <view class="summary__cell">
          <text class="summary__sub-label">冻结金额</text>
          <text class="summary__sub-value is-muted">
            ¥{{ formatAmount(wallet.frozenBalance) }}
          </text>
        </view>
      </view>
    </view>

    <!-- 申请提现 -->
    <view class="action-bar">
      <button class="btn-withdraw" type="default" @click="handleApplyWithdraw">申请提现</button>
      <text class="action-hint">可用金额可申请提现，具体以平台规则为准</text>
    </view>

    <!-- 流水区（仅列表区域滚动 + 加载更多） -->
    <view class="section section--flex">
      <view class="section__head">
        <view class="section__mark" />
        <text class="section__title">资金流水</text>
      </view>

      <view class="filter-tabs">
        <view
          v-for="opt in filterTabOptions"
          :key="opt.key"
          class="filter-tabs__item"
          :class="{ 'is-active': activeFilterTab === opt.key }"
          @click="handleFilterTabChange(opt.key)"
        >
          <text class="filter-tabs__text">{{ opt.name }}</text>
        </view>
      </view>

      <scroll-view
        class="tx-scroll"
        :scroll-y="true"
        :enhanced="true"
        :show-scrollbar="false"
        :lower-threshold="80"
        @scrolltolower="handleTransactionScrollToLower"
      >
        <view class="section__body">
          <view v-for="row in filteredTransactionList" :key="row.id" class="tx-card">
            <view class="tx-card__row tx-card__row--1">
              <text class="tx-card__title">{{ txTitle(row) }}</text>
              <view class="tx-card__time-wrap">
                <text class="tx-card__time-line">
                  <text class="tx-card__time-prefix">交易时间：</text>
                  <text class="tx-card__time-value">{{ formatTimestamp(row.createdAt, 2) }}</text>
                </text>
              </view>
            </view>
            <view class="tx-card__row tx-card__row--2">
              <view class="tx-card__biz-type">
                <text class="tx-card__biz">{{ bizTypeLabel[row.bizType] }}</text>
                <text class="tx-card__type" :class="isIncome(row) ? 'is-in' : 'is-out'">
                  {{ typeLabel[row.type] }}
                </text>
              </view>
              <text class="tx-card__amount" :class="isIncome(row) ? 'is-in' : 'is-out'">
                {{ isIncome(row) ? '+' : '-' }}¥{{ formatAmount(row.amount) }}
              </text>
            </view>
            <view class="tx-card__row tx-card__row--3">
              <text class="tx-card__related-line">
                <text class="tx-card__aux-label">关联编号：</text>
                <text class="tx-card__aux-value tx-card__aux-value--muted">{{
                  row.relatedId != null ? String(row.relatedId) : '—'
                }}</text>
              </text>
              <text class="tx-card__balance-line">
                <text class="tx-card__aux-label">余额：</text>
                <text class="tx-card__aux-value">{{ formatAmount(row.balanceAfter) }}</text>
              </text>
            </view>
          </view>
        </view>

        <view v-if="listLoading" class="section__foot">加载中…</view>
        <view v-else-if="listFinished && filteredTransactionList.length > 0" class="section__foot">
          没有更多了
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.page {
  height: 100vh;
  overflow: hidden;
  padding: 24rpx;
  padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
  width: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #f0f0f0 0%, $jel-pageBackGroundColor 220rpx);
}

.summary {
  margin-bottom: 24rpx;
  flex-shrink: 0;
  background: linear-gradient(145deg, $jel-brandColor 0%, #e02030 48%, #ff5a67 100%);
  border-radius: 20rpx;
  padding: 36rpx 28rpx 28rpx;
  box-shadow: 0 12rpx 32rpx rgba(214, 39, 49, 0.28);
}

.summary__main {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: 28rpx;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.3);
  margin-bottom: 28rpx;
}

.summary__label {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.82);
  margin-bottom: 12rpx;
}

.summary__balance {
  font-size: 52rpx;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.5rpx;
}

.summary__sub {
  display: flex;
  align-items: stretch;
}

.summary__cell {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.summary__sub-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.72);
}

.summary__sub-value {
  font-size: 32rpx;
  font-weight: 600;
  color: #ffffff;

  &.is-muted {
    font-weight: 500;
    color: rgba(255, 255, 255, 0.88);
  }
}

.summary__sub-split {
  width: 2rpx;
  margin: 0 12rpx;
  background: rgba(255, 255, 255, 0.35);
  align-self: stretch;
}

.action-bar {
  margin-bottom: 28rpx;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 12rpx;
}

.btn-withdraw {
  line-height: 2.2;
  font-size: 30rpx;
  font-weight: 600;
  color: $jel-brandColor;
  background: #ffffff;
  border-radius: 48rpx;
  border: none;
  box-shadow: 0 4rpx 20rpx rgba(214, 39, 49, 0.18);

  &::after {
    border: none;
  }
}

.action-hint {
  text-align: center;
  font-size: 22rpx;
  color: #b3b3b3;
  line-height: 1.4;
}

.section {
  width: 100%;
}

.section--flex {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.tx-scroll {
  flex: 1;
  height: 0;
  width: 100%;
  box-sizing: border-box;
}

.section__head {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 20rpx;
  padding: 0 4rpx;
}

.section__mark {
  width: 6rpx;
  height: 28rpx;
  border-radius: 4rpx;
  background: linear-gradient(180deg, $jel-brandColor 0%, #ff6b6b 100%);
  flex-shrink: 0;
}

.section__title {
  font-size: 32rpx;
  font-weight: 600;
  color: $jel-font-title;
  line-height: 1.2;
}

.filter-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  width: 100%;
  margin-bottom: 20rpx;
  padding: 0 4rpx 4rpx;
  box-sizing: border-box;
}

.filter-tabs__item {
  display: inline-flex;
  padding: 12rpx 28rpx;
  border-radius: 999rpx;
  background: #ffffff;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.04);

  &.is-active {
    background: linear-gradient(135deg, $jel-brandColor 0%, #ff5a67 100%);

    .filter-tabs__text {
      color: #ffffff;
      font-weight: 600;
    }
  }
}

.filter-tabs__text {
  font-size: 26rpx;
  color: #5a5a5a;
  line-height: 1.2;
}

.section__body {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.tx-card {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  background: #ffffff;
  border-radius: 16rpx;
  padding: 28rpx 24rpx;
  box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
}

.tx-card__row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 16rpx;
  box-sizing: border-box;
}

.tx-card__row--1 {
  flex-wrap: nowrap;
  align-items: center;
}

.tx-card__title {
  flex: 1;
  min-width: 0;
  font-size: 30rpx;
  font-weight: 600;
  color: $jel-font-title;
  line-height: 1.45;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tx-card__time-wrap {
  flex-shrink: 0;
  white-space: nowrap;
}

.tx-card__time-line {
  font-size: 22rpx;
  line-height: 1.45;
  white-space: nowrap;
}

.tx-card__time-prefix {
  color: #b0b0b0;
  font-weight: 400;
}

.tx-card__time-value {
  color: #5c5c5c;
  font-weight: 500;
}

.tx-card__biz-type {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 12rpx;
}

.tx-card__biz {
  font-size: 28rpx;
  font-weight: 500;
  color: #454545;
  line-height: 1.4;
}

.tx-card__type {
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  line-height: 1.3;
  font-weight: 500;

  &.is-in {
    color: $jel-brandColor;
    background: rgba(214, 39, 49, 0.12);
  }

  &.is-out {
    color: #6a6a6a;
    background: #ececec;
  }
}

.tx-card__amount {
  flex-shrink: 0;
  font-size: 32rpx;
  font-weight: 700;
  line-height: 1.3;
  font-variant-numeric: tabular-nums;

  &.is-in {
    color: $jel-brandColor;
  }

  &.is-out {
    color: #2a2a2a;
  }
}

.tx-card__related-line {
  flex: 1;
  min-width: 0;
  font-size: 24rpx;
  line-height: 1.4;
  font-variant-numeric: tabular-nums;
}

.tx-card__balance-line {
  flex-shrink: 0;
  font-size: 26rpx;
  line-height: 1.4;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.tx-card__aux-label {
  color: #b8b8b8;
  font-weight: 400;
}

.tx-card__aux-value {
  color: #5a5a5a;
  font-weight: 500;
}

.tx-card__aux-value--muted {
  color: #9a9a9a;
  font-weight: 400;
}

.section__foot {
  text-align: center;
  font-size: 24rpx;
  color: #c4c4c4;
  padding: 16rpx 0 0;
}
</style>
