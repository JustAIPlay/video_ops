# 飞书数据导出脚本

这个脚本用于从飞书多维表格导出真实数据，生成模拟即刻同步的测试数据。

## 使用步骤

### 1. 安装依赖

```bash
npm install axios
```

### 2. 配置飞书信息

编辑 `scripts/export_feishu_data.js` 文件，填写配置区域的内容：

```javascript
const FEISHU_CONFIG = {
  // 飞书应用凭证（在飞书开放平台获取）
  APP_ID: 'cli_xxxxxxxxxxxxx',     // 你的 App ID
  APP_SECRET: 'xxxxxxxxxxxxxxxxxx', // 你的 App Secret

  // 多维表格信息（从飞书表格 URL 中获取）
  BASE_TOKEN: 'bascnxxxxxxxxxxxx',  // 表格的 app_token
  TABLE_ID: 'tblxxxxxxxxxxxx',      // 数据表的 table_id

  // 账户名称过滤（可选）
  ACCOUNT_NAME: null,  // 填写具体账户名如 'ai绿植账号1'，或 null 获取所有

  // 生成数据数量限制
  LIMIT: 3,  // 每个账户生成多少条视频数据
};
```

### 3. 运行脚本

```bash
node scripts/export_feishu_data.js
```

### 4. 使用生成的数据

脚本会在 `constants/mock_data_from_feishu.ts` 生成数据文件。

将生成的 `MOCK_API_DATA` 数据复制到 `constants.ts` 中替换原有的 `MOCK_API_DATA`。

---

## 配置信息获取方式

### App ID 和 App Secret

1. 访问 [飞书开放平台](https://open.feishu.cn/app)
2. 选择或创建一个自建应用
3. 在"凭证与基础信息"页面获取 App ID 和 App Secret

### Base Token 和 Table ID

从飞书多维表格的 URL 中获取：

```
https://example.feishu.cn/base/{BASE_TOKEN}/?table={TABLE_ID}
```

或者：

```
https://example.feishu.cn/wiki/{WIKI_TOKEN}
```

如果是 Wiki 链接，脚本会自动解析出真实的 Base Token。

---

## 注意事项

1. 确保飞书应用有访问对应多维表格的权限
2. 确保表格中包含以下字段：账号、发布时间、内容描述、浏览次数、喜欢次数、评论次数、分享次数、完播率、平均播放时长等
3. 如果字段名称不同，可能需要修改脚本中的字段映射
