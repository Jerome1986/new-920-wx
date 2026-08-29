# 代理邀请领取页接口准备说明

> 用途：供后端实现小程序代理邀请领取页接口时参考。  
> 当前范围：只包含领取页初始化查询和用户确认领取，不包含代理后台管理、二维码生成和门店核销。

## 1. 页面调用流程

```text
用户扫描代理二维码
  → 登录页解析 agentCode
  → 已登录或登录成功后进入领取页
  → 领取页查询当前邀请及领取状态
  → 用户点击“立即领取”
  → 后端完成代理归因并发放1次免费贴膜权益
```

登录接口不接收 `agentCode`，代理归因只在确认领取接口成功时建立。

## 2. 通用约定

- 接口前缀沿用项目现有 `/api` 配置。
- 两个接口均使用项目现有用户登录凭证，通过 `Authorization` 请求头识别当前用户。
- 当前用户必须以后端鉴权结果为准，不接收前端传入的 `userId`。
- 日期返回 ISO 8601 字符串。
- 统一响应结构：

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

## 3. 查询邀请及领取状态

### 3.1 接口

```http
GET /api/agent-invites/{agentCode}/landing
Authorization: <项目现有登录凭证>
```

路径参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `agentCode` | string | 是 | 二维码 `scene` 中携带的代理编号 |

### 3.2 页面状态

| `claimStatus` | 含义 | 页面处理 |
| --- | --- | --- |
| `CLAIMABLE` | 当前用户可以领取 | 展示“立即领取”按钮 |
| `CLAIMED_AVAILABLE` | 已领取且权益可用 | 展示已领取和到期时间 |
| `CLAIMED_USED` | 已领取且已使用 | 展示已使用 |
| `CLAIMED_EXPIRED` | 已领取但已过期 | 展示已过期 |
| `SELF_INVITE` | 当前用户是该代理本人 | 提示不能领取自己的邀请 |
| `AGENT_UNAVAILABLE` | 代理不存在或已停用 | 展示邀请无效 |

领取状态由服务端计算，前端不根据本地时间或本地缓存自行判断。

### 3.3 可领取响应

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "agentCode": "AGT8K2M9",
    "claimStatus": "CLAIMABLE",
    "rewardCount": 1,
    "validityDays": 30,
    "claim": null
  }
}
```

### 3.4 已领取响应

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "agentCode": "AGT8K2M9",
    "claimStatus": "CLAIMED_AVAILABLE",
    "rewardCount": 1,
    "validityDays": 30,
    "claim": {
      "claimId": "cm123456",
      "claimedAt": "2026-08-29T08:00:00.000Z",
      "expiresAt": "2026-09-28T08:00:00.000Z",
      "benefitStatus": "AVAILABLE"
    }
  }
}
```

### 3.5 查询规则

1. 根据 `agentCode` 查询代理记录。
2. 代理不存在或状态不是 `ACTIVE` 时返回 `AGENT_UNAVAILABLE`。
3. 当前用户是代理本人时返回 `SELF_INVITE`。
4. 查询当前用户是否已有代理邀请领取记录。
5. 已有记录时，根据权益状态及 `expiresAt` 返回对应的已领取状态。
6. 没有领取记录时返回 `CLAIMABLE`。

查询接口不新增领取记录、不增加免费次数，也不修改用户原有 `inviterId`。

## 4. 确认领取

### 4.1 接口

```http
POST /api/agent-invites/claims
Authorization: <项目现有登录凭证>
Content-Type: application/json
```

请求体：

```json
{
  "agentCode": "AGT8K2M9"
}
```

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `agentCode` | string | 是 | 本次邀请对应的代理编号 |

不接收 `userId`、免费次数、到期时间或权益来源等由客户端指定的字段。

### 4.2 首次领取响应

```json
{
  "code": 200,
  "message": "领取成功",
  "data": {
    "result": "GRANTED",
    "claimId": "cm123456",
    "agentCode": "AGT8K2M9",
    "rewardCount": 1,
    "benefitStatus": "AVAILABLE",
    "claimedAt": "2026-08-29T08:00:00.000Z",
    "expiresAt": "2026-09-28T08:00:00.000Z"
  }
}
```

