import React, { useState, useEffect } from 'react';
import { ArrowLeft, Maximize2, Minimize2, Sun, Moon, Layers, CheckCircle2, Circle, Clock, Activity, Shield } from 'lucide-react';

export default function MonitorScreen({ config, routes, historyLogs, onBack }) {
  const [activeShift, setActiveShift] = useState('all'); // 'all' | 'morning' | 'afternoon'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('zh-TW', { hour12: false }));

  // 即時時鐘
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('zh-TW', { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 全螢幕切換
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  // 取得當前檢視的所有路線列表
  const displayedRoutes = [];
  if (activeShift === 'all' || activeShift === 'morning') {
    const morningList = (config.routes.morning || []).filter(r => r.active);
    morningList.forEach(r => {
      displayedRoutes.push({
        ...r,
        shift: 'morning',
        shiftName: '上午',
        data: (routes.morning && routes.morning[r.name]) || { sorter: false, puller: false, printed: false }
      });
    });
  }
  if (activeShift === 'all' || activeShift === 'afternoon') {
    const afternoonList = (config.routes.afternoon || []).filter(r => r.active);
    afternoonList.forEach(r => {
      displayedRoutes.push({
        ...r,
        shift: 'afternoon',
        shiftName: '下午',
        data: (routes.afternoon && routes.afternoon[r.name]) || { sorter: false, puller: false, printed: false }
      });
    });
  }

  // 計算各項完成率
  const totalRoutesCount = displayedRoutes.length;
  const sorterDoneCount = displayedRoutes.filter(r => !!r.data.sorter).length;
  const pullerDoneCount = displayedRoutes.filter(r => !!r.data.puller).length;
  const printedDoneCount = displayedRoutes.filter(r => !!r.data.printed).length;

  const sorterPct = totalRoutesCount > 0 ? Math.round((sorterDoneCount / totalRoutesCount) * 100) : 0;
  const pullerPct = totalRoutesCount > 0 ? Math.round((pullerDoneCount / totalRoutesCount) * 100) : 0;
  const printedPct = totalRoutesCount > 0 ? Math.round((printedDoneCount / totalRoutesCount) * 100) : 0;

  // 今日最新 20 筆紀錄
  const recentLogs = historyLogs.slice(0, 20);

  return (
    <div className="monitor-container">
      {/* 頂部看板列 */}
      <header className="monitor-header">
        <div className="monitor-brand">
          <button onClick={onBack} className="btn-back-monitor" title="返回登入首頁">
            <ArrowLeft size={18} /> 返回首頁
          </button>
          <div className="monitor-title-box">
            <h1>理貨現場即時進度監控看板</h1>
            <span className="readonly-tag"><Shield size={12} /> 唯讀監控模式</span>
          </div>
        </div>

        {/* 時段切換分頁 */}
        <div className="monitor-shift-tabs">
          <button
            className={`m-tab-btn ${activeShift === 'all' ? 'active' : ''}`}
            onClick={() => setActiveShift('all')}
          >
            <Layers size={14} /> 全日總覽 ({displayedRoutes.length})
          </button>
          <button
            className={`m-tab-btn ${activeShift === 'morning' ? 'active' : ''}`}
            onClick={() => setActiveShift('morning')}
          >
            <Sun size={14} /> 上午路線 ({(config.routes.morning || []).filter(r => r.active).length})
          </button>
          <button
            className={`m-tab-btn ${activeShift === 'afternoon' ? 'active' : ''}`}
            onClick={() => setActiveShift('afternoon')}
          >
            <Moon size={14} /> 下午路線 ({(config.routes.afternoon || []).filter(r => r.active).length})
          </button>
        </div>

        {/* 狀態與全螢幕按鈕 */}
        <div className="monitor-right-box">
          <div className="live-clock">
            <Clock size={16} />
            <span>{currentTime}</span>
          </div>
          <button onClick={toggleFullscreen} className="btn-fullscreen" title="全螢幕切換">
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </header>

      {/* 總體進度進度條卡片 */}
      <div className="progress-overview-grid">
        <div className="progress-stat-card sorter-card">
          <div className="p-card-top">
            <span className="p-title">⚖️ 分秤完成進度</span>
            <span className="p-numbers"><strong>{sorterDoneCount}</strong> / {totalRoutesCount} 條</span>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill sorter-fill" style={{ width: `${sorterPct}%` }}></div>
          </div>
          <div className="p-pct-text">{sorterPct}% 已完成</div>
        </div>

        <div className="progress-stat-card puller-card">
          <div className="p-card-top">
            <span className="p-title">📦 拉料完成進度</span>
            <span className="p-numbers"><strong>{pullerDoneCount}</strong> / {totalRoutesCount} 條</span>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill puller-fill" style={{ width: `${pullerPct}%` }}></div>
          </div>
          <div className="p-pct-text">{pullerPct}% 已完成</div>
        </div>

        <div className="progress-stat-card print-card">
          <div className="p-card-top">
            <span className="p-title">🖨️ 客服印單進度</span>
            <span className="p-numbers"><strong>{printedDoneCount}</strong> / {totalRoutesCount} 條</span>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill print-fill" style={{ width: `${printedPct}%` }}></div>
          </div>
          <div className="p-pct-text">{printedPct}% 已完成</div>
        </div>
      </div>

      {/* 核心主體：左側狀態矩陣牆 + 右側即時動態 */}
      <div className="monitor-layout">
        {/* 左側：路線矩陣狀態牆 */}
        <div className="monitor-matrix-section">
          <div className="matrix-grid">
            {displayedRoutes.map(item => {
              const { name, shift, shiftName, data } = item;
              const isAllDone = data.sorter && data.puller && data.printed;

              return (
                <div key={`${shift}_${name}`} className={`matrix-card ${isAllDone ? 'card-all-done' : ''}`}>
                  <div className="matrix-card-header">
                    <span className="matrix-route-name">{name}</span>
                    {activeShift === 'all' && (
                      <span className={`matrix-shift-tag ${shift}`}>{shiftName}</span>
                    )}
                  </div>

                  <div className="matrix-status-rows">
                    {/* 分秤狀態 */}
                    <div className={`status-pill ${data.sorter ? 'done' : 'pending'}`}>
                      <span className="pill-label">分秤</span>
                      <span className="pill-value">
                        {data.sorter ? data.sorter : '待處理'}
                      </span>
                    </div>

                    {/* 拉料狀態 */}
                    <div className={`status-pill ${data.puller ? 'done' : 'pending'}`}>
                      <span className="pill-label">拉料</span>
                      <span className="pill-value">
                        {data.puller ? data.puller : '待處理'}
                      </span>
                    </div>

                    {/* 印單狀態 */}
                    <div className={`status-pill print-pill ${data.printed ? 'done' : 'pending'}`}>
                      <span className="pill-label">印單</span>
                      <span className="pill-value">
                        {data.printed ? data.printed : '未印單'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 右側：即時操作日誌廣播 */}
        <aside className="monitor-feed-section">
          <div className="feed-header">
            <Activity size={16} />
            <h3>即時作業動態</h3>
          </div>
          <div className="feed-list">
            {recentLogs.length === 0 ? (
              <div className="feed-empty">今日尚無操作動態</div>
            ) : (
              recentLogs.map((log, idx) => (
                <div key={log.id || idx} className="feed-item">
                  <div className="feed-top">
                    <span className="feed-time">{log.time}</span>
                    <span className={`feed-role-tag ${log.role}`}>
                      {log.roleName || (log.role === 'sorter' ? '分秤' : log.role === 'puller' ? '拉料' : '客服印單')}
                    </span>
                  </div>
                  <div className="feed-msg">
                    <strong>{log.userName}</strong> 完成 <strong>{log.routeName}</strong> 路線
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
