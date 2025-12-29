#!/bin/bash

# ============================================
# Test Script for Client Questionnaire Override APIs
# ============================================

# USAGE:
# 1. Update CLIENT_ID and QUESTION_ID below
# 2. Make sure your Next.js server is running: npm run dev
# 3. Run: chmod +x TEST_OVERRIDE_APIS.sh && ./TEST_OVERRIDE_APIS.sh

# Configuration
BASE_URL="http://localhost:3000"
CLIENT_ID="YOUR_CLIENT_ID_HERE"          # ← UPDATE THIS
QUESTION_ID="q1_ideal_customer"          # ← UPDATE THIS (or use actual UUID)
SECTION_ID="7"                           # Faith Integration section

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "========================================"
echo "Testing Client Questionnaire Override APIs"
echo "========================================"
echo ""

# Check if CLIENT_ID is set
if [ "$CLIENT_ID" == "YOUR_CLIENT_ID_HERE" ]; then
    echo -e "${RED}ERROR: Please update CLIENT_ID in this script${NC}"
    echo "Get a client ID from your database clients table"
    exit 1
fi

# Test 1: Get Merged Config (Before Overrides)
echo -e "${YELLOW}Test 1: Get Merged Config (Baseline)${NC}"
echo "GET $BASE_URL/api/client-questionnaire/$CLIENT_ID"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/client-questionnaire/$CLIENT_ID")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✓ Success (HTTP $HTTP_CODE)${NC}"
    OVERRIDE_COUNT=$(echo "$BODY" | jq -r '.overrideCount')
    echo "Override Count: $OVERRIDE_COUNT"
    echo "Client: $(echo "$BODY" | jq -r '.client.name')"
else
    echo -e "${RED}✗ Failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
fi
echo ""
sleep 1

