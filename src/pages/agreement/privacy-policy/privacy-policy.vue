<template>
  <scroll-view class="agreement-scroll" scroll-y>
    <view class="agreement-page">
      <view class="agreement-card">
        <view class="document-title">920科技隐私政策</view>
        <view class="update-time">更新日期：2026年8月30日</view>
        <view class="update-time">生效日期：2026年8月30日</view>

        <view class="intro">
          920科技重视您的个人信息和隐私安全。本政策用于说明我们在您使用平台服务时，如何收集、使用、存储和保护您的个人信息，以及您享有的相关权利。
        </view>

        <view class="section">
          <view class="section-title">一、我们收集的信息</view>
          <view class="paragraph"
            >1. 登录信息：经您授权后获取微信登录凭证及手机号码，用于完成身份验证和账号登录。</view
          >
          <view class="paragraph"
            >2. 交易信息：包括订单、支付状态、收货信息及售后记录，用于完成交易和提供客户服务。</view
          >
          <view class="paragraph"
            >3.
            设备与日志信息：为保障服务安全和改善体验，我们可能收集必要的设备型号、系统版本、网络及操作日志信息。</view
          >
          <view class="paragraph"
            >4.
            位置等敏感权限仅会在具体功能需要时单独向您申请，拒绝授权不影响其他基本功能的使用。</view
          >
        </view>

        <view class="section">
          <view class="section-title">二、信息的使用</view>
          <view class="paragraph"
            >我们仅会将收集的信息用于账号管理、订单履行、会员服务、售后支持、安全风控、功能优化及法律法规要求的用途。</view
          >
        </view>

        <view class="section">
          <view class="section-title">三、信息的共享与披露</view>
          <view class="paragraph"
            >我们不会出售您的个人信息。为完成支付、配送等必要服务，可能在最小范围内向合作方提供所需信息，并要求其采取相应保护措施；法律法规另有要求的除外。</view
          >
        </view>

        <view class="section">
          <view class="section-title">四、信息的存储与保护</view>
          <view class="paragraph"
            >我们将在实现服务目的所需的最短期限内保存您的信息，并采取访问控制、数据传输保护等合理措施防止信息丢失、泄露或被不当使用。</view
          >
        </view>

        <view class="section">
          <view class="section-title">五、您的权利</view>
          <view class="paragraph"
            >您有权依法查询、更正、删除个人信息，撤回相关授权或申请注销账号。部分授权撤回后，对应功能可能无法继续使用，但不影响撤回前基于授权进行的信息处理。</view
          >
        </view>

        <view class="section">
          <view class="section-title">六、未成年人保护</view>
          <view class="paragraph"
            >未成年人应在监护人指导和同意下使用本平台。若发现我们在未获监护人同意的情况下收集了未成年人信息，我们将依法及时处理。</view
          >
        </view>

        <view class="section">
          <view class="section-title">七、政策更新与联系我们</view>
          <view class="paragraph"
            >我们可能适时更新本政策，并通过平台进行提示。如您对个人信息处理有疑问或需行使相关权利，可通过平台内客服渠道联系我们。</view
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
