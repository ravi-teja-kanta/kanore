const fs = require("fs");
const http = require("http");

let index = {};

function addToIndex(probeId) {
	index[probeId] = true;
}

http.createServer((req, res) => {
	if (req.method === "GET" && req.url === "/ping") {
		res.write("pong");
		res.end()
	}
	if (req.method === "PUT" && req.url.includes("/probe/")) {
		const params = req.url.split("/");
		const probeId = params[2];
		const eventId = params[4];
		const pagePath = probeId;
		const writeStream = fs.createWriteStream(`${pagePath}.kn`);
		const chunks = [];
		console.log(probeId, eventId);
		addToIndex(probeId);
		req.on("data", (chunk) => chunks.push(chunk));
		req.on("close", () => {
			const bufferString = JSON.stringify(Buffer.concat(chunks).toString());
			const payload = JSON.parse(JSON.parse(bufferString)); // Not a mistake! source: https://stackoverflow.com/questions/42494823/json-parse-returns-string-instead-of-object
			payload["eventTransmissionTime"] = Date.now();
			writeStream.write(`${JSON.stringify(payload)}`);
			writeStream.end();
		})
		res.end()
	}
	if (req.method === "GET" && req.url.includes("/probe")) {
		const params = req.url.split("/");
		const probeId = params[2];
		const pagePath = probeId;

		if(!index[probeId]) res.end("Not found"); // avoids reading files which dont exist.

		const readStream = fs.createReadStream(`${pagePath}.kn`, {});
		const chunks = [];
		readStream.on("data", (chunk) => chunks.push(chunk));
		readStream.on("close", () => {
			res.end(JSON.stringify(JSON.parse(Buffer.concat(chunks).toString())));
		})

	}
	// res.end();
})
	.listen(8787, () => {
		console.log("kanore is running on 8787 !")
	});