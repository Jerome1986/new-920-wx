/**
 * declare module '@vue/runtime-core'
 *   现调整为
 * declare module 'vue'
 */
import 'vue'
import SubCategory from '@/components/SubCategory.vue'
import HotProductList from '@/components/HotProductList.vue'
import SearchBar from '@/components/SearchBar.vue'

declare module 'vue' {
  export interface GlobalComponents {
    SubCategory: typeof SubCategory
    HotProductList: typeof HotProductList
    SearchBar: typeof SearchBar
  }
}

export type JelSubCategory = InstanceType<typeof SubCategory>
export type JelHotProductList = InstanceType<typeof HotProductList>
export type JelSearchBar = InstanceType<typeof SearchBar>
