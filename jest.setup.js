// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock environment variables
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key'
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id'
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret'
process.env.STRIPE_SECRET_KEY = 'sk_test_123'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'

// Mock fetch globally
global.fetch = jest.fn()

// Reset mocks after each test
afterEach(() => {
  jest.clearAllMocks()
})