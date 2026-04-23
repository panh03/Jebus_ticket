import React, { useState, useEffect } from 'react';
import { FiCalendar, FiTrendingUp, FiPieChart, FiFilter, FiChevronDown } from 'react-icons/fi';
import axios from 'axios';
import './AdminDashboard.css';
import { 
    ComposedChart, 
    Bar, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    ResponsiveContainer,
    PieChart, 
    Pie, 
    Cell
} from 'recharts';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [operators, setOperators] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null); // For detail view
    const [opTab, setOpTab] = useState('routes'); // 'routes', 'trips'
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [loading, setLoading] = useState(true);
    const [performanceStats, setPerformanceStats] = useState([]);
    const [statusDistribution, setStatusDistribution] = useState([]);
    const [statsFilter, setStatsFilter] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
    });

    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    useEffect(() => {
        fetchData();
    }, [activeTab, statsFilter]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            if (activeTab === 'users') {
                const res = await axios.get(`${apiBase}/admin/users`, config);
                setUsers(res.data);
            } else if (activeTab === 'operators' || activeTab === 'approvals') {
                const status = activeTab === 'approvals' ? 'pending' : 'active';
                const res = await axios.get(`${apiBase}/admin/operators?status=${status}`, config);
                setOperators(res.data);
            } else if (activeTab === 'performance') {
                const res = await axios.get(`${apiBase}/admin/performance?month=${statsFilter.month}&year=${statsFilter.year}`, config);
                setPerformanceStats(res.data.stats);
                setStatusDistribution(res.data.statusDistribution);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetail = async (id, type) => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const endpoint = type === 'user' ? `/admin/users/${id}` : `/admin/operators/${id}`;
            const res = await axios.get(`${apiBase}${endpoint}`, config);
            setSelectedItem({ ...res.data, type });
            if (type === 'operator') {
                setOpTab('routes');
            }
        } catch (error) {
            console.error('Error fetching detail:', error);
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user and their account?')) return;
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.delete(`${apiBase}/admin/users/${id}`, config);
            alert('User deleted');
            setSelectedItem(null);
            fetchData();
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    };

    const handleDeleteOperator = async (id) => {
        if (!window.confirm('Delete this operator and their associated account? This cannot be undone.')) return;
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.delete(`${apiBase}/admin/operators/${id}`, config);
            alert('Operator deleted');
            setSelectedItem(null);
            fetchData();
        } catch (error) {
            console.error('Error deleting operator:', error);
        }
    };

    const handleUpdateTripStatus = async (id, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put(`${apiBase}/admin/trips/${id}/status`, { status: newStatus }, config);
            handleViewDetail(selectedItem.id, 'operator');
        } catch (error) {
            console.error('Error updating trip:', error);
        }
    };

    const handleDeleteTrip = async (id) => {
        if (!window.confirm('Are you sure? This will delete the trip and automatically refund all current bookings.')) return;
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.delete(`${apiBase}/admin/trips/${id}`, config);
            alert(`Trip deleted. ${res.data.refunded_count} bookings refunded.`);
            handleViewDetail(selectedItem.id, 'operator');
        } catch (error) {
            console.error('Error deleting trip:', error);
        }
    };

    const handleApprove = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put(`${apiBase}/admin/operators/${id}/approve`, {}, config);
            alert('Operator approved!');
            fetchData();
            setSelectedItem(null);
        } catch (error) {
            console.error('Error approving:', error);
        }
    };

    const handleReject = async () => {
        if (!rejectReason) return alert('Please provide a reason');
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put(`${apiBase}/admin/operators/${selectedItem.id}/reject`, { reason: rejectReason }, config);
            alert('Operator rejected');
            setShowRejectModal(false);
            setRejectReason('');
            fetchData();
            setSelectedItem(null);
        } catch (error) {
            console.error('Error rejecting:', error);
        }
    };

    const renderUserList = () => (
        <div className="admin-table-container">
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Joined</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u.id}>
                            <td>{u.id}</td>
                            <td>{u.name}</td>
                            <td>{u.email}</td>
                            <td>{u.phone || 'N/A'}</td>
                            <td>{new Date(u.created_at).toLocaleDateString()}</td>
                            <td><span className="status-badge active">Active</span></td>
                            <td>
                                <button className="admin-btn admin-btn-outline" onClick={() => handleViewDetail(u.id, 'user')}>View Details</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderOperatorList = (isApprovals = false) => (
        <div className="admin-table-container">
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Company Name</th>
                        <th>Contact Email</th>
                        <th>Phone</th>
                        <th>Joined</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {operators.map(o => (
                        <tr key={o.id}>
                            <td>{o.id}</td>
                            <td>{o.name}</td>
                            <td>{o.contact_email}</td>
                            <td>{o.phone}</td>
                            <td>{new Date(o.joined_at).toLocaleDateString()}</td>
                            <td><span className={`status-badge ${o.status}`}>{o.status}</span></td>
                            <td>
                                <button className="admin-btn admin-btn-outline" onClick={() => handleViewDetail(o.id, 'operator')}>
                                    {isApprovals ? 'Review' : 'View Details'}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderPerformanceDashboard = () => (
        <div className="tab-content-fade">
            <div className="performance-header-box">
                <div className="performance-title">
                    <FiTrendingUp className="header-icon" />
                    <div>
                        <h2>Performance Analytics</h2>
                        <p>Track your business growth and trip efficiency</p>
                    </div>
                </div>
                
                <div className="performance-filter-pill">
                    <div className="pill-item">
                        <FiCalendar className="pill-icon" />
                        <div className="pill-select-wrapper">
                            <select 
                                value={statsFilter.month}
                                onChange={(e) => setStatsFilter({ ...statsFilter, month: parseInt(e.target.value) })}
                            >
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>
                                        {new Date(0, i).toLocaleString('en', { month: 'long' })}
                                    </option>
                                ))}
                            </select>
                            <FiChevronDown className="pill-chevron" />
                        </div>
                    </div>
                    <div className="pill-divider"></div>
                    <div className="pill-item">
                        <div className="pill-select-wrapper">
                            <select 
                                value={statsFilter.year}
                                onChange={(e) => setStatsFilter({ ...statsFilter, year: parseInt(e.target.value) })}
                            >
                                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <FiChevronDown className="pill-chevron" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="performance-charts-grid" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                <div className="chart-wrapper main-chart" style={{ flex: '2', minWidth: '600px', background: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: 'var(--shadow-sm)' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Trip Volume & Revenue Trends</h3>
                    <ResponsiveContainer width="99%" height={380}>
                        <ComposedChart data={performanceStats} margin={{ top: 20, right: 40, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis 
                                dataKey="displayDate" 
                                axisLine={false}
                                tickLine={false}
                                padding={{ left: 20, right: 20 }}
                                tick={{ fill: '#6b7280', fontSize: 12 }}
                            />
                            <YAxis 
                                yAxisId="left" 
                                orientation="left" 
                                label={{ value: 'Trips', angle: -90, position: 'insideLeft', offset: 0, fill: '#6366f1' }}
                                axisLine={false}
                                tickLine={false}
                                width={60}
                                tick={{ fill: '#6366f1' }}
                            />
                            <YAxis 
                                yAxisId="right" 
                                orientation="right" 
                                axisLine={false}
                                tickLine={false}
                                width={100}
                                tickMargin={10}
                                tick={{ fill: '#10b981' }}
                                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                            />
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                formatter={(value, name) => [
                                    name === 'revenue' ? `${new Intl.NumberFormat('vi-VN').format(value)} VND` : value,
                                    name === 'trips' ? 'Trips Completed' : 'Total Revenue'
                                ]}
                            />
                            <Legend verticalAlign="top" height={36}/>
                            <Bar 
                                yAxisId="left" 
                                dataKey="trips" 
                                name="trips"
                                fill="#6366f1" 
                                radius={[4, 4, 0, 0]} 
                                barSize={30}
                            />
                            <Line 
                                yAxisId="right" 
                                type="monotone" 
                                dataKey="revenue" 
                                name="revenue"
                                stroke="#10b981" 
                                strokeWidth={3}
                                dot={{ fill: '#10b981', r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-wrapper pie-chart" style={{ flex: '1', minWidth: '300px', background: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: 'var(--shadow-sm)' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Trip Status distribution</h3>
                    <ResponsiveContainer width="99%" height={380}>
                        <PieChart>
                            <Pie
                                data={statusDistribution.map(d => ({ ...d, displayCount: d.count === 0 ? 0.0001 : d.count }))}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                minAngle={5}
                                dataKey="displayCount"
                                nameKey="status"
                            >
                                {statusDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={
                                        entry.status === 'completed' ? '#10b981' :
                                        entry.status === 'scheduled' ? '#6366f1' :
                                        entry.status === 'cancelled' ? '#ef4444' :
                                        entry.status === 'on_time' ? '#3b82f6' :
                                        entry.status === 'delayed' ? '#f59e0b' :
                                        '#8b5cf6'
                                    } />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value, name, props) => [props.payload.count, name]} />
                            <Legend verticalAlign="bottom" />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

                <div className="admin-stats-grid" style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                    <div className="admin-stat-card">
                        <div className="stat-icon" style={{ background: '#eef2ff', color: '#6366f1' }}>📊</div>
                        <div className="stat-info">
                            <span className="info-label">Total Monthly Trips</span>
                            <h3 className="info-value">{performanceStats.reduce((acc, curr) => acc + curr.trips, 0)}</h3>
                        </div>
                    </div>
                    <div className="admin-stat-card">
                        <div className="stat-icon" style={{ background: '#ecfdf5', color: '#10b981' }}>💰</div>
                        <div className="stat-info">
                            <span className="info-label">Total Monthly Revenue</span>
                            <h3 className="info-value">{new Intl.NumberFormat('vi-VN').format(performanceStats.reduce((acc, curr) => acc + curr.revenue, 0))} VND</h3>
                        </div>
                    </div>
                    <div className="admin-stat-card">
                        <div className="stat-icon" style={{ background: '#fffbeb', color: '#f59e0b' }}>📈</div>
                        <div className="stat-info">
                            <span className="info-label">Avg. Revenue per Trip</span>
                            <h3 className="info-value">
                                {new Intl.NumberFormat('vi-VN').format(
                                    performanceStats.reduce((acc, curr) => acc + curr.revenue, 0) / 
                                    (performanceStats.reduce((acc, curr) => acc + curr.trips, 0) || 1)
                                )} VND
                            </h3>
                        </div>
                    </div>
                </div>
            </div>
    );

    const renderUserDetail = (user) => (
        <div className="admin-detail-view">
            <button className="admin-btn admin-btn-outline" style={{ marginBottom: '1rem' }} onClick={() => setSelectedItem(null)}>Back to List</button>
            <div className="admin-detail-layout">
                <div className="admin-detail-sidebar">
                    <div className="profile-avatar">
                        <img src={`https://ui-avatars.com/api/?name=${user.name}&background=random`} alt="Avatar" />
                    </div>
                    <div className="profile-info">
                        <h3>{user.name}</h3>
                        <p>{user.email}</p>
                        <span className="status-badge active">{user.role}</span>
                    </div>
                    <div className="info-list">
                        <div className="info-item">
                            <span className="info-label">Join Date:</span>
                            <span className="info-value">{new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Phone:</span>
                            <span className="info-value">{user.phone || 'N/A'}</span>
                        </div>
                    </div>
                    <div style={{ marginTop: '2rem' }}>
                        <button className="admin-btn admin-btn-danger" style={{ width: '100%' }} onClick={() => handleDeleteUser(user.id)}>Delete Account</button>
                    </div>
                </div>
                <div className="admin-detail-main">
                    <h2>Booking History</h2>
                    <div className="admin-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Operator</th>
                                    <th>Route</th>
                                    <th>Departure</th>
                                    <th>Price</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {user.bookings?.map(b => (
                                    <tr key={b.id}>
                                        <td>{b.operator_name}</td>
                                        <td>{b.from_city} - {b.to_city}</td>
                                        <td>{new Date(b.departure_datetime).toLocaleString()}</td>
                                        <td>${b.total_price}</td>
                                        <td><span className={`status-badge ${b.status}`}>{b.status}</span></td>
                                    </tr>
                                ))}
                                {(!user.bookings || user.bookings.length === 0) && (
                                    <tr><td colSpan="5" style={{ textAlign: 'center' }}>No bookings found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderOperatorDetail = (op) => (
        <div className="admin-detail-view">
            <button className="admin-btn admin-btn-outline" style={{ marginBottom: '1rem' }} onClick={() => setSelectedItem(null)}>Back to List</button>
            <div className="admin-detail-layout">
                <div className="admin-detail-sidebar">
                    <div className="profile-avatar">
                        {op.logo_url ? <img src={op.logo_url} alt="Logo" /> : <span>{op.name.charAt(0)}</span>}
                    </div>
                    <div className="profile-info">
                        <h3>{op.name}</h3>
                        <p>{op.contact_email}</p>
                        <span className={`status-badge ${op.status}`}>{op.status}</span>
                    </div>
                    <div className="info-list">
                        <div className="info-item">
                            <span className="info-label">Fleet Size:</span>
                            <span className="info-value">{op.fleet_size || 0} Vehicles</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">License:</span>
                            <span className="info-value">{op.license_no || 'N/A'}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Joined:</span>
                            <span className="info-value">{new Date(op.joined_at).toLocaleDateString()}</span>
                        </div>
                    </div>

                    {op.status === 'pending' && (
                        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                            <button className="admin-btn admin-btn-success" onClick={() => handleApprove(op.id)}>Approve Operator</button>
                            <button className="admin-btn admin-btn-danger" onClick={() => setShowRejectModal(true)}>Reject Operator</button>
                        </div>
                    )}

                    <div style={{ marginTop: '2rem' }}>
                        <button className="admin-btn admin-btn-danger" style={{ width: '100%' }} onClick={() => handleDeleteOperator(op.id)}>Delete Operator Account</button>
                    </div>
                </div>
                <div className="admin-detail-main">
                    <div className="detail-tabs">
                        <button className={`detail-tab-btn ${opTab === 'routes' ? 'active' : ''}`} onClick={() => setOpTab('routes')}>Routes</button>
                        <button className={`detail-tab-btn ${opTab === 'trips' ? 'active' : ''}`} onClick={() => setOpTab('trips')}>Trips</button>
                    </div>

                    {opTab === 'routes' && (
                        <div className="tab-content-fade">
                            <h2>Operating Routes</h2>
                            <div className="admin-table-container">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Route</th>
                                            <th>Price</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {op.routes?.map((r, i) => (
                                            <tr key={i}>
                                                <td>{r.from_city} - {r.to_city}</td>
                                                <td>${r.base_price}</td>
                                                <td><span className={`status-badge ${r.is_active ? 'active' : 'rejected'}`}>{r.is_active ? 'Active' : 'Suspended'}</span></td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button className="admin-btn admin-btn-outline" onClick={() => handleUpdateRouteStatus(r.id, r.is_active)}>
                                                            {r.is_active ? 'Suspend' : 'Activate'}
                                                        </button>
                                                        <button className="admin-btn admin-btn-danger" onClick={() => handleDeleteRoute(r.id)}>Delete</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {opTab === 'trips' && (
                        <div className="tab-content-fade">
                            <h2>Trip Management</h2>
                            <div className="admin-table-container">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Route</th>
                                            <th>Departure</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {op.trips?.map((t, i) => (
                                            <tr key={i}>
                                                <td>{t.from_city} - {t.to_city}</td>
                                                <td>{new Date(t.departure_datetime).toLocaleString()}</td>
                                                <td>
                                                    <select 
                                                        value={t.status} 
                                                        onChange={(e) => handleUpdateTripStatus(t.id, e.target.value)}
                                                        className="status-badge"
                                                        style={{ border: 'none', appearance: 'none', cursor: 'pointer' }}
                                                    >
                                                        <option value="scheduled">Scheduled</option>
                                                        <option value="on_time">On Time</option>
                                                        <option value="delayed">Delayed</option>
                                                        <option value="cancelled">Cancelled</option>
                                                        <option value="completed">Completed</option>
                                                    </select>
                                                </td>
                                                <td>
                                                    <button className="admin-btn admin-btn-danger" onClick={() => handleDeleteTrip(t.id)}>Delete & Refund</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div style={{ marginTop: '3rem' }}>
                        <h2>Customer Reviews</h2>
                        <div className="reviews-list">
                            {op.reviews?.map((rv, i) => (
                                <div key={i} className="admin-stat-card" style={{ marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <strong>{rv.user_name}</strong>
                                        <span style={{ color: '#f59e0b' }}>{'★'.repeat(rv.rating)}{'☆'.repeat(5-rv.rating)}</span>
                                    </div>
                                    <p style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>{rv.comment}</p>
                                    <small style={{ color: 'var(--admin-text-sub)' }}>{new Date(rv.created_at).toLocaleDateString()}</small>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div className="admin-sidebar-header">
                    <h2>Admin Panel</h2>
                </div>
                <ul className="admin-nav-list">
                    <li className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => { setActiveTab('users'); setSelectedItem(null); }}>
                        <span>👥</span> User Management
                    </li>
                    <li className={`admin-nav-item ${activeTab === 'operators' ? 'active' : ''}`} onClick={() => { setActiveTab('operators'); setSelectedItem(null); }}>
                        <span>🚌</span> Operator Management
                    </li>
                    <li className={`admin-nav-item ${activeTab === 'approvals' ? 'active' : ''}`} onClick={() => { setActiveTab('approvals'); setSelectedItem(null); }}>
                        <span>🔔</span> New Approvals
                    </li>
                    <li className={`admin-nav-item ${activeTab === 'performance' ? 'active' : ''}`} onClick={() => { setActiveTab('performance'); setSelectedItem(null); }}>
                        <span>📈</span> Performance
                    </li>
                </ul>
            </aside>

            <main className="admin-main">
                {!selectedItem ? (
                    <>
                        <div className="admin-page-header">
                            <h1>
                                {activeTab === 'users' ? 'User Management' : 
                                 activeTab === 'operators' ? 'Operator Management' : 
                                 activeTab === 'buses' ? 'Centralized Bus Management' :
                                 activeTab === 'performance' ? 'Monthly Performance' :
                                 'Operator Approvals'}
                            </h1>
                        </div>

                        {loading ? (
                            <p>Loading...</p>
                        ) : (
                            <>
                                 {activeTab === 'users' && renderUserList()}
                                {(activeTab === 'operators' || activeTab === 'approvals') && renderOperatorList(activeTab === 'approvals')}
                                {activeTab === 'performance' && renderPerformanceDashboard()}
                            </>
                        )}
                    </>
                ) : (
                    selectedItem.type === 'user' ? renderUserDetail(selectedItem) : renderOperatorDetail(selectedItem)
                )}
            </main>

            {showRejectModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Reject Operator</h3>
                        <p>Please provide a reason for rejecting <strong>{selectedItem?.name}</strong>.</p>
                        <textarea 
                            placeholder="Reason for rejection..." 
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                        />
                        <div className="modal-actions">
                            <button className="admin-btn admin-btn-outline" onClick={() => setShowRejectModal(false)}>Cancel</button>
                            <button className="admin-btn admin-btn-danger" onClick={handleReject}>Reject Operator</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
