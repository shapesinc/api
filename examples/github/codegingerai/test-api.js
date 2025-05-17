import OpenAI from 'openai';
import dotenv from 'dotenv';
import https from 'https';
import fetch from 'node-fetch';

dotenv.config();

// Test direct fetch first
async function testDirectFetch() {
  try {
    console.log('\nTesting direct fetch connection...');
    const response = await fetch(`${process.env.SHAPES_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SHAPES_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'shapesinc/codegingerai',
        messages: [{ role: 'user', content: 'Hello' }]
      })
    });
    
    console.log('Fetch Status:', response.status);
    console.log('Fetch Headers:', response.headers);
    const data = await response.json();
    console.log('Fetch Response:', data);
  } catch (error) {
    console.error('Fetch Error:', error.message);
  }
}

// Test OpenAI client with custom agent
async function testOpenAIClient() {
  try {
    console.log('\nTesting OpenAI client with custom agent...');
    const agent = new https.Agent({
      keepAlive: true,
      timeout: 30000,
      rejectUnauthorized: true,
      family: 4 // Force IPv4
    });

    const client = new OpenAI({
      apiKey: process.env.SHAPES_API_KEY,
      baseURL: process.env.SHAPES_BASE_URL,
      maxRetries: 3,
      timeout: 30000,
      httpAgent: agent,
      fetch: fetch
    });

    console.log('API Key present:', !!process.env.SHAPES_API_KEY);
    console.log('API Key length:', process.env.SHAPES_API_KEY?.length);
    console.log('Base URL:', process.env.SHAPES_BASE_URL);

    const response = await client.chat.completions.create({
      model: 'shapesinc/codegingerai',
      messages: [
        {
          role: 'user',
          content: 'Hello, this is a test message.'
        }
      ],
      temperature: 0.7,
      max_tokens: 100
    });

    console.log('Success! Response:', response.choices[0].message.content);
  } catch (error) {
    console.error('OpenAI Client Error:', {
      message: error.message,
      type: error.type,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      stack: error.stack
    });
  }
}

// Test DNS resolution
async function testDNSResolution() {
  try {
    console.log('\nTesting DNS resolution...');
    const dns = require('dns').promises;
    const url = new URL(process.env.SHAPES_BASE_URL);
    const hostname = url.hostname;
    
    console.log('Resolving hostname:', hostname);
    const addresses = await dns.resolve4(hostname);
    console.log('IP addresses:', addresses);
    
    // Test connection to each IP
    for (const ip of addresses) {
      try {
        console.log(`\nTesting connection to ${ip}...`);
        const response = await fetch(`https://${ip}`, {
          method: 'HEAD',
          headers: { 'Host': hostname }
        });
        console.log(`Connection to ${ip} successful, status:`, response.status);
      } catch (error) {
        console.error(`Connection to ${ip} failed:`, error.message);
      }
    }
  } catch (error) {
    console.error('DNS Resolution Error:', error.message);
  }
}

async function runTests() {
  console.log('Starting API connection tests...');
  
  // First test DNS resolution
  await testDNSResolution();
  
  // Then test direct fetch
  await testDirectFetch();
  
  // Finally test OpenAI client
  await testOpenAIClient();
}

runTests(); 