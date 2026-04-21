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
      memberFreeCount.value = res.data.remainTimes
      memberChecked.value = res.data.isValid

      if (memberFreeCount.value > 0) {
        orderPrice.value = '0' // 有免费次数，价格为0
        await uni.showToast({ title: `会员有${memberFreeCount.value}次免费机会`, icon: 'success' })
      } else {
        orderPrice.value = price // 无免费次数，恢复原价
        await uni.showToast({ title: '会员无免费次数', icon: 'none' })
      }
    } catch (e) {
      console.error('查询会员失败', e)
      await uni.showToast({ title: '查询失败，请重试', icon: 'none' })
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
