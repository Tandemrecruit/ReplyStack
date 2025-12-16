import React from 'react'
import { render, screen } from '@testing-library/react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

describe('Card components', () => {
  describe('Card', () => {
    it('should render card with children', () => {
      render(<Card>Card content</Card>)
      expect(screen.getByText('Card content')).toBeInTheDocument()
    })

    it('should apply default styles', () => {
      const { container } = render(<Card>Content</Card>)
      const card = container.firstChild as HTMLElement
      expect(card).toHaveClass('bg-white', 'border', 'rounded-lg')
    })

    it('should accept custom className', () => {
      const { container } = render(<Card className="custom-card">Content</Card>)
      const card = container.firstChild as HTMLElement
      expect(card).toHaveClass('custom-card')
    })

    it('should merge custom className with default classes', () => {
      const { container } = render(<Card className="custom-card">Content</Card>)
      const card = container.firstChild as HTMLElement
      expect(card).toHaveClass('custom-card', 'bg-white')
    })
  })

  describe('CardHeader', () => {
    it('should render header with children', () => {
      render(<CardHeader>Header content</CardHeader>)
      expect(screen.getByText('Header content')).toBeInTheDocument()
    })

    it('should apply default header styles', () => {
      const { container } = render(<CardHeader>Header</CardHeader>)
      const header = container.firstChild as HTMLElement
      expect(header).toHaveClass('px-6', 'py-4')
    })

    it('should accept custom className', () => {
      const { container } = render(
        <CardHeader className="custom-header">Header</CardHeader>
      )
      const header = container.firstChild as HTMLElement
      expect(header).toHaveClass('custom-header')
    })
  })

  describe('CardTitle', () => {
    it('should render title with children', () => {
      render(<CardTitle>Title text</CardTitle>)
      expect(screen.getByText('Title text')).toBeInTheDocument()
    })

    it('should apply title styles', () => {
      const { container } = render(<CardTitle>Title</CardTitle>)
      const title = container.firstChild as HTMLElement
      expect(title).toHaveClass('text-lg', 'font-semibold')
    })

    it('should accept custom className', () => {
      const { container } = render(
        <CardTitle className="custom-title">Title</CardTitle>
      )
      const title = container.firstChild as HTMLElement
      expect(title).toHaveClass('custom-title')
    })
  })

  describe('CardContent', () => {
    it('should render content with children', () => {
      render(<CardContent>Content text</CardContent>)
      expect(screen.getByText('Content text')).toBeInTheDocument()
    })

    it('should apply content styles', () => {
      const { container } = render(<CardContent>Content</CardContent>)
      const content = container.firstChild as HTMLElement
      expect(content).toHaveClass('px-6', 'pb-6')
    })

    it('should accept custom className', () => {
      const { container } = render(
        <CardContent className="custom-content">Content</CardContent>
      )
      const content = container.firstChild as HTMLElement
      expect(content).toHaveClass('custom-content')
    })
  })

  describe('Card composition', () => {
    it('should render complete card structure', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
          </CardHeader>
          <CardContent>Card content here</CardContent>
        </Card>
      )

      expect(screen.getByText('Card Title')).toBeInTheDocument()
      expect(screen.getByText('Card content here')).toBeInTheDocument()
    })

    it('should support nested structure', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
            <p>Subtitle</p>
          </CardHeader>
          <CardContent>
            <p>Paragraph 1</p>
            <p>Paragraph 2</p>
          </CardContent>
        </Card>
      )

      expect(screen.getByText('Title')).toBeInTheDocument()
      expect(screen.getByText('Subtitle')).toBeInTheDocument()
      expect(screen.getByText('Paragraph 1')).toBeInTheDocument()
      expect(screen.getByText('Paragraph 2')).toBeInTheDocument()
    })
  })
})