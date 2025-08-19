import { getProviders, signIn, getSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

export default function SignIn({ providers }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Check if user is already signed in
    getSession().then((session) => {
      if (session) {
        router.push('/')
      }
    })
  }, [router])

  const handleSignIn = async (providerId) => {
    setLoading(true)
    try {
      await signIn(providerId, {
        callbackUrl: `${process.env.NEXTAUTH_URL || ''}${process.env.NEXT_PUBLIC_BASE_PATH || ''}/`
      })
    } catch (error) {
      console.error('Sign in error:', error)
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card glass-card">
        <div className="auth-header">
          <h1>📧 Email Analytics Dashboard</h1>
          <p>Sign in with your Wolthers Microsoft account</p>
        </div>

        <div className="auth-providers">
          {providers &&
            Object.values(providers).map((provider) => (
              <button
                key={provider.name}
                onClick={() => handleSignIn(provider.id)}
                disabled={loading}
                className="microsoft-signin-btn"
              >
                {loading ? (
                  <div className="signin-loading">
                    <div className="spinner"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="signin-content">
                    <svg className="microsoft-icon" viewBox="0 0 21 21" fill="none">
                      <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                      <rect x="12" y="1" width="9" height="9" fill="#00a4ef"/>
                      <rect x="1" y="12" width="9" height="9" fill="#ffb900"/>
                      <rect x="12" y="12" width="9" height="9" fill="#7fba00"/>
                    </svg>
                    <span>Sign in with Microsoft</span>
                  </div>
                )}
              </button>
            ))}
        </div>

        <div className="auth-info">
          <p>Only @wolthers.com accounts are allowed</p>
        </div>
      </div>

      <style jsx>{`
        .auth-container {
          min-height: 100vh;
          background: var(--primary-gradient);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          position: relative;
        }

        .auth-container::before {
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

        .auth-card {
          max-width: 400px;
          width: 100%;
          padding: 3rem;
          text-align: center;
          animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .auth-header h1 {
          color: white;
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          letter-spacing: -0.02em;
        }

        .auth-header p {
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 2rem;
        }

        .microsoft-signin-btn {
          width: 100%;
          background: white;
          color: #333;
          border: none;
          padding: 1rem 1.5rem;
          border-radius: 12px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .microsoft-signin-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .microsoft-signin-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .microsoft-icon {
          width: 20px;
          height: 20px;
        }

        .signin-loading {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid transparent;
          border-top: 2px solid #333;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .auth-info p {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.9rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
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

export async function getServerSideProps() {
  const providers = await getProviders()
  return {
    props: { providers },
  }
}