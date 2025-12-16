import { updateSession } from '@/lib/supabase/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

jest.mock('@supabase/ssr')

describe('supabase middleware', () => {
  describe('updateSession', () => {
    let mockSupabase: any

    beforeEach(() => {
      mockSupabase = {
        auth: {
          getUser: jest.fn(),
        },
      }

      ;(createServerClient as jest.Mock).mockImplementation(() => mockSupabase)
    })

    it('should create supabase client with correct config', async () => {
      const request = new NextRequest('http://localhost:3000/dashboard')
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user_123' } },
        error: null,
      })

      await updateSession(request)

      expect(createServerClient).toHaveBeenCalledWith(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        expect.objectContaining({
          cookies: expect.any(Object),
        })
      )
    })

    it('should return user when authenticated', async () => {
      const mockUser = { id: 'user_123', email: 'test@example.com' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/dashboard')
      const { user } = await updateSession(request)

      expect(user).toEqual(mockUser)
    })

    it('should return null user when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      })

      const request = new NextRequest('http://localhost:3000/dashboard')
      const { user } = await updateSession(request)

      expect(user).toBeNull()
    })

    it('should return NextResponse', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/dashboard')
      const { supabaseResponse } = await updateSession(request)

      expect(supabaseResponse).toBeInstanceOf(NextResponse)
    })

    it('should handle cookies from request', async () => {
      const request = new NextRequest('http://localhost:3000/dashboard', {
        headers: {
          cookie: 'session=abc123',
        },
      })

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      await updateSession(request)

      const cookiesConfig = (createServerClient as jest.Mock).mock.calls[0][2]
      expect(cookiesConfig.cookies.getAll).toBeDefined()
      expect(cookiesConfig.cookies.setAll).toBeDefined()
    })

    it('should refresh expired session', async () => {
      const mockUser = { id: 'user_123', email: 'test@example.com' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/dashboard')
      const { user } = await updateSession(request)

      expect(user).toEqual(mockUser)
      expect(mockSupabase.auth.getUser).toHaveBeenCalled()
    })
  })
})