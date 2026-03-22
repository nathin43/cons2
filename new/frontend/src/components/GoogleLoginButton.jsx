import { GoogleLogin } from '@react-oauth/google';
import './GoogleLoginButton.css';

/**
 * Custom Google Login Button Component
 * Styled to match Google's official sign-in button design
 */
const GoogleLoginButton = ({ onSuccess, onError, isLoading = false }) => {
  return (
    <div className="google-login-container">
      <p className="google-divider-text">or continue with</p>
      <div className="google-button-wrapper">
        <GoogleLogin
          onSuccess={onSuccess}
          onError={onError}
          theme="outline"
          size="large"
          text="continue_with"
          width="100%"
          locale="en"
          useOneTap={false}
        />
      </div>
    </div>
  );
};

export default GoogleLoginButton;
