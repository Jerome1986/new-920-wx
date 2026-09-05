<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { onShow, onUnload } from '@dcloudio/uni-app'
import { formatTimestamp } from '@/utils/formatTimestamp'
import { getAgentInviteRecordsApi } from '@/api/agentInvite'
import { useMemberStore } from '@/stores'
import type {
  AgentInviteBenefitStatus,
  AgentInviteRecord,
  AgentInviteSummary,
} from '@/types/AgentInvite'

interface InviteFilters {
  mobile: string
  benefitStatus: AgentInviteBenefitStatus | ''
}

const userStore = useMemberStore()
const agentCode = ref('')
const now = ref(Date.now())
const records = ref<AgentInviteRecord[]>([])
const summary = ref<AgentInviteSummary | null>(null)
const total = ref<number | null>(null)
const mobileMatched = ref<boolean | null>(null)
const pageNum = ref(0)
const pageSize = 10
const hasMore = ref(false)
const loading = ref(false)
const errorMessage = ref('')
let requestVersion = 0
const emptyFilters = (): InviteFilters => ({
  mobile: '',
  benefitStatus: '',
})
const draft = reactive(emptyFilters())
const filters = ref<InviteFilters>(emptyFilters())
const statusOptions: { value: AgentInviteBenefitStatus | ''; label: string }[] = [
  { value: '', label: '全部' },
  { value: 'AVAILABLE', label: '待使用' },
  { value: 'USED', label: '已使用' },
  { value: 'EXPIRED', label: '已过期' },
]
const statusLabels: Record<AgentInviteBenefitStatus, string> = {
  AVAILABLE: '待使用',
  USED: '已使用',
  EXPIRED: '已过期',
}
// 顶部统计基于全部领取记录，不随列表筛选改变。
const statistics = computed(() => [
  { label: '累计邀请人数', value: summary.value?.totalInvited ?? '--', tone: 'total' },
  {
    label: '权益待使用',
    value: summary.value?.availableCount ?? '--',
    tone: 'available',
  },
  {
    label: '权益已使用',
    value: summary.value?.usedCount ?? '--',
    tone: 'used',
  },
  {
    label: '权益已过期',
    value: summary.value?.expiredCount ?? '--',
    tone: 'expired',
  },
])
const hasFilters = computed(() => Object.values(filters.value).some(Boolean))
const emptyMessage = computed(() => {
  if (filters.value.mobile && mobileMatched.value === false) {
    return '该手机号不是您邀请的用户'
  }
  return hasFilters.value ? '暂无符合条件的邀请记录' : '暂无邀请记录'
})

// 刷新使旧请求失效；仅成功后推进页码，失败重试仍请求原页。
const loadRecords = async (reset = false) => {
  if (!reset && (loading.value || !hasMore.value)) return
  const version = ++requestVersion
  const userId = userStore.profile?.id
  if (reset) {
    records.value = []
    total.value = null
    mobileMatched.value = null
    pageNum.value = 0
    hasMore.value = false
  }
  errorMessage.value = ''
  if (!userId) {
    loading.value = false
    agentCode.value = ''
    summary.value = null
    errorMessage.value = '请先登录后查看代理邀请记录'
    uni.navigateTo({ url: '/pages/login/login' })
    return
  }
  loading.value = true
  try {
    const res = await getAgentInviteRecordsApi({
      userId,
      ...(filters.value.mobile ? { mobile: filters.value.mobile } : {}),
      ...(filters.value.benefitStatus ? { benefitStatus: filters.value.benefitStatus } : {}),
      pageNum: reset ? 1 : pageNum.value + 1,
      pageSize,
    })
    if (version !== requestVersion || userStore.profile?.id !== userId) return
    // 请求封装会返回 HTTP 200 下的业务错误，这里同样需要检查 code。
    if (res.code !== 200 || !res.data) throw { data: res }
    const data = res.data
    agentCode.value = data.agentCode
    summary.value = data.summary
    total.value = data.total
    mobileMatched.value = data.mobileMatched
    records.value = reset
      ? data.list
      : [
          ...new Map(
            [...records.value, ...data.list].map((record) => [record.claimId, record]),
          ).values(),
        ]
    pageNum.value = data.pageNum
    hasMore.value = data.hasMore
    now.value = Date.now()
  } catch (error) {
    if (version !== requestVersion || userStore.profile?.id !== userId) return
    const failure = error as {
      data?: { code?: number; message?: string | string[] }
      statusCode?: number
      message?: string
    }
    const message = failure.data?.message || failure.message
    errorMessage.value = Array.isArray(message) ? message.join('，') : message || '加载失败，请重试'
    if (failure.statusCode === 403 || failure.data?.code === 403) {
      records.value = []
      agentCode.value = ''
      summary.value = null
      total.value = null
      pageNum.value = 0
      hasMore.value = false
    }
  } finally {
    if (version === requestVersion) loading.value = false
  }
}

