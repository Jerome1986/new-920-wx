<script setup lang="ts">
import VipCard from '@/pages/my/components/VipCard.vue'
import NavGrid from '@/pages/my/components/NavGrid.vue'
import NavTitle from '@/components/NavTitle.vue'
import { useMemberStore } from '@/stores'
import { formatRole } from '@/utils/formatTimestamp.ts'
import { maskMiddle } from '@/utils/maskMiddle.ts'
import HotProductList from '@/components/HotProductList.vue'
import { ref } from 'vue'
import { checkedHireApi } from '@/api/hire.ts'
import { cooperateCheckApi } from '@/api/cooperate.ts'
import type { JelHotProductList } from '@/types/component'
import { userAvatarChangeApi } from '@/api/user'
import { onLoad } from '@dcloudio/uni-app'

// 定义 store
const userStore = useMemberStore()
const defaultAvatar =
  'https://objectstorageapi.gzg.sealos.run/erq1dfin-920/static/defaultAvatar.png'

// 点击登录
const login = () => {
  uni.navigateTo({
    url: '/pages/login/login',
  })
}

const changeAvatar = () => {
  uni.chooseImage({
    count: 1,
    success: (res) =>
      uni.uploadFile({
        url: 'https://x08d6czkyi.sealosgzg.site/upload',
        filePath: res.tempFilePaths[0],
        name: 'avatar',
        success: async (r) => {
          console.log(r)
          // 成功调用接口
          const res = await userAvatarChangeApi(userStore.profile?.id as string, r.data)
          console.log(res)

          if (res.code === 200) {
            uni.showToast({ icon: 'none', title: '头像更新成功' })
            userStore.setProfile({ avatarUrl: r.data })
          }
        },
        fail: () => uni.showToast({ icon: 'none', title: '上传失败' }),
      }),
  })
}

// 点击个人设置
const onLogout = () => {
  uni.showModal({
    title: '提示',
    content: '确定退出登录吗？',
    confirmColor: '#d62731',
    success: (result) => {
      if (result.confirm) {
        console.log('退出')

        userStore.clearProfile()
        uni.showToast({
          icon: 'success',
          title: '退出成功',
        })
      }
    },
  })
}

// 处理表单跳转
const handleForm = async (fromType: string) => {
  console.log(fromType)
  const cooperateRes = await cooperateCheckApi(userStore.profile?.id!, 'BUSINESS')
  const hireRes = await checkedHireApi(userStore.profile?.id!, 'JOB')

  switch (fromType) {
    // 员工招聘
    case 'hire':
      if (hireRes.data) return uni.showToast({ icon: 'none', title: '请勿重复提交' })
      await uni.navigateTo({ url: '/pages/hireForm/hireForm' })
      break
    // 合作申请
    case 'cooperate':
      if (cooperateRes.data) return uni.showToast({ icon: 'none', title: '请勿重复提交' })
      await uni.navigateTo({ url: '/pages/cooperateForm/cooperateForm' })
      break
  }
}

// 加载中标记，避免并发
const isLoading = ref(false)
const hotRefs = ref<JelHotProductList>() // 热门推荐组件
// 处理触底操作
const handleScrolltolower = async () => {
  if (hotRefs.value?.finish || isLoading.value) return
  isLoading.value = true
  try {
    await hotRefs.value?.hotListGet()
  } finally {
    isLoading.value = false
  }
}

onLoad(() => {
  if (userStore.profile?.id) {
    userStore.userInfoGet(userStore.profile?.id as string)
  }
})
</script>

<template>
  <scroll-view
    class="my"
    :enhanced="true"
    :show-scrollbar="false"
    :scroll-y="true"
    @scrolltolower="handleScrolltolower"
  >
    <!-- 用户信息区域 -->
    <view class="user-info">
      <!-- 信息区域 -->
      <view class="info">
        <view class="avatar" @click="changeAvatar">
          <image :src="userStore.profile?.avatarUrl || defaultAvatar"></image>
        </view>
        <!--   未登录     -->
        <view class="userText" v-if="!userStore.profile?.id" @click="login">
          <view class="mobile">点击登录</view>
        </view>
        <!--   已登录     -->
        <view class="userText" v-else>
          <view class="mobile">{{ maskMiddle(userStore.profile.mobile) }}</view>
          <view class="role"
            >{{ formatRole(userStore.profile.role, userStore.profile.vipLevel) }}
          </view>
        </view>
      </view>
      <!-- 设置按钮 -->
      <view class="options" @click="onLogout" v-if="userStore.profile?.id">
        <text class="iconfont icon-tuichudenglu" style="font-size: 28rpx"></text>
        <text style="font-size: 24rpx; margin-left: 8rpx">退出</text>
      </view>
    </view>

    <view class="content">
      <!-- 会员权益卡片 -->
      <navigator url="/pagesMember/myVip/myVip">
        <VipCard v-if="userStore.profile?.role === 'VIP'"></VipCard>
      </navigator>
      <!-- 功能导航 -->
      <NavGrid></NavGrid>

      <!--   报名申请   -->
      <view class="signUp">
        <view class="item" @click="handleForm('hire')">
          <image
            class="img"
            src="https://objectstorageapi.gzg.sealos.run/erq1dfin-920/static/yuanggong.png"
            mode="widthFix"
          ></image>
        </view>
        <view class="item" @click="handleForm('cooperate')">
          <image
            class="img"
            src="https://objectstorageapi.gzg.sealos.run/erq1dfin-920/static/hezuo.png"
            mode="widthFix"
          ></image>
        </view>
      </view>

      <!--   推荐产品   -->
      <view class="activityList">
        <NavTitle title="热门推荐" :is-more="false"></NavTitle>
        <HotProductList ref="hotRefs"></HotProductList>
      </view>
    </view>
  </scroll-view>
</template>

<style lang="scss">
.my {
  display: flex;
  flex-direction: column;
  height: 100%; // 占满父容器高度
  box-sizing: border-box; // 边框和内边距计入总高度

  /*用户信息*/
  .user-info {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 24rpx;
    height: 264rpx;
    background: url('../../static/images/backgroudImg.png') no-repeat center;
    background-size: cover;

    /*信息区域*/
    .info {
      display: flex;
      align-items: center;
      gap: 16rpx;
      color: #fff;

      .avatar {
        width: 120rpx;
        height: 120rpx;
        border-radius: 50%;
        overflow: hidden;
        background-color: #ffffff;

        image {
          width: 100%;
          height: 100%;
        }
      }

      .userText {
        display: flex;
        flex-direction: column;
        justify-content: center;
        height: 120rpx;

        .mobile {
          font-size: 36rpx;
        }

        .role {
          font-size: 28rpx;
        }
      }
    }

    /*设置按钮*/
    .options {
      display: flex;
      align-items: center;
      padding: 10rpx 12rpx;
      color: #ffffff;
      border: 1px solid #ff8990;
      border-radius: 4rpx;
    }
  }

  /*scroll内容区域*/
  .content {
    padding: 0 24rpx 20rpx 24rpx;
    transform: translateY(-96rpx);
    flex: 1;

    /*合作*/
    .signUp {
      margin-top: 24rpx;
      display: flex;
      justify-content: space-between;
      align-items: center;

      .item {
        width: 340rpx;
        height: 164rpx;
        border-radius: 8rpx;
        background-color: #ffffff;
      }
    }

    .activityList {
      margin-top: 24rpx;

      .activityItem {
        margin-bottom: 24rpx;
        height: 304rpx;
        background-color: #ffffff;
        border-radius: 18rpx;

        .imageUrl {
          border-radius: 18rpx;
        }
      }
    }
  }
}
</style>
