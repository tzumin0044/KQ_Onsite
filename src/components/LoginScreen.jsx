import React, { useState } from 'react';
import { ROLES, SHIFTS } from '../data';
import { Settings, Monitor, LogIn, Sun, Moon, Scale, ArrowRightLeft, Headphones } from 'lucide-react';

export default function LoginScreen({
  config,
  onLogin,
  onOpenMonitor,
  onOpenAdmin
}) {
  const [currentShift, setCurrentShift] = useState('morning'); // 'morning' | 'afternoon'
  const [currentRole, setCurrentRole] = useState(''); // 'sorter' | 'puller' | 'cs'
  const [currentGroup, setCurrentGroup] = useState('');
  const [currentUser, setCurrentUser] = useState('');

  // 取得當前時段與身分的組別
  const availableGroups = (currentRole && currentRole !== 'cs' && config.groups[currentShift])
    ? (config.groups[currentShift][currentRole] || [])
    : [];

  // 只過濾啟用中的人員
  const activeUsers = config.users.filter(u => u.active);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentRole) {
      alert("請選擇操作身分！");
      return;
    }
    if (currentRole !== 'cs' && !currentGroup) {
      alert("請選擇操作組別！");
      return;
    }
    if (!currentUser) {
      alert("請選擇人員名稱！");
      return;
    }

    onLogin({
      shift: currentShift,
      role: currentRole,
      group: currentGroup,
      user: currentUser
    });
  };

  return (
    <div className="login-screen">
      {/* 頂部快捷入口 */}
      <div className="top-shortcuts">
        <button onClick={onOpenMonitor} className="btn-shortcut monitor-btn" title="開啟大螢幕進度看板">
          <Monitor size={16} /> 大螢幕監控看板
        </button>
        <button onClick={onOpenAdmin} className="btn-shortcut admin-btn" title="進入後台管理系統">
          <Settings size={16} /> 後台管理系統
        </button>
      </div>

      <div className="login-card">
        <div className="login-header">
          <h1>理貨連動狀態看板系統</h1>
          <p className="login-subtitle">請選擇當前作業時段、身分與人員進入系統</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 1. 時段選擇 */}
          <div className="form-group">
            <label className="form-label">1. 作業時段</label>
            <div className="shift-toggle-group">
              <button
                type="button"
                className={`shift-btn ${currentShift === 'morning' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentShift('morning');
                  setCurrentGroup('');
                }}
              >
                <Sun size={18} /> 上午時段 (AM)
              </button>
              <button
                type="button"
                className={`shift-btn ${currentShift === 'afternoon' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentShift('afternoon');
                  setCurrentGroup('');
                }}
              >
                <Moon size={18} /> 下午時段 (PM)
              </button>
            </div>
          </div>

          {/* 2. 身分選擇 */}
          <div className="form-group">
            <label className="form-label">2. 操作身分</label>
            <div className="role-selector-grid">
              {ROLES.map(role => {
                const isSelected = currentRole === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    className={`role-select-btn ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentRole(role.id);
                      setCurrentGroup('');
                    }}
                  >
                    {role.id === 'sorter' && <Scale size={18} />}
                    {role.id === 'puller' && <ArrowRightLeft size={18} />}
                    {role.id === 'cs' && <Headphones size={18} />}
                    <span>{role.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. 組別選擇 (客服不需選擇) */}
          {currentRole && currentRole !== 'cs' && (
            <div className="form-group">
              <label className="form-label">3. 操作組別</label>
              {availableGroups.length === 0 ? (
                <div className="alert-box">
                  目前【{currentShift === 'morning' ? '上午' : '下午'} - {currentRole === 'sorter' ? '分秤' : '拉料'}】尚無設定組別，請至後台管理設定。
                </div>
              ) : (
                <select
                  value={currentGroup}
                  onChange={(e) => setCurrentGroup(e.target.value)}
                  className="select-main"
                  required
                >
                  <option value="">請選擇組別...</option>
                  {availableGroups.map(group => (
                    <option key={group.id || group.name} value={group.name}>
                      {group.name}（路線: {group.routes.join(', ') || '尚未指定'}）
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* 4. 人員選擇 */}
          <div className="form-group">
            <label className="form-label">{currentRole === 'cs' ? '3. 人員名稱' : '4. 人員名稱'}</label>
            <select
              value={currentUser}
              onChange={(e) => setCurrentUser(e.target.value)}
              className="select-main"
              required
            >
              <option value="">請選擇人員名稱...</option>
              {activeUsers.map(user => (
                <option key={user.id || user.name} value={user.name}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn-primary btn-login-submit">
            <LogIn size={18} /> 進入作業系統
          </button>
        </form>
      </div>
    </div>
  );
}
