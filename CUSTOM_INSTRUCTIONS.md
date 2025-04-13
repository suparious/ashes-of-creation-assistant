# Ashes of Creation Assistant Developer Instructions

You are aiding with the development of the MyAshes.ai project, an AI-powered assistant application for the MMORPG "Ashes of Creation." Your goal is to help implement and improve this application while following the established architecture and patterns.

## Project Overview

MyAshes.ai combines game data with AI capabilities to enhance player experience through:
- Chat interface for answering game-related questions
- Character build planner
- Item database
- Crafting calculator
- Resource map
- Economy tracker
- Discord bot integration

## Technical Architecture

### Frontend
- **Framework**: Next.js 13+ with App Router
- **Language**: TypeScript
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **UI Components**: Custom components built on Radix UI (shadcn/ui pattern)

### Backend
- **Framework**: Python FastAPI
- **Database ORM**: SQLAlchemy
- **Migrations**: Alembic
- **Authentication**: JWT-based with token refresh

### Data Pipeline
- **Vector Store**: Milvus
- **Embedding Model**: OpenAI embeddings
- **Scrapers**: Wiki, Codex, Official website

### Infrastructure
- **Containerization**: Docker
- **CI/CD**: GitHub Actions workflows
- **Database**: PostgreSQL
- **Vector Database**: Milvus with authentication
- **Caching**: Redis
- **Web Server**: Nginx as reverse proxy with SSL

## Working Methods

In each conversation:

1. **Explore First**: Before implementing or modifying features, explore relevant files to understand the current implementation
2. **Explain Approach**: Outline your approach before making significant changes
3. **Implement Incrementally**: Implement changes using the filesystem tools, focusing on compatibility with the existing architecture
4. **Document**: Document any new components you create
5. **Be Explicit**: Specify which files you're examining to provide context

## Best Practices

1. **Examine existing code** before making changes to understand patterns and conventions
2. **Check dependencies** to ensure compatibility when adding new features
3. **Follow the established architecture** - don't mix concerns between layers
4. **Use Docker** for testing changes in an isolated environment
5. **Consider vector search** when implementing AI-powered features

## Implementation Status

### Fully Implemented
- Authentication system
- User profile management
- Basic UI components
- Discord bot with slash commands
- CI/CD workflows
- Item database views
- Economy tracker
- Data pipeline extractors
- Docker environment setup

### Needs Implementation/Improvement
- Chat interface backend API
- Vector search integration
- Build saving functionality
- Item filtering and search
- Resource map with interactive locations
- Crafting calculator
- Community features (comments, ratings)

## File Structure Conventions

- React components: PascalCase filenames
- TypeScript interfaces/types: PascalCase
- Backend routes: snake_case
- API endpoints: RESTful conventions
- Frontend pages: Next.js App Router structure
- UI components: Dedicated component directories with index.tsx files

## When Working with Features

For each feature you help implement:
1. First understand the current state by exploring relevant files
2. Identify which architectural components need modification
3. Check for similar patterns in the existing codebase
4. Make changes consistent with the established patterns
5. Consider authentication requirements for protected features
6. Ensure proper error handling
7. Consider both frontend and backend requirements

## Database Schema Overview

Key tables include:
- **Users**: Authentication and profile information
- **UserPreference**: User settings and preferences
- **SavedItem**: User's saved game items
- **Build**: Character build information (placeholder)

## Development Workflow

When suggesting workflow steps, remember the repository follows these patterns:

1. **Frontend Development**:
   ```
   cd frontend
   npm install
   npm run dev
   ```

2. **Backend Development**:
   ```
   cd backend
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```

3. **Docker Development**:
   ```
   cd docker
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
   ```

## Authentication Flow

The application uses JWT-based authentication:
1. User registers/logs in and receives JWT token
2. Token stored in localStorage and included in Authorization header
3. Protected routes wrapped with RequireAuth component
4. Token automatically refreshed when needed

## Vector Search Implementation

For AI features, the application uses vector search:
1. Game content chunked and embedded
2. Embeddings stored in Milvus with metadata
3. User queries embedded and compared against stored vectors
4. Results ranked by similarity and returned with context

Always optimize and provide fully functional, complete implementations that follow the established patterns and architecture of the project.
