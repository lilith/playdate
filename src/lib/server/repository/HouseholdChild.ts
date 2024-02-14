import prisma from "$lib/prisma";
import type { Prisma } from "@prisma/client";

export default class HouseholdChildRepository {
    static async create(data: Prisma.XOR<Prisma.HouseholdChildCreateInput, Prisma.HouseholdChildUncheckedCreateInput>) {
        return await prisma.householdChild.create({
            data
        });
    }
}