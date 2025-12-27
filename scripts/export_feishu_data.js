#!/usr/bin/env node
/**
 * 飞书数据导出脚本
 *
 * 用途：从飞书多维表格读取真实数据，生成模拟即刻同步的测试数据
 *
 * 使用方法：
 * 1. 安装依赖: npm install axios
 * 2. 填写下方的配置信息
 * 3. 运行: node scripts/export_feishu_data.js
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';

// ==================== 配置区域 ====================
// 请在此处填写你的飞书配置信息

const FEISHU_CONFIG = {
  // 飞书应用凭证
  APP_ID: 'cli_a9a5574ab0389bb6',  // 请填写你的 App ID
  APP_SECRET: 'bA6hop68Z9GzVSa7RGu7FdghpA8bnolr',  // 请填写你的 App Secret

  // 多维表格信息
  BASE_TOKEN: 'PcGDbUIJXacp3NsqYEDc9wE9nyh',  // 请填写多维表格的 app_token
  TABLE_ID: 'tblvHLx3SmNal4mM',  // 请填写数据表的 table_id

  // 账户名称（用于过滤数据）
  // 如果为 null，则获取所有账户的数据
  ACCOUNT_NAME: null,  // 例如: 'ai绿植账号1'，或 null 获取所有

  // 数据数量限制（生成多少条测试数据）
  LIMIT: 3,
};

// ==================== 代码区域 ====================

// 飞书 API 基础地址
const FEISHU_API_BASE = 'https://open.feishu.cn/open-apis';

// 缓存的访问令牌
let accessToken = null;

/**
 * 获取租户访问令牌
 */
async function getTenantAccessToken() {
  console.log('正在获取飞书访问令牌...');

  const response = await axios.post(`${FEISHU_API_BASE}/auth/v3/tenant_access_token/internal`, {
    app_id: FEISHU_CONFIG.APP_ID,
    app_secret: FEISHU_CONFIG.APP_SECRET,
  });

  if (response.data.code !== 0) {
    throw new Error(`获取访问令牌失败: ${response.data.msg}`);
  }

  accessToken = response.data.tenant_access_token;
  console.log('访问令牌获取成功');
  return accessToken;
}

/**
 * 解析 Base Token（处理 Wiki Token 的情况）
 */
