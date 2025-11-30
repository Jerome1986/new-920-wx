import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RateRulesItem } from '@/types/RateRuleItem'
import { rateRuleListGet } from '@/api/rate.ts'

export const useRateStore = defineStore(
  'rate',
  () => {
    const rateRules = ref<RateRulesItem>()

    const rateRuleGet = async () => {
      const res = await rateRuleListGet()
      rateRules.value = res.data[0]
    }

    return {
      rateRules,
      rateRuleGet,
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
