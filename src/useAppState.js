import { useState, useEffect, useRef } from 'react';
import { DEFAULT_CONFIG, createInitialRoutesState } from './data';
import { supabase, isSupabaseConfigured } from './supabase';

const getTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const useAppState = () => {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [routes, setRoutes] = useState(() => createInitialRoutesState(DEFAULT_CONFIG.routes));
  const [historyLogs, setHistoryLogs] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const channelRef = useRef(null);

  // 1. 初始化資料與即時同步
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      // 🚀 Supabase Realtime 雲端同步模式
      const today = getTodayStr();

      // (1) 讀取初始 app_state
      const fetchInitialState = async () => {
        try {
          const { data, error } = await supabase
            .from('app_state')
            .select('*')
            .eq('id', 'main')
            .single();

          if (data && !error) {
            if (data.config) setConfig(data.config);
            
            // 換日自動重置當日狀態
            if (data.last_reset_date !== today) {
              const freshRoutes = createInitialRoutesState(data.config || DEFAULT_CONFIG.routes);
              setRoutes(freshRoutes);
              await supabase.from('app_state').update({
                today_routes: freshRoutes,
                last_reset_date: today,
                updated_at: new Date().toISOString()
              }).eq('id', 'main');
            } else if (data.today_routes) {
              setRoutes(data.today_routes);
            }
          } else {
            // 初始化首筆資料
            const initialRoutes = createInitialRoutesState(DEFAULT_CONFIG.routes);
            await supabase.from('app_state').upsert({
              id: 'main',
              config: DEFAULT_CONFIG,
              today_routes: initialRoutes,
              last_reset_date: today,
              updated_at: new Date().toISOString()
            });
            setConfig(DEFAULT_CONFIG);
            setRoutes(initialRoutes);
          }
        } catch (err) {
          console.error("Supabase initial state error:", err);
        }
      };

      // (2) 讀取初始 history_logs
      const fetchInitialLogs = async () => {
        try {
          const { data, error } = await supabase
            .from('history_logs')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(500);

          if (data && !error) {
            setHistoryLogs(data);
          }
        } catch (err) {
          console.error("Supabase initial logs error:", err);
        } finally {
          setIsLoaded(true);
        }
      };

      fetchInitialState();
      fetchInitialLogs();

      // (3) 建立 Supabase Realtime 即時推播頻道
      const channel = supabase
        .channel('warehouse_realtime_room')
        // 監聽 app_state 資料庫變更
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'app_state' },
          (payload) => {
            const newRecord = payload.new;
            if (newRecord) {
              if (newRecord.config) setConfig(newRecord.config);
              if (newRecord.today_routes) setRoutes(newRecord.today_routes);
            }
          }
        )
        // 監聽 history_logs 新增紀錄
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'history_logs' },
          (payload) => {
            const newLog = payload.new;
            if (newLog) {
              setHistoryLogs((prev) => {
                if (prev.some(l => l.id === newLog.id)) return prev;
                return [newLog, ...prev];
              });
            }
          }
        )
        // 廣播極速推播頻道 (Broadcast Channel for <20ms instant response)
        .on('broadcast', { event: 'ROUTE_CHANGED' }, ({ payload }) => {
          if (payload && payload.routes) {
            setRoutes(payload.routes);
          }
        })
        .subscribe();

      channelRef.current = channel;

      return () => {
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
        }
      };
    } else {
      // 💻 本機 LocalStorage 模式
      const today = getTodayStr();
      const savedDate = localStorage.getItem('lastResetDate');

      // 讀取設定
      const savedConfig = localStorage.getItem('app_config');
      let currentConfig = DEFAULT_CONFIG;
      if (savedConfig) {
        try {
          currentConfig = JSON.parse(savedConfig);
          setConfig(currentConfig);
        } catch (e) {
          console.error("Failed to parse saved config", e);
        }
      }

      // 讀取歷史紀錄
      const savedLogs = localStorage.getItem('app_history_logs');
      if (savedLogs) {
        try {
          setHistoryLogs(JSON.parse(savedLogs));
        } catch (e) {
          console.error("Failed to parse logs", e);
        }
      }

      // 讀取當日路線狀態
      if (savedDate !== today) {
        localStorage.setItem('lastResetDate', today);
        const freshRoutes = createInitialRoutesState(currentConfig.routes);
        localStorage.setItem('app_today_routes', JSON.stringify(freshRoutes));
        setRoutes(freshRoutes);
      } else {
        const savedRoutes = localStorage.getItem('app_today_routes');
        if (savedRoutes) {
          try {
            setRoutes(JSON.parse(savedRoutes));
          } catch (e) {
            setRoutes(createInitialRoutesState(currentConfig.routes));
          }
        } else {
          const freshRoutes = createInitialRoutesState(currentConfig.routes);
          setRoutes(freshRoutes);
        }
      }
      setIsLoaded(true);

      const handleStorageChange = (e) => {
        if (e.key === 'app_config' && e.newValue) {
          setConfig(JSON.parse(e.newValue));
        }
        if (e.key === 'app_today_routes' && e.newValue) {
          setRoutes(JSON.parse(e.newValue));
        }
        if (e.key === 'app_history_logs' && e.newValue) {
          setHistoryLogs(JSON.parse(e.newValue));
        }
      };
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, []);

  // 更新系統配置 (人員 / 路線 / 組別)
  const updateConfig = async (newConfig) => {
    setConfig(newConfig);
    if (isSupabaseConfigured && supabase) {
      await supabase.from('app_state').update({
        config: newConfig,
        updated_at: new Date().toISOString()
      }).eq('id', 'main');
    } else {
      localStorage.setItem('app_config', JSON.stringify(newConfig));
    }
  };

  // 重置配置為預設值
  const resetConfigToDefault = () => {
    updateConfig(DEFAULT_CONFIG);
  };

  // 更新路線狀態 (分秤 / 拉料 / 客服印單)
  const updateRoute = async (shift, routeName, key, value, userName, roleName, groupName = '') => {
    const now = new Date();
    const dateStr = getTodayStr();
    const timeStr = now.toLocaleTimeString('zh-TW', { hour12: false });
    const timestamp = now.getTime();
    const storedValue = value ? timeStr : false;
    const shiftName = shift === 'morning' ? '上午' : '下午';

    const newRoutes = {
      ...routes,
      [shift]: {
        ...(routes[shift] || {}),
        [routeName]: {
          ...((routes[shift] && routes[shift][routeName]) || { sorter: false, puller: false, printed: false }),
          [key]: storedValue
        }
      }
    };

    setRoutes(newRoutes);

    const logEntry = {
      id: `log_${timestamp}_${Math.random().toString(36).substr(2, 5)}`,
      date: dateStr,
      time: timeStr,
      timestamp,
      shift,
      shift_name: shiftName,
      shiftName: shiftName,
      route_name: routeName,
      routeName: routeName,
      role: key,
      role_name: roleName,
      roleName: roleName,
      group_name: groupName || '-',
      groupName: groupName || '-',
      user_name: userName,
      userName: userName,
      action: 'completed',
      message: `[${shiftName}] ${routeName} 路線的 [${roleName}] 狀態已被 ${userName} 標示為完成`
    };

    if (value === true) {
      setHistoryLogs(prev => [logEntry, ...prev]);
    }

    if (isSupabaseConfigured && supabase) {
      // 🚀 寫入 Supabase & 廣播推播
      try {
        await supabase.from('app_state').update({
          today_routes: newRoutes,
          updated_at: new Date().toISOString()
        }).eq('id', 'main');

        if (value === true) {
          await supabase.from('history_logs').insert([logEntry]);
        }

        // 廣播給所有連線客戶端
        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'ROUTE_CHANGED',
            payload: { routes: newRoutes }
          });
        }
      } catch (err) {
        console.error("Supabase update error:", err);
      }
    } else {
      // 💻 LocalStorage 模式
      localStorage.setItem('app_today_routes', JSON.stringify(newRoutes));
      if (value === true) {
        const savedLogs = JSON.parse(localStorage.getItem('app_history_logs') || '[]');
        localStorage.setItem('app_history_logs', JSON.stringify([logEntry, ...savedLogs]));
      }
    }
  };

  // 當日全部重置
  const resetTodayRoutes = async () => {
    const fresh = createInitialRoutesState(config.routes);
    setRoutes(fresh);
    if (isSupabaseConfigured && supabase) {
      await supabase.from('app_state').update({
        today_routes: fresh,
        updated_at: new Date().toISOString()
      }).eq('id', 'main');
    } else {
      localStorage.setItem('app_today_routes', JSON.stringify(fresh));
    }
  };

  // 清空所有歷史紀錄
  const clearHistoryLogs = async () => {
    setHistoryLogs([]);
    if (isSupabaseConfigured && supabase) {
      await supabase.from('history_logs').delete().neq('id', '');
    } else {
      localStorage.setItem('app_history_logs', JSON.stringify([]));
    }
  };

  return {
    config,
    updateConfig,
    resetConfigToDefault,
    routes,
    updateRoute,
    resetTodayRoutes,
    historyLogs,
    clearHistoryLogs,
    isLoaded
  };
};
