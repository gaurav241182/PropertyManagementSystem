import { eq, desc, and, gte, lte, lt, gt, ne, or, inArray, notInArray, isNull } from "drizzle-orm";
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

function hotelFilter(column: any, hotelId: number | null | undefined) {
  if (hotelId) return eq(column, hotelId);
  return undefined;
}

export interface IStorage {
  getHotels(): Promise<Hotel[]>;
  createHotel(data: InsertHotel): Promise<Hotel>;
  createHotelWithOwner(data: any): Promise<Hotel>;
  updateHotel(id: number, data: Partial<InsertHotel>): Promise<Hotel | undefined>;
  deleteHotel(id: number): Promise<void>;
  deleteHotelWithData(id: number): Promise<void>;
  getHotelById(id: number): Promise<Hotel | undefined>;

  getPlatformUsers(): Promise<PlatformUser[]>;
  getPlatformUserByEmail(email: string): Promise<PlatformUser | undefined>;
  createPlatformUser(data: InsertPlatformUser): Promise<PlatformUser>;
  updatePlatformUser(id: number, data: Partial<InsertPlatformUser>): Promise<PlatformUser | undefined>;
  deletePlatformUser(id: number): Promise<void>;

  getRoomTypes(hotelId?: number | null): Promise<RoomType[]>;
  createRoomType(data: InsertRoomType): Promise<RoomType>;
  updateRoomType(id: number, data: Partial<InsertRoomType>): Promise<RoomType | undefined>;
  deleteRoomType(id: number): Promise<void>;

  getRooms(hotelId?: number | null): Promise<Room[]>;
  getRoom(id: number): Promise<Room | undefined>;
  getRoomByNumber(roomNumber: string, hotelId?: number | null): Promise<Room | undefined>;
  createRoom(data: InsertRoom): Promise<Room>;
  updateRoom(id: number, data: Partial<InsertRoom>): Promise<Room | undefined>;
  deleteRoom(id: number): Promise<void>;

  getBookings(hotelId?: number | null): Promise<Booking[]>;
  getArchivedBookings(hotelId?: number | null): Promise<Booking[]>;
  getBooking(id: number): Promise<Booking | undefined>;
  getBookingByBookingId(bookingId: string): Promise<Booking | undefined>;
  createBooking(data: InsertBooking): Promise<Booking>;
  updateBooking(id: number, data: Partial<InsertBooking>): Promise<Booking | undefined>;
  archiveBooking(id: number): Promise<Booking | undefined>;
  unarchiveBooking(id: number): Promise<Booking | undefined>;
  deleteBooking(id: number): Promise<void>;
  getOverlappingBookings(roomId: number, checkIn: string, checkOut: string): Promise<Booking[]>;

  getStaff(hotelId?: number | null): Promise<Staff[]>;
  getStaffMember(id: number): Promise<Staff | undefined>;
  createStaff(data: InsertStaff): Promise<Staff>;
  updateStaff(id: number, data: Partial<InsertStaff>): Promise<Staff | undefined>;
  deleteStaff(id: number): Promise<void>;

  getExpenses(hotelId?: number | null): Promise<Expense[]>;
  createExpense(data: InsertExpense): Promise<Expense>;
  updateExpense(id: number, data: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: number): Promise<void>;

