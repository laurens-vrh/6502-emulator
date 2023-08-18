export function formatHex(num: number, length: number = 4) {
	return "0x" + num.toString(16).padStart(length, "0");
}
