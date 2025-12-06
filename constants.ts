import { AppConfig } from "./types";

export const DEFAULT_CONFIG: AppConfig = {
  feishuAppId: "",
  feishuAppSecret: "",
  accountTableMapping: {},
};

export const LOCAL_API_BASE = "http://127.0.0.1:9802";

// 演示用的模拟数据
export const MOCK_API_DATA = [
  {
    user_id: 1,
    username: "运营大号_A",
    group_name: "运营矩阵_Main",
    total_count: 5,
    videos: [
      {
        name: "产品发布会 V1",
        createTime: "2023-10-25 10:00",
        create_time: 1698228000,
        readCount: 15200,
        likeCount: 340,
        commentCount: 45,
        forwardCount: 120,
        favCount: 89,
        fullPlayRate: "45.2%",
        avgPlayTimeSec: "12.5秒",
        desc: { description: "发布日视频花絮 #产品" },
        forwardAggregationCount: 200,
      },
      {
        name: "客户成功案例",
        createTime: "2023-10-26 14:00",
        create_time: 1698328800,
        readCount: 8500,
        likeCount: 120,
        commentCount: 10,
        forwardCount: 30,
        favCount: 12,
        fullPlayRate: "60.0%",
        avgPlayTimeSec: "45.0秒",
        desc: { description: "客户证言采访" },
        forwardAggregationCount: 50,
      }
    ]
  },
  {
    user_id: 2,
    username: "日常Vlog_B",
    group_name: "日常Vlog_B",
    total_count: 3,
    videos: [
      {
        name: "晨间日常记录",
        createTime: "2023-10-27 08:00",
        create_time: 1698393600,
        readCount: 45000,
        likeCount: 1200,
        commentCount: 300,
        forwardCount: 500,
        favCount: 400,
        fullPlayRate: "20.5%",
        avgPlayTimeSec: "8.0秒",
        desc: { description: "早安，打工人！" },
        forwardAggregationCount: 800,
      }
    ]
  }
];