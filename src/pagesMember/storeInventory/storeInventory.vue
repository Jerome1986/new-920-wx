<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeGetInventoryApi } from '@/api/store.ts'
import { useCartTobStore, useManagerStore } from '@/stores'
import { onLoad } from '@dcloudio/uni-app'
import type { StoreInventoryItem } from '@/types/StoreInventory'

// store
const managerStore = useManagerStore()
const cartTobStore = useCartTobStore()

// 搜索关键词
const searchKeyword = ref('')

// 滚动区域高度
const scrollHeight = ref(0)

const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)
const remainingStock = ref(0)
const finish = ref(false)
// 库存数据
const inventoryList = ref<StoreInventoryItem[]>([])
const inventoryListGet = async (storeId: string) => {
  if (finish.value) return
  const res = await storeGetInventoryApi(storeId, 0, pageNum.value, pageSize.value)
  console.log(res)
  inventoryList.value.push(...res.data.list)
  total.value = res.data.total

  if (pageNum.value < res.data.totalPage) {
    pageNum.value++
  } else {
    finish.value = true
  }
}

// 获取剩余库存总数
const remainingStockGet = async (storeId: string) => {
  const summaryPageSize = 1000
  let currentPage = 1
  let totalPage = 1
  let stockTotal = 0

  do {
    const res = await storeGetInventoryApi(storeId, 0, currentPage, summaryPageSize)
    stockTotal += res.data.list.reduce((sum, item) => sum + Number(item.stock || 0), 0)
    totalPage = res.data.totalPage || 1
    currentPage++
  } while (currentPage <= totalPage)

  remainingStock.value = stockTotal
}

// 加载更多
const handleMore = () => {
  if (finish.value) return
  inventoryListGet(managerStore.managerStoreInfo?.id as string)
}

onLoad(() => {
  if (managerStore.managerStoreInfo?.id) {
    inventoryListGet(managerStore.managerStoreInfo?.id)
    remainingStockGet(managerStore.managerStoreInfo?.id)
  }
})

// 过滤后的列表
const filteredList = computed(() => {
  if (!searchKeyword.value) {
    return inventoryList.value
  }
  const keyword = searchKeyword.value.toLowerCase()
  return inventoryList.value.filter(
    (item) =>
      item.productName.toLowerCase().includes(keyword) ||
      item.skuNo.toLowerCase().includes(keyword),
  )
})

// 计算滚动区域高度
const initScrollHeight = () => {
  const systemInfo = uni.getSystemInfoSync()
  // 减去顶部统计卡片、搜索栏、容器padding等高度
  scrollHeight.value = systemInfo.windowHeight - 220
}
// 页面加载
initScrollHeight()

// 一键补货
const handleOneClickRestock = async () => {
  // 1.扫描当前所有库存所有商品，找到库存不足的商品
  const res = await storeGetInventoryApi(managerStore.managerStoreInfo?.id as string, 0, 1, 1000)
  const allProduct = res.data.list
  const lowProduct = allProduct.filter((a) => a.stock < a.minStock)
  if (!lowProduct.length) {
    uni.showToast({ icon: 'none', title: '当前库存充足' })
    return
  }
  uni.showModal({
    title: '提示',
    content: '是否一次补足库存',
    confirmColor: '#d62731',
    success: (success) => {
      if (success.confirm) {
        // 2.将需要补充的数量提交到采购车
        const cartData = lowProduct.map((low) => ({
          id: low.id,
          selected: true,
          productId: low.productId,
          skuNo: low.skuNo,
          skuId: low.skuId,
          name: low.productName,
          dec: low.productDec,
          cover: low.cover,
          salePrice: low.costPrice,
          quantity: low.minStock - low.stock,
        }))
        cartTobStore.cartTobList = cartData
        setTimeout(() => {
          uni.redirectTo({ url: '/pagesMember/purchaseCart/purchaseCart' })
        }, 500)
      }
    },
  })
}
</script>

