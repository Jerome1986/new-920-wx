import { extractFilenameFromUrl } from '@/utils/extractFilename'
import type { FormItem } from '@/types/Apply'

export const updateImg = (form: FormItem, type: string) => {
  uni.chooseImage({
    success: async (e) => {
      const url = e.tempFilePaths[0]
      const originalname = extractFilenameFromUrl(url)
      console.log('名字', originalname)

      // 上传到后端
      uni.uploadFile({
        url: 'https://i2dkfjxqvm.gzg.sealos.run/admin/upload', // 你后端的上传接口
        filePath: e.tempFilePaths[0],
        name: originalname,
        success: (res) => {
          console.log('上传成功', res)
          // 可以记录后端返回的地址（永久地址）
          if (type === 'font') return (form.icCardFont = res.data)
          if (type === 'back') return (form.icCardBack = res.data)
          if (type === 'business') return (form.business = res.data)
        },
        fail: (err) => {
          console.error('上传失败', err)
        },
      })
    },
  })
}
