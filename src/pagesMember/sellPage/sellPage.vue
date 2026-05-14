<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CateItem } from '@/types/CateItem'
import { cateMoGetApi } from '@/api/cate.ts'
import { onLoad } from '@dcloudio/uni-app'
import { productListByCateIdGetApi, quickSellSearchModelsApi } from '@/api/product.ts'
import { searchInventoryApi, storeGetInventoryApi } from '@/api/store.ts'
import { useManagerStore } from '@/stores'
import {
  isMatch,
  normalize,
  searchInventoryProduct,
} from '@/pagesMember/sellPage/useProductSearch.ts'
import { highlightKeyword } from '@/pagesMember/sellPage/useHighlightKeyword.ts'
import { giftOrderApi, quickOrderApi } from '@/api/order.ts'
import { useQueryMember } from '@/pagesMember/sellPage/useQueryMember.ts'
import { deviceFindPhoneNameApi } from '@/api/device.ts'
import type { StoreInventoryItem } from '@/types/StoreInventory'

// 会员查询相关（每个页面实例独立状态）
const {
  memberPhone,
  memberQueryLoading,
  memberFreeCount,
  memberChecked,
  orderPrice,
  handleQueryMember,
  resetQueryMember,
  clearMemberState,
  initPrice,
} = useQueryMember()

// store
const managerStore = useManagerStore()

// 搜索关键词
const keyword = ref('')

// 当前选中的手机型号
const selectedModel = ref('')

// 型号筛选开关
const modelFilterEnabled = ref(false)

// 搜索
const handleSearch = async () => {
  reset()
  const result = await searchInventoryApi(
    managerStore.managerStoreInfo?.id as string,
    keyword.value.trim().toLocaleLowerCase(),
    cateList.value[activeCateIndex.value].id,
  )
  console.log(result)
  console.log('activeModel', selectedModel.value)

  inventoryList.value = result.data
}

// 清空搜索
const handleSearchClear = async () => {
  keyword.value = ''
  reset()
  await productListGet(cateList.value[activeCateIndex.value].id)
}

// 分类标签数据
const activeTagIndex = ref(0) // 标签激活索引
const tagList = ref<CateItem[]>([])
const tagListGet = async () => {
  const res = await cateMoGetApi('TOB')

  tagList.value = res.data.flatMap((item) => {
    if (item.name === '手机膜' && item.children?.length) {
      return item.children || []
    } else {
      return []
    }
  })
  changeCateList(tagList.value[0].id)
  productListGet(cateList.value[0].id)
}

// 切换标签
const handleTagChange = async (index: number, cateId: number) => {
  activeTagIndex.value = index
  // 重置
  activeCateIndex.value = 0
  keyword.value = ''
  modelFilterEnabled.value = false
  reset()
  // 根据标签筛选
  changeCateList(cateId)
  productListGet(cateList.value[0].id)
}

// 左侧分类数据
const activeCateIndex = ref(0)
const cateList = ref<CateItem[]>([])
const changeCateList = (tagId: number) => {
  cateList.value = tagList.value.flatMap(
    (item) => item.children?.filter((c) => c.parentId === tagId) ?? [],
  )
}

// 切换分类
const handleCateChange = async (index: number) => {
  activeCateIndex.value = index
  keyword.value = ''
  modelFilterEnabled.value = false
  reset()
  //  根据分类筛选
  console.log('cate', cateList.value[activeCateIndex.value].id)

  productListGet(cateList.value[activeCateIndex.value].id)
}

onLoad(() => tagListGet())

// 页码
const params = ref({
  pageNum: 1,
  pageSize: 10,
})

// 商品列表数据
const finish = ref(false)
const loading = ref(false)
// 库存数据
const inventoryList = ref<StoreInventoryItem[]>([])
const productListGet = async (cateId: number) => {
  console.log('cateId', cateId)

  if (finish.value || loading.value) return

  loading.value = true

  try {
    const { pageNum, pageSize } = params.value
    const res = await storeGetInventoryApi(
      managerStore.managerStoreInfo?.id as string,
      cateId,
      pageNum,
      pageSize,
    )

    // 如果是首页直接赋值否则追加更多
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
    /* 列表加载失败 */
  } finally {
    loading.value = false
  }
}

