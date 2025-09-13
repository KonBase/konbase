import { executeQuery, executeQuerySingle } from './postgres';

// Migration interface
export interface Migration {
  version: string;
  name: string;
  up: string;
  down?: string;
}

// List of all migrations in order
export const migrations: Migration[] = [
  {
    version: '0001',
    name: 'initial_extensions_and_enums',
    up: `
      -- Extensions
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";
      CREATE EXTENSION IF NOT EXISTS "citext";

      -- Enums
      CREATE TYPE user_role_type AS ENUM (
        'super_admin','system_admin','admin','manager','member','guest'
      );
      CREATE TYPE convention_role_type AS ENUM (
        'organizer','staff','helper','attendee'
      );
      CREATE TYPE convention_status AS ENUM (
        'planning','active','completed','cancelled'
      );
      CREATE TYPE item_condition AS ENUM (
        'excellent','good','fair','poor','broken'
      );
      CREATE TYPE notification_type AS ENUM (
        'info','warning','error','success'
      );
    `,
  },
  {
    version: '0002',
    name: 'users_and_profiles',
    up: `
      -- Users table
      CREATE TABLE users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email citext UNIQUE NOT NULL,
        email_verified timestamptz,
        hashed_password text,
        role user_role_type NOT NULL DEFAULT 'member',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      -- Profiles table
      CREATE TABLE profiles (
        user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        first_name text NOT NULL,
        last_name text NOT NULL,
        display_name text NOT NULL,
        avatar_url text,
        two_factor_enabled boolean DEFAULT false,
        totp_secret text,
        recovery_keys text[] DEFAULT '{}',
        preferences jsonb DEFAULT '{}',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      -- Basic trigger to keep updated_at fresh
      CREATE OR REPLACE FUNCTION set_updated_at()
      RETURNS trigger AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trg_users_updated
      BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

      CREATE TRIGGER trg_profiles_updated
      BEFORE UPDATE ON profiles
      FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

      -- Indexes
      CREATE INDEX idx_users_email_ci ON users((lower(email::text)));
    `,
  },
  {
    version: '0003',
    name: 'associations_and_core_schema',
    up: `
      -- Associations table
      CREATE TABLE associations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL CHECK (char_length(name) > 0),
        description text,
        logo_url text,
        website text,
        email text,
        phone text,
        address text,
        settings jsonb DEFAULT '{}',
        created_at timestamptz DEFAULT now() NOT NULL,
        updated_at timestamptz DEFAULT now() NOT NULL
      );

      -- Association members linking table
      CREATE TABLE association_members (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        association_id uuid NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
        profile_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
        role user_role_type NOT NULL DEFAULT 'member',
        joined_at timestamptz DEFAULT now(),
        UNIQUE(association_id, profile_id)
      );

      -- Hierarchical categories
      CREATE TABLE categories (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        association_id uuid NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
        name text NOT NULL,
        description text,
        parent_id uuid REFERENCES categories(id) ON DELETE CASCADE,
        path text NOT NULL,
        level integer NOT NULL DEFAULT 0,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );

      -- Hierarchical locations
      CREATE TABLE locations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        association_id uuid NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
        name text NOT NULL,
        description text,
        parent_id uuid REFERENCES locations(id) ON DELETE CASCADE,
        path text NOT NULL,
        level integer NOT NULL DEFAULT 0,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );

      -- Items/inventory
      CREATE TABLE items (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        association_id uuid NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
        name text NOT NULL,
        description text,
        serial_number text,
        barcode text,
        category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
        location_id uuid REFERENCES locations(id) ON DELETE SET NULL,
        condition item_condition NOT NULL DEFAULT 'good',
        purchase_date date,
        purchase_price decimal(10,2),
        warranty_expires date,
        notes text,
        images text[] DEFAULT '{}',
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );

      -- Equipment sets (predefined bundles)
      CREATE TABLE equipment_sets (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        association_id uuid NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
        name text NOT NULL,
        description text,
        items jsonb NOT NULL DEFAULT '{}',
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );

      CREATE TABLE equipment_set_items (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        equipment_set_id uuid NOT NULL REFERENCES equipment_sets(id) ON DELETE CASCADE,
        item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
        quantity integer NOT NULL DEFAULT 1,
        created_at timestamptz DEFAULT now(),
        UNIQUE(equipment_set_id, item_id)
      );

      -- Conventions
      CREATE TABLE conventions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        association_id uuid NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
        name text NOT NULL,
        description text,
        start_date timestamptz NOT NULL,
        end_date timestamptz NOT NULL,
        location text,
        status convention_status NOT NULL DEFAULT 'planning',
        settings jsonb DEFAULT '{}',
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );

      -- Convention members
      CREATE TABLE convention_members (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        convention_id uuid NOT NULL REFERENCES conventions(id) ON DELETE CASCADE,
        profile_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
        role convention_role_type NOT NULL DEFAULT 'attendee',
        joined_at timestamptz DEFAULT now(),
        UNIQUE(convention_id, profile_id)
      );

      -- Convention equipment tracking
      CREATE TABLE convention_equipment (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        convention_id uuid NOT NULL REFERENCES conventions(id) ON DELETE CASCADE,
        item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
        quantity_requested integer NOT NULL DEFAULT 1,
        quantity_allocated integer NOT NULL DEFAULT 0,
        issued_to uuid REFERENCES profiles(user_id),
        issued_at timestamptz,
        returned_at timestamptz,
        notes text,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now(),
        UNIQUE(convention_id, item_id)
      );

      -- Documents/file attachments
      CREATE TABLE documents (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        association_id uuid NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
        name text NOT NULL,
        description text,
        file_path text NOT NULL,
        file_size bigint NOT NULL,
        mime_type text NOT NULL,
        uploaded_by uuid NOT NULL REFERENCES profiles(user_id),
        item_id uuid REFERENCES items(id) ON DELETE CASCADE,
        convention_id uuid REFERENCES conventions(id) ON DELETE CASCADE,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );

      -- Notifications
      CREATE TABLE notifications (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
        title text NOT NULL,
        message text NOT NULL,
        type notification_type NOT NULL DEFAULT 'info',
        read boolean DEFAULT false,
        data jsonb DEFAULT '{}',
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );

      -- Chat messages
      CREATE TABLE chat_messages (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        association_id uuid NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
        sender_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
        message text NOT NULL,
        created_at timestamptz DEFAULT now()
      );

      -- Audit logs for security and tracking
      CREATE TABLE audit_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        association_id uuid REFERENCES associations(id) ON DELETE CASCADE,
        user_id uuid REFERENCES profiles(user_id) ON DELETE SET NULL,
        action text NOT NULL,
        resource_type text NOT NULL,
        resource_id uuid,
        old_values jsonb,
        new_values jsonb,
        ip_address inet,
        user_agent text,
        created_at timestamptz DEFAULT now()
      );

      -- System settings table
      CREATE TABLE system_settings (
        key text PRIMARY KEY,
        value text NOT NULL,
        created_at timestamptz DEFAULT now() NOT NULL,
        updated_at timestamptz DEFAULT now() NOT NULL
      );

      -- Invitations table
      CREATE TABLE invitations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        association_id uuid NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
        email citext NOT NULL,
        role text NOT NULL,
        status text NOT NULL DEFAULT 'pending',
        expires_at timestamptz NOT NULL,
        created_at timestamptz DEFAULT now() NOT NULL
      );

      -- Password reset tokens
      CREATE TABLE password_reset_tokens (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token text NOT NULL UNIQUE,
        expires_at timestamptz NOT NULL,
        used boolean DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now()
      );

      -- Indexes for performance
      CREATE INDEX idx_associations_name ON associations(name);
      CREATE INDEX idx_association_members_association ON association_members(association_id);
      CREATE INDEX idx_association_members_profile ON association_members(profile_id);
      CREATE INDEX idx_categories_association ON categories(association_id);
      CREATE INDEX idx_categories_parent ON categories(parent_id);
      CREATE INDEX idx_locations_association ON locations(association_id);
      CREATE INDEX idx_locations_parent ON locations(parent_id);
      CREATE INDEX idx_items_association ON items(association_id);
      CREATE INDEX idx_items_category ON items(category_id);
      CREATE INDEX idx_items_location ON items(location_id);
      CREATE INDEX idx_conventions_association ON conventions(association_id);
      CREATE INDEX idx_convention_members_convention ON convention_members(convention_id);
      CREATE INDEX idx_convention_equipment_convention ON convention_equipment(convention_id);
      CREATE INDEX idx_notifications_user ON notifications(user_id);
      CREATE INDEX idx_chat_messages_association ON chat_messages(association_id);
      CREATE INDEX idx_audit_logs_association ON audit_logs(association_id);
      CREATE INDEX idx_invitations_association_id ON invitations(association_id);
      CREATE INDEX idx_invitations_email ON invitations(email);
      CREATE INDEX idx_password_reset_tokens_user ON password_reset_tokens(user_id);
      CREATE INDEX idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);

      -- Functions and triggers for updated_at timestamps
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      -- Add triggers for updated_at
      CREATE TRIGGER update_associations_updated_at BEFORE UPDATE ON associations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      CREATE TRIGGER update_equipment_sets_updated_at BEFORE UPDATE ON equipment_sets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      CREATE TRIGGER update_conventions_updated_at BEFORE UPDATE ON conventions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      CREATE TRIGGER update_convention_equipment_updated_at BEFORE UPDATE ON convention_equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `,
  },
  {
    version: '0004',
    name: 'row_level_security',
    up: `
      -- Enable RLS on all tables
      ALTER TABLE associations ENABLE ROW LEVEL SECURITY;
      ALTER TABLE association_members ENABLE ROW LEVEL SECURITY;
      ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
      ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
      ALTER TABLE items ENABLE ROW LEVEL SECURITY;
      ALTER TABLE equipment_sets ENABLE ROW LEVEL SECURITY;
      ALTER TABLE equipment_set_items ENABLE ROW LEVEL SECURITY;
      ALTER TABLE conventions ENABLE ROW LEVEL SECURITY;
      ALTER TABLE convention_members ENABLE ROW LEVEL SECURITY;
      ALTER TABLE convention_equipment ENABLE ROW LEVEL SECURITY;
      ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
      ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
      ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
      ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
      ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

      -- Basic RLS policies (simplified for standard PostgreSQL)
      -- Note: These are placeholder policies. In production, you would implement
      -- proper authentication-based policies using your auth system.

      -- Allow all operations for now (can be restricted later based on your auth system)
      CREATE POLICY "Allow all operations on associations" ON associations FOR ALL USING (true);
      CREATE POLICY "Allow all operations on association_members" ON association_members FOR ALL USING (true);
      CREATE POLICY "Allow all operations on categories" ON categories FOR ALL USING (true);
      CREATE POLICY "Allow all operations on locations" ON locations FOR ALL USING (true);
      CREATE POLICY "Allow all operations on items" ON items FOR ALL USING (true);
      CREATE POLICY "Allow all operations on equipment_sets" ON equipment_sets FOR ALL USING (true);
      CREATE POLICY "Allow all operations on equipment_set_items" ON equipment_set_items FOR ALL USING (true);
      CREATE POLICY "Allow all operations on conventions" ON conventions FOR ALL USING (true);
      CREATE POLICY "Allow all operations on convention_members" ON convention_members FOR ALL USING (true);
      CREATE POLICY "Allow all operations on convention_equipment" ON convention_equipment FOR ALL USING (true);
      CREATE POLICY "Allow all operations on documents" ON documents FOR ALL USING (true);
      CREATE POLICY "Allow all operations on notifications" ON notifications FOR ALL USING (true);
      CREATE POLICY "Allow all operations on chat_messages" ON chat_messages FOR ALL USING (true);
      CREATE POLICY "Allow all operations on audit_logs" ON audit_logs FOR ALL USING (true);
      CREATE POLICY "Allow all operations on invitations" ON invitations FOR ALL USING (true);
    `,
  },
];

