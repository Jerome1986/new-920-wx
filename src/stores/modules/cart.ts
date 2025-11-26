import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CartItem } from '@/types/CartItem'

export const useCartStore = defineStore(
  'cart',
  () => {
    // 购物车列表
    const cartList = ref<CartItem[]>([])

    // 添加购物车
    const addCart = (cartData: CartItem) => {
      const findExist = cartList.value.find((item) => {
        return item.productId === cartData.productId && item.sku?._id === cartData.sku?._id
      })

      if (!findExist) {
        console.log('新增', findExist)
        cartList.value.push({ ...cartData })
      } else {
        console.log('查找', findExist)
        findExist.quantity++
      }
    }

    // 计算总数
    const totalQuantity = computed(() => {
      return cartList.value.reduce((sum, item) => {
        return sum + item.quantity
      }, 0)
    })

    // 切换单个商品选中状态
    const toggleSelect = (id: string) => {
      const item = cartList.value.find((item) => item._id === id)
      if (item) {
        item.selected = !item.selected
      }
    }

    // 已选商品数量
    const selectedCount = computed(() => {
      return cartList.value.filter((item) => item.selected).length
    })

    // 已选商品总价
    const totalPrice = computed(() => {
      return cartList.value
        .filter((item) => item.selected)
        .reduce((total, item) => total + item.currentPrice * item.quantity, 0)
    })

    // 计算已选商品的总件数
    const totalCount = computed(() => {
      return selectProduct.value.reduce((sum, item) => {
        return sum + item.quantity
      }, 0)
    })

    // 减少数量
    const decreaseQuantity = (id: string) => {
      const item = cartList.value.find((item) => item._id === id)
      if (item && item.quantity > 1) {
        item.quantity--
      }
    }

    // 增加数量
    const increaseQuantity = (id: string) => {
      const item = cartList.value.find((item) => item._id === id)
      if (item && item.sku && item.quantity < item.sku.stock) {
        item.quantity++
      }
    }

    // 删除商品
    const deleteItem = (id: string) => {
      uni.showModal({
        title: '提示',
        content: '确定要删除该商品吗？',
        confirmColor: '#d62731',
        success: (res) => {
          if (res.confirm) {
            const index = cartList.value.findIndex((item) => item._id === id)
            if (index !== -1) {
              cartList.value.splice(index, 1)
            }
          }
        },
      })
    }

    // 清空已选中的商品--用于订单购买后重置购物车
    const clearSelectedCart = () => {
      cartList.value = cartList.value.filter((item) => !item.selected)
    }

    // 全选状态
    const isAllSelected = computed({
      get: () => cartList.value.length > 0 && cartList.value.every((item) => item.selected),
      set: (val) => {
        cartList.value.forEach((item) => {
          item.selected = val
        })
      },
    })

    const setAllSelected = () => {
      isAllSelected.value = !isAllSelected.value
    }

    // 已选择的商品
    const selectProduct = computed(() => {
      return cartList.value.filter((item) => item.selected)
    })

    return {
      cartList,
      addCart,
      totalQuantity,
      totalPrice,
      toggleSelect,
      selectedCount,
      isAllSelected,
      setAllSelected,
      decreaseQuantity,
      increaseQuantity,
      deleteItem,
      selectProduct,
      totalCount,
      clearSelectedCart,
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
