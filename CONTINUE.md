# MyAshes.ai Project Context and Technical Documentation

## Project Overview
MyAshes.ai is an AI-powered assistant application for the MMORPG game "Ashes of Creation." The project combines game data with AI capabilities to provide features including chat interface, character build planner, item database, crafting calculator, resource map, economy tracker, and other tools to enhance player experience.

## Technical Architecture

### Frontend (Next.js Application)
- **Framework**: Next.js 13+ with App Router
- **Language**: TypeScript
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **UI Components**: Custom components built on Radix UI (shadcn/ui pattern)
- **Authentication**: JWT stored in localStorage with auto-refresh
- **Path**: `C:\Users\shaun\repos\ashes-of-creation-assistant\frontend`

### Backend (FastAPI)
- **Framework**: Python FastAPI
- **Database ORM**: SQLAlchemy
- **Migrations**: Alembic
- **Authentication**: JWT-based with token refresh
- **Path**: `C:\Users\shaun\repos\ashes-of-creation-assistant\backend`

### Data Pipeline
- **Language**: Python
- **Vector Store**: Milvus
- **Embedding Model**: OpenAI embeddings
- **Path**: `C:\Users\shaun\repos\ashes-of-creation-assistant\data-pipeline`

### Discord Bot
- **Language**: Python
- **Framework**: discord.py
- **Integration**: OpenAI API
- **Path**: `C:\Users\shaun\repos\ashes-of-creation-assistant\backend\app\api\discord_bot.py`

### Infrastructure
- **Containerization**: Docker
- **CI/CD**: GitHub Actions workflows
- **Database**: PostgreSQL
- **Vector Database**: Milvus with authentication
- **Caching**: Redis
- **Web Server**: Nginx as reverse proxy with SSL
- **Path**: `C:\Users\shaun\repos\ashes-of-creation-assistant\.github\workflows` and `C:\Users\shaun\repos\ashes-of-creation-assistant\docker`

## Docker Environment Configuration

### Docker Compose Files
- `docker-compose.yml`: Main configuration with all services
- `docker-compose.dev.yml`: Development-specific overrides
- `docker-compose.prod.yml`: Production-specific optimizations
- `.env`: Environment variables (created based on .env.example)

### Services
1. **Frontend** (Next.js)
   - Exposed on port 3000
   - Environment variables include NEXT_PUBLIC_API_URL

2. **Backend** (FastAPI)
   - Exposed on port 8000
   - Uses custom entrypoint script for database migrations
   - Dependencies include PostgreSQL, Milvus, Redis

3. **Data Pipeline**
   - Processes and indexes game data
   - Dependencies include PostgreSQL, Milvus, Redis

4. **PostgreSQL**
   - Exposed on port 5432
   - Credentials: POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
   - Persistent volume: postgres-data

5. **Milvus**
   - Vector database with authentication enabled
   - Exposed on ports 19530 and 9091
   - Depends on Etcd and MinIO
   - Authentication variables: MILVUS_USER, MILVUS_PASSWORD

6. **Redis**
   - Exposed on port 6379
   - Password authentication: REDIS_PASSWORD

7. **Nginx**
   - Reverse proxy with SSL termination
   - Exposed on ports 80 and 443
   - SSL configuration for myashes.ai domain

8. **Certbot**
   - Automatic SSL certificate generation
   - Let's Encrypt integration

