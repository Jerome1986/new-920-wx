<script setup lang="ts">
import { ref } from 'vue'
import { onLoad, onPullDownRefresh } from '@dcloudio/uni-app'
import { formatAmount, formatTimestamp } from '@/utils/formatTimestamp'
import type {
  UserWallet,
  WalletBizType,
  WalletFilterTab,
  WalletTransaction,
  WalletTransactionType,
} from '@/types/Wallet'

// —— 模拟数据（2 条流水 + 1 组钱包，用于看版式） ——
const mockWallet: UserWallet = {
  userId: 'mock-manager-01',
  balance: '3580.50',
  availableBalance: '3000.00',
  frozenBalance: '580.50',
}

const mockTransactionList: WalletTransaction[] = [
  {
    id: 1,
    userId: 'mock-manager-01',
    type: 'IN',
    bizType: 'COMMISSION',
    amount: '328.00',
    balanceAfter: '3580.50',
    relatedId: 9001,
    remark: '线下贴膜订单佣金',
    createdAt: '2026-04-25T10:32:00.000Z',
  },
  {
    id: 2,
    userId: 'mock-manager-01',
    type: 'OUT',
    bizType: 'WITHDRAW',
    amount: '500.00',
    balanceAfter: '3080.50',
    relatedId: 7001,
    remark: '提现至微信零钱',
    createdAt: '2026-04-24T15:20:00.000Z',
  },
]

// —— 状态（接接口后可改为空初始值，此处绑定模拟数据以展示） ——
const wallet = ref<UserWallet>({ ...mockWallet })
const transactionList = ref<WalletTransaction[]>([...mockTransactionList])
const listLoading = ref(false)
// 接分页后由接口态控制；此处为 true 便于预览底部「没有更多了」
const listFinished = ref(true)
const activeFilterTab = ref<WalletFilterTab>('ALL')

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
  { key: 'WITHDRAW', name: '提现' },
]

// 展示用：进账类业务（用于标签颜色等，可后续接筛选）
const isIncome = (t: WalletTransaction) => t.type === 'IN'

// —— 滚动区高度（与项目其它页一致） ——
const scrollHeight = ref(0)
const initScrollHeight = () => {
  scrollHeight.value = uni.getSystemInfoSync().windowHeight
}
initScrollHeight()

/** 拉取钱包余额 */
const loadWallet = async () => {
  console.log('loadWallet')
}

/** 拉取流水列表 */
const loadTransactionList = async () => {
  console.log('loadTransactionList', activeFilterTab.value)
}

/** 进入页 */
const onPageLoad = () => {
  console.log('storeWallet onPageLoad')
  void loadWallet()
  void loadTransactionList()
}

/** 下拉刷新 */
const onPagePullDownRefresh = async () => {
  console.log('onPagePullDownRefresh')
  await loadWallet()
  await loadTransactionList()
  uni.stopPullDownRefresh()
}

/** 申请提现 */
const handleApplyWithdraw = () => {
  console.log('handleApplyWithdraw', wallet.value.availableBalance)
}

/** 切换流水筛选 */
const handleFilterTabChange = (tab: WalletFilterTab) => {
  activeFilterTab.value = tab
  console.log('handleFilterTabChange', tab)
  void loadTransactionList()
}

/** 单条流水点击 */
const handleTransactionItemClick = (row: WalletTransaction) => {
  console.log('handleTransactionItemClick', row.id)
}

/** 列表触底加载更多 */
const handleTransactionScrollToLower = () => {
  console.log('handleTransactionScrollToLower')
}

onLoad(() => {
  onPageLoad()
})

onPullDownRefresh(() => {
  void onPagePullDownRefresh()
})
</script>

<template>
  <scroll-view
    class="page-scroll"
    :scroll-y="true"
    :enhanced="true"
    :show-scrollbar="false"
    :style="{ height: scrollHeight + 'px' }"
    @scrolltolower="handleTransactionScrollToLower"
  >
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

      <!-- 流水区 -->
      <view class="section">
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

        <view class="section__body">
          <view
            v-for="row in transactionList"
            :key="row.id"
            class="tx-card"
            @click="handleTransactionItemClick(row)"
          >
            <view class="tx-card__left">
              <view class="tx-card__row1">
                <text class="tx-card__biz">{{ bizTypeLabel[row.bizType] }}</text>
                <text class="tx-card__type" :class="isIncome(row) ? 'is-in' : 'is-out'">
                  {{ typeLabel[row.type] }}
                </text>
              </view>
              <text class="tx-card__remark">{{ row.remark || '—' }}</text>
              <text class="tx-card__time">{{ formatTimestamp(row.createdAt, 2) }}</text>
            </view>
            <view class="tx-card__right">
              <text class="tx-card__amount" :class="isIncome(row) ? 'is-in' : 'is-out'">
                {{ isIncome(row) ? '+' : '-' }}¥{{ formatAmount(row.amount) }}
              </text>
              <text class="tx-card__after">余额 ¥{{ formatAmount(row.balanceAfter) }}</text>
            </view>
          </view>
        </view>

        <view v-if="listLoading" class="section__foot">加载中…</view>
        <view v-else-if="listFinished && transactionList.length > 0" class="section__foot">
          没有更多了
        </view>
      </view>
    </view>
  </scroll-view>
</template>

<style scoped lang="scss">
.page-scroll {
  width: 100%;
  box-sizing: border-box;
  background: linear-gradient(180deg, #f0f0f0 0%, $jel-pageBackGroundColor 220rpx);
}

.page {
  min-height: 100%;
  padding: 24rpx;
  padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.summary {
  margin-bottom: 24rpx;
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
  color: rgba(255, 255, 255, 0.9);
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
  color: rgba(255, 255, 255, 0.85);
}

.summary__sub-value {
  font-size: 32rpx;
  font-weight: 600;
  color: #ffffff;

  &.is-muted {
    font-weight: 500;
    color: rgba(255, 255, 255, 0.92);
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
  color: #999999;
  line-height: 1.4;
}

.section {
  width: 100%;
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
  color: #666666;
  line-height: 1.2;
}

.section__body {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.tx-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.06);
}

.tx-card__left {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.tx-card__row1 {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12rpx;
}

.tx-card__biz {
  font-size: 30rpx;
  font-weight: 600;
  color: $jel-font-title;
}

.tx-card__type {
  font-size: 22rpx;
  padding: 4rpx 10rpx;
  border-radius: 8rpx;
  line-height: 1.2;

  &.is-in {
    color: $jel-brandColor;
    background: rgba(214, 39, 49, 0.1);
  }

  &.is-out {
    color: #8a8a8a;
    background: #f2f2f2;
  }
}

.tx-card__remark {
  font-size: 26rpx;
  color: #666666;
  line-height: 1.35;
}

.tx-card__time {
  font-size: 24rpx;
  color: #aaaaaa;
}

.tx-card__right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
  gap: 8rpx;
}

.tx-card__amount {
  font-size: 32rpx;
  font-weight: 700;
  line-height: 1.2;

  &.is-in {
    color: $jel-brandColor;
  }

  &.is-out {
    color: #333333;
  }
}

.tx-card__after {
  font-size: 22rpx;
  color: #999999;
}

.section__foot {
  text-align: center;
  font-size: 24rpx;
  color: #aaaaaa;
  padding: 16rpx 0 0;
}
</style>
