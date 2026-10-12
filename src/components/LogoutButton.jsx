import { useNavigate } from 'react-router-dom';
import { clearAuthSession } from '../utils/auth';

function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuthSession();
    navigate('/login', { replace: true });
  };

  return (
    <button type="button" className="logout-button" onClick={handleLogout}>
      Sign out
    </button>
  );
}

export default LogoutButton;
