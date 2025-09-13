import { executeQuery, executeQuerySingle } from './postgres';
import { v4 as uuidv4 } from 'uuid';

// Simplified PostgreSQL-only Data Access Layer
export interface User {
  id: string;
  email: string;
  hashed_password?: string;
  role: string;
  created_at: string;
}

export interface Profile {
  user_id: string;
  first_name: string;
  last_name: string;
  display_name: string;
  two_factor_enabled: boolean;
  totp_secret?: string;
  created_at: string;
}

export interface Association {
  id: string;
  name: string;
  description?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at: string;
}

export interface AssociationMember {
  id: string;
  association_id: string;
  profile_id: string;
  role: string;
  created_at: string;
  association_name?: string; // For joined queries
}

export interface Convention {
  id: string;
  association_id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
}

export interface ConventionMember {
  id: string;
  convention_id: string;
  profile_id: string;
  role: string;
  created_at: string;
}

export interface EquipmentSet {
  id: string;
  association_id: string;
  name: string;
  description?: string;
  items: Record<string, unknown>;
  created_at: string;
}

export interface EquipmentItem {
  id: string;
  association_id: string;
  name: string;
  description?: string;
  category?: string;
  condition?: string;
  location?: string;
  quantity: number;
  created_at: string;
}

export interface Invitation {
  id: string;
  association_id: string;
  email: string;
  role: string;
  status: 'pending' | 'accepted' | 'expired';
  expires_at: string;
  created_at: string;
}

export interface SystemSetting {
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
}

export class PostgreSQLDataAccess {
  // User operations
  async createUser(userData: Omit<User, 'id' | 'created_at'>): Promise<User> {
    const result = await executeQuerySingle<User>(
      `INSERT INTO users (email, hashed_password, role, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *`,
      [userData.email, userData.hashed_password, userData.role]
    );
    if (!result) {
      throw new Error('Failed to create user');
    }
    return result;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return await executeQuerySingle<User>(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );
  }

  async getUserById(id: string): Promise<User | null> {
    return await executeQuerySingle<User>(`SELECT * FROM users WHERE id = $1`, [
      id,
    ]);
  }

