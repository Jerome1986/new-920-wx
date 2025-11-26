<script setup lang="ts">
import { withDefaults } from 'vue'

// ts接收参数并设置默认值 -- withDefaults
withDefaults(
  defineProps<{
    icCardFont: string
    icCardBack: string
    business?: string
    isCooperate?: boolean
  }>(),
  {
    icCardFont: '',
    icCardBack: '',
    business: '',
    isCooperate: false,
  },
)

// 提交事件
const emits = defineEmits(['update'])

// 处理上传
const handleUpdate = (type: string) => {
  if (type === 'font') {
    console.log('font')
    emits('update', 'font')
  }

  if (type === 'back') {
    console.log('back')
    emits('update', 'back')
  }

  if (type === 'business') {
    console.log('business')
    emits('update', 'business')
  }
}
</script>

<template>
  <view class="update">
    <!--  身份证  -->
    <view class="item">
      <!-- title -->
      <view class="title">
        <text style="color: #d62731">*</text>
        上传身份证
      </view>
      <!-- 证件正面 -->
      <view class="updateItem">
        <view class="left" @click="handleUpdate('font')">
          <text
            style="color: #d62731; font-size: 40rpx; margin-bottom: 12rpx"
            class="iconfont icon-tianjia"
          ></text>
          <text style="font-size: 24rpx; color: #777777">上传身份证正面</text>
        </view>
        <view class="right">
          <image
            :src="icCardFont ? icCardFont : '../static/images/icCardBack.png'"
            mode="aspectFill"
          />
        </view>
      </view>
      <!-- 证件反面 -->
      <view class="updateItem">
        <view class="left" @click="handleUpdate('back')">
          <text
            style="color: #d62731; font-size: 40rpx; margin-bottom: 12rpx"
            class="iconfont icon-tianjia"
          ></text>
          <text style="font-size: 24rpx; color: #777777">上传身份证反面</text>
        </view>
        <view class="right">
          <image
            :src="icCardBack ? icCardBack : '../static/images/icCardFont.png'"
            mode="aspectFill"
          />
        </view>
      </view>
    </view>
    <!--  营业执照  -->
    <view class="item" v-if="isCooperate">
      <view class="title">
        <text style="color: #d62731">*</text>
        上传营业执照
      </view>
      <view class="updateItem">
        <view class="left" @click="handleUpdate('business')">
          <text
            style="color: #d62731; font-size: 40rpx; margin-bottom: 12rpx"
            class="iconfont icon-tianjia"
          ></text>
          <text style="font-size: 24rpx; color: #777777">上传营业执照</text>
        </view>
        <view class="right">
          <image
            :src="business ? business : '../static/images/yingyezhizhao.png'"
            mode="aspectFill"
          />
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.update {
  margin-top: 24rpx;

  .item {
    padding: 24rpx;
    margin-bottom: 24rpx;
    background-color: #ffffff;
    border-radius: 8rpx;

    /*标题*/
    .title {
      margin-bottom: 24rpx;
      color: $jel-font-title;
    }

    .updateItem {
      margin-bottom: 24rpx;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 24rpx;
      height: 262rpx;
      border: 1px solid $jel-border;
      border-radius: 4rpx;

      &:nth-last-child(1) {
        margin-bottom: 0;
      }

      .left {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        flex: 1;
        height: 214rpx;
        border-radius: 4rpx;
      }

      .right {
        width: 320rpx;
        height: 214rpx;
      }
    }
  }
}
</style>
