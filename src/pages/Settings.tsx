import { useTheme } from '../hooks/useTheme';
import { SocialBindingSection } from '../components/settings/SocialBindingSection';
import './Settings.css';

const Settings = () => {
  const { config, togglePanel } = useTheme();
  const theme = config.panel;

  return (
    <div className="settings-page">
      <div className="settings-container">
        <h1 className="settings-title">設定</h1>

        <div className="settings-section">
          <h2 className="section-title">外觀</h2>

          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">主題模式</div>
              <div className="setting-description">選擇淺色或深色主題</div>
            </div>

            <div className="theme-options">
              <button
                className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                onClick={() => {
                  if (theme === 'dark') {
                    togglePanel();
                  }
                }}
              >
                <div className="theme-preview light">
                  <div className="preview-header"></div>
                  <div className="preview-body">
                    <div className="preview-bar"></div>
                    <div className="preview-bar short"></div>
                  </div>
                </div>
                <span>淺色</span>
              </button>

              <button
                className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => {
                  if (theme === 'light') {
                    togglePanel();
                  }
                }}
              >
                <div className="theme-preview dark">
                  <div className="preview-header"></div>
                  <div className="preview-body">
                    <div className="preview-bar"></div>
                    <div className="preview-bar short"></div>
                  </div>
                </div>
                <span>深色</span>
              </button>
            </div>
          </div>
        </div>

        {/* 社群帳號綁定 — link/unlink Google & LINE for the authenticated user. */}
        <SocialBindingSection />

        <div className="settings-section">
          <h2 className="section-title">通知</h2>

          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">桌面通知</div>
              <div className="setting-description">接收新訊息的桌面通知</div>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" defaultChecked />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">訊息音效</div>
              <div className="setting-description">新訊息提示音</div>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" defaultChecked />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div className="settings-section">
          <h2 className="section-title">隱私</h2>

          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">已讀狀態</div>
              <div className="setting-description">讓其他人看到你的已讀狀態</div>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" defaultChecked />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">線上狀態</div>
              <div className="setting-description">顯示你的線上狀態</div>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" defaultChecked />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
