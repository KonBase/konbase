export interface Convention {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  location: string | null;
  association_id: string;
  status: 'planned' | 'active' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface ConventionFormData {
  name: string;
  description: string;
  start_date: Date;
  end_date: Date;
  location: string;
}

export interface ConventionInvitation {
  id: string;
  code: string;
  convention_id: string;
  created_by: string;
  created_at: string;
  expires_at: string | null;
  uses_remaining: number | null;
}

// Convention Equipment Interface
export interface ConventionEquipment {
  id: string;
  convention_id: string;
  item_id: string;
  quantity: number;
  location_id: string | null;
  status: 'allocated' | 'issued' | 'returned' | 'damaged';
  issued_by: string | null;
  issued_at: string | null;
  returned_by: string | null;
  returned_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Join fields
  items?: {
    id: string;
    name: string;
    barcode: string | null;
    category_id: string;
  };
  locations?: {
    id: string;
    name: string;
  };
}

export interface ConventionEquipmentFormData {
  item_id: string;
  quantity: number;
  location_id: string | null;
  notes: string | null;
}

// Convention Consumables Interface
export interface ConventionConsumable {
  id: string;
  convention_id: string;
  item_id: string;
  allocated_quantity: number;
  used_quantity: number;
  location_id: string | null;
  created_at: string;
  updated_at: string;
  // Join fields
  items?: {
    id: string;
    name: string;
    barcode: string | null;
    category_id: string;
  };
  locations?: {
    id: string;
    name: string;
  };
}

export interface ConventionConsumableFormData {
  item_id: string;
  allocated_quantity: number;
  used_quantity: number;
  location_id: string | null;
}

// Convention Locations Interface
export interface ConventionLocation {
  id: string;
  convention_id: string;
  name: string;
  description: string | null;
  type: string | null;
  building: string | null;
  floor: string | null;
  capacity: number | null;
  map_x: number | null;
  map_y: number | null;
  created_at: string;
  updated_at: string;
}

export interface ConventionLocationFormData {
  name: string;
  description: string | null;
  type: string;
  capacity: number | null;
  floor: string | null;
  building: string | null;
}

// Convention Requirements Interface
export interface ConventionRequirement {
  id: string;
  convention_id: string;
  description: string;
  status: string;
  assigned_to: string | null;
  due_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  assignee?: {
    id: string;
    email: string;
    name: string | null;
  };
  creator?: {
    id: string;
    email: string;
    name: string | null;
  };
}

export interface ConventionRequirementFormData {
  name: string;
  description: string | null;
  priority: 'high' | 'medium' | 'low';
  notes: string | null;
}

// Convention Requirement Items Interface
export interface ConventionRequirementItem {
  id: string;
  requirement_id: string;
  item_id: string | null;
  equipment_set_id: string | null;
  quantity: number;
  created_at: string;
  updated_at: string;
}

// Convention Logs Interface
export interface ConventionLog {
  id: string;
  convention_id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, any> | null;
  created_at: string;
  // Join fields
  users?: {
    id: string;
    email: string;
    name: string;
  };
}

// Convention Templates Interface
export interface ConventionTemplate {
  id: string;
  association_id: string;
  name: string;
  description: string | null;
  configuration: Record<string, any>;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  creator?: {
    email: string;
    name: string | null;
  };
}

export interface ConventionTemplateFormData {
  name: string;
  description: string | null;
  configuration: Record<string, any>;
}
