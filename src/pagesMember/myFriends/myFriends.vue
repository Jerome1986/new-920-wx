<script setup lang="ts">
import { maskMiddle } from '@/utils/maskMiddle.ts'
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useMemberStore } from '@/stores'
import { onShareAppMessage } from '@dcloudio/uni-app'
import type { UserItem } from '@/types/UserItem'
import { formatTimestamp } from '@/utils/formatTimestamp.ts'
import { addUserQrCodeApi, referralsUserListGetApi } from '@/api/user.ts'

const { safeAreaInsets } = uni.getSystemInfoSync()

// 定义store
const userStore = useMemberStore()

// 点击生成邀请码
const handleAddCode = () => {
  console.log('生成邀请码')
  uni.showModal({
    title: '提示',
    content: '点击确定生成你的专属邀请码',
    showCancel: false,
    success: async (success) => {
      if (success.confirm) {
        // todo 生成邀请码
        const res = await addUserQrCodeApi(userStore.profile.referralCode)
        console.log('生成的邀请码', res)
        userStore.setProfile({
          ...userStore.profile,
          myCodeUrl: res.data.qrCodeUrl,
        })
      }
    },
  })
}

// 放大并保存二维码
const handleSaveCode = () => {
  console.log('保存二维码')
  uni.previewImage({
    urls: [userStore.profile.myCodeUrl],
  })
}

// 一级好友
const firstFriends = ref<UserItem[]>([])
// 二级好友
const subFriends = ref<UserItem[]>([])
// 总好友数
const totalFriends = computed(() => {
  return firstFriends.value.length + subFriends.value.length
})

// 根据自身邀请码查询好友
const friendsListGet = async (referralCode: string) => {
  const res = await referralsUserListGetApi(referralCode)
  console.log('好有结果', res.data)
  if (res.code === 200) {
    firstFriends.value = res.data.firstUsers
    subFriends.value = res.data.secondUsers
  }
}

onLoad(() => {
  if (userStore.profile) {
    friendsListGet(userStore.profile.referralCode)
  }
})

// 没有更多
const noMore = computed(() => {
  return firstFriends.value.length > 0 || subFriends.value.length > 0
})

//  发送给朋友-生命周期钩子--不为普通函数，请注意
onShareAppMessage((res) => {
  if (res.from === 'button' && userStore.profile) {
    // 来自页面内按钮
    return {
      title: '920来帮你换膜啦~',
      path: `/pages/login/login?inviterCode=${userStore.profile.referralCode}`,
      imageUrl:
        'https://objectstorageapi.gzg.sealos.run/dxepxlzz-920/banner/Snipaste_2025-11-27_16-45-00.png',
    }
  }
  // 默认分享
  return {
    title: '给你的手机换个膜吧',
    path: `/pages/login/login?inviterCode=${userStore.profile.referralCode}`,
    imageUrl:
      'https://objectstorageapi.gzg.sealos.run/dxepxlzz-920/banner/Snipaste_2025-11-27_16-45-00.png',
  }
})
</script>
<template>
  <view class="myFriends">
    <!-- 邀请码卡片（新增） -->
    <view class="inviteCard">
      <view class="row">
        <view class="title">我的邀请码</view>
        <view class="code">{{ userStore.profile.referralCode || '—— —— ——' }}</view>
      </view>
      <view class="actions" v-if="!userStore.profile.myCodeUrl" @click="handleAddCode">
        <button class="btn primary">生成邀请码</button>
      </view>
      <view class="inviterCode" v-else @click="handleSaveCode">
        <image :src="userStore.profile.myCodeUrl" mode="aspectFit" />
      </view>
    </view>
    <!-- 头部 -->
    <view class="head" v-if="totalFriends">
      <view class="total">我的好友：{{ totalFriends }}个</view>
    </view>
    <scroll-view class="scroll-view" :scroll-y="true">
      <!-- 一级好友 -->
      <view class="friendsList" v-if="firstFriends.length > 0">
        <view class="item" v-for="item in firstFriends" :key="item._id">
          <view class="userAvatar">
            <image class="url" :src="item.avatarUrl" mode="aspectFit"></image>
          </view>
          <view class="info">
            <view class="mobile">
              <text style="margin-right: 12rpx">{{ maskMiddle(item.mobile) }}</text>
              <image
                style="width: 40rpx; height: 40rpx"
                src="/static/images/first.png"
                mode="aspectFit"
              ></image>
            </view>
            <view class="consumption">注册时间：{{ formatTimestamp(item.registerTime) }}</view>
          </view>
        </view>
      </view>
      <!-- 二级好友 -->
      <view class="friendsList" v-if="subFriends.length > 0">
        <view class="item" v-for="item in subFriends" :key="item._id">
          <view class="userAvatar">
            <image class="url" :src="item.avatarUrl" mode="aspectFit"></image>
          </view>
          <view class="info">
            <view class="mobile">
              <text style="margin-right: 12rpx">{{ maskMiddle(item.mobile) }}</text>
              <image
                style="width: 40rpx; height: 40rpx"
                src="/static/images/sub.png"
                mode="aspectFit"
              ></image>
            </view>
            <view class="consumption">注册时间：{{ formatTimestamp(item.registerTime) }}</view>
          </view>
        </view>
      </view>
      <!--  占位   -->
      <view class="zhanwei"> </view>
    </scroll-view>

    <!--  暂无好友  -->
    <view class="noMore" v-if="!noMore">
      <view class="pic">
        <image class="noPic" src="/static/images/noFriends.png" mode="aspectFit"></image>
      </view>
      <view class="tips">您还有分享过好友呢~</view>
      <button class="share" open-type="share">去分享</button>
    </view>
    <!--  分享好友按钮  -->
    <view class="toolbar" :style="{ paddingBottom: safeAreaInsets?.bottom + 'px' }" v-else>
      <button class="btn" open-type="share">分享好友</button>
    </view>
  </view>
