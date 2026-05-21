<script setup lang="ts">
import { ref } from 'vue'
import { useMemberStore } from '@/stores'
import { onLoad } from '@dcloudio/uni-app'
import {
  formatAmount,
  formatPurchasedOrderState,
  formatTimestamp,
} from '@/utils/formatTimestamp.ts'
import { purchaseOrderGetApi, purchaseOrderSearchBySkuNoApi } from '@/api/purchase.ts'
import type { OrderItem } from '@/types/Order'
import { confirmOrderLogistics, proOrderCancelApi } from '@/api/order'

// 定义store
const userStore = useMemberStore()

// tag列表
const tagList = ref([
  { id: 'tag1', text: 'ALL', label: '全部' },
  { id: 'tag2', text: 'PAID', label: '待取货' },
  { id: 'tag3', text: 'SHIPPED', label: '待收货' },
  { id: 'tag4', text: 'COMPLETED', label: '已完成' },
  { id: 'tag5', text: 'CANCELLED', label: '已取消' },
  { id: 'tag6', text: 'PROCESSING', label: '退款中/已退款' },
])

// 分页
const params = ref({
  pageNum: 1,
  pageSize: 8,
})

// 搜索框输入的商品货号
const searchSkuNo = ref('')
// 当前已生效的商品货号搜索条件
const activeSearchSkuNo = ref('')
// 是否处于货号搜索模式
const isSearchMode = () => !!activeSearchSkuNo.value

// 重置函数
const reset = () => {
  finish.value = false
  loading.value = false
  isLoading.value = false
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
  reloadPurchaseOrderList()
}

// 订单列表
const finish = ref(false)
const loading = ref(false) // 防抖
const purchaseOrderList = ref<OrderItem[]>([])
// 拉取普通订单分页列表
const purchaseOrderListGet = async (
  userId: string,
  status: string,
  pageNum: number,
  pageSize: number,
) => {
  // 请求进货单
  if (finish.value || loading.value) return // 退出分页
  loading.value = true
  try {
    const res = await purchaseOrderGetApi(userId, status, 'TOB', pageNum, pageSize)
    console.log('结果', res)
    // 如果是第一页就直接赋值，否则就用数组添加
    if (pageNum === 1) {
      purchaseOrderList.value = res.data.list
    } else {
      purchaseOrderList.value.push(...res.data.list)
    }

    // 加载分页
    if (pageNum < res.data.totalPage) {
      params.value.pageNum++
    } else {
      finish.value = true
    }
  } finally {
    loading.value = false
  }
}

// 拉取商品货号搜索订单分页列表
const searchPurchaseOrderListGet = async (
  userId: string,
  skuNo: string,
  status: string,
  pageNum: number,
  pageSize: number,
) => {
  if (finish.value || loading.value) return
  loading.value = true
  try {
    const res = await purchaseOrderSearchBySkuNoApi(userId, skuNo, status, 'TOB', pageNum, pageSize)
    console.log('搜索结果', res)
    if (pageNum === 1) {
      purchaseOrderList.value = res.data.list
    } else {
      purchaseOrderList.value.push(...res.data.list)
    }

    if (pageNum < res.data.totalPage) {
      params.value.pageNum++
    } else {
      finish.value = true
    }
  } finally {
    loading.value = false
  }
}

// 触底加载更多
const isLoading = ref(false) // 加载中标记，避免并发
// 订单列表触底加载下一页
const handleScrolltolower = async () => {
  if (finish.value || isLoading.value) return
  isLoading.value = true
  try {
    await reloadPurchaseOrderList()
  } finally {
    isLoading.value = false
  }
}

// 根据当前模式重新加载订单列表
const reloadPurchaseOrderList = () => {
  if (!userStore.profile?.id) return
  const status = tagList.value[activeIndex.value].text
  if (isSearchMode()) {
    return searchPurchaseOrderListGet(
      userStore.profile.id,
      activeSearchSkuNo.value,
      status,
      params.value.pageNum,
      params.value.pageSize,
    )
  }

  return purchaseOrderListGet(
    userStore.profile.id,
    status,
    params.value.pageNum,
    params.value.pageSize,
  )
}

