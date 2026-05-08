<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useManagerStore } from '@/stores/modules/manager.ts'
import { maskMiddle } from '@/utils/maskMiddle.ts'
import type { StoreMemberItem } from '@/types/StoreMember'
import { findStoreVipApi } from '@/api/store'
import { formatTimestamp } from '@/utils/formatTimestamp'

const managerStore = useManagerStore()

// 列表与分页
const memberList = ref<StoreMemberItem[]>([])
const loading = ref(false)
const finish = ref(false)
const params = ref({
  pageNum: 1,
  pageSize: 10,
})

// 滚动区域高度（px）
const scrollHeight = ref(0)

// 拉取门店会员列表；TODO: 接入后端接口，传入 storeId、分页参数
const fetchMemberList = async (managerId: string) => {
  if (finish.value || loading.value) return
  loading.value = true
  try {
    const res = await findStoreVipApi(managerId, params.value.pageNum, params.value.pageSize)
    console.log('vip', res)
    memberList.value.push(...res.data.list)

    if (params.value.pageNum < res.data.totalPage) {
      params.value.pageNum++
    } else {
      finish.value = true
    }
  } finally {
    loading.value = false
  }
}

// 触底加载更多
const handleScrolltolower = async () => {
  const storeId = managerStore.managerStoreInfo?.id
  if (!storeId || finish.value || loading.value) return
  await fetchMemberList(managerStore.managerStoreInfo?.managerId as string)
}

const displayMobile = (mobile: string) => maskMiddle(mobile)

const handleMemberDetail = () => {
  uni.showToast({ title: '暂未开放', icon: 'none' })
}

const initScrollHeight = () => {
  const systemInfo = uni.getSystemInfoSync()
  scrollHeight.value = systemInfo.windowHeight - 140
}

initScrollHeight()

onLoad(async () => {
  await managerStore.managerStoreGet()
  const managerId = managerStore.managerStoreInfo?.managerId
  if (managerId) {
    await fetchMemberList(managerId)
  }
})
</script>

<template>
  <view class="page">
    <!-- 顶部门店信息 -->
    <view class="header-card">
      <view class="store-info">
        <text class="store-name">{{ managerStore.managerStoreInfo?.name || '门店' }}</text>
        <text class="store-desc">门店会员</text>
      </view>
      <view class="member-stat">
        <text class="member-stat__value">{{ memberList.length }}</text>
        <text class="member-stat__label">会员人数</text>
      </view>
    </view>

    <!-- 会员列表 -->
    <scroll-view
      class="member-scroll"
      :scroll-y="true"
      :enhanced="true"
      :show-scrollbar="false"
      :style="{ height: scrollHeight + 'px' }"
      @scrolltolower="handleScrolltolower"
    >
      <view v-for="item in memberList" :key="item.id" class="member-card">
        <image
          v-if="item.avatarUrl"
          class="member-card__avatar"
          :src="item.avatarUrl"
          mode="aspectFill"
        />
        <view v-else class="member-card__avatar member-card__avatar--placeholder">
          <text class="member-card__avatar-text">{{ (item.nickname || '?').slice(0, 1) }}</text>
        </view>

        <view class="member-card__main">
          <view class="member-card__row member-card__row--top">
            <text class="member-card__name">{{ item.nickname }}</text>
            <text class="member-card__expires">{{ formatTimestamp(item.vipEndTime, 2) }}</text>
          </view>
          <text class="member-card__mobile">{{ displayMobile(item.mobile) }}</text>
          <view class="member-card__stats">
            <!-- TODO 需要后端查询贴膜订单的总次数 -->
            <text class="member-card__stat member-card__stat--left"
              >消费 {{ item.serviceCount ?? 0 }} 次</text
            >
            <view class="member-card__detail-btn" @click.stop="handleMemberDetail">
              <text class="member-card__detail-btn-text">详情</text>
            </view>
          </view>
        </view>
      </view>

      <view v-if="memberList.length === 0 && !loading" class="empty-state">
        <text class="empty-state__text">暂无会员数据</text>
      </view>

      <view v-if="loading" class="load-tip">加载中…</view>
    </scroll-view>
  </view>
</template>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  padding: 24rpx;
  box-sizing: border-box;
  background: linear-gradient(180deg, #f8f8f8 0%, #ffffff 48%);
}

.header-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, $jel-brandColor 0%, #ff4757 100%);
  border-radius: 20rpx;
  padding: 36rpx 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(214, 39, 49, 0.25);
}

.store-info {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  flex: 1;
  min-width: 0;
}

.store-name {
  font-size: 36rpx;
  font-weight: 600;
  color: #ffffff;
  line-height: 1.2;
}

.store-desc {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.88);
  line-height: 1.2;
}

.member-stat {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6rpx;
}

.member-stat__value {
  font-size: 44rpx;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.1;
}

.member-stat__label {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.85);
}

.member-scroll {
  width: 100%;
}

.member-card {
  display: flex;
  align-items: flex-start;
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.member-card__avatar {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  background-color: $jel-border;
  flex-shrink: 0;
}

.member-card__avatar--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(214, 39, 49, 0.15) 0%, rgba(255, 71, 87, 0.12) 100%);
}

.member-card__avatar-text {
  font-size: 32rpx;
  font-weight: 600;
  color: $jel-brandColor;
}

.member-card__main {
  flex: 1;
  min-width: 0;
  margin-left: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.member-card__row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.member-card__row--top {
  justify-content: space-between;
  gap: 16rpx;
}

.member-card__name {
  flex: 1;
  min-width: 0;
  font-size: 30rpx;
  font-weight: 600;
  color: $jel-font-title;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-card__expires {
  flex-shrink: 0;
  max-width: 52%;
  font-size: 22rpx;
  color: $jel-font-dec2;
  padding: 4rpx 12rpx;
  background: $jel-pageBackGroundColor;
  border-radius: 8rpx;
  text-align: right;
}

.member-card__mobile {
  font-size: 26rpx;
  color: $jel-font-title;
}

.member-card__stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-top: 4rpx;
  box-sizing: border-box;
}

.member-card__stat {
  font-size: 24rpx;
  color: $jel-font-dec2;
}

.member-card__stat--left {
  flex-shrink: 0;
}

.member-card__detail-btn {
  flex-shrink: 0;
  padding: 0;
  background-color: transparent;
}

.member-card__detail-btn:active {
  opacity: 0.75;
}

.member-card__detail-btn-text {
  font-size: 24rpx;
  color: $jel-brandColor;
  font-weight: 500;
  line-height: 1.2;
}

.empty-state {
  padding: 100rpx 32rpx 48rpx;
  text-align: center;
}

.empty-state__text {
  font-size: 28rpx;
  color: $jel-font-dec;
}

.load-tip {
  text-align: center;
  font-size: 26rpx;
  color: $jel-font-dec;
  padding: 24rpx 0 48rpx;
}
</style>
