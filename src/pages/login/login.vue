<script setup lang="ts">
import { wxLoginApi } from '@/services/login.ts'
import { useMemberStore } from '@/stores'
import { onLoad } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { isVipExpired } from '@/utils/validate.ts'

// 定义store
const userStore = useMemberStore()

interface PendingAgentInvite {
  agentCode: string
  createdAt: number
}

const PENDING_AGENT_INVITE_KEY = 'pending-agent-invite'
const AGENT_INVITE_LANDING_PATH = '/pages/agentInvite/landing'
// 代理邀请领取页是否已启用
const AGENT_INVITE_LANDING_ENABLED = true

// 获取参数-原推荐邀请码与代理邀请码相互独立
const inviterCode = ref('')
const agentCode = ref('')

// 保存待处理的代理邀请信息
const savePendingAgentInvite = (code: string) => {
  const pendingInvite: PendingAgentInvite = {
    agentCode: code,
    createdAt: Date.now(),
  }
  uni.setStorageSync(PENDING_AGENT_INVITE_KEY, pendingInvite)
}

// 跳转到代理邀请领取页面
const redirectToAgentInviteLanding = () => {
  if (!AGENT_INVITE_LANDING_ENABLED || !agentCode.value) return false

  uni.redirectTo({
    url: `${AGENT_INVITE_LANDING_PATH}?agentCode=${encodeURIComponent(agentCode.value)}`,
  })
  return true
}

// 解析小程序码中的场景参数
const parseSceneParams = (sceneValue?: string) => {
  if (!sceneValue) return new Map<string, string>()

  try {
    const decodedScene = decodeURIComponent(sceneValue)
    const entries = decodedScene
      .split('&')
      .map((item) => item.split('='))
      .filter(([key]) => Boolean(key))
      .map(([key, ...valueParts]) => [key, valueParts.join('=')] as const)

    return new Map(entries)
  } catch (error) {
    console.warn('二维码 scene 参数解析失败', error)
    return new Map<string, string>()
  }
}

// 协议开关
const agree = ref(false)

// 单选框--隐私协议
const onAgreeChange = (e: any) => {
  console.log('agree', e)
  // 小程序 checkbox 变更值在 e.detail.value（数组）
  agree.value = (e?.detail?.value || []).includes('agree')
  console.log('agree', agree.value)
}

// 同意协议
const showAgreementModal = () => {
  console.log('showAgreementModal', agree.value)
  if (!agree.value) {
    uni.showToast({ icon: 'none', duration: 2000, mask: true, title: '请先阅读并勾选用户协议' })
  }
}

// 获取手机号凭证返回类型
type GetPhoneNumberEvent = {
  detail: {
    code?: string
    errMsg?: string
  }
}
// 手机登录
const handleLogin = async (e: GetPhoneNumberEvent) => {
  console.log('handleMobileLogin', e)

  if (!agree.value) {
    uni.showToast({ icon: 'none', title: '请先阅读并勾选用户协议' })
    return
  }

  const phoneCode = e.detail.code

  if (!phoneCode) {
    uni.showToast({ icon: 'none', title: '未获取到手机号授权凭证' })
    console.error('getPhoneNumber 未返回 code', e)
    return
  }

  const loginRes = await uni.login()

  if (!loginRes.code) {
    uni.showToast({ icon: 'none', title: '获取微信登录凭证失败' })
    return
  }

  try {
    const wxRes = await wxLoginApi(loginRes.code, phoneCode, inviterCode.value)

    console.log('wxMobileLoginApi 返回', wxRes)

    if (wxRes.code === 200 && wxRes.data) {
      const userRes = wxRes.data

      if (
        userRes.user.role === 'VIP' &&
        userRes.user.vipEndTime &&
        isVipExpired(userRes.user.vipEndTime)
      ) {
        userRes.user.role = 'USER'
      }

      userStore.setProfile(userRes.user)
      userStore.setToken(userRes.token)

      uni.showToast({
        icon: 'success',
        title: '登录成功',
        duration: 1000,
      })

      setTimeout(() => {
        if (redirectToAgentInviteLanding()) return
        uni.switchTab({ url: '/pages/home/home' })
      }, 1000)
    } else {
      uni.showToast({
        icon: 'none',
        title: wxRes.message || '登录失败，请稍后重试',
      })
    }
  } catch (err) {
    uni.showToast({ icon: 'none', title: '请求异常，请检查网络' })
    console.error('调用登录接口异常', err)
  }
}

// 刷新CODE
const freshCode = ref('')

