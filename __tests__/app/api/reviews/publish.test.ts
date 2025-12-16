import { POST } from '@/app/api/reviews/publish/route'
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { publishResponse, refreshAccessToken } from '@/lib/google'

// Mock dependencies
jest.mock('@/lib/supabase/server')
jest.mock('@/lib/google')

describe('POST /api/reviews/publish', () => {
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      update: jest.fn().mockReturnThis(),
    }

    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
  })

  it('should return 401 when user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated'),
    })

    const request = new NextRequest('http://localhost:3000/api/reviews/publish', {
      method: 'POST',
      body: JSON.stringify({ responseId: 'response_123' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return 400 when responseId is missing', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user_123' } },
      error: null,
    })

    const request = new NextRequest('http://localhost:3000/api/reviews/publish', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('responseId is required')
  })

  it('should return 404 when response is not found', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user_123' } },
      error: null,
    })

    mockSupabase.single.mockResolvedValue({
      data: null,
      error: new Error('Not found'),
    })

    const request = new NextRequest('http://localhost:3000/api/reviews/publish', {
      method: 'POST',
      body: JSON.stringify({ responseId: 'response_invalid' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Response not found')
  })

  it('should return 400 when Google account is not connected', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user_123' } },
      error: null,
    })

    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: 'response_123',
        generated_text: 'Thank you!',
        review: {
          id: 'review_123',
          external_review_id: 'google_review_123',
          location: {
            google_account_id: 'acc_123',
            google_location_id: 'loc_123',
          },
        },
      },
      error: null,
    })

    mockSupabase.single.mockResolvedValueOnce({
      data: { google_refresh_token: null },
      error: null,
    })

    const request = new NextRequest('http://localhost:3000/api/reviews/publish', {
      method: 'POST',
      body: JSON.stringify({ responseId: 'response_123' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Google account not connected')
  })

  it('should publish response successfully with generated text', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user_123' } },
      error: null,
    })

    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: 'response_123',
        generated_text: 'Thank you for your review!',
        edited_text: null,
        review: {
          id: 'review_123',
          external_review_id: 'google_review_123',
          location: {
            google_account_id: 'acc_123',
            google_location_id: 'loc_123',
          },
        },
      },
      error: null,
    })

    mockSupabase.single.mockResolvedValueOnce({
      data: { google_refresh_token: 'refresh_token_123' },
      error: null,
    })

    ;(refreshAccessToken as jest.Mock).mockResolvedValue('access_token_456')
    ;(publishResponse as jest.Mock).mockResolvedValue(undefined)

    mockSupabase.update.mockResolvedValue({ error: null })

    const request = new NextRequest('http://localhost:3000/api/reviews/publish', {
      method: 'POST',
      body: JSON.stringify({ responseId: 'response_123' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('Response published to Google')
    expect(publishResponse).toHaveBeenCalledWith(
      'access_token_456',
      'accounts/acc_123/locations/loc_123/reviews/google_review_123',
      'Thank you for your review!'
    )
  })

  it('should publish response with edited text when provided', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user_123' } },
      error: null,
    })

    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: 'response_123',
        generated_text: 'Thank you for your review!',
        edited_text: 'Thank you so much for your wonderful review!',
        review: {
          id: 'review_123',
          external_review_id: 'google_review_123',
          location: {
            google_account_id: 'acc_123',
            google_location_id: 'loc_123',
          },
        },
      },
      error: null,
    })

    mockSupabase.single.mockResolvedValueOnce({
      data: { google_refresh_token: 'refresh_token_123' },
      error: null,
    })

    ;(refreshAccessToken as jest.Mock).mockResolvedValue('access_token_456')
    ;(publishResponse as jest.Mock).mockResolvedValue(undefined)

    mockSupabase.update.mockResolvedValue({ error: null })

    const request = new NextRequest('http://localhost:3000/api/reviews/publish', {
      method: 'POST',
      body: JSON.stringify({ responseId: 'response_123' }),
    })

    await POST(request)

    expect(publishResponse).toHaveBeenCalledWith(
      'access_token_456',
      expect.any(String),
      'Thank you so much for your wonderful review!'
    )
  })

  it('should publish response with custom text when provided in request', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user_123' } },
      error: null,
    })

    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: 'response_123',
        generated_text: 'Thank you!',
        edited_text: null,
        review: {
          id: 'review_123',
          external_review_id: 'google_review_123',
          location: {
            google_account_id: 'acc_123',
            google_location_id: 'loc_123',
          },
        },
      },
      error: null,
    })

    mockSupabase.single.mockResolvedValueOnce({
      data: { google_refresh_token: 'refresh_token_123' },
      error: null,
    })

    ;(refreshAccessToken as jest.Mock).mockResolvedValue('access_token_456')
    ;(publishResponse as jest.Mock).mockResolvedValue(undefined)

    mockSupabase.update.mockResolvedValue({ error: null })

    const request = new NextRequest('http://localhost:3000/api/reviews/publish', {
      method: 'POST',
      body: JSON.stringify({
        responseId: 'response_123',
        text: 'Custom response text',
      }),
    })

    await POST(request)

    expect(publishResponse).toHaveBeenCalledWith(
      'access_token_456',
      expect.any(String),
      'Custom response text'
    )
  })

  it('should update response status to published', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user_123' } },
      error: null,
    })

    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: 'response_123',
        generated_text: 'Thank you!',
        review: {
          id: 'review_123',
          external_review_id: 'google_review_123',
          location: {
            google_account_id: 'acc_123',
            google_location_id: 'loc_123',
          },
        },
      },
      error: null,
    })

    mockSupabase.single.mockResolvedValueOnce({
      data: { google_refresh_token: 'refresh_token_123' },
      error: null,
    })

    ;(refreshAccessToken as jest.Mock).mockResolvedValue('access_token_456')
    ;(publishResponse as jest.Mock).mockResolvedValue(undefined)

    const mockUpdateFn = jest.fn().mockResolvedValue({ error: null })
    mockSupabase.update.mockImplementation((data: any) => {
      mockUpdateFn(data)
      return { eq: jest.fn().mockResolvedValue({ error: null }) }
    })

    const request = new NextRequest('http://localhost:3000/api/reviews/publish', {
      method: 'POST',
      body: JSON.stringify({ responseId: 'response_123' }),
    })

    await POST(request)

    expect(mockUpdateFn).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'published',
        final_text: 'Thank you!',
      })
    )
  })

  it('should update review status to responded', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user_123' } },
      error: null,
    })

    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: 'response_123',
        generated_text: 'Thank you!',
        review: {
          id: 'review_123',
          external_review_id: 'google_review_123',
          location: {
            google_account_id: 'acc_123',
            google_location_id: 'loc_123',
          },
        },
      },
      error: null,
    })

    mockSupabase.single.mockResolvedValueOnce({
      data: { google_refresh_token: 'refresh_token_123' },
      error: null,
    })

    ;(refreshAccessToken as jest.Mock).mockResolvedValue('access_token_456')
    ;(publishResponse as jest.Mock).mockResolvedValue(undefined)

    const mockUpdateFn = jest.fn()
    mockSupabase.update.mockImplementation((data: any) => {
      mockUpdateFn(data)
      return { eq: jest.fn().mockResolvedValue({ error: null }) }
    })

    const request = new NextRequest('http://localhost:3000/api/reviews/publish', {
      method: 'POST',
      body: JSON.stringify({ responseId: 'response_123' }),
    })

    await POST(request)

    expect(mockUpdateFn).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'responded',
        has_response: true,
      })
    )
  })

  it('should return 500 when Google API call fails', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user_123' } },
      error: null,
    })

    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: 'response_123',
        generated_text: 'Thank you!',
        review: {
          id: 'review_123',
          external_review_id: 'google_review_123',
          location: {
            google_account_id: 'acc_123',
            google_location_id: 'loc_123',
          },
        },
      },
      error: null,
    })

    mockSupabase.single.mockResolvedValueOnce({
      data: { google_refresh_token: 'refresh_token_123' },
      error: null,
    })

    ;(refreshAccessToken as jest.Mock).mockResolvedValue('access_token_456')
    ;(publishResponse as jest.Mock).mockRejectedValue(new Error('API Error'))

    const request = new NextRequest('http://localhost:3000/api/reviews/publish', {
      method: 'POST',
      body: JSON.stringify({ responseId: 'response_123' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to publish response to Google')
  })

  it('should return 500 when token refresh fails', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user_123' } },
      error: null,
    })

    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: 'response_123',
        generated_text: 'Thank you!',
        review: {
          id: 'review_123',
          external_review_id: 'google_review_123',
          location: {
            google_account_id: 'acc_123',
            google_location_id: 'loc_123',
          },
        },
      },
      error: null,
    })

    mockSupabase.single.mockResolvedValueOnce({
      data: { google_refresh_token: 'invalid_token' },
      error: null,
    })

    ;(refreshAccessToken as jest.Mock).mockRejectedValue(
      new Error('Token refresh failed')
    )

    const request = new NextRequest('http://localhost:3000/api/reviews/publish', {
      method: 'POST',
      body: JSON.stringify({ responseId: 'response_123' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to publish response to Google')
  })
})