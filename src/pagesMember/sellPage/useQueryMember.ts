import { ref } from 'vue'
import { checkVipApi } from '@/api/order.ts'

/**
 * 会员查询 Composable
 * 每次调用返回独立的状态，避免单例问题
 */
export const useQueryMember = () => {
  const memberPhone = ref('') // 会员手机号
  const memberQueryLoading = ref(false) // 查询中
  const memberFreeCount = ref(0) // 会员免费次数
  const memberChecked = ref(false) // 会员是否已查询
  const orderPrice = ref('0') // 订单价格

  // 查询会员免费次数
  const handleQueryMember = async (price: string) => {
    memberQueryLoading.value = true
    try {
      // 调用查询会员免费次数接口
      const res = await checkVipApi(memberPhone.value)
      console.log('检查结果', res)
      memberFreeCount.value = res.data.totalAvailable
      // 查询成功即视为已查询（无免费次数也不应阻断后续流程）
      memberChecked.value = true

      if (memberFreeCount.value > 0) {
        orderPrice.value = '0' // 有免费次数，价格为0
        await uni.showToast({ title: `用户有${memberFreeCount.value}次免费机会`, icon: 'success' })
      } else {
        orderPrice.value = price // 无免费次数，恢复原价
        await uni.showToast({ title: '用户无免费次数', icon: 'none' })
      }
    } catch (e: any) {
      console.error('查询会员失败', e.data)
      await uni.showToast({ title: e.data.message ?? '查询失败，请重试', icon: 'none' })
    } finally {
      memberQueryLoading.value = false
    }
  }

  // 重置会员查询状态
  const resetQueryMember = () => {
    memberPhone.value = ''
    memberChecked.value = false
    memberFreeCount.value = 0
    memberQueryLoading.value = false
  }

  // 清除会员状态（切换为非会员时调用）
  const clearMemberState = (price: string) => {
    memberPhone.value = ''
    memberChecked.value = false
    memberFreeCount.value = 0
    orderPrice.value = price
  }

  // 初始化价格
  const initPrice = (price: string) => {
    orderPrice.value = price
  }

  return {
    // 状态
    memberPhone,
    memberQueryLoading,
    memberFreeCount,
    memberChecked,
    orderPrice,
    // 方法
    handleQueryMember,
    resetQueryMember,
    clearMemberState,
    initPrice,
  }
}
