# Docker Setup for Cell Site Mapping Application

This repository contains Docker configuration for running the Cell Site Mapping Application in containers.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Services

The application consists of the following services:

1. **Client**: React frontend application
2. **Server**: Node.js backend API
3. **PostgreSQL**: Database with PostGIS extension for geospatial data
4. **Redis**: Cache for improved performance

## Getting Started

### Building and Running the Application

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd MappingProject
   ```

2. **Important**: Stop any local PostgreSQL server before starting the Docker containers:
   ```bash
   # For macOS with Homebrew
   brew services stop postgresql@14
   
   # For Linux
   sudo service postgresql stop
   
   # For Windows
   net stop postgresql
   ```

3. Start the application using Docker Compose:
   ```bash
   docker-compose up -d
   ```

   This will:
   - Build the client and server images
   - Start all services
   - Initialize the database with required tables and seed data
   - Make the application available at http://localhost

3. To view logs:
   ```bash
   docker-compose logs -f
   ```

4. To view logs for a specific service:
   ```bash
   docker-compose logs -f client
   docker-compose logs -f server
   docker-compose logs -f postgres
   docker-compose logs -f redis
   ```

### Stopping the Application

To stop the application:
```bash
docker-compose down
```

To stop the application and remove volumes (this will delete all data):
```bash
docker-compose down -v
```

## Development Workflow

### Rebuilding Services

If you make changes to the code, you'll need to rebuild the services:

```bash
docker-compose build client server
docker-compose up -d
```

### Accessing the Database

You can connect to the PostgreSQL database using:

```bash
docker-compose exec postgres psql -U cellmapper -d cellmapper
```

### Accessing Redis

You can connect to Redis using:

```bash
docker-compose exec redis redis-cli
```

## Configuration

### Environment Variables

The application uses configuration files for different environments:

- Server configuration is in `server/config/docker.json`
- Database credentials are defined in the `docker-compose.yml` file

## Troubleshooting

### Container Health Checks

The PostgreSQL and Redis containers have health checks configured. You can check their status with:

```bash
docker-compose ps
```

### Viewing Container Logs

If you encounter issues, check the container logs:

```bash
docker-compose logs -f
```

### Restarting Services

To restart a specific service:

```bash
docker-compose restart server
```
