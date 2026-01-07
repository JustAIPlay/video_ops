import { AppConfig } from "./types";

// ==================== Agent 默认提示词 ====================

/**
 * 数据分析 Agent 默认提示词
 */
const DEFAULT_DATA_ANALYST_PROMPT = `你是一位资深的视频运营数据分析师，擅长从数据中发现问题和机会。

【你的职责】
1. 客观呈现今日视频数据表现
2. 识别异常数据和值得关注的趋势
3. 用数据和事实支撑你的结论

【输出风格】
- 简洁、专业、数据驱动
- 重点突出，使用 emoji 增强可读性
- 避免主观臆断，一切以数据为依据

【你关注的数据维度】
- 发布量、播放量、互动率、完播率
- 时段表现、账号表现、内容类型表现
- 同比/环比变化

【输出格式要求】
使用 Markdown 格式，分章节输出：
1. 今日概览
2. Top 3 表现
3. 需关注数据
4. 数据洞察`;

/**
 * 排期策略 Agent 默认提示词
 */
const DEFAULT_STRATEGIST_PROMPT = `你是一位专业的视频排期策略专家，擅长优化发布策略以最大化传播效果。

【你的职责】
1. 评估今日排期策略的执行效果
2. 分析不同时段、账号、内容的组合效果
3. 提出可操作的未来排期优化建议

【输出风格】
- 战略性、逻辑清晰、建议具体
- 使用对比和因果关系分析
- 给出可落地的行动建议

【你关注的策略维度】
- 发布时段选择
- 账号发布顺序
- 内容类型搭配
- 发布密度控制

【输出格式要求】
使用 Markdown 格式，分章节输出：
1. 策略执行评估
2. 时段效果分析
3. 内容组合评估
4. 明日排期建议`;

/**
 * 增长黑客 Agent 默认提示词
 */
const DEFAULT_GROWTH_HACKER_PROMPT = `你是一位增长黑客，擅长通过快速实验找到增长突破点。

【你的职责】
1. 从数据中发现反直觉的现象和机会
2. 提出有洞察力的假设
3. 设计可验证的小型实验

【输出风格】
- 创意、启发式、实验驱动
- 敢于提出非常规观点
- 每个建议都是可验证的假设

【你的思维方式】
- 关注异常值和意外成功
- 寻找低成本高回报的实验
- 强调"假设-验证-迭代"的闭环

【输出格式要求】
使用 Markdown 格式，分章节输出：
1. 关键发现
2. 假设生成（H1, H2, H3...）
3. 实验建议
4. 快速行动项`;

/**
 * 总结 Agent 默认提示词
 */
const DEFAULT_SUMMARIZER_PROMPT = `你是复盘会议主持人，负责整合三个 Agent 的意见并生成总结报告。

【你的职责】
1. 提取数据分析、策略、增长三个 Agent 的核心观点
2. 识别最重要的洞察和行动项
3. 生成结构化的总结报告

【输出格式】
返回 JSON 格式：
{
  "keyInsights": ["洞察1", "洞察2", ...],
  "actionItems": [
    {
      "id": "act_1",
      "text": "操作描述",
      "priority": "high" | "medium" | "low",
      "type": "scheduling" | "content" | "experiment" | "general",
      "executable": true | false
    }
  ],
  "hypotheses": ["假设1", "假设2", ...]
}`;

// ==================== 默认配置 ====================

export const DEFAULT_CONFIG: AppConfig = {
  feishuAppId: "",
  feishuAppSecret: "",
  accountTableMapping: {},
  agentPrompts: {
    dataAnalyst: DEFAULT_DATA_ANALYST_PROMPT,
    strategist: DEFAULT_STRATEGIST_PROMPT,
    growthHacker: DEFAULT_GROWTH_HACKER_PROMPT,
    summarizer: DEFAULT_SUMMARIZER_PROMPT,
  },
};

export const LOCAL_API_BASE = "http://127.0.0.1:9802";

