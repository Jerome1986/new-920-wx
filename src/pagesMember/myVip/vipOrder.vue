<script setup lang="ts">
import { ref } from 'vue'
import { useMemberStore } from '@/stores'
import { onLoad } from '@dcloudio/uni-app'
import { formatTimestamp } from '@/utils/formatTimestamp.ts'
import type { VipOrderItem } from '@/types/Order'
import { vipOrderGetApi } from '@/api/order.ts'

// 定义store
const userStore = useMemberStore()

// tag列表（会员订单无需物流状态）
const tagList = ref([
  { id: 'tag1', text: 'ALL', label: '全部' },
  { id: 'tag2', text: 'PAID', label: '已开通' },
  // { id: 'tag3', text: 'PENDING', label: '待支付' },
  { id: 'tag4', text: 'CANCELLED', label: '已取消' },
])

// 默认下标
const activeIndex = ref(0)

// 状态发生改变时
const handleTag = (text: string, index: number) => {
  console.log('切换状态', text)
  activeIndex.value = index
  // TODO: 根据状态筛选订单
  orderListGet(userStore.profile._id, text)
}

// 订单列表
const orderList = ref<VipOrderItem[]>([])

// 获取订单列表
const orderListGet = async (userId: string, status: string) => {
  console.log('获取会员订单列表', userId, status)
  // TODO: 调用API获取会员订单列表
  const res = await vipOrderGetApi(userId, status)
  orderList.value = res.data
}

// 格式化会员订单状态（会员订单特有）
const formatVipOrderState = (status: string) => {
  const stateMap: Record<string, string> = {
    PAID: '已开通',
    PENDING: '待支付',
    CANCELLED: '已取消',
    REFUNDED: '已退款',
  }
  return stateMap[status] || status
}

onLoad(() => {
  if (userStore.profile?._id) {
    orderListGet(userStore.profile._id, 'ALL')
  }
})
</script>

<template>
  <view class="vip-order">
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
      v-if="orderList.length > 0"
    >
      <view class="order-card" v-for="item in orderList" :key="item._id">
        <!-- 头部：会员级别 + 状态 -->
        <view class="card-head">
          <view class="left">
            <view class="vip-badge"></view>
            <view class="level">{{ item.vipLevelText }}</view>
          </view>
          <view
            class="status"
            :class="{
              paid: item.status === 'PAID',
              pending: item.status === 'PENDING',
              cancelled: item.status === 'CANCELLED',
            }"
          >
            {{ formatVipOrderState(item.status) }}
          </view>
        </view>

        <!-- 内容：权益速览 + 价格 -->
        <view class="card-body">
          <view class="features">
            <view class="feature">
              <text class="label">使用人数</text>
              <text class="value">{{ item.maxUsers }}人</text>
            </view>
            <view class="divider"></view>
            <view class="feature">
              <text class="label">赠送贴膜</text>
              <text class="value">{{ item.limit }}次</text>
            </view>
            <view class="divider"></view>
            <view class="feature">
              <text class="label">有效期</text>
              <text class="value">{{ item.term }}</text>
            </view>
          </view>

          <view class="price-row">
            <text class="symbol">￥</text>
            <text class="price">{{ Number(item.amount).toFixed(2) }}</text>
          </view>
        </view>

        <!-- 底部信息：订单号/时间/支付方式 + 操作 -->
        <view class="card-foot">
          <view class="meta">
            <view class="row">
              <text class="label" style="width: fit-content">订单号</text>
              <text class="value">{{ item.out_trade_no }}</text>
            </view>
            <view class="row">
              <text class="label">下单时间</text>
              <text class="value">{{ formatTimestamp(item.createdAt, 2) }}</text>
            </view>
            <view class="row">
              <text class="label">支付方式</text>
              <text class="value">微信支付</text>
            </view>
          </view>
        </view>
      </view>

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
.vip-order {
  height: 100%;
  background-color: $jel-pageBackGroundColor;
  padding: 24rpx;
  box-sizing: border-box;

  .filter-bar {
    display: flex;
    gap: 16rpx;
    margin-bottom: 16rpx;

    .tag {
      padding: 8rpx 20rpx;
      font-size: 24rpx;
      color: $jel-font-title;
      background-color: #fff;
      border-radius: 999rpx;
      border: 1rpx solid #f0f0f0;

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
    border-radius: 16rpx;
    padding: 20rpx;
    margin-bottom: 16rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.04);
    overflow: hidden;

    .card-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12rpx;

      .left {
        display: flex;
        align-items: center;
        gap: 12rpx;
        min-width: 0;

        .vip-badge {
          width: 28rpx;
          height: 28rpx;
          border-radius: 50%;
          background: linear-gradient(180deg, #ffd66e, #ffb800);
          box-shadow: inset 0 2rpx 4rpx rgba(0, 0, 0, 0.08);
          flex-shrink: 0;
        }

        .level {
          font-size: 28rpx;
          color: $jel-font-title;
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      .status {
        padding: 6rpx 14rpx;
        font-size: 22rpx;
        border-radius: 999rpx;
        border: 1rpx solid #eee;
        color: $jel-font-title;
        flex-shrink: 0;

        &.paid {
          color: #27b20b;
          background-color: #eef9ee;
          border-color: #e0f2e0;
        }

        &.pending {
          color: #ff6b19;
          background-color: #fff3e9;
          border-color: #ffe3cc;
        }

        &.cancelled,
        &.refunded {
          color: #999;
          background-color: #f5f5f5;
          border-color: #eee;
        }
      }
    }

    .card-body {
      margin-top: 12rpx;

      .features {
        display: flex;
        align-items: center;
        background-color: #fafafa;
        border-radius: 12rpx;
        padding: 12rpx;
        overflow: hidden;

        .feature {
          flex: 1;
          text-align: center;

          .label {
            font-size: 22rpx;
            color: $jel-font-dec;
          }

          .value {
            margin-top: 4rpx;
            display: block;
            font-size: 26rpx;
            color: $jel-font-title;
            font-weight: 600;
          }
        }

        .divider {
          width: 1rpx;
          height: 28rpx;
          background-color: #eee;
        }
      }

      .price-row {
        margin-top: 16rpx;
        display: flex;
        align-items: baseline;
        justify-content: flex-end;
        color: $jel-brandColor;

        .symbol {
          font-size: 24rpx;
        }

        .price {
          font-size: 40rpx;
          font-weight: 700;
          margin-left: 4rpx;
        }
      }
    }

    .card-foot {
      margin-top: 16rpx;
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 16rpx;

      .meta {
        flex: 1 1 auto;
        min-width: 0;
        display: grid;
        grid-template-columns: 140rpx 1fr;
        row-gap: 8rpx;
        column-gap: 12rpx;
        align-items: center;

        .row {
          display: contents;
        }

        .label {
          font-size: 22rpx;
          color: $jel-font-dec;
        }

        .value {
          font-size: 24rpx;
          color: $jel-font-title;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      .actions {
        display: flex;
        gap: 12rpx;
        flex-shrink: 0;

        .btn {
          padding: 12rpx 22rpx;
          font-size: 24rpx;
          border-radius: 999rpx;
          white-space: nowrap;

          &.ghost {
            color: $jel-brandColor;
            border: 1rpx solid $jel-brandColor;
            background-color: #fff;
          }

          &.primary {
            color: #fff;
            background-color: $jel-brandColor;
          }
        }
      }
    }
  }

  .bottom-space {
    height: 80rpx;
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
