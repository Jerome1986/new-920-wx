<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { cateMoGetApi } from '@/api/cate.ts'
import { deviceFindPhoneNameApi } from '@/api/device.ts'
import { searchInventoryApi, storeGetInventoryApi } from '@/api/store.ts'
import { useManagerStore } from '@/stores'
import type { CateItem } from '@/types/CateItem'
import type { StoreInventoryItem } from '@/types/StoreInventory'
import {
  isMatch,
  normalize,
  searchInventoryProduct,
} from '@/pagesMember/sellPage/useProductSearch.ts'

// 门店 store
const managerStore = useManagerStore()

// 搜索关键词
const keyword = ref('')

// 当前识别到的本机型号
const selectedModel = ref('')

// 是否开启本机型号筛选
const modelFilterEnabled = ref(false)

// 顶部标签激活索引
const activeTagIndex = ref(0)

// 顶部标签列表
const tagList = ref<CateItem[]>([])

// 左侧分类激活索引
const activeCateIndex = ref(0)

// 左侧分类列表
const cateList = ref<CateItem[]>([])

// 分页参数
const params = ref({
  pageNum: 1,
  pageSize: 10,
})

// 是否加载完成
const finish = ref(false)

// 是否加载中
const loading = ref(false)

// 产品列表
const inventoryList = ref<StoreInventoryItem[]>([])

// 获取当前分类ID
const currentCateId = () => cateList.value[activeCateIndex.value]?.id

// 重置分页
const reset = () => {
  params.value.pageNum = 1
  finish.value = false
}

// 根据标签切换左侧分类
const changeCateList = (tagId: number) => {
  cateList.value = tagList.value.flatMap(
    (item) => item.children?.filter((c) => c.parentId === tagId) ?? [],
  )
}

// 获取本机设备型号
const getPhoneModel = async () => {
  selectedModel.value = uni.getSystemInfoSync().model
  console.log('设备', uni.getSystemInfoSync())

  const res = await deviceFindPhoneNameApi(selectedModel.value)

  if (res.code === 200) {
    selectedModel.value = res.data.phoneName
  }
}

// 获取产品列表
const productListGet = async (cateId?: number) => {
  const storeId = managerStore.managerStoreInfo?.id
  if (!storeId || !cateId || finish.value || loading.value) return

  loading.value = true

  try {
    const { pageNum, pageSize } = params.value
    const res = await storeGetInventoryApi(storeId, cateId, pageNum, pageSize)

    if (pageNum === 1) {
      inventoryList.value = res.data.list
    } else {
      inventoryList.value.push(...res.data.list)
    }

    if (pageNum < res.data.totalPage) {
      params.value.pageNum++
    } else {
      finish.value = true
    }
  } catch {
    /* 产品列表加载失败 */
  } finally {
    loading.value = false
  }
}

// 获取标签列表
const tagListGet = async () => {
  const res = await cateMoGetApi('TOB')

  tagList.value = res.data.flatMap((item) => {
    if (item.name === '手机膜' && item.children?.length) {
      return item.children || []
    }
    return []
  })

  if (!tagList.value.length) return

  changeCateList(tagList.value[0].id)
  await productListGet(currentCateId())
}

// 处理产品搜索
const handleSearch = async () => {
  const storeId = managerStore.managerStoreInfo?.id
  const cateId = currentCateId()
  if (!storeId || !cateId) return

  reset()
  modelFilterEnabled.value = false
  const result = await searchInventoryApi(storeId, keyword.value.trim().toLocaleLowerCase(), cateId)
  inventoryList.value = result.data
}

// 处理清空搜索
const handleSearchClear = async () => {
  keyword.value = ''
  reset()
  await productListGet(currentCateId())
}

// 处理标签切换
const handleTagChange = async (index: number, cateId: number) => {
  activeTagIndex.value = index
  activeCateIndex.value = 0
  keyword.value = ''
  modelFilterEnabled.value = false
  reset()
  changeCateList(cateId)
  await productListGet(currentCateId())
}

// 处理分类切换
const handleCateChange = async (index: number) => {
  activeCateIndex.value = index
  keyword.value = ''
  modelFilterEnabled.value = false
  reset()
  await productListGet(currentCateId())
}

// 处理列表触底加载
const handleLoadMore = async () => {
  if (keyword.value || modelFilterEnabled.value) return
  await productListGet(currentCateId())
}

// 处理本机型号搜索
const handleSearchLocal = async (e: any) => {
  modelFilterEnabled.value = e.detail.value
  keyword.value = ''
  reset()
  await productListGet(currentCateId())

  if (modelFilterEnabled.value) {
    inventoryList.value = searchInventoryProduct(selectedModel.value, inventoryList.value)
  }
}

onLoad(async () => {
  await getPhoneModel()
  await tagListGet()
})
</script>