// Migration tracking table
const MIGRATIONS_TABLE = 'schema_migrations';

// Initialize migrations table
async function initMigrationsTable(): Promise<void> {
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      version varchar(255) PRIMARY KEY,
      applied_at timestamptz DEFAULT now() NOT NULL
    )
  `);
}

// Get applied migrations
async function getAppliedMigrations(): Promise<string[]> {
  await initMigrationsTable();
  const result = await executeQuery<{ version: string }>(
    `SELECT version FROM ${MIGRATIONS_TABLE} ORDER BY version`
  );
  return result.map(row => row.version);
}

// Apply a single migration
async function applyMigration(migration: Migration): Promise<void> {
  console.log(`Applying migration ${migration.version}: ${migration.name}`);

  // Execute the migration
  await executeQuery(migration.up);

  // Record the migration
  await executeQuery(`INSERT INTO ${MIGRATIONS_TABLE} (version) VALUES ($1)`, [
    migration.version,
  ]);

  console.log(`Migration ${migration.version} applied successfully`);
}

// Run all pending migrations
export async function runMigrations(): Promise<{
  applied: string[];
  skipped: string[];
  error?: string;
}> {
  try {
    console.log('Starting database migrations...');

    const appliedMigrations = await getAppliedMigrations();
    const pendingMigrations = migrations.filter(
      migration => !appliedMigrations.includes(migration.version)
    );

    if (pendingMigrations.length === 0) {
      console.log('No pending migrations');
      return {
        applied: [],
        skipped: appliedMigrations,
      };
    }

    console.log(`Found ${pendingMigrations.length} pending migrations`);

    const applied: string[] = [];

    for (const migration of pendingMigrations) {
      try {
        await applyMigration(migration);
        applied.push(migration.version);
      } catch (error) {
        console.error(`Failed to apply migration ${migration.version}:`, error);
        throw error;
      }
    }

    console.log(`Successfully applied ${applied.length} migrations`);

    return {
      applied,
      skipped: appliedMigrations,
    };
  } catch (error) {
    console.error('Migration failed:', error);
    return {
      applied: [],
      skipped: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Check if migrations are up to date
export async function checkMigrationsStatus(): Promise<{
  isUpToDate: boolean;
  applied: string[];
  pending: string[];
  error?: string;
}> {
  try {
    const appliedMigrations = await getAppliedMigrations();
    const allVersions = migrations.map(m => m.version);
    const pending = allVersions.filter(
      version => !appliedMigrations.includes(version)
    );

    return {
      isUpToDate: pending.length === 0,
      applied: appliedMigrations,
      pending,
    };
  } catch (error) {
    return {
      isUpToDate: false,
      applied: [],
      pending: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
