<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import type { freeOrderStatus, QuickOrderResult } from '@/types/Order'
import { completeGiftOrderApi, offlineOrderGetApi, updateOfflineOrderApi } from '@/api/order'
import { formatTimestamp } from '@/utils/formatTimestamp.ts'
import { quickOrderStatusConfig } from './statusConfig'
import {
  arrayBufferToHex,
  closeBleConnection,
  closeBluetoothAdapter,
  createBleConnection,
  disableBleNotification,
  enableBleNotification,
  findWritableCharacteristic,
  offBleCharacteristicValueChange,
  offBluetoothDeviceFound,
  onBleCharacteristicValueChange,
  onBluetoothDeviceFound,
  openBluetoothAdapter,
  startBluetoothDiscovery,
  stopBluetoothDiscovery,
  writeBleHexCommand,
} from '@/utils/bluetooth'
import { decrementStoreStockApi } from '@/api/store'

// 订单信息
const orderInfo = ref<QuickOrderResult<freeOrderStatus>>()
const showBluetoothList = ref(false)
const bluetoothDevices = ref<
  Array<{
    deviceId: string
    name?: string
    localName?: string
    RSSI?: number
  }>
>([])
const connectingDeviceId = ref('') // 当前正在连接/断开的设备ID（用于按钮防重入）
const connectedDeviceId = ref('') // 当前已连接设备ID
const currentServiceId = ref('') // 协议写入服务ID（AB01）
const currentWriteCharId = ref('') // 协议写入特征ID（AB02）
const notifyServiceId = ref('') // 协议通知服务ID（AB01）
const notifyCharacteristicId = ref('') // 协议通知特征ID（AB03）
const isFilmStarted = ref(false) // 是否处于贴膜进行中状态
const filmFinished = ref(false) // 是否已收到贴膜结束通知（FFB1110055）
const isDiscoveryListening = ref(false) // 是否已注册扫描监听（避免重复监听）

// 协议固定特征：服务 AB01、写 AB02、通知 AB03
const PROTOCOL_SERVICE_SUFFIX = 'AB01'
const PROTOCOL_WRITE_SUFFIX = 'AB02'

// 清理页面内蓝牙状态缓存（不处理底层连接释放）
const resetBluetoothState = () => {
  connectedDeviceId.value = ''
  connectingDeviceId.value = ''
  currentServiceId.value = ''
  currentWriteCharId.value = ''
  notifyServiceId.value = ''
  notifyCharacteristicId.value = ''
  isFilmStarted.value = false
  filmFinished.value = false
}

// 当前状态配置
const currentStatus = computed(() => {
  const status = orderInfo.value?.status || 'IN_SERVICE'
  return quickOrderStatusConfig[status]
})

// 是否可以确认完成（服务中状态可以操作）
const canComplete = computed(() => {
  return orderInfo.value?.status === 'IN_SERVICE'
})

// 根据传过来的订单号获取免费订单详情
const giftOrderGet = async (outTtradeNo: string) => {
  const res = await offlineOrderGetApi(outTtradeNo)
  console.log('免费订单详情', res)
  orderInfo.value = res.data
}

// 确认完成服务
const handleConfirmService = () => {
  uni.showModal({
    title: '确认完成',
    content: '请确认已为客户完成贴膜服务',
    confirmColor: '#52c41a',
    success: async (res) => {
      if (res.confirm) {
        // 调用完成服务接口
        if (orderInfo.value?.outTradeNo) {
          const result = await completeGiftOrderApi(orderInfo.value?.outTradeNo, 'COMPLETED')
          console.log('确认完成服务:', result)
          await uni.showToast({ title: '服务已完成', icon: 'success' })
          closeBluetoothList()
          // 更新本地状态
          if (orderInfo.value) {
            orderInfo.value.status = result.data.status
          }
          // 跳转到门店管理页
          setTimeout(() => {
            uni.redirectTo({ url: '/pagesMember/StoreManager/StoreManager' })
          }, 800)
        }
      }
    },
  })
}