// 演示用的模拟数据（从飞书导出，生成时间: 2025/12/27 12:12:35）
// 修改分组名称为 "ai图书" 以匹配飞书配置
export const MOCK_API_DATA = [
  {
    "user_id": 1,
    "username": "多吃饭少生气",
    "group_name": "ai图书",
    "window_name": "多吃饭少生气",
    "platform": "即刻",
    "total_count": 3,
    "videos": [
      {
        "name": "AITSwyx00001",
        "createTime": "2025-12-11 16:07",
        "create_time": 1765440473,
        "url": "",
        "coverUrl": "",
        "readCount": 3826,
        "likeCount": 36,
        "commentCount": 1,
        "forwardCount": 27,
        "forwardAggregationCount": 27,
        "favCount": 44,
        "fullPlayRate": "0.18%",
        "avgPlayTimeSec": "147.52秒",
        "followCount": 0,
        "exportId": "recv5aX81o7ALG",
        "objectId": "recv5aX81o7ALG",
        "visibleType": 0,
        "status": 1,
        "desc": {
          "description": "AITSwyx00001",
          "mediaType": 2,
          "media": [
            {
              "url": "",
              "coverUrl": "",
              "width": 1080,
              "height": 1920,
              "videoPlayLen": 147.52,
              "fileSize": "0"
            }
          ]
        }
      },
      {
        "name": "未命名视频",
        "createTime": "2024-02-09 21:45",
        "create_time": 1707486340,
        "url": "",
        "coverUrl": "",
        "readCount": 257,
        "likeCount": 1,
        "commentCount": 0,
        "forwardCount": 0,
        "forwardAggregationCount": 0,
        "favCount": 0,
        "fullPlayRate": "0.00%",
        "avgPlayTimeSec": "3.21秒",
        "followCount": 0,
        "exportId": "recv5aX8eovJmC",
        "objectId": "recv5aX8eovJmC",
        "visibleType": 0,
        "status": 1,
        "desc": {
          "description": "",
          "mediaType": 2,
          "media": [
            {
              "url": "",
              "coverUrl": "",
              "width": 1080,
              "height": 1920,
              "videoPlayLen": 3.21,
              "fileSize": "0"
            }
          ]
        }
      },
      {
        "name": "AITSwyx00002",
        "createTime": "2025-12-13 17:52",
        "create_time": 1765619526,
        "url": "",
        "coverUrl": "",
        "readCount": 1406,
        "likeCount": 14,
        "commentCount": 2,
        "forwardCount": 4,
        "forwardAggregationCount": 4,
        "favCount": 12,
        "fullPlayRate": "0.14%",
        "avgPlayTimeSec": "56.79秒",
        "followCount": 0,
        "exportId": "recv5hdibMehDG",
        "objectId": "recv5hdibMehDG",
        "visibleType": 0,
        "status": 1,
        "desc": {
          "description": "AITSwyx00002",
          "mediaType": 2,
          "media": [
            {
              "url": "",
              "coverUrl": "",
              "width": 1080,
              "height": 1920,
              "videoPlayLen": 56.79,
              "fileSize": "0"
            }
          ]
        }
      }
    ]
  },
  {
    "user_id": 2,
    "username": "小豪说书",
    "group_name": "ai图书",
    "window_name": "小豪说书",
    "platform": "即刻",
    "total_count": 3,
    "videos": [
      {
        "name": "AITSlyt00001",
        "createTime": "2025-12-12 11:23",
        "create_time": 1765509786,
        "url": "",
        "coverUrl": "",
        "readCount": 1029,
        "likeCount": 15,
        "commentCount": 3,
        "forwardCount": 4,
        "forwardAggregationCount": 4,
        "favCount": 24,
        "fullPlayRate": "0.08%",
        "avgPlayTimeSec": "79.45秒",
        "followCount": 0,
        "exportId": "recv5aX9bdpRtf",
        "objectId": "recv5aX9bdpRtf",
        "visibleType": 0,
        "status": 1,
        "desc": {
          "description": "AITSlyt00001",
          "mediaType": 2,
          "media": [
            {
              "url": "",
              "coverUrl": "",
              "width": 1080,
              "height": 1920,
              "videoPlayLen": 79.45,
              "fileSize": "0"
            }
          ]
        }
      },
      {
        "name": "谁痛苦，谁改变#感悟人生",
        "createTime": "2025-05-15 05:40",
        "create_time": 1747258859,
        "url": "",
        "coverUrl": "",
        "readCount": 745,
        "likeCount": 5,
        "commentCount": 0,
        "forwardCount": 5,
        "forwardAggregationCount": 5,
        "favCount": 5,
        "fullPlayRate": "0.12%",
        "avgPlayTimeSec": "70.14秒",
        "followCount": 0,
        "exportId": "recv5aX9nscEO7",
        "objectId": "recv5aX9nscEO7",
        "visibleType": 0,
        "status": 1,
        "desc": {
          "description": "谁痛苦，谁改变#感悟人生",
          "mediaType": 2,
          "media": [
            {
              "url": "",
              "coverUrl": "",
              "width": 1080,
              "height": 1920,
              "videoPlayLen": 70.14,
              "fileSize": "0"
            }
          ]
        }
      },
      {
        "name": "真正大智慧的女人，都懂得这个道理！#智慧女人#人生感悟",
        "createTime": "2025-05-18 06:13",
        "create_time": 1747520008,
        "url": "",
        "coverUrl": "",
        "readCount": 1435,
        "likeCount": 14,
        "commentCount": 0,
        "forwardCount": 11,
        "forwardAggregationCount": 11,
        "favCount": 7,
        "fullPlayRate": "0.12%",
        "avgPlayTimeSec": "53.59秒",
        "followCount": 0,
        "exportId": "recv5aX9nDNs5f",
        "objectId": "recv5aX9nDNs5f",
        "visibleType": 0,
        "status": 1,
        "desc": {
          "description": "真正大智慧的女人，都懂得这个道理！#智慧女人#人生感悟",
          "mediaType": 2,
          "media": [
            {
              "url": "",
              "coverUrl": "",
              "width": 1080,
              "height": 1920,
              "videoPlayLen": 53.59,
              "fileSize": "0"
            }
          ]
        }
      }
    ]
  },
  {
    "user_id": 3,
    "username": "小豪说书&书在橱窗",
    "group_name": "ai图书",
    "window_name": "小豪说书&书在橱窗",
    "platform": "即刻",
    "total_count": 3,
    "videos": [
      {
        "name": "视频同款书籍点我头像进橱窗带走吧!【美】迈克尔·格雷格/著《救 命》1224009 #健康生活 #科学饮食 #营养学 #生活方式AITSlyt00018救命-1yt",
        "createTime": "2025-12-24 21:40",
        "create_time": 1766583601,
        "url": "",
        "coverUrl": "",
        "readCount": 324,
        "likeCount": 1,
        "commentCount": 0,
        "forwardCount": 4,
        "forwardAggregationCount": 4,
        "favCount": 1,
        "fullPlayRate": "0.15%",
        "avgPlayTimeSec": "78.42秒",
        "followCount": 0,
        "exportId": "recv6jDsSYHc2r",
        "objectId": "recv6jDsSYHc2r",
        "visibleType": 0,
        "status": 1,
        "desc": {
          "description": "视频同款书籍点我头像进橱窗带走吧!【美】迈克尔·格雷格/著《救 命》1224009 #健康生活 #科学饮食 #营养学 #生活方式AITSlyt00018救命-1yt",
          "mediaType": 2,
          "media": [
            {
              "url": "",
              "coverUrl": "",
              "width": 1080,
              "height": 1920,
              "videoPlayLen": 78.42,
              "fileSize": "0"
            }
          ]
        }
      },
      {
        "name": "视频同款书籍点我头像进橱窗带走吧!《抗老生活》完整精读-下（合集2集，更新完结）：《抗炎生活》作者全新力作。 上一集作者一针见血地指出，皮肤只是结果，血管才是原因。 如何让血管更年轻，从而抵抗衰老，本集直接揭晓3大止老指南，每个人都可以轻松上手！看完这个视频，你或许可以省点昂贵的护肤品了！ #血管 #衰老 #抗老 #健康 #年轻 #好书推荐 ☞关注我@小豪说书AITSgm000429抗老生活下",
        "createTime": "2025-12-24 11:01",
        "create_time": 1766545261,
        "url": "",
        "coverUrl": "",
        "readCount": 5562,
        "likeCount": 61,
        "commentCount": 3,
        "forwardCount": 619,
        "forwardAggregationCount": 619,
        "favCount": 109,
        "fullPlayRate": "0.14%",
        "avgPlayTimeSec": "186.36秒",
        "followCount": 0,
        "exportId": "recv6jDsXIQumO",
        "objectId": "recv6jDsXIQumO",
        "visibleType": 0,
        "status": 1,
        "desc": {
          "description": "视频同款书籍点我头像进橱窗带走吧!《抗老生活》完整精读-下（合集2集，更新完结）：《抗炎生活》作者全新力作。 上一集作者一针见血地指出，皮肤只是结果，血管才是原因。 如何让血管更年轻，从而抵抗衰老，本集直接揭晓3大止老指南，每个人都可以轻松上手！看完这个视频，你或许可以省点昂贵的护肤品了！ #血管 #衰老 #抗老 #健康 #年轻 #好书推荐 ☞关注我@小豪说书AITSgm000429抗老生活下",
          "mediaType": 2,
          "media": [
            {
              "url": "",
              "coverUrl": "",
              "width": 1080,
              "height": 1920,
              "videoPlayLen": 186.36,
              "fileSize": "0"
            }
          ]
        }
      },
      {
        "name": "视频同款书籍点我头像进橱窗带走吧!《抗老生活》精读-上（合集总计2集，已更新完结）：我们总以为衰老体现在皮肤的皱纹松弛上，但作者一针见血地指出，皮肤只是结果，血管才是原因。 如何让血管更年轻，从而抵抗衰老，原来藏在这些生活细节中...看完这个视频，你或许可以省点昂贵的护肤品了！ \n\n#血管 #衰老 #抗老 #健康 #年轻 #好书推荐 \n\n☞关注我 ，持续更新AITSgm000428抗老生活上\n",
        "createTime": "2025-12-24 05:19",
        "create_time": 1766524740,
        "url": "",
        "coverUrl": "",
        "readCount": 271263,
        "likeCount": 2023,
        "commentCount": 126,
        "forwardCount": 14201,
        "forwardAggregationCount": 14202,
        "favCount": 2807,
        "fullPlayRate": "0.19%",
        "avgPlayTimeSec": "137.66秒",
        "followCount": 0,
        "exportId": "recv6jDsY4d9fY",
        "objectId": "recv6jDsY4d9fY",
        "visibleType": 0,
        "status": 1,
        "desc": {
          "description": "视频同款书籍点我头像进橱窗带走吧!《抗老生活》精读-上（合集总计2集，已更新完结）：我们总以为衰老体现在皮肤的皱纹松弛上，但作者一针见血地指出，皮肤只是结果，血管才是原因。 如何让血管更年轻，从而抵抗衰老，原来藏在这些生活细节中...看完这个视频，你或许可以省点昂贵的护肤品了！ \n\n#血管 #衰老 #抗老 #健康 #年轻 #好书推荐 \n\n☞关注我 ，持续更新AITSgm000428抗老生活上\n",
          "mediaType": 2,
          "media": [
            {
              "url": "",
              "coverUrl": "",
              "width": 1080,
              "height": 1920,
              "videoPlayLen": 137.66,
              "fileSize": "0"
            }
          ]
        }
      }
    ]
  }
];