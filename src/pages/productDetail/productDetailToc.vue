<script setup lang="ts">
import { ref } from 'vue'
import type { ProductItem, SkuItem } from '@/types/ProductItem'
import { productDetailGetApi } from '@/api/product.ts'
import { onLoad } from '@dcloudio/uni-app'
import FooterBar from './FooterBar.vue'
import { useCartStore } from '@/stores'
import type { CartItem } from '@/types/CartItem'
import { generateId } from '@/utils/id.ts'
import { checkLogin } from '@/utils/validate.ts'

const { safeAreaInsets } = uni.getSystemInfoSync()

const popup = ref<any>()

// 定义store
const cartStore = useCartStore()

// 获取产品列表
const productData = ref<ProductItem>()
const productDataGet = async (productId: string) => {
  const res = await productDetailGetApi(productId)
  console.log('商品详情', res)
  productData.value = res.data
  activeSkuCover.value = res.data.cover
}

// 商品类型--商品
onLoad(async (options) => {
  console.log(options)
  if (options) {
    await productDataGet(options.productId)
  }
})

// 处理型号的选择
const activeModelsIndex = ref<number | null>(null)
const selectModels = ref('')
const handleSelectModels = (model: string, index: number) => {
  console.log(model, index)
  activeModelsIndex.value = index
  selectModels.value = model
}

// 处理sku的选择
const activeSkuIndex = ref<number | null>(null) // 当前选择的sku索引
const activeSkuCover = ref('') // 当前选择的sku图片
const activeSkuPrice = ref(0) // 当前选择的sku价格
const activeSkuName = ref('默认规格') // 当前选择的sku名称
const selectSku = ref<SkuItem>() // 当前选择的sku对象
const handleSelectSku = (item: SkuItem, index: number) => {
  activeSkuIndex.value = index
  activeSkuCover.value = item.image
  activeSkuPrice.value = item.price
  activeSkuName.value = item.attrs.value
  selectSku.value = item
}

//  处理sku的确认
const handleSkuConfrim = () => {
  if (!selectSku.value || !selectModels.value) {
    return uni.showToast({
      icon: 'error',
      title: '请选择规格',
    })
  }
  if (productData.value) productData.value.currentPrice = selectSku.value.price // 将当前选择的SKU价格同步到产品售价
  popup.value?.close()
}

// 处理添加购物车
const isAdding = ref(false)

const handleAddCart = (val: string) => {
  // 检测用户是否登录
  checkLogin()

  if (!productData.value?._id || isAdding.value) return
  isAdding.value = true

  // 如果没有选择sku，提示选择
  if (selectSku.value === undefined) {
    isAdding.value = false
    return uni.showToast({
      icon: 'error',
      title: '请选择规格',
      mask: true,
    })
  }

  try {
    const cart: CartItem = {
      _id: generateId('cart_'),
      selected: true,
      productId: productData.value?._id!,
      model: selectModels.value,
      skuNo: productData.value?.skuNo || '',
      name: productData.value?.name || '',
      dec: productData.value?.dec || '',
      cover: productData.value?.cover || '',
      originalPrice: productData.value?.originalPrice || 0,
      currentPrice: productData.value?.currentPrice || 0,
      quantity: 1,
      sku: selectSku.value,
      type: productData.value.type,
    }

    // 加入购物车
    cartStore.addCart(cart)

    uni.showToast({
      icon: 'success',
      title: val === 'nowAdd' ? '已入库，正在跳转…' : '已加入库存',
      mask: true,
    })

    if (val === 'nowAdd') {
      // 保证 toast 展示完后再跳转
      setTimeout(() => {
        uni.switchTab({ url: '/pages/cart/cart' })
      }, 500)
    }
  } finally {
    isAdding.value = false
  }
}
</script>

