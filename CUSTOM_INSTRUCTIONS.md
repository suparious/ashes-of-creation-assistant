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
- **Environment Check**: Use `list_allowed_directories` to understand accessible file paths.

### Knowledge Graph Tools
Use these tools to document and maintain project architecture and game mechanics:
- **Creating Information**: `create_entities` to document game mechanics, UI components, and API endpoints; `create_relations` to map relationships between components; `add_observations` to add details about features.
- **Managing Information**: `delete_entities`, `delete_observations`, `delete_relations` to refine architecture documentation.
- **Retrieving Information**: `read_graph`, `search_nodes`, `open_nodes` to recall implementation details and design decisions.

### Web Tools
- **Search**: 
  - `brave_web_search` for game mechanics research and API documentation.
  - `brave_local_search` for finding location-specific information about game resources, events, or community meetups.
- **Web Automation**: Use Puppeteer tools for advanced data collection:
  - `puppeteer_navigate` to visit game websites and wikis
  - `puppeteer_screenshot` to capture UI references or game mechanics
  - `puppeteer_click`, `puppeteer_fill`, `puppeteer_select` for interacting with game sites
  - `puppeteer_evaluate` to extract structured data from wikis and forums
- **Content Fetching**: `fetch` for retrieving reference materials.

### Code Execution and Analysis
- **REPL**: Use the JavaScript REPL for testing frontend logic, data processing, and visualization prototypes:
  - Test data parsing and transformation from CSV or JSON files
  - Prototype chart visualizations before implementing in components
  - Verify authentication and API request flows
  - Test vector similarity algorithms for the search functionality
- **Artifacts**: Create artifacts for different aspects of the project:
  - Code artifacts for reusable components and API integrations
  - React artifacts for interactive UI prototypes
  - SVG artifacts for resource maps and game visualizations
  - Markdown artifacts for detailed documentation

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
2. Use Knowledge Graph to document discovered components and relationships
3. Use Web Search and Puppeteer to gather game mechanics information
4. Review related components in the codebase

### Design Phase
1. Plan changes consistent with the existing architecture
2. Use Knowledge Graph to map relationships between new and existing components
3. Create diagrams or mockups for complex features
4. Use REPL to prototype data structures and algorithms

### Implementation Phase
1. Use REPL to validate implementation approaches
2. Create artifacts for new components and integrations
3. Implement features incrementally with proper error handling
4. Document new components in the Knowledge Graph

### Testing Phase
1. Use REPL to test data processing and frontend logic
2. Use Puppeteer to validate web scraping functionality
3. Test with Docker environment where appropriate
4. Verify integration with existing components

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

## KNOWLEDGE GRAPH USAGE

1. **Document Architecture**:
   - Create entities for major components (Frontend, Backend, Data Pipeline)
   - Add relations between components to show dependencies
   - Document API endpoints and their relationships

2. **Game Mechanics Documentation**:
   - Create entities for game systems (Combat, Crafting, Economy)
   - Document relationships between game systems
   - Store observations about game mechanics for AI assistant reference

3. **Implementation Tracking**:
   - Create entities for features in development
   - Track implementation status and dependencies
   - Document design decisions and their rationales

## ARTIFACT USAGE

1. **Code Artifacts**:
   - Frontend components with proper TypeScript typing
   - Backend API endpoint implementations
   - Data processing pipelines

2. **React Artifacts**:
   - Interactive UI components for game mechanics
   - Build planner interface prototypes
   - Resource map visualizations

3. **SVG Artifacts**:
   - Game world maps with resource locations
   - Character skill trees and advancement paths
   - Economic system visualizations

4. **Markdown Artifacts**:
   - Detailed game mechanics documentation
   - Implementation guides for specific features
   - API documentation for backend services

## REPL BEST PRACTICES

1. **Data Processing**:
   - Prototype CSV and JSON parsing for game data
   - Test vector embedding and similarity algorithms
   - Validate data transformation pipelines

2. **Frontend Logic**:
   - Test state management logic
   - Prototype chart and visualization code
   - Verify form validation and submission

3. **API Integration**:
   - Simulate API requests and response handling
   - Test authentication flows
   - Validate error handling

4. **Debugging**:
   - Use console.log for step-by-step validation
   - Test edge cases and error conditions
   - Benchmark performance-critical operations

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

## PUPPETEER USAGE FOR DATA ACQUISITION

For gathering game data and keeping information current:
1. Use Puppeteer to navigate to official game sources and community wikis
2. Automate the extraction of game mechanics, item stats, and resource information
3. Take screenshots of relevant game UI for reference when implementing features
4. Use JavaScript evaluation to parse structured data from websites
5. Integrate extracted data into the vector database for AI assistant queries

By following these instructions, we can efficiently develop the MyAshes.ai assistant using Claude's capabilities and the full range of MCP tools. Always focus on providing fully functional, complete implementations that follow the established patterns and architecture of the project.
