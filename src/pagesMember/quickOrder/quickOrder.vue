<script setup lang="ts">
import { ref } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { updateOfflineOrderApi, offlineOrderGetApi } from '@/api/order.ts'
import { formatTimestamp } from '@/utils/formatTimestamp.ts'
import type { freeOrderStatus, QuickOrderResult } from '@/types/Order'
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

// 二维码 base64 图片
const qrCodeUrl = ref('')

// 付款成功状态（用于控制显示）
const isPaid = ref(false)
const showBluetoothList = ref(false)
const bluetoothDevices = ref<
  Array<{
    deviceId: string
    name?: string
    localName?: string
    RSSI?: number
  }>
>([])
const connectingDeviceId = ref('')
const connectedDeviceId = ref('')
const currentServiceId = ref('')
const currentWriteCharId = ref('')
const notifyServiceId = ref('')
const notifyCharacteristicId = ref('')
const isFilmStarted = ref(false)
const filmFinished = ref(false)
const isDiscoveryListening = ref(false)
// 协议固定特征：服务 AB01、写 AB02、通知 AB03
const PROTOCOL_SERVICE_SUFFIX = 'AB01'
const PROTOCOL_WRITE_SUFFIX = 'AB02'

// 取消订单
const handleCancelOrder = () => {
  uni.showModal({
    title: '提示',
    content: '确定要取消该订单吗？',
    confirmColor: '#d62731',
    success: async (res) => {
      // 用户确认后才执行取消
      if (res.confirm && orderInfo.value?.outTradeNo) {
        // 调用取消订单接口
        console.log('取消订单:', orderInfo.value?.outTradeNo)
        const res = await updateOfflineOrderApi(orderInfo.value?.outTradeNo, 'CANCELLED')
        console.log('取消', res)

        if (res.code === 200) {
          await uni.showToast({
            title: '订单已取消',
            icon: 'success',
          })
          setTimeout(() => {
            // 给成功提示留出可见时间
            uni.navigateBack()
          }, 1500)
        }
      }
    },
  })
}

// 根据传过来的订单号获取线下贴膜订单
const offlineOrderGet = async (outTradeNo: string) => {
  const res = await offlineOrderGetApi(outTradeNo)
  orderInfo.value = res.data
  console.log('订单', res)
}

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

// 蓝牙流程-1：开始连接（打开弹层 -> 初始化蓝牙 -> 开始扫描 -> 持续接收设备列表）
const handleConnectDevice = () => {
  console.log(isPaid.value, orderInfo.value?.status)

  if (!isPaid.value || orderInfo.value?.status !== 'PAID') {
    uni.showToast({
      title: '请先完成支付后再连接设备',
      icon: 'none',
    })
    return
  }
  showBluetoothList.value = true
  bluetoothDevices.value = []
  openBluetoothAdapter()
    .then(() => startBluetoothDiscovery())
    .then(() => {
      // 避免重复注册扫描监听
      if (isDiscoveryListening.value) {
        offBluetoothDeviceFound()
      }
      onBluetoothDeviceFound((devices) => {
        // 扫描结果按 deviceId 去重并增量更新
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
        })
      })
      isDiscoveryListening.value = true
    })
    .catch((err) => {
      console.log('蓝牙初始化或扫描失败', err)
      uni.showToast({ title: '蓝牙不可用', icon: 'none' })
    })
}

// 轮询订单，同步成功状态
let timer: any

const handleCompletedOrder = () => {
  uni.showModal({
    title: '提示',
    content: '确定服务已完成吗？',
    confirmColor: '#d62731',
    success: async (res) => {
      // 仅确认后执行完成订单
      if (res.confirm && orderInfo.value?.outTradeNo) {
        const result = await updateOfflineOrderApi(orderInfo.value.outTradeNo, 'COMPLETED')
        if (result.code === 200) {
          await uni.showToast({
            title: '订单已完成',
            icon: 'success',
          })
          closeBluetoothList()
          setTimeout(() => {
            // 完成后回到门店管理
            uni.redirectTo({
              url: '/pagesMember/StoreManager/StoreManager',
            })
          }, 1200)
        }
      }
    },
  })
}

