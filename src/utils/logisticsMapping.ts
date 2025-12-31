// 常见快递公司列表
const expressList = [
  { label: '顺丰速运', value: 'SF' },
  { label: '中通快递', value: 'ZTO' },
  { label: '圆通速递', value: 'YTO' },
  { label: '申通快递', value: 'STO' },
  { label: '韵达快递', value: 'YD' },
  { label: '极兔速递', value: 'JTSD' },
  { label: '京东物流', value: 'JD' },
  { label: '邮政快递', value: 'YZPY' },
  { label: 'EMS', value: 'EMS' },
  { label: '百世快递', value: 'HTKY' },
  { label: '德邦快递', value: 'DBL' },
  { label: '天天快递', value: 'HHTT' },
]

export const validateExpressList = (text: string) => {
  const newExpress = expressList.filter((item) => item.value === text)
  console.log(newExpress)
  return newExpress[0].label
}
