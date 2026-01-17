import { request } from '@/utils/http.ts'

interface deviceResult {
  phoneName: string
}

/**
 * 根据设备model码查询手机具体型号
 * @param model - 设备型号硬件码
 */
export const deviceFindPhoneNameApi = (model: string) => {
  return request<deviceResult>({
    method: 'POST',
    url: '/device/find',
    data: { model },
  })
}
