# CUSTOM INSTRUCTIONS FOR ASHES OF CREATION ASSISTANT DEVELOPMENT

This document provides guidelines for using Claude and MCP tools to develop the MyAshes.ai project, an AI-powered assistant application for the MMORPG "Ashes of Creation."

## CRITICAL: WORKING WITH THE EXISTING CODEBASE

1. **ALWAYS explore the repository structure before making any changes**
   - Use `list_directory` and `directory_tree` to understand the current state
   - Review existing code before modifications to maintain consistency
   - Do NOT recreate files or directories that already exist

2. **Respect the established architecture**
   - Frontend: Next.js with App Router, TypeScript, Zustand, Tailwind CSS
   - Backend: Python FastAPI, SQLAlchemy, Alembic migrations, JWT authentication
   - Data Pipeline: Python, Milvus vector store, OpenAI embeddings
   - Infrastructure: Docker, PostgreSQL, Redis, Nginx
   - Follow existing patterns when adding new features

3. **Preserve existing functionality**
   - Ensure changes don't break working features
   - Use the REPL/analysis tool to validate before implementing in files
   - Add to the codebase, don't replace working components

## AVAILABLE TOOLS AND THEIR USAGE

### File System Operations
- **Reading Files**: Use `read_file` to examine individual files or `read_multiple_files` for batch operations.
- **Writing/Editing Files**: Use `write_file` for new content and `edit_file` for modifying existing files.
- **Directory Management**: Use `create_directory`, `list_directory`, and `directory_tree` to organize assets.
- **File Management**: Use `move_file`, `search_files`, and `get_file_info` as needed.

### Web Tools
Use these for research and reference:
- **Search**: `brave_web_search` for game mechanics research and API documentation.
- **Web Automation**: `puppeteer_*` tools for scraping game information when needed.
- **Content Fetching**: `fetch` for retrieving reference materials.

### Code Execution and Analysis
- **REPL**: Use the JavaScript REPL for testing frontend logic, data processing, and visualization prototypes.
- **Artifacts**: Create artifacts for code snippets, UI components, and visualization mockups.

## PROJECT OVERVIEW

MyAshes.ai combines game data with AI capabilities to enhance player experience through:
- Chat interface for answering game-related questions
- Character build planner
- Item database
- Crafting calculator
- Resource map
- Economy tracker
- Discord bot integration

## FILE ORGANIZATION

```
ashes-of-creation-assistant/
├── frontend/              # Next.js frontend application
│   ├── app/               # Next.js App Router pages
│   ├── components/        # React components
│   │   ├── ui/            # Base UI components 
│   │   └── layout/        # Layout components
│   ├── lib/               # Utility functions
│   └── stores/            # Zustand state management
├── backend/               # FastAPI backend
│   ├── app/               # Application code
│   │   ├── api/           # API endpoints
│   │   ├── core/          # Core functionality
│   │   ├── crud/          # Database operations
│   │   ├── db/            # Database connection
│   │   ├── models/        # SQLAlchemy models
│   │   ├── schemas/       # Pydantic schemas
│   │   └── services/      # Business logic services
│   └── migrations/        # Alembic database migrations
├── data-pipeline/         # Data processing pipeline
│   ├── app/               # Pipeline code
│   │   ├── extractors/    # Data extraction
│   │   ├── processors/    # Data processing
│   │   ├── indexers/      # Vector indexing
│   │   └── scrapers/      # Web scrapers
├── docker/                # Docker configuration
│   └── docker-compose.yml # Main docker compose file
└── scripts/               # Utility scripts
    ├── deployment/        # Deployment scripts
    └── monitoring/        # Monitoring setup
```

## DEVELOPMENT WORKFLOW

### Research Phase
1. Explore existing files to understand the current implementation
2. Review related components in the codebase
3. Document findings for reference

### Design Phase
1. Plan changes consistent with the existing architecture
2. Consider both frontend and backend requirements
3. Create diagrams or mockups for complex features

### Implementation Phase
1. Use the REPL to prototype and test logic
2. Write modular code with proper error handling
3. Implement features incrementally
4. Respect authentication requirements for protected features

### Testing Phase
1. Test with Docker environment where appropriate
2. Verify integration with existing components
3. Ensure proper error handling and edge cases

## CODING STANDARDS

1. **Frontend**:
   - React components: PascalCase filenames
   - TypeScript interfaces/types: PascalCase
   - CSS with Tailwind: Follow existing patterns
   - State management with Zustand: Follow established store patterns

2. **Backend**:
   - Python files: snake_case
   - API endpoints: RESTful conventions
   - Use Pydantic for data validation
   - Follow FastAPI best practices

3. **General**:
   - Use clear, descriptive variable and function names
   - Add comments for complex logic
   - Maintain separation of concerns
   - Document public APIs and interfaces

## ARTIFACT USAGE

1. Use code artifacts for standalone, reusable components
2. Use markdown artifacts for detailed documentation
3. Use React artifacts for interactive UI prototypes
4. Use SVG artifacts for visualization mockups

## REPL BEST PRACTICES

1. Use for prototyping data processing logic
2. Test frontend components before implementation
3. Use console.log for debugging and verification
4. Validate API response handling

## IMPLEMENTATION STATUS AND PRIORITIES

### Fully Implemented Components
- Authentication system (frontend & backend)
- User profile management
- Basic UI components
- Discord bot with slash commands
- CI/CD workflows
- Item database views
- Economy tracker
- Data pipeline extractors and processors
- Docker environment with PostgreSQL, Milvus, Redis
- Database migration system
- Nginx configuration with SSL

### Development Priorities
1. Chat interface backend API
2. Vector search integration
3. Build saving functionality
4. Item filtering and search
5. Resource map with interactive locations
6. Crafting calculator
7. Community features (comments, ratings)

## AUTHENTICATION FLOW

The application uses JWT-based authentication:
1. User registers/logs in and receives JWT token
2. Token stored in localStorage and included in Authorization header
3. Protected routes wrapped with RequireAuth component
4. Token automatically refreshed when needed

## VECTOR SEARCH IMPLEMENTATION

For AI features, the application uses vector search:
1. Game content chunked and embedded
2. Embeddings stored in Milvus with metadata
3. User queries embedded and compared against stored vectors
4. Results ranked by similarity and returned with context

By following these instructions, we can efficiently develop the MyAshes.ai assistant using Claude's capabilities and the MCP toolset. Always focus on providing fully functional, complete implementations that follow the established patterns and architecture of the project.
