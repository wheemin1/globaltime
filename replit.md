# TimeSync - Global Team Scheduling App

## Overview

TimeSync is a lightweight web application that helps global teams find optimal meeting times across different timezones. Users can create meeting rooms, set their availability in their local timezone, and view aggregated heatmaps showing when team members are collectively available. The application emphasizes simplicity, timezone awareness, and real-time collaboration without requiring WebSocket infrastructure.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development
- **UI Library**: Shadcn/UI components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and responsive design
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Mobile Support**: Responsive design with mobile-first approach using custom hooks

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Session Management**: Express sessions with PostgreSQL storage
- **API Design**: RESTful endpoints with standardized error handling

### Data Storage Solutions
- **Primary Database**: PostgreSQL (configured for Neon serverless)
- **ORM**: Drizzle ORM with schema-first approach
- **Migration Strategy**: Drizzle Kit for database migrations
- **In-Memory Fallback**: Memory storage implementation for development

## Key Components

### Core Entities
1. **Rooms**: Meeting containers with date ranges, time bounds, and host management
2. **Participants**: Users with names, timezones, and 168-bit availability strings
3. **Heatmaps**: Aggregated availability data across all participants

### UI Components
- **TimeGrid**: Interactive 24x7 grid for availability selection with drag support
- **HeatmapResults**: Visual representation of overlapping availability
- **TimezoneSelector**: Comprehensive timezone selection with common cities
- **ParticipantPanel**: User management and individual availability viewing

### Business Logic
- **Timezone Conversion**: Client-side timezone handling with UTC coordination
- **Availability Encoding**: 168-bit strings representing weekly availability
- **Heatmap Generation**: Real-time aggregation of participant availability
- **Best Slot Detection**: Algorithm to identify optimal meeting times

## Data Flow

1. **Room Creation**: Host creates room with date range and time constraints
2. **Participant Join**: Users join via URL, provide name and timezone
3. **Availability Input**: Drag-and-drop selection on localized time grid
4. **Data Persistence**: Availability stored as bit strings in PostgreSQL
5. **Heatmap Generation**: Server aggregates all participant data
6. **Real-time Updates**: Query invalidation provides fresh data on each interaction

## External Dependencies

### Core Framework Dependencies
- React ecosystem (React, ReactDOM, React Query)
- Express.js with TypeScript support
- Drizzle ORM with PostgreSQL driver (@neondatabase/serverless)

### UI Dependencies
- Radix UI primitives for accessible components
- Tailwind CSS for styling
- Lucide React for consistent iconography
- date-fns for date manipulation

### Development Dependencies
- Vite for build tooling with React plugin
- TypeScript for type safety
- PostCSS with Tailwind and Autoprefixer

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds optimized React bundle to `dist/public`
- **Backend**: ESBuild compiles TypeScript server to `dist/index.js`
- **Assets**: Static files served from build directory

### Environment Configuration
- **Database**: PostgreSQL connection via `DATABASE_URL` environment variable
- **Development**: Hot reloading with Vite middleware integration
- **Production**: Express serves static files and API routes

### Hosting Requirements
- Node.js runtime environment
- PostgreSQL database (Neon serverless recommended)
- Static file serving capability
- Environment variable support for database configuration

### Key Architectural Decisions

1. **Timezone Handling**: Client-side timezone conversion reduces server complexity while maintaining accuracy
2. **Bit String Encoding**: 168-character strings efficiently represent weekly availability patterns
3. **Memory Storage Fallback**: Development-friendly storage layer that mirrors production database interface
4. **Component Reusability**: Single TimeGrid component handles both input and display modes
5. **Mobile-First Design**: Responsive UI with progressive enhancement for larger screens