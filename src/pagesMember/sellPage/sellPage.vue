<script setup lang="ts">
import { ref } from 'vue'
import type { CateItem } from '@/types/CateItem'
import type { ProductItem } from '@/types/ProductItem'

// 搜索关键词
const keyword = ref('')

// 当前选中的手机型号
const selectedModel = ref('小米 14 Pro')

// 分类标签数据
const tagList = ref([
  { id: 'all', name: '全部' },
  { id: 'tag1', name: '直屏膜' },
  { id: 'tag2', name: '曲屏膜' },
])
const activeTagIndex = ref(0)

// 左侧分类数据（模拟）
const cateList = ref<CateItem[]>([
  { _id: 'cate1', name: '高铝防静电', level: 1 },
  { _id: 'cate2', name: '6D三防膜', level: 1 },
  { _id: 'cate3', name: '防窥膜', level: 1 },
  { _id: 'cate4', name: '半屏高清', level: 1 },
  { _id: 'cate5', name: 'UV高清膜', level: 1 },
  { _id: 'cate6', name: '高铝UV膜', level: 1 },
  { _id: 'cate7', name: 'UV防窥膜', level: 1 },
  { _id: 'cate8', name: '0.25光固膜', level: 1 },
])
const activeCateIndex = ref(0)

// 商品列表数据（模拟）
const productList = ref<ProductItem[]>([
  {
    _id: 'pro1',
    categoryId: 'cate5',
    skuNo: 'U16',
    name: 'UV高清膜',
    dec: '牛膜旺',
    models: ['小米 14 Pro', '小米 15 Pro', '小米15ultra'],
    originalPrice: 58,
    currentPrice: 48,
    cover: '',
    proImages: [],
    lookNum: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: 'pro2',
    categoryId: 'cate8',
    skuNo: 'M12',
    name: '0.25光固膜',
    dec: '牛膜旺',
    models: [
      '小米 14 Pro',
      'Nova 14 Ultra',
      'oppo A5 Pro',
      'oppo Reno 12 Pro（不带神器可通用）',
      'oppo Reno 12（不带神器可通用）',
      '小米 14 Ultra',
      '小米 15 Pro',
      '小米15ultra',
      '红米 Note 13 Pro+',
      '红米 Note 14 Pro(不带神器可通用）',
      '红米 Note 14 Pro+(不带神器可通用）',
      '荣耀 100',
      '荣耀 200',
      '荣耀 90',
    ],
    originalPrice: 78,
    currentPrice: 68,
    cover: '',
    proImages: [],
    lookNum: 200,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
])

// 搜索确认
const handleSearch = (e: { value: string | number }) => {
  // TODO: 实现搜索逻辑
  console.log('搜索:', e.value)
}

// 搜索输入
const handleSearchInput = (value: string | number) => {
  // TODO: 实现输入逻辑
  console.log('输入:', value)
}

// 清空搜索
const handleSearchClear = () => {
  keyword.value = ''
}

// 切换标签
const handleTagChange = (index: number) => {
  activeTagIndex.value = index
  // TODO: 根据标签筛选
}

// 切换分类
const handleCateChange = (index: number) => {
  activeCateIndex.value = index
  // TODO: 根据分类筛选
}

// 选择商品
const handleSelectProduct = (product: ProductItem) => {
  // TODO: 选择商品逻辑
  console.log('选择商品:', product)
}

// 选择适配型号
const handleSelectModelTag = (model: string, product: ProductItem) => {
  // TODO: 选择适配型号逻辑
  console.log('选择型号:', model, product)
}
</script>

<template>
  <view class="sell-page">
    <!-- 顶部Banner + 搜索区域 -->
    <view class="header-section">
      <!-- Banner占位 -->
      <view class="banner-placeholder"></view>

      <!-- 搜索框 -->
      <view class="search-box">
        <view class="search-input-wrapper">
          <uni-search-bar
            v-model="keyword"
            placeholder="搜索手机型号"
            :radius="8"
            bgColor="#fff"
            cancelButton="none"
            clearButton="auto"
            @confirm="handleSearch"
            @input="handleSearchInput"
            @clear="handleSearchClear"
          />
        </view>
        <view class="search-btn" @click="handleSearch({ value: keyword })">
          <text>搜索</text>
        </view>
      </view>
    </view>

    <!-- 型号选择区域 -->
    <view class="model-section">
      <view class="model-icon">
        <text class="iconfont icon-shouji"></text>
      </view>
      <view class="model-info">
        <text class="brand">手机型号</text>
        <text class="model-name">{{ selectedModel }}</text>
      </view>
      <view class="model-arrow">
        <text class="iconfont icon-youjiantou"></text>
      </view>
    </view>

    <!-- 分类标签栏 -->
    <view class="tag-bar">
      <view class="tag-list">
        <view
          class="tag-item"
          v-for="(tag, index) in tagList"
          :key="tag.id"
          :class="{ active: activeTagIndex === index }"
          @click="handleTagChange(index)"
        >
          {{ tag.name }}
        </view>
      </view>
    </view>

    <!-- 主体内容区域 -->
    <view class="main-content">
      <!-- 左侧分类导航 -->
      <view class="cate-nav-wrapper">
        <scroll-view class="cate-nav" :scroll-y="true" :show-scrollbar="false">
          <view
            class="cate-item"
            v-for="(cate, index) in cateList"
            :key="cate._id"
            :class="{ active: activeCateIndex === index }"
            @click="handleCateChange(index)"
          >
            <view class="cate-indicator" v-if="activeCateIndex === index"></view>
            <text class="cate-name">{{ cate.name }}</text>
          </view>
        </scroll-view>
      </view>

      <!-- 右侧商品列表 -->
      <scroll-view class="product-list" :scroll-y="true" :show-scrollbar="false">
        <view
          class="product-card"
          v-for="product in productList"
          :key="product._id"
          @click="handleSelectProduct(product)"
        >
          <!-- 商品头部信息 -->
          <view class="product-header">
            <view class="sku-no">{{ product.skuNo }}</view>
            <text class="product-name">{{ product.name }}</text>
          </view>

          <!-- 品牌和价格 -->
          <view class="product-meta">
            <text class="brand-name">{{ product.dec }}</text>
            <text class="price">¥ {{ product.currentPrice.toFixed(2) }}</text>
          </view>

          <!-- 适配型号标签 -->
          <view class="model-tags">
            <view
              class="model-tag"
              v-for="(model, mIndex) in product.models"
              :key="mIndex"
              :class="{ active: model === selectedModel }"
              @click.stop="handleSelectModelTag(model, product)"
            >
              {{ model }}
            </view>
          </view>
        </view>

        <!-- 底部安全区域 -->
        <view class="safe-bottom"></view>
      </scroll-view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.sell-page {
  min-height: 100vh;
  background-color: $jel-pageBackGroundColor;
  display: flex;
  flex-direction: column;
}

// 头部区域
.header-section {
  position: relative;

  .banner-placeholder {
    height: 320rpx;
    background: linear-gradient(135deg, #e8f4f8 0%, #d4e8ed 50%, #c5dce3 100%);
  }

  .search-box {
    position: absolute;
    bottom: 40rpx;
    left: 32rpx;
    right: 32rpx;
    display: flex;
    align-items: center;
    gap: 16rpx;

    .search-input-wrapper {
      flex: 1;

      // 自定义 uni-search-bar 样式
      :deep(.uni-searchbar) {
        padding: 0 !important;
        background-color: transparent !important;
      }

      :deep(.uni-searchbar__box) {
        height: 72rpx !important;
        padding: 0 24rpx !important;
        background-color: #fff !important;
        border-radius: 12rpx !important;
        box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
      }

      :deep(.uni-searchbar__box-icon-search) {
        display: none !important;
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

    .search-btn {
      height: 72rpx;
      padding: 0 32rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: $jel-brandColor;
      border-radius: 12rpx;
      flex-shrink: 0;
      box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);

      text {
        font-size: 28rpx;
        color: #fff;
      }
    }
  }
}

// 型号选择区域
.model-section {
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
    display: flex;
    align-items: center;
    gap: 12rpx;

    .brand {
      font-size: 28rpx;
      color: $jel-font-dec2;
    }

    .model-name {
      font-size: 28rpx;
      color: $jel-brandColor;
      font-weight: 500;
    }
  }

  .model-arrow {
    .iconfont {
      font-size: 32rpx;
      color: $jel-font-dec;
    }
  }
}

// 分类标签栏
.tag-bar {
  display: flex;
  align-items: center;
  padding: 20rpx 32rpx;
  background-color: #fff;
  border-bottom: 1rpx solid $jel-border;

  .tag-list {
    display: flex;
    gap: 20rpx;

    .tag-item {
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

// 主体内容区域
.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;

  // 左侧分类导航容器
  .cate-nav-wrapper {
    padding-left: 20rpx;
    width: 220rpx;
    flex-shrink: 0;
    background-color: #fff;

    .cate-nav {
      height: calc(100vh - 520rpx);

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
          height: 40rpx;
          background-color: $jel-brandColor;
          border-radius: 0 3rpx 3rpx 0;
        }

        &.active {
          color: $jel-font-title;
          font-weight: 500;
          background-color: $jel-pageBackGroundColor;
        }
      }
    }
  }

  // 右侧商品列表
  .product-list {
    flex: 1;
    height: calc(100vh - 520rpx);
    padding: 20rpx;

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
          padding: 10rpx 20rpx;
          font-size: 24rpx;
          color: $jel-font-dec2;
          background-color: $jel-pageBackGroundColor;
          border-radius: 6rpx;
          border: 2rpx solid transparent;
          transition: all 0.2s;

          &.active {
            color: $jel-brandColor;
            background-color: rgba($jel-brandColor, 0.08);
            border-color: $jel-brandColor;
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
