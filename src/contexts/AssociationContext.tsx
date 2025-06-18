// This file now re-exports from the refactored association context for backward compatibility
import {
  AssociationContext,
  AssociationProvider,
} from './association/AssociationProvider';
import { useAssociation } from './association/useAssociation';

export { AssociationContext, AssociationProvider, useAssociation };
