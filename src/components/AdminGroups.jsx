import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Check, X, Sun, Moon, Scale, ArrowRightLeft, ArrowUp, ArrowDown, GripVertical, Sparkles, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';

export default function AdminGroups({ groups, routes, onUpdateGroups }) {
  const [activeShift, setActiveShift] = useState('morning'); // 'morning' | 'afternoon'
  const [activeRole, setActiveRole] = useState('sorter'); // 'sorter' | 'puller'
  
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editingGroupName, setEditingGroupName] = useState('');

  // 整行小組拖曳狀態
  const [draggedGroupIndex, setDraggedGroupIndex] = useState(null);
  const [dragOverGroupIndex, setDragOverGroupIndex] = useState(null);

  // 路線標籤拖曳排序狀態
  const [draggedRouteInfo, setDraggedRouteInfo] = useState(null); // { groupId, index }
  const [dragOverRouteInfo, setDragOverRouteInfo] = useState(null); // { groupId, index }

  const currentShiftRoutes = routes[activeShift] || [];
  const currentGroupList = (groups[activeShift] && groups[activeShift][activeRole]) || [];

  const shiftName = activeShift === 'morning' ? '上午' : '下午';
  const roleName = activeRole === 'sorter' ? '分秤' : '拉料';

  // 統計數量
  const morningSorterCount = (groups.morning && groups.morning.sorter && groups.morning.sorter.length) || 0;
  const morningPullerCount = (groups.morning && groups.morning.puller && groups.morning.puller.length) || 0;
  const afternoonSorterCount = (groups.afternoon && groups.afternoon.sorter && groups.afternoon.sorter.length) || 0;
  const afternoonPullerCount = (groups.afternoon && groups.afternoon.puller && groups.afternoon.puller.length) || 0;

  const updateGroupsState = (newList) => {
    onUpdateGroups({
      ...groups,
      [activeShift]: {
        ...(groups[activeShift] || {}),
        [activeRole]: newList
      }
    });
  };

  const handleAddGroup = (e) => {
    if (e) e.preventDefault();
    const trimmed = newGroupName.trim();
    if (!trimmed) return;
    if (currentGroupList.some(g => g.name === trimmed)) {
      alert(`【${shiftName} - ${roleName}】已有「${trimmed}」！`);
      return;
    }
    const newGroup = {
      id: `${activeShift}_${activeRole}_${Date.now()}`,
      name: trimmed,
      routes: []
    };
    updateGroupsState([...currentGroupList, newGroup]);
    setNewGroupName('');
  };

  // 快速新增下一組
  const handleQuickAddNextGroup = () => {
    const nextNum = currentGroupList.length + 1;
    let finalName = `組別${nextNum}`;
    let counter = nextNum;
    while (currentGroupList.some(g => g.name === finalName)) {
      counter++;
      finalName = `組別${counter}`;
    }

    const newGroup = {
      id: `${activeShift}_${activeRole}_${Date.now()}`,
      name: finalName,
      routes: []
    };
    updateGroupsState([...currentGroupList, newGroup]);
  };

  // 路線指派與移轉 (排他性分配：不可重複複選)
  const handleToggleRouteForGroup = (targetGroupId, routeName) => {
    // 檢查該路線是否已被其他小組選走
    const owningGroup = currentGroupList.find(g => g.id !== targetGroupId && g.routes.includes(routeName));
    const targetGroup = currentGroupList.find(g => g.id === targetGroupId);
    const isAlreadyInTarget = targetGroup && targetGroup.routes.includes(routeName);

    if (isAlreadyInTarget) {
      // 點擊已在當前組別的路線 ➜ 移除
      const updatedList = currentGroupList.map(g => {
        if (g.id !== targetGroupId) return g;
        return { ...g, routes: g.routes.filter(r => r !== routeName) };
      });
      updateGroupsState(updatedList);
      return;
    }

    if (owningGroup) {
      // 已在其他組別 ➜ 詢問是否移轉
      if (confirm(`路線【${routeName}】目前已指派給「${owningGroup.name}」。\n確定要將【${routeName}】移轉至「${targetGroup.name}」嗎？`)) {
        const updatedList = currentGroupList.map(g => {
          if (g.id === owningGroup.id) {
            return { ...g, routes: g.routes.filter(r => r !== routeName) };
          }
          if (g.id === targetGroupId) {
            return { ...g, routes: [...g.routes, routeName] };
          }
          return g;
        });
        updateGroupsState(updatedList);
      }
      return;
    }

    // 尚未被任何組別選取 ➜ 直接加入當前組別末端
    const updatedList = currentGroupList.map(g => {
      if (g.id !== targetGroupId) return g;
      return { ...g, routes: [...g.routes, routeName] };
    });
    updateGroupsState(updatedList);
  };

  // ==========================================
  // 🔀 方案 A：小組內路線標籤拖曳排序 (Drag & Drop)
  // ==========================================
  const handleRouteDragStart = (e, groupId, routeIndex) => {
    e.stopPropagation();
    setDraggedRouteInfo({ groupId, index: routeIndex });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `route_${groupId}_${routeIndex}`);
  };

  const handleRouteDragOver = (e, groupId, routeIndex) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (!dragOverRouteInfo || dragOverRouteInfo.groupId !== groupId || dragOverRouteInfo.index !== routeIndex) {
      setDragOverRouteInfo({ groupId, index: routeIndex });
    }
  };

  const handleRouteDrop = (e, targetGroupId, targetRouteIndex) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedRouteInfo || draggedRouteInfo.groupId !== targetGroupId || draggedRouteInfo.index === targetRouteIndex) {
      setDraggedRouteInfo(null);
      setDragOverRouteInfo(null);
      return;
    }

    const updatedList = currentGroupList.map(g => {
      if (g.id !== targetGroupId) return g;
      const newRoutes = [...g.routes];
      const [draggedRoute] = newRoutes.splice(draggedRouteInfo.index, 1);
      newRoutes.splice(targetRouteIndex, 0, draggedRoute);
      return { ...g, routes: newRoutes };
    });

    updateGroupsState(updatedList);
    setDraggedRouteInfo(null);
    setDragOverRouteInfo(null);
  };

  const handleRouteDragEnd = (e) => {
    e.stopPropagation();
    setDraggedRouteInfo(null);
    setDragOverRouteInfo(null);
  };

  // 路線左右微調排序按鈕
  const handleMoveRoutePosition = (groupId, routeIndex, direction) => {
    const updatedList = currentGroupList.map(g => {
      if (g.id !== groupId) return g;
      const newRoutes = [...g.routes];
      const targetIndex = routeIndex + direction;
      if (targetIndex < 0 || targetIndex >= newRoutes.length) return g;
      const temp = newRoutes[routeIndex];
      newRoutes[routeIndex] = newRoutes[targetIndex];
      newRoutes[targetIndex] = temp;
      return { ...g, routes: newRoutes };
    });
    updateGroupsState(updatedList);
  };

  // ==========================================
  // 🖱️ 整行小組拖曳排序 (Drag and Drop)
  // ==========================================
  const handleGroupDragStart = (e, index) => {
    setDraggedGroupIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `group_${index}`);
  };

  const handleGroupDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverGroupIndex !== index) {
      setDragOverGroupIndex(index);
    }
  };

  const handleGroupDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedGroupIndex === null || draggedGroupIndex === dropIndex) {
      setDraggedGroupIndex(null);
      setDragOverGroupIndex(null);
      return;
    }

    const newList = [...currentGroupList];
    const [draggedItem] = newList.splice(draggedGroupIndex, 1);
    newList.splice(dropIndex, 0, draggedItem);

    updateGroupsState(newList);
    setDraggedGroupIndex(null);
    setDragOverGroupIndex(null);
  };

  const handleGroupDragEnd = () => {
    setDraggedGroupIndex(null);
    setDragOverGroupIndex(null);
  };

  // 小組改名與刪除
  const handleSaveGroupName = (groupId) => {
    const trimmed = editingGroupName.trim();
    if (!trimmed) return;
    const updatedList = currentGroupList.map(g => g.id === groupId ? { ...g, name: trimmed } : g);
    updateGroupsState(updatedList);
    setEditingGroupId(null);
  };

  const handleDeleteGroup = (group) => {
    if (confirm(`確定要刪除【${shiftName} - ${roleName}】的小組「${group.name}」嗎？\n(小組內指派的路線將自動釋出為未分配)`)) {
      const updatedList = currentGroupList.filter(g => g.id !== group.id);
      updateGroupsState(updatedList);
    }
  };

  const handleMoveGroupUp = (index) => {
    if (index === 0) return;
    const newList = [...currentGroupList];
    const temp = newList[index];
    newList[index] = newList[index - 1];
    newList[index - 1] = temp;
    updateGroupsState(newList);
  };

  const handleMoveGroupDown = (index) => {
    if (index === currentGroupList.length - 1) return;
    const newList = [...currentGroupList];
    const temp = newList[index];
    newList[index] = newList[index + 1];
    newList[index + 1] = temp;
    updateGroupsState(newList);
  };

  return (
    <div className="admin-section">
      <div className="section-header">
        <div>
          <h3>組別管理 (Group Management)</h3>
          <p className="section-desc">
            每條路線<strong>僅能指派給一個小組（不可重複）</strong>。小組內路線支援<strong>「左右拖曳調整作業順序 ① ② ③」</strong>。
          </p>
        </div>
      </div>

      {/* 🔹 第一層：大時段切換 (上午 vs 下午) */}
      <div className="shift-nav-container">
        <button
          className={`shift-nav-card ${activeShift === 'morning' ? 'active' : ''}`}
          onClick={() => setActiveShift('morning')}
        >
          <div className="shift-card-header">
            <Sun size={20} className="shift-icon sun-icon" />
            <span className="shift-title">☀️ 上午時段 (AM)</span>
          </div>
          <span className="shift-summary">
            分秤: {morningSorterCount} 組 ｜ 拉料: {morningPullerCount} 組
          </span>
        </button>

        <button
          className={`shift-nav-card ${activeShift === 'afternoon' ? 'active' : ''}`}
          onClick={() => setActiveShift('afternoon')}
        >
          <div className="shift-card-header">
            <Moon size={20} className="shift-icon moon-icon" />
            <span className="shift-title">🌙 下午時段 (PM)</span>
          </div>
          <span className="shift-summary">
            分秤: {afternoonSorterCount} 組 ｜ 拉料: {afternoonPullerCount} 組
          </span>
        </button>
      </div>

      {/* 🔹 第二層：時段內的身分切換 (分秤 vs 拉料) */}
      <div className="role-switch-container">
        <div className="role-switch-header">
          <span className="current-shift-indicator">
            當前編輯：<strong>【{shiftName}時段】</strong>
          </span>
          <span className="drag-tip-badge">
            ✨ 方案 A：小組內路線標籤可「左右拖曳」直接調整作業順位 ① ② ③
          </span>
        </div>

        <div className="role-segment-bar">
          <button
            className={`role-segment-btn ${activeRole === 'sorter' ? 'active' : ''}`}
            onClick={() => setActiveRole('sorter')}
          >
            <Scale size={18} />
            <span>⚖️ {shiftName}分秤組別</span>
            <span className="segment-badge">
              {activeShift === 'morning' ? morningSorterCount : afternoonSorterCount} 組
            </span>
          </button>

          <button
            className={`role-segment-btn ${activeRole === 'puller' ? 'active' : ''}`}
            onClick={() => setActiveRole('puller')}
          >
            <ArrowRightLeft size={18} />
            <span>📦 {shiftName}拉料組別</span>
            <span className="segment-badge">
              {activeShift === 'morning' ? morningPullerCount : afternoonPullerCount} 組
            </span>
          </button>
        </div>
      </div>

      {/* 新增小組工具列 */}
      <div className="action-bar group-action-bar">
        <form onSubmit={handleAddGroup} className="inline-form">
          <input
            type="text"
            placeholder={`自訂小組名稱 (如: ${shiftName}組別${currentGroupList.length + 1})...`}
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            className="input-text group-name-input"
          />
          <button type="submit" className="btn-primary">
            <Plus size={16} /> 新增{roleName}小組
          </button>
        </form>

        <button
          type="button"
          onClick={handleQuickAddNextGroup}
          className="btn-quick-add-group"
          title="一鍵快速新增下一組"
        >
          <Sparkles size={15} /> 快速新增「組別{currentGroupList.length + 1}」
        </button>
      </div>

      {/* 小組清單表格 */}
      <div className="table-responsive">
        <table className="data-table admin-list-table">
          <thead>
            <tr>
              <th style={{ width: '80px', textAlign: 'center' }}>小組排序</th>
              <th style={{ width: '55px', textAlign: 'center' }}>序號</th>
              <th style={{ width: '140px' }}>小組名稱</th>
              <th>
                本組負責路線（方案A：拖曳標籤可調順序 ① ② ③）與 可加入路線
              </th>
              <th style={{ width: '90px', textAlign: 'center' }}>指派數</th>
              <th style={{ width: '150px', textAlign: 'center' }}>操作功能</th>
            </tr>
          </thead>
          <tbody>
            {currentGroupList.length === 0 ? (
              <tr>
                <td colSpan={6} className="table-empty">
                  【{shiftName} - {roleName}】尚無建立任何組別，請點擊上方按鈕新增小組
                </td>
              </tr>
            ) : (
              currentGroupList.map((group, groupIndex) => {
                const isEditing = editingGroupId === group.id;
                const isBeingDragged = draggedGroupIndex === groupIndex;
                const isDragOver = dragOverGroupIndex === groupIndex;

                // 未被本組選取的路線清單
                const unassignedOrOtherRoutes = currentShiftRoutes.filter(r => !group.routes.includes(r.name));

                return (
                  <tr
                    key={group.id}
                    className={`group-list-row draggable-row ${isBeingDragged ? 'is-dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
                    draggable={!isEditing}
                    onDragStart={(e) => handleGroupDragStart(e, groupIndex)}
                    onDragOver={(e) => handleGroupDragOver(e, groupIndex)}
                    onDrop={(e) => handleGroupDrop(e, groupIndex)}
                    onDragEnd={handleGroupDragEnd}
                  >
                    {/* 小組排序握把 */}
                    <td style={{ textAlign: 'center' }}>
                      <div className="drag-handle-cell">
                        <div
                          className="drag-handle"
                          title="按住此圖示上下拖曳調整小組順序"
                        >
                          <GripVertical size={16} />
                        </div>
                        <div className="order-actions-mini">
                          <button
                            type="button"
                            onClick={() => handleMoveGroupUp(groupIndex)}
                            disabled={groupIndex === 0}
                            className="btn-icon-tiny"
                            title="往上移"
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveGroupDown(groupIndex)}
                            disabled={groupIndex === currentGroupList.length - 1}
                            className="btn-icon-tiny"
                            title="往下移"
                          >
                            <ArrowDown size={12} />
                          </button>
                        </div>
                      </div>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <span className="user-index">#{groupIndex + 1}</span>
                    </td>

                    <td>
                      {isEditing ? (
                        <div className="edit-inline">
                          <input
                            type="text"
                            value={editingGroupName}
                            onChange={(e) => setEditingGroupName(e.target.value)}
                            className="input-text edit-input"
                            autoFocus
                          />
                          <button onClick={() => handleSaveGroupName(group.id)} className="btn-icon btn-save" title="儲存">
                            <Check size={16} />
                          </button>
                          <button onClick={() => setEditingGroupId(null)} className="btn-icon btn-cancel" title="取消">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <span className="group-title-text">🏷️ {group.name}</span>
                      )}
                    </td>

                    {/* 路線指派與順序拖曳區 */}
                    <td>
                      <div className="group-routes-assignment-box">
                        {/* 1. 已指派的路線（支援方案 A 左右拖曳排序） */}
                        <div className="assigned-routes-zone">
                          <span className="zone-label">已排定作業順序：</span>
                          {group.routes.length === 0 ? (
                            <span className="text-dim-small">（尚未分配路線，請點擊下方路線加入）</span>
                          ) : (
                            <div className="assigned-chips-sortable">
                              {group.routes.map((routeName, rIndex) => {
                                const isThisRouteDragged = draggedRouteInfo && draggedRouteInfo.groupId === group.id && draggedRouteInfo.index === rIndex;
                                const isThisRouteDragOver = dragOverRouteInfo && dragOverRouteInfo.groupId === group.id && dragOverRouteInfo.index === rIndex;

                                return (
                                  <div
                                    key={routeName}
                                    className={`ordered-route-chip ${isThisRouteDragged ? 'chip-dragging' : ''} ${isThisRouteDragOver ? 'chip-drag-over' : ''}`}
                                    draggable={true}
                                    onDragStart={(e) => handleRouteDragStart(e, group.id, rIndex)}
                                    onDragOver={(e) => handleRouteDragOver(e, group.id, rIndex)}
                                    onDrop={(e) => handleRouteDrop(e, group.id, rIndex)}
                                    onDragEnd={handleRouteDragEnd}
                                    title="按住左右拖曳可調換作業順序，或點擊 ❌ 移除"
                                  >
                                    <span className="route-order-num">{rIndex + 1}</span>
                                    <span className="route-chip-code">{routeName}</span>
                                    
                                    <div className="chip-micro-actions">
                                      <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); handleMoveRoutePosition(group.id, rIndex, -1); }}
                                        disabled={rIndex === 0}
                                        className="btn-chip-arrow"
                                        title="往前移"
                                      >
                                        <ArrowLeft size={10} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); handleMoveRoutePosition(group.id, rIndex, 1); }}
                                        disabled={rIndex === group.routes.length - 1}
                                        className="btn-chip-arrow"
                                        title="往後移"
                                      >
                                        <ArrowRight size={10} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); handleToggleRouteForGroup(group.id, routeName); }}
                                        className="btn-chip-remove"
                                        title="從本組移除"
                                      >
                                        <X size={12} />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* 2. 可加入的路線庫（防呆不可複選） */}
                        <div className="available-routes-zone">
                          <span className="zone-label-sub">➕ 點擊加入本組：</span>
                          <div className="chips-container-compact">
                            {unassignedOrOtherRoutes.map(route => {
                              const owningGroup = currentGroupList.find(g => g.id !== group.id && g.routes.includes(route.name));
                              const isTaken = !!owningGroup;

                              return (
                                <button
                                  key={route.id}
                                  type="button"
                                  onClick={() => handleToggleRouteForGroup(group.id, route.name)}
                                  className={`chip-btn-compact ${isTaken ? 'chip-taken' : ''} ${!route.active ? 'disabled-route' : ''}`}
                                  title={
                                    isTaken 
                                      ? `已被【${owningGroup.name}】選取（點擊可申請移轉至本組）` 
                                      : `點擊加入【${group.name}】`
                                  }
                                >
                                  <span>{route.name}</span>
                                  {isTaken && <span className="taken-owner-text">({owningGroup.name})</span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <span className="count-tag">{group.routes.length} 條</span>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      {!isEditing && (
                        <div className="table-actions-center">
                          <button
                            onClick={() => {
                              setEditingGroupId(group.id);
                              setEditingGroupName(group.name);
                            }}
                            className="btn-action-pill btn-pill-edit"
                          >
                            <Edit2 size={14} /> 編輯
                          </button>
                          <button onClick={() => handleDeleteGroup(group)} className="btn-action-pill btn-pill-delete">
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
