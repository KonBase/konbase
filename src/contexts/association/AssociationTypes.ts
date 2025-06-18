import { Association } from '@/types/association';

// Context state
export interface AssociationState {
  currentAssociation: Association | null;
  userAssociations: Association[];
  isLoading: boolean;
}

// Context methods
export interface AssociationContextMethods {
  setCurrentAssociation: (association: Association | null) => void;
  updateAssociation: (data: Partial<Association>) => Promise<void>;
  createAssociation: (
    data: Partial<Association>,
  ) => Promise<Association | null>;
  joinAssociationWithCode: (
    code: string,
    userId: string,
  ) => Promise<{ success: boolean; error?: string }>;
}

// Complete context type
export type AssociationContextType = AssociationState &
  AssociationContextMethods;
