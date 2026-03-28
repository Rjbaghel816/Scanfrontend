import React from 'react';
import { 
  Users, 
  FileCheck, 
  AlertTriangle, 
  TrendingUp,
  LayoutDashboard,
  ArrowRight,
  BookOpen,
  PieChart
} from 'lucide-react';
import { Link } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
  // Mock overview data
  const overview = [
    { label: 'Active Students', value: '4,280', icon: <Users size={24} />, color: 'blue', trend: '+12%' },
    { label: 'Papers Evaluated', value: '3,842', icon: <FileCheck size={24} />, color: 'emerald', trend: '+5%' },
    { label: 'Pending Reviews', value: '156', icon: <AlertTriangle size={24} />, color: 'amber', trend: '-2%' },
    { label: 'Efficiency', value: '94.2%', icon: <TrendingUp size={24} />, color: 'violet', trend: '+1.5%' },
  ];

  const quickActions = [
    { title: 'Upload New Paper', desc: 'Define marking scheme and upload master / answer PDF', link: '/admin/upload-paper', icon: <BookOpen />, color: 'blue' },
    { title: 'Answer Templates', desc: 'Reference official model answers for evaluators', link: '/admin/view-answer-template', icon: <BookOpen />, color: 'emerald' },
    { title: 'Review Queue', desc: 'Handle exceptions and file errors', link: '/admin/review-queue', icon: <AlertTriangle />, color: 'amber' },
    { title: 'Performance Stats', desc: 'View detailed analytics and reports', link: '/admin/statistics', icon: <PieChart />, color: 'violet' },
  ];

  return (
    <div className="admin-dashboard">
      <header className="page-header">
        <div className="header-info">
          <h1>Admin Dashboard</h1>
          <p>Welcome back! Here's a summary of the Digital Evaluation System.</p>
        </div>
      </header>

      <div className="overview-row">
        {overview.map((item, idx) => (
          <div key={idx} className={`overview-card ${item.color}`}>
            <div className="card-top">
              <div className="icon-box">{item.icon}</div>
              <span className="trend">{item.trend}</span>
            </div>
            <div className="card-bottom">
              <span className="value">{item.value}</span>
              <span className="label">{item.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <section className="quick-actions-section">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            {quickActions.map((action, idx) => (
              <Link key={idx} to={action.link} className={`action-card ${action.color}`}>
                <div className="action-icon">{action.icon}</div>
                <div className="action-info">
                  <h3>{action.title}</h3>
                  <p>{action.desc}</p>
                </div>
                <ArrowRight size={20} className="arrow" />
              </Link>
            ))}
          </div>
        </section>

        <section className="recent-activity">
          <div className="section-header">
            <h2>Recent Activity</h2>
            <button className="btn-text">View All</button>
          </div>
          <div className="activity-list">
            {[
              { text: 'Paper BCA-101 evaluation completed', time: '10 mins ago', type: 'success' },
              { text: '50 new copies uploaded for Mathematics', time: '25 mins ago', type: 'info' },
              { text: 'Exception flagged in Fict No. 1042', time: '1 hour ago', type: 'warning' },
              { text: 'System backup completed successfully', time: '3 hours ago', type: 'success' },
            ].map((activity, idx) => (
              <div key={idx} className="activity-item">
                <div className={`dot ${activity.type}`}></div>
                <div className="content">
                  <p>{activity.text}</p>
                  <span>{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
