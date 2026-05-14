<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'

onLaunch(() => {
  console.log('App Launch')
})
onShow(() => {
  console.log('App Show')
})
onHide(() => {
  console.log('App Hide')
})
</script>

<style lang="scss">
// base：vite scss.additionalData 已 @use "styles/base"，不再重复 @import
@import '@/styles/iconfonts/iconfont.css';
@import '@tuniao/tn-style/dist/uniapp/index.css';

@font-face {
  font-family: 'YouSheBiaoTiHei';
  src: url('https://objectstorageapi.gzg.sealos.run/erq1dfin-920/YouSheBiaoTiHei.ttf');
}

page {
  background-color: $jel-pageBackGroundColor;
  height: 100%;
  overflow: hidden;
  box-sizing: border-box;
}
</style>
