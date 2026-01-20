import React, { useState, useEffect } from 'react';
import { LogOut, Users, Package, BarChart3, Trash2, Eye, TrendingUp, MessageSquare } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Threads from './Prism.jsx';
import AdminConversations from './AdminConversations';

// Helper function to format date as DD/MMM/YYYY
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleString('en-US', { month: 'short' }).toLowerCase();
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

function AdminDashboard({ onLogout }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [pendingPosts, setPendingPosts] = useState([]);
  const [approvedPosts, setApprovedPosts] = useState([]);
  const [rejectedPosts, setRejectedPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [statusSubTab, setStatusSubTab] = useState('pending');
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState('daily');
  const [dailyData, setDailyData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [locationData, setLocationData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  const token = localStorage.getItem('adminToken');
  const adminEmail = localStorage.getItem('adminEmail');

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboardStats();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'items') {
      fetchItems();
    } else if (activeTab === 'status') {
      fetchPendingPosts();
    } else if (activeTab === 'analytics') {
      fetchAnalyticsData();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'status') {
      if (statusSubTab === 'pending') {
        fetchPendingPosts();
      } else if (statusSubTab === 'approved') {
        fetchApprovedPosts();
      } else if (statusSubTab === 'rejected') {
        fetchRejectedPosts();
      }
    }
  }, [statusSubTab]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('http://localhost:3005/api/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data.stats);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('http://localhost:3005/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data.users);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('http://localhost:3005/api/admin/items', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch items');
      const data = await response.json();
      console.log('Fetched items from API:', data.items);
      setItems(data.items);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching items:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`http://localhost:3005/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to delete user');
      setSuccessMsg('User deleted successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await fetch(`http://localhost:3005/api/admin/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to delete item');
      setSuccessMsg('Item deleted successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchItems();
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchPendingPosts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('http://localhost:3005/api/admin/posts/pending', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch pending posts');
      const data = await response.json();
      setPendingPosts(data.items);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching pending posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovedPosts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('http://localhost:3005/api/admin/posts/approved', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch approved posts');
      const data = await response.json();
      setApprovedPosts(data.items);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching approved posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRejectedPosts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('http://localhost:3005/api/admin/posts/rejected', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch rejected posts');
      const data = await response.json();
      setRejectedPosts(data.items);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching rejected posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const approvePost = async (itemId) => {
    try {
      const response = await fetch(`http://localhost:3005/api/admin/posts/${itemId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to approve post');
      setSuccessMsg('Post approved successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchPendingPosts();
    } catch (err) {
      setError(err.message);
    }
  };

  const rejectPost = async (itemId) => {
    try {
      const response = await fetch(`http://localhost:3005/api/admin/posts/${itemId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to reject post');
      setSuccessMsg('Post rejected successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchPendingPosts();
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch all items to calculate analytics
      const response = await fetch('http://localhost:3005/api/admin/items', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch items for analytics');
      const data = await response.json();
      const allItems = data.items || [];

      // Process daily data (last 7 days)
      const dailyMap = {};
      const weeklyMap = {};
      const monthlyMap = {};
      const categoryMap = {};
      const locationMap = {};

      const now = new Date();
      
      allItems.forEach(item => {
        const itemDate = new Date(item.posted_at);
        const daysAgo = Math.floor((now - itemDate) / (1000 * 60 * 60 * 24));
        
        // Daily (last 7 days)
        if (daysAgo <= 7) {
          const dayKey = itemDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (!dailyMap[dayKey]) dailyMap[dayKey] = { date: dayKey, lost: 0, found: 0 };
          if (item.post_type === 'lost') dailyMap[dayKey].lost++;
          else if (item.post_type === 'found') dailyMap[dayKey].found++;
        }

        // Weekly (last 4 weeks)
        const weekNum = Math.floor(daysAgo / 7);
        if (weekNum <= 4) {
          const weekKey = `Week ${4 - weekNum}`;
          if (!weeklyMap[weekKey]) weeklyMap[weekKey] = { week: weekKey, lost: 0, found: 0 };
          if (item.post_type === 'lost') weeklyMap[weekKey].lost++;
          else if (item.post_type === 'found') weeklyMap[weekKey].found++;
        }

        // Monthly (last 12 months)
        const monthNum = Math.floor(daysAgo / 30);
        if (monthNum <= 12) {
          const monthKey = itemDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
          if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { month: monthKey, lost: 0, found: 0 };
          if (item.post_type === 'lost') monthlyMap[monthKey].lost++;
          else if (item.post_type === 'found') monthlyMap[monthKey].found++;
        }

        // Category
        const category = item.category || 'Other';
        if (!categoryMap[category]) categoryMap[category] = { name: category, value: 0 };
        categoryMap[category].value++;

        // Location
        const location = item.location || 'Unknown';
        if (!locationMap[location]) locationMap[location] = { location, count: 0 };
        locationMap[location].count++;
      });

      setDailyData(Object.values(dailyMap).reverse());
      setWeeklyData(Object.values(weeklyMap));
      setMonthlyData(Object.values(monthlyMap));
      setCategoryData(Object.values(categoryMap));
      setLocationData(Object.values(locationMap).sort((a, b) => b.count - a.count).slice(0, 10));
    } catch (err) {
      setError(err.message);
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminEmail');
    onLogout();
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0b0b0b', color: '#ffffff', position: 'relative', overflowX: 'hidden' }}>
      {/* Animated background */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}>
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          <Threads amplitude={1} distance={0.2} enableMouseInteraction={false} />
        </div>
      </div>

      {/* Content wrapper */}
      <div style={{ position: 'relative', zIndex: 1 }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'rgba(26, 26, 46, 0.95)',
        color: 'white',
        padding: '1.5rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 'bold' }}>FindSync Admin</h1>
            <p style={{ margin: '0.5rem 0 0 0', opacity: 0.8, fontSize: '0.9rem' }}>Welcome, {adminEmail}</p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        backgroundColor: 'rgba(26, 26, 46, 0.8)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        padding: '0 1.5rem',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', gap: '2rem' }}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'items', label: 'Items', icon: Package },
            { id: 'conversations', label: 'Conversations', icon: MessageSquare },
            { id: 'status', label: 'Status', icon: Eye },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '1rem 0',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: activeTab === tab.id ? '600' : '500',
                  color: activeTab === tab.id ? '#a78bfa' : 'rgba(255,255,255,0.6)',
                  transition: 'all 0.3s ease'
                }}
              >
                <Icon size={20} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Success Message */}
        {successMsg && (
          <div style={{
            padding: '1rem',
            marginBottom: '1.5rem',
            backgroundColor: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '6px',
            color: '#86efac'
          }}>
            ✓ {successMsg}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{
            padding: '1rem',
            marginBottom: '1.5rem',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '6px',
            color: '#fca5a5'
          }}>
            ✗ {error}
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
            ) : stats ? (
              <div>
                {/* Stats Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                  <div style={{
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    borderLeft: '4px solid #a78bfa',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Total Users</p>
                        <h3 style={{ margin: '0.5rem 0 0 0', fontSize: '2rem', fontWeight: 'bold', color: '#ffffff' }}>
                          {stats.totalUsers}
                        </h3>
                      </div>
                      <Users size={40} color="#a78bfa" opacity={0.3} />
                    </div>
                  </div>

                  <div style={{
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    borderLeft: '4px solid #22c55e',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Total Items</p>
                        <h3 style={{ margin: '0.5rem 0 0 0', fontSize: '2rem', fontWeight: 'bold', color: '#ffffff' }}>
                          {stats.totalItems}
                        </h3>
                      </div>
                      <Package size={40} color="#22c55e" opacity={0.3} />
                    </div>
                  </div>
                </div>

                {/* Recent Users */}
                <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: 'bold', color: '#ffffff' }}>Recent Users</h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                          <th style={{ textAlign: 'left', padding: '0.75rem', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>Name</th>
                          <th style={{ textAlign: 'left', padding: '0.75rem', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>Email</th>
                          <th style={{ textAlign: 'left', padding: '0.75rem', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentUsers && stats.recentUsers.map(user => (
                          <tr key={user.user_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '0.75rem', color: '#ffffff' }}>{user.name || 'N/A'}</td>
                            <td style={{ padding: '0.75rem', color: '#ffffff' }}>{user.email}</td>
                            <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>{formatDate(user.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recent Items */}
                <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: 'bold', color: '#ffffff' }}>Recent Items</h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                          <th style={{ textAlign: 'left', padding: '0.75rem', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>Item Name</th>
                          <th style={{ textAlign: 'left', padding: '0.75rem', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>Posted</th>
                          <th style={{ textAlign: 'center', padding: '0.75rem', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentItems && stats.recentItems.map(item => (
                          <tr key={item.item_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '0.75rem', color: '#ffffff' }}>{item.item_name}</td>
                            <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                              {formatDate(item.posted_at)}
                            </td>
                            <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                              <button
                                onClick={() => {
                                  console.log('Selected item from recent:', item);
                                  setSelectedItem(item);
                                }}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  padding: '0.4rem 0.8rem',
                                  backgroundColor: '#3b82f6',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem'
                                }}
                              >
                                <Eye size={14} />
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem' }}>No data available</div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.2rem', fontWeight: 'bold', color: '#ffffff' }}>All Users</h3>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
            ) : users.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                      <th style={{ textAlign: 'left', padding: '0.75rem', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>ID</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>Name</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>Email</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>Mobile</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>Joined</th>
                      <th style={{ textAlign: 'center', padding: '0.75rem', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.user_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '0.75rem', color: '#ffffff' }}>{user.user_id}</td>
                        <td style={{ padding: '0.75rem', color: '#ffffff' }}>{user.name || 'N/A'}</td>
                        <td style={{ padding: '0.75rem', color: '#ffffff' }}>{user.email}</td>
                        <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>{user.mobile || 'N/A'}</td>
                        <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>{formatDate(user.created_at)}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          <button
                            onClick={() => deleteUser(user.user_id)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.5rem 1rem',
                              backgroundColor: '#e74c3c',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.85rem'
                            }}
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.6)' }}>No users found</div>
            )}
          </div>
        )}

        {/* Items Tab */}
        {activeTab === 'items' && (
          <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.2rem', fontWeight: 'bold', color: '#ffffff' }}>All Items</h3>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
            ) : items.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                      <th style={{ textAlign: 'left', padding: '0.75rem', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>ID</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>Item Name</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>Type</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>Posted By</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>Status</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>Created</th>
                      <th style={{ textAlign: 'center', padding: '0.75rem', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.item_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '0.75rem', color: '#ffffff' }}>{item.item_id}</td>
                        <td style={{ padding: '0.75rem', color: '#ffffff' }}>{item.item_name}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.75rem',
                            backgroundColor: item.post_type === 'found' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: item.post_type === 'found' ? '#86efac' : '#fca5a5',
                            borderRadius: '4px',
                            fontSize: '0.85rem',
                            fontWeight: '500',
                            textTransform: 'capitalize'
                          }}>
                            {item.post_type || 'N/A'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.35rem 0.75rem',
                            backgroundColor: item.post_type === 'found' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            color: item.post_type === 'found' ? '#86efac' : '#fca5a5',
                            borderRadius: '4px',
                            fontSize: '0.85rem',
                            fontWeight: '600'
                          }}>
                            {item.post_type === 'found' ? '✓ Finder:' : '🔍 Lost by:'} {item.user_name || 'Unknown'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.75rem',
                            backgroundColor: item.status === 'open' ? 'rgba(251, 146, 60, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                            color: item.status === 'open' ? '#fed7aa' : '#86efac',
                            borderRadius: '4px',
                            fontSize: '0.85rem',
                            fontWeight: '500',
                            textTransform: 'capitalize'
                          }}>
                            {item.status || 'N/A'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>{formatDate(item.posted_at || item.created_at)}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'center', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button
                            onClick={() => {
                              console.log('Selected item details:', item);
                              setSelectedItem(item);
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.5rem 1rem',
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.85rem'
                            }}
                          >
                            <Eye size={16} />
                            View
                          </button>
                          <button
                            onClick={() => deleteItem(item.item_id)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.5rem 1rem',
                              backgroundColor: '#e74c3c',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.85rem'
                            }}
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.6)' }}>No items found</div>
            )}
          </div>
        )}

        {/* Status Tab */}
        {activeTab === 'status' && (
          <div>
            {/* Sub-tabs for Status */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              marginBottom: '1.5rem',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              paddingBottom: '1rem'
            }}>
              {[
                { id: 'pending', label: 'Pending', color: '#f59e0b' },
                { id: 'approved', label: 'Approved', color: '#10b981' },
                { id: 'rejected', label: 'Rejected', color: '#ef4444' }
              ].map(subTab => (
                <button
                  key={subTab.id}
                  onClick={() => setStatusSubTab(subTab.id)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    backgroundColor: statusSubTab === subTab.id ? `${subTab.color}20` : 'transparent',
                    color: statusSubTab === subTab.id ? subTab.color : 'rgba(255,255,255,0.6)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: statusSubTab === subTab.id ? '600' : '500',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {subTab.label}
                </button>
              ))}
            </div>

            {/* Pending Posts */}
            {statusSubTab === 'pending' && (
              <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.2rem', fontWeight: 'bold', color: '#ffffff' }}>Pending Posts for Approval</h3>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
                ) : pendingPosts.length > 0 ? (
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {pendingPosts.map(post => (
                      <div key={post.item_id} style={{
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        borderRadius: '8px',
                        padding: '1.5rem'
                      }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                          <div>
                            <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Item Name</p>
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.1rem', fontWeight: '600', color: '#ffffff' }}>{post.item_name}</p>
                          </div>
                          <div>
                            <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Post Type</p>
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.1rem', fontWeight: '600', color: '#ffffff', textTransform: 'capitalize' }}>{post.post_type}</p>
                          </div>
                          <div>
                            <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Category</p>
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.1rem', fontWeight: '600', color: '#ffffff' }}>{post.category}</p>
                          </div>
                          <div>
                            <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Location</p>
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.1rem', fontWeight: '600', color: '#ffffff' }}>{post.location}</p>
                          </div>
                          <div>
                            <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Venue</p>
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.1rem', fontWeight: '600', color: '#ffffff' }}>{post.location}</p>
                          </div>
                          <div>
                            <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Date Posted</p>
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.1rem', fontWeight: '600', color: '#ffffff' }}>{formatDate(post.posted_at)}</p>
                          </div>
                        </div>
                        <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Description</p>
                          <p style={{ margin: '0.5rem 0 0 0', color: '#ffffff' }}>{post.description}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                          <button
                            onClick={() => approvePost(post.item_id)}
                            style={{
                              flex: 1,
                              padding: '0.75rem 1rem',
                              backgroundColor: 'rgba(16, 185, 129, 0.2)',
                              border: '1px solid rgba(16, 185, 129, 0.5)',
                              color: '#10b981',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: '600',
                              transition: 'all 0.3s ease'
                            }}
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => rejectPost(post.item_id)}
                            style={{
                              flex: 1,
                              padding: '0.75rem 1rem',
                              backgroundColor: 'rgba(239, 68, 68, 0.2)',
                              border: '1px solid rgba(239, 68, 68, 0.5)',
                              color: '#ef4444',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: '600',
                              transition: 'all 0.3s ease'
                            }}
                          >
                            ✕ Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.6)' }}>No pending posts</div>
                )}
              </div>
            )}

            {/* Approved Posts */}
            {statusSubTab === 'approved' && (
              <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.2rem', fontWeight: 'bold', color: '#ffffff' }}>Approved Posts</h3>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
                ) : approvedPosts.length > 0 ? (
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {approvedPosts.map(post => (
                      <div key={post.item_id} style={{
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '8px',
                        padding: '1.5rem'
                      }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div>
                            <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Item Name</p>
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.1rem', fontWeight: '600', color: '#ffffff' }}>{post.item_name}</p>
                          </div>
                          <div>
                            <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Post Type</p>
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.1rem', fontWeight: '600', color: '#ffffff', textTransform: 'capitalize' }}>{post.post_type}</p>
                          </div>
                          <div>
                            <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Category</p>
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.1rem', fontWeight: '600', color: '#ffffff' }}>{post.category}</p>
                          </div>
                          <div>
                            <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Location</p>
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.1rem', fontWeight: '600', color: '#ffffff' }}>{post.location}</p>
                          </div>
                          <div>
                            <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Venue</p>
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.1rem', fontWeight: '600', color: '#ffffff' }}>{post.location}</p>
                          </div>
                          <div>
                            <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Date Posted</p>
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.1rem', fontWeight: '600', color: '#ffffff' }}>{formatDate(post.posted_at)}</p>
                          </div>
                        </div>
                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                          <p style={{ margin: 0, color: '#10b981', fontSize: '0.9rem', fontWeight: '600' }}>✓ Approved</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.6)' }}>No approved posts</div>
                )}
              </div>
            )}

            {/* Rejected Posts */}
            {statusSubTab === 'rejected' && (
              <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.2rem', fontWeight: 'bold', color: '#ffffff' }}>Rejected Posts</h3>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
                ) : rejectedPosts.length > 0 ? (
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {rejectedPosts.map(post => (
                      <div key={post.item_id} style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '8px',
                        padding: '1.5rem'
                      }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div>
                            <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Item Name</p>
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.1rem', fontWeight: '600', color: '#ffffff' }}>{post.item_name}</p>
                          </div>
                          <div>
                            <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Post Type</p>
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.1rem', fontWeight: '600', color: '#ffffff', textTransform: 'capitalize' }}>{post.post_type}</p>
                          </div>
                          <div>
                            <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Category</p>
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.1rem', fontWeight: '600', color: '#ffffff' }}>{post.category}</p>
                          </div>
                          <div>
                            <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Location</p>
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.1rem', fontWeight: '600', color: '#ffffff' }}>{post.location}</p>
                          </div>
                          <div>
                            <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Venue</p>
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.1rem', fontWeight: '600', color: '#ffffff' }}>{post.location}</p>
                          </div>
                          <div>
                            <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Date Posted</p>
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.1rem', fontWeight: '600', color: '#ffffff' }}>{formatDate(post.posted_at)}</p>
                          </div>
                        </div>
                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                          <p style={{ margin: 0, color: '#ef4444', fontSize: '0.9rem', fontWeight: '600' }}>✕ Rejected</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.6)' }}>No rejected posts</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div>
            {/* Timeframe Selector */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              marginBottom: '2rem',
              flexWrap: 'wrap'
            }}>
              {[
                { id: 'daily', label: 'Daily (7 days)' },
                { id: 'weekly', label: 'Weekly (4 weeks)' },
                { id: 'monthly', label: 'Monthly (12 months)' }
              ].map(option => (
                <button
                  key={option.id}
                  onClick={() => setAnalyticsTimeframe(option.id)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    backgroundColor: analyticsTimeframe === option.id ? 'rgba(167, 139, 250, 0.2)' : 'transparent',
                    color: analyticsTimeframe === option.id ? '#a78bfa' : 'rgba(255,255,255,0.6)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: analyticsTimeframe === option.id ? '600' : '500',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Charts Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
              {/* Lost vs Found Line Chart */}
              <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem', fontWeight: 'bold', color: '#ffffff' }}>
                  Lost vs Found Items - {analyticsTimeframe === 'daily' ? 'Daily' : analyticsTimeframe === 'weekly' ? 'Weekly' : 'Monthly'}
                </h3>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analyticsTimeframe === 'daily' ? dailyData : analyticsTimeframe === 'weekly' ? weeklyData : monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey={analyticsTimeframe === 'daily' ? 'date' : analyticsTimeframe === 'weekly' ? 'week' : 'month'} stroke="rgba(255,255,255,0.6)" />
                      <YAxis stroke="rgba(255,255,255,0.6)" />
                      <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }} />
                      <Legend />
                      <Line type="monotone" dataKey="lost" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444' }} />
                      <Line type="monotone" dataKey="found" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Category Pie Chart */}
              <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem', fontWeight: 'bold', color: '#ffffff' }}>Items by Category</h3>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
                ) : categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#a78bfa', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#ec4899'][index % 6]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.6)' }}>No category data available</div>
                )}
              </div>
            </div>

            {/* Location Bar Chart */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
              <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem', fontWeight: 'bold', color: '#ffffff' }}>Top 10 Locations</h3>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
              ) : locationData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={locationData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="location" stroke="rgba(255,255,255,0.6)" angle={-45} textAnchor="end" height={100} />
                    <YAxis stroke="rgba(255,255,255,0.6)" />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }} />
                    <Bar dataKey="count" fill="#a78bfa" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.6)' }}>No location data available</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Item Details Modal */}
      {selectedItem && (
        <div 
          aria-modal="true" 
          role="dialog" 
          onClick={() => setSelectedItem(null)} 
          style={{ 
            position: 'fixed', 
            inset: 0, 
            zIndex: 50, 
            background: 'rgba(0,0,0,0.55)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: 16 
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              width: 'min(720px, 96vw)', 
              background: 'rgba(17,17,17,0.9)', 
              border: '1px solid rgba(255,255,255,0.15)', 
              borderRadius: 14, 
              overflow: 'hidden', 
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)' 
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 0 }}>
              {/* Image Section */}
              <div style={{ background: '#111', minHeight: 260 }}>
                <img 
                  src={selectedItem.image_url ? `http://localhost:3005${selectedItem.image_url}` : 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400'} 
                  alt={selectedItem.item_name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
                />
              </div>
              
              {/* Details Section */}
              <div style={{ padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12 }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>{selectedItem.item_name}</h3>
                  <button 
                    onClick={() => setSelectedItem(null)} 
                    aria-label="Close"
                    style={{ 
                      border: '1px solid rgba(255,255,255,0.2)', 
                      background: 'transparent', 
                      color: '#fff', 
                      borderRadius: 8, 
                      padding: '6px 10px', 
                      cursor: 'pointer' 
                    }}
                  >
                    ✕
                  </button>
                </div>
                
                <p style={{ marginTop: 8, opacity: 0.95, lineHeight: 1.5 }}>
                  {selectedItem.description || 'No description available.'}
                </p>
                
                {/* Post Type Badge */}
                <div style={{ 
                  marginTop: 10, 
                  padding: '6px 10px', 
                  background: selectedItem.post_type === 'found' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', 
                  border: `1px solid ${selectedItem.post_type === 'found' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, 
                  borderRadius: '6px', 
                  fontSize: 13,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span style={{ fontSize: '1rem' }}>
                    {selectedItem.post_type === 'found' ? '✓' : '🔍'}
                  </span>
                  <strong>{selectedItem.post_type === 'found' ? 'Found Item' : 'Lost Item'}</strong>
                </div>
                
                {/* Item Details */}
                <div style={{ marginTop: 10, fontSize: 14, opacity: 0.9 }}>
                  <div>Category: <strong>{selectedItem.category || 'Not specified'}</strong></div>
                  <div><strong>{selectedItem.post_type === 'found' ? 'Found at:' : 'Lost at:'}</strong> <strong>{selectedItem.location || 'Not specified'}</strong></div>
                  <div>Date: <strong>{formatDate(selectedItem.posted_at || selectedItem.created_at)}</strong></div>
                  <div>Status: <strong style={{ textTransform: 'capitalize' }}>{selectedItem.status || 'Not specified'}</strong></div>
                  
                  {/* Posted By Section */}
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{
                      display: 'inline-block',
                      padding: '0.5rem 1rem',
                      backgroundColor: selectedItem.post_type === 'found' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      color: selectedItem.post_type === 'found' ? '#86efac' : '#fca5a5',
                      borderRadius: '6px',
                      fontSize: '0.95rem',
                      fontWeight: '600'
                    }}>
                      {selectedItem.post_type === 'found' ? '✓ Finder:' : '🔍 Lost by:'} <strong>{selectedItem.user_name || 'Unknown'}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conversations Tab */}
      {activeTab === 'conversations' && (
        <AdminConversations />
      )}
      </div>
    </div>
  );
}

export default AdminDashboard;
