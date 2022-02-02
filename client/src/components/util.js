import { Buffer } from 'buffer';

export function toBase64(data) {
	let buff = new Buffer(data);

	return buff.toString("base64");
}

export function fromBase64(data) {
	let buff = new Buffer(data, "base64");

	return buff.toString();
}
