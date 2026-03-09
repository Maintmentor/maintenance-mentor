# Domain Health Monitoring System

## Overview
Automated domain health monitoring dashboard for maintenancementor.io with real-time checks for DNS, SSL, redirects, uptime, and performance metrics.

## Features

### Real-Time Monitoring
- **DNS Propagation Status**: Checks if domain resolves correctly
- **SSL Certificate Validation**: Monitors certificate validity and expiration
- **Redirect Functionality**: Verifies WWW to non-WWW redirects
- **Uptime Monitoring**: Continuous availability checks
- **Performance Metrics**: Response time tracking

### Alert System
- SSL certificate expiring within 30 days
- DNS configuration changes detected
- Website downtime detection
- Slow response times (>3000ms)
- Failed redirect configurations

### Visual Status Dashboard
- **Green**: All systems operational
- **Yellow**: Warning - attention needed
- **Red**: Critical - immediate action required

## Database Tables

### domain_health_checks
Stores all health check results:
- `check_type`: dns, ssl, redirect, uptime, performance
- `status`: healthy, warning, critical
- `details`: JSON with specific check information
- `response_time`: Milliseconds for performance tracking

### ssl_certificates
Tracks SSL certificate status:
- `valid_from`: Certificate start date
- `valid_until`: Expiration date
- `days_until_expiry`: Countdown to expiration

### domain_alerts
Alert history and management:
- `alert_type`: Type of alert triggered
- `severity`: info, warning, critical
- `resolved`: Alert resolution status

## Edge Function

### domain-health-monitor
Performs comprehensive health checks:
```typescript
// Invoke from frontend
const { data } = await supabase.functions.invoke('domain-health-monitor', {
  body: { domain: 'maintenancementor.io' }
});
```

**Checks performed:**
1. DNS resolution with 5s timeout
2. HTTPS/SSL validation
3. WWW redirect verification
4. Uptime status check
5. Response time measurement

## Access Dashboard

Navigate to: **Admin Dashboard → Domain Health Tab**

## Monitoring Schedule
- Automatic checks every 5 minutes
- Manual refresh available
- Real-time status updates
- Alert notifications for critical issues

## Troubleshooting

### DNS Issues
- Verify DNS records in domain registrar
- Check nameserver configuration
- Allow 24-48 hours for propagation

### SSL Problems
- Ensure certificate is installed correctly
- Check certificate chain completeness
- Verify domain matches certificate

### Redirect Failures
- Review server/CDN redirect rules
- Test with curl: `curl -I https://www.maintenancementor.io`
- Check for redirect loops

### Performance Degradation
- Review server resources
- Check CDN configuration
- Analyze traffic patterns
- Review database queries

## Best Practices
1. Monitor dashboard daily
2. Set up email alerts for critical issues
3. Keep SSL certificates renewed 30+ days before expiry
4. Document all DNS changes
5. Test redirects after configuration changes
