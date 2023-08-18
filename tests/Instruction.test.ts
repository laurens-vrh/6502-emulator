import { afterEach, beforeEach, describe, expect, test } from "@jest/globals";

import { Instruction } from "../src/Instruction";
import { Memory } from "../src/Memory";
import { Processor } from "../src/Processor";
import { AddressingMode, ProcessorFlags } from "../src/types";
import { checkFlags } from "./Processor.test";

var memory: Memory;
var processor: Processor;
var previousFlags: ProcessorFlags;

describe("Instruction", () => {
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

	testLoadOperation("A", [
		AddressingMode.immediate,
		AddressingMode.zeroPage,
		AddressingMode.zeroPageX,
		AddressingMode.zeroPageY,
		AddressingMode.absolute,
		AddressingMode.absoluteX,
		AddressingMode.absoluteY,
		AddressingMode.indirectX,
		AddressingMode.indirectY,
	]);
	testLoadOperation("X", [
		AddressingMode.immediate,
		AddressingMode.zeroPage,
		AddressingMode.zeroPageY,
		AddressingMode.absolute,
		AddressingMode.absoluteY,
	]);
	testLoadOperation("Y", [
		AddressingMode.immediate,
		AddressingMode.zeroPage,
		AddressingMode.zeroPageX,
		AddressingMode.absolute,
		AddressingMode.absoluteX,
	]);

	test("instruction: NOP", async () => {
		// instruction: NOP
		// Do nothing for one cycle.
		memory.data[0xfffc] = Instruction.operations.NOP.implied!;

		const previousFlags = Object.assign({}, processor.flags);
		await processor.execute(1);
		checkFlags(processor.flags, previousFlags, {});
	});
});