<template>
  <view class="container">
    <!-- 顶部统计卡片 -->
    <view class="stat-card">
      <view class="stat-item">
        <text class="stat-value">{{ total }}</text>
        <text class="stat-label">库存商品</text>
      </view>
      <view class="divider"></view>
      <view class="stat-item">
        <view class="stat-value-row">
          <text class="stat-value">{{ remainingStock }}</text>
          <text class="stat-unit">片</text>
        </view>
        <text class="stat-label">剩余库存</text>
      </view>
      <view class="divider"></view>
      <view class="stat-item stat-item--restock">
        <view class="stat-restock-btn" @click="handleOneClickRestock">
          <text class="stat-restock-btn__text">一键补货</text>
        </view>
      </view>
    </view>

    <!-- 搜索栏 -->
    <view class="search-bar">
      <text class="iconfont icon-search"></text>
      <input
        type="text"
        v-model="searchKeyword"
        placeholder="搜索商品名称或货号"
        placeholder-class="placeholder"
      />
    </view>

    <!-- 库存列表 -->
    <scroll-view
      @scrolltolower="handleMore"
      :scroll-y="true"
      class="inventory-list"
      :style="{ height: scrollHeight + 'px' }"
    >
      <view class="inventory-item" v-for="item in filteredList" :key="item.id">
        <!-- 低库存标记（基于片数） -->
        <view class="low-stock-tag" v-if="item.stock < item.minStock">
          <text>补货</text>
        </view>

        <!-- 商品图片 -->
        <image class="product-cover" :src="item.cover" mode="aspectFill"></image>

        <!-- 商品信息 -->
        <view class="product-info">
          <view class="product-header">
            <text class="product-name">{{ item.productName }}</text>
          </view>

          <view class="product-sku-no">
            <text class="sku-label">货号：</text>
            <text class="sku-value">{{ item.skuNo }}</text>
          </view>

          <view class="product-bottom">
            <view class="price-info">
              <view class="price-row">
                <text class="price-label">进货价</text>
                <text class="price-value retail">¥{{ Number(item.costPrice).toFixed(2) }}</text>
              </view>
              <view class="price-row">
                <text class="price-label">零售价</text>
                <text class="price-value retail">¥{{ Number(item.salePrice).toFixed(2) }}</text>
              </view>
            </view>

            <view class="stock-info">
              <view class="stock-box" :class="{ low: item.stock < item.minStock }">
                <text class="stock-quantity">{{ item.stock }}</text>
                <text class="stock-unit">片</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view class="empty-state" v-if="filteredList.length === 0">
        <text class="empty-icon">📦</text>
        <text class="empty-text">暂无库存数据</text>
      </view>
    </scroll-view>
  </view>
</template>

<style scoped lang="scss">
.container {
  min-height: 100vh;
  background-color: $jel-pageBackGroundColor;
  padding: 24rpx;
  box-sizing: border-box;
}

// 统计卡片
.stat-card {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, $jel-brandColor 0%, #ff4757 100%);
  border-radius: 20rpx;
  padding: 40rpx 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(214, 39, 49, 0.25);

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8rpx;
    flex: 1;

    .stat-value {
      font-size: 56rpx;
      font-weight: 700;
      color: #ffffff;
      line-height: 1.2;
    }

    .stat-value-row {
      display: flex;
      align-items: baseline;
      justify-content: center;
      max-width: 100%;

      .stat-unit {
        margin-left: 6rpx;
        font-size: 24rpx;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.9);
        line-height: 1;
      }
    }

    .stat-label {
      font-size: 26rpx;
      color: rgba(255, 255, 255, 0.85);
    }

    &.stat-item--restock {
      justify-content: center;
    }

    .stat-restock-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 14rpx 28rpx;
      border-radius: 32rpx;
      background-color: rgba(255, 255, 255, 0.95);
      box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.12);

      .stat-restock-btn__text {
        font-size: 26rpx;
        font-weight: 600;
        color: $jel-brandColor;
        line-height: 1.2;
      }
    }
  }

  .divider {
    width: 2rpx;
    height: 80rpx;
    background-color: rgba(255, 255, 255, 0.3);
    margin: 0 24rpx;
  }
}

