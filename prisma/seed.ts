import { PrismaClient } from "@prisma/client";
import { DEFAULT_CATEGORIES } from "../src/lib/default-categories";

const prisma = new PrismaClient();

async function main() {
  for (const category of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { id: category.id },
      update: {
        name: category.name,
        type: category.type,
        isDefault: true,
        userId: null,
      },
      create: {
        id: category.id,
        name: category.name,
        type: category.type,
        isDefault: true,
        userId: null,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