function testLoadOperation(
	register: "A" | "X" | "Y",
	addressingModes: AddressingMode[]
) {
	const operationName = "LD" + register;
	const registerName =
		register === "A"
			? ("accumulator" as const)
			: (`register${register}` as const);

	if (addressingModes.includes(AddressingMode.immediate))
		test(`instruction: ${operationName}_IM`, async () => {
			// instruction: LDA_IM
			// Load a value specified in the next byte into the accumulator.
			memory.data[0xfffc] = Instruction.operations[operationName].immediate!;
			memory.data[0xfffd] = 0xff;

			await processor.execute(2);
			expect(processor[registerName]).toBe(0xff);
			checkFlags(processor.flags, previousFlags, {
				zeroFlag: false,
				negativeFlag: true,
			});
		});

	if (addressingModes.includes(AddressingMode.zeroPage))
		test(`instruction: ${operationName}_ZP`, async () => {
			// instruction: LDA_ZP
			// Load a value at an address specified in the next byte
			// in zero page memory into the accumulator.
			processor[registerName] = 0xff;
			memory.data[0xfffc] = Instruction.operations[operationName].zeroPage!;
			memory.data[0xfffd] = 0x42;
			memory.data[0x0042] = 0x00;

			await processor.execute(3);
			expect(processor[registerName]).toBe(0x00);
			checkFlags(processor.flags, previousFlags, {
				zeroFlag: true,
				negativeFlag: false,
			});
		});

	if (
		addressingModes.includes(AddressingMode.zeroPageX) ||
		addressingModes.includes(AddressingMode.zeroPageY)
	) {
		test(`instruction: ${operationName}_ZP${
			register === "X" ? "Y" : "X"
		}`, async () => {
			// instruction: LDA_ZPX
			// Load a value at an address in zero page memory
			// specified in the next byte, plus the value in register X,
			// into the accumulator.
			processor[`register${register === "X" ? "Y" : "X"}`] = 0x05;
			memory.data[0xfffc] =
				Instruction.operations[operationName][
					`zeroPage${register === "X" ? "Y" : "X"}`
				]!;
			memory.data[0xfffd] = 0x42;
			memory.data[0x0047] = 0x0f;

			await processor.execute(4);
			expect(processor[registerName]).toBe(0x0f);
			checkFlags(processor.flags, previousFlags, {
				zeroFlag: false,
				negativeFlag: false,
			});
		});

		test(`instruction: ${operationName}_ZP${
			register === "X" ? "Y" : "X"
		} 2`, async () => {
			// instruction: LDA_ZPX 2
			// Load a value at an address in zero page memory
			// specified in the next byte, plus the value in register X,
			// into the accumulator and ensure that the address
			// wraps properly.
			processor[`register${register === "X" ? "Y" : "X"}`] = 0xff;
			memory.data[0xfffc] =
				Instruction.operations[operationName][
					`zeroPage${register === "X" ? "Y" : "X"}`
				]!;
			memory.data[0xfffd] = 0x80;
			memory.data[0x007f] = 0xff;

			await processor.execute(4);
			expect(processor[registerName]).toBe(0xff);
			checkFlags(processor.flags, previousFlags, {
				zeroFlag: false,
				negativeFlag: true,
			});
		});
	}

	if (addressingModes.includes(AddressingMode.absolute))
		test(`instruction: ${operationName}_ABS`, async () => {
			// instruction: LDA_ABS
			// Load a value at an address specified in the next two bytes
			// into the accumulator.
			memory.data[0xfffc] = Instruction.operations[operationName].absolute!;
			memory.data[0xfffd] = 0x34;
			memory.data[0xfffe] = 0x12;
			memory.data[0x1234] = 0x55;

			await processor.execute(4);
			expect(processor[registerName]).toBe(0x55);
			checkFlags(processor.flags, previousFlags, {
				zeroFlag: false,
				negativeFlag: false,
			});
		});

	if (
		addressingModes.includes(AddressingMode.absoluteX) ||
		addressingModes.includes(AddressingMode.absoluteY)
	) {
		test(`instruction: ${operationName}_ABS${
			register === "X" ? "Y" : "X"
		}`, async () => {
			// instruction: LDA_ABSX
			// Load a value at an address in memory specified
			// in the next two bytes, plus the value in register X,
			// into the accumulator.
			processor[`register${register === "X" ? "Y" : "X"}`] = 0x05;
			memory.data[0xfffc] =
				Instruction.operations[operationName][
					`absolute${register === "X" ? "Y" : "X"}`
				]!;
			memory.data[0xfffd] = 0x34;
			memory.data[0xfffe] = 0x12;
			memory.data[0x1239] = 0x55;

			await processor.execute(4);
			expect(processor[registerName]).toBe(0x55);
			checkFlags(processor.flags, previousFlags, {
				zeroFlag: false,
				negativeFlag: false,
			});
		});
		test(`instruction: ${operationName}_ABS${
			register === "X" ? "Y" : "X"
		} 2`, async () => {
			// instruction: LDA_ABSX 2
			// Load a value at an address in memory specified
			// in the next two bytes, plus the value in register X,
			// into the accumulator  and ensure that a
			// page cross takes an extra cycle.
			processor[`register${register === "X" ? "Y" : "X"}`] = 0xff;
			memory.data[0xfffc] =
				Instruction.operations[operationName][
					`absolute${register === "X" ? "Y" : "X"}`
				]!;
			memory.data[0xfffd] = 0x34;
			memory.data[0xfffe] = 0x12;
			memory.data[0x1333] = 0x55;

			await processor.execute(5);
			expect(processor[registerName]).toBe(0x55);
			checkFlags(processor.flags, previousFlags, {
				zeroFlag: false,
				negativeFlag: false,
			});
		});
	}

	if (addressingModes.includes(AddressingMode.indirectX))
		test(`instruction: ${operationName}_INDX`, async () => {
			// instruction: LDA_INDX
			// Load the value at an address at an other address in zero page memory
			// specified in the next byte, plus the value in register X,
			// into the accumulator.
			processor.registerX = 0x04;
			memory.data[0xfffc] = Instruction.operations[operationName].indirectX!;
			memory.data[0xfffd] = 0x02;
			memory.data[0x0006] = 0x00;
			memory.data[0x0007] = 0x80;
			memory.data[0x8000] = 0x55;

			await processor.execute(6);
			expect(processor[registerName]).toBe(0x55);
			checkFlags(processor.flags, previousFlags, {
				zeroFlag: false,
				negativeFlag: false,
			});
		});

	if (addressingModes.includes(AddressingMode.indirectY)) {
		test(`instruction: ${operationName}_INDY`, async () => {
			// instruction: LDA_INDY
			// Load the value at an address, plus the value in register y,
			// at an other address in zero page memory specified
			// in the next byte into the accumulator.
			processor.registerY = 0x04;
			memory.data[0xfffc] = Instruction.operations[operationName].indirectY!;
			memory.data[0xfffd] = 0x02;
			memory.data[0x0002] = 0x00;
			memory.data[0x0003] = 0x80;
			memory.data[0x8004] = 0x55;

			await processor.execute(5);
			expect(processor[registerName]).toBe(0x55);
			checkFlags(processor.flags, previousFlags, {
				zeroFlag: false,
				negativeFlag: false,
			});
		});

		test(`instruction: ${operationName}_INDY 2`, async () => {
			// instruction: LDA_INDY 2
			// Load the value at an address, plus the value in register y,
			// at an other address in zero page memory specified
			// in the next byte into the accumulator and ensure that a
			// page cross takes an extra cycle.
			processor.registerY = 0xff;
			memory.data[0xfffc] = Instruction.operations[operationName].indirectY!;
			memory.data[0xfffd] = 0x02;
			memory.data[0x0002] = 0x08;
			memory.data[0x0003] = 0x80;
			memory.data[0x8107] = 0x55;

			await processor.execute(6);
			expect(processor[registerName]).toBe(0x55);
			checkFlags(processor.flags, previousFlags, {
				zeroFlag: false,
				negativeFlag: false,
			});
		});
	}
}
