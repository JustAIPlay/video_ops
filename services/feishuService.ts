import { VideoItem, AppConfig } from "../types";

// Token caching
let cachedToken: string | null = null;
let tokenExpireAt: number = 0;

async function getAccessToken(appId: string, appSecret: string): Promise<string> {
  if (cachedToken && Date.now() < tokenExpireAt) {
    return cachedToken;
  }

  // Use the proxy path configured in vite.config.ts
  const res = await fetch('/feishu-api/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: appId, app_secret: appSecret })
  });
  
  const data = await res.json();
  if (data.code !== 0) {
    throw new Error(`Get Token Failed: ${data.msg}`);
  }

  cachedToken = data.tenant_access_token;
  // Expire 5 minutes early to be safe
  tokenExpireAt = Date.now() + (data.expire - 300) * 1000;
  return cachedToken;
}

// Cache for resolved base tokens (Wiki Token -> Base Token)
const baseTokenCache = new Map<string, string>();

// Helper to resolve real Base Token from potential Wiki Token
async function resolveBaseToken(originalToken: string, appAccessToken: string): Promise<string> {
    if (baseTokenCache.has(originalToken)) {
        return baseTokenCache.get(originalToken)!;
    }

    try {
        // Try to get node info assuming it's a Wiki Token
        const res = await fetch(`/feishu-api/open-apis/wiki/v2/spaces/get_node?token=${originalToken}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${appAccessToken}` }
        });
        const data = await res.json();

        // If it is a valid Wiki Bitable node
        if (data.code === 0 && data.data && data.data.node && data.data.node.obj_type === 'bitable') {
            const realToken = data.data.node.obj_token;
            baseTokenCache.set(originalToken, realToken);
            return realToken;
        }
    } catch (e) {
        console.warn(`[FeishuService] Failed to check Wiki Token for "${originalToken}", treating as Base Token.`, e);
    }

    // Fallback: Assume it's already a Base Token
    baseTokenCache.set(originalToken, originalToken);
    return originalToken;
}

// Fetch existing records map for an account within a time range to minimize API calls
export const getExistingRecordsMap = async (
  config: AppConfig,
  mappingKey: string,
  accountName: string,
  minTime: number,
  maxTime: number
): Promise<Map<number, Array<{ id: string, desc: string }>>> => {
  const existingMap = new Map<number, Array<{ id: string, desc: string }>>();
  
  const targetConfig = config.accountTableMapping[mappingKey];
  if (!targetConfig || !targetConfig.baseToken || !targetConfig.tableId) {
      return existingMap;
  }

  // Helper to fetch records with specific account field
  const fetchRecords = async (accField: string) => {
    const token = await getAccessToken(config.feishuAppId, config.feishuAppSecret);
    const { baseToken: configBaseToken, tableId } = targetConfig;
    
    // Resolve Base Token (handle Wiki URL case)
    const baseToken = await resolveBaseToken(configBaseToken, token);

    const filter = `CurrentValue.[${accField}]="${accountName}"`;
    
    let pageToken = '';
    let hasMore = true;

    while (hasMore) {
        const queryParams = new URLSearchParams({
            filter: filter,
            field_names: '["发布时间", "内容描述"]',
            sort: '["发布时间 ASC"]',
            page_size: '500'
        });
        if (pageToken) queryParams.append('page_token', pageToken);

        const listUrl = `/feishu-api/open-apis/bitable/v1/apps/${baseToken}/tables/${tableId}/records?${queryParams.toString()}`;
        const res = await fetch(listUrl, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.code !== 0) throw new Error(data.msg);

        if (data.data.items) {
            for (const item of data.data.items) {
                const pubTime = item.fields["发布时间"];
                let pubTimestamp = 0;
                if (typeof pubTime === 'number') {
                    pubTimestamp = pubTime;
                } else if (typeof pubTime === 'string') {
                    const parsed = new Date(pubTime).getTime();
                    if (!isNaN(parsed)) pubTimestamp = parsed;
                }
                if (pubTimestamp > 0 && pubTimestamp >= minTime && pubTimestamp <= maxTime) {
                    // Normalize to minute precision (floor) for matching
                    // This solves the issue where Feishu might store/return time with lower precision (e.g. no seconds)
                    const minuteBucket = Math.floor(pubTimestamp / 60000) * 60000;
                    
                    const recordData = {
                        id: item.record_id,
                        desc: typeof item.fields["内容描述"] === 'string' ? item.fields["内容描述"] : ''
                    };

                    if (!existingMap.has(minuteBucket)) {
                        existingMap.set(minuteBucket, []);
                    }
                    existingMap.get(minuteBucket)?.push(recordData);
                }
            }
        }
        hasMore = data.data.has_more;
        pageToken = data.data.page_token;
    }
  };

  try {
      await fetchRecords("账号");
  } catch (e: any) {
      if (e.message && e.message.includes('FieldNameNotFound')) {
          console.warn('[FeishuService] "账号" field not found, retrying with "帐号"...');
          try { await fetchRecords("帐号"); } catch (err) { console.error("Retry failed", err); }
      } else {
          console.error("[FeishuService] Failed to fetch existing records", e);
      }
  }

  return existingMap;
};

