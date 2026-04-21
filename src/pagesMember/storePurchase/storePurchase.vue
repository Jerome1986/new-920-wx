<script setup lang="ts">
import NavTab from '@/components/NavTab.vue'
import SubCategory from '@/components/SubCategory.vue'
import ThirdCategory from '@/components/ThirdCategory.vue'
import { onLoad } from '@dcloudio/uni-app'
import { nextTick, ref } from 'vue'
import { cateMoGetApi } from '@/api/cate'
import type { CateItem } from '@/types/CateItem'

const handleSearch = () => {
  uni.navigateTo({
    url: '/pages/search/searchToB',
  })
}

// 一级：接口树根；二、三级：当前选中节点的 children
const level1List = ref<CateItem[]>([])
const level2List = ref<CateItem[]>([])
const level3List = ref<CateItem[]>([])

const subCategoryRef = ref<{ resetActive: () => void } | null>(null)

const applyLevel2 = (cateId: number) => {
  const node = level2List.value.find((c) => c.id === cateId)
  level3List.value = node?.children ?? []
}

const applyLevel1 = async (cateId: number) => {
  const node = level1List.value.find((c) => c.id === cateId)
  level2List.value = node?.children ?? []
  await nextTick()
  subCategoryRef.value?.resetActive()
  const firstL2 = level2List.value[0]
  if (firstL2) {
    applyLevel2(firstL2.id)
  } else {
    level3List.value = []
  }
}

const categoryTreeGet = async () => {
  const res = await cateMoGetApi('TOB')
  level1List.value = res.data ?? []
  if (level1List.value.length) {
    await applyLevel1(level1List.value[0].id)
  } else {
    level2List.value = []
    level3List.value = []
  }
}

const selectLevel1 = (cateId: number) => {
  void applyLevel1(cateId)
}

const selectLevel2 = (phoneId: number) => {
  applyLevel2(phoneId)
}

const selectLevel3 = (thirdCategoryId: number) => {
  uni.navigateTo({
    url: `/pages/managerProduct/managerProduct?thirdCategoryId=${thirdCategoryId}`,
  })
}

onLoad(async () => {
  await categoryTreeGet()
})
</script>

<template>
  <view class="shopPage">
    <view class="search" style="margin-bottom: 24rpx" @click="handleSearch">
      <uni-search-bar :readonly="true" placeholder="根据商品名称或货号来搜索" bgColor="#EEEEEE" />
    </view>

    <NavTab v-if="level1List.length" :list="level1List" @cateSelected="selectLevel1" />
    <SubCategory
      v-if="level2List.length"
      ref="subCategoryRef"
      :list="level2List"
      @changePhone="selectLevel2"
    />
    <ThirdCategory v-if="level3List.length" :list="level3List" @selectedType="selectLevel3" />
  </view>
</template>

<style scoped lang="scss">
.shopPage {
  min-height: 100%;
  padding: 24rpx;
  box-sizing: border-box;
}
</style>
