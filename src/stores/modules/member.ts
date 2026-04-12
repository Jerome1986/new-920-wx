import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { UserItem } from '@/types/UserItem'
import { userInfoGetApi } from '@/api/user.ts'

// 定义 Store
export const useMemberStore = defineStore(
  'user',
  () => {
    const DEFAULT_USERINFO: UserItem = {
      id: '',
      openid: '',
      nickname: '',
      avatarUrl: '',
      mobile: '',
      gender: 0,
      role: 'USER',
      status: 'ACTIVE',
      referralCode: '',
      inviterCode: '',
      inviter2Code: '',
      myCodeUrl: '',
      score: 0,
      operating_balance: 0,
      settle_balance: 0,
      lockedAmount: 0,
      avatarUpdateCount: 3,
    }
    // 会员信息
    const profile = ref<UserItem>({ ...DEFAULT_USERINFO })
    const token = ref('')
    const setToken = (t: string) => {
      token.value = t
    }
    // 保存会员信息，登录时使用
    const setProfile = (val: any) => {
      profile.value = { ...profile.value, ...val }
    }

    // 清理会员信息，退出时使用
    const clearProfile = () => {
      console.log('quit')

      profile.value = { ...DEFAULT_USERINFO }
    }

    // 获取用户信息
    const userInfoGet = async (userId: string) => {
      const res = await userInfoGetApi(userId)
      console.log('拉取用户信息', res.data)
      profile.value = res.data
    }

    // 记得 return
    return {
      profile,
      token,
      setToken,
      setProfile,
      clearProfile,
      userInfoGet,
    }
  },
  {
    // 网页端配置
    // persist: true,
    // 小程序端配置
    persist: {
      storage: {
        getItem(key) {
          return uni.getStorageSync(key)
        },
        setItem(key, value) {
          uni.setStorageSync(key, value)
        },
      },
    },
  },
)
