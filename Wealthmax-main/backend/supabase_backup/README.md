# WealthMax Supabase Database Backup

**Generated:** 2026-04-11  
**Project ID:** vwkfljvijngvogkgswmv  
**Supabase URL:** https://vwkfljvijngvogkgswmv.supabase.co

## Backup Contents

### 1. Database Schema (`schema/supabase_schema.sql`)
Complete SQL schema with all tables, indexes, constraints, triggers, and seed data.

#### Tables Included:
- `users` - User accounts with authentication, roles, partner/advisor references
- `profiles` - User financial profiles with income, expenses, assets, liabilities
- `survey_responses` - Risk assessment survey responses
- `action_items` - Financial health action items
- `holding_metadata` - Securities master data (ISIN, NAV, etc.)
- `user_portfolios` - User portfolio containers
- `portfolio_holdings` - Portfolio security holdings
- `portfolio_transactions` - Transaction history from CAS
- `market_indices` - Market benchmark indices
- `market_index_history` - Index historical values
- `health_scores` - Financial health score calculations
- `partner_agencies` - Partner/agency organizations
- `platform_metrics` - Platform-wide metrics
- `mutual_fund_nav` - Mutual fund NAV cache
- `families` - Family groupings
- `goals` - Financial goals
- `interaction_logs` - CRM interaction logs
- `documents` - Uploaded documents
- `pledge_requests` - Margin pledge requests
- `onboarding_prospects` - Prospect pipeline
- `advisor_prospects` - Advisor prospect management
- `client_invites` - Client invitation system
- `audit_logs` - Audit trail

#### Row Level Security (RLS):
- RLS is NOT enabled in this schema (managed by backend)
- If RLS is needed, enable via Supabase dashboard

### 2. Migrations (`migrations/`)
All database migrations applied to the project:
- Backend migrations (node-pg-migrate format): `*.js`
- Supabase SQL migrations: `*.sql`

### 3. Edge Functions (`edge_functions/`)
Supabase Edge Functions deployed:
- `risk-profiler.ts` - Risk assessment scoring
- `health-score.ts` - Financial health score calculator
- `financial-persona.ts` - Client persona classification
- `advisory-report.ts` - HTML report generation
- `margin-pledge.ts` - Margin trading pledge management
- `risk-monitor.ts` - Margin risk monitoring

## Database Connection

```
Host: aws-1-ap-south-1.pooler.supabase.com
Port: 6543
Database: postgres
User: postgres.onimxnpfnxjdkmvpsfhv
```

## Restoration Instructions

### Option 1: Using Supabase Dashboard
1. Go to Supabase Dashboard → Your Project → SQL Editor
2. Copy and paste the contents of `schema/supabase_schema.sql`
3. Execute to create all tables and seed data

### Option 2: Using psql
```bash
psql -h aws-1-ap-south-1.pooler.supabase.com -p 6543 -U postgres.onimxnpfnxjdkmvpsfhv -d postgres -f schema/supabase_schema.sql
```

### Option 3: Deploy Edge Functions
```bash
# Using Supabase CLI
supabase functions deploy risk-profiler
supabase functions deploy health-score
supabase functions deploy financial-persona
supabase functions deploy advisory-report
supabase functions deploy margin-pledge
supabase functions deploy risk-monitor
```

## Notes

- This backup includes schema and migrations but NOT actual data
- For full backup with data, use Supabase dashboard's "Backup" feature or pg_dump
- Edge functions require Supabase CLI to deploy
- The config.toml shows all functions have `verify_jwt = false` (public access)