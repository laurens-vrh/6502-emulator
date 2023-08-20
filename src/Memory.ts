export const MEMORY_SIZE = 8192 * 8;

export class Memory {
	public data = new Uint8Array(MEMORY_SIZE);

	constructor() {}

	loadValue(address: number, value?: number) {
		this.data[address] = value ?? 0;
	}

	loadValues(values: Record<number, number | undefined>) {
		Object.entries(values).forEach(([address, value]) => {
			this.data[parseInt(address)] = value ?? 0;
		});
	}
}
