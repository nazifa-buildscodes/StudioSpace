import dotenv from "dotenv";
dotenv.config();
import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { ObjectId } from "mongodb";
import { connectDB, getDB, getMongoClient } from "./config/db";
const app = express();
const PORT = Number(process.env.PORT || 5000);
const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_THIS_TO_A_LONG_RANDOM_SECRET_BEFORE_DEPLOYMENT";
const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: (process.env.NODE_ENV === "production" ? "none" : "lax") as "none" | "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
});
const setAuthCookie = (res: Response, token: string) => res.cookie("studiospace_token", token, cookieOptions());
const clearAuthCookie = (res: Response) => res.clearCookie("studiospace_token", {
  httpOnly: true, secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", path: "/"
});
app.use(cors({ origin: (process.env.CLIENT_URL || "http://localhost:3000").split(",").map((origin) => origin.trim()), credentials: true }));
app.use(express.json({ limit: "8mb" }));
app.use(cookieParser());
type Role = "creator" | "host" | "admin";
type AuthRequest = Request & { user?: { id: string; email: string; name: string; role: Role } };
const users = () => getDB().collection("users");
const studios = () => getDB().collection("studios");
const bookings = () => getDB().collection("bookings");
const wishlists = () => getDB().collection("wishlists");
const reviews = () => getDB().collection("reviews");
const contacts = () => getDB().collection("contacts");
const revenue = () => getDB().collection("revenue");
const safeUser = (u: any) => ({
  id: String(u._id),
  name: u.name,
  email: u.email,
  photoURL: u.photoURL || "",
  phone: u.phone || "",
  whatsapp: u.whatsapp || "",
  role: u.role,
  status: u.status || "active",
  createdAt: u.createdAt
});
const hashPassword = (password: string, salt = randomBytes(16).toString("hex")) => `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
const verifyPassword = (password: string, stored: string) => { const [salt, hash] = stored.split(":"); if (!salt || !hash) return false; const actual = scryptSync(password, salt, 64); const expected = Buffer.from(hash, "hex"); return actual.length === expected.length && timingSafeEqual(actual, expected); };
const sign = (u: any) => jwt.sign({ id: String(u._id), email: u.email, name: u.name, role: u.role }, JWT_SECRET, { expiresIn: "7d" });
const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const h = req.headers.authorization;
  const token = req.cookies?.studiospace_token || (h?.startsWith("Bearer ") ? h.slice(7) : undefined);
  if (!token) return res.status(401).json({ success: false, message: "Please login first" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    if (!validId(decoded.id)) return res.status(401).json({ success: false, message: "Invalid session" });
    const account = await users().findOne({ _id: new ObjectId(decoded.id) });
    if (!account || account.status === "suspended") return res.status(401).json({ success: false, message: "Account unavailable. Please contact support." });
    req.user = { id: String(account._id), email: account.email, name: account.name, role: account.role };
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Session expired. Please login again." });
  }
};
const allow = (...roles: Role[]) => (req: AuthRequest, res: Response, next: NextFunction) => { if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ success: false, message: "You are not allowed to perform this action" }); next(); };
const validId = (id: string) => ObjectId.isValid(id);
const sendError = (res: Response, error: unknown, message: string) => { console.error(message, error); return res.status(500).json({ success: false, message }); };

app.get("/", (_req, res) => res.send("StudioSpace API is running!"));
app.get("/api/health", (_req, res) => res.json({ success: true, service: "StudioSpace API" }));

// Auth: users can self-register only as creator or host. Admin is provisioned from env.
app.post("/api/auth/register", async (req, res) => { try { const { name, email, password, photoURL, role } = req.body; const normalized = String(email || "").trim().toLowerCase(); if (!name || !normalized || !/^\S+@\S+\.\S+$/.test(normalized) || typeof password !== "string" || password.length < 6 || !/[a-z]/.test(password) || !/[A-Z]/.test(password)) return res.status(400).json({ success: false, message: "Enter a name, valid email and password with uppercase, lowercase and 6+ characters" }); if (role === "admin") return res.status(403).json({ success: false, message: "Admin accounts cannot be self-registered" }); if (await users().findOne({ email: normalized })) return res.status(409).json({ success: false, message: "An account with this email already exists" }); const user = { name: String(name).trim(), email: normalized, passwordHash: hashPassword(password), photoURL: String(photoURL || ""), role: role === "host" ? "host" : "creator", createdAt: new Date(), status: "active" }; const result = await users().insertOne(user); const created = { ...user, _id: result.insertedId }; const token = sign(created); setAuthCookie(res, token); res.status(201).json({ success: true, user: safeUser(created) }); } catch (e) { sendError(res, e, "Registration failed"); } });
app.post("/api/auth/login", async (req, res) => { try { const email = String(req.body.email || "").trim().toLowerCase(); const user = await users().findOne({ email }); if (!user || typeof user.passwordHash !== "string" || !verifyPassword(String(req.body.password || ""), user.passwordHash)) return res.status(401).json({ success: false, message: "Invalid email or password" }); if (user.status === "suspended") return res.status(403).json({ success: false, message: "This account has been suspended" }); const token = sign(user); setAuthCookie(res, token); res.json({ success: true, user: safeUser(user) }); } catch (e) { sendError(res, e, "Login failed"); } });
app.get("/api/auth/me", auth, async (req: AuthRequest, res) => { const user = await users().findOne({ _id: new ObjectId(req.user!.id) }); if (!user) return res.status(404).json({ success: false, message: "User not found" }); res.json({ success: true, user: safeUser(user) }); });
app.patch("/api/auth/profile", auth, async (req: AuthRequest, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const photoURL = String(req.body.photoURL || "").trim();
    const phone = String(req.body.phone || "").trim();
    const whatsapp = String(req.body.whatsapp || "").trim();

    if (name.length < 2 || name.length > 80) {
      return res.status(400).json({
        success: false,
        message: "Name must be 2–80 characters"
      });
    }

    if (photoURL && !/^https?:\/\//i.test(photoURL)) {
      return res.status(400).json({
        success: false,
        message: "Invalid photo URL"
      });
    }

    if (phone.length > 25 || whatsapp.length > 25) {
      return res.status(400).json({
        success: false,
        message: "Phone number is too long"
      });
    }

    await users().updateOne(
      { _id: new ObjectId(req.user!.id) },
      {
        $set: {
          name,
          photoURL,
          phone,
          whatsapp,
          updatedAt: new Date()
        }
      }
    );

    const user = await users().findOne({
      _id: new ObjectId(req.user!.id)
    });

    return res.json({
      success: true,
      user: safeUser(user)
    });

  } catch (error) {
    return sendError(res, error, "Profile update failed");
  }
});
// Upload profile photo to ImgBB
app.post("/api/upload/profile-photo", auth, async (req: AuthRequest, res: Response) => {
  try {
    const apiKey = process.env.IMGBB_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: "Image upload is not configured",
      });
    }

    const imageData = String(req.body.imageData || "");

    const match = imageData.match(
      /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/
    );

    if (!match) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid JPG, PNG or WEBP image",
      });
    }

    const base64Image = match[2];
    const imageBuffer = Buffer.from(base64Image, "base64");

    if (imageBuffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: "Image size must be less than 5MB",
      });
    }

    const formData = new URLSearchParams();
    formData.append("key", apiKey);
    formData.append("image", base64Image);

    const uploadResponse = await fetch(
      "https://api.imgbb.com/1/upload",
      {
        method: "POST",
        body: formData,
      }
    );

    const result = await uploadResponse.json() as {
      success?: boolean;
      data?: { url?: string };
    };

    if (!uploadResponse.ok || !result.success || !result.data?.url) {
      return res.status(502).json({
        success: false,
        message: "Image upload failed. Please try again.",
      });
    }

    return res.json({
      success: true,
      photoURL: result.data.url,
      message: "Image uploaded successfully",
    });

  } catch (error) {
    return sendError(res, error, "Image upload failed");
  }
});
app.post("/api/auth/google", async (req, res) => {
  try {
    if (!process.env.GOOGLE_CLIENT_ID) return res.status(503).json({ success: false, message: "Google sign-in is not configured yet. Add GOOGLE_CLIENT_ID to the server environment." });
    const credential = String(req.body.credential || "");
    if (!credential) return res.status(400).json({ success: false, message: "Google credential is required" });
    const verifyResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    if (!verifyResponse.ok) return res.status(401).json({ success: false, message: "Google credential is invalid or expired" });
    const payload = await verifyResponse.json() as { aud?: string; email?: string; email_verified?: string | boolean; name?: string; picture?: string };
    if (payload.aud !== process.env.GOOGLE_CLIENT_ID || !payload.email || !(payload.email_verified === true || payload.email_verified === "true")) return res.status(401).json({ success: false, message: "Google account email could not be verified" });
    const email = payload.email.toLowerCase();
    let user = await users().findOne({ email });
    if (user?.status === "suspended") return res.status(403).json({ success: false, message: "This account has been suspended" });
    if (!user) {
      const created = { name: payload.name || email.split("@")[0], email, photoURL: payload.picture || "", role: "creator", status: "active", authProvider: "google", createdAt: new Date() };
      const result = await users().insertOne(created);
      user = { ...created, _id: result.insertedId };
    } else if (!user.photoURL && payload.picture) {
      await users().updateOne({ _id: user._id }, { $set: { photoURL: payload.picture } });
      user.photoURL = payload.picture;
    }
    const token = sign(user);
    setAuthCookie(res, token);
    return res.json({ success: true, user: safeUser(user) });
  } catch (e) { console.error("Google sign-in failed", e); return res.status(401).json({ success: false, message: "Google sign-in could not be verified" }); }
});
app.post("/api/auth/logout", (_req, res) => { clearAuthCookie(res); res.json({ success: true, message: "Logged out" }); });

// Public approved studio discovery; hosts/admin see their own/all records on protected endpoints.
app.get("/api/studios", async (req: AuthRequest, res) => { try { const filter: any = { status: "approved" }; const q = String(req.query.q || "").trim(); if (q) filter.$or = [ { title: { $regex: q, $options: "i" } }, { category: { $regex: q, $options: "i" } }, { location: { $regex: q, $options: "i" } } ]; if (req.query.category) filter.category = String(req.query.category); const data = await studios().find(filter).sort({ createdAt: -1 }).toArray(); res.json({ success: true, data }); } catch (e) { sendError(res, e, "Failed to fetch studios"); } });
app.get("/api/studios/:id", async (req, res) => { try { if (!validId(String(req.params.id))) return res.status(400).json({ success: false, message: "Invalid studio ID" }); const data = await studios().findOne({ _id: new ObjectId(String(req.params.id)), status: "approved" }); if (!data) return res.status(404).json({ success: false, message: "Studio not found" }); res.json({ success: true, data }); } catch (e) { sendError(res, e, "Failed to fetch studio"); } });
app.post("/api/studios", auth, allow("host", "admin"), async (req: AuthRequest, res) => { try { const b = req.body; if (!b.title || !b.category || !b.location || !b.image || !b.description || Number(b.hourlyRate) < 0 || Number(b.maxCapacity) < 1) return res.status(400).json({ success: false, message: "Complete all required studio fields" }); const item = { title: String(b.title).trim(), category: String(b.category), hourlyRate: Number(b.hourlyRate), securityDeposit: Number(b.securityDeposit || 0), maxCapacity: Number(b.maxCapacity), location: String(b.location).trim(), image: String(b.image), amenities: Array.isArray(b.amenities) ? b.amenities : [], description: String(b.description), hostName: req.user!.name, hostEmail: req.user!.email, status: req.user!.role === "admin" ? "approved" : "pending", rating: 0, reviewCount: 0, createdAt: new Date(), updatedAt: new Date() }; const result = await studios().insertOne(item); res.status(201).json({ success: true, data: { ...item, _id: result.insertedId }, message: item.status === "pending" ? "Studio submitted for admin approval" : "Studio created" }); } catch (e) { sendError(res, e, "Failed to create studio"); } });
app.get("/api/my/studios", auth, allow("host", "admin"), async (req: AuthRequest, res) => { const filter = req.user!.role === "admin" ? {} : { hostEmail: req.user!.email }; const data = await studios().find(filter).sort({ createdAt: -1 }).toArray(); res.json({ success: true, data }); });
app.patch("/api/studios/:id", auth, allow("host", "admin"), async (req: AuthRequest, res) => { try { if (!validId(String(req.params.id))) return res.status(400).json({ success: false, message: "Invalid studio ID" }); const id = new ObjectId(String(req.params.id)); const filter: any = { _id: id }; if (req.user!.role !== "admin") filter.hostEmail = req.user!.email; const allowed = ["title", "category", "hourlyRate", "securityDeposit", "maxCapacity", "location", "image", "amenities", "description"]; const update: any = { updatedAt: new Date() }; for (const key of allowed) if (req.body[key] !== undefined) update[key] = req.body[key]; const result = await studios().updateOne(filter, { $set: update }); if (!result.matchedCount) return res.status(404).json({ success: false, message: "Studio not found or access denied" }); res.json({ success: true, data: await studios().findOne({ _id: id }) }); } catch (e) { sendError(res, e, "Failed to update studio"); } });
app.delete("/api/studios/:id", auth, allow("host", "admin"), async (req: AuthRequest, res) => { try { if (!validId(String(req.params.id))) return res.status(400).json({ success: false, message: "Invalid studio ID" }); const filter: any = { _id: new ObjectId(String(req.params.id)) }; if (req.user!.role !== "admin") filter.hostEmail = req.user!.email; const result = await studios().deleteOne(filter); if (!result.deletedCount) return res.status(404).json({ success: false, message: "Studio not found or access denied" }); res.json({ success: true, message: "Studio deleted" }); } catch (e) { sendError(res, e, "Failed to delete studio"); } });
app.patch("/api/admin/studios/:id/status", auth, allow("admin"), async (req, res) => { if (!validId(String(req.params.id)) || !["approved", "rejected", "pending"].includes(req.body.status)) return res.status(400).json({ success: false, message: "Invalid request" }); await studios().updateOne({ _id: new ObjectId(String(req.params.id)) }, { $set: { status: req.body.status, updatedAt: new Date() } }); res.json({ success: true, message: "Studio status updated" }); });


// Booking lifecycle: role-based permissions + 2-hour studio buffer.

const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

// CREATE BOOKING - Creator selects booking duration
app.post("/api/bookings", auth, allow("creator", "host"), async (req: AuthRequest, res) => {
  const { studioId, date, startTime, durationHours, notes } = req.body;

  const studioIdValue = String(studioId || "");
const dateValue = String(date || "");
const startValue = String(startTime || "");
const duration = Number(durationHours);

const todayInDhaka = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Dhaka",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());

if (
  !validId(studioIdValue) ||
  !/^\d{4}-\d{2}-\d{2}$/.test(dateValue) ||
  dateValue < todayInDhaka ||
  !/^([01]\d|2[0-3]):[0-5]\d$/.test(startValue) ||
  !Number.isFinite(duration) ||
  duration <= 0 ||
  duration > 12 ||
  !Number.isInteger(duration * 2)
) {
  return res.status(400).json({
    success: false,
    message:
      "Invalid booking details. Past dates are not allowed. Select today or a future date and a valid duration.",
  });
}
  const startMinutes = timeToMinutes(startValue);
  const endMinutes = startMinutes + duration * 60;

  if (endMinutes >= 1440) {
    return res.status(400).json({
      success: false,
      message: "Booking must end before midnight"
    });
  }

  const endValue = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;

  const session = getMongoClient().startSession();
  let created: any = null;

  try {
    await session.withTransaction(async () => {
      const studio = await studios().findOne(
        {
          _id: new ObjectId(studioIdValue),
          status: "approved"
        },
        { session }
      );

      if (!studio) throw new Error("STUDIO_UNAVAILABLE");

      if (studio.hostEmail === req.user!.email) {
        throw new Error("CANNOT_BOOK_OWN_STUDIO");
      }

      await studios().updateOne(
        { _id: studio._id },
        { $inc: { bookingLockVersion: 1 } },
        { session }
      );

      const existingBookings = await bookings()
        .find(
          {
            studioId: String(studio._id),
            date: dateValue,
            status: { $in: ["pending", "confirmed", "completed"] }
          },
          { session }
        )
        .toArray();

      const collision = existingBookings.some((booking: any) => {
        const existingStart = timeToMinutes(booking.startTime);
        const existingEnd = timeToMinutes(booking.endTime);

        const buffer = booking.status === "completed" ? 120 : 0;
        const blockedUntil = existingEnd + buffer;

        return (
          startMinutes < blockedUntil &&
          endMinutes > existingStart
        );
      });

      if (collision) {
        throw new Error("BOOKING_TIME_CONFLICT");
      }

      const hourlyRate = Number(studio.hourlyRate);
      const totalAmount = Math.round(duration * hourlyRate * 100) / 100;
      const securityDeposit = Number(studio.securityDeposit || 0);

      if (!Number.isFinite(hourlyRate) || hourlyRate < 0) {
        throw new Error("INVALID_STUDIO_RATE");
      }

      const booking = {
        studioId: String(studio._id),
        studioTitle: studio.title,
        studioImage: studio.image,
        hostEmail: studio.hostEmail,
        creatorEmail: req.user!.email,
        creatorName: req.user!.name,
        date: dateValue,
        startTime: startValue,
        endTime: endValue,
        durationHours: duration,
        hourlyRate,
        totalAmount,
        securityDeposit,
        paidAmount: 0,
        paymentStatus: "unpaid",
        notes: String(notes || "").slice(0, 1000),
        status: "pending",
        createdAt: new Date()
      };

      const result = await bookings().insertOne(booking, { session });

      created = {
        ...booking,
        _id: result.insertedId
      };
    });

    return res.status(201).json({
      success: true,
      message: "Booking request submitted successfully",
      data: created
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message === "BOOKING_TIME_CONFLICT") {
      return res.status(409).json({
        success: false,
        message: "This studio is unavailable during that time or its preparation buffer."
      });
    }

    if (message === "CANNOT_BOOK_OWN_STUDIO") {
      return res.status(403).json({
        success: false,
        message: "You cannot book your own studio"
      });
    }

    if (message === "STUDIO_UNAVAILABLE") {
      return res.status(404).json({
        success: false,
        message: "Studio is unavailable"
      });
    }

    if (message === "INVALID_STUDIO_RATE") {
      return res.status(400).json({
        success: false,
        message: "Studio hourly rate is invalid"
      });
    }

    return sendError(res, error, "Booking failed");

  } finally {
    await session.endSession();
  }
});

// Reveal contact details only to confirmed/completed booking participants
// GET BOOKINGS
app.get("/api/bookings", auth, async (req: AuthRequest, res) => {
  try {
    const email = String(req.user?.email || "").trim();

    if (!email) {
      return res.status(401).json({
        success: false,
        message: "User email not found",
      });
    }

    const role = req.user!.role;

    let filter: any = {};

    if (role === "host") {
      filter = {
        hostEmail: {
          $regex: `^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          $options: "i",
        },
      };
    } else if (role === "creator") {
      filter = {
        creatorEmail: {
          $regex: `^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          $options: "i",
        },
      };
    } else if (role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view bookings",
      });
    }

   const data = await bookings()
  .find(filter)
  .sort({ createdAt: -1 })
  .project({
    hostEmail: 0,
    creatorEmail: 0,
  })
  .toArray();

    return res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("GET BOOKINGS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load bookings",
    });
  }
});

// UPDATE BOOKING STATUS
// Creator wishlist
app.get("/api/wishlist", auth, allow("creator"), async (req: AuthRequest, res) => {
  try {
    const data = await wishlists()
      .find({ creatorEmail: req.user!.email })
      .sort({ createdAt: -1 })
      .toArray();

    return res.json({ success: true, data });
  } catch (error) {
    return sendError(res, error, "Failed to load wishlist");
  }
});

app.post("/api/wishlist/:studioId", auth, allow("creator"), async (req: AuthRequest, res) => {
  try {
    const studioId = String(req.params.studioId);

    if (!validId(studioId)) {
      return res.status(400).json({ success: false, message: "Invalid studio ID" });
    }

    const studio = await studios().findOne({
      _id: new ObjectId(studioId),
      status: "approved"
    });

    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }

    const existing = await wishlists().findOne({
      creatorEmail: req.user!.email,
      studioId
    });

    if (existing) {
      return res.status(409).json({ success: false, message: "Already in wishlist" });
    }

    const item = {
      creatorEmail: req.user!.email,
      studioId,
      studioTitle: studio.title,
      studioImage: studio.image,
      hourlyRate: studio.hourlyRate,
      location: studio.location,
      createdAt: new Date()
    };

    const result = await wishlists().insertOne(item);

    return res.status(201).json({
      success: true,
      message: "Added to wishlist",
      data: { ...item, _id: result.insertedId }
    });

  } catch (error) {
    return sendError(res, error, "Failed to add wishlist");
  }
});

app.delete("/api/wishlist/:studioId", auth, allow("creator"), async (req: AuthRequest, res) => {
  try {
    const studioId = String(req.params.studioId);

    if (!validId(studioId)) {
      return res.status(400).json({ success: false, message: "Invalid studio ID" });
    }

    await wishlists().deleteOne({
      creatorEmail: req.user!.email,
      studioId
    });

    return res.json({ success: true, message: "Removed from wishlist" });

  } catch (error) {
    return sendError(res, error, "Failed to remove wishlist");
  }
});

// Reviews: only a creator with a completed booking for this studio can review once.
app.get("/api/studios/:id/reviews", async (req, res) => { if (!validId(String(req.params.id))) return res.status(400).json({ success: false, message: "Invalid studio ID" }); const data = await reviews().find({ studioId: req.params.id }).sort({ createdAt: -1 }).toArray(); res.json({ success: true, data }); });
app.post("/api/studios/:id/reviews", auth, allow("creator"), async (req: AuthRequest, res) => { try { if (!validId(String(req.params.id))) return res.status(400).json({ success: false, message: "Invalid studio ID" }); const rating = Number(req.body.rating); const comment = String(req.body.comment || "").trim(); if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !comment) return res.status(400).json({ success: false, message: "Provide a 1–5 rating and review comment" }); const studio = await studios().findOne({ _id: new ObjectId(String(req.params.id)) }); if (!studio) return res.status(404).json({ success: false, message: "Studio not found" }); const booking = await bookings().findOne({ studioId: req.params.id, creatorEmail: req.user!.email, status: "completed" }); if (!booking) return res.status(403).json({ success: false, message: "A completed booking is required to review this studio" }); if (await reviews().findOne({ studioId: req.params.id, creatorEmail: req.user!.email })) return res.status(409).json({ success: false, message: "You have already reviewed this studio" });
const review = {
  studioId: String(req.params.id),
  studioTitle: studio.title,
  hostEmail: String(studio.hostEmail || "").toLowerCase(),
  creatorEmail: req.user!.email,
  creatorName: req.user!.name,
  rating,
  comment,
  createdAt: new Date()
}; await reviews().insertOne(review); const all = await reviews().find({ studioId: req.params.id }).toArray(); const average = all.reduce((sum: number, item: any) => sum + item.rating, 0) / all.length; await studios().updateOne({ _id: new ObjectId(String(req.params.id)) }, { $set: { rating: Number(average.toFixed(1)), reviewCount: all.length } }); res.status(201).json({ success: true, message: "Review submitted", data: review }); } catch (e) { sendError(res, e, "Review submission failed"); } });

// Admin management
app.get("/api/admin/overview", auth, allow("admin"), async (_req, res) => { const [userCount, studioCount, pendingStudios, bookingCount, pendingBookings, reviewCount, recentUsers, recentBookings] = await Promise.all([users().countDocuments(), studios().countDocuments(), studios().countDocuments({ status: "pending" }), bookings().countDocuments(), bookings().countDocuments({ status: "pending" }), reviews().countDocuments(), users().find({}, { projection: { passwordHash: 0 } }).sort({ createdAt: -1 }).limit(6).toArray(), bookings().find({}).sort({ createdAt: -1 }).limit(6).toArray()]); res.json({ success: true, data: { userCount, studioCount, pendingStudios, bookingCount, pendingBookings, reviewCount, recentUsers: recentUsers.map(safeUser), recentBookings } }); });
app.get("/api/admin/users", auth, allow("admin"), async (_req, res) => { const data = await users().find({}, { projection: { passwordHash: 0 } }).sort({ createdAt: -1 }).toArray(); res.json({ success: true, data: data.map(safeUser) }); });
app.patch("/api/admin/users/:id", auth, allow("admin"), async (req: AuthRequest, res) => {
  try {
    const userId = String(req.params.id);

    if (!validId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    const targetId = new ObjectId(userId);

    const targetUser = await users().findOne({ _id: targetId });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const update: any = {};

    if (req.body.role !== undefined) {
      if (!["creator", "host", "admin"].includes(req.body.role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user role"
        });
      }

      update.role = req.body.role;
    }

    if (req.body.status !== undefined) {
      if (!["active", "suspended"].includes(req.body.status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid account status"
        });
      }

      update.status = req.body.status;
    }

    if (!Object.keys(update).length) {
      return res.status(400).json({
        success: false,
        message: "No valid changes provided"
      });
    }

    // Admin cannot suspend their own account
    if (
      userId === req.user!.id &&
      update.status === "suspended"
    ) {
      return res.status(400).json({
        success: false,
        message: "You cannot suspend your own account"
      });
    }

    // Admin cannot remove their own admin role
    if (
      userId === req.user!.id &&
      update.role &&
      update.role !== "admin"
    ) {
      return res.status(400).json({
        success: false,
        message: "You cannot remove your own admin role"
      });
    }

    // Protect the last active admin account
    const removingAdminAccess =
      targetUser.role === "admin" &&
      (
        update.role !== undefined && update.role !== "admin" ||
        update.status === "suspended"
      );

    if (removingAdminAccess) {
      const activeAdminCount = await users().countDocuments({
        role: "admin",
        status: "active"
      });

      if (activeAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: "At least one active admin account must remain"
        });
      }
    }

    const result = await users().updateOne(
      { _id: targetId },
      { $set: update }
    );

    if (!result.matchedCount) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const updatedUser = await users().findOne({ _id: targetId });

    return res.json({
      success: true,
      message: "User updated successfully",
      data: updatedUser ? safeUser(updatedUser) : null
    });

  } catch (error) {
    console.error("Admin user update failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update user"
    });
  }
});
app.get("/api/admin/studios", auth, allow("admin"), async (_req, res) => res.json({ success: true, data: await studios().find({}).sort({ createdAt: -1 }).toArray() }));
app.get("/api/admin/bookings", auth, allow("admin"), async (_req, res) => res.json({ success: true, data: await bookings().find({}).sort({ createdAt: -1 }).toArray() }));
// Admin revenue overview
app.get("/api/admin/revenue", auth, allow("admin"), async (_req, res) => {
  try {
    const data = await bookings()
      .find({ status: "completed" })
      .toArray();

    const totalEarned = data.reduce((sum: number, b: any) => {
  const [sh, sm] = String(b.startTime).split(":").map(Number);
  const [eh, em] = String(b.endTime).split(":").map(Number);

  const hours = (eh * 60 + em - (sh * 60 + sm)) / 60;
  const calculatedTotal = Math.max(
    0,
    hours * Number(b.hourlyRate || 0)
  );

  return sum + Number(b.totalAmount ?? calculatedTotal);
}, 0);

const totalReceived = data.reduce(
  (sum: number, b: any) => sum + Number(b.paidAmount || 0),
  0
);

    return res.json({
      success: true,
     data: {
  totalEarned,
  totalReceived,
  outstanding: Math.max(0, totalEarned - totalReceived),
  totalBookings: data.length,
 paidBookings: data.filter((b: any) => {
  const paid = Number(b.paidAmount || 0);
  const total = Number(b.totalAmount || 0);
  return total > 0 && paid >= total;
}).length
}
    });
  } catch (error) {
    return sendError(res, error, "Failed to load revenue");
  }
});
// Admin records actual payment received
app.patch("/api/admin/bookings/:id/payment", auth, allow("admin"), async (req, res) => {
  try {
    if (!validId(String(req.params.id))) {
      return res.status(400).json({ success: false, message: "Invalid booking ID" });
    }

    const rawPaidAmount = req.body.paidAmount;

if (
  rawPaidAmount === undefined ||
  rawPaidAmount === null ||
  rawPaidAmount === ""
) {
  return res.status(400).json({
    success: false,
    message: "Payment amount is required"
  });
}

const paidAmount = Number(rawPaidAmount);

if (!Number.isFinite(paidAmount) || paidAmount < 0) {
  return res.status(400).json({
    success: false,
    message: "Invalid payment amount"
  });
}

const id = new ObjectId(String(req.params.id));
const booking = await bookings().findOne({ _id: id });

if (!booking) {
  return res.status(404).json({
    success: false,
    message: "Booking not found"
  });
}

const [sh, sm] = String(booking.startTime).split(":").map(Number);
const [eh, em] = String(booking.endTime).split(":").map(Number);

const startMinutes = sh * 60 + sm;
let endMinutes = eh * 60 + em;

if (
  !Number.isInteger(startMinutes) ||
  !Number.isInteger(endMinutes) ||
  startMinutes < 0 ||
  startMinutes >= 1440 ||
  endMinutes < 0 ||
  endMinutes >= 1440 ||
  endMinutes <= startMinutes
) {
  return res.status(400).json({
    success: false,
    message: "Invalid booking time"
  });
}

const hours = (endMinutes - startMinutes) / 60;
const hourlyRate = Number(booking.hourlyRate);

if (!Number.isFinite(hourlyRate) || hourlyRate < 0) {
  return res.status(400).json({
    success: false,
    message: "Invalid hourly rate"
  });
}

const totalAmount = Math.round(hours * hourlyRate * 100) / 100;

if (paidAmount > totalAmount) {
  return res.status(400).json({
    success: false,
    message: "Received amount cannot exceed booking total"
  });
}

    await bookings().updateOne(
      { _id: id },
      {
        $set: {
          totalAmount,
          paidAmount,
paymentStatus:
  totalAmount > 0 && paidAmount >= totalAmount
    ? "paid"
    : paidAmount > 0
      ? "partial"
      : "unpaid",          paymentUpdatedAt: new Date()
        }
      }
    );

    return res.json({
      success: true,
      message: "Payment record updated"
    });

  } catch (error) {
    return sendError(res, error, "Payment update failed");
  }
});


// Host earnings: completed booking hours x hourly rate
app.get(
  "/api/host/earnings",
  auth,
  allow("host", "admin"),
  async (req: AuthRequest, res) => {
    try {
      const filter: any = { status: "completed" };

      if (req.user!.role === "host") {
        filter.hostEmail = req.user!.email;
      }

      const data = await bookings()
        .find(filter)
        .sort({ completedAt: -1 })
        .toArray();

      const transactions = data.map((booking: any) => {
        const [sh, sm] = String(booking.startTime).split(":").map(Number);
        const [eh, em] = String(booking.endTime).split(":").map(Number);

        const startMinutes = sh * 60 + sm;
        const endMinutes = eh * 60 + em;

        const validTime =
          Number.isInteger(startMinutes) &&
          Number.isInteger(endMinutes) &&
          startMinutes >= 0 &&
          startMinutes < 1440 &&
          endMinutes > startMinutes &&
          endMinutes < 1440;

        const hours = validTime
          ? (endMinutes - startMinutes) / 60
          : 0;

        const hourlyRate = Math.max(
          0,
          Number(booking.hourlyRate) || 0
        );

        const earnedAmount = Math.round(
          hours * hourlyRate * 100
        ) / 100;

        const paidAmount = Math.max(
          0,
          Number(booking.paidAmount) || 0
        );

        const paymentStatus =
          paidAmount >= earnedAmount && earnedAmount > 0
            ? "paid"
            : paidAmount > 0
              ? "partial"
              : "unpaid";

        return {
          bookingId: String(booking._id),
          studioTitle: booking.studioTitle || "Studio",
          creatorName: booking.creatorName || "Creator",
          creatorEmail: booking.creatorEmail || "",
          date: booking.date || "",
          startTime: booking.startTime || "",
          endTime: booking.endTime || "",
          hours,
          hourlyRate,
          earnedAmount,
          paidAmount,
          paymentStatus
        };
      });

      const totalEarned = transactions.reduce(
        (sum, item) => sum + item.earnedAmount,
        0
      );

      const totalReceived = transactions.reduce(
        (sum, item) => sum + item.paidAmount,
        0
      );

      const outstanding = Math.max(
        0,
        totalEarned - totalReceived
      );

      return res.json({
        success: true,
        data: {
          totalEarned,
          totalReceived,
          outstanding,
          totalBookings: transactions.length,
          transactions
        }
      });
    } catch (error) {
      return sendError(res, error, "Failed to load host earnings");
    }
  }
);

// Host Reviews — Only reviews for studios owned by this host
app.get(
  "/api/host/reviews",
  auth,
  allow("host"),
  async (req: AuthRequest, res: Response) => {
    try {
      const hostEmail = String(req.user!.email).toLowerCase();

      const hostStudios = await studios()
        .find({ hostEmail })
        .project({ _id: 1 })
        .toArray();

      const studioIds = hostStudios.map((studio) =>
        String(studio._id)
      );

      const data = await reviews()
        .find({
          $or: [
            { hostEmail },
            {
              studioId: { $in: studioIds },
            },
          ],
        })
        .sort({ createdAt: -1 })
        .toArray();

      return res.json({ success: true, data });
    } catch (error) {
      return sendError(res, error, "Failed to load host reviews");
    }
  }
);
app.get("/api/admin/reviews", auth, allow("admin"), async (_req, res) => res.json({ success: true, data: await reviews().find({}).sort({ createdAt: -1 }).toArray() }));
app.delete("/api/admin/reviews/:id", auth, allow("admin"), async (req, res) => { if (!validId(String(req.params.id))) return res.status(400).json({ success: false, message: "Invalid review ID" }); await reviews().deleteOne({ _id: new ObjectId(String(req.params.id)) }); res.json({ success: true, message: "Review deleted" }); });


// Admin Inbox — General website contact messages
app.get(
  "/api/admin/contacts",
  auth,
  allow("admin"),
  async (_req, res) => {
    try {
      const data = await contacts()
        .find({
          $or: [
            { recipientType: "admin" },
            { recipientType: { $exists: false } },
          ],
        })
        .sort({ createdAt: -1 })
        .toArray();

      return res.json({ success: true, data });
    } catch (error) {
      return sendError(res, error, "Failed to load admin messages");
    }
  }
);
app.patch(
  "/api/admin/contacts/:id",
  auth,
  allow("admin"),
  async (req: AuthRequest, res: Response) => {
    try {
const id = String(req.params.id);
      const { status } = req.body;

      if (!validId(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid contact ID",
        });
      }

      const allowedStatuses = [
        "new",
        "in-progress",
        "resolved",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status",
        });
      }

      const result = await contacts().updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            status,
            updatedAt: new Date(),
          },
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({
          success: false,
          message: "Contact not found",
        });
      }

      return res.json({
        success: true,
        message: "Contact status updated successfully",
      });
    } catch (error) {
      return sendError(
        res,
        error,
        "Failed to update contact status"
      );
    }
  }
);
// Host Inbox — Messages sent from the host's studio details
app.get(
  "/api/host/contacts",
  auth,
  allow("host"),
  async (req: AuthRequest, res) => {
    try {
      const hostEmail = String(req.user!.email).toLowerCase();

      const data = await contacts()
        .find({
          recipientType: "host",
          hostEmail,
        })
        .sort({ createdAt: -1 })
        .toArray();

      return res.json({ success: true, data });
    } catch (error) {
      return sendError(res, error, "Failed to load host messages");
    }
  }
);

// Unified Inbox — list conversations for the logged-in user
app.get("/api/messages", auth, async (req: AuthRequest, res) => {
  try {
    const email = String(req.user!.email).toLowerCase();
    const role = req.user!.role;

    let filter: any = {};

    if (role === "admin") {
      filter = {
        $or: [
          { recipientType: "admin" },
          { recipientType: { $exists: false } },
        ],
      };
    } else if (role === "host") {
      filter = {
        recipientType: "host",
        hostEmail: email,
      };
    } else if (role === "creator") {
      filter = {
        email,
      };
    } else {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const data = await contacts()
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    return res.json({ success: true, data });
  } catch (error) {
    return sendError(res, error, "Failed to load messages");
  }
});

// Reply to an existing conversation
app.post(
  "/api/messages/:id/reply",
  auth,
  async (req: AuthRequest, res) => {
    try {
      const id = String(req.params.id);
      const message = String(req.body.message || "").trim();

      if (!validId(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid conversation ID",
        });
      }

      if (!message || message.length > 3000) {
        return res.status(400).json({
          success: false,
          message: "Message must be between 1 and 3000 characters",
        });
      }

      const conversation = await contacts().findOne({
        _id: new ObjectId(id),
      });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: "Conversation not found",
        });
      }

      const email = String(req.user!.email).toLowerCase();
      const role = req.user!.role;

      const recipientType =
        conversation.recipientType || "admin";

      const isAdmin =
        role === "admin" && recipientType === "admin";

      const isHost =
        role === "host" &&
        recipientType === "host" &&
        String(conversation.hostEmail || "").toLowerCase() === email;

      const isCreator =
        role === "creator" &&
        String(conversation.email || "").toLowerCase() === email;

      if (!isAdmin && !isHost && !isCreator) {
        return res.status(403).json({
          success: false,
          message: "You cannot reply to this conversation",
        });
      }

      const reply = {
        senderId: req.user!.id,
        senderName: req.user!.name,
        senderEmail: email,
        senderRole: role,
        message,
        createdAt: new Date(),
      };

      await contacts().updateOne(
{ _id: new ObjectId(String(id)) },
        {
$push: { replies: reply } as any,
          $set: {
            updatedAt: new Date(),
            status: "in-progress",
          },
        }
      );

      return res.status(201).json({
        success: true,
        message: "Reply sent successfully",
        data: reply,
      });
    } catch (error) {
      return sendError(res, error, "Failed to send reply");
    }
  }
);

app.patch("/api/bookings/:id/status", auth, async (req: AuthRequest, res) => {
  try {
    if (!validId(String(req.params.id))) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID",
      });
    }

    const status = String(req.body.status);

    if (!["confirmed", "rejected", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const id = new ObjectId(String(req.params.id));
    const booking = await bookings().findOne({ _id: id });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const isAdmin = req.user!.role === "admin";

    const isHost =
      req.user!.role === "host" &&
      booking.hostEmail === req.user!.email;

    const isCreator =
      booking.creatorEmail === req.user!.email;

    // CONFIRM OR REJECT
    if (status === "confirmed" || status === "rejected") {
      if (!isAdmin && !isHost) {
        return res.status(403).json({
          success: false,
          message: "Only host or admin can update this booking",
        });
      }

      if (booking.status !== "pending") {
        return res.status(400).json({
          success: false,
          message: "Only pending bookings can be updated",
        });
      }
    }

    // COMPLETE BOOKING
    if (status === "completed") {
      if (!isAdmin && !isHost) {
        return res.status(403).json({
          success: false,
          message: "Only host or admin can complete a booking",
        });
      }

      if (booking.status !== "confirmed") {
        return res.status(400).json({
          success: false,
          message: "Only confirmed bookings can be completed",
        });
      }

      const bookingEnd = new Date(
        `${booking.date}T${booking.endTime}:00+06:00`
      );

      if (Date.now() < bookingEnd.getTime()) {
        return res.status(400).json({
          success: false,
          message: "Booking can only be completed after its end time",
        });
      }
    }

    // CANCEL BOOKING
    if (status === "cancelled") {
      if (isAdmin) {
        // Admin can cancel bookings.
      } else if (isCreator) {
        if (!["pending", "confirmed"].includes(booking.status)) {
          return res.status(400).json({
            success: false,
            message: "This booking cannot be cancelled",
          });
        }

        if (booking.status === "confirmed") {
          const bookingStart = new Date(
            `${booking.date}T${booking.startTime}:00+06:00`
          );

          if (Date.now() >= bookingStart.getTime()) {
            return res.status(400).json({
              success: false,
              message: "You cannot cancel a booking after it has started",
            });
          }
        }
      } else {
        return res.status(403).json({
          success: false,
          message: "You cannot cancel this booking",
        });
      }
    }

    const update: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === "completed") {
      update.completedAt = new Date();
    }

    await bookings().updateOne(
      { _id: id },
      { $set: update }
    );

    return res.json({
      success: true,
      message: "Booking updated successfully",
    });

  } catch (error) {
    console.error("Booking status update failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update booking",
    });
  }
});

// Host marks a completed booking as paid
app.patch(
  "/api/bookings/:id/payment",
  auth,
  allow("host"),
async (req: AuthRequest, res) => {
      try {
      const bookingId = String(req.params.id);

      if (!validId(bookingId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid booking ID",
        });
      }

      const booking = await bookings().findOne({
        _id: new ObjectId(bookingId),
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }

      if (
        String(booking.hostEmail).toLowerCase() !==
String(req.user!.email).toLowerCase()
      ) {
        return res.status(403).json({
          success: false,
          message: "You cannot update this booking payment",
        });
      }

      if (booking.status !== "completed") {
        return res.status(400).json({
          success: false,
          message: "Only completed bookings can be marked as paid",
        });
      }

      const totalAmount = Math.max(0, Number(booking.totalAmount) || 0);

      await bookings().updateOne(
        { _id: new ObjectId(bookingId) },
        {
          $set: {
            paidAmount: totalAmount,
            paymentStatus: "paid",
            paidAt: new Date(),
            updatedAt: new Date(),
          },
        }
      );

      return res.json({
        success: true,
        message: "Payment marked as paid",
      });
    } catch (error) {
      return sendError(res, error, "Failed to update payment");
    }
  }
);

// SECURE BOOKING CONTACT DETAILS
app.get("/api/bookings/:id/contact", auth, async (req: AuthRequest, res) => {
  try {
    const bookingId = String(req.params.id);

    if (!validId(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID",
      });
    }

    const booking = await bookings().findOne({
      _id: new ObjectId(bookingId),
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const userEmail = String(req.user?.email || "").toLowerCase();
    const role = req.user?.role;

    const isAdmin = role === "admin";
    const isHost =
      role === "host" &&
      String(booking.hostEmail || "").toLowerCase() === userEmail;

    const isCreator =
      role === "creator" &&
      String(booking.creatorEmail || "").toLowerCase() === userEmail;

    if (!isAdmin && !isHost && !isCreator) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view these contact details",
      });
    }

    if (!isAdmin && !["confirmed", "completed"].includes(booking.status)) {
      return res.status(403).json({
        success: false,
        message: "Contact details are available after booking confirmation",
      });
    }

    const [host, creator] = await Promise.all([
      users().findOne(
        { email: String(booking.hostEmail).toLowerCase() },
        { projection: { name: 1, email: 1, phone: 1, whatsapp: 1 } }
      ),
      users().findOne(
        { email: String(booking.creatorEmail).toLowerCase() },
        { projection: { name: 1, email: 1, phone: 1, whatsapp: 1 } }
      ),
    ]);

    const contact = (person: any) => ({
      name: person?.name || "",
      email: person?.email || "",
      phone: person?.phone || "",
      whatsapp: person?.whatsapp || "",
    });

    if (isAdmin) {
      return res.json({
        success: true,
        data: {
          host: contact(host),
          creator: contact(creator),
        },
      });
    }

    return res.json({
      success: true,
      data: {
        contact: contact(isHost ? creator : host),
      },
    });
  } catch (error) {
    console.error("Booking contact lookup failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load contact details",
    });
  }
});

// Public contact form submission

// Public Contact Form — Admin or Studio Host
app.post("/api/contact", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      photoURL,
      subject,
      message,
      studioId,
    } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "Name, email and message are required",
      });
    }

    let recipientType: "admin" | "host" = "admin";
    let hostEmail = "";

    // If a studio ID is provided, send the message to that studio's host
    if (studioId) {
      if (!validId(String(studioId))) {
        return res.status(400).json({
          success: false,
          message: "Invalid studio ID",
        });
      }

      const studio = await studios().findOne({
        _id: new ObjectId(String(studioId)),
        status: "approved",
      });

      if (!studio) {
        return res.status(404).json({
          success: false,
          message: "Studio not found",
        });
      }

      hostEmail = String(studio.hostEmail || "").toLowerCase();

      if (!hostEmail) {
        return res.status(400).json({
          success: false,
          message: "Studio host information not found",
        });
      }

      recipientType = "host";
    }

    const result = await contacts().insertOne({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      phone: String(phone || "").trim(),
      photoURL: String(photoURL || "").trim(),
      subject: String(subject || "General Inquiry").trim(),
      message: String(message).trim(),
      recipientType,
      hostEmail,
      studioId: studioId ? String(studioId) : "",
      status: "new",
      createdAt: new Date(),
      replies: [],
    });

    return res.status(201).json({
      success: true,
      message: "Message submitted successfully",
      data: { _id: result.insertedId },
    });
  } catch (error) {
    console.error("Contact submission error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit contact message",
    });
  }
});




// Optional one-time demo seed. Enable with SEED_DEMO_STUDIOS=true and configure a dedicated demo host.
const seedDemoStudios = async () => {
  if (process.env.SEED_DEMO_STUDIOS !== "true" || await studios().countDocuments() > 0) return;
  const email = String(process.env.DEMO_HOST_EMAIL || "demo.host@studiospace.local").toLowerCase();
  const password = process.env.DEMO_HOST_PASSWORD || "";
  if (!password || password.length < 8) {
    console.warn("Demo studio seeding skipped: set DEMO_HOST_PASSWORD (8+ chars) and SEED_DEMO_STUDIOS=true.");
    return;
  }
  let host = await users().findOne({ email });
  if (!host) {
    const hostDoc = { name: "StudioSpace Demo Host", email, passwordHash: hashPassword(password), role: "host", status: "active", photoURL: "", createdAt: new Date() };
    const inserted = await users().insertOne(hostDoc);
    host = { ...hostDoc, _id: inserted.insertedId };
  }
  const samples: Array<{ title: string; category: string; hourlyRate: number; location: string; image: string; amenities: string[]; description: string }> = [
    { title: "Premium Photography Studio", category: "Photography", hourlyRate: 1500, location: "Banani, Dhaka", image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72", amenities: ["Softbox", "AC", "Parking", "Changing room"], description: "A bright, flexible photography space for portraits, fashion and product shoots." },
    { title: "Cinematic Film Stage", category: "Film Studio", hourlyRate: 2500, location: "Uttara, Dhaka", image: "https://images.unsplash.com/photo-1485846234645-a62644f84728", amenities: ["Cinema lights", "Green screen", "Makeup room"], description: "A production-ready stage for interviews, short films and commercial video shoots." },
    { title: "Podcast Lounge", category: "Podcast Studio", hourlyRate: 1200, location: "Dhanmondi, Dhaka", image: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc", amenities: ["Microphones", "Acoustic panels", "Mixer", "AC"], description: "An acoustically treated podcast room for interviews and creator conversations." },
    { title: "Music Recording Suite", category: "Music Studio", hourlyRate: 1800, location: "Mohammadpur, Dhaka", image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04", amenities: ["Audio interface", "Monitors", "Vocal booth"], description: "A compact recording suite for vocals, instruments and music production." },
    { title: "Creative Art Workshop", category: "Art Studio", hourlyRate: 900, location: "Lalmatia, Dhaka", image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f", amenities: ["Work tables", "Natural light", "Storage"], description: "A calm art workspace for drawing, painting, craft and small creative classes." }
  ];
  await studios().insertMany(samples.map((sample) => ({
    ...sample, securityDeposit: 1000, maxCapacity: 8,
    hostName: host!.name, hostEmail: email, status: "approved", isDemo: true, rating: 4.8, reviewCount: 0,
    createdAt: new Date(), updatedAt: new Date()
  })));
  console.log("Demo studios seeded into MongoDB.");
}

// Seed first admin from environment; never expose admin registration publicly.
const startServer = async () => {
  try {
    if (
      process.env.NODE_ENV === "production" &&
      (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
    ) {
      throw new Error(
        "Set a strong JWT_SECRET (32+ characters) in production."
      );
    }

    await connectDB();

    await studios().updateMany(
      { status: { $exists: false } },
      { $set: { status: "approved" } }
    );

    await users().createIndex(
      { email: 1 },
      { unique: true }
    );

    await studios().createIndex(
      { status: 1, createdAt: -1 }
    );

    await bookings().createIndex(
      { creatorEmail: 1, createdAt: -1 }
    );

    await wishlists().createIndex(
      { creatorEmail: 1, studioId: 1 },
      { unique: true }
    );

    const adminEmail = String(
      process.env.ADMIN_EMAIL || ""
    ).toLowerCase().trim();

    const adminPassword = process.env.ADMIN_PASSWORD || "";

    if (
      adminEmail &&
      adminPassword &&
      !(await users().findOne({ email: adminEmail }))
    ) {
      const admin = {
        name: process.env.ADMIN_NAME || "StudioSpace Admin",
        email: adminEmail,
        passwordHash: hashPassword(adminPassword),
        role: "admin",
        status: "active",
        photoURL: "",
        createdAt: new Date(),
      };

      await users().insertOne(admin);

      console.log(
        "Initial admin account created from environment configuration."
      );
    }

    await seedDemoStudios();

    app.listen(PORT, () => {
      console.log(`StudioSpace API running on port ${PORT}`);
    });

  } catch (e) {
    console.error("Server startup failed:", e);
    process.exit(1);
  }
};

startServer();