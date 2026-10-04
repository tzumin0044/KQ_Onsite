import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Check, X, Eye, EyeOff, Sun, Moon, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';

export default function AdminRoutes({ routes, onUpdateRoutes }) {
  const [activeShift, setActiveShift] = useState('morning');
  const [newRouteCode, setNewRouteCode] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  // 拖曳狀態
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const currentRoutes = routes[activeShift] || [];
  const shiftName = activeShift === 'morning' ? '上午' : '下午';

  // 計算統計數據
  const morningList = routes.morning || [];
  const morningActiveCount = morningList.filter(r => r.active).length;
  const morningInactiveCount = morningList.length - morningActiveCount;

  const afternoonList = routes.afternoon || [];
  const afternoonActiveCount = afternoonList.filter(r => r.active).length;
  const afternoonInactiveCount = afternoonList.length - afternoonActiveCount;

  const handleAddRoute = (e) => {
    e.preventDefault();
    const trimmed = newRouteCode.trim().toUpperCase();
    if (!trimmed) return;
    if (currentRoutes.some(r => r.name === trimmed || r.id === trimmed)) {
      alert(`【${shiftName}時段】已有路線「${trimmed}」！`);
      return;
    }
    const newRoute = {
      id: trimmed,
      name: trimmed,
      active: true
    };
    const updatedShiftRoutes = [...currentRoutes, newRoute];
    onUpdateRoutes({
      ...routes,
      [activeShift]: updatedShiftRoutes
    });
    setNewRouteCode('');
  };

  const handleToggleActive = (id) => {
    const updated = currentRoutes.map(r => r.id === id ? { ...r, active: !r.active } : r);
    onUpdateRoutes({
      ...routes,
      [activeShift]: updated
    });
  };

  const handleStartEdit = (route) => {
    setEditingId(route.id);
    setEditingName(route.name);
  };

  const handleSaveEdit = (oldId) => {
    const trimmed = editingName.trim().toUpperCase();
    if (!trimmed) return;
    const updated = currentRoutes.map(r => r.id === oldId ? { ...r, name: trimmed } : r);
    onUpdateRoutes({
      ...routes,
      [activeShift]: updated
    });
    setEditingId(null);
  };

  const handleDeleteRoute = (route) => {
    if (confirm(`確定要刪除【${shiftName}】路線「${route.name}」嗎？\n(若當日只是未出車，建議使用「停用」開關即可隱藏)`)) {
      const updated = currentRoutes.filter(r => r.id !== route.id);
      onUpdateRoutes({
        ...routes,
        [activeShift]: updated
      });
    }
  };

  // 路線向上排序按鈕
  const handleMoveUp = (index) => {
    if (index === 0) return;
    const newRoutes = [...currentRoutes];
    const temp = newRoutes[index];
    newRoutes[index] = newRoutes[index - 1];
    newRoutes[index - 1] = temp;
    onUpdateRoutes({
      ...routes,
      [activeShift]: newRoutes
    });
  };

  // 路線向下排序按鈕
  const handleMoveDown = (index) => {
    if (index === currentRoutes.length - 1) return;
    const newRoutes = [...currentRoutes];
    const temp = newRoutes[index];
    newRoutes[index] = newRoutes[index + 1];
    newRoutes[index + 1] = temp;
    onUpdateRoutes({
      ...routes,
      [activeShift]: newRoutes
    });
  };

  // ==========================================
  // 🖱️ 拖曳排序處理函式 (Drag and Drop)
  // ==========================================
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newRoutes = [...currentRoutes];
    const [draggedItem] = newRoutes.splice(draggedIndex, 1);
    newRoutes.splice(dropIndex, 0, draggedItem);

    onUpdateRoutes({
      ...routes,
      [activeShift]: newRoutes
    });
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="admin-section">
      <div className="section-header">
        <div>
          <h3>路線管理 (Route Management)</h3>
          <p className="section-desc">請選擇時段切換卡片，支援點擊或<strong>「直接拖曳 ☰」</strong>自訂看板與清單上的路線排列順序。</p>
        </div>
      </div>

      {/* 🔹 時段切換雙卡片 */}
      <div className="shift-nav-container">
        <button
          className={`shift-nav-card ${activeShift === 'morning' ? 'active' : ''}`}
          onClick={() => setActiveShift('morning')}
        >
          <div className="shift-card-header">
            <Sun size={20} className="shift-icon sun-icon" />
            <span className="shift-title">☀️ 上午路線 (AM)</span>
          </div>
          <span className="shift-summary">
            共 {morningList.length} 條路線 ｜ 啟用: {morningActiveCount} 條 ｜ 停用: {morningInactiveCount} 條
          </span>
        </button>

        <button
          className={`shift-nav-card ${activeShift === 'afternoon' ? 'active' : ''}`}
          onClick={() => setActiveShift('afternoon')}
        >
          <div className="shift-card-header">
            <Moon size={20} className="shift-icon moon-icon" />
            <span className="shift-title">🌙 下午路線 (PM)</span>
          </div>
          <span className="shift-summary">
            共 {afternoonList.length} 條路線 ｜ 啟用: {afternoonActiveCount} 條 ｜ 停用: {afternoonInactiveCount} 條
          </span>
        </button>
      </div>

      {/* 當前時段標題列與新增路線表單 */}
      <div className="route-toolbar">
        <div className="toolbar-left">
          <span className="current-shift-indicator">
            當前檢視：<strong>【{shiftName}路線清單】</strong>（共 {currentRoutes.length} 條）
          </span>
          <span className="drag-tip-badge">
            <GripVertical size={13} /> 提示：可按住左側 ☰ 拖曳排序
          </span>
        </div>

        <form onSubmit={handleAddRoute} className="inline-form">
          <input
            type="text"
            placeholder={`新增【${shiftName}】路線代碼 (如: S1, M2)...`}
            value={newRouteCode}
            onChange={(e) => setNewRouteCode(e.target.value)}
            className="input-text group-name-input"
          />
          <button type="submit" className="btn-primary">
            <Plus size={16} /> 新增{shiftName}路線
          </button>
        </form>
      </div>

      {/* 路線清單表格（支援拖曳排序） */}
      <div className="table-responsive">
        <table className="data-table admin-list-table">
          <thead>
            <tr>
              <th style={{ width: '80px', textAlign: 'center' }}>拖曳排序</th>
              <th style={{ width: '60px', textAlign: 'center' }}>序號</th>
              <th style={{ width: '150px' }}>路線代碼</th>
              <th style={{ width: '140px' }}>所屬時段</th>
              <th style={{ width: '120px', textAlign: 'center' }}>目前狀態</th>
              <th style={{ width: '240px', textAlign: 'center' }}>操作功能</th>
            </tr>
          </thead>
          <tbody>
            {currentRoutes.length === 0 ? (
              <tr>
                <td colSpan={6} className="table-empty">
                  【{shiftName}時段】尚無任何路線資料，請於上方新增
                </td>
              </tr>
            ) : (
              currentRoutes.map((route, index) => {
                const isEditing = editingId === route.id;
                const isBeingDragged = draggedIndex === index;
                const isDragOver = dragOverIndex === index;

                return (
                  <tr
                    key={route.id}
                    className={`draggable-row ${route.active ? 'row-active' : 'row-inactive'} ${isBeingDragged ? 'is-dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
                    draggable={!isEditing}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                  >
                    <td style={{ textAlign: 'center' }}>
                      <div className="drag-handle-cell">
                        <div
                          className="drag-handle"
                          title="按住此圖示拖曳以調整順序"
                        >
                          <GripVertical size={16} />
                        </div>
                        <div className="order-actions-mini">
                          <button
                            type="button"
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                            className="btn-icon-tiny"
                            title="往上移"
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveDown(index)}
                            disabled={index === currentRoutes.length - 1}
                            className="btn-icon-tiny"
                            title="往下移"
                          >
                            <ArrowDown size={12} />
                          </button>
                        </div>
                      </div>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <span className="user-index">#{index + 1}</span>
                    </td>

                    <td>
                      {isEditing ? (
                        <div className="edit-inline">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="input-text edit-input"
                            autoFocus
                          />
                          <button onClick={() => handleSaveEdit(route.id)} className="btn-icon btn-save" title="儲存">
                            <Check size={16} />
                          </button>
                          <button onClick={() => setEditingId(null)} className="btn-icon btn-cancel" title="取消">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <span className="route-badge-large">{route.name}</span>
                      )}
                    </td>

                    <td>
                      <span className={`shift-tag ${activeShift}`}>
                        {activeShift === 'morning' ? '☀️ 上午 (AM)' : '🌙 下午 (PM)'}
                      </span>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${route.active ? 'badge-active' : 'badge-inactive'}`}>
                        {route.active ? '啟用中' : '已停用'}
                      </span>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      {!isEditing && (
                        <div className="table-actions-center">
                          <button
                            onClick={() => handleToggleActive(route.id)}
                            className={`btn-action-pill ${route.active ? 'btn-pill-deactivate' : 'btn-pill-activate'}`}
                            title={route.active ? '點擊停用（看板隱藏）' : '點擊啟用（看板顯示）'}
                          >
                            {route.active ? <><EyeOff size={14} /> 停用</> : <><Eye size={14} /> 啟用</>}
                          </button>
                          <button onClick={() => handleStartEdit(route)} className="btn-action-pill btn-pill-edit">
                            <Edit2 size={14} /> 編輯
                          </button>
                          <button onClick={() => handleDeleteRoute(route)} className="btn-action-pill btn-pill-delete">
                            <Trash2 size={14} /> 刪除
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
