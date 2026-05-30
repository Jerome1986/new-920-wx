<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCartStore, useMemberStore, useRateStore } from '@/stores'
import type { AddressInfo } from '@/types/UserItem'
import { proOrderCancelApi, proOrderPayApi } from '@/api/order.ts'
import type {
  OrderAmount,
  OrderProductItem,
  OrderUserInfo,
  sumbitOrderProduct,
} from '@/types/Order'

// 安全距离
const { safeAreaInsets } = uni.getSystemInfoSync()

// 定义store
const cartStore = useCartStore()
const userStore = useMemberStore()
const rateStore = useRateStore()
const showAddress = ref(true)
const submitting = ref(false)

// 选择地址-直接调用微信的收货地址
const addressInfo = ref<AddressInfo | null>(null)
const handleAddress = () => {
  uni.chooseAddress({
    success: (res: any) => {
      console.log('选择的地址信息:', res)
      addressInfo.value = {
        name: res.userName,
        mobile: res.telNumber, // res.telNumber
        province: res.provinceName,
        city: res.cityName,
        county: res.countyName,
        detail: res.detailInfo,
        postalCode: res.postalCode,
        nationalCode: res.nationalCode,
      }
    },
    fail: (err: any) => {
      console.log('选择地址失败:', err)
      uni.showToast({
        title: '获取地址失败',
        icon: 'none',
      })
    },
  })
}

// 可抵扣金额
const deductAmount = computed(() => {
  const total = cartStore.totalPrice

  const rules = rateStore.rateRules // 积分规则
  const userScore = userStore.profile?.score < 0 ? 0 : userStore.profile?.score // 用户剩余积分

  // 判断规则是否存在
  if (rules && typeof rules.maxUsePercent === 'number' && typeof rules.useRate === 'number') {
    const maxDeductMoney = total * rules.maxUsePercent // 最大可抵扣金额  购物车订单总额 * 订单抵扣比例
    const userPointsValue = userScore * rules.useRate // 用户积分可兑换多少金额  剩余积分 * 兑换RMB的比例

    // 金额必须是 >=0
    return Math.ceil(Math.max(0, Math.min(maxDeductMoney, userPointsValue)))
  }

  return 0
})

// 实际支付金额
const needPay = computed(() => {
  return cartStore.totalPrice - deductAmount.value
})

// 确认订单提交入库
const submit = async () => {
  if (submitting.value) return
  console.log('提交订单', cartStore.selectProduct)
  if (!addressInfo.value) {
    await uni.showToast({
      icon: 'error',
      title: '请填写地址',
      mask: true,
    })
    return
  }

  submitting.value = true
  try {
    // 当前订单的用户信息
    const userInfo: OrderUserInfo = {
      openid: userStore.profile.openid as string,
      userId: userStore.profile.id,
      nickname: userStore.profile.nickname || '',
      mobile: userStore.profile.mobile,
      avatarUrl: userStore.profile.avatarUrl,
    }

    // 当前订单的商品
    const products: sumbitOrderProduct[] = cartStore.selectProduct.map((item) => ({
      productId: item.productId,
      model: item.model,
      skuNo: item.skuNo,
      name: item.name,
      price: item.salePrice,
      quantity: item.quantity,
      image: item.cover,
      skuId: item.sku?.id,
      skuName: item.sku?.attrs.value,
    }))

    // 商品金额信息
    const amount: OrderAmount = {
      totalPrice: Number(cartStore.totalPrice.toFixed(2)),
      deductAmount: Number(deductAmount.value.toFixed(2)),
      actualPayment: Number(needPay.value.toFixed(2)),
      usedScore: Number(deductAmount.value.toFixed(2)),
    }

    // 调用API提交订单
    const orderRes = await proOrderPayApi(
      userInfo.openid,
      userInfo.userId,
      'TOC',
      userInfo.nickname,
      userInfo.mobile,
      userInfo.avatarUrl as string,
      addressInfo.value,
      products,
      cartStore.totalCount,
      amount.totalPrice,
      amount.deductAmount,
      amount.actualPayment,
      amount.usedScore ?? 0,
      'wechat',
      '商品购买',
    )

    console.log('订单结果', orderRes)
    // 调起微信支付
    wx.requestPayment({
      timeStamp: orderRes.data.timeStamp,
      nonceStr: orderRes.data.nonceStr,
      package: orderRes.data.packageValue,
      signType: orderRes.data.signType,
      paySign: orderRes.data.paySign,
      async success(res) {
        try {
          console.log('支付结果', res)
          showAddress.value = false
          // 重新拉取用户信息
          await userStore.userInfoGet(userStore.profile.id)
          await uni.showToast({ icon: 'success', title: '支付成功' })
          await uni.redirectTo({
            url: '/pagesMember/myOrder/myOrder',
          })
          await cartStore.clearSelectedCart()
        } finally {
          submitting.value = false
        }
      },
      fail(err) {
        console.error('支付失败', err)
        submitting.value = false
      },
    })
  } catch (err) {
    console.error('提交订单失败', err)
    submitting.value = false
  }
}
</script>

