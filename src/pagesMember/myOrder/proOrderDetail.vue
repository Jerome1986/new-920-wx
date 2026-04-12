<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { formatOrderState, formatTimestamp } from '@/utils/formatTimestamp.ts'
import type { OrderItem } from '@/types/Order'
import { confirmOrderLogistics, userOrderDetailGetApi } from '@/api/order.ts'
import { validateExpressList } from '@/utils/logisticsMapping.ts'
import { MERCHANT_ID } from '@/utils/config.ts'
import type { BusinessSuccessResponse } from '@/types/Gobal'
import { useMemberStore } from '@/stores'

// 安全距离
const { safeAreaInsets } = uni.getSystemInfoSync()
const userStore = useMemberStore()

// 订单号
const orderNo = ref('')

// 订单详情
const orderDetail = ref<OrderItem | null>(null)

// 获取订单详情
const getOrderDetail = async (out_trade_no: string) => {
  try {
    //  调用API获取订单详情
    const res = await userOrderDetailGetApi(out_trade_no)
    console.log(res.data)
    orderDetail.value = res.data
  } catch (error) {
    console.error('获取订单详情失败', error)
    await uni.showToast({
      title: '获取订单详情失败',
      icon: 'none',
    })
  }
}

// 处理确认收货
const handleConfirm = (transaction_id: string) => {
  // @ts-ignore
  if (wx.openBusinessView) {
    // @ts-ignore
    wx.openBusinessView({
      businessType: 'weappOrderConfirm',
      extraData: {
        merchant_id: MERCHANT_ID,
        merchant_trade_no: orderDetail.value?.outTradeNo,
        transaction_id: transaction_id,
      },
      async success(res: BusinessSuccessResponse) {
        console.log('确认收货成功', res)
        // 判断打开后是否取消
        if (res.extraData.status === 'cancel')
          return uni.showToast({ icon: 'none', title: '已取消', mask: true })
        // 将订单状态更新入库已完成
        await confirmOrderLogistics(userStore.profile.id, orderNo.value)
        await getOrderDetail(orderNo.value)
        await uni.redirectTo({
          url: '//pagesMember/myOrder/myOrder',
        })
      },
      fail(err: any) {
        console.error('确认收货失败', err)
      },
    })
  } else {
    uni.showToast({
      title: '请升级微信版本',
      icon: 'none',
    })
  }
}

// 复制订单号
const handleCopy = (text: string) => {
  uni.setClipboardData({
    data: text,
    success: () => {
      uni.showToast({
        title: '复制成功',
        icon: 'success',
      })
    },
  })
}

onLoad((options: any) => {
  if (options.orderNo) {
    orderNo.value = options.orderNo
    getOrderDetail(options.orderNo)
  }
})
</script>

