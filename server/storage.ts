import { eq, desc, and, gte, lte } from "drizzle-orm";
import { db } from "./db";
import {
  hotels, platformUsers, roomTypes, rooms, bookings, staff, expenses, categories,
  menuItems, facilities, orders, orderItems, settings, salaries,
  bookingCharges, roomPricing,
  type InsertHotel, type Hotel,
  type InsertPlatformUser, type PlatformUser,
  type InsertRoomType, type RoomType,
  type InsertRoom, type Room,
  type InsertBooking, type Booking,
  type InsertStaff, type Staff,
  type InsertExpense, type Expense,
  type InsertCategory, type Category,
  type InsertMenuItem, type MenuItem,
  type InsertFacility, type Facility,
  type InsertOrder, type Order,
  type InsertOrderItem, type OrderItem,
  type InsertSetting, type Setting,
  type InsertSalary, type Salary,
  type InsertBookingCharge, type BookingCharge,
  type InsertRoomPricing, type RoomPricing,
} from "@shared/schema";

export interface IStorage {
  // Hotels
  getHotels(): Promise<Hotel[]>;
  createHotel(data: InsertHotel): Promise<Hotel>;
  createHotelWithOwner(data: InsertHotel): Promise<Hotel>;
  updateHotel(id: number, data: Partial<InsertHotel>): Promise<Hotel | undefined>;
  deleteHotel(id: number): Promise<void>;

  // Platform Users
  getPlatformUsers(): Promise<PlatformUser[]>;
  getPlatformUserByEmail(email: string): Promise<PlatformUser | undefined>;
  createPlatformUser(data: InsertPlatformUser): Promise<PlatformUser>;
  updatePlatformUser(id: number, data: Partial<InsertPlatformUser>): Promise<PlatformUser | undefined>;
  deletePlatformUser(id: number): Promise<void>;

  // Room Types
  getRoomTypes(): Promise<RoomType[]>;
  createRoomType(data: InsertRoomType): Promise<RoomType>;
  updateRoomType(id: number, data: Partial<InsertRoomType>): Promise<RoomType | undefined>;
  deleteRoomType(id: number): Promise<void>;

  // Rooms
  getRooms(): Promise<Room[]>;
  getRoom(id: number): Promise<Room | undefined>;
  getRoomByNumber(roomNumber: string): Promise<Room | undefined>;
  createRoom(data: InsertRoom): Promise<Room>;
  updateRoom(id: number, data: Partial<InsertRoom>): Promise<Room | undefined>;
  deleteRoom(id: number): Promise<void>;

  // Bookings
  getBookings(): Promise<Booking[]>;
  getBooking(id: number): Promise<Booking | undefined>;
  getBookingByBookingId(bookingId: string): Promise<Booking | undefined>;
  createBooking(data: InsertBooking): Promise<Booking>;
  updateBooking(id: number, data: Partial<InsertBooking>): Promise<Booking | undefined>;
  deleteBooking(id: number): Promise<void>;

  // Staff
  getStaff(): Promise<Staff[]>;
  getStaffMember(id: number): Promise<Staff | undefined>;
  createStaff(data: InsertStaff): Promise<Staff>;
  updateStaff(id: number, data: Partial<InsertStaff>): Promise<Staff | undefined>;
  deleteStaff(id: number): Promise<void>;

