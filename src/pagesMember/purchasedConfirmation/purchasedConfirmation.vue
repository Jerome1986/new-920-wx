<script setup lang="ts">
import { computed } from 'vue'
import { useCartTobStore, useManagerStore, useMemberStore, useRateStore } from '@/stores'
import type { OrderAmount, OrderProductItem, OrderUserInfo } from '@/types/Order'
import { purchaseOrderAddApi } from '@/api/purchase.ts'
import { formatAmount } from '@/utils/formatTimestamp.ts'

// 安全距离
const { safeAreaInsets } = uni.getSystemInfoSync()

// 定义store
const cartTobStore = useCartTobStore()
const userStore = useMemberStore()
const rateStore = useRateStore()
const managerStore = useManagerStore()
// 可抵扣金额
const deductAmount = computed(() => {
  const totalYuan = cartTobStore.totalPrice || 0
  const totalCent = Math.floor(totalYuan * 100)

  const rules = rateStore.rateRules
  const userScore = Math.max(0, userStore.profile?.score || 0)

  if (rules && typeof rules.maxUsePercent === 'number' && typeof rules.useRate === 'number') {
    // 最大可抵扣（分）
    const maxDeductCent = Math.floor(totalCent * rules.maxUsePercent)

    // 积分可抵扣（分）
    const scoreDeductCent = Math.floor(userScore * rules.useRate * 100)

    // 实际可用（分）
    const canUseCent = Math.min(maxDeductCent, scoreDeductCent)

    // ⚠️ 关键：直接取整元
    return Math.floor(canUseCent / 100)
  }

  return 0
})

// 实际支付金额
const needPay = computed(() => {
  return cartTobStore.totalPrice - deductAmount.value
})

// 确认订单提交入库
const submit = async () => {
  console.log('提交订单', cartTobStore.selectProduct)

  // 当前订单的用户信息
  const userInfo: OrderUserInfo = {
    userId: userStore.profile._id,
    nickname: userStore.profile.nickname || '',
    role: userStore.profile.role,
    mobile: userStore.profile.mobile,
  }

  // 当前订单的商品
  const products: OrderProductItem[] = cartTobStore.selectProduct.map((item) => {
    const { selected, ...rest } = item
    return rest
  })

  // 商品金额信息
  const amount: OrderAmount = {
    totalPrice: Number(cartTobStore.totalPrice.toFixed(2)),
    deductAmount: Number(deductAmount.value.toFixed(2)),
    actualPayment: Number(needPay.value.toFixed(2)),
    usedScore: Number(deductAmount.value.toFixed(2)),
  }

  // 提示下单
  uni.showModal({
    title: '提示',
    content: '确定提交订单吗？',
    confirmColor: '#d62731',
    success: async (result) => {
      // 用户点击取消，不做任何操作
      if (!result.confirm) return

      // 检查门店ID是否存在
      if (!managerStore.managerStoreInfo?.storeId) {
        await uni.showToast({ icon: 'none', title: '门店信息异常' })
        await uni.reLaunch({ url: '/pagesMember/StoreManager/StoreManager' })
        return
      }

      //  调用API提交订单
      const res = await purchaseOrderAddApi(
        managerStore.managerStoreInfo.storeId,
        userInfo,
        products,
        cartTobStore.totalCount,
        amount,
        '采购货物',
      )

      if (res.code === 200) {
        // 更新运营资金余额
        userStore.setProfile({ operating_balance: res.data.operating_balance })
        // 提示
        await uni.showToast({
          icon: 'success',
          title: '下单成功',
        })

        //  返回到门店管理页面
        setTimeout(() => {
          cartTobStore.clearSelectedCart() // 清空购物车
          uni.reLaunch({ url: '/pagesMember/StoreManager/StoreManager' })
        }, 800)
      }
    },
  })
}
</script>

<template>
  <scroll-view class="confirmOrder" :scroll-y="true" :enhanced="true" :show-scrollbar="false">
    <!-- 商品列表 -->
    <view class="product-list">
      <view class="list-header">
        <text class="iconfont icon-a-ziyuan1"></text>
        <text class="title">商品清单</text>
        <text class="count">({{ cartTobStore.totalCount }}件)</text>
      </view>

      <view class="product-item" v-for="item in cartTobStore.selectProduct" :key="item._id">
        <!-- 封面图 -->
        <image class="cover" :src="item.sku?.image || item.cover" mode="aspectFill"></image>

        <!-- 商品信息 -->
        <view class="info">
          <view class="left">
            <!-- 商品名称 -->
            <view class="name">{{ item.skuNo }} {{ item.name }}</view>

            <!-- SKU规格 -->
            <view class="spec" v-if="item.sku">
              {{ item.sku.attrs.label }}: {{ item.sku.attrs.value }}
            </view>

            <!-- 商品描述 -->
            <view class="desc">型号：{{ item.dec }}</view>
          </view>

          <view class="right">
            <!-- 价格 -->
            <view class="price">{{ formatAmount(item.currentPrice) }}</view>
            <!-- 数量 -->
            <view class="quantity">x{{ item.quantity }}</view>
          </view>
        </view>
      </view>
    </view>

    <!-- 金额明细 -->
    <view class="amount-detail">
      <view class="title">金额明细</view>
      <view class="item">
        <text class="label">商品金额</text>
        <text class="value">{{ formatAmount(cartTobStore.totalPrice) }}</text>
      </view>
      <view class="item">
        <text class="label">运营资金</text>
        <text class="value">{{ formatAmount(userStore.profile.operating_balance ?? 0) }}</text>
      </view>
      <view class="item">
        <text class="label">剩余积分</text>
        <text class="value">{{ ((userStore.profile.score ?? 0) / 100).toFixed(2) }}</text>
      </view>
      <!-- 当前可抵扣的积分 -->
      <view class="item">
        <text class="label">可抵积分</text>
        <text class="value" style="color: #d62731">{{ (deductAmount / 100).toFixed(2) }}</text>
      </view>
      <view class="item total">
        <text class="label">合计</text>
        <text class="value">{{ formatAmount(needPay) }}</text>
      </view>
    </view>

    <!-- 底部占位 -->
    <view
      class="toolbar-placeholder"
      :style="{ height: `calc(100rpx + ${safeAreaInsets?.bottom || 0}px)` }"
    ></view>
  </scroll-view>

  <!-- 底部工具栏 -->
  <view class="toolbar">
    <view class="toolbar-content">
      <view class="left">
        <text class="label">实际支付:</text>
        <text class="amount">{{ formatAmount(needPay) }}</text>
      </view>
      <button class="btn" @click="submit">结算</button>
    </view>
    <!-- 安全区域 -->
    <view class="safe-area" :style="{ height: safeAreaInsets?.bottom + 'px' }"></view>
  </view>
