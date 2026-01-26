<script setup lang="ts">
import { ref } from 'vue'
import { useMemberStore } from '@/stores'
import { onLoad } from '@dcloudio/uni-app'
import { formatAmount, formatTimestamp } from '@/utils/formatTimestamp.ts'
import type { FinanceRecords } from '@/types/FinanceRecords'
import { storeFlowGetApi } from '@/api/storeFlow.ts'
import { fundsSettlementAPi } from '@/api/user.ts'

// 流水类型的数据类型
type DirectionData = 'IN' | 'OUT' | 'ALL'

// 定义store
const userStore = useMemberStore()

// 获取安全区域
const { safeAreaInsets } = uni.getSystemInfoSync()

const params = ref({
  pageNum: 1,
  pageSize: 10,
})

// 当前门店流水列表
const finish = ref(false)
const loading = ref(false)
const storeFlowList = ref<FinanceRecords[]>([])
const storeFlowGet = async (
  userId: string,
  direction: DirectionData,
  pageNum: number,
  pageSize: number,
) => {
  loading.value = true
  if (finish.value) return

  const res = await storeFlowGetApi(userId, direction, pageNum, pageSize)
  console.log('请求结果', res.data)
  if (params.value.pageNum === 1) {
    storeFlowList.value = res.data.list
  } else {
    storeFlowList.value.push(...res.data.list)
  }

  if (params.value.pageNum < res.data.totalPage) {
    params.value.pageNum++
  } else {
    finish.value = true
  }
}

onLoad(() => {}) // 进页面重新拉取用户积分 即时更新积分

// tag列表
const tagList = ref([
  { id: 'tag1', text: 'ALL', label: '全部' },
  { id: 'tag2', text: 'IN', label: '收入' },
  { id: 'tag3', text: 'OUT', label: '支出' },
])

// 重置页码
const resetPage = () => {
  finish.value = false
  loading.value = false
  params.value.pageNum = 1
}

// 当前激活的tag
const activeTag = ref<DirectionData>('ALL')

// 切换tag
const handleTag = (tag: DirectionData) => {
  activeTag.value = tag
  if (userStore.profile?._id) {
    resetPage()
    storeFlowGet(userStore.profile._id, tag, params.value.pageNum, params.value.pageSize)
  }
}

// 触底加载更多
const handleScrolltolower = () => {
  storeFlowGet(userStore.profile._id, activeTag.value, params.value.pageNum, params.value.pageSize)
}

// 输入弹窗显示状态
const showInputModal = ref(false)
const inputAmount = ref('')

// 处理转入操作
const handleWithdraw = () => {
  inputAmount.value = ''
  showInputModal.value = true
}

// 确认转入
const confirmWithdraw = () => {
  const amount = parseFloat(inputAmount.value)
  console.log(amount)

  if (!amount || amount <= 0) {
    uni.showToast({
      title: '请输入有效的转入金额',
      icon: 'none',
    })
    return
  }

  if (amount < 100) {
    uni.showToast({
      icon: 'none',
      title: '转入金额必须大于100',
    })
    return
  }

  if (amount > (userStore.profile.settle_balance ?? 0) / 100) {
    uni.showToast({
      title: '转入金额不能超过待结算余额',
      icon: 'none',
    })
    return
  }

  uni.showModal({
    title: '确认转入',
    content: `确认将 ¥${amount.toFixed(2)} 转入运营资金？`,
    confirmColor: '#d62731',
    success: async (res) => {
      if (res.confirm) {
        //  调用转入API 提交金额时转换为分，统一单位
        const result = await fundsSettlementAPi(
          userStore.profile._id,
          Number((amount * 100).toFixed(2)),
        )
        console.log('执行转入操作，金额：', result, amount)
        if (result.code === 200) {
          await uni.showToast({
            title: '转入成功',
            icon: 'success',
          })
          showInputModal.value = false
          // 刷新用户数据
          if (userStore.profile?._id) {
            await userStore.userInfoGet(userStore.profile._id)
            console.log(activeTag.value)
          }

          // 获取门店最新流水信息
          resetPage()
          await storeFlowGet(
            userStore.profile._id,
            activeTag.value,
            params.value.pageNum,
            params.value.pageSize,
          )
        } else {
          await uni.showToast({ icon: 'none', title: '转入失败' })
        }
      }
    },
  })
}

