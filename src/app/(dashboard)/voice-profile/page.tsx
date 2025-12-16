'use client';

import { useState } from 'react';
import { Header } from '@/components/layout';
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

const toneOptions = [
  { id: 'friendly', label: 'Friendly', description: 'Warm and approachable' },
  { id: 'professional', label: 'Professional', description: 'Business-like and polished' },
  { id: 'casual', label: 'Casual', description: 'Relaxed and conversational' },
  { id: 'formal', label: 'Formal', description: 'Traditional and respectful' },
];

/**
 * Render the Voice Profile editor for configuring how AI generates responses in your voice.
 *
 * The component provides controls for selecting response tone, adding personality notes, configuring sign-off style, specifying words to use or avoid (comma-separated), setting a maximum response length, and supplying example responses. Invoking the save action sets a loading state, simulates persistence with a 1-second delay, and logs a payload containing the current profile (tone, notes, sign-off, parsed word lists, maxLength, and non-empty example responses).
 *
 * @returns The React element containing the full voice profile UI and save behavior.
 */
export default function VoiceProfilePage() {
  const [tone, setTone] = useState('friendly');
  const [personalityNotes, setPersonalityNotes] = useState('');
  const [signOffStyle, setSignOffStyle] = useState('');
  const [wordsToUse, setWordsToUse] = useState('');
  const [wordsToAvoid, setWordsToAvoid] = useState('');
  const [maxLength, setMaxLength] = useState(150);
  const [exampleResponses, setExampleResponses] = useState(['', '', '']);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: Save to Supabase
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    console.log('Saving voice profile:', {
      tone,
      personalityNotes,
      signOffStyle,
      wordsToUse: wordsToUse.split(',').map((w) => w.trim()),
      wordsToAvoid: wordsToAvoid.split(',').map((w) => w.trim()),
      maxLength,
      exampleResponses: exampleResponses.filter((r) => r.trim()),
    });
  };

  return (
    <div>
      <Header
        title="Voice Profile"
        description="Configure how AI generates responses in your voice"
        action={{
          label: 'Save Changes',
          onClick: handleSave,
        }}
      />

      <div className="p-6 max-w-3xl">
        {/* Tone Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Response Tone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {toneOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setTone(option.id)}
                  className={`p-4 rounded-lg border-2 text-left transition-colors ${
                    tone === option.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium text-gray-900">{option.label}</p>
                  <p className="text-sm text-gray-500">{option.description}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Personality Notes */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Personality Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Describe your brand personality. For example: We're a family-owned business that values personal connections. We use humor when appropriate and always thank customers by name."
              value={personalityNotes}
              onChange={(e) => setPersonalityNotes(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Sign-off Style */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Sign-off Style</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="e.g., 'Best, John - Owner' or 'The Team at Smith's Auto'"
              value={signOffStyle}
              onChange={(e) => setSignOffStyle(e.target.value)}
              helperText="How you want to sign off each response"
            />
          </CardContent>
        </Card>

        {/* Word Lists */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Words to Use</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="quality, family, expert, trusted"
                value={wordsToUse}
                onChange={(e) => setWordsToUse(e.target.value)}
                helperText="Comma-separated list of words/phrases to include"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Words to Avoid</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="cheap, sorry, unfortunately"
                value={wordsToAvoid}
                onChange={(e) => setWordsToAvoid(e.target.value)}
                helperText="Comma-separated list of words/phrases to exclude"
              />
            </CardContent>
          </Card>
        </div>

        {/* Max Length */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Maximum Response Length</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={50}
                max={300}
                value={maxLength}
                onChange={(e) => setMaxLength(parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-gray-700 font-medium w-24">
                {maxLength} words
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Recommended: 100-150 words for most responses
            </p>
          </CardContent>
        </Card>

        {/* Example Responses */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Example Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Paste examples of responses you&apos;ve written that capture your
              voice. The AI will learn from these.
            </p>
            <div className="space-y-4">
              {exampleResponses.map((response, index) => (
                <textarea
                  key={index}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder={`Example response ${index + 1}`}
                  value={response}
                  onChange={(e) => {
                    const newResponses = [...exampleResponses];
                    newResponses[index] = e.target.value;
                    setExampleResponses(newResponses);
                  }}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Save Button (mobile) */}
        <div className="md:hidden">
          <Button
            className="w-full"
            onClick={handleSave}
            isLoading={isSaving}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}