export const syncVideoToFeishu = async (
  video: VideoItem,
  mappingKey: string,
  config: AppConfig,
  logCallback: (msg: string) => void,
  realAccountName?: string,
  groupName?: string,
  existingRecordId?: string // Optional: ID if record exists
): Promise<'created' | 'updated' | 'skipped' | 'error'> => {
  
  // 1. Determine Target Config
  const targetConfig = config.accountTableMapping[mappingKey];
  
  if (!targetConfig || !targetConfig.baseToken || !targetConfig.tableId) {
      console.warn(`[DEBUG] FeishuService: No config found for key "${mappingKey}". Skipped.`);
      logCallback(`[跳过] 配置缺失`);
      return 'skipped';
  }

  const { baseToken: configBaseToken, tableId } = targetConfig;
  const accountNameForLog = realAccountName || mappingKey;
  const fields = mapVideoToFeishuFields(video, accountNameForLog, groupName);
  
  try {
      // 2. Get Tenant Access Token
      const token = await getAccessToken(config.feishuAppId, config.feishuAppSecret);

      // 3. Resolve Base Token (handle Wiki URL case)
      const baseToken = await resolveBaseToken(configBaseToken, token);

      // 4. Create or Update
      if (existingRecordId) {
           // Update existing record: Exclude "内容描述" to prevent overwriting manual edits
           const { "内容描述": _, ...updateFields } = fields;

           const updateUrl = `/feishu-api/open-apis/bitable/v1/apps/${baseToken}/tables/${tableId}/records/${existingRecordId}`;
           const updateRes = await fetch(updateUrl, {
               method: 'PUT',
               headers: { 
                   'Authorization': `Bearer ${token}`,
                   'Content-Type': 'application/json'
               },
               body: JSON.stringify({ fields: updateFields })
           });
           
           const updateData = await updateRes.json();
           if (updateData.code !== 0) {
               throw new Error(`Update Failed: ${updateData.msg}`);
           }
           logCallback(`[更新] 成功`);
           return 'updated';

      } else {
          // Create new record
          const createUrl = `/feishu-api/open-apis/bitable/v1/apps/${baseToken}/tables/${tableId}/records`;
          
          const createRes = await fetch(createUrl, {
              method: 'POST',
              headers: { 
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ fields })
          });
          
          const createData = await createRes.json();
          if (createData.code !== 0) {
              throw new Error(`Create Failed: ${createData.msg}`);
          }
          logCallback(`[新增] 成功`);
          return 'created';
      }

  } catch (e: any) {
      console.error("[DEBUG] FeishuService: Error", e);
      
      // Enhance error message for common issues
      let userMsg = e.message;
      if (userMsg.includes('FieldNameNotFound')) {
          userMsg = "字段名不匹配，请检查多维表格列名是否正确 (如: 动态信息, 账号, 完播率等)";
      } else if (userMsg.includes('DatetimeFieldConvFail')) {
          userMsg = "日期格式转换失败，请检查‘发布时间’列是否为日期类型";
      } else if (userMsg.includes('NumberFieldConvFail')) {
          userMsg = "数字格式转换失败，请检查数值列 (如: 完播率, 播放时长) 类型是否匹配";
      }

      logCallback(`[错误] ${userMsg}`);
      return 'error';
  }
};

