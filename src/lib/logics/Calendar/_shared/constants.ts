import { AvailabilityStatus } from '@prisma/client';

export const UNAVAILABLE: string[] = [AvailabilityStatus.UNSPECIFIED, AvailabilityStatus.BUSY];

export const EMOTICONS = {
	'🏠': 'house',
	'🚗': 'car',
	'👤': 'person',
	'👥': 'people',
	'🏫': 'school',
	'⭐️': 'star1',
	'🌟': 'star2',
	'🙏': 'star3'
};
