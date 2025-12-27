import { AppConfig } from "./types";

export const DEFAULT_CONFIG: AppConfig = {
  feishuAppId: "",
  feishuAppSecret: "",
  accountTableMapping: {},
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