#!/bin/bash

# Wolthers & Associates - Deployment Script
# Usage: ./scripts/deploy.sh [environment]
# Environments: dev, prod, local

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default environment
ENVIRONMENT=${1:-dev}

echo -e "${BLUE}🚀 Deploying Wolthers & Associates Website${NC}"
echo -e "${YELLOW}Environment: ${ENVIRONMENT}${NC}"

# Check if required files exist
check_requirements() {
    echo -e "${BLUE}📋 Checking requirements...${NC}"
    
    if [ ! -f "Dockerfile" ]; then
        echo -e "${RED}❌ Dockerfile not found${NC}"
        exit 1
    fi
    
    if [ ! -f "docker-compose.yml" ]; then
        echo -e "${RED}❌ docker-compose.yml not found${NC}"
        exit 1
    fi
    
    if [ ! -f ".env.example" ]; then
        echo -e "${RED}❌ .env.example not found${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Requirements check passed${NC}"
}

# Create environment file
create_env_file() {
    echo -e "${BLUE}📝 Creating environment configuration...${NC}"
    
    if [ ! -f ".env" ]; then
        cp .env.example .env
        echo -e "${YELLOW}⚠️  Please edit .env file with your configuration${NC}"
        echo -e "${YELLOW}⚠️  Make sure to set secure passwords and API keys${NC}"
        read -p "Press enter to continue after editing .env file..."
    fi
    
    echo -e "${GREEN}✅ Environment file ready${NC}"
}

# Deploy to development (Hostinger)
deploy_development() {
    echo -e "${BLUE}🔄 Deploying to development environment...${NC}"
    
    # Check if FTP credentials are set
    if [ -z "$WOLTHERS_FTP_HOST" ] || [ -z "$WOLTHERS_FTP_USER" ] || [ -z "$WOLTHERS_FTP_PASS" ]; then
        echo -e "${RED}❌ Wolthers FTP credentials not set${NC}"
        echo -e "${YELLOW}Please set WOLTHERS_FTP_HOST, WOLTHERS_FTP_USER, and WOLTHERS_FTP_PASS environment variables${NC}"
        exit 1
    fi
    
    # Install lftp if not present
    if ! command -v lftp &> /dev/null; then
        echo -e "${YELLOW}📦 Installing lftp...${NC}"
        if [[ "$OSTYPE" == "darwin"* ]]; then
            brew install lftp
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            sudo apt-get update && sudo apt-get install -y lftp
        else
            echo -e "${RED}❌ Please install lftp manually${NC}"
            exit 1
        fi
    fi
    
    # Deploy main site files
    echo -e "${BLUE}📤 Uploading main site files...${NC}"
    lftp -c "
        set ftp:ssl-allow no;
        open -u $WOLTHERS_FTP_USER,$WOLTHERS_FTP_PASS $WOLTHERS_FTP_HOST;
        lcd 'main site reference';
        cd public_html;
        mirror --reverse --delete --verbose --exclude-glob .git* --exclude-glob .env* --exclude-glob node_modules* --exclude-glob .DS_Store*
    "
    
    # Deploy trips application
    echo -e "${BLUE}📤 Uploading trips application...${NC}"
    lftp -c "
        set ftp:ssl-allow no;
        open -u $WOLTHERS_FTP_USER,$WOLTHERS_FTP_PASS $WOLTHERS_FTP_HOST;
        lcd public;
        cd public_html/trips;
        mirror --reverse --delete --verbose --exclude-glob .git* --exclude-glob .env* --exclude-glob node_modules* --exclude-glob .DS_Store*
    "
    
    echo -e "${GREEN}✅ Development deployment completed${NC}"
    echo -e "${BLUE}🌐 Main site: https://wolthers.com${NC}"
    echo -e "${BLUE}🧳 Trips app: https://wolthers.com/trips${NC}"
}

# Deploy to production
deploy_production() {
    echo -e "${BLUE}🔄 Deploying to production environment...${NC}"
    
    # Confirmation prompt
    echo -e "${RED}⚠️  You are about to deploy to PRODUCTION${NC}"
    read -p "Are you sure? Type 'yes' to continue: " confirm
    if [ "$confirm" != "yes" ]; then
        echo -e "${YELLOW}❌ Deployment cancelled${NC}"
        exit 1
    fi
    
    # Build and deploy with Docker
    echo -e "${BLUE}🔨 Building Docker image...${NC}"
    docker build -t wolthers-website:latest .
    
    echo -e "${BLUE}🚀 Starting production containers...${NC}"
    docker-compose -f docker-compose.prod.yml up -d
    
    # Wait for services to be ready
    echo -e "${BLUE}⏱️  Waiting for services to start...${NC}"
    sleep 30
    
    # Health check
    echo -e "${BLUE}🏥 Running health check...${NC}"
    if curl -f http://localhost/trips/ > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Production deployment successful${NC}"
        echo -e "${BLUE}🌐 Visit: https://trips.wolthers.com${NC}"
    else
        echo -e "${RED}❌ Health check failed${NC}"
        docker-compose -f docker-compose.prod.yml logs
        exit 1
    fi
}

# Deploy locally for testing
deploy_local() {
    echo -e "${BLUE}🔄 Starting local development environment...${NC}"
    
    # Build and start containers
    docker-compose down
    docker-compose build
    docker-compose up -d
    
    # Wait for services
    echo -e "${BLUE}⏱️  Waiting for services to start...${NC}"
    sleep 20
    
    # Health check
    if curl -f http://localhost/trips/ > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Local environment ready${NC}"
        echo -e "${BLUE}🌐 Main site: http://localhost${NC}"
        echo -e "${BLUE}🧳 Trips app: http://localhost/trips${NC}"
        echo -e "${BLUE}🗄️  Database admin: http://localhost:8080${NC}"
    else
        echo -e "${RED}❌ Health check failed${NC}"
        docker-compose logs
        exit 1
    fi
}

# Main deployment logic
case $ENVIRONMENT in
    "dev"|"development")
        check_requirements
        create_env_file
        deploy_development
        ;;
    "prod"|"production")
        check_requirements
        create_env_file
        deploy_production
        ;;
    "local")
        check_requirements
        create_env_file
        deploy_local
        ;;
    *)
        echo -e "${RED}❌ Invalid environment: $ENVIRONMENT${NC}"
        echo -e "${YELLOW}Valid options: dev, prod, local${NC}"
        exit 1
        ;;
esac

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}" 