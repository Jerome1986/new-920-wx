<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { offlineOrderGetApi } from '@/api/order.ts'
import type { OrderStatus, QuickOrderResult } from '@/types/Order'

// 订单信息
const orderInfo = ref<QuickOrderResult<OrderStatus>>()

// 二维码 base64 图片
const qrCodeUrl = ref('')

// 付款成功状态（用于控制显示）
const isPaid = ref(false)

// 取消订单
const handleCancelOrder = () => {
  uni.showModal({
    title: '提示',
    content: '确定要取消该订单吗？',
    confirmColor: '#d62731',
    success: (res) => {
      if (res.confirm) {
        // TODO: 调用取消订单接口
        console.log('取消订单:', orderInfo.value?.productSkuNo)
        uni.showToast({
          title: '订单已取消',
          icon: 'success',
        })
        setTimeout(() => {
          uni.navigateBack()
        }, 1500)
      }
    },
  })
}

// 刷新支付状态
const handleRefreshStatus = () => {
  // TODO: 调用接口查询支付状态
  console.log('刷新支付状态')
  uni.showToast({
    title: '正在查询...',
    icon: 'loading',
    duration: 1000,
  })
}

// 完成订单（手动确认已收款）
const handleConfirmPaid = () => {
  uni.showModal({
    title: '确认收款',
    content: '请确认已收到客户付款',
    confirmColor: '#d62731',
    success: (res) => {
      if (res.confirm && orderInfo.value) {
        // TODO: 调用确认收款接口
        console.log('确认收款:', orderInfo.value?.productSkuNo)
        orderInfo.value.status = 'PAID'
        uni.showToast({
          title: '订单完成',
          icon: 'success',
        })
      }
    },
  })
}

// 修改价格
const handleModifyPrice = () => {
  // TODO: 实现修改价格逻辑
  console.log('修改价格')
}

// 根据传过来的订单号获取线下贴膜订单
const offlineOrderGet = async (out_trade_no: string) => {
  const res = await offlineOrderGetApi<OrderStatus>(out_trade_no)
  orderInfo.value = res.data
  console.log('订单', res)
}

onLoad((query?: AnyObject) => {
  if (!query) return
  console.log('页面接收到参数', query)
  if (query.code_url && query.out_trade_no) {
    qrCodeUrl.value = query.code_url // 后端返回的 base64 图片
    offlineOrderGet(query.out_trade_no)
  }
})
</script>

