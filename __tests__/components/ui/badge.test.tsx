import React from 'react'
import { render, screen } from '@testing-library/react'
import { Badge } from '@/components/ui/badge'

describe('Badge', () => {
  describe('rendering', () => {
    it('should render badge with children', () => {
      render(<Badge>New</Badge>)
      expect(screen.getByText('New')).toBeInTheDocument()
    })

    it('should apply default variant (default)', () => {
      const { container } = render(<Badge>Default</Badge>)
      const badge = container.firstChild as HTMLElement
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-800')
    })
  })

  describe('variants', () => {
    it('should apply default variant styles', () => {
      const { container } = render(<Badge variant="default">Default</Badge>)
      const badge = container.firstChild as HTMLElement
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-800')
    })

    it('should apply success variant styles', () => {
      const { container } = render(<Badge variant="success">Success</Badge>)
      const badge = container.firstChild as HTMLElement
      expect(badge).toHaveClass('bg-green-100', 'text-green-800')
    })

    it('should apply warning variant styles', () => {
      const { container } = render(<Badge variant="warning">Warning</Badge>)
      const badge = container.firstChild as HTMLElement
      expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800')
    })

    it('should apply danger variant styles', () => {
      const { container } = render(<Badge variant="danger">Danger</Badge>)
      const badge = container.firstChild as HTMLElement
      expect(badge).toHaveClass('bg-red-100', 'text-red-800')
    })

    it('should apply info variant styles', () => {
      const { container } = render(<Badge variant="info">Info</Badge>)
      const badge = container.firstChild as HTMLElement
      expect(badge).toHaveClass('bg-blue-100', 'text-blue-800')
    })
  })

  describe('sizes', () => {
    it('should apply default size (md)', () => {
      const { container } = render(<Badge>Medium</Badge>)
      const badge = container.firstChild as HTMLElement
      expect(badge).toHaveClass('px-2', 'py-1', 'text-xs')
    })

    it('should apply small size styles', () => {
      const { container } = render(<Badge size="sm">Small</Badge>)
      const badge = container.firstChild as HTMLElement
      expect(badge).toHaveClass('px-1.5', 'py-0.5', 'text-xs')
    })

    it('should apply medium size styles', () => {
      const { container } = render(<Badge size="md">Medium</Badge>)
      const badge = container.firstChild as HTMLElement
      expect(badge).toHaveClass('px-2', 'py-1', 'text-xs')
    })

    it('should apply large size styles', () => {
      const { container } = render(<Badge size="lg">Large</Badge>)
      const badge = container.firstChild as HTMLElement
      expect(badge).toHaveClass('px-3', 'py-1', 'text-sm')
    })
  })

  describe('custom styling', () => {
    it('should accept custom className', () => {
      const { container } = render(<Badge className="custom-badge">Custom</Badge>)
      const badge = container.firstChild as HTMLElement
      expect(badge).toHaveClass('custom-badge')
    })

    it('should merge custom className with default classes', () => {
      const { container } = render(<Badge className="custom-badge">Custom</Badge>)
      const badge = container.firstChild as HTMLElement
      expect(badge).toHaveClass('custom-badge', 'bg-gray-100')
    })
  })

  describe('common use cases', () => {
    it('should render status badges', () => {
      const { rerender, container } = render(<Badge variant="success">Active</Badge>)
      expect(screen.getByText('Active')).toBeInTheDocument()

      rerender(<Badge variant="warning">Pending</Badge>)
      expect(screen.getByText('Pending')).toBeInTheDocument()

      rerender(<Badge variant="danger">Inactive</Badge>)
      expect(screen.getByText('Inactive')).toBeInTheDocument()
    })

    it('should render count badges', () => {
      render(<Badge variant="info">5</Badge>)
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('should support mixed content', () => {
      render(
        <Badge>
          <span>🔥</span> Hot
        </Badge>
      )
      expect(screen.getByText('Hot')).toBeInTheDocument()
    })
  })
})