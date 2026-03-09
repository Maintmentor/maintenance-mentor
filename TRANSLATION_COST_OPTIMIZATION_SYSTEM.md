# Translation Cost Optimization System

## Overview
Comprehensive cost tracking and optimization system for translation API usage with intelligent caching recommendations and automated alerts.

## Features

### 1. Cost Tracking
- **Per-Translation Cost Tracking**: Every translation API call is logged with cost
- **Language Pair Analytics**: Cost breakdown by source-target language combinations
- **Cache Hit/Miss Tracking**: Monitor which translations are cached vs. API calls
- **User-Level Attribution**: Track costs per user for billing/analytics

### 2. Cost Analytics Dashboard
Access via Admin Dashboard → Cost tab

**Key Metrics:**
- Total translation costs (configurable time periods: 7/30/90 days)
- Cost savings from caching
- Average cache hit rate across language pairs
- Active cost alerts requiring attention

**Visualizations:**
- Monthly cost trends with cache hit rate correlation
- Cost breakdown by language pair
- Savings analysis showing cache effectiveness

### 3. Cost Projections
- **Automated Forecasting**: Daily projections based on historical usage
- **Confidence Levels**: Statistical confidence in projections (65-85%)
- **Language Pair Specific**: Individual projections per translation pair
- **30-Day Outlook**: Monthly cost estimates for budgeting

### 4. Cache Optimization Recommendations
Intelligent suggestions for improving cache efficiency:
- **Optimal TTL Values**: Recommended cache duration per language pair
- **Potential Savings**: Estimated monthly savings from applying recommendations
- **Confidence Scores**: ML-based confidence in each recommendation
- **One-Click Apply**: Easy implementation of suggestions

### 5. Cost Alerts
Automated monitoring with configurable thresholds:
- **Daily Threshold Alerts**: Notify when daily costs exceed $10 (configurable)
- **Monthly Budget Alerts**: Track against monthly spending limits
- **Language Pair Anomalies**: Detect unusual cost spikes
- **Resolution Tracking**: Mark alerts as resolved with audit trail

## Database Schema

### translation_costs
```sql
- id: UUID (primary key)
- translation_id: UUID (references translation_cache)
- source_language: VARCHAR(10)
- target_language: VARCHAR(10)
- character_count: INTEGER
- api_cost: DECIMAL(10, 6)
- cache_hit: BOOLEAN
- user_id: UUID (references auth.users)
- created_at: TIMESTAMP
```

### translation_cache_analytics
```sql
- id: UUID (primary key)
- language_pair: VARCHAR(50)
- date: DATE
- total_requests: INTEGER
- cache_hits: INTEGER
- cache_misses: INTEGER
- total_cost: DECIMAL(10, 4)
- cost_saved: DECIMAL(10, 4)
- avg_ttl_hours: INTEGER
```

### translation_cost_alerts
```sql
- id: UUID (primary key)
- alert_type: VARCHAR(50)
- threshold_amount: DECIMAL(10, 2)
- current_amount: DECIMAL(10, 2)
- period: VARCHAR(20)
- language_pair: VARCHAR(50)
- triggered_at: TIMESTAMP
- resolved: BOOLEAN
- notified: BOOLEAN
```

### cache_optimization_recommendations
```sql
- id: UUID (primary key)
- language_pair: VARCHAR(50)
- current_ttl_hours: INTEGER
- recommended_ttl_hours: INTEGER
- potential_savings: DECIMAL(10, 2)
- confidence_score: DECIMAL(5, 2)
- reason: TEXT
- applied: BOOLEAN
```

## Edge Functions

### translation-cost-analyzer
**Endpoint**: `/functions/v1/translation-cost-analyzer`

**Actions:**
1. `analyze_costs` - Analyze costs for specified period
2. `generate_projections` - Create 30-day cost forecasts
3. `check_alerts` - Monitor and trigger cost alerts

