<script setup lang="ts">
import { useCartStore } from '@/stores'

// 获取安全区域
const { safeAreaInsets } = uni.getSystemInfoSync()

// 定义store
const cartStore = useCartStore()

// 结算
const handleCheckout = () => {
  if (cartStore.selectedCount === 0) {
    uni.showToast({
      title: '请选择商品',
      icon: 'none',
    })
    return
  }

  // 检查店长购物车内是否是和商品混合，有则提示
  const uniqueTypes = new Set(cartStore.cartList.map((cart) => cart.type))
  if (uniqueTypes.size > 1) {
    uni.showToast({
      title: '进货时不要选择商品噢',
      icon: 'none',
    })
    return
  }

  // 拿到所选择商品数组里的type并传递给订单页面
  const orderType = cartStore.selectProduct[0].type
  if (orderType !== 'MANAGER') {
    uni.navigateTo({
      url: `/pages/confirmOrder/confirmOrder?orderType=${orderType}`,
    })
  } else {
    console.log('店长订单')
  }
}
</script>

<template>
  <view class="cartPage">
    <!-- 购物车列表 -->
    <scroll-view class="cart-list" :scroll-y="true" :enhanced="true" :show-scrollbar="false">
      <view v-if="cartStore.cartList.length === 0" class="empty">
        <image class="empty-img" src="/static/images/emptyCart.png" mode="aspectFit"></image>
        <text class="empty-text">购物车空空如也</text>
        <navigator url="/pages/shop/shop" open-type="switchTab" class="go-shop">去逛逛</navigator>
      </view>

      <view v-else class="list">
        <view class="item" v-for="item in cartStore.cartList" :key="item.id">
          <!-- 选择框 -->
          <text
            @click="cartStore.toggleSelect(item.id as string)"
            class="checkbox"
            :class="{ checked: item.selected }"
          ></text>

          <!-- 商品信息 -->
          <view class="item-content">
            <!-- 封面图 -->
            <image class="cover" :src="item.sku?.image || item.cover" mode="aspectFill"></image>

            <!-- 右侧信息 -->
            <view class="info">
              <!-- 商品名称 -->
              <view class="name">{{ item.skuNo }} {{ item.name }}</view>

              <!-- 规格 -->
              <view class="spec" v-if="item.sku">
                {{ item.sku.attrs.label }}: {{ item.sku.attrs.value }}
              </view>
              <view class="spec" v-if="item.model">{{ item.model }} </view>

              <!-- 价格和数量 -->
              <view class="bottom">
                <view class="price-box">
                  <view class="price">
                    <text class="symbol">￥</text>
                    <text class="number">{{ Number(item.salePrice).toFixed(2) }}</text>
                  </view>
                </view>

                <!-- 数量调整器 -->
                <view class="stepper">
                  <view
                    class="btn decrease"
                    :class="{ disabled: item.quantity <= 1 }"
                    @click="cartStore.decreaseQuantity(item.id as string)"
                  >
                    <text>-</text>
                  </view>
                  <input
                    class="input"
                    type="number"
                    :value="String(item.quantity)"
                    :disabled="true"
                  />
                  <!--  :class="{ disabled: item.sku && item.quantity >= item.sku.stock }" -->
                  <view class="btn increase" @click="cartStore.increaseQuantity(item.id as string)">
                    <text>+</text>
                  </view>
                </view>
              </view>
            </view>

            <!-- 删除按钮 -->
            <view class="delete" @click="cartStore.deleteItem(item.id as string)">
              <text class="iconfont icon-shanchu"></text>
            </view>
          </view>
        </view>
        <!-- 底部占位，防止被结算栏遮挡 -->
        <view
          class="footer-placeholder"
          :style="{ height: `calc(120rpx + ${safeAreaInsets?.bottom || 0}px)` }"
        ></view>
      </view>
    </scroll-view>

    <!-- 底部结算栏 -->
    <view class="footer" v-if="cartStore.cartList.length > 0">
      <view class="left">
        <!-- 全选 -->
        <view class="all-select" @click="cartStore.setAllSelected()">
          <text class="checkbox" :class="{ checked: cartStore.isAllSelected }"></text>
          <text class="label">全选</text>
        </view>

        <!-- 合计 -->
        <view class="total">
          <text class="label">合计:</text>
          <text class="price">
            <text class="symbol">￥</text>
            <text class="number">{{ Number(cartStore.totalPrice).toFixed(2) }}</text>
          </text>
        </view>
      </view>

      <!-- 结算按钮 -->
      <view class="checkout-btn" @click="handleCheckout">提交</view>
    </view>

    <!-- 安全区域占位（在footer外部，tabbar下方） -->
    <view
      class="safe-area-placeholder"
      :style="{ height: safeAreaInsets?.bottom + 'px' }"
      v-if="cartStore.cartList.length > 0"
    ></view>
  </view>
</template>

