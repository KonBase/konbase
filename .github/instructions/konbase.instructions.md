---
applyTo: '**'
---
# KonBase Modernization Project - Copilot Instructions

## Project Overview

KonBase is a comprehensive inventory and convention management system designed for associations that organize events and need to track their equipment and supplies. We are modernizing from a React/Vite/Supabase stack to Next.js 15 with modern technologies.

**Current Status:** Migration in progress from legacy architecture to modern stack
**Target Architecture:** Next.js 15 + Material UI v7.3.2 + GelDB + Auth.js + Docker

## Technology Stack

### Target Modern Stack (What we're building)
- **Frontend:** Next.js v15 (App Router), TypeScript, Tailwind CSS v4
- **UI Framework:** Material UI v7.3.2 (@mui/material@^7.3.2)
- **Database:** Gel Database (GelDB) with PostgreSQL compatibility
- **Authentication:** Auth.js (NextAuth.js) with custom providers
- **State Management:** TanStack Query v5 + Zustand
- **File Storage:** Local file system + GelDB metadata integration
- **Containerization:** Docker Compose
- **Styling:** Tailwind CSS v4 with custom design system

### Legacy Stack (What we're migrating FROM)
- React 18 + Vite + Supabase (PostgreSQL, Auth, Storage)
- Radix UI components (being replaced with Material UI)
- shadcn/ui components (being replaced)

## Project Architecture

### Core Modules
1. **Association Management** - Organizations, members, roles, invitations
2. **Inventory Management** - Items, categories, locations, equipment sets, documents
3. **Convention Management** - Events, equipment tracking, consumables, requirements
4. **User Management** - Profiles, roles, 2FA, notifications
5. **Admin Panel** - Super admin controls, audit logging
6. **Reports & Analytics** - Data visualization and export functionality

### Directory Structure
```
/
├── src/
│   ├── app/                     # Next.js 15 App Router pages
│   ├── components/              # Reusable UI components (Material UI based)
│   │   ├── ui/                  # Base UI components
│   │   ├── forms/               # Form components with validation
│   │   ├── tables/              # Data table components
│   │   └── charts/              # Analytics components
│   ├── lib/                     # Utilities and configurations
│   │   ├── geldb/               # GelDB client and queries
│   │   ├── auth/                # Auth.js configuration
│   │   └── validations/         # Zod schemas
│   ├── types/                   # TypeScript type definitions
│   └── styles/                  # Global styles and Tailwind configs
├── .github/                     # GitHub configurations
├── docker-compose.yml           # Container orchestration
├── tailwind.config.js           # Tailwind CSS v4 configuration
├── next.config.js               # Next.js configuration
└── package.json                 # Dependencies and scripts
```

## Development Guidelines

### Code Standards
- **TypeScript:** Strict mode enabled, prefer type safety over `any`
- **Components:** Use React function components with hooks
- **Forms:** React Hook Form + Zod validation
- **API Routes:** Next.js 15 App Router API routes
- **Database:** Use GelDB client with type-safe queries
- **Error Handling:** Comprehensive error boundaries and validation

### UI/UX Standards
- **Components:** Material UI v7.3.2 components ONLY (no Radix UI)
- **Theming:** Custom MUI theme with KonBase color palette
- **Responsive:** Mobile-first approach with Tailwind breakpoints
- **Accessibility:** WCAG 2.1 AA compliance, screen reader support
- **Design Tokens:** Use Tailwind CSS custom variables for consistency

### KonBase Design System Colors
```
konbase: {
  blue: '#0c2e62',      // Primary brand color
  cherry: '#d84165',    // Secondary accent
  'light-blue': '#0fb4ea',
  yellow: '#fce771',    // Warning/highlight
  black: '#171716',     // Text primary
  white: '#e6e6dc',     // Background light
  furry: '#a2779c',     // Tertiary
  gzdacz: '#ea8000',    // Helper/warning
}
```

## Build and Development Commands

### Environment Setup
```
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Configure: NEXTAUTH_SECRET, GEL_DATABASE_URL, etc.

# Database setup
npm run db:migrate
npm run db:seed
```

### Development Workflow
```
# Start development server
npm run dev              # Starts Next.js dev server on port 3000

# Database operations
npm run db:push          # Push schema changes to GelDB
npm run db:studio        # Open database GUI
npm run db:reset         # Reset database (development only)

# Testing
npm run test             # Run unit tests
npm run test:e2e         # Run end-to-end tests
npm run lint             # ESLint + TypeScript checks
npm run type-check       # TypeScript validation
```

### Docker Development
```
# Full stack with Docker Compose
docker-compose up -d     # Start all services
docker-compose logs app  # View application logs
docker-compose down      # Stop all services
```

## Migration-Specific Guidelines

### Component Migration Rules
1. **Replace Radix UI → Material UI:**
   - `@radix-ui/react-dialog` → `@mui/material/Dialog`
   - `@radix-ui/react-select` → `@mui/material/Select`
   - `@radix-ui/react-checkbox` → `@mui/material/Checkbox`
   - And all other Radix components

2. **Database Migration:**
   - Convert Supabase queries to GelDB equivalents
   - Preserve all RLS policies and security functions
   - Maintain data relationships and constraints

