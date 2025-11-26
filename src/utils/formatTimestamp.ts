// utils.js
export function padZero(num: any) {
  return num < 10 ? '0' + num : num
}

// 格式化时间
export function formatTimestamp(timestamp: any, type = 1) {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = padZero(date.getMonth() + 1) // 月份是从0开始的，所以需要+1
  const day = padZero(date.getDate())
  const hours = padZero(date.getHours())
  const minutes = padZero(date.getMinutes())
  const seconds = padZero(date.getSeconds())
  if (type === 1) return `${year}-${month}-${day}`
  if (type === 2) return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 性别转换
export const formatGender = (gender: number) => {
  switch (gender) {
    case 1:
      return '男'
    case 2:
      return '女'
    default:
      return '未知'
  }
}

// 订单状态转换
export const formatOrderState = (state: string) => {
  switch (state) {
    case 'PENDING':
      return '待支付'
    case 'PAID':
      return '已支付'
    case 'CANCELLED':
      return '已取消'
    case 'REFUNDED':
      return '已退款'
    default:
      return '全部'
  }
}

// 角色转换
export const formatRole = (role: string, vipLevel: number = 0): string => {
  const vipMap: Record<number, string> = {
    1: '基础会员',
    2: '高级会员',
    3: '至尊会员',
  }

  if (role === 'user') return '普通用户'
  if (role === 'vip') return vipMap[vipLevel] || '会员'
  if (role === 'manager') return '店长'
  if (role === 'admin') return '管理员'

  return '未知角色'
}

// 获取当前年月日
export const getRecentMonths = (n: number) => {
  const result: { value: string; text: string }[] = []
  const now = new Date()
  let year = now.getFullYear()
  let month = now.getMonth() + 1

  for (let i = 0; i < n; i++) {
    const val = `${year}-${month.toString().padStart(2, '0')}`
    const txt = `${year}年${month.toString().padStart(2, '0')}月`

    result.push({ value: val, text: txt })

    month--
    if (month === 0) {
      month = 12
      year--
    }
  }

  return result
}