  // Profile operations
  async createProfile(
    profileData: Omit<Profile, 'created_at'>
  ): Promise<Profile> {
    const result = await executeQuerySingle<Profile>(
      `INSERT INTO profiles (user_id, first_name, last_name, display_name, two_factor_enabled, totp_secret, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
      [
        profileData.user_id,
        profileData.first_name,
        profileData.last_name,
        profileData.display_name,
        profileData.two_factor_enabled,
        profileData.totp_secret || null,
      ]
    );
    if (!result) {
      throw new Error('Failed to create profile');
    }
    return result;
  }

  async getProfileByUserId(userId: string): Promise<Profile | null> {
    return await executeQuerySingle<Profile>(
      `SELECT * FROM profiles WHERE user_id = $1`,
      [userId]
    );
  }

  // Association operations
  async createAssociation(
    associationData: Omit<Association, 'id' | 'created_at'>
  ): Promise<Association> {
    const result = await executeQuerySingle<Association>(
      `INSERT INTO associations (name, description, website, email, phone, address, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
      [
        associationData.name,
        associationData.description || null,
        associationData.website || null,
        associationData.email || null,
        associationData.phone || null,
        associationData.address || null,
      ]
    );
    if (!result) {
      throw new Error('Failed to create association');
    }
    return result;
  }

  async getAssociationById(id: string): Promise<Association | null> {
    return await executeQuerySingle<Association>(
      `SELECT * FROM associations WHERE id = $1`,
      [id]
    );
  }

  async getAllAssociations(): Promise<Association[]> {
    return await executeQuery<Association>(
      `SELECT * FROM associations ORDER BY created_at DESC`
    );
  }

  // Association Member operations
  async createAssociationMember(
    memberData: Omit<AssociationMember, 'id' | 'created_at'>
  ): Promise<AssociationMember> {
    const result = await executeQuerySingle<AssociationMember>(
      `INSERT INTO association_members (association_id, profile_id, role, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *`,
      [memberData.association_id, memberData.profile_id, memberData.role]
    );
    if (!result) {
      throw new Error('Failed to create association member');
    }
    return result;
  }

  async getAssociationMembersByProfileId(
    profileId: string
  ): Promise<(AssociationMember & { association_name?: string })[]> {
    return await executeQuery<
      AssociationMember & { association_name?: string }
    >(
      `SELECT am.*, a.name as association_name FROM association_members am LEFT JOIN associations a ON am.association_id = a.id WHERE am.profile_id = $1 ORDER BY am.created_at DESC`,
      [profileId]
    );
  }

  // Convention operations
  async createConvention(
    conventionData: Omit<Convention, 'id' | 'created_at'>
  ): Promise<Convention> {
    const result = await executeQuerySingle<Convention>(
      `INSERT INTO conventions (association_id, name, description, start_date, end_date, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
      [
        conventionData.association_id,
        conventionData.name,
        conventionData.description || null,
        conventionData.start_date,
        conventionData.end_date,
        conventionData.status,
      ]
    );
    if (!result) {
      throw new Error('Failed to create convention');
    }
    return result;
  }

  async getConventionsByAssociation(
    associationId: string
  ): Promise<Convention[]> {
    return await executeQuery<Convention>(
      `SELECT * FROM conventions WHERE association_id = $1 ORDER BY created_at DESC`,
      [associationId]
    );
  }

  // Convention Member operations
  async createConventionMember(
    memberData: Omit<ConventionMember, 'id' | 'created_at'>
  ): Promise<ConventionMember> {
    const result = await executeQuerySingle<ConventionMember>(
      `INSERT INTO convention_members (convention_id, profile_id, role, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *`,
      [memberData.convention_id, memberData.profile_id, memberData.role]
    );
    if (!result) {
      throw new Error('Failed to create convention member');
    }
    return result;
  }

  // Equipment operations
  async createEquipmentSet(
    equipmentData: Omit<EquipmentSet, 'id' | 'created_at'>
  ): Promise<EquipmentSet> {
    const result = await executeQuerySingle<EquipmentSet>(
      `INSERT INTO equipment_sets (association_id, name, description, items, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
      [
        equipmentData.association_id,
        equipmentData.name,
        equipmentData.description || null,
        JSON.stringify(equipmentData.items),
      ]
    );
    if (!result) {
      throw new Error('Failed to create equipment set');
    }
    return result;
  }

  async getEquipmentSetsByAssociation(
    associationId: string
  ): Promise<EquipmentSet[]> {
    const results = await executeQuery<EquipmentSet & { items: string }>(
      `SELECT * FROM equipment_sets WHERE association_id = $1 ORDER BY created_at DESC`,
      [associationId]
    );
    return results.map(item => ({
      ...item,
      items: JSON.parse(item.items as string),
    }));
  }

  // System settings operations
  async getSystemSetting(key: string): Promise<string | null> {
    const result = await executeQuerySingle<{ value: string }>(
      `SELECT value FROM system_settings WHERE key = $1`,
      [key]
    );
    return result?.value || null;
  }

  async setSystemSetting(key: string, value: string): Promise<void> {
    await executeQuery(
      `INSERT INTO system_settings (key, value, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
      [key, value]
    );
  }

  // Health check
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    latency?: number;
  }> {
    const startTime = Date.now();
    try {
      await executeQuerySingle('SELECT 1');
      const latency = Date.now() - startTime;
      return { status: 'healthy', latency };
    } catch (error) {
      console.error('Health check failed:', error);
      return { status: 'unhealthy' };
    }
  }
}

// Singleton instance
let dataAccess: PostgreSQLDataAccess | null = null;

export function getDataAccess(): PostgreSQLDataAccess {
  if (!dataAccess) {
    dataAccess = new PostgreSQLDataAccess();
  }
  return dataAccess;
}

export default PostgreSQLDataAccess;
