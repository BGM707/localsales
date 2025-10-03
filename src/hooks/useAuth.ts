import { useState, useEffect, useCallback } from 'react';

export interface User {
  id: number;
  username: string;
  password: string;
  role: 'admin' | 'user';
  created_at: string;
  last_login?: string;
  is_active: boolean;
}

export interface SecurityLog {
  id: number;
  user_id: number;
  username: string;
  action: string;
  details: string;
  ip_address?: string;
  created_at: string;
}

export const useAuth = (db: any) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const initializeAuth = useCallback(async () => {
    if (!db) return;

    try {
      // Crear tabla de usuarios
      db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT DEFAULT 'user',
          is_active BOOLEAN DEFAULT TRUE,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          last_login TEXT
        )
      `);

      // Crear tabla de logs de seguridad
      db.exec(`
        CREATE TABLE IF NOT EXISTS security_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          username TEXT,
          action TEXT NOT NULL,
          details TEXT,
          ip_address TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Verificar si existe admin
      const adminCheck = db.exec(`SELECT COUNT(*) FROM users WHERE role = 'admin'`);
      const adminCount = adminCheck[0]?.values[0][0] || 0;

      if (adminCount === 0) {
        db.exec(`
          INSERT INTO users (username, password, role, is_active) 
          VALUES ('admin', 'admin123', 'admin', TRUE)
        `);
      }

      // Cargar sesión almacenada
      const storedUser = localStorage.getItem('pos_current_user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        const userCheck = db.exec(
          'SELECT * FROM users WHERE id = ? AND is_active = TRUE',
          [userData.id]
        );

        if (userCheck[0]?.values?.length > 0) {
          const row = userCheck[0].values[0];
          setCurrentUser({
            id: row[0],
            username: row[1],
            password: row[2],
            role: row[3],
            is_active: row[4],
            created_at: row[5],
            last_login: row[6]
          });
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('pos_current_user');
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      setLoading(false);
    }
  }, [db]);

  const logSecurityEvent = useCallback(
    (action: string, details: string, userId?: number) => {
      if (!db) return;
      try {
        db.exec(
          'INSERT INTO security_logs (user_id, username, action, details) VALUES (?, ?, ?, ?)',
          [userId || null, currentUser?.username || 'Unknown', action, details]
        );
      } catch (error) {
        console.error('Error logging security event:', error);
      }
    },
    [db, currentUser]
  );

  const login = useCallback(
    async (username: string, password: string): Promise<boolean> => {
      if (!db) return false;

      try {
        const result = db.exec(
          'SELECT * FROM users WHERE username = ? AND password = ? AND is_active = TRUE',
          [username, password]
        );

        if (result[0]?.values?.length > 0) {
          const row = result[0].values[0];
          const user: User = {
            id: row[0],
            username: row[1],
            password: row[2],
            role: row[3],
            is_active: row[4],
            created_at: row[5],
            last_login: row[6]
          };

          db.exec('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
          logSecurityEvent('LOGIN_SUCCESS', `User ${username} logged in`, user.id);

          setCurrentUser(user);
          setIsAuthenticated(true);
          localStorage.setItem('pos_current_user', JSON.stringify(user));
          return true;
        }

        logSecurityEvent('LOGIN_FAILED', `Failed login attempt for ${username}`);
        return false;
      } catch (error) {
        console.error('Login error:', error);
        logSecurityEvent('LOGIN_ERROR', `Error logging in ${username} - ${error}`);
        return false;
      }
    },
    [db, logSecurityEvent]
  );

  const logout = useCallback(() => {
    if (currentUser) {
      logSecurityEvent('LOGOUT', `User ${currentUser.username} logged out`, currentUser.id);
    }
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('pos_current_user');
  }, [currentUser, logSecurityEvent]);

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string): Promise<boolean> => {
      if (!db || !currentUser) return false;

      try {
        const result = db.exec(
          'SELECT * FROM users WHERE id = ? AND password = ?',
          [currentUser.id, currentPassword]
        );

        if (result[0]?.values?.length > 0) {
          db.exec('UPDATE users SET password = ? WHERE id = ?', [newPassword, currentUser.id]);
          logSecurityEvent('PASSWORD_CHANGED', `User ${currentUser.username} changed password`, currentUser.id);

          const updatedUser = { ...currentUser, password: newPassword };
          setCurrentUser(updatedUser);
          localStorage.setItem('pos_current_user', JSON.stringify(updatedUser));
          return true;
        }
        return false;
      } catch (error) {
        console.error('Change password error:', error);
        return false;
      }
    },
    [db, currentUser, logSecurityEvent]
  );

  const createUser = useCallback(
    async (
      username: string,
      password: string,
      role: 'admin' | 'user' = 'user',
      isActive: boolean = true
    ): Promise<boolean> => {
      if (!db || !currentUser || currentUser.role !== 'admin') return false;

      try {
        db.exec('INSERT INTO users (username, password, role, is_active) VALUES (?, ?, ?, ?)', [
          username,
          password,
          role,
          isActive
        ]);
        logSecurityEvent(
          'USER_CREATED',
          `Admin ${currentUser.username} created user ${username} (${role})`,
          currentUser.id
        );
        return true;
      } catch (error) {
        console.error('Create user error:', error);
        return false;
      }
    },
    [db, currentUser, logSecurityEvent]
  );

  const getUsers = useCallback((): User[] => {
    if (!db || !currentUser || currentUser.role !== 'admin') return [];
    try {
      const result = db.exec('SELECT * FROM users ORDER BY created_at DESC');
      return result[0]?.values?.map((row: any[]) => ({
        id: row[0],
        username: row[1],
        password: row[2],
        role: row[3],
        is_active: row[4],
        created_at: row[5],
        last_login: row[6]
      })) || [];
    } catch (error) {
      console.error('Get users error:', error);
      return [];
    }
  }, [db, currentUser]);

  const toggleUserStatus = useCallback(
    async (userId: number, isActive: boolean): Promise<boolean> => {
      if (!db || !currentUser || currentUser.role !== 'admin' || userId === currentUser.id) return false;
      try {
        const res = db.exec('SELECT username FROM users WHERE id = ?', [userId]);
        const username = res[0]?.values[0][0];
        db.exec('UPDATE users SET is_active = ? WHERE id = ?', [isActive, userId]);
        logSecurityEvent(
          'USER_STATUS_CHANGED',
          `Admin ${currentUser.username} ${isActive ? 'activated' : 'deactivated'} ${username}`,
          currentUser.id
        );
        return true;
      } catch (error) {
        console.error('Toggle user status error:', error);
        return false;
      }
    },
    [db, currentUser, logSecurityEvent]
  );

  const deleteUser = useCallback(
    async (userId: number): Promise<boolean> => {
      if (!db || !currentUser || currentUser.role !== 'admin' || userId === currentUser.id) return false;
      try {
        const res = db.exec('SELECT username FROM users WHERE id = ?', [userId]);
        const username = res[0]?.values[0][0];
        db.exec('DELETE FROM users WHERE id = ?', [userId]);
        logSecurityEvent('USER_DELETED', `Admin ${currentUser.username} deleted ${username}`, currentUser.id);
        return true;
      } catch (error) {
        console.error('Delete user error:', error);
        return false;
      }
    },
    [db, currentUser, logSecurityEvent]
  );

  const getSecurityLogs = useCallback((): SecurityLog[] => {
    if (!db || !currentUser || currentUser.role !== 'admin') return [];
    try {
      const result = db.exec('SELECT * FROM security_logs ORDER BY created_at DESC LIMIT 100');
      return result[0]?.values?.map((row: any[]) => ({
        id: row[0],
        user_id: row[1],
        username: row[2],
        action: row[3],
        details: row[4],
        ip_address: row[5],
        created_at: row[6]
      })) || [];
    } catch (error) {
      console.error('Get security logs error:', error);
      return [];
    }
  }, [db, currentUser]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return {
    isAuthenticated,
    currentUser,
    loading,
    login,
    logout,
    changePassword,
    createUser,
    getUsers,
    toggleUserStatus,
    deleteUser,
    getSecurityLogs,
    logSecurityEvent
  };
};
