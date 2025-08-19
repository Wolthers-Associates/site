import NextAuth from 'next-auth'
import AzureADProvider from 'next-auth/providers/azure-ad'

export const authOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      tenantId: process.env.AZURE_AD_TENANT_ID,
      authorization: {
        params: {
          scope: 'openid profile email User.Read',
        },
      },
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Get allowed users from environment variable
      const allowedUsers = process.env.ALLOWED_USERS?.split(',').map(email => email.trim()) || [];
      
      // Check if user email is in the allowed list
      if (user.email && allowedUsers.includes(user.email.toLowerCase())) {
        return true;
      }
      
      // Fallback: deny access
      console.log(`Access denied for user: ${user.email}`);
      return false;
    },
    async session({ session, token }) {
      // Add custom session data
      session.user.domain = session.user.email.split('@')[1];
      session.user.isWolthersEmployee = session.user.email.endsWith('@wolthers.com');
      return session;
    },
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);