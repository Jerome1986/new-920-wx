<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { formatAmount, formatRole, formatTimestamp } from '@/utils/formatTimestamp.ts'
import { maskMiddle } from '@/utils/maskMiddle.ts'
import type { CommissionRecordItem } from '@/types/CommissionRecord'
import { findStoreCommissionRecord } from '@/api/store'
import { useMemberStore } from '@/stores'
import type { StoreBizType } from '@/types/ManagerStore'
import { isManagerRole } from '@/utils/role'

const userStore = useMemberStore()

// 累计佣金（元），概览区展示（由全量明细汇总）
const totalCommission = ref(0)
// 本月佣金（元），概览区展示（当前自然月）
const monthCommission = ref(0)

const toAmountNumber = (v: number | string) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

const isInCurrentMonth = (createdAt: Date | string) => {
  const d = typeof createdAt === 'string' ? new Date(createdAt) : createdAt
  if (Number.isNaN(d.getTime())) return false
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

const applyCommissionSummary = (list: CommissionRecordItem[]) => {
  totalCommission.value = list.reduce((sum, row) => sum + toAmountNumber(row.amount), 0)
  monthCommission.value = list
    .filter((row) => isInCurrentMonth(row.createdAt as Date | string))
    .reduce((sum, row) => sum + toAmountNumber(row.amount), 0)
}

// 下级手机号脱敏展示
const displaySubordinateMobile = (m?: string | null) => {
  if (m == null || m === '') return '—'
  return maskMiddle(m)
}

// 下级角色转为中文文案
const roleDisplay = (role: string) => formatRole(role, 0)

// 佣金类型转换中文
const bizLabelLabel: Record<StoreBizType, string> = {
  PRODUCT: '购买商品',
  SERVICE: '线下贴膜',
  PURCHASE: '个人进货',
}

// 佣金明细列表
const commissionRecordList = ref<CommissionRecordItem[]>([])

// 明细列表加载中
const listLoading = ref(false)
// 明细是否已加载完全部（分页结束）
const listFinished = ref(false)
// 明细分页参数
const listParams = ref({ pageNum: 1, pageSize: 10 })

// 拉取顶部累计/本月佣金概览（一次取大页全量用于汇总）
const fetchCommissionOverview = async () => {
  const userId = userStore.profile?.id
  if (!userId) return
  try {
    const res = await findStoreCommissionRecord(userId, 1, 1000)
    applyCommissionSummary(res.data.list)
  } catch (err) {
    console.error(err)
  }
}

// 拉取佣金明细分页
const fetchCommissionRecordList = async (pageNum: number, pageSize: number) => {
  listLoading.value = true
  if (listFinished.value || !listLoading.value) return
  try {
    const res = await findStoreCommissionRecord(userStore.profile.id, pageNum, pageSize)
    commissionRecordList.value = res.data.list
    console.log(res)

    if (listParams.value.pageNum < res.data.totalPage) {
      listParams.value.pageNum++
    } else {
      listFinished.value = true
    }
  } catch (err) {
    console.error(err)
  } finally {
    listLoading.value = false
  }
}

// 重置明细分页状态（换条件或下拉刷新时用）
const resetCommissionListPage = () => {
  console.log('resetCommissionListPage')
}

// 明细列表触底加载更多
const handleCommissionListScrollToLower = () => {
  console.log('handleCommissionListScrollToLower')
}

// 页面进入：拉概览与首屏明细
onLoad(() => {
  console.log('commission page onLoad')
  fetchCommissionOverview()
  fetchCommissionRecordList(listParams.value.pageNum, listParams.value.pageSize)
})
</script>

<template>
  <view class="page">
    <view class="summary">
      <view class="summary__inner">
        <view class="summary__cell">
          <text class="summary__label">累计佣金（元）</text>
          <text class="summary__value">{{ formatAmount(totalCommission) }}</text>
        </view>
        <view class="summary__split" />
        <view class="summary__cell">
          <text class="summary__label">本月佣金（元）</text>
          <text class="summary__value">{{ formatAmount(monthCommission) }}</text>
        </view>
      </view>
    </view>

    <view class="detail-section">
      <view class="detail-section__head">
        <view class="detail-section__mark" />
        <text class="detail-section__title">佣金明细</text>
      </view>

      <view class="detail-section__body">
        <view v-for="item in commissionRecordList" :key="item.id" class="record-card">
          <image
            v-if="item.subordinateAvatar"
            class="record-card__avatar"
            :src="item.subordinateAvatar"
            mode="aspectFill"
          />
          <view v-else class="record-card__avatar record-card__avatar--placeholder">
            <text class="record-card__avatar-text">?</text>
          </view>
          <view class="record-card__main">
            <view class="record-card__top">
              <text class="record-card__mobile">
                {{ displaySubordinateMobile(item.subordinateMobile) }}
              </text>
              <text
                class="record-card__role"
                :class="isManagerRole(item.subordinateRole) ? 'is-manager' : 'is-user'"
              >
                {{ roleDisplay(item.subordinateRole) }}
              </text>
            </view>
            <view class="record-card__mid">
              <text class="record-card__biz">{{ bizLabelLabel[item.bizLabel] }}</text>
              <text class="record-card__amount">+¥{{ formatAmount(item.amount) }}</text>
            </view>
            <text class="record-card__time">{{ formatTimestamp(item.createdAt, 2) }}</text>
          </view>
        </view>
      </view>

      <view v-if="listLoading" class="detail-section__foot">加载中…</view>
      <view
        v-else-if="listFinished && commissionRecordList.length > 0"
        class="detail-section__foot"
      >
        没有更多了
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  padding: 24rpx;
  padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
  background: linear-gradient(180deg, #f0f0f0 0%, $jel-pageBackGroundColor 220rpx);
}

.summary {
  margin-bottom: 28rpx;
}

.summary__inner {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  background: linear-gradient(145deg, $jel-brandColor 0%, #e02030 48%, #ff5a67 100%);
  border-radius: 20rpx;
  padding: 36rpx 28rpx;
  box-shadow: 0 12rpx 32rpx rgba(214, 39, 49, 0.28);
}

.summary__cell {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14rpx;
}

.summary__label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.2;
}

.summary__value {
  font-size: 44rpx;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.15;
  letter-spacing: 0.5rpx;
}

.summary__split {
  width: 2rpx;
  align-self: stretch;
  margin: 4rpx 0;
  background: rgba(255, 255, 255, 0.38);
}

.detail-section {
  width: 100%;
}

.detail-section__head {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 20rpx;
  padding: 0 4rpx;
}

.detail-section__mark {
  width: 6rpx;
  height: 28rpx;
  border-radius: 4rpx;
  background: linear-gradient(180deg, $jel-brandColor 0%, #ff6b6b 100%);
  flex-shrink: 0;
}

.detail-section__title {
  font-size: 32rpx;
  font-weight: 600;
  color: $jel-font-title;
  line-height: 1.2;
}

.detail-section__body {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.record-card {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.06);
}

.record-card__avatar {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  background-color: $jel-border;
  flex-shrink: 0;
}

.record-card__avatar--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(214, 39, 49, 0.12) 0%, rgba(255, 71, 87, 0.1) 100%);
}

