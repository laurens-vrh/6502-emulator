import { beforeEach, describe, test, expect } from "@jest/globals";

import { Memory } from "../src/Memory";

describe("Memory", () => {
	var memory: Memory;

	beforeEach(() => {
		memory = new Memory();
	});

	test("method: loadValues()", async () => {
		/*
				method: loadValues()
			Load values into memory based on an object and
			load zero for undefined. */

		memory.loadValues({
			0x1234: 0xaa,
			0x3456: 0xbb,
			0x5678: 0xcc,
			0x789a: 0xdd,
			0x9abc: undefined,
		});

		expect(memory.data[0x1234]).toBe(0xaa);
		expect(memory.data[0x3456]).toBe(0xbb);
		expect(memory.data[0x5678]).toBe(0xcc);
		expect(memory.data[0x789a]).toBe(0xdd);
		expect(memory.data[0x9abc]).toBe(0x00);
	});
});
