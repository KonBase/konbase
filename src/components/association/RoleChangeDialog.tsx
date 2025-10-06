import React from 'react';
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
import { Shield, AlertTriangle } from 'lucide-react';
import { UserRoleType, USER_ROLES } from '@/types/user';

interface RoleChangeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRoleType;
  memberName: string;
  onRoleChange: (newRole: UserRoleType) => void;
  loading?: boolean;
  canChangeToRole?: (role: UserRoleType) => boolean;
}

const RoleChangeDialog: React.FC<RoleChangeDialogProps> = ({
  isOpen,
  onClose,
  currentRole,
  memberName,
  onRoleChange,
  loading = false,
  canChangeToRole
}) => {
  const [selectedRole, setSelectedRole] = React.useState<UserRoleType>(currentRole);

  React.useEffect(() => {
    setSelectedRole(currentRole);
  }, [currentRole]);

  const handleConfirm = () => {
    if (selectedRole !== currentRole) {
      onRoleChange(selectedRole);
    } else {
      onClose();
    }
  };

  const getAvailableRoles = (): UserRoleType[] => {
    // Define role hierarchy - users can only be assigned roles at or below their current level
    const roleHierarchy: UserRoleType[] = ['guest', 'member', 'manager', 'admin', 'system_admin', 'super_admin'];
    
    // For now, allow changing to any role except super_admin
    // In a real implementation, this would depend on the current user's permissions
    return roleHierarchy.filter(role => role !== 'super_admin');
  };

  const getRoleBadgeVariant = (role: UserRoleType) => {
    switch (role) {
      case 'admin':
      case 'system_admin':
      case 'super_admin':
        return 'default';
      case 'manager':
        return 'secondary';
      case 'member':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const isRoleChangeAllowed = (role: UserRoleType) => {
    if (!canChangeToRole) return true;
    return canChangeToRole(role);
  };

  const hasRoleChanged = selectedRole !== currentRole;
  const currentRoleInfo = USER_ROLES[currentRole];
  const selectedRoleInfo = USER_ROLES[selectedRole];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Change Member Role
          </DialogTitle>
          <DialogDescription>
            Change the role for <strong>{memberName}</strong> in this association.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Role */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Current Role</div>
            <div className="flex items-center gap-2">
              <Badge variant={getRoleBadgeVariant(currentRole)}>
                {currentRoleInfo.name}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {currentRoleInfo.description}
              </span>
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <div className="text-sm font-medium">New Role</div>
            <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRoleType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableRoles().map((role) => {
                  const roleInfo = USER_ROLES[role];
                  const isAllowed = isRoleChangeAllowed(role);
                  
                  return (
                    <SelectItem 
                      key={role} 
                      value={role}
                      disabled={!isAllowed}
                    >
                      <div className="flex items-center gap-2">
                        <span>{roleInfo.name}</span>
                        {!isAllowed && (
                          <Badge variant="outline" className="text-xs">
                            Not Allowed
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Role Info */}
          {hasRoleChanged && (
            <div className="space-y-2">
              <div className="text-sm font-medium">New Role Information</div>
              <div className="p-3 rounded-lg border bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={getRoleBadgeVariant(selectedRole)}>
                    {selectedRoleInfo.name}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {selectedRoleInfo.description}
                </p>
                <div className="space-y-1">
                  <div className="text-xs font-medium">Permissions:</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedRoleInfo.permissions.slice(0, 3).map((permission) => (
                      <Badge key={permission} variant="outline" className="text-xs">
                        {permission.replace(':', ' ')}
                      </Badge>
                    ))}
                    {selectedRoleInfo.permissions.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{selectedRoleInfo.permissions.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Warning for role changes */}
          {hasRoleChanged && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Changing this member's role will affect their permissions and access to association features.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={loading || !hasRoleChanged}
          >
            {loading ? 'Updating...' : 'Update Role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RoleChangeDialog;