<template>
  <scroll-view class="product-detail" :scroll-y="true">
    <!-- 轮播图 -->
    <swiper class="swiper" :indicator-dots="false" :autoplay="true" :circular="true">
      <swiper-item>
        <image :src="productData?.cover" mode="aspectFill"></image>
      </swiper-item>
    </swiper>

    <!-- 产品信息 -->
    <view class="info-section">
      <view class="price-row">
        <view class="left">
          <view style="display: flex; align-items: center">
            <view class="price">
              <text class="symbol">￥</text>
              <!-- 默认显示最小的价格，如果选择了规格则显示规格价格 -->
              <text class="number">{{ ((productData?.currentPrice ?? 0) / 100).toFixed(2) }}</text>
              <text style="font-size: 24rpx"> 起</text>
            </view>
            <view class="original-price">
              ￥{{ ((productData?.originalPrice ?? 0) / 100).toFixed(2) }}</view
            >
          </view>
        </view>
        <view class="views">
          <text class="iconfont icon-zongliulanliang"></text>
          <text>{{ productData?.lookNum }}</text>
        </view>
      </view>
      <view class="title">{{ productData?.skuNo }} {{ productData?.name }}</view>
      <view class="desc">{{ productData?.dec }}</view>
    </view>

    <!-- 选择规格 -->
    <view class="spec-section" @click="popup?.open()">
      <view class="section-title">选择规格</view>
      <view class="spec-content">
        <text>{{ selectSku?.attrs.value || '请选择规格' }}</text>
        <text class="iconfont icon-arrow-right"></text>
      </view>
    </view>

    <!-- 商品详情 -->
    <view class="detail-section">
      <view class="section-title">商品详情</view>
      <view class="detail-content">
        <image
          v-for="(image, index) in productData?.proImages"
          :key="index"
          :src="image"
          mode="widthFix"
        ></image>
      </view>
    </view>

    <!--  sku弹窗 样式  -->
    <uni-popup class="uniPopup" ref="popup" type="bottom" background-color="#fff">
      <view class="skuList">
        <!-- 图片价格区域 - 固定在顶部 -->
        <view class="skuView">
          <view class="skuCover">
            <image :src="activeSkuCover" mode="aspectFit" />
          </view>
          <view class="skuInfo">
            <!-- 标题 描述 -->
            <view class="proName">{{ productData?.skuNo }} {{ productData?.name }}</view>
            <view class="proDec">{{ productData?.dec }}</view>
            <view class="skuName">{{ activeSkuName }}</view>
            <!-- 价格 -->
            <view class="skuPrice">
              <text class="skuPrice--text">¥</text>
              <text class="skuPrice--text">{{ (activeSkuPrice / 100).toFixed(2) }}</text>
            </view>
          </view>
        </view>
        <!-- SKU选择区域 - 可滚动 -->
        <scroll-view class="scroll-area" :scroll-y="true">
          <!--  适配机型   -->
          <view class="skuTitle">适配机型</view>
          <view class="skuContent">
            <view
              class="skuItem"
              :class="{ activeModels: index === activeModelsIndex }"
              v-for="(item, index) in productData?.models"
              :key="index"
              @click="handleSelectModels(item, index)"
            >
              {{ item }}
            </view>
          </view>
          <!--  规格  -->
          <view class="skuTitle">规格</view>
          <view class="skuContent">
            <view
              class="skuItem"
              :class="{ activeSku: index === activeSkuIndex }"
              v-for="(item, index) in productData?.sku"
              :key="index"
              @click="handleSelectSku(item, index)"
            >
              {{ item.attrs.value }}
            </view>
          </view>
          <!-- 选好了 -->
          <view class="confrim" @click="handleSkuConfrim">确定</view>
        </scroll-view>
      </view>
    </uni-popup>
    <!-- 底部操作栏 -->
    <FooterBar
      model="toC"
      @addCart="handleAddCart('addCart')"
      @nowAdd="handleAddCart('nowAdd')"
    ></FooterBar>
    <!--  占位  -->
    <view
      :style="{ paddingBottom: safeAreaInsets?.bottom + 'px' }"
      style="width: 100%; height: 180rpx"
    ></view>
  </scroll-view>
</template>