// 初始化登录页参数和微信登录凭证
onLoad(async (options: any) => {
  console.log('入参', options)
  // 进页面就重新获取code，防止过期
  uni.login({
    success: async (res) => {
      freshCode.value = res.code + '' // 强制触发一次新的 code
      if (!freshCode.value) {
        await uni.showToast({ icon: 'none', title: '获取code失败' })
        console.error('uni.login 获取code失败', res)
        return
      }
    },
    fail: (err) => {
      uni.showToast({ icon: 'none', title: '微信登录失败' })
      console.error('login 失败', err)
    },
  })

  const sceneParams = parseSceneParams(options.scene)

  // 原推荐邀请码逻辑保持不变：普通链接优先，其次读取二维码参数。
  if (options.inviterCode) {
    inviterCode.value = options.inviterCode
  } else if (sceneParams.has('inviterCode')) {
    inviterCode.value = sceneParams.get('inviterCode') || ''
  }

  // 代理邀请码仅用于后续领取流程，不参与原推荐关系和登录接口。
  agentCode.value = options.agentCode || sceneParams.get('agentCode') || ''
  if (agentCode.value) {
    savePendingAgentInvite(agentCode.value)

    // 当前开关关闭，不会跳转到尚未创建的领取页。
    if (userStore.profile.id && userStore.token) {
      redirectToAgentInviteLanding()
    }
  }

  // 如果依旧没有邀请码，说明没人邀请
  if (!inviterCode.value) {
    console.log('无邀请码，正常进入')
    return
  }
})
</script>

<template>
  <view class="login">
    <!-- logo -->
    <view class="logo">
      <image src="/static/images/logo.png" mode="aspectFit"></image>
    </view>

    <!-- 登录区域 -->
    <view class="login-area">
      <!-- 用户协议 -->
      <view class="agreement">
        <checkbox-group @change="onAgreeChange">
          <label>
            <checkbox value="agree" :checked="agree" />
            <text class="text">我已阅读并同意</text>
          </label>
        </checkbox-group>
        <navigator
          class="agreement-link"
          url="/pages/agreement/user-agreement/user-agreement"
          open-type="navigate"
          hover-class="agreement-link--active"
        >
          <text class="link">《用户协议》</text>
        </navigator>
        <text class="text">及</text>
        <navigator
          class="agreement-link"
          url="/pages/agreement/privacy-policy/privacy-policy"
          open-type="navigate"
          hover-class="agreement-link--active"
        >
          <text class="link">《隐私政策》</text>
        </navigator>
      </view>

      <!-- 登录按钮 -->
      <view class="login-btn">
        <button v-show="!agree" class="btn" @tap="showAgreementModal">手机号快捷登录</button>
        <button
          v-show="agree"
          class="btn"
          type="primary"
          open-type="getPhoneNumber"
          @getphonenumber="handleLogin"
        >
          手机号快捷登录
        </button>
      </view>
    </view>
  </view>
</template>

<style lang="scss">
.login {
  min-height: 100vh;
  background: linear-gradient(180deg, #fff 0%, #f5f5f5 100%);
  padding: 120rpx 32rpx 0;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  /* 左侧半圆 */
  &::before {
    content: '';
    position: absolute;
    left: -150rpx;
    top: 350rpx;
    width: 300rpx;
    height: 300rpx;
    border-radius: 50%;
    background: radial-gradient(
      circle at center,
      rgba(255, 235, 236, 0.8) 0%,
      rgba(255, 235, 236, 0.6) 30%,
      rgba(255, 235, 236, 0.3) 60%,
      rgba(255, 235, 236, 0) 100%
    );
    z-index: 1;
  }

  /* 右侧半圆 */
  &::after {
    content: '';
    position: absolute;
    right: -150rpx;
    top: 120rpx;
    width: 300rpx;
    height: 300rpx;
    border-radius: 50%;
    background: radial-gradient(
      circle at center,
      rgba(255, 235, 236, 0.8) 0%,
      rgba(255, 235, 236, 0.6) 30%,
      rgba(255, 235, 236, 0.3) 60%,
      rgba(255, 235, 236, 0) 100%
    );
    z-index: 1;
  }

  /* logo */
  .logo {
    position: relative;
    z-index: 2;
    display: flex;
    justify-content: center;
    margin-top: 80rpx;

    image {
      width: 274rpx;
      height: 274rpx;
    }
  }

  /* 登录区域 */
  .login-area {
    position: relative;
    z-index: 2;
    margin-top: auto;
    padding-bottom: 220rpx; // 调整为220rpx

    /* 用户协议 */
    .agreement {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 32rpx;
      font-size: 24rpx;

      checkbox {
        transform: scale(0.7);
        margin-right: 4rpx;
      }

      .text {
        color: #999;
      }

      .link {
        color: $jel-brandColor;
      }

      .agreement-link {
        display: inline-flex;
        align-items: center;
      }

      .agreement-link--active {
        opacity: 0.65;
      }
    }

    /* 登录按钮 */
    .login-btn {
      .btn {
        width: 100%;
        height: 88rpx;
        line-height: 88rpx;
        background-color: $jel-brandColor;
        border-radius: 44rpx;
        font-size: 32rpx;
        color: #fff;
      }
    }
  }
}
</style>
