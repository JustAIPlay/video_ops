import { VideoItem, AppConfig, ScheduleItem } from "../types";

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


export const fetchScheduleData = async (
  config: AppConfig,
  logCallback: (msg: string) => void
): Promise<ScheduleItem[]> => {
  const allItems: ScheduleItem[] = [];

  const groupNames = Object.keys(config.accountTableMapping);
  logCallback(`开始读取数据，共 ${groupNames.length} 个分组 (仅处理“ai绿植”和“图书”)...`);

  for (const groupName of groupNames) {
    // Filter: Only process allowed groups
    const allowedGroups = ["ai绿植", "图书", "汽车", "家清", "百货"];
    if (!allowedGroups.some(g => groupName.includes(g))) {
      continue;
    }

    const targetConfig = config.accountTableMapping[groupName];
    if (!targetConfig || !targetConfig.baseToken || !targetConfig.tableId) {
      continue;
    }

    // Per-group video count map (Intra-group comparison)
    const videoCountMap = new Map<string, number>();
    // Per-group account today publish count map
    const accountTodayCountMap = new Map<string, number>();

    try {
      logCallback(`正在读取分组: ${groupName}...`);
      const token = await getAccessToken(config.feishuAppId, config.feishuAppSecret);
      const baseToken = await resolveBaseToken(targetConfig.baseToken, token);
      
      // Try to fetch with "视频编号" first, fallback to "文案编号"
      let idField = "视频编号";
      let accountField = "账号";
      let records: any[] = [];
      
      const fetchWithIdField = async (field: string, accField: string) => {
        const collected: any[] = [];
        let pageToken = '';
        let hasMore = true;
        
        // Safety break
        let pageCount = 0;
        const MAX_PAGES = 20; // Limit to prevent infinite loops

        while (hasMore && pageCount < MAX_PAGES) {
          pageCount++;
          const queryParams = new URLSearchParams({
            field_names: JSON.stringify([field, "内容描述", "浏览次数", "发布时间", accField]),
            page_size: '500' // Max page size
          });
          if (pageToken) queryParams.append('page_token', pageToken);

          const listUrl = `/feishu-api/open-apis/bitable/v1/apps/${baseToken}/tables/${targetConfig.tableId}/records?${queryParams.toString()}`;
          
          console.log(`[DEBUG] Fetching records for group: ${groupName}`);
          console.log(`[DEBUG] Request URL: ${listUrl}`);
          
          const res = await fetch(listUrl, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          
          console.log(`[DEBUG] Response for ${groupName} (field: ${field}):`, data);
          if (data.data && data.data.items && data.data.items.length > 0) {
            console.log(`[DEBUG] Available fields for group ${groupName}:`, Object.keys(data.data.items[0].fields));
          }

          if (data.code !== 0) {
             console.error(`[DEBUG] Error response for ${groupName}:`, data);
             throw new Error(data.msg);
          }

          if (data.data.items) {
            collected.push(...data.data.items);
          }
          hasMore = data.data.has_more;
          pageToken = data.data.page_token;
        }
        console.log(`[DEBUG] Finished fetching group ${groupName}. Total records: ${collected.length}`);
        return collected;
      };

      try {
        records = await fetchWithIdField("视频编号", "账号");
      } catch (e: any) {
        const errMsg = e.message || "";
        if (errMsg.includes('FieldNameNotFound')) {
            if (errMsg.includes('账号')) {
                logCallback(`[提示] 分组 ${groupName} 未找到"账号"字段，尝试使用"帐号"...`);
                accountField = "帐号";
                try {
                    records = await fetchWithIdField("视频编号", "帐号");
                } catch (e2: any) {
                     if (e2.message && e2.message.includes('FieldNameNotFound') && e2.message.includes('视频编号')) {
                         logCallback(`[提示] 分组 ${groupName} 未找到"视频编号"字段，尝试使用"文案编号"...`);
                         idField = "文案编号";
                         records = await fetchWithIdField("文案编号", "帐号");
                     } else {
                         throw e2;
                     }
                }
            } else if (errMsg.includes('视频编号')) {
                logCallback(`[提示] 分组 ${groupName} 未找到"视频编号"字段，尝试使用"文案编号"...`);
                idField = "文案编号";
                records = await fetchWithIdField("文案编号", "账号");
            } else {
                throw e;
            }
        } else {
           throw e;
        }
      }
      
      console.log(`[DEBUG] Group ${groupName} - Total records fetched: ${records.length}`);

      // First pass: Calculate repetition counts and account today publish counts
      let validIdCount = 0;
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      for (const record of records) {
          const fields = record.fields;
          const videoId = fields[idField];
          
          // Helper to safely extract string value
          const extractValue = (val: any): string => {
             if (!val) return "";
             if (typeof val === 'string') return val;
             if (typeof val === 'number') return String(val);
             if (Array.isArray(val)) {
                 return val.length > 0 ? extractValue(val[0]) : "";
             }
             if (typeof val === 'object') {
                 return val.text || val.value || val.link || JSON.stringify(val);
             }
             return String(val);
          };

          if (videoId) {
            const vIdStr = extractValue(videoId);
            videoCountMap.set(vIdStr, (videoCountMap.get(vIdStr) || 0) + 1);
            validIdCount++;
          }
          
          // Calculate Account Today Publish Count
          const accountName = extractValue(fields[accountField]);
          const pubTime = fields["发布时间"];
          let pubTimestamp = 0;
          if (typeof pubTime === 'number') {
              pubTimestamp = pubTime;
          } else if (typeof pubTime === 'string') {
              const parsed = new Date(pubTime).getTime();
              if (!isNaN(parsed)) pubTimestamp = parsed;
          }

          if (accountName && pubTimestamp >= todayStart.getTime() && pubTimestamp <= todayEnd.getTime()) {
              accountTodayCountMap.set(accountName, (accountTodayCountMap.get(accountName) || 0) + 1);
          }
      }
      console.log(`[DEBUG] Group ${groupName} - Records with valid ID: ${validIdCount}`);

      // Second pass: Filter and Add items
      let passedFilterCount = 0;
      let rejectedByViews = 0;
      let rejectedByRepeat = 0;

      for (const record of records) {
        const fields = record.fields;
        const videoId = fields[idField];
        
        // Skip if videoId is missing
        if (!videoId) continue;
        
          // Helper (duplicated for scope, could be hoisted)
          const extractValue = (val: any): string => {
             if (!val) return "";
             if (typeof val === 'string') return val;
             if (typeof val === 'number') return String(val);
             if (Array.isArray(val)) {
                 return val.length > 0 ? extractValue(val[0]) : "";
             }
             if (typeof val === 'object') {
                 return val.text || val.value || val.link || JSON.stringify(val);
             }
             return String(val);
          };

          const extractNumber = (val: any): number => {
            if (val === null || val === undefined) return 0;
            if (typeof val === 'number') return val;
            if (typeof val === 'string') return parseFloat(val) || 0;
            if (Array.isArray(val)) {
                return val.length > 0 ? extractNumber(val[0]) : 0;
            }
            if (typeof val === 'object') {
                // Handle lookup/formula objects commonly found in Feishu
                const inner = val.value || val.text || val.link;
                if (inner) return extractNumber(inner);
            }
            return 0;
          };

        const vIdStr = extractValue(videoId);
        const repeatCount = videoCountMap.get(vIdStr) || 0;
        const readCount = extractNumber(fields["浏览次数"]);
        const accountName = extractValue(fields[accountField]);
        const accountTodayCount = accountTodayCountMap.get(accountName) || 0;


        
        // console.log(`[DEBUG] Processing item: ${vIdStr}, readCountRaw: ${JSON.stringify(fields["浏览次数"])}, readCountParsed: ${readCount}, repeatCount: ${repeatCount}`);

        // Apply Filtering Rules Immediately
        // Rule: readCount >= 1000 AND repeatCount < 3
        if (readCount >= 1000 && repeatCount < 3) {
            allItems.push({
                id: record.record_id,
                videoId: vIdStr,
                description: fields["内容描述"] || "",
                readCount: readCount,
                groupName: groupName,
                publishTime: fields["发布时间"], 
                repeatCount: repeatCount, 
                url: "",
                accountName: accountName,
                accountTodayCount: accountTodayCount
            });
            passedFilterCount++;
        } else {
            if (readCount < 1000) rejectedByViews++;
            else if (repeatCount >= 3) rejectedByRepeat++;
        }
      }
      console.log(`[DEBUG] Group ${groupName} - Records passed: ${passedFilterCount}, Rejected by Views(<1000): ${rejectedByViews}, Rejected by Repeat(>=3): ${rejectedByRepeat}`);
      logCallback(`[统计] 分组 ${groupName}: 筛选通过 ${passedFilterCount} 条 (浏览量不足: ${rejectedByViews}, 重复过多: ${rejectedByRepeat})`);

    } catch (e: any) {
      console.error(`Error fetching group ${groupName}:`, e);
      logCallback(`[错误] 读取分组 ${groupName} 失败: ${e.message}`);
    }
  }

  // Sort by readCount descending (highest views first)
  allItems.sort((a, b) => b.readCount - a.readCount);

  // Deduplicate logic
  // For "ai绿植", "图书": Keep only the first occurrence (highest readCount) for each videoId within the same group
  // For "汽车", "家清", "百货": Do NOT deduplicate, keep all records
  const uniqueItems: ScheduleItem[] = [];
  const seenForDedupeGroups = new Set<string>();
  const dedupeGroups = ["ai绿植", "图书"];

  for (const item of allItems) {
    const shouldDedupe = dedupeGroups.some(g => item.groupName.includes(g));
    
    if (shouldDedupe) {
        const key = `${item.groupName}-${item.videoId}`;
        if (!seenForDedupeGroups.has(key)) {
            seenForDedupeGroups.add(key);
            uniqueItems.push(item);
        }
    } else {
        // For other groups (汽车, 家清, 百货), always add
        uniqueItems.push(item);
    }
  }

  logCallback(`筛选完成，共找到 ${uniqueItems.length} 条符合排期条件的视频。`);
  return uniqueItems;
};