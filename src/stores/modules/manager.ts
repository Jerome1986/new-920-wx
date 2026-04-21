import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useMemberStore } from '@/stores/modules/member'
import { managerStoreInfoGetApi } from '@/api/store'
import type { StoreDetail } from '@/types/ManagerStore'

export const useManagerStore = defineStore(
  'manager',
  () => {
    const managerStoreInfo = ref<StoreDetail>()

    const managerStoreGet = async () => {
      // 在函数内部获取 store，确保 Pinia 已初始化
      const userStore = useMemberStore()

      if (!userStore.profile.id) {
        uni.showToast({ icon: 'none', title: '当前用户未登录，无法获取门店信息' })
        return
      }

      if (!userStore.profile.storeId) {
        uni.showToast({ icon: 'none', title: '门店信息错误' })
        return
      }

      const res = await managerStoreInfoGetApi(userStore.profile.storeId, userStore.profile.id)
      console.log('storeDetail', res.data)

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
