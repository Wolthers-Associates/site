#!/bin/bash

# Wolthers & Associates - Authentication Fix Deployment
# This script deploys the updated HTML files to fix Microsoft authentication

echo "🚀 Wolthers Authentication Fix Deployment"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REMOTE_HOST="u975408171@trips.wolthers.com"
REMOTE_PATH="/home/u975408171/domains/trips.wolthers.com/public_html"
LOCAL_PATH="$(pwd)/trips"

echo -e "${BLUE}📋 Deployment Configuration:${NC}"
echo "   Remote Host: $REMOTE_HOST"
echo "   Remote Path: $REMOTE_PATH"
echo "   Local Path: $LOCAL_PATH"
echo ""

# Check if files exist locally
echo -e "${BLUE}🔍 Checking local files...${NC}"
FILES_TO_DEPLOY=(
    "index.html"
    "accounts.html" 
    "admin-vehicles.html"
)

MISSING_FILES=()
for file in "${FILES_TO_DEPLOY[@]}"; do
    if [ -f "$LOCAL_PATH/$file" ]; then
        echo -e "   ${GREEN}✅${NC} $file - Found"
    else
        echo -e "   ${RED}❌${NC} $file - Missing"
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo -e "${RED}❌ Error: Missing files. Cannot proceed with deployment.${NC}"
    exit 1
fi

echo ""

# Create backup of current production files
echo -e "${BLUE}💾 Creating backup of current production files...${NC}"
BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"

echo "Creating backup directory: $BACKUP_DIR"
ssh $REMOTE_HOST "mkdir -p $REMOTE_PATH/$BACKUP_DIR"

for file in "${FILES_TO_DEPLOY[@]}"; do
    echo "   Backing up $file..."
    ssh $REMOTE_HOST "cp $REMOTE_PATH/$file $REMOTE_PATH/$BACKUP_DIR/$file 2>/dev/null || echo 'File $file not found on server'"
done

echo -e "${GREEN}✅ Backup completed${NC}"
echo ""

# Deploy updated files
echo -e "${BLUE}🚀 Deploying updated files...${NC}"

for file in "${FILES_TO_DEPLOY[@]}"; do
    echo "   Uploading $file..."
    scp "$LOCAL_PATH/$file" "$REMOTE_HOST:$REMOTE_PATH/$file"
    
    if [ $? -eq 0 ]; then
        echo -e "   ${GREEN}✅${NC} $file uploaded successfully"
    else
        echo -e "   ${RED}❌${NC} Failed to upload $file"
        exit 1
    fi
done

echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""

# Verify deployment
echo -e "${BLUE}🔍 Verifying deployment...${NC}"
echo "Checking if updated scripts are being served..."

# Check if the new script tags are present
SCRIPT_CHECK=$(curl -s "https://trips.wolthers.com/" | grep -c "js/microsoft-auth.js\|js/main.js")
if [ "$SCRIPT_CHECK" -gt 0 ]; then
    echo -e "${GREEN}✅ New script tags found in production HTML${NC}"
else
    echo -e "${YELLOW}⚠️  Script tags not yet visible (may need a few moments to update)${NC}"
fi

echo ""
echo -e "${BLUE}📋 Post-Deployment Instructions:${NC}"
echo "1. Visit https://trips.wolthers.com/"
echo "2. Open browser developer tools (F12)"
echo "3. Check the Console tab for any errors"
echo "4. Try clicking the Microsoft sign-in button"
echo "5. Verify that authentication works correctly"
echo ""
echo -e "${BLUE}🔧 If issues persist:${NC}"
echo "1. Check the debug tool at: https://trips.wolthers.com/debug-auth.html"
echo "2. Look for any remaining script loading errors"
echo "3. Verify that js/microsoft-auth.js and js/main.js are accessible"
echo ""
echo -e "${BLUE}📁 Backup Location:${NC}"
echo "   Server: $REMOTE_PATH/$BACKUP_DIR/"
echo "   (Use this to rollback if needed)"
echo ""
echo -e "${GREEN}🎯 Deployment Summary:${NC}"
echo "   ✅ Fixed broken bootstrap script loading"
echo "   ✅ Implemented direct script loading"
echo "   ✅ Microsoft authentication should now work"
echo ""
echo -e "${BLUE}🔗 Test URLs:${NC}"
echo "   Main Site: https://trips.wolthers.com/"
echo "   Debug Tool: https://trips.wolthers.com/debug-auth.html"
echo "" 