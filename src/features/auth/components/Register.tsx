import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useChatStore } from '../../../store/chatStore';

const Register = () => {
  const navigate = useNavigate();
  const { setCurrentUser } = useChatStore();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('請輸入用戶名稱');
      return;
    }

    if (!email.trim()) {
      setError('請輸入電子郵件');
      return;
    }

    if (!password.trim()) {
      setError('請輸入密碼');
      return;
    }

    if (password.length < 6) {
      setError('密碼至少需要 6 個字元');
      return;
    }

    if (password !== confirmPassword) {
      setError('兩次輸入的密碼不一致');
      return;
    }

    setIsLoading(true);
    setError('');

    // 模擬註冊請求
    setTimeout(() => {
      // TODO: 實際應該呼叫後端 API 註冊
      // 註冊成功後自動登入
      setCurrentUser(username);
      sessionStorage.setItem('chatapp_user', username);
      sessionStorage.setItem('chatapp_token', 'mock_token_' + Date.now());
      navigate('/');
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-left">
          <div className="brand-content">
            <div className="brand-logo">COVER ONES</div>
            <h1 className="brand-title">開始你的旅程</h1>
            <p className="brand-description">
              加入我們，體驗全新的溝通方式
            </p>
          </div>
        </div>

        <div className="register-right">
          <div className="register-box">
            <h2 className="register-title">註冊</h2>
            <p className="register-subtitle">建立您的 Cover Ones 帳號</p>

            <form onSubmit={handleSubmit} className="register-form">
              <div className="form-group">
                <label htmlFor="username" className="form-label">
                  用戶名稱
                </label>
                <input
                  id="username"
                  type="text"
                  className="form-input"
                  placeholder="請輸入用戶名稱"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  電子郵件
                </label>
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  placeholder="請輸入電子郵件"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  密碼
                </label>
                <input
                  id="password"
                  type="password"
                  className="form-input"
                  placeholder="至少 6 個字元"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">
                  確認密碼
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  className="form-input"
                  placeholder="再次輸入密碼"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                className="register-button"
                disabled={isLoading}
              >
                {isLoading ? '註冊中...' : '註冊'}
              </button>
            </form>

            <div className="login-link">
              已經有帳號？
              <Link to="/login" className="link-btn">
                立即登入
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