<template>
  <scroll-view class="confirmOrder" :scroll-y="true" :enhanced="true" :show-scrollbar="false">
    <!-- 收货地址 -->
    <view class="address-info" v-if="showAddress">
      <!-- 未选择地址 -->
      <view v-if="!addressInfo" class="no-address" @click="handleAddress">
        <text class="iconfont icon-add"></text>
        <text class="text">获取收货地址</text>
        <text class="iconfont icon-bianzu" style="color: #aaaaaa; font-size: 24rpx"></text>
      </view>

      <!-- 已选择地址 -->
      <view v-else class="has-address" @click="handleAddress">
        <view class="address-header">
          <view class="user-info">
            <text class="name">{{ addressInfo.name }}</text>
            <text class="phone">{{ addressInfo.mobile }}</text>
          </view>
          <text class="iconfont icon-arrow-right"></text>
        </view>
        <view class="address-detail">
          {{ addressInfo.province }} {{ addressInfo.city }} {{ addressInfo.county }}
          {{ addressInfo.detail }}
        </view>
      </view>
    </view>

    <!-- 商品列表 -->
    <view class="product-list">
      <view class="list-header">
        <text class="iconfont icon-a-ziyuan1"></text>
        <text class="title">商品清单</text>
        <text class="count">({{ cartStore.totalCount }}件)</text>
      </view>

      <view class="product-item" v-for="item in cartStore.selectProduct" :key="item.id">
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
            <view class="desc">型号：{{ item.model }}</view>
          </view>

          <view class="right">
            <!-- 价格 -->
            <view class="price">￥{{ Number(item.salePrice).toFixed(2) }}</view>
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
        <text class="value">￥{{ Number(cartStore.totalPrice).toFixed(2) }}</text>
      </view>
      <view class="item">
        <text class="label">剩余积分</text>
        <text class="value">{{ Number(userStore.profile.score).toFixed(2) }}</text>
      </view>
      <!-- 当前可抵扣的积分 -->
      <view class="item">
        <text class="label">可抵积分</text>
        <text class="value" style="color: #d62731">{{ Number(deductAmount).toFixed(2) }}</text>
      </view>
      <view class="item total">
        <text class="label">合计</text>
        <text class="value">￥{{ Number(needPay).toFixed(2) }}</text>
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
        <text class="amount">￥{{ Number(needPay).toFixed(2) }}</text>
      </view>
      <button class="btn" :disabled="submitting" @click="submit">
        {{ submitting ? '支付中...' : '结算' }}
      </button>
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

  // 收货地址
  .address-info {
    margin-bottom: 24rpx;
    background-color: #fff;
    border-radius: 8rpx;

    .no-address {
      display: flex;
      align-items: center;
      padding: 32rpx 24rpx;
      cursor: pointer;

      .iconfont.icon-add {
        font-size: 32rpx;
        color: $jel-brandColor;
        margin-right: 16rpx;
      }

      .text {
        flex: 1;
        font-size: 28rpx;
        color: $jel-font-title;
      }

      .iconfont.icon-arrow-right {
        font-size: 28rpx;
        color: $jel-font-dec2;
      }
    }

    .has-address {
      padding: 24rpx;
      cursor: pointer;

      .address-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16rpx;

        .user-info {
          display: flex;
          align-items: center;
          gap: 24rpx;

          .name {
            font-size: 32rpx;
            font-weight: bold;
            color: $jel-font-title;
          }

          .phone {
            font-size: 28rpx;
            color: $jel-font-dec2;
          }
        }

        .iconfont.icon-arrow-right {
          font-size: 28rpx;
          color: $jel-font-dec2;
        }
      }

      .address-detail {
        font-size: 28rpx;
        color: $jel-font-dec;
        line-height: 1.6;
        padding-right: 48rpx;
      }
    }
  }

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
