'use client';

import { useState } from 'react';
import { Modal, Button, Input } from '@/components/ui';

export interface ResponseEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialText: string;
  onSave: (text: string) => void;
  onPublish: (text: string) => void;
  isSaving?: boolean;
  isPublishing?: boolean;
  maxLength?: number;
}

/**
 * Modal editor for composing a response with live character counting, draft saving, and publishing.
 *
 * @param isOpen - Whether the modal is visible
 * @param onClose - Callback invoked to close the modal
 * @param initialText - Initial text to populate the editor
 * @param onSave - Callback invoked with the current text when the user saves a draft
 * @param onPublish - Callback invoked with the current text when the user publishes
 * @param isSaving - Optional flag indicating a save operation is in progress (default: `false`)
 * @param isPublishing - Optional flag indicating a publish operation is in progress (default: `false`)
 * @param maxLength - Optional maximum allowed characters for the response (default: `4096`)
 * @returns The rendered ResponseEditor modal element
 */
export function ResponseEditor({
  isOpen,
  onClose,
  initialText,
  onSave,
  onPublish,
  isSaving = false,
  isPublishing = false,
  maxLength = 4096,
}: ResponseEditorProps) {
  const [text, setText] = useState(initialText);

  const handleSave = () => {
    onSave(text);
  };

  const handlePublish = () => {
    onPublish(text);
  };

  const characterCount = text.length;
  const isOverLimit = characterCount > maxLength;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Response" size="lg">
      <div className="space-y-4">
        <div>
          <label
            htmlFor="response-text"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Response
          </label>
          <textarea
            id="response-text"
            className={`
              block w-full px-3 py-2 border rounded-lg shadow-sm
              placeholder-gray-400 resize-none
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              ${isOverLimit ? 'border-red-500' : 'border-gray-300'}
            `}
            rows={6}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write your response here..."
          />
          <div className="flex justify-between mt-1">
            <p
              className={`text-sm ${
                isOverLimit ? 'text-red-500' : 'text-gray-500'
              }`}
            >
              {characterCount} / {maxLength} characters
            </p>
            {isOverLimit && (
              <p className="text-sm text-red-500">
                Response exceeds maximum length
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={handleSave}
            isLoading={isSaving}
            disabled={isOverLimit}
          >
            Save Draft
          </Button>
          <Button
            onClick={handlePublish}
            isLoading={isPublishing}
            disabled={isOverLimit || !text.trim()}
          >
            Publish to Google
          </Button>
        </div>
      </div>
    </Modal>
  );
}