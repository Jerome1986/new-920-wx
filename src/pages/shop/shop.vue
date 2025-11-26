<script setup lang="ts">
import NavTab from '@/components/NavTab.vue'
import { ref } from 'vue'
import type { CateItem } from '@/types/CateItem'
import { onLoad } from '@dcloudio/uni-app'
import { cateListGetApi } from '@/api/cate.ts'
import SubCategory from '@/components/SubCategory.vue'
import ThirdCategory from '@/components/ThirdCategory.vue'
import type { JelSubCategory } from '@/types/component'
import type { ProductItem } from '@/types/ProductItem.d.ts'
import GlobalProductBar from '@/components/GlobalProductBar.vue'
import { productListByCateIdGetApi } from '@/api/product.ts'
import { useMemberStore } from '@/stores'

// 定义store
const userStore = useMemberStore()

// 处理搜索
const handleSearch = () => {
  uni.navigateTo({
    url: '/pages/search/search',
  })
}

// 获取分类
const cateList = ref<CateItem[]>([])
const cateId = ref('')
const cateListGet = async (level: number) => {
  const res = await cateListGetApi(level)
  console.log('分类', res)
  if (userStore.profile?.role === 'user' || userStore.profile?.role === 'vip') {
    cateList.value = res.data.filter((item) => item.name !== '手机膜')
  } else {
    cateList.value = res.data
  }
  cateId.value = cateList.value[0]._id
}

// 一级分类点击
const handelCate = async (parentId: string) => {
  console.log('分类点击', parentId)
  cateId.value = parentId
  subRef.value?.resetActive() // 重置二级分类的高亮状态
  params.value.pageNum = 1 // 重置产品页码
  finish.value = false // 重置产品退出分页
  productList.value = [] // 重置产品列表
  await subCateListGet(2, parentId)
  await thirdCateListGet(3, subCateId.value)
  await productListGet(parentId, params.value.pageNum, params.value.pageSize)
}

// 二级分类获取
const subRef = ref<JelSubCategory>()
const subCateList = ref<CateItem[]>([])
const subCateId = ref('')
const subCateListGet = async (level: number, parentId: string) => {
  console.log('subCateListGet', level, parentId)
  const res = await cateListGetApi(level, parentId)
  subCateList.value = res.data
  if (subCateList.value.length > 0) {
    subCateId.value = subCateList.value[0]._id
  }
}

const handelSub = (subId: string) => {
  console.log('handelSub')
  thirdCateListGet(3, subId)
}

// 三级分类
const thirdCateList = ref<CateItem[]>([])
const thirdCateListGet = async (level: number, parentId: string) => {
  console.log('三级分类', level, parentId)
  const res = await cateListGetApi(level, parentId)
  thirdCateList.value = res.data
}
const handleThird = (thirdCateId: string) => {
  console.log('三级分类', thirdCateId)
  uni.navigateTo({
    url: `/pages/managerProduct/managerProduct?thirdCategoryId=${thirdCateId}&productType='manager'`,
  })
}

onLoad(async () => {
  await cateListGet(1)
  await subCateListGet(2, cateId.value)
  await thirdCateListGet(3, subCateId.value)
  // 如果是用户身份或者是会员身份 则过滤掉手机膜选项  手机膜只针对进货渠道  -- 页面加载时根据分类直接渲染产品
  if (userStore.profile?.role === 'user' || userStore.profile?.role === 'vip')
    await productListGet(cateId.value, params.value.pageNum, params.value.pageSize)
})

// 产品分页
const params = ref({
  pageNum: 1,
  pageSize: 6,
})
// 如果没有二级分类或三级分类则直接渲染商品
const finish = ref(false)
const productList = ref<ProductItem[]>([])
const productListGet = async (cateId: string, pageNum: number, pageSize: number) => {
  // 退出分页判断
  if (finish.value) {
    return
  }
  const res = await productListByCateIdGetApi(cateId, pageNum, pageSize)
  console.log('产品', res.data)
  productList.value.push(...res.data.list)
  if (params.value.pageNum < res.data.totalPage) {
    params.value.pageNum++
  } else {
    finish.value = true
  }
}

/**
 * 处理阅读量的更新
 * @description 接受子组件的列表项点击事件，并获取更新当前项阅读量的参数，同步更新父组件的阅读量
 * @param newLook - 更新后从服务端返回的阅读量
 * @param productId - 点击当前项的id
 */
const handleNewLook = (newLook: number, productId: string) => {
  console.log('更新后的阅读量', newLook, productId)
  const item = productList.value.find((p) => p._id === productId)
  if (item) item.lookNum = newLook
}

// 触底
const handleScrolltolower = async () => {
  console.log('触底')
  await productListGet(cateId.value, params.value.pageNum, params.value.pageSize)
}
</script>
<template>
  <view class="shopPage">
    <!-- 搜索 -->
    <div class="search" style="margin-bottom: 24rpx" @click="handleSearch">
      <uni-search-bar readonly="true" placeholder="根据商品名称或货号来搜索" bgColor="#EEEEEE" />
    </div>
    <!--   tab切换   -->
    <NavTab :list="cateList" @cateSelected="handelCate"></NavTab>
    <!--  产品展示  -->
    <view class="list" v-if="subCateList.length > 0 && thirdCateList.length > 0">
      <!--  二级分类  -->
      <SubCategory ref="subRef" :list="subCateList" @changePhone="handelSub"></SubCategory>
      <!--  三级分类  -->
      <ThirdCategory
        v-if="subCateList.length > 0 && subCateId"
        :list="thirdCateList"
        @selectedType="handleThird"
      ></ThirdCategory>
    </view>
    <!--  没有二、三级分类就直接显示产品列表  -->
    <view v-else class="list">
      <GlobalProductBar
        :key="cateId"
        :list="productList"
        @update:loadMore="handleScrolltolower"
        @update:look-num="handleNewLook"
        :finish="finish"
      ></GlobalProductBar>
    </view>
  </view>
</template>

<style scoped lang="scss">
.shopPage {
  height: 100%;
  padding: 24rpx;
  display: flex;
  flex-direction: column;

  .list {
    flex: 1;
    overflow: hidden;
  }
}
</style>
