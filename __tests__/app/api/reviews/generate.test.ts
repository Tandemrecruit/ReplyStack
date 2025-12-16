import { POST } from '@/app/api/reviews/generate/route'
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateReviewResponse } from '@/lib/anthropic'

// Mock dependencies
jest.mock('@/lib/supabase/server')
jest.mock('@/lib/anthropic')

describe('POST /api/reviews/generate', () => {
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
      insert: jest.fn().mockReturnThis(),
    }

    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
  })

  it('should return 401 when user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated'),
    })

    const request = new NextRequest('http://localhost:3000/api/reviews/generate', {
      method: 'POST',
      body: JSON.stringify({ reviewId: 'review_123' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return 400 when reviewId is missing', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user_123' } },
      error: null,
    })

    const request = new NextRequest('http://localhost:3000/api/reviews/generate', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('reviewId is required')
  })

  it('should return 404 when review is not found', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user_123' } },
      error: null,
    })

    mockSupabase.single.mockResolvedValue({
      data: null,
      error: new Error('Not found'),
    })

    const request = new NextRequest('http://localhost:3000/api/reviews/generate', {
      method: 'POST',
      body: JSON.stringify({ reviewId: 'review_invalid' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Review not found')
  })

  it('should generate response successfully', async () => {
    const mockReview = {
      id: 'review_123',
      reviewer_name: 'John Doe',
      rating: 5,
      review_text: 'Great service!',
      location: {
        name: 'Test Business',
        organization: { id: 'org_123' },
        voice_profile: {
          tone: 'friendly',
          personality_notes: 'We are friendly',
          example_responses: [],
          sign_off_style: 'Best, Team',
          words_to_use: ['quality'],
          words_to_avoid: ['cheap'],
          max_length: 150,
        },
      },
    }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user_123' } },
      error: null,
    })

    mockSupabase.single.mockResolvedValueOnce({
      data: mockReview,
      error: null,
    })

    const mockGeneratedResponse = {
      response: 'Thank you for your kind words!',
      tokensUsed: 50,
    }

    ;(generateReviewResponse as jest.Mock).mockResolvedValue(mockGeneratedResponse)

    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: 'response_123',
        generated_text: 'Thank you for your kind words!',
        tokens_used: 50,
      },
      error: null,
    })

    const request = new NextRequest('http://localhost:3000/api/reviews/generate', {
      method: 'POST',
      body: JSON.stringify({ reviewId: 'review_123' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.response).toBeDefined()
    expect(generateReviewResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        reviewerName: 'John Doe',
        rating: 5,
        reviewText: 'Great service!',
      }),
      expect.objectContaining({
        tone: 'friendly',
        maxLength: 150,
      })
    )
  })

  it('should use default voice profile when not configured', async () => {
    const mockReview = {
      id: 'review_123',
      reviewer_name: 'John Doe',
      rating: 5,
      review_text: 'Great service!',
      location: {
        name: 'Test Business',
        organization: { id: 'org_123' },
        voice_profile: null,
      },
    }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user_123' } },
      error: null,
    })

    mockSupabase.single.mockResolvedValueOnce({
      data: mockReview,
      error: null,
    })

    ;(generateReviewResponse as jest.Mock).mockResolvedValue({
      response: 'Thank you!',
      tokensUsed: 30,
    })

    mockSupabase.single.mockResolvedValueOnce({
      data: { id: 'response_123' },
      error: null,
    })

    const request = new NextRequest('http://localhost:3000/api/reviews/generate', {
      method: 'POST',
      body: JSON.stringify({ reviewId: 'review_123' }),
    })

    await POST(request)

    expect(generateReviewResponse).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tone: 'friendly',
        maxLength: 150,
      })
    )
  })

  it('should return 500 when response generation fails', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user_123' } },
      error: null,
    })

    mockSupabase.single.mockResolvedValue({
      data: {
        id: 'review_123',
        reviewer_name: 'John',
        rating: 5,
        review_text: 'Great!',
        location: { name: 'Business', voice_profile: null },
      },
      error: null,
    })

    ;(generateReviewResponse as jest.Mock).mockRejectedValue(
      new Error('API Error')
    )

    const request = new NextRequest('http://localhost:3000/api/reviews/generate', {
      method: 'POST',
      body: JSON.stringify({ reviewId: 'review_123' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to generate response')
  })

  it('should return 500 when saving response fails', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user_123' } },
      error: null,
    })

    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: 'review_123',
        reviewer_name: 'John',
        rating: 5,
        review_text: 'Great!',
        location: { name: 'Business', voice_profile: null },
      },
      error: null,
    })

    ;(generateReviewResponse as jest.Mock).mockResolvedValue({
      response: 'Thank you!',
      tokensUsed: 50,
    })

    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: new Error('Database error'),
    })

    const request = new NextRequest('http://localhost:3000/api/reviews/generate', {
      method: 'POST',
      body: JSON.stringify({ reviewId: 'review_123' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to save response')
  })
})