.record-card__avatar-text {
  font-size: 32rpx;
  font-weight: 600;
  color: $jel-brandColor;
  line-height: 1;
}

.record-card__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.record-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 14rpx;
}

.record-card__mobile {
  flex: 1;
  min-width: 0;
  font-size: 30rpx;
  font-weight: 600;
  color: $jel-font-title;
}

.record-card__role {
  flex-shrink: 0;
  font-size: 22rpx;
  padding: 6rpx 14rpx;
  border-radius: 8rpx;
  line-height: 1.2;
}

.record-card__role.is-user {
  color: #2d7dd2;
  background: rgba(45, 125, 210, 0.1);
}

.record-card__role.is-manager {
  color: $jel-brandColor;
  background: rgba(214, 39, 49, 0.08);
}

.record-card__mid {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 10rpx;
}

.record-card__biz {
  font-size: 26rpx;
  color: $jel-font-dec2;
}

.record-card__amount {
  font-size: 32rpx;
  font-weight: 600;
  color: $jel-brandColor;
  font-variant-numeric: tabular-nums;
}

.record-card__time {
  font-size: 24rpx;
  color: $jel-font-dec;
}

.detail-section__foot {
  text-align: center;
  font-size: 24rpx;
  color: $jel-font-dec;
  padding: 16rpx 0 8rpx;
}
</style>
