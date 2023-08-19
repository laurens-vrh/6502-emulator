import { afterEach, beforeEach, describe, expect, test } from "@jest/globals";

import { Instruction } from "../src/Instruction";
import { Memory } from "../src/Memory";
import { Processor } from "../src/Processor";
// import { ProcessorFlags } from "../src/types";

var memory: Memory;
var processor: Processor;
// var previousFlags: ProcessorFlags;

describe("Programs", () => {
	beforeEach(() => {
		memory = new Memory();
		processor = new Processor(memory);
		// previousFlags = Object.assign({}, processor.flags);
	});

	afterEach(() => {
		expect(processor.cycles).toBe(0);
	});

	describe("Jumps and calls", () => {
		test("JSR and RTS", async () => {
			/*      program: JSR and RTS
                Jump to an address specified in the next two bytes
                and push the return address onto the stack. Return
                from that location back to after the jump instruction.
                Then load 0x55 into the accumulator. */

			processor.programCounter = 0xff00;
			memory.data[0xff00] = Instruction.operations.JSR.absolute!;
			memory.data[0xff01] = 0x00;
			memory.data[0xff02] = 0x80;
			memory.data[0x8000] = Instruction.operations.RTS.implied!;
			memory.data[0xff03] = Instruction.operations.LDA.immediate!;
			memory.data[0xff04] = 0x55;

			await processor.execute(14);
			expect(processor.accumulator).toBe(0x55);
		});

		test("nested subroutines", async () => {
			/*      program: nested subroutines
                Enter three subroutines and return out of them correctly. */

			processor.programCounter = 0xff00;
			memory.data[0xff00] = Instruction.operations.JSR.absolute!;
			memory.data[0xff01] = 0x23;
			memory.data[0xff02] = 0x91;
			memory.data[0xff03] = Instruction.operations.LDX.immediate!;
			memory.data[0xff04] = 0x44;
			memory.data[0x9123] = Instruction.operations.JSR.absolute!;
			memory.data[0x9124] = 0x23;
			memory.data[0x9125] = 0x81;
			memory.data[0x9126] = Instruction.operations.RTS.implied!;
			memory.data[0x8123] = Instruction.operations.JSR.absolute!;
			memory.data[0x8124] = 0x00;
			memory.data[0x8125] = 0x70;
			memory.data[0x8126] = Instruction.operations.RTS.implied!;
			memory.data[0x7000] = Instruction.operations.LDA.immediate!;
			memory.data[0x7001] = 0x55;
			memory.data[0x7002] = Instruction.operations.RTS.implied!;

			await processor.execute(40);
			expect(processor.accumulator).toBe(0x55);
			expect(processor.registerX).toBe(0x44);
		});
	});
});
