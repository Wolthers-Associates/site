# Deployment Guide - Wolthers & Associates Website

This guide covers deploying the Wolthers & Associates website with both the main site and trips application.

## 🏗️ Architecture Overview

```
wolthers.com (Main site)
├── Main corporate website
├── Team page
└── Contact forms

trips.wolthers.com (Trips application)
├── Trip management system
├── Partner portal
├── Itinerary management
└── Database backend
```

## 🛠️ Prerequisites

### Required Software
- Docker & Docker Compose
- Git
- Node.js (for validation)
- lftp (for FTP deployment)

### Required Accounts
- GitHub account (for CI/CD)
- Hostinger account (for development hosting)
- Production server (for trips.wolthers.com)

## 🔧 Setup Instructions

### 1. Clone and Configure

```bash
# Clone repository
git clone https://github.com/your-username/trips-wolthers.git
cd trips-wolthers

# Copy environment template
cp .env.example .env

# Edit configuration
nano .env
```

### 2. Environment Configuration

Edit `.env` file with your settings:

```env
# Environment
ENVIRONMENT=development  # or production
DOMAIN=trips.wolthers.com

# Database
DB_PASSWORD=your_secure_password
DB_ROOT_PASSWORD=your_root_password

# Hostinger (Development)
HOSTINGER_FTP_HOST=ftp.hostinger.com
HOSTINGER_FTP_USER=your_ftp_user
HOSTINGER_FTP_PASS=your_ftp_password

# Production Server
PROD_HOST=your.server.ip
PROD_USER=deploy
PROD_SSH_KEY=your_ssh_private_key
```

## 🚀 Deployment Options

### Option 1: Automated Deployment (Recommended)

#### Development Deployment (Hostinger)
```bash
# Push to develop branch
git checkout -b develop
git push origin develop
# GitHub Actions will automatically deploy to trips.wolthers.com
```

#### Production Deployment
```bash
# Push to main branch
git checkout main
git merge develop
git push origin main
# GitHub Actions will automatically deploy to trips.wolthers.com
```

### Option 2: Manual Deployment

#### Quick Development Deploy
```bash
# Make script executable
chmod +x scripts/deploy.sh

# Deploy to development
./scripts/deploy.sh dev
```

#### Local Testing
```bash
# Start local environment
./scripts/deploy.sh local

# Access applications
# Main site: http://localhost
# Trips app: http://localhost/trips
# Database admin: http://localhost:8080
```

#### Production Deploy
```bash
# Deploy to production (requires confirmation)
./scripts/deploy.sh prod
```

## 🗄️ Database Management

### Initial Setup
The database is automatically initialized with:
- Complete schema
- Sample data for testing
- Views for common queries
- Indexes for performance

### Manual Database Operations

```bash
# Access database
docker-compose exec database mysql -u root -p

# Create backup
docker-compose exec database mysqldump -u root -p wolthers_trips > backup.sql

# Restore backup
docker-compose exec -T database mysql -u root -p wolthers_trips < backup.sql
```

### Automated Backups
Backups run automatically every day at 2 AM:
- Full database backup
- Schema-only backup
- 30-day retention policy
- Compressed storage

## 🔐 Security Configuration

### GitHub Secrets Required

#### Development Secrets
- `HOSTINGER_FTP_HOST`
- `HOSTINGER_FTP_USER` 
- `HOSTINGER_FTP_PASS`
- `DB_PASSWORD_DEV`
- `DB_ROOT_PASSWORD_DEV`
- `HOSTINGER_API_KEY`

#### Production Secrets
- `PROD_HOST`
- `PROD_USER`
- `PROD_SSH_KEY`
- `DB_PASSWORD_PROD`
- `DB_ROOT_PASSWORD_PROD`

#### Optional Secrets
- `SLACK_WEBHOOK` (for notifications)
- `OFFICE365_CLIENT_ID` (for future auth)
- `OFFICE365_CLIENT_SECRET`

### SSL Configuration
Production automatically configures SSL with Let's Encrypt:
```bash
# Manual SSL renewal
docker-compose exec certbot certbot renew
```

## 📊 Monitoring & Maintenance

### Health Checks
- Automated health checks every 30 seconds
- Database connectivity monitoring
- Application responsiveness testing

