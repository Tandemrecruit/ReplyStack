import { generateReviewResponse, type ReviewContext, type VoiceProfile } from '@/lib/anthropic'
import Anthropic from '@anthropic-ai/sdk'

// Mock the Anthropic SDK
jest.mock('@anthropic-ai/sdk')

describe('anthropic', () => {
  let mockCreate: jest.Mock

  beforeEach(() => {
    mockCreate = jest.fn()
    ;(Anthropic as jest.MockedClass<typeof Anthropic>).mockImplementation(() => ({
      messages: {
        create: mockCreate,
      },
    } as any))
  })

  describe('generateReviewResponse', () => {
    const mockReview: ReviewContext = {
      reviewerName: 'John Doe',
      rating: 5,
      reviewText: 'Excellent service! Very professional.',
      businessName: "Smith's Auto Repair",
    }

    const mockVoiceProfile: VoiceProfile = {
      tone: 'friendly',
      personalityNotes: 'We are a family-owned business',
      exampleResponses: ['Thanks for your feedback!'],
      signOffStyle: 'Best, John - Owner',
      wordsToUse: ['quality', 'family'],
      wordsToAvoid: ['cheap', 'sorry'],
      maxLength: 150,
    }

    it('should generate a review response successfully', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: 'Thank you so much for your kind words, John! We truly appreciate your business.',
          },
        ],
        usage: {
          input_tokens: 100,
          output_tokens: 50,
        },
      }

      mockCreate.mockResolvedValue(mockResponse)

      const result = await generateReviewResponse(mockReview, mockVoiceProfile)

      expect(result).toEqual({
        response: 'Thank you so much for your kind words, John! We truly appreciate your business.',
        tokensUsed: 150,
      })

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 300,
          system: expect.stringContaining('friendly'),
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: expect.stringContaining('John Doe'),
            }),
          ]),
        })
      )
    })

    it('should include voice profile tone in system prompt', async () => {
      const mockResponse = {
        content: [{ type: 'text', text: 'Response text' }],
        usage: { input_tokens: 50, output_tokens: 25 },
      }

      mockCreate.mockResolvedValue(mockResponse)

      await generateReviewResponse(mockReview, mockVoiceProfile)

      const systemPrompt = mockCreate.mock.calls[0][0].system
      expect(systemPrompt).toContain('friendly')
    })

    it('should include personality notes in system prompt', async () => {
      const mockResponse = {
        content: [{ type: 'text', text: 'Response text' }],
        usage: { input_tokens: 50, output_tokens: 25 },
      }

      mockCreate.mockResolvedValue(mockResponse)

      await generateReviewResponse(mockReview, mockVoiceProfile)

      const systemPrompt = mockCreate.mock.calls[0][0].system
      expect(systemPrompt).toContain('family-owned business')
    })

    it('should include words to use in system prompt', async () => {
      const mockResponse = {
        content: [{ type: 'text', text: 'Response text' }],
        usage: { input_tokens: 50, output_tokens: 25 },
      }

      mockCreate.mockResolvedValue(mockResponse)

      await generateReviewResponse(mockReview, mockVoiceProfile)

      const systemPrompt = mockCreate.mock.calls[0][0].system
      expect(systemPrompt).toContain('quality')
      expect(systemPrompt).toContain('family')
    })

    it('should include words to avoid in system prompt', async () => {
      const mockResponse = {
        content: [{ type: 'text', text: 'Response text' }],
        usage: { input_tokens: 50, output_tokens: 25 },
      }

      mockCreate.mockResolvedValue(mockResponse)

      await generateReviewResponse(mockReview, mockVoiceProfile)

      const systemPrompt = mockCreate.mock.calls[0][0].system
      expect(systemPrompt).toContain('Avoid using these words/phrases: cheap, sorry')
    })

    it('should include max length constraint in system prompt', async () => {
      const mockResponse = {
        content: [{ type: 'text', text: 'Response text' }],
        usage: { input_tokens: 50, output_tokens: 25 },
      }

      mockCreate.mockResolvedValue(mockResponse)

      await generateReviewResponse(mockReview, mockVoiceProfile)

      const systemPrompt = mockCreate.mock.calls[0][0].system
      expect(systemPrompt).toContain('150 words')
    })

    it('should handle positive reviews (4-5 stars)', async () => {
      const mockResponse = {
        content: [{ type: 'text', text: 'Thank you!' }],
        usage: { input_tokens: 50, output_tokens: 25 },
      }

      mockCreate.mockResolvedValue(mockResponse)

      await generateReviewResponse(mockReview, mockVoiceProfile)

      const userPrompt = mockCreate.mock.calls[0][0].messages[0].content
      expect(userPrompt).toContain('positive')
      expect(userPrompt).toContain('5-star')
    })

    it('should handle neutral reviews (3 stars)', async () => {
      const neutralReview = { ...mockReview, rating: 3 }
      const mockResponse = {
        content: [{ type: 'text', text: 'Thank you for your feedback!' }],
        usage: { input_tokens: 50, output_tokens: 25 },
      }

      mockCreate.mockResolvedValue(mockResponse)

      await generateReviewResponse(neutralReview, mockVoiceProfile)

      const userPrompt = mockCreate.mock.calls[0][0].messages[0].content
      expect(userPrompt).toContain('neutral')
      expect(userPrompt).toContain('3-star')
    })

    it('should handle negative reviews (1-2 stars)', async () => {
      const negativeReview = { ...mockReview, rating: 2 }
      const mockResponse = {
        content: [{ type: 'text', text: 'We apologize for your experience.' }],
        usage: { input_tokens: 50, output_tokens: 25 },
      }

      mockCreate.mockResolvedValue(mockResponse)

      await generateReviewResponse(negativeReview, mockVoiceProfile)

      const userPrompt = mockCreate.mock.calls[0][0].messages[0].content
      expect(userPrompt).toContain('negative')
      expect(userPrompt).toContain('2-star')
    })

    it('should include sign-off style in user prompt', async () => {
      const mockResponse = {
        content: [{ type: 'text', text: 'Response' }],
        usage: { input_tokens: 50, output_tokens: 25 },
      }

      mockCreate.mockResolvedValue(mockResponse)

      await generateReviewResponse(mockReview, mockVoiceProfile)

      const userPrompt = mockCreate.mock.calls[0][0].messages[0].content
      expect(userPrompt).toContain('Best, John - Owner')
    })

    it('should handle minimal voice profile', async () => {
      const minimalProfile: VoiceProfile = {
        tone: 'professional',
        maxLength: 100,
      }

      const mockResponse = {
        content: [{ type: 'text', text: 'Professional response' }],
        usage: { input_tokens: 50, output_tokens: 25 },
      }

      mockCreate.mockResolvedValue(mockResponse)

      const result = await generateReviewResponse(mockReview, minimalProfile)

      expect(result.response).toBe('Professional response')
      expect(mockCreate).toHaveBeenCalled()
    })

    it('should handle non-text content type', async () => {
      const mockResponse = {
        content: [{ type: 'image', data: 'base64data' }],
        usage: { input_tokens: 50, output_tokens: 25 },
      }

      mockCreate.mockResolvedValue(mockResponse)

      const result = await generateReviewResponse(mockReview, mockVoiceProfile)

      expect(result.response).toBe('')
      expect(result.tokensUsed).toBe(75)
    })

    it('should throw error when API call fails', async () => {
      mockCreate.mockRejectedValue(new Error('API Error'))

      await expect(
        generateReviewResponse(mockReview, mockVoiceProfile)
      ).rejects.toThrow('API Error')
    })

    it('should include example responses in system prompt', async () => {
      const mockResponse = {
        content: [{ type: 'text', text: 'Response' }],
        usage: { input_tokens: 50, output_tokens: 25 },
      }

      mockCreate.mockResolvedValue(mockResponse)

      await generateReviewResponse(mockReview, mockVoiceProfile)

      const systemPrompt = mockCreate.mock.calls[0][0].system
      expect(systemPrompt).toContain('Thanks for your feedback!')
    })

    it('should handle empty review text', async () => {
      const reviewWithoutText = { ...mockReview, reviewText: '' }
      const mockResponse = {
        content: [{ type: 'text', text: 'Thank you!' }],
        usage: { input_tokens: 50, output_tokens: 25 },
      }

      mockCreate.mockResolvedValue(mockResponse)

      await expect(
        generateReviewResponse(reviewWithoutText, mockVoiceProfile)
      ).resolves.toBeDefined()
    })
  })
})