import auto_adapter from '@sveltejs/adapter-auto'; // for serverless
import node_adapter from '@sveltejs/adapter-node'; // for node server generation

import { vitePreprocess } from '@sveltejs/kit/vite';

console.log('process.env.NODE_MODE_ADAPTER=', process.env.NODE_MODE_ADAPTER);
const use_node_adapter = !!process.env.NODE_MODE_ADAPTER;
/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: use_node_adapter ? node_adapter() : auto_adapter()
	},
	preprocess: [vitePreprocess()]
};

export default config;
