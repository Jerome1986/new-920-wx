<script lang="ts" setup>
import SearchBar from '@/components/SearchBar.vue'
import type { ProductItem } from '@/types/ProductItem'
import { ref } from 'vue'
import { useMemberStore } from '@/stores'
import NavTitle from '@/components/NavTitle.vue'
import HotProductList from '@/components/HotProductList.vue'
import GuessBar from '@/pages/search/GuessBar.vue'
import type { JelSearchBar } from '@/types/component'
import { productListSearchGetApi } from '@/api/product.ts'
import GlobalProductBar from '@/components/GlobalProductBar.vue'

// 定义store
const userStore = useMemberStore()

const searchRef = ref<JelSearchBar>()

// 当前搜索关键词
const currentSearchKeyword = ref('')

// 分页
const params = ref({
  pageNum: 1,
  pageSize: 8,
})

// 产品数据
const finish = ref(false)
const products = ref<ProductItem[]>([])
const getProducts = async (val: string, pageNum: number, pageSize: number) => {
  if (finish.value) return
  const res = await productListSearchGetApi(val, 'both', pageNum, pageSize)
  console.log('搜索结果', res.data)
  products.value.push(...res.data.list)
  if (params.value.pageNum < res.data.totalPage) {
    params.value.pageNum++
  } else {
    finish.value = true
  }
}

// 选择猜你想搜事件
const selectGuess = (guessName: string) => {
  console.log('猜你想搜', guessName)
  currentSearchKeyword.value = guessName // 保存当前搜索词
  products.value = [] // 清空旧的搜索结果
  params.value.pageNum = 1
  finish.value = false
  searchRef.value?.setSearchValue(guessName) // 让搜索组件input同步搜索内容
  getProducts(guessName, params.value.pageNum, params.value.pageSize)
}

// 处理历史搜索事件
const historySearch = async (val: string) => {
  console.log('搜索', val)
  currentSearchKeyword.value = val // 保存当前搜索词
  products.value = [] // 清空旧的搜索结果
  params.value.pageNum = 1
  finish.value = false
  await getProducts(val, params.value.pageNum, params.value.pageSize)
  console.log('历史结果', products.value, finish.value)
}

// 处理搜索按钮点击
const handleSearch = async (val: string) => {
  console.log('搜索按钮', val)
  currentSearchKeyword.value = val // 保存当前搜索词
  products.value = [] // 清空旧的搜索结果
  params.value.pageNum = 1
  finish.value = false
  await getProducts(val, params.value.pageNum, params.value.pageSize)
}

// 处理清除事件
const handleClear = () => {
  console.log('清除')
  currentSearchKeyword.value = '' // 清空搜索词
  products.value = []
  params.value.pageNum = 1
  finish.value = false
}

// 搜索结果加载更多
const handleScrollToLower = async () => {
  if (currentSearchKeyword.value) {
    await getProducts(currentSearchKeyword.value, params.value.pageNum, params.value.pageSize)
  }
}

// 跳转详情
const handleNavigate = (id: string) => {
  console.log('详情')
}
</script>

<template>
  <scroll-view
    class="searchPage"
    :enhanced="true"
    :show-scrollbar="false"
    :scroll-y="true"
    @scrolltolower="handleScrollToLower"
  >
    <!-- 搜索组件 -->
    <SearchBar
      ref="searchRef"
      @search="handleSearch"
      @historySearch="historySearch"
      @clear="handleClear"
    ></SearchBar>
    <!--  猜你想搜  -->
    <GuessBar @selectGuess="selectGuess"></GuessBar>
    <!-- 热门推荐 -->
    <view class="activityList" v-show="products.length === 0 && !currentSearchKeyword">
      <NavTitle title="热门推荐" :is-more="false"></NavTitle>
      <HotProductList key="hot-products"></HotProductList>
    </view>
    <!-- 搜索结果 -->
    <view v-show="products.length > 0 || currentSearchKeyword" class="searchResult">
      <NavTitle title="搜索结果" :is-more="false"></NavTitle>
      <GlobalProductBar
        :key="currentSearchKeyword || 'default'"
        :list="products"
        :finish="finish"
      ></GlobalProductBar>
    </view>
  </scroll-view>
</template>

<style lang="scss">
.searchPage {
  padding: 24rpx 24rpx 60rpx 24rpx;
  width: 100%;
  height: 100%;
  background-color: $jel-pageBackGroundColor;
  overflow-y: auto;
}
</style>
