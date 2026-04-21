<script setup lang="ts">
import { ref } from 'vue'
import type { ProductItem, SkuItem } from '@/types/ProductItem'
import { productDetailGetApi } from '@/api/product.ts'
import { onLoad } from '@dcloudio/uni-app'
import FooterBar from './FooterBar.vue'
import { useCartTobStore } from '@/stores'
import type { CartItem } from '@/types/CartItem'
import { generateId } from '@/utils/id.ts'
import { checkLogin } from '@/utils/validate.ts'

const { safeAreaInsets } = uni.getSystemInfoSync()

const popup = ref<any>()

const cartTobStore = useCartTobStore()

const productData = ref<ProductItem>()
const productDataGet = async (productId: number) => {
  const res = await productDetailGetApi(productId)
  console.log('商品详情', res)

  productData.value = res.data
  activeSkuCover.value = res.data.cover

  if (res.data.skus?.length) {
    const tempSku = res.data.skus.map((sku) => Number(sku.costPrice))
    activeSkuPrice.value = String(Math.min(...tempSku))
  }
}

onLoad(async (options) => {
  console.log(options)
  if (options) {
    await productDataGet(Number(options.productId))
  }
})

const activeSkuIndex = ref<number | null>(null)
const activeSkuCover = ref('')
const activeSkuPrice = ref<string>('0')
const activeSkuName = ref('默认规格')
const selectSku = ref<SkuItem>()
const handleSelectSku = (item: SkuItem, index: number) => {
  activeSkuIndex.value = index
  activeSkuCover.value = item.image
  activeSkuPrice.value = item.costPrice
  activeSkuName.value = item.attrs.value
  selectSku.value = item
}

const handleSkuConfrim = () => {
  if (!selectSku.value && productData.value?.skus?.length) {
    return uni.showToast({
      icon: 'error',
      title: '请选择规格',
    })
  }

  popup.value?.close()
}

const isAdding = ref(false)

const handleAddCart = (val: string) => {
  checkLogin()

  if (!productData.value?.id || isAdding.value) return
  isAdding.value = true

  if (!productData.value.skus?.length) {
    isAdding.value = false
    return uni.showToast({
      icon: 'none',
      title: '暂无规格',
      mask: true,
    })
  }

  if (!selectSku.value) {
    isAdding.value = false
    return uni.showToast({
      icon: 'error',
      title: '请选择规格',
      mask: true,
    })
  }

  try {
    const cart: CartItem = {
      id: generateId('cart_'),
      selected: true,
      productId: productData.value?.id as number,
      skuNo: productData.value?.skuNo || '',
      skuId: selectSku.value?.id!,
      name: productData.value?.name || '',
      dec: productData.value?.dec || '',
      cover: productData.value?.cover || '',
      salePrice: selectSku.value?.costPrice || '0',
      quantity: 1,
      sku: selectSku.value,
      type: productData.value.type,
    }

    cartTobStore.addCart(cart)

    uni.showToast({
      icon: 'success',
      title: val === 'nowAdd' ? '已入库，正在跳转…' : '已加入库存',
      mask: true,
    })

    if (val === 'nowAdd') {
      setTimeout(() => {
        const pages = getCurrentPages()
        if (pages.length >= 9) {
          uni.redirectTo({ url: '/pagesMember/purchaseCart/purchaseCart' })
        } else {
          uni.navigateTo({
            url: '/pagesMember/purchaseCart/purchaseCart',
            fail: () => {
              uni.redirectTo({ url: '/pagesMember/purchaseCart/purchaseCart' })
            },
          })
        }
      }, 500)
    }
  } finally {
    isAdding.value = false
  }
}
</script>

