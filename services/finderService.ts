export interface FinderVideo {
  createtime: number;
  description?: string;
  desc?: { description?: string };
  likeCount?: number;
  like_count?: number;
  favCount?: number;
  fav_count?: number;
  commentCount?: number;
  comment_count?: number;
  forwardCount?: number;
  forward_count?: number;
  readCount?: number;
  read_count?: number;
  // Helper fields for unified access
  displayTitle?: string;
  displayLike?: number; // Points to Like Count
  displayFav?: number;  // Points to Fav Count
  displayComment?: number;
  displayForward?: number;
  displayRead?: number;
  videoUrl?: string;
}

const API_BASE = "/xbotapi";
const GUID = "58e45789-f64d-3216-b4a3-883ce58a7a2d";

// Helper for normalized string comparison
const normalize = (str: string) => str.trim().toLowerCase();

export const searchFinderUser = async (nickname: string): Promise<string | null> => {
  try {
    console.log(`Searching for user: ${nickname}`);
    const response = await fetch(`${API_BASE}/finder/finder_search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guid: GUID,
        query: nickname
      })
    });
    
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    
    const json = await response.json();
    console.log("Search response:", json);
    
    // Handle various possible response structures
    let list: any[] = [];
    if (Array.isArray(json)) {
      list = json;
    } else if (json.infoList && Array.isArray(json.infoList)) {
       list = json.infoList;
    } else if (json.data) {
       if (Array.isArray(json.data)) list = json.data;
       else if (Array.isArray(json.data.list)) list = json.data.list;
       else if (typeof json.data === 'object') list = [json.data];
    }

    // Find exact match by nickname
    const target = list.find((item: any) => {
        const itemNickname = item.contact?.nickname || item.nickname || '';
        return normalize(itemNickname) === normalize(nickname);
    });
    
    if (target) {
        return target.contact?.username || target.username;
    }
    
    return null;
  } catch (error) {
    console.error("Search failed:", error);
    throw error;
  }
};

export const fetchFinderVideos = async (
  username: string, 
  startDate: Date, 
  endDate: Date,
  onProgress?: (count: number) => void,
  targetLikes?: number
): Promise<FinderVideo[]> => {
  let allVideos: FinderVideo[] = [];
  let lastBuffer = '';
  let hasMore = true;
  
    // Convert dates to timestamps (seconds)
    // Start of start date
    const startTs = Math.floor(new Date(startDate.setHours(0, 0, 0, 0)).getTime() / 1000);
    // End of end date
    const endTs = Math.floor(new Date(endDate.setHours(23, 59, 59, 999)).getTime() / 1000);
  
    console.log(`Fetching videos for ${username}`);
    console.log(`Time Range: ${startTs} (${new Date(startTs * 1000).toLocaleString()}) - ${endTs} (${new Date(endTs * 1000).toLocaleString()})`);
  
    while (hasMore) {
      try {
          const response = await fetch(`${API_BASE}/finder/finder_user_page`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  guid: GUID,
                  username: username,
                  last_buffer: lastBuffer
              })
          });
  
          if (!response.ok) {
              console.error(`Fetch page failed: ${response.status}`);
              break;
          }
  
          const json = await response.json();
        console.log("finder_user_page response:", json); // Log the response
        
        let list: any[] = [];
          const data = json.data || {};
          
          if (Array.isArray(json.object)) {
              list = json.object;
          } else if (Array.isArray(json.infoList)) {
              list = json.infoList;
          } else if (Array.isArray(data.list)) {
              list = data.list;
          } else if (Array.isArray(data)) {
              list = data;
          }
          
          if (list.length === 0) {
              hasMore = false;
              break;
          }

          // Map and filter
        // We decide whether to stop fetching based on the LAST item in the list
        // because there might be pinned videos at the top which are old, 
        // but the rest of the list continues chronologically.
        const lastItem = list[list.length - 1];
        const lastItemTime = Number(lastItem.createtime || lastItem.createTime || lastItem.create_time || 0);
        
        if (lastItemTime < startTs && lastItemTime > 0) {
             // If the last item of the page is older than start date, 
             // we assume we have reached the end of the relevant timeline.
             hasMore = false;
        }

        for (const v of list) {
            const createtime = Number(v.createtime || v.createTime || v.create_time || 0);
            
            // If video is newer than end date, skip it
            if (createtime > endTs) continue;
            
            // If video is older than start date, skip it
            if (createtime < startTs) continue;

            // Extract metrics, preferring objectExtend.monotonicData.countInfo if available
            const countInfo = v.objectExtend?.monotonicData?.countInfo || {};
            
            const likeCount = countInfo.likeCount ?? (v.likeCount || v.like_count || 0);
            const favCount = countInfo.favCount ?? (v.favCount || v.fav_count || 0);
            const commentCount = countInfo.commentCount ?? (v.commentCount || v.comment_count || 0);
            const forwardCount = countInfo.forwardCount ?? (v.forwardCount || v.forward_count || 0);
            const readCount = countInfo.readCount ?? (v.readCount || v.read_count || 0);
            
            let videoUrl = '';
            // Try to extract URL from objectDesc per user request
            if (v.objectDesc && typeof v.objectDesc === 'object') {
                const desc = v.objectDesc as any;
                // User specified objectDesc.url
                if (desc.url) {
                    videoUrl = desc.url;
                } 
                // Fallback to media[0].url if not found directly
                else if (desc.media && Array.isArray(desc.media) && desc.media.length > 0) {
                    videoUrl = desc.media[0].url || desc.media[0].fullUrl || '';
                }
            }
            
            // Fallback to internalFeedbackUrl if still empty
            if (!videoUrl) {
                videoUrl = v.internalFeedbackUrl || '';
            }

            // Check target likes if provided (Exact Match)
            // Map "爱心数" to likeCount (Standard mapping)
            if (targetLikes !== undefined && targetLikes >= 0 && likeCount !== targetLikes) {
                continue;
            }

            // In range
            // Handle description from various possible fields
            let title = '无标题';
            if (v.objectDesc) {
                title = typeof v.objectDesc === 'string' ? v.objectDesc : (v.objectDesc.description || '无标题');
            } else if (v.desc) {
                title = v.desc.description || '无标题';
            } else if (v.description) {
                title = v.description;
            }

            allVideos.push({
                createtime: createtime,
                displayTitle: title,
                displayFav: favCount,
                displayLike: likeCount,
                displayComment: commentCount,
                displayForward: forwardCount,
                displayRead: readCount,
                videoUrl: videoUrl
            });
        }
        
        if (onProgress) onProgress(allVideos.length);

        if (!hasMore) {
            // Already stopped by date check
        } else {
             // Check pagination flags
            if (!data.continue_flag && !data.has_more && list.length < 10) { 
                hasMore = false; 
            } else {
                lastBuffer = data.last_buffer;
                // Also check top-level lastBuffer if not in data
                if (!lastBuffer && json.lastBuffer) lastBuffer = json.lastBuffer;
                
                if (!lastBuffer) hasMore = false;
            }
        }
        
        // Safety break to prevent infinite loops in case of API issues
        if (allVideos.length > 5000) hasMore = false;

    } catch (e) {
        console.error("Fetch videos error:", e);
        break;
    }
  }
  
  // Sort by time desc
  return allVideos.sort((a, b) => b.createtime - a.createtime);
};
