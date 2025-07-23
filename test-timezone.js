// Test script to verify timezone functionality

// Test 1: Check timezone detection
console.log('=== Test 1: Timezone Detection ===');
const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
console.log('Detected timezone:', timezone);

// Test 2: Test API with timezone
console.log('\n=== Test 2: Testing Usage API with Timezone ===');

const testUsageTracking = async () => {
  try {
    // Fetch usage data with timezone
    const getResponse = await fetch(`http://localhost:3000/api/usage?timezone=${encodeURIComponent(timezone)}`, {
      headers: {
        'Cookie': 'your-auth-cookie-here' // You'll need to add actual auth cookie
      }
    });
    
    if (getResponse.ok) {
      const data = await getResponse.json();
      console.log('Usage data:', JSON.stringify(data, null, 2));
      
      // Check if timezone is returned
      if (data.timezone) {
        console.log('✓ Timezone returned:', data.timezone);
      } else {
        console.log('✗ Timezone not returned in response');
      }
      
      // Check if daily features have isDaily flag
      if (data.usage.ideas?.isDaily) {
        console.log('✓ Daily reset flag detected for ideas feature');
      }
      
      // Display reset times
      Object.entries(data.usage).forEach(([feature, info]) => {
        if (info.resetAt) {
          const resetDate = new Date(info.resetAt);
          console.log(`${feature}: resets ${info.isDaily ? 'daily' : 'monthly'} at`, resetDate.toLocaleString(undefined, { timeZone: timezone }));
        }
      });
    } else {
      console.log('Failed to fetch usage data:', getResponse.status, getResponse.statusText);
    }
  } catch (error) {
    console.error('Error testing usage API:', error);
  }
};

// Test 3: Date calculations
console.log('\n=== Test 3: Date Calculations ===');
const now = new Date();
console.log('Current UTC time:', now.toISOString());
console.log('Current local time:', now.toLocaleString(undefined, { timeZone: timezone }));

// Calculate next midnight in user's timezone
const tomorrow = new Date(now);
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(0, 0, 0, 0);
console.log('Next midnight (local):', tomorrow.toLocaleString(undefined, { timeZone: timezone }));

// Calculate next month's start in user's timezone
const nextMonth = new Date(now);
nextMonth.setMonth(nextMonth.getMonth() + 1);
nextMonth.setDate(1);
nextMonth.setHours(0, 0, 0, 0);
console.log('Next month start (local):', nextMonth.toLocaleString(undefined, { timeZone: timezone }));

// Instructions
console.log('\n=== Instructions ===');
console.log('1. Make sure the dev server is running: npm run dev');
console.log('2. Log in to the application');
console.log('3. Copy your auth cookie from browser DevTools');
console.log('4. Replace "your-auth-cookie-here" in this script with your actual cookie');
console.log('5. Run: node test-timezone.js');