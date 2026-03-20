// hooks/useNetworkStatus.ts
import { useState, useEffect } from 'react';

/**
 * 网络状态 Hook
 * 监听浏览器的在线/离线状态，并提供当前网络状态
 * 
 * @returns isOnline - 当前是否在线
 */
export const useNetworkStatus = () => {
  // 初始化状态为浏览器当前的在线状态
  const [isOnline, setIsOnline] = useState(() => {
    // 服务端渲染时默认为 true，避免水合不匹配
    if (typeof window === 'undefined') return true;
    return navigator.onLine;
  });

  useEffect(() => {
    // 仅在客户端运行
    if (typeof window === 'undefined') return;

    // 监听浏览器原生的在线/离线事件
    window.addEventListener('online', () => {setIsOnline(true)});
    window.addEventListener('offline', () => {setIsOnline(false)});

    // 可选：定期心跳检测，验证真实网络连接状态
    // 因为 navigator.onLine 有时不准确（如连接到无互联网的WiFi）
    const heartbeatInterval = setInterval(async () => {
      try {
        // 尝试发起一个轻量级请求检测网络连通性
        // 使用 HEAD 请求减少数据传输
        const response = await fetch('/api/ping', { 
          method: 'HEAD',
          cache: 'no-cache',
          signal: AbortSignal.timeout(5000) // 5秒超时
        });
        
        if (response.ok && !isOnline) {
          console.log('🌐 心跳检测：网络已恢复');
          setIsOnline(true);
        }
      } catch (error) {
        // 请求失败，可能是离线
        if (isOnline) {
          console.log('📴 心跳检测：网络连接失败');
          setIsOnline(false);
        }
      }
    }, 5000); // 每 5 秒检测一次

    // 清理函数
    return () => {
      window.removeEventListener('online', () => {setIsOnline(true)});
      window.removeEventListener('offline', () => {setIsOnline(false)});
      clearInterval(heartbeatInterval);
    };
  }, [isOnline]);

  return isOnline;
};
