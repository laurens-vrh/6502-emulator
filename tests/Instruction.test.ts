import { afterEach, beforeEach, describe, expect, test } from "@jest/globals";

import { Instruction } from "../src/Instruction";
import { Memory } from "../src/Memory";
import { Processor } from "../src/Processor";
import { AddressingMode, ProcessorFlags } from "../src/types";
import { checkFlags } from "./checkFlags";
import { testLoadOperations } from "./testLoadOperations";
import { testStoreOperations } from "./testStoreOperations";

var memory: Memory;
var processor: Processor;
var previousFlags: ProcessorFlags;

describe("Instructions", () => {
	beforeEach(() => {
		memory = new Memory();
		processor = new Processor(memory);
		previousFlags = Object.assign({}, processor.flags);
	});

	afterEach(() => {
		expect(processor.cycles).toBe(0);
	});

	test("instruction: JMP_ABS", async () => {
		// instruction: JMP_ABS
		// Jump to an address in the next two bytes.
		memory.data[0xfffc] = Instruction.operations.JMP.absolute!;
		memory.data[0xfffd] = 0x01;
		memory.data[0xfffe] = 0x00;

		await processor.execute(3);
		expect(processor.programCounter).toBe(0x0001);
		checkFlags(processor.flags, previousFlags, {});
	});

	test("instruction: JSR", async () => {
		// instruction: JSR
		// Jump to an address specified in the next two bytes
		// and push the return address onto the stack.
		memory.data[0xfffc] = Instruction.operations.JSR.absolute!;
		memory.data[0xfffd] = 0x01;
		memory.data[0xfffe] = 0x00;

		await processor.execute(6);
		expect(processor.programCounter).toBe(0x0001);
		checkFlags(processor.flags, previousFlags, {});
	});

	testLoadOperations({
		A: [
			AddressingMode.immediate,
			AddressingMode.zeroPage,
			AddressingMode.zeroPageX,
			AddressingMode.zeroPageY,
			AddressingMode.absolute,
			AddressingMode.absoluteX,
			AddressingMode.absoluteY,
			AddressingMode.indirectX,
			AddressingMode.indirectY,
		],
		X: [
			AddressingMode.immediate,
			AddressingMode.zeroPage,
			AddressingMode.zeroPageY,
			AddressingMode.absolute,
			AddressingMode.absoluteY,
		],
		Y: [
			AddressingMode.immediate,
			AddressingMode.zeroPage,
			AddressingMode.zeroPageX,
			AddressingMode.absolute,
			AddressingMode.absoluteX,
		],
	});

	test("instruction: NOP", async () => {
		// instruction: NOP
		// Do nothing for one cycle.
		memory.data[0xfffc] = Instruction.operations.NOP.implied!;

		const previousFlags = Object.assign({}, processor.flags);
		await processor.execute(1);
		checkFlags(processor.flags, previousFlags, {});
	});

	testStoreOperations({
		A: [
			AddressingMode.zeroPage,
			AddressingMode.zeroPageX,
			AddressingMode.absolute,
			AddressingMode.absoluteX,
			AddressingMode.absoluteY,
			AddressingMode.indirectX,
			AddressingMode.indirectY,
		],
		X: [
			AddressingMode.zeroPage,
			AddressingMode.zeroPageY,
			AddressingMode.absolute,
		],
		Y: [
			AddressingMode.zeroPage,
			AddressingMode.zeroPageX,
			AddressingMode.absolute,
		],
	});
});