// 提交商品货号搜索
const handleSearch = () => {
  activeSearchSkuNo.value = searchSkuNo.value.trim()
  reset()
  purchaseOrderList.value = []
  reloadPurchaseOrderList()
}

// 清空商品货号搜索并恢复普通订单列表
const handleClearSearch = () => {
  searchSkuNo.value = ''
  activeSearchSkuNo.value = ''
  reset()
  purchaseOrderList.value = []
  reloadPurchaseOrderList()
}

// 跳转订单详情
const handleGoDetail = (orderNo: string) => {
  console.log('跳转订单详情', orderNo)
  uni.navigateTo({
    url: `/pagesMember/storeOrders/storeOrderDetail?orderNo=${orderNo}`,
  })
}

// 确认收货（与 myOrder 一致）
const handleConfirm = (orderNo: string, _transactionId: string) => {
  uni.showModal({
    title: '提示',
    content: '确认收货吗',
    confirmColor: '#d62731',
    success: async (success) => {
      if (success.confirm) {
        const result = await confirmOrderLogistics(userStore.profile.id, orderNo)
        if (result.code === 200) {
          activeIndex.value = tagList.value.findIndex((item) => item.text === 'COMPLETED')
          reset()
          await reloadPurchaseOrderList()
          await uni.showToast({
            title: '订单已完成',
            icon: 'success',
            mask: true,
          })
        }
      }
    },
  })
}

// 取消订单并退款
const handleCancel = (outTradeNo: string, actualPayment: string) => {
  const amount = Number(actualPayment)
  console.log('取消订单', outTradeNo, amount)
  uni.showModal({
    title: '提示',
    content: '确定要取消该订单吗？',
    async success(res) {
      if (res.confirm) {
        const res = await proOrderCancelApi(outTradeNo, amount)
        console.log('退款接口', res.data)
        if (res.data.status === 'PROCESSING') {
          console.log('退款中')
          // 将激活下标设定到更新项
          activeIndex.value = tagList.value.findIndex((item) => item.text === 'PROCESSING')
          reset()
          // 重新拉取订单数据
          await reloadPurchaseOrderList()
        }
        uni.showToast({ icon: 'none', title: '申请已提交', mask: true })
      }
    },
    fail: (fail) => {
      uni.showToast({ icon: 'none', title: '服务器繁忙', mask: true })
    },
  })
}

// 页面进入时加载订单列表
onLoad(() => {
  if (userStore.profile?.id) {
    reloadPurchaseOrderList()
  }
})
</script>

