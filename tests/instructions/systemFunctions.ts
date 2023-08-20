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

export function testSystemFunctions() {
	describe("System Functions", () => {
		test("NOP", async () => {
			/*
					instruction: NOP
				Do nothing for one cycle. */

			memory.loadValue(0xfffc, Instruction.operations.NOP.implied);

			await processor.execute(1);
			checkFlags(processor.flags, previousFlags, {});
		});
	});
}
