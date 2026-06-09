import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from './AuthContext';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { currentUser } = useAuth();
  const [leads, setLeads] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [activities, setActivities] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setLeads([]);
      setFollowUps([]);
      setActivities([]);
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      try {
        setLoading(true);
        const [leadsData, followUpsData, invoicesData] = await Promise.all([
          api.get('/leads'),
          api.get('/followups'),
          api.get('/invoices'),
        ]);
        setLeads(leadsData.leads || []);
        setFollowUps(followUpsData || []);
        setInvoices(invoicesData || []);
      } catch (err) {
        console.error('Failed to fetch data:', err.message);
      } finally {
        setLoading(false);
      }
      // Activities load in background — non-blocking
      try {
        const activitiesData = await api.get('/activities');
        setActivities(activitiesData || []);
      } catch (_) {}
    };
    fetchData();
  }, [currentUser]);

  const cleanPhone = (p) => {
    if (!p) return '';
    const str = String(p).trim();
    if (/^\d{7,15}$/.test(str)) return str.slice(0, 15);
    const mob = str.match(/[Mm]ob(?:ile)?\s*:?\s*(\d{7,15})/);
    if (mob) return mob[1].slice(0, 15);
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

  const mappedLeads = leads.map(getMappedItem);
  const mappedFollowUps = followUps.map(getMappedItem);
  const mappedActivities = activities.map(getMappedItem);

  // ── Leads ──
  const addLead = async (data, userName = 'Admin') => {
    const newLead = await api.post('/leads', data);
    setLeads(prev => [newLead, ...prev]);
    return getMappedItem(newLead);
  };

  const updateLead = async (id, data, userName = 'Admin') => {
    const updatedLead = await api.patch(`/leads/${id}`, data);
    setLeads(prev => prev.map(l => {
      if (l._id === id || l.id === id) return { ...l, ...updatedLead };
      return l;
    }));
    return getMappedItem(updatedLead);
  };

  const deleteLead = async (ids) => {
    await api.delete('/leads', { ids });
    setLeads(prev => prev.filter(l => !ids.includes(l._id) && !ids.includes(l.id)));
  };

  const refreshLeads = async () => {
    const leadsData = await api.get('/leads');
    setLeads(leadsData.leads || []);
  };

  const addInvoice = async (data) => {
    const newInvoice = await api.post('/invoices', data);
    setInvoices(prev => [newInvoice, ...prev]);
    return newInvoice;
  };

  const updateInvoice = async (id, data) => {
    const updated = await api.patch(`/invoices/${id}`, data);
    setInvoices(prev => prev.map(inv => (inv._id === id || inv.id === id) ? updated : inv));
    return updated;
  };

  const deleteInvoice = async (id) => {
    await api.delete(`/invoices/${id}`);
    setInvoices(prev => prev.filter(inv => inv._id !== id && inv.id !== id));
  };

  const importLeadsPreview = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.postForm('/leads/import/preview', formData);
  };

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
    if (followUpDate) {
      const followUpsData = await api.get('/followups');
      setFollowUps(followUpsData || []);
    }
  };

  // ── Follow-ups ──
  const addFollowUp = async (data, userName = 'Admin') => {
    const newFU = await api.post('/followups', data);
    setFollowUps(prev => [newFU, ...prev]);
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
      invoices,
      getLeadsForUser, getFollowUpsForUser, getActivitiesForUser,
      addLead, updateLead, deleteLead, assignLead,
      importLeadsPreview, importLeadsConfirm, refreshLeads,
      addFollowUp, updateFollowUp, deleteFollowUp,
      addInvoice, updateInvoice, deleteInvoice,
      loading
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