// 取消转入
const cancelWithdraw = () => {
  showInputModal.value = false
  inputAmount.value = ''
}

// 处理金额输入
const handleAmountInput = (e: any) => {
  // 只允许输入数字和小数点
  let value = e.detail.value.replace(/[^\d.]/g, '')
  // 确保只有一个点
  const parts = value.split('.')
  if (parts.length > 2) {
    value = parts[0] + '.' + parts.slice(1).join('')
  }
  // 限制小数点后两位
  if (parts[1] && parts[1].length > 2) {
    value = parts[0] + '.' + parts[1].substring(0, 2)
  }
  inputAmount.value = value
}

// 格式化流水类型--映射字段
const formatFlowType = (type: any) => {
  const typeMap: Record<string, string> = {
    income_store: '门店收入',
    income_commission: '佣金收入',
    payout_withdraw: '提现',
    payout_product: '门店进货',
    refund: '退款',
    transfer_to_operating: '运营资金',
  }
  return typeMap[type as string] || type
}

onLoad(() => {
  if (userStore.profile?._id) {
    // 进页面获取最新的用户信息
    userStore.userInfoGet(userStore.profile._id)
    // 获取门店最新流水信息
    storeFlowGet(userStore.profile._id, 'ALL', params.value.pageNum, params.value.pageSize)
  }
})
</script>

<template>
  <view class="income-page">
    <!-- 收入总览卡片 -->
    <view class="income-summary">
      <view class="summary-card">
        <!-- 待结算余额和冻结金额 -->
        <view class="balance-item main">
          <view class="left">
            <view class="balance-icon">💰</view>
            <view class="balance-info">
              <text class="label">待结算余额</text>
              <text class="value">{{ formatAmount(userStore.profile.settle_balance ?? 0) }}</text>
            </view>
          </view>
          <view class="right">
            <view class="balance-icon">🔒</view>
            <view class="balance-info">
              <text class="label">冻结金额</text>
              <text class="value">{{ formatAmount(userStore.profile.lockedAmount ?? 0) }}</text>
            </view>
          </view>
        </view>

        <!-- 分割线 -->
        <view class="divider-line"></view>

        <!-- 运营资金和提现按钮 -->
        <view class="balance-item sub">
          <view class="balance-info-row">
            <view class="balance-icon-small">💳</view>
            <view class="balance-col">
              <text class="label">运营资金</text>
              <text class="value-small">{{
                formatAmount(userStore.profile.operating_balance ?? 0)
              }}</text>
            </view>
            <view class="action-btn" @click="handleWithdraw">
              <text class="btn-text">转入</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 筛选标签 -->
    <view class="filter-bar">
      <view
        class="tag"
        :class="{ active: activeTag === item.text }"
        v-for="item in tagList"
        :key="item.id"
        @click="handleTag(item.text as DirectionData)"
      >
        {{ item.label }}
      </view>
    </view>

    <!-- 门店流水明细列表 -->
    <scroll-view
      v-if="storeFlowList.length > 0"
      class="flow-list"
      :scroll-y="true"
      :style="{ paddingBottom: `calc(24rpx + ${safeAreaInsets?.bottom || 0}px)` }"
      @scrolltolower="handleScrolltolower"
    >
      <!-- 有数据 -->
      <view class="list-content">
        <view class="flow-item" v-for="item in storeFlowList" :key="item._id">
          <view class="item-left">
            <view class="source">{{ item.remark }}</view>
            <view class="detail-row">
              <text class="time">{{ formatTimestamp(item.created_at, 2) }}</text>
              <text class="type-tag">{{ formatFlowType(item.type) }}</text>
            </view>
          </view>
          <view class="item-right">
            <view
              class="amount"
              :class="{ income: item.direction === 'IN', expense: item.direction === 'OUT' }"
            >
              {{ item.direction === 'IN' ? '+' : '-' }}¥{{ Number(item.amount).toFixed(2) }}
            </view>
          </view>
        </view>
      </view>

      <!--   触底提示   -->
      <view class="tips" v-if="!finish">加载更多</view>
      <view class="tips" v-else>没有更多数据~</view>
    </scroll-view>
    <!-- 空状态 -->
    <view class="empty" v-else>
      <image class="empty-img" src="@/static/images/empty.png" mode="aspectFit"></image>
      <text class="empty-text">暂无流水明细</text>
    </view>

    <!-- 转入金额输入弹窗 -->
    <view class="input-modal-overlay" v-if="showInputModal" @click="cancelWithdraw">
      <view class="input-modal" @click.stop>
        <view class="modal-header">
          <text class="modal-title">转入金额</text>
        </view>
        <view class="modal-body">
          <view class="balance-info">
            <text class="balance-label">待结算余额：</text>
            <text class="balance-value">
              {{ formatAmount(userStore.profile.settle_balance ?? 0) }}
            </text>
          </view>
          <view class="input-section">
            <text class="input-label">转入金额</text>
            <view class="input-wrapper">
              <text class="currency-symbol">¥</text>
              <input
                class="amount-input"
                type="digit"
                v-model="inputAmount"
                placeholder="请输入转入金额"
                placeholder-style="color: #999;"
                @input="handleAmountInput"
              />
            </view>
          </view>
        </view>
        <view class="modal-footer">
          <view class="btn cancel-btn" @click="cancelWithdraw">取消</view>
          <view class="btn confirm-btn" @click="confirmWithdraw">确认转入</view>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.income-page {
  min-height: 100vh;
  background-color: $jel-pageBackGroundColor;
}

