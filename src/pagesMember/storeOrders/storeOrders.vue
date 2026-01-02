<script setup lang="ts">
import { ref } from 'vue'
import { useMemberStore } from '@/stores'
import { onLoad } from '@dcloudio/uni-app'
import { formatPurchasedOrderState, formatTimestamp } from '@/utils/formatTimestamp.ts'
import { purchasedOrderCancelApi, purchaseOrderGetApi } from '@/api/purchase.ts'
import type { PurchaseItem } from '@/types/Purchase'

// 定义store
const userStore = useMemberStore()

// tag列表
const tagList = ref([
  { id: 'tag1', text: 'ALL', label: '全部' },
  { id: 'tag2', text: 'PAID', label: '待取货' },
  { id: 'tag3', text: 'COMPLETED', label: '已完成' },
  { id: 'tag4', text: 'CANCELLED', label: '已取消' },
])

// 分页
const params = ref({
  pageNum: 1,
  pageSize: 8,
})

// 重置函数
const reset = () => {
  finish.value = false
  loading.value = false
  params.value.pageNum = 1
}

// 默认下标
const activeIndex = ref(0)
// 状态发生改变时
const handleTag = (text: string, index: number) => {
  console.log('切换状态', text)
  activeIndex.value = index
  reset() // 重置订单页面信息
  //  请求进货单接口
  purchaseOrderListGet(userStore.profile._id, text, params.value.pageNum, params.value.pageSize)
}

// 订单列表
const finish = ref(false)
const loading = ref(false) // 防抖
const purchaseOrderList = ref<PurchaseItem[]>([])
const purchaseOrderListGet = async (
  userId: string,
  status: string,
  pageNum: number,
  pageSize: number,
) => {
  // 请求进货单
  if (finish.value) return // 退出分页
  const res = await purchaseOrderGetApi(userId, status, pageNum, pageSize)
  console.log('结果', res)
  // 如果是第一页就直接赋值，否则就用数组添加
  if (params.value.pageNum === 1) {
    purchaseOrderList.value = res.data.list
  } else {
    purchaseOrderList.value.push(...res.data.list)
  }

  // 加载分页
  if (params.value.pageNum < res.data.totalPage) {
    params.value.pageNum++
  } else {
    finish.value = true
  }
}

// 触底加载更多
const isLoading = ref(false) // 加载中标记，避免并发
const handleScrolltolower = async () => {
  if (finish.value || isLoading.value) return
  isLoading.value = true
  await purchaseOrderListGet(
    userStore.profile._id,
    tagList.value[activeIndex.value].text,
    params.value.pageNum,
    params.value.pageSize,
  )
  isLoading.value = false
}

// 跳转订单详情
const handleGoDetail = (orderNo: string) => {
  console.log('跳转订单详情', orderNo)
  uni.navigateTo({
    url: `/pagesMember/storeOrders/storeOrderDetail?orderNo=${orderNo}`,
  })
}

// 取消订单
const handleCancelOrder = (orderNo: string) => {
  console.log('取消订单', orderNo)
  uni.showModal({
    title: '提示',
    content: '确定要取消订单吗?',
    confirmColor: '#d62731',
    success: async (res) => {
      if (res.confirm) {
        // TODO: 实现取消订单逻辑
        const res = await purchasedOrderCancelApi(orderNo)
        if (res.code === 200) {
          // 请求成功，同步一下STORE里的运营资金
          userStore.setProfile({ operating_balance: res.data.operating_balance })
          // 重置分页状态，从第1页重新加载
          reset()
          await purchaseOrderListGet(
            userStore.profile._id,
            tagList.value[activeIndex.value].text,
            params.value.pageNum,
            params.value.pageSize,
          )
          // 退款提示
          await uni.showToast({
            icon: 'success',
            title: `订单已取消,运营资金退还${res.data.refunding}`,
          })
        }
      } else {
        console.log('已取消')
      }
    },
  })
}

