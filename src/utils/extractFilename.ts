// 截取url链接名字的部分

export function extractFilenameFromUrl(url: string) {
  if (!url || typeof url !== 'string') {
    return ''
  }

  // 正确的正则表达式
  const match = url.match(/\/([^/]+)\.(png|jpe?g|gif|bmp|webp|svg)$/i)
  return match ? match[1] : ''
}
