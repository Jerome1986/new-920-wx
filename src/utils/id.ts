let lastTime = 0
let seq = 0

export function generateId(prefix = ''): string {
  const now = Date.now()

  if (now === lastTime) {
    seq = (seq + 1) & 0xfff // 4096 序列号
    if (seq === 0) {
      // 如果同毫秒内超过4096次生成，则等待至下一个毫秒
      while (Date.now() === lastTime) {
        /* empty */
      }
    }
  } else {
    seq = 0
    lastTime = now
  }

  // 时间戳部分转换成36进制节省长度
  const ts = now.toString(36)
  // 序列号 36 进制左侧补零，确保固定长度
  const seq36 = seq.toString(36).padStart(3, '0')

  return prefix + ts + seq36
}