onLoad(() => {
  if (userStore.profile?._id) {
    purchaseOrderListGet(userStore.profile._id, 'ALL', params.value.pageNum, params.value.pageSize)
  }
})
</script>

<template>
  <view class="product-order">
    <!-- 筛选标签 -->
    <view class="filter-bar">
      <view
        class="tag"
        v-for="(item, index) in tagList"
        :key="item.id"
        :class="{ active: activeIndex === index }"
        @click="handleTag(item.text, index)"
      >
        {{ item.label }}
      </view>
    </view>

    <!-- 订单列表 -->
    <scroll-view
      class="list"
      :scroll-y="true"
      :enhanced="true"
      :show-scrollbar="false"
      @scrolltolower="handleScrolltolower"
      v-if="purchaseOrderList.length > 0"
    >
      <view class="order-card" v-for="item in purchaseOrderList" :key="item._id">
        <!-- 头部：订单号 + 状态 -->
        <view class="card-head" @click="handleGoDetail(item.out_trade_no)">
          <view class="order-no">
            <text class="label">订单号：</text>
            <text class="value">{{ item.out_trade_no }}</text>
          </view>
          <view
            class="status"
            :class="{
              paid: item.status === 'PAID',
              shipped: item.status === 'SHIPPED',
              completed: item.status === 'COMPLETED',
              cancelled: item.status === 'CANCELLED',
            }"
          >
            {{ formatPurchasedOrderState(item.status) }}
          </view>
        </view>

        <!-- 商品列表--列表只显示2条以内的商品，需要详情查看 -->
        <view class="product-list" @click="handleGoDetail(item.out_trade_no)">
          <view
            class="product-item"
            v-for="product in item.products.slice(0, 2)"
            :key="product._id"
          >
            <!-- 商品图片 -->
            <image class="cover" :src="product.sku?.image || product.cover" mode="aspectFill" />

            <!-- 商品信息 -->
            <view class="info">
              <view class="name">{{ product.skuNo }} {{ product.name }}</view>
              <view class="spec" v-if="product.sku">
                {{ product.sku.attrs.label }}: {{ product.sku.attrs.value }}
              </view>
              <view class="bottom">
                <view class="price">￥{{ product.currentPrice.toFixed(2) }}</view>
                <view class="quantity">x{{ product.quantity }}</view>
              </view>
            </view>
          </view>
        </view>

        <!-- 订单金额和收货信息 -->
        <view class="order-info" @click="handleGoDetail(item.out_trade_no)">
          <view class="info-row">
            <text class="label">下单时间：</text>
            <text class="value">{{ formatTimestamp(item.createdAt, 2) }}</text>
          </view>
        </view>

        <!-- 底部：总金额 + 操作按钮 -->
        <view class="card-foot">
          <view class="amount-info">
            <text class="label">共{{ item.totalCount }}件商品 合计：</text>
            <text class="price">￥{{ item.amount.actualPayment.toFixed(2) }}</text>
          </view>

          <view class="actions">
            <!-- 待取货：取消订单 + 查看详情 -->
            <template v-if="item.status === 'PAID'">
              <view class="btn ghost" @click.stop="handleCancelOrder(item.out_trade_no)"
                >取消订单</view
              >
              <view class="btn ghost" @click.stop="handleGoDetail(item.out_trade_no)"
                >查看详情</view
              >
            </template>

            <!-- 已完成：查看详情 -->
            <template v-if="item.status === 'COMPLETED'">
              <view class="btn ghost" @click.stop="handleGoDetail(item.out_trade_no)"
                >查看详情</view
              >
            </template>
          </view>
        </view>
      </view>
      <!--   触底提示   -->
      <view class="tips" v-if="!finish">加载更多</view>
      <view class="tips" v-else>没有更多数据~</view>
      <view class="bottom-space"></view>
    </scroll-view>

    <!-- 空状态 -->
    <view class="cart-blank" v-else>
      <image src="/static/images/empty.png" class="image" />
      <text class="text">当前没有任何订单</text>
    </view>
  </view>
</template>

