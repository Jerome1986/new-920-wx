<script setup lang="ts">
import { claimAgentInviteApi, getAgentInviteLandingApi } from '@/api/agentInvite'
import { useMemberStore } from '@/stores'
import type {
  AgentInviteClaimStatus,
  AgentInviteLandingResult,
  ClaimAgentInviteResult,
} from '@/types/AgentInvite'
import { formatTimestamp } from '@/utils/formatTimestamp'
import { onLoad } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'

interface PendingAgentInvite {
  agentCode: string
  createdAt: number
}

type InvitePageStatus = AgentInviteClaimStatus | 'INVALID'

const PENDING_AGENT_INVITE_KEY = 'pending-agent-invite'
const userStore = useMemberStore()
const agentCode = ref('')
const pageStatus = ref<InvitePageStatus>('CLAIMABLE')
const loading = ref(false)
const pageLoading = ref(false)
const loadFailed = ref(false)
const errorMessage = ref('')
const landingDetail = ref<AgentInviteLandingResult | null>(null)

// 判断当前邀请是否可以领取
const isClaimable = computed(() => pageStatus.value === 'CLAIMABLE' && Boolean(agentCode.value))

// 判断是否展示权益卡片
const showBenefitCard = computed(() =>
  ['CLAIMABLE', 'CLAIMED_AVAILABLE', 'CLAIMED_USED', 'CLAIMED_EXPIRED'].includes(pageStatus.value),
)

// 获取权益卡片角标
const benefitBadge = computed(() => {
  const badgeMap: Partial<Record<InvitePageStatus, string>> = {
    CLAIMABLE: '限时福利',
    CLAIMED_AVAILABLE: '已领取',
    CLAIMED_USED: '已使用',
    CLAIMED_EXPIRED: '已过期',
  }
  return badgeMap[pageStatus.value] || '限时福利'
})

// 获取权益卡片说明
const benefitDescription = computed(() => {
  if (pageStatus.value === 'CLAIMED_AVAILABLE') {
    return `有效期至 ${formatTimestamp(landingDetail.value?.claim?.expiresAt) || '--'}`
  }
  if (pageStatus.value === 'CLAIMED_USED') return '该免费贴膜权益已经使用'
  if (pageStatus.value === 'CLAIMED_EXPIRED') return '该免费贴膜权益已经过期'
  return `领取成功后 ${landingDetail.value?.validityDays || 30} 天内有效`
})

// 获取异常状态文案
const invalidContent = computed(() => {
  const contentMap: Partial<Record<InvitePageStatus, { title: string; description: string }>> = {
    SELF_INVITE: {
      title: '不能领取自己的邀请',
      description: '请将专属二维码分享给其他用户',
    },
    AGENT_UNAVAILABLE: {
      title: '邀请暂不可用',
      description: '该代理邀请不存在或已停用',
    },
    INVALID: {
      title: '邀请信息无效',
      description: '请重新扫描代理商分享的二维码',
    },
  }
  return contentMap[pageStatus.value] || contentMap.INVALID!
})

// 读取待处理的代理邀请
const getPendingAgentInvite = (): PendingAgentInvite | null => {
  const value = uni.getStorageSync(PENDING_AGENT_INVITE_KEY) as
    | PendingAgentInvite
    | string
    | undefined
  if (!value) return null

  try {
    return typeof value === 'string' ? (JSON.parse(value) as PendingAgentInvite) : value
  } catch (error) {
    console.warn('代理邀请缓存解析失败', error)
    return null
  }
}

// 提取接口错误信息
const getErrorMessage = (error: any) => {
  const message = error?.data?.message || error?.message
  if (Array.isArray(message)) return message.join(',')
  return typeof message === 'string' ? message : '加载失败，请重试'
}

// 根据领取结果生成页面数据
const applyClaimResult = (result: ClaimAgentInviteResult) => {
  const statusMap = {
    AVAILABLE: 'CLAIMED_AVAILABLE',
    USED: 'CLAIMED_USED',
    EXPIRED: 'CLAIMED_EXPIRED',
  } as const

  const claimStatus = statusMap[result.benefitStatus]
  agentCode.value = result.agentCode
  pageStatus.value = claimStatus
  landingDetail.value = {
    agentCode: result.agentCode,
    claimStatus,
    rewardCount: result.rewardCount,
    validityDays: 30,
    claim: {
      claimId: result.claimId,
      claimedAt: result.claimedAt,
      expiresAt: result.expiresAt,
      benefitStatus: result.benefitStatus,
    },
  }
}