### Log Management
```bash
# View application logs
docker-compose logs web

# View database logs
docker-compose logs database

# View all logs
docker-compose logs
```

### Performance Monitoring
- Prometheus metrics available at `:9090`
- Database performance tracking
- Resource usage monitoring

## 🌐 Domain Configuration

### Development Domain
- **URL**: https://trips.wolthers.com
- **Type**: Temporary Hostinger subdomain
- **Purpose**: Development and testing

### Production Domains
- **Main Site**: https://wolthers.com
- **Trips App**: https://trips.wolthers.com
- **SSL**: Auto-configured with Let's Encrypt

### DNS Settings Required
```
# For trips.wolthers.com
A     trips     your.server.ip
CNAME www.trips trips.wolthers.com
```

## 🧪 Testing

### Pre-deployment Testing
```bash
# Validate HTML
npm install -g html-validate
find . -name "*.html" -exec html-validate {} \;

# Validate CSS
npm install -g stylelint stylelint-config-standard
find . -name "*.css" -exec stylelint {} \;

# Test JavaScript
find . -name "*.js" -exec node -c {} \;
```

### Post-deployment Testing
- [ ] Main site loads correctly
- [ ] Team page functions properly
- [ ] Trips application accessible
- [ ] Login functionality works
- [ ] Database connections successful
- [ ] Mobile responsiveness
- [ ] SSL certificate valid

## 🚨 Troubleshooting

### Common Issues

#### Deployment Fails
```bash
# Check GitHub Actions logs
# Verify secrets are set correctly
# Ensure Docker is running
```

#### Database Connection Issues
```bash
# Check database container
docker-compose ps database

# View database logs
docker-compose logs database

# Test connection
docker-compose exec database mysql -u root -p
```

#### FTP Upload Failures
```bash
# Verify FTP credentials
# Check file permissions
# Ensure lftp is installed
```

### Recovery Procedures

#### Rollback Deployment
```bash
# Revert to previous version
git revert HEAD
git push origin main
```

#### Database Recovery
```bash
# Restore from backup
docker-compose exec -T database mysql -u root -p wolthers_trips < backups/latest_backup.sql
```

## 📞 Support

### Emergency Contacts
- **Technical Issues**: tech-support@wolthers.com
- **Database Issues**: db-admin@wolthers.com
- **Deployment Issues**: deploy@wolthers.com

### Documentation
- **API Documentation**: `/docs/api.md`
- **Database Schema**: `/docs/database.md`
- **Security Guidelines**: `/docs/security.md`

---

## 🎯 Deployment Checklist

### Pre-deployment
- [ ] Environment variables configured
- [ ] Secrets set in GitHub
- [ ] Database schema reviewed
- [ ] SSL certificates ready
- [ ] DNS records configured
- [ ] Monitoring setup complete

### Post-deployment
- [ ] All services running
- [ ] Health checks passing
- [ ] SSL working correctly
- [ ] Database accessible
- [ ] Backups configured
- [ ] Monitoring active
- [ ] Performance acceptable

### Go-live
- [ ] Final testing complete
- [ ] Stakeholders notified
- [ ] Documentation updated
- [ ] Support team briefed
- [ ] Monitoring alerts configured

---

**🎉 Ready for deployment!**

For additional support, please contact the development team or refer to the technical documentation. 

📁 Root/
├── 📄 index.html          # Main homepage
├── 📄 team.html           # Team page  
├── 📄 journal.html        # Coffee journal
├── 📁 css/                # Main site styles
├── 📁 js/                 # Main site scripts
├── 📁 images/             # Main site images
├── 📁 trips/              # Trips application
│   ├── 📄 index.html      # Trips homepage
│   ├── 📄 accounts.html   # Account management
│   ├── 📁 css/            # Trips styles
│   ├── 📁 js/             # Trips scripts
│   ├── 📁 images/         # Trips images
│   ├── 📁 api/            # Trips API
│   └── 📁 trip-pages/     # Individual trip pages
├── 📁 database/           # Database setup
├── 📁 scripts/            # Deployment scripts
├── 📁 .github/            # CI/CD workflows
├── 📁 docker/             # Docker config
├── 📁 secrets/            # Secret configs
└── 📄 [deployment docs]   # Documentation 