<style scoped lang="scss">
.product-detail {
  height: 100%;
  // 轮播图
  .swiper {
    width: 100%;
    height: 750rpx;

    image {
      width: 100%;
      height: 100%;
    }
  }

  // 产品信息区域
  .info-section {
    background-color: #fff;
    padding: 24rpx;
    margin-bottom: 24rpx;

    .price-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16rpx;

      .left {
        display: flex;
        align-items: baseline;

        .price {
          color: $jel-brandColor;

          .symbol {
            font-size: 32rpx;
          }

          .number {
            font-size: 48rpx;
            font-weight: bold;
          }
        }

        .original-price {
          margin-left: 16rpx;
          color: $jel-font-dec;
          font-size: 24rpx;
          text-decoration: line-through;
        }
      }

      .views {
        display: flex;
        align-items: center;
        gap: 4rpx;
        color: $jel-font-dec;
        font-size: 24rpx;

        .iconfont {
          font-size: 28rpx;
        }
      }
    }

    .title {
      font-size: 32rpx;
      font-weight: bold;
      color: $jel-font-title;
      margin-bottom: 12rpx;
      word-break: break-all; // 允许在任何字符换行，适配长型号/斜杠/英文
      overflow-wrap: anywhere; // 进一步保证可断行
      @include ellipsis(2); // 最多两行，超出省略
    }

    .desc {
      font-size: 24rpx;
      color: $jel-font-dec2;
    }
  }

  // 规格选择区域
  .spec-section {
    background-color: #fff;
    padding: 24rpx;
    margin-bottom: 24rpx;

    .section-title {
      font-size: 28rpx;
      font-weight: bold;
      color: $jel-font-title;
      margin-bottom: 16rpx;
    }

    .spec-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 26rpx;
      color: $jel-font-dec2;

      .iconfont {
        color: $jel-font-dec;
        font-size: 24rpx;
      }
    }
  }

  // 商品详情区域
  .detail-section {
    background-color: #fff;

    .section-title {
      padding: 24rpx;
      font-size: 28rpx;
      font-weight: bold;
      color: $jel-font-title;
      margin-bottom: 24rpx;
    }

    .detail-content {
      image {
        width: 100%;
        height: 100%;
      }
    }
  }

  // 弹窗
  .uniPopup {
    width: 100%;
    :deep(.uni-popup) {
      z-index: 1000 !important; // 高于 FooterBar 的 z-index: 999
    }

    .skuList {
      padding: 24rpx;
      width: 100%;
      max-height: 70vh; // 限制最大高度，避免超出屏幕
      display: flex;
      flex-direction: column;

      .skuView {
        flex-shrink: 0; // 不收缩，固定在顶部
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 24rpx;
        margin-bottom: 24rpx;
        width: 100%;
        // sku图片
        .skuCover {
          flex: 0 0 200rpx; // 固定图片列宽，避免挤压
          image {
            width: 200rpx;
            height: 200rpx;
            border-radius: 8rpx;
          }
        }

        // sku信息
        .skuInfo {
          flex: 1; // 占据剩余空间
          min-width: 0; // 关键：允许内容在 flex 中收缩
          overflow: hidden; // 配合多行省略
          box-sizing: border-box;
          // 标题
          .proName {
            max-width: 100%;
            color: $jel-font-title;
            word-break: break-all; // 允许在任何字符换行，解决斜杠/长英文不换行
            overflow-wrap: anywhere; // 进一步保证可断行
            @include ellipsis(2);
          }

          // 描述
          .proDec {
            font-size: 24rpx;
            color: $jel-font-dec;
            word-break: break-all;
            overflow-wrap: anywhere;
            @include ellipsis(1);
          }

          // 规格
          .skuName {
            font-size: 28rpx;
            color: $jel-font-dec2;
            word-break: break-all;
            overflow-wrap: anywhere;
            @include ellipsis(1);
          }

          // 价格
          .skuPrice {
            display: flex;
            align-items: baseline;
            margin-top: 12rpx;

            &--text {
              font-size: 32rpx;
              font-weight: bold;
              color: $jel-brandColor;

              &:first-child {
                font-size: 24rpx;
                margin-right: 4rpx;
              }
            }
          }
        }
      }

      // 滚动区域
      .scroll-area {
        flex: 1; // 占据剩余空间
        overflow-y: auto; // 可滚动

        // 规格
        .skuTitle {
          margin-bottom: 24rpx;
          font-size: 28rpx;
          color: $jel-font-title;
        }

        .skuContent {
          margin-bottom: 24rpx;
          display: flex;
          flex-wrap: wrap;
          gap: 24rpx;
          // SKU每一项
          .skuItem {
            padding: 8rpx 16rpx;
            display: inline-block;
            width: auto;
            font-size: 28rpx;
            color: $jel-font-title;
            background-color: #f5f5f5;
            border-radius: 8rpx;
          }

          // SKU每一项-选中状态
          .activeSku {
            color: $jel-brandColor;
            font-size: 28rpx;
            border: 1rpx solid $jel-brandColor;
            background-color: rgba(255, 242, 237);
          }
          // 选中的型号
          .activeModels {
            color: $jel-brandColor;
            font-size: 28rpx;
            border: 1rpx solid $jel-brandColor;
            background-color: rgba(255, 242, 237);
          }
        }

        // 确定按钮
        .confrim {
          margin-top: 100rpx;
          height: 80rpx;
          line-height: 80rpx;
          text-align: center;
          background-color: $jel-brandColor;
          color: #fff;
          font-size: 32rpx;
          border-radius: 100rpx;
        }
      }
    }
  }
}
</style>
