<script setup lang="ts">
import { getMyAgentInviteBenefitApi } from '@/api/agentInvite'
import { useMemberStore } from '@/stores'
import type { MyAgentInviteBenefit } from '@/types/AgentInvite'
import { formatTimestamp } from '@/utils/formatTimestamp'
import { onLoad } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'

const userStore = useMemberStore()
const loading = ref(false)
const loadFailed = ref(false)
const errorMessage = ref('')
const benefit = ref<MyAgentInviteBenefit | null>(null)

// 获取代理权益状态文案
const statusText = computed(() => {
  if (benefit.value?.status === 'AVAILABLE') return '可使用'
  if (benefit.value?.status === 'USED') return '已使用'
  if (benefit.value?.status === 'EXPIRED') return '已过期'
  return '暂无权益'
})

// 获取接口错误信息
const getErrorMessage = (error: any) => {
  const message = error?.data?.message || error?.message
  if (Array.isArray(message)) return message.join(',')
  return typeof message === 'string' ? message : '加载失败，请重试'
}

// 查询当前用户的代理邀请免费贴膜权益
const loadFreeFilmBenefits = async () => {
  const userId = userStore.profile.id
  if (!userId) {
    uni.navigateTo({ url: '/pages/login/login' })
    return
  }

  loading.value = true
  loadFailed.value = false
  errorMessage.value = ''
  try {
    const res = await getMyAgentInviteBenefitApi(userId)
    benefit.value = res.data
  } catch (error) {
    loadFailed.value = true
    errorMessage.value = getErrorMessage(error)
  } finally {
    loading.value = false
  }
}

// 返回我的页面
const goBack = () => {
  uni.navigateBack()
}

// 初始化免费贴膜权益页面
onLoad(() => {
  loadFreeFilmBenefits()
})
</script>

<template>
  <view class="free-film-benefit">
    <view class="summary-card">
      <view class="summary-card__glow"></view>
      <view class="summary-card__label">代理邀请赠送</view>
      <view class="summary-card__value">{{ benefit?.availableCount || 0 }}<text>次</text></view>
      <view class="summary-card__desc">免费贴膜权益 · {{ statusText }}</view>
    </view>

    <view v-if="loading" class="empty-card">
      <view class="loading-icon"></view>
      <view class="empty-card__title">正在查询权益</view>
    </view>

    <view v-else-if="loadFailed" class="empty-card">
      <view class="empty-card__icon empty-card__icon--disabled">!</view>
      <view class="empty-card__title">权益加载失败</view>
      <view class="empty-card__desc">{{ errorMessage }}</view>
      <button class="retry-button" @click="loadFreeFilmBenefits">重新加载</button>
    </view>

    <view v-else-if="benefit" class="detail-card">
      <view class="detail-card__title">权益详情</view>
      <view class="detail-row">
        <text class="detail-row__label">当前状态</text>
        <text class="detail-row__value detail-row__value--highlight">{{ statusText }}</text>
      </view>
      <view class="detail-row">
        <text class="detail-row__label">领取时间</text>
        <text class="detail-row__value">{{ formatTimestamp(benefit.claimedAt, 2) }}</text>
      </view>
      <view class="detail-row">
        <text class="detail-row__label">到期时间</text>
        <text class="detail-row__value">{{ formatTimestamp(benefit.expiresAt, 2) }}</text>
      </view>
      <view v-if="benefit.usedAt" class="detail-row">
        <text class="detail-row__label">使用时间</text>
        <text class="detail-row__value">{{ formatTimestamp(benefit.usedAt, 2) }}</text>
      </view>
      <view class="detail-card__tip">到店后向工作人员提供注册手机号即可使用</view>
    </view>

    <view v-else class="empty-card">
      <view class="empty-card__icon">
        <text class="iconfont icon-zengsong"></text>
      </view>
      <view class="empty-card__title">暂无代理赠送权益</view>
      <view class="empty-card__desc">通过代理邀请二维码可领取1次免费贴膜</view>
    </view>

    <button class="back-button" @click="goBack">返回我的</button>
  </view>