// 取消订单
const handleCancelOrder = () => {
  uni.showModal({
    title: '取消订单',
    content: '确定要取消该订单吗？',
    confirmColor: '#d62731',
    success: async (res) => {
      if (res.confirm) {
        // 调用取消订单接口
        if (orderInfo.value) await updateOfflineOrderApi(orderInfo.value?.outTradeNo, 'CANCELLED')
        console.log('取消订单:', orderInfo.value?.outTradeNo)
        await uni.showToast({ title: '订单已取消', icon: 'success' })
        setTimeout(() => {
          uni.navigateBack()
        }, 1500)
      }
    },
  })
}

// 蓝牙流程-1：开始连接（打开弹层 -> 初始化蓝牙 -> 开始扫描 -> 持续接收设备列表）
const startService = () => {
  // 打开蓝牙面板并清空上一次扫描结果
  showBluetoothList.value = true
  bluetoothDevices.value = []
  // 初始化蓝牙并启动扫描
  openBluetoothAdapter()
    .then(() => startBluetoothDiscovery())
    .then(() => {
      // 避免重复注册扫描监听
      if (isDiscoveryListening.value) {
        offBluetoothDeviceFound()
      }
      // 持续监听扫描回调，增量合并设备列表
      onBluetoothDeviceFound((devices) => {
        devices.forEach((device) => {
          if (!device?.deviceId) return
          const index = bluetoothDevices.value.findIndex(
            (item) => item.deviceId === device.deviceId,
          )
          if (index > -1) {
            bluetoothDevices.value[index] = {
              ...bluetoothDevices.value[index],
              ...device,
            }
          } else {
            bluetoothDevices.value.push(device)
          }
          console.log('发现设备：', device.name || device.localName, device.deviceId)
        })
      })
      isDiscoveryListening.value = true
    })
    .catch((err) => {
      console.log('蓝牙初始化或扫描失败', err)
      uni.showToast({ title: '蓝牙不可用', icon: 'none' })
    })
}

// 蓝牙流程-6：发送开始贴膜指令（FFA1110055）
const handleStartFilm = async () => {
  // 开始贴膜前确保通知已开启（避免错过设备上报）
  if (connectedDeviceId.value && notifyServiceId.value && notifyCharacteristicId.value) {
    enableBleNotification(
      connectedDeviceId.value,
      notifyServiceId.value,
      notifyCharacteristicId.value,
    ).catch((err) => console.log('开始贴膜前启用通知失败', err))
  }
  // 下发开始贴膜指令，成功后更新本地贴膜状态
  sendFilmCommand('FFA1110055', () => {
    isFilmStarted.value = true
    filmFinished.value = false
    uni.showToast({ title: '开始贴膜指令已发送', icon: 'success' })
  })

  // 指令发送成功扣减库存
  console.log('sku', orderInfo.value?.skuId)

  if (orderInfo.value)
    await decrementStoreStockApi(orderInfo.value?.storeId, orderInfo.value?.skuId, 1)
}

// 关闭前判断：已完成先确认完成，贴膜中二次确认，其它状态直接关闭
const handleCloseWithCheck = () => {
  if (filmFinished.value) {
    handleConfirmService()
    closeBluetoothList()
    return
  }
  if (isFilmStarted.value) {
    uni.showToast({ title: '贴膜进行中，暂不可关闭', icon: 'none' })
    return
  }
  closeBluetoothList()
}

