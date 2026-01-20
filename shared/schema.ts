import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sponsor stores table - 協賛店舗情報
export const sponsorStores = pgTable("sponsor_stores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storeName: varchar("store_name", { length: 200 }).notNull(),
  email: varchar("email", { length: 100 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  businessHours: text("business_hours"),
  website: varchar("website", { length: 200 }),
  status: varchar("status", { length: 20 }).default('pending'), // pending, active, suspended
  logoUrl: varchar("logo_url"),
  coverImageUrl: varchar("cover_image_url"),
  registrationDate: timestamp("registration_date").defaultNow(),
  lastLoginDate: timestamp("last_login_date"),
  totalViews: integer("total_views").default(0),
  totalBookings: integer("total_bookings").default(0),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }).default('0.00'),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tourism guides table - ガイド情報
export const tourismGuides = pgTable("tourism_guides", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id").references(() => sponsorStores.id),
  guideName: varchar("guide_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  gender: varchar("gender", { length: 10 }), // male, female, other
  age: integer("age"),
  languages: jsonb("languages").notNull(), // Array of supported languages
  registrationLanguage: varchar("registration_language", { length: 5 }).notNull().default('ja'), // Language used during registration (ja or en)
  experience: varchar("experience", { length: 20 }), // beginner, intermediate, advanced
  introduction: text("introduction"),
  specialties: text("specialties"),
  hourlyRate: decimal("hourly_rate", { precision: 8, scale: 2 }),
  availability: varchar("availability", { length: 20 }), // weekdays, weekends, both
  status: varchar("status", { length: 20 }).default('pending'), // pending, active, inactive
  profileImageUrl: varchar("profile_image_url"),
  totalBookings: integer("total_bookings").default(0),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }).default('0.00'),
  isAvailable: boolean("is_available").default(true),
  rankName: varchar("rank_name", { length: 50 }).default('Bronze').references(() => ranks.name), // Current rank (references ranks.name)
  rankScore: integer("rank_score").default(0), // Current rank score
  // Extended fields for guide services
  location: varchar("location", { length: 200 }), // Prefecture and city
  guideType: varchar("guide_type", { length: 20 }).default('day'), // day, night, both
  extensionPolicy: varchar("extension_policy", { length: 20 }).default('ask'), // ok, ask, no
  lateNightPolicy: varchar("late_night_policy", { length: 20 }).default('no'), // ok, ask, no
  achievements: text("achievements"),
  multiLingual: boolean("multi_lingual").default(false),
  hospitalitySupport: boolean("hospitality_support").default(false),
  emergencySupport: boolean("emergency_support").default(false),
  localExpert: boolean("local_expert").default(false),
  phoneVerified: boolean("phone_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_guides_rank").on(table.rankName, table.rankScore),
  index("idx_guides_location").on(table.location),
  index("idx_guides_status").on(table.status),
]);

