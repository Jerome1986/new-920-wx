import type { freeOrderStatus } from '@/types/Order'

export const quickOrderStatusConfig: Record<
  freeOrderStatus,
  { text: string; color: string; bgColor: string }
> = {
  PENDING: {
    text: '已支付',
    color: '#d62731',
    bgColor: 'linear-gradient(135deg, #d62731 0%, #e84545 100%)',
  },
  PAID: {
    text: '已支付',
    color: '#d62731',
    bgColor: 'linear-gradient(135deg, #d62731 0%, #e84545 100%)',
  },
  IN_SERVICE: {
    text: '服务中',
    color: '#d62731',
    bgColor: 'linear-gradient(135deg, #d62731 0%, #e84545 100%)',
  },
  COMPLETED: {
    text: '已完成',
    color: '#52c41a',
    bgColor: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
  },
  CANCELLED: {
    text: '已取消',
    color: '#999',
    bgColor: 'linear-gradient(135deg, #999 0%, #bfbfbf 100%)',
  },
  REFUNDED: {
    text: '已取消',
    color: '#999',
    bgColor: 'linear-gradient(135deg, #999 0%, #bfbfbf 100%)',
  },
}