// 查询代理邀请详情
const loadInviteDetail = async () => {
  if (!agentCode.value) {
    pageStatus.value = 'INVALID'
    return
  }

  const userId = userStore.profile.id
  if (!userId) {
    uni.redirectTo({
      url: `/pages/login/login?agentCode=${encodeURIComponent(agentCode.value)}`,
    })
    return
  }

  pageLoading.value = true
  loadFailed.value = false
  errorMessage.value = ''
  try {
    const res = await getAgentInviteLandingApi(agentCode.value, userId)
    landingDetail.value = res.data
    agentCode.value = res.data.agentCode
    pageStatus.value = res.data.claimStatus

    if (res.data.claimStatus.startsWith('CLAIMED_')) {
      uni.removeStorageSync(PENDING_AGENT_INVITE_KEY)
    }
  } catch (error) {
    loadFailed.value = true
    errorMessage.value = getErrorMessage(error)
  } finally {
    pageLoading.value = false
  }
}

// 处理免费贴膜领取
const handleClaim = async () => {
  if (!isClaimable.value || loading.value) return

  const userId = userStore.profile.id
  if (!userId) {
    uni.redirectTo({
      url: `/pages/login/login?agentCode=${encodeURIComponent(agentCode.value)}`,
    })
    return
  }

  loading.value = true
  errorMessage.value = ''
  try {
    const res = await claimAgentInviteApi({
      agentCode: agentCode.value,
      userId,
    })
    applyClaimResult(res.data)
    uni.removeStorageSync(PENDING_AGENT_INVITE_KEY)

    await uni.showToast({
      icon: res.data.result === 'GRANTED' ? 'success' : 'none',
      title: res.data.result === 'GRANTED' ? '领取成功' : '该福利已领取',
    })
    await loadInviteDetail()
  } catch (error: any) {
    errorMessage.value = getErrorMessage(error)
    if (error?.statusCode === 404) {
      pageStatus.value = 'AGENT_UNAVAILABLE'
    } else if (error?.statusCode === 409) {
      await loadInviteDetail()
    }
  } finally {
    loading.value = false
  }
}

// 返回小程序首页
const goHome = () => {
  uni.switchTab({ url: '/pages/home/home' })
}

// 初始化代理邀请页面
onLoad(async (options) => {
  const pendingInvite = getPendingAgentInvite()
  agentCode.value = String(options?.agentCode || pendingInvite?.agentCode || '').trim()
  await loadInviteDetail()
})
</script>