<template>
  <view class="product-order">
    <view class="search-card">
      <view class="search-box">
        <text class="search-box__icon iconfont icon-sousuo"></text>
        <input
          v-model="searchSkuNo"
          class="search-box__input"
          type="text"
          confirm-type="search"
          placeholder="输入商品货号搜索订单"
          placeholder-class="search-box__placeholder"
          @confirm="handleSearch"
        />
        <text v-if="searchSkuNo" class="search-box__clear" @click="handleClearSearch">清除</text>
      </view>
      <button class="search-card__btn" type="default" @click="handleSearch">搜索</button>
    </view>

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
      <view class="order-card" v-for="item in purchaseOrderList" :key="item.id">
        <!-- 头部：订单号 + 状态 -->
        <view class="card-head" @click="handleGoDetail(item.outTradeNo)">
          <view class="order-no">
            <text class="label">订单号：</text>
            <text class="value">{{ item.outTradeNo }}</text>
          </view>
          <view
            class="status"
            :class="{
              paid: item.status === 'PAID',
              pending: item.status === 'PENDING',
              shipped: item.status === 'SHIPPED',
              completed: item.status === 'COMPLETED',
              cancelled: item.status === 'CANCELLED',
              refunded: item.status === 'REFUNDED' || item.status === 'PROCESSING',
            }"
          >
            {{ formatPurchasedOrderState(item.status) }}
          </view>
        </view>

        <!-- 商品列表--列表只显示2条以内的商品，需要详情查看 -->
        <view class="product-list" @click="handleGoDetail(item.outTradeNo)">
          <view class="product-item" v-for="product in item.products.slice(0, 2)" :key="product.id">
            <!-- 商品图片 -->
            <image class="cover" :src="product.image" mode="aspectFill" />

            <!-- 商品信息 -->
            <view class="info">
              <view class="name">{{ product.skuNo }} {{ product.name }}</view>
              <view class="spec" v-if="product.model">
                {{ product.model }}
              </view>
              <view class="spec" v-if="product.skuId">
                {{ product.skuName }}
              </view>
              <view class="bottom">
                <view class="price">￥{{ formatAmount(product.price) }}</view>
                <view class="quantity">x{{ product.quantity }}</view>
              </view>
            </view>
          </view>
        </view>

        <!-- 订单金额和收货信息 -->
        <view class="order-info" @click="handleGoDetail(item.outTradeNo)">
          <view class="info-row">
            <text class="label">下单时间：</text>
            <text class="value">{{ formatTimestamp(item.createdAt, 2) }}</text>
          </view>
        </view>

        <!-- 底部：总金额 + 操作按钮 -->
        <view class="card-foot">
          <view class="amount-info">
            <text class="label">共{{ item.totalCount }}件商品 合计：</text>
            <text class="price">￥{{ formatAmount(item.actualPayment) }}</text>
          </view>

          <view class="actions">
            <!-- 待取货：取消订单 + 查看详情 -->
            <template v-if="item.status === 'PAID'">
              <view
                class="btn ghost"
                @click.stop="handleCancel(item.outTradeNo, item.actualPayment)"
                >取消订单</view
              >
              <view class="btn ghost" @click.stop="handleGoDetail(item.outTradeNo)">查看详情</view>
            </template>

            <!-- 待收货：确认收货 -->
            <template v-if="item.status === 'SHIPPED'">
              <view
                class="btn primary"
                @click.stop="handleConfirm(item.outTradeNo, item.transactionId ?? '')"
              >
                确认收货
              </view>
            </template>

            <!-- 已完成：查看详情 -->
            <template v-if="item.status === 'COMPLETED'">
              <view class="btn ghost" @click.stop="handleGoDetail(item.outTradeNo)">查看详情</view>
            </template>

            <!-- 已取消：查看详情 -->
            <template v-if="item.status === 'CANCELLED'">
              <view class="btn ghost" @click.stop="handleGoDetail(item.outTradeNo)">查看详情</view>
            </template>

            <!-- 退款中/已退款：查看详情 -->
            <template v-if="item.status === 'PROCESSING' || item.status === 'REFUNDED'">
              <view
                class="btn ghost"
                :class="{ refunded: item.status === 'REFUNDED' }"
                @click.stop="handleGoDetail(item.outTradeNo)"
                >{{ item.status === 'PROCESSING' ? '退款中' : '已退款' }}</view
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
      <text class="text">{{ activeSearchSkuNo ? '未找到相关订单' : '当前没有任何订单' }}</text>
    </view>
  </view>
</template>

<style scoped lang="scss">
.product-order {
  height: 100%;
  background-color: $jel-pageBackGroundColor;
  padding: 24rpx;
  box-sizing: border-box;

  .search-card {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-bottom: 16rpx;
  }

  .search-box {
    flex: 1;
    min-width: 0;
    height: 72rpx;
    padding: 0 20rpx;
    display: flex;
    align-items: center;
    gap: 12rpx;
    background-color: #fff;
    border: 1rpx solid #f0f0f0;
    border-radius: 999rpx;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);

    &__icon {
      font-size: 28rpx;
      color: $jel-font-dec;
      flex-shrink: 0;
    }

    &__input {
      flex: 1;
      min-width: 0;
      height: 72rpx;
      font-size: 26rpx;
      color: $jel-font-title;
    }

    &__placeholder {
      color: #b8b8b8;
      font-size: 26rpx;
    }

    &__clear {
      flex-shrink: 0;
      font-size: 24rpx;
      color: $jel-font-dec;
      line-height: 1;
      padding-left: 8rpx;
    }
  }

  .search-card__btn {
    flex-shrink: 0;
    width: 132rpx;
    height: 72rpx;
    line-height: 72rpx;
    padding: 0;
    margin: 0;
    border-radius: 999rpx;
    font-size: 26rpx;
    font-weight: 600;
    color: #fff;
    background-color: $jel-brandColor;

    &::after {
      border: none;
    }
  }

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
    height: calc(100vh - 248rpx);
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

          &.refunded {
            color: #ffffff;
            background-color: $jel-font-success;
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