<template>
  <view class="order-detail" v-if="orderDetail">
    <scroll-view class="content" :scroll-y="true" :enhanced="true" :show-scrollbar="false">
      <!-- 订单状态 -->
      <view class="status-section">
        <view class="status-icon">
          <text
            class="iconfont"
            :class="{
              'icon-success': orderDetail.status === 'COMPLETED',
              'icon-time': orderDetail.status === 'PENDING',
              'icon-logistics': orderDetail.status === 'SHIPPED',
              'icon-check': orderDetail.status === 'PAID',
              'icon-close':
                orderDetail.status === 'CANCELLED' ||
                orderDetail.status === 'REFUNDED' ||
                orderDetail.status === 'PROCESSING',
            }"
          ></text>
        </view>
        <view class="status-text">{{ formatOrderState(orderDetail.status) }}</view>
        <view class="status-desc" v-if="orderDetail.status === 'PAID'">商家正在备货中</view>
        <view class="status-desc" v-if="orderDetail.status === 'SHIPPED'">
          商品正在配送中，请耐心等待
        </view>
        <view class="status-desc" v-if="orderDetail.status === 'COMPLETED'">
          订单已完成，感谢您的购买
        </view>
      </view>

      <!-- 收货地址 -->
      <view class="address-section">
        <view class="section-header">
          <text class="iconfont icon-location"></text>
          <text class="title">收货地址</text>
        </view>
        <view class="address-content">
          <view class="user-info">
            <text class="name">{{ orderDetail.address.name }}</text>
            <text class="phone">{{ orderDetail.address.mobile }}</text>
          </view>
          <view class="address-text">
            {{ orderDetail.address.province }} {{ orderDetail.address.city }}
            {{ orderDetail.address.county }} {{ orderDetail.address.detail }}
          </view>
        </view>
      </view>

      <!-- 商品清单 -->
      <view class="product-section">
        <view class="section-header">
          <text class="iconfont icon-a-ziyuan1"></text>
          <text class="title">商品清单</text>
        </view>
        <view class="product-list">
          <view class="product-item" v-for="product in orderDetail.products" :key="product.id">
            <!-- 商品图片 -->
            <image class="cover" :src="product.image" mode="aspectFill" />

            <!-- 商品信息 -->
            <view class="info">
              <view class="name">{{ product.skuNo }} {{ product.name }}</view>
              <view class="spec" v-if="product.skuId">
                {{ product.skuName }}
              </view>
              <view class="bottom">
                <view class="price">￥{{ Number(product.price).toFixed(2) }}</view>
                <view class="quantity">x{{ product.quantity }}</view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 订单信息 -->
      <view class="info-section">
        <view class="section-header">
          <text class="iconfont icon-order"></text>
          <text class="title">订单信息</text>
        </view>
        <view class="info-list">
          <view class="info-item">
            <text class="label">订单号</text>
            <view class="value-wrapper">
              <text class="value">{{ orderDetail.outTradeNo }}</text>
              <text class="copy" @click="handleCopy(orderDetail.outTradeNo)">复制</text>
            </view>
          </view>
          <view class="info-item" v-if="orderDetail.transactionId">
            <text class="label">微信订单号</text>
            <view class="value-wrapper">
              <text class="value">{{ orderDetail.transactionId }}</text>
              <text class="copy" @click="handleCopy(orderDetail.transactionId)">复制</text>
            </view>
          </view>
          <!-- 快递物流 -->
          <!-- <view
            class="info-item"
            v-if="orderDetail.logistics?.length && orderDetail.logistics[0].express_company"
          >
            <text class="label">快递公司</text>
            <view class="value-wrapper">
              <text class="value">{{
                validateExpressList(orderDetail.logistics[0].express_company)
              }}</text>
              <text
                class="copy"
                @click="handleCopy(validateExpressList(orderDetail.logistics[0].express_company))"
                >复制</text
              >
            </view>
          </view>
          <view
            class="info-item"
            v-if="orderDetail.logistics?.length && orderDetail.logistics[0].tracking_no"
          >
            <text class="label">快递单号</text>
            <view class="value-wrapper">
              <text class="value">{{ orderDetail.logistics[0].tracking_no }}</text>
              <text class="copy" @click="handleCopy(orderDetail.logistics[0].tracking_no)"
                >复制</text
              >
            </view>
          </view> -->
          <view class="info-item">
            <text class="label">下单时间</text>
            <text class="value">{{ formatTimestamp(orderDetail.createdAt, 2) }}</text>
          </view>
          <view class="info-item" v-if="orderDetail.paidAt">
            <text class="label">支付时间</text>
            <text class="value">{{ formatTimestamp(orderDetail.paidAt, 2) }}</text>
          </view>
          <view class="info-item" v-if="orderDetail.shippedAt">
            <text class="label">发货时间</text>
            <text class="value">{{ formatTimestamp(orderDetail.shippedAt, 2) }}</text>
          </view>
          <view class="info-item" v-if="orderDetail.completedAt">
            <text class="label">完成时间</text>
            <text class="value">{{ formatTimestamp(orderDetail.completedAt, 2) }}</text>
          </view>
          <view class="info-item">
            <text class="label">支付方式</text>
            <text class="value">{{
              orderDetail.paymentMethod === 'wechat' ? '微信支付' : '其他'
            }}</text>
          </view>
        </view>
      </view>

      <!-- 金额明细 -->
      <view class="amount-section">
        <view class="section-header">
          <text class="iconfont icon-money"></text>
          <text class="title">金额明细</text>
        </view>
        <view class="amount-list">
          <view class="amount-item">
            <text class="label">商品总额</text>
            <text class="value">￥{{ Number(orderDetail.totalPrice).toFixed(2) }}</text>
          </view>
          <view class="amount-item" v-if="Number(orderDetail.deductAmount) > 0">
            <text class="label">积分抵扣</text>
            <text class="value deduct">-￥{{ Number(orderDetail.deductAmount).toFixed(2) }}</text>
          </view>
          <view class="amount-item" v-if="orderDetail.usedScore">
            <text class="label">使用积分</text>
            <text class="value">{{ orderDetail.usedScore.toFixed(2) }}</text>
          </view>
          <view class="amount-item total">
            <text class="label">实付款</text>
            <text class="value">￥{{ Number(orderDetail.actualPayment).toFixed(2) }}</text>
          </view>
        </view>
      </view>

      <!-- 底部占位 -->
      <view
        class="bottom-placeholder"
        :style="{ height: `calc(100rpx + ${safeAreaInsets?.bottom || 0}px)` }"
        v-if="
          orderDetail.status === 'SHIPPED' ||
          orderDetail.status === 'PAID' ||
          orderDetail.status === 'COMPLETED'
        "
      ></view>
    </scroll-view>

    <!-- 底部操作栏 -->
    <view class="footer" v-if="orderDetail.status === 'SHIPPED' || orderDetail.status === 'PAID'">
      <view class="footer-content">
        <!-- 待发货 -->
        <template v-if="orderDetail.status === 'PAID'">
          <view class="tips">商家正在备货中，请耐心等待</view>
        </template>

        <!-- 待收货 -->
        <template v-if="orderDetail.status === 'SHIPPED'">
          <view class="btn primary" @click="handleConfirm(orderDetail.outTradeNo)">确认收货</view>
        </template>
      </view>
      <view class="safe-area" :style="{ height: safeAreaInsets?.bottom + 'px' }"></view>
    </view>
  </view>

  <!-- 加载中 -->
  <view class="loading" v-else>
    <text>加载中...</text>
  </view>
