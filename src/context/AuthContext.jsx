import { createContext, useContext } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const AuthContext = createContext(null);

const SUPER_ADMIN = {
  id: 1,
  name: 'Super Admin',
  email: 'aayup@gmail.com',
  password: 'aayup2025',
  role: 'Super Admin',
  team: '-',
  avatar: 'SA',
  status: 'Active',
  leads: 0,
  converted: 0,
};

export function AuthProvider({ children }) {
  const [users, setUsers] = useLocalStorage('crm_users', [SUPER_ADMIN]);
  const [currentUser, setCurrentUser] = useLocalStorage('crm_session', null);

  const login = (email, password) => {
    const user = users.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (user) {
      setCurrentUser(user);
      return { success: true, user };
    }
    return { success: false };
  };

  const logout = () => setCurrentUser(null);

  const addUser = (userData) => {
    const initials = userData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const newUser = { ...userData, id: Date.now(), avatar: initials, leads: 0, converted: 0 };
    setUsers(prev => [...prev, newUser]);
    return newUser;
  };

  const updateUser = (id, userData) => {
    const initials = userData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...userData, avatar: initials } : u));
    if (currentUser?.id === id) setCurrentUser(prev => ({ ...prev, ...userData, avatar: initials }));
  };

  const updateProfile = (profileData) => {
    const initials = profileData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const updated = { ...currentUser, ...profileData, avatar: initials };
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
    setCurrentUser(updated);
  };

  const deleteUser = (id) => setUsers(prev => prev.filter(u => u.id !== id));

  const teamMembers = users.filter(u => u.role !== 'Super Admin');

  return (
    <AuthContext.Provider value={{
      currentUser, login, logout,
      addUser, updateUser, updateProfile, deleteUser,
      teamMembers, allUsers: users,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