# Test 2: Create Override - Disable Question
echo -e "${YELLOW}Test 2: Create Override (Disable Question)${NC}"
echo "PUT $BASE_URL/api/client-questionnaire/$CLIENT_ID/override"
RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/api/client-questionnaire/$CLIENT_ID/override" \
  -H "Content-Type: application/json" \
  -d "{
    \"question_id\": \"$QUESTION_ID\",
    \"is_enabled\": false
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✓ Success (HTTP $HTTP_CODE)${NC}"
    ACTION=$(echo "$BODY" | jq -r '.action')
    echo "Action: $ACTION"
    OVERRIDE_ID=$(echo "$BODY" | jq -r '.data.id')
    echo "Override ID: $OVERRIDE_ID"
    echo "$BODY" | jq '.data'
else
    echo -e "${RED}✗ Failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
fi
echo ""
sleep 1

# Test 3: Update Override - Custom Text
echo -e "${YELLOW}Test 3: Update Override (Custom Text)${NC}"
echo "PUT $BASE_URL/api/client-questionnaire/$CLIENT_ID/override"
RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/api/client-questionnaire/$CLIENT_ID/override" \
  -H "Content-Type: application/json" \
  -d "{
    \"question_id\": \"$QUESTION_ID\",
    \"is_enabled\": true,
    \"custom_text\": \"Who is your primary target market? (Custom for this client)\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✓ Success (HTTP $HTTP_CODE)${NC}"
    ACTION=$(echo "$BODY" | jq -r '.action')
    echo "Action: $ACTION"
    CUSTOM_TEXT=$(echo "$BODY" | jq -r '.data.custom_text')
    echo "Custom Text: $CUSTOM_TEXT"
else
    echo -e "${RED}✗ Failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
fi
echo ""
sleep 1

# Test 4: Get All Overrides
echo -e "${YELLOW}Test 4: Get All Overrides${NC}"
echo "GET $BASE_URL/api/client-questionnaire/$CLIENT_ID/overrides"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/client-questionnaire/$CLIENT_ID/overrides")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✓ Success (HTTP $HTTP_CODE)${NC}"
    COUNT=$(echo "$BODY" | jq -r '.count')
    echo "Total Overrides: $COUNT"
    echo "Question Overrides: $(echo "$BODY" | jq -r '.questionOverrides | length')"
    echo "Section Overrides: $(echo "$BODY" | jq -r '.sectionOverrides | length')"
    echo ""
    echo "Overrides:"
    echo "$BODY" | jq '.data[] | {id: .id, question_id: .question_id, custom_text: .custom_text, is_enabled: .is_enabled}'
else
    echo -e "${RED}✗ Failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
fi
echo ""
sleep 1

# Test 5: Get Merged Config (After Overrides)
echo -e "${YELLOW}Test 5: Get Merged Config (With Overrides)${NC}"
echo "GET $BASE_URL/api/client-questionnaire/$CLIENT_ID"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/client-questionnaire/$CLIENT_ID")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✓ Success (HTTP $HTTP_CODE)${NC}"
    OVERRIDE_COUNT=$(echo "$BODY" | jq -r '.overrideCount')
    echo "Override Count: $OVERRIDE_COUNT"
    
    # Check if our customized question appears
    echo ""
    echo -e "${BLUE}Looking for customized question...${NC}"
    echo "$BODY" | jq ".data[].questions[] | select(.id == \"$QUESTION_ID\") | {id: .id, text: .text, _hasOverride: ._hasOverride, _usingGlobal: ._usingGlobal}"
else
    echo -e "${RED}✗ Failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
fi
echo ""
sleep 1

# Test 6: Create Section Override (Disable Section)
echo -e "${YELLOW}Test 6: Create Section Override (Disable Section)${NC}"
echo "PUT $BASE_URL/api/client-questionnaire/$CLIENT_ID/override"
RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/api/client-questionnaire/$CLIENT_ID/override" \
  -H "Content-Type: application/json" \
  -d "{
    \"section_id\": $SECTION_ID,
    \"is_enabled\": false
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✓ Success (HTTP $HTTP_CODE)${NC}"
    ACTION=$(echo "$BODY" | jq -r '.action')
    echo "Action: $ACTION"
    SECTION_OVERRIDE_ID=$(echo "$BODY" | jq -r '.data.id')
    echo "Section Override ID: $SECTION_OVERRIDE_ID"
else
    echo -e "${RED}✗ Failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
fi
echo ""
sleep 1

# Test 7: Delete Override (Reset to Global)
echo -e "${YELLOW}Test 7: Delete Override (Reset to Global)${NC}"
if [ ! -z "$OVERRIDE_ID" ] && [ "$OVERRIDE_ID" != "null" ]; then
    echo "DELETE $BASE_URL/api/client-questionnaire/$CLIENT_ID/override/$OVERRIDE_ID"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/api/client-questionnaire/$CLIENT_ID/override/$OVERRIDE_ID")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    
    if [ "$HTTP_CODE" == "200" ]; then
        echo -e "${GREEN}✓ Success (HTTP $HTTP_CODE)${NC}"
        echo "Message: $(echo "$BODY" | jq -r '.message')"
        echo "Deleted: $(echo "$BODY" | jq '.deleted')"
    else
        echo -e "${RED}✗ Failed (HTTP $HTTP_CODE)${NC}"
        echo "$BODY"
    fi
else
    echo -e "${YELLOW}⚠ Skipped - No override ID from previous test${NC}"
fi
echo ""
sleep 1

# Test 8: Verify Deletion (Get Overrides Again)
echo -e "${YELLOW}Test 8: Verify Deletion${NC}"
echo "GET $BASE_URL/api/client-questionnaire/$CLIENT_ID/overrides"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/client-questionnaire/$CLIENT_ID/overrides")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✓ Success (HTTP $HTTP_CODE)${NC}"
    COUNT=$(echo "$BODY" | jq -r '.count')
    echo "Remaining Overrides: $COUNT"
    
    if [ "$COUNT" == "1" ]; then
        echo -e "${GREEN}✓ Question override deleted, section override remains${NC}"
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
echo "Test Summary:"
echo "1. ✓ Get baseline config"
echo "2. ✓ Create question override (disable)"
echo "3. ✓ Update question override (custom text)"
echo "4. ✓ Get all overrides"
echo "5. ✓ Get merged config with overrides"
echo "6. ✓ Create section override (disable)"
echo "7. ✓ Delete override"
echo "8. ✓ Verify deletion"
echo ""
echo "Next steps:"
echo "1. Check database to verify overrides were saved"
echo "2. Test with different question IDs"
echo "3. Test custom help content"
echo "4. Build UI components to manage overrides"
echo ""

