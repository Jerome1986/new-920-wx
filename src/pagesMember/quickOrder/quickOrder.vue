<script setup lang="ts">
import { ref } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { updateOfflineOrderApi, offlineOrderGetApi } from '@/api/order.ts'
import { formatTimestamp } from '@/utils/formatTimestamp.ts'
import type { offlineOrderResult } from '@/types/Order'

// 订单信息
const orderInfo = ref<offlineOrderResult>()

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
    success: async (res) => {
      if (res.confirm && orderInfo.value?.outTradeNo) {
        // 调用取消订单接口
        console.log('取消订单:', orderInfo.value?.outTradeNo)
        const res = await updateOfflineOrderApi(orderInfo.value?.outTradeNo, 'CANCELLED')
        console.log('取消', res)

        if (res.code === 200) {
          await uni.showToast({
            title: '订单已取消',
            icon: 'success',
          })
          setTimeout(() => {
            uni.navigateBack()
          }, 1500)
        }
      }
    },
  })
}

// 根据传过来的订单号获取线下贴膜订单
const offlineOrderGet = async (outTradeNo: string) => {
  const res = await offlineOrderGetApi(outTradeNo)
  orderInfo.value = res.data
  console.log('订单', res)
}

// 确认服务完成
const handleCompletedOrder = () => {
  uni.showModal({
    title: '提示',
    content: '确定服务已完成吗？',
    confirmColor: '#d62731',
    success: async (res) => {
      if (res.confirm && orderInfo.value?.outTradeNo) {
        // 调用取消订单接口
        console.log('完成订单:', orderInfo.value?.outTradeNo)
        const res = await updateOfflineOrderApi(orderInfo.value?.outTradeNo, 'COMPLETED')
        if (res.code === 200) {
          await uni.showToast({
            title: '订单已完成',
            icon: 'success',
          })
          setTimeout(() => {
            uni.redirectTo({
              url: '/pagesMember/StoreManager/StoreManager',
            })
          }, 1500)
        }
      }
    },
  })
}

// 轮询订单，同步成功状态
let timer: any

onLoad((query?: AnyObject) => {
  if (!query) return
  console.log('页面接收到参数', query)

  if (query.code_url && query.out_trade_no) {
    qrCodeUrl.value = query.code_url // 后端返回的 base64 图片
    offlineOrderGet(query.out_trade_no)

    // 设置轮询
    timer = setInterval(async () => {
      const res = await offlineOrderGetApi(query.out_trade_no)
      console.log('轮询结果', res.data.status)
      if (res.data.status === 'PAID' || res.data.status === 'CANCELLED') {
        clearInterval(timer!)
        timer = null
        // 显示支付成功
        res.data.status === 'PAID' ? (isPaid.value = true) : (isPaid.value = false)
        console.log('已支付/已取消，结束轮询')
      }
    }, 5000)
  }
})

// 退出页面卸载轮询
onUnload(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
    console.log('页面关闭，轮询清理完成')
  }
})
</script>

<template>
  <scroll-view class="quick-order" :scroll-y="true">
    <!-- 订单状态头部 -->
    <view class="order-header">
      <view class="status-info">
        <text class="status-text" v-if="!isPaid">等待客户付款</text>
        <text class="status-text status-success" v-else>付款成功</text>
        <text class="order-no">订单号：{{ orderInfo?.outTradeNo }}</text>
      </view>
    </view>

    <!-- 商品信息卡片 -->
    <view class="product-card">
      <view class="card-title">
        <view class="title-left">
          <text class="iconfont icon-shangpin"></text>
          <text>商品信息</text>
        </view>
        <text class="create-time">{{ formatTimestamp(orderInfo?.createdAt, 2) }}</text>
      </view>
      <view class="product-info" v-if="orderInfo">
        <image class="product-cover" :src="orderInfo.productCover" mode="aspectFill" />
        <view class="product-detail">
          <text class="product-name">{{ orderInfo.skuNo }}{{ orderInfo?.productName }}</text>
          <text class="product-sku">{{ orderInfo?.remark }}</text>
          <!-- <text class="product-model">适配：{{ orderInfo.models?.[0] }}</text> -->
          <view class="price-row">
            <text class="current-price"
              >¥{{ Number(orderInfo?.actualPayment ?? 0).toFixed(2) }}</text
            >
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
            <text class="amount-value"
              >¥{{ Number(orderInfo?.actualPayment ?? 0).toFixed(2) }}</text
            >
          </view>
        </view>
        <text class="scan-tip">请客户使用微信扫码支付</text>
      </view>

      <!-- 付款成功状态 -->
      <view class="paid-content" v-else>
        <image class="paid-icon" src="/static/images/paidSuccess.png" mode="aspectFit" />
        <text class="paid-title">付款成功</text>
        <text class="paid-amount">¥{{ Number(orderInfo?.actualPayment ?? 0).toFixed(2) }}</text>
        <text class="paid-tip">客户已完成支付</text>
      </view>
    </view>
  </scroll-view>
  <!-- 底部操作栏 -->
  <view class="footer-bar" v-if="!isPaid">
    <view class="btn-cancel" @click="handleCancelOrder">
      <text>取消订单</text>
    </view>
  </view>
  <view class="footer-bar" v-else>
    <view class="btn-completed" @click="handleCompletedOrder">
      <text>确认完成</text>
    </view>
  </view>
</template>

<style scoped lang="scss">
.quick-order {
  height: 100vh;
  background-color: $jel-pageBackGroundColor;
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
      font-size: 28rpx;
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
        font-size: 28rpx;
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
      margin-bottom: 24rpx;
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
  justify-content: center;
  align-items: center;
  padding: 20rpx 32rpx calc(20rpx + env(safe-area-inset-bottom));
  background-color: #fff;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);

  .btn-cancel {
    text-align: center;
    width: 80%;
    padding: 20rpx 32rpx;
    border: 2rpx solid $jel-font-dec;
    border-radius: 40rpx;

    text {
      font-size: 28rpx;
      color: $jel-font-dec2;
    }
  }

  .btn-completed {
    text-align: center;
    width: 80%;
    padding: 20rpx 32rpx;
    border-radius: 40rpx;
    background-color: $jel-brandColor;

    text {
      font-size: 28rpx;
      color: #ffffff;
    }
  }
}
</style>
