import {
  getOAuthUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  fetchAccounts,
  fetchLocations,
  fetchReviews,
  publishResponse,
  starRatingToNumber,
} from '@/lib/google'

describe('google', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
  })

  describe('getOAuthUrl', () => {
    it('should generate correct OAuth URL with all parameters', () => {
      const state = 'random-state-123'
      const url = getOAuthUrl(state)

      expect(url).toContain('https://accounts.google.com/o/oauth2/v2/auth')
      expect(url).toContain('client_id=test-google-client-id')
      expect(url).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fgoogle%2Fcallback')
      expect(url).toContain('response_type=code')
      expect(url).toContain('access_type=offline')
      expect(url).toContain('prompt=consent')
      expect(url).toContain(`state=${state}`)
    })

    it('should include required scopes', () => {
      const url = getOAuthUrl('test-state')

      expect(url).toContain('scope=')
      expect(url).toContain('business.manage')
      expect(url).toContain('openid')
      expect(url).toContain('email')
      expect(url).toContain('profile')
    })
  })

  describe('exchangeCodeForTokens', () => {
    it('should exchange authorization code for tokens successfully', async () => {
      const mockResponse = {
        access_token: 'access_token_123',
        refresh_token: 'refresh_token_456',
        expires_in: 3600,
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await exchangeCodeForTokens('auth_code_789')

      expect(result).toEqual({
        accessToken: 'access_token_123',
        refreshToken: 'refresh_token_456',
        expiresIn: 3600,
      })

      expect(global.fetch).toHaveBeenCalledWith(
        'https://oauth2.googleapis.com/token',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        })
      )
    })

    it('should throw error when token exchange fails', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        text: async () => 'Invalid code',
      })

      await expect(exchangeCodeForTokens('invalid_code')).rejects.toThrow(
        'Token exchange failed'
      )
    })

    it('should include correct parameters in token exchange', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: 'token',
          refresh_token: 'refresh',
          expires_in: 3600,
        }),
      })

      await exchangeCodeForTokens('code123')

      const callArgs = (global.fetch as jest.Mock).mock.calls[0]
      const body = callArgs[1].body.toString()

      expect(body).toContain('code=code123')
      expect(body).toContain('grant_type=authorization_code')
      expect(body).toContain('client_id=test-google-client-id')
      expect(body).toContain('client_secret=test-google-client-secret')
    })
  })

  describe('refreshAccessToken', () => {
    it('should refresh access token successfully', async () => {
      const mockResponse = {
        access_token: 'new_access_token_123',
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await refreshAccessToken('refresh_token_456')

      expect(result).toBe('new_access_token_123')
    })

    it('should throw error when token refresh fails', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        text: async () => 'Invalid refresh token',
      })

      await expect(refreshAccessToken('invalid_token')).rejects.toThrow(
        'Token refresh failed'
      )
    })

    it('should include correct parameters in refresh request', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ access_token: 'new_token' }),
      })

      await refreshAccessToken('refresh_token')

      const callArgs = (global.fetch as jest.Mock).mock.calls[0]
      const body = callArgs[1].body.toString()

      expect(body).toContain('refresh_token=refresh_token')
      expect(body).toContain('grant_type=refresh_token')
    })
  })

  describe('fetchAccounts', () => {
    it('should fetch accounts successfully', async () => {
      const mockAccounts = [
        {
          name: 'accounts/123',
          accountName: 'Test Business',
          type: 'PERSONAL',
        },
      ]

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ accounts: mockAccounts }),
      })

      const result = await fetchAccounts('access_token')

      expect(result).toEqual(mockAccounts)
      expect(global.fetch).toHaveBeenCalledWith(
        'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer access_token',
          },
        })
      )
    })

    it('should return empty array when no accounts', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      })

      const result = await fetchAccounts('access_token')

      expect(result).toEqual([])
    })

    it('should throw error when fetch fails', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        text: async () => 'Unauthorized',
      })

      await expect(fetchAccounts('invalid_token')).rejects.toThrow(
        'Failed to fetch accounts'
      )
    })
  })

  describe('fetchLocations', () => {
    it('should fetch locations successfully', async () => {
      const mockLocations = [
        {
          name: 'accounts/123/locations/456',
          locationName: 'Main Street Location',
          address: {
            addressLines: ['123 Main St'],
            locality: 'Springfield',
            administrativeArea: 'IL',
            postalCode: '62701',
            regionCode: 'US',
          },
        },
      ]

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ locations: mockLocations }),
      })

      const result = await fetchLocations('access_token', 'accounts/123')

      expect(result).toEqual(mockLocations)
      expect(global.fetch).toHaveBeenCalledWith(
        'https://mybusiness.googleapis.com/v4/accounts/123/locations',
        expect.any(Object)
      )
    })

    it('should return empty array when no locations', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      })

      const result = await fetchLocations('access_token', 'accounts/123')

      expect(result).toEqual([])
    })

    it('should throw error when fetch fails', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        text: async () => 'Not found',
      })

      await expect(
        fetchLocations('invalid_token', 'accounts/999')
      ).rejects.toThrow('Failed to fetch locations')
    })
  })

  describe('fetchReviews', () => {
    it('should fetch reviews successfully', async () => {
      const mockReviews = [
        {
          name: 'accounts/123/locations/456/reviews/789',
          reviewId: '789',
          reviewer: {
            displayName: 'John Doe',
            profilePhotoUrl: 'https://example.com/photo.jpg',
          },
          starRating: 'FIVE',
          comment: 'Great service!',
          createTime: '2024-01-01T00:00:00Z',
          updateTime: '2024-01-01T00:00:00Z',
        },
      ]

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          reviews: mockReviews,
          nextPageToken: 'next_token_123',
        }),
      })

      const result = await fetchReviews('access_token', 'accounts/123/locations/456')

      expect(result.reviews).toEqual(mockReviews)
      expect(result.nextPageToken).toBe('next_token_123')
    })

    it('should include pageToken when provided', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ reviews: [] }),
      })

      await fetchReviews('access_token', 'accounts/123/locations/456', 'page_token')

      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0]
      expect(callUrl).toContain('pageToken=page_token')
    })

    it('should include pageSize parameter', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ reviews: [] }),
      })

      await fetchReviews('access_token', 'accounts/123/locations/456')

      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0]
      expect(callUrl).toContain('pageSize=50')
    })

    it('should return empty array when no reviews', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      })

      const result = await fetchReviews('access_token', 'accounts/123/locations/456')

      expect(result.reviews).toEqual([])
      expect(result.nextPageToken).toBeUndefined()
    })

    it('should throw error when fetch fails', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        text: async () => 'Invalid location',
      })

      await expect(
        fetchReviews('invalid_token', 'invalid_location')
      ).rejects.toThrow('Failed to fetch reviews')
    })
  })

  describe('publishResponse', () => {
    it('should publish response successfully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
      })

      await publishResponse(
        'access_token',
        'accounts/123/locations/456/reviews/789',
        'Thank you for your review!'
      )

      expect(global.fetch).toHaveBeenCalledWith(
        'https://mybusiness.googleapis.com/v4/accounts/123/locations/456/reviews/789/reply',
        expect.objectContaining({
          method: 'PUT',
          headers: {
            Authorization: 'Bearer access_token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            comment: 'Thank you for your review!',
          }),
        })
      )
    })

    it('should throw error when publish fails', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        text: async () => 'Forbidden',
      })

      await expect(
        publishResponse('invalid_token', 'review_name', 'Response text')
      ).rejects.toThrow('Failed to publish response')
    })

    it('should handle empty response text', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
      })

      await publishResponse('access_token', 'review_name', '')

      const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
      expect(callBody.comment).toBe('')
    })
  })

  describe('starRatingToNumber', () => {
    it('should convert ONE to 1', () => {
      expect(starRatingToNumber('ONE')).toBe(1)
    })

    it('should convert TWO to 2', () => {
      expect(starRatingToNumber('TWO')).toBe(2)
    })

    it('should convert THREE to 3', () => {
      expect(starRatingToNumber('THREE')).toBe(3)
    })

    it('should convert FOUR to 4', () => {
      expect(starRatingToNumber('FOUR')).toBe(4)
    })

    it('should convert FIVE to 5', () => {
      expect(starRatingToNumber('FIVE')).toBe(5)
    })

    it('should return 0 for invalid rating', () => {
      expect(starRatingToNumber('INVALID' as any)).toBe(0)
    })
  })
})