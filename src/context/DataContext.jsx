import { createContext, useContext } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [leads, setLeads] = useLocalStorage('crm_leads', []);
  const [followUps, setFollowUps] = useLocalStorage('crm_followups', []);
  const [activities, setActivities] = useLocalStorage('crm_activities', []);

  // ── Leads ──
  const addLead = (data, userName = 'Admin') => {
    const newLead = { ...data, id: Date.now(), createdAt: new Date().toISOString().slice(0, 10) };
    setLeads(prev => [...prev, newLead]);
    _addActivity(`New lead added: ${data.name}`, data.name, 'add', userName);
    return newLead;
  };

  const updateLead = (id, data, userName = 'Admin') => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...data } : l));
    _addActivity(`Lead updated: ${data.name}`, data.name, 'edit', userName);
  };

  const deleteLead = (ids) => {
    setLeads(prev => prev.filter(l => !ids.includes(l.id)));
  };

  const assignLead = (ids, assignTo, userName = 'Admin') => {
    setLeads(prev => prev.map(l => ids.includes(l.id) ? { ...l, assignedTo: assignTo } : l));
    _addActivity(`${ids.length} lead(s) assigned to ${assignTo}`, assignTo, 'assign', userName);
  };

  // ── Follow-ups ──
  const addFollowUp = (data, userName = 'Admin') => {
    const newFU = { ...data, id: Date.now() };
    setFollowUps(prev => [...prev, newFU]);
    _addActivity(`Follow-up scheduled for ${data.lead}`, data.lead, 'followup', userName);
  };

  const updateFollowUp = (id, data) => {
    setFollowUps(prev => prev.map(f => f.id === id ? { ...f, ...data } : f));
  };

  const deleteFollowUp = (id) => {
    setFollowUps(prev => prev.filter(f => f.id !== id));
  };

  // ── Activities ──
  const _addActivity = (action, lead, type, user = 'Admin') => {
    const entry = { id: Date.now(), user, action, lead, time: new Date().toLocaleTimeString(), type };
    setActivities(prev => [entry, ...prev].slice(0, 100));
  };

  // ── Role-filtered getters ──
  const getLeadsForUser = (currentUser) => {
    if (!currentUser) return [];
    if (currentUser.role === 'Super Admin' || currentUser.role === 'Admin') return leads;
    return leads.filter(l => l.assignedTo === currentUser.name);
  };

  const getFollowUpsForUser = (currentUser) => {
    if (!currentUser) return [];
    if (currentUser.role === 'Super Admin' || currentUser.role === 'Admin') return followUps;
    return followUps.filter(f => f.assignedTo === currentUser.name);
  };

  const getActivitiesForUser = (currentUser) => {
    if (!currentUser) return [];
    if (currentUser.role === 'Super Admin' || currentUser.role === 'Admin') return activities;
    return activities.filter(a => a.user === currentUser.name);
  };

  return (
    <DataContext.Provider value={{
      leads, followUps, activities,
      getLeadsForUser, getFollowUpsForUser, getActivitiesForUser,
      addLead, updateLead, deleteLead, assignLead,
      addFollowUp, updateFollowUp, deleteFollowUp,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
