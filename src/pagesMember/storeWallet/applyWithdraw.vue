<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useMemberStore } from '@/stores'
import { formatAmount } from '@/utils/formatTimestamp'
import { walletWithdrawApplyApi } from '@/api/wallet'
import type { WalletWithdrawApplyForm } from '@/types/Wallet'

// 获取系统安全区
const { safeAreaInsets } = uni.getSystemInfoSync()

// 定义用户 store
const userStore = useMemberStore()

// 提现申请表单
const form = ref<WalletWithdrawApplyForm>({
  userId: userStore.profile.id,
  amount: '',
  payeeName: '',
  payeeAccount: '',
  bankName: '',
})

// 可提现金额
const availableBalance = ref('0')

// 是否正在提交
const isSubmitting = ref(false)

// 可提现金额展示
const availableBalanceText = computed(() => {
  // 当前可提现金额
  const amount = Number(availableBalance.value || 0)
  return formatAmount(amount)
})

// 是否可提交
const canSubmit = computed(() => {
  return (
    !isSubmitting.value &&
    Boolean(form.value.userId) &&
    Number(form.value.amount) > 0 &&
    Number(form.value.amount) <= Number(availableBalance.value || 0) &&
    Boolean(form.value.payeeName.trim()) &&
    Boolean(form.value.payeeAccount.trim()) &&
    Boolean(form.value.bankName.trim())
  )
})

// 处理提交申请
const handleSubmit = async () => {
  if (!canSubmit.value) {
    await uni.showToast({
      icon: 'none',
      title: '请完善提现信息',
    })
    return
  }

  isSubmitting.value = true

  try {
    await uni.showLoading({
      title: '提交中...',
      mask: true,
    })

    const res = await walletWithdrawApplyApi(
      form.value.userId,
      Number(form.value.amount),
      form.value.payeeName,
      form.value.payeeAccount,
      form.value.bankName,
    )

    console.log('handleSubmitWithdrawApply', res)

    await uni.showToast({
      icon: 'success',
      title: '申请已提交',
      duration: 1500,
    })

    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    console.error('handleSubmitWithdrawApplyError', error)
  } finally {
    isSubmitting.value = false
    uni.hideLoading()
  }
}

// 页面加载处理
onLoad((options) => {
  availableBalance.value = String(options?.availableBalance || '0')
})
</script>

<template>
  <view class="page">
    <scroll-view class="page-scroll" scroll-y :show-scrollbar="false">
      <view
        class="page-content"
        :style="{ paddingBottom: `calc(140rpx + ${safeAreaInsets?.bottom || 0}px)` }"
      >
        <!-- 提现说明 -->
        <view class="summary">
          <text class="summary__label">可提现金额</text>
          <view class="summary__amount">
            <text class="summary__amount-prefix">¥</text>
            <text class="summary__amount-value">{{ availableBalanceText }}</text>
          </view>
          <text class="summary__hint">提现金额不限起提金额，单笔不得超过可提现金额</text>
        </view>

        <!-- 提现表单 -->
        <view class="form-card">
          <view class="form-item">
            <text class="form-label">提现金额</text>
            <view class="form-control">
              <text class="form-prefix">¥</text>
              <input
                class="form-input form-input--amount"
                type="digit"
                placeholder="请输入提现金额"
                v-model="form.amount"
              />
            </view>
          </view>

          <view class="form-item">
            <text class="form-label">收款人姓名</text>
            <input
              class="form-input"
              v-model="form.payeeName"
              :maxlength="30"
              placeholder="请输入收款人姓名"
            />
          </view>

          <view class="form-item">
            <text class="form-label">银行卡号</text>
            <input
              class="form-input"
              v-model="form.payeeAccount"
              :maxlength="80"
              placeholder="请输入银行卡号"
            />
          </view>

          <view class="form-item">
            <text class="form-label">开户行</text>
            <input
              class="form-input"
              v-model="form.bankName"
              :maxlength="80"
              placeholder="请输入开户行"
            />
          </view>
        </view>

        <!-- 提现规则 -->
        <view class="rules-card">
          <view class="rules-title">
            <view class="rules-title__mark" />
            <text>提现规则</text>
          </view>
          <view class="rules-item">
            <text class="rules-item__index">1</text>
            <text class="rules-item__text"
              >可提现额度：页面展示金额为当前可提现额度，不设最低提现金额，单笔提现不得超过可提现额度。</text
            >
          </view>
          <view class="rules-item">
            <text class="rules-item__index">2</text>
            <text class="rules-item__text"
              >提现次数：每个账户每日最多可提交 3 次提现申请，请合理安排提现次数。</text
            >
          </view>
          <view class="rules-item">
            <text class="rules-item__index">3</text>
            <text class="rules-item__text"
              >提现时间：每日均可提交申请；非工作时间提交的申请，将顺延至下一工作日处理。</text
            >
          </view>
          <view class="rules-item">
            <text class="rules-item__index">4</text>
            <text class="rules-item__text"
              >到账时间：申请审核通过后，预计 1–3
              个工作日到账，具体时间以收款银行处理进度为准。</text
            >
          </view>
          <view class="rules-item">
            <text class="rules-item__index">5</text>
            <text class="rules-item__text"
              >收款信息：请确保收款人姓名、银行卡号及开户行信息真实准确；因信息错误导致的失败或延迟，由申请人承担。</text
            >
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 底部提交 -->
    <view class="toolbar" :style="{ paddingBottom: safeAreaInsets?.bottom + 'px' }">
      <button
        class="submit-btn"
        :class="{ 'is-disabled': !canSubmit }"
        :disabled="!canSubmit"
        type="default"
        @click="handleSubmit"
      >
        提交申请
      </button>
    </view>
  </view>