<style scoped lang="scss">
.product-order {
  height: 100%;
  background-color: $jel-pageBackGroundColor;
  padding: 24rpx;
  box-sizing: border-box;

  .filter-bar {
    display: flex;
    gap: 16rpx;
    margin-bottom: 16rpx;
    overflow-x: auto;
    white-space: nowrap;

    &::-webkit-scrollbar {
      display: none;
    }

    .tag {
      padding: 8rpx 20rpx;
      font-size: 24rpx;
      color: $jel-font-title;
      background-color: #fff;
      border-radius: 999rpx;
      border: 1rpx solid #f0f0f0;
      flex-shrink: 0;

      &.active {
        color: #fff;
        background-color: $jel-brandColor;
        border-color: $jel-brandColor;
      }
    }
  }

  .list {
    height: calc(100vh - 160rpx);
  }

  .order-card {
    background-color: #fff;
    border-radius: 12rpx;
    margin-bottom: 16rpx;
    overflow: hidden;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);

    // 头部：订单号 + 状态
    .card-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20rpx 24rpx;
      border-bottom: 1rpx solid $jel-border;

      .order-no {
        flex: 1;
        min-width: 0;
        display: flex;
        align-items: center;

        .label {
          font-size: 24rpx;
          color: $jel-font-dec;
          flex-shrink: 0;
        }

        .value {
          font-size: 24rpx;
          color: $jel-font-title;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      .status {
        padding: 4rpx 12rpx;
        font-size: 22rpx;
        border-radius: 4rpx;
        flex-shrink: 0;
        margin-left: 16rpx;

        &.pending {
          color: #ff6b19;
          background-color: #fff3e9;
        }

        &.paid {
          color: #1890ff;
          background-color: #e6f7ff;
        }

        &.shipped {
          color: #faad14;
          background-color: #fffbe6;
        }

        &.completed {
          color: #52c41a;
          background-color: #f6ffed;
        }

        &.cancelled,
        &.refunded {
          color: #999;
          background-color: #f5f5f5;
        }
      }
    }

    // 商品列表
    .product-list {
      padding: 24rpx;
      border-bottom: 1rpx solid $jel-border;

      .product-item {
        display: flex;
        gap: 16rpx;
        margin-bottom: 16rpx;

        &:last-child {
          margin-bottom: 0;
        }

        .cover {
          width: 120rpx;
          height: 120rpx;
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
              font-size: 28rpx;
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

    // 订单信息
    .order-info {
      padding: 20rpx 24rpx;
      border-bottom: 1rpx solid $jel-border;

      .info-row {
        display: flex;
        font-size: 24rpx;
        margin-bottom: 8rpx;

        &:last-child {
          margin-bottom: 0;
        }

        .label {
          color: $jel-font-dec;
          flex-shrink: 0;
        }

        .value {
          flex: 1;
          color: $jel-font-title;
          word-break: break-all;
        }
      }
    }

    // 底部：金额 + 操作
    .card-foot {
      padding: 20rpx 24rpx;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16rpx;

      .amount-info {
        flex: 1;
        display: flex;
        align-items: baseline;
        min-width: 0;

        .label {
          font-size: 24rpx;
          color: $jel-font-dec;
          margin-right: 8rpx;
          flex-shrink: 0;
        }

        .price {
          font-size: 32rpx;
          font-weight: bold;
          color: $jel-brandColor;
        }
      }

      .actions {
        display: flex;
        gap: 12rpx;
        flex-shrink: 0;

        .btn {
          padding: 12rpx 24rpx;
          font-size: 24rpx;
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
    }
  }

  .bottom-space {
    height: 80rpx;
  }

  /* 加载见底提示 */
  .tips {
    margin-top: 24rpx;
    text-align: center;
    color: $jel-font-dec;
    font-size: 24rpx;
  }

  // 空状态
  .cart-blank {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    height: 60vh;

    .image {
      width: 160rpx;
      height: 200rpx;
    }

    .text {
      color: $jel-font-title;
      font-size: 26rpx;
      margin: 20rpx 0;
    }
  }
}
</style>
