import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, Shield, Trash2, AlertTriangle } from 'lucide-react';
import { AssociationMember } from '@/hooks/useAssociationMembers';
import { UserRoleType } from '@/types/user';
import { useToast } from '@/hooks/use-toast';

interface BulkMemberActionsProps {
  members: AssociationMember[];
  onBulkRoleChange?: (memberIds: string[], newRole: UserRoleType) => Promise<void>;
  onBulkRemove?: (memberIds: string[]) => Promise<void>;
  disabled?: boolean;
}

interface BulkActionState {
  selectedMembers: string[];
  action: 'role' | 'remove' | null;
  newRole: UserRoleType | null;
  isOpen: boolean;
  loading: boolean;
}

const BulkMemberActions: React.FC<BulkMemberActionsProps> = ({
  members,
  onBulkRoleChange,
  onBulkRemove,
  disabled = false
}) => {
  const [state, setState] = useState<BulkActionState>({
    selectedMembers: [],
    action: null,
    newRole: null,
    isOpen: false,
    loading: false
  });

  const { toast } = useToast();

  const updateState = (updates: Partial<BulkActionState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const handleMemberSelection = (memberId: string, selected: boolean) => {
    updateState({
      selectedMembers: selected
        ? [...state.selectedMembers, memberId]
        : state.selectedMembers.filter(id => id !== memberId)
    });
  };

  const handleSelectAll = () => {
    const allSelected = state.selectedMembers.length === members.length;
    updateState({
      selectedMembers: allSelected ? [] : members.map(m => m.id)
    });
  };

  const handleBulkAction = (action: 'role' | 'remove') => {
    if (state.selectedMembers.length === 0) {
      toast({
        title: 'No Members Selected',
        description: 'Please select at least one member to perform this action.',
        variant: 'destructive',
      });
      return;
    }

    updateState({ action, isOpen: true });
  };

  const handleConfirmAction = async () => {
    if (state.selectedMembers.length === 0) return;

    updateState({ loading: true });

    try {
      if (state.action === 'role' && state.newRole && onBulkRoleChange) {
        await onBulkRoleChange(state.selectedMembers, state.newRole);
        toast({
          title: 'Roles Updated',
          description: `Successfully updated ${state.selectedMembers.length} member(s) role.`,
        });
      } else if (state.action === 'remove' && onBulkRemove) {
        await onBulkRemove(state.selectedMembers);
        toast({
          title: 'Members Removed',
          description: `Successfully removed ${state.selectedMembers.length} member(s) from the association.`,
        });
      }

      updateState({
        selectedMembers: [],
        action: null,
        newRole: null,
        isOpen: false,
        loading: false
      });
    } catch (error: any) {
      console.error('Bulk action error:', error);
      toast({
        title: 'Action Failed',
        description: error.message || 'An error occurred while performing the bulk action.',
        variant: 'destructive',
      });
      updateState({ loading: false });
    }
  };

  const closeDialog = () => {
    updateState({
      action: null,
      newRole: null,
      isOpen: false,
      loading: false
    });
  };

  const getSelectedMemberNames = () => {
    return state.selectedMembers
      .map(id => members.find(m => m.id === id))
      .filter(Boolean)
      .map(member => member?.profile?.name || 'Unknown User');
  };

  const isAllSelected = state.selectedMembers.length === members.length;
  const isPartiallySelected = state.selectedMembers.length > 0 && state.selectedMembers.length < members.length;

  return (
    <>
      {/* Selection Controls */}
      <div className="space-y-4">
        {/* Select All Toggle */}
        <div className="flex items-center gap-2 p-3 border rounded-lg">
          <Checkbox
            checked={isAllSelected}
            ref={(el) => {
              if (el) el.indeterminate = isPartiallySelected;
            }}
            onCheckedChange={handleSelectAll}
            disabled={disabled}
          />
          <div className="flex-1">
            <div className="text-sm font-medium">
              Select Members ({state.selectedMembers.length} selected)
            </div>
            <div className="text-xs text-muted-foreground">
              Choose members for bulk actions
            </div>
          </div>
        </div>

        {/* Individual Member Selection */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {members.map((member) => {
            const profile = member.profile || { name: 'Unknown User', email: 'No email' };
            const isSelected = state.selectedMembers.includes(member.id);
            
            return (
              <div key={member.id} className="flex items-center gap-3 p-2 border rounded-lg">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => handleMemberSelection(member.id, checked as boolean)}
                  disabled={disabled}
                />
                <div className="flex-1">
                  <div className="text-sm font-medium">{profile.name}</div>
                  <div className="text-xs text-muted-foreground">{profile.email}</div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {member.role}
                </Badge>
              </div>
            );
          })}
        </div>

        {/* Bulk Action Buttons */}
        {state.selectedMembers.length > 0 && (
          <div className="flex gap-2 p-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('role')}
              disabled={disabled || !onBulkRoleChange}
              className="flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              Change Role ({state.selectedMembers.length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('remove')}
              disabled={disabled || !onBulkRemove}
              className="flex items-center gap-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Remove ({state.selectedMembers.length})
            </Button>
          </div>
        )}
      </div>

      {/* Bulk Action Confirmation Dialog */}
      <Dialog open={state.isOpen} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Confirm Bulk Action
            </DialogTitle>
            <DialogDescription>
              You are about to perform a bulk action on {state.selectedMembers.length} member(s).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Selected Members List */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Selected Members:</div>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {getSelectedMemberNames().map((name, index) => (
                  <div key={index} className="text-sm text-muted-foreground">
                    • {name}
                  </div>
                ))}
              </div>
            </div>

            {/* Role Change Form */}
            {state.action === 'role' && (
              <div className="space-y-2">
                <div className="text-sm font-medium">New Role</div>
                <Select value={state.newRole || ''} onValueChange={(value) => updateState({ newRole: value as UserRoleType })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Warning for Remove Action */}
            {state.action === 'remove' && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This action will remove the selected members from the association. This action cannot be undone.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={state.loading}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={state.loading || (state.action === 'role' && !state.newRole)}
              variant={state.action === 'remove' ? 'destructive' : 'default'}
            >
              {state.loading ? 'Processing...' : `Confirm ${state.action === 'role' ? 'Role Change' : 'Removal'}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BulkMemberActions;
