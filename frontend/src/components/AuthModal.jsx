import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

export default function AuthModal({ isOpen, onClose }) {
  const { login, signup, resetPassword } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('student');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    if (!isForgotPassword && !password) {
      toast.error('Please enter your password');
      return;
    }

    setLoading(true);
    try {
      if (isForgotPassword) {
        await resetPassword(email);
        toast.success('Password reset link sent to your email!');
        setIsForgotPassword(false);
      } else if (isSignUp) {
        await signup(email, password, selectedRole);
        toast.success(`Account created as ${selectedRole.toUpperCase()}!`);
        onClose();
      } else {
        await login(email, password);
        toast.success('Signed in successfully!');
        onClose();
      }
    } catch (err) {
      console.error('Auth error:', err);
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleModeSwitch = (mode) => {
    if (mode === 'forgot') {
      setIsForgotPassword(true);
      setIsSignUp(false);
    } else if (mode === 'signup') {
      setIsSignUp(true);
      setIsForgotPassword(false);
    } else {
      setIsSignUp(false);
      setIsForgotPassword(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="auth-modal-overlay" onClick={onClose}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.2 }}
          className="auth-modal-card" 
          onClick={(e) => e.stopPropagation()}
        >
          <button className="auth-modal-close" onClick={onClose} aria-label="Close modal">
            ✕
          </button>

          <div className="auth-header">
            <div className="auth-logo-badge">
              {isForgotPassword ? '📩' : isSignUp ? '🔑' : '👤'}
            </div>
            <h2>
              {isForgotPassword 
                ? 'Reset Password' 
                : isSignUp 
                ? 'Create Account' 
                : 'Welcome Back'}
            </h2>
            <p>
              {isForgotPassword
                ? 'Enter your email address to receive a password reset link'
                : isSignUp
                ? 'Sign up and select your role to access your dashboard'
                : 'Enter your credentials to access your account'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {isSignUp && (
              <div className="form-group">
                <label>Select Your Role</label>
                <div className="role-selector-pills">
                  <button
                    type="button"
                    className={`role-pill ${selectedRole === 'student' ? 'active' : ''}`}
                    onClick={() => setSelectedRole('student')}
                  >
                    🎓 Student
                  </button>
                  <button
                    type="button"
                    className={`role-pill ${selectedRole === 'teacher' ? 'active' : ''}`}
                    onClick={() => setSelectedRole('teacher')}
                  >
                    👨‍🏫 Faculty
                  </button>
                  <button
                    type="button"
                    className={`role-pill ${selectedRole === 'tpo' ? 'active' : ''}`}
                    onClick={() => setSelectedRole('tpo')}
                  >
                    💼 TPO Officer
                  </button>
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="auth-email">Email Address</label>
              <input 
                id="auth-email"
                type="email" 
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            {!isForgotPassword && (
              <div className="form-group">
                <div className="label-row">
                  <label htmlFor="auth-password">Password</label>
                  {!isSignUp && (
                    <button 
                      type="button" 
                      className="forgot-pass-link"
                      onClick={() => handleModeSwitch('forgot')}
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <input 
                  id="auth-password"
                  type="password" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={!isForgotPassword}
                />
              </div>
            )}

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? (
                <span className="btn-spinner"></span>
              ) : isForgotPassword ? (
                'Send Reset Link'
              ) : isSignUp ? (
                `Create ${selectedRole.toUpperCase()} Account`
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="auth-footer">
            {isForgotPassword ? (
              <p>
                Remembered your password?{' '}
                <button 
                  type="button" 
                  className="auth-switch-btn"
                  onClick={() => handleModeSwitch('signin')}
                >
                  Sign In
                </button>
              </p>
            ) : (
              <p>
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button 
                  type="button" 
                  className="auth-switch-btn"
                  onClick={() => handleModeSwitch(isSignUp ? 'signin' : 'signup')}
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            )}
          </div>
        </motion.div>

        <style>{`
          .auth-modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(8px);
            z-index: 2000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1.5rem;
          }

          .auth-modal-card {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 1.5rem;
            width: 100%;
            max-width: 440px;
            padding: 2.25rem 2rem;
            position: relative;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          }

          .auth-modal-close {
            position: absolute;
            top: 1.25rem;
            right: 1.25rem;
            background: rgba(var(--bg-glass-rgb), 0.1);
            border: 1px solid var(--border);
            color: var(--text-muted);
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: 0.2s;
            font-size: 0.9rem;
          }

          .auth-modal-close:hover {
            color: var(--text-primary);
            background: rgba(var(--bg-glass-rgb), 0.2);
            border-color: var(--accent-blue);
          }

          .auth-header {
            text-align: center;
            margin-bottom: 1.75rem;
          }

          .auth-logo-badge {
            width: 48px;
            height: 48px;
            background: rgba(59, 130, 246, 0.15);
            border: 1px solid rgba(59, 130, 246, 0.3);
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            margin: 0 auto 1rem auto;
          }

          .auth-header h2 {
            font-family: 'Syne', sans-serif;
            font-size: 1.5rem;
            font-weight: 800;
            color: var(--text-primary);
            margin: 0 0 0.35rem 0;
          }

          .auth-header p {
            color: var(--text-muted);
            font-size: 0.85rem;
            margin: 0;
          }

          .auth-form {
            display: flex;
            flex-direction: column;
            gap: 1.1rem;
          }

          .form-group {
            display: flex;
            flex-direction: column;
            gap: 0.4rem;
          }

          .role-selector-pills {
            display: flex;
            gap: 0.5rem;
          }

          .role-pill {
            flex: 1;
            padding: 0.6rem 0.4rem;
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            color: var(--text-muted);
            border-radius: 0.75rem;
            font-size: 0.75rem;
            font-weight: 700;
            cursor: pointer;
            transition: 0.2s;
            text-align: center;
            white-space: nowrap;
          }

          .role-pill.active {
            background: rgba(59, 130, 246, 0.15);
            border-color: var(--accent-blue);
            color: var(--accent-blue);
          }

          .role-pill:hover {
            border-color: var(--accent-blue);
          }

          .label-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .form-group label {
            font-size: 0.8rem;
            font-weight: 700;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .forgot-pass-link {
            background: none;
            border: none;
            color: var(--accent-blue);
            font-size: 0.75rem;
            font-weight: 700;
            cursor: pointer;
            padding: 0;
            transition: 0.2s;
          }

          .forgot-pass-link:hover {
            color: var(--text-primary);
            text-decoration: underline;
          }

          .form-group input {
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            color: var(--text-primary);
            padding: 0.75rem 1rem;
            border-radius: 0.75rem;
            font-size: 0.95rem;
            outline: none;
            transition: 0.2s;
          }

          .form-group input:focus {
            border-color: var(--accent-blue);
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
          }

          .auth-submit-btn {
            background: var(--accent-blue);
            color: #fff;
            border: none;
            padding: 0.85rem;
            border-radius: 0.75rem;
            font-weight: 800;
            font-size: 0.95rem;
            cursor: pointer;
            transition: 0.2s;
            margin-top: 0.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .auth-submit-btn:hover {
            opacity: 0.95;
            box-shadow: 0 8px 20px rgba(59, 130, 246, 0.35);
          }

          .auth-submit-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .btn-spinner {
            width: 18px;
            height: 18px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top-color: #fff;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }

          .auth-footer {
            margin-top: 1.5rem;
            text-align: center;
            font-size: 0.85rem;
            color: var(--text-muted);
            border-top: 1px solid var(--border);
            padding-top: 1.25rem;
          }

          .auth-footer p {
            margin: 0;
          }

          .auth-switch-btn {
            background: none;
            border: none;
            color: var(--accent-blue);
            font-weight: 800;
            cursor: pointer;
            padding: 0;
            margin-left: 0.25rem;
            text-decoration: underline;
          }

          .auth-switch-btn:hover {
            color: var(--text-primary);
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </AnimatePresence>
  );
}
