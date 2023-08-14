import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

if (import.meta.env.PROD) {
	prisma = new PrismaClient();
} else {
	if (!global.prisma) {
		global.prisma = new PrismaClient();
	}
	prisma = global.prisma;
}

export default prisma;