async function resolveBaseToken(originalToken) {
  try {
    const response = await axios.get(
      `${FEISHU_API_BASE}/wiki/v2/spaces/get_node?token=${originalToken}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (response.data.code === 0 && response.data.data?.node?.obj_type === 'bitable') {
      return response.data.data.node.obj_token;
    }
  } catch (e) {
    console.warn('可能不是 Wiki Token，使用原始 Token');
  }

  return originalToken;
}

/**
 * 从飞书读取记录数据
 */
async function fetchFeishuRecords(baseToken, tableId, accountFilter = null) {
  console.log('正在读取飞书数据...');

  const records = [];
  let pageToken = '';
  let hasMore = true;

  while (hasMore) {
    const queryParams = {
      page_size: 100,
    };

    if (pageToken) {
      queryParams.page_token = pageToken;
    }

    // 如果指定了账户过滤条件
    if (accountFilter) {
      queryParams.filter = encodeURIComponent(
        `CurrentValue.[账号]="${accountFilter}"`
      );
    }

    const queryString = Object.entries(queryParams)
      .map(([k, v]) => `${k}=${v}`)
      .join('&');

    const url = `${FEISHU_API_BASE}/bitable/v1/apps/${baseToken}/tables/${tableId}/records?${queryString}`;

    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (response.data.code !== 0) {
      throw new Error(`读取数据失败: ${response.data.msg}`);
    }

    const items = response.data.data?.items || [];
    records.push(...items);

    hasMore = response.data.data?.has_more || false;
    pageToken = response.data.data?.page_token || '';

    console.log(`已读取 ${records.length} 条记录...`);
  }

  return records;
}

/**
 * 辅助函数：从飞书字段提取值
 */
function extractValue(val) {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (Array.isArray(val)) return val.length > 0 ? extractValue(val[0]) : '';
  if (typeof val === 'object') {
    return val.text || val.value || val.link || JSON.stringify(val);
  }
  return String(val);
}

/**
 * 辅助函数：提取数字值
 */
function extractNumber(val) {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return parseFloat(val) || 0;
  if (Array.isArray(val)) return val.length > 0 ? extractNumber(val[0]) : 0;
  if (typeof val === 'object') {
    const inner = val.value || val.text || val.link;
    if (inner) return extractNumber(inner);
  }
  return 0;
}

/**
 * 将飞书记录转换为即刻格式的 VideoItem
 */
function convertToJikeFormat(record, username, groupName) {
  const fields = record.fields;

  // 提取发布时间
  let publishTime = fields['发布时间'];
  let createTime = '';
  let createTimeTimestamp = 0;

  if (typeof publishTime === 'number') {
    createTimeTimestamp = Math.floor(publishTime / 1000);
    const date = new Date(publishTime);
    createTime = formatDateTime(date);
  } else if (typeof publishTime === 'string') {
    const date = new Date(publishTime);
    createTimeTimestamp = Math.floor(date.getTime() / 1000);
    createTime = formatDateTime(date);
  }

  // 提取完播率（去掉%号转为小数）
  const fullPlayRateRaw = extractValue(fields['完播率'] || '0%');
  const fullPlayRate = fullPlayRateRaw.replace('%', '');

  // 提取平均播放时长（去掉"秒"字）
  const avgPlayTimeRaw = extractValue(fields['平均播放时长'] || '0');
  const avgPlayTimeSec = `${avgPlayTimeRaw.replace(/[^\d.]/g, '')}秒`;

  // 提取 URL
  const url = extractValue(fields['链接'] || fields['URL'] || '');

  // 提取封面
  const coverUrl = extractValue(fields['封面'] || fields['封面图'] || '');

  // 构建 VideoItem
  return {
    name: extractValue(fields['内容描述'] || fields['动态信息'] || '未命名视频'),
    createTime: createTime,
    create_time: createTimeTimestamp,
    url: url,
    coverUrl: coverUrl,
    readCount: extractNumber(fields['浏览次数'] || 0),
    likeCount: extractNumber(fields['喜欢次数'] || fields['点赞次数'] || 0),
    commentCount: extractNumber(fields['评论次数'] || 0),
    forwardCount: extractNumber(fields['分享次数'] || 0),
    forwardAggregationCount: extractNumber(fields['转发聊天和朋友圈'] || 0),
    favCount: extractNumber(fields['推荐次数'] || fields['收藏次数'] || 0),
    fullPlayRate: fullPlayRate ? `${parseFloat(fullPlayRate).toFixed(2)}%` : '0%',
    avgPlayTimeSec: avgPlayTimeSec,
    followCount: 0,  // 飞书数据中没有粉丝数
    exportId: record.record_id,
    objectId: record.record_id,
    visibleType: 0,
    status: 1,
    desc: {
      description: extractValue(fields['内容描述'] || fields['动态信息'] || ''),
      mediaType: 2,
      media: [{
        url: url,
        coverUrl: coverUrl,
        width: 1080,
        height: 1920,
        videoPlayLen: extractNumber(avgPlayTimeSec),
        fileSize: '0',
      }],
    },
  };
}

/**
 * 格式化日期时间
 */
function formatDateTime(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

/**
 * 生成分组数据（按账户分组）
 */
function groupByAccount(records, groupName) {
  const grouped = {};

  for (const record of records) {
    const accountName = extractValue(record.fields['账号'] || record.fields['帐号'] || '未知账号');

    if (!grouped[accountName]) {
      grouped[accountName] = {
        user_id: Object.keys(grouped).length + 1,
        username: accountName,
        group_name: groupName,
        window_name: accountName,
        platform: '即刻',
        total_count: 0,
        videos: [],
      };
    }

    grouped[accountName].videos.push(
      convertToJikeFormat(record, accountName, groupName)
    );
    grouped[accountName].total_count = grouped[accountName].videos.length;
  }

  return Object.values(grouped);
}

/**
 * 生成 TypeScript 格式的输出
 */
function generateTypeScriptOutput(data) {
  const output = {
    code: 200,
    msg: 'success',
    data: data,
  };

  return `// -*- coding: utf-8 -*-
// 自动生成的测试数据（从飞书导出）
// 生成时间: ${new Date().toLocaleString('zh-CN')}
// 数据来源: 飞书多维表格

import { AccountData } from '../types';

export const MOCK_API_DATA: AccountData[] = ${JSON.stringify(data, null, 2)};
`;
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('='.repeat(60));
    console.log('飞书数据导出工具');
    console.log('='.repeat(60));

    // 检查配置
    if (
      !FEISHU_CONFIG.APP_ID ||
      FEISHU_CONFIG.APP_ID === 'cli_xxxxxxxxxxxxx' ||
      !FEISHU_CONFIG.APP_SECRET ||
      FEISHU_CONFIG.APP_SECRET === 'xxxxxxxxxxxxxxxxxx'
    ) {
      console.error('\n错误: 请先填写 FEISHU_CONFIG 中的配置信息！');
      console.log('请编辑本文件，填写以下内容:');
      console.log('  - APP_ID: 飞书应用 ID');
      console.log('  - APP_SECRET: 飞书应用密钥');
      console.log('  - BASE_TOKEN: 多维表格 app_token');
      console.log('  - TABLE_ID: 数据表 table_id');
      process.exit(1);
    }

    // 获取访问令牌
    await getTenantAccessToken();

    // 解析 Base Token
    console.log('解析 Base Token...');
    const baseToken = await resolveBaseToken(FEISHU_CONFIG.BASE_TOKEN);
    console.log(`Base Token: ${baseToken}`);

    // 读取数据
    const records = await fetchFeishuRecords(
      baseToken,
      FEISHU_CONFIG.TABLE_ID,
      FEISHU_CONFIG.ACCOUNT_NAME
    );

    console.log(`\n共读取 ${records.length} 条记录`);

    if (records.length === 0) {
      console.warn('警告: 没有读取到任何数据，请检查配置和表格权限');
      process.exit(0);
    }

    // 显示前3条记录的字段信息（调试用）
    console.log('\n字段信息示例:');
    for (let i = 0; i < Math.min(3, records.length); i++) {
      console.log(`\n记录 ${i + 1} 的字段:`, Object.keys(records[i].fields));
    }

    // 按账户分组
    const groupName = FEISHU_CONFIG.ACCOUNT_NAME || '默认分组';
    const groupedData = groupByAccount(records, groupName);

    // 限制数量
    let resultData = groupedData;
    if (FEISHU_CONFIG.LIMIT > 0) {
      // 限制每个账户的视频数量
      resultData = groupedData.map((account) => ({
        ...account,
        videos: account.videos.slice(0, FEISHU_CONFIG.LIMIT),
        total_count: Math.min(account.videos.length, FEISHU_CONFIG.LIMIT),
      }));
    }

    // 统计信息
    const totalVideos = resultData.reduce((sum, acc) => sum + acc.videos.length, 0);
    console.log(`\n统计信息:`);
    console.log(`  账户数: ${resultData.length}`);
    console.log(`  视频总数: ${totalVideos}`);

    // 显示每个账户的视频数量
    resultData.forEach((account) => {
      console.log(`  - ${account.username}: ${account.videos.length} 条视频`);
    });

    // 生成输出
    const output = generateTypeScriptOutput(resultData);

    // 写入文件
    const outputPath = './constants/mock_data_from_feishu.ts';

    // 确保目录存在
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, output, 'utf8');
    console.log(`\n成功! 数据已导出到: ${outputPath}`);
    console.log('\n请将生成的代码复制到 constants.ts 中替换 MOCK_API_DATA');

    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n错误:', error.message);
    if (error.response) {
      console.error('API 响应:', error.response.data);
    }
    process.exit(1);
  }
}

// 运行主函数
main();
