import DOMPurify from 'dompurify';

/**
 * 清理 HTML，防止 XSS 攻擊
 */
export const sanitizeHtml = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br'],
    ALLOWED_ATTR: ['href', 'target'],
  });
};

/**
 * 轉義 HTML 特殊字符
 */
export const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
};

/**
 * 驗證並清理用戶輸入
 */
export const sanitizeInput = (input: string): string => {
  // 移除 NULL 字符（使用 Unicode escape 避免 no-control-regex）
  // eslint-disable-next-line no-control-regex -- intentional: strip null bytes and control chars
  let sanitized = input.replace(/\u0000/g, '');

  // 移除控制字符（除了換行和 Tab）
  // eslint-disable-next-line no-control-regex -- intentional: strip control characters
  sanitized = sanitized.replace(/[\u0000-\u001F\u007F-\u009F]/g, (char) => {
    return char === '\n' || char === '\t' ? char : '';
  });

  return sanitized.trim();
};
