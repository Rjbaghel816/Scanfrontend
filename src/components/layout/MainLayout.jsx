import Sidebar from '../common/Sidebar';
import { useTenant } from '../../context/TenantContext';
import { LogOut } from 'lucide-react';
import './MainLayout.css';

const MainLayout = ({ children }) => {
  const { user, logout } = useTenant();

  return (
    <div className="layout-container">
      <Sidebar role={user?.role} onLogout={logout} />
      <div className="main-wrapper">
        <header className="main-header">
          <div className="header-left">
            <h2>🏢 Digital Evaluation System</h2>
          </div>
          
          <div className="header-right">
            <div className="user-profile">
              <div className="user-info">
                <span className="user-name">{user?.name || 'User'}</span>
                <span className="user-role">{user?.role || 'Guest'}</span>
              </div>
              <button className="btn-logout-icon" onClick={logout} title="Logout">
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>
        <main className="content-area">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