<template>
  <view class="quick-order">
    <!-- 订单状态头部 -->
    <view class="order-header">
      <view class="status-info">
        <text class="status-text">等待客户付款</text>
        <text class="order-no">订单号：{{ orderInfo?.out_trade_no }}</text>
      </view>
    </view>

    <!-- 商品信息卡片 -->
    <view class="product-card">
      <view class="card-title">
        <view class="title-left">
          <text class="iconfont icon-shangpin"></text>
          <text>商品信息</text>
        </view>
        <text class="create-time">{{ orderInfo?.createdAt }}</text>
      </view>
      <view class="product-info" v-if="orderInfo">
        <image class="product-cover" :src="orderInfo.productCover" mode="aspectFill" />
        <view class="product-detail">
          <text class="product-name">{{ orderInfo.productSkuNo }}{{ orderInfo?.productName }}</text>
          <text class="product-sku">{{ orderInfo?.productDec }}</text>
          <text class="product-model">适配：{{ orderInfo.models?.[0] }}</text>
          <view class="price-row">
            <text class="current-price">¥{{ orderInfo?.amount.toFixed(2) }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 二维码付款区域 -->
    <view class="qrcode-card">
      <view class="card-title">
        <text class="iconfont icon-saoma"></text>
        <text>扫码付款</text>
      </view>

      <!-- 等待付款状态 -->
      <view class="qrcode-content" v-if="!isPaid">
        <view class="qrcode-box">
          <!-- 二维码图片 -->
          <image v-if="qrCodeUrl" class="qrcode-image" :src="qrCodeUrl" mode="aspectFit" />
          <!-- 无二维码时的占位 -->
          <view v-else class="qrcode-placeholder">
            <text class="iconfont icon-erweima"></text>
            <text class="qrcode-tip">加载中...</text>
          </view>
        </view>
        <view class="amount-info">
          <text class="amount-label">应付金额</text>
          <view class="amount-row">
            <text class="amount-value">¥{{ orderInfo?.amount.toFixed(2) }}</text>
            <view class="btn-modify" @click="handleModifyPrice">
              <text class="iconfont icon-bianji"></text>
              <text>改价</text>
            </view>
          </view>
        </view>
        <text class="scan-tip">请客户使用微信扫码支付</text>
      </view>

      <!-- 付款成功状态 -->
      <view class="paid-content" v-else>
        <image class="paid-icon" src="/static/images/paidSuccess.png" mode="aspectFit" />
        <text class="paid-title">付款成功</text>
        <text class="paid-amount">¥{{ orderInfo?.amount.toFixed(2) }}</text>
        <text class="paid-tip">客户已完成支付</text>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view class="footer-bar">
      <view class="btn-cancel" @click="handleCancelOrder">
        <text>取消订单</text>
      </view>
      <view class="btn-refresh" @click="handleRefreshStatus">
        <text class="iconfont icon-shuaxin"></text>
        <text>刷新状态</text>
      </view>
      <view class="btn-confirm" @click="handleConfirmPaid">
        <text>确认收款</text>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.quick-order {
  min-height: 100vh;
  background-color: $jel-pageBackGroundColor;
  padding-bottom: calc(140rpx + env(safe-area-inset-bottom));
}

// 订单状态头部
.order-header {
  padding: 40rpx 32rpx;
  background: linear-gradient(135deg, $jel-brandColor 0%, #e84545 100%);

  .status-info {
    display: flex;
    flex-direction: column;

    .status-text {
      font-size: 36rpx;
      font-weight: 600;
      color: #fff;
      margin-bottom: 8rpx;
    }

    .order-no {
      font-size: 24rpx;
      color: rgba(255, 255, 255, 0.8);
    }
  }
}

// 通用卡片标题
.card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 24rpx;
  border-bottom: 1rpx solid $jel-border;
  margin-bottom: 24rpx;

  .title-left {
    display: flex;
    align-items: center;

    .iconfont {
      font-size: 36rpx;
      color: $jel-brandColor;
      margin-right: 12rpx;
    }

    text {
      font-size: 30rpx;
      font-weight: 600;
      color: $jel-font-title;
    }
  }

  .create-time {
    font-size: 24rpx;
    color: $jel-font-dec;
  }

  // 兼容没有 title-left 的卡片
  > .iconfont {
    font-size: 36rpx;
    color: $jel-brandColor;
    margin-right: 12rpx;
  }

  > text {
    font-size: 30rpx;
    font-weight: 600;
    color: $jel-font-title;
  }
}

// 商品信息卡片
.product-card {
  margin: 24rpx;
  padding: 28rpx;
  background-color: #fff;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);

  .product-info {
    display: flex;

    .product-cover {
      width: 180rpx;
      height: 180rpx;
      border-radius: 12rpx;
      background-color: $jel-pageBackGroundColor;
      flex-shrink: 0;
    }

    .product-detail {
      flex: 1;
      margin-left: 24rpx;
      display: flex;
      flex-direction: column;
      justify-content: space-between;

      .product-name {
        font-size: 30rpx;
        font-weight: 600;
        color: $jel-font-title;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .product-sku,
      .product-model {
        font-size: 24rpx;
        color: $jel-font-dec2;
        margin-top: 8rpx;
      }

      .price-row {
        display: flex;
        align-items: baseline;
        margin-top: 12rpx;

        .current-price {
          font-size: 36rpx;
          font-weight: 700;
          color: $jel-brandColor;
        }
      }
    }
  }
}

// 二维码卡片
.qrcode-card {
  margin: 24rpx;
  padding: 28rpx;
  background-color: #fff;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);

  .qrcode-content {
    display: flex;
    flex-direction: column;
    align-items: center;

    .qrcode-box {
      width: 360rpx;
      height: 360rpx;
      border: 2rpx solid $jel-border;
      border-radius: 16rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 32rpx;
      overflow: hidden;
      background-color: #fff;

      .qrcode-image {
        width: 320rpx;
        height: 320rpx;
      }

      .qrcode-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;

        .iconfont {
          font-size: 160rpx;
          color: $jel-font-dec;
        }

        .qrcode-tip {
          font-size: 24rpx;
          color: $jel-font-dec;
          margin-top: 16rpx;
        }
      }
    }

    .amount-info {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 20rpx;

      .amount-label {
        font-size: 26rpx;
        color: $jel-font-dec2;
        margin-bottom: 8rpx;
      }

      .amount-row {
        display: flex;
        align-items: center;

        .amount-value {
          font-size: 56rpx;
          font-weight: 700;
          color: $jel-brandColor;
        }

        .btn-modify {
          display: flex;
          align-items: center;
          margin-left: 20rpx;
          padding: 8rpx 20rpx;
          background-color: rgba($jel-brandColor, 0.1);
          border-radius: 24rpx;

          .iconfont {
            font-size: 24rpx;
            color: $jel-brandColor;
            margin-right: 6rpx;
          }

          text {
            font-size: 24rpx;
            color: $jel-brandColor;
          }

          &:active {
            opacity: 0.7;
          }
        }
      }
    }

    .scan-tip {
      font-size: 24rpx;
      color: $jel-font-dec;
    }
  }

  // 付款成功状态
  .paid-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40rpx 0;

    .paid-icon {
      width: 160rpx;
      height: 160rpx;
      margin-bottom: 24rpx;
    }

    .paid-title {
      font-size: 36rpx;
      font-weight: 600;
      color: $jel-font-success;
      margin-bottom: 16rpx;
    }

    .paid-amount {
      font-size: 48rpx;
      font-weight: 700;
      color: $jel-font-title;
      margin-bottom: 12rpx;
    }

    .paid-tip {
      font-size: 26rpx;
      color: $jel-font-dec;
    }
  }
}

// 底部操作栏
.footer-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding: 20rpx 32rpx calc(20rpx + env(safe-area-inset-bottom));
  background-color: #fff;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);

  .btn-cancel {
    padding: 20rpx 32rpx;
    border: 2rpx solid $jel-font-dec;
    border-radius: 40rpx;
    margin-right: 20rpx;

    text {
      font-size: 28rpx;
      color: $jel-font-dec2;
    }

    &:active {
      opacity: 0.7;
    }
  }

  .btn-refresh {
    display: flex;
    align-items: center;
    padding: 20rpx 32rpx;
    border: 2rpx solid $jel-brandColor;
    border-radius: 40rpx;
    margin-right: auto;

    .iconfont {
      font-size: 28rpx;
      color: $jel-brandColor;
      margin-right: 8rpx;
    }

    text {
      font-size: 28rpx;
      color: $jel-brandColor;
    }

    &:active {
      opacity: 0.7;
    }
  }

  .btn-confirm {
    padding: 20rpx 48rpx;
    background: linear-gradient(135deg, $jel-brandColor 0%, #e84545 100%);
    border-radius: 40rpx;

    text {
      font-size: 28rpx;
      font-weight: 600;
      color: #fff;
    }

    &:active {
      opacity: 0.85;
    }
  }
}
</style>
