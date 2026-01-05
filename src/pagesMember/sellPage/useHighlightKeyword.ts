// 高亮匹配关键字
export const highlightKeyword = (text: string, keyword: string) => {
  if (!keyword) return text
  // 转义正则特殊字符
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  return text.replace(regex, '<span style="color: #d62731;">$1</span>')
}
