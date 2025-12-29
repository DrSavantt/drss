#!/bin/bash

# ============================================
# Test Script for Questionnaire Response APIs
# ============================================

# USAGE:
# 1. Update CLIENT_ID below with a real client ID from your database
# 2. Make sure your Next.js server is running: npm run dev
# 3. Run: chmod +x TEST_API_ROUTES.sh && ./TEST_API_ROUTES.sh

# Configuration
BASE_URL="http://localhost:3000"
CLIENT_ID="YOUR_CLIENT_ID_HERE"  # ← UPDATE THIS

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================"
echo "Testing Questionnaire Response APIs"
echo "========================================"
echo ""

# Check if CLIENT_ID is set
if [ "$CLIENT_ID" == "YOUR_CLIENT_ID_HERE" ]; then
    echo -e "${RED}ERROR: Please update CLIENT_ID in this script${NC}"
    echo "Get a client ID from your database clients table"
    exit 1
fi

# Test 1: Create Draft (POST)
echo -e "${YELLOW}Test 1: Create Draft${NC}"
echo "POST $BASE_URL/api/questionnaire-response"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/questionnaire-response" \
  -H "Content-Type: application/json" \
  -d "{
    \"client_id\": \"$CLIENT_ID\",
    \"response_data\": {
      \"avatar_definition\": {
        \"q1_ideal_customer\": \"Test customer from script\"
      },
      \"dream_outcome\": {
        \"q6_dream_outcome\": \"Test outcome\"
      }
    }
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✓ Success (HTTP $HTTP_CODE)${NC}"
    echo "$BODY" | jq '.'
else
    echo -e "${RED}✗ Failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
fi
echo ""
sleep 1

# Test 2: Update Draft (POST again)
echo -e "${YELLOW}Test 2: Update Existing Draft${NC}"
echo "POST $BASE_URL/api/questionnaire-response"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/questionnaire-response" \
  -H "Content-Type: application/json" \
  -d "{
    \"client_id\": \"$CLIENT_ID\",
    \"response_data\": {
      \"avatar_definition\": {
        \"q1_ideal_customer\": \"UPDATED customer from script\"
      },
      \"dream_outcome\": {
        \"q6_dream_outcome\": \"UPDATED outcome\"
      }
    }
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✓ Success (HTTP $HTTP_CODE)${NC}"
    echo "$BODY" | jq '.'
    ACTION=$(echo "$BODY" | jq -r '.action')
    if [ "$ACTION" == "updated" ]; then
        echo -e "${GREEN}✓ Correctly updated existing draft${NC}"
    fi
else
    echo -e "${RED}✗ Failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
fi
echo ""
sleep 1

# Test 3: Get Latest Response
echo -e "${YELLOW}Test 3: Get Latest Response${NC}"
echo "GET $BASE_URL/api/questionnaire-response/$CLIENT_ID/latest"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/questionnaire-response/$CLIENT_ID/latest")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✓ Success (HTTP $HTTP_CODE)${NC}"
    echo "$BODY" | jq '.'
    HAS_RESPONSE=$(echo "$BODY" | jq -r '.has_response')
    if [ "$HAS_RESPONSE" == "true" ]; then
        echo -e "${GREEN}✓ Has response data${NC}"
        STATUS=$(echo "$BODY" | jq -r '.data.status')
        echo "Status: $STATUS"
    fi
else
    echo -e "${RED}✗ Failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
fi
echo ""
sleep 1

# Test 4: Get All Versions (History)
echo -e "${YELLOW}Test 4: Get Response History${NC}"
echo "GET $BASE_URL/api/questionnaire-response/$CLIENT_ID"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/questionnaire-response/$CLIENT_ID")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✓ Success (HTTP $HTTP_CODE)${NC}"
    COUNT=$(echo "$BODY" | jq -r '.count')
    echo "Total versions: $COUNT"
    echo "$BODY" | jq '.data[] | {version: .version, status: .status, created_at: .created_at}'
else
    echo -e "${RED}✗ Failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
fi
echo ""
sleep 1

# Test 5: Submit Questionnaire
echo -e "${YELLOW}Test 5: Submit Questionnaire${NC}"
echo "PUT $BASE_URL/api/questionnaire-response/$CLIENT_ID/submit"
RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/api/questionnaire-response/$CLIENT_ID/submit" \
  -H "Content-Type: application/json" \
  -d '{"submitted_by": "admin"}')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✓ Success (HTTP $HTTP_CODE)${NC}"
    echo "$BODY" | jq '.'
    STATUS=$(echo "$BODY" | jq -r '.data.status')
    if [ "$STATUS" == "submitted" ]; then
        echo -e "${GREEN}✓ Status correctly changed to 'submitted'${NC}"
    fi
else
    echo -e "${RED}✗ Failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
fi
echo ""
sleep 1

# Test 6: Verify Submission (Get Latest Again)
echo -e "${YELLOW}Test 6: Verify Submission${NC}"
echo "GET $BASE_URL/api/questionnaire-response/$CLIENT_ID/latest"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/questionnaire-response/$CLIENT_ID/latest")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✓ Success (HTTP $HTTP_CODE)${NC}"
    STATUS=$(echo "$BODY" | jq -r '.data.status')
    SUBMITTED_AT=$(echo "$BODY" | jq -r '.data.submitted_at')
    SUBMITTED_BY=$(echo "$BODY" | jq -r '.data.submitted_by')
    
    echo "Status: $STATUS"
    echo "Submitted At: $SUBMITTED_AT"
    echo "Submitted By: $SUBMITTED_BY"
    
    if [ "$STATUS" == "submitted" ]; then
        echo -e "${GREEN}✓ Correctly shows as submitted${NC}"
    else
        echo -e "${RED}✗ Status should be 'submitted' but is '$STATUS'${NC}"
    fi
else
    echo -e "${RED}✗ Failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
fi
echo ""

# Summary
echo "========================================"
echo -e "${GREEN}All tests completed!${NC}"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Check the database to verify data was saved"
echo "2. Try creating another draft (should create version 2)"
echo "3. Test with different client IDs"
echo ""

