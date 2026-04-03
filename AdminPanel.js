import React from "react";

function AdminPanel({ users, currentUser, onPromote, onDemote, onBanToggle }) {
  if (!currentUser || currentUser.role !== "admin") {
    return null;
  }

  return (
    <div className="admin-panel">
      <h2>Админ-панель</h2>
      <p className="admin-subtitle">Управление пользователями</p>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Роль</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isCurrentAdmin = user.email === currentUser.email;

              return (
                <tr key={user.email}>
                  <td>{user.email}</td>
                  <td>
                    <span className={user.role === "admin" ? "role-admin" : "role-user"}>
                      {user.role === "admin" ? "Админ" : "Пользователь"}
                    </span>
                  </td>
                  <td>
                    <span className={user.banned ? "status-banned" : "status-active"}>
                      {user.banned ? "Забанен" : "Активен"}
                    </span>
                  </td>
                  <td className="admin-actions">
                    {!isCurrentAdmin && user.role !== "admin" && (
                      <button
                        className="admin-btn promote-btn"
                        onClick={() => onPromote(user.email)}
                      >
                        Сделать админом
                      </button>
                    )}

                    {!isCurrentAdmin && user.role === "admin" && (
                      <button
                        className="admin-btn demote-btn"
                        onClick={() => onDemote(user.email)}
                      >
                        Убрать админа
                      </button>
                    )}

                    {!isCurrentAdmin && (
                      <button
                        className={`admin-btn ${user.banned ? "unban-btn" : "ban-btn"}`}
                        onClick={() => onBanToggle(user.email)}
                      >
                        {user.banned ? "Разбанить" : "Забанить"}
                      </button>
                    )}

                    {isCurrentAdmin && <span className="self-label">Это вы</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminPanel;