import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Input } from '@/components/ui/input'

describe('Input', () => {
  describe('rendering', () => {
    it('should render input field', () => {
      render(<Input />)
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('should render with label', () => {
      render(<Input label="Email Address" />)
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument()
    })

    it('should render with placeholder', () => {
      render(<Input placeholder="Enter your email" />)
      expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument()
    })

    it('should render with helper text', () => {
      render(<Input helperText="This is a helper text" />)
      expect(screen.getByText('This is a helper text')).toBeInTheDocument()
    })

    it('should render with error message', () => {
      render(<Input error="This field is required" />)
      expect(screen.getByText('This field is required')).toBeInTheDocument()
    })
  })

  describe('types', () => {
    it('should render text input by default', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'text')
    })

    it('should render email input', () => {
      render(<Input type="email" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'email')
    })

    it('should render password input', () => {
      render(<Input type="password" />)
      const input = document.querySelector('input[type="password"]')
      expect(input).toBeInTheDocument()
    })

    it('should render number input', () => {
      render(<Input type="number" />)
      const input = screen.getByRole('spinbutton')
      expect(input).toHaveAttribute('type', 'number')
    })
  })

  describe('value and onChange', () => {
    it('should display the provided value', () => {
      render(<Input value="test value" onChange={() => {}} />)
      const input = screen.getByRole('textbox') as HTMLInputElement
      expect(input.value).toBe('test value')
    })

    it('should call onChange when value changes', () => {
      const handleChange = jest.fn()
      render(<Input onChange={handleChange} />)
      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: 'new value' } })
      expect(handleChange).toHaveBeenCalledTimes(1)
    })

    it('should update value on change', () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('')
        return <Input value={value} onChange={(e) => setValue(e.target.value)} />
      }
      render(<TestComponent />)
      const input = screen.getByRole('textbox') as HTMLInputElement
      fireEvent.change(input, { target: { value: 'updated' } })
      expect(input.value).toBe('updated')
    })
  })

  describe('disabled state', () => {
    it('should disable input when disabled prop is true', () => {
      render(<Input disabled />)
      const input = screen.getByRole('textbox')
      expect(input).toBeDisabled()
    })

    it('should apply disabled styles', () => {
      render(<Input disabled />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('disabled:opacity-50')
    })

    it('should not call onChange when disabled', () => {
      const handleChange = jest.fn()
      render(<Input disabled onChange={handleChange} />)
      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: 'test' } })
      expect(handleChange).not.toHaveBeenCalled()
    })
  })

  describe('required state', () => {
    it('should mark input as required', () => {
      render(<Input required />)
      const input = screen.getByRole('textbox')
      expect(input).toBeRequired()
    })

    it('should show asterisk in label when required', () => {
      render(<Input label="Name" required />)
      expect(screen.getByText('*')).toBeInTheDocument()
    })
  })

  describe('error state', () => {
    it('should apply error styles when error prop is provided', () => {
      render(<Input error="Error message" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('border-red-500')
    })

    it('should show error message in red', () => {
      render(<Input error="Error message" />)
      const errorText = screen.getByText('Error message')
      expect(errorText).toHaveClass('text-red-600')
    })

    it('should prioritize error over helper text', () => {
      render(<Input error="Error message" helperText="Helper text" />)
      expect(screen.getByText('Error message')).toBeInTheDocument()
      expect(screen.queryByText('Helper text')).not.toBeInTheDocument()
    })
  })

  describe('custom styling', () => {
    it('should accept and apply custom className', () => {
      render(<Input className="custom-input" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('custom-input')
    })
  })

  describe('accessibility', () => {
    it('should associate label with input via id', () => {
      render(<Input label="Email" id="email-input" />)
      const input = screen.getByLabelText('Email')
      expect(input).toHaveAttribute('id', 'email-input')
    })

    it('should generate unique id if not provided', () => {
      render(<Input label="Name" />)
      const input = screen.getByLabelText('Name')
      expect(input).toHaveAttribute('id')
    })

    it('should support aria-describedby for helper text', () => {
      render(<Input helperText="Helper text" id="test-input" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-describedby')
    })

    it('should have focus styles', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('focus:ring-2')
    })
  })
})