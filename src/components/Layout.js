import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const getDashboardTitle = () => {
    const roleTitles = {
      lecturer: 'Lecturer Dashboard',
      prl: 'Principal Lecturer Dashboard',
      pl: 'Program Leader Dashboard',
      student: 'Student Dashboard'
    };
    return roleTitles[user.role] || 'Dashboard';
  };

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container-fluid">
          <span className="navbar-brand">LUCT Reporting System</span>
          
          <div className="navbar-nav ms-auto">
            <div className="nav-item dropdown">
              <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                {user.name} ({user.role.toUpperCase()})
              </a>
              <ul className="dropdown-menu">
                <li><a className="dropdown-item" href="#" onClick={handleLogout}>Logout</a></li>
              </ul>
            </div>
          </div>
        </div>
      </nav>

      <div className="container-fluid">
        <div className="row">
          <div className="col-md-3 col-lg-2 d-md-block bg-dark sidebar">
            <div className="position-sticky pt-3">
              <h6 className="text-white px-3">MAIN NAVIGATION</h6>
              <ul className="nav flex-column">
                <li className="nav-item">
                  <a className="nav-link active" href="#">
                    <i className="fas fa-tachometer-alt me-2"></i>
                    {getDashboardTitle()}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 py-4">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;