const applyFilters = () => {
  const mobile = draft.mobile.trim()
  if (mobile && !/^(\d{4}|\d{11})$/.test(mobile)) {
    uni.showToast({ title: '请输入完整手机号或后四位', icon: 'none' })
    return
  }
  filters.value = { ...draft, mobile }
  loadRecords(true)
}

const selectStatus = (status: AgentInviteBenefitStatus | '') => {
  draft.benefitStatus = status
  applyFilters()
}

const resetFilters = () => {
  Object.assign(draft, emptyFilters())
  filters.value = emptyFilters()
  loadRecords(true)
}

// 触底自动加载，失败后由用户点击重试，避免重复报错。
const loadMore = () => {
  if (errorMessage.value) return
  loadRecords()
}

const retryLoad = () => {
  if (loading.value) return
  loadRecords(pageNum.value === 0)
}

const getRemainingTime = (record: AgentInviteRecord, currentTime: number) => {
  if (record.benefitStatus === 'USED') return '已使用'
  const remaining = new Date(record.expiresAt).getTime() - currentTime
  if (record.benefitStatus === 'EXPIRED' || remaining <= 0) return '已过期'
  return `剩余 ${Math.ceil(remaining / (24 * 60 * 60 * 1000))} 天`
}

const maskMobile = (mobile: string) => mobile.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2')
const displayTime = (time: string | null) => (time ? formatTimestamp(time, 2) : '--')
const showDetail = (record: AgentInviteRecord) => {
  uni.showModal({
    title: '邀请记录详情',
    content: `用户手机号：${maskMobile(record.mobile)}\n权益状态：${
      statusLabels[record.benefitStatus]
    }\n领取时间：${displayTime(record.claimedAt)}\n到期时间：${displayTime(
      record.expiresAt,
    )}\n使用时间：${displayTime(record.usedAt)}\n剩余有效时间：${getRemainingTime(
      record,
      now.value,
    )}`,
    showCancel: false,
    confirmText: '我知道了',
    confirmColor: '#d62731',
  })
}

onShow(() => {
  now.value = Date.now()
  loadRecords(true)
})
watch(
  () => userStore.profile?.id,
  () => {
    agentCode.value = ''
    summary.value = null
    loadRecords(true)
  },
)
onUnload(() => {
  requestVersion++
})
</script>