// 搜索栏
.search-bar {
  display: flex;
  align-items: center;
  background-color: #ffffff;
  border-radius: 40rpx;
  padding: 20rpx 30rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);

  .iconfont {
    font-size: 36rpx;
    color: $jel-font-dec;
    margin-right: 16rpx;
  }

  input {
    flex: 1;
    font-size: 28rpx;
    color: $jel-font-title;
  }

  .placeholder {
    color: $jel-font-dec;
  }
}

// 库存列表
.inventory-list {
  .inventory-item {
    position: relative;
    display: flex;
    background-color: #ffffff;
    border-radius: 16rpx;
    padding: 24rpx;
    margin-bottom: 20rpx;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
    overflow: hidden;

    // 低库存标记
    .low-stock-tag {
      position: absolute;
      top: 0;
      left: 0;
      z-index: 10;
      background: linear-gradient(135deg, #ff6b6b 0%, $jel-brandColor 100%);
      padding: 6rpx 20rpx 6rpx 12rpx;
      border-radius: 0 0 20rpx 0;

      text {
        font-size: 22rpx;
        color: #ffffff;
        font-weight: 500;
      }
    }

    .product-cover {
      width: 180rpx;
      height: 180rpx;
      border-radius: 12rpx;
      background-color: $jel-pageBackGroundColor;
      flex-shrink: 0;
    }

    .product-info {
      flex: 1;
      margin-left: 20rpx;
      display: flex;
      flex-direction: column;
      justify-content: space-between;

      .product-header {
        .product-name {
          font-size: 30rpx;
          font-weight: 600;
          color: $jel-font-title;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 1;
          line-clamp: 1;
          overflow: hidden;
        }
      }

      .product-spec,
      .product-sku-no {
        display: flex;
        align-items: center;
        margin-top: 8rpx;

        .spec-label,
        .sku-label {
          font-size: 24rpx;
          color: $jel-font-dec;
        }

        .spec-value,
        .sku-value {
          font-size: 24rpx;
          color: $jel-font-dec2;
        }
      }

      .product-bottom {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-top: 12rpx;

        .price-info {
          display: flex;
          flex-direction: column;
          gap: 4rpx;

          .price-row {
            display: flex;
            align-items: center;
            gap: 8rpx;

            .price-label {
              font-size: 22rpx;
              color: $jel-font-dec;
            }

            .price-value {
              font-size: 26rpx;
              font-weight: 600;

              &.retail {
                color: $jel-brandColor;
              }

              &.cost {
                color: $jel-font-dec2;
              }
            }
          }
        }

        .stock-info {
          display: flex;
          align-items: flex-end;

          .stock-box {
            display: flex;
            align-items: flex-end;
            background-color: rgba(39, 178, 11, 0.1);
            padding: 12rpx 20rpx;
            border-radius: 12rpx;

            &.low {
              background-color: rgba(214, 39, 49, 0.1);

              .stock-quantity {
                color: $jel-brandColor;
              }

              .stock-unit {
                color: $jel-brandColor;
              }
            }

            .stock-quantity {
              font-size: 40rpx;
              font-weight: 700;
              color: $jel-font-success;
              line-height: 1;
            }

            .stock-unit {
              font-size: 24rpx;
              color: $jel-font-success;
              margin-left: 6rpx;
              font-weight: 500;
            }
          }
        }
      }
    }
  }
}

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;

  .empty-icon {
    font-size: 120rpx;
    margin-bottom: 24rpx;
  }

  .empty-text {
    font-size: 28rpx;
    color: $jel-font-dec;
  }
}
</style>
