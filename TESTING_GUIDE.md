# Testing Guide for ReplyStack

## Quick Start

### Installation

First, install the test dependencies:

```bash
npm install
```

This will install Jest, React Testing Library, and all necessary testing utilities.

### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (recommended for development)
npm test:watch

# Run tests with coverage report
npm test:coverage

# Run tests in CI mode
npm test:ci
```

## What Was Tested

This test suite provides comprehensive coverage for all files added in the current branch:

### Core Libraries ✅
- **src/lib/anthropic.ts** - AI response generation with Claude
- **src/lib/google.ts** - Google Business Profile API integration
- **src/lib/stripe.ts** - Stripe payment processing
- **src/lib/supabase/middleware.ts** - Database session management

### API Routes ✅
- **src/app/api/reviews/generate/route.ts** - Generate AI responses
- **src/app/api/reviews/publish/route.ts** - Publish responses to Google

### Middleware ✅
- **src/middleware.ts** - Authentication and route protection

### UI Components ✅
- **src/components/ui/button.tsx** - Button component with variants
- **src/components/ui/input.tsx** - Form input component
- **src/components/ui/card.tsx** - Card layout components
- **src/components/ui/badge.tsx** - Badge/status indicators

### Integration Tests ✅
- End-to-end workflow from review generation to publishing
- Multi-step error handling and recovery
- Edge case scenarios

## Test Structure