<template>
  <view class="user-find-mo">
    <!-- 顶部搜索区域 -->
    <view class="header-section">
      <view class="banner-placeholder"></view>
      <view class="search-box">
        <uni-search-bar
          v-model="keyword"
          placeholder="搜索手机型号"
          :radius="12"
          bgColor="#fff"
          cancelButton="none"
          clearButton="auto"
          @confirm="handleSearch"
          @clear="handleSearchClear"
        />
      </view>
    </view>

    <!-- 本机设备识别 -->
    <view class="model-section">
      <view class="model-icon">
        <text class="iconfont icon-shouji"></text>
      </view>
      <view class="model-info">
        <text class="brand">本机设备</text>
        <text class="model-name">{{ selectedModel || '识别中' }}</text>
      </view>
      <switch
        :checked="modelFilterEnabled"
        color="#d62731"
        style="transform: scale(0.8)"
        @change="handleSearchLocal"
      />
    </view>

    <!-- 分类标签栏 -->
    <view class="tag-bar-wrapper">
      <scroll-view class="tag-bar" :scroll-x="true" :enhanced="true" :show-scrollbar="false">
        <view class="tag-list">
          <view
            v-for="(tag, index) in tagList"
            :key="tag.id"
            class="tag-item"
            :class="{ active: activeTagIndex === index }"
            @click="handleTagChange(index, tag.id)"
          >
            {{ tag.name }}
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 主体内容区域 -->
    <view class="main-content">
      <!-- 左侧分类导航 -->
      <view class="cate-nav-wrapper">
        <scroll-view class="cate-nav" :scroll-y="true" :show-scrollbar="false">
          <view
            v-for="(cate, index) in cateList"
            :key="cate.id"
            class="cate-item"
            :class="{ active: activeCateIndex === index }"
            @click="handleCateChange(index)"
          >
            <view v-if="activeCateIndex === index" class="cate-indicator"></view>
            <text class="cate-name">{{ cate.name }}</text>
          </view>
        </scroll-view>
      </view>

      <!-- 右侧产品列表 -->
      <scroll-view
        class="product-list"
        :scroll-y="true"
        :show-scrollbar="false"
        @scrolltolower="handleLoadMore"
      >
        <view v-if="inventoryList.length === 0" class="list-empty">
          <text v-if="loading" class="list-empty-tip">加载中...</text>
          <template v-else>
            <text class="list-empty-title">暂无匹配产品</text>
            <text class="list-empty-desc">试试切换分类、搜索型号，或开启本机设备搜索</text>
          </template>
        </view>

        <template v-else>
          <view v-for="product in inventoryList" :key="product.id" class="product-card">
            <view class="product-header">
              <view class="sku-no">{{ product.skuNo }}</view>
              <text class="product-name">{{ product.productName }}</text>
            </view>

            <view class="product-meta">
              <text class="brand-name">{{ product.productDec }}</text>
              <text class="price">¥ {{ Number(product.salePrice).toFixed(2) }}</text>
            </view>

            <view class="model-tags">
              <view
                v-for="(model, mIndex) in product.models"
                :key="mIndex"
                class="model-tag"
                :class="{
                  modleActive:
                    normalize(model.name) === normalize(selectedModel) ||
                    normalize(model.name) === normalize(keyword) ||
                    isMatch(normalize(keyword), model.name) ||
                    isMatch(normalize(selectedModel), model.name),
                }"
              >
                {{ model.name }}
              </view>
            </view>

            <view class="product-footer">
              <view class="stock-info">
                <text class="label">库存</text>
                <text class="value">{{ product.stock }}</text>
                <text class="unit">片</text>
              </view>
            </view>
          </view>
          <view class="safe-bottom"></view>
        </template>
      </scroll-view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.user-find-mo {
  box-sizing: border-box;
  padding-bottom: 60rpx;
  min-height: 100vh;
  height: 100vh;
  background-color: $jel-pageBackGroundColor;
  display: flex;
  flex-direction: column;
}

