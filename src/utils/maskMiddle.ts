/**
 * 对任意数字串中间打码
 * @param {string|number} input - 原始号码或字符串
 * @param {number} left - 左侧保留位数
 * @param {number} right - 右侧保留位数
 * @param {string} mask - 打码字符
 */
export function maskMiddle(input: string | number, left = 3, right = 4, mask = '*') {
  const s = String(input).trim()
  if (!/^\d+$/.test(s)) return s // 非纯数字，直接返回
  if (s.length <= left + right) return s // 太短，不打码

  const l = s.slice(0, left)
  const r = s.slice(-right)
  return l + mask.repeat(s.length - left - right) + r
}

/**
 * 示例
 * console.log(maskMiddle('15527650094')) 155****0094
 * console.log(maskMiddle('13012345678', 3, 2)) 130*******78
 */
