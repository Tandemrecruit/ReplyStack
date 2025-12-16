import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateReviewResponse } from '@/lib/anthropic';

/**
 * Generate an AI-written response for a review and save it as a draft.
 *
 * Accepts a JSON body containing `reviewId`, fetches the review and its
 * voice profile (falling back to a default), generates a response via the
 * AI service, and inserts the generated text into the `responses` table
 * with status `draft`.
 *
 * @param request - NextRequest whose JSON body must include `reviewId` (string)
 * @returns On success, a JSON object `{ success: true, response }` containing the saved response row. On failure, a JSON object `{ error: string }` with an appropriate HTTP status code (401, 400, 404, or 500).
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { reviewId } = body;

    if (!reviewId) {
      return NextResponse.json(
        { error: 'reviewId is required' },
        { status: 400 }
      );
    }

    // Fetch the review with location and voice profile
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select(`
        *,
        location:locations (
          *,
          organization:organizations (*),
          voice_profile:voice_profiles (*)
        )
      `)
      .eq('id', reviewId)
      .single();

    if (reviewError || !review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Get voice profile (use location's or org default)
    const voiceProfile = review.location?.voice_profile || {
      tone: 'friendly',
      personality_notes: null,
      example_responses: [],
      sign_off_style: null,
      words_to_use: [],
      words_to_avoid: [],
      max_length: 150,
    };

    // Generate response using Claude
    const { response, tokensUsed } = await generateReviewResponse(
      {
        reviewerName: review.reviewer_name || 'Customer',
        rating: review.rating || 5,
        reviewText: review.review_text || '',
        businessName: review.location?.name || 'Our Business',
      },
      {
        tone: voiceProfile.tone,
        personalityNotes: voiceProfile.personality_notes || undefined,
        exampleResponses: voiceProfile.example_responses || undefined,
        signOffStyle: voiceProfile.sign_off_style || undefined,
        wordsToUse: voiceProfile.words_to_use || undefined,
        wordsToAvoid: voiceProfile.words_to_avoid || undefined,
        maxLength: voiceProfile.max_length,
      }
    );

    // Save the generated response
    const { data: savedResponse, error: saveError } = await supabase
      .from('responses')
      .insert({
        review_id: reviewId,
        generated_text: response,
        tokens_used: tokensUsed,
        status: 'draft',
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving response:', saveError);
      return NextResponse.json(
        { error: 'Failed to save response' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      response: savedResponse,
    });
  } catch (error) {
    console.error('Error generating response:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}