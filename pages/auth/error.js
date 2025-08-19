import { useRouter } from 'next/router'
import Link from 'next/link'

export default function AuthError() {
  const router = useRouter()
  const { error } = router.query

  const getErrorMessage = (error) => {
    switch (error) {
      case 'AccessDenied':
        return {
          title: 'Access Denied',
          message: 'Only @wolthers.com email addresses are allowed to access this dashboard.',
          suggestion: 'Please sign in with your Wolthers company account.'
        }
      case 'Configuration':
        return {
          title: 'Configuration Error',
          message: 'There was a problem with the authentication configuration.',
          suggestion: 'Please contact your administrator.'
        }
      default:
        return {
          title: 'Authentication Error',
          message: 'An unexpected error occurred during sign in.',
          suggestion: 'Please try again or contact support if the problem persists.'
        }
    }
  }

  const errorInfo = getErrorMessage(error)

  return (
    <div className="error-container">
      <div className="error-card glass-card">
        <div className="error-icon">
          <svg width="64" height="64" fill="none" viewBox="0 0 24 24">
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M12 9v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
        </div>
        
        <h1>{errorInfo.title}</h1>
        <p className="error-message">{errorInfo.message}</p>
        <p className="error-suggestion">{errorInfo.suggestion}</p>
        
        <div className="error-actions">
          <Link href="/auth/signin" className="retry-btn">
            Try Again
          </Link>
          <Link href="/" className="home-btn">
            Go Home
          </Link>
        </div>
      </div>

      <style jsx>{`
        .error-container {
          min-height: 100vh;
          background: var(--primary-gradient);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          position: relative;
        }

        .error-container::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(120, 200, 255, 0.1) 0%, transparent 50%);
          pointer-events: none;
        }

        .error-card {
          max-width: 500px;
          width: 100%;
          padding: 3rem;
          text-align: center;
          animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .error-icon {
          color: rgba(245, 87, 108, 0.8);
          margin-bottom: 1.5rem;
          display: flex;
          justify-content: center;
        }

        h1 {
          color: white;
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 1rem;
          letter-spacing: -0.02em;
        }

        .error-message {
          color: rgba(255, 255, 255, 0.9);
          font-size: 1.1rem;
          margin-bottom: 1rem;
          line-height: 1.6;
        }

        .error-suggestion {
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 2rem;
        }

        .error-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .retry-btn, .home-btn {
          padding: 0.75rem 1.5rem;
          border-radius: 10px;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }

        .retry-btn {
          background: var(--accent-gradient);
          color: white;
        }

        .home-btn {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .retry-btn:hover, .home-btn:hover {
          transform: translateY(-2px);
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}