**Usage:**
```javascript
const { data } = await supabase.functions.invoke('translation-cost-analyzer', {
  body: { action: 'analyze_costs', days: 30 }
});
```

### translation-service (Enhanced)
Now tracks costs automatically:
- Logs $0 cost for cache hits
- Calculates API cost based on token usage ($0.002 per 1K tokens)
- Links costs to translation records for audit trail

## Frontend Components

### TranslationCostDashboard
Location: `src/components/admin/TranslationCostDashboard.tsx`

**Features:**
- Real-time cost metrics with period selection
- Interactive charts (monthly trends, language pair breakdown)
- Cost alert management with resolution workflow
- Cache optimization recommendations with one-click apply
- Export capabilities for reporting

### translationCostService
Location: `src/services/translationCostService.ts`

**Methods:**
- `analyzeCosts(days)` - Get cost metrics for period
- `generateProjections()` - Create cost forecasts
- `checkAlerts()` - Monitor alert thresholds
- `getCostAlerts()` - Retrieve active alerts
- `resolveAlert(id)` - Mark alert as resolved
- `getCacheRecommendations()` - Get optimization suggestions
- `applyRecommendation(id)` - Apply cache optimization
- `getMonthlyCostTrend(months)` - Historical trend data

## Automated Monitoring

### GitHub Actions Workflow
**File**: `.github/workflows/translation-cost-monitoring.yml`

**Schedule**: Daily at 9 AM UTC

**Tasks:**
1. Analyze costs for last 30 days
2. Generate new cost projections
3. Check and trigger cost alerts

## Cost Calculation

### API Cost Formula
```
estimatedTokens = (sourceLength * 0.5) + (translatedLength * 0.5)
apiCost = (estimatedTokens / 1000) * 0.002
```

Based on OpenAI GPT-3.5-turbo pricing: $0.002 per 1K tokens

### Cache Savings Formula
```
avgCostPerChar = 0.00002 (estimated)
costSaved = cacheHits * avgCharacters * avgCostPerChar
```

## Best Practices

### 1. Monitor Daily
- Check cost dashboard daily for anomalies
- Review and resolve active alerts promptly
- Track cache hit rates for optimization opportunities

### 2. Apply Recommendations
- Review cache optimization suggestions weekly
- Apply high-confidence recommendations (>80%)
- Monitor impact after applying changes

### 3. Set Budgets
- Configure daily/monthly cost thresholds
- Set up email notifications for alerts
- Review projections for budget planning

### 4. Optimize Cache Strategy
- Increase TTL for stable content (technical terms, common phrases)
- Decrease TTL for dynamic content (news, time-sensitive)
- Monitor cache hit rates per language pair

### 5. Language Pair Analysis
- Identify high-cost language pairs
- Consider pre-caching common translations
- Optimize frequently-used pairs first

## Troubleshooting

### High Costs
1. Check cache hit rate - should be >60%
2. Review language pair distribution
3. Identify users with high usage
4. Apply cache optimization recommendations

### Low Cache Hit Rate
1. Check TTL values - may be too short
2. Review translation patterns - high uniqueness?
3. Consider pre-warming cache for common phrases
4. Analyze user behavior for optimization opportunities

### Alert Fatigue
1. Adjust thresholds based on actual usage
2. Resolve false positives promptly
3. Set up alert grouping by time period
4. Configure notification preferences

## Future Enhancements

1. **ML-Based Cost Prediction**: More accurate forecasting using machine learning
2. **Budget Allocation**: Per-user or per-department cost limits
3. **Cost Attribution**: Detailed cost breakdown by feature/page
4. **Optimization Automation**: Auto-apply safe recommendations
5. **Cost Comparison**: Compare costs across different translation providers
6. **Usage Patterns**: Identify peak usage times for capacity planning

## Support

For issues or questions:
- Check Admin Dashboard → Cost tab for real-time metrics
- Review alert history for patterns
- Monitor GitHub Actions workflow runs
- Contact system administrator for threshold adjustments
