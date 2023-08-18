export const MEMORY_SIZE = 8192 * 8;

export class Memory {
	public data = new Uint8Array(MEMORY_SIZE);

	constructor() {}
}
