<script setup lang="ts">
import { useMemberStore } from '@/stores'
import { maskMiddle } from '@/utils/maskMiddle.ts'
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { formatRole } from '@/utils/formatTimestamp.ts'
import { vipProductGetApi } from '@/api/product.ts'
import type { vipProItem } from '@/types/ProductItem'
import { vipOrderCancelledApi, vipPayApi } from '@/api/order.ts'
import { userInfoGetApi } from '@/api/user.ts'

// 获取系统参数计算安全距离
const { safeAreaInsets } = uni.getSystemInfoSync()
// 定义 store
const userStore = useMemberStore()

// 开通记录
const activationRecord = () => {
  console.log('跳转开通记录查看会员订单')
  uni.navigateTo({
    url: '/pagesMember/myVip/vipOrder',
  })
}

// 默认下标
const activeIndex = ref(0)

// vip列表
const vipList = ref<vipProItem[]>([])
// 当前所选择的产品
const currentVip = ref<vipProItem>()

// 获取vip列表
const vipListGet = async () => {
  const res = await vipProductGetApi()
  vipList.value = res.data
  currentVip.value = vipList.value[activeIndex.value]
}
onLoad(() => vipListGet())

// 当前支付的价格--暂时为所选择的价格，后期可根据积分、优惠券抵扣计算
const currentPrice = (price?: number) => {
  return price || vipList.value[activeIndex.value]?.price
}

// 处理选择
const handleSelected = (item: vipProItem, index: number) => {
  currentPrice(item.price)
  activeIndex.value = index
  currentVip.value = item
}

// 点击立即购买
const buyNow = async () => {
  console.log('buyNow', currentVip.value)
  if (currentVip.value?.status === 'disable') {
    await uni.showToast({
      icon: 'none',
      title: '暂未开放',
    })
    return
  }
  // 1.向后端发起支付请求
  if (currentVip.value?._id) {
    const payRes = await vipPayApi(
      userStore.profile._id,
      userStore.profile.mobile,
      currentVip.value._id,
      currentVip.value.level,
      currentVip.value.levelText,
      currentVip.value.discount,
      currentVip.value.limit,
      currentVip.value.maxUsers,
      currentVip.value.term,
      currentPrice(),
      '办理会员',
    )
    console.log('开始支付', payRes)
    // 2.通过后端返回参数、发起前端微信支付
    wx.requestPayment({
      timeStamp: payRes.data.timeStamp,
      nonceStr: payRes.data.nonceStr,
      package: payRes.data.packageValue,
      signType: payRes.data.signType,
      paySign: payRes.data.paySign,
      async success(res) {
        // 3.支付成功后-重新获取更新的数据（实际的更新动作由后端完成）
        const userRes = await userInfoGetApi(userStore.profile._id)
        console.log('支付成功', res)

        userStore.setProfile(userRes.data)
        // 支付成功提示+跳转
        setTimeout(() => {
          uni.showToast({ icon: 'success', title: '支付成功' })
          uni.switchTab({ url: '/pages/my/my' })
        }, 800)
      },
      async fail(err) {
        // 直接更新订单为已取消
        console.error('支付失败', err)
        const res = await vipOrderCancelledApi(payRes.data.out_trade_no)
        console.log('取消支付结果', res)
        await uni.showToast({
          icon: 'none',
          title: '取消支付',
        })
      },
    })
  }
}
</script>

