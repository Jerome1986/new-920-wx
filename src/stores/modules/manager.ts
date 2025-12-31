import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { StoreInfo } from '@/types/ManagerStore'
import { managerStoreInfoGetApi } from '@/api/store.ts'
import { useMemberStore } from '@/stores'

export const useManagerStore = defineStore(
  'manager',
  () => {
    const managerStoreInfo = ref<StoreInfo>()

    const managerStoreGet = async () => {
      // 在函数内部获取 store，确保 Pinia 已初始化
      const userStore = useMemberStore()
      if (!userStore.profile._id)
        return uni.showToast({ icon: 'none', title: '当前用户未登录，无法获取门店信息' })
      const res = await managerStoreInfoGetApi(userStore.profile._id)
      console.log('库存', res)
      managerStoreInfo.value = res.data
    }

    return {
      managerStoreInfo,
      managerStoreGet,
    }
  },
  {
    // 网页端配置
    // persist: true,
    // 小程序端配置
    persist: {
      storage: {
        getItem(key) {
          return uni.getStorageSync(key)
        },
        setItem(key, value) {
          uni.setStorageSync(key, value)
        },
      },
    },
  },
)
