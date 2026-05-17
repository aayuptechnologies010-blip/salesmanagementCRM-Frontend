import { createContext, useContext } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [leads, setLeads] = useLocalStorage('crm_leads', []);
  const [followUps, setFollowUps] = useLocalStorage('crm_followups', []);
  const [activities, setActivities] = useLocalStorage('crm_activities', []);

  // ── Leads ──
  const addLead = (data) => {
    const newLead = { ...data, id: Date.now(), createdAt: new Date().toISOString().slice(0, 10) };
    setLeads(prev => [...prev, newLead]);
    addActivity(`New lead added: ${data.name}`, data.name, 'add');
    return newLead;
  };

  const updateLead = (id, data) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...data } : l));
    addActivity(`Lead updated: ${data.name}`, data.name, 'edit');
  };

  const deleteLead = (ids) => {
    setLeads(prev => prev.filter(l => !ids.includes(l.id)));
  };

  const assignLead = (ids, assignTo) => {
    setLeads(prev => prev.map(l => ids.includes(l.id) ? { ...l, assignedTo: assignTo } : l));
    addActivity(`${ids.length} lead(s) assigned to ${assignTo}`, assignTo, 'assign');
  };

  // ── Follow-ups ──
  const addFollowUp = (data) => {
    const newFU = { ...data, id: Date.now() };
    setFollowUps(prev => [...prev, newFU]);
    addActivity(`Follow-up scheduled for ${data.lead}`, data.lead, 'followup');
  };

  const updateFollowUp = (id, data) => {
    setFollowUps(prev => prev.map(f => f.id === id ? { ...f, ...data } : f));
  };

  const deleteFollowUp = (id) => {
    setFollowUps(prev => prev.filter(f => f.id !== id));
  };

  // ── Activities ──
  const addActivity = (action, lead, type) => {
    const entry = { id: Date.now(), user: 'Current User', action, lead, time: new Date().toLocaleTimeString(), type };
    setActivities(prev => [entry, ...prev].slice(0, 50));
  };

  return (
    <DataContext.Provider value={{
      leads, addLead, updateLead, deleteLead, assignLead,
      followUps, addFollowUp, updateFollowUp, deleteFollowUp,
      activities,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
