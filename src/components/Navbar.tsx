import { NavLink, useNavigate } from 'react-router-dom';
import styles from '../styles/Navbar.module.css';
import Button from './Button';
import { UserRole } from '../types';

interface NavbarProps {
  role: UserRole | null;
  userName?: string | null;
  onLogout: () => void;
}

const Navbar = ({ role, userName, onLogout }: NavbarProps) => {
  const navigate = useNavigate();

  return (
    <header className={styles.navbar}>
      <div className={styles.brand}>
        <span>ElderGuard</span>
        <strong>AI</strong>
      </div>
      <nav className={styles.links}>
        {role === 'ngo' && (
          <>
            <NavLink className={({ isActive }) => (isActive ? styles.active : '')} to="/home">
              Home
            </NavLink>
            <NavLink className={({ isActive }) => (isActive ? styles.active : '')} to="/admin-dashboard">
              Admin Dashboard
            </NavLink>
            <NavLink className={({ isActive }) => (isActive ? styles.active : '')} to="/elders">
              Elders
            </NavLink>
            <NavLink className={({ isActive }) => (isActive ? styles.active : '')} to="/input">
              Input Panel
            </NavLink>
          </>
        )}
        {role === 'family' && (
          <NavLink className={({ isActive }) => (isActive ? styles.active : '')} to="/family">
            Family Panel
          </NavLink>
        )}
      </nav>
      <div className={styles.actions}>
        {userName ? <span className={styles.userLabel}>Hi, {userName}</span> : null}
        <Button variant="ghost" onClick={() => { onLogout(); navigate('/login'); }}>
          Logout
        </Button>
      </div>
    </header>
  );
};

export default Navbar;
