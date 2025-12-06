import { LOCAL_API_BASE, MOCK_API_DATA } from "../constants";
import { AccountData, JiKeResponse } from "../types";

interface FetchParams {
  userIds?: string;
  startTime?: string;
  endTime?: string;
  useMock?: boolean;
}

export const fetchPostStatistics = async ({
  userIds,
  startTime,
  endTime,
  useMock = false,
}: FetchParams): Promise<AccountData[]> => {
  console.log("[DEBUG] JikeService: Start Fetching...");
  console.log("[DEBUG] Params:", { userIds, startTime, endTime, useMock });

  if (useMock) {
    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, 1500));
    console.log("[DEBUG] JikeService: Returning Mock Data:", MOCK_API_DATA);
    return MOCK_API_DATA as any;
  }

  const url = new URL(`${LOCAL_API_BASE}/sph/api/post_statistics`);
  if (userIds) url.searchParams.append("user_ids", userIds);
  if (startTime) url.searchParams.append("start_time", startTime);
  if (endTime) url.searchParams.append("end_time", endTime);

  console.log(`[DEBUG] JikeService: Constructed API Request URL: ${url.toString()}`);
  console.log(`[DEBUG] JikeService: Query Params -> user_ids: "${userIds}", start_time: "${startTime}", end_time: "${endTime}"`);

  // 注意：在真实的浏览器环境中，直接调用本地未配置 CORS 的服务可能会失败。
  // 用户需要确保本地服务已正确配置，或通过代理访问。
  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (!response.ok) {
      throw new Error(`API 错误: ${response.status} ${response.statusText}`);
    }

    const json: JiKeResponse<AccountData[]> = await response.json();
    
    console.log("[DEBUG] JikeService: API Response JSON:", json);

    if (json.code !== 200) {
      throw new Error(json.msg || "未知 API 错误");
    }

    return json.data;
  } catch (error) {
    console.error("[DEBUG] JikeService: Error:", error);
    throw error;
  }
};