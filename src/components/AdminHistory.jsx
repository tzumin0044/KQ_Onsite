import React, { useState, useMemo } from 'react';
import { Download, Search, Filter, Calendar, FileSpreadsheet, RotateCcw, Trash2, Clock, CheckCircle } from 'lucide-react';

export default function AdminHistory({ historyLogs, config, onClearLogs }) {
  const todayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [startDate, setStartDate] = useState(todayStr());
  const [endDate, setEndDate] = useState(todayStr());
  const [selectedShift, setSelectedShift] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');
  const [selectedRoute, setSelectedRoute] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');

  // 快速日期選擇
  const handleQuickDate = (type) => {
    const now = new Date();
    const format = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    if (type === 'today') {
      const t = format(now);
      setStartDate(t);
      setEndDate(t);
    } else if (type === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yt = format(y);
      setStartDate(yt);
      setEndDate(yt);
    } else if (type === 'week') {
      const w = new Date(now);
      w.setDate(w.getDate() - 7);
      setStartDate(format(w));
      setEndDate(format(now));
    } else if (type === 'month') {
      const m = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(format(m));
      setEndDate(format(now));
    } else if (type === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  // 重置篩選條件
  const handleResetFilters = () => {
    handleQuickDate('today');
    setSelectedShift('all');
    setSelectedUser('all');
    setSelectedRoute('all');
    setSelectedRole('all');
    setSearchKeyword('');
  };

  // 整理所有路線選項
  const allRouteOptions = useMemo(() => {
    const set = new Set();
    if (config.routes) {
      (config.routes.morning || []).forEach(r => set.add(r.name));
      (config.routes.afternoon || []).forEach(r => set.add(r.name));
    }
    historyLogs.forEach(l => {
      if (l.routeName) set.add(l.routeName);
    });
    return Array.from(set).sort();
  }, [config.routes, historyLogs]);

  // 過濾資料
  const filteredLogs = useMemo(() => {
    return historyLogs.filter(log => {
      // 日期區間
      if (startDate && log.date < startDate) return false;
      if (endDate && log.date > endDate) return false;

      // 時段
      if (selectedShift !== 'all' && log.shift !== selectedShift) return false;

      // 人員
      if (selectedUser !== 'all' && log.userName !== selectedUser) return false;

      // 路線
      if (selectedRoute !== 'all' && log.routeName !== selectedRoute) return false;

      // 角色 / 作業項目
      if (selectedRole !== 'all' && log.role !== selectedRole) return false;

      // 關鍵字搜尋 (訊息或姓名)
      if (searchKeyword) {
        const kw = searchKeyword.toLowerCase();
        const matchMsg = log.message && log.message.toLowerCase().includes(kw);
        const matchUser = log.userName && log.userName.toLowerCase().includes(kw);
        const matchRoute = log.routeName && log.routeName.toLowerCase().includes(kw);
        if (!matchMsg && !matchUser && !matchRoute) return false;
      }

      return true;
    });
  }, [historyLogs, startDate, endDate, selectedShift, selectedUser, selectedRoute, selectedRole, searchKeyword]);

  // 統計摘要
  const statistics = useMemo(() => {
    const userCount = {};
    const routeCount = {};
    filteredLogs.forEach(log => {
      if (log.userName) {
        userCount[log.userName] = (userCount[log.userName] || 0) + 1;
      }
      if (log.routeName) {
        routeCount[log.routeName] = (routeCount[log.routeName] || 0) + 1;
      }
    });

    const topUsers = Object.entries(userCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      total: filteredLogs.length,
      topUsers,
      uniqueRoutes: Object.keys(routeCount).length
    };
  }, [filteredLogs]);

  // 匯出 CSV (支援 Excel UTF-8 BOM)
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      alert("目前篩選條件下無任何紀錄可匯出！");
      return;
    }

    const headers = ['序號', '日期', '時間', '時段', '路線代碼', '作業項目', '所屬組別', '操作人員', '完整訊息'];
    const rows = filteredLogs.map((log, index) => [
      index + 1,
      log.date || '',
      log.time || '',
      log.shiftName || (log.shift === 'morning' ? '上午' : '下午'),
      log.routeName || '',
      log.roleName || (log.role === 'sorter' ? '分秤' : log.role === 'puller' ? '拉料' : '客服印單'),
      log.groupName || '-',
      log.userName || '',
      `"${(log.message || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateTag = startDate === endDate ? (startDate || '全部') : `${startDate || '起'}_${endDate || '迄'}`;
    link.setAttribute('href', url);
    link.setAttribute('download', `理貨作業紀錄_${dateTag}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-section">
      <div className="section-header">
        <div>
          <h3>歷史資料查詢與匯出 (History & Export)</h3>
          <p className="section-desc">支援多維度條件交叉篩選，並可一鍵匯出 Excel (CSV) 試算表。</p>
        </div>
        <div className="header-actions">
          <button onClick={handleExportCSV} className="btn-primary btn-export" disabled={filteredLogs.length === 0}>
            <Download size={16} /> 匯出 Excel (CSV)
          </button>
        </div>
      </div>

      {/* 篩選條件卡片 */}
      <div className="filter-card">
        <div className="filter-row">
          {/* 日期區間 */}
          <div className="filter-group date-range-group">
            <label><Calendar size={14} /> 日期區間</label>
            <div className="date-inputs">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-date"
              />
              <span className="date-separator">至</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-date"
              />
            </div>
            <div className="quick-date-btns">
              <button type="button" onClick={() => handleQuickDate('today')} className="btn-tag">今日</button>
              <button type="button" onClick={() => handleQuickDate('yesterday')} className="btn-tag">昨日</button>
              <button type="button" onClick={() => handleQuickDate('week')} className="btn-tag">近7天</button>
              <button type="button" onClick={() => handleQuickDate('month')} className="btn-tag">本月</button>
              <button type="button" onClick={() => handleQuickDate('all')} className="btn-tag">全部</button>
            </div>
          </div>

          {/* 時段 */}
          <div className="filter-group">
            <label>時段</label>
            <select value={selectedShift} onChange={(e) => setSelectedShift(e.target.value)} className="select-input">
              <option value="all">全部時段</option>
              <option value="morning">上午時段 (AM)</option>
              <option value="afternoon">下午時段 (PM)</option>
            </select>
          </div>

          {/* 人員 */}
          <div className="filter-group">
            <label>操作人員</label>
            <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className="select-input">
              <option value="all">全體人員</option>
              {config.users.map(u => (
                <option key={u.id} value={u.name}>{u.name} {u.active ? '' : '(已停用)'}</option>
              ))}
            </select>
          </div>

          {/* 路線 */}
          <div className="filter-group">
            <label>路線代碼</label>
            <select value={selectedRoute} onChange={(e) => setSelectedRoute(e.target.value)} className="select-input">
              <option value="all">全部路線</option>
              {allRouteOptions.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* 作業項目 */}
          <div className="filter-group">
            <label>作業身分/項目</label>
            <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="select-input">
              <option value="all">全部項目</option>
              <option value="sorter">分秤完成</option>
              <option value="puller">拉料完成</option>
              <option value="printed">客服印單</option>
            </select>
          </div>
        </div>

        <div className="filter-footer">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="搜尋關鍵字或備註訊息..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="search-input"
            />
          </div>
          <button type="button" onClick={handleResetFilters} className="btn-secondary">
            <RotateCcw size={14} /> 重置篩選
          </button>
        </div>
      </div>

      {/* 統計摘要小卡 */}
      <div className="stats-summary-grid">
        <div className="stat-card">
          <span className="stat-label">符合筆數</span>
          <span className="stat-value">{statistics.total} 筆</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">涵蓋路線數</span>
          <span className="stat-value">{statistics.uniqueRoutes} 條</span>
        </div>
        <div className="stat-card wide-stat">
          <span className="stat-label">人員作業次數排行 (Top 5)</span>
          <div className="stat-tags">
            {statistics.topUsers.length === 0 ? (
              <span className="text-muted">無紀錄</span>
            ) : (
              statistics.topUsers.map(([name, count]) => (
                <span key={name} className="user-stat-chip">
                  👤 {name}: <strong>{count}</strong> 次
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 查詢結果表格 */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>序號</th>
              <th>日期</th>
              <th>時間</th>
              <th>時段</th>
              <th>路線</th>
              <th>作業項目</th>
              <th>所屬組別</th>
              <th>操作人員</th>
              <th>詳細紀錄訊息</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={9} className="table-empty">
                  查無符合條件的歷史作業紀錄
                </td>
              </tr>
            ) : (
              filteredLogs.map((log, index) => (
                <tr key={log.id || index}>
                  <td>{index + 1}</td>
                  <td><strong>{log.date}</strong></td>
                  <td><span className="time-badge">{log.time}</span></td>
                  <td>
                    <span className={`shift-tag ${log.shift || 'morning'}`}>
                      {log.shiftName || (log.shift === 'morning' ? '上午' : '下午')}
                    </span>
                  </td>
                  <td><span className="route-badge-small">{log.routeName}</span></td>
                  <td>
                    <span className={`role-badge ${log.role}`}>
                      {log.roleName || (log.role === 'sorter' ? '分秤' : log.role === 'puller' ? '拉料' : '客服印單')}
                    </span>
                  </td>
                  <td>{log.groupName || '-'}</td>
                  <td><strong>👤 {log.userName}</strong></td>
                  <td className="log-msg-cell">{log.message}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {historyLogs.length > 0 && (
        <div className="danger-zone">
          <span>⚠️ 清空紀錄：將清除所有歷史儲存日誌（無法復原）。</span>
          <button
            onClick={() => {
              if (confirm("確定要清空所有的歷史作業紀錄嗎？此動作無法復原！")) {
                onClearLogs();
              }
            }}
            className="btn-danger-outline"
          >
            <Trash2 size={14} /> 清空所有歷史紀錄
          </button>
        </div>
      )}
    </div>
  );
}
