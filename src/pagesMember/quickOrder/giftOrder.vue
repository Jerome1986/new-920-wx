<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import type { freeOrderStatus, QuickOrderResult } from '@/types/Order'
import { offlineOrderGetApi } from '@/api/order'

// 订单信息
const orderInfo = ref<QuickOrderResult<freeOrderStatus>>()

// 状态配置（统一使用主题色系）
const statusConfig: Record<freeOrderStatus, { text: string; color: string; bgColor: string }> = {
  SERVICING: {
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
}

// 当前状态配置
const currentStatus = computed(() => {
  const status = orderInfo.value?.status || 'SERVICING'
  return statusConfig[status]
})

// 是否可以确认完成（服务中状态可以操作）
const canComplete = computed(() => {
  return orderInfo.value?.status === 'SERVICING'
})

// 根据传过来的订单号获取免费订单详情
const giftOrderGet = async (out_trade_no: string) => {
  const res = await offlineOrderGetApi<freeOrderStatus>(out_trade_no)
  orderInfo.value = res.data
  console.log('免费订单详情', res)
}

// 确认完成服务
const handleConfirmService = () => {
  uni.showModal({
    title: '确认完成',
    content: '请确认已为客户完成贴膜服务',
    confirmColor: '#52c41a',
    success: async (res) => {
      if (res.confirm) {
        // TODO: 调用完成服务接口
        // const result = await completeGiftOrderApi(orderInfo.value?.out_trade_no)
        console.log('确认完成服务:', orderInfo.value?.out_trade_no)
        await uni.showToast({ title: '服务已完成', icon: 'success' })
        // 更新本地状态
        if (orderInfo.value) {
          orderInfo.value.status = 'COMPLETED'
        }
      }
    },
  })
}

// 取消订单
const handleCancelOrder = () => {
  uni.showModal({
    title: '取消订单',
    content: '确定要取消该订单吗？',
    confirmColor: '#d62731',
    success: async (res) => {
      if (res.confirm) {
        // TODO: 调用取消订单接口
        console.log('取消订单:', orderInfo.value?.out_trade_no)
        await uni.showToast({ title: '订单已取消', icon: 'success' })
        setTimeout(() => {
          uni.navigateBack()
        }, 1500)
      }
    },
  })
}

// 返回
const handleBack = () => {
  uni.navigateBack()
}

onLoad((query?: AnyObject) => {
  if (!query) return
  console.log('页面接收到参数', query)
  if (query.out_trade_no) {
    giftOrderGet(query.out_trade_no)
  }
})
</script>

<template>
  <view class="gift-order">
    <!-- 可滚动内容区域 -->
    <scroll-view class="scroll-content" scroll-y>
      <!-- 状态头部 -->
      <view class="order-header" :style="{ background: currentStatus.bgColor }">
        <view class="status-info">
          <text class="status-text">{{ currentStatus.text }}</text>
          <text class="order-no">订单号：{{ orderInfo?.out_trade_no }}</text>
        </view>
      </view>

      <!-- 会员信息卡片 -->
      <view class="member-card">
        <view class="card-title">
          <text class="iconfont icon-huiyuan"></text>
          <text>会员信息</text>
        </view>
        <view class="member-info">
          <view class="info-row">
            <text class="label">会员手机</text>
            <text class="value">{{ orderInfo?.memberPhone || '--' }}</text>
          </view>
          <view class="info-row">
            <text class="label">服务类型</text>
            <text class="value highlight">会员免费贴膜</text>
          </view>
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
            <text class="product-name"
              >{{ orderInfo.productSkuNo }} {{ orderInfo?.productName }}</text
            >
            <text class="product-sku">{{ orderInfo?.productDec }}</text>
            <text class="product-model">适配：{{ orderInfo.models?.[0] }}</text>
            <view class="price-row">
              <text class="free-tag">免费</text>
              <text class="original-price">¥{{ orderInfo?.amount?.toFixed(2) || '0.00' }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 订单信息卡片 -->
      <view class="order-card">
        <view class="card-title">
          <text class="iconfont icon-dingdan"></text>
          <text>订单信息</text>
        </view>
        <view class="order-info">
          <view class="info-row">
            <text class="label">订单类型</text>
            <text class="value">会员免费贴膜</text>
          </view>
          <view class="info-row">
            <text class="label">订单状态</text>
            <text class="value" :style="{ color: currentStatus.color }">{{
              currentStatus.text
            }}</text>
          </view>
          <view class="info-row">
            <text class="label">创建时间</text>
            <text class="value">{{ orderInfo?.createdAt }}</text>
          </view>
          <view class="info-row" v-if="orderInfo?.completedAt">
            <text class="label">完成时间</text>
            <text class="value">{{ orderInfo?.completedAt }}</text>
          </view>
          <view class="info-row" v-if="orderInfo?.remark">
            <text class="label">订单备注</text>
            <text class="value">{{ orderInfo?.remark }}</text>
          </view>
        </view>
      </view>

      <!-- 底部安全区域 -->
      <view class="safe-bottom"></view>
    </scroll-view>

    <!-- 底部操作栏（固定在底部） -->
    <view class="footer-bar">
      <!-- 待服务/服务中状态 -->
      <template v-if="canComplete">
        <view class="btn-cancel" @click="handleCancelOrder">
          <text>取消订单</text>
        </view>
        <view class="btn-complete" @click="handleConfirmService">
          <text class="iconfont icon-queren"></text>
          <text>确认完成</text>
        </view>
      </template>
      <!-- 已完成/已取消状态 -->
      <template v-else>
        <view class="btn-back-full" @click="handleBack">
          <text>返回</text>
        </view>
      </template>
    </view>
  </view>
</template>

<style scoped lang="scss">
.gift-order {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: $jel-pageBackGroundColor;
}

// 可滚动内容区域
.scroll-content {
  flex: 1;
  height: 0; // 配合 flex: 1 使用
}

// 底部安全区域
.safe-bottom {
  height: 40rpx;
}

// 状态头部
.order-header {
  padding: 40rpx 32rpx;

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

// 通用卡片样式
.member-card,
.product-card,
.order-card {
  margin: 24rpx;
  padding: 28rpx;
  background-color: #fff;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
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

// 会员信息卡片
.member-card {
  .member-info {
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16rpx 0;

      &:not(:last-child) {
        border-bottom: 1rpx dashed $jel-border;
      }

      .label {
        font-size: 28rpx;
        color: $jel-font-dec2;
      }

      .value {
        font-size: 28rpx;
        color: $jel-font-title;

        &.highlight {
          color: $jel-brandColor;
          font-weight: 500;
        }
      }
    }
  }
}

// 商品信息卡片
.product-card {
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
        align-items: center;
        margin-top: 12rpx;

        .free-tag {
          padding: 6rpx 20rpx;
          font-size: 26rpx;
          font-weight: 600;
          color: #fff;
          background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
          border-radius: 8rpx;
          margin-right: 12rpx;
        }

        .original-price {
          font-size: 28rpx;
          color: $jel-font-dec;
          text-decoration: line-through;
        }
      }
    }
  }
}

