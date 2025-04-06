# MyAshes.ai Backend

This is the backend API for the MyAshes.ai project, an AI-powered assistant for the Ashes of Creation MMORPG.

## Features

- User authentication and profile management
- Chat interface with AI assistant capabilities
- Character build planning and sharing
- Game data access (items, skills, locations)
- Vector search for semantic queries
- Discord bot integration

## Technology Stack

- FastAPI framework
- SQLAlchemy ORM with PostgreSQL
- Alembic for database migrations
- PyMilvus for vector database operations
- Redis for caching
- PyTorch and Sentence-Transformers for embeddings
- LangChain for AI features

## Installation

### Using Docker (Recommended)

The easiest way to run the backend is using the provided Docker setup:

```bash
cd ../docker
docker-compose up -d
```

This will start the entire application stack, including the backend, frontend, databases, and auxiliary services.

### Local Development

For local development without Docker:

1. Set up a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. For PyTorch with CUDA support:

```bash
# For CUDA 12.2 (adjust based on your CUDA version)
pip install torch==2.6.0 torchvision==0.16.0 torchaudio==2.1.0 --index-url https://download.pytorch.org/whl/cu122
```

4. Set up environment variables (create a `.env` file with required variables)

5. Run database migrations:

```bash
alembic upgrade head
```

6. Start the application:

```bash
uvicorn app.main:app --reload
```

## API Documentation

Once running, API documentation is available at:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Development Notes

### Dependencies

This project uses flexible version ranges for dependencies to simplify building while maintaining compatibility. The major versions are kept consistent with the original implementation to prevent breaking changes.

Key dependency groups:

1. **Web Framework**: FastAPI, Uvicorn, Pydantic
2. **Database**: SQLAlchemy, Alembic, psycopg2
3. **Vector Database**: PyMilvus
4. **AI/ML**: PyTorch, Sentence-Transformers, LangChain
5. **Auxiliary**: Redis, HTTPX, Discord.py

### PyTorch Installation

The PyTorch dependencies (torch, torchvision, torchaudio) have platform-specific wheels. It's recommended to install them using the official instructions from the PyTorch website based on your specific platform and CUDA version.

### Database Migrations

Database migrations are managed with Alembic. The initial migration creates the base schema including:

- Users table
- User preferences table
- Saved items table
- Character builds table

Run migrations with:

```bash
cd backend
alembic upgrade head
```

## Troubleshooting

### PyTorch CUDA Issues

If you encounter CUDA-related errors with PyTorch:

1. Verify your CUDA installation: `nvidia-smi`
2. Install the appropriate PyTorch version for your CUDA version
3. Consider using the CPU-only version if GPU is not required

### Database Connection Issues

If you encounter database connection errors:

1. Verify PostgreSQL is running
2. Check connection settings in environment variables
3. Ensure the database exists and is accessible

### Milvus Issues

For Milvus vector database issues:

1. Verify Milvus service is running
2. Check that authentication credentials are correct
3. Ensure the collection exists or is created on startup

## Contributing

When contributing to the backend, please follow these guidelines:

1. Use the established project structure and patterns
2. Maintain compatibility with existing APIs
3. Add appropriate tests for new features
4. Document API endpoints and data models
5. Follow the PEP 8 style guide for Python code
