import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, decimal, serial, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============= HOTELS (Platform Admin) =============
export const hotels = pgTable("hotels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  plan: text("plan").notNull().default("starter"),
  country: text("country").notNull().default(""),
  city: text("city").notNull().default(""),
  taxId: text("tax_id").default(""),
  ownerName: text("owner_name").notNull(),
  ownerEmail: text("owner_email").notNull(),
  ownerPhone: text("owner_phone").default(""),
  ownerDob: date("owner_dob"),
  ownerIdNumber: text("owner_id_number").default(""),
  adminLogin: text("admin_login").notNull(),
  logoUrl: text("logo_url").default(""),
  branches: text("branches").notNull().default("[]"),
  status: text("status").notNull().default("Active"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertHotelSchema = createInsertSchema(hotels).omit({ id: true, createdAt: true });
export type InsertHotel = z.infer<typeof insertHotelSchema>;
export type Hotel = typeof hotels.$inferSelect;

// ============= PLATFORM USERS =============
export const platformUsers = pgTable("platform_users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  password: text("password").notNull().default("password123"),
  role: text("role").notNull().default("staff"),
  hotelId: integer("hotel_id"),
  status: text("status").notNull().default("Active"),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPlatformUserSchema = createInsertSchema(platformUsers).omit({ id: true, createdAt: true, lastLogin: true });
export type InsertPlatformUser = z.infer<typeof insertPlatformUserSchema>;
export type PlatformUser = typeof platformUsers.$inferSelect;

// ============= ROOM TYPES =============
export const roomTypes = pgTable("room_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  beds: text("beds").notNull().default("1 Queen Bed"),
  capacity: integer("capacity").notNull().default(2),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull().default("0"),
  size: text("size").notNull().default(""),
  facilityIds: text("facility_ids").notNull().default("[]"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRoomTypeSchema = createInsertSchema(roomTypes).omit({ id: true, createdAt: true });
export type InsertRoomType = z.infer<typeof insertRoomTypeSchema>;
export type RoomType = typeof roomTypes.$inferSelect;

// ============= ROOMS =============
export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  roomNumber: text("room_number").notNull().unique(),
  roomName: text("room_name").notNull().default(""),
  roomTypeId: integer("room_type_id").notNull(),
  floor: integer("floor").notNull().default(1),
  description: text("description").notNull().default(""),
  photos: text("photos").notNull().default("[]"),
  status: text("status").notNull().default("available"), // available, occupied, maintenance, blocked
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRoomSchema = createInsertSchema(rooms).omit({ id: true, createdAt: true });
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof rooms.$inferSelect;

// ============= BOOKINGS =============
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  bookingId: text("booking_id").notNull().unique(),
  guestName: text("guest_name").notNull(),
  guestEmail: text("guest_email"),
  guestPhone: text("guest_phone"),
  guestLastName: text("guest_last_name").notNull().default(""),
  roomId: integer("room_id").notNull(),
  roomTypeId: integer("room_type_id").notNull(),
  checkIn: date("check_in").notNull(),
  checkOut: date("check_out").notNull(),
  nights: integer("nights").notNull().default(1),
  adults: integer("adults").notNull().default(1),
  children: integer("children").notNull().default(0),
  status: text("status").notNull().default("confirmed"), // confirmed, checked_in, checked_out, cancelled
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  advanceAmount: decimal("advance_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  paymentMethod: text("payment_method").default("Cash"), // Cash, Card, UPI
  notes: text("notes"),
  checkedInAt: timestamp("checked_in_at"),
  checkedOutAt: timestamp("checked_out_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookings).omit({ id: true, createdAt: true, checkedInAt: true, checkedOutAt: true });
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

// ============= STAFF =============
export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  employeeId: text("employee_id").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  email: text("email"),
  phone: text("phone"),
  salary: decimal("salary", { precision: 10, scale: 2 }).notNull().default("0"),
  joinDate: date("join_date").notNull(),
  status: text("status").notNull().default("active"),
  welfareEnabled: boolean("welfare_enabled").notNull().default(false),
  bonusEnabled: boolean("bonus_enabled").notNull().default(false),
  bonusAmount: decimal("bonus_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  dob: date("dob"),
  gender: text("gender"),
  nationality: text("nationality"),
  state: text("state"),
  city: text("city"),
  address: text("address"),
  countryCode: text("country_code").default("+1"),
  basicPay: decimal("basic_pay", { precision: 10, scale: 2 }).default("0"),
  hra: decimal("hra", { precision: 10, scale: 2 }).default("0"),
  transport: decimal("transport", { precision: 10, scale: 2 }).default("0"),
  allowance: decimal("allowance", { precision: 10, scale: 2 }).default("0"),
  emergencyName: text("emergency_name"),
  emergencyRelation: text("emergency_relation"),
  emergencyPhone: text("emergency_phone"),
  idCardNumber: text("id_card_number"),
  policeVerification: boolean("police_verification").default(false),
  photo: text("photo"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStaffSchema = createInsertSchema(staff).omit({ id: true, createdAt: true });
export type InsertStaff = z.infer<typeof insertStaffSchema>;
export type Staff = typeof staff.$inferSelect;

// ============= EXPENSES =============
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  recordDate: date("record_date").notNull(),
  category: text("category").notNull(),
  subCategory: text("sub_category").notNull().default(""),
  item: text("item").notNull(),
  qty: text("qty").notNull().default("1"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull().default("0"),
  status: text("status").notNull().default("Pending"), // Pending, Paid, Rejected
  hasReceipt: boolean("has_receipt").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true, createdAt: true });
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;

// ============= CATEGORIES (Expense/Inventory) =============
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  subtype: text("subtype").notNull().default(""),
  item: text("item").notNull(),
  taxable: boolean("taxable").notNull().default(false),
});

export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

// ============= MENU ITEMS (Restaurant) =============
export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  category: text("category").notNull().default("Food"), // Food, Beverage, Dessert, Other
  price: decimal("price", { precision: 10, scale: 2 }).notNull().default("0"),
  available: boolean("available").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMenuItemSchema = createInsertSchema(menuItems).omit({ id: true, createdAt: true });
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;
export type MenuItem = typeof menuItems.$inferSelect;

// ============= FACILITIES =============
export const facilities = pgTable("facilities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  price: decimal("price", { precision: 10, scale: 2 }).notNull().default("0"),
  unit: text("unit").notNull().default("item"), // item, person, night, stay, trip, session
  isFree: boolean("is_free").notNull().default(true),
  isDefault: boolean("is_default").notNull().default(false),
  taxable: boolean("taxable").notNull().default(false),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFacilitySchema = createInsertSchema(facilities).omit({ id: true, createdAt: true });
export type InsertFacility = z.infer<typeof insertFacilitySchema>;
export type Facility = typeof facilities.$inferSelect;

// ============= ORDERS (Food & Facility) =============
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderId: text("order_id").notNull().unique(),
  bookingId: text("booking_id").notNull(),
  guestName: text("guest_name").notNull(),
  roomNumber: text("room_number").notNull(),
  type: text("type").notNull().default("Food"), // Food, Facility
  status: text("status").notNull().default("Pending"), // Pending, Accepted, Fulfilled, Cancelled
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

// ============= ORDER ITEMS =============
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: text("order_id").notNull(),
  itemName: text("item_name").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull().default("0"),
  quantity: integer("quantity").notNull().default(1),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true });
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

// ============= SETTINGS (Key-Value Store) =============
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

export const insertSettingSchema = createInsertSchema(settings).omit({ id: true });
export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type Setting = typeof settings.$inferSelect;

// ============= SALARIES =============
export const salaries = pgTable("salaries", {
  id: serial("id").primaryKey(),
  staffId: integer("staff_id").notNull(),
  month: text("month").notNull(),
  basicSalary: decimal("basic_salary", { precision: 10, scale: 2 }).notNull().default("0"),
  bonus: decimal("bonus", { precision: 10, scale: 2 }).notNull().default("0"),
  deductions: decimal("deductions", { precision: 10, scale: 2 }).notNull().default("0"),
  welfareContribution: decimal("welfare_contribution", { precision: 10, scale: 2 }).notNull().default("0"),
  netPay: decimal("net_pay", { precision: 10, scale: 2 }).notNull().default("0"),
  advanceAmount: decimal("advance_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  dueDate: date("due_date"),
  status: text("status").notNull().default("Pending"), // Pending, Paid
  paidDate: date("paid_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSalarySchema = createInsertSchema(salaries).omit({ id: true, createdAt: true });
export type InsertSalary = z.infer<typeof insertSalarySchema>;
export type Salary = typeof salaries.$inferSelect;

// ============= ROOM PRICING (Per-date rates) =============
export const roomPricing = pgTable("room_pricing", {
  id: serial("id").primaryKey(),
  roomTypeId: integer("room_type_id").notNull(),
  date: date("date").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull().default("0"),
  isLocked: boolean("is_locked").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRoomPricingSchema = createInsertSchema(roomPricing).omit({ id: true, createdAt: true });
export type InsertRoomPricing = z.infer<typeof insertRoomPricingSchema>;
export type RoomPricing = typeof roomPricing.$inferSelect;

// ============= BOOKING CHARGES (Auto-linked from orders) =============
export const bookingCharges = pgTable("booking_charges", {
  id: serial("id").primaryKey(),
  bookingId: text("booking_id").notNull(),
  orderId: text("order_id"),
  description: text("description").notNull(),
  category: text("category").notNull().default("Room"), // Room, Food, Facility, Tax
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBookingChargeSchema = createInsertSchema(bookingCharges).omit({ id: true, createdAt: true });
export type InsertBookingCharge = z.infer<typeof insertBookingChargeSchema>;
export type BookingCharge = typeof bookingCharges.$inferSelect;