### 4.3 重复领取响应

重复请求按幂等成功处理，返回第一次成功领取的记录，不重复发放权益：

```json
{
  "code": 200,
  "message": "该福利已领取",
  "data": {
    "result": "ALREADY_CLAIMED",
    "claimId": "cm123456",
    "agentCode": "AGT8K2M9",
    "rewardCount": 1,
    "benefitStatus": "AVAILABLE",
    "claimedAt": "2026-08-29T08:00:00.000Z",
    "expiresAt": "2026-09-28T08:00:00.000Z"
  }
}
```

如果用户先通过代理 A 成功领取，之后通过代理 B 请求领取，仍返回第一次领取记录，不能把归因改为代理 B。

### 4.4 领取事务规则

确认领取应在一个数据库事务中完成：

1. 根据 `agentCode` 查询 `ACTIVE` 代理。
2. 通过登录凭证取得当前用户。
3. 校验当前用户不是代理本人。
4. 校验当前用户全平台未成功领取过代理赠送。
5. 新增代理邀请领取记录，并绑定代理和当前用户。
6. 设置 `claimedAt` 为服务端当前时间。
7. 设置 `expiresAt = claimedAt + 30天`。
8. 设置权益状态为 `AVAILABLE`。
9. 提交后返回领取结果。

必须使用 `inviteeUserId` 唯一约束防止并发重复领取，不能只依赖接口调用前的查询结果。

领取成功不修改：

- `User.inviterId`
- `User.referralCode`
- 原推荐上下级关系

如果采用已讨论的独立代理权益方案，领取成功也不直接增加 `User.vipGift`。

## 5. 错误响应建议

| HTTP | 业务码 | 场景 | 建议消息 |
| --- | ---: | --- | --- |
| 400 | `41001` | `agentCode` 缺失或格式错误 | 邀请参数无效 |
| 401 | `40100` | 未登录或凭证失效 | 请重新登录 |
| 404 | `41002` | 代理不存在 | 邀请信息不存在 |
| 409 | `41003` | 代理已停用 | 当前邀请暂不可用 |
| 409 | `41004` | 代理本人领取 | 不能领取自己的邀请 |

查询接口建议将代理不存在和停用统一映射为 `AGENT_UNAVAILABLE`，方便页面稳定展示；确认领取接口仍返回明确的业务错误码。

## 6. 前端接入所需类型

```ts
export type AgentInviteClaimStatus =
  | 'CLAIMABLE'
  | 'CLAIMED_AVAILABLE'
  | 'CLAIMED_USED'
  | 'CLAIMED_EXPIRED'
  | 'SELF_INVITE'
  | 'AGENT_UNAVAILABLE'

export interface AgentInviteLandingResult {
  agentCode: string
  claimStatus: AgentInviteClaimStatus
  rewardCount: 1
  validityDays: 30
  claim: {
    claimId: string
    claimedAt: string
    expiresAt: string
    benefitStatus: 'AVAILABLE' | 'USED' | 'EXPIRED'
  } | null
}

export interface ClaimAgentInviteResult {
  result: 'GRANTED' | 'ALREADY_CLAIMED'
  claimId: string
  agentCode: string
  rewardCount: 1
  benefitStatus: 'AVAILABLE' | 'USED' | 'EXPIRED'
  claimedAt: string
  expiresAt: string
}
```

## 7. 后端完成验收

- 有效代理的未领取用户返回 `CLAIMABLE`。
- 用户点击领取后只产生一条领取记录和一次权益。
- 同一用户并发领取时只有一次成功发放。
- 同一用户扫描其他代理二维码不能改变首次归因。
- 代理本人不能领取自己的邀请。
- 停用代理不能产生新领取。
- 登录、查询页面本身不产生代理绑定。
- 领取成功时间和30天到期时间均由服务端生成。
- 原推荐关系和 `User.vipGift` 不被错误修改。
