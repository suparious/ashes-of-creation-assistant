# MyAshes.ai - AI-Powered Assistant for Ashes of Creation

MyAshes.ai is a comprehensive AI-powered companion app for the MMORPG game Ashes of Creation. The application provides a chat interface, character build planner, item database, crafting calculator, resource map, and more to help players optimize their gameplay experience.

## Features

- **AI Assistant**: Chat with an AI that understands game mechanics and can answer questions about Ashes of Creation
- **Character Build Planner**: Create, save, and share character builds
- **Item Database**: Search and explore all items in the game
- **Crafting Calculator**: Plan your crafting activities and calculate costs
- **Resource Map**: Find gathering locations for resources
- **Economy Tracker**: Monitor server economies and track resource prices
- **Discord Bot Integration**: Access all the features directly from Discord

## Architecture

The application consists of several components:

1. **Frontend**: Next.js, React, TypeScript, and Tailwind CSS
2. **Backend API**: Python FastAPI
3. **Data Pipeline**: Python scrapers and vector indexing
4. **Discord Bot**: Python-based bot integration
5. **Authentication System**: JWT-based user authentication
6. **Vector Store**: Milvus for semantic search

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local frontend development)
- Python 3.10+ (for local backend development)
- OpenAI API key

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/ashes-of-creation-assistant.git
   cd ashes-of-creation-assistant
   ```

2. Create a `.env` file based on the example:
   ```
   cp docker/.env.example docker/.env
   ```

3. Update the `.env` file with your configuration:
   - Set your OpenAI API key
   - Configure database credentials
   - Set other environment variables as needed

4. Start the application with Docker Compose:
   ```
   cd docker
   docker-compose up -d
   ```

5. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## Development

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at http://localhost:3000.

### Backend Development

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The backend API will be available at http://localhost:8000.

### Database Migrations

```bash
cd backend
alembic upgrade head  # Apply all migrations
alembic revision --autogenerate -m "Description"  # Create a new migration
```

## Authentication System

The application uses a JWT-based authentication system:

1. **Registration**: Create an account with email, username, and password
2. **Login**: Authenticate and receive a JWT token
3. **Password Reset**: Request a password reset link via email
4. **Profile Management**: Update profile information and preferences

### JWT Security

- Access tokens expire after 60 minutes
- Password reset tokens expire after 24 hours
- All endpoints requiring authentication use Bearer token scheme

## Deployment

### Production Deployment

1. Update the production configuration in `docker/docker-compose.prod.yml`
2. Deploy using the provided CI/CD workflow or manually:
   ```
   ./scripts/deployment/deploy.sh production
   ```

### Staging Deployment

```bash
./scripts/deployment/deploy.sh staging
```

## Monitoring and Maintenance

- Monitoring is set up using Prometheus and Grafana
- Database backups run daily and are stored in S3
- Log files are rotated and monitored

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- The Ashes of Creation community for their contributions and feedback
- Intrepid Studios for creating Ashes of Creation