  // Expenses
  getExpenses(): Promise<Expense[]>;
  createExpense(data: InsertExpense): Promise<Expense>;
  updateExpense(id: number, data: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: number): Promise<void>;

  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(data: InsertCategory): Promise<Category>;
  updateCategory(id: number, data: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<void>;

  // Menu Items
  getMenuItems(): Promise<MenuItem[]>;
  createMenuItem(data: InsertMenuItem): Promise<MenuItem>;
  updateMenuItem(id: number, data: Partial<InsertMenuItem>): Promise<MenuItem | undefined>;
  deleteMenuItem(id: number): Promise<void>;

  // Facilities
  getFacilities(): Promise<Facility[]>;
  createFacility(data: InsertFacility): Promise<Facility>;
  updateFacility(id: number, data: Partial<InsertFacility>): Promise<Facility | undefined>;
  deleteFacility(id: number): Promise<void>;

  // Orders
  getOrders(): Promise<Order[]>;
  getOrdersByBookingId(bookingId: string): Promise<Order[]>;
  createOrder(data: InsertOrder): Promise<Order>;
  updateOrder(id: number, data: Partial<InsertOrder>): Promise<Order | undefined>;

  // Order Items
  getOrderItems(orderId: string): Promise<OrderItem[]>;
  createOrderItem(data: InsertOrderItem): Promise<OrderItem>;

  // Settings
  getSettings(): Promise<Setting[]>;
  getSetting(key: string): Promise<Setting | undefined>;
  upsertSetting(key: string, value: string): Promise<Setting>;

  // Salaries
  getSalaries(): Promise<Salary[]>;
  getSalariesByMonth(month: string): Promise<Salary[]>;
  createSalary(data: InsertSalary): Promise<Salary>;
  updateSalary(id: number, data: Partial<InsertSalary>): Promise<Salary | undefined>;
  deleteSalary(id: number): Promise<void>;

  // Booking Charges
  getBookingCharges(bookingId: string): Promise<BookingCharge[]>;
  createBookingCharge(data: InsertBookingCharge): Promise<BookingCharge>;

  // Room Pricing
  getRoomPricing(roomTypeId?: number): Promise<RoomPricing[]>;
  upsertRoomPricing(data: InsertRoomPricing): Promise<RoomPricing>;
  bulkUpsertRoomPricing(data: InsertRoomPricing[]): Promise<RoomPricing[]>;
  updateRoomPricingLock(id: number, isLocked: boolean): Promise<RoomPricing | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Hotels
  async getHotels(): Promise<Hotel[]> {
    return db.select().from(hotels).orderBy(desc(hotels.createdAt));
  }
  async createHotel(data: InsertHotel): Promise<Hotel> {
    const [result] = await db.insert(hotels).values(data).returning();
    return result;
  }
  async createHotelWithOwner(data: InsertHotel): Promise<Hotel> {
    return await db.transaction(async (tx) => {
      const [hotel] = await tx.insert(hotels).values(data).returning();
      await tx.insert(platformUsers).values({
        name: data.ownerName,
        email: data.ownerEmail,
        role: "owner",
        hotelId: hotel.id,
        status: "Active",
      });
      return hotel;
    });
  }
  async updateHotel(id: number, data: Partial<InsertHotel>): Promise<Hotel | undefined> {
    const [result] = await db.update(hotels).set(data).where(eq(hotels.id, id)).returning();
    return result;
  }
  async deleteHotel(id: number): Promise<void> {
    await db.delete(hotels).where(eq(hotels.id, id));
  }

  // Platform Users
  async getPlatformUsers(): Promise<PlatformUser[]> {
    return db.select().from(platformUsers).orderBy(desc(platformUsers.createdAt));
  }
  async getPlatformUserByEmail(email: string): Promise<PlatformUser | undefined> {
    const [result] = await db.select().from(platformUsers).where(eq(platformUsers.email, email));
    return result;
  }
  async createPlatformUser(data: InsertPlatformUser): Promise<PlatformUser> {
    const [result] = await db.insert(platformUsers).values(data).returning();
    return result;
  }
  async updatePlatformUser(id: number, data: Partial<InsertPlatformUser>): Promise<PlatformUser | undefined> {
    const [result] = await db.update(platformUsers).set(data).where(eq(platformUsers.id, id)).returning();
    return result;
  }
  async deletePlatformUser(id: number): Promise<void> {
    await db.delete(platformUsers).where(eq(platformUsers.id, id));
  }

  // Room Types
  async getRoomTypes(): Promise<RoomType[]> {
    return db.select().from(roomTypes).orderBy(roomTypes.id);
  }
  async createRoomType(data: InsertRoomType): Promise<RoomType> {
    const [result] = await db.insert(roomTypes).values(data).returning();
    return result;
  }
  async updateRoomType(id: number, data: Partial<InsertRoomType>): Promise<RoomType | undefined> {
    const [result] = await db.update(roomTypes).set(data).where(eq(roomTypes.id, id)).returning();
    return result;
  }
  async deleteRoomType(id: number): Promise<void> {
    await db.delete(roomTypes).where(eq(roomTypes.id, id));
  }

  // Rooms
  async getRooms(): Promise<Room[]> {
    return db.select().from(rooms).orderBy(rooms.roomNumber);
  }
  async getRoom(id: number): Promise<Room | undefined> {
    const [result] = await db.select().from(rooms).where(eq(rooms.id, id));
    return result;
  }
  async getRoomByNumber(roomNumber: string): Promise<Room | undefined> {
    const [result] = await db.select().from(rooms).where(eq(rooms.roomNumber, roomNumber));
    return result;
  }
  async createRoom(data: InsertRoom): Promise<Room> {
    const [result] = await db.insert(rooms).values(data).returning();
    return result;
  }
  async updateRoom(id: number, data: Partial<InsertRoom>): Promise<Room | undefined> {
    const [result] = await db.update(rooms).set(data).where(eq(rooms.id, id)).returning();
    return result;
  }
  async deleteRoom(id: number): Promise<void> {
    await db.delete(rooms).where(eq(rooms.id, id));
  }

  // Bookings
  async getBookings(): Promise<Booking[]> {
    return db.select().from(bookings).orderBy(desc(bookings.createdAt));
  }
  async getBooking(id: number): Promise<Booking | undefined> {
    const [result] = await db.select().from(bookings).where(eq(bookings.id, id));
    return result;
  }
  async getBookingByBookingId(bookingId: string): Promise<Booking | undefined> {
    const [result] = await db.select().from(bookings).where(eq(bookings.bookingId, bookingId));
    return result;
  }
  async createBooking(data: InsertBooking): Promise<Booking> {
    const [result] = await db.insert(bookings).values(data).returning();
    return result;
  }
  async updateBooking(id: number, data: Partial<InsertBooking>): Promise<Booking | undefined> {
    const [result] = await db.update(bookings).set(data).where(eq(bookings.id, id)).returning();
    return result;
  }
  async deleteBooking(id: number): Promise<void> {
    await db.delete(bookings).where(eq(bookings.id, id));
  }

  // Staff
  async getStaff(): Promise<Staff[]> {
    return db.select().from(staff).orderBy(staff.name);
  }
  async getStaffMember(id: number): Promise<Staff | undefined> {
    const [result] = await db.select().from(staff).where(eq(staff.id, id));
    return result;
  }
  async createStaff(data: InsertStaff): Promise<Staff> {
    const [result] = await db.insert(staff).values(data).returning();
    return result;
  }
  async updateStaff(id: number, data: Partial<InsertStaff>): Promise<Staff | undefined> {
    const [result] = await db.update(staff).set(data).where(eq(staff.id, id)).returning();
    return result;
  }
  async deleteStaff(id: number): Promise<void> {
    await db.delete(staff).where(eq(staff.id, id));
  }

  // Expenses
  async getExpenses(): Promise<Expense[]> {
    return db.select().from(expenses).orderBy(desc(expenses.date));
  }
  async createExpense(data: InsertExpense): Promise<Expense> {
    const [result] = await db.insert(expenses).values(data).returning();
    return result;
  }
  async updateExpense(id: number, data: Partial<InsertExpense>): Promise<Expense | undefined> {
    const [result] = await db.update(expenses).set(data).where(eq(expenses.id, id)).returning();
    return result;
  }
  async deleteExpense(id: number): Promise<void> {
    await db.delete(expenses).where(eq(expenses.id, id));
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return db.select().from(categories).orderBy(categories.type, categories.subtype);
  }
  async createCategory(data: InsertCategory): Promise<Category> {
    const [result] = await db.insert(categories).values(data).returning();
    return result;
  }
  async updateCategory(id: number, data: Partial<InsertCategory>): Promise<Category | undefined> {
    const [result] = await db.update(categories).set(data).where(eq(categories.id, id)).returning();
    return result;
  }
  async deleteCategory(id: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  // Menu Items
  async getMenuItems(): Promise<MenuItem[]> {
    return db.select().from(menuItems).orderBy(menuItems.category, menuItems.name);
  }
  async createMenuItem(data: InsertMenuItem): Promise<MenuItem> {
    const [result] = await db.insert(menuItems).values(data).returning();
    return result;
  }
  async updateMenuItem(id: number, data: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    const [result] = await db.update(menuItems).set(data).where(eq(menuItems.id, id)).returning();
    return result;
  }
  async deleteMenuItem(id: number): Promise<void> {
    await db.delete(menuItems).where(eq(menuItems.id, id));
  }

  // Facilities
  async getFacilities(): Promise<Facility[]> {
    return db.select().from(facilities).orderBy(facilities.name);
  }
  async createFacility(data: InsertFacility): Promise<Facility> {
    const [result] = await db.insert(facilities).values(data).returning();
    return result;
  }
  async updateFacility(id: number, data: Partial<InsertFacility>): Promise<Facility | undefined> {
    const [result] = await db.update(facilities).set(data).where(eq(facilities.id, id)).returning();
    return result;
  }
  async deleteFacility(id: number): Promise<void> {
    await db.delete(facilities).where(eq(facilities.id, id));
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    return db.select().from(orders).orderBy(desc(orders.createdAt));
  }
  async getOrdersByBookingId(bookingId: string): Promise<Order[]> {
    return db.select().from(orders).where(eq(orders.bookingId, bookingId)).orderBy(desc(orders.createdAt));
  }
  async createOrder(data: InsertOrder): Promise<Order> {
    const [result] = await db.insert(orders).values(data).returning();
    return result;
  }
  async updateOrder(id: number, data: Partial<InsertOrder>): Promise<Order | undefined> {
    const [result] = await db.update(orders).set(data).where(eq(orders.id, id)).returning();
    return result;
  }

  // Order Items
  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }
  async createOrderItem(data: InsertOrderItem): Promise<OrderItem> {
    const [result] = await db.insert(orderItems).values(data).returning();
    return result;
  }

  // Settings
  async getSettings(): Promise<Setting[]> {
    return db.select().from(settings);
  }
  async getSetting(key: string): Promise<Setting | undefined> {
    const [result] = await db.select().from(settings).where(eq(settings.key, key));
    return result;
  }
  async upsertSetting(key: string, value: string): Promise<Setting> {
    const existing = await this.getSetting(key);
    if (existing) {
      const [result] = await db.update(settings).set({ value }).where(eq(settings.key, key)).returning();
      return result;
    }
    const [result] = await db.insert(settings).values({ key, value }).returning();
    return result;
  }

  // Salaries
  async getSalaries(): Promise<Salary[]> {
    return db.select().from(salaries).orderBy(desc(salaries.month));
  }
  async getSalariesByMonth(month: string): Promise<Salary[]> {
    return db.select().from(salaries).where(eq(salaries.month, month));
  }
  async createSalary(data: InsertSalary): Promise<Salary> {
    const [result] = await db.insert(salaries).values(data).returning();
    return result;
  }
  async updateSalary(id: number, data: Partial<InsertSalary>): Promise<Salary | undefined> {
    const [result] = await db.update(salaries).set(data).where(eq(salaries.id, id)).returning();
    return result;
  }
  async deleteSalary(id: number): Promise<void> {
    await db.delete(salaries).where(eq(salaries.id, id));
  }

  // Booking Charges
  async getBookingCharges(bookingId: string): Promise<BookingCharge[]> {
    return db.select().from(bookingCharges).where(eq(bookingCharges.bookingId, bookingId)).orderBy(bookingCharges.createdAt);
  }
  async createBookingCharge(data: InsertBookingCharge): Promise<BookingCharge> {
    const [result] = await db.insert(bookingCharges).values(data).returning();
    return result;
  }

  // Room Pricing
  async getRoomPricing(roomTypeId?: number): Promise<RoomPricing[]> {
    if (roomTypeId) {
      return db.select().from(roomPricing).where(eq(roomPricing.roomTypeId, roomTypeId)).orderBy(roomPricing.date);
    }
    return db.select().from(roomPricing).orderBy(roomPricing.roomTypeId, roomPricing.date);
  }

  async upsertRoomPricing(data: InsertRoomPricing): Promise<RoomPricing> {
    const [existing] = await db.select().from(roomPricing)
      .where(and(eq(roomPricing.roomTypeId, data.roomTypeId), eq(roomPricing.date, data.date)));
    if (existing) {
      const [result] = await db.update(roomPricing)
        .set({ price: data.price, isLocked: data.isLocked })
        .where(eq(roomPricing.id, existing.id))
        .returning();
      return result;
    }
    const [result] = await db.insert(roomPricing).values(data).returning();
    return result;
  }

  async bulkUpsertRoomPricing(dataArr: InsertRoomPricing[]): Promise<RoomPricing[]> {
    const results: RoomPricing[] = [];
    for (const data of dataArr) {
      const result = await this.upsertRoomPricing(data);
      results.push(result);
    }
    return results;
  }

  async updateRoomPricingLock(id: number, isLocked: boolean): Promise<RoomPricing | undefined> {
    const [result] = await db.update(roomPricing).set({ isLocked }).where(eq(roomPricing.id, id)).returning();
    return result;
  }
}

export const storage = new DatabaseStorage();
