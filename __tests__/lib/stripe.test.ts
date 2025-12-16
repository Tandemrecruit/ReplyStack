import {
  createCheckoutSession,
  createPortalSession,
  getOrCreateCustomer,
  getSubscription,
  cancelSubscription,
  stripe,
} from '@/lib/stripe'
import Stripe from 'stripe'

// Mock Stripe
jest.mock('stripe')

describe('stripe', () => {
  let mockStripe: any

  beforeEach(() => {
    mockStripe = {
      checkout: {
        sessions: {
          create: jest.fn(),
        },
      },
      billingPortal: {
        sessions: {
          create: jest.fn(),
        },
      },
      customers: {
        list: jest.fn(),
        create: jest.fn(),
      },
      subscriptions: {
        retrieve: jest.fn(),
        update: jest.fn(),
      },
    }

    ;(Stripe as jest.MockedClass<typeof Stripe>).mockImplementation(() => mockStripe)
  })

  describe('createCheckoutSession', () => {
    it('should create checkout session with customer ID', async () => {
      const mockSession = {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/session/123',
      }

      mockStripe.checkout.sessions.create.mockResolvedValue(mockSession)

      const result = await createCheckoutSession({
        customerId: 'cus_123',
        organizationId: 'org_456',
        priceId: 'price_789',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      })

      expect(result).toEqual(mockSession)
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'subscription',
          customer: 'cus_123',
          line_items: [{ price: 'price_789', quantity: 1 }],
          subscription_data: {
            trial_period_days: 14,
            metadata: { organizationId: 'org_456' },
          },
        })
      )
    })

    it('should create checkout session with customer email', async () => {
      const mockSession = {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/session/123',
      }

      mockStripe.checkout.sessions.create.mockResolvedValue(mockSession)

      const result = await createCheckoutSession({
        customerEmail: 'test@example.com',
        organizationId: 'org_456',
        priceId: 'price_789',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      })

      expect(result).toEqual(mockSession)
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_email: 'test@example.com',
        })
      )
    })

    it('should include trial period of 14 days', async () => {
      mockStripe.checkout.sessions.create.mockResolvedValue({ id: 'cs_123' })

      await createCheckoutSession({
        customerEmail: 'test@example.com',
        organizationId: 'org_456',
        priceId: 'price_789',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      })

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          subscription_data: expect.objectContaining({
            trial_period_days: 14,
          }),
        })
      )
    })

    it('should include metadata with organization ID', async () => {
      mockStripe.checkout.sessions.create.mockResolvedValue({ id: 'cs_123' })

      await createCheckoutSession({
        customerEmail: 'test@example.com',
        organizationId: 'org_999',
        priceId: 'price_789',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      })

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: { organizationId: 'org_999' },
          subscription_data: expect.objectContaining({
            metadata: { organizationId: 'org_999' },
          }),
        })
      )
    })

    it('should throw error when session creation fails', async () => {
      mockStripe.checkout.sessions.create.mockRejectedValue(
        new Error('Stripe API error')
      )

      await expect(
        createCheckoutSession({
          customerEmail: 'test@example.com',
          organizationId: 'org_456',
          priceId: 'price_789',
          successUrl: 'https://example.com/success',
          cancelUrl: 'https://example.com/cancel',
        })
      ).rejects.toThrow('Stripe API error')
    })
  })

  describe('createPortalSession', () => {
    it('should create portal session successfully', async () => {
      const mockSession = {
        id: 'bps_test_123',
        url: 'https://billing.stripe.com/session/123',
      }

      mockStripe.billingPortal.sessions.create.mockResolvedValue(mockSession)

      const result = await createPortalSession(
        'cus_123',
        'https://example.com/return'
      )

      expect(result).toEqual(mockSession)
      expect(mockStripe.billingPortal.sessions.create).toHaveBeenCalledWith({
        customer: 'cus_123',
        return_url: 'https://example.com/return',
      })
    })

    it('should throw error when portal creation fails', async () => {
      mockStripe.billingPortal.sessions.create.mockRejectedValue(
        new Error('Invalid customer')
      )

      await expect(
        createPortalSession('invalid_cus', 'https://example.com/return')
      ).rejects.toThrow('Invalid customer')
    })
  })

  describe('getOrCreateCustomer', () => {
    it('should return existing customer if found', async () => {
      const existingCustomer = {
        id: 'cus_existing',
        email: 'test@example.com',
        name: 'Test Org',
      }

      mockStripe.customers.list.mockResolvedValue({
        data: [existingCustomer],
      })

      const result = await getOrCreateCustomer(
        'test@example.com',
        'org_123',
        'Test Org'
      )

      expect(result).toEqual(existingCustomer)
      expect(mockStripe.customers.list).toHaveBeenCalledWith({
        email: 'test@example.com',
        limit: 1,
      })
      expect(mockStripe.customers.create).not.toHaveBeenCalled()
    })

    it('should create new customer if not found', async () => {
      const newCustomer = {
        id: 'cus_new',
        email: 'new@example.com',
        name: 'New Org',
        metadata: { organizationId: 'org_456' },
      }

      mockStripe.customers.list.mockResolvedValue({ data: [] })
      mockStripe.customers.create.mockResolvedValue(newCustomer)

      const result = await getOrCreateCustomer(
        'new@example.com',
        'org_456',
        'New Org'
      )

      expect(result).toEqual(newCustomer)
      expect(mockStripe.customers.create).toHaveBeenCalledWith({
        email: 'new@example.com',
        name: 'New Org',
        metadata: { organizationId: 'org_456' },
      })
    })

    it('should throw error when customer list fails', async () => {
      mockStripe.customers.list.mockRejectedValue(new Error('API error'))

      await expect(
        getOrCreateCustomer('test@example.com', 'org_123', 'Test Org')
      ).rejects.toThrow('API error')
    })

    it('should throw error when customer creation fails', async () => {
      mockStripe.customers.list.mockResolvedValue({ data: [] })
      mockStripe.customers.create.mockRejectedValue(new Error('Creation failed'))

      await expect(
        getOrCreateCustomer('test@example.com', 'org_123', 'Test Org')
      ).rejects.toThrow('Creation failed')
    })
  })

  describe('getSubscription', () => {
    it('should retrieve subscription successfully', async () => {
      const mockSubscription = {
        id: 'sub_123',
        status: 'active',
        current_period_end: 1234567890,
      }

      mockStripe.subscriptions.retrieve.mockResolvedValue(mockSubscription)

      const result = await getSubscription('sub_123')

      expect(result).toEqual(mockSubscription)
      expect(mockStripe.subscriptions.retrieve).toHaveBeenCalledWith('sub_123')
    })

    it('should return null when subscription not found', async () => {
      mockStripe.subscriptions.retrieve.mockRejectedValue(
        new Error('No such subscription')
      )

      const result = await getSubscription('sub_invalid')

      expect(result).toBeNull()
    })

    it('should return null on any error', async () => {
      mockStripe.subscriptions.retrieve.mockRejectedValue(
        new Error('Network error')
      )

      const result = await getSubscription('sub_123')

      expect(result).toBeNull()
    })
  })

  describe('cancelSubscription', () => {
    it('should cancel subscription at period end', async () => {
      const mockSubscription = {
        id: 'sub_123',
        status: 'active',
        cancel_at_period_end: true,
      }

      mockStripe.subscriptions.update.mockResolvedValue(mockSubscription)

      const result = await cancelSubscription('sub_123')

      expect(result).toEqual(mockSubscription)
      expect(mockStripe.subscriptions.update).toHaveBeenCalledWith('sub_123', {
        cancel_at_period_end: true,
      })
    })

    it('should throw error when cancellation fails', async () => {
      mockStripe.subscriptions.update.mockRejectedValue(
        new Error('Invalid subscription')
      )

      await expect(cancelSubscription('sub_invalid')).rejects.toThrow(
        'Invalid subscription'
      )
    })
  })
})