</template>

<style scoped lang="scss">
.confirmOrder {
  height: 100%;
  padding: 24rpx;
  background-color: $jel-pageBackGroundColor;

  // 商品列表
  .product-list {
    margin-bottom: 24rpx;
    padding: 24rpx;
    background-color: #fff;
    border-radius: 8rpx;

    .list-header {
      display: flex;
      align-items: center;
      margin-bottom: 24rpx;
      padding-bottom: 16rpx;
      border-bottom: 1px solid $jel-border;

      .iconfont {
        margin-right: 8rpx;
        font-size: 32rpx;
        color: $jel-brandColor;
      }

      .title {
        font-size: 28rpx;
        font-weight: bold;
        color: $jel-font-title;
      }

      .count {
        margin-left: 8rpx;
        font-size: 24rpx;
        color: $jel-font-dec2;
      }
    }

    .product-item {
      display: flex;
      gap: 16rpx;
      margin-bottom: 24rpx;

      &:last-child {
        margin-bottom: 0;
      }

      .cover {
        width: 160rpx;
        height: 160rpx;
        border-radius: 8rpx;
        flex-shrink: 0;
        object-fit: cover;
      }

      .info {
        flex: 1;
        display: flex;
        justify-content: space-between;
        min-width: 0;

        .left {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8rpx;
          min-width: 0;

          .name {
            font-size: 28rpx;
            font-weight: 500;
            color: $jel-font-title;
            word-break: break-all;
            overflow-wrap: anywhere;
            @include ellipsis(2);
          }

          .spec {
            font-size: 24rpx;
            color: $jel-font-dec2;
            background-color: #f5f5f5;
            padding: 4rpx 12rpx;
            border-radius: 4rpx;
            width: fit-content;
          }

          .desc {
            font-size: 24rpx;
            color: $jel-font-dec;
            @include ellipsis(1);
          }
        }

        .right {
          margin-left: 16rpx;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: flex-end;
          flex-shrink: 0;

          .price {
            font-size: 32rpx;
            font-weight: bold;
            color: $jel-brandColor;

            &::before {
              content: '';
              font-size: 24rpx;
            }
          }

          .quantity {
            font-size: 24rpx;
            color: $jel-font-dec;
          }
        }
      }
    }
  }

  // 金额明细
  .amount-detail {
    margin-bottom: 24rpx;
    padding: 24rpx;
    background-color: #fff;
    border-radius: 8rpx;

    .title {
      margin-bottom: 16rpx;
      padding-bottom: 16rpx;
      font-size: 28rpx;
      font-weight: bold;
      color: $jel-font-title;
      border-bottom: 1px solid $jel-border;
    }

    .item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12rpx 0;
      font-size: 28rpx;

      .label {
        color: $jel-font-dec2;
      }

      .value {
        color: $jel-font-title;
      }

      &.total {
        padding-top: 16rpx;
        margin-top: 8rpx;
        border-top: 1px dashed $jel-border;

        .label {
          font-weight: bold;
          color: $jel-font-title;
        }

        .value {
          font-size: 36rpx;
          font-weight: bold;
          color: $jel-brandColor;
        }
      }
    }
  }

  // 底部占位
  .toolbar-placeholder {
    flex-shrink: 0;
  }
}

// 底部工具栏
.toolbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  border-top: 2rpx solid $jel-border;
  box-shadow: 0 -4rpx 12rpx rgba(0, 0, 0, 0.02);
  z-index: 999;

  .toolbar-content {
    height: 100rpx;
    padding: 0 24rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-sizing: border-box;

    .left {
      flex: 1;
      display: flex;
      align-items: baseline;
      gap: 8rpx;
      min-width: 0;

      .label {
        font-size: 24rpx;
        color: $jel-font-dec2;
        white-space: nowrap;
      }

      .amount {
        font-size: 36rpx;
        font-weight: bold;
        color: $jel-brandColor;

        &::before {
          content: '';
          font-size: 24rpx;
        }
      }
    }

    .btn {
      width: 200rpx;
      height: 68rpx;
      line-height: 68rpx;
      padding: 0;
      background-color: $jel-brandColor;
      color: #fff;
      font-size: 28rpx;
      border-radius: 48rpx;
      border: none;
      flex-shrink: 0;
      margin-left: 16rpx;
      text-align: center;
    }
  }

  .safe-area {
    width: 100%;
    background-color: #fff;
  }
}
</style>
