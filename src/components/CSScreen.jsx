import React, { useState } from 'react';
import { LogOut, CheckCircle2, Circle, Sun, Moon } from 'lucide-react';

export default function CSScreen({
  currentUser,
  currentShift: initialShift,
  config,
  routes,
  onUpdateRoute,
  onLogout
}) {
  const [activeShift, setActiveShift] = useState(initialShift || 'morning');

  const shiftRoutes = (config.routes[activeShift] || []).filter(r => r.active);
  const shiftRoutesData = routes[activeShift] || {};

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-info">
          <h2>客服作業介面 (印單作業)</h2>
        </div>
        <div className="user-info">
          <span>👤 {currentUser}</span>
          <button onClick={onLogout} className="logout-btn">
            <LogOut size={16} /> 登出
          </button>
        </div>
      </header>

      {/* 上午 / 下午時段切換 */}
      <div className="cs-shift-nav">
        <button
          className={`cs-shift-btn ${activeShift === 'morning' ? 'active' : ''}`}
          onClick={() => setActiveShift('morning')}
        >
          <Sun size={16} /> 上午路線 ({ (config.routes.morning || []).filter(r => r.active).length })
        </button>
        <button
          className={`cs-shift-btn ${activeShift === 'afternoon' ? 'active' : ''}`}
          onClick={() => setActiveShift('afternoon')}
        >
          <Moon size={16} /> 下午路線 ({ (config.routes.afternoon || []).filter(r => r.active).length })
        </button>
      </div>

      <div className="cs-grid">
        {shiftRoutes.length === 0 ? (
          <div className="empty-state">此時段尚無啟用的路線。</div>
        ) : (
          shiftRoutes.map(route => {
            const routeName = route.name;
            const data = shiftRoutesData[routeName] || { sorter: false, puller: false, printed: false };
            const canPrint = !!data.sorter && !!data.puller;

            return (
              <div key={routeName} className="cs-row">
                <div className="cs-row-title">{routeName}</div>

                <div className={`cs-indicator ${data.sorter ? 'done' : 'pending'}`}>
                  <span className="label">分秤</span>
                  <span className="status-text">{data.sorter ? data.sorter : '未完'}</span>
                </div>

                <div className={`cs-indicator ${data.puller ? 'done' : 'pending'}`}>
                  <span className="label">拉料</span>
                  <span className="status-text">{data.puller ? data.puller : '未完'}</span>
                </div>

                <div
                  className={`cs-indicator print-action ${data.printed ? 'done' : 'pending'} ${!canPrint ? 'disabled' : ''}`}
                  onClick={() => {
                    if (!canPrint) return;
                    onUpdateRoute(
                      activeShift,
                      routeName,
                      'printed',
                      !data.printed,
                      currentUser,
                      '客服印單'
                    );
                  }}
                  title={!canPrint ? '需待分秤與拉料皆完成後方可印單' : '點擊切換印單狀態'}
                >
                  <span className="label">印單狀態</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {data.printed ? (
                      <CheckCircle2 size={18} color="var(--color-green)" />
                    ) : (
                      <Circle size={18} color={canPrint ? 'var(--text-main)' : 'var(--text-muted)'} />
                    )}
                    <span className="status-text">
                      {data.printed ? data.printed : (canPrint ? '點擊印單' : '等待前置')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
