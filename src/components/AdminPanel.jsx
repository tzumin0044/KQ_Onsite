import React, { useState } from 'react';
import { Users, Truck, Layers, FileSpreadsheet, Settings, ArrowLeft, RotateCcw, Download, Upload, ShieldCheck } from 'lucide-react';
import AdminUsers from './AdminUsers';
import AdminRoutes from './AdminRoutes';
import AdminGroups from './AdminGroups';
import AdminHistory from './AdminHistory';

export default function AdminPanel({
  config,
  onUpdateConfig,
  onResetConfig,
  historyLogs,
  onClearLogs,
  onResetTodayRoutes,
  onBack
}) {
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'routes' | 'groups' | 'history' | 'system'

  // 更新人員
  const handleUpdateUsers = (newUsers) => {
    onUpdateConfig({
      ...config,
      users: newUsers
    });
  };

  // 更新路線
  const handleUpdateRoutes = (newRoutes) => {
    onUpdateConfig({
      ...config,
      routes: newRoutes
    });
  };

  // 更新組別
  const handleUpdateGroups = (newGroups) => {
    onUpdateConfig({
      ...config,
      groups: newGroups
    });
  };

  // 匯出設定檔 JSON
  const handleExportConfig = () => {
    const jsonStr = JSON.stringify(config, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `理貨系統設定備份_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 匯入設定檔 JSON
  const handleImportConfig = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.users && parsed.routes && parsed.groups) {
          onUpdateConfig(parsed);
          alert("設定檔匯入成功！");
        } else {
          alert("設定檔格式不正確，缺少必要欄位！");
        }
      } catch (err) {
        alert("JSON 解析失敗，請確認檔案格式是否正確！");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="admin-container">
      {/* 頂部導航列 */}
      <header className="admin-header">
        <div className="admin-brand">
          <button onClick={onBack} className="btn-back" title="返回首頁">
            <ArrowLeft size={18} /> 返回首頁
          </button>
          <div className="admin-title">
            <h2>⚙️ 後台管理系統</h2>
            <span className="admin-badge">Admin Panel</span>
          </div>
        </div>

        {/* 標籤選單 */}
        <nav className="admin-nav">
          <button
            className={`admin-nav-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={16} /> 人員管理 ({config.users.filter(u => u.active).length})
          </button>
          <button
            className={`admin-nav-btn ${activeTab === 'routes' ? 'active' : ''}`}
            onClick={() => setActiveTab('routes')}
          >
            <Truck size={16} /> 路線管理
          </button>
          <button
            className={`admin-nav-btn ${activeTab === 'groups' ? 'active' : ''}`}
            onClick={() => setActiveTab('groups')}
          >
            <Layers size={16} /> 組別管理
          </button>
          <button
            className={`admin-nav-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <FileSpreadsheet size={16} /> 歷史紀錄與匯出
          </button>
          <button
            className={`admin-nav-btn ${activeTab === 'system' ? 'active' : ''}`}
            onClick={() => setActiveTab('system')}
          >
            <Settings size={16} /> 系統備份
          </button>
        </nav>
      </header>

      {/* 內容區塊 */}
      <main className="admin-main">
        {activeTab === 'users' && (
          <AdminUsers users={config.users} onUpdateUsers={handleUpdateUsers} />
        )}

        {activeTab === 'routes' && (
          <AdminRoutes routes={config.routes} onUpdateRoutes={handleUpdateRoutes} />
        )}

        {activeTab === 'groups' && (
          <AdminGroups
            groups={config.groups}
            routes={config.routes}
            onUpdateGroups={handleUpdateGroups}
          />
        )}

        {activeTab === 'history' && (
          <AdminHistory
            historyLogs={historyLogs}
            config={config}
            onClearLogs={onClearLogs}
          />
        )}

        {activeTab === 'system' && (
          <div className="admin-section">
            <div className="section-header">
              <div>
                <h3>系統備份與狀態重置 (System & Backup)</h3>
                <p className="section-desc">支援匯出/匯入全站設定檔，以及重置當日路線或還原原廠預設。</p>
              </div>
            </div>

            <div className="system-grid">
              <div className="system-card">
                <h4>📥 備份與還原設定</h4>
                <p>將目前的人員名單、時段路線、組別分配完整下載為 JSON 檔案，或從備份檔還原。</p>
                <div className="card-buttons">
                  <button onClick={handleExportConfig} className="btn-primary">
                    <Download size={16} /> 匯出設定檔 (JSON)
                  </button>
                  <label className="btn-secondary file-upload-btn">
                    <Upload size={16} /> 匯入設定檔 (JSON)
                    <input type="file" accept=".json" onChange={handleImportConfig} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>

              <div className="system-card">
                <h4>🔄 今日狀態手動重置</h4>
                <p>一鍵清空今日所有的分秤、拉料、客服印單狀態（歷史紀錄仍會保留）。</p>
                <div className="card-buttons">
                  <button
                    onClick={() => {
                      if (confirm("確定要手動重置【今日所有路線狀態】為未完成嗎？")) {
                        onResetTodayRoutes();
                        alert("今日路線狀態已重置完成！");
                      }
                    }}
                    className="btn-warning"
                  >
                    <RotateCcw size={16} /> 重置今日所有路線狀態
                  </button>
                </div>
              </div>

              <div className="system-card danger-card">
                <h4>⚠️ 恢復原廠預設設定</h4>
                <p>將人員、路線與組別配置重置為系統初始狀態（13位預設人員、12條預設路線與預設組別）。</p>
                <div className="card-buttons">
                  <button
                    onClick={() => {
                      if (confirm("警告：這將會清除您目前自訂的所有人員、路線與組別設定，並還原為初始狀態！\n確定要還原嗎？")) {
                        onResetConfig();
                        alert("已成功還原為預設設定！");
                      }
                    }}
                    className="btn-danger"
                  >
                    <RotateCcw size={16} /> 恢復原廠預設設定
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
