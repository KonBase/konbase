import { useContext } from 'react';
import { AssociationContext } from './AssociationProvider';
import { AssociationContextType } from './AssociationTypes';

/**
 * Custom hook to access the association context
 */
export const useAssociation = (): AssociationContextType => {
  const context = useContext(AssociationContext);

  if (context === undefined) {
    throw new Error(
      'useAssociation must be used within an AssociationProvider',
    );
  }

  return context;
};
