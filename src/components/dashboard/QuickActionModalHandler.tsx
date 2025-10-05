import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import InviteMemberDialog from '@/components/association/InviteMemberDialog';

interface QuickActionModalHandlerProps {
  children: React.ReactNode;
}

export const QuickActionModalHandler: React.FC<QuickActionModalHandlerProps> = ({ children }) => {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    component: string | null;
    props: Record<string, any>;
  }>({
    isOpen: false,
    component: null,
    props: {},
  });

  useEffect(() => {
    const handleQuickActionModal = (event: CustomEvent) => {
      const { component, props = {} } = event.detail;
      setModalState({
        isOpen: true,
        component,
        props,
      });
    };

    window.addEventListener('quick-action-modal', handleQuickActionModal as EventListener);
    
    return () => {
      window.removeEventListener('quick-action-modal', handleQuickActionModal as EventListener);
    };
  }, []);

  const closeModal = () => {
    setModalState({
      isOpen: false,
      component: null,
      props: {},
    });
  };

  const renderModalComponent = () => {
    if (!modalState.component) return null;

    switch (modalState.component) {
      case 'InviteMemberDialog':
        return (
          <InviteMemberDialog
            isOpen={modalState.isOpen}
            onClose={closeModal}
            {...modalState.props}
          />
        );
      
      // Add more modal components here as needed
      default:
        console.warn(`Unknown modal component: ${modalState.component}`);
        return null;
    }
  };

  return (
    <>
      {children}
      {renderModalComponent()}
    </>
  );
};
