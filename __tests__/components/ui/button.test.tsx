import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  describe('rendering', () => {
    it('should render button with children', () => {
      render(<Button>Click me</Button>)
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
    })

    it('should apply default variant (primary)', () => {
      render(<Button>Default</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-blue-600')
    })

    it('should apply primary variant styles', () => {
      render(<Button variant="primary">Primary</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-blue-600', 'text-white')
    })

    it('should apply secondary variant styles', () => {
      render(<Button variant="secondary">Secondary</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-gray-100', 'text-gray-900')
    })

    it('should apply ghost variant styles', () => {
      render(<Button variant="ghost">Ghost</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-transparent', 'text-gray-700')
    })

    it('should apply danger variant styles', () => {
      render(<Button variant="danger">Danger</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-red-600', 'text-white')
    })
  })

  describe('sizes', () => {
    it('should apply default size (md)', () => {
      render(<Button>Medium</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('px-4', 'py-2')
    })

    it('should apply small size styles', () => {
      render(<Button size="sm">Small</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('px-3', 'py-1.5', 'text-sm')
    })

    it('should apply medium size styles', () => {
      render(<Button size="md">Medium</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('px-4', 'py-2', 'text-sm')
    })

    it('should apply large size styles', () => {
      render(<Button size="lg">Large</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('px-6', 'py-3', 'text-base')
    })
  })

  describe('loading state', () => {
    it('should show loading spinner when isLoading is true', () => {
      render(<Button isLoading>Loading</Button>)
      const spinner = screen.getByRole('button').querySelector('svg')
      expect(spinner).toBeInTheDocument()
      expect(spinner).toHaveClass('animate-spin')
    })

    it('should disable button when isLoading is true', () => {
      render(<Button isLoading>Loading</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('should not show loading spinner when isLoading is false', () => {
      render(<Button isLoading={false}>Not Loading</Button>)
      const button = screen.getByRole('button')
      const spinner = button.querySelector('svg')
      expect(spinner).not.toBeInTheDocument()
    })
  })

  describe('disabled state', () => {
    it('should disable button when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('should apply disabled styles', () => {
      render(<Button disabled>Disabled</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('disabled:opacity-50')
    })

    it('should not call onClick when disabled', () => {
      const handleClick = jest.fn()
      render(<Button disabled onClick={handleClick}>Disabled</Button>)
      const button = screen.getByRole('button')
      fireEvent.click(button)
      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('interactions', () => {
    it('should call onClick when clicked', () => {
      const handleClick = jest.fn()
      render(<Button onClick={handleClick}>Click me</Button>)
      const button = screen.getByRole('button')
      fireEvent.click(button)
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should not call onClick when loading', () => {
      const handleClick = jest.fn()
      render(<Button isLoading onClick={handleClick}>Loading</Button>)
      const button = screen.getByRole('button')
      fireEvent.click(button)
      expect(handleClick).not.toHaveBeenCalled()
    })

    it('should support button type attribute', () => {
      render(<Button type="submit">Submit</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'submit')
    })
  })

  describe('custom styling', () => {
    it('should accept and apply custom className', () => {
      render(<Button className="custom-class">Custom</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })

    it('should merge custom className with default classes', () => {
      render(<Button className="custom-class">Custom</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class', 'bg-blue-600')
    })
  })

  describe('accessibility', () => {
    it('should have focus styles', () => {
      render(<Button>Focusable</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('focus:outline-none', 'focus:ring-2')
    })

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLButtonElement>()
      render(<Button ref={ref}>With Ref</Button>)
      expect(ref.current).toBeInstanceOf(HTMLButtonElement)
    })

    it('should support aria attributes', () => {
      render(<Button aria-label="Custom label">Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Custom label')
    })
  })
})