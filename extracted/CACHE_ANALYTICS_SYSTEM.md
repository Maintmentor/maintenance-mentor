# Cache Analytics & Monitoring System

## Overview
Comprehensive analytics and alerting system for monitoring image cache performance, identifying issues, and optimizing cache efficiency.

## Features

### 📊 Analytics Dashboard
- **Real-time Metrics**: Hit rate, response times, storage usage
- **Historical Charts**: Hourly hits/misses over 7 days
- **Performance Comparison**: Cache vs API response times
- **Top Queries**: Most frequently cached searches
- **Speedup Calculation**: How much faster cache is vs API

### 🔔 Automated Alerting
- **Low Hit Rate Alerts**: When cache hit rate drops below threshold (default: 60%)
- **High Response Time Alerts**: When cache responses are too slow (default: >1000ms)
- **Storage Limit Alerts**: When approaching storage capacity (default: 1GB)
- **API Error Alerts**: When too many API failures occur (default: >10/hour)

### ⚡ Cache Prewarming
- **Manual Prewarming**: Prewarm cache with custom queries
- **Automated Weekly Prewarming**: GitHub Action runs every Sunday
- **Popular Queries**: Default list of common repair parts
- **Custom Query Lists**: Add your own frequently searched items

### 🤖 Automated Monitoring
- **Performance Checks**: Run every 6 hours via GitHub Actions
- **Automatic Alert Creation**: Creates database alerts when thresholds exceeded
- **Daily Cleanup**: Removes expired cache entries automatically

## Setup

### 1. Database Tables
The migration creates these tables:
- `image_cache`: Stores cached image metadata
- `image_cache_analytics`: Tracks all cache events (hits, misses, response times)
- `cache_alerts`: Stores performance alerts

Add cache_alerts table:
```sql
CREATE TABLE IF NOT EXISTS cache_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  threshold NUMERIC NOT NULL,
  current_value NUMERIC NOT NULL,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cache_alerts_created ON cache_alerts(created_at DESC);
CREATE INDEX idx_cache_alerts_severity ON cache_alerts(severity);
```

### 2. Access Admin Dashboard
Navigate to `/admin` → "Perf" tab to view:
- Cache analytics dashboard
- Performance charts
- Hit/miss statistics
- Response time comparisons

### 3. Configure Alerts
Navigate to `/admin` → "C-Alerts" tab to:
- Set alert thresholds
- View alert history
- Configure notification preferences

### 4. Enable Automated Monitoring
GitHub Actions are already configured:
- `cache-performance-monitoring.yml`: Runs every 6 hours
- `cache-prewarming.yml`: Runs weekly on Sundays
- `image-cache-cleanup.yml`: Runs daily at 2 AM

Make sure these secrets are set in GitHub:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`

## Using the Analytics

### View Cache Performance
```typescript
import { imageCacheService } from '@/services/imageCacheService';

const stats = await imageCacheService.getCacheStats();
console.log(`Hit Rate: ${stats.cacheHitRate}%`);
console.log(`Avg Response: ${stats.avgResponseTime}ms`);
console.log(`Storage Used: ${stats.totalStorageUsed} bytes`);
```

### Check for Alerts
```typescript
import { cacheAlertService } from '@/services/cacheAlertService';

const alerts = await cacheAlertService.checkAndCreateAlerts();
alerts.forEach(alert => {
  console.log(`${alert.severity}: ${alert.message}`);
});
```

### Prewarm Cache
```typescript
const queries = ['water heater', 'furnace filter', 'thermostat'];
for (const query of queries) {
  await imageCacheService.getImage(query);
}
```

## Alert Thresholds

Default thresholds (customizable in admin panel):

| Metric | Warning | Critical |
|--------|---------|----------|
| Hit Rate | < 60% | < 40% |
| Response Time | > 1000ms | > 2000ms |
| Storage Usage | > 1GB | > 1.2GB |
| API Errors | > 10/hour | > 20/hour |

## Performance Optimization Tips

### Improve Hit Rate
1. Enable cache prewarming for popular queries
2. Increase cache expiration time (default: 30 days)
3. Review top queries and ensure they're being cached
4. Check for query variations (e.g., "water heater" vs "waterheater")

### Reduce Response Time
1. Ensure Supabase storage bucket is in same region
2. Check database indexes are created
3. Monitor cache table size (add cleanup if needed)
4. Consider CDN for cached images

### Manage Storage
1. Run cleanup more frequently
2. Reduce cache expiration time
3. Delete unused cached images
4. Implement image compression

## Monitoring Checklist

Daily:
- [ ] Check cache hit rate (should be > 60%)
- [ ] Review any new alerts
- [ ] Verify cleanup job ran successfully

Weekly:
- [ ] Review top cached queries
- [ ] Check storage usage trends
- [ ] Verify prewarming job completed
- [ ] Analyze response time trends

Monthly:
- [ ] Review and adjust alert thresholds
- [ ] Optimize cache expiration settings
- [ ] Clean up old analytics data
- [ ] Update prewarming query list

## Troubleshooting

### Low Hit Rate
**Symptoms**: Hit rate below 60%
**Causes**:
- Too many unique queries (not enough repeat searches)
- Cache expiring too quickly
- Users searching with different query formats

**Solutions**:
- Normalize queries (lowercase, trim spaces)
- Increase expiration time
- Implement query suggestions to guide users

### High Response Times
**Symptoms**: Cache responses > 1000ms
**Causes**:
- Database performance issues
- Large cache table size
- Network latency

**Solutions**:
- Add database indexes
- Archive old analytics data
- Optimize storage bucket location

### Storage Limit Alerts
**Symptoms**: Approaching storage capacity
**Causes**:
- Too many cached images
- Large image file sizes
- Infrequent cleanup

**Solutions**:
- Run cleanup more often
- Implement image compression
- Reduce cache expiration time
- Delete low-hit-count images

## API Reference

### imageCacheService
```typescript
// Get or fetch image with caching
getImage(query: string, forceRefresh?: boolean): Promise<string>

// Get cache statistics
getCacheStats(): Promise<CacheAnalytics>

// Get all cached images
getCachedImages(limit?: number): Promise<CachedImage[]>

// Clear expired entries
clearExpiredCache(): Promise<number>

// Delete specific cached image
deleteCachedImage(cacheKey: string): Promise<void>

// Refresh cached image
refreshImage(query: string): Promise<string>
```

### cacheAlertService
```typescript
// Check metrics and create alerts
checkAndCreateAlerts(): Promise<CacheAlert[]>
```

## Cost Analysis

### Without Cache
- 10,000 searches/month
- $5 per 1,000 Google API calls
- **Cost: $50/month**

### With Cache (80% hit rate)
- 10,000 searches/month
- 2,000 API calls (20% miss rate)
- $5 per 1,000 calls
- **Cost: $10/month**
- **Savings: $40/month (80%)**

Plus:
- 5-10x faster response times
- Better user experience
- Reduced API rate limiting issues
