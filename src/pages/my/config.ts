import { useMemberStore } from '@/stores'

/// 用户功能配置
const userData = [
  { icon: 'icon-shouyi1', name: '我的积分' },
  { icon: 'icon-shenqing1', name: '我的订单' },
  { icon: 'icon-tuijian1', name: '我的推荐' },
  { icon: 'icon-huiyuan', name: '会员权益' },
]

// 店长功能配置
const managerData = [
  { icon: 'icon-shouyi1', name: '我的积分' },
  { icon: 'icon-shenqing1', name: '我的订单' },
  { icon: 'icon-tuijian1', name: '我的推荐' },
  { icon: 'icon-huiyuan', name: '门店管理' },
]

// 用户点击功能区域
export const userHandleClickGird = (val: string) => {
  // 点击功能
  switch (val) {
    case '我的积分':
      console.log('我的积分')
      uni.navigateTo({
        url: '/pagesMember/myScore/myScore',
      })
      break
    case '我的订单':
      console.log('我的订单')
      uni.navigateTo({
        url: '/pagesMember/myOrder/myOrder',
      })
      break
    case '我的推荐':
      console.log('我的推荐')
      uni.navigateTo({
        url: '/pagesMember/myFriends/myFriends',
      })
      break
    case '会员权益':
      console.log('会员权益')
      uni.navigateTo({
        url: '/pagesMember/myVip/myVip',
      })
      break
  }
}

// 店长点击功能区域
export const managerHandleClickGird = (val: string) => {
  // 点击功能
  switch (val) {
    case '我的积分':
      console.log('我的积分')
      uni.navigateTo({
        url: '/pagesMember/myScore/myScore',
      })
      break
    case '我的订单':
      console.log('我的订单')
      uni.navigateTo({
        url: '/pagesMember/myOrder/myOrder',
      })
      break
    case '我的推荐':
      console.log('我的推荐')
      uni.navigateTo({
        url: '/pagesMember/myFriends/myFriends',
      })
      break
    case '门店管理':
      console.log('门店管理')
      uni.redirectTo({
        url: '/pagesMember/StoreManager/StoreManager',
      })
      break
  }
}

// 功能区配置函数，根据用户身份配置不同的功能
export const configData = () => {
  // 在函数内部获取 store，确保 Pinia 已初始化
  const userStore = useMemberStore()
  if (userStore.profile.role === 'user' || userStore.profile.role === 'vip') {
    return userData
  } else if (userStore.profile.role === 'manager') {
    return managerData
  }
}
