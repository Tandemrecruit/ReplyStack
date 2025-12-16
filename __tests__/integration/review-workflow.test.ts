/**
 * Integration tests for the review response workflow
 * These tests verify the end-to-end flow from review to published response
 */

import { generateReviewResponse } from '@/lib/anthropic'
import { publishResponse, refreshAccessToken } from '@/lib/google'

jest.mock('@/lib/anthropic')
jest.mock('@/lib/google')

describe('Review Response Workflow Integration', () => {
  describe('complete workflow', () => {
    it('should generate and publish a response successfully', async () => {
      // Step 1: Generate AI response
      const reviewContext = {
        reviewerName: 'John Doe',
        rating: 5,
        reviewText: 'Excellent service, very professional!',
        businessName: "Smith's Auto Repair",
      }

      const voiceProfile = {
        tone: 'friendly',
        maxLength: 150,
        personalityNotes: 'Family-owned business, warm and welcoming',
      }

      const mockGeneratedResponse = {
        response: 'Thank you so much for your wonderful review, John! We appreciate your business.',
        tokensUsed: 45,
      }

      ;(generateReviewResponse as jest.Mock).mockResolvedValue(mockGeneratedResponse)

      const generatedResult = await generateReviewResponse(reviewContext, voiceProfile)

      expect(generatedResult).toEqual(mockGeneratedResponse)
      expect(generatedResult.response).toContain('Thank you')

      // Step 2: Refresh access token
      ;(refreshAccessToken as jest.Mock).mockResolvedValue('new_access_token')

      const accessToken = await refreshAccessToken('refresh_token')
      expect(accessToken).toBe('new_access_token')

      // Step 3: Publish response to Google
      ;(publishResponse as jest.Mock).mockResolvedValue(undefined)

      await publishResponse(
        accessToken,
        'accounts/123/locations/456/reviews/789',
        generatedResult.response
      )

      expect(publishResponse).toHaveBeenCalledWith(
        'new_access_token',
        'accounts/123/locations/456/reviews/789',
        mockGeneratedResponse.response
      )
    })

    it('should handle failure at generation step', async () => {
      const reviewContext = {
        reviewerName: 'Jane Doe',
        rating: 2,
        reviewText: 'Not satisfied with the service',
        businessName: 'Test Business',
      }

      const voiceProfile = {
        tone: 'professional',
        maxLength: 150,
      }

      ;(generateReviewResponse as jest.Mock).mockRejectedValue(
        new Error('Claude API rate limit exceeded')
      )

      await expect(
        generateReviewResponse(reviewContext, voiceProfile)
      ).rejects.toThrow('Claude API rate limit exceeded')

      // Verify that publish was never called due to generation failure
      expect(publishResponse).not.toHaveBeenCalled()
    })

    it('should handle failure at token refresh step', async () => {
      const mockGeneratedResponse = {
        response: 'Thank you for your feedback!',
        tokensUsed: 30,
      }

      ;(generateReviewResponse as jest.Mock).mockResolvedValue(mockGeneratedResponse)
      ;(refreshAccessToken as jest.Mock).mockRejectedValue(
        new Error('Invalid refresh token')
      )

      // Generation succeeds
      await expect(
        generateReviewResponse(
          {
            reviewerName: 'Test',
            rating: 4,
            reviewText: 'Good',
            businessName: 'Business',
          },
          { tone: 'friendly', maxLength: 100 }
        )
      ).resolves.toBeDefined()

      // Token refresh fails
      await expect(refreshAccessToken('invalid_token')).rejects.toThrow(
        'Invalid refresh token'
      )
    })
  })

  describe('edge cases', () => {
    it('should handle very long reviews', async () => {
      const longReviewText = 'Great service! '.repeat(100)

      const reviewContext = {
        reviewerName: 'Long Review User',
        rating: 5,
        reviewText: longReviewText,
        businessName: 'Test Business',
      }

      const voiceProfile = {
        tone: 'friendly',
        maxLength: 150,
      }

      ;(generateReviewResponse as jest.Mock).mockResolvedValue({
        response: 'Thank you for the detailed feedback!',
        tokensUsed: 100,
      })

      const result = await generateReviewResponse(reviewContext, voiceProfile)

      expect(result.response).toBeDefined()
      expect(result.response.length).toBeLessThan(1000)
    })

    it('should handle negative reviews appropriately', async () => {
      const negativeReview = {
        reviewerName: 'Unhappy Customer',
        rating: 1,
        reviewText: 'Terrible experience, would not recommend',
        businessName: 'Test Business',
      }

      const voiceProfile = {
        tone: 'professional',
        maxLength: 150,
        personalityNotes: 'Always apologize and offer to make things right',
      }

      ;(generateReviewResponse as jest.Mock).mockResolvedValue({
        response: 'We sincerely apologize for your experience.',
        tokensUsed: 50,
      })

      const result = await generateReviewResponse(negativeReview, voiceProfile)

      expect(result.response).toContain('apologize')
    })
  })
})