import React from 'react';
import { LogOut, CheckCircle2, Circle } from 'lucide-react';

export default function WorkerScreen({
  currentUser,
  currentRole,
  currentShift,
  currentGroup,
  config,
  routes,
  onUpdateRoute,
  onLogout
}) {
  const isSorter = currentRole === 'sorter';
  const roleName = isSorter ? '分秤' : '拉料';
  const shiftName = currentShift === 'morning' ? '上午' : '下午';

  // 取得該時段與角色的組別清單
  const shiftGroups = (config.groups[currentShift] && config.groups[currentShift][currentRole]) || [];
  const selectedGroupObj = shiftGroups.find(g => g.name === currentGroup) || { name: currentGroup, routes: [] };

  const shiftRoutesData = routes[currentShift] || {};

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-info">
          <h2>【{shiftName}】{roleName} 作業介面</h2>
          <span className="current-group-badge">{currentGroup}</span>
        </div>
        <div className="user-info">
          <span>👤 {currentUser}</span>
          <button onClick={onLogout} className="logout-btn">
            <LogOut size={16} /> 登出
          </button>
        </div>
      </header>

      <div className="group-section">
        {selectedGroupObj.routes.length === 0 ? (
          <div className="empty-state">
            此組別目前尚未指派任何路線，請至後台管理設定。
          </div>
        ) : (
          <div className="routes-grid">
            {selectedGroupObj.routes.map((routeName, idx) => {
              const routeData = shiftRoutesData[routeName] || { sorter: false, puller: false, printed: false };
              const isDone = routeData[currentRole];

              return (
                <button
                  key={routeName}
                  className={`route-btn ${isDone ? 'status-done' : 'status-pending'}`}
                  onClick={() => onUpdateRoute(
                    currentShift,
                    routeName,
                    currentRole,
                    !isDone,
                    currentUser,
                    roleName,
                    currentGroup
                  )}
                >
                  <span className="route-order-badge-card">#{idx + 1}</span>
                  <span className="route-name">{routeName}</span>
                  <div className="route-status-box">
                    {isDone ? (
                      <>
                        <CheckCircle2 size={24} className="status-icon done" />
                        <span className="route-time">已完成 {isDone}</span>
                      </>
                    ) : (
                      <>
                        <Circle size={24} className="status-icon pending" />
                        <span className="route-time">待處理</span>
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
