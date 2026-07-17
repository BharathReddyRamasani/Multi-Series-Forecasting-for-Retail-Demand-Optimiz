# Production Deployment Checklist

## ✅ Pre-Deployment Verification

### 1. Application Health
- [ ] Health endpoint returns `{"status":"healthy","model_loaded":true}`
- [ ] All API endpoints respond correctly
- [ ] Forecasting service generates predictions with confidence intervals
- [ ] Explainability endpoint works correctly

### 2. Model Verification
- [ ] All models (LightGBM, XGBoost, RandomForest) loaded successfully
- [ ] Model files have recent timestamps (from today's training)
- [ ] Feature importance files present and valid
- [ ] Metrics files contain expected values (RMSE, MAE, R², etc.)

### 3. Configuration
- [ ] Environment variables properly set (ENV=production)
- [ ] CORS origins configured for production domains
- [ ] Rate limiting enabled
- [ ] Request ID middleware active
- [ ] GZIP compression enabled
- [ ] Trusted host middleware configured

### 4. Security
- [ ] No sensitive data in logs
- [ ] JWT secret properly configured via environment
- [ ] Password hashing configured (bcrypt)
- [ ] Input validation on all endpoints
- [ ] File upload limits enforced (50MB max)
- [ ] CSV upload validation active

### 5. Performance
- [ ] Response times under 200ms for API endpoints
- [ ] Prediction latency under 5ms
- [ ] Memory usage under 1.5GB
- [ ] CPU usage under 2 cores
- [ ] GZIP compression reducing payload sizes

### 6. Observability
- [ ] Prometheus metrics endpoint exposed at `/metrics`
- [ ] Structured logging configured (JSON format in production)
- [ ] Request tracing with X-Request-ID headers
- [ ] Error tracking via exception handlers
- [ ] Health checks include dependency verification

### 7. Data Persistence
- [ ] SQLite database file accessible and writable
- [ ] Forecast history table functional
- [ ] Model artifacts stored in `/models/v2/`
- [ ] Upload directory writable (if used)
- [ ] Backup strategy documented

### 8. Docker Specific
- [ ] Multi-stage build successful
- [ ] Frontend built and served as static files
- [ ] Non-root user (node/python) for security
- [ ] Proper exposure of port 8000
- [ ] Healthcheck configured for container orchestration
- [ ] Resource limits set (CPU/Memory)
- [ ] Logging configured for container ingestion

### 9. Kubernetes/Orchestration Ready
- [ ] Liveness and readiness probes defined
- [ ] Resource requests/limits specified
- [ ] ConfigMaps/Secrets pattern documented
- [ ] PersistentVolume claims for data/storage
- [ ] Service and Ingress configurations ready

### 10. Post-Deployment Validation
- [ ] Smoke test critical user journeys
- [ ] Verify model predictions remain accurate
- [ ] Check log aggregation working
- [ ] Confirm alerting thresholds configured
- [ ] Validate backup/restore procedures
- [ ] Test scaling behavior (if applicable)

## 🚀 Deployment Commands

### Development
```bash
docker-compose -f docker-compose.yml up --build
```

### Production
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Manual Docker Build
```bash
docker build -t demandai:latest .
docker run -d \
  --name demandai \
  -p 8000:8000 \
  -e ENV=production \
  -v $(pwd)/models:/app/models:ro \
  -v $(pwd)/backend/forecast.db:/app/forecast.db:rw \
  demandai:latest
```

## 📋 Environment Variables Required

| Variable | Description | Default |
|----------|-------------|---------|
| `ENV` | Environment (development/production) | development |
| `PORT` | Server port | 8000 |
| `HOST` | Server host | 0.0.0.0 |
| `WORKERS` | Number of Gunicorn workers | 4 |
| `CORS_ORIGINS` | Comma-separated allowed origins | http://localhost:3000 |
| `RPM_LIMIT` | Requests per minute per IP | 120 |
| `SECRET_KEY` | JWT secret key | **REQUIRED** |
| `ALGORITHM` | JWT algorithm | HS256 |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiry | 30 |

## 🔧 Post-Deployment Tasks

1. **Monitor first 24 hours**:
   - Check error rates (< 1%)
   - Monitor latency (p95 < 500ms)
   - Track model prediction drift
   - Review security logs

2. **Set up alerts**:
   - High error rate (> 5%)
   - Elevated latency (p95 > 1s)
   - Model performance degradation
   - Resource exhaustion (CPU > 80%, Memory > 85%)

3. **Capacity planning**:
   - Track concurrent users
   - Monitor request per second
   - Plan for peak load testing 500 RPM per instance

4. **Maintenance windows**:
   - Schedule weekly model retraining
   - Plan for dependency updates
   - Database backup verification

## 📞 Emergency Procedures

### High Error Rate
1. Check logs for patterns
2. Verify model loading status
3. Check database connectivity
4. Rollback to previous version if needed

### Performance Degradation
1. Check resource utilization (CPU/Memory)
2. Review slow query logs
3. Consider horizontal scaling
4. Check for memory leaks

### Data Issues
1. Verify database integrity
2. Check upload directory permissions
3. Validate incoming data schema
4. Confirm ETL pipeline health

---
**Last Updated**: $(date)
**Version**: 1.0.0
**Status**: Ready for Production Deployment