// 蓝牙流程-4：发现并缓存可写特征（后续写入贴膜机指令必需）
const discoverWritableCharacteristic = (deviceId: string) => {
  // 连接成功后查询可写特征，供后续发送指令
  findWritableCharacteristic(deviceId)
    .then(({ serviceId, characteristicId }) => {
      // 仅使用协议指定的 AB01/AB02；防止误用其它服务特征导致通知收不到
      const serviceUpper = serviceId.toUpperCase()
      const charUpper = characteristicId.toUpperCase()
      if (
        !serviceUpper.includes(`0000${PROTOCOL_SERVICE_SUFFIX}`) ||
        !charUpper.includes(`0000${PROTOCOL_WRITE_SUFFIX}`)
      ) {
        uni.showToast({ title: '未匹配协议写特征AB02', icon: 'none' })
        console.log('当前写特征不匹配协议:', serviceId, characteristicId)
        return
      }
      currentServiceId.value = serviceId
      currentWriteCharId.value = characteristicId

      // 通知固定走 AB03（与 AB01 同服务）
      notifyServiceId.value = serviceId
      notifyCharacteristicId.value = characteristicId.replace(/0000AB02/i, '0000AB03')
      enableBleNotification(deviceId, notifyServiceId.value, notifyCharacteristicId.value)
        .then(() => {
          offBleCharacteristicValueChange()
          onBleCharacteristicValueChange((res) => {
            const hex = arrayBufferToHex(res.value).toUpperCase()
            console.log('蓝牙通知回包:', hex, res.value)
            if (hex === 'FFB1110055') {
              isFilmStarted.value = false
              filmFinished.value = true
              console.log('收到贴膜结束上报')
            }
          })
          console.log(
            '蓝牙通知已开启并注册监听:',
            notifyServiceId.value,
            notifyCharacteristicId.value,
          )
        })
        .catch((err) => {
          console.log('通知开启失败', err)
        })
      // 找到可写特征后停止扫描，避免多余资源消耗
      stopBluetoothDiscovery().then(() => console.log('连接后停止扫描成功'))
      isFilmStarted.value = false
      uni.showToast({ title: '连接成功', icon: 'success' })
    })
    .catch((err) => {
      console.log('获取蓝牙服务或特征失败', err)
      uni.showToast({ title: '未找到可写特征', icon: 'none' })
    })
}

// 蓝牙流程-8：关闭蓝牙弹层（断开连接 -> 停止扫描 -> 取消监听 -> 关闭适配器 -> 清理状态）
const closeBluetoothList = () => {
  const currentDeviceId = connectedDeviceId.value
  // 若有已连接设备，先断开连接
  if (currentDeviceId) {
    closeBleConnection(currentDeviceId)
      .then(() => console.log('关闭弹层时断开蓝牙成功'))
      .catch((err) => console.log('关闭弹层时断开蓝牙失败', err))
  }
  // 清理连接态与贴膜态缓存
  if (currentDeviceId && notifyServiceId.value && notifyCharacteristicId.value) {
    disableBleNotification(
      currentDeviceId,
      notifyServiceId.value,
      notifyCharacteristicId.value,
    ).catch((err) => console.log('关闭弹层时关闭通知失败', err))
  }
  resetBluetoothState()
  offBleCharacteristicValueChange()
  // 释放蓝牙资源并关闭弹层
  stopBluetoothDiscovery().then(() => console.log('停止蓝牙扫描成功'))
  offBluetoothDeviceFound()
  isDiscoveryListening.value = false
  closeBluetoothAdapter().then(() => console.log('关闭蓝牙模块成功'))
  showBluetoothList.value = false
}

// 蓝牙流程-3：点击设备连接蓝牙（建立连接成功后进入可写特征发现）
const handleConnectDevice = (deviceId: string) => {
  // 防止重复点击同一设备导致并发连接
  if (!deviceId || connectingDeviceId.value === deviceId || connectedDeviceId.value === deviceId)
    return
  connectingDeviceId.value = deviceId
  // 建立设备连接，成功后继续发现可写特征
  createBleConnection(deviceId)
    .then(() => {
      console.log('连接蓝牙成功')
      connectedDeviceId.value = deviceId
      discoverWritableCharacteristic(deviceId)
    })
    .catch((err) => {
      console.log('连接蓝牙失败', err)
      uni.showToast({ title: '连接失败', icon: 'none' })
    })
    .finally(() => {
      connectingDeviceId.value = ''
    })
}

