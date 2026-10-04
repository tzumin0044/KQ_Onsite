import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Check, X, UserCheck, UserX, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';

export default function AdminUsers({ users, onUpdateUsers }) {
  const [newUserName, setNewUserName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  // 拖曳狀態
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const handleAddUser = (e) => {
    e.preventDefault();
    const trimmed = newUserName.trim();
    if (!trimmed) return;
    if (users.some(u => u.name === trimmed)) {
      alert(`人員「${trimmed}」已存在！`);
      return;
    }
    const newUser = {
      id: `u_${Date.now()}`,
      name: trimmed,
      active: true
    };
    onUpdateUsers([...users, newUser]);
    setNewUserName('');
  };

  const handleToggleActive = (id) => {
    onUpdateUsers(
      users.map(u => u.id === id ? { ...u, active: !u.active } : u)
    );
  };

  const handleStartEdit = (user) => {
    setEditingId(user.id);
    setEditingName(user.name);
  };

  const handleSaveEdit = (id) => {
    const trimmed = editingName.trim();
    if (!trimmed) return;
    onUpdateUsers(
      users.map(u => u.id === id ? { ...u, name: trimmed } : u)
    );
    setEditingId(null);
  };

  const handleDeleteUser = (user) => {
    if (confirm(`確定要徹底刪除人員「${user.name}」嗎？\n(若只是未出勤，建議使用「停用」即可)`)) {
      onUpdateUsers(users.filter(u => u.id !== user.id));
    }
  };

  // 排序：向上移動
  const handleMoveUp = (index) => {
    if (index === 0) return;
    const newUsers = [...users];
    const temp = newUsers[index];
    newUsers[index] = newUsers[index - 1];
    newUsers[index - 1] = temp;
    onUpdateUsers(newUsers);
  };

  // 排序：向下移動
  const handleMoveDown = (index) => {
    if (index === users.length - 1) return;
    const newUsers = [...users];
    const temp = newUsers[index];
    newUsers[index] = newUsers[index + 1];
    newUsers[index + 1] = temp;
    onUpdateUsers(newUsers);
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

    const newUsers = [...users];
    const [draggedItem] = newUsers.splice(draggedIndex, 1);
    newUsers.splice(dropIndex, 0, draggedItem);

    onUpdateUsers(newUsers);
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
          <h3>人員管理清單 (Staff List)</h3>
          <p className="section-desc">支援點擊或<strong>「直接拖曳 ☰」</strong>調整人員在登入選單中的排列順序。</p>
        </div>
        <form onSubmit={handleAddUser} className="inline-form">
          <input
            type="text"
            placeholder="請輸入人員姓名..."
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            className="input-text"
          />
          <button type="submit" className="btn-primary">
            <Plus size={16} /> 新增人員
          </button>
        </form>
      </div>

      <div className="list-tip-bar">
        <span className="drag-tip-badge">
          <GripVertical size={13} /> 提示：可按住左側 ☰ 圖示直接拖曳上下排序
        </span>
      </div>

      {/* 清單表格 */}
      <div className="table-responsive">
        <table className="data-table admin-list-table">
          <thead>
            <tr>
              <th style={{ width: '80px', textAlign: 'center' }}>拖曳排序</th>
              <th style={{ width: '60px', textAlign: 'center' }}>序號</th>
              <th>人員姓名</th>
              <th style={{ width: '120px', textAlign: 'center' }}>目前狀態</th>
              <th style={{ width: '240px', textAlign: 'center' }}>操作功能</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="table-empty">目前尚無人員資料</td>
              </tr>
            ) : (
              users.map((user, index) => {
                const isEditing = editingId === user.id;
                const isBeingDragged = draggedIndex === index;
                const isDragOver = dragOverIndex === index;

                return (
                  <tr
                    key={user.id}
                    className={`draggable-row ${user.active ? 'row-active' : 'row-inactive'} ${isBeingDragged ? 'is-dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
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
                            disabled={index === users.length - 1}
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
                          <button onClick={() => handleSaveEdit(user.id)} className="btn-icon btn-save" title="儲存">
                            <Check size={16} />
                          </button>
                          <button onClick={() => setEditingId(null)} className="btn-icon btn-cancel" title="取消">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <span className="user-name-text">👤 {user.name}</span>
                      )}
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${user.active ? 'badge-active' : 'badge-inactive'}`}>
                        {user.active ? '啟用中' : '已停用'}
                      </span>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      {!isEditing && (
                        <div className="table-actions-center">
                          <button
                            onClick={() => handleToggleActive(user.id)}
                            className={`btn-action-pill ${user.active ? 'btn-pill-deactivate' : 'btn-pill-activate'}`}
                            title={user.active ? '點擊設為停用' : '點擊設為啟用'}
                          >
                            {user.active ? <><UserX size={14} /> 停用</> : <><UserCheck size={14} /> 啟用</>}
                          </button>
                          <button onClick={() => handleStartEdit(user)} className="btn-action-pill btn-pill-edit">
                            <Edit2 size={14} /> 編輯
                          </button>
                          <button onClick={() => handleDeleteUser(user)} className="btn-action-pill btn-pill-delete">
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
