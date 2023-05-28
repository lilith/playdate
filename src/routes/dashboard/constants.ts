export type Household = { [key: string]: {
    name: string;
    kids: string[]; // kid names
    parents: { name: string; phone: string }[];
} };