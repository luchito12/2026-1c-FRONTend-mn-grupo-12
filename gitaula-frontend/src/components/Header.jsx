import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider.jsx';
export function Header() { const { user, logout } = useAuth(); const navigate = useNavigate();
  async function closeSession() { await logout(); navigate('/login'); }
  return <header className="topbar"><Link className="brand" to="/">Git<span>Aula</span></Link><div className="identity"><span>{user?.githubLogin || user?.name || 'Sesión activa'}</span><button onClick={closeSession}>Cerrar sesión</button></div></header>;
}
