/* Prisma-based development seed.
 * Run with: npm run seed  (node prisma/seed.js)
 * Idempotent: upserts by email, so it can be re-run safely.
 */
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const SALT_ROUNDS = 12;
const PASSWORD = "Password@123"; // shared dev password for all seeded users

const now = new Date();
const inDays = (n) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000);

async function main() {
    const hashed = await bcrypt.hash(PASSWORD, SALT_ROUNDS);

    // ── Users ──────────────────────────────────────────────────────────────
    const admin = await prisma.user.upsert({
        where: { email: "admin@foodrescue.org" },
        update: {},
        create: {
            name: "Platform Admin",
            email: "admin@foodrescue.org",
            password: hashed,
            role: "ADMIN",
            phone: "+1-555-0100",
            address: "Head Office, Nairobi",
            organization: "Food Rescue HQ",
        },
    });

    const donors = [];
    for (const d of [
        { name: "Chef Amara Okafor", email: "amara@greenleafkitchen.com", organization: "Green Leaf Kitchen", phone: "+1-555-0101", address: "12 Riverside Ave" },
        { name: "Carlos Mendez", email: "carlos@harborviewmarket.com", organization: "Harborview Market", phone: "+1-555-0102", address: "88 Marina Blvd" },
        { name: "Lena Fischer", email: "lena@dailycrustbakery.com", organization: "Daily Crust Bakery", phone: "+1-555-0103", address: "5 Baker Lane" },
    ]) {
        donors.push(await prisma.user.upsert({
            where: { email: d.email },
            update: {},
            create: { ...d, password: hashed, role: "DONOR" },
        }));
    }

    const ngos = [];
    for (const n of [
        { name: "Sarah Kimani", email: "sarah@hopecenter.org", organization: "Hope Center Foundation", phone: "+1-555-0104", address: "220 Relief St" },
        { name: "David Ochieng", email: "david@feedthecity.org", organization: "Feed the City", phone: "+1-555-0105", address: "14 Community Rd" },
        { name: "Grace Wangari", email: "grace@shelterharmony.org", organization: "Shelter Harmony", phone: "+1-555-0106", address: "77 Kindness Way" },
    ]) {
        ngos.push(await prisma.user.upsert({
            where: { email: n.email },
            update: {},
            create: { ...n, password: hashed, role: "NGO" },
        }));
    }

    // ── Food listings (donors) ─────────────────────────────────────────────
    const foods = [];
    const foodData = [
        { donor: donors[0], title: "Vegetable Soup Batch", description: "Freshly cooked vegetable soup, 40 servings. Prepared today, refrigerated.", category: "Prepared", quantity: 40, unit: "servings", servings: 40, expiryDate: inDays(1), pickupLocation: "12 Riverside Ave", pickupWindow: "10am–2pm", city: "Nairobi", latitude: -1.2921, longitude: 36.8219 },
        { donor: donors[0], title: "Mixed Salad Platters", description: "Assorted fresh salads from today's lunch service.", category: "Produce", quantity: 25, unit: "platters", servings: 25, expiryDate: inDays(1), pickupLocation: "12 Riverside Ave", pickupWindow: "9am–12pm", city: "Nairobi", latitude: -1.2921, longitude: 36.8219 },
        { donor: donors[1], title: "Canned Goods Bundle", description: "Assorted canned vegetables and beans, undamaged.", category: "Pantry", quantity: 60, unit: "cans", servings: 60, expiryDate: inDays(120), pickupLocation: "88 Marina Blvd", pickupWindow: "8am–6pm", city: "Mombasa", latitude: -4.0435, longitude: 39.6682 },
        { donor: donors[1], title: "Surplus Milk Cartons", description: "UHT milk cartons nearing best-before date.", category: "Dairy", quantity: 30, unit: "liters", servings: 60, expiryDate: inDays(3), pickupLocation: "88 Marina Blvd", pickupWindow: "8am–6pm", city: "Mombasa", latitude: -4.0435, longitude: 39.6682 },
        { donor: donors[2], title: "Fresh Sourdough Loaves", description: "Unsold artisan sourdough from today's bake.", category: "Bakery", quantity: 20, unit: "loaves", servings: 40, expiryDate: inDays(2), pickupLocation: "5 Baker Lane", pickupWindow: "7am–11am", city: "Nakuru", latitude: -0.3031, longitude: 36.0800 },
        { donor: donors[2], title: "Pastry Assortment", description: "Croissants, danishes, and muffins, day-old.", category: "Bakery", quantity: 45, unit: "pieces", servings: 45, expiryDate: inDays(1), pickupLocation: "5 Baker Lane", pickupWindow: "7am–10am", city: "Nakuru", latitude: -0.3031, longitude: 36.0800 },
        { donor: donors[0], title: "Cooked Rice & Stew", description: "Large pot of rice and beef stew, fully cooked.", category: "Prepared", quantity: 35, unit: "servings", servings: 35, expiryDate: inDays(1), pickupLocation: "12 Riverside Ave", pickupWindow: "12pm–4pm", city: "Nairobi", latitude: -1.2921, longitude: 36.8219 },
        { donor: donors[1], title: "Fruit Boxes", description: "Bruised-but-fresh bananas and mangoes.", category: "Produce", quantity: 50, unit: "kg", servings: 100, expiryDate: inDays(4), pickupLocation: "88 Marina Blvd", pickupWindow: "9am–5pm", city: "Mombasa", latitude: -4.0435, longitude: 39.6682 },
    ];

    for (const f of foodData) {
        foods.push(await prisma.food.create({
            data: {
                donorId: f.donor.id,
                title: f.title,
                description: f.description,
                category: f.category,
                quantity: f.quantity,
                unit: f.unit,
                servings: f.servings,
                expiryDate: f.expiryDate,
                pickupLocation: f.pickupLocation,
                pickupWindow: f.pickupWindow,
                city: f.city,
                latitude: f.latitude,
                longitude: f.longitude,
            },
        }));
    }

    // One listing already claimed (for donor history variety)
    const claimed = foods[5];
    await prisma.food.update({ where: { id: claimed.id }, data: { status: "CLAIMED" } });

    // ── Donations ──────────────────────────────────────────────────────────
    // Completed donation (full lifecycle)
    const done = await prisma.donation.create({
        data: {
            foodId: foods[0].id,
            donorId: foods[0].donorId,
            ngoId: ngos[0].id,
            status: "COMPLETED",
            approvedAt: inDays(-3),
            pickupScheduledAt: inDays(-2),
            collectedAt: inDays(-2),
            deliveredAt: inDays(-1),
            completedAt: inDays(-1),
        },
    });

    // Pending request (awaiting donor approval)
    const pending = await prisma.donation.create({
        data: {
            foodId: foods[1].id,
            donorId: foods[1].donorId,
            ngoId: ngos[1].id,
            status: "PENDING",
        },
    });

    // Approved, pickup scheduled
    const scheduled = await prisma.donation.create({
        data: {
            foodId: foods[3].id,
            donorId: foods[3].donorId,
            ngoId: ngos[2].id,
            status: "PICKUP_SCHEDULED",
            approvedAt: inDays(-1),
            pickupScheduledAt: inDays(-1),
        },
    });

    // Claimed food with PENDING donation
    await prisma.donation.create({
        data: {
            foodId: foods[5].id,
            donorId: foods[5].donorId,
            ngoId: ngos[0].id,
            status: "PENDING",
        },
    });

    // ── Notifications ──────────────────────────────────────────────────────
    await prisma.notification.createMany({
        data: [
            { userId: ngos[0].id, title: "Donation completed!", message: "Your pickup for 'Vegetable Soup Batch' was completed.", type: "SUCCESS", isRead: true },
            { userId: donors[0].id, title: "Food collected", message: "The NGO has collected 'Vegetable Soup Batch'.", type: "SUCCESS", isRead: true },
            { userId: donors[1].id, title: "Your donation was claimed!", message: "\"Mixed Salad Platters\" has been claimed and is awaiting your approval.", type: "ACTION" },
            { userId: ngos[1].id, title: "Request received", message: "Your claim for 'Mixed Salad Platters' is pending donor approval.", type: "INFO" },
            { userId: donors[1].id, title: "Pickup scheduled", message: "You scheduled a pickup for 'Surplus Milk Cartons'.", type: "INFO" },
            { userId: ngos[2].id, title: "Pickup scheduled", message: "The donor scheduled pickup for 'Surplus Milk Cartons'.", type: "INFO" },
        ],
    });

    // ── Version 2.0 seed data ──────────────────────────────────────────────
    // Expiry predictions (deterministic rule result; the live system calls
    // expiryPredictionService in Phase B). Uses the same logic shape as the
    // rule engine so predictions are consistent for demo data.
    const ruleScore = (food) => {
        const nowMs = Date.now();
        const expiryMs = food.expiryDate.getTime();
        const total = expiryMs - nowMs;
        const fraction = total <= 0 ? 1 : Math.min(1, Math.max(0, 1 - total / (48 * 60 * 60 * 1000)));
        return { fraction, remainingDays: total / (24 * 60 * 60 * 1000) };
    };

    for (const f of foods) {
        const s = ruleScore(f);
        let urgency = "LOW";
        let risk = Math.round(s.fraction * 100);
        if (s.remainingDays <= 1) { urgency = "CRITICAL"; risk = Math.max(risk, 85); }
        else if (s.remainingDays <= 2) { urgency = "HIGH"; risk = Math.max(risk, 65); }
        else if (s.remainingDays <= 4) { urgency = "MEDIUM"; risk = Math.max(risk, 40); }
        await prisma.expiryPrediction.upsert({
            where: { foodId: f.id },
            update: {},
            create: {
                foodId: f.id,
                featuresHash: `seed-${f.id}`,
                urgency,
                riskScore: Math.min(100, risk),
                recommendation: urgency === "CRITICAL" || urgency === "HIGH"
                    ? "Donate immediately — remaining shelf life is short."
                    : "Donate within the recommended window.",
                explanation: { factors: ["short remaining shelf life", "food category", "storage conditions"], basis: "rule-based" },
                model: "rules",
            },
        });
    }

    // Inventory items + a transaction history example (100 kg → 70 kg after donation)
    // Use a deterministic lookup instead: find or create per donor+name
    const findOrCreateInv = async ({ donorId, name, category, quantity, unit, expiryDate, preparationDate, storageCondition, location }) => {
        const existing = await prisma.inventoryItem.findFirst({ where: { donorId, name } });
        if (existing) return existing;
        return prisma.inventoryItem.create({
            data: { donorId, name, category, quantity, unit, expiryDate, preparationDate, storageCondition, location },
        });
    };

    const invRice = await findOrCreateInv({
        donorId: donors[0].id, name: "Cooked Rice", category: "Prepared", quantity: 100, unit: "kg",
        expiryDate: inDays(1), preparationDate: new Date(), storageCondition: "REFRIGERATED", location: "Nairobi",
    });
    const invVeg = await findOrCreateInv({
        donorId: donors[0].id, name: "Fresh Vegetables", category: "Produce", quantity: 40, unit: "kg",
        expiryDate: inDays(3), preparationDate: new Date(), storageCondition: "ROOM_TEMP", location: "Nairobi",
    });
    const invCanned = await findOrCreateInv({
        donorId: donors[1].id, name: "Canned Beans", category: "Pantry", quantity: 200, unit: "cans",
        expiryDate: inDays(90), preparationDate: null, storageCondition: "ROOM_TEMP", location: "Mombasa",
    });

    // History: Rice donated 30 kg → remaining 70 kg (matching the acceptance workflow)
    const invTxExists = await prisma.inventoryTransaction.findFirst({ where: { itemId: invRice.id, type: "DONATE" } });
    if (!invTxExists) {
        const foodListing = await prisma.food.create({
            data: {
                donorId: donors[0].id,
                title: "Cooked Rice (from inventory)",
                description: "Surplus cooked rice donated from inventory.",
                category: "Prepared",
                quantity: 30,
                unit: "kg",
                servings: 30,
                expiryDate: invRice.expiryDate,
                pickupLocation: donors[0].address || "12 Riverside Ave",
                pickupWindow: "10am–2pm",
                city: "Nairobi",
                latitude: -1.2921,
                longitude: 36.8219,
                preparationDate: invRice.preparationDate,
                storageCondition: "REFRIGERATED",
            },
        });
        await prisma.$transaction([
            prisma.inventoryItem.update({
                where: { id: invRice.id },
                data: { quantity: 70, status: "PARTIAL" },
            }),
            prisma.inventoryTransaction.create({
                data: {
                    itemId: invRice.id,
                    type: "DONATE",
                    quantityChange: -30,
                    quantityBefore: 100,
                    quantityAfter: 70,
                    note: "Seeded donation of 30 kg",
                    foodId: foodListing.id,
                },
            }),
        ]);
    }

    // Scheduled donation (future pickup) for the milk donation
    const scheduleExists = await prisma.scheduledDonation.findFirst({ where: { donorId: donors[1].id } });
    if (!scheduleExists) {
        await prisma.scheduledDonation.create({
            data: {
                donorId: donors[1].id,
                foodId: foods[3].id,
                donationId: scheduled.id,
                ngoId: ngos[2].id,
                scheduledFor: inDays(1),
                status: "SCHEDULED",
                notes: "Seeded scheduled pickup",
            },
        });
    }

    // QR code for the scheduled (pickup-scheduled) donation
    const qrExists = await prisma.donationCode.findFirst({ where: { donationId: scheduled.id } });
    if (!qrExists) {
        const { randomBytes } = require("crypto");
        await prisma.donationCode.create({
            data: {
                donationId: scheduled.id,
                code: "FRD-" + randomBytes(16).toString("hex"),
                expiresAt: inDays(7),
                createdBy: donors[1].id,
            },
        });
    }

    // Platform events (search + language usage samples)
    const eventCount = await prisma.platformEvent.count();
    if (eventCount === 0) {
        await prisma.platformEvent.createMany({
            data: [
                { type: "SEARCH", userId: ngos[0].id, metadata: { query: "rice", filters: { category: "Prepared" }, results: 3 } },
                { type: "SEARCH", userId: ngos[1].id, metadata: { query: "milk", filters: {}, results: 1 } },
                { type: "LANGUAGE_CHANGE", userId: donors[0].id, metadata: { lang: "hi" } },
                { type: "LANGUAGE_CHANGE", userId: donors[0].id, metadata: { lang: "en" } },
            ],
        });
    }

    console.log("✔ Seed complete:");
    console.log(`  Admin:  ${admin.email} / ${PASSWORD}`);
    console.log(`  Donors: ${donors.map((d) => d.email).join(", ")}`);
    console.log(`  NGOs:   ${ngos.map((n) => n.email).join(", ")}`);
    console.log(`  Foods:  ${foods.length} listings, ${claimed.title} marked CLAIMED`);
    console.log(`  Donations: completed=${done.id} pending=${pending.id} scheduled=${scheduled.id}`);
    console.log(`  V2: predictions=${foods.length}, inventory items created, schedule + QR seeded`);
    console.log(`  Password for all seeded users: ${PASSWORD}`);
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
