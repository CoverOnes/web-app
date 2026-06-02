import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek } from 'date-fns';
import { zhTW } from 'date-fns/locale';

/**
 * 格式化訊息時間（用於聊天室列表）
 */
export const formatMessageTime = (timestamp: number): string => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp * 1000); // Unix timestamp 轉換
  
  // 今天：只顯示時間
  if (isToday(date)) {
    return format(date, 'HH:mm', { locale: zhTW });
  }
  
  // 昨天
  if (isYesterday(date)) {
    return '昨天';
  }
  
  // 一週內：顯示星期
  if (isThisWeek(date)) {
    const days = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
    return days[date.getDay()];
  }
  
  // 超過一週：顯示日期
  return format(date, 'M/d', { locale: zhTW });
};

/**
 * 格式化完整時間（用於訊息詳情）
 */
export const formatFullTime = (timestamp: number): string => {
  if (!timestamp) return '';
  const date = new Date(timestamp * 1000);
  return format(date, 'yyyy/MM/dd HH:mm:ss', { locale: zhTW });
};

/**
 * 格式化相對時間
 */
export const formatRelativeTime = (timestamp: number): string => {
  if (!timestamp) return '';
  const date = new Date(timestamp * 1000);
  return formatDistanceToNow(date, { addSuffix: true, locale: zhTW });
};

/**
 * 獲取顯示名稱的首字母（用於頭像）
 */
export const getInitials = (name: string): string => {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
};

/**
 * 獲取用戶顯示名稱
 */
export const getDisplayName = (userId: string): string => {
  // 用戶列表
  const users: Record<string, string> = {
    'user_alice': 'Alice',
    'user_bob': 'Bob',
    'user_charlie': 'Charlie',
    'user_david': 'David',
    'user_emma': 'Emma',
    'user_frank': 'Frank',
    'user_grace': 'Grace',
  };
  
  // 先查表，找不到再用原始邏輯
  if (users[userId]) {
    return users[userId];
  }
  
  // 移除 user_ 前綴並首字母大寫
  return userId.replace('user_', '').replace(/^./, (char) => char.toUpperCase());
};

/**
 * 根據用戶 ID 生成固定的頭像顏色（彩虹七色）
 */
export const getAvatarColor = (userId: string): string => {
  const colors = [
    '#FF4444', // 紅
    '#FF8800', // 橙
    '#FFDD00', // 黃
    '#44DD44', // 綠
    '#4488FF', // 藍
    '#8844FF', // 靛
    '#DD44DD', // 紫
  ];
  
  // 使用簡單的哈希函數根據 userId 選擇顏色
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

