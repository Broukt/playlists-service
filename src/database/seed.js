require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function seed() {
  try {
    console.log("🔄 Starting database seeding...");

    const videosPath = path.resolve(__dirname, "../../mock/videos.json");
    const videosData = JSON.parse(fs.readFileSync(videosPath, "utf-8"));

    await prisma.video.deleteMany();

    console.log(`🛠 Seeding ${videosData.length} videos...`);
    for (const video of videosData) {
      await prisma.video.create({ data: video });
    }

    console.log("✅ Database seeding completed successfully.");
  } catch (error) {
    console.error("❌ Error during seeding:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    console.log("🔌 Prisma Client disconnected");
    process.exit(0);
  });
