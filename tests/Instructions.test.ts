import { afterEach, beforeEach, describe, expect, test } from "@jest/globals";

import { AddressingMode, Instruction } from "../src/Instruction";
import { Memory } from "../src/Memory";
import { Processor, ProcessorFlags } from "../src/Processor";
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

	test("JSR", async () => {
		/*
				instruction: JSR
			Jump to an address specified in the next two bytes
			and push the return address onto the stack. */

		memory.loadValues({
			0xfffc: Instruction.operations.JSR.absolute,
			0xfffd: 0x01,
			0xfffe: 0x00,
		});

		await processor.execute(6);
		expect(processor.programCounter).toBe(0x0001);
		expect(processor.stackPointer).toBe(0x01fd);
		checkFlags(processor.flags, previousFlags, {});
	});

	test("JMP_ABS", async () => {
		/*
				instruction: JMP_ABS
			Jump to an address in the next two bytes. */

		memory.loadValues({
			0xfffc: Instruction.operations.JMP.absolute,
			0xfffd: 0x01,
			0xfffe: 0x00,
		});

		await processor.execute(3);
		expect(processor.programCounter).toBe(0x0001);
		checkFlags(processor.flags, previousFlags, {});
	});

	test("JMP_IND", async () => {
		/*
				instruction: JMP_IND
			Jump to an address specified in memory at the
			address in the next two bytes. */

		memory.loadValues({
			0xfffc: Instruction.operations.JMP.indirect,
			0xfffd: 0x34,
			0xfffe: 0x12,
			0x1234: 0x78,
			0x1235: 0x56,
		});

		await processor.execute(5);
		expect(processor.programCounter).toBe(0x5678);
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

	test("NOP", async () => {
		/*
				instruction: NOP
			Do nothing for one cycle. */

		memory.loadValues({
			0xfffc: Instruction.operations.NOP.implied,
		});

		const previousFlags = Object.assign({}, processor.flags);
		await processor.execute(1);
		checkFlags(processor.flags, previousFlags, {});
	});

	test("RTS", async () => {
		/*
				instruction: RTS
			Return from a subroutine to the address on the stack. */

		processor._stackPointer = 0xfd;
		processor.programCounter = 0x8000;
		memory.loadValues({
			0x01fe: 0x33,
			0x01ff: 0x12,
			0x8000: Instruction.operations.RTS.implied!,
		});

		await processor.execute(6);
		expect(processor.programCounter).toBe(0x1234);
		expect(processor.stackPointer).toBe(0x01ff);
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