</template>

<style scoped lang="scss">
.free-film-benefit {
  min-height: 100vh;
  padding: 24rpx;
  background: $jel-pageBackGroundColor;
  color: $jel-font-title;
}

.summary-card {
  position: relative;
  height: 260rpx;
  padding: 40rpx;
  overflow: hidden;
  border-radius: 18rpx;
  color: #ffffff;
  background: linear-gradient(135deg, #bd1721 0%, $jel-brandColor 55%, #eb5a61 100%);

  &__glow {
    position: absolute;
    right: -80rpx;
    top: -100rpx;
    width: 300rpx;
    height: 300rpx;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.12);
  }

  &__label,
  &__value,
  &__desc {
    position: relative;
  }

  &__label {
    color: rgba(255, 255, 255, 0.82);
    font-size: 26rpx;
  }

  &__value {
    margin-top: 12rpx;
    font-size: 72rpx;
    font-weight: 600;

    text {
      margin-left: 8rpx;
      font-size: 28rpx;
      font-weight: 400;
    }
  }

  &__desc {
    margin-top: 4rpx;
    color: rgba(255, 255, 255, 0.82);
    font-size: 24rpx;
  }
}

.empty-card {
  margin-top: 24rpx;
  padding: 64rpx 32rpx 48rpx;
  border-radius: 18rpx;
  background: #ffffff;
  text-align: center;

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 96rpx;
    height: 96rpx;
    margin: 0 auto;
    border-radius: 50%;
    color: $jel-brandColor;
    background: #fceeef;

    .iconfont {
      font-size: 48rpx;
    }

    &--disabled {
      color: #ffffff;
      background: #cccccc;
      font-size: 44rpx;
    }
  }

  &__title {
    margin-top: 28rpx;
    font-size: 30rpx;
    font-weight: 600;
  }

  &__desc {
    margin-top: 14rpx;
    color: $jel-font-dec2;
    font-size: 24rpx;
    line-height: 1.6;
  }

  &__tip {
    margin-top: 30rpx;
    padding: 20rpx;
    border-radius: 8rpx;
    color: $jel-font-dec2;
    background: $jel-pageBackGroundColor;
    font-size: 23rpx;
  }
}

.loading-icon {
  width: 64rpx;
  height: 64rpx;
  margin: 0 auto;
  border: 6rpx solid #f3d5d7;
  border-top-color: $jel-brandColor;
  border-radius: 50%;
  animation: benefit-loading 0.8s linear infinite;
}

.detail-card {
  margin-top: 24rpx;
  padding: 30rpx 32rpx;
  border-radius: 18rpx;
  background: #ffffff;

  &__title {
    padding-bottom: 24rpx;
    border-bottom: 1rpx solid $jel-border;
    font-size: 30rpx;
    font-weight: 600;
  }

  &__tip {
    margin-top: 24rpx;
    padding: 20rpx;
    border-radius: 8rpx;
    color: $jel-font-dec2;
    background: $jel-pageBackGroundColor;
    font-size: 23rpx;
    text-align: center;
  }
}

.detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22rpx 0;
  border-bottom: 1rpx dashed $jel-border;

  &__label {
    color: $jel-font-dec2;
    font-size: 26rpx;
  }

  &__value {
    color: $jel-font-title;
    font-size: 26rpx;

    &--highlight {
      color: $jel-brandColor;
      font-weight: 600;
    }
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

@keyframes benefit-loading {
  to {
    transform: rotate(360deg);
  }
}

.back-button {
  width: 100%;
  height: 88rpx;
  margin-top: 32rpx;
  border: 1rpx solid $jel-brandColor;
  border-radius: 44rpx;
  color: $jel-brandColor;
  background: #ffffff;
  font-size: 28rpx;
  line-height: 88rpx;
}
</style>
