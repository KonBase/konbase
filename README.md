<div align="center">
  <img src="./public/uploads/1.svg" alt="KonBase Logo" width="300" />
</div>

<p align="center">
  <a href="https://github.com/KonBase/KonBase/stargazers">
    <img src="https://img.shields.io/github/stars/KonBase/konbase-open-source" alt="Stars" />
  </a>
  <a href="https://github.com/KonBase/KonBase/network/members">
    <img src="https://img.shields.io/github/forks/KonBase/konbase-open-source" alt="Forks" />
  </a>
  <a href="https://deepscan.io/dashboard#view=project&tid=26785&pid=29370&bid=943878"><img src="https://deepscan.io/api/teams/26785/projects/29370/branches/943878/badge/grade.svg" alt="DeepScan grade"></a>
  <a href="https://github.com/KonBase/KonBase/issues">
    <img src="https://img.shields.io/github/issues/KonBase/konbase-open-source" alt="Issues" />
  </a>
  <a href="./LICENSE.md">
    <img src="https://img.shields.io/github/license/KonBase/konbase-open-source" alt="License" />
  </a>
</p>

KonBase is a comprehensive inventory and convention management system built for associations that organize events and need to track their equipment and supplies.

## Table of Contents

- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Contributing](#contributing)
- [Community](#community)
- [License](#license)

## Key Features

### Association Management Module

- Association registration and profile management
- Inventory management with categorization and location tracking
- User management with permission levels
- Warranty and documentation tracking
- Equipment sets management
- Import/export functionality
- Local backup capabilities

### Convention Management Module

- Create convention from association template
- Equipment issuing and return tracking
- Consumable items tracking
- Room/location mapping
- Requirements gathering and fulfillment tracking
- Comprehensive logging of all actions
- Reports generation
- Post-convention archiving

### Security Features

- Role-based access control
- Super-admin role with full system access
- Enhanced security for log files
- Two-factor authentication for sensitive operations
- Data encryption for sensitive information

## Tech Stack

KonBase is built using modern web technologies:

### Frontend

- **React** - A JavaScript library for building user interfaces
- **TypeScript** - Static typing for better developer experience
- **Vite** - Next generation frontend tooling
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Reusable UI components built with Radix UI and Tailwind CSS
- **React Router** - Routing library for React
- **Lucide Icons** - Beautiful open source icons
- **React Hook Form** - Form validation
- **Recharts** - Data visualization components

### Backend

- **Supabase** - Open source Firebase alternative
  - PostgreSQL database
  - Authentication
  - Storage
  - Edge Functions
  - Realtime subscriptions
- **Tanstack Query** - Asynchronous state management

### Deployment

- **GitHub Pages** - For static site hosting
- **GitHub Actions** - CI/CD for automatic deployment

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Supabase account (for database and authentication)

### Supabase Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the database schema setup script from the `schema.sql` file in the SQL editor
3. Configure authentication providers as needed
4. Get your Supabase URL and anonymous key

### Installation

1. Clone the repository

   ```
   git clone https://github.com/ShiroLuxferre/KonBase.git
   cd konbase
   ```

2. Install dependencies

   ```
   npm install
   ```

3. Create an `.env` file with your Supabase credentials

   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server

   ```
   npm run dev
   ```

5. Build for production
   ```
   npm run build
   ```

## Connecting to Supabase

This project uses Supabase as its backend. To connect your local development environment to your remote Supabase project, follow these steps:

1.  **Install Supabase CLI:**
    If you haven't already, install the Supabase CLI. Follow the official instructions for your operating system: [Supabase CLI Installation](https://supabase.com/docs/guides/cli/getting-started#installation)

2.  **Log in to Supabase:**
    Open your terminal (Powershell in your case) and log in to your Supabase account:

    ```powershell
    supabase login
    ```

    This will open a browser window for authentication.

3.  **Link your Project:**
    Navigate to the root directory of this project (`konbase-open-source`) in your terminal and link it to your remote Supabase project:

    ```powershell
    supabase link --project-ref YOUR_PROJECT_REF
    ```

    Replace `YOUR_PROJECT_REF` with your actual Supabase project reference ID. You can find this in your Supabase project's dashboard URL (e.g., `https://app.supabase.com/project/YOUR_PROJECT_REF`) or in Project Settings -> General.

4.  **Set up Environment Variables:**
    The application needs your Supabase Project URL and Anon Key to communicate with the backend.

    - Create a `.env` file in the root of the project if it doesn't exist.
    - Add the following lines to the `.env` file:

      ```dotenv
      NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
      NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
      ```

    - Replace `YOUR_SUPABASE_PROJECT_URL` and `YOUR_SUPABASE_ANON_KEY` with the actual values from your Supabase project dashboard (Project Settings -> API).

5.  **(Optional) Pull Remote Database Changes:**
    If you have made changes to your remote database schema _after_ linking, you might want to pull those changes to keep your local `supabase/migrations` folder in sync (though this project currently uses `schema.sql` for initial setup):

    ```powershell
    supabase db pull
    ```

    _Note: Be cautious with this command if you have local migration files you haven't applied remotely._

6.  **Run the Application:**
    You should now be able to run the application locally, and it will connect to your remote Supabase instance.
    ```powershell
    npm run dev
    ```

## Database Setup (Manual)

Since the first-time setup wizard has been removed, follow these steps to set up your Supabase database manually:

1.  Navigate to your Supabase project dashboard.
2.  Go to the **SQL Editor**.
3.  Click **"New query"**.
4.  Copy the entire content of the `schema.sql` file from this project.
5.  Paste the content into the SQL Editor.
6.  Run the query. This will create all necessary tables, roles, functions, and RLS policies.
7.  **Grant Super Admin:**
    - Sign up a user for your application (this will be your super admin).
    - Find the `user_id` (UUID) of this user in the Supabase Dashboard under Authentication -> Users.
    - Open the `super_admin.sql` file in this project.
    - Replace the placeholder `'YOUR_USER_ID_HERE'` with the actual `user_id`.
    - Go back to the Supabase **SQL Editor** and create another **"New query"**.
    - Copy the modified content of `super_admin.sql` and paste it into the editor.
    - Run the query.

Your database is now set up and connected to the application.

## Contributing

We welcome contributions to KonBase! Here's how you can help:

### Ways to Contribute

- **Code Contributions**: Fix bugs, add features, improve performance
- **Documentation**: Improve or expand documentation
- **Bug Reports**: Submit issues for any bugs you encounter
- **Feature Requests**: Suggest new features or improvements
- **Testing**: Help test the application and provide feedback

### Contribution Process

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

### Code Style

- Follow the existing code style
- Use TypeScript for type safety
- Write tests for new features
- Update documentation for significant changes

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation
- `style:` for code style changes
- `refactor:` for code refactoring
- `test:` for tests
- `chore:` for build process or auxiliary tool changes

## Community

Join our community to get help, share ideas, and connect with other KonBase users:

- **Discord**: Join our [Discord server](https://discord.gg/wt6JYqBRzU) for discussions and support
- **GitHub Issues**: Report bugs or request features through [GitHub Issues](https://github.com/KonBase/konbase/issues)
- **Discussions**: Participate in [GitHub Discussions](https://github.com/KonBase/konbase/discussions) for general topics

### Support the Project

If you find KonBase helpful, consider supporting the project:

- **GitHub Sponsors**: Support the development team directly through GitHub
- **Buy Me a Coffee**: [Buy us a coffee](https://www.buymeacoffee.com/konbase) to fuel development

## License

KonBase is licensed under the [MIT License](./LICENSE.md) - see the LICENSE.md file for details.

---

<p align="center">
  Made with ❤️ by the KonBase community
</p>