export const mapVideoToFeishuFields = (video: VideoItem, accountName: string, groupName?: string) => {
    // Helper to parse numbers from strings like "15.30秒"
    const parseNumber = (val: string | number) => {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        const clean = val.toString().replace(/[^0-9.]/g, '');
        const num = parseFloat(clean);
        return isNaN(num) ? 0 : num;
    };

    // Helper to parse percent from strings like "85.50%" -> 0.855
    const parsePercent = (val: string) => {
        if (!val) return 0;
        const clean = val.toString().replace('%', '');
        const num = parseFloat(clean);
        return isNaN(num) ? 0 : num / 100;
    };

    // Helper for Date -> Timestamp
    // Feishu Date fields prefer timestamp (milliseconds)
    let publishTime: number | null = null;
    if (video.create_time) {
        publishTime = video.create_time * 1000;
    } else {
        const parsed = new Date(video.createTime).getTime();
        if (!isNaN(parsed)) publishTime = parsed;
    }

    return {
      "账号": accountName,
      "发布时间": publishTime,
      "浏览次数": video.readCount,
      "推荐次数": video.favCount, // Mapping favCount to 推荐次数 as best effort
      "评论次数": video.commentCount,
      "分享次数": video.forwardCount,
      "转发聊天和朋友圈": video.forwardAggregationCount,
      "喜欢次数": video.likeCount,
      "完播率": parsePercent(video.fullPlayRate),
      "平均播放时长": parseNumber(video.avgPlayTimeSec),
      // Map Feishu "内容描述" to Jike "动态信息" (video.name)
      "内容描述": video.name,
      // Ignored fields as per user request:
      // "文案编号": "",
      // "剪辑人员": ""
    };
  };

export interface ResearchItem {
  recordId: string;
  order: number;
  accountName: string;
}

export const fetchResearchRecords = async (config: AppConfig): Promise<ResearchItem[]> => {
  const { baseToken, tableId } = config.researchConfig || {};
  if (!baseToken || !tableId) {
    throw new Error("Missing Research Config (Base Token or Table ID)");
  }

  // Use App Token directly as per user instruction (feishu.cn/base/...)
  // But we still need Tenant Access Token to call API
  const token = await getAccessToken(config.feishuAppId, config.feishuAppSecret);

  const items: ResearchItem[] = [];
  let pageToken = '';
  let hasMore = true;

  // Fetch all records
  while (hasMore) {
    const queryParams = new URLSearchParams({
      field_names: '["视频号账号名称", "auto-run"]',
      page_size: '500' 
    });
    // User said "Temporarily do not consider pagination", but loop is safer.
    if (pageToken) queryParams.append('page_token', pageToken);

    // Note: User said "use APP_TOKEN directly... no need to convert Wiki".
    // So we use baseToken directly.
    const listUrl = `/feishu-api/open-apis/bitable/v1/apps/${baseToken}/tables/${tableId}/records?${queryParams.toString()}`;
    
    const res = await fetch(listUrl, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    
    if (data.code !== 0) {
        throw new Error(`Fetch Records Failed: ${data.msg}`);
    }

    if (data.data.items) {
        for (const item of data.data.items) {
            const nameVal = item.fields["视频号账号名称"];
            const autoRunVal = item.fields["auto-run"];
            
            // Filter: If "auto-run" is explicitly "N", skip it.
            if (String(autoRunVal) === 'N') {
                continue;
            }
            
            // Filter invalid data
            if (nameVal) {
                items.push({
                    recordId: item.record_id,
                    order: 0,
                    accountName: String(nameVal)
                });
            }
        }
    }

    hasMore = data.data.has_more;
    pageToken = data.data.page_token;
  }

  // Return items as is (natural order from API, likely creation order or undefined but consistent with record_id)
  return items;
};

export const updateRecordField = async (config: AppConfig, recordId: string, fieldName: string, value: any) => {
    const { baseToken, tableId } = config.researchConfig || {};
    if (!baseToken || !tableId) throw new Error("Missing Config");

    const token = await getAccessToken(config.feishuAppId, config.feishuAppSecret);
    
    const updateUrl = `/feishu-api/open-apis/bitable/v1/apps/${baseToken}/tables/${tableId}/records/${recordId}`;
    const res = await fetch(updateUrl, {
        method: 'PUT',
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            fields: {
                [fieldName]: value
            }
        })
    });
    
    const data = await res.json();
    if (data.code !== 0) {
        throw new Error(`Update Failed: ${data.msg}`);
    }
};