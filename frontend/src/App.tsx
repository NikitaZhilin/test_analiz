import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { initAuth, getAccessToken, clearTokens } from './api/client';
import { getMe } from './api/auth';
import { getProfiles } from './api/profiles';
import type { User, Profile } from './types';
import Login from './pages/Login';
import Register from './pages/Register';
import Profiles from './pages/Profiles';
import Reports from './pages/Reports';
import ReportDetail from './pages/ReportDetail';
import Analytes from './pages/Analytes';
import AnalyteDetail from './pages/AnalyteDetail';
import ImportPage from './pages/ImportPage';
import ErrorLogViewer from './components/ErrorLogViewer';
import Logo from './components/Logo';

// Компонент для отображения статуса соединения
function ServerStatusBanner() {
  const [serverOk, setServerOk] = useState<boolean | null>(null);

  useEffect(() => {
    const checkServer = async () => {
      try {
        // Health endpoint без префикса /api
        const response = await fetch('/health');
        if (response.ok) {
          const data = await response.json();
          setServerOk(data.status === 'ok');
        } else {
          setServerOk(false);
        }
      } catch {
        setServerOk(false);
      }
    };

    checkServer();
    const interval = setInterval(checkServer, 30000);

    return () => clearInterval(interval);
  }, []);

  if (serverOk === null) return null;
  if (serverOk) return null;

  return (
    <div className="server-status-banner">
      <span>⚠️</span>
      <strong>Backend не доступен!</strong>
      <span>Проверьте, что сервер запущен</span>
    </div>
  );
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    initAuth();

    // Если токены уже есть в localStorage, загружаем пользователя
    if (getAccessToken()) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  async function loadUser() {
    const token = getAccessToken();

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const userData = await getMe();
      setUser(userData);

      const profilesData = await getProfiles();
      setProfiles(profilesData);

      const storedProfileId = localStorage.getItem('active_profile_id');
      if (storedProfileId) {
        const profile = profilesData.find(p => p.id === parseInt(storedProfileId));
        if (profile) {
          setActiveProfileId(profile.id);
        } else if (profilesData.length > 0) {
          setActiveProfileId(profilesData[0].id);
          localStorage.setItem('active_profile_id', profilesData[0].id.toString());
        }
      } else if (profilesData.length > 0) {
        setActiveProfileId(profilesData[0].id);
        localStorage.setItem('active_profile_id', profilesData[0].id.toString());
      }
    } catch (error) {
      clearTokens();
      setUser(null);
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = () => {
    clearTokens();
    setUser(null);
    setProfiles([]);
    setActiveProfileId(null);
    localStorage.removeItem('active_profile_id');
    setMenuOpen(false);
    navigate('/login');
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const profileId = parseInt(e.target.value);
    setActiveProfileId(profileId);
    localStorage.setItem('active_profile_id', profileId.toString());
    setMenuOpen(false);
  };

  const handleProfileCreated = (profile: Profile) => {
    setProfiles(prev => [...prev, profile]);
    setActiveProfileId(profile.id);
    localStorage.setItem('active_profile_id', profile.id.toString());
  };

  const handleProfileDeleted = (profileId: number) => {
    setProfiles(prev => prev.filter(p => p.id !== profileId));
    if (activeProfileId === profileId) {
      const remaining = profiles.filter(p => p.id !== profileId);
      if (remaining.length > 0) {
        setActiveProfileId(remaining[0].id);
        localStorage.setItem('active_profile_id', remaining[0].id.toString());
      } else {
        setActiveProfileId(null);
        localStorage.removeItem('active_profile_id');
      }
    }
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  if (loading) {
    return (
      <div className="loading-with-spinner">
        <span className="spinner-large"></span>
        <p>Загрузка...</p>
      </div>
    );
  }

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  if (!user && !isAuthPage) {
    return <Navigate to="/login" />;
  }

  if (user && isAuthPage) {
    return <Navigate to="/profiles" />;
  }

  return (
    <div>
      <ServerStatusBanner />
      {user && (
        <header className="header">
          <Logo profileId={activeProfileId || undefined} />

          <button className="hamburger" onClick={toggleMenu} aria-label="Меню">
            <span></span>
            <span></span>
            <span></span>
          </button>

          <nav className={`header-nav ${menuOpen ? 'active' : ''}`}>
            {profiles.length > 0 && activeProfileId && (
              <div className="profile-switcher">
                <label>Профиль:</label>
                <select value={activeProfileId} onChange={handleProfileChange}>
                  {profiles.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}
            <Link to="/profiles" onClick={() => setMenuOpen(false)}>Профили</Link>
            <Link to={`/profiles/${activeProfileId}/reports`} onClick={() => setMenuOpen(false)}>Анализы</Link>
            <Link to={`/profiles/${activeProfileId}/analytes`} onClick={() => setMenuOpen(false)}>Показатели</Link>
            <Link to={`/profiles/${activeProfileId}/import`} onClick={() => setMenuOpen(false)}>Импорт</Link>
            <button onClick={handleLogout} className="button-secondary">
              🚪 Выйти
            </button>
          </nav>
        </header>
      )}

      <main className="container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/profiles"
            element={
              <Profiles
                profiles={profiles}
                onProfileCreated={handleProfileCreated}
                onProfileDeleted={handleProfileDeleted}
              />
            }
          />
          <Route
            path="/profiles/:profileId/reports"
            element={
              activeProfileId ? (
                <Reports profileId={activeProfileId} />
              ) : (
                <Navigate to="/profiles" />
              )
            }
          />
          <Route
            path="/reports/:reportId"
            element={
              activeProfileId ? (
                <ReportDetail profileId={activeProfileId} />
              ) : (
                <Navigate to="/profiles" />
              )
            }
          />
          <Route
            path="/profiles/:profileId/analytes"
            element={
              activeProfileId ? (
                <Analytes profileId={activeProfileId} />
              ) : (
                <Navigate to="/profiles" />
              )
            }
          />
          <Route
            path="/profiles/:profileId/analytes/:analyteId"
            element={
              activeProfileId ? (
                <AnalyteDetail profileId={activeProfileId} />
              ) : (
                <Navigate to="/profiles" />
              )
            }
          />
          <Route
            path="/profiles/:profileId/import"
            element={
              activeProfileId ? (
                <ImportPage profileId={activeProfileId} />
              ) : (
                <Navigate to="/profiles" />
              )
            }
          />
          <Route path="/" element={<Navigate to="/profiles" />} />
        </Routes>
      </main>
      <ErrorLogViewer />
    </div>
  );
}

export default App;
