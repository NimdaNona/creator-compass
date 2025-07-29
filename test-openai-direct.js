const OpenAI = require('openai');
require('dotenv').config({ path: '.env.local' });

async function testOpenAI() {
  console.log('Testing OpenAI directly...');
  console.log('API Key present:', !!process.env.OPENAI_API_KEY);
  console.log('API Key length:', process.env.OPENAI_API_KEY?.length);
  
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Say hello in 5 words or less" }
      ],
      max_tokens: 50,
    });

    console.log('\nResponse:', completion.choices[0]?.message?.content);
    console.log('\nFull response:', JSON.stringify(completion, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Error type:', error.constructor.name);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testOpenAI();