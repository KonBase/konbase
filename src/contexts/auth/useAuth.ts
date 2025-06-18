'use client';

import React from 'react';
import { AuthContext } from './AuthProvider'; // Corrected import
import type { AuthContextType } from './AuthTypes'; // Corrected import

export const useAuth = (): AuthContextType => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
