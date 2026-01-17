import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { v7 as uuidv7 } from 'uuid';

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  // Clear existing items to make it exactly 1000 new ones or just add?
  // Let's find or create categories first
  let fruitsCat = await prisma.category.findFirst({ where: { name: 'Fruits' } });
  if (!fruitsCat) {
    fruitsCat = await prisma.category.create({ data: { id: uuidv7(), name: 'Fruits' } });
  }

  let veggiesCat = await prisma.category.findFirst({ where: { name: 'Vegetables' } });
  if (!veggiesCat) {
    veggiesCat = await prisma.category.create({ data: { id: uuidv7(), name: 'Vegetables' } });
  }

  const fruitNames = ['Apple', 'Banana', 'Orange', 'Strawberry', 'Grapes', 'Watermelon', 'Blueberry', 'Peach', 'Pear', 'Cherry', 'Mango', 'Pineapple', 'Kiwi', 'Plum', 'Raspberry', 'Blackberry'];
  const vegetableNames = ['Carrot', 'Broccoli', 'Spinach', 'Tomato', 'Cucumber', 'Potato', 'Onion', 'Garlic', 'Bell Pepper', 'Lettuce', 'Cabbage', 'Cauliflower', 'Eggplant', 'Zucchini', 'Celery', 'Asparagus'];
  const adjectives = ['Fresh', 'Organic', 'Sweet', 'Crunchy', 'Ripe', 'Succulent', 'Large', 'Small', 'Green', 'Red', 'Seasonal'];

  console.log('Generating 1000 items...');

  const pantryItems = [];
  for (let i = 0; i < 1000; i++) {
    const isFruit = Math.random() > 0.5;
    const baseNames = isFruit ? fruitNames : vegetableNames;
    const catId = isFruit ? fruitsCat.id : veggiesCat.id;
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const baseName = baseNames[Math.floor(Math.random() * baseNames.length)];

    pantryItems.push({
      id: uuidv7(),
      name: `${adjective} ${baseName} ${i + 1}`,
      quantity: Math.floor(Math.random() * 20) + 1,
      categoryId: catId,
      expirationDate: new Date(new Date().setDate(new Date().getDate() + Math.round(Math.random() * 60) - 10)), // Some already expired, some far in future
    });
  }

  // Use chunks to avoid potential large payload issues with createMany if any
  const chunkSize = 100;
  for (let i = 0; i < pantryItems.length; i += chunkSize) {
    const chunk = pantryItems.slice(i, i + chunkSize);
    await prisma.pantryItem.createMany({ data: chunk });
    console.log(`Uploaded ${i + chunk.length} items...`);
  }

  console.log('Database seeded with 1000 items successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