// 蓝牙流程-2：通用写指令入口（校验连接态 -> 写入 hex 指令 -> 回调业务状态）
const sendFilmCommand = (commandHex: string, onSuccess: () => void) => {
  if (!connectedDeviceId.value || !currentServiceId.value || !currentWriteCharId.value) {
    uni.showToast({ title: '蓝牙未就绪', icon: 'none' })
    return
  }
  writeBleHexCommand(
    connectedDeviceId.value,
    currentServiceId.value,
    currentWriteCharId.value,
    commandHex,
  )
    .then(() => {
      // 写入成功后交给调用方更新业务状态
      onSuccess()
    })
    .catch((err) => {
      console.log('贴膜指令发送失败', commandHex, err)
      uni.showToast({ title: '发送失败', icon: 'none' })
    })
}

// 蓝牙流程-6：发送开始贴膜指令（FFA1110055）
const handleStartFilm = async () => {
  if (connectedDeviceId.value && notifyServiceId.value && notifyCharacteristicId.value) {
    enableBleNotification(
      connectedDeviceId.value,
      notifyServiceId.value,
      notifyCharacteristicId.value,
    ).catch((err) => console.log('开始贴膜前启用通知失败', err))
  }
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
    handleCompletedOrder()
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
  findWritableCharacteristic(deviceId)
    .then(({ serviceId, characteristicId }) => {
      const serviceUpper = serviceId.toUpperCase()
      const charUpper = characteristicId.toUpperCase()
      if (
        !serviceUpper.includes(`0000${PROTOCOL_SERVICE_SUFFIX}`) ||
        !charUpper.includes(`0000${PROTOCOL_WRITE_SUFFIX}`)
      ) {
        uni.showToast({ title: '未匹配协议写特征AB02', icon: 'none' })
        return
      }
      currentServiceId.value = serviceId
      currentWriteCharId.value = characteristicId
      // 通知固定走 AB03（与 AB01 同服务）
      notifyServiceId.value = serviceId
      notifyCharacteristicId.value = characteristicId.replace(/0000AB02/i, '0000AB03')
      enableBleNotification(deviceId, notifyServiceId.value, notifyCharacteristicId.value)
        .then(() => {
          // 先移除旧监听，避免重复触发
          offBleCharacteristicValueChange()
          onBleCharacteristicValueChange((res) => {
            // 收到设备回包后转 hex 并匹配协议结束码
            const hex = arrayBufferToHex(res.value).toUpperCase()
            if (hex === 'FFB1110055') {
              isFilmStarted.value = false
              filmFinished.value = true
            }
          })
        })
        .catch((err) => console.log('通知开启失败', err))
      stopBluetoothDiscovery().then(() => console.log('连接后停止扫描成功'))
      isFilmStarted.value = false
      uni.showToast({ title: '连接成功', icon: 'success' })
    })
    .catch((err) => {
      console.log('获取蓝牙服务或特征失败', err)
      uni.showToast({ title: '未找到可写特征', icon: 'none' })
    })
}