// 订单信息卡片
.order-card {
  .order-info {
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16rpx 0;

      &:not(:last-child) {
        border-bottom: 1rpx dashed $jel-border;
      }

      .label {
        font-size: 28rpx;
        color: $jel-font-dec2;
        flex-shrink: 0;
      }

      .value {
        font-size: 28rpx;
        color: $jel-font-title;
        text-align: right;
      }
    }
  }
}

// 底部操作栏
.footer-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: 20rpx 32rpx calc(20rpx + env(safe-area-inset-bottom));
  background-color: #fff;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
  gap: 24rpx;

  .btn-cancel {
    padding: 24rpx 40rpx;
    border: 2rpx solid $jel-font-dec;
    border-radius: 44rpx;

    text {
      font-size: 28rpx;
      color: $jel-font-dec2;
    }

    &:active {
      opacity: 0.7;
    }
  }

  .btn-complete {
    flex: 1;
    height: 88rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, $jel-brandColor 0%, #e84545 100%);
    border-radius: 44rpx;

    .iconfont {
      font-size: 32rpx;
      color: #fff;
      margin-right: 8rpx;
    }

    text {
      font-size: 30rpx;
      font-weight: 600;
      color: #fff;
    }

    &:active {
      opacity: 0.85;
    }
  }

  .btn-back-full {
    flex: 1;
    height: 88rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: $jel-pageBackGroundColor;
    border-radius: 44rpx;

    text {
      font-size: 30rpx;
      color: $jel-font-dec2;
    }

    &:active {
      opacity: 0.7;
    }
  }
}
</style>
