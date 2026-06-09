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
          api.get('/leads?t=' + Date.now()),
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
  const cleanPhone = (p) => {
    if (!p) return '';
    const str = String(p).trim();
    // Pure numeric already
    if (/^\d{7,15}$/.test(str)) return str.slice(0, 15);
    // Extract Mob: number from complex strings
    const mob = str.match(/[Mm]ob(?:ile)?\s*:?\s*(\d{7,15})/);
    if (mob) return mob[1].slice(0, 15);
    // Extract any 10-digit sequence
    const digits = str.replace(/\D/g, '');
    const match = digits.match(/[6-9]\d{9}/);
    if (match) return match[0];
    return digits.length >= 7 ? digits.slice(0, 15) : '';
  };

  const getMappedItem = (item) => {
    if (!item) return null;
    return {
      ...item,
      id: item._id || item.id,
      phone: cleanPhone(item.phone),
      email: item.email || '',
      company: item.company || '',
    };
  };

  const isValidPhone = (p) => /^\d{7,15}$/.test((p || '').trim());

  const mappedLeads = leads.map(getMappedItem).sort((a, b) => {
    const aHas = isValidPhone(a.phone) ? 1 : 0;
    const bHas = isValidPhone(b.phone) ? 1 : 0;
    return bHas - aHas;
  });
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

  // Refresh all leads from backend (used after import)
  const refreshLeads = async () => {
    const leadsData = await api.get('/leads?t=' + Date.now());
    setLeads(leadsData.leads || []);
  };

  // Upload CSV for preview — returns { totalRows, previewRows, detectedColumns, filePath }
  const importLeadsPreview = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.postForm('/leads/import/preview', formData);
  };

  // Confirm import using temp filename from preview
  const importLeadsConfirm = async (filename) => {
    const result = await api.post('/leads/import/confirm', { filename });
    await refreshLeads();
    return result;
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
      importLeadsPreview, importLeadsConfirm,
      addFollowUp, updateFollowUp, deleteFollowUp,
      loading
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
