/**
 * CustomTone type definition matching the API response format.
 *
 * The API normalizes database snake_case fields (enhanced_context, created_at)
 * to camelCase (enhancedContext, createdAt) at the API boundary.
 */
export type CustomTone = {
  id: string;
  name: string;
  description: string;
  enhancedContext: string;
  createdAt: string;
};