### Environment Variables
Critical environment variables in `.env`:
- `OPENAI_API_KEY`: Used for AI features
- `MILVUS_USER` and `MILVUS_PASSWORD`: Vector database authentication
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`: Database credentials
- `REDIS_PASSWORD`: Redis authentication
- `NEXT_PUBLIC_API_URL`: Frontend API endpoint

### Database Migration Setup
The backend uses an entrypoint script (`entrypoint.sh`) that:
1. Waits for PostgreSQL to become available
2. Runs Alembic migrations automatically
3. Starts the FastAPI application

This ensures database schema is ready before application starts.

## Frontend Component Structure

### UI Components
The following UI components have been implemented in the `C:\Users\shaun\repos\ashes-of-creation-assistant\frontend\components\ui` directory:

- `alert/index.tsx`: Notification alerts
- `avatar/index.tsx`: User avatars with image and fallback
- `badge/index.tsx`: Status or category badges
- `button/index.tsx`: Various button styles
- `card/index.tsx`: Card containers with header/content/footer
- `checkbox/index.tsx`: Form checkboxes
- `dialog/index.tsx`: Modal dialogs
- `dropdown-menu/index.tsx`: Dropdown menus
- `input/index.tsx`: Form input fields
- `label/index.tsx`: Form labels
- `loading-spinner.tsx`: Loading indicator
- `progress/index.tsx`: Progress bars
- `separator/index.tsx`: Horizontal/vertical separators
- `switch/index.tsx`: Toggle switches
- `tabs/index.tsx`: Tabbed interfaces
- `theme-provider/index.tsx`: Dark/light theme provider

### Layout Components
- `layout/navbar.tsx`: Top navigation bar
- `layout/footer.tsx`: Page footer

### Auth Components
- `auth/require-auth.tsx`: Authentication guard for protected routes

### Page Components
The following pages have been implemented:

- `app/auth/login/page.tsx`: User login
- `app/auth/register/page.tsx`: User registration
- `app/auth/forgot-password/page.tsx`: Password reset request
- `app/profile/page.tsx`: User profile management
- `app/items/page.tsx`: Item database listing
- `app/items/[id]/page.tsx`: Item detail view
- `app/economy/page.tsx`: Economy tracker
- `app/builds/compare/page.tsx`: Build comparison tool

### State Management
- `stores/auth.ts`: Authentication state management with Zustand

### Utilities
- `lib/utils.ts`: Utility functions for UI components

### Next.js Configuration
The `next.config.js` includes:
- Output set to 'standalone' for Docker deployment
- API proxy configuration via rewrites
- Image domains whitelist for game resources

## Backend Structure

### API Endpoints
- Auth routes: `C:\Users\shaun\repos\ashes-of-creation-assistant\backend\app\api\v1\auth\router.py`
- User routes: `C:\Users\shaun\repos\ashes-of-creation-assistant\backend\app\api\v1\users\router.py`

### Database Models
- User models: `C:\Users\shaun\repos\ashes-of-creation-assistant\backend\app\models\user.py`

### Schemas
- Auth schemas: `C:\Users\shaun\repos\ashes-of-creation-assistant\backend\app\schemas\auth.py`
- User schemas: `C:\Users\shaun\repos\ashes-of-creation-assistant\backend\app\schemas\users.py`

### Core Functionality
- Security: `C:\Users\shaun\repos\ashes-of-creation-assistant\backend\app\core\security.py`
- Config: `C:\Users\shaun\repos\ashes-of-creation-assistant\backend\app\core\config.py`

### Database
- Base class: `C:\Users\shaun\repos\ashes-of-creation-assistant\backend\app\db\base_class.py`
- Session: `C:\Users\shaun\repos\ashes-of-creation-assistant\backend\app\db\session.py`

### Services
- Email service: `C:\Users\shaun\repos\ashes-of-creation-assistant\backend\app\services\email.py`
- Vector store: `C:\Users\shaun\repos\ashes-of-creation-assistant\backend\app\services\vector_store.py`

### CRUD Operations
- User operations: `C:\Users\shaun\repos\ashes-of-creation-assistant\backend\app\crud\users.py`

### Migrations
- Path: `C:\Users\shaun\repos\ashes-of-creation-assistant\backend\migrations`
- Initial migration: `C:\Users\shaun\repos\ashes-of-creation-assistant\backend\migrations\versions\initial_migration.py`
- Creates tables: users, user_preferences, saved_items, builds

### Deployment Configuration
- Dockerfile specifies CUDA base image for AI features
- Entrypoint script manages database initialization and application startup
- Required dependencies installed via requirements.txt

## Data Pipeline Structure

### Extractors
- Game client data: `C:\Users\shaun\repos\ashes-of-creation-assistant\data-pipeline\app\extractors\game_client_extractor.py`

### Processors
- Data validation: `C:\Users\shaun\repos\ashes-of-creation-assistant\data-pipeline\app\processors\validator.py`
- Text chunking: `C:\Users\shaun\repos\ashes-of-creation-assistant\data-pipeline\app\processors\chunker.py`

### Indexers
- Vector indexer: `C:\Users\shaun\repos\ashes-of-creation-assistant\data-pipeline\app\indexers\vector_indexer.py`
- Handles Milvus connections with authentication

### Scrapers
- Wiki scraper: `C:\Users\shaun\repos\ashes-of-creation-assistant\data-pipeline\app\scrapers\wiki_scraper.py`
- Codex scraper: `C:\Users\shaun\repos\ashes-of-creation-assistant\data-pipeline\app\scrapers\codex_scraper.py`
- Official website scraper: `C:\Users\shaun\repos\ashes-of-creation-assistant\data-pipeline\app\scrapers\official_website_scraper.py`

### Main Process
- Scheduled execution with configurable interval
- Initial full scrape followed by incremental updates
- Multi-step pipeline with logging

## Infrastructure and Deployment

### CI/CD Workflow
- GitHub Actions: `C:\Users\shaun\repos\ashes-of-creation-assistant\.github\workflows\ci-cd.yml`

### Deployment Scripts
- Manual deployment: `C:\Users\shaun\repos\ashes-of-creation-assistant\scripts\deployment\deploy.sh`
- Environment configs: 
  - `C:\Users\shaun\repos\ashes-of-creation-assistant\scripts\deployment\config.staging.sh`
  - `C:\Users\shaun\repos\ashes-of-creation-assistant\scripts\deployment\config.production.sh`

### Monitoring
- Setup script: `C:\Users\shaun\repos\ashes-of-creation-assistant\scripts\monitoring\setup-monitoring.sh`

### Backup
- Database backup: `C:\Users\shaun\repos\ashes-of-creation-assistant\scripts\backup\backup-database.sh`
- Backup configs: `C:\Users\shaun\repos\ashes-of-creation-assistant\scripts\backup\config.production.sh`

### Nginx Configuration
- SSL termination with Let's Encrypt
- Path: `C:\Users\shaun\repos\ashes-of-creation-assistant\nginx\conf\myashes.conf`
- Error pages: 404.html, 50x.html in `C:\Users\shaun\repos\ashes-of-creation-assistant\nginx\www`

## Database Schema

### Users Table
- id: Integer (PK)
- email: String (unique)
- username: String (unique)
- display_name: String
- hashed_password: String
- bio: Text
- is_active: Boolean
- is_verified: Boolean
- is_premium: Boolean
- created_at: DateTime
- updated_at: DateTime

### UserPreference Table
- id: Integer (PK)
- user_id: Integer (FK to users.id)
- email_notifications: Boolean
- discord_notifications: Boolean
- dark_mode: Boolean
- compact_layout: Boolean
- additional_preferences: JSON
- updated_at: DateTime

### SavedItem Table
- id: Integer (PK)
- user_id: Integer (FK to users.id)
- item_id: String
- notes: Text
- created_at: DateTime

### Build Table (Placeholder)
- id: Integer (PK)
- user_id: Integer (FK to users.id)
- name: String
- description: Text
- data: JSON
- is_public: Boolean
- created_at: DateTime
- updated_at: DateTime

## Authentication Flow

1. User registers with email, username, password
2. User confirms email (optional flow)
3. User logs in with email/password, receives JWT token
4. Token is stored in localStorage and included in Authorization header
5. Protected routes are wrapped with RequireAuth component
6. Token is automatically refreshed when needed
7. Password reset flow: request → email → reset page → password update

## Discord Bot Features

- Chat command: Answers player questions using AI
- Server command: Sets server context for user
- Reset command: Clears chat history
- Direct message support: Processes DMs as questions
- Enhanced slash commands: Multiple game-related commands
- Structured embeds: Formatted responses
- Pagination: For search results

## Dependencies

### Frontend Dependencies
- next
- react
- react-dom
- typescript
- tailwindcss
- @radix-ui/react-* (various UI components)
- lucide-react (icons)
- zustand (state management)
- recharts (charts and visualizations)
- class-variance-authority
- clsx
- tailwind-merge
- next-themes

### Backend Dependencies
- fastapi
- uvicorn
- sqlalchemy
- alembic
- pydantic
- python-jose[cryptography]
- passlib[bcrypt]
- aiohttp
- python-multipart
- redis
- loguru
- pymilvus
- openai
- sentence-transformers
- langchain
- langchain-openai
- psycopg2-binary
- email-validator

## Development Workflow

1. **Running Frontend**: 
   ```
   cd frontend
   npm install
   npm run dev
   ```

2. **Running Backend**:
   ```
   cd backend
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```

3. **Database Migrations**:
   ```
   cd backend
   alembic upgrade head
   ```

4. **Running with Docker**:
   ```
   cd docker
   docker-compose up -d
   ```

5. **Development with Docker**:
   ```
   cd docker
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
   ```

6. **Production Deployment**:
   ```
   cd docker
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

