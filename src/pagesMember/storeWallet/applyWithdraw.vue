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

// 最低提现金额
const minWithdrawAmount = ref(100)

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
    Number(form.value.amount) >= minWithdrawAmount.value &&
    // Number(form.value.amount) <= Number(availableBalance.value || 0) &&
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
    <!-- 提现说明 -->
    <view class="summary">
      <text class="summary__label">可提现金额</text>
      <view class="summary__amount">
        <text class="summary__amount-prefix">¥</text>
        <text class="summary__amount-value">{{ availableBalanceText }}</text>
      </view>
      <text class="summary__hint"
        >单笔提现金额需大于等于 {{ minWithdrawAmount }} 元，请勿超过可提现金额</text
      >
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

    <!-- 提交提示 -->
    <view class="notice">
      <view class="notice__mark" />
      <text class="notice__text">提交后平台将进行审核，审核通过后按平台规则打款。</text>
    </view>

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
  min-height: 100vh;
  padding: 24rpx;
  padding-bottom: calc(140rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
  background: linear-gradient(180deg, #f0f0f0 0%, $jel-pageBackGroundColor 240rpx);
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

.notice {
  margin-top: 24rpx;
  padding: 22rpx 24rpx;
  border-radius: 12rpx;
  background: rgba(214, 39, 49, 0.06);
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
}

.notice__mark {
  width: 6rpx;
  height: 28rpx;
  margin-top: 4rpx;
  flex-shrink: 0;
  border-radius: 4rpx;
  background: $jel-brandColor;
}

.notice__text {
  flex: 1;
  font-size: 24rpx;
  line-height: 1.5;
  color: #8a5a5d;
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
