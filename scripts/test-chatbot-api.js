// Test script to verify chatbot API endpoint
// Run this script with: node scripts/test-chatbot-api.js <chatbot-id>

const chatbotId = process.argv[2];

if (!chatbotId) {
  console.error('Please provide a chatbot ID as argument');
  console.log('Usage: node scripts/test-chatbot-api.js <chatbot-id>');
  process.exit(1);
}

const testChatbotAPI = async () => {
  try {
    console.log(`Testing chatbot API for ID: ${chatbotId}`);
    console.log('-----------------------------------');
    
    // Test the API endpoint directly
    const response = await fetch(`http://localhost:3000/api/chatbots/details/${chatbotId}`);
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (!response.ok) {
      console.error('\nAPI Error:', data.error || 'Unknown error');
      
      if (response.status === 404) {
        console.log('\nPossible issues:');
        console.log('1. Chatbot does not exist in database');
        console.log('2. Chatbot is not active (is_active = false)');
        console.log('3. Chatbot ID is incorrect');
      } else if (response.status === 401) {
        console.log('\nAuthentication required for internal chatbots');
        console.log('You need to be logged in to access this chatbot');
      }
    } else {
      console.log('\n✅ Chatbot loaded successfully!');
      console.log('Chatbot details:');
      console.log(`- Name: ${data.data.name}`);
      console.log(`- Type: ${data.data.type}`);
      console.log(`- ID: ${data.data.id}`);
    }
    
  } catch (error) {
    console.error('Failed to test API:', error.message);
    console.log('\nMake sure the development server is running on port 3000');
  }
};

testChatbotAPI();
