import { ref } from 'vue'
export const navList = ref([
  {
    id: 1,
    icon: '💰',
    title: '门店收益',
    desc: '查看收益明细',
    path: '/pagesMember/myIncome/myIncome',
  },
  {
    id: 2,
    icon: '📊',
    title: '门店报表',
    desc: '数据统计分析',
    path: '/pagesMember/storeReport/storeReport',
  },
  {
    id: 3,
    icon: '📦',
    title: '门店库存',
    desc: '库存管理查询',
    path: '/pagesMember/storeInventory/storeInventory',
  },
  {
    id: 4,
    icon: '📋',
    title: '采购订单',
    desc: '订单管理查看',
    path: '/pagesMember/storeOrders/storeOrders',
  },
  {
    id: 5,
    icon: '⚡',
    title: '快速售卖',
    desc: '快捷销售下单',
    path: '/pagesMember/sellPage/sellPage',
  },
  {
    id: 6,
    icon: '🛒',
    title: '门店采购',
    desc: '商品进货补货',
    path: '/pagesMember/storePurchase/storePurchase',
  },
  {
    id: 7,
    icon: '🛍️',
    title: '采购车',
    desc: '采购商品清单',
    path: '/pagesMember/purchaseCart/purchaseCart',
  },
])