// 蓝牙流程-5：点击断开蓝牙连接（并清空当前连接相关状态）
const handleDisconnectDevice = (deviceId: string) => {
  // 防止断开过程重复触发
  if (!deviceId || connectingDeviceId.value === deviceId) return
  connectingDeviceId.value = deviceId
  // 主动断开当前设备连接
  closeBleConnection(deviceId)
    .then(() => {
      console.log('断开蓝牙成功')
      if (connectedDeviceId.value === deviceId) {
        if (notifyServiceId.value && notifyCharacteristicId.value) {
          disableBleNotification(
            deviceId,
            notifyServiceId.value,
            notifyCharacteristicId.value,
          ).catch((err) => console.log('断开时关闭通知失败', err))
        }
        offBleCharacteristicValueChange()
        // 断开后清空可写特征与贴膜状态缓存
        resetBluetoothState()
      }
      uni.showToast({ title: '已断开连接', icon: 'none' })
    })
    .catch((err) => {
      console.log('断开蓝牙失败', err)
      uni.showToast({ title: '断开失败', icon: 'none' })
    })
    .finally(() => {
      connectingDeviceId.value = ''
    })
}

// 蓝牙流程-2：通用写指令入口（校验连接态 -> 写入 hex 指令 -> 回调业务状态）
const sendFilmCommand = (commandHex: string, onSuccess: () => void) => {
  // 写指令前校验蓝牙连接与可写特征是否就绪
  if (!connectedDeviceId.value || !currentServiceId.value || !currentWriteCharId.value) {
    uni.showToast({ title: '蓝牙未就绪', icon: 'none' })
    return
  }
  // 通过工具模块统一下发十六进制指令
  writeBleHexCommand(
    connectedDeviceId.value,
    currentServiceId.value,
    currentWriteCharId.value,
    commandHex,
  )
    .then(() => {
      console.log('贴膜指令发送成功', commandHex)
      onSuccess()
    })
    .catch((err) => {
      console.log('贴膜指令发送失败', commandHex, err)
      uni.showToast({ title: '发送失败', icon: 'none' })
    })
}

// 返回上一页
const handleBack = () => {
  uni.navigateBack()
}

onLoad((query?: AnyObject) => {
  if (!query) return
  console.log('页面接收到参数', query)
  if (query.outTtradeNo) {
    giftOrderGet(query.outTtradeNo)
  }
})
</script>

