export const formatMin = (min: number) => {
	if (min < 10) return `0${min}`;
	return min;
};