## Implementation Status and Next Steps

### Fully Implemented Components
- Authentication system (frontend & backend)
- User profile management
- Basic UI components
- Discord bot with slash commands
- CI/CD workflows
- Item database views
- Economy tracker
- Build comparison tool
- Data pipeline extractors and processors
- Docker environment with PostgreSQL, Milvus, Redis
- Database migration system
- Nginx configuration with SSL

### Components Needing Implementation or Improvement
- Chat interface backend API
- Vector search integration
- Build saving functionality
- Item filtering and search
- Resource map with interactive locations
- Crafting calculator
- Community features (comments, ratings)

### Known Issues and Gaps
- The application requires additional UI components in some sections
- Some frontend routes need to be protected with authentication
- Backend endpoints for item details and economy data need to be completed
- Vector search optimization required for better performance
- Database schema needs extensions for builds, items, and other game data

## Technical Details for Vector Search

The application uses a vector search approach for finding relevant game information:

1. Game content is chunked using the SmartChunker or HierarchicalChunker
2. Text chunks are embedded using OpenAI embeddings
3. Embeddings are stored in Milvus with metadata
4. User queries are embedded and compared against stored vectors
5. Results are ranked by cosine similarity and returned with context

## Docker Environment Details

### Milvus Configuration
- Authentication enabled with COMMON_SECURITY_ENABLED=true
- Credentials passed through environment variables
- Connection handled in vector_store.py and vector_indexer.py

### PostgreSQL Integration
- Database initialized through entrypoint script
- Alembic handles migrations automatically
- Connection parameters from environment variables

### Redis Configuration
- Password authentication required
- Used for caching and session storage

### Directory Structure
- `nginx/ssl`: SSL certificates
- `nginx/www`: Static files and error pages
- `nginx/letsencrypt`: Let's Encrypt certificates
- `data-pipeline/app/logs`: Log storage for data pipeline

## File Structure Conventions

- React components use PascalCase for filenames
- TypeScript interfaces and types use PascalCase
- Backend routes use snake_case
- API endpoints follow RESTful conventions
- Frontend pages are in the app directory using Next.js App Router structure
- UI components in dedicated component directories with index.tsx files

This document is for AI assistant use only to understand the complete MyAshes.ai project structure, implementation details, and technical specifics when continuing development. The information is presented in high technical detail specifically for AI comprehension, not for human readability.