// 触底加载更多（仅分页模式下生效；关键词搜索/本机搜索无分页）
const handleLoadMore = async () => {
  // 搜索状态下不触发加载更多，因为搜索结果一次性返回
  // - keyword 搜索：直接一次性返回
  // - 本机搜索（modelFilterEnabled）：直接一次性返回
  if (keyword.value || modelFilterEnabled.value) return
  productListGet(cateList.value[activeCateIndex.value].id)
}

// 重置函数
const reset = () => {
  params.value.pageNum = 1
  finish.value = false
}

// 出单弹框相关
const orderPopupRef = ref()
const currentProduct = ref<StoreInventoryItem | null>(null)
const isMember = ref(false) // 是否会员
const originalPrice = ref('0') // 原始价格（用于重置）
const priceEditable = ref(false) // 价格是否可编辑

// 打开出单弹框
const handleCreateOrder = (product: StoreInventoryItem) => {
  console.log(product)
  if (product.stock < 1) {
    uni.showToast({ icon: 'none', title: '库存不足' })
    return
  }
  currentProduct.value = product
  // 缓存商品原价，供会员查询失败/切换非会员时恢复价格
  originalPrice.value = product.salePrice
  isMember.value = false
  priceEditable.value = false
  resetQueryMember()
  initPrice(product.salePrice)
  orderPopupRef.value?.open()
}

// 切换会员状态
const handleMemberChange = (value: boolean) => {
  isMember.value = value
  if (!value) {
    clearMemberState(originalPrice.value)
  }
}

// 切换价格编辑状态
const togglePriceEdit = () => {
  priceEditable.value = !priceEditable.value
}

// 处理价格输入
const handlePriceInput = (e: any) => {
  orderPrice.value = e.detail.value || '0'
}

// 获取本机设备
const getPhoneModel = async () => {
  selectedModel.value = uni.getSystemInfoSync().model
  console.log('设备', uni.getSystemInfoSync())

  const res = await deviceFindPhoneNameApi(selectedModel.value)

  if (res.code === 200) {
    selectedModel.value = res.data.phoneName
  }
}
onLoad(() => getPhoneModel())

// 搜索本机
const handleSearchLocal = async (e: any) => {
  modelFilterEnabled.value = e.detail.value
  keyword.value = ''
  reset()
  // 开启搜索本机
  if (modelFilterEnabled.value) {
    await productListGet(cateList.value[activeCateIndex.value].id)
    inventoryList.value = searchInventoryProduct(selectedModel.value, inventoryList.value)
  } else {
    await productListGet(cateList.value[activeCateIndex.value].id)
  }
}

// 确认出单
const handleConfirmOrder = async () => {
  if (!currentProduct.value) return
  console.log('product', currentProduct.value)
  console.log('currentPrice', orderPrice.value)

  // 校验会员手机号
  if (isMember.value && !memberPhone.value) {
    await uni.showToast({ title: '请输入会员手机号', icon: 'none' })
    return
  }

  // 如果有手机号存在但是未查询
  if (memberPhone.value && !memberChecked.value) {
    await uni.showToast({ title: '请先查询', icon: 'none' })
    return
  }
  const productId = currentProduct.value.productId

  // 如果有会员免费次数---直接跳转会员免费订单页面
  if (memberFreeCount.value > 0 && managerStore.managerStoreInfo?.id && productId) {
    // 跳转会员免费订单
    console.log('free')
    // 1.创建会员订单
    const res = await giftOrderApi(
      managerStore.managerStoreInfo.id,
      productId,
      currentProduct.value.productName,
      currentProduct.value.cover,
      currentProduct.value.skuId,
      currentProduct.value.skuNo,
      currentProduct.value.salePrice,
      orderPrice.value,
      memberPhone.value,
    )

    // 2.跳转会员免费服务
    uni.navigateTo({ url: `/pagesMember/quickOrder/giftOrder?outTtradeNo=${res.data.outTradeNo}` })
    return
  }
  console.log(managerStore.managerStoreInfo, productId)

  // 没有免费次数 OR 正常支付的情况
  if (managerStore.managerStoreInfo?.id && productId) {
    // 创建订单跳转订单详情
    const result = await quickOrderApi(
      managerStore.managerStoreInfo.id,
      productId,
      currentProduct.value.productName,
      currentProduct.value.cover,
      currentProduct.value.skuId,
      currentProduct.value.skuNo,
      currentProduct.value.salePrice,
      orderPrice.value,
    )
    console.log(result)

    if (result.code === 200) {
      orderPopupRef.value?.close()
      await uni.navigateTo({
        url: `/pagesMember/quickOrder/quickOrder?code_url=${result.data.codeUrl}&out_trade_no=${result.data.outTradeNo}`,
      })
    }
  } else {
    await uni.showToast({ title: '参数错误', icon: 'none' })
  }
}

