# Hotel Management System

## Overview
Comprehensive hotel management system with multi-role access (Owner/Manager/Staff/Guest), featuring room inventory, booking & reservations, invoice generation, employee management with HR/Payroll, food & facilities order automation, expense tracking, and guest self-service portal.

## Architecture
- **Frontend**: React + TypeScript, Vite, TanStack Query, Wouter routing, Shadcn/UI components
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **API Pattern**: RESTful, all routes prefixed with `/api`

## Project Structure
```
shared/schema.ts      - Drizzle schema definitions (15+ tables)
server/db.ts          - Database connection pool
server/storage.ts     - Storage interface with CRUD operations
server/routes.ts      - Express API routes
client/src/pages/     - React page components
client/src/components/ - Reusable UI components
```

## Key Design Decisions
- Welfare Fund is owner liability, NOT part of employee salary
- Taxable categories (Asset) require invoice uploads for auditor reporting
- Tax settings per-category: Room (12%), Food (5%), Facilities (18%), Other (0%)
- Invoice actions only enabled AFTER checkout
- Order workflow: Guest orders → Manager accepts → Kitchen fulfills → Auto-added to booking charges
- Guest authentication: Booking ID + Last Name (must be checked_in)
- Role-based discount limits: Owner unlimited, Manager max 15%, Receptionist max 5%
- Complex settings (taxes, templates, discount rules) stored as JSON strings in settings table

## Database Tables
hotels, platform_users, rooms, room_types, bookings, staff, expenses, categories, menu_items, facilities, orders, order_items, settings, salaries, booking_charges

## Authentication
- Session-based auth using express-session (in-memory store)
- Login API: POST /api/auth/login (email + password, returns user object)
- Logout API: POST /api/auth/logout (destroys session)
- Session check: GET /api/auth/me (returns current user or 401)
- Seed endpoint: POST /api/auth/seed (creates demo users)
- Auth context: client/src/lib/auth.tsx (AuthProvider, useAuth, RequireAuth)
- Route protection: RequireAuth wraps protected routes with role-based access
- Demo accounts: admin@yellowberry.com/admin123, owner@demo.com/owner123, manager@demo.com/manager123
- Roles: super_admin (platform), owner (hotel admin), manager (hotel manager)
- Password stored in platform_users.password field (plain text for demo)

## Recent Changes
- 2026-02-19: Real authentication system - login/logout with sessions, auth context, route protection, demo users
- 2026-02-19: Complete Platform Admin section overhaul - all pages connected to real API data
  - Dashboard: live stats from hotels/users API (hotel count, branches, users, MRR)
  - Hotels: full CRUD with onboarding form, logo upload, validation, success/error toasts
  - Users: new platform_users table + full CRUD with create form, deactivate, role filter
  - Reports: real subscription distribution and revenue breakdown from hotel data
  - Settings: new page with general, security, notification, and backup settings
- 2026-02-19: Full backend implementation - DB schema, storage layer, API routes
- 2026-02-19: All frontend pages connected to real API data (removed mock data/localStorage)
- 2026-02-19: Staff schema extended with 14 new fields (dob, gender, nationality, state, city, address, countryCode, basicPay, hra, transport, allowance, emergencyName/Relation/Phone, idCardNumber, policeVerification)
- 2026-02-19: Staff dialog rewritten with view/edit/add modes - view shows read-only details, edit populates all saved fields
- 2026-02-19: Auto-create salary record on staff onboarding with prorated calculation for mid-month joins
- 2026-02-19: Zod validation added to POST/PATCH staff routes, welfare based on basicPay
