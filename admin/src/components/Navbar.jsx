import { useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Navbar.module.css';

const Navbar = () => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className={styles.nav}>
      <div className={styles.leftGroup}>
        <div className={styles.brand} onClick={() => navigate('/dashboard')}>
          <div className={styles.logoMark}>Q</div>
          <span className={styles.brandName}>
            Quiz<span className={styles.accent}>Arena</span>
          </span>
        </div>

        <nav className={styles.navLinks}>
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
          >
            History
          </NavLink>
        </nav>
      </div>

      <div className={styles.right}>
        <span className={styles.adminName}>{admin?.name}</span>
        <button className={styles.logoutBtn} onClick={handleLogout}>Sign out</button>
      </div>
    </header>
  );
};

export default Navbar;
