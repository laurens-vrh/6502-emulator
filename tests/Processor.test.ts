import { beforeEach, describe, expect, test } from "@jest/globals";

import { Instruction } from "../src/Instruction";
import { Memory } from "../src/Memory";
import { Processor } from "../src/Processor";
import { checkFlags } from "./checkFlags";
import { afterEach } from "node:test";

describe("Processor", () => {
	var memory: Memory;
	var processor: Processor;

	beforeEach(() => {
		memory = new Memory();
		processor = new Processor(memory);
	});

	afterEach(() => {
		expect(processor.cycle).toBe(0);
	});

	test("method: cycle()", async () => {
		// method: cycle()
		// Decrease the cycle counter.
		processor.cycles = 1;

		await processor.cycle();
	});

	test("method: updateFlags()", () => {
		// method: updateFlags()
		// Update the zero and negative flags according to
		// the value in the accumulator

		processor.lastInstruction = Instruction.operations.LDA.immediate!;

		var previousFlags = Object.assign({}, processor.flags);
		processor.accumulator = 0x12;
		processor.updateFlags();
		checkFlags(processor.flags, previousFlags, {
			zeroFlag: false,
			negativeFlag: false,
		});

		previousFlags = Object.assign({}, processor.flags);
		processor.accumulator = 0xff;
		processor.updateFlags();
		checkFlags(processor.flags, previousFlags, {
			zeroFlag: false,
			negativeFlag: true,
		});

		previousFlags = Object.assign({}, processor.flags);
		processor.accumulator = 0x00;
		processor.updateFlags();
		checkFlags(processor.flags, previousFlags, {
			zeroFlag: true,
			negativeFlag: false,
		});
	});

	describe("Memory operations", () => {
		test("method: readByte()", async () => {
			// method: readByte()
			// Read a byte from memory and cycle.
			processor.cycles = 1;
			memory.data[0x1111] = 0xff;

			const value = await processor.readByte(0x1111);
			expect(value).toBe(0xff);
		});

		test("method: fetchByte()", async () => {
			// method: fetchByte()
			// Fetch the next program byte from memory, cycle
			// and increment the program counter.
			processor.cycles = 1;
			processor.programCounter = 0x0000;
			memory.data[0x0000] = 0xff;

			const value = await processor.fetchByte();
			expect(value).toBe(0xff);
			expect(processor.programCounter).toBe(0x0001);
		});

		test("method: writeByte()", async () => {
			// method: write()
			// Write a byte to memory and cycle.
			processor.cycles = 1;

			await processor.writeByte(0x1111, 0x55);
			expect(memory.data[0x1111]).toBe(0x55);
		});

		test("method: readWord()", async () => {
			// method: readWord()
			// Read a word from memory and cycle twice.
			processor.cycles = 2;
			memory.data[0x0000] = 0x34;
			memory.data[0x0001] = 0x12;

			const value = await processor.readWord(0x0000);
			expect(value).toBe(0x1234);
		});

		test("method: fetchWord()", async () => {
			// method: fetchWord()
			// Fetch the next program word from memory, cycle twice
			// and increment the program counter twice.
			processor.cycles = 2;
			processor.programCounter = 0x0000;
			memory.data[0x0000] = 0x34;
			memory.data[0x0001] = 0x12;

			const value = await processor.fetchWord();
			expect(value).toBe(0x1234);
			expect(processor.programCounter).toBe(0x0002);
		});
	});
});