<template>
  <scroll-view
    class="invite-scroll"
    scroll-y
    :show-scrollbar="false"
    :lower-threshold="80"
    @scrolltolower="loadMore"
  >
    <view class="invite-page">
      <view class="overview">
        <view class="overview__header">
          <view>
            <view class="overview__eyebrow">我的代理邀请</view>
            <view class="overview__code"
              >邀请码 <text selectable>{{ agentCode || '--' }}</text></view
            >
          </view>
          <text class="overview__badge">代理专属</text>
        </view>
        <view class="statistics">
          <view
            v-for="item in statistics"
            :key="item.tone"
            class="statistic"
            :class="`statistic--${item.tone}`"
          >
            <view class="statistic__label">{{ item.label }}</view>
            <view class="statistic__value">{{ item.value }}<text>人</text></view>
          </view>
        </view>
        <view class="overview__note">仅统计通过该代理成功领取权益的用户</view>
      </view>

      <view class="filter-card">
        <view class="section-heading"
          ><text class="section-title">搜索筛选</text
          ><text class="section-hint">快速查找领取记录</text></view
        >
        <view class="search-field">
          <text class="search-field__label">手机号</text>
          <input
            v-model="draft.mobile"
            class="search-field__input"
            type="number"
            maxlength="11"
            placeholder="输入完整手机号或后四位"
            placeholder-class="input-placeholder"
            confirm-type="search"
            @confirm="applyFilters"
          />
          <button
            v-if="draft.mobile"
            class="clear-button"
            aria-label="清空手机号"
            @click="draft.mobile = ''"
          >
            ×
          </button>
        </view>
        <view class="status-tabs">
          <button
            v-for="item in statusOptions"
            :key="item.value"
            class="status-tab"
            :class="{ 'status-tab--active': filters.benefitStatus === item.value }"
            @click="selectStatus(item.value)"
          >
            {{ item.label }}
          </button>
        </view>
        <view class="filter-actions"
          ><button class="button button--secondary" @click="resetFilters">重置</button
          ><button class="button button--primary" @click="applyFilters">查询记录</button></view
        >
      </view>

      <view id="invite-records-list" class="records-section">
        <view class="section-heading">
          <view class="section-title"
            >邀请明细 <text v-if="total !== null" class="record-count">{{ total }} 条</text></view
          >
          <text class="section-hint">最新领取在前</text>
        </view>
        <view v-if="hasFilters" class="results-hint">已显示筛选结果 · 顶部统计为全部领取人数</view>
        <!-- 移动端以卡片明细呈现全部字段，避免横向滚动。 -->
        <view
          v-for="record in records"
          :key="record.claimId"
          class="record-card"
          hover-class="record-card--pressed"
          @click="showDetail(record)"
        >
          <view class="record-card__header">
            <view class="record-card__mobile">{{ maskMobile(record.mobile) }}</view>
            <text
              class="status-badge"
              :class="`status-badge--${record.benefitStatus.toLowerCase()}`"
              >{{ statusLabels[record.benefitStatus] }}</text
            >
          </view>
          <view class="detail-row"
            ><text>邀请 / 领取时间</text><text>{{ displayTime(record.claimedAt) }}</text></view
          >
          <view class="detail-row"
            ><text>权益到期时间</text><text>{{ displayTime(record.expiresAt) }}</text></view
          >
          <view class="detail-row"
            ><text>使用时间</text><text>{{ displayTime(record.usedAt) }}</text></view
          >
          <view class="record-card__footer">
            <text
              class="remaining"
              :class="{ 'remaining--available': record.benefitStatus === 'AVAILABLE' }"
              >{{ getRemainingTime(record, now) }}</text
            >
            <text class="record-card__more">查看详情 ›</text>
          </view>
        </view>
        <view v-if="loading && !records.length" class="empty-card">
          <view class="empty-card__description">正在加载邀请记录…</view>
        </view>
        <view v-else-if="errorMessage && !records.length" class="empty-card">
          <view class="empty-card__title">{{ errorMessage }}</view>
          <button class="button button--secondary" @click="retryLoad">重新加载</button>
        </view>
        <view v-else-if="!records.length" class="empty-card">
          <view class="empty-card__icon"><text class="iconfont icon-tuijian1"></text></view>
          <view class="empty-card__title">{{ emptyMessage }}</view>
          <view class="empty-card__description">{{
            hasFilters ? '请核对手机号，或调整权益状态' : '用户成功领取权益后，会在这里显示记录'
          }}</view>
          <button v-if="hasFilters" class="button button--secondary" @click="resetFilters">
            重置筛选
          </button>
        </view>
        <view v-if="records.length" class="load-more">
          <text v-if="loading">正在加载更多…</text>
          <view v-else-if="errorMessage">
            <view>{{ errorMessage }}</view>
            <button class="button button--secondary" @click="retryLoad">点击重试</button>
          </view>
          <text v-else>{{ hasMore ? '上拉加载更多' : '已加载全部记录' }}</text>
        </view>
      </view>
      <view class="page-footnote">邀请有记录，权益进度随时可查</view>
    </view>
  </scroll-view>
