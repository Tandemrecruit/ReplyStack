import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { publishResponse, refreshAccessToken } from '@/lib/google';

/**
 * Publish a response to Google
 * POST /api/reviews/publish
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
    const { responseId, text } = body;

    if (!responseId) {
      return NextResponse.json(
        { error: 'responseId is required' },
        { status: 400 }
      );
    }

    // Fetch the response with review and location details
    const { data: responseData, error: responseError } = await supabase
      .from('responses')
      .select(`
        *,
        review:reviews (
          *,
          location:locations (
            *,
            organization:organizations (*)
          )
        )
      `)
      .eq('id', responseId)
      .single();

    if (responseError || !responseData) {
      return NextResponse.json(
        { error: 'Response not found' },
        { status: 404 }
      );
    }

    // Get the user's Google refresh token
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('google_refresh_token')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.google_refresh_token) {
      return NextResponse.json(
        { error: 'Google account not connected' },
        { status: 400 }
      );
    }

    // Get fresh access token
    const accessToken = await refreshAccessToken(userData.google_refresh_token);

    // Determine the final text to publish
    const finalText = text || responseData.edited_text || responseData.generated_text;

    // Build the review name for Google API
    const review = responseData.review;
    const location = review?.location;
    const reviewName = `accounts/${location?.google_account_id}/locations/${location?.google_location_id}/reviews/${review?.external_review_id}`;

    // Publish to Google
    await publishResponse(accessToken, reviewName, finalText);

    // Update the response record
    const { error: updateError } = await supabase
      .from('responses')
      .update({
        final_text: finalText,
        status: 'published',
        published_at: new Date().toISOString(),
      })
      .eq('id', responseId);

    if (updateError) {
      console.error('Error updating response:', updateError);
    }

    // Update the review status
    await supabase
      .from('reviews')
      .update({
        status: 'responded',
        has_response: true,
      })
      .eq('id', review?.id);

    return NextResponse.json({
      success: true,
      message: 'Response published to Google',
    });
  } catch (error) {
    console.error('Error publishing response:', error);

    // Update response status to failed
    // TODO: Handle this better

    return NextResponse.json(
      { error: 'Failed to publish response to Google' },
      { status: 500 }
    );
  }
}