</template>

<style scoped lang="scss">
.order-detail {
  height: 100vh;
  background-color: $jel-pageBackGroundColor;

  .content {
    height: 100%;
    padding: 24rpx;
  }

  // 订单状态
  .status-section {
    background: linear-gradient(135deg, $jel-brandColor 0%, #ff8a80 100%);
    border-radius: 12rpx;
    padding: 48rpx 24rpx;
    margin-bottom: 24rpx;
    text-align: center;
    color: #fff;

    .status-icon {
      .iconfont {
        font-size: 80rpx;
      }
    }

    .status-text {
      font-size: 32rpx;
      font-weight: bold;
      margin-top: 16rpx;
    }

    .status-desc {
      font-size: 24rpx;
      margin-top: 12rpx;
      opacity: 0.9;
    }
  }

  // 通用卡片样式
  .address-section,
  .product-section,
  .info-section,
  .amount-section {
    background-color: #fff;
    border-radius: 12rpx;
    padding: 24rpx;
    margin-bottom: 24rpx;

    .section-header {
      display: flex;
      align-items: center;
      margin-bottom: 24rpx;
      padding-bottom: 16rpx;
      border-bottom: 1rpx solid $jel-border;

      .iconfont {
        font-size: 32rpx;
        color: $jel-brandColor;
        margin-right: 8rpx;
      }

      .title {
        font-size: 28rpx;
        font-weight: bold;
        color: $jel-font-title;
      }
    }
  }

  // 收货地址
  .address-section {
    .address-content {
      .user-info {
        display: flex;
        align-items: center;
        gap: 24rpx;
        margin-bottom: 16rpx;

        .name {
          font-size: 32rpx;
          font-weight: bold;
          color: $jel-font-title;
        }

        .phone {
          font-size: 28rpx;
          color: $jel-font-dec;
        }
      }

      .address-text {
        font-size: 28rpx;
        color: $jel-font-title;
        line-height: 1.6;
      }
    }
  }

  // 商品清单
  .product-section {
    .product-list {
      .product-item {
        display: flex;
        gap: 16rpx;
        margin-bottom: 24rpx;

        &:last-child {
          margin-bottom: 0;
        }

        .cover {
          width: 140rpx;
          height: 140rpx;
          border-radius: 8rpx;
          flex-shrink: 0;
          object-fit: cover;
          background-color: #f5f5f5;
        }

        .info {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-width: 0;

          .name {
            font-size: 28rpx;
            color: $jel-font-title;
            font-weight: 500;
            @include ellipsis(2);
          }

          .spec {
            font-size: 22rpx;
            color: $jel-font-dec2;
            background-color: #f5f5f5;
            padding: 4rpx 12rpx;
            border-radius: 4rpx;
            width: fit-content;
            margin-top: 8rpx;
          }

          .bottom {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 8rpx;

            .price {
              font-size: 32rpx;
              font-weight: bold;
              color: $jel-brandColor;
            }

            .quantity {
              font-size: 24rpx;
              color: $jel-font-dec;
            }
          }
        }
      }
    }
  }

  // 订单信息
  .info-section {
    .info-list {
      .info-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16rpx 0;
        border-bottom: 1rpx dashed $jel-border;

        &:last-child {
          border-bottom: none;
        }

        .label {
          font-size: 28rpx;
          color: $jel-font-dec;
          flex-shrink: 0;
        }

        .value {
          font-size: 28rpx;
          color: $jel-font-title;
          text-align: right;
          word-break: break-all;
        }

        .value-wrapper {
          display: flex;
          align-items: center;
          gap: 16rpx;
          flex: 1;
          justify-content: flex-end;
          min-width: 0;

          .value {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .copy {
            font-size: 24rpx;
            color: $jel-brandColor;
            flex-shrink: 0;
          }
        }
      }
    }
  }

  // 金额明细
  .amount-section {
    .amount-list {
      .amount-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16rpx 0;

        .label {
          font-size: 28rpx;
          color: $jel-font-dec;
        }

        .value {
          font-size: 28rpx;
          color: $jel-font-title;

          &.deduct {
            color: $jel-brandColor;
          }
        }

        &.total {
          padding-top: 24rpx;
          margin-top: 8rpx;
          border-top: 1rpx dashed $jel-border;

          .label {
            font-size: 32rpx;
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
  }

  // 底部占位
  .bottom-placeholder {
    flex-shrink: 0;
  }
}

// 底部操作栏
.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  border-top: 2rpx solid $jel-border;
  box-shadow: 0 -4rpx 12rpx rgba(0, 0, 0, 0.02);
  z-index: 999;
  display: flex;
  flex-direction: column;

  .footer-content {
    height: 100rpx;
    padding: 0 24rpx;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 16rpx;
    box-sizing: border-box;

    .tips {
      flex: 1;
      font-size: 24rpx;
      color: $jel-font-dec;
    }

    .btn {
      padding: 16rpx 32rpx;
      font-size: 28rpx;
      border-radius: 999rpx;
      white-space: nowrap;

      &.ghost {
        color: $jel-font-title;
        border: 1rpx solid $jel-border;
        background-color: #fff;
      }

      &.primary {
        color: #fff;
        background-color: $jel-brandColor;
        border: 1rpx solid $jel-brandColor;
      }
    }
  }

  .safe-area {
    width: 100%;
    background-color: #fff;
  }
}

// 加载中
.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 28rpx;
  color: $jel-font-dec;
}
</style>
