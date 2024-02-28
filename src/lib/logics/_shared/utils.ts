export const writeReq = (path: string, body: { [key: string]: any }, method = 'POST') => {
	return fetch(path, {
		method,
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(body)
	});
};
