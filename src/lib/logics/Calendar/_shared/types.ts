export type CircleInfo = {
	connectionId: number;
	id: number;
	name: string;
	parents: {
		firstName: string;
		lastName: string | null;
		phone: string;
		phonePermissions: {
			allowReminders: boolean;
		};
	}[];
}[];