// 收入总览卡片
.income-summary {
  padding: 24rpx;
  background: linear-gradient(135deg, #ff9a56 0%, #ff6b6b 50%, $jel-brandColor 100%);

  .summary-card {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 20rpx;
    padding: 32rpx 24rpx;
    box-shadow: 0 8rpx 24rpx rgba(214, 39, 49, 0.15);

    // 主余额（待结算和冻结金额）
    .balance-item.main {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 24rpx;

      .left,
      .right {
        display: flex;
        align-items: center;
        gap: 8rpx;
        flex: 1;

        .balance-icon {
          font-size: 48rpx;
          line-height: 1;
          flex-shrink: 0;
        }

        .balance-info {
          display: flex;
          flex-direction: column;
          gap: 8rpx;
          align-items: center;

          .label {
            font-size: 26rpx;
            color: $jel-font-dec2;
          }

          .value {
            font-size: 44rpx;
            font-weight: bold;
            letter-spacing: 1rpx;
          }
        }
      }

      .left .balance-info .value {
        color: $jel-brandColor;
      }

      .right .balance-info .value {
        color: $jel-font-dec2;
      }
    }

    // 分割线
    .divider-line {
      height: 2rpx;
      background: linear-gradient(to right, transparent, $jel-border, transparent);
      margin: 0 -24rpx;
    }

    // 副余额（运营资金）
    .balance-item.sub {
      padding-top: 24rpx;

      .balance-info-row {
        display: flex;
        align-items: center;
        gap: 8rpx;

        .balance-icon-small {
          font-size: 48rpx;
          line-height: 1;
          flex-shrink: 0;
        }

        .balance-col {
          display: flex;
          flex-direction: column;
          gap: 8rpx;
          align-items: center;

          .label {
            font-size: 26rpx;
            color: $jel-font-dec2;
          }

          .value-small {
            font-size: 36rpx;
            font-weight: bold;
            color: $jel-font-title;
            letter-spacing: 1rpx;
          }
        }

        .action-btn {
          padding: 12rpx 32rpx;
          background-color: $jel-brandColor;
          border-radius: 32rpx;
          box-shadow: 0 4rpx 12rpx rgba(214, 39, 49, 0.3);
          flex-shrink: 0;
          margin-left: auto;

          .btn-text {
            font-size: 28rpx;
            color: #fff;
            font-weight: 500;
          }
        }
      }
    }
  }
}

// 筛选标签
.filter-bar {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 24rpx;
  background-color: #fff;
  margin-top: 16rpx;

  .tag {
    padding: 12rpx 32rpx;
    border-radius: 32rpx;
    font-size: 28rpx;
    color: $jel-font-dec2;
    background-color: $jel-pageBackGroundColor;
    transition: all 0.3s;

    &.active {
      color: #fff;
      background-color: $jel-brandColor;
    }
  }
}

// 门店流水明细列表
.flow-list {
  height: calc(100vh - 380rpx);
  padding: 0 24rpx;

  .list-content {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
    margin-top: 16rpx;
  }

  .flow-item {
    background-color: #fff;
    border-radius: 16rpx;
    padding: 24rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
    border-left: 4rpx solid transparent;
    transition: all 0.3s;

    &:active {
      transform: scale(0.98);
    }

    .item-left {
      display: flex;
      flex-direction: column;
      gap: 12rpx;
      flex: 1;
      min-width: 0;

      .source {
        font-size: 30rpx;
        color: $jel-font-title;
        font-weight: 500;
      }

      .detail-row {
        display: flex;
        align-items: center;
        gap: 16rpx;

        .time {
          font-size: 24rpx;
          color: $jel-font-dec;
        }

        .type-tag {
          font-size: 22rpx;
          color: $jel-brandColor;
          background-color: rgba(214, 39, 49, 0.08);
          padding: 4rpx 12rpx;
          border-radius: 8rpx;
        }
      }
    }

    .item-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      justify-content: center;
      flex-shrink: 0;

      .amount {
        font-size: 34rpx;
        font-weight: bold;
        letter-spacing: 1rpx;

        &.income {
          color: $jel-brandColor;
        }

        &.expense {
          color: $jel-font-success;
        }
      }
    }
  }

  /* 加载见底提示 */
  .tips {
    margin-top: 24rpx;
    text-align: center;
    color: $jel-font-dec;
    font-size: 24rpx;
  }
}

