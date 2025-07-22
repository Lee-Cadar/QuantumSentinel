# Deployment Guide for AXIOM Sentinel

This guide provides multiple deployment options for the AXIOM Sentinel earthquake monitoring system.

## Quick Deploy Options

### 1. Static HTML Deployment (Easiest)

For immediate deployment without server requirements:

1. Use the included `static-deploy.html` file
2. Upload to any static hosting service:
   - **GitHub Pages**: Upload to `gh-pages` branch
   - **Netlify**: Drag & drop the HTML file
   - **Vercel**: Import and deploy
   - **Firebase Hosting**: `firebase deploy`

**Features Available in Static Version:**
- Interactive earthquake map with real locations
- AI prediction generation (simulated)
- Real-time dashboard metrics
- Disaster news feed
- Responsive design for all devices

### 2. Full-Stack Deployment

For complete functionality with database and AI models:

#### Replit Deployment
1. Your Replit is already configured
2. Click the "Deploy" button in Replit
3. Choose "Autoscale" for production traffic
4. Configure environment variables if needed

#### Railway Deployment
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

#### Vercel Deployment
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

#### Heroku Deployment
```bash
# Create Heroku app
heroku create axiom-sentinel

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:mini

# Deploy
git push heroku main
```

## Environment Configuration

### Required Environment Variables

```env
DATABASE_URL=postgresql://user:password@host:port/database
NODE_ENV=production
```

### Optional Configuration

```env
VITE_API_URL=https://your-domain.com
SESSION_SECRET=your-secure-session-key
OLLAMA_URL=http://localhost:11434
PORT=5000
```

## Database Setup

### PostgreSQL (Required for full features)

1. **Create Database**: Set up PostgreSQL instance
2. **Configure URL**: Add `DATABASE_URL` to environment variables
3. **Run Migrations**: `npm run db:push`
4. **Verify**: `npm run db:studio`

### Supported Database Providers

- **Neon**: Serverless PostgreSQL (recommended)
- **Supabase**: PostgreSQL with additional features
- **Railway**: PostgreSQL with automatic backups
- **Amazon RDS**: Enterprise PostgreSQL
- **Google Cloud SQL**: Managed PostgreSQL

## Production Optimizations

### 1. Build Optimization

```bash
# Build for production
npm run build

# Serve static files
npm start
```

### 2. Performance Monitoring

- Enable compression middleware
- Configure CDN for static assets
- Set up health check endpoints
- Monitor database query performance

### 3. Security Configuration

```javascript
// Recommended security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
      scriptSrc: ["'self'", "https://cdn.tailwindcss.com"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
```

## Monitoring & Analytics

### Application Monitoring

```javascript
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

### Logging Configuration

```javascript
// Production logging
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

## Scaling Considerations

### Horizontal Scaling

- **Load Balancer**: Distribute traffic across multiple instances
- **Container Orchestration**: Use Docker with Kubernetes
- **Database Clustering**: PostgreSQL read replicas
- **CDN Integration**: CloudFlare or AWS CloudFront

### Vertical Scaling

- **CPU Optimization**: Increase processing power for AI models
- **Memory Allocation**: 2GB+ recommended for PyTorch operations
- **Storage**: SSD storage for database performance

## AI Model Deployment

### PyTorch Model

The PyTorch LSTM model runs in-process:
- **Memory**: 1-2GB RAM required
- **CPU**: Multi-core recommended
- **Storage**: Model checkpoints stored in database

### Ollama Integration

For local AI inference:
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull model
ollama pull llama3.2

# Start server
ollama serve
```

## Troubleshooting

### Common Issues

1. **Database Connection**: Verify `DATABASE_URL` format
2. **Build Failures**: Clear `node_modules` and reinstall
3. **Port Conflicts**: Configure `PORT` environment variable
4. **Memory Issues**: Increase container memory limits

### Debug Commands

```bash
# Check logs
npm run logs

# Database status
npm run db:studio

# Build verification
npm run build && npm start
```

## Backup & Recovery

### Database Backups

```bash
# Automated backup script
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

### Application State

- **Configuration**: Export environment variables
- **User Data**: Regular database backups
- **Model Checkpoints**: Store in persistent storage

## Support

For deployment assistance:
- Review the main README.md
- Check GitHub Issues
- Contact the development team

---

**Ready for production deployment with enterprise-grade monitoring and AI capabilities.**