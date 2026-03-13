import { eq, desc, and, gte, lte, lt, gt, ne, or, inArray, notInArray } from "drizzle-orm";
import { db } from "./db";
import {
  hotels, platformUsers, roomTypes, rooms, bookings, staff, expenses, categories,
  menuItems, menus, facilities, orders, orderItems, settings, salaries,
  bookingCharges, roomPricing, roomBlocks, invoiceSchedulerLogs,
  type InsertHotel, type Hotel,
  type InsertPlatformUser, type PlatformUser,
  type InsertRoomType, type RoomType,
  type InsertRoom, type Room,
  type InsertBooking, type Booking,
  type InsertStaff, type Staff,
  type InsertExpense, type Expense,
  type InsertCategory, type Category,
  type InsertMenuItem, type MenuItem,
  type InsertMenu, type Menu,
  type InsertFacility, type Facility,
  type InsertOrder, type Order,
  type InsertOrderItem, type OrderItem,
  type InsertSetting, type Setting,
  type InsertSalary, type Salary,
  type InsertBookingCharge, type BookingCharge,
  type InsertRoomPricing, type RoomPricing,
  type InsertRoomBlock, type RoomBlock,
  type InsertInvoiceSchedulerLog, type InvoiceSchedulerLog,
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
  getArchivedBookings(): Promise<Booking[]>;
  getBooking(id: number): Promise<Booking | undefined>;
  getBookingByBookingId(bookingId: string): Promise<Booking | undefined>;
  createBooking(data: InsertBooking): Promise<Booking>;
  updateBooking(id: number, data: Partial<InsertBooking>): Promise<Booking | undefined>;
  archiveBooking(id: number): Promise<Booking | undefined>;
  unarchiveBooking(id: number): Promise<Booking | undefined>;
  deleteBooking(id: number): Promise<void>;
  getOverlappingBookings(roomId: number, checkIn: string, checkOut: string): Promise<Booking[]>;

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
  createCategoriesBulk(items: InsertCategory[]): Promise<Category[]>;
  updateCategory(id: number, data: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<void>;
  deleteCategoryByType(type: string): Promise<void>;
  syncCategoryType(type: string, taxable: boolean, subtypes: Array<{ id?: number; subtype: string; item: string }>): Promise<Category[]>;

  // Menu Items
  getMenuItems(): Promise<MenuItem[]>;
  createMenuItem(data: InsertMenuItem): Promise<MenuItem>;
  updateMenuItem(id: number, data: Partial<InsertMenuItem>): Promise<MenuItem | undefined>;
  deleteMenuItem(id: number): Promise<void>;

  // Menus & Buffets
  getMenus(): Promise<Menu[]>;
  createMenu(data: InsertMenu): Promise<Menu>;
  updateMenu(id: number, data: Partial<InsertMenu>): Promise<Menu | undefined>;
  deleteMenu(id: number): Promise<void>;

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
  getAllBookingCharges(): Promise<BookingCharge[]>;
  createBookingCharge(data: InsertBookingCharge): Promise<BookingCharge>;

  // Room Pricing
  getRoomPricing(roomTypeId?: number): Promise<RoomPricing[]>;
  upsertRoomPricing(data: InsertRoomPricing): Promise<RoomPricing>;
  bulkUpsertRoomPricing(data: InsertRoomPricing[]): Promise<RoomPricing[]>;
  updateRoomPricingLock(id: number, isLocked: boolean): Promise<RoomPricing | undefined>;

  // Room Blocks
  getRoomBlocks(): Promise<RoomBlock[]>;
  createRoomBlock(data: InsertRoomBlock): Promise<RoomBlock>;
  bulkCreateRoomBlocks(data: InsertRoomBlock[]): Promise<RoomBlock[]>;
  deleteRoomBlock(id: number): Promise<void>;
  deleteRoomBlocksByRoomAndDateRange(roomIds: number[], startDate: string, endDate: string): Promise<number>;

  // Invoice Scheduler Logs
  getInvoiceSchedulerLogs(): Promise<InvoiceSchedulerLog[]>;
  createInvoiceSchedulerLog(data: InsertInvoiceSchedulerLog): Promise<InvoiceSchedulerLog>;
  updateInvoiceSchedulerLog(id: number, data: Partial<InsertInvoiceSchedulerLog>): Promise<InvoiceSchedulerLog | undefined>;

  // Checked-out bookings in date range (for tax invoices)
  getCheckedOutBookingsInRange(startDate: string, endDate: string): Promise<Booking[]>;
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
    return db.select().from(bookings).where(eq(bookings.archived, false)).orderBy(desc(bookings.createdAt));
  }
  async getArchivedBookings(): Promise<Booking[]> {
    return db.select().from(bookings).where(eq(bookings.archived, true)).orderBy(desc(bookings.archivedAt));
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
  async archiveBooking(id: number): Promise<Booking | undefined> {
    const [result] = await db.update(bookings).set({ archived: true, archivedAt: new Date() } as any).where(eq(bookings.id, id)).returning();
    return result;
  }
  async unarchiveBooking(id: number): Promise<Booking | undefined> {
    const [result] = await db.update(bookings).set({ archived: false, archivedAt: null } as any).where(eq(bookings.id, id)).returning();
    return result;
  }
  async deleteBooking(id: number): Promise<void> {
    await db.delete(bookings).where(eq(bookings.id, id));
  }
  async getOverlappingBookings(roomId: number, checkIn: string, checkOut: string): Promise<Booking[]> {
    return db.select().from(bookings).where(
      and(
        eq(bookings.roomId, roomId),
        lt(bookings.checkIn, checkOut),
        gt(bookings.checkOut, checkIn),
        ne(bookings.status, "cancelled"),
        ne(bookings.status, "checked_out")
      )
    );
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
  async createCategoriesBulk(items: InsertCategory[]): Promise<Category[]> {
    if (items.length === 0) return [];
    return db.insert(categories).values(items).returning();
  }
  async deleteCategory(id: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }
  async deleteCategoryByType(type: string): Promise<void> {
    await db.delete(categories).where(eq(categories.type, type));
  }
  async syncCategoryType(type: string, taxable: boolean, subtypes: Array<{ id?: number; subtype: string; item: string }>): Promise<Category[]> {
    const existing = await db.select().from(categories).where(eq(categories.type, type));
    const existingIds = existing.map(e => e.id);
    const incomingIds = subtypes.filter(s => s.id).map(s => s.id!);
    const toDelete = existingIds.filter(id => !incomingIds.includes(id));
    if (toDelete.length > 0) {
      for (const id of toDelete) {
        await db.delete(categories).where(eq(categories.id, id));
      }
    }
    for (const s of subtypes) {
      if (s.id) {
        await db.update(categories).set({ subtype: s.subtype, item: s.item, taxable }).where(eq(categories.id, s.id));
      } else {
        await db.insert(categories).values({ type, subtype: s.subtype, item: s.item, taxable });
      }
    }
    return db.select().from(categories).where(eq(categories.type, type));
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

  // Menus & Buffets
  async getMenus(): Promise<Menu[]> {
    return db.select().from(menus).orderBy(desc(menus.createdAt));
  }
  async createMenu(data: InsertMenu): Promise<Menu> {
    const [result] = await db.insert(menus).values(data).returning();
    return result;
  }
  async updateMenu(id: number, data: Partial<InsertMenu>): Promise<Menu | undefined> {
    const [result] = await db.update(menus).set(data).where(eq(menus.id, id)).returning();
    return result;
  }
  async deleteMenu(id: number): Promise<void> {
    await db.delete(menus).where(eq(menus.id, id));
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
  async getAllBookingCharges(): Promise<BookingCharge[]> {
    return db.select().from(bookingCharges).orderBy(bookingCharges.createdAt);
  }
  async createBookingCharge(data: InsertBookingCharge): Promise<BookingCharge> {
    const [result] = await db.insert(bookingCharges).values(data).returning();
    return result;
  }
  async deleteBookingCharge(id: number): Promise<void> {
    await db.delete(bookingCharges).where(eq(bookingCharges.id, id));
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

  // Room Blocks
  async getRoomBlocks(): Promise<RoomBlock[]> {
    return db.select().from(roomBlocks).orderBy(desc(roomBlocks.createdAt));
  }

  async createRoomBlock(data: InsertRoomBlock): Promise<RoomBlock> {
    const [result] = await db.insert(roomBlocks).values(data).returning();
    return result;
  }

  async bulkCreateRoomBlocks(dataArr: InsertRoomBlock[]): Promise<RoomBlock[]> {
    if (dataArr.length === 0) return [];
    const results = await db.insert(roomBlocks).values(dataArr).returning();
    return results;
  }

  async deleteRoomBlock(id: number): Promise<void> {
    await db.delete(roomBlocks).where(eq(roomBlocks.id, id));
  }

  async deleteRoomBlocksByRoomAndDateRange(roomIds: number[], startDate: string, endDate: string): Promise<number> {
    if (roomIds.length === 0) return 0;
    const overlapping = await db.select().from(roomBlocks).where(
      and(
        inArray(roomBlocks.roomId, roomIds),
        lte(roomBlocks.startDate, endDate),
        gte(roomBlocks.endDate, startDate)
      )
    );
    if (overlapping.length === 0) return 0;
    const ids = overlapping.map(b => b.id);
    await db.delete(roomBlocks).where(inArray(roomBlocks.id, ids));
    return ids.length;
  }

  async getInvoiceSchedulerLogs(): Promise<InvoiceSchedulerLog[]> {
    return db.select().from(invoiceSchedulerLogs).orderBy(desc(invoiceSchedulerLogs.createdAt));
  }

  async createInvoiceSchedulerLog(data: InsertInvoiceSchedulerLog): Promise<InvoiceSchedulerLog> {
    const [result] = await db.insert(invoiceSchedulerLogs).values(data).returning();
    return result;
  }

  async updateInvoiceSchedulerLog(id: number, data: Partial<InsertInvoiceSchedulerLog>): Promise<InvoiceSchedulerLog | undefined> {
    const [result] = await db.update(invoiceSchedulerLogs).set(data).where(eq(invoiceSchedulerLogs.id, id)).returning();
    return result;
  }

  async getCheckedOutBookingsInRange(startDate: string, endDate: string): Promise<Booking[]> {
    return db.select().from(bookings).where(
      and(
        eq(bookings.status, "checked_out"),
        gte(bookings.checkOut, startDate),
        lte(bookings.checkOut, endDate)
      )
    ).orderBy(bookings.checkOut);
  }
}

export const storage = new DatabaseStorage();
