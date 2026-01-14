/**
 * Template Business Logic Module
 *
 * Pure functions for template variable parsing, mapping, and validation.
 * This module contains no side effects and can be safely used in any context.
 */

// =============================================================================
// Variable Parser
// =============================================================================
export {
  // Types
  type ParsedVariable,
  type ParsedTemplateVariables,
  type VariableInfo,
  type ButtonVariableInfo,
  type TemplateVariableInfo,
  // Constants
  VARIABLE_REGEX,
  // Functions
  extractVariablesFromText,
  parseVariableId,
  parseTemplateVariables,
  getTemplateVariableInfo,
  countTemplateVariables,
} from './variable-parser'

// =============================================================================
// Variable Mapper
// =============================================================================
export {
  // Types
  type VariableMapping,
  type ResolvedVariable,
  type SystemFieldKey,
  type SystemFieldValue,
  // Constants
  SYSTEM_FIELDS,
  SYSTEM_FIELD_NAMES,
  // Functions
  isSystemField,
  getSystemFieldKey,
  autoMapVariables,
  generateAutoFillValues,
  resolveVariableValue,
  resolveAllVariables,
  canResolveAllVariables,
  getUnresolvedVariables,
} from './variable-mapper'

// =============================================================================
// Carousel Rules
// =============================================================================
export {
  // Types
  type CarouselCardComponent,
  type CarouselButton,
  type CarouselCard,
  type Carousel,
  type CarouselValidationError,
  type CarouselValidationResult,
  type CarouselHeaderFormat,
  // Constants
  CAROUSEL_RULES,
  // Functions
  isValidCarouselCardCount,
  validateCarouselCard,
  validateCarousel,
  validateCarouselWithResult,
  getRemainingCardSlots,
  canAddMoreCards,
  canRemoveCards,
  getRemainingBodyChars,
  getRemainingButtonChars,
} from './carousel-rules'
