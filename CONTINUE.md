# MyAshes.ai Project Context and Continuation Guide

## Project Overview
MyAshes.ai is an AI-powered assistant application for the MMORPG game "Ashes of Creation." The project combines data from the game with AI capabilities to provide players with a comprehensive companion app including a chat interface, character build planner, item database, crafting calculator, resource map, economy tracker, and more.

## Architecture and Stack
The project follows a modern, containerized microservice architecture:

1. **Frontend**: Next.js 13+ (App Router), React, TypeScript, Tailwind CSS
   - UI components built with shadcn/ui
   - State management using Zustand
   - Authentication with JWT stored in localStorage

2. **Backend**: Python FastAPI
   - RESTful API endpoints
   - JWT authentication
   - Database ORM with SQLAlchemy
   - Database migrations with Alembic

3. **Data Pipeline**: Python
   - Data scraping and processing
   - Vector embeddings with semantic search
   - Integration with game client data

4. **Authentication System**: 
   - JWT-based auth
   - User registration, login, password reset
   - Profile management
   - Preference persistence

5. **Infrastructure**:
   - Docker containerization
   - CI/CD workflows with GitHub Actions
   - Monitoring with Prometheus/Grafana
   - Database backups to S3

## Current Implementation Status

### Completed Components:

1. **Frontend Pages and Features**:
   - Main application layout
   - Chat interface
   - Authentication UI (login, register, forgot password)
   - Profile management
   - Item database list view
   - Item detail page
   - Economy tracker
   - Build comparison tool
   - Navigation and responsive design

2. **Backend API Endpoints**:
   - Authentication system (register, login, token refresh)
   - User management (profile, preferences)
   - Chat functionality with vector search
   - Item data retrieval

3. **Authentication System**:
   - JWT token generation and validation
   - Password hashing and verification
   - User registration and login flows
   - Password reset functionality
   - Profile management

4. **Infrastructure**:
   - Docker setup for development and production
   - CI/CD workflow configuration
   - Database migration system
   - Deployment scripts
   - Monitoring configuration
   - Backup scripts

5. **Discord Bot**:
   - Basic bot structure
   - Chat integration with AI
   - Enhanced slash commands
   - Embed formatting for responses
   - Pagination for search results

### Components Requiring Additional Work:

1. **Data Pipeline Enhancement**:
   - More sophisticated chunking strategies
   - Data validation and normalization
   - Optimized indexing for vector search
   - Game client data extraction
   - Regular data update workflows

2. **Feature Completion**:
   - Advanced filtering for items and builds
   - User build saving and sharing
   - Community features (comments, ratings)
   - Premium membership features
   - Server-specific data handling

3. **Performance Optimization**:
   - Caching strategies
   - Query optimization
   - Image optimization and CDN integration
   - SSR/SSG optimization for critical pages

## Database Models

Key database models include:

- **User**: Authentication and profile data
- **UserPreference**: User settings and preferences
- **SavedItem**: User-saved game items
- **Build**: Character builds created by users

Database migrations are handled through Alembic, with the initial migration setting up the core tables.

## Authentication Flow

1. User registers or logs in, receiving a JWT token
2. Token is stored in localStorage and included in the Authorization header
3. Protected routes are wrapped with RequireAuth component
4. Token is refreshed automatically when needed
5. User preferences and settings are stored in the database

## Project Structure Highlights

- `/frontend`: Next.js application
  - `/app`: Application routes using App Router
  - `/components`: Reusable UI components
  - `/stores`: Zustand state management
  - `/data`: Static data files

- `/backend`: FastAPI application
  - `/app`: API implementation
  - `/api`: API routes and endpoints
  - `/models`: Database models
  - `/schemas`: Pydantic schemas
  - `/services`: Business logic services
  - `/core`: Core functionality (auth, config)

- `/data-pipeline`: Data processing services
  - `/app`: Pipeline implementation
  - `/processors`: Data transformation logic
  - `/scrapers`: Web scrapers for game data
  - `/extractors`: Game client data extraction

- `/scripts`: Utility scripts
  - `/deployment`: Deployment automation
  - `/backup`: Backup procedures
  - `/monitoring`: Monitoring setup

- `/docker`: Docker configuration
  - Docker Compose files for different environments

## Approach to Continue Development

When approaching continued development:

1. **Understand Current State**: For a new feature request, first assess what components already exist and what needs to be added or modified.

2. **Check Frontend/Backend Integration**: Ensure any new frontend features have corresponding backend endpoints, and vice versa.

3. **Maintain Architecture Patterns**: Follow established patterns for feature implementation:
   - Frontend: Create pages in the app directory, utilize Zustand for state, use shadcn/ui components
   - Backend: Implement with FastAPI endpoints, SQLAlchemy models, Pydantic schemas, and service layer for business logic

4. **Authentication Awareness**: Remember that most features should respect the authentication system, with appropriate permissions and user-specific data.

5. **Database Considerations**: For features requiring database changes, create Alembic migrations to maintain schema integrity.

6. **Docker Integration**: Ensure new services or dependencies are properly reflected in Docker configuration.

## Vector Search Implementation

The application uses Milvus as the vector database for semantic search:

1. Text from game data is chunked and embedded using OpenAI embeddings
2. Vectors are stored in Milvus with metadata
3. User queries are embedded and matched against the knowledge base
4. Results are retrieved with contextual information preserved

## Next Steps

Priority features to implement next:

1. Complete the data pipeline enhancement for efficient content extraction and indexing
2. Finalize the build planner with save/load functionality
3. Implement the community features for build sharing and commenting
4. Build the crafting calculator with real-time economic data
5. Create the resource map with interactive locations

## Troubleshooting Common Issues

- **Authentication Issues**: Check JWT token expiration and refresh mechanisms
- **Frontend/Backend Integration**: Verify API endpoint URLs and response formats
- **Docker Deployment**: Ensure environment variables are properly passed to containers
- **Database Migrations**: Run migrations before starting services after schema changes

## Working With This Repository

To continue development:

1. Understand the requirements of the specific feature requested
2. Identify relevant components in the codebase to modify or extend
3. Check for existing implementations of similar features for patterns
4. Implement both frontend and backend aspects of the feature
5. Consider test cases and potential edge conditions
6. Ensure compatibility with the authentication system where appropriate
7. Document any new API endpoints or configurations

This guide should serve as a comprehensive reference for continuing work on the MyAshes.ai project, providing necessary context on architecture, implemented features, and best practices.
