import React, { useState } from 'react';
import { useAppState } from './useAppState';
import LoginScreen from './components/LoginScreen';
import WorkerScreen from './components/WorkerScreen';
import CSScreen from './components/CSScreen';
import MonitorScreen from './components/MonitorScreen';
import AdminPanel from './components/AdminPanel';
import { ScrollText, X } from 'lucide-react';
import './index.css';

export default function App() {
  const {
    config,
    updateConfig,
    resetConfigToDefault,
    routes,
    updateRoute,
    resetTodayRoutes,
    historyLogs,
    clearHistoryLogs,
    isLoaded
  } = useAppState();

  // 畫面路由模式：'login' | 'worker' | 'cs' | 'monitor' | 'admin'
  const [viewMode, setViewMode] = useState('login');
  
  // 登入狀態
  const [session, setSession] = useState({
    shift: 'morning',
    role: '',
    group: '',
    user: ''
  });

  // 操作日誌彈窗
  const [showLogsModal, setShowLogsModal] = useState(false);

  // 登入處理
  const handleLogin = (loginData) => {
    setSession(loginData);
    if (loginData.role === 'cs') {
      setViewMode('cs');
    } else {
      setViewMode('worker');
    }
  };

  // 登出處理
  const handleLogout = () => {
    setSession({
      shift: 'morning',
      role: '',
      group: '',
      user: ''
    });
    setViewMode('login');
  };

  if (!isLoaded) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>正在載入理貨系統資料...</p>
      </div>
    );
  }

  return (
    <div className="main-wrapper">
      {/* 1. 登入首頁 */}
      {viewMode === 'login' && (
        <LoginScreen
          config={config}
          onLogin={handleLogin}
          onOpenMonitor={() => setViewMode('monitor')}
          onOpenAdmin={() => setViewMode('admin')}
        />
      )}

      {/* 2. 作業員介面 (分秤 / 拉料) */}
      {viewMode === 'worker' && (
        <WorkerScreen
          currentUser={session.user}
          currentRole={session.role}
          currentShift={session.shift}
          currentGroup={session.group}
          config={config}
          routes={routes}
          onUpdateRoute={updateRoute}
          onLogout={handleLogout}
        />
      )}

      {/* 3. 客服印單介面 */}
      {viewMode === 'cs' && (
        <CSScreen
          currentUser={session.user}
          currentShift={session.shift}
          config={config}
          routes={routes}
          onUpdateRoute={updateRoute}
          onLogout={handleLogout}
        />
      )}

      {/* 4. 大螢幕唯讀監控看板 */}
      {viewMode === 'monitor' && (
        <MonitorScreen
          config={config}
          routes={routes}
          historyLogs={historyLogs}
          onBack={() => setViewMode('login')}
        />
      )}

      {/* 5. 後台管理系統 */}
      {viewMode === 'admin' && (
        <AdminPanel
          config={config}
          onUpdateConfig={updateConfig}
          onResetConfig={resetConfigToDefault}
          historyLogs={historyLogs}
          onClearLogs={clearHistoryLogs}
          onResetTodayRoutes={resetTodayRoutes}
          onBack={() => setViewMode('login')}
        />
      )}

      {/* 作業介面懸浮日誌按鈕 */}
      {(viewMode === 'worker' || viewMode === 'cs') && (
        <button
          className="fab-logs"
          onClick={() => setShowLogsModal(true)}
          title="查看今日作業紀錄"
        >
          <ScrollText size={22} />
        </button>
      )}

      {/* 日誌彈窗 */}
      {showLogsModal && (
        <div className="modal-overlay" onClick={() => setShowLogsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>今日作業紀錄</h3>
              <button className="modal-close" onClick={() => setShowLogsModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {historyLogs.length === 0 ? (
                <p className="logs-empty">今日尚無操作紀錄</p>
              ) : (
                historyLogs.slice(0, 50).map((log, i) => (
                  <div key={log.id || i} className="log-item">
                    <span className="log-time">{log.time}</span>
                    <span className="log-detail">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
