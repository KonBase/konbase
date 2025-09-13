import { getDataAccess as getGelDataAccess } from './gel';
import { getRedisClient } from './redis';
import { executeQuery, executeQuerySingle } from './postgres';

// Data Access Layer that abstracts database operations
// Works with PostgreSQL (SQL) and Redis (key-value)

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
  location?: string;
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

export class DataAccessLayer {
  private db: unknown;
  private dbType: 'postgresql' | 'redis';

  constructor(dbType: 'postgresql' | 'redis' = 'postgresql') {
    this.dbType = dbType;

    if (dbType === 'redis') {
      this.db = getRedisClient();
    } else {
      // For PostgreSQL, we don't need to store anything in this.db
      // since we use the direct PostgreSQL client functions
      this.db = null;
    }
  }

  private getPostgresDb() {
    // For PostgreSQL, we need to use the actual database client
    if (this.dbType === 'postgresql') {
      return {
        query: (sql: string, params: unknown[] = []) =>
          executeQuery(sql, params),
        querySingle: (sql: string, params: unknown[] = []) =>
          executeQuerySingle(sql, params),
      };
    }
    throw new Error('PostgreSQL not configured');
  }

  private getRedisDb() {
    return this.db as {
      hSet: (key: string, data: Record<string, unknown>) => Promise<number>;
      set: (key: string, value: string) => Promise<string>;
      get: (key: string) => Promise<string | null>;
      hGetAll: (key: string) => Promise<Record<string, string>>;
      keys: (pattern: string) => Promise<string[]>;
      ping: () => Promise<string>;
    };
  }

  // Generic query passthrough (PostgreSQL only)
  async executeQuery<T = unknown>(
    sql: string,
    params: unknown[] = []
  ): Promise<T[]> {
    if (this.dbType !== 'postgresql') {
      throw new Error('executeQuery is only supported for PostgreSQL');
    }
    const result = await this.getPostgresDb().query(sql, params);
    return (result as T[]) || [];
  }

  async executeQuerySingle<T = unknown>(
    sql: string,
    params: unknown[] = []
  ): Promise<T | null> {
    if (this.dbType !== 'postgresql') {
      throw new Error('executeQuerySingle is only supported for PostgreSQL');
    }
    const result = await this.getPostgresDb().querySingle(sql, params);
    return (result as T) || null;
  }

