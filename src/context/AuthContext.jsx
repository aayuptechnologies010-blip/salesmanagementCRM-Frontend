import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('crm_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Verify token on mount and fetch users if authenticated
  useEffect(() => {
    const verifyUser = async () => {
      const token = localStorage.getItem('crm_token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const user = await api.get('/auth/me');
        setCurrentUser(user);
        localStorage.setItem('crm_session', JSON.stringify(user));
        
        // Fetch all users if admin/super admin
        if (user.role === 'Super Admin' || user.role === 'Admin') {
          const usersList = await api.get('/users');
          setAllUsers(usersList);
        } else {
          const teamList = await api.get('/users/team');
          setAllUsers(teamList);
        }
      } catch (err) {
        console.error('Session verification failed:', err.message);
        // Only clear the credentials if the backend rejects the session (401/403).
        // Otherwise (e.g. network/offline error), we keep the local cached user session.
        if (err.status === 401 || err.status === 403) {
          logout();
        }
      } finally {
        setLoading(false);
      }
    };

    verifyUser();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await api.post('/auth/login', { email, password });
      localStorage.setItem('crm_token', data.token);
      localStorage.setItem('crm_session', JSON.stringify(data.user));
      setCurrentUser(data.user);
      
      // Load users
      if (data.user.role === 'Super Admin' || data.user.role === 'Admin') {
        const usersList = await api.get('/users');
        setAllUsers(usersList);
      } else {
        const teamList = await api.get('/users/team');
        setAllUsers(teamList);
      }
      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_session');
    setCurrentUser(null);
    setAllUsers([]);
  };

  const addUser = async (userData) => {
    const newUser = await api.post('/users', userData);
    setAllUsers(prev => [...prev, newUser]);
    return newUser;
  };

  const updateUser = async (id, userData) => {
    const updatedUser = await api.patch(`/users/${id}`, userData);
    setAllUsers(prev => prev.map(u => u._id === id ? updatedUser : u));
    if (currentUser?._id === id || currentUser?.id === id) {
      setCurrentUser(updatedUser);
      localStorage.setItem('crm_session', JSON.stringify(updatedUser));
    }
    return updatedUser;
  };

  const deleteUser = async (id) => {
    await api.delete(`/users/${id}`);
    setAllUsers(prev => prev.filter(u => u._id !== id && u.id !== id));
  };

  const updateProfile = async (profileData) => {
    const updated = await api.patch('/auth/profile', profileData);
    setCurrentUser(updated);
    localStorage.setItem('crm_session', JSON.stringify(updated));
    setAllUsers(prev => prev.map(u => u._id === updated._id ? updated : u));
    return updated;
  };

  const teamMembers = allUsers.filter(u => u.role !== 'Super Admin');

  // Helper to map old mock id or backend id
  const getMappedUser = (user) => {
    if (!user) return null;
    return {
      ...user,
      id: user._id || user.id
    };
  };

  const mappedCurrentUser = getMappedUser(currentUser);
  const mappedAllUsers = allUsers.map(getMappedUser);
  const mappedTeamMembers = teamMembers.map(getMappedUser);

  return (
    <AuthContext.Provider value={{
      currentUser: mappedCurrentUser, login, logout,
      addUser, updateUser, updateProfile, deleteUser,
      teamMembers: mappedTeamMembers, allUsers: mappedAllUsers,
      loading
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
