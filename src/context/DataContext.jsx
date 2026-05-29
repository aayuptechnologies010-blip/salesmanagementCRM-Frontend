import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from './AuthContext';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { currentUser } = useAuth();
  const [leads, setLeads] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all data from backend when user is authenticated
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) {
        setLeads([]);
        setFollowUps([]);
        setActivities([]);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        
        // Fetch dashboard statistics or list APIs
        const [leadsData, followUpsData, activitiesData] = await Promise.all([
          api.get('/leads'),
          api.get('/followups'),
          api.get('/activities'),
        ]);

        setLeads(leadsData.leads || []);
        setFollowUps(followUpsData || []);
        setActivities(activitiesData || []);
      } catch (err) {
        console.error('Failed to fetch data from backend:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  // Helper to map DB _id to frontend id
  const getMappedItem = (item) => {
    if (!item) return null;
    return {
      ...item,
      id: item._id || item.id
    };
  };

  const mappedLeads = leads.map(getMappedItem);
  const mappedFollowUps = followUps.map(getMappedItem);
  const mappedActivities = activities.map(getMappedItem);

  // ── Leads ──
  const addLead = async (data, userName = 'Admin') => {
    const newLead = await api.post('/leads', data);
    setLeads(prev => [newLead, ...prev]);
    
    // Refresh activities
    const activitiesData = await api.get('/activities');
    setActivities(activitiesData);
    
    return getMappedItem(newLead);
  };

  const updateLead = async (id, data, userName = 'Admin') => {
    const updatedLead = await api.patch(`/leads/${id}`, data);
    setLeads(prev => prev.map(l => (l._id === id || l.id === id) ? updatedLead : l));
    
    // Refresh activities
    const activitiesData = await api.get('/activities');
    setActivities(activitiesData);

    return getMappedItem(updatedLead);
  };

  const deleteLead = async (ids) => {
    await api.delete('/leads', { ids });
    setLeads(prev => prev.filter(l => !ids.includes(l._id) && !ids.includes(l.id)));
  };

  const assignLead = async (ids, assignTo, followUpDate = '', userName = 'Admin') => {
    await api.patch('/leads/assign/bulk', { ids, assignedTo: assignTo, followUpDate });
    setLeads(prev => prev.map(l => {
      if (ids.includes(l._id) || ids.includes(l.id)) {
        const updated = { ...l, assignedTo: assignTo };
        if (followUpDate) updated.followUpDate = followUpDate;
        return updated;
      }
      return l;
    }));
    
    // Refresh activities & followups
    const [activitiesData, followUpsData] = await Promise.all([
      api.get('/activities'),
      api.get('/followups')
    ]);
    setActivities(activitiesData);
    setFollowUps(followUpsData || []);
  };

  // ── Follow-ups ──
  const addFollowUp = async (data, userName = 'Admin') => {
    const newFU = await api.post('/followups', data);
    setFollowUps(prev => [newFU, ...prev]);
    
    // Refresh activities
    const activitiesData = await api.get('/activities');
    setActivities(activitiesData);

    return getMappedItem(newFU);
  };

  const updateFollowUp = async (id, data) => {
    const updatedFU = await api.patch(`/followups/${id}`, data);
    setFollowUps(prev => prev.map(f => (f._id === id || f.id === id) ? updatedFU : f));
    return getMappedItem(updatedFU);
  };

  const deleteFollowUp = async (id) => {
    await api.delete(`/followups/${id}`);
    setFollowUps(prev => prev.filter(f => f._id !== id && f.id !== id));
  };

  // ── Role-filtered getters ──
  const getLeadsForUser = (user) => {
    if (!user) return [];
    if (user.role === 'Super Admin' || user.role === 'Admin') return mappedLeads;
    return mappedLeads.filter(l => l.assignedTo === user.name);
  };

  const getFollowUpsForUser = (user) => {
    if (!user) return [];
    if (user.role === 'Super Admin' || user.role === 'Admin') return mappedFollowUps;
    return mappedFollowUps.filter(f => f.assignedTo === user.name);
  };

  const getActivitiesForUser = (user) => {
    if (!user) return [];
    if (user.role === 'Super Admin' || user.role === 'Admin') return mappedActivities;
    return mappedActivities.filter(a => a.user === user.name);
  };

  return (
    <DataContext.Provider value={{
      leads: mappedLeads, 
      followUps: mappedFollowUps, 
      activities: mappedActivities,
      getLeadsForUser, getFollowUpsForUser, getActivitiesForUser,
      addLead, updateLead, deleteLead, assignLead,
      addFollowUp, updateFollowUp, deleteFollowUp,
      loading
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