<template>
  <view class="myVip">
    <!-- 头部 -->
    <view class="head">
      <view class="title">开通会员，畅享VIP服务特权</view>
      <view class="btn" @click="activationRecord">开通记录</view>
    </view>
    <!-- 用户信息 -->
    <view class="userInfo">
      <view class="avatar">
        <image :src="userStore.profile.avatarUrl" mode="aspectFit"></image>
      </view>
      <view class="mobile">{{ maskMiddle(userStore.profile.mobile) }}</view>
      <!-- 当前用户的身份 -->
      <view class="role"
        >({{ formatRole(userStore.profile.role, userStore.profile.vipLevel) }})
      </view>
    </view>
    <!-- 会员权益 -->
    <scroll-view class="vip" :scroll-x="true" :enhanced="true" :show-scrollbar="false">
      <view
        class="item"
        :class="{ itemActive: activeIndex === index }"
        v-for="(item, index) in vipList"
        :key="item._id"
        @click="handleSelected(item, index)"
      >
        <view class="head">{{ item.levelText }}</view>
        <view class="content">
          <view class="discount"
            >可用人员 <text style="color: #d62731">{{ item.maxUsers }}</text> 人</view
          >
          <view class="price">
            <text style="font-size: 28rpx">￥</text>
            <text>{{ (item.price / 100).toFixed(2) }}/年</text>
          </view>
        </view>
        <view class="foot">{{ item.rights }}</view>
      </view>
    </scroll-view>
    <!-- 微信支付 -->
    <view class="pay">
      <view class="left">
        <text class="iconfont icon-weixinzhifu" style="font-size: 28rpx; color: #27b20b"></text>
        <view class="text" style="font-size: 28rpx; color: #333333">微信支付</view>
      </view>
      <radio color="#d52731" style="transform: scale(0.7)" value="微信支付" :checked="true" />
    </view>
    <!-- 底部购买按钮 -->
    <view class="toolbar" :style="{ paddingBottom: safeAreaInsets?.bottom + 'px' }">
      <view class="buyPrice">
        <text style="color: #333333">支付金额：</text>
        <text>￥</text>
        <text style="font-size: 32rpx">{{ (currentPrice() / 100).toFixed(2) }}</text>
      </view>
      <view class="buyBtn" @click="buyNow">立即购买</view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.myVip {
  padding: 24rpx;

  .head {
    margin-bottom: 12rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .title {
      font-size: 36rpx;
      color: $jel-brandColor;
      font-family: 'YouSheBiaoTiHei', 'Microsoft YaHei', sans-serif;
    }

    /*开通记录*/
    .btn {
      background-color: $jel-brandColor;
      padding: 8rpx 16rpx;
      border-radius: 80rpx;
      color: #ffffff;
      font-size: 24rpx;
    }
  }

  /*用户信息*/
  .userInfo {
    margin-bottom: 24rpx;
    display: flex;
    align-items: center;
    gap: 10rpx;
    color: $jel-font-title;

    .avatar {
      image {
        width: 60rpx;
        height: 60rpx;
        border-radius: 50%;
        overflow: hidden;
      }
    }

    .role {
      font-size: 24rpx;
      color: $jel-font-dec;
    }
  }

  /*vip*/
  .vip {
    white-space: nowrap; /* 关键：让子元素不换行 */

    .item {
      margin-right: 40rpx;
      display: inline-block; /* 关键：横向排列 */
      position: relative;
      width: 300rpx;
      height: 240rpx;
      border-radius: 16rpx;
      background-color: #ffffff;

      &:nth-last-child(1) {
        margin-right: 0;
      }

      /*头部*/
      .head {
        padding: 2rpx 16rpx;
        position: absolute;
        left: 0;
        top: 0;
        background-color: #e8e8e8;
        color: $jel-font-title;
        font-size: 24rpx;
        border-radius: 16rpx 0 16rpx 0;
      }

      /*中间价格内容*/
      .content {
        display: flex;
        flex-direction: column;
        align-items: center;
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);

        .discount {
          margin-bottom: 8rpx;
          color: $jel-font-dec;
        }

        .price {
          display: flex;
          align-items: center;
          font-size: 40rpx;
          color: $jel-brandColor;
        }
      }

      /*底部*/
      .foot {
        text-align: center;
        padding: 4rpx 0;
        width: 100%;
        position: absolute;
        left: 0;
        bottom: 0;
        background-color: #fcf3c9;
        color: $jel-font-title;
        font-size: 24rpx;
        border-radius: 0 0 16rpx 16rpx;
      }
    }

    /*激活样式*/
    .itemActive {
      border: 1px solid $jel-brandColor;
      background: linear-gradient(134.1deg, rgba(252, 246, 196, 1) 0%, rgba(255, 231, 232, 1) 100%);

      .head {
        color: #ffffff;
        background-color: $jel-brandColor;
      }

      .content {
        .discount {
          color: $jel-font-title;
        }
      }

      .foot {
        color: #ffffff;
        background-color: $jel-brandColor;
      }
    }
  }

  /*微信支付*/
  .pay {
    padding: 24rpx;
    margin-top: 24rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #ffffff;
    border-radius: 8rpx;
    color: $jel-font-title;

    .left {
      display: flex;
      align-items: center;
      gap: 16rpx;
    }
  }

  /*底部按钮*/
  .toolbar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1;
    background-color: #fff;
    height: 100rpx;
    padding: 0 20rpx var(--window-bottom);
    border-top: 1rpx solid #eaeaea;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-sizing: content-box;

    .buyPrice {
      color: $jel-brandColor;
      font-size: 28rpx;
    }

    .buyBtn {
      text-align: center;
      padding: 18rpx 0;
      width: 284rpx;
      background-color: $jel-brandColor;
      color: #fff;
      border-radius: 40rpx;
      font-size: 28rpx;
    }
  }
}
</style>
