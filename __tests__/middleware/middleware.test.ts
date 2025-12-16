import { NextRequest, NextResponse } from 'next/server'
import { middleware } from '@/middleware'
import { updateSession } from '@/lib/supabase/middleware'

// Mock the dependencies
jest.mock('@/lib/supabase/middleware')

describe('middleware', () => {
  let mockUpdateSession: jest.MockedFunction<typeof updateSession>

  beforeEach(() => {
    mockUpdateSession = updateSession as jest.MockedFunction<typeof updateSession>
  })

  describe('public routes', () => {
    it('should allow access to home page without auth', async () => {
      const request = new NextRequest(new URL('http://localhost:3000/'))
      const response = await middleware(request)

      expect(response.status).not.toBe(307) // Not a redirect
      expect(mockUpdateSession).not.toHaveBeenCalled()
    })

    it('should allow access to login page without auth', async () => {
      const request = new NextRequest(new URL('http://localhost:3000/login'))
      const response = await middleware(request)

      expect(response.status).not.toBe(307)
      expect(mockUpdateSession).not.toHaveBeenCalled()
    })

    it('should allow access to signup page without auth', async () => {
      const request = new NextRequest(new URL('http://localhost:3000/signup'))
      const response = await middleware(request)

      expect(response.status).not.toBe(307)
      expect(mockUpdateSession).not.toHaveBeenCalled()
    })

    it('should allow access to webhook routes without auth', async () => {
      const request = new NextRequest(
        new URL('http://localhost:3000/api/webhooks/stripe')
      )
      const response = await middleware(request)

      expect(response.status).not.toBe(307)
      expect(mockUpdateSession).not.toHaveBeenCalled()
    })

    it('should allow access to Next.js internal routes', async () => {
      const request = new NextRequest(
        new URL('http://localhost:3000/_next/static/chunk.js')
      )
      const response = await middleware(request)

      expect(response.status).not.toBe(307)
      expect(mockUpdateSession).not.toHaveBeenCalled()
    })

    it('should allow access to favicon', async () => {
      const request = new NextRequest(new URL('http://localhost:3000/favicon.ico'))
      const response = await middleware(request)

      expect(response.status).not.toBe(307)
      expect(mockUpdateSession).not.toHaveBeenCalled()
    })
  })

  describe('protected routes - dashboard', () => {
    it('should redirect unauthenticated user from dashboard to login', async () => {
      const mockResponse = NextResponse.next()
      mockUpdateSession.mockResolvedValue({
        supabaseResponse: mockResponse,
        user: null,
      })

      const request = new NextRequest(
        new URL('http://localhost:3000/dashboard')
      )
      const response = await middleware(request)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/login')
      expect(response.headers.get('location')).toContain('next=%2Fdashboard')
    })

    it('should allow authenticated user to access dashboard', async () => {
      const mockUser = { id: 'user_123', email: 'test@example.com' }
      const mockResponse = NextResponse.next()
      mockUpdateSession.mockResolvedValue({
        supabaseResponse: mockResponse,
        user: mockUser,
      })

      const request = new NextRequest(
        new URL('http://localhost:3000/dashboard')
      )
      const response = await middleware(request)

      expect(response).toBe(mockResponse)
      expect(mockUpdateSession).toHaveBeenCalled()
    })
  })

  describe('protected routes - reviews', () => {
    it('should redirect unauthenticated user from reviews to login', async () => {
      const mockResponse = NextResponse.next()
      mockUpdateSession.mockResolvedValue({
        supabaseResponse: mockResponse,
        user: null,
      })

      const request = new NextRequest(new URL('http://localhost:3000/reviews'))
      const response = await middleware(request)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/login')
      expect(response.headers.get('location')).toContain('next=%2Freviews')
    })

    it('should allow authenticated user to access reviews', async () => {
      const mockUser = { id: 'user_123', email: 'test@example.com' }
      const mockResponse = NextResponse.next()
      mockUpdateSession.mockResolvedValue({
        supabaseResponse: mockResponse,
        user: mockUser,
      })

      const request = new NextRequest(new URL('http://localhost:3000/reviews'))
      const response = await middleware(request)

      expect(response).toBe(mockResponse)
    })
  })

  describe('protected routes - settings', () => {
    it('should redirect unauthenticated user from settings to login', async () => {
      const mockResponse = NextResponse.next()
      mockUpdateSession.mockResolvedValue({
        supabaseResponse: mockResponse,
        user: null,
      })

      const request = new NextRequest(new URL('http://localhost:3000/settings'))
      const response = await middleware(request)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/login')
      expect(response.headers.get('location')).toContain('next=%2Fsettings')
    })
  })

  describe('protected routes - voice-profile', () => {
    it('should redirect unauthenticated user from voice-profile to login', async () => {
      const mockResponse = NextResponse.next()
      mockUpdateSession.mockResolvedValue({
        supabaseResponse: mockResponse,
        user: null,
      })

      const request = new NextRequest(
        new URL('http://localhost:3000/voice-profile')
      )
      const response = await middleware(request)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/login')
      expect(response.headers.get('location')).toContain('next=%2Fvoice-profile')
    })
  })

  describe('authenticated users accessing auth pages', () => {
    it('should redirect authenticated user from login to dashboard', async () => {
      const mockUser = { id: 'user_123', email: 'test@example.com' }
      const mockResponse = NextResponse.next()
      mockUpdateSession.mockResolvedValue({
        supabaseResponse: mockResponse,
        user: mockUser,
      })

      const request = new NextRequest(new URL('http://localhost:3000/login'))
      const response = await middleware(request)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/dashboard')
    })

    it('should redirect authenticated user from signup to dashboard', async () => {
      const mockUser = { id: 'user_123', email: 'test@example.com' }
      const mockResponse = NextResponse.next()
      mockUpdateSession.mockResolvedValue({
        supabaseResponse: mockResponse,
        user: mockUser,
      })

      const request = new NextRequest(new URL('http://localhost:3000/signup'))
      const response = await middleware(request)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/dashboard')
    })
  })
})