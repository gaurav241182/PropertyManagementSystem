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
hotels, platform_users, rooms, room_types, bookings, staff, expenses, categories, menu_items, facilities, orders, order_items, settings, salaries, booking_charges, room_pricing

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
- 2026-02-19: Photo persistence added to staff schema (base64 stored in `photo` column), shown in view mode and table
- 2026-02-19: Avatar initials removed from staff table, replaced with photo or empty circle
- 2026-02-19: Salary schema extended with advanceAmount and dueDate fields
- 2026-02-19: Due date auto-set to end of month when salary record is created
- 2026-02-19: Advance payment system: POST /api/salaries/:id/advance - records advance, auto-marks paid when advance >= salary, overflows to next month
- 2026-03-09: Room Pricing system - new `room_pricing` table (roomTypeId, date, price, isLocked)
  - API: GET /api/room-pricing, POST /api/room-pricing, POST /api/room-pricing/bulk, PATCH /api/room-pricing/:id/lock
  - PricingCalendar redesigned: card-based monthly grid (7-col calendar), room type selector, per-day price editing
  - Lock/unlock rates per day (locked rates cannot be overwritten by bulk updates)
  - Bulk Update dialog: select multiple months, set separate weekday/weekend prices, respects locked dates
  - Save Changes persists only dirty (changed) prices to database via bulk upsert
- 2026-03-09: Categories tab redesigned with grouped category management
  - Category type is unique — each type has multiple subtypes with optional item names
  - Add Category form: enter type once + taxable flag, then add multiple subtypes via "+" button
  - Each subtype can have multiple item names via nested "+" Add Item buttons
  - Edit Category: opens dialog with all subtypes for that type, add/remove subtypes and items, save syncs changes
  - Table display groups rows by type with rowSpan, actions (edit/delete) per type group
  - Backend: POST /api/categories/bulk (create type with subtypes), PUT /api/categories/sync (sync subtypes), DELETE /api/categories/type/:type
  - Expenses page uses dynamic categories from DB (falls back to defaults if no DB categories exist)
  - Expenses: Item Description is a dropdown populated from category items; shows text input when subcategory is "Others"
  - Every category automatically gets "Others" as a subcategory option in expenses
  - Duplicate type prevention on both add and edit
  - Subtype uniqueness enforced within a category type
- 2026-03-10: Facilities system redesign
  - Facilities table: added `isFree` boolean (default true) and `isDefault` boolean (default false)
  - Free facilities show as "Complimentary"; paid facilities show price/unit
  - Default facilities are auto-included in all room types
  - Add Facility form: name, Default toggle, Free/Paid toggle, price+unit (only if paid), active switch
  - Facility cards show Default/Free/Paid badges
- 2026-03-10: Room Types redesign
  - Removed `allowsCots` and `infantFriendly` columns (now managed as facilities)
  - Added `size` text field (e.g., "350 sq ft") and `facilityIds` JSON text field
  - Room type form shows Default facilities (pre-checked, disabled) and Optional facilities (checkboxes)
  - Room type table shows size column and facility count badge
- 2026-03-10: Booking facilities integration
  - After selecting room type, booking form shows "Included (Free)" facilities and "Paid Add-ons" with checkboxes
  - Paid facility costs calculated per unit (night/person/item) and added to booking total
  - Selected paid facilities saved as booking_charges (category: "Facility") on booking creation
- 2026-03-10: New Reservation redesigned as multi-step wizard (Booking.com style)
  - Step 1: Dates & Guests — check-in/out with auto nights count, Adults/Children/Rooms +/- counters, child age dropdowns, pets toggle
  - Step 2: Room Selection — rooms grouped by type, availability-based (greyed out if booked), multi-room selection with running total
  - Step 3: Guest Details — name/phone/email required with inline validation, country code dropdown, paid facility add-ons, accompanying guests
  - Step 4: Summary & Confirm — review all details before booking
  - API: GET /api/rooms/availability?checkIn=&checkOut= returns rooms with availability status
  - Backend validation: required fields return 400, duplicate room+date bookings return 409
  - Storage: getOverlappingBookings(roomId, checkIn, checkOut) checks for booking conflicts
  - Phone field: digits only, 9-16 length validation, country code Select dropdown (20 countries)
  - Multiple rooms create individual booking records per room
- 2026-03-10: Mobile card view for bookings list (block md:hidden), desktop table (hidden md:block)
- 2026-03-10: Room inventory enhancements
  - Rooms schema: added `roomName` and `description` text fields
  - Add Room dialog: includes Room Name field alongside Room Number
  - Edit Room dialog: shows room number as header (not dropdown), includes name, status, floor, description, photos, room properties with facilities
  - Mobile card view for rooms (visible on small screens), desktop table view on md+
