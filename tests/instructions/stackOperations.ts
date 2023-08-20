import { afterEach, beforeEach, describe, expect, test } from "@jest/globals";

import { Instruction } from "../../src/Instruction";
import { Memory } from "../../src/Memory";
import { Processor, ProcessorFlags } from "../../src/Processor";
import { checkFlags } from "../checkFlags";

var memory: Memory;
var processor: Processor;
var previousFlags: ProcessorFlags;
beforeEach(() => {
	memory = new Memory();
	processor = new Processor(memory);
	previousFlags = Object.assign({}, processor.flags);
});
afterEach(() => expect(processor.cycles).toBe(0));

export function testStackOperations() {
	describe("Stack operations", () => {
		test("TSX", async () => {
			/*
					instruction: TSX
				Copies the current contents of the stack register
				into the X register and sets the zero and negative flags as
				appropriate. */

			processor._stackPointer = 0x44;
			memory.loadValue(0xfffc, Instruction.operations.TSX.implied);

			await processor.execute(2);
			expect(processor.registerX).toBe(0x44);
			checkFlags(processor.flags, previousFlags, {
				zeroFlag: false,
				negativeFlag: false,
			});
		});

		test("TXS", async () => {
			/*
					instruction: TXS
				Copies the current contents of the X register into
				the stack register. */

			processor.registerX = 0x44;
			memory.loadValue(0xfffc, Instruction.operations.TXS.implied);

			await processor.execute(2);
			expect(processor.stackPointer).toBe(0x0144);
		});

		test("PHA", async () => {
			/*
					instruction: PHA
				Pushes a copy of the accumulator onto the stack. */

			processor.accumulator = 0x44;
			memory.loadValue(0xfffc, Instruction.operations.PHA.implied);

			await processor.execute(3);
			expect(processor.stackPointer).toBe(0x01fe);
			expect(memory.data[0x01ff]).toBe(0x44);
		});

		test("PHP", async () => {
			/*
					instruction: PHP
				Pushes a copy of the status flags onto the stack. */

			memory.loadValue(0xfffc, Instruction.operations.PHP.implied);

			await processor.execute(3);
			expect(processor.stackPointer).toBe(0x01fe);
			expect(memory.data[0x01ff]).toBe(0b0000000);
		});

		test("PLA", async () => {
			/*
					instruction: PLA
				Pulls an 8 bit value from the stack and into the
				accumulator. The zero and negative flags are set as
				appropriate. */

			processor._stackPointer = 0xfe;
			memory.loadValues({
				0x01ff: 0x44,
				0xfffc: Instruction.operations.PLA.implied,
			});

			await processor.execute(4);
			expect(processor.stackPointer).toBe(0x01ff);
			expect(processor.accumulator).toBe(0x44);
		});

		test("PLP", async () => {
			/*
					instruction: PLP
				Pulls an 8 bit value from the stack and into the
				processor flags. The flags will take on new states
				as determined by the value pulled. */

			processor._stackPointer = 0xfe;
			memory.loadValues({
				0x01ff: 0b1000011,
				0xfffc: Instruction.operations.PLP.implied,
			});

			await processor.execute(4);
			checkFlags(processor.flags, previousFlags, {
				carryFlag: true,
				zeroFlag: true,
				interruptDisable: false,
				decimalMode: false,
				breakCommand: false,
				overflowFlag: false,
				negativeFlag: true,
			});
		});
	});
}
