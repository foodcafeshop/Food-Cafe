import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
    const { seedData } = await import('./seed');
    try {
        await seedData();
        console.log("Seed script finished successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Seed script failed:", err);
        process.exit(1);
    }
}

run();
