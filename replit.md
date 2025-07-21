# AXIOM Sentinel - Emergency Management System

## Overview

AXIOM Sentinel is a comprehensive emergency management platform that combines real-time disaster monitoring, AI-powered predictions, incident reporting, and route optimization. The system uses modern web technologies to provide a unified dashboard for emergency response teams and authorities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: Shadcn/UI components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Style**: RESTful endpoints with JSON responses
- **Storage**: In-memory storage implementation with interface for easy database swapping
- **Middleware**: Custom logging and error handling

### Development Setup
- **Monorepo Structure**: Shared code between client and server via `shared/` directory
- **Hot Reload**: Vite development server with HMR
- **TypeScript**: Strict type checking across the entire codebase

## Key Components

### 1. Dashboard Interface
- **Metrics Overview**: Real-time statistics display with trend indicators
- **Navigation Header**: Consistent branding and alert notifications
- **Responsive Layout**: Grid-based layout adapting to different screen sizes

### 2. Disaster Monitoring System
- **Real-time Heatmap**: Visual representation of disaster locations and intensity
- **Multi-source Data**: Integration capability for USGS and other disaster APIs
- **Activity Feed**: Chronological list of recent disasters with verification status

### 3. AI Prediction Engine
- **OpenAI Integration**: Advanced AI-powered earthquake prediction using GPT-4o
- **Multi-Source Data**: Real-time data from USGS, EMSC, and historical patterns
- **Scientific Analysis**: Seismological principles including Gutenberg-Richter law and plate tectonics
- **Confidence Scoring**: AI-generated reliability metrics with detailed reasoning
- **Model Metrics**: Real-time tracking of accuracy, precision, recall, and prediction counts
- **Continuous Learning**: Model training with new earthquake data for improved accuracy

### 4. Alert System
- **Real-time Alerts**: Active alert banner with dismissal functionality
- **Severity Classification**: High, medium, low priority alerts
- **Alert Management**: Create, display, and dismiss alerts

### 5. Incident Reporting
- **User Submissions**: Form-based incident reporting with validation
- **Verification Workflow**: Status tracking for incident verification
- **Geolocation Support**: Optional coordinate input for precise location

### 6. Route Optimization
- **Path Calculation**: Basic route optimization with disaster avoidance
- **Multiple Options**: Various routing strategies (distance, safety, major roads)
- **Risk Assessment**: Integration with disaster data for safer routing

## Data Flow

### 1. Data Collection
- External APIs (USGS earthquake data)
- User-submitted incident reports
- System-generated predictions and alerts

### 2. Data Processing
- Real-time validation and verification
- Machine learning analysis for predictions
- Risk assessment calculations

### 3. Data Storage
- In-memory storage with database interface abstraction
- Prepared for PostgreSQL with Drizzle ORM
- Schema definitions in shared module

### 4. Data Presentation
- Real-time updates via TanStack Query
- Interactive visualizations and charts
- Mobile-responsive interface

## External Dependencies

### Frontend Dependencies
- **UI Components**: Extensive Radix UI component library
- **Styling**: Tailwind CSS with PostCSS processing
- **Icons**: Lucide React icon library
- **Date Handling**: date-fns for temporal operations
- **Form Management**: React Hook Form with Zod validation

### Backend Dependencies
- **Database**: Drizzle ORM with PostgreSQL support (@neondatabase/serverless)
- **Validation**: Zod for runtime type checking
- **Session Management**: Connect-pg-simple for PostgreSQL sessions
- **Development**: tsx for TypeScript execution, esbuild for production builds

### External APIs
- **USGS Earthquake API**: Real-time seismic data
- **Extensible**: Architecture supports additional disaster data sources

## Deployment Strategy

### Development Environment
- **Replit Integration**: Specialized plugins for Replit development
- **Hot Reload**: Vite development server with Express middleware
- **Error Handling**: Runtime error overlay for debugging

### Production Build
- **Client Build**: Vite production build with optimizations
- **Server Build**: esbuild bundle for Node.js deployment
- **Static Assets**: Served via Express static middleware

### Database Strategy
- **Development**: In-memory storage for rapid prototyping
- **Production Ready**: Drizzle ORM configured for PostgreSQL
- **Migration System**: Drizzle Kit for schema management
- **Environment Variables**: DATABASE_URL for connection configuration

### Scalability Considerations
- **Modular Architecture**: Clean separation between frontend, backend, and data layers
- **Interface Abstractions**: Storage interface allows easy database switching
- **Stateless Design**: Server designed for horizontal scaling
- **Caching Strategy**: TanStack Query provides client-side caching

The system is designed to be both immediately functional for development and easily scalable for production deployment with minimal configuration changes.