</template>

<style scoped lang="scss">
.invite-scroll {
  height: 100%;
  background: $jel-pageBackGroundColor;
}
.invite-page {
  min-height: 100%;
  box-sizing: border-box;
  padding: 24rpx 24rpx calc(32rpx + env(safe-area-inset-bottom));
  background: $jel-pageBackGroundColor;
  color: $jel-font-title;
  font-size: 26rpx;
  button {
    margin: 0;
    padding: 0;
    font-weight: 400;
    &::after {
      border: none;
    }
  }
}
.overview {
  padding: 30rpx;
  border-radius: 18rpx;
  background: #fff;
  color: $jel-font-title;
  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20rpx;
    > view {
      flex: 1;
      min-width: 0;
    }
  }
  &__eyebrow {
    font-size: 30rpx;
    font-weight: 600;
  }
  &__code {
    margin-top: 14rpx;
    font-size: 23rpx;
    color: $jel-font-dec2;
    word-break: break-all;
    text {
      margin-left: 12rpx;
      color: $jel-font-title;
    }
  }
  &__badge {
    flex-shrink: 0;
    background: #f5f5f5;
    color: $jel-font-dec2;
    padding: 6rpx 14rpx;
    border-radius: 6rpx;
    font-size: 21rpx;
  }
  &__note {
    margin-top: 22rpx;
    padding-top: 20rpx;
    border-top: 1rpx solid $jel-border;
    color: $jel-font-dec2;
    font-size: 22rpx;
    line-height: 1.5;
  }
}
.statistics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0;
  margin-top: 28rpx;
  border-top: 1rpx solid $jel-border;
}
.statistic {
  padding: 24rpx 20rpx;
  color: $jel-font-title;
  &:nth-child(odd) {
    padding-left: 0;
    border-right: 1rpx solid $jel-border;
  }
  &:nth-child(-n + 2) {
    border-bottom: 1rpx solid $jel-border;
  }
  &__label {
    color: $jel-font-dec2;
    font-size: 24rpx;
  }
  &__value {
    margin-top: 10rpx;
    font-size: 42rpx;
    font-weight: 600;
    line-height: 1.2;
    text {
      margin-left: 10rpx;
      color: $jel-font-dec2;
      font-size: 22rpx;
      font-weight: 400;
    }
  }
}
.filter-card {
  margin-top: 24rpx;
  padding: 28rpx;
  border-radius: 18rpx;
  background: #fff;
}
.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}
.section-title {
  font-size: 30rpx;
  font-weight: 600;
}
.section-hint {
  color: $jel-font-dec2;
  font-size: 22rpx;
}
.search-field {
  display: flex;
  align-items: center;
  gap: 18rpx;
  min-height: 84rpx;
  padding: 0 20rpx;
  margin-top: 26rpx;
  border-radius: 8rpx;
  background: #f8f8f8;
  &__label {
    flex-shrink: 0;
    font-size: 25rpx;
  }
  &__input {
    flex: 1;
    min-width: 0;
    height: 84rpx;
    font-size: 24rpx;
  }
  .clear-button {
    flex-shrink: 0;
    width: 48rpx;
    height: 60rpx;
    line-height: 60rpx;
    color: $jel-font-dec2;
    background: transparent;
    font-size: 36rpx;
  }
}
:deep(.input-placeholder) {
  color: #999;
  font-size: 24rpx;
}
.status-tabs {
  display: flex;
  gap: 12rpx;
  margin-top: 24rpx;
}
.status-tab {
  flex: 1;
  min-width: 0;
  height: 68rpx;
  line-height: 68rpx;
  border-radius: 8rpx;
  color: $jel-font-dec2;
  background: #f7f7f7;
  font-size: 24rpx;
  &--active {
    background: #fceeef;
    color: $jel-brandColor;
    font-weight: 600 !important;
  }
}
.filter-actions {
  display: flex;
  gap: 20rpx;
  margin-top: 28rpx;
  .button--secondary {
    flex: 1;
  }
  .button--primary {
    flex: 2;
  }
}
.button {
  height: 78rpx;
  line-height: 78rpx;
  border-radius: 10rpx;
  font-size: 26rpx;
  &--primary {
    background: $jel-brandColor;
    color: #fff;
  }
  &--secondary {
    color: $jel-font-dec2;
    background: #f7f7f7;
  }
}
.records-section {
  margin-top: 32rpx;
  scroll-margin-top: 24rpx;
}
.record-count {
  margin-left: 12rpx;
  color: $jel-brandColor;
  font-size: 24rpx;
  font-weight: 400;
}
.results-hint {
  margin-top: 14rpx;
  color: $jel-font-dec2;
  font-size: 22rpx;
}
.record-card {
  margin-top: 20rpx;
  padding: 26rpx 28rpx 0;
  border-radius: 14rpx;
  background: #fff;
  &--pressed {
    background: #fffafa;
  }
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16rpx;
    margin-bottom: 22rpx;
  }
  &__mobile {
    font-size: 32rpx;
    font-weight: 600;
    letter-spacing: 1rpx;
  }
  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top: 1rpx solid $jel-border;
    padding: 20rpx 0;
    margin-top: 20rpx;
  }
  &__more {
    color: $jel-font-dec2;
    font-size: 23rpx;
  }
}
.status-badge {
  flex-shrink: 0;
  padding: 7rpx 16rpx;
  border-radius: 6rpx;
  font-size: 22rpx;
  &--available {
    color: #21885b;
    background: #edf8f1;
  }
  &--used {
    color: #3679c6;
    background: #edf4fc;
  }
  &--expired {
    color: #787e88;
    background: #f2f3f5;
  }
}
.detail-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16rpx;
  margin-top: 14rpx;
  font-size: 23rpx;
  line-height: 1.5;
  text:first-child {
    flex-shrink: 0;
    color: $jel-font-dec2;
  }
  text:last-child {
    text-align: right;
  }
}
.remaining {
  color: #858a93;
  font-size: 23rpx;
  &--available {
    color: #21885b;
  }
}
.load-more {
  padding: 28rpx 0 8rpx;
  text-align: center;
  color: #999;
  font-size: 23rpx;
  .button {
    width: 220rpx;
    margin: 16rpx auto 0;
    color: $jel-brandColor;
    background: #fff;
  }
}
.empty-card {
  margin-top: 20rpx;
  padding: 56rpx 24rpx;
  border-radius: 14rpx;
  background: #fff;
  text-align: center;
  &__icon {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 90rpx;
    height: 90rpx;
    margin: 0 auto 24rpx;
    border-radius: 50%;
    background: #fceeef;
    color: $jel-brandColor;
    .iconfont {
      font-size: 42rpx;
    }
  }
  &__title {
    font-size: 28rpx;
    font-weight: 600;
  }
  &__description {
    color: $jel-font-dec2;
    font-size: 23rpx;
    margin-top: 14rpx;
    line-height: 1.6;
  }
  .button {
    width: 220rpx;
    margin: 28rpx auto 0;
    color: $jel-brandColor;
    background: #fff3f4;
  }
}
.page-footnote {
  margin-top: 24rpx;
  text-align: center;
  color: #aaa;
  font-size: 22rpx;
}
</style>