// 空状态
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;

  .empty-img {
    width: 300rpx;
    height: 300rpx;
    margin-bottom: 24rpx;
  }

  .empty-text {
    font-size: 28rpx;
    color: $jel-font-dec;
  }
}

// 转入金额输入弹窗
.input-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 0 40rpx;

  .input-modal {
    background-color: #fff;
    border-radius: 16rpx;
    width: 100%;
    max-width: 560rpx;
    overflow: hidden;

    .modal-header {
      padding: 40rpx 32rpx 20rpx;
      text-align: center;

      .modal-title {
        font-size: 36rpx;
        font-weight: 600;
        color: $jel-font-title;
      }
    }

    .modal-body {
      padding: 0 32rpx 40rpx;

      .balance-info {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 32rpx;
        padding: 24rpx 20rpx;
        background-color: #f8f9fa;
        border-radius: 12rpx;

        .balance-label {
          font-size: 28rpx;
          color: $jel-font-dec2;
        }

        .balance-value {
          font-size: 30rpx;
          font-weight: 600;
          color: $jel-brandColor;
        }
      }

      .input-section {
        .input-label {
          display: block;
          font-size: 28rpx;
          color: $jel-font-title;
          margin-bottom: 16rpx;
          font-weight: 500;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          border: 1rpx solid #e9ecef;
          border-radius: 12rpx;
          background-color: #f8f9fa;
          transition: border-color 0.2s;

          &:focus-within {
            border-color: $jel-brandColor;
            background-color: #fff;
          }

          .currency-symbol {
            font-size: 32rpx;
            color: $jel-font-dec2;
            margin: 0 12rpx;
          }

          .amount-input {
            flex: 1;
            height: 80rpx;
            font-size: 32rpx;
            color: $jel-font-title;
            border: none;
            outline: none;
            background: transparent;
            padding-right: 16rpx;

            &::placeholder {
              color: #adb5bd;
            }
          }
        }
      }
    }

    .modal-footer {
      display: flex;
      gap: 16rpx;
      padding: 32rpx;
      background-color: #fafbfc;
      border-top: 1rpx solid #f1f3f4;

      .btn {
        flex: 1;
        height: 84rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32rpx;
        font-weight: 600;
        border-radius: 16rpx;
        transition: all 0.2s ease;
        border: none;
        outline: none;
        position: relative;

        &.cancel-btn {
          color: #64748b;
          background-color: #ffffff;
          border: 1rpx solid #e2e8f0;

          &:active {
            background-color: #f8fafc;
            transform: translateY(1rpx);
          }
        }

        &.confirm-btn {
          color: #ffffff;
          background-color: $jel-brandColor;

          &:active {
            background-color: #c82333;
            transform: translateY(1rpx);
          }
        }
      }
    }
  }
}
</style>