<template>
  <view class="gift-order">
    <!-- 可滚动内容区域 -->
    <scroll-view class="scroll-content" :scroll-y="true">
      <!-- 状态头部 -->
      <view class="order-header" :style="{ background: currentStatus.bgColor }">
        <view class="status-info">
          <text class="status-text">{{ currentStatus.text }}</text>
          <text class="order-no">订单号：{{ orderInfo?.outTradeNo }}</text>
        </view>
      </view>

      <!-- 会员信息卡片 -->
      <view class="member-card">
        <view class="card-title">
          <text class="iconfont icon-huiyuan"></text>
          <text>会员信息</text>
        </view>
        <view class="member-info">
          <view class="info-row">
            <text class="label">会员手机</text>
            <text class="value">{{ orderInfo?.memberPhone || '--' }}</text>
          </view>
          <view class="info-row">
            <text class="label">服务类型</text>
            <text class="value highlight">会员免费贴膜</text>
          </view>
        </view>
      </view>

      <!-- 商品信息卡片 -->
      <view class="product-card">
        <view class="card-title">
          <view class="title-left">
            <text class="iconfont icon-shangpin"></text>
            <text>商品信息</text>
          </view>
          <text class="create-time">{{ formatTimestamp(orderInfo?.createdAt, 2) }}</text>
        </view>
        <view class="product-info" v-if="orderInfo">
          <image class="product-cover" :src="orderInfo.productCover" mode="aspectFill" />
          <view class="product-detail">
            <text class="product-name">{{ orderInfo.skuNo }} {{ orderInfo?.productName }}</text>
            <text class="product-sku">{{ orderInfo?.remark }}</text>
            <view class="price-row">
              <text class="free-tag">免费</text>
              <text class="original-price"
                >¥{{ Number(orderInfo?.actualPayment).toFixed(2) || '0.00' }}</text
              >
            </view>
          </view>
        </view>
      </view>

      <!-- 订单信息卡片 -->
      <view class="order-card">
        <view class="card-title">
          <text class="iconfont icon-dingdan"></text>
          <text>订单信息</text>
        </view>
        <view class="order-info">
          <view class="info-row">
            <text class="label">订单类型</text>
            <text class="value">会员免费贴膜</text>
          </view>
          <view class="info-row">
            <text class="label">订单状态</text>
            <text class="value" :style="{ color: currentStatus.color }">{{
              currentStatus.text
            }}</text>
          </view>
          <view class="info-row">
            <text class="label">创建时间</text>
            <text class="value">{{ formatTimestamp(orderInfo?.createdAt, 2) }}</text>
          </view>
          <view class="info-row" v-if="orderInfo?.completedAt">
            <text class="label">完成时间</text>
            <text class="value">{{ formatTimestamp(orderInfo?.completedAt, 2) }}</text>
          </view>
          <view class="info-row" v-if="orderInfo?.remark">
            <text class="label">订单备注</text>
            <text class="value">{{ orderInfo?.remark }}</text>
          </view>
        </view>
      </view>

      <!-- 底部安全区域 -->
      <view class="safe-bottom"></view>
    </scroll-view>

    <!-- 底部操作栏（固定在底部） -->
    <view class="footer-bar">
      <template v-if="orderInfo?.status === 'PAID'">
        <view class="btn-complete" @click="startService">
          <text class="iconfont icon-queren"></text>
          <text>连接设备</text>
        </view>
        <view class="btn-cancel" @click="handleCancelOrder">
          <text>取消订单</text>
        </view>
      </template>
      <!-- 待服务/服务中状态 -->
      <template v-else-if="canComplete">
        <view class="btn-complete" @click="handleConfirmService">
          <text class="iconfont icon-queren"></text>
          <text>确认完成</text>
        </view>
      </template>
      <!-- 已完成/已取消状态 -->
      <template v-else>
        <view class="btn-back-full" @click="handleBack">
          <text>返回</text>
        </view>
      </template>
    </view>

    <!-- 蓝牙列表 -->
    <view class="bluetooth-panel" v-if="showBluetoothList">
      <view class="bluetooth-mask"></view>
      <view class="bluetooth-content">
        <view class="bluetooth-header">
          <view class="bluetooth-title-wrap">
            <text class="iconfont icon-lanya"></text>
            <text class="bluetooth-title">选择蓝牙设备</text>
          </view>
          <view class="header-close" @click="handleCloseWithCheck">
            <text>关闭</text>
          </view>
        </view>

        <view class="bluetooth-tip">
          <text>请将设备靠近并保持蓝牙开启</text>
        </view>

        <scroll-view class="bluetooth-list" :scroll-y="true">
          <view class="bluetooth-item" v-for="item in bluetoothDevices" :key="item.deviceId">
            <view class="item-left">
              <text class="device-name">{{ item.name || item.localName || '未命名设备' }}</text>
              <text class="device-id">ID: {{ item.deviceId }}</text>
            </view>
            <view
              class="item-right"
              :class="{
                disabled: connectingDeviceId === item.deviceId,
                connected: connectedDeviceId === item.deviceId,
              }"
              @click="
                connectedDeviceId === item.deviceId
                  ? handleDisconnectDevice(item.deviceId)
                  : handleConnectDevice(item.deviceId)
              "
            >
              <text v-if="connectingDeviceId === item.deviceId">{{
                connectedDeviceId === item.deviceId ? '断开中...' : '连接中...'
              }}</text>
              <text v-else-if="connectedDeviceId === item.deviceId">断开</text>
              <text v-else>连接</text>
            </view>
          </view>
          <view class="bluetooth-empty" v-if="!bluetoothDevices.length">
            <text>正在扫描附近蓝牙设备...</text>
          </view>
        </scroll-view>

        <view class="bluetooth-footer">
          <view
            class="btn-close"
            :class="{
              'btn-start-film': !isFilmStarted && !filmFinished,
              'btn-finished': filmFinished,
            }"
            @click="
              filmFinished ? handleConfirmService() : !isFilmStarted ? handleStartFilm() : null
            "
          >
            <text>{{ filmFinished ? '确认完成' : isFilmStarted ? '贴膜中' : '开始贴膜' }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.gift-order {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: $jel-pageBackGroundColor;
}

// 可滚动内容区域
.scroll-content {
  flex: 1;
  height: 0; // 配合 flex: 1 使用
}

// 底部安全区域
.safe-bottom {
  height: 40rpx;
}

// 状态头部
.order-header {
  padding: 40rpx 32rpx;

  .status-info {
    display: flex;
    flex-direction: column;

    .status-text {
      font-size: 36rpx;
      font-weight: 600;
      color: #fff;
      margin-bottom: 8rpx;
    }

    .order-no {
      font-size: 24rpx;
      color: rgba(255, 255, 255, 0.8);
    }
  }
}

// 通用卡片样式
.member-card,
.product-card,
.order-card {
  margin: 24rpx;
  padding: 28rpx;
  background-color: #fff;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

// 通用卡片标题
.card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 24rpx;
  border-bottom: 1rpx solid $jel-border;
  margin-bottom: 24rpx;

  .title-left {
    display: flex;
    align-items: center;

    .iconfont {
      font-size: 36rpx;
      color: $jel-brandColor;
      margin-right: 12rpx;
    }

    text {
      font-size: 30rpx;
      font-weight: 600;
      color: $jel-font-title;
    }
  }

  .create-time {
    font-size: 24rpx;
    color: $jel-font-dec;
  }

  // 兼容没有 title-left 的卡片
  > .iconfont {
    font-size: 36rpx;
    color: $jel-brandColor;
    margin-right: 12rpx;
  }

  > text {
    font-size: 30rpx;
    font-weight: 600;
    color: $jel-font-title;
  }
}

// 会员信息卡片
.member-card {
  .member-info {
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16rpx 0;

      &:not(:last-child) {
        border-bottom: 1rpx dashed $jel-border;
      }

      .label {
        font-size: 28rpx;
        color: $jel-font-dec2;
      }

      .value {
        font-size: 28rpx;
        color: $jel-font-title;

        &.highlight {
          color: $jel-brandColor;
          font-weight: 500;
        }
      }
    }
  }
}