  getCategories(hotelId?: number | null): Promise<Category[]>;
  createCategory(data: InsertCategory): Promise<Category>;
  createCategoriesBulk(items: InsertCategory[]): Promise<Category[]>;
  updateCategory(id: number, data: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<void>;
  deleteCategoryByType(type: string, hotelId?: number | null): Promise<void>;
  syncCategoryType(type: string, taxable: boolean, subtypes: Array<{ id?: number; subtype: string; item: string }>, hotelId?: number | null): Promise<Category[]>;

  getMenuItems(hotelId?: number | null): Promise<MenuItem[]>;
  createMenuItem(data: InsertMenuItem): Promise<MenuItem>;
  updateMenuItem(id: number, data: Partial<InsertMenuItem>): Promise<MenuItem | undefined>;
  deleteMenuItem(id: number): Promise<void>;

  getMenus(hotelId?: number | null): Promise<Menu[]>;
  createMenu(data: InsertMenu): Promise<Menu>;
  updateMenu(id: number, data: Partial<InsertMenu>): Promise<Menu | undefined>;
  deleteMenu(id: number): Promise<void>;

  getFacilities(hotelId?: number | null): Promise<Facility[]>;
  createFacility(data: InsertFacility): Promise<Facility>;
  updateFacility(id: number, data: Partial<InsertFacility>): Promise<Facility | undefined>;
  deleteFacility(id: number): Promise<void>;

  getOrders(hotelId?: number | null): Promise<Order[]>;
  getOrdersByBookingId(bookingId: string): Promise<Order[]>;
  createOrder(data: InsertOrder): Promise<Order>;
  updateOrder(id: number, data: Partial<InsertOrder>): Promise<Order | undefined>;

  getOrderItems(orderId: string): Promise<OrderItem[]>;
  createOrderItem(data: InsertOrderItem): Promise<OrderItem>;

  getSettings(hotelId?: number | null): Promise<Setting[]>;
  getSetting(key: string, hotelId?: number | null): Promise<Setting | undefined>;
  upsertSetting(key: string, value: string, hotelId?: number | null): Promise<Setting>;

  getSalaries(hotelId?: number | null): Promise<Salary[]>;
  getSalariesByMonth(month: string, hotelId?: number | null): Promise<Salary[]>;
  createSalary(data: InsertSalary): Promise<Salary>;
  updateSalary(id: number, data: Partial<InsertSalary>): Promise<Salary | undefined>;
  deleteSalary(id: number): Promise<void>;

  getBookingCharges(bookingId: string): Promise<BookingCharge[]>;
  getAllBookingCharges(hotelId?: number | null): Promise<BookingCharge[]>;
  createBookingCharge(data: InsertBookingCharge): Promise<BookingCharge>;

  getRoomPricing(roomTypeId?: number, hotelId?: number | null): Promise<RoomPricing[]>;
  upsertRoomPricing(data: InsertRoomPricing): Promise<RoomPricing>;
  bulkUpsertRoomPricing(data: InsertRoomPricing[]): Promise<RoomPricing[]>;
  updateRoomPricingLock(id: number, isLocked: boolean): Promise<RoomPricing | undefined>;

  getRoomBlocks(hotelId?: number | null): Promise<RoomBlock[]>;
  createRoomBlock(data: InsertRoomBlock): Promise<RoomBlock>;
  bulkCreateRoomBlocks(data: InsertRoomBlock[]): Promise<RoomBlock[]>;
  deleteRoomBlock(id: number): Promise<void>;
  deleteRoomBlocksByRoomAndDateRange(roomIds: number[], startDate: string, endDate: string): Promise<number>;

  getInvoiceSchedulerLogs(hotelId?: number | null): Promise<InvoiceSchedulerLog[]>;
  createInvoiceSchedulerLog(data: InsertInvoiceSchedulerLog): Promise<InvoiceSchedulerLog>;
  updateInvoiceSchedulerLog(id: number, data: Partial<InsertInvoiceSchedulerLog>): Promise<InvoiceSchedulerLog | undefined>;

  getCheckedOutBookingsInRange(startDate: string, endDate: string, hotelId?: number | null): Promise<Booking[]>;
}

export class DatabaseStorage implements IStorage {
  async getHotels(): Promise<Hotel[]> {
    return db.select().from(hotels).orderBy(desc(hotels.createdAt));
  }
  async createHotel(data: InsertHotel): Promise<Hotel> {
    const [result] = await db.insert(hotels).values(data).returning();
    return result;
  }
  async createHotelWithOwner(data: any): Promise<Hotel> {
    return await db.transaction(async (tx) => {
      const password = data.adminPassword || "password123";
      const { adminPassword, ...hotelData } = data;
      const [hotel] = await tx.insert(hotels).values(hotelData).returning();
      await tx.insert(platformUsers).values({
        name: data.ownerName,
        email: data.ownerEmail,
        password: password,
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
  async deleteHotelWithData(id: number): Promise<void> {
    await db.transaction(async (tx) => {
      const hid = id;
      const hotelBookings = await tx.select().from(bookings).where(eq(bookings.hotelId, hid));
      for (const booking of hotelBookings) {
        await tx.delete(bookingCharges).where(eq(bookingCharges.bookingId, booking.bookingId));
        const bookingOrders = await tx.select({ orderId: orders.orderId }).from(orders).where(eq(orders.bookingId, booking.bookingId));
        if (bookingOrders.length > 0) {
          await tx.delete(orderItems).where(inArray(orderItems.orderId, bookingOrders.map(o => o.orderId)));
        }
        await tx.delete(orders).where(eq(orders.bookingId, booking.bookingId));
      }
      await tx.delete(bookings).where(eq(bookings.hotelId, hid));
      await tx.delete(roomPricing).where(eq(roomPricing.hotelId, hid));
      await tx.delete(roomBlocks).where(eq(roomBlocks.hotelId, hid));
      await tx.delete(rooms).where(eq(rooms.hotelId, hid));
      await tx.delete(roomTypes).where(eq(roomTypes.hotelId, hid));
      await tx.delete(staff).where(eq(staff.hotelId, hid));
      await tx.delete(salaries).where(eq(salaries.hotelId, hid));
      await tx.delete(expenses).where(eq(expenses.hotelId, hid));
      await tx.delete(categories).where(eq(categories.hotelId, hid));
      await tx.delete(menuItems).where(eq(menuItems.hotelId, hid));
      await tx.delete(menus).where(eq(menus.hotelId, hid));
      await tx.delete(facilities).where(eq(facilities.hotelId, hid));
      await tx.delete(settings).where(eq(settings.hotelId, hid));
      await tx.delete(invoiceSchedulerLogs).where(eq(invoiceSchedulerLogs.hotelId, hid));
      await tx.delete(platformUsers).where(eq(platformUsers.hotelId, hid));
      await tx.delete(hotels).where(eq(hotels.id, hid));
    });
  }
  async getHotelById(id: number): Promise<Hotel | undefined> {
    const [result] = await db.select().from(hotels).where(eq(hotels.id, id));
    return result;
  }

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

  async getRoomTypes(hotelId?: number | null): Promise<RoomType[]> {
    const conditions = [];
    if (hotelId) conditions.push(eq(roomTypes.hotelId, hotelId));
    if (conditions.length > 0) {
      return db.select().from(roomTypes).where(and(...conditions)).orderBy(roomTypes.id);
    }
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

  async getRooms(hotelId?: number | null): Promise<Room[]> {
    if (hotelId) {
      return db.select().from(rooms).where(eq(rooms.hotelId, hotelId)).orderBy(rooms.roomNumber);
    }
    return db.select().from(rooms).orderBy(rooms.roomNumber);
  }
  async getRoom(id: number): Promise<Room | undefined> {
    const [result] = await db.select().from(rooms).where(eq(rooms.id, id));
    return result;
  }
  async getRoomByNumber(roomNumber: string, hotelId?: number | null): Promise<Room | undefined> {
    if (hotelId) {
      const [result] = await db.select().from(rooms).where(and(eq(rooms.roomNumber, roomNumber), eq(rooms.hotelId, hotelId)));
      return result;
    }
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

  async getBookings(hotelId?: number | null): Promise<Booking[]> {
    if (hotelId) {
      return db.select().from(bookings).where(and(eq(bookings.archived, false), eq(bookings.hotelId, hotelId))).orderBy(desc(bookings.createdAt));
    }
    return db.select().from(bookings).where(eq(bookings.archived, false)).orderBy(desc(bookings.createdAt));
  }
  async getArchivedBookings(hotelId?: number | null): Promise<Booking[]> {
    if (hotelId) {
      return db.select().from(bookings).where(and(eq(bookings.archived, true), eq(bookings.hotelId, hotelId))).orderBy(desc(bookings.archivedAt));
    }
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

  async getStaff(hotelId?: number | null): Promise<Staff[]> {
    if (hotelId) {
      return db.select().from(staff).where(eq(staff.hotelId, hotelId)).orderBy(staff.name);
    }
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

  async getExpenses(hotelId?: number | null): Promise<Expense[]> {
    if (hotelId) {
      return db.select().from(expenses).where(eq(expenses.hotelId, hotelId)).orderBy(desc(expenses.date));
    }
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

  async getCategories(hotelId?: number | null): Promise<Category[]> {
    if (hotelId) {
      return db.select().from(categories).where(eq(categories.hotelId, hotelId)).orderBy(categories.type, categories.subtype);
    }
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
  async deleteCategoryByType(type: string, hotelId?: number | null): Promise<void> {
    if (hotelId) {
      await db.delete(categories).where(and(eq(categories.type, type), eq(categories.hotelId, hotelId)));
    } else {
      await db.delete(categories).where(eq(categories.type, type));
    }
  }
  async syncCategoryType(type: string, taxable: boolean, subtypes: Array<{ id?: number; subtype: string; item: string }>, hotelId?: number | null): Promise<Category[]> {
    const condition = hotelId
      ? and(eq(categories.type, type), eq(categories.hotelId, hotelId))
      : eq(categories.type, type);
    const existing = await db.select().from(categories).where(condition!);
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
        await db.insert(categories).values({ type, subtype: s.subtype, item: s.item, taxable, hotelId });
      }
    }
    return db.select().from(categories).where(condition!);
  }

  async getMenuItems(hotelId?: number | null): Promise<MenuItem[]> {
    if (hotelId) {
      return db.select().from(menuItems).where(eq(menuItems.hotelId, hotelId)).orderBy(menuItems.category, menuItems.name);
    }
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

  async getMenus(hotelId?: number | null): Promise<Menu[]> {
    if (hotelId) {
      return db.select().from(menus).where(eq(menus.hotelId, hotelId)).orderBy(desc(menus.createdAt));
    }
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

  async getFacilities(hotelId?: number | null): Promise<Facility[]> {
    if (hotelId) {
      return db.select().from(facilities).where(eq(facilities.hotelId, hotelId)).orderBy(facilities.name);
    }
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

  async getOrders(hotelId?: number | null): Promise<Order[]> {
    if (hotelId) {
      return db.select().from(orders).where(eq(orders.hotelId, hotelId)).orderBy(desc(orders.createdAt));
    }
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

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }
  async createOrderItem(data: InsertOrderItem): Promise<OrderItem> {
    const [result] = await db.insert(orderItems).values(data).returning();
    return result;
  }

  async getSettings(hotelId?: number | null): Promise<Setting[]> {
    if (hotelId) {
      return db.select().from(settings).where(eq(settings.hotelId, hotelId));
    }
    return db.select().from(settings);
  }
  async getSetting(key: string, hotelId?: number | null): Promise<Setting | undefined> {
    if (hotelId) {
      const [result] = await db.select().from(settings).where(and(eq(settings.key, key), eq(settings.hotelId, hotelId)));
      return result;
    }
    const [result] = await db.select().from(settings).where(eq(settings.key, key));
    return result;
  }
  async upsertSetting(key: string, value: string, hotelId?: number | null): Promise<Setting> {
    const existing = await this.getSetting(key, hotelId);
    if (existing) {
      const [result] = await db.update(settings).set({ value }).where(eq(settings.id, existing.id)).returning();
      return result;
    }
    const [result] = await db.insert(settings).values({ key, value, hotelId }).returning();
    return result;
  }

  async getSalaries(hotelId?: number | null): Promise<Salary[]> {
    if (hotelId) {
      return db.select().from(salaries).where(eq(salaries.hotelId, hotelId)).orderBy(desc(salaries.month));
    }
    return db.select().from(salaries).orderBy(desc(salaries.month));
  }
  async getSalariesByMonth(month: string, hotelId?: number | null): Promise<Salary[]> {
    if (hotelId) {
      return db.select().from(salaries).where(and(eq(salaries.month, month), eq(salaries.hotelId, hotelId)));
    }
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

  async getBookingCharges(bookingId: string): Promise<BookingCharge[]> {
    return db.select().from(bookingCharges).where(eq(bookingCharges.bookingId, bookingId)).orderBy(bookingCharges.createdAt);
  }
  async getAllBookingCharges(hotelId?: number | null): Promise<BookingCharge[]> {
    if (hotelId) {
      return db.select().from(bookingCharges).where(eq(bookingCharges.hotelId, hotelId)).orderBy(bookingCharges.createdAt);
    }
    return db.select().from(bookingCharges).orderBy(bookingCharges.createdAt);
  }
  async createBookingCharge(data: InsertBookingCharge): Promise<BookingCharge> {
    const [result] = await db.insert(bookingCharges).values(data).returning();
    return result;
  }
  async deleteBookingCharge(id: number): Promise<void> {
    await db.delete(bookingCharges).where(eq(bookingCharges.id, id));
  }

  async getRoomPricing(roomTypeId?: number, hotelId?: number | null): Promise<RoomPricing[]> {
    const conditions = [];
    if (roomTypeId) conditions.push(eq(roomPricing.roomTypeId, roomTypeId));
    if (hotelId) conditions.push(eq(roomPricing.hotelId, hotelId));
    if (conditions.length > 0) {
      return db.select().from(roomPricing).where(and(...conditions)).orderBy(roomPricing.roomTypeId, roomPricing.date);
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

  async getRoomBlocks(hotelId?: number | null): Promise<RoomBlock[]> {
    if (hotelId) {
      return db.select().from(roomBlocks).where(eq(roomBlocks.hotelId, hotelId)).orderBy(desc(roomBlocks.createdAt));
    }
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

  async getInvoiceSchedulerLogs(hotelId?: number | null): Promise<InvoiceSchedulerLog[]> {
    if (hotelId) {
      return db.select().from(invoiceSchedulerLogs).where(eq(invoiceSchedulerLogs.hotelId, hotelId)).orderBy(desc(invoiceSchedulerLogs.createdAt));
    }
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

  async getCheckedOutBookingsInRange(startDate: string, endDate: string, hotelId?: number | null): Promise<Booking[]> {
    const conditions = [
      eq(bookings.status, "checked_out"),
      gte(bookings.checkOut, startDate),
      lte(bookings.checkOut, endDate)
    ];
    if (hotelId) conditions.push(eq(bookings.hotelId, hotelId));
    return db.select().from(bookings).where(and(...conditions)).orderBy(bookings.checkOut);
  }
}

export const storage = new DatabaseStorage();
