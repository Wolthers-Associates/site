#!/bin/bash

# Wolthers & Associates - Deployment Verification Script
# This script checks if the authentication fix was deployed successfully

echo "🔍 Wolthers Authentication Fix - Deployment Verification"
echo "======================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test 1: Check if new script tags are present
echo -e "${BLUE}🔍 Test 1: Checking script tags in production HTML...${NC}"
SCRIPT_CHECK=$(curl -s "https://trips.wolthers.com/" | grep -c "js/microsoft-auth.js\|js/main.js")
OLD_SCRIPT_CHECK=$(curl -s "https://trips.wolthers.com/" | grep -c "js/pages/index.bootstrap.js")

if [ "$SCRIPT_CHECK" -gt 0 ]; then
    echo -e "   ${GREEN}✅${NC} New script tags found: js/microsoft-auth.js and js/main.js"
else
    echo -e "   ${RED}❌${NC} New script tags NOT found"
fi

if [ "$OLD_SCRIPT_CHECK" -gt 0 ]; then
    echo -e "   ${RED}❌${NC} Old broken script tag still present: js/pages/index.bootstrap.js"
else
    echo -e "   ${GREEN}✅${NC} Old broken script tag removed"
fi

echo ""

# Test 2: Check if debug tool is accessible
echo -e "${BLUE}🔍 Test 2: Checking debug tool accessibility...${NC}"
DEBUG_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://trips.wolthers.com/debug-auth.html")

if [ "$DEBUG_STATUS" = "200" ]; then
    echo -e "   ${GREEN}✅${NC} Debug tool accessible at https://trips.wolthers.com/debug-auth.html"
else
    echo -e "   ${RED}❌${NC} Debug tool not accessible (HTTP $DEBUG_STATUS)"
fi

echo ""

# Test 3: Check if JavaScript files are accessible
echo -e "${BLUE}🔍 Test 3: Checking JavaScript file accessibility...${NC}"

JS_FILES=(
    "js/microsoft-auth.js"
    "js/main.js"
)

for js_file in "${JS_FILES[@]}"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://trips.wolthers.com/$js_file")
    if [ "$STATUS" = "200" ]; then
        echo -e "   ${GREEN}✅${NC} $js_file - Accessible (HTTP $STATUS)"
    else
        echo -e "   ${RED}❌${NC} $js_file - Not accessible (HTTP $STATUS)"
    fi
done

echo ""

# Test 4: Check if Microsoft config API is working
echo -e "${BLUE}🔍 Test 4: Checking Microsoft configuration API...${NC}"
CONFIG_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://trips.wolthers.com/api/auth/microsoft-config.php")

if [ "$CONFIG_STATUS" = "200" ]; then
    echo -e "   ${GREEN}✅${NC} Microsoft config API accessible"
    
    # Check if config has required data
    CONFIG_DATA=$(curl -s "https://trips.wolthers.com/api/auth/microsoft-config.php")
    CLIENT_ID_CHECK=$(echo "$CONFIG_DATA" | grep -c "clientId")
    
    if [ "$CLIENT_ID_CHECK" -gt 0 ]; then
        echo -e "   ${GREEN}✅${NC} Microsoft configuration contains client ID"
    else
        echo -e "   ${YELLOW}⚠️${NC}  Microsoft configuration missing client ID"
    fi
else
    echo -e "   ${RED}❌${NC} Microsoft config API not accessible (HTTP $CONFIG_STATUS)"
fi

echo ""

# Test 5: Check for login button in HTML
echo -e "${BLUE}🔍 Test 5: Checking for Microsoft login button...${NC}"
BUTTON_CHECK=$(curl -s "https://trips.wolthers.com/" | grep -c "microsoftLoginBtn")

if [ "$BUTTON_CHECK" -gt 0 ]; then
    echo -e "   ${GREEN}✅${NC} Microsoft login button found in HTML"
else
    echo -e "   ${RED}❌${NC} Microsoft login button NOT found in HTML"
fi

echo ""

# Summary
echo -e "${BLUE}📋 Deployment Verification Summary:${NC}"
echo "============================================"

TOTAL_TESTS=5
PASSED_TESTS=0

# Count passed tests
if [ "$SCRIPT_CHECK" -gt 0 ] && [ "$OLD_SCRIPT_CHECK" -eq 0 ]; then
    ((PASSED_TESTS++))
fi

if [ "$DEBUG_STATUS" = "200" ]; then
    ((PASSED_TESTS++))
fi

# Check JS files
JS_PASSED=0
for js_file in "${JS_FILES[@]}"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://trips.wolthers.com/$js_file")
    if [ "$STATUS" = "200" ]; then
        ((JS_PASSED++))
    fi
done
if [ "$JS_PASSED" -eq 2 ]; then
    ((PASSED_TESTS++))
fi

if [ "$CONFIG_STATUS" = "200" ]; then
    ((PASSED_TESTS++))
fi

if [ "$BUTTON_CHECK" -gt 0 ]; then
    ((PASSED_TESTS++))
fi

echo "Tests Passed: $PASSED_TESTS / $TOTAL_TESTS"

if [ "$PASSED_TESTS" -eq "$TOTAL_TESTS" ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! Deployment successful!${NC}"
    echo ""
    echo -e "${BLUE}🚀 Next Steps:${NC}"
    echo "1. Visit https://trips.wolthers.com/"
    echo "2. Try the Microsoft sign-in button"
    echo "3. Complete the authentication flow"
    echo ""
    echo -e "${GREEN}✅ Microsoft authentication should now work correctly!${NC}"
elif [ "$PASSED_TESTS" -gt $((TOTAL_TESTS / 2)) ]; then
    echo -e "${YELLOW}⚠️  PARTIAL SUCCESS - Some issues detected${NC}"
    echo ""
    echo -e "${BLUE}🔧 Recommended Actions:${NC}"
    echo "1. Check the debug tool: https://trips.wolthers.com/debug-auth.html"
    echo "2. Verify all files were uploaded correctly"
    echo "3. Clear browser cache and test again"
else
    echo -e "${RED}❌ DEPLOYMENT FAILED - Multiple issues detected${NC}"
    echo ""
    echo -e "${BLUE}🚨 Troubleshooting Steps:${NC}"
    echo "1. Verify files were uploaded to the correct location"
    echo "2. Check file permissions (should be 644 for HTML files)"
    echo "3. Review the deployment guide: DEPLOYMENT-GUIDE.md"
    echo "4. Consider restoring from backup if needed"
fi

echo ""
echo -e "${BLUE}🔗 Useful URLs:${NC}"
echo "   Main Site: https://trips.wolthers.com/"
echo "   Debug Tool: https://trips.wolthers.com/debug-auth.html"
echo "   Microsoft Auth JS: https://trips.wolthers.com/js/microsoft-auth.js"
echo "   Main JS: https://trips.wolthers.com/js/main.js"
echo "" 