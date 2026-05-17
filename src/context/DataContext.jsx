import { createContext, useContext, useEffect } from 'react';
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
  // ── Activities ──
  const addActivity = (action, lead, type) => {
    const entry = { id: Date.now(), user: 'Current User', action, lead, time: new Date().toLocaleTimeString(), type };
    setActivities(prev => [entry, ...prev].slice(0, 50));
  };

  // ── Seeding Dummy Data ──
  useEffect(() => {
    if (leads.length === 0 && !localStorage.getItem('crm_seeded')) {
      const today = new Date().toISOString().slice(0, 10);
      const d = (offset) => new Date(Date.now() - offset * 86400000).toISOString().slice(0, 10);

      const dummyLeads = [
        { id: 1, name: 'Rahul Sharma', email: 'rahul@techcorp.in', phone: '+91 9876543210', company: 'TechCorp India', value: '50,000', source: 'Website', status: 'New', assignedTo: 'Amit Kumar', createdAt: today },
        { id: 2, name: 'Priya Singh', email: 'priya@designhub.com', phone: '+91 8765432109', company: 'Design Hub', value: '25,000', source: 'Referral', status: 'Negotiation', assignedTo: 'Sneha Patel', createdAt: today },
        { id: 3, name: 'Vikram Mehta', email: 'vikram@logisticsplus.com', phone: '+91 7654321098', company: 'Logistics Plus', value: '1,20,000', source: 'LinkedIn', status: 'Won', assignedTo: 'Amit Kumar', createdAt: d(1) },
        { id: 4, name: 'Ananya Desai', email: 'ananya@startup.io', phone: '+91 6543210987', company: 'Innovate AI', value: '80,000', source: 'Cold Call', status: 'Proposal', assignedTo: 'Rohan Gupta', createdAt: d(1) },
        { id: 5, name: 'Karan Malhotra', email: 'karan@buildwell.in', phone: '+91 9988776655', company: 'BuildWell Construction', value: '45,000', source: 'Website', status: 'Contacted', assignedTo: 'Sneha Patel', createdAt: d(2) },
        { id: 6, name: 'Snehal Verma', email: 'snehal@vermaconsulting.com', phone: '+91 8877665544', company: 'Verma Consulting', value: '30,000', source: 'Conference', status: 'Qualified', assignedTo: 'Amit Kumar', createdAt: d(2) },
        { id: 7, name: 'Rajesh Tiwari', email: 'rajesh@tiwaritraders.com', phone: '+91 7766554433', company: 'Tiwari Traders', value: '15,000', source: 'Referral', status: 'Lost', assignedTo: 'Rohan Gupta', createdAt: d(3) },
        { id: 8, name: 'Meera Joshi', email: 'meera@cloudnine.io', phone: '+91 9123456780', company: 'CloudNine Solutions', value: '95,000', source: 'LinkedIn', status: 'Won', assignedTo: 'Neha Sharma', createdAt: d(3) },
        { id: 9, name: 'Deepak Nair', email: 'deepak@finedge.com', phone: '+91 8012345678', company: 'FinEdge Capital', value: '2,00,000', source: 'Cold Call', status: 'Negotiation', assignedTo: 'Amit Kumar', createdAt: d(4) },
        { id: 10, name: 'Pooja Agarwal', email: 'pooja@retailmax.in', phone: '+91 7890123456', company: 'RetailMax India', value: '60,000', source: 'Website', status: 'Proposal', assignedTo: 'Sneha Patel', createdAt: d(4) },
        { id: 11, name: 'Suresh Reddy', email: 'suresh@agritech.in', phone: '+91 9345678901', company: 'AgriTech Ventures', value: '35,000', source: 'Referral', status: 'New', assignedTo: 'Rohan Gupta', createdAt: d(5) },
        { id: 12, name: 'Kavita Rao', email: 'kavita@mediplus.com', phone: '+91 8456789012', company: 'MediPlus Healthcare', value: '1,50,000', source: 'Conference', status: 'Qualified', assignedTo: 'Neha Sharma', createdAt: d(5) },
        { id: 13, name: 'Nikhil Bansal', email: 'nikhil@eduspark.in', phone: '+91 7567890123', company: 'EduSpark Learning', value: '40,000', source: 'Email Campaign', status: 'Contacted', assignedTo: 'Arjun Mehta', createdAt: d(6) },
        { id: 14, name: 'Ritu Kapoor', email: 'ritu@fashionhub.com', phone: '+91 9678901234', company: 'FashionHub Retail', value: '22,000', source: 'Website', status: 'Lost', assignedTo: 'Sneha Patel', createdAt: d(6) },
        { id: 15, name: 'Aakash Pandey', email: 'aakash@smartbuild.in', phone: '+91 8789012345', company: 'SmartBuild Infra', value: '3,50,000', source: 'LinkedIn', status: 'Won', assignedTo: 'Amit Kumar', createdAt: d(7) },
      ];

      const dummyFollowUps = [
        { id: 101, lead: 'Rahul Sharma', company: 'TechCorp India', date: today, time: '10:00', assignedTo: 'Amit Kumar', priority: 'High', status: 'Pending' },
        { id: 102, lead: 'Karan Malhotra', company: 'BuildWell Construction', date: today, time: '14:30', assignedTo: 'Sneha Patel', priority: 'Medium', status: 'Pending' },
        { id: 103, lead: 'Deepak Nair', company: 'FinEdge Capital', date: today, time: '16:00', assignedTo: 'Amit Kumar', priority: 'High', status: 'Pending' },
        { id: 104, lead: 'Pooja Agarwal', company: 'RetailMax India', date: d(1), time: '11:00', assignedTo: 'Sneha Patel', priority: 'Low', status: 'Done' },
        { id: 105, lead: 'Ananya Desai', company: 'Innovate AI', date: d(1), time: '15:00', assignedTo: 'Rohan Gupta', priority: 'High', status: 'Done' },
        { id: 106, lead: 'Kavita Rao', company: 'MediPlus Healthcare', date: d(2), time: '09:30', assignedTo: 'Neha Sharma', priority: 'Medium', status: 'Pending' },
        { id: 107, lead: 'Nikhil Bansal', company: 'EduSpark Learning', date: d(3), time: '13:00', assignedTo: 'Arjun Mehta', priority: 'Low', status: 'Pending' },
      ];

      const dummyActivities = [
        { id: 201, user: 'Amit Kumar', action: 'Lead converted to Won', lead: 'Aakash Pandey', time: '09:15 AM', type: 'edit' },
        { id: 202, user: 'Sneha Patel', action: 'Follow-up scheduled for Karan Malhotra', lead: 'Karan Malhotra', time: '09:30 AM', type: 'followup' },
        { id: 203, user: 'Rohan Gupta', action: 'New lead added: Suresh Reddy', lead: 'Suresh Reddy', time: '10:00 AM', type: 'add' },
        { id: 204, user: 'Neha Sharma', action: 'Lead assigned: Kavita Rao', lead: 'Kavita Rao', time: '10:45 AM', type: 'assign' },
        { id: 205, user: 'Amit Kumar', action: 'Follow-up completed for Ananya Desai', lead: 'Ananya Desai', time: '11:20 AM', type: 'followup' },
        { id: 206, user: 'Sneha Patel', action: 'Lead updated: Pooja Agarwal', lead: 'Pooja Agarwal', time: '12:00 PM', type: 'edit' },
        { id: 207, user: 'Rohan Gupta', action: 'New lead added: Nikhil Bansal', lead: 'Nikhil Bansal', time: '01:30 PM', type: 'add' },
        { id: 208, user: 'Arjun Mehta', action: 'Lead moved to Negotiation: Deepak Nair', lead: 'Deepak Nair', time: '02:15 PM', type: 'edit' },
      ];

      setLeads(dummyLeads);
      setFollowUps(dummyFollowUps);
      setActivities(dummyActivities);
      localStorage.setItem('crm_seeded', 'true');
    }
  }, [leads.length, setLeads, setFollowUps, setActivities]);

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
