import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, X, Users } from 'lucide-react';
import { AssociationMember } from '@/hooks/useAssociationMembers';
import { UserRoleType } from '@/types/user';

interface MemberSearchAndFilterProps {
  members: AssociationMember[];
  onFilteredMembersChange: (filteredMembers: AssociationMember[]) => void;
  className?: string;
}

interface FilterState {
  search: string;
  role: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const MemberSearchAndFilter: React.FC<MemberSearchAndFilterProps> = ({
  members,
  onFilteredMembersChange,
  className = ''
}) => {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    role: 'all',
    sortBy: 'name',
    sortOrder: 'asc'
  });

  const [showFilters, setShowFilters] = useState(false);

  // Apply filters and sorting
  const filteredMembers = useMemo(() => {
    let filtered = [...members];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(member => {
        const profile = member.profile;
        if (!profile) return false;
        
        return (
          profile.name.toLowerCase().includes(searchLower) ||
          profile.email.toLowerCase().includes(searchLower) ||
          member.role.toLowerCase().includes(searchLower)
        );
      });
    }

    // Role filter
    if (filters.role !== 'all') {
      filtered = filtered.filter(member => member.role === filters.role);
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: string;
      let bValue: string;

      switch (filters.sortBy) {
        case 'name':
          aValue = a.profile?.name || 'Unknown';
          bValue = b.profile?.name || 'Unknown';
          break;
        case 'email':
          aValue = a.profile?.email || '';
          bValue = b.profile?.email || '';
          break;
        case 'role':
          aValue = a.role;
          bValue = b.role;
          break;
        case 'joined':
          aValue = a.created_at;
          bValue = b.created_at;
          break;
        default:
          aValue = a.profile?.name || 'Unknown';
          bValue = b.profile?.name || 'Unknown';
      }

      const comparison = aValue.localeCompare(bValue);
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [members, filters]);

  // Update parent component when filtered results change
  React.useEffect(() => {
    onFilteredMembersChange(filteredMembers);
  }, [filteredMembers, onFilteredMembersChange]);

  const updateFilter = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      role: 'all',
      sortBy: 'name',
      sortOrder: 'asc'
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.role !== 'all') count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Filter Toggle */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members by name, email, or role..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="relative"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Filter Options</h3>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Role Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select value={filters.role} onValueChange={(value) => updateFilter('role', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="guest">Guest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="role">Role</SelectItem>
                  <SelectItem value="joined">Date Joined</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Order */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Order</label>
              <Select value={filters.sortOrder} onValueChange={(value) => updateFilter('sortOrder', value as 'asc' | 'desc')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>
            {filteredMembers.length} of {members.length} members
          </span>
        </div>
        
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2">
            <span>Active filters:</span>
            {filters.search && (
              <Badge variant="outline" className="text-xs">
                Search: "{filters.search}"
              </Badge>
            )}
            {filters.role !== 'all' && (
              <Badge variant="outline" className="text-xs">
                Role: {filters.role}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberSearchAndFilter;