// 蓝牙流程-3：点击设备连接蓝牙（建立连接成功后进入可写特征发现）
const handleDeviceConnect = (deviceId: string) => {
  if (!deviceId || connectingDeviceId.value === deviceId || connectedDeviceId.value === deviceId)
    return
  connectingDeviceId.value = deviceId
  createBleConnection(deviceId)
    .then(() => {
      // 连接成功后继续发现可写特征
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
const handleDeviceDisconnect = (deviceId: string) => {
  if (!deviceId || connectingDeviceId.value === deviceId) return
  connectingDeviceId.value = deviceId
  closeBleConnection(deviceId)
    .then(() => {
      // 仅清理当前已连接设备对应状态
      if (connectedDeviceId.value === deviceId) {
        if (notifyServiceId.value && notifyCharacteristicId.value) {
          disableBleNotification(
            deviceId,
            notifyServiceId.value,
            notifyCharacteristicId.value,
          ).catch((err) => console.log('断开时关闭通知失败', err))
        }
        offBleCharacteristicValueChange()
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

// 蓝牙流程-8：关闭蓝牙弹层（断开连接 -> 停止扫描 -> 取消监听 -> 关闭适配器 -> 清理状态）
const closeBluetoothList = () => {
  const currentDeviceId = connectedDeviceId.value
  if (currentDeviceId) {
    closeBleConnection(currentDeviceId).catch((err) => console.log('关闭弹层时断开蓝牙失败', err))
  }
  if (currentDeviceId && notifyServiceId.value && notifyCharacteristicId.value) {
    disableBleNotification(
      currentDeviceId,
      notifyServiceId.value,
      notifyCharacteristicId.value,
    ).catch((err) => console.log('关闭弹层时关闭通知失败', err))
  }
  resetBluetoothState()
  offBleCharacteristicValueChange()
  stopBluetoothDiscovery().then(() => console.log('停止蓝牙扫描成功'))
  offBluetoothDeviceFound()
  isDiscoveryListening.value = false
  closeBluetoothAdapter().then(() => console.log('关闭蓝牙模块成功'))
  showBluetoothList.value = false
}

onLoad((query?: AnyObject) => {
  if (!query) return
  console.log('页面接收到参数', query)

  if (query.code_url && query.out_trade_no) {
    qrCodeUrl.value = query.code_url // 后端返回的 base64 图片
    offlineOrderGet(query.out_trade_no)

    // 设置轮询
    timer = setInterval(async () => {
      // 轮询同步最新支付状态
      const res = await offlineOrderGetApi(query.out_trade_no)
      console.log('轮询结果', res.data.status)
      if (res.data.status === 'PAID' || res.data.status === 'CANCELLED') {
        clearInterval(timer!)
        timer = null
        // 显示支付成功
        res.data.status === 'PAID' ? (isPaid.value = true) : (isPaid.value = false)
        orderInfo.value!.status = res.data.status
        console.log('已支付/已取消，结束轮询')
      }
    }, 5000)
  }
})

// 退出页面卸载轮询
onUnload(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
    console.log('页面关闭，轮询清理完成')
  }
  closeBluetoothList()
})
</script>

<template>
  <scroll-view class="quick-order" :scroll-y="true">
    <!-- 订单状态头部 -->
    <view class="order-header">
      <view class="status-info">
        <text class="status-text" v-if="!isPaid">等待客户付款</text>
        <text class="status-text status-success" v-else>付款成功</text>
        <text class="order-no">订单号：{{ orderInfo?.outTradeNo }}</text>
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
          <text class="product-name">{{ orderInfo.skuNo }}{{ orderInfo?.productName }}</text>
          <text class="product-sku">{{ orderInfo?.remark }}</text>
          <!-- <text class="product-model">适配：{{ orderInfo.models?.[0] }}</text> -->
          <view class="price-row">
            <text class="current-price"
              >¥{{ Number(orderInfo?.actualPayment ?? 0).toFixed(2) }}</text
            >
          </view>
        </view>
      </view>
    </view>

    <!-- 二维码付款区域 -->
    <view class="qrcode-card">
      <view class="card-title">
        <text class="iconfont icon-saoma"></text>
        <text>扫码付款</text>
      </view>

      <!-- 等待付款状态 -->
      <view class="qrcode-content" v-if="!isPaid">
        <view class="qrcode-box">
          <!-- 二维码图片 -->
          <image v-if="qrCodeUrl" class="qrcode-image" :src="qrCodeUrl" mode="aspectFit" />
          <!-- 无二维码时的占位 -->
          <view v-else class="qrcode-placeholder">
            <text class="iconfont icon-erweima"></text>
            <text class="qrcode-tip">加载中...</text>
          </view>
        </view>
        <view class="amount-info">
          <text class="amount-label">应付金额</text>
          <view class="amount-row">
            <text class="amount-value"
              >¥{{ Number(orderInfo?.actualPayment ?? 0).toFixed(2) }}</text
            >
          </view>
        </view>
        <text class="scan-tip">请客户使用微信扫码支付</text>
      </view>

      <!-- 付款成功状态 -->
      <view class="paid-content" v-else>
        <image class="paid-icon" src="/static/images/paidSuccess.png" mode="aspectFit" />
        <text class="paid-title">付款成功</text>
        <text class="paid-amount">¥{{ Number(orderInfo?.actualPayment ?? 0).toFixed(2) }}</text>
        <text class="paid-tip">客户已完成支付</text>
      </view>
    </view>
  </scroll-view>
  <!-- 底部操作栏 -->
  <view class="footer-bar">
    <view class="btn-connect" @click="handleConnectDevice">
      <text class="iconfont icon-queren"></text>
      <text>连接设备</text>
    </view>
    <view class="btn-cancel" @click="handleCancelOrder">
      <text>取消订单</text>
    </view>
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
                ? handleDeviceDisconnect(item.deviceId)
                : handleDeviceConnect(item.deviceId)
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
          @click="filmFinished ? handleCompletedOrder() : !isFilmStarted ? handleStartFilm() : null"
        >
          <text>{{ filmFinished ? '确认完成' : isFilmStarted ? '贴膜中' : '开始贴膜' }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.quick-order {
  height: 100vh;
  background-color: $jel-pageBackGroundColor;
}

// 订单状态头部
.order-header {
  padding: 40rpx 32rpx;
  background: linear-gradient(135deg, $jel-brandColor 0%, #e84545 100%);

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
      font-size: 28rpx;
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

// 商品信息卡片
.product-card {
  margin: 24rpx;
  padding: 28rpx;
  background-color: #fff;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);

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
        font-size: 28rpx;
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
        align-items: baseline;
        margin-top: 12rpx;

        .current-price {
          font-size: 36rpx;
          font-weight: 700;
          color: $jel-brandColor;
        }
      }
    }
  }
}

// 二维码卡片
.qrcode-card {
  margin: 24rpx;
  padding: 28rpx;
  background-color: #fff;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);

  .qrcode-content {
    display: flex;
    flex-direction: column;
    align-items: center;

    .qrcode-box {
      width: 360rpx;
      height: 360rpx;
      border: 2rpx solid $jel-border;
      border-radius: 16rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24rpx;
      overflow: hidden;
      background-color: #fff;

      .qrcode-image {
        width: 320rpx;
        height: 320rpx;
      }

      .qrcode-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;

        .iconfont {
          font-size: 160rpx;
          color: $jel-font-dec;
        }

        .qrcode-tip {
          font-size: 24rpx;
          color: $jel-font-dec;
          margin-top: 16rpx;
        }
      }
    }

    .amount-info {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 20rpx;

      .amount-label {
        font-size: 26rpx;
        color: $jel-font-dec2;
        margin-bottom: 8rpx;
      }

      .amount-row {
        display: flex;
        align-items: center;

        .amount-value {
          font-size: 56rpx;
          font-weight: 700;
          color: $jel-brandColor;
        }

        .btn-modify {
          display: flex;
          align-items: center;
          margin-left: 20rpx;
          padding: 8rpx 20rpx;
          background-color: rgba($jel-brandColor, 0.1);
          border-radius: 24rpx;

          .iconfont {
            font-size: 24rpx;
            color: $jel-brandColor;
            margin-right: 6rpx;
          }

          text {
            font-size: 24rpx;
            color: $jel-brandColor;
          }

          &:active {
            opacity: 0.7;
          }
        }
      }
    }

    .scan-tip {
      font-size: 24rpx;
      color: $jel-font-dec;
    }
  }

  // 付款成功状态
  .paid-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40rpx 0;

    .paid-icon {
      width: 160rpx;
      height: 160rpx;
      margin-bottom: 24rpx;
    }

    .paid-title {
      font-size: 36rpx;
      font-weight: 600;
      color: $jel-font-success;
      margin-bottom: 16rpx;
    }

    .paid-amount {
      font-size: 48rpx;
      font-weight: 700;
      color: $jel-font-title;
      margin-bottom: 12rpx;
    }

    .paid-tip {
      font-size: 26rpx;
      color: $jel-font-dec;
    }
  }
}

// 底部操作栏
.footer-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24rpx;
  padding: 20rpx 32rpx calc(20rpx + env(safe-area-inset-bottom));
  background-color: #fff;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);

  .btn-connect {
    flex: 1;
    height: 88rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 44rpx;
    background: linear-gradient(135deg, $jel-brandColor 0%, #e84545 100%);

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
  }

  .btn-cancel {
    text-align: center;
    padding: 24rpx 40rpx;
    border: 2rpx solid $jel-font-dec;
    border-radius: 44rpx;

    text {
      font-size: 28rpx;
      color: $jel-font-dec2;
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