// 取消出单
const handleCancelOrder = () => {
  orderPopupRef.value?.close()
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

    <!-- 型号选择区域 -->
    <view class="model-section">
      <view class="model-icon">
        <text class="iconfont icon-shouji"></text>
      </view>
      <view class="model-info">
        <text class="brand">本机设备</text>
        <text class="model-name">{{ selectedModel }}</text>
      </view>
      <switch
        :checked="modelFilterEnabled"
        color="#d62731"
        @change="handleSearchLocal"
        style="transform: scale(0.8)"
      />
    </view>

    <!-- 分类标签栏 -->
    <view class="tag-bar-wrapper">
      <scroll-view class="tag-bar" :scroll-x="true" :enhanced="true" :show-scrollbar="false">
        <view class="tag-list">
          <view
            class="tag-item"
            v-for="(tag, index) in tagList"
            :key="tag.id"
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
            class="cate-item"
            v-for="(cate, index) in cateList"
            :key="cate.id"
            :class="{ active: activeCateIndex === index }"
            @click="handleCateChange(index)"
          >
            <view class="cate-indicator" v-if="activeCateIndex === index"></view>
            <text class="cate-name">{{ cate.name }}</text>
          </view>
        </scroll-view>
      </view>

      <!-- 右侧商品列表 -->
      <scroll-view
        class="product-list"
        :scroll-y="true"
        :show-scrollbar="false"
        @scrolltolower="handleLoadMore"
      >
        <view v-if="inventoryList.length === 0" class="list-empty">
          <text v-if="loading" class="list-empty-tip">加载中...</text>
          <template v-else>
            <text class="list-empty-title">暂无商品</text>
            <text class="list-empty-desc">试试切换分类或调整搜索条件</text>
          </template>
        </view>
        <template v-else>
          <view class="product-card" v-for="product in inventoryList" :key="product.id">
            <!-- 商品头部信息 -->
            <view class="product-header">
              <view class="sku-no">{{ product.skuNo }}</view>
              <text class="product-name">{{ product.productName }}</text>
            </view>

            <!-- 品牌和价格 -->
            <view class="product-meta">
              <text class="brand-name">{{ product.productDec }}</text>
              <text class="price">¥ {{ Number(product.salePrice).toFixed(2) }}</text>
            </view>

            <!-- 适配型号标签  -->
            <view class="model-tags">
              <view
                class="model-tag"
                v-for="(model, mIndex) in product.models"
                :class="{
                  modleActive:
                    normalize(model.name) === normalize(selectedModel) ||
                    normalize(model.name) === normalize(keyword) ||
                    isMatch(normalize(keyword), model.name) ||
                    isMatch(normalize(selectedModel), model.name),
                }"
                :key="mIndex"
              >
                {{ model.name }}
              </view>
            </view>

            <!-- 底部操作区域 -->
            <view class="product-footer">
              <view class="stock-info">
                <text class="label">库存</text>
                <text class="value">{{ product.stock }}</text>
                <text class="unit">片</text>
              </view>
              <view class="order-btn" @click.stop="handleCreateOrder(product)">
                <text>出单</text>
              </view>
            </view>
          </view>
          <!-- 底部安全区域 -->
          <view class="safe-bottom"></view>
        </template>
      </scroll-view>
    </view>

    <!-- 出单弹框 -->
    <uni-popup ref="orderPopupRef" type="center">
      <view class="order-popup">
        <view class="popup-header">
          <text class="popup-title">确认出单</text>
          <text class="iconfont icon-guanbi" @click="handleCancelOrder"></text>
        </view>

        <view class="popup-content">
          <!-- 会员选项 -->
          <view class="form-item">
            <text class="form-label">是否会员</text>
            <view class="member-switch">
              <view
                class="switch-option"
                :class="{ active: !isMember }"
                @click="handleMemberChange(false)"
              >
                否
              </view>
              <view
                class="switch-option"
                :class="{ active: isMember }"
                @click="handleMemberChange(true)"
              >
                是
              </view>
            </view>
          </view>

          <!-- 会员手机号 -->
          <view class="form-item" v-if="isMember">
            <text class="form-label">会员手机号</text>
            <view class="phone-input-wrapper">
              <input
                class="phone-input"
                type="number"
                v-model="memberPhone"
                placeholder="请输入会员手机号"
                :maxlength="11"
                @input="memberChecked = false"
              />
              <view
                class="query-btn"
                :class="{ loading: memberQueryLoading }"
                @click="handleQueryMember(originalPrice)"
              >
                <text v-if="!memberQueryLoading">查询</text>
                <text v-else>查询中...</text>
              </view>
            </view>
            <!-- 查询结果提示 -->
            <view class="member-result" v-if="memberChecked">
              <view class="result-tag" :class="memberFreeCount > 0 ? 'free' : 'normal'">
                <text v-if="memberFreeCount > 0">🎉 免费贴膜 ×{{ memberFreeCount }}</text>
                <text v-else>暂无免费次数</text>
              </view>
            </view>
          </view>

          <!-- 订单价格 -->
          <view class="form-item">
            <text class="form-label">订单价格</text>
            <view class="price-input-wrapper">
              <text class="price-symbol">¥</text>
              <input
                class="price-input"
                type="digit"
                :value="String(orderPrice)"
                :disabled="!priceEditable"
                :class="{ editable: priceEditable }"
                @input="handlePriceInput"
              />
              <view class="edit-btn" @click="togglePriceEdit">
                <text>{{ priceEditable ? '确定' : '改价' }}</text>
              </view>
            </view>
          </view>
        </view>

        <view class="popup-footer">
          <view class="btn-cancel" @click="handleCancelOrder">取消</view>
          <view class="btn-confirm" @click="handleConfirmOrder">确认出单</view>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<style scoped lang="scss">
