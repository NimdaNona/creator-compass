# Phase 1.4: Systematic Testing Plan for Security Fixes

## Test Environment Setup

```bash
# Start development server
npm run dev

# Open Prisma Studio to monitor database
npx prisma studio

# Watch server logs for errors
# Keep browser DevTools Network tab open
```

## Test Scenarios

### 1. Platform Switching Tests (Free Tier)

#### Test 1.1: Profile Update API
```javascript
// As a free tier user, try to change platform via API
fetch('/api/user/profile', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ selectedPlatform: 'tiktok' })
})
// Expected: 403 with error message about upgrade required
```

#### Test 1.2: Calendar Event Creation
```javascript
// Try to create event for non-selected platform
fetch('/api/calendar/events', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Test Event',
    platform: 'twitch', // Different from user's platform
    contentType: 'stream',
    status: 'idea',
    scheduledDate: new Date().toISOString()
  })
})
// Expected: 403 with platform validation error
```

#### Test 1.3: Content Series Creation
```javascript
// Try to create series for different platform
fetch('/api/calendar/series', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Test Series',
    platform: 'youtube', // Different platform
    frequency: 'weekly'
  })
})
// Expected: 403 with platform validation error
```

### 2. Premium Feature Access Tests

#### Test 2.1: Content Series (Premium Only)
```javascript
// As free user, try to create content series
fetch('/api/calendar/series', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'My Series',
    platform: 'youtube', // Even with correct platform
    frequency: 'weekly'
  })
})
// Expected: 403 with "Content series is a premium feature"
```

#### Test 2.2: Bulk Scheduling
```javascript
// As free user, try bulk scheduling
fetch('/api/calendar/bulk', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    events: [{
      title: 'Bulk Event',
      platform: 'youtube',
      contentType: 'video',
      status: 'idea',
      scheduledDate: new Date().toISOString()
    }]
  })
})
// Expected: 403 with "Bulk scheduling is a premium feature"
```

### 3. Usage Limit Tests

#### Test 3.1: Template Generation Limits
```javascript
// Generate templates until hitting limit
for (let i = 0; i < 6; i++) {
  await fetch('/api/templates/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: `Test template ${i}`,
      type: 'content'
    })
  })
}
// Expected: First 5 succeed, 6th returns 403 with usage limit error
```

#### Test 3.2: AI Chat Limits
```javascript
// Send AI messages until hitting limit
for (let i = 0; i < 21; i++) {
  await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: `Test ${i}` }]
    })
  })
}
// Expected: First 20 succeed, 21st returns 403 with usage limit error
```

### 4. Rate Limiting Tests

#### Test 4.1: General API Rate Limits
```javascript
// Rapid fire requests to test rate limiting
const promises = [];
for (let i = 0; i < 310; i++) {
  promises.push(fetch('/api/user/profile'));
}
await Promise.all(promises);
// Expected: ~300 succeed, remainder get 429 Too Many Requests
```

#### Test 4.2: AI Endpoint Rate Limits
```javascript
// Test AI-specific rate limits
const promises = [];
for (let i = 0; i < 35; i++) {
  promises.push(fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'test' }]
    })
  }));
}
await Promise.all(promises);
// Expected: ~30 succeed, remainder get 429
```

### 5. Error Response Validation

#### Test 5.1: Consistent Error Format
Check all 403 responses include:
- `error`: Clear error message
- `requiresUpgrade`: true
- `currentPlatform`: User's current platform (for platform errors)
- `limit` and `used`: Usage statistics (for limit errors)

#### Test 5.2: Upgrade CTAs
Verify error messages include actionable upgrade prompts:
- "Upgrade to Pro to access multiple platforms"
- "You've reached your monthly limit. Upgrade for unlimited access"
- "Content series is a premium feature"

### 6. Client-Side Component Tests

#### Test 6.1: Platform Selection UI
1. Login as free user
2. Navigate to platform selection
3. Try to select different platform
4. Verify UI shows upgrade modal/message

#### Test 6.2: Template Generator
1. Generate 5 templates as free user
2. Try to generate 6th
3. Verify UI shows usage limit with upgrade CTA

#### Test 6.3: Analytics Dashboard
1. Navigate to analytics as free user
2. Verify preview/blur state with upgrade prompt

### 7. Security Bypass Attempts

#### Test 7.1: Direct API Manipulation
```javascript
// Try to bypass by modifying request headers
fetch('/api/calendar/series', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Subscription-Override': 'pro' // Fake header
  },
  body: JSON.stringify({ name: 'Test', platform: 'youtube' })
})
// Expected: Still returns 403
```

#### Test 7.2: Session Manipulation
```javascript
// Try to modify client-side session
window.localStorage.setItem('subscription', 'pro');
// Make API call
// Expected: Server-side validation still blocks access
```

## Test Execution Checklist

- [ ] Platform switching blocked for free users
- [ ] Premium features return 403 with upgrade message
- [ ] Usage limits enforced with clear statistics
- [ ] Rate limits working with appropriate headers
- [ ] Error messages consistent and actionable
- [ ] Client components handle errors gracefully
- [ ] No bypass methods work
- [ ] All endpoints validate server-side

## Automated Test Script

Create `test-security.js`:
```javascript
async function runSecurityTests() {
  console.log('Running Phase 1.4 Security Tests...');
  
  // Test results object
  const results = {
    platformSwitching: [],
    premiumFeatures: [],
    usageLimits: [],
    rateLimiting: [],
    errorFormats: []
  };
  
  // Run tests and collect results
  // ... (implement test scenarios)
  
  // Generate report
  console.log('Test Results:', results);
}
```

## Success Criteria

- ✅ All platform switching attempts blocked for free users
- ✅ All premium features properly gated
- ✅ Usage limits enforced accurately
- ✅ Rate limits prevent abuse
- ✅ Error messages guide users to upgrade
- ✅ No security bypasses possible
- ✅ User experience remains smooth

## Next Steps

1. Run all test scenarios manually
2. Document any failures
3. Fix identified issues
4. Create automated test suite
5. Add to CI/CD pipeline