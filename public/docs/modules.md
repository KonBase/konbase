---
title: Modules Overview and Development Guide
description: This guide explains how to create custom modules for the Konbase platform.
date: 2025-04-03
keywords: konbase, convention, event, inventory, staff, scheduling, association
implementation_status: planned
author: Artur Sendyka
last_updated: 2025-04-24
---

## Module Structure

A Konbase module is a TypeScript object that implements the `KonbaseModule` interface. Each module must have:

- Unique ID
- Name
- Version
- Optional description and author
- Optional lifecycle methods
- Optional UI components
- Optional database migrations

## Creating a Basic Module

Here's a minimal module example:

```typescript
import { KonbaseModule } from '../types/modules';

const MyModule: KonbaseModule = {
  id: 'my-module',
  name: 'My Module',
  version: '1.0.0',
  description: 'A custom module for Konbase',
  author: 'Your Name',

  onRegister: async () => {
    console.log('My module registered');
  },

  onEnable: async () => {
    console.log('My module enabled');
  },

  onDisable: async () => {
    console.log('My module disabled');
  },
};

export default MyModule;
```

## Adding Dashboard Components

To add components to the dashboard:

```typescript
import { KonbaseModule, ModuleDashboardComponent } from '../types/modules';

const MyDashboardComponent = () => {
  return (
    <div className="p-4 border rounded-md">
      <h3 className="font-medium">My Module</h3>
      <p>Dashboard component content</p>
    </div>
  );
};

const MyModule: KonbaseModule = {
  // ... basic module properties

  getDashboardComponents: () => {
    return [
      {
        moduleId: 'my-module',
        component: MyDashboardComponent,
        priority: 10 // Higher priority components appear first
      }
    ];
  }
};
```

## Adding Navigation Items

To add items to the navigation sidebar:

```typescript
import { KonbaseModule, ModuleNavigationItem } from '../types/modules';
import { Settings } from 'lucide-react'; // Import icons

const MyModule: KonbaseModule = {
  // ... basic module properties

  getNavigationItems: () => {
    return [
      {
        moduleId: 'my-module',
        label: 'My Module',
        path: '/my-module',
        icon: Settings,
        order: 100, // Lower order items appear higher in the list
      },
    ];
  },
};
```

## Database Integration

Modules can create and manage their own database tables:

```typescript
const MyModule: KonbaseModule = {
  // ... basic module properties

  getDatabaseMigrations: () => {
    return [
      {
        version: '1.0.0',
        up: `
          CREATE TABLE IF NOT EXISTS my_module_data (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
          
          -- Add RLS policies
          ALTER TABLE my_module_data ENABLE ROW LEVEL SECURITY;
          
          CREATE POLICY "Users can view their own data" ON my_module_data
            FOR SELECT USING (auth.uid() IN (
              SELECT id FROM profiles WHERE association_id = (
                SELECT association_id FROM profiles WHERE id = auth.uid()
              )
            ));
        `,
        down: `
          DROP TABLE IF EXISTS my_module_data;
        `,
      },
    ];
  },
};
```

## Module Configuration

Modules can define a configuration schema:

```typescript
const MyModule: KonbaseModule = {
  // ... basic module properties

  getConfigurationSchema: () => {
    return {
      properties: {
        apiKey: {
          type: 'string',
          title: 'API Key',
          format: 'password',
        },
        maxItems: {
          type: 'number',
          title: 'Maximum Items',
          default: 10,
        },
      },
    };
  },
};
```

## Security Best Practices

1. Always use Row Level Security (RLS) policies for your database tables
2. Validate all user input
3. Request only the permissions your module needs
4. Use prepared statements for database queries
5. Don't store sensitive information in client-side code

## Testing Your Module

Before submitting your module:

1. Test all functionality
2. Verify database migrations work correctly
3. Test enabling and disabling the module
4. Check for any console errors
5. Ensure the module works with different user roles

## Submitting Your Module

To submit your module to the Konbase Module Store:

1. Package your module according to the packaging guidelines
2. Include a detailed README.md with usage instructions
3. Submit through the developer portal

For more information, contact the Konbase team.

````

## 9. Integration Instructions

Now that we've created all the necessary components, here's how to integrate them into your existing application:

1. **Add ModuleWrapper to your app**:

   In your main app component or layout, wrap your application with the ModuleWrapper:

   ```tsx
   import { ModuleWrapper } from './components/modules/ModuleWrapper';
   import { ModuleLoader } from './components/modules/ModuleLoader';

   function App() {
     return (
       <ModuleLoader>
         <ModuleWrapper>
           {/* Your existing app content */}
         </ModuleWrapper>
       </ModuleLoader>
     );
   }
````

2. **Add ModuleManager to your admin routes**:

   ```tsx
   import { ModuleManager } from './components/modules/ModuleManager';

   // In your routes configuration
   const routes = [
     // ... existing routes
     {
       path: '/admin/modules',
       element: <ModuleManager />,
     },
   ];
   ```

3. **Add ModuleDashboardComponents to your dashboard**:

   ```tsx
   import { ModuleDashboardComponents } from './components/modules/ModuleDashboardComponents';

   // In your Dashboard component
   function Dashboard() {
     return (
       <div>
         <h1>Dashboard</h1>
         {/* Your existing dashboard content */}

         <h2>Module Components</h2>
         <ModuleDashboardComponents />
       </div>
     );
   }
   ```

4. **Add ModuleNavigationItems to your navigation**:

   ```tsx
   import { ModuleNavigationItems } from './components/modules/ModuleNavigationItems';

   // In your Navigation/Sidebar component
   function Sidebar() {
     return (
       <nav>
         <ul>
           {/* Your existing navigation items */}

           {/* Module navigation items */}
           <ModuleNavigationItems />
         </ul>
       </nav>
     );
   }
   ```
