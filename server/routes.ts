import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStaffSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ============= AUTH =============
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const user = await storage.getPlatformUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (user.status !== "Active") {
      return res.status(403).json({ message: "Account is deactivated. Contact your administrator." });
    }
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      hotelId: user.hotelId,
    };
    await storage.updatePlatformUser(user.id, { lastLogin: new Date() } as any);
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      hotelId: user.hotelId,
    });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.session.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(req.session.user);
  });

  app.post("/api/auth/verify-password", async (req, res) => {
    if (!req.session.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }
    const user = await storage.getPlatformUserByEmail(req.session.user.email);
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Incorrect password" });
    }
    res.json({ verified: true });
  });

  app.post("/api/auth/seed", async (_req, res) => {
    try {
      const existingAdmin = await storage.getPlatformUserByEmail("admin@yellowberry.com");
      if (existingAdmin) {
        return res.json({ message: "Sample users already exist" });
      }
      await storage.createPlatformUser({
        name: "Platform Admin",
        email: "admin@yellowberry.com",
        password: "admin123",
        role: "super_admin",
        hotelId: null,
        status: "Active",
      });
      await storage.createPlatformUser({
        name: "Hotel Owner",
        email: "owner@demo.com",
        password: "owner123",
        role: "owner",
        hotelId: null,
        status: "Active",
      });
      await storage.createPlatformUser({
        name: "Hotel Manager",
        email: "manager@demo.com",
        password: "manager123",
        role: "manager",
        hotelId: null,
        status: "Active",
      });
      res.json({ message: "Sample users created successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ============= HOTELS (Platform Admin) =============
  app.get("/api/hotels", async (_req, res) => {
    const data = await storage.getHotels();
    res.json(data);
  });

  app.post("/api/hotels", async (req, res) => {
    try {
      const result = await storage.createHotelWithOwner(req.body);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create hotel" });
    }
  });

  app.patch("/api/hotels/:id", async (req, res) => {
    const data = await storage.updateHotel(Number(req.params.id), req.body);
    if (!data) return res.status(404).json({ message: "Not found" });
    res.json(data);
  });

  app.delete("/api/hotels/:id", async (req, res) => {
    await storage.deleteHotel(Number(req.params.id));
    res.status(204).send();
  });

  // ============= PLATFORM USERS =============
  app.get("/api/platform-users", async (_req, res) => {
    const data = await storage.getPlatformUsers();
    res.json(data);
  });

  app.post("/api/platform-users", async (req, res) => {
    try {
      const data = await storage.createPlatformUser(req.body);
      res.status(201).json(data);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create user" });
    }
  });

  app.patch("/api/platform-users/:id", async (req, res) => {
    const data = await storage.updatePlatformUser(Number(req.params.id), req.body);
    if (!data) return res.status(404).json({ message: "Not found" });
    res.json(data);
  });

  app.delete("/api/platform-users/:id", async (req, res) => {
    await storage.deletePlatformUser(Number(req.params.id));
    res.status(204).send();
  });

  // ============= ROOM TYPES =============
  app.get("/api/room-types", async (_req, res) => {
    const data = await storage.getRoomTypes();
    res.json(data);
  });

  app.post("/api/room-types", async (req, res) => {
    const data = await storage.createRoomType(req.body);
    res.status(201).json(data);
  });

  app.patch("/api/room-types/:id", async (req, res) => {
    const data = await storage.updateRoomType(Number(req.params.id), req.body);
    if (!data) return res.status(404).json({ message: "Not found" });
    res.json(data);
  });

  app.delete("/api/room-types/:id", async (req, res) => {
    await storage.deleteRoomType(Number(req.params.id));
    res.status(204).send();
  });

  // ============= ROOMS =============
  app.get("/api/rooms", async (_req, res) => {
    const data = await storage.getRooms();
    res.json(data);
  });

  app.post("/api/rooms", async (req, res) => {
    const data = await storage.createRoom(req.body);
    res.status(201).json(data);
  });

  app.patch("/api/rooms/:id", async (req, res) => {
    const data = await storage.updateRoom(Number(req.params.id), req.body);
    if (!data) return res.status(404).json({ message: "Not found" });
    res.json(data);
  });

  app.delete("/api/rooms/:id", async (req, res) => {
    await storage.deleteRoom(Number(req.params.id));
    res.status(204).send();
  });

  // ============= BOOKINGS =============
  app.get("/api/bookings", async (_req, res) => {
    const data = await storage.getBookings();
    res.json(data);
  });

  app.get("/api/bookings/:bookingId", async (req, res) => {
    const data = await storage.getBookingByBookingId(req.params.bookingId);
    if (!data) return res.status(404).json({ message: "Not found" });
    res.json(data);
  });

  app.get("/api/rooms/availability", async (req, res) => {
    const { checkIn, checkOut } = req.query;
    if (!checkIn || !checkOut) {
      return res.status(400).json({ message: "checkIn and checkOut query parameters are required" });
    }
    const allRooms = await storage.getRooms();
    const allBookings = await storage.getBookings();
    const bookedRoomIds = new Set<number>();
    for (const b of allBookings) {
      if (b.status === "cancelled" || b.status === "checked_out") continue;
      if (b.checkIn < (checkOut as string) && b.checkOut > (checkIn as string)) {
        bookedRoomIds.add(b.roomId);
      }
    }
    const result = allRooms.map(room => ({
      ...room,
      available: !bookedRoomIds.has(room.id) && room.status === "available"
    }));
    res.json(result);
  });

  app.post("/api/bookings", async (req, res) => {
    const { facilityCharges, overrideCapacity, ...bookingData } = req.body;
    const errors: string[] = [];
    if (!bookingData.guestName) errors.push("Guest name is required");
    if (!bookingData.roomId) errors.push("Room selection is required");
    if (!bookingData.roomTypeId) errors.push("Room type is required");
    if (!bookingData.checkIn) errors.push("Check-in date is required");
    if (!bookingData.checkOut) errors.push("Check-out date is required");
    if (bookingData.checkIn && bookingData.checkOut && bookingData.checkIn >= bookingData.checkOut) {
      errors.push("Check-out date must be after check-in date");
    }
    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join(". ") });
    }
    const sessionUser = req.session.user;
    const canOverride = overrideCapacity && sessionUser && (sessionUser.role === "owner" || sessionUser.role === "manager");
    if (!canOverride && bookingData.roomTypeId) {
      const allRoomTypes = await storage.getRoomTypes();
      const roomType = allRoomTypes.find(rt => rt.id === Number(bookingData.roomTypeId));
      if (roomType) {
        const adults = Number(bookingData.adults) || 0;
        const children = Number(bookingData.children) || 0;
        if (adults > roomType.maxAdults) {
          errors.push(`Adults (${adults}) exceeds room type maximum of ${roomType.maxAdults}`);
        }
        if (children > roomType.maxChildren) {
          errors.push(`Children (${children}) exceeds room type maximum of ${roomType.maxChildren}`);
        }
        if (errors.length > 0) {
          return res.status(400).json({ message: errors.join(". ") });
        }
      }
    }
    const overlaps = await storage.getOverlappingBookings(bookingData.roomId, bookingData.checkIn, bookingData.checkOut);
    if (overlaps.length > 0) {
      return res.status(409).json({ message: `Room is already booked for the selected dates (conflicts with booking ${overlaps[0].bookingId})` });
    }
    const data = await storage.createBooking(bookingData);
    if (facilityCharges && Array.isArray(facilityCharges) && facilityCharges.length > 0) {
      for (const charge of facilityCharges) {
        await storage.createBookingCharge({
          bookingId: data.bookingId,
          description: charge.description,
          category: charge.category || "Facility",
          amount: charge.amount,
        });
      }
    }
    res.status(201).json(data);
  });

  app.patch("/api/bookings/:id", async (req, res) => {
    const updates = { ...req.body };
    if (updates.status === "checked_in" && !updates.checkedInAt) {
      updates.checkedInAt = new Date();
    }
    if (updates.status === "checked_out" && !updates.checkedOutAt) {
      updates.checkedOutAt = new Date();
    }
    if (updates.status === "confirmed") {
      updates.checkedInAt = null;
      updates.checkedOutAt = null;
    }
    const data = await storage.updateBooking(Number(req.params.id), updates);
    if (!data) return res.status(404).json({ message: "Not found" });
    res.json(data);
  });

  app.delete("/api/bookings/:id", async (req, res) => {
    await storage.deleteBooking(Number(req.params.id));
    res.status(204).send();
  });

  // ============= GUEST AUTH =============
  app.post("/api/guest/login", async (req, res) => {
    const { bookingId, lastName } = req.body;
    if (!bookingId || !lastName) {
      return res.status(400).json({ message: "Booking ID and Last Name required" });
    }
    const booking = await storage.getBookingByBookingId(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    if (booking.guestLastName.toLowerCase() !== lastName.toLowerCase()) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    if (booking.status !== "checked_in") {
      return res.status(403).json({ message: "Guest must be checked in to access portal" });
    }
    res.json({
      bookingId: booking.bookingId,
      guestName: booking.guestName,
      roomNumber: "", // will be resolved from room
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      status: booking.status,
    });
  });

  app.get("/api/guest/:bookingId/orders", async (req, res) => {
    const orders = await storage.getOrdersByBookingId(req.params.bookingId);
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await storage.getOrderItems(order.orderId);
        return { ...order, items };
      })
    );
    res.json(ordersWithItems);
  });

  // ============= STAFF =============
  app.get("/api/staff", async (_req, res) => {
    const data = await storage.getStaff();
    res.json(data);
  });

  app.post("/api/staff", async (req, res) => {
    try {
      const parsed = insertStaffSchema.parse(req.body);
      const data = await storage.createStaff(parsed);
      
      const totalSalary = Number(data.salary) || 0;
      const basicPay = Number(data.basicPay) || totalSalary;
      if (totalSalary > 0) {
        const now = new Date();
        const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const joinDate = data.joinDate ? new Date(data.joinDate + "T00:00:00") : now;
        let netPay = totalSalary;
        if (!isNaN(joinDate.getTime()) && joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear()) {
          const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
          const dayOfJoining = joinDate.getDate();
          const daysWorked = daysInMonth - dayOfJoining + 1;
          netPay = Math.round((totalSalary / daysInMonth) * daysWorked);
        }
        const bonusAmt = Number(data.bonusAmount) || 0;
        const welfareAmount = data.welfareEnabled ? Math.round(basicPay * 0.01) : 0;
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const dueDateStr = lastDay.toISOString().split('T')[0];
        await storage.createSalary({
          staffId: data.id,
          month,
          basicSalary: String(totalSalary),
          bonus: String(bonusAmt),
          deductions: "0",
          welfareContribution: String(welfareAmount),
          netPay: String(netPay + bonusAmt),
          advanceAmount: "0",
          dueDate: dueDateStr,
          status: "Pending",
          paidDate: null,
        });
      }
      
      res.status(201).json(data);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Invalid staff data" });
    }
  });

  app.patch("/api/staff/:id", async (req, res) => {
    try {
      const partialSchema = insertStaffSchema.partial();
      const parsed = partialSchema.parse(req.body);
      const data = await storage.updateStaff(Number(req.params.id), parsed);
      if (!data) return res.status(404).json({ message: "Not found" });
      res.json(data);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Invalid update data" });
    }
  });

  app.delete("/api/staff/:id", async (req, res) => {
    await storage.deleteStaff(Number(req.params.id));
    res.status(204).send();
  });

  // ============= EXPENSES =============
  app.get("/api/expenses", async (_req, res) => {
    const data = await storage.getExpenses();
    res.json(data);
  });

  app.post("/api/expenses", async (req, res) => {
    const data = await storage.createExpense(req.body);
    res.status(201).json(data);
  });

  app.patch("/api/expenses/:id", async (req, res) => {
    const data = await storage.updateExpense(Number(req.params.id), req.body);
    if (!data) return res.status(404).json({ message: "Not found" });
    res.json(data);
  });

  app.delete("/api/expenses/:id", async (req, res) => {
    await storage.deleteExpense(Number(req.params.id));
    res.status(204).send();
  });

  // ============= CATEGORIES =============
  app.get("/api/categories", async (_req, res) => {
    const data = await storage.getCategories();
    res.json(data);
  });

  app.post("/api/categories", async (req, res) => {
    const data = await storage.createCategory(req.body);
    res.status(201).json(data);
  });

  app.post("/api/categories/bulk", async (req, res) => {
    const { type, taxable, subtypes } = req.body;
    if (!type || !Array.isArray(subtypes)) {
      return res.status(400).json({ message: "type and subtypes array required" });
    }
    const items = subtypes.map((s: any) => ({
      type,
      subtype: s.subtype || "",
      item: s.item || "",
      taxable: taxable || false,
    }));
    const data = await storage.createCategoriesBulk(items);
    res.status(201).json(data);
  });

  app.put("/api/categories/sync", async (req, res) => {
    const { type, taxable, subtypes } = req.body;
    if (!type || !Array.isArray(subtypes)) {
      return res.status(400).json({ message: "type and subtypes array required" });
    }
    const data = await storage.syncCategoryType(type, taxable || false, subtypes);
    res.json(data);
  });

  app.patch("/api/categories/:id", async (req, res) => {
    const data = await storage.updateCategory(Number(req.params.id), req.body);
    if (!data) return res.status(404).json({ message: "Not found" });
    res.json(data);
  });

  app.delete("/api/categories/type/:type", async (req, res) => {
    await storage.deleteCategoryByType(req.params.type);
    res.status(204).send();
  });

  app.delete("/api/categories/:id", async (req, res) => {
    await storage.deleteCategory(Number(req.params.id));
    res.status(204).send();
  });

  // ============= MENU ITEMS =============
  app.get("/api/menu-items", async (_req, res) => {
    const data = await storage.getMenuItems();
    res.json(data);
  });

  app.post("/api/menu-items", async (req, res) => {
    const data = await storage.createMenuItem(req.body);
    res.status(201).json(data);
  });

  app.patch("/api/menu-items/:id", async (req, res) => {
    const data = await storage.updateMenuItem(Number(req.params.id), req.body);
    if (!data) return res.status(404).json({ message: "Not found" });
    res.json(data);
  });

  app.delete("/api/menu-items/:id", async (req, res) => {
    await storage.deleteMenuItem(Number(req.params.id));
    res.status(204).send();
  });

  // ============= FACILITIES =============
  app.get("/api/facilities", async (_req, res) => {
    const data = await storage.getFacilities();
    res.json(data);
  });

  app.post("/api/facilities", async (req, res) => {
    const data = await storage.createFacility(req.body);
    res.status(201).json(data);
  });

  app.patch("/api/facilities/:id", async (req, res) => {
    const data = await storage.updateFacility(Number(req.params.id), req.body);
    if (!data) return res.status(404).json({ message: "Not found" });
    res.json(data);
  });

  app.delete("/api/facilities/:id", async (req, res) => {
    await storage.deleteFacility(Number(req.params.id));
    res.status(204).send();
  });

  // ============= ORDERS =============
  app.get("/api/orders", async (_req, res) => {
    const allOrders = await storage.getOrders();
    const ordersWithItems = await Promise.all(
      allOrders.map(async (order) => {
        const items = await storage.getOrderItems(order.orderId);
        return { ...order, items };
      })
    );
    res.json(ordersWithItems);
  });

  app.post("/api/orders", async (req, res) => {
    const { items, ...orderData } = req.body;
    const order = await storage.createOrder(orderData);
    if (items && Array.isArray(items)) {
      for (const item of items) {
        await storage.createOrderItem({ ...item, orderId: order.orderId });
      }
    }
    const orderItemsList = await storage.getOrderItems(order.orderId);
    res.status(201).json({ ...order, items: orderItemsList });
  });

  app.patch("/api/orders/:id", async (req, res) => {
    const order = await storage.updateOrder(Number(req.params.id), req.body);
    if (!order) return res.status(404).json({ message: "Not found" });

    if (req.body.status === "Fulfilled" && order.bookingId) {
      const items = await storage.getOrderItems(order.orderId);
      const desc = items.map(i => `${i.itemName} x${i.quantity}`).join(", ");
      await storage.createBookingCharge({
        bookingId: order.bookingId,
        orderId: order.orderId,
        description: desc || `${order.type} Order ${order.orderId}`,
        category: order.type === "Food" ? "Food" : "Facility",
        amount: order.totalAmount,
      });
    }

    const orderItems = await storage.getOrderItems(order.orderId);
    res.json({ ...order, items: orderItems });
  });

  // ============= SETTINGS =============
  app.get("/api/settings", async (_req, res) => {
    const data = await storage.getSettings();
    const settingsObj: Record<string, string> = {};
    data.forEach((s) => { settingsObj[s.key] = s.value; });
    res.json(settingsObj);
  });

  app.post("/api/settings", async (req, res) => {
    const entries = Object.entries(req.body) as [string, string][];
    for (const [key, value] of entries) {
      await storage.upsertSetting(key, String(value));
    }
    res.json({ message: "Settings saved" });
  });

  // ============= SALARIES =============
  app.get("/api/salaries", async (req, res) => {
    const month = req.query.month as string | undefined;
    const data = month
      ? await storage.getSalariesByMonth(month)
      : await storage.getSalaries();
    res.json(data);
  });

  app.post("/api/salaries", async (req, res) => {
    const data = await storage.createSalary(req.body);
    res.status(201).json(data);
  });

  app.patch("/api/salaries/:id", async (req, res) => {
    const data = await storage.updateSalary(Number(req.params.id), req.body);
    if (!data) return res.status(404).json({ message: "Not found" });
    res.json(data);
  });

  app.delete("/api/salaries/:id", async (req, res) => {
    await storage.deleteSalary(Number(req.params.id));
    res.json({ success: true });
  });

  app.post("/api/salaries/:id/advance", async (req, res) => {
    try {
      const salaryId = Number(req.params.id);
      const { amount } = req.body;
      const advanceAmount = Number(amount) || 0;
      if (advanceAmount <= 0) {
        return res.status(400).json({ message: "Advance amount must be greater than 0" });
      }

      const allSalaries = await storage.getSalaries();
      const salary = allSalaries.find((s: any) => s.id === salaryId);
      if (!salary) return res.status(404).json({ message: "Salary record not found" });

      const netPay = Number(salary.netPay) || 0;
      const existingAdvance = Number(salary.advanceAmount) || 0;
      const totalAdvance = existingAdvance + advanceAmount;
      const pendingAfterAdvance = netPay - totalAdvance;

      if (pendingAfterAdvance <= 0) {
        await storage.updateSalary(salaryId, {
          advanceAmount: String(totalAdvance),
          status: "Paid",
          paidDate: new Date().toISOString().split('T')[0],
        });

        if (pendingAfterAdvance < 0) {
          const overflow = Math.abs(pendingAfterAdvance);
          const [yearStr, monthStr] = salary.month.split("-");
          let nextYear = parseInt(yearStr);
          let nextMonth = parseInt(monthStr) + 1;
          if (nextMonth > 12) { nextMonth = 1; nextYear++; }
          const nextMonthKey = `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
          const nextLastDay = new Date(nextYear, nextMonth, 0);
          const nextDueDate = nextLastDay.toISOString().split('T')[0];

          const existingNext = allSalaries.find(
            (s: any) => s.staffId === salary.staffId && s.month === nextMonthKey
          );

          if (existingNext) {
            const existNextAdv = Number(existingNext.advanceAmount) || 0;
            await storage.updateSalary(existingNext.id, {
              advanceAmount: String(existNextAdv + overflow),
            });
          } else {
            await storage.createSalary({
              staffId: salary.staffId,
              month: nextMonthKey,
              basicSalary: salary.basicSalary,
              bonus: salary.bonus,
              deductions: "0",
              welfareContribution: salary.welfareContribution,
              netPay: salary.netPay,
              advanceAmount: String(overflow),
              dueDate: nextDueDate,
              status: "Pending",
              paidDate: null,
            });
          }
        }
      } else {
        await storage.updateSalary(salaryId, {
          advanceAmount: String(totalAdvance),
        });
      }

      const updated = (await storage.getSalaries()).find((s: any) => s.id === salaryId);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to process advance" });
    }
  });

  // ============= BOOKING CHARGES =============
  app.get("/api/booking-charges", async (req, res) => {
    const data = await storage.getAllBookingCharges();
    res.json(data);
  });

  app.get("/api/booking-charges/:bookingId", async (req, res) => {
    const data = await storage.getBookingCharges(req.params.bookingId);
    res.json(data);
  });

  app.post("/api/booking-charges", async (req, res) => {
    const data = await storage.createBookingCharge(req.body);
    res.status(201).json(data);
  });

  app.delete("/api/booking-charges/:id", async (req, res) => {
    await storage.deleteBookingCharge(Number(req.params.id));
    res.json({ success: true });
  });

  // ============= ROOM PRICING =============
  app.get("/api/room-pricing", async (req, res) => {
    const roomTypeId = req.query.roomTypeId ? Number(req.query.roomTypeId) : undefined;
    const data = await storage.getRoomPricing(roomTypeId);
    res.json(data);
  });

  app.post("/api/room-pricing", async (req, res) => {
    try {
      const { roomTypeId, date, price, isLocked } = req.body;
      if (!roomTypeId || !date || price === undefined) {
        return res.status(400).json({ message: "roomTypeId, date, and price are required" });
      }
      const result = await storage.upsertRoomPricing({
        roomTypeId,
        date,
        price: String(price),
        isLocked: isLocked ?? false,
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/room-pricing/bulk", async (req, res) => {
    try {
      const items = req.body;
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Request body must be a non-empty array" });
      }
      const mapped = items.map((item: any) => ({
        roomTypeId: item.roomTypeId,
        date: item.date,
        price: String(item.price),
        isLocked: item.isLocked ?? false,
      }));
      const results = await storage.bulkUpsertRoomPricing(mapped);
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/room-pricing/:id/lock", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { isLocked } = req.body;
      if (typeof isLocked !== "boolean") {
        return res.status(400).json({ message: "isLocked must be a boolean" });
      }
      const result = await storage.updateRoomPricingLock(id, isLocked);
      if (!result) return res.status(404).json({ message: "Pricing record not found" });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============= ROOM BLOCKS =============
  app.get("/api/room-blocks", async (_req, res) => {
    const data = await storage.getRoomBlocks();
    res.json(data);
  });

  app.post("/api/room-blocks", async (req, res) => {
    try {
      const items = req.body;
      if (Array.isArray(items)) {
        const results = await storage.bulkCreateRoomBlocks(items);
        res.status(201).json(results);
      } else {
        const result = await storage.createRoomBlock(items);
        res.status(201).json(result);
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/room-blocks/:id", async (req, res) => {
    await storage.deleteRoomBlock(Number(req.params.id));
    res.status(204).send();
  });

  app.post("/api/room-blocks/unblock", async (req, res) => {
    try {
      const { roomIds, startDate, endDate } = req.body;
      if (!roomIds || !startDate || !endDate) {
        return res.status(400).json({ message: "roomIds, startDate, and endDate are required" });
      }
      const count = await storage.deleteRoomBlocksByRoomAndDateRange(roomIds, startDate, endDate);
      res.json({ deleted: count });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============= ROOM CALENDAR STATUS =============
  app.get("/api/rooms/calendar-status", async (req, res) => {
    try {
      const { roomTypeId, roomId, startDate: qStart, endDate: qEnd } = req.query;
      if (!qStart || !qEnd) {
        return res.status(400).json({ message: "startDate and endDate query parameters are required (YYYY-MM-DD)" });
      }

      const startDateStr = qStart as string;
      const endDateStr = qEnd as string;

      const allRooms = await storage.getRooms();
      let filteredRooms = allRooms;
      if (roomTypeId) {
        filteredRooms = filteredRooms.filter(r => r.roomTypeId === Number(roomTypeId));
      }
      if (roomId) {
        filteredRooms = filteredRooms.filter(r => r.id === Number(roomId));
      }

      const allBookings = await storage.getBookings();
      const activeBookings = allBookings.filter(b =>
        b.status !== "cancelled" && b.status !== "checked_out" &&
        b.checkIn <= endDateStr && b.checkOut > startDateStr
      );

      const allBlocks = await storage.getRoomBlocks();
      const relevantBlocks = allBlocks.filter(b =>
        b.startDate <= endDateStr && b.endDate >= startDateStr
      );

      const result: Record<string, { status: string; bookingStatus: string; bookedCount: number; checkedInCount: number; blockedCount: number; availableCount: number; totalRooms: number }> = {};

      const start = new Date(startDateStr);
      const end = new Date(endDateStr);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateKey = d.toISOString().split("T")[0];
        let bookedCount = 0;
        let checkedInCount = 0;
        let blockedCount = 0;
        let availableCount = 0;

        for (const room of filteredRooms) {
          if (room.status === "blocked" || room.status === "maintenance") {
            blockedCount++;
            continue;
          }

          const hasBlock = relevantBlocks.some(b =>
            b.roomId === room.id && b.startDate <= dateKey && b.endDate >= dateKey
          );
          if (hasBlock) {
            blockedCount++;
            continue;
          }

          const booking = activeBookings.find(b =>
            b.roomId === room.id && b.checkIn <= dateKey && b.checkOut > dateKey
          );
          if (booking) {
            if (booking.status === "checked_in") {
              checkedInCount++;
            } else {
              bookedCount++;
            }
          } else {
            availableCount++;
          }
        }

        let status = "available";
        let bookingStatus = "available";
        const isSingleRoom = filteredRooms.length === 1 || (roomId && roomId !== "all");

        if (isSingleRoom) {
          if (blockedCount > 0) { status = "blocked"; bookingStatus = "blocked"; }
          else if (checkedInCount > 0) { status = "checked_in"; bookingStatus = "checked_in"; }
          else if (bookedCount > 0) { status = "booked"; bookingStatus = "confirmed"; }
          else { status = "available"; bookingStatus = "available"; }
        } else {
          if (availableCount > 0) {
            status = "available";
            bookingStatus = "available";
          } else if (blockedCount === filteredRooms.length) {
            status = "blocked";
            bookingStatus = "blocked";
          } else if (checkedInCount > 0) {
            status = "checked_in";
            bookingStatus = "checked_in";
          } else {
            status = "booked";
            bookingStatus = "confirmed";
          }
        }

        result[dateKey] = { status, bookingStatus, bookedCount, checkedInCount, blockedCount, availableCount, totalRooms: filteredRooms.length };
      }

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
