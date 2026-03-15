import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStaffSchema } from "@shared/schema";
import { runTaxInvoiceJob, startScheduler, refreshScheduler } from "./tax-invoice-scheduler";
import { runSalaryGenerationJob, startSalaryScheduler, refreshSalaryScheduler } from "./salary-scheduler";

function getHotelId(req: Request): number | null {
  return req.session?.user?.hotelId || null;
}

function checkRecordScope(
  record: { hotelId?: number | null; branchId?: number | null } | undefined | null,
  req: Request,
  res: Response,
  activeBranchId?: number | null
): boolean {
  if (!record) {
    res.status(404).json({ message: "Not found" });
    return false;
  }
  if (req.session?.user?.role === "super_admin") return true;
  const userHotelId = req.session?.user?.hotelId;
  if (userHotelId && record.hotelId && record.hotelId !== userHotelId) {
    res.status(403).json({ message: "Access denied" });
    return false;
  }
  if (activeBranchId && record.branchId && record.branchId !== activeBranchId) {
    res.status(403).json({ message: "Access denied - wrong branch" });
    return false;
  }
  return true;
}

async function getBranchIdValidated(req: Request): Promise<number | null> {
  if (req.session?.user?.role === "super_admin") return null;

  const header = req.headers["x-branch-id"];
  if (!header) return null;
  const parsed = Number(header);
  if (isNaN(parsed) || parsed <= 0) return null;

  const userHotelId = req.session?.user?.hotelId;
  if (!userHotelId) return null;

  const branch = await storage.getBranch(parsed);
  if (!branch || branch.hotelId !== userHotelId) return null;

  return parsed;
}

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
    if (user.hotelId && user.role === "owner") {
      const hotel = await storage.getHotelById(user.hotelId);
      if (hotel && hotel.status === "Deactivated") {
        return res.status(403).json({ message: "Your hotel account has been deactivated. Please contact support." });
      }
      if (hotel && hotel.status === "Archived") {
        return res.status(403).json({ message: "Your hotel account has been archived. Please contact support." });
      }
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

  app.post("/api/hotels/:id/reset-owner-password", async (req, res) => {
    if (!req.session.user || req.session.user.role !== "super_admin") {
      return res.status(403).json({ message: "Only platform admins can reset passwords" });
    }
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    const hotel = await storage.getHotelById(Number(req.params.id));
    if (!hotel) return res.status(404).json({ message: "Hotel not found" });
    const users = await storage.getPlatformUsers();
    const owner = users.find(u => u.hotelId === hotel.id && u.role === "owner");
    if (!owner) return res.status(404).json({ message: "Hotel owner not found" });
    await storage.updatePlatformUser(owner.id, { password: newPassword } as any);
    res.json({ message: "Password reset successfully" });
  });

  app.post("/api/hotels/:id/archive", async (req, res) => {
    if (!req.session.user || req.session.user.role !== "super_admin") {
      return res.status(403).json({ message: "Only platform admins can archive hotels" });
    }
    const hotel = await storage.getHotelById(Number(req.params.id));
    if (!hotel) return res.status(404).json({ message: "Hotel not found" });
    if (hotel.status !== "Deactivated") {
      return res.status(400).json({ message: "Hotel must be deactivated before archiving" });
    }
    const updated = await storage.updateHotel(hotel.id, { status: "Archived" } as any);
    res.json(updated);
  });

  app.post("/api/hotels/:id/delete-permanent", async (req, res) => {
    if (!req.session.user || req.session.user.role !== "super_admin") {
      return res.status(403).json({ message: "Only platform admins can delete hotels" });
    }
    const { adminPassword } = req.body;
    if (!adminPassword) {
      return res.status(400).json({ message: "Admin password is required for permanent deletion" });
    }
    const admin = await storage.getPlatformUserByEmail(req.session.user.email);
    if (!admin || admin.password !== adminPassword) {
      return res.status(401).json({ message: "Incorrect admin password" });
    }
    const hotel = await storage.getHotelById(Number(req.params.id));
    if (!hotel) return res.status(404).json({ message: "Hotel not found" });
    await storage.deleteHotelWithData(hotel.id);
    res.json({ message: "Hotel and all associated data permanently deleted" });
  });

  // ============= BRANCHES =============
  app.get("/api/branches", async (req, res) => {
    const hotelId = getHotelId(req);
    const data = await storage.getBranches(hotelId);
    res.json(data);
  });

  app.get("/api/branches/hotel/:hotelId", async (req, res) => {
    if (!req.session?.user || req.session.user.role !== "super_admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const data = await storage.getBranches(Number(req.params.hotelId));
    res.json(data);
  });

  app.post("/api/branches", async (req, res) => {
    const sessionHotelId = getHotelId(req);
    const hotelId = sessionHotelId || (req.session?.user?.role === "super_admin" ? req.body.hotelId : null);
    if (!hotelId) return res.status(400).json({ message: "hotelId is required" });
    const data = await storage.createBranch({ ...req.body, hotelId });
    res.status(201).json(data);
  });

  app.patch("/api/branches/:id", async (req, res) => {
    const branch = await storage.getBranch(Number(req.params.id));
    if (!branch) return res.status(404).json({ message: "Not found" });
    const sessionHotelId = getHotelId(req);
    if (sessionHotelId && branch.hotelId !== sessionHotelId) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const data = await storage.updateBranch(Number(req.params.id), req.body);
    res.json(data);
  });

  app.delete("/api/branches/:id", async (req, res) => {
    const branch = await storage.getBranch(Number(req.params.id));
    if (!branch) return res.status(404).json({ message: "Not found" });
    const sessionHotelId = getHotelId(req);
    if (sessionHotelId && branch.hotelId !== sessionHotelId) {
      return res.status(403).json({ message: "Forbidden" });
    }
    await storage.deleteBranch(Number(req.params.id));
    res.status(204).send();
  });

  app.put("/api/branches/sync/:hotelId", async (req, res) => {
    const targetHotelId = Number(req.params.hotelId);
    const sessionHotelId = getHotelId(req);
    if (sessionHotelId && sessionHotelId !== targetHotelId) {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (!sessionHotelId && req.session?.user?.role !== "super_admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const { branches: branchData } = req.body;
    if (!Array.isArray(branchData)) return res.status(400).json({ message: "branches array required" });
    const result = await storage.syncBranches(targetHotelId, branchData);
    res.json(result);
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
  app.get("/api/room-types", async (req, res) => {
    const hotelId = getHotelId(req);
    const branchId = await getBranchIdValidated(req);
    const data = await storage.getRoomTypes(hotelId, branchId);
    res.json(data);
  });

  app.post("/api/room-types", async (req, res) => {
    const hotelId = getHotelId(req);
    const branchId = await getBranchIdValidated(req);
    const data = await storage.createRoomType({ ...req.body, hotelId, branchId });
    res.status(201).json(data);
  });

  app.patch("/api/room-types/:id", async (req, res) => {
    const branchId = await getBranchIdValidated(req);
    const record = await storage.getRoomType(Number(req.params.id));
    if (!checkRecordScope(record, req, res, branchId)) return;
    const data = await storage.updateRoomType(Number(req.params.id), req.body);
    res.json(data);
  });

  app.delete("/api/room-types/:id", async (req, res) => {
    const branchId = await getBranchIdValidated(req);
    const record = await storage.getRoomType(Number(req.params.id));
    if (!checkRecordScope(record, req, res, branchId)) return;
    await storage.deleteRoomType(Number(req.params.id));
    res.status(204).send();
  });

  // ============= ROOMS =============
  app.get("/api/rooms", async (req, res) => {
    const hotelId = getHotelId(req);
    const branchId = await getBranchIdValidated(req);
    const data = await storage.getRooms(hotelId, branchId);
    res.json(data);
  });

  app.post("/api/rooms", async (req, res) => {
    const hotelId = getHotelId(req);
    const branchId = await getBranchIdValidated(req);
    const data = await storage.createRoom({ ...req.body, hotelId, branchId });
    res.status(201).json(data);
  });

  app.patch("/api/rooms/:id", async (req, res) => {
    const branchId = await getBranchIdValidated(req);
    const record = await storage.getRoom(Number(req.params.id));
    if (!checkRecordScope(record, req, res, branchId)) return;
    const data = await storage.updateRoom(Number(req.params.id), req.body);
    res.json(data);
  });

  app.delete("/api/rooms/:id", async (req, res) => {
    const branchId = await getBranchIdValidated(req);
    const record = await storage.getRoom(Number(req.params.id));
    if (!checkRecordScope(record, req, res, branchId)) return;
    await storage.deleteRoom(Number(req.params.id));
    res.status(204).send();
  });

  // ============= BOOKINGS =============
  app.get("/api/bookings", async (req, res) => {
    const hotelId = getHotelId(req);
    const branchId = await getBranchIdValidated(req);
    const data = await storage.getBookings(hotelId, branchId);
    res.json(data);
  });

  app.get("/api/bookings/:bookingId", async (req, res) => {
    const branchId = await getBranchIdValidated(req);
    const data = await storage.getBookingByBookingId(req.params.bookingId);
    if (!checkRecordScope(data, req, res, branchId)) return;
    res.json(data);
  });

  app.get("/api/rooms/availability", async (req, res) => {
    const { checkIn, checkOut } = req.query;
    if (!checkIn || !checkOut) {
      return res.status(400).json({ message: "checkIn and checkOut query parameters are required" });
    }
    const hotelId = getHotelId(req);
    const branchId = await getBranchIdValidated(req);
    const allRooms = await storage.getRooms(hotelId, branchId);
    const allBookings = await storage.getBookings(hotelId, branchId);
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
    const hotelId = getHotelId(req);
    const branchId = await getBranchIdValidated(req);
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
      const allRoomTypes = await storage.getRoomTypes(hotelId, branchId);
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
    const data = await storage.createBooking({ ...bookingData, hotelId, branchId });
    if (facilityCharges && Array.isArray(facilityCharges) && facilityCharges.length > 0) {
      for (const charge of facilityCharges) {
        await storage.createBookingCharge({
          bookingId: data.bookingId,
          description: charge.description,
          category: charge.category || "Facility",
          amount: charge.amount,
          hotelId,
          branchId,
        });
      }
    }
    res.status(201).json(data);
  });

  app.patch("/api/bookings/:id", async (req, res) => {
    const branchId = await getBranchIdValidated(req);
    const record = await storage.getBooking(Number(req.params.id));
    if (!checkRecordScope(record, req, res, branchId)) return;
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
    const branchId = await getBranchIdValidated(req);
    const record = await storage.getBooking(Number(req.params.id));
    if (!checkRecordScope(record, req, res, branchId)) return;
    await storage.deleteBooking(Number(req.params.id));
    res.status(204).send();
  });

  app.get("/api/bookings-archived", async (req, res) => {
    const hotelId = getHotelId(req);
    const branchId = await getBranchIdValidated(req);
    const data = await storage.getArchivedBookings(hotelId, branchId);
    res.json(data);
  });

  app.patch("/api/bookings/:id/archive", async (req, res) => {
    const branchId = await getBranchIdValidated(req);
    const record = await storage.getBooking(Number(req.params.id));
    if (!checkRecordScope(record, req, res, branchId)) return;
    const data = await storage.archiveBooking(Number(req.params.id));
    if (!data) return res.status(404).json({ message: "Not found" });
    res.json(data);
  });

  app.patch("/api/bookings/:id/unarchive", async (req, res) => {
    const branchId = await getBranchIdValidated(req);
    const record = await storage.getBooking(Number(req.params.id));
    if (!checkRecordScope(record, req, res, branchId)) return;
    const data = await storage.unarchiveBooking(Number(req.params.id));
    if (!data) return res.status(404).json({ message: "Not found" });
    res.json(data);
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
      roomNumber: "",
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
  app.get("/api/staff", async (req, res) => {
    const hotelId = getHotelId(req);
    const branchId = await getBranchIdValidated(req);
    const data = await storage.getStaff(hotelId, branchId);
    res.json(data);
  });

  app.post("/api/staff", async (req, res) => {
    try {
      const hotelId = getHotelId(req);
      const branchId = await getBranchIdValidated(req);
      const parsed = insertStaffSchema.parse({ ...req.body, hotelId, branchId });
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
          hotelId,
          branchId,
        });
      }
      
      res.status(201).json(data);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Invalid staff data" });
    }
  });

  app.patch("/api/staff/:id", async (req, res) => {
    try {
      const record = await storage.getStaffMember(Number(req.params.id));
      const branchId = await getBranchIdValidated(req);
      if (!checkRecordScope(record, req, res, branchId)) return;
      const partialSchema = insertStaffSchema.partial();
      const parsed = partialSchema.parse(req.body);
      const data = await storage.updateStaff(Number(req.params.id), parsed);
      if (!data) return res.status(404).json({ message: "Not found" });
      res.json(data);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Invalid update data" });
    }
  });

  app.post("/api/staff/:id/deactivate", async (req, res) => {
    try {
      const branchId = await getBranchIdValidated(req);
      const record = await storage.getStaffMember(Number(req.params.id));
      if (!checkRecordScope(record, req, res, branchId)) return;

      const { password } = req.body || {};
      if (!password) {
        return res.status(400).json({ message: "Password is required to deactivate staff" });
      }
      const sessionUser = (req as any).session?.user;
      if (!sessionUser) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const dbUser = await storage.getPlatformUserByEmail(sessionUser.email);
      if (!dbUser || dbUser.password !== password) {
        return res.status(401).json({ message: "Incorrect password" });
      }

      const unpaid = await storage.getUnpaidSalariesByStaff(Number(req.params.id));
      if (unpaid.length > 0) {
        const totalDue = unpaid.reduce((sum, s) => sum + parseFloat(s.netPay || "0"), 0);
        return res.status(400).json({ message: `Cannot deactivate staff with ${unpaid.length} unpaid salary record(s) totalling ₹${totalDue.toFixed(2)}. Please clear all dues first.` });
      }

      const data = await storage.updateStaff(Number(req.params.id), { status: "Inactive" } as any);
      if (!data) return res.status(404).json({ message: "Not found" });
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to deactivate staff" });
    }
  });

  app.get("/api/staff/:id/dues", async (req, res) => {
    const staffId = Number(req.params.id);
    console.log(`[DUES DEBUG] Checking dues for staffId=${staffId}`);
    const unpaid = await storage.getUnpaidSalariesByStaff(staffId);
    console.log(`[DUES DEBUG] Found ${unpaid.length} unpaid records for staffId=${staffId}:`, unpaid.map(s => ({ id: s.id, staffId: s.staffId, netPay: s.netPay, status: s.status })));
    const totalDue = unpaid.reduce((sum, s) => sum + parseFloat(s.netPay || "0"), 0);
    res.json({ hasDues: unpaid.length > 0, count: unpaid.length, totalDue, records: unpaid });
  });

  app.delete("/api/staff/:id", async (req, res) => {
    const branchId = await getBranchIdValidated(req);
    const record = await storage.getStaffMember(Number(req.params.id));
    if (!checkRecordScope(record, req, res, branchId)) return;

    const { password } = req.body || {};
    if (!password) {
      return res.status(400).json({ message: "Password is required to delete staff" });
    }
    const sessionUser = (req as any).session?.user;
    if (!sessionUser) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const dbUser = await storage.getPlatformUserByEmail(sessionUser.email);
    if (!dbUser || dbUser.password !== password) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    const unpaid = await storage.getUnpaidSalariesByStaff(Number(req.params.id));
    if (unpaid.length > 0) {
      const totalDue = unpaid.reduce((sum, s) => sum + parseFloat(s.netPay || "0"), 0);
      return res.status(400).json({ message: `Cannot delete staff with ${unpaid.length} unpaid salary record(s) totalling ₹${totalDue.toFixed(2)}. Please clear all dues first.` });
    }

    await storage.deleteStaffWithRecords(Number(req.params.id));
    res.status(204).send();
  });

  // ============= EXPENSES =============
  app.get("/api/expenses", async (req, res) => {
    const hotelId = getHotelId(req);
    const branchId = await getBranchIdValidated(req);
    const data = await storage.getExpenses(hotelId, branchId);
    res.json(data);
  });

  app.post("/api/expenses", async (req, res) => {
    const hotelId = getHotelId(req);
    const branchId = await getBranchIdValidated(req);
    const data = await storage.createExpense({ ...req.body, hotelId, branchId });
    res.status(201).json(data);
  });

  app.patch("/api/expenses/:id", async (req, res) => {
    const record = await storage.getExpense(Number(req.params.id));
    const branchId = await getBranchIdValidated(req);
    if (!checkRecordScope(record, req, res, branchId)) return;
    const data = await storage.updateExpense(Number(req.params.id), req.body);
    res.json(data);
  });

  app.delete("/api/expenses/:id", async (req, res) => {
    const record = await storage.getExpense(Number(req.params.id));
    const branchId = await getBranchIdValidated(req);
    if (!checkRecordScope(record, req, res, branchId)) return;
    await storage.deleteExpense(Number(req.params.id));
    res.status(204).send();
  });

  // ============= CATEGORIES =============
  app.get("/api/categories", async (req, res) => {
    const hotelId = getHotelId(req);
    const branchId = await getBranchIdValidated(req);
    const data = await storage.getCategories(hotelId, branchId);
    res.json(data);
  });

  app.post("/api/categories", async (req, res) => {
    const hotelId = getHotelId(req);
    const branchId = await getBranchIdValidated(req);
    const data = await storage.createCategory({ ...req.body, hotelId, branchId });
    res.status(201).json(data);
  });

  app.post("/api/categories/bulk", async (req, res) => {
    const hotelId = getHotelId(req);
    const branchId = await getBranchIdValidated(req);
    const { type, taxable, subtypes } = req.body;
    if (!type || !Array.isArray(subtypes)) {
      return res.status(400).json({ message: "type and subtypes array required" });
    }
    const items = subtypes.map((s: any) => ({
      type,
      subtype: s.subtype || "",
      item: s.item || "",
      taxable: taxable || false,
      hotelId,
      branchId,
    }));
    const data = await storage.createCategoriesBulk(items);
    res.status(201).json(data);
  });

  app.put("/api/categories/sync", async (req, res) => {
    const hotelId = getHotelId(req);
    const branchId = await getBranchIdValidated(req);
    const { type, taxable, subtypes } = req.body;
    if (!type || !Array.isArray(subtypes)) {
      return res.status(400).json({ message: "type and subtypes array required" });
    }
    const data = await storage.syncCategoryType(type, taxable || false, subtypes, hotelId, branchId);
    res.json(data);
  });

  app.patch("/api/categories/:id", async (req, res) => {
    const record = await storage.getCategory(Number(req.params.id));
    const branchId = await getBranchIdValidated(req);
    if (!checkRecordScope(record, req, res, branchId)) return;
    const data = await storage.updateCategory(Number(req.params.id), req.body);
    res.json(data);
  });

  app.delete("/api/categories/type/:type", async (req, res) => {
    const hotelId = getHotelId(req);
    const branchId = await getBranchIdValidated(req);
    await storage.deleteCategoryByType(req.params.type, hotelId, branchId);
    res.status(204).send();
  });

  app.delete("/api/categories/:id", async (req, res) => {
    const record = await storage.getCategory(Number(req.params.id));
    const branchId = await getBranchIdValidated(req);
    if (!checkRecordScope(record, req, res, branchId)) return;
    await storage.deleteCategory(Number(req.params.id));
    res.status(204).send();
  });

  // ============= MENU ITEMS =============
  app.get("/api/menu-items", async (req, res) => {
    const hotelId = getHotelId(req);
    const branchId = await getBranchIdValidated(req);
    const data = await storage.getMenuItems(hotelId, branchId);
    res.json(data);
  });

  app.post("/api/menu-items", async (req, res) => {
    const hotelId = getHotelId(req);
    const branchId = await getBranchIdValidated(req);
    const data = await storage.createMenuItem({ ...req.body, hotelId, branchId });
    res.status(201).json(data);
  });

  app.patch("/api/menu-items/:id", async (req, res) => {
    const record = await storage.getMenuItem(Number(req.params.id));
    const branchId = await getBranchIdValidated(req);
    if (!checkRecordScope(record, req, res, branchId)) return;
    const data = await storage.updateMenuItem(Number(req.params.id), req.body);
    res.json(data);
  });

  app.delete("/api/menu-items/:id", async (req, res) => {
    const record = await storage.getMenuItem(Number(req.params.id));
    const branchId = await getBranchIdValidated(req);
    if (!checkRecordScope(record, req, res, branchId)) return;
    await storage.deleteMenuItem(Number(req.params.id));
    res.status(204).send();
  });

  // ============= MENUS & BUFFETS =============
  app.get("/api/menus", async (req, res) => {
    const hotelId = getHotelId(req);
    const branchId = await getBranchIdValidated(req);
    const data = await storage.getMenus(hotelId, branchId);
    const today = new Date().toISOString().split('T')[0];
    const updated = [];
    for (const menu of data) {
      if (menu.active && menu.endDate && menu.endDate < today) {
        const deactivated = await storage.updateMenu(menu.id, { active: false });
        if (deactivated) updated.push(deactivated);
        else updated.push(menu);
      } else {
        updated.push(menu);
      }
    }
    res.json(updated);
  });

  app.post("/api/menus", async (req, res) => {
    const hotelId = getHotelId(req);
    const branchId = await getBranchIdValidated(req);
    const data = await storage.createMenu({ ...req.body, hotelId, branchId });
    res.status(201).json(data);
  });

  app.patch("/api/menus/:id", async (req, res) => {
    const record = await storage.getMenu(Number(req.params.id));
    const branchId = await getBranchIdValidated(req);
    if (!checkRecordScope(record, req, res, branchId)) return;
    const data = await storage.updateMenu(Number(req.params.id), req.body);
    res.json(data);
  });

  app.delete("/api/menus/:id", async (req, res) => {
    const record = await storage.getMenu(Number(req.params.id));
    const branchId = await getBranchIdValidated(req);
    if (!checkRecordScope(record, req, res, branchId)) return;
    await storage.deleteMenu(Number(req.params.id));
    res.status(204).send();
  });

  // ============= FACILITIES =============
  app.get("/api/facilities", async (req, res) => {
    const hotelId = getHotelId(req);
    const branchId = await getBranchIdValidated(req);
    const data = await storage.getFacilities(hotelId, branchId);
    res.json(data);
  });

  app.post("/api/facilities", async (req, res) => {
    const hotelId = getHotelId(req);
    const branchId = await getBranchIdValidated(req);
    const data = await storage.createFacility({ ...req.body, hotelId, branchId });
    res.status(201).json(data);
  });

  app.patch("/api/facilities/:id", async (req, res) => {
    const record = await storage.getFacility(Number(req.params.id));
    const branchId = await getBranchIdValidated(req);
    if (!checkRecordScope(record, req, res, branchId)) return;
    const data = await storage.updateFacility(Number(req.params.id), req.body);
    res.json(data);
  });

  app.delete("/api/facilities/:id", async (req, res) => {
    const record = await storage.getFacility(Number(req.params.id));
    const branchId = await getBranchIdValidated(req);
    if (!checkRecordScope(record, req, res, branchId)) return;
    await storage.deleteFacility(Number(req.params.id));
    res.status(204).send();
  });

  // ============= ORDERS =============
  app.get("/api/orders", async (req, res) => {
    const hotelId = getHotelId(req);
    const branchId = await getBranchIdValidated(req);
    const data = await storage.getOrders(hotelId, branchId);
    const ordersWithItems = await Promise.all(
      data.map(async (order) => {
        const items = await storage.getOrderItems(order.orderId);
        return { ...order, items };
      })
    );
    res.json(ordersWithItems);
  });

  app.post("/api/orders", async (req, res) => {
    const hotelId = getHotelId(req);
    const branchId = await getBranchIdValidated(req);
    const { items, ...orderData } = req.body;
    const data = await storage.createOrder({ ...orderData, hotelId, branchId });
    if (items && Array.isArray(items)) {
      for (const item of items) {
        await storage.createOrderItem({ ...item, orderId: data.orderId, hotelId, branchId });
      }
    }
    const orderItems = await storage.getOrderItems(data.orderId);
    res.status(201).json({ ...data, items: orderItems });
  });

  app.patch("/api/orders/:id", async (req, res) => {
    const record = await storage.getOrder(Number(req.params.id));
    const branchId = await getBranchIdValidated(req);
    if (!checkRecordScope(record, req, res, branchId)) return;
    const data = await storage.updateOrder(Number(req.params.id), req.body);
    if (!data) return res.status(404).json({ message: "Not found" });
    if (data.status === "Fulfilled" || data.status === "Accepted") {
      const booking = await storage.getBookingByBookingId(data.bookingId);
      if (booking && data.status === "Fulfilled") {
        const items = await storage.getOrderItems(data.orderId);
        for (const item of items) {
          const existingCharges = await storage.getBookingCharges(data.bookingId);
          const alreadyCharged = existingCharges.some(c => c.orderId === data.orderId && c.description === item.itemName);
          if (!alreadyCharged) {
            await storage.createBookingCharge({
              bookingId: data.bookingId,
              orderId: data.orderId,
              description: item.itemName,
              category: data.type === "Food" ? "Food" : "Facility",
              amount: String(Number(item.price) * item.quantity),
              hotelId: data.hotelId,
              branchId: data.branchId,
            });
          }
        }
      }
    }
    const orderItems = await storage.getOrderItems(data.orderId);
    res.json({ ...data, items: orderItems });
  });

  // ============= SETTINGS (hotel-level, not branch-scoped) =============
  app.get("/api/settings", async (req, res) => {
    const hotelId = getHotelId(req);
    const data = await storage.getSettings(hotelId);
    const result: Record<string, string> = {};
    for (const s of data) {
      result[s.key] = s.value;
    }
    res.json(result);
  });

  app.post("/api/settings", async (req, res) => {
    const hotelId = getHotelId(req);
    const entries = Object.entries(req.body);
    for (const [key, value] of entries) {
      await storage.upsertSetting(key, String(value), hotelId);
    }
    res.json({ message: "Settings saved" });
  });

  // ============= SALARIES =============
  app.get("/api/salaries", async (req, res) => {
    const hotelId = getHotelId(req);
    const branchId = await getBranchIdValidated(req);
    const data = await storage.getSalaries(hotelId, branchId);
    res.json(data);
  });

  app.post("/api/salaries", async (req, res) => {
    const hotelId = getHotelId(req);
    const branchId = await getBranchIdValidated(req);
    const data = await storage.createSalary({ ...req.body, hotelId, branchId });
    res.status(201).json(data);
  });

  app.post("/api/salaries/generate", async (req, res) => {
    try {
      const hotelId = getHotelId(req);
      const branchId = await getBranchIdValidated(req);
      const { month, staffSalaries } = req.body;
      if (!month || !staffSalaries || !Array.isArray(staffSalaries)) {
        return res.status(400).json({ message: "Month and staffSalaries array are required" });
      }
      const existingSalaries = await storage.getSalariesByMonth(month, hotelId, branchId);
      const created: any[] = [];
      const skipped: number[] = [];
      for (const entry of staffSalaries) {
        const { staffId, netPay, bonus, welfareContribution } = entry;
        if (existingSalaries.find((s: any) => s.staffId === staffId)) {
          skipped.push(staffId);
          continue;
        }
        const staffMember = await storage.getStaffMember(staffId);
        if (!staffMember || staffMember.status !== "active") continue;
        const [year, mon] = month.split("-").map(Number);
        const lastDay = new Date(year, mon, 0);
        const dueDateStr = lastDay.toISOString().split("T")[0];

        const activeAdvances = await storage.getActiveStaffAdvances(staffId);
        let totalInstalmentDeduction = 0;
        for (const adv of activeAdvances) {
          totalInstalmentDeduction += Number(adv.instalmentAmount) || 0;
        }

        const salary = await storage.createSalary({
          staffId,
          month,
          basicSalary: String(netPay),
          bonus: String(bonus || 0),
          deductions: "0",
          welfareContribution: String(welfareContribution || 0),
          netPay: String(Number(netPay) + Number(bonus || 0)),
          advanceAmount: "0",
          instalmentDeduction: String(totalInstalmentDeduction),
          dueDate: dueDateStr,
          status: "Pending",
          paidDate: null,
          hotelId,
          branchId,
        });

        for (const adv of activeAdvances) {
          const instalmentAmt = Number(adv.instalmentAmount) || 0;
          const newBalance = Math.max(0, Number(adv.remainingBalance) - instalmentAmt);
          const newRemaining = Math.max(0, Number(adv.remainingInstalments) - 1);
          await storage.updateStaffAdvance(adv.id, {
            remainingBalance: String(newBalance),
            remainingInstalments: newRemaining,
            status: newBalance <= 0 || newRemaining <= 0 ? "Completed" : "Active",
          });
        }
        created.push(salary);
      }
      res.json({ created: created.length, skipped: skipped.length, salaries: created });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to generate salaries" });
    }
  });

  app.patch("/api/salaries/:id", async (req, res) => {
    const record = await storage.getSalary(Number(req.params.id));
    const branchId = await getBranchIdValidated(req);
    if (!checkRecordScope(record, req, res, branchId)) return;
    const data = await storage.updateSalary(Number(req.params.id), req.body);
    if (!data) return res.status(404).json({ message: "Not found" });
    res.json(data);
  });

  async function carryForwardOverflow(salary: any, overflow: number, req: any, branchId: any) {
    if (overflow <= 0) return;
    const hotelId = getHotelId(req);
    const staffMember = await storage.getStaffMember(salary.staffId);
    if (!staffMember) return;
    const [salYear, salMon] = salary.month.split("-").map(Number);
    const nextMonth = new Date(salYear, salMon, 1);
    const nextMonthStr = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
    const existingSalaries = await storage.getSalariesByMonth(nextMonthStr, hotelId, branchId);
    const existingNext = existingSalaries.find((s: any) => s.staffId === salary.staffId);
    if (existingNext) {
      const existingNextAdvance = Number(existingNext.advanceAmount) || 0;
      const nextNetPay = Number(existingNext.netPay) || 0;
      const newNextAdvance = existingNextAdvance + overflow;
      if (newNextAdvance >= nextNetPay) {
        await storage.updateSalary(existingNext.id, {
          advanceAmount: String(nextNetPay),
          status: "Paid",
          paidDate: new Date().toISOString().split('T')[0],
        } as any);
        const nextOverflow = newNextAdvance - nextNetPay;
        if (nextOverflow > 0) {
          await carryForwardOverflow(existingNext, nextOverflow, req, branchId);
        }
      } else {
        await storage.updateSalary(existingNext.id, {
          advanceAmount: String(newNextAdvance),
        } as any);
      }
    } else {
      const totalSalary = Number(staffMember.salary) || 0;
      const bonusAmt = Number(staffMember.bonusAmount) || 0;
      const basicPay = Number(staffMember.basicPay) || totalSalary;
      const welfareAmount = staffMember.welfareEnabled ? Math.round(basicPay * 0.01) : 0;
      const totalPay = totalSalary + bonusAmt;
      const lastDayNext = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0);
      if (overflow >= totalPay) {
        const newSalary = await storage.createSalary({
          staffId: salary.staffId,
          month: nextMonthStr,
          basicSalary: String(totalSalary),
          bonus: String(bonusAmt),
          deductions: "0",
          welfareContribution: String(welfareAmount),
          netPay: String(totalPay),
          advanceAmount: String(totalPay),
          dueDate: lastDayNext.toISOString().split('T')[0],
          status: "Paid",
          paidDate: new Date().toISOString().split('T')[0],
          hotelId,
          branchId,
        });
        const nextOverflow = overflow - totalPay;
        if (nextOverflow > 0) {
          await carryForwardOverflow(newSalary, nextOverflow, req, branchId);
        }
      } else {
        await storage.createSalary({
          staffId: salary.staffId,
          month: nextMonthStr,
          basicSalary: String(totalSalary),
          bonus: String(bonusAmt),
          deductions: "0",
          welfareContribution: String(welfareAmount),
          netPay: String(totalPay),
          advanceAmount: String(overflow),
          dueDate: lastDayNext.toISOString().split('T')[0],
          status: "Pending",
          paidDate: null,
          hotelId,
          branchId,
        });
      }
    }
  }

  app.post("/api/salaries/:id/pay", async (req, res) => {
    const salary = await storage.getSalary(Number(req.params.id));
    const branchId = await getBranchIdValidated(req);
    if (!checkRecordScope(salary, req, res, branchId)) return;
    if (!salary) return res.status(404).json({ message: "Salary record not found" });

    const advanceAmount = Number(salary.advanceAmount) || 0;
    const instalmentDeduction = Number(salary.instalmentDeduction) || 0;
    const netPay = Number(salary.netPay) || 0;

    await storage.updateSalary(salary.id, {
      status: "Paid",
      paidDate: new Date().toISOString().split('T')[0],
    } as any);

    let overflowAmount = 0;
    if (instalmentDeduction <= 0) {
      const overflow = advanceAmount - netPay;
      if (overflow > 0) {
        overflowAmount = overflow;
        await storage.updateSalary(salary.id, {
          advanceAmount: String(netPay),
        } as any);
        await carryForwardOverflow(salary, overflow, req, branchId);
      }
    }

    const updated = await storage.getSalary(salary.id);
    return res.json({ ...updated, overflowToNextMonth: overflowAmount });
  });

  app.post("/api/salaries/:id/advance", async (req, res) => {
    const { amount, useInstalments, numberOfInstalments } = req.body;
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ message: "Valid advance amount is required" });
    }
    const salary = await storage.getSalary(Number(req.params.id));
    const branchId = await getBranchIdValidated(req);
    if (!checkRecordScope(salary, req, res, branchId)) return;
    if (!salary) return res.status(404).json({ message: "Salary record not found" });

    const hotelId = getHotelId(req);
    const advanceNum = Number(amount);

    if (useInstalments && numberOfInstalments && Number(numberOfInstalments) > 1) {
      const numInstalments = Number(numberOfInstalments);
      const instalmentAmount = Math.round((advanceNum / numInstalments) * 100) / 100;

      await storage.createStaffAdvance({
        staffId: salary.staffId,
        totalAmount: String(advanceNum),
        instalmentAmount: String(instalmentAmount),
        totalInstalments: numInstalments,
        remainingInstalments: numInstalments,
        remainingBalance: String(advanceNum),
        status: "Active",
        startMonth: salary.month,
        hotelId,
        branchId,
      });

      const existingAdvance = Number(salary.advanceAmount) || 0;
      const existingInstalment = Number(salary.instalmentDeduction) || 0;

      await storage.updateSalary(salary.id, {
        advanceAmount: String(existingAdvance + advanceNum),
        instalmentDeduction: String(existingInstalment + instalmentAmount),
      } as any);

      const updated = await storage.getSalary(salary.id);
      return res.json({ ...updated, instalmentCreated: true, instalmentAmount, totalInstalments: numInstalments });
    }

    const existingAdvance = Number(salary.advanceAmount) || 0;
    const newAdvance = existingAdvance + advanceNum;
    const netPay = Number(salary.netPay) || 0;

    if (newAdvance >= netPay) {
      const overflow = newAdvance - netPay;
      await storage.updateSalary(salary.id, {
        advanceAmount: String(netPay),
        status: "Paid",
        paidDate: new Date().toISOString().split('T')[0],
      } as any);

      if (overflow > 0) {
        await carryForwardOverflow(salary, overflow, req, branchId);
      }

      const updated = await storage.getSalary(salary.id);
      return res.json({ ...updated, overflowToNextMonth: overflow > 0 ? overflow : 0 });
    }

    const updated = await storage.updateSalary(salary.id, {
      advanceAmount: String(newAdvance),
    } as any);
    res.json(updated);
  });

  app.get("/api/staff-advances", async (req, res) => {
    const hotelId = getHotelId(req);
    const branchId = await getBranchIdValidated(req);
    const data = await storage.getAllStaffAdvances(hotelId, branchId);
    res.json(data);
  });

  app.get("/api/staff-advances/:staffId", async (req, res) => {
    const data = await storage.getStaffAdvances(Number(req.params.staffId));
    res.json(data);
  });

  app.delete("/api/salaries/:id", async (req, res) => {
    const record = await storage.getSalary(Number(req.params.id));
    const branchId = await getBranchIdValidated(req);
    if (!checkRecordScope(record, req, res, branchId)) return;
    await storage.deleteSalary(Number(req.params.id));
    res.status(204).send();
  });

  // ============= BOOKING CHARGES =============
  app.get("/api/booking-charges/:bookingId", async (req, res) => {
    const branchId = await getBranchIdValidated(req);
    const booking = await storage.getBookingByBookingId(req.params.bookingId);
    if (!checkRecordScope(booking, req, res, branchId)) return;
    const data = await storage.getBookingCharges(req.params.bookingId);
    res.json(data);
  });

  app.get("/api/booking-charges", async (req, res) => {
    const hotelId = getHotelId(req);
    const branchId = await getBranchIdValidated(req);
    const data = await storage.getAllBookingCharges(hotelId, branchId);
    res.json(data);
  });

  app.post("/api/booking-charges", async (req, res) => {
    const hotelId = getHotelId(req);
    const branchId = await getBranchIdValidated(req);
    const data = await storage.createBookingCharge({ ...req.body, hotelId, branchId });
    res.status(201).json(data);
  });

  app.delete("/api/booking-charges/:id", async (req, res) => {
    const record = await storage.getBookingCharge(Number(req.params.id));
    const branchId = await getBranchIdValidated(req);
    if (!checkRecordScope(record, req, res, branchId)) return;
    await storage.deleteBookingCharge(Number(req.params.id));
    res.status(204).send();
  });

  // ============= ROOM PRICING =============
  app.get("/api/room-pricing", async (req, res) => {
    const hotelId = getHotelId(req);
    const branchId = await getBranchIdValidated(req);
    const roomTypeId = req.query.roomTypeId ? Number(req.query.roomTypeId) : undefined;
    const data = await storage.getRoomPricing(roomTypeId, hotelId, branchId);
    res.json(data);
  });

  app.post("/api/room-pricing", async (req, res) => {
    const hotelId = getHotelId(req);
    const branchId = await getBranchIdValidated(req);
    const data = await storage.upsertRoomPricing({ ...req.body, hotelId, branchId });
    res.status(201).json(data);
  });

  app.post("/api/room-pricing/bulk", async (req, res) => {
    const hotelId = getHotelId(req);
    const branchId = await getBranchIdValidated(req);
    const items = (req.body.items || []).map((item: any) => ({ ...item, hotelId, branchId }));
    const data = await storage.bulkUpsertRoomPricing(items);
    res.status(201).json(data);
  });

  app.patch("/api/room-pricing/:id/lock", async (req, res) => {
    const branchId = await getBranchIdValidated(req);
    const record = await storage.getRoomPricingById(Number(req.params.id));
    if (!checkRecordScope(record, req, res, branchId)) return;
    const { isLocked } = req.body;
    const data = await storage.updateRoomPricingLock(Number(req.params.id), isLocked);
    if (!data) return res.status(404).json({ message: "Not found" });
    res.json(data);
  });

  // ============= ROOM BLOCKS =============
  app.get("/api/room-blocks", async (req, res) => {
    const hotelId = getHotelId(req);
    const branchId = await getBranchIdValidated(req);
    const data = await storage.getRoomBlocks(hotelId, branchId);
    res.json(data);
  });

  app.post("/api/room-blocks", async (req, res) => {
    const hotelId = getHotelId(req);
    const branchId = await getBranchIdValidated(req);
    const data = await storage.createRoomBlock({ ...req.body, hotelId, branchId });
    res.status(201).json(data);
  });

  app.post("/api/room-blocks/bulk", async (req, res) => {
    const hotelId = getHotelId(req);
    const branchId = await getBranchIdValidated(req);
    const items = (req.body.items || []).map((item: any) => ({ ...item, hotelId, branchId }));
    const data = await storage.bulkCreateRoomBlocks(items);
    res.status(201).json(data);
  });

  app.delete("/api/room-blocks/:id", async (req, res) => {
    const branchId = await getBranchIdValidated(req);
    const record = await storage.getRoomBlockById(Number(req.params.id));
    if (!checkRecordScope(record, req, res, branchId)) return;
    await storage.deleteRoomBlock(Number(req.params.id));
    res.status(204).send();
  });

  app.post("/api/room-blocks/unblock", async (req, res) => {
    const { roomIds, startDate, endDate } = req.body;
    if (!roomIds || !startDate || !endDate) {
      return res.status(400).json({ message: "roomIds, startDate, and endDate are required" });
    }
    const hotelId = getHotelId(req);
    const branchId = await getBranchIdValidated(req);
    const userRooms = await storage.getRooms(hotelId, branchId);
    const userRoomIds = new Set(userRooms.map(r => r.id));
    const validRoomIds = (roomIds as number[]).filter(id => userRoomIds.has(id));
    if (validRoomIds.length === 0) {
      return res.json({ deleted: 0 });
    }
    const count = await storage.deleteRoomBlocksByRoomAndDateRange(validRoomIds, startDate, endDate);
    res.json({ deleted: count });
  });

  // ============= INVOICE SCHEDULER =============
  app.get("/api/invoice-scheduler/logs", async (req, res) => {
    const hotelId = getHotelId(req);
    const branchId = await getBranchIdValidated(req);
    const data = await storage.getInvoiceSchedulerLogs(hotelId, branchId);
    res.json(data);
  });

  app.post("/api/invoice-scheduler/run", async (req, res) => {
    try {
      const { startDate, endDate } = req.body;
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "startDate and endDate are required" });
      }
      const hotelId = getHotelId(req);
      const branchId = await getBranchIdValidated(req);
      const result = await runTaxInvoiceJob(startDate, endDate, "manual", hotelId, branchId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/invoice-scheduler/settings", async (req, res) => {
    const hotelId = getHotelId(req);
    const { enabled, dayOfMonth, hour } = req.body;
    if (enabled !== undefined) await storage.upsertSetting("schedulerEnabled", String(enabled), hotelId);
    if (dayOfMonth !== undefined) await storage.upsertSetting("schedulerDayOfMonth", String(dayOfMonth), hotelId);
    if (hour !== undefined) await storage.upsertSetting("schedulerHour", String(hour), hotelId);
    refreshScheduler();
    res.json({ message: "Scheduler settings updated" });
  });

  app.get("/api/invoice-scheduler/settings", async (req, res) => {
    const hotelId = getHotelId(req);
    const enabled = await storage.getSetting("schedulerEnabled", hotelId);
    const dayOfMonth = await storage.getSetting("schedulerDayOfMonth", hotelId);
    const hour = await storage.getSetting("schedulerHour", hotelId);
    res.json({
      enabled: enabled?.value === "true",
      dayOfMonth: dayOfMonth ? Number(dayOfMonth.value) : 1,
      hour: hour ? Number(hour.value) : 2,
    });
  });

  // ============= SALARY SCHEDULER =============
  app.get("/api/salary-scheduler/logs", async (req, res) => {
    const hotelId = getHotelId(req);
    const branchId = await getBranchIdValidated(req);
    const data = await storage.getSalarySchedulerLogs(hotelId, branchId);
    res.json(data);
  });

  app.post("/api/salary-scheduler/run", async (req, res) => {
    try {
      const hotelId = getHotelId(req);
      const branchId = await getBranchIdValidated(req);
      const { month } = req.body;
      if (!month) {
        return res.status(400).json({ message: "month is required (e.g. 2026-03)" });
      }
      const result = await runSalaryGenerationJob(month, "manual", hotelId, branchId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to run salary generation" });
    }
  });

  app.post("/api/salary-scheduler/settings", async (req, res) => {
    const hotelId = getHotelId(req);
    const { enabled, dayOfMonth } = req.body;
    if (enabled !== undefined) await storage.upsertSetting("salarySchedulerEnabled", String(enabled), hotelId);
    if (dayOfMonth !== undefined) await storage.upsertSetting("salarySchedulerDay", String(dayOfMonth), hotelId);
    await refreshSalaryScheduler();
    res.json({ message: "Salary scheduler settings updated" });
  });

  app.get("/api/salary-scheduler/settings", async (req, res) => {
    const hotelId = getHotelId(req);
    const enabled = await storage.getSetting("salarySchedulerEnabled", hotelId);
    const dayOfMonth = await storage.getSetting("salarySchedulerDay", hotelId);
    res.json({
      enabled: enabled?.value === "true",
      dayOfMonth: dayOfMonth ? Number(dayOfMonth.value) : 1,
    });
  });

  // ============= ROOM CALENDAR STATUS =============
  app.get("/api/rooms/calendar-status", async (req, res) => {
    try {
      const { startDate, endDate, roomTypeId, roomId } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "startDate and endDate query parameters are required" });
      }

      const hotelId = getHotelId(req);
      const branchId = await getBranchIdValidated(req);
      const allRooms = await storage.getRooms(hotelId, branchId);
      const allBookings = await storage.getBookings(hotelId, branchId);
      const allBlocks = await storage.getRoomBlocks(hotelId, branchId);

      let filteredRooms = allRooms;
      if (roomTypeId && roomTypeId !== "all") {
        filteredRooms = filteredRooms.filter(r => r.roomTypeId === Number(roomTypeId));
      }
      if (roomId && roomId !== "all") {
        filteredRooms = filteredRooms.filter(r => r.id === Number(roomId));
      }

      const result: Record<string, any> = {};
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateKey = d.toISOString().split('T')[0];
        let bookedCount = 0;
        let checkedInCount = 0;
        let blockedCount = 0;
        let availableCount = 0;

        for (const room of filteredRooms) {
          const isBlocked = allBlocks.some(
            b => b.roomId === room.id && b.startDate <= dateKey && b.endDate >= dateKey
          );
          if (isBlocked) {
            blockedCount++;
            continue;
          }

          const booking = allBookings.find(
            b => b.status !== "cancelled" && b.status !== "checked_out" &&
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
