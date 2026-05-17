import { createContext, useContext, useState } from 'react';
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

const DUMMY_TEAM = [
  { id: 2, name: 'Amit Kumar', email: 'amit@salescrm.in', password: 'amit123', role: 'Admin', team: 'Team Alpha', avatar: 'AK', status: 'Active', leads: 18, converted: 7 },
  { id: 3, name: 'Sneha Patel', email: 'sneha@salescrm.in', password: 'sneha123', role: 'Sales Executive', team: 'Team Alpha', avatar: 'SP', status: 'Active', leads: 14, converted: 5 },
  { id: 4, name: 'Rohan Gupta', email: 'rohan@salescrm.in', password: 'rohan123', role: 'Sales Executive', team: 'Team Beta', avatar: 'RG', status: 'Active', leads: 11, converted: 4 },
  { id: 5, name: 'Neha Sharma', email: 'neha@salescrm.in', password: 'neha123', role: 'Sales Executive', team: 'Team Beta', avatar: 'NS', status: 'Active', leads: 9, converted: 3 },
  { id: 6, name: 'Arjun Mehta', email: 'arjun@salescrm.in', password: 'arjun123', role: 'Sales Executive', team: 'Team Gamma', avatar: 'AM', status: 'Inactive', leads: 6, converted: 2 },
];

// Clear old dummy data on first load — one-time migration
const MIGRATION_KEY = 'crm_migrated_v3';
if (!localStorage.getItem(MIGRATION_KEY)) {
  localStorage.removeItem('crm_leads');
  localStorage.removeItem('crm_followups');
  localStorage.removeItem('crm_activities');
  localStorage.removeItem('crm_seeded');
  localStorage.setItem('crm_users', JSON.stringify([SUPER_ADMIN, ...DUMMY_TEAM]));
  localStorage.setItem(MIGRATION_KEY, '1');
}

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

  const allUsers = users;
  const teamMembers = users.filter(u => u.role !== 'Super Admin');

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, addUser, updateUser, updateProfile, deleteUser, teamMembers, allUsers }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