  // User operations
  async createUser(userData: Omit<User, 'id' | 'created_at'>): Promise<User> {
    if (this.dbType === 'postgresql') {
      const result = await this.getPostgresDb().querySingle(
        `
        INSERT INTO users (email, hashed_password, role, created_at)
        VALUES (<str>$1, <str>$2, <str>$3, NOW())
        RETURNING id, email, role, created_at
      `,
        [userData.email, userData.hashed_password, userData.role]
      );

      return result as User;
    } else {
      // Redis: Generate ID and store as key-value
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const user: User = {
        id: userId,
        ...userData,
        created_at: new Date().toISOString(),
      };

      await this.getRedisDb().hSet(
        `users:${userId}`,
        user as unknown as Record<string, unknown>
      );
      await this.getRedisDb().set(`users:email:${userData.email}`, userId); // Index for email lookup
      return user;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    if (this.dbType === 'postgresql') {
      const result = await this.getPostgresDb().querySingle(
        `
        SELECT * FROM users WHERE email = <str>$1
      `,
        [email]
      );

      return (result as User) || null;
    } else {
      // Redis: Use email index to find user ID, then get user data
      const userId = await this.getRedisDb().get(`users:email:${email}`);
      if (!userId) return null;

      const userData = await this.getRedisDb().hGetAll(`users:${userId}`);
      return (userData as unknown as User) || null;
    }
  }

  async getUserById(id: string): Promise<User | null> {
    if (this.dbType === 'postgresql') {
      const result = await this.getPostgresDb().querySingle(
        `
        SELECT * FROM users WHERE id = <str>$1
      `,
        [id]
      );

      return (result as User) || null;
    } else {
      // Redis: Get user by ID
      const userData = await this.getRedisDb().hGetAll(`users:${id}`);
      return (userData as unknown as User) || null;
    }
  }

  // Profile operations
  async createProfile(
    profileData: Omit<Profile, 'created_at'>
  ): Promise<Profile> {
    if (this.dbType === 'postgresql') {
      await this.getPostgresDb().query(
        `
        INSERT INTO profiles (user_id, first_name, last_name, display_name, two_factor_enabled, totp_secret, created_at)
        VALUES (<str>$1, <str>$2, <str>$3, <str>$4, <bool>$5, <str>$6, NOW())
      `,
        [
          profileData.user_id,
          profileData.first_name,
          profileData.last_name,
          profileData.display_name,
          profileData.two_factor_enabled,
          profileData.totp_secret || null,
        ]
      );
    } else {
      // Redis: Store profile data
      const profile: Profile = {
        ...profileData,
        created_at: new Date().toISOString(),
      };

      await this.getRedisDb().hSet(
        `profiles:${profileData.user_id}`,
        profile as unknown as Record<string, unknown>
      );
    }

    return profileData as Profile;
  }

  async getProfileByUserId(userId: string): Promise<Profile | null> {
    if (this.dbType === 'postgresql') {
      const result = await this.getPostgresDb().querySingle(
        `
        SELECT * FROM profiles WHERE user_id = <str>$1
      `,
        [userId]
      );

      return (result as Profile) || null;
    } else {
      // Redis: Get profile by user ID
      const profileData = await this.getRedisDb().hGetAll(`profiles:${userId}`);
      return (profileData as unknown as Profile) || null;
    }
  }

  // Association operations
  async createAssociation(
    associationData: Omit<Association, 'id' | 'created_at'>
  ): Promise<Association> {
    if (this.dbType === 'postgresql') {
      const result = await this.getPostgresDb().querySingle(
        `
        INSERT INTO associations (name, description, website, email, phone, address, created_at)
        VALUES (<str>$1, <str>$2, <str>$3, <str>$4, <str>$5, <str>$6, NOW())
        RETURNING id, name, description, website, email, phone, address, created_at
      `,
        [
          associationData.name,
          associationData.description || null,
          associationData.website || null,
          associationData.email || null,
          associationData.phone || null,
          associationData.address || null,
        ]
      );

      return result as Association;
    } else {
      // Edge Config: Generate ID and store
      const associationId = `assoc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const association: Association = {
        id: associationId,
        ...associationData,
        created_at: new Date().toISOString(),
      };

      await this.getRedisDb().set(
        `associations:${associationId}`,
        JSON.stringify(association)
      );
      return association;
    }
  }

  async getAssociationById(id: string): Promise<Association | null> {
    if (this.dbType === 'postgresql') {
      const result = await this.getPostgresDb().querySingle(
        `
        SELECT * FROM associations WHERE id = <str>$1
      `,
        [id]
      );

      return (result as Association) || null;
    } else {
      const data = await this.getRedisDb().get(`associations:${id}`);
      return data ? (JSON.parse(data) as Association) : null;
    }
  }

  async getAllAssociations(): Promise<Association[]> {
    if (this.dbType === 'postgresql') {
      const result = await this.getPostgresDb().query(
        `
        SELECT * FROM associations ORDER BY created_at DESC
      `,
        []
      );

      return (result as Association[]) || [];
    } else {
      // Redis: Get all association keys and fetch each association
      const keys = await this.getRedisDb().keys('associations:*');
      const associations = await Promise.all(
        keys.map(async (key: string) => {
          const data = await this.getRedisDb().get(key);
          return data ? (JSON.parse(data) as Association) : null;
        })
      );
      return associations.filter(
        (assoc): assoc is Association => assoc !== null
      );
    }
  }

  // Association member operations
  async createAssociationMember(
    memberData: Omit<AssociationMember, 'id' | 'created_at'>
  ): Promise<AssociationMember> {
    if (this.dbType === 'postgresql') {
      const result = await this.getPostgresDb().querySingle(
        `
        INSERT INTO association_members (association_id, profile_id, role, created_at)
        VALUES (<str>$1, <str>$2, <str>$3, NOW())
        RETURNING id, association_id, profile_id, role, created_at
      `,
        [memberData.association_id, memberData.profile_id, memberData.role]
      );

      return result as AssociationMember;
    } else {
      // Edge Config: Generate ID and store
      const memberId = `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const member: AssociationMember = {
        id: memberId,
        ...memberData,
        created_at: new Date().toISOString(),
      };

      await this.getRedisDb().set(
        `association_members:${memberId}`,
        JSON.stringify(member)
      );
      return member;
    }
  }

  async getAssociationMembersByProfileId(
    profileId: string
  ): Promise<(AssociationMember & { association_name?: string })[]> {
    if (this.dbType === 'postgresql') {
      const result = await this.getPostgresDb().query(
        `
        SELECT am.*, a.name as association_name
        FROM association_members am
        JOIN associations a ON am.association_id = a.id
        WHERE am.profile_id = <str>$1
      `,
        [profileId]
      );

      return (result as AssociationMember[]) || [];
    } else {
      // Redis: Get all member keys and filter, then get association names
      const keys = await this.getRedisDb().keys('association_members:*');
      const members = await Promise.all(
        keys.map(async (key: string) => {
          const data = await this.getRedisDb().get(key);
          return data ? (JSON.parse(data) as AssociationMember) : null;
        })
      );
      const filteredMembers = members.filter(
        member => member && member.profile_id === profileId
      );

      // Get association names for each member
      const membersWithNames = await Promise.all(
        filteredMembers.map(async member => {
          if (!member) return null;
          const association = await this.getAssociationById(
            member.association_id
          );
          return {
            ...member,
            association_name: association?.name,
          };
        })
      );

      return membersWithNames.filter(
        member => member !== null
      ) as (AssociationMember & { association_name?: string })[];
    }
  }

  // Convention operations
  async createConvention(
    conventionData: Omit<Convention, 'id' | 'created_at'>
  ): Promise<Convention> {
    if (this.dbType === 'postgresql') {
      const result = await this.getPostgresDb().querySingle(
        `
        INSERT INTO conventions (association_id, name, description, start_date, end_date, location, status, created_at)
        VALUES (<str>$1, <str>$2, <str>$3, <str>$4, <str>$5, <str>$6, <str>$7, NOW())
        RETURNING id, association_id, name, description, start_date, end_date, location, status, created_at
      `,
        [
          conventionData.association_id,
          conventionData.name,
          conventionData.description || null,
          conventionData.start_date,
          conventionData.end_date,
          conventionData.location || null,
          conventionData.status,
        ]
      );

      return result as Convention;
    } else {
      // Edge Config: Generate ID and store
      const conventionId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const convention: Convention = {
        id: conventionId,
        ...conventionData,
        created_at: new Date().toISOString(),
      };

      await this.getRedisDb().set(
        `conventions:${conventionId}`,
        JSON.stringify(convention)
      );
      return convention;
    }
  }

  async getConventionsByAssociation(
    associationId: string
  ): Promise<Convention[]> {
    if (this.dbType === 'postgresql') {
      const result = await this.getPostgresDb().query(
        `
        SELECT * FROM conventions WHERE association_id = <str>$1 ORDER BY start_date DESC
      `,
        [associationId]
      );

      return (result as Convention[]) || [];
    } else {
      // Redis: Get all convention keys and filter
      const keys = await this.getRedisDb().keys('conventions:*');
      const conventions = await Promise.all(
        keys.map(async (key: string) => {
          const data = await this.getRedisDb().get(key);
          return data ? (JSON.parse(data) as Convention) : null;
        })
      );
      return conventions.filter(
        (conv): conv is Convention =>
          conv !== null && conv.association_id === associationId
      );
    }
  }

  async createConventionMember(
    memberData: Omit<ConventionMember, 'id' | 'created_at'>
  ): Promise<ConventionMember> {
    if (this.dbType === 'postgresql') {
      const result = await this.getPostgresDb().querySingle(
        `
        INSERT INTO convention_members (convention_id, profile_id, role, created_at)
        VALUES (<str>$1, <str>$2, <str>$3, NOW())
        RETURNING id, convention_id, profile_id, role, created_at
      `,
        [memberData.convention_id, memberData.profile_id, memberData.role]
      );

      return result as ConventionMember;
    } else {
      // Edge Config: Generate ID and store
      const memberId = `conv_member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const member: ConventionMember = {
        id: memberId,
        ...memberData,
        created_at: new Date().toISOString(),
      };

      await this.getRedisDb().set(
        `convention_members:${memberId}`,
        JSON.stringify(member)
      );
      return member;
    }
  }

  // System settings operations
  async setSystemSetting(key: string, value: string): Promise<void> {
    if (this.dbType === 'postgresql') {
      await this.getPostgresDb().query(
        `
        INSERT INTO system_settings (key, value, updated_at)
        VALUES (<str>$1, <str>$2, NOW())
        ON CONFLICT (key) DO UPDATE SET value = <str>$2, updated_at = NOW()
      `,
        [key, value]
      );
    } else {
      await this.getRedisDb().set(`system_settings:${key}`, value);
    }
  }

  async getSystemSetting(key: string): Promise<string | null> {
    if (this.dbType === 'postgresql') {
      const result = await this.getPostgresDb().querySingle(
        `
        SELECT value FROM system_settings WHERE key = <str>$1
      `,
        [key]
      );

      return (result as { value: string })?.value || null;
    } else {
      return (
        ((await this.getRedisDb().get(`system_settings:${key}`)) as string) ||
        null
      );
    }
  }

  // Health check
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    latency?: number;
  }> {
    const startTime = Date.now();

    try {
      if (this.dbType === 'postgresql') {
        await this.getPostgresDb().querySingle('SELECT 1', []);
      } else {
        // For Redis, use ping command
        await this.getRedisDb().ping();
      }

      const latency = Date.now() - startTime;
      return { status: 'healthy', latency };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Health check failed:', error);
      return { status: 'unhealthy' };
    }
  }

  // Get adapter type
  getAdapterType(): 'postgresql' | 'redis' {
    return this.dbType;
  }
}

// Factory function to create data access layer
export function createDataAccessLayer(
  dbType?: 'postgresql' | 'redis'
): DataAccessLayer {
  // Auto-detect database type if not specified
  if (!dbType) {
    // Check for Redis first
    if (process.env.REDIS_URL) {
      dbType = 'redis';
    } else {
      dbType = 'postgresql'; // Default to PostgreSQL (includes EdgeDB)
    }
  }

  return new DataAccessLayer(dbType);
}

// Singleton instance
let dataAccess: DataAccessLayer | null = null;

export function getDataAccess(): DataAccessLayer {
  if (!dataAccess) {
    dataAccess = createDataAccessLayer();
  }
  return dataAccess;
}

export default DataAccessLayer;