</template>

<style scoped lang="scss">
.page {
  height: 100vh;
  overflow: hidden;
  box-sizing: border-box;
  background: linear-gradient(180deg, #f0f0f0 0%, $jel-pageBackGroundColor 240rpx);
}

.page-scroll {
  height: 100%;
}

.page-content {
  padding: 24rpx;
  box-sizing: border-box;
}

.summary {
  margin-bottom: 24rpx;
  padding: 36rpx 28rpx;
  border-radius: 20rpx;
  background: linear-gradient(145deg, $jel-brandColor 0%, #e02030 48%, #ff5a67 100%);
  box-shadow: 0 12rpx 32rpx rgba(214, 39, 49, 0.24);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.summary__label {
  margin-bottom: 12rpx;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.82);
}

.summary__amount {
  display: flex;
  align-items: baseline;
  color: #ffffff;
  font-weight: 700;
}

.summary__amount-prefix {
  font-size: 32rpx;
  margin-right: 4rpx;
}

.summary__amount-value {
  font-size: 56rpx;
  line-height: 1.2;
}

.summary__hint {
  margin-top: 14rpx;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.76);
}

.form-card {
  padding: 0 24rpx;
  border-radius: 16rpx;
  background: #ffffff;
  box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.05);
}

.form-item {
  min-height: 112rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
  border-bottom: 1rpx solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
}

.form-label {
  width: 180rpx;
  flex-shrink: 0;
  font-size: 28rpx;
  color: $jel-font-title;
}

.form-control {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
}

.form-prefix {
  margin-right: 8rpx;
  font-size: 30rpx;
  color: $jel-brandColor;
  font-weight: 600;
}

.form-input {
  flex: 1;
  min-width: 0;
  height: 72rpx;
  text-align: right;
  font-size: 28rpx;
  color: $jel-font-title;
}

.form-input--amount {
  text-align: left;
  font-size: 32rpx;
  font-weight: 600;
  color: $jel-brandColor;
}

.rules-card {
  margin-top: 24rpx;
  padding: 26rpx 24rpx;
  border-radius: 16rpx;
  background: #ffffff;
  box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.05);
}

.rules-title {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
  font-size: 28rpx;
  font-weight: 600;
  color: $jel-font-title;
}

.rules-title__mark {
  width: 6rpx;
  height: 30rpx;
  margin-right: 12rpx;
  flex-shrink: 0;
  border-radius: 4rpx;
  background: $jel-brandColor;
}

.rules-item {
  display: flex;
  align-items: flex-start;
  margin-top: 14rpx;
}

.rules-item__index {
  width: 30rpx;
  height: 30rpx;
  margin-top: 3rpx;
  margin-right: 12rpx;
  flex-shrink: 0;
  border-radius: 50%;
  background: rgba(214, 39, 49, 0.1);
  color: $jel-brandColor;
  font-size: 20rpx;
  line-height: 30rpx;
  text-align: center;
}

.rules-item__text {
  flex: 1;
  font-size: 24rpx;
  line-height: 1.65;
  color: $jel-font-dec2;
}

.toolbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  padding: 16rpx 24rpx var(--window-bottom);
  box-sizing: content-box;
  background: #ffffff;
  border-top: 1rpx solid #eeeeee;
}

.submit-btn {
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 48rpx;
  border: none;
  background: $jel-brandColor;
  color: #ffffff;
  font-size: 30rpx;
  font-weight: 600;

  &::after {
    border: none;
  }

  &.is-disabled {
    background: #d8d8d8;
    color: #ffffff;
  }
}
</style>