// Experience programs table - 体験プログラム
export const experiencePrograms = pgTable("experience_programs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id").references(() => sponsorStores.id),
  programName: varchar("program_name", { length: 200 }).notNull(),
  description: text("description"),
  duration: integer("duration"), // minutes
  price: decimal("price", { precision: 8, scale: 2 }).notNull(),
  maxParticipants: integer("max_participants").default(10),
  languages: jsonb("languages").notNull(),
  category: varchar("category", { length: 50 }),
  imageUrl: varchar("image_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Reservations table - 予約情報
export const reservations = pgTable("reservations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id").references(() => sponsorStores.id),
  guideId: varchar("guide_id").references(() => tourismGuides.id),
  programId: varchar("program_id").references(() => experiencePrograms.id),
  customerName: varchar("customer_name", { length: 100 }).notNull(),
  customerEmail: varchar("customer_email", { length: 100 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 20 }),
  participantCount: integer("participant_count").default(1),
  reservationDate: timestamp("reservation_date").notNull(),
  totalPrice: decimal("total_price", { precision: 8, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).default('confirmed'), // confirmed, pending, cancelled, completed
  specialRequests: text("special_requests"),
  paymentStatus: varchar("payment_status", { length: 20 }).default('pending'), // pending, paid, refunded
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Reviews table - レビュー情報
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id").references(() => sponsorStores.id),
  guideId: varchar("guide_id").references(() => tourismGuides.id),
  reservationId: varchar("reservation_id").references(() => reservations.id),
  customerName: varchar("customer_name", { length: 100 }).notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sponsor referrals table - ガイドによる協賛店紹介の追跡
export const sponsorReferrals = pgTable("sponsor_referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  guideId: varchar("guide_id").references(() => tourismGuides.id).notNull(),
  sponsorStoreId: varchar("sponsor_store_id").references(() => sponsorStores.id).notNull(),
  referralDate: timestamp("referral_date").defaultNow().notNull(),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).default('10.00'), // Default 10% commission
  commissionAmount: decimal("commission_amount", { precision: 10, scale: 2 }),
  commissionStatus: varchar("commission_status", { length: 20 }).default('pending'), // pending, approved, paid, cancelled
  paymentDate: timestamp("payment_date"),
  referralSource: varchar("referral_source", { length: 100 }), // どこから紹介されたか (web, app, direct, etc.)
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Rank table - ガイドランク定義
export const ranks = pgTable("ranks", {
  name: varchar("name", { length: 50 }).primaryKey(), // Bronze, Silver, Gold, Platinum
  minScore: integer("min_score").notNull(), // 昇格に必要な最低スコア
  bonusRate: decimal("bonus_rate", { precision: 5, scale: 4 }).notNull(), // 配当ボーナス率 (0.0000 = 0%, 0.0500 = 5%)
  maxStores: integer("max_stores").default(100), // ガイドが紹介できる上限店舗数
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_ranks_min_score").on(table.minScore),
]);

// Define relations
export const sponsorStoresRelations = relations(sponsorStores, ({ many }) => ({
  guides: many(tourismGuides),
  programs: many(experiencePrograms),
  reservations: many(reservations),
  reviews: many(reviews),
  referrals: many(sponsorReferrals),
}));

export const tourismGuidesRelations = relations(tourismGuides, ({ one, many }) => ({
  store: one(sponsorStores, {
    fields: [tourismGuides.storeId],
    references: [sponsorStores.id],
  }),
  reservations: many(reservations),
  reviews: many(reviews),
  referrals: many(sponsorReferrals),
}));

export const experienceProgramsRelations = relations(experiencePrograms, ({ one, many }) => ({
  store: one(sponsorStores, {
    fields: [experiencePrograms.storeId],
    references: [sponsorStores.id],
  }),
  reservations: many(reservations),
}));

export const reservationsRelations = relations(reservations, ({ one }) => ({
  store: one(sponsorStores, {
    fields: [reservations.storeId],
    references: [sponsorStores.id],
  }),
  guide: one(tourismGuides, {
    fields: [reservations.guideId],
    references: [tourismGuides.id],
  }),
  program: one(experiencePrograms, {
    fields: [reservations.programId],
    references: [experiencePrograms.id],
  }),
  review: one(reviews),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  store: one(sponsorStores, {
    fields: [reviews.storeId],
    references: [sponsorStores.id],
  }),
  guide: one(tourismGuides, {
    fields: [reviews.guideId],
    references: [tourismGuides.id],
  }),
  reservation: one(reservations, {
    fields: [reviews.reservationId],
    references: [reservations.id],
  }),
}));

export const sponsorReferralsRelations = relations(sponsorReferrals, ({ one }) => ({
  guide: one(tourismGuides, {
    fields: [sponsorReferrals.guideId],
    references: [tourismGuides.id],
  }),
  sponsorStore: one(sponsorStores, {
    fields: [sponsorReferrals.sponsorStoreId],
    references: [sponsorStores.id],
  }),
}));

// Type exports
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type SponsorStore = typeof sponsorStores.$inferSelect;
export type InsertSponsorStore = typeof sponsorStores.$inferInsert;

export type TourismGuide = typeof tourismGuides.$inferSelect;
export type InsertTourismGuide = typeof tourismGuides.$inferInsert;

export type ExperienceProgram = typeof experiencePrograms.$inferSelect;
export type InsertExperienceProgram = typeof experiencePrograms.$inferInsert;

export type Reservation = typeof reservations.$inferSelect;
export type InsertReservation = typeof reservations.$inferInsert;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

export type SponsorReferral = typeof sponsorReferrals.$inferSelect;
export type InsertSponsorReferral = typeof sponsorReferrals.$inferInsert;

export type Rank = typeof ranks.$inferSelect;
export type InsertRank = typeof ranks.$inferInsert;