<style lang="scss" scoped>
.cartPage {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: $jel-pageBackGroundColor;

  // 购物车列表
  .cart-list {
    flex: 1;
    overflow: hidden;

    // 空状态
    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 120rpx 0;

      .empty-img {
        width: 400rpx;
        height: 400rpx;
        margin-bottom: 32rpx;
      }

      .empty-text {
        font-size: 28rpx;
        color: $jel-font-dec;
        margin-bottom: 48rpx;
      }

      .go-shop {
        padding: 16rpx 64rpx;
        background-color: $jel-brandColor;
        color: #fff;
        font-size: 28rpx;
        border-radius: 48rpx;
      }
    }

    // 列表
    .list {
      padding: 24rpx;

      .item {
        display: flex;
        align-items: flex-start;
        background-color: #fff;
        padding: 24rpx;
        margin-bottom: 24rpx;
        border-radius: 8rpx;

        // 选择框
        .checkbox {
          width: 40rpx;
          height: 40rpx;
          border: 2rpx solid #ccc;
          border-radius: 50%;
          margin-right: 16rpx;
          flex-shrink: 0;
          position: relative;

          &.checked {
            border-color: $jel-brandColor;
            background-color: $jel-brandColor;

            &::after {
              content: '';
              position: absolute;
              left: 50%;
              top: 50%;
              transform: translate(-50%, -60%) rotate(45deg);
              width: 10rpx;
              height: 18rpx;
              border: 3rpx solid #fff;
              border-top: none;
              border-left: none;
            }
          }
        }

        // 商品内容
        .item-content {
          flex: 1;
          display: flex;
          position: relative;
          min-width: 0;

          // 封面图
          .cover {
            width: 160rpx;
            height: 160rpx;
            border-radius: 8rpx;
            margin-right: 16rpx;
            flex-shrink: 0;
            object-fit: cover;
          }

          // 商品信息
          .info {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            min-width: 0;
            padding-right: 48rpx; // 为删除按钮留出空间

            .name {
              font-size: 28rpx;
              color: $jel-font-title;
              font-weight: 500;
              margin-bottom: 8rpx;
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
              margin-bottom: 16rpx;
            }

            .bottom {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;

              .price-box {
                display: flex;
                flex-direction: column;
                gap: 4rpx;

                .price {
                  color: $jel-brandColor;
                  font-weight: bold;

                  .symbol {
                    font-size: 24rpx;
                  }

                  .number {
                    font-size: 32rpx;
                  }
                }
              }

              // 数量调整器
              .stepper {
                display: flex;
                align-items: center;
                border: 1px solid $jel-border;
                border-radius: 4rpx;
                overflow: hidden;

                .btn {
                  width: 56rpx;
                  height: 56rpx;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  background-color: #f5f5f5;

                  text {
                    font-size: 32rpx;
                    color: $jel-font-title;
                    font-weight: 500;
                    line-height: 1;
                  }

                  &.disabled {
                    opacity: 0.3;
                  }
                }

                .input {
                  width: 80rpx;
                  height: 56rpx;
                  text-align: center;
                  font-size: 28rpx;
                  color: $jel-font-title;
                  background-color: #fff;
                }
              }
            }
          }

          // 删除按钮
          .delete {
            position: absolute;
            top: 0;
            right: 0;
            padding: 8rpx;

            .iconfont {
              font-size: 32rpx;
              color: $jel-font-dec;
            }
          }
        }
      }

      // 底部占位元素
      .footer-placeholder {
        // 高度通过内联样式动态设置：120rpx + 安全区域高度
        flex-shrink: 0;
      }
    }
  }

  // 底部结算栏
  .footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: 120rpx;
    padding: 0 24rpx;
    background-color: #fff;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 2rpx solid $jel-border;
    border-bottom: 2rpx solid $jel-border;
    box-shadow: 0 -4rpx 12rpx rgba(0, 0, 0, 0.02);
    box-sizing: border-box;
    z-index: 999;

    // 左侧区域
    .left {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 24rpx;
      min-width: 0;

      .all-select {
        display: flex;
        align-items: center;
        gap: 8rpx;
        flex-shrink: 0;

        .checkbox {
          width: 40rpx;
          height: 40rpx;
          border: 2rpx solid #ccc;
          border-radius: 50%;
          position: relative;
          flex-shrink: 0;

          &.checked {
            border-color: $jel-brandColor;
            background-color: $jel-brandColor;

            &::after {
              content: '';
              position: absolute;
              left: 50%;
              top: 50%;
              transform: translate(-50%, -60%) rotate(45deg);
              width: 10rpx;
              height: 18rpx;
              border: 3rpx solid #fff;
              border-top: none;
              border-left: none;
            }
          }
        }

        .label {
          font-size: 28rpx;
          color: $jel-font-title;
        }
      }

      .total {
        display: flex;
        align-items: baseline;
        flex: 1;
        min-width: 0;

        .label {
          font-size: 24rpx;
          color: $jel-font-dec2;
          margin-right: 8rpx;
          white-space: nowrap;
        }

        .price {
          color: $jel-brandColor;
          font-weight: bold;

          .symbol {
            font-size: 22rpx;
          }

          .number {
            font-size: 32rpx;
          }
        }
      }
    }

    // 结算按钮
    .checkout-btn {
      padding: 16rpx 40rpx;
      background-color: $jel-brandColor;
      color: #fff;
      font-size: 28rpx;
      border-radius: 48rpx;
      font-weight: 500;
      white-space: nowrap;
      flex-shrink: 0;
    }
  }

  // 安全区域占位（在footer下方）
  .safe-area-placeholder {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    background-color: #fff;
    z-index: 998; // 比footer低一层
  }
}
</style>
