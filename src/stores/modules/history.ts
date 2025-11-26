import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useHistoryStore = defineStore(
  'history',
  () => {
    const historyList = ref<string[]>([])

    const setHistoryList = (val: string) => {
      if (historyList.value.includes(val)) return
      historyList.value.unshift(val)
      // 如果超过5个，删除最后一个
      if (historyList.value.length > 5) {
        historyList.value.pop()
      }
    }

    const clearHistory = () => {
      historyList.value = []
    }

    return {
      historyList,
      setHistoryList,
      clearHistory,
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