3. **Authentication Migration:**
   - Replace Supabase Auth with Auth.js
   - Preserve role-based access control system
   - Maintain 2FA functionality

### File Organization During Migration
- Keep legacy code in `/legacy/` directory during transition
- Create parallel implementations in new structure
- Use feature flags for gradual rollout
- Maintain backward compatibility during migration

## Database Schema

### Core Tables
- `associations` - Organization data
- `profiles` - User profiles extending auth users
- `association_members` - User-association relationships
- `items` - Inventory items with categories and locations
- `conventions` - Event management
- `audit_logs` - Comprehensive activity tracking

### Security Model
- Role-based access: `super_admin`, `system_admin`, `admin`, `manager`, `member`, `guest`
- Row Level Security (RLS) policies for data isolation
- Association-scoped data access
- Comprehensive audit logging

## Testing Strategy

### Unit Testing
- Jest + Testing Library for component tests
- Mock GelDB queries and Auth.js sessions
- Test form validation and user interactions
- Maintain >80% code coverage

### Integration Testing
- Test API routes with database integration
- Verify authentication flows
- Test role-based access controls

### E2E Testing
- Playwright for full user journey testing
- Test critical workflows (login, inventory management, convention setup)
- Cross-browser compatibility testing

## Special Considerations

### Performance Requirements
- Page load times < 2 seconds
- Responsive design for mobile devices
- Efficient data fetching with TanStack Query
- Image optimization for inventory photos

### Security Requirements
- Implement all RLS policies from legacy system
- Secure file upload validation
- Rate limiting on API endpoints
- CSRF protection on forms

### Self-Hosting Optimization
- Docker containers for easy deployment
- Environment-based configuration
- Health checks and monitoring
- Backup and restore procedures

## Common Patterns

### Form Pattern
```
// Use React Hook Form + Zod + Material UI
const schema = z.object({
  name: z.string().min(1, "Required"),
});

function MyForm() {
  const form = useForm({
    resolver: zodResolver(schema),
  });
  
  return (
    <Box component="form" onSubmit={form.handleSubmit(onSubmit)}>
      <TextField
        {...form.register('name')}
        error={!!form.formState.errors.name}
        helperText={form.formState.errors.name?.message}
      />
    </Box>
  );
}
```

### Data Fetching Pattern
```
// Use TanStack Query with GelDB
function useItems() {
  return useQuery({
    queryKey: ['items'],
    queryFn: () => geldb.from('items').select('*'),
  });
}
```

## Troubleshooting

### Common Issues
- **Build failures:** Check TypeScript errors and dependency versions
- **Database connection:** Verify GEL_DATABASE_URL in environment
- **Authentication issues:** Check NEXTAUTH_SECRET and provider config
- **Styling problems:** Ensure Tailwind classes are properly compiled

### Development Tips
- Use `npm run type-check` before committing
- Keep Material UI theme consistent with KonBase design
- Test responsive design on multiple screen sizes
- Verify accessibility with screen readers

Always prefer the modern stack implementations over legacy patterns. When in doubt, follow Material UI best practices and Next.js 15 App Router conventions.
```

***

This Copilot instructions file provides comprehensive guidance for working on the KonBase modernization project, ensuring consistent development practices and helping GitHub Copilot understand the project's context, architecture, and specific requirements for the migration from the legacy stack to the modern technology stack.

[1](https://docs.github.com/copilot/customizing-copilot/adding-custom-instructions-for-github-copilot)
[2](https://docs.github.com/en/copilot/how-tos/provide-context)
[3](https://github.blog/changelog/2025-02-19-boost-your-productivity-with-github-copilot-in-jetbrains-ides-introducing-project-context-ai-generated-commit-messages-and-other-updates/)
[4](https://docs.github.com/enterprise-cloud@latest/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot)
[5](https://github.blog/ai-and-ml/github-copilot/5-tips-for-writing-better-custom-instructions-for-copilot/)
[6](https://code.visualstudio.com/docs/copilot/customization/custom-instructions)
[7](https://docs.github.com/copilot/how-tos/agents/copilot-coding-agent/best-practices-for-using-copilot-to-work-on-tasks)
[8](https://machinethoughts.substack.com/p/how-i-levelled-up-my-github-copilot)
[9](https://fizzylogic.nl/2024/10/22/get-more-out-of-copilot-workspace-with-custom-instructions)
[10](https://github.blog/ai-and-ml/github-copilot/onboarding-your-ai-peer-programmer-setting-up-github-copilot-coding-agent-for-success/)
[11](https://learn.microsoft.com/en-us/visualstudio/ide/copilot-chat-context?view=vs-2022)
[12](https://github.blog/ai-and-ml/github-copilot/5-tips-and-tricks-when-using-github-copilot-workspace/)
[13](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/request-a-code-review/configure-coding-guidelines)
[14](https://code.visualstudio.com/docs/copilot/customization/overview)
[15](https://github.com/githubnext/copilot-workspace-user-manual)
[16](https://docs.github.com/en/copilot/get-started/best-practices)
[17](https://docs.github.com/en/copilot/how-tos/configure-custom-instructions)
[18](https://devblogs.microsoft.com/java/customize-github-copilot-in-jetbrains-with-custom-instructions/)
[19](https://docs.github.com/copilot/quickstart)
[20](https://githubnext.com/projects/copilot-workspace)