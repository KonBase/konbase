import React from 'react';
import {
  KonbaseModule,
  ModuleDashboardComponent,
  ModuleNavigationItem,
} from '../types/modules';

// Extend the Window interface to include supabaseClient
declare global {
  interface Window {
    supabaseClient?: any;
  }
}
import { Activity } from 'lucide-react';

// Sample Dashboard Component
const SampleDashboardComponent: React.FC = () => {
  return (
    <div className="p-4 border rounded-md">
      <h3 className="text-lg font-medium mb-2">Sample Module</h3>
      <p className="text-sm text-muted-foreground">
        This is a sample dashboard component from a custom module.
      </p>
      <div className="mt-4 p-3 bg-muted rounded-md">
        <p className="text-xs">Module data will appear here</p>
      </div>
    </div>
  );
};

// Sample Module Definition
const SampleModule: KonbaseModule = {
  id: 'sample-module',
  name: 'Sample Module',
  version: '1.0.0',
  description: 'A sample module to demonstrate the module system',
  author: 'Konbase Team',
  requires: [],
  permissions: ['read:inventory'],

  // Lifecycle methods
  onRegister: async () => {
    console.log('Sample module registered');
  },

  onEnable: async () => {
    console.log('Sample module enabled');

    // Add debugging for authentication methods
    try {
      const supabase = window.supabaseClient || globalThis.supabaseClient;
      if (supabase?.auth) {
        console.log('Available auth methods:', Object.keys(supabase.auth));
        console.log(
          'Sign in method:',
          typeof supabase.auth.signIn === 'function'
            ? 'signIn'
            : typeof supabase.auth.signInWithPassword === 'function'
              ? 'signInWithPassword'
              : 'not found',
        );
      } else {
        console.warn('Supabase auth not available');
      }
    } catch (error) {
      console.error('Error checking auth methods:', error);
    }
  },

  onDisable: async () => {
    console.log('Sample module disabled');
  },

  // UI components
  getDashboardComponents: () => {
    const components: ModuleDashboardComponent[] = [
      {
        title: 'Sample Module',
        moduleId: 'sample-module',
        component: () => <SampleDashboardComponent />,
        priority: 10,
      },
    ];
    return components;
  },

  getNavigationItems: () => {
    const items: ModuleNavigationItem[] = [
      {
        moduleId: 'sample-module',
        title: 'Sample Module',
        label: 'Sample Module',
        path: '/sample-module',
        icon: <Activity />,
        order: 100,
      },
    ];
    return items;
  },

  // Database migrations
  getDatabaseMigrations: () => {
    return [
      {
        version: '1.0.0',
        description: 'Initial schema for sample module',
        sql: `
          CREATE TABLE IF NOT EXISTS sample_module_data (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name TEXT NOT NULL,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
          
          -- Add RLS policies
          ALTER TABLE sample_module_data ENABLE ROW LEVEL SECURITY;
          
          CREATE POLICY "Users can view their own data" ON sample_module_data
            FOR SELECT USING (auth.uid() IN (
              SELECT id FROM profiles WHERE association_id = (
                SELECT association_id FROM profiles WHERE id = auth.uid()
              )
            ));
        `,
        runOnEnable: true,
      },
    ];
  },

  // Configuration schema
  getConfigurationSchema: () => {
    return {
      properties: {
        enableFeatureX: {
          type: 'boolean',
          title: 'Enable Feature X',
          default: false,
        },
        apiKey: {
          type: 'string',
          title: 'API Key',
          format: 'password',
        },
      },
    };
  },
};

export default SampleModule;
