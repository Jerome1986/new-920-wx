<script setup lang="ts">
// 会员权益数据
import { formatTimestamp } from '@/utils/formatTimestamp.ts'
import { useMemberStore } from '@/stores'
import type { VipRenderInfo } from '@/types/VipItem'

defineProps<{
  nextVipInfo?: VipRenderInfo
}>()

// 定义store
const userStore = useMemberStore()
</script>

<template>
  <view class="vip-card">
    <image
      class="backGroud"
      src="https://objectstorageapi.gzg.sealos.run/dxepxlzz-sealaf-h91gpva7y7-cloud-bin/test-product/backgroudVip.png"
      mode="widthFix"
    ></image>
    <view class="vipContent">
      <view class="top">
        <view class="icon">
          <image class="vipIcon" src="/static/images/vipIcon.png"></image>
          <view class="vipText">会员权益</view>
        </view>
        <!--  到期时间   -->
        <view class="expirationTime"
          >到期：{{ formatTimestamp(userStore.profile.vipEndTime) }}
        </view>
      </view>
      <!--  会员权益  -->
      <view class="interests">
        <!--  权益内容  -->
        <view class="vipValue">
          <!--  折扣  -->
          <view class="item">
            <text class="iconfont icon-zhekou" style="margin-right: 10rpx; font-size: 28rpx"></text>
            <text>享受人数 {{ userStore.profile.vipMaxUsers }} 人</text>
          </view>
          <!--  赠送次数  -->
          <view class="item">
            <text
              class="iconfont icon-zengsong"
              style="margin-right: 10rpx; font-size: 28rpx"
            ></text>
            <text>每月免费贴膜{{ userStore.profile.vipGift }}次</text>
          </view>
        </view>
        <!--  提升等级按钮  -->
        <view class="level">提升等级</view>
      </view>
      <!--  下一级权益提示  -->
      <view class="nextVipTips">
        <image class="icon" src="/static/images/laba.png" mode="aspectFill"></image>
        <view class="tips" v-if="userStore.profile.vipLevel < 2"
          >下级权益 → 家庭版可3人共享会员权益
        </view>
        <view class="tips" v-else> 你已经是我们最高等级的会员啦！感谢您的支持！</view>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.vip-card {
  position: relative;
  height: 216rpx;

  .backGroud {
    position: absolute;
    left: 0;
    top: 0;
  }

  .vipContent {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 24rpx 36rpx;
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0;
    top: 0;
    color: #fff;

    .top {
      display: flex;
      justify-content: space-between;
      align-items: center;

      /*会员图标区域*/
      .icon {
        display: flex;
        align-items: center;
        gap: 8rpx;

        .vipIcon {
          width: 40rpx;
          height: 40rpx;
        }

        .vipText {
          font-size: 28rpx;
          color: #eab49a;
        }
      }

      /*到期时间*/
      .expirationTime {
        font-size: 24rpx;
        color: #eab49a;
      }
    }

    /*权益内容*/
    .interests {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .vipValue {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 32rpx;
        color: #ffffff;
        font-size: 24rpx;

        .item {
          display: flex;
          align-items: center;
        }
      }

      /*提升等级按钮*/
      .level {
        padding: 4rpx 20rpx;
        font-size: 24rpx;
        border-radius: 24rpx;
        background: linear-gradient(
          132.53deg,
          rgba(234, 180, 154, 1) 0%,
          rgba(213, 150, 106, 1) 100%
        );
      }
    }

    /*下级权益提示*/
    .nextVipTips {
      display: flex;
      align-items: center;
      height: 50rpx;
      border-radius: 8rpx;
      background: rgba(255, 255, 255, 0.37);
      border: 1px solid rgba(151, 151, 151, 0.37);

      /*喇叭图标*/
      .icon {
        margin-right: 8rpx;
        width: 76rpx;
        height: 76rpx;
        transform: translateY(-8rpx);
      }

      /*文字提示*/
      .tips {
        font-size: 24rpx;
        color: #ffffff;
      }
    }
  }
}
</style>