// 商品信息卡片
.product-card {
  .product-info {
    display: flex;

    .product-cover {
      width: 180rpx;
      height: 180rpx;
      border-radius: 12rpx;
      background-color: $jel-pageBackGroundColor;
      flex-shrink: 0;
    }

    .product-detail {
      flex: 1;
      margin-left: 24rpx;
      display: flex;
      flex-direction: column;
      justify-content: space-between;

      .product-name {
        font-size: 30rpx;
        font-weight: 600;
        color: $jel-font-title;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .product-sku,
      .product-model {
        font-size: 24rpx;
        color: $jel-font-dec2;
        margin-top: 8rpx;
      }

      .price-row {
        display: flex;
        align-items: center;
        margin-top: 12rpx;

        .free-tag {
          padding: 6rpx 20rpx;
          font-size: 26rpx;
          font-weight: 600;
          color: #fff;
          background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
          border-radius: 8rpx;
          margin-right: 12rpx;
        }

        .original-price {
          font-size: 28rpx;
          color: $jel-font-dec;
          text-decoration: line-through;
        }
      }
    }
  }
}

// 订单信息卡片
.order-card {
  .order-info {
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16rpx 0;

      &:not(:last-child) {
        border-bottom: 1rpx dashed $jel-border;
      }

      .label {
        font-size: 28rpx;
        color: $jel-font-dec2;
        flex-shrink: 0;
      }

      .value {
        font-size: 28rpx;
        color: $jel-font-title;
        text-align: right;
      }
    }
  }
}

// 底部操作栏
.footer-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: 20rpx 32rpx calc(20rpx + env(safe-area-inset-bottom));
  background-color: #fff;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
  gap: 24rpx;

  .btn-cancel {
    padding: 24rpx 40rpx;
    border: 2rpx solid $jel-font-dec;
    border-radius: 44rpx;

    text {
      font-size: 28rpx;
      color: $jel-font-dec2;
    }

    &:active {
      opacity: 0.7;
    }
  }

  .btn-complete {
    flex: 1;
    height: 88rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, $jel-brandColor 0%, #e84545 100%);
    border-radius: 44rpx;

    .iconfont {
      font-size: 32rpx;
      color: #fff;
      margin-right: 8rpx;
    }

    text {
      font-size: 30rpx;
      font-weight: 600;
      color: #fff;
    }

    &:active {
      opacity: 0.85;
    }
  }

  .btn-back-full {
    flex: 1;
    height: 88rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: $jel-pageBackGroundColor;
    border-radius: 44rpx;

    text {
      font-size: 30rpx;
      color: $jel-font-dec2;
    }

    &:active {
      opacity: 0.7;
    }
  }
}