<template>
  <view class="agent-invite">
    <view class="hero">
      <view class="hero__glow hero__glow--left"></view>
      <view class="hero__glow hero__glow--right"></view>
      <view class="hero__eyebrow">920 专属福利</view>
      <view class="hero__title">免费贴膜 · 焕新屏幕</view>
      <view class="hero__subtitle">好友为你送上一份贴心守护</view>
    </view>

    <view class="content">
      <view v-if="pageLoading" class="state-card">
        <view class="state-card__spinner"></view>
        <view class="state-card__title">正在查询领取状态</view>
      </view>

      <view v-else-if="loadFailed" class="state-card">
        <view class="invalid-card__icon">!</view>
        <view class="state-card__title">加载失败</view>
        <view class="state-card__desc">{{ errorMessage }}</view>
        <button class="retry-button" @click="loadInviteDetail">重新加载</button>
      </view>

      <view v-else-if="showBenefitCard" class="benefit-card">
        <view class="benefit-card__badge">{{ benefitBadge }}</view>
        <view class="benefit-card__main">
          <view class="benefit-card__count">{{ landingDetail?.rewardCount || 1 }}</view>
          <view class="benefit-card__info">
            <view class="benefit-card__title">免费贴膜权益</view>
            <view class="benefit-card__desc">{{ benefitDescription }}</view>
          </view>
        </view>
        <view class="benefit-card__line"></view>
        <view class="benefit-card__code">邀请编号：{{ agentCode }}</view>
      </view>

      <view v-else class="invalid-card">
        <view class="invalid-card__icon">!</view>
        <view class="invalid-card__title">{{ invalidContent.title }}</view>
        <view class="invalid-card__desc">{{ invalidContent.description }}</view>
      </view>

      <view class="feature-card">
        <view class="section-title">福利说明</view>
        <view class="feature-list">
          <view class="feature-item">
            <view class="feature-item__index">1</view>
            <view class="feature-item__content">
              <view class="feature-item__title">免费领取</view>
              <view class="feature-item__desc">每位用户仅可领取一次代理赠送福利</view>
            </view>
          </view>
          <view class="feature-item">
            <view class="feature-item__index">2</view>
            <view class="feature-item__content">
              <view class="feature-item__title">到店使用</view>
              <view class="feature-item__desc">领取后前往附近920服务门店使用</view>
            </view>
          </view>
          <view class="feature-item">
            <view class="feature-item__index">3</view>
            <view class="feature-item__content">
              <view class="feature-item__title">30天有效</view>
              <view class="feature-item__desc">有效期自领取成功时间开始计算</view>
            </view>
          </view>
        </view>
      </view>

      <view class="tips">{{ errorMessage || '本活动最终领取资格以系统校验结果为准' }}</view>
    </view>

    <view class="toolbar">
      <button
        v-if="isClaimable && !loadFailed"
        class="claim-button"
        :loading="loading"
        :disabled="loading"
        @click="handleClaim"
      >
        {{ loading ? '领取中...' : '立即领取' }}
      </button>
      <button
        v-else-if="!pageLoading && !loadFailed"
        class="claim-button claim-button--plain"
        @click="goHome"
      >
        返回首页
      </button>
    </view>
  </view>
</template>

<style scoped lang="scss">
.agent-invite {
  min-height: 100vh;
  padding-bottom: calc(148rpx + env(safe-area-inset-bottom));
  background: $jel-pageBackGroundColor;
  color: $jel-font-title;
}

.hero {
  position: relative;
  height: 340rpx;
  padding: 72rpx 48rpx 0;
  overflow: hidden;
  color: #ffffff;
  background: linear-gradient(145deg, #bd1721 0%, $jel-brandColor 55%, #ef5a61 100%);

  &__glow {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.12);

    &--left {
      left: -100rpx;
      bottom: -120rpx;
      width: 300rpx;
      height: 300rpx;
    }

    &--right {
      right: -70rpx;
      top: -100rpx;
      width: 260rpx;
      height: 260rpx;
    }
  }

  &__eyebrow {
    display: inline-flex;
    position: relative;
    padding: 8rpx 20rpx;
    border: 1rpx solid rgba(255, 255, 255, 0.45);
    border-radius: 24rpx;
    background: rgba(255, 255, 255, 0.12);
    font-size: 24rpx;
  }

  &__title {
    position: relative;
    margin-top: 28rpx;
    font-size: 48rpx;
    font-weight: 600;
    letter-spacing: 2rpx;
  }

  &__subtitle {
    position: relative;
    margin-top: 16rpx;
    color: rgba(255, 255, 255, 0.82);
    font-size: 26rpx;
  }
}

.content {
  position: relative;
  margin-top: -66rpx;
  padding: 0 24rpx;
}

.benefit-card,
.invalid-card,
.state-card,
.feature-card {
  border-radius: 18rpx;
  background: #ffffff;
  box-shadow: 0 10rpx 30rpx rgba(81, 30, 33, 0.06);
}

.state-card {
  padding: 54rpx 32rpx;
  text-align: center;

  &__spinner {
    width: 64rpx;
    height: 64rpx;
    margin: 0 auto;
    border: 6rpx solid #f3d5d7;
    border-top-color: $jel-brandColor;
    border-radius: 50%;
    animation: invite-loading 0.8s linear infinite;
  }

  &__title {
    margin-top: 24rpx;
    font-size: 30rpx;
    font-weight: 600;
  }

  &__desc {
    margin-top: 12rpx;
    color: $jel-font-dec;
    font-size: 24rpx;
  }
}

