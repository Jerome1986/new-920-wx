import type { FormItem } from '@/types/Apply'
// 验证手机号码函数
export const validateForm = (form: FormItem) => {
  if (!form.userId || !form.name || !form.icCardFont || !form.icCardBack) {
    uni.showToast({
      title: '请填写完整信息',
      icon: 'error',
    })
    return false
  }

  // 基础验证：确保是字符串且不为空
  if (!form.mobile.trim()) {
    uni.showToast({
      title: '电话不可以为空',
      icon: 'error',
    })
    return false
  }

  // 去除可能的空格和特殊字符（如+86前缀）
  const cleanedMobile = form.mobile.trim().replace(/\s+/g, '').replace(/^\+86/, '') // 移除国际区号前缀

  // 中国手机号正则表达式
  // 目前主要号段：
  // 移动：134-139, 147, 150-152, 157-159, 172, 178, 182-184, 187-188, 195, 198
  // 联通：130-132, 145, 155-156, 166, 171, 175-176, 185-186, 196
  // 电信：133, 149, 153, 173-174, 177, 180-181, 189, 190-191, 193, 199
  // 虚拟运营商：170, 162
  const mobilePattern = /^1(3[0-9]|4[5-9]|5[0-35-9]|6[2-6]|7[0-8]|8[0-9]|9[0-35-9])\d{8}$/
  if (!mobilePattern.test(cleanedMobile)) {
    uni.showToast({
      title: '电话不符合规范',
      icon: 'error',
    })
    return false
  }

  return true
}

// 验证用户会员是否过期
export const isVipExpired = (vipEndTime: string | Date): boolean => {
  const now = new Date()
  const end = new Date(vipEndTime)
  return now > end
}
