import { afterEach, beforeEach, describe, expect, test } from "@jest/globals";

import { Instruction } from "../src/Instruction";
import { Memory } from "../src/Memory";
import { Processor } from "../src/Processor";
import { AddressingMode } from "../src/types";

var memory: Memory;
var processor: Processor;

beforeEach(() => {
	memory = new Memory();
	processor = new Processor(memory);
});

afterEach(() => {
	expect(processor.cycles).toBe(0);
});

export function testStoreOperations(
	tests: Partial<Record<"A" | "X" | "Y", AddressingMode[]>>
) {
	describe("Store operations", () => {
		Object.entries(tests).forEach(([register, addressingModes]) => {
			const operationName = "ST" + register;
			const registerName = (
				register === "A" ? "accumulator" : `register${register}`
			) as "accumulator" | "registerX" | "registerY";

			if (addressingModes.includes(AddressingMode.zeroPage))
				test(`${operationName}_ZP`, async () => {
					// instruction: STA_IM
					// Store the value in the accumulator to an address in
					// zero page memory specified in the next byte.
					processor[registerName] = 0x55;
					memory.data[0xfffc] = Instruction.operations[operationName].zeroPage!;
					memory.data[0xfffd] = 0xff;

					await processor.execute(3);
					expect(memory.data[0x00ff]).toBe(0x55);
				});

			if (
				addressingModes.includes(AddressingMode.zeroPageX) ||
				addressingModes.includes(AddressingMode.zeroPageY)
			) {
				test(`${operationName}_ZP${register === "X" ? "Y" : "X"}`, async () => {
					// instruction: STA_ZPX
					// Store the value in the accumulator to an address in
					// zero page memory specified in the next byte, plus
					// the value in register X.
					processor[`register${register === "X" ? "Y" : "X"}`] = 0x04;
					processor[registerName] = 0x55;
					memory.data[0xfffc] =
						Instruction.operations[operationName][
							`zeroPage${register === "X" ? "Y" : "X"}`
						]!;
					memory.data[0xfffd] = 0x80;

					await processor.execute(4);
					expect(memory.data[0x0084]).toBe(0x55);
				});

				test(`${operationName}_ZP${
					register === "X" ? "Y" : "X"
				} 2`, async () => {
					// instruction: STA_ZPX 2
					// Store the value in the accumulator to an address in
					// zero page memory specified in the next byte, plus
					// the value in register X, and ensure that the address
					// wraps properly.
					processor[`register${register === "X" ? "Y" : "X"}`] = 0xff;
					processor[registerName] = 0x55;
					memory.data[0xfffc] =
						Instruction.operations[operationName][
							`zeroPage${register === "X" ? "Y" : "X"}`
						]!;
					memory.data[0xfffd] = 0x80;

					await processor.execute(4);
					expect(memory.data[0x007f]).toBe(0x55);
				});

				if (addressingModes.includes(AddressingMode.absolute))
					test(`${operationName}_ABS`, async () => {
						// instruction: STA_ABS
						// Store the value in the accumulator to an address
						// in memory specified in the next two bytes.
						processor[registerName] = 0x55;
						memory.data[0xfffc] =
							Instruction.operations[operationName].absolute!;
						memory.data[0xfffd] = 0x34;
						memory.data[0xfffe] = 0x12;

						await processor.execute(4);
						expect(memory.data[0x1234]).toBe(0x55);
					});

				if (
					addressingModes.includes(AddressingMode.absoluteX) ||
					addressingModes.includes(AddressingMode.absoluteY)
				)
					test(`${operationName}_ABS${
						register === "X" ? "Y" : "X"
					}`, async () => {
						// instruction: STA_ABSX
						// Store the value in the accumulator to an address in
						// memory specified in the next two bytes, plus
						// the value in register X.
						processor[`register${register === "X" ? "Y" : "X"}`] = 0x05;
						processor[registerName] = 0x55;
						memory.data[0xfffc] =
							Instruction.operations[operationName][
								`absolute${register === "X" ? "Y" : "X"}`
							]!;
						memory.data[0xfffd] = 0x34;
						memory.data[0xfffe] = 0x12;

						await processor.execute(5);
						expect(memory.data[0x1239]).toBe(0x55);
					});

				if (addressingModes.includes(AddressingMode.indirectX))
					test(`${operationName}_INDX`, async () => {
						// instruction: STA_INDX
						// Store the value in the accumulator to an address in
						// memory at an other address in zero page memory specified
						// in the next byte, plus the value in register X.
						processor.registerX = 0x04;
						processor[registerName] = 0x55;
						memory.data[0xfffc] =
							Instruction.operations[operationName].indirectX!;
						memory.data[0xfffd] = 0x02;
						memory.data[0x0006] = 0x00;
						memory.data[0x0007] = 0x80;

						await processor.execute(6);
						expect(memory.data[0x8000]).toBe(0x55);
					});

				if (addressingModes.includes(AddressingMode.indirectY))
					test(`${operationName}_INDY`, async () => {
						// instruction: STA_INDY
						// Store the value in the accumulator to an address in
						// memory, plus the value in register X, at an other
						// address in zero page memory specified in the next byte.
						processor.registerY = 0x04;
						processor[registerName] = 0x55;
						memory.data[0xfffc] =
							Instruction.operations[operationName].indirectY!;
						memory.data[0xfffd] = 0x02;
						memory.data[0x0002] = 0x00;
						memory.data[0x0003] = 0x80;

						await processor.execute(6);
						expect(memory.data[0x8004]).toBe(0x55);
					});
			}
		});
	});
}
