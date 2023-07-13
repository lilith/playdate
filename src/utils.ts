export const formatMin = (min: number) => {
	if (min < 10) return `0${min}`;
	return min;
};

export const writeReq = (path: string, body: { [key: string]: any }, method = 'POST') => {
	console.log(path, body, method);
	return fetch(path, {
		method,
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(body)
	});
};
