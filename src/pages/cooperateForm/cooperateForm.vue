<script setup lang="ts">
import UpdateFIle from '@/components/UpdateFIle.vue'
import { ref } from 'vue'
import type { FormItem } from '@/types/Apply'
import { validateForm } from '@/utils/validate'
import { useMemberStore } from '@/stores'
import { updateImg } from '@/composables/updateImg'
import { cooperateAddApi } from '@/api/cooperate.ts'

// 获取系统安全范围
const { safeAreaInsets } = uni.getSystemInfoSync()

// 定义store
const userStore = useMemberStore()

// 基础表单数据
const form = ref<FormItem>({
  userId: userStore.profile.id,
  name: '',
  mobile: '',
  icCardFont: '',
  icCardBack: '',
  business: '',
  type: 'BUSINESS',
})

// 处理子组件上传
const handleUpdate = (type: string) => {
  updateImg(form.value, type)
}

const isSubmitting = ref(false)

// 提交
const handleSubmit = async () => {
  console.log('提交', form.value)

  // 用户身份验证
  if (userStore.profile.role === 'manager') {
    await uni.showToast({
      title: '您已经是我们的员工啦',
      icon: 'none',
    })
    return
  }

  // 表单验证
  if (!validateForm(form.value)) {
    return
  }

  // 防止重复提交
  if (isSubmitting.value) {
    return
  }
  isSubmitting.value = true

  try {
    await uni.showLoading({
      title: '提交中...',
      mask: true,
    })

    const res = await cooperateAddApi(
      form.value.userId,
      form.value.name,
      form.value.mobile,
      form.value.icCardFont,
      form.value.icCardBack,
      form.value.business as string,
      form.value.type,
    )

    console.log('提交结果', res)

    if (res.data?.insertedId) {
      await uni.showToast({
        title: '提交成功',
        icon: 'success',
        duration: 1500,
      })

      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    } else {
      await uni.showToast({
        title: res.message || '提交错误',
        icon: 'error',
        duration: 1500,
      })
    }
  } catch (error: any) {
    console.error('提交错误:', error)
    const errorMessage = error?.message || '网络错误，请重试'

    await uni.showToast({
      title: errorMessage,
      icon: 'none',
      duration: 3000,
    })
  } finally {
    isSubmitting.value = false
    uni.hideLoading()
  }
}
</script>

<template>
  <view class="cooperateForm">
    <view class="form">
      <!-- 信息区域 -->
      <view class="info">
        <!-- title -->
        <view class="title">
          <text style="color: #d62731">*</text>
          基本信息
        </view>
        <!-- 表单内容 -->
        <view class="item">
          <text class="name">姓名</text>
          <input class="ipt" v-model="form.name" placeholder="请输入您的姓名" />
        </view>
        <view class="item">
          <text class="name">电话</text>
          <input class="ipt" v-model="form.mobile" placeholder="请输入您的电话" />
        </view>
      </view>
      <!-- 上传区域 -->
      <UpdateFIle
        :ic-card-font="form.icCardFont"
        :ic-card-back="form.icCardBack"
        :business="form.business"
        :is-cooperate="true"
        @update="handleUpdate"
      ></UpdateFIle>
      <!-- 提交按钮 -->
      <view class="toolbar" :style="{ paddingBottom: safeAreaInsets?.bottom + 'px' }">
        <button class="btn" @click="handleSubmit">提交</button>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.cooperateForm {
  height: 100%;
  padding: 24rpx 24rpx 170rpx;

  .form {
    height: 100%;
    overflow: auto;

    /*文字信息区域*/
    .info {
      padding: 24rpx;
      background-color: #ffffff;
      border-radius: 8rpx;

      /*标题*/
      .title {
        margin-bottom: 24rpx;
        color: $jel-font-title;
      }

      .item {
        margin-bottom: 24rpx;
        display: flex;
        gap: 60rpx;
        font-size: 28rpx;
        color: $jel-font-dec2;

        &:nth-last-child(1) {
          margin-bottom: 0;
        }

        .ipt {
          flex: 1;
        }
      }
    }

    /*上传区域*/

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
}
</style>
