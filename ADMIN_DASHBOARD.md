# Admin Dashboard Documentation

## Overview
The Admin Dashboard is a comprehensive management interface accessible only to users with administrator privileges. It provides tools for managing users, monitoring system activity, handling support tickets, and viewing analytics.

## Access
- **URL**: `/admin`
- **Requirements**: Admin role required
- **Navigation**: Admin button appears in the navigation bar for admin users

## Features

### 1. User Management
- View all registered users
- Assign and revoke user roles
- View user role assignments
- Track total users, active roles, and admin count
- Manage user permissions

### 2. Subscription Management
- View all user subscriptions
- Search users by email or name
- Filter by subscription tier (free, basic, standard, premium)
- Change user subscription tiers
- Update subscription status
- Export user data to CSV

### 3. System Activity Monitor
- View real-time audit logs
- Track user actions and system events
- Filter by action type
- View activity statistics (total, today, unique users)
- Export activity logs to CSV
- Monitor system performance

### 4. Support Ticket Manager
- View all contact inquiries
- Track ticket status (new, in_progress, resolved)
- Update ticket status
- Add internal admin notes
- View ticket details
- Export tickets to CSV
- Monitor response times

### 5. Analytics Dashboard
- Total users count
- Active subscriptions
- Monthly revenue estimates
- New users this month
- Open support tickets
- Average response time
- User retention rate
- System uptime
- Support satisfaction scores

## Database Tables

### audit_logs
Tracks all user actions and system events:
- `user_id`: User who performed the action
- `action`: Type of action performed
- `resource`: Resource affected
- `details`: JSON details about the action
- `created_at`: Timestamp

### contact_inquiries
Stores support tickets:
- `name`, `email`, `phone`: Contact information
- `inquiry_type`: Type of inquiry
- `message`: Inquiry message
- `status`: Ticket status (new, in_progress, resolved)
- `admin_notes`: Internal notes (admin only)
- `resolved_at`: Resolution timestamp

## CSV Export Features
All major sections support CSV export:
- User subscriptions
- Activity logs
- Support tickets

## Security
- Protected by Row Level Security (RLS)
- Only admin users can access the dashboard
- Audit logs track all admin actions
- Admin notes are internal only

## Usage Tips
1. Use search and filters to find specific data quickly
2. Export data regularly for backup and analysis
3. Monitor the activity logs for security issues
4. Keep track of support tickets to maintain good response times
5. Review analytics regularly to track growth and performance

## Technical Details
- Built with React and TypeScript
- Uses Supabase for backend
- Real-time data updates
- Responsive design for mobile and desktop
- Protected routes with admin-only access