.header-section {
  flex-shrink: 0;
  position: relative;

  .banner-placeholder {
    height: 180rpx;
    background: linear-gradient(135deg, #e8f4f8 0%, #d4e8ed 50%, #c5dce3 100%);
  }

  .search-box {
    position: absolute;
    bottom: 40rpx;
    left: 32rpx;
    right: 32rpx;

    :deep(.uni-searchbar) {
      padding: 0 !important;
      background-color: transparent !important;
    }

    :deep(.uni-searchbar__box) {
      height: 76rpx !important;
      padding: 0 28rpx !important;
      background-color: #fff !important;
      border-radius: 38rpx !important;
      box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
    }

    :deep(.uni-searchbar__box-icon-search) {
      display: flex !important;
      margin-right: 16rpx;
    }

    :deep(.uni-searchbar__text-placeholder) {
      font-size: 28rpx !important;
      color: $jel-font-dec !important;
    }

    :deep(.uni-searchbar__box-search-input) {
      font-size: 28rpx !important;
      color: $jel-font-title !important;
    }
  }
}

.model-section {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: 24rpx 32rpx;
  background-color: #fff;
  border-bottom: 1rpx solid $jel-border;

  .model-icon {
    width: 56rpx;
    height: 56rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #e8f0f5;
    border-radius: 12rpx;
    margin-right: 20rpx;

    .iconfont {
      font-size: 32rpx;
      color: #5a8fbd;
    }
  }

  .model-info {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 12rpx;

    .brand {
      flex-shrink: 0;
      font-size: 28rpx;
      color: $jel-font-dec2;
    }

    .model-name {
      min-width: 0;
      font-size: 28rpx;
      color: $jel-brandColor;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

.tag-bar-wrapper {
  flex-shrink: 0;
  height: 100rpx;
  background-color: #fff;
  border-bottom: 1rpx solid $jel-border;

  .tag-bar {
    padding: 20rpx 32rpx;
    width: 100%;
    white-space: nowrap;
    background-color: #fff;
    border-bottom: 1rpx solid $jel-border;

    .tag-list {
      display: inline-flex;
      flex-wrap: nowrap;
      gap: 20rpx;

      .tag-item {
        display: inline-flex;
        align-items: center;
        flex-shrink: 0;
        white-space: nowrap;
        padding: 12rpx 28rpx;
        font-size: 26rpx;
        color: $jel-font-title;
        background-color: $jel-pageBackGroundColor;
        border-radius: 8rpx;
        transition: all 0.2s;

        &.active {
          color: #fff;
          background-color: $jel-brandColor;
        }
      }
    }
  }
}

.main-content {
  flex: 1;
  min-height: 0;
  display: flex;
  overflow: hidden;

  .cate-nav-wrapper {
    height: 100%;
    min-height: 0;
    padding-left: 20rpx;
    width: 220rpx;
    flex-shrink: 0;
    background-color: #fff;

    .cate-nav {
      height: 100%;

      .cate-item {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 28rpx 12rpx;
        font-size: 24rpx;
        color: $jel-font-dec2;

        .cate-indicator {
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 8rpx;
          height: 30rpx;
          background-color: $jel-brandColor;
          border-radius: 4rpx;
        }

        &.active {
          color: $jel-font-title;
          font-weight: 500;
          background-color: $jel-pageBackGroundColor;
        }
      }

      .cate-name {
        margin-left: 8rpx;
      }
    }
  }

  .product-list {
    flex: 1;
    min-width: 0;
    height: 100%;
    padding: 20rpx;

    .list-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 280rpx;
      padding: 48rpx 32rpx;
      text-align: center;

      .list-empty-tip {
        font-size: 28rpx;
        color: $jel-font-dec;
      }

      .list-empty-title {
        display: block;
        font-size: 30rpx;
        color: $jel-font-dec2;
        margin-bottom: 16rpx;
      }

      .list-empty-desc {
        display: block;
        font-size: 24rpx;
        color: $jel-font-dec;
        line-height: 1.5;
      }
    }

    .product-card {
      background-color: #fff;
      border-radius: 16rpx;
      padding: 28rpx;
      margin-bottom: 20rpx;

      .product-header {
        display: flex;
        align-items: center;
        margin-bottom: 20rpx;

        .sku-no {
          padding: 8rpx 20rpx;
          font-size: 28rpx;
          font-weight: bold;
          color: #fff;
          background-color: $jel-font-title;
          border-radius: 8rpx;
          margin-right: 16rpx;
        }

        .product-name {
          font-size: 30rpx;
          color: $jel-font-title;
          font-weight: 500;
          @include ellipsis(1);
        }
      }

      .product-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 24rpx;

        .brand-name {
          font-size: 26rpx;
          color: $jel-font-dec2;
        }

        .price {
          font-size: 32rpx;
          font-weight: bold;
          color: $jel-brandColor;
        }
      }

      .model-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 16rpx;

        .model-tag {
          padding: 6rpx 12rpx;
          font-size: 24rpx;
          color: $jel-font-dec2;
          background-color: $jel-pageBackGroundColor;
          border-radius: 6rpx;
          border: 2rpx solid transparent;
          transition: all 0.2s;

          &.modleActive {
            color: $jel-brandColor;
            background-color: rgba($jel-brandColor, 0.08);
            border-color: $jel-brandColor;
          }
        }
      }

      .product-footer {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        margin-top: 20rpx;

        .stock-info {
          display: flex;
          align-items: baseline;
          gap: 6rpx;

          .label {
            font-size: 24rpx;
            color: $jel-font-dec2;
          }

          .value {
            font-size: 28rpx;
            font-weight: 500;
            color: $jel-font-title;
          }

          .unit {
            font-size: 22rpx;
            color: $jel-font-dec2;
          }
        }
      }
    }

    .safe-bottom {
      height: 40rpx;
    }
  }
}
</style>
