import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Upload, 
  FileText, 
  Users, 
  Settings, 
  BarChart3, 
  LogOut,
  FolderOpen,
  ClipboardList,
  Search,
  Eye,
  BookOpen
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ role, onLogout }) => {
  const isAdmin = role === 'admin' || role === 'operator';

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">📊</span>
          <span className="logo-text">EvalSys</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {isAdmin ? (
          <>
            <div className="nav-section">Main</div>
            <NavLink to="/admin/dashboard" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </NavLink>
            
            <div className="nav-section">Operations</div>
            <NavLink to="/admin/upload-paper" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <Upload size={20} />
              <span>Upload Paper</span>
            </NavLink>
            <NavLink to="/admin/view-paper" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <Eye size={20} />
              <span>Question Papers</span>
            </NavLink>
            <NavLink to="/admin/view-answer-template" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <BookOpen size={20} />
              <span>Answer Templates</span>
            </NavLink>
            <NavLink to="/scanner" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <FolderOpen size={20} />
              <span>Upload Copies</span>
            </NavLink>
            <NavLink to="/admin/view-copies" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <Search size={20} />
              <span>View Copies</span>
            </NavLink>
            <NavLink to="/admin/review-queue" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <ClipboardList size={20} />
              <span>Review Queue</span>
            </NavLink>

            <div className="nav-section">System</div>
            <NavLink to="/admin/config" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <Settings size={20} />
              <span>Evaluation Config</span>
            </NavLink>
            <NavLink to="/admin/statistics" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <BarChart3 size={20} />
              <span>Statistics</span>
            </NavLink>
          </>
        ) : (
          <>
            <div className="nav-section">Scanner</div>
            <NavLink to="/scanner" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <Upload size={20} />
              <span>Upload Copies</span>
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <button onClick={onLogout} className="logout-btn">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