.retry-button {
  width: 220rpx;
  height: 68rpx;
  margin-top: 28rpx;
  border: 1rpx solid $jel-brandColor;
  border-radius: 34rpx;
  color: $jel-brandColor;
  background: #ffffff;
  font-size: 26rpx;
  line-height: 68rpx;
}

@keyframes invite-loading {
  to {
    transform: rotate(360deg);
  }
}

.benefit-card {
  position: relative;
  padding: 42rpx 32rpx 28rpx;
  overflow: hidden;
  border: 1rpx solid rgba(214, 39, 49, 0.12);

  &__badge {
    position: absolute;
    right: 0;
    top: 0;
    padding: 10rpx 22rpx;
    border-radius: 0 18rpx 0 18rpx;
    color: #ffffff;
    background: $jel-brandColor;
    font-size: 22rpx;
  }

  &__main {
    display: flex;
    align-items: center;
  }

  &__count {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 116rpx;
    height: 116rpx;
    border-radius: 50%;
    color: #ffffff;
    background: linear-gradient(145deg, #ef6269, $jel-brandColor);
    box-shadow: 0 10rpx 20rpx rgba(214, 39, 49, 0.2);
    font-size: 64rpx;
    font-weight: 600;
  }

  &__info {
    margin-left: 28rpx;
  }

  &__title {
    font-size: 36rpx;
    font-weight: 600;
  }

  &__desc {
    margin-top: 12rpx;
    color: $jel-font-dec2;
    font-size: 24rpx;
  }

  &__line {
    margin: 30rpx 0 20rpx;
    border-top: 1rpx dashed $jel-border;
  }

  &__code {
    color: $jel-font-dec;
    font-size: 22rpx;
  }
}

.invalid-card {
  padding: 54rpx 32rpx;
  text-align: center;

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 88rpx;
    height: 88rpx;
    margin: 0 auto;
    border-radius: 50%;
    color: #ffffff;
    background: #cccccc;
    font-size: 48rpx;
  }

  &__title {
    margin-top: 24rpx;
    font-size: 32rpx;
    font-weight: 600;
  }

  &__desc {
    margin-top: 12rpx;
    color: $jel-font-dec;
    font-size: 24rpx;
  }
}

.feature-card {
  margin-top: 24rpx;
  padding: 30rpx 32rpx;
}

.section-title {
  position: relative;
  padding-left: 18rpx;
  font-size: 30rpx;
  font-weight: 600;

  &::before {
    position: absolute;
    left: 0;
    top: 5rpx;
    width: 6rpx;
    height: 30rpx;
    border-radius: 4rpx;
    background: $jel-brandColor;
    content: '';
  }
}

.feature-list {
  margin-top: 30rpx;
}

.feature-item {
  display: flex;
  align-items: center;
  margin-bottom: 30rpx;

  &:last-child {
    margin-bottom: 0;
  }

  &__index {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    width: 56rpx;
    height: 56rpx;
    border-radius: 50%;
    color: $jel-brandColor;
    background: #fff0f1;
    font-size: 26rpx;
    font-weight: 600;
  }

  &__content {
    margin-left: 22rpx;
  }

  &__title {
    font-size: 28rpx;
  }

  &__desc {
    margin-top: 6rpx;
    color: $jel-font-dec;
    font-size: 23rpx;
  }
}

.tips {
  padding: 24rpx 0;
  text-align: center;
  color: $jel-font-dec;
  font-size: 22rpx;
}

.toolbar {
  position: fixed;
  z-index: 10;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 20rpx 32rpx calc(20rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid $jel-border;
  background: rgba(255, 255, 255, 0.96);
}

.claim-button {
  width: 100%;
  height: 88rpx;
  border-radius: 44rpx;
  color: #ffffff;
  background: $jel-brandColor;
  font-size: 30rpx;
  line-height: 88rpx;

  &[disabled] {
    color: rgba(255, 255, 255, 0.8);
    background: #e47c82;
  }

  &--plain {
    color: $jel-brandColor;
    border: 1rpx solid $jel-brandColor;
    background: #ffffff;
  }
}
</style>