.sell-page {
  box-sizing: border-box;
  padding-bottom: 60rpx;
  min-height: 100vh;
  height: 100vh;
  background-color: $jel-pageBackGroundColor;
  display: flex;
  flex-direction: column;
}

// 头部区域
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

    // 自定义 uni-search-bar 样式
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

// 型号选择区域
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
}

// 分类标签栏
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

// 主体内容区域
// 列表高度必须来自 flex 剩余空间，勿再用 100vh - xxx（会与 .main-content 实际高度不一致，导致 scroll-view 无法纵向滚动）
.main-content {
  flex: 1;
  min-height: 0;
  display: flex;
  overflow: hidden;

  // 左侧分类导航容器
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

  // 右侧商品列表
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
        justify-content: space-between;
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

        .order-btn {
          padding: 10rpx 32rpx;
          background-color: rgba($jel-brandColor, 0.08);
          border: 2rpx solid $jel-brandColor;
          border-radius: 28rpx;

          text {
            font-size: 24rpx;
            color: $jel-brandColor;
          }
        }
      }
    }

    .safe-bottom {
      height: 40rpx;
    }
  }
}

// 出单弹框样式
.order-popup {
  width: 600rpx;
  background-color: #fff;
  border-radius: 24rpx;
  overflow: hidden;

  .popup-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 32rpx;
    border-bottom: 1rpx solid $jel-border;

    .popup-title {
      font-size: 32rpx;
      font-weight: 600;
      color: $jel-font-title;
    }

    .icon-guanbi {
      font-size: 36rpx;
      color: $jel-font-dec;
    }
  }

  .popup-content {
    padding: 32rpx;

    .form-item {
      margin-bottom: 32rpx;

      &:last-child {
        margin-bottom: 0;
      }

      .form-label {
        display: block;
        font-size: 28rpx;
        color: $jel-font-dec2;
        margin-bottom: 16rpx;
      }

      .member-switch {
        display: flex;
        background-color: $jel-pageBackGroundColor;
        border-radius: 12rpx;
        overflow: hidden;

        .switch-option {
          flex: 1;
          padding: 20rpx 0;
          text-align: center;
          font-size: 28rpx;
          color: $jel-font-dec2;
          transition: all 0.2s;

          &.active {
            background-color: $jel-brandColor;
            color: #fff;
          }
        }
      }

      .form-input {
        width: 100%;
        height: 80rpx;
        padding: 0 24rpx;
        background-color: $jel-pageBackGroundColor;
        border-radius: 12rpx;
        font-size: 28rpx;
        color: $jel-font-title;
      }

      .phone-input-wrapper {
        display: flex;
        align-items: center;
        gap: 16rpx;

        .phone-input {
          flex: 1;
          height: 80rpx;
          padding: 0 24rpx;
          background-color: $jel-pageBackGroundColor;
          border-radius: 12rpx;
          font-size: 28rpx;
          color: $jel-font-title;
        }

        .query-btn {
          padding: 0 32rpx;
          height: 80rpx;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: $jel-brandColor;
          border-radius: 12rpx;
          white-space: nowrap;

          text {
            font-size: 28rpx;
            color: #fff;
          }

          &.loading {
            opacity: 0.7;
          }
        }
      }

      .member-result {
        margin-top: 16rpx;

        .result-tag {
          display: inline-flex;
          align-items: center;
          padding: 12rpx 24rpx;
          border-radius: 8rpx;
          font-size: 26rpx;

          &.free {
            background-color: rgba(#52c41a, 0.1);
            color: #52c41a;
          }

          &.normal {
            background-color: rgba($jel-font-dec, 0.1);
            color: $jel-font-dec;
          }
        }
      }

      .price-input-wrapper {
        display: flex;
        align-items: center;
        background-color: $jel-pageBackGroundColor;
        border-radius: 12rpx;
        padding: 0 24rpx;
        height: 80rpx;

        .price-symbol {
          font-size: 32rpx;
          font-weight: 600;
          color: $jel-brandColor;
          margin-right: 8rpx;
        }

        .price-input {
          flex: 1;
          font-size: 32rpx;
          font-weight: 600;
          color: $jel-font-dec;
          background: transparent;

          &.editable {
            color: $jel-brandColor;
          }
        }

        .edit-btn {
          padding: 12rpx 24rpx;
          background-color: rgba($jel-brandColor, 0.1);
          border-radius: 8rpx;

          text {
            font-size: 24rpx;
            color: $jel-brandColor;
          }
        }
      }
    }
  }

  .popup-footer {
    display: flex;
    padding: 24rpx 32rpx 32rpx;
    gap: 24rpx;

    .btn-cancel,
    .btn-confirm {
      flex: 1;
      height: 88rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 44rpx;
      font-size: 30rpx;
    }

    .btn-cancel {
      background-color: $jel-pageBackGroundColor;
      color: $jel-font-dec2;
    }

    .btn-confirm {
      background: linear-gradient(135deg, $jel-brandColor 0%, #e84545 100%);
      color: #fff;
      font-weight: 600;
    }
  }
}
</style>
