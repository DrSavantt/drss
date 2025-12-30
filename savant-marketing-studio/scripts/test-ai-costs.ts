/**
 * Test script for AI cost tracking
 * Run with: npx ts-node scripts/test-ai-costs.ts
 */

import { calculateCost, formatCost, getModelLabel, AI_PRICING } from '../lib/ai/pricing'

console.log('🧪 Testing AI Cost Tracking\n')

// Test 1: Cost Calculation
console.log('1️⃣ Cost Calculation Tests')
console.log('─'.repeat(50))

const testCases = [
  {
    model: 'claude-sonnet-4-20250514',
    input: 1000,
    output: 500,
    expected: 0.0105
  },
  {
    model: 'claude-opus-4-20250514',
    input: 1000,
    output: 500,
    expected: 0.0525
  },
  {
    model: 'claude-haiku-4-20250514',
    input: 1000,
    output: 500,
    expected: 0.000875
  },
  {
    model: 'gemini-2.0-flash-exp',
    input: 1000,
    output: 500,
    expected: 0.00023
  },
]

testCases.forEach(test => {
  const cost = calculateCost(test.model, test.input, test.output)
  const label = getModelLabel(test.model)
  const match = Math.abs(cost - test.expected) < 0.0001 ? '✅' : '❌'
  
  console.log(`${match} ${label}`)
  console.log(`   Input: ${test.input} tokens, Output: ${test.output} tokens`)
  console.log(`   Expected: ${formatCost(test.expected)}, Got: ${formatCost(cost)}`)
  console.log()
})

// Test 2: Cost Formatting
console.log('\n2️⃣ Cost Formatting Tests')
console.log('─'.repeat(50))

const formatTests = [
  { cost: 0.0001, expected: '$0.0001' },
  { cost: 0.0012, expected: '$0.0012' },
  { cost: 0.05, expected: '$0.050' },
  { cost: 1.5, expected: '$1.50' },
  { cost: 125.00, expected: '$125.00' },
]

formatTests.forEach(test => {
  const formatted = formatCost(test.cost)
  const match = formatted === test.expected ? '✅' : '❌'
  console.log(`${match} ${test.cost} → ${formatted} (expected: ${test.expected})`)
})

// Test 3: Real-world Scenarios
console.log('\n3️⃣ Real-World Scenario Tests')
console.log('─'.repeat(50))

const scenarios = [
  {
    name: 'Short inline edit (Sonnet)',
    model: 'claude-sonnet-4-20250514',
    input: 150,
    output: 100,
  },
  {
    name: 'Medium content generation (Sonnet)',
    model: 'claude-sonnet-4-20250514',
    input: 500,
    output: 2000,
  },
  {
    name: 'Complex article (Opus)',
    model: 'claude-opus-4-20250514',
    input: 1000,
    output: 3000,
  },
  {
    name: 'Quick grammar fix (Haiku)',
    model: 'claude-haiku-4-20250514',
    input: 100,
    output: 80,
  },
  {
    name: 'Bulk operation (Flash)',
    model: 'gemini-2.0-flash-exp',
    input: 2000,
    output: 3000,
  },
]

scenarios.forEach(scenario => {
  const cost = calculateCost(scenario.model, scenario.input, scenario.output)
  const label = getModelLabel(scenario.model)
  
  console.log(`${scenario.name}`)
  console.log(`   Model: ${label}`)
  console.log(`   Tokens: ${scenario.input} in, ${scenario.output} out`)
  console.log(`   Cost: ${formatCost(cost)}`)
  console.log()
})

// Test 4: Pricing Table
console.log('\n4️⃣ Current Pricing Table')
console.log('─'.repeat(50))

Object.entries(AI_PRICING).forEach(([modelId, pricing]) => {
  console.log(`🤖 ${pricing.label}`)
  console.log(`   Input:  $${pricing.input}/1K tokens`)
  console.log(`   Output: $${pricing.output}/1K tokens`)
  console.log(`   Example (1K/1K): ${formatCost(calculateCost(modelId, 1000, 1000))}`)
  console.log()
})

console.log('✅ All tests complete!\n')

