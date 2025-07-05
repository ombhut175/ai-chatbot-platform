// Test script for the unified chat API endpoint
// This tests both public and internal chatbot access

const BASE_URL = 'http://localhost:3000';

// Test public chatbot
async function testPublicChat() {
  console.log('\n🧪 Testing Public Chatbot Access...\n');
  
  try {
    // First, get a public chatbot ID (you'll need to replace this with an actual ID)
    const chatbotId = 'YOUR_PUBLIC_CHATBOT_ID'; // Replace with actual public chatbot ID
    
    // Test sending a message
    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello, I need help',
        chatbotId: chatbotId,
        sessionId: null // New session
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Public chat test passed!');
      console.log('Response:', data.data.message);
      console.log('Session ID:', data.data.sessionId);
      
      // Test getting chat history
      const historyResponse = await fetch(
        `${BASE_URL}/api/chat?sessionId=${data.data.sessionId}&chatbotId=${chatbotId}`
      );
      
      const historyData = await historyResponse.json();
      if (historyResponse.ok && historyData.success) {
        console.log('✅ Chat history retrieval passed!');
        console.log('Message count:', historyData.data.length);
      }
    } else {
      console.log('❌ Public chat test failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Error testing public chat:', error);
  }
}

// Test internal chatbot (requires authentication)
async function testInternalChat() {
  console.log('\n🧪 Testing Internal Chatbot Access (without auth)...\n');
  
  try {
    const chatbotId = 'YOUR_INTERNAL_CHATBOT_ID'; // Replace with actual internal chatbot ID
    
    // This should fail without authentication
    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello from internal user',
        chatbotId: chatbotId,
        sessionId: null
      })
    });
    
    const data = await response.json();
    
    if (response.status === 401) {
      console.log('✅ Internal chat properly requires authentication!');
      console.log('Error message:', data.error);
    } else {
      console.log('❌ Internal chat should require authentication but didn\'t');
    }
  } catch (error) {
    console.error('❌ Error testing internal chat:', error);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Chat API Tests...');
  console.log('================================');
  
  await testPublicChat();
  await testInternalChat();
  
  console.log('\n================================');
  console.log('✨ Tests completed!');
  console.log('\nNote: Replace the chatbot IDs with actual IDs from your database.');
}

runTests();
