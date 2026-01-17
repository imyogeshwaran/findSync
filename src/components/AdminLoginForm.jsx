import React from 'react';

function AdminLoginForm({ onAdminLogin }) {
  const [formData, setFormData] = React.useState({ email: '', password: '' });
  const [successMsg, setSuccessMsg] = React.useState('');
  const [errorMsg, setErrorMsg] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(''), 2500);
    return () => clearTimeout(t);
  }, [successMsg]);

  React.useEffect(() => {
    if (!errorMsg) return;
    const t = setTimeout(() => setErrorMsg(''), 3500);
    return () => clearTimeout(t);
  }, [errorMsg]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      // Admin login to dedicated endpoint
      const response = await fetch('http://localhost:3005/api/auth/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Admin login failed');
      }

      const data = await response.json();
      
      // Store token and admin info
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminEmail', data.admin.email);
      localStorage.setItem('adminId', data.admin.admin_id);
      localStorage.setItem('userRole', 'admin');

      setSuccessMsg('Admin login successful!');
      
      if (onAdminLogin) {
        onAdminLogin(data.admin, data.token);
      }
    } catch (error) {
      console.error('Admin login error:', error);
      setErrorMsg(error.message || 'Admin login failed. Check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="signup-scroll-container" style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 1.5rem' }}>
      {/* Top-left site title */}
      <div style={{ position: 'absolute', top: 24, left: 24, zIndex: 50 }}>
        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, background: 'linear-gradient(90deg, #a78bfa, #f472b6)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>FindSync</h1>
      </div>

      <div style={{
        position: 'relative',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        padding: '2.5rem',
        borderRadius: '12px',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        width: '100%',
        maxWidth: '400px',
        color: 'white'
      }}>
        {successMsg && (
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: 0,
              transform: 'translate(-50%, -120%)',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.85rem 1rem',
              borderRadius: '12px',
              background: 'rgba(34, 197, 94, 0.12)',
              border: '1px solid rgba(34, 197, 94, 0.35)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              color: '#d1fae5',
              fontWeight: 600,
              letterSpacing: '0.2px'
            }}
          >
            <span style={{
              display: 'inline-flex',
              width: 22,
              height: 22,
              borderRadius: '50%',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(34, 197, 94, 0.25)',
              border: '1px solid rgba(34, 197, 94, 0.4)',
              color: '#86efac'
            }}>✓</span>
            <span>{successMsg}</span>
            <button
              onClick={() => setSuccessMsg('')}
              aria-label="Close"
              style={{
                marginLeft: '0.5rem',
                background: 'transparent',
                border: 'none',
                color: '#a7f3d0',
                cursor: 'pointer',
                fontSize: '1rem',
                lineHeight: 1
              }}
            >
              ×
            </button>
          </div>
        )}

        {errorMsg && (
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: 0,
              transform: 'translate(-50%, -120%)',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.85rem 1rem',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              color: '#fecaca',
              fontWeight: 600,
              letterSpacing: '0.2px',
              fontSize: '0.875rem'
            }}
          >
            <span style={{
              display: 'inline-flex',
              width: 22,
              height: 22,
              borderRadius: '50%',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(239, 68, 68, 0.25)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#fca5a5'
            }}>!</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Admin badge */}
        <div style={{ display: 'inline-block', marginBottom: '1rem', padding: '0.5rem 1rem', background: 'rgba(168, 85, 247, 0.2)', border: '1px solid rgba(168, 85, 247, 0.5)', borderRadius: '6px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#d8b4fe', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🔐 Admin Portal</span>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '600', color: 'white', marginBottom: '0.5rem' }}>
            Admin Login
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', margin: 0 }}>
            Enter your admin credentials to access the dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label htmlFor="admin-email" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: '#ffffffff' }}>
              Admin Email
            </label>
            <input
              id="admin-email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="admin@example.com"
              required
              disabled={isLoading}
              style={{ width: '100%', padding: '0.75rem', backgroundColor: 'white', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '0.875rem', color: '#000000ff', opacity: isLoading ? 0.6 : 1, cursor: isLoading ? 'not-allowed' : 'auto' }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <label htmlFor="admin-password" style={{ fontSize: '0.875rem', fontWeight: '500', color: '#ffffffff', display: 'block', marginBottom: '0.5rem' }}>
              Admin Password
            </label>
            <input
              id="admin-password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              disabled={isLoading}
              style={{ width: '100%', padding: '0.75rem', backgroundColor: 'white', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '0.875rem', color: '#101010ff', opacity: isLoading ? 0.6 : 1, cursor: isLoading ? 'not-allowed' : 'auto' }}
            />
          </div>

          {/* Security notice */}
          <div style={{ padding: '0.75rem', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '6px' }}>
            <p style={{ fontSize: '0.75rem', color: 'rgba(199, 210, 254, 0.9)', margin: 0 }}>
              🔒 This is a restricted administrative portal. All login attempts are logged.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{ padding: '0.75rem', backgroundColor: isLoading ? '#6b7280' : '#a855f7', color: 'white', border: 'none', borderRadius: '6px', cursor: isLoading ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontWeight: '600', width: '100%', transition: 'background-color 0.2s' }}
          >
            {isLoading ? 'Authenticating...' : 'Access Admin Panel'}
          </button>

          <div style={{ paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}>
            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.6)', margin: 0 }}>
              Not an admin? <a href="/login" style={{ color: '#00fff7ff', textDecoration: 'none', fontWeight: '500' }}>Go to user login</a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminLoginForm;
