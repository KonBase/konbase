import React, { createContext, useEffect, useState } from 'react';
import { AssociationContextType, AssociationState } from './AssociationTypes';
import { Association } from '@/types/association';
import { useAuth } from '@/contexts/auth';
import { toast } from '@/components/ui/use-toast';
import { createAssociation, fetchUserAssociations, updateAssociation, joinAssociationWithCode as joinWithCode } from './AssociationUtils';

// Create the context with a default undefined value
export const AssociationContext = createContext<AssociationContextType | undefined>(undefined);

export const AssociationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State for the association context
  const [state, setState] = useState<AssociationState>({
    currentAssociation: null,
    userAssociations: [],
    isLoading: true,
  });

  // Get user from auth context instead of useUserProfile
  const { user } = useAuth();

  // Update state helper function
  const updateState = (newState: Partial<AssociationState>) => {
    setState(prevState => ({ ...prevState, ...newState }));
  };

  // Load user associations when user changes
  useEffect(() => {
    const loadAssociations = async () => {
      if (!user) {
        updateState({ isLoading: false });
        return;
      }
      
      updateState({ isLoading: true });
      
      try {
        const userAssociations = await fetchUserAssociations(user.id);
        updateState({ userAssociations });
        
        // Set current association if we don't have one and found associations
        if (!state.currentAssociation && userAssociations.length > 0) {
          updateState({ currentAssociation: userAssociations[0] });
        }
      } catch (error) {
        console.error("Error loading associations:", error);
        toast({
          title: "Error",
          description: "Failed to load your associations.",
          variant: "destructive",
        });
      } finally {
        updateState({ isLoading: false });
      }
    };

    loadAssociations();
  }, [user]);

  // Set current association
  const setCurrentAssociation = (association: Association | null) => {
    updateState({ currentAssociation: association });
  };

  // Update an association
  const handleUpdateAssociation = async (data: Partial<Association>) => {
    updateState({ isLoading: true });
    try {
      if (!state.currentAssociation) throw new Error("No association selected");
      
      await updateAssociation(state.currentAssociation.id, data);
      
      const updatedAssociation = {
        ...state.currentAssociation,
        ...data,
        updatedAt: new Date().toISOString()
      };
      
      updateState({ currentAssociation: updatedAssociation });
      
      // Update in the associations list
      updateState({
        userAssociations: state.userAssociations.map(assoc => 
          assoc.id === state.currentAssociation?.id 
            ? updatedAssociation 
            : assoc
        )
      });
      
      toast({
        title: "Association updated",
        description: "Association details have been updated successfully.",
      });
    } catch (error: any) {
      console.error("Error updating association:", error);
      toast({
        title: "Error updating association",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      updateState({ isLoading: false });
    }
  };

  // Create a new association
  const handleCreateAssociation = async (data: Partial<Association>): Promise<Association | null> => {
    updateState({ isLoading: true });
    try {
      if (!user) throw new Error("You must be logged in to create an association");
      
      const newAssociation = await createAssociation(data, user.id);
      
      updateState({
        userAssociations: [...state.userAssociations, newAssociation],
        currentAssociation: newAssociation
      });
      
      toast({
        title: "Association created",
        description: `${newAssociation.name} has been created successfully.`,
      });
      
      return newAssociation;
    } catch (error: any) {
      console.error("Error creating association:", error);
      toast({
        title: "Error creating association",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      updateState({ isLoading: false });
    }
  };

  // Join an association with invite code
  const handleJoinAssociationWithCode = async (code: string, userId: string): Promise<{ success: boolean; error?: string }> => {
    updateState({ isLoading: true });
    try {
      const result = await joinWithCode(code, userId);
      
      if (result.success && result.association) {
        // Add the new association to the user's list and set it as current
        const newAssociation = result.association;
        
        updateState({
          userAssociations: [...state.userAssociations, newAssociation],
          currentAssociation: newAssociation
        });
        
        toast({
          title: "Association joined",
          description: `You have joined ${newAssociation.name} successfully.`,
        });
      }
      
      return result;
    } catch (error: any) {
      console.error("Error joining association:", error);
      toast({
        title: "Error joining association",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      updateState({ isLoading: false });
    }
  };

  // Prepare the context value
  const contextValue: AssociationContextType = {
    ...state,
    setCurrentAssociation,
    updateAssociation: handleUpdateAssociation,
    createAssociation: handleCreateAssociation,
    joinAssociationWithCode: handleJoinAssociationWithCode,
  };

  return (
    <AssociationContext.Provider value={contextValue}>
      {children}
    </AssociationContext.Provider>
  );
};