</template>

<style scoped lang="scss">
.myFriends {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 24rpx;

  /* 新增：邀请码卡片 */
  .inviteCard {
    margin-bottom: 16rpx;
    padding: 16rpx 20rpx;
    background: #fff;
    border-radius: 8rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16rpx;
    height: 152rpx;

    .row {
      display: flex;
      align-items: center;
      gap: 12rpx;

      .title {
        font-size: 26rpx;
        color: $jel-font-dec2;
      }
      .code {
        font-size: 30rpx;
        color: $jel-font-title;
        font-weight: 700;
        letter-spacing: 2rpx;
      }
    }

    .actions {
      display: flex;
      gap: 12rpx;

      .btn {
        padding: 12rpx 24rpx;
        border-radius: 999rpx;
        font-size: 24rpx;
        white-space: nowrap;
      }
      .ghost {
        color: $jel-brandColor;
        background: #fff;
        border: 1rpx solid $jel-brandColor;
      }
      .primary {
        color: #fff;
        background: $jel-brandColor;
      }
    }

    .inviterCode {
      width: 120rpx;
      height: 120rpx;
      border-radius: 8rpx;
      overflow: hidden;

      image {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }
  }

  /*头部*/
  .head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 28rpx;
    color: $jel-font-title;
  }
  .scroll-view {
    flex: 1;
    width: 100%;
    /*好友列表*/
    .friendsList {
      margin-top: 24rpx;

      .item {
        padding: 24rpx;
        margin-bottom: 24rpx;
        display: flex;
        align-items: center;
        gap: 16rpx;
        background-color: #ffffff;
        border-radius: 8rpx;

        .userAvatar {
          .url {
            height: 100rpx;
            width: 100rpx;
            border-radius: 50%;
            overflow: hidden;
          }
        }

        .info {
          color: $jel-font-title;
          font-size: 28rpx;

          .consumption {
            color: $jel-font-dec;
          }
        }
      }
    }
  }

  /*没有更多*/
  .noMore {
    margin-top: 200rpx;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    .pic {
      width: 200rpx;
      height: 200rpx;
    }

    .tips {
      font-size: 28rpx;
      color: $jel-font-dec;
    }

    .share {
      margin-top: 24rpx;
      font-size: 24rpx;
      color: #ffffff;
      background-color: $jel-brandColor;
      border-radius: 8rpx;
    }
  }
  .zhanwei {
    margin-top: 80rpx;
    height: 100rpx;
    padding: 0 20rpx var(--window-bottom);
    box-sizing: content-box;
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

    .btn {
      width: 100%;
      background-color: $jel-brandColor;
      color: #fff;
      border-radius: 40rpx;
      font-size: 28rpx;
    }
  }
}
</style>
