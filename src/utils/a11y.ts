/**
 * Shared keyboard helpers for custom interactive wrappers.
 */
import type React from 'react';

export const isKeyboardActivation = (event: React.KeyboardEvent<HTMLElement>) =>
  event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar';