// 蓝牙列表面板
.bluetooth-panel {
  position: fixed;
  inset: 0;
  z-index: 99;
  display: flex;
  align-items: flex-end;

  .bluetooth-mask {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.35);
  }

  .bluetooth-content {
    position: relative;
    width: 100%;
    max-height: 70vh;
    background: #fff;
    border-radius: 28rpx 28rpx 0 0;
    box-shadow: 0 -8rpx 24rpx rgba(0, 0, 0, 0.08);
    padding: 28rpx 24rpx calc(24rpx + env(safe-area-inset-bottom));
    display: flex;
    flex-direction: column;
  }

  .bluetooth-header {
    position: relative;
    display: flex;
    align-items: center;
    padding-bottom: 20rpx;
    border-bottom: 1rpx solid $jel-border;

    .bluetooth-title-wrap {
      display: flex;
      align-items: center;
      flex: 1;
    }

    .iconfont {
      font-size: 34rpx;
      color: $jel-brandColor;
      margin-right: 10rpx;
    }

    .bluetooth-title {
      font-size: 32rpx;
      font-weight: 600;
      color: $jel-font-title;
    }

    .header-close {
      margin-left: auto;
      padding: 8rpx 16rpx;
      border-radius: 20rpx;
      background: $jel-pageBackGroundColor;

      text {
        font-size: 24rpx;
        color: $jel-font-dec2;
      }
    }
  }

  .bluetooth-tip {
    padding: 18rpx 20rpx;
    border-radius: 12rpx;
    background: rgba(214, 39, 49, 0.08);
    margin: 20rpx 0;

    text {
      font-size: 24rpx;
      color: $jel-font-dec2;
    }
  }

  .bluetooth-list {
    flex: 1;
    min-height: 240rpx;
    max-height: 620rpx;
  }

  .bluetooth-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 22rpx 0;
    border-bottom: 1rpx dashed $jel-border;

    .item-left {
      flex: 1;
      min-width: 0;
      margin-right: 20rpx;
    }

    .device-name {
      display: block;
      font-size: 30rpx;
      color: $jel-font-title;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .device-id {
      display: block;
      margin-top: 8rpx;
      font-size: 24rpx;
      color: $jel-font-dec2;
    }

    .item-right {
      min-width: 120rpx;
      height: 60rpx;
      border-radius: 30rpx;
      background: linear-gradient(135deg, $jel-brandColor 0%, #e84545 100%);
      display: flex;
      align-items: center;
      justify-content: center;

      text {
        font-size: 24rpx;
        color: #fff;
        font-weight: 500;
      }

      &.disabled {
        background: #f2f2f2;

        text {
          color: $jel-font-dec;
        }
      }

      &.connected {
        background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);

        text {
          color: #fff;
        }
      }
    }
  }

  .bluetooth-empty {
    padding: 40rpx 0;
    display: flex;
    align-items: center;
    justify-content: center;

    text {
      font-size: 26rpx;
      color: $jel-font-dec2;
    }
  }

  .bluetooth-footer {
    padding-top: 24rpx;
  }

  .btn-close {
    height: 84rpx;
    border-radius: 42rpx;
    background-color: $jel-pageBackGroundColor;
    display: flex;
    align-items: center;
    justify-content: center;

    text {
      font-size: 30rpx;
      color: $jel-font-dec2;
    }

    &:active {
      opacity: 0.7;
    }
  }

  .btn-close.btn-start-film {
    background: linear-gradient(135deg, $jel-brandColor 0%, #e84545 100%);

    text {
      color: #fff;
      font-weight: 600;
    }
  }

  .btn-close.btn-finished {
    background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);

    text {
      color: #fff;
      font-weight: 600;
    }
  }
}
</style>
