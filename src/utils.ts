export const formatMin = (min: number) => {
	if (min < 10) return `0${min}`;
	return min;
};

export const POST_Req = (path: string, body: { [key: string]: any }) => {
	return fetch(path, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(body)
	});
};
