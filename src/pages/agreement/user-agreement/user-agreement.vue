<template>
  <scroll-view class="agreement-scroll" scroll-y>
    <view class="agreement-page">
      <view class="agreement-card">
        <view class="document-title">920科技用户协议</view>
        <view class="update-time">更新日期：2026年8月30日</view>
        <view class="update-time">生效日期：2026年8月30日</view>

        <view class="intro">
          欢迎使用920科技平台。请您在注册、登录或使用平台服务前，认真阅读并充分理解本协议。您勾选同意并继续使用，即表示您已阅读并接受本协议的全部内容。
        </view>

        <view class="section">
          <view class="section-title">一、服务说明</view>
          <view class="paragraph"
            >1. 本平台为用户提供商品浏览、购买、订单查询、会员权益及门店服务等功能。</view
          >
          <view class="paragraph"
            >2. 我们可能根据业务需要调整服务内容，并通过页面提示、公告等合理方式告知您。</view
          >
        </view>

        <view class="section">
          <view class="section-title">二、账号与使用规范</view>
          <view class="paragraph"
            >1. 您应提供真实、准确、有效的信息，并妥善保管账号及相关验证信息。</view
          >
          <view class="paragraph"
            >2.
            您不得利用本平台从事违法违规、侵害他人权益、干扰平台正常运行或危害网络安全的行为。</view
          >
          <view class="paragraph"
            >3. 因您主动泄露信息或保管不当造成的损失，由您依法承担相应责任。</view
          >
        </view>

        <view class="section">
          <view class="section-title">三、商品与交易</view>
          <view class="paragraph">1. 商品信息、价格、库存及优惠以订单提交时页面展示为准。</view>
          <view class="paragraph"
            >2.
            您应按页面提示完成支付、收货或到店核销。售后服务按照平台公示规则及相关法律法规执行。</view
          >
        </view>

        <view class="section">
          <view class="section-title">四、知识产权</view>
          <view class="paragraph"
            >平台中的文字、图片、标识、页面设计及软件程序等内容，依法受到知识产权保护。未经授权，不得擅自复制、传播或用于商业用途。</view
          >
        </view>

        <view class="section">
          <view class="section-title">五、责任说明</view>
          <view class="paragraph"
            >因不可抗力、网络故障、系统维护或第三方服务异常等原因造成服务中断的，我们将尽力及时处理。法律另有规定的，从其规定。</view
          >
        </view>

        <view class="section">
          <view class="section-title">六、协议变更与终止</view>
          <view class="paragraph"
            >我们可根据法律法规或服务变化更新本协议。更新内容将在平台公布；若您不同意，可停止使用服务。您继续使用即视为接受更新后的协议。</view
          >
        </view>

        <view class="section">
          <view class="section-title">七、联系我们</view>
          <view class="paragraph"
            >如您对本协议有疑问，可通过平台内客服渠道联系我们，我们会在合理期限内处理。</view
          >
        </view>
      </view>
    </view>
  </scroll-view>
</template>

<style lang="scss">
.agreement-scroll {
  height: 100vh;
  background: #f6f6f6;
}

.agreement-page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 28rpx 24rpx 60rpx;
  background: linear-gradient(180deg, rgba(214, 39, 49, 0.08) 0, #f6f6f6 260rpx);
}

.agreement-card {
  padding: 40rpx 32rpx 24rpx;
  border-radius: 24rpx;
  background: #fff;
  box-shadow: 0 8rpx 28rpx rgba(30, 30, 30, 0.05);
}

.document-title {
  margin-bottom: 18rpx;
  color: #222;
  font-size: 38rpx;
  font-weight: 600;
  text-align: center;
}

.update-time {
  color: #999;
  font-size: 24rpx;
  line-height: 38rpx;
  text-align: center;
}

.intro {
  margin: 32rpx 0 40rpx;
  padding: 24rpx;
  border-left: 6rpx solid $jel-brandColor;
  border-radius: 8rpx;
  color: #555;
  font-size: 28rpx;
  line-height: 1.8;
  background: rgba(214, 39, 49, 0.05);
}

.section {
  margin-bottom: 34rpx;
}

.section-title {
  margin-bottom: 14rpx;
  color: #333;
  font-size: 30rpx;
  font-weight: 600;
}

.paragraph {
  margin-bottom: 10rpx;
  color: #666;
  font-size: 28rpx;
  line-height: 1.9;
  text-align: justify;
}
</style>
