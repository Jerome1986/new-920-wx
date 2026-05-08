export type BluetoothDeviceItem = {
  deviceId: string
  name?: string
  localName?: string
  RSSI?: number
}

type WritableCharacteristic = {
  serviceId: string
  characteristicId: string
}

// 十六进制字符串转 ArrayBuffer（BLE 写入要求）
const hexToArrayBuffer = (hex: string) => {
  const cleanHex = hex.replace(/\s+/g, '').toUpperCase()
  const typedArray = new Uint8Array(cleanHex.length / 2)
  for (let i = 0; i < cleanHex.length; i += 2) {
    typedArray[i / 2] = parseInt(cleanHex.slice(i, i + 2), 16)
  }
  return typedArray.buffer
}

// 初始化蓝牙适配器
export const openBluetoothAdapter = () =>
  new Promise<void>((resolve, reject) => {
    wx.openBluetoothAdapter({
      success: () => resolve(),
      fail: (err) => reject(err),
    })
  })

// 开始扫描附近蓝牙设备
export const startBluetoothDiscovery = () =>
  new Promise<void>((resolve, reject) => {
    wx.startBluetoothDevicesDiscovery({
      services: [],
      success: () => resolve(),
      fail: (err) => reject(err),
    })
  })

// 停止扫描蓝牙设备
export const stopBluetoothDiscovery = () =>
  new Promise<void>((resolve) => {
    wx.stopBluetoothDevicesDiscovery({
      complete: () => resolve(),
    })
  })

// 监听扫描到的设备列表
export const onBluetoothDeviceFound = (callback: (devices: BluetoothDeviceItem[]) => void) => {
  // 透传微信回调结果，统一为设备数组给业务层消费
  wx.onBluetoothDeviceFound((res) => {
    callback((res.devices || []) as BluetoothDeviceItem[])
  })
}

// 取消设备发现监听
export const offBluetoothDeviceFound = () => {
  wx.offBluetoothDeviceFound()
}

// 关闭蓝牙适配器
export const closeBluetoothAdapter = () =>
  new Promise<void>((resolve) => {
    wx.closeBluetoothAdapter({
      complete: () => resolve(),
    })
  })

// 与指定设备建立 BLE 连接
export const createBleConnection = (deviceId: string) =>
  new Promise<void>((resolve, reject) => {
    wx.createBLEConnection({
      deviceId,
      timeout: 10000,
      success: () => resolve(),
      fail: (err) => reject(err),
    })
  })

// 断开与指定设备的 BLE 连接
export const closeBleConnection = (deviceId: string) =>
  new Promise<void>((resolve, reject) => {
    wx.closeBLEConnection({
      deviceId,
      success: () => resolve(),
      fail: (err) => reject(err),
    })
  })

// 发现设备中的可写特征（写入指令前必需）
export const findWritableCharacteristic = (deviceId: string) =>
  new Promise<WritableCharacteristic>((resolve, reject) => {
    // 先取设备服务列表，再逐个服务查找可写特征
    wx.getBLEDeviceServices({
      deviceId,
      success: (serviceRes) => {
        const services = serviceRes.services || []
        const loopServices = (index: number) => {
          // 递归终止：所有服务都检查过仍未命中可写特征
          if (index >= services.length) {
            reject(new Error('未找到可写特征'))
            return
          }
          const serviceId = services[index].uuid
          wx.getBLEDeviceCharacteristics({
            deviceId,
            serviceId,
            success: (charRes) => {
              const chars = charRes.characteristics || []
              // 当前服务下优先匹配 write / writeNoResponse 特征
              const writable = chars.find(
                (char) => char.properties?.write || char.properties?.writeNoResponse,
              )
              if (writable) {
                // 命中后返回 serviceId + characteristicId，供后续写指令使用
                resolve({
                  serviceId,
                  characteristicId: writable.uuid,
                })
                return
              }
              // 当前服务未命中，继续检查下一个服务
              loopServices(index + 1)
            },
            // 某个服务读取失败时不中断，继续尝试下一个服务
            fail: () => loopServices(index + 1),
          })
        }
        loopServices(0)
      },
      fail: (err) => reject(err),
    })
  })

// 向指定特征写入十六进制指令
export const writeBleHexCommand = (
  deviceId: string,
  serviceId: string,
  characteristicId: string,
  hexCommand: string,
) =>
  new Promise<void>((resolve, reject) => {
    // 业务指令（hex）转换为 BLE 可写入的 ArrayBuffer
    const value = hexToArrayBuffer(hexCommand)
    // 向目标设备指定可写特征下发指令
    wx.writeBLECharacteristicValue({
      deviceId,
      serviceId,
      characteristicId,
      value,
      success: () => resolve(),
      fail: (err) => reject(err),
    })
  })

// 开启指定特征的通知（notify/indicate）
export const enableBleNotification = (
  deviceId: string,
  serviceId: string,
  characteristicId: string,
) =>
  new Promise<void>((resolve, reject) => {
    wx.notifyBLECharacteristicValueChange({
      state: true,
      deviceId,
      serviceId,
      characteristicId,
      success: () => resolve(),
      fail: (err) => reject(err),
    })
  })

// 关闭指定特征的通知
export const disableBleNotification = (
  deviceId: string,
  serviceId: string,
  characteristicId: string,
) =>
  new Promise<void>((resolve, reject) => {
    wx.notifyBLECharacteristicValueChange({
      state: false,
      deviceId,
      serviceId,
      characteristicId,
      success: () => resolve(),
      fail: (err) => reject(err),
    })
  })

// 监听设备通知回包（特征值变化）
export const onBleCharacteristicValueChange = (
  callback: (res: WechatMiniprogram.OnBLECharacteristicValueChangeListenerResult) => void,
) => {
  wx.onBLECharacteristicValueChange(callback)
}

// 取消设备通知回包监听（微信类型定义为无参）
export const offBleCharacteristicValueChange = () => {
  wx.offBLECharacteristicValueChange()
}

// ArrayBuffer 转十六进制字符串（解析设备通知回包常用）
export const arrayBufferToHex = (buffer: ArrayBuffer) => {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
