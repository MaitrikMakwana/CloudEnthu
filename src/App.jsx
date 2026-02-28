import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './index.css';
import Dashboard from './Dashboard';
import PublicHome from './PublicHome';
import PublicPost from './PublicPost';
import PublicProfile from './PublicProfile';

// --- AUTHENTICATION UTILS ---
const isAuthenticated = () => {
  return localStorage.getItem('admin_token') !== null;
};

// --- ROUTE GUARD ---
function ProtectedRoute({ children }) {
  const location = useLocation();

  if (!isAuthenticated()) {
    // Redirect them to the /login page, but save the current location they were trying to go to
    return <Navigate to="/login" state={{ from: location, error: "Nice try. Admin access required." }} replace />;
  }

  return children;
}

// --- ADMIN LOGIN SCREEN ---
function LoginApp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const location = useLocation();

  // Show error if they were kicked out by the ProtectedRoute
  useEffect(() => {
    if (location.state?.error) {
      setError(location.state.error);
    }
  }, [location]);

  // If they are already logged in, no need to see the login screen
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      if (!response.ok) {
        throw new Error(data.error || `Server error (${response.status}). Check Vercel environment variables.`);
      }

      localStorage.setItem('admin_token', data.token);
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err.message || "Login failed. The backend may be misconfigured.");
    }
  };

  return (
    <div className="app-container">
      <nav className="nav-header neobrutalism-box" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0 }}>
        <a href="/" className="logo-text" style={{ textDecoration: 'none', color: '#000' }}>CloudEnthu Notes</a>
        <div className="nav-links">
          <a href="/" className="neobrutalism-btn secondary" style={{ padding: '8px 16px', fontSize: '1rem' }}>
            Back to Public Feed
          </a>
        </div>
      </nav>

      <main className="main-content">
        <div className="auth-wrapper neobrutalism-box" style={{ maxWidth: '800px' }}>
          {/* Left Hero Section */}
          <section className="auth-hero" style={{ backgroundColor: 'var(--accent-pink)' }}>
            <h1>CloudEnthu Admin.</h1>
            <p>Authorized personnel only.</p>
            <div className="feature-pills">
              <span className="pill green">Dashboard Access</span>
              <span className="pill yellow">CMS Control</span>
            </div>
          </section>

          {/* Right Form Section */}
          <section className="auth-form-container">
            <div className="auth-form">
              <h2 style={{ marginBottom: '10px' }}>Sign In</h2>
              <p style={{ marginBottom: '25px', fontSize: '0.9rem', color: '#555' }}>
                Hint: admin@cloudenthu.com / admin
              </p>

              {error && (
                <div className="pill pink" style={{ border: '2px solid red', color: 'red', marginBottom: '20px', display: 'inline-block' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label htmlFor="email">Admin Email</label>
                  <input
                    type="email"
                    id="email"
                    className="neobrutalism-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">Admin Password</label>
                  <input
                    type="password"
                    id="password"
                    className="neobrutalism-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="neobrutalism-btn yellow" style={{ width: '100%', fontSize: '1.2rem' }}>
                    Access Dashboard -{">"}
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function App() {
  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    window.location.href = "/";
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<PublicHome />} />
        <Route path="/blog/:slug" element={<PublicPost />} />
        <Route path="/@:username" element={<PublicProfile />} />

        {/* Authentication Route */}
        <Route path="/login" element={<LoginApp />} />

        {/* Protected Admin Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
