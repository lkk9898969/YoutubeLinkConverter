// 功能 1: 複製乾淨的 YouTube 連結
// 在右鍵選單上創建選項
// MV3 的背景腳本不會在瀏覽器啟動時自動執行，所以要監聽 onInstalled / onStartup
// 事件來喚醒它並建立選單，否則重開瀏覽器後必須先點擴充功能圖示才會出現選單
function createContextMenu() {
  // 先清除舊的選單，避免重複 id 錯誤
  browser.contextMenus.removeAll().then(() => {
    browser.contextMenus.create({
      id: "copy-clean-youtube-link",
      title: "複製乾淨的 YouTube 連結",
      contexts: ["link"],
      targetUrlPatterns: [
        "*://www.youtube.com/watch?v=*",
        "*://youtube.com/watch?v=*",
        "*://m.youtube.com/watch?v=*"
      ]
    });
  });
}

browser.runtime.onInstalled.addListener(createContextMenu);
browser.runtime.onStartup.addListener(createContextMenu);

// 監聽右鍵選單點擊事件
browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "copy-clean-youtube-link") {
    const originalUrl = info.linkUrl;
    const cleanUrl = cleanYouTubeUrl(originalUrl);
    
    // 複製到剪貼簿
    copyToClipboard(cleanUrl);
    
    // 可選：通知用戶
    console.log(`已複製乾淨連結: ${cleanUrl}`);
  }
});

// 清理 YouTube URL，只保留影片 ID
function cleanYouTubeUrl(url) {
  try {
    const urlObj = new URL(url);
    const videoId = urlObj.searchParams.get('v');
    
    if (videoId) {
      // 只保留影片 ID，移除所有其他參數
      return `https://www.youtube.com/watch?v=${videoId}`;
    }
    
    return url; // 如果無法解析，返回原始 URL
  } catch (e) {
    console.error('URL 解析錯誤:', e);
    return url;
  }
}

// 複製文字到剪貼簿
function copyToClipboard(text) {
  // 使用 clipboard API
  navigator.clipboard.writeText(text).then(() => {
    console.log('成功複製到剪貼簿');
  }).catch(err => {
    console.error('複製失敗:', err);
  });
}

// 功能 2: 點擊擴充功能圖標，將 Shorts 轉換為普通影片頁面
browser.action.onClicked.addListener((tab) => {
  const url = tab.url;
  
  // 檢查是否為 YouTube Shorts 頁面
  if (url && url.includes('youtube.com/shorts/')) {
    const videoId = extractShortsVideoId(url);
    
    if (videoId) {
      const normalUrl = `https://www.youtube.com/watch?v=${videoId}`;
      
      // 導向普通影片頁面
      browser.tabs.update(tab.id, {
        url: normalUrl
      });
      
      console.log(`已轉換 Shorts 為普通影片: ${normalUrl}`);
    }
  } else {
    console.log('當前頁面不是 YouTube Shorts');
  }
});

// 從 Shorts URL 提取影片 ID
function extractShortsVideoId(url) {
  try {
    // 格式: https://www.youtube.com/shorts/VIDEO_ID 或可能帶有參數
    const match = url.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  } catch (e) {
    console.error('提取影片 ID 錯誤:', e);
    return null;
  }
}