<template>
  <scroll-view class="product-detail" :scroll-y="true">
    <swiper class="swiper" :indicator-dots="false" :autoplay="true" :circular="true">
      <swiper-item>
        <image :src="productData?.cover" mode="aspectFill"></image>
      </swiper-item>
    </swiper>

    <view class="info-section">
      <view class="price-row">
        <view class="left">
          <view style="display: flex; align-items: center">
            <view class="price">
              <text class="symbol">￥</text>
              <text class="number">{{ Number(activeSkuPrice).toFixed(2) }}</text>
            </view>
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

    <view class="spec-section" @click="popup?.open()" v-if="productData?.skus?.length">
      <view class="section-title">选择规格</view>
      <view class="spec-content">
        <text>{{ selectSku?.attrs.value || '请选择规格' }}</text>
        <text class="iconfont icon-arrow-right"></text>
      </view>
    </view>

    <view class="detail-section">
      <view class="section-title">商品详情</view>
      <view class="detail-content">
        <image
          v-for="(image, index) in productData?.images"
          :key="index"
          :src="image.url"
          mode="widthFix"
        ></image>
      </view>
    </view>

    <uni-popup class="uniPopup" ref="popup" type="bottom" background-color="#fff">
      <view class="skuList">
        <view class="skuView">
          <view class="skuCover">
            <image :src="activeSkuCover" mode="aspectFit" />
          </view>
          <view class="skuInfo">
            <view class="proName">{{ productData?.skuNo }} {{ productData?.name }}</view>
            <view class="proDec">{{ productData?.dec }}</view>
            <view class="skuName">{{ activeSkuName }}</view>
            <view class="skuPrice" v-if="activeSkuPrice">
              <text class="skuPrice--text">¥</text>
              <text class="skuPrice--text">{{ Number(activeSkuPrice).toFixed(2) }}</text>
            </view>
          </view>
        </view>
        <scroll-view class="scroll-area" :scroll-y="true">
          <view class="skusList" v-if="productData?.skus?.length">
            <view class="skuTitle">规格</view>
            <view class="skuContent">
              <view
                class="skuItem"
                :class="{ activeSku: index === activeSkuIndex }"
                v-for="(item, index) in productData?.skus"
                :key="index"
                @click="handleSelectSku(item, index)"
              >
                {{ item.attrs.value }}
              </view>
            </view>
          </view>
          <view class="confrim" @click="handleSkuConfrim">确定</view>
        </scroll-view>
      </view>
    </uni-popup>
    <FooterBar
      model="toB"
      @addCart="handleAddCart('addCart')"
      @nowAdd="handleAddCart('nowAdd')"
    ></FooterBar>
    <view
      :style="{ paddingBottom: safeAreaInsets?.bottom + 'px' }"
      style="width: 100%; height: 180rpx"
    ></view>
  </scroll-view>
</template>

<style scoped lang="scss">
.product-detail {
  height: 100%;

  .swiper {
    width: 100%;
    height: 750rpx;

    image {
      width: 100%;
      height: 100%;
    }
  }

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
      word-break: break-all;
      overflow-wrap: anywhere;
      @include ellipsis(2);
    }

    .desc {
      font-size: 24rpx;
      color: $jel-font-dec2;
    }
  }

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

  .uniPopup {
    width: 100%;

    :deep(.uni-popup) {
      z-index: 1000 !important;
    }

    .skuList {
      padding: 24rpx;
      width: 100%;
      max-height: 70vh;
      display: flex;
      flex-direction: column;

      .skuView {
        flex-shrink: 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 24rpx;
        margin-bottom: 24rpx;
        width: 100%;

        .skuCover {
          flex: 0 0 200rpx;

          image {
            width: 200rpx;
            height: 200rpx;
            border-radius: 8rpx;
          }
        }

        .skuInfo {
          flex: 1;
          min-width: 0;
          overflow: hidden;
          box-sizing: border-box;

          .proName {
            max-width: 100%;
            color: $jel-font-title;
            word-break: break-all;
            overflow-wrap: anywhere;
            @include ellipsis(2);
          }

          .proDec {
            font-size: 24rpx;
            color: $jel-font-dec;
            word-break: break-all;
            overflow-wrap: anywhere;
            @include ellipsis(1);
          }

          .skuName {
            font-size: 28rpx;
            color: $jel-font-dec2;
            word-break: break-all;
            overflow-wrap: anywhere;
            @include ellipsis(1);
          }

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

      .scroll-area {
        flex: 1;
        overflow-y: auto;

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

          .skuItem {
            padding: 8rpx 16rpx;
            display: inline-block;
            width: auto;
            font-size: 28rpx;
            color: $jel-font-title;
            background-color: #f5f5f5;
            border-radius: 8rpx;
          }

          .activeSku {
            color: $jel-brandColor;
            font-size: 28rpx;
            border: 1rpx solid $jel-brandColor;
            background-color: rgba(255, 242, 237);
          }
        }

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
