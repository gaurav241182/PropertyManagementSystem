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
rooms, room_types, bookings, staff, expenses, categories, menu_items, facilities, orders, order_items, settings, salaries, booking_charges

## Recent Changes
- 2026-02-19: Full backend implementation - DB schema, storage layer, API routes
- 2026-02-19: All frontend pages connected to real API data (removed mock data/localStorage)
