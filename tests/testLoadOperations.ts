import { afterEach, beforeEach, describe, expect, test } from "@jest/globals";

import { AddressingMode, Instruction, OperationCode } from "../src/Instruction";
import { Memory } from "../src/Memory";
import { Processor, ProcessorFlags } from "../src/Processor";
import { checkFlags } from "./checkFlags";

var memory: Memory;
var processor: Processor;
var previousFlags: ProcessorFlags;

beforeEach(() => {
	memory = new Memory();
	processor = new Processor(memory);
	previousFlags = Object.assign({}, processor.flags);
});

afterEach(() => {
	expect(processor.cycles).toBe(0);
});

export function testLoadOperations(
	tests: Partial<Record<"A" | "X" | "Y", AddressingMode[]>>
) {
	describe("Load operations", () => {
		Object.entries(tests).forEach(([register, addressingModes]) => {
			const operationName = ("LD" + register) as OperationCode;
			const registerName = (
				register === "A" ? "accumulator" : `register${register}`
			) as "accumulator" | "registerX" | "registerY";
			const targetRegisterLetter = register === "X" ? "Y" : "X";
			const targetRegister = ("register" + targetRegisterLetter) as
				| "registerX"
				| "registerY";

			if (addressingModes.includes(AddressingMode.immediate))
				test(`${operationName}_IM`, async () => {
					/*
							instruction: LDA_IM
						Load a value specified in the next byte into the accumulator. */

					memory.loadValues({
						0xfffc: Instruction.operations[operationName].immediate,
						0xfffd: 0xff,
					});

					await processor.execute(2);
					expect(processor[registerName]).toBe(0xff);
					checkFlags(processor.flags, previousFlags, {
						zeroFlag: false,
						negativeFlag: true,
					});
				});

			if (addressingModes.includes(AddressingMode.zeroPage))
				test(`${operationName}_ZP`, async () => {
					/*
							instruction: LDA_ZP
						Load a value at an address specified in the next byte
						in zero page memory into the accumulator. */

					processor[registerName] = 0xff;
					memory.loadValues({
						0xfffc: Instruction.operations[operationName].zeroPage,
						0xfffd: 0x42,
						0x0042: 0x00,
					});

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
				test(`${operationName}_ZP${targetRegisterLetter}`, async () => {
					/*
							instruction: LDA_ZPX
						Load a value at an address in zero page memory
						specified in the next byte, plus the value in register X, into the accumulator. */

					processor[targetRegister] = 0x05;
					memory.loadValues({
						0xfffc:
							Instruction.operations[operationName][
								`zeroPage${targetRegisterLetter}`
							],
						0xfffd: 0x42,
						0x0047: 0x0f,
					});

					await processor.execute(4);
					expect(processor[registerName]).toBe(0x0f);
					checkFlags(processor.flags, previousFlags, {
						zeroFlag: false,
						negativeFlag: false,
					});
				});

				test(`${operationName}_ZP${targetRegister} 2`, async () => {
					/*
							instruction: LDA_ZPX 2
						Load a value at an address in zero page memory
						specified in the next byte, plus the value in register X, into the accumulator and ensure that
						the address wraps properly. */

					processor[targetRegister] = 0xff;
					memory.loadValues({
						0xfffc:
							Instruction.operations[operationName][
								`zeroPage${targetRegisterLetter}`
							],
						0xfffd: 0x80,
						0x007f: 0xff,
					});

					await processor.execute(4);
					expect(processor[registerName]).toBe(0xff);
					checkFlags(processor.flags, previousFlags, {
						zeroFlag: false,
						negativeFlag: true,
					});
				});
			}

			if (addressingModes.includes(AddressingMode.absolute))
				test(`${operationName}_ABS`, async () => {
					/*
							instruction: LDA_ABS
						Load a value at an address specified in the next two bytes into the accumulator. */

					memory.loadValues({
						0xfffc: Instruction.operations[operationName].absolute,
						0xfffd: 0x34,
						0xfffe: 0x12,
						0x1234: 0x55,
					});

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
				test(`${operationName}_ABS${targetRegisterLetter}`, async () => {
					/*
							instruction: LDA_ABSX
						Load a value at an address in memory specified
						in the next two bytes, plus the value in register X,
						into the accumulator. */

					processor[targetRegister] = 0x05;
					memory.loadValues({
						0xfffc:
							Instruction.operations[operationName][
								`absolute${targetRegisterLetter}`
							],
						0xfffd: 0x34,
						0xfffe: 0x12,
						0x1239: 0x55,
					});

					await processor.execute(4);
					expect(processor[registerName]).toBe(0x55);
					checkFlags(processor.flags, previousFlags, {
						zeroFlag: false,
						negativeFlag: false,
					});
				});
				test(`${operationName}_ABS${targetRegister} 2`, async () => {
					/*
							instruction: LDA_ABSX 2
						Load a value at an address in memory specified
						in the next two bytes, plus the value in register X,
						into the accumulator  and ensure that a
						page cross takes an extra cycle. */

					processor[targetRegister] = 0xff;
					memory.loadValues({
						0xfffc:
							Instruction.operations[operationName][
								`absolute${targetRegisterLetter}`
							],
						0xfffd: 0x34,
						0xfffe: 0x12,
						0x1333: 0x55,
					});

					await processor.execute(5);
					expect(processor[registerName]).toBe(0x55);
					checkFlags(processor.flags, previousFlags, {
						zeroFlag: false,
						negativeFlag: false,
					});
				});
			}

			if (addressingModes.includes(AddressingMode.indirectX))
				test(`${operationName}_INDX`, async () => {
					/*
							instruction: LDA_INDX
						Load the value at an address at an other address in
						zero page memory specified in the next byte, plus
						the value in register X, into the accumulator. */

					processor.registerX = 0x04;
					memory.loadValues({
						0xfffc: Instruction.operations[operationName].indirectX,
						0xfffd: 0x02,
						0x0006: 0x00,
						0x0007: 0x80,
						0x8000: 0x55,
					});

					await processor.execute(6);
					expect(processor[registerName]).toBe(0x55);
					checkFlags(processor.flags, previousFlags, {
						zeroFlag: false,
						negativeFlag: false,
					});
				});

			if (addressingModes.includes(AddressingMode.indirectY)) {
				test(`${operationName}_INDY`, async () => {
					/*
							instruction: LDA_INDY
						Load the value at an address, plus the value in
						register y, at an other address in zero page memory
						specified in the next byte into the accumulator. */

					processor.registerY = 0x04;
					memory.loadValues({
						0xfffc: Instruction.operations[operationName].indirectY,
						0xfffd: 0x02,
						0x0002: 0x00,
						0x0003: 0x80,
						0x8004: 0x55,
					});

					await processor.execute(5);
					expect(processor[registerName]).toBe(0x55);
					checkFlags(processor.flags, previousFlags, {
						zeroFlag: false,
						negativeFlag: false,
					});
				});

				test(`${operationName}_INDY 2`, async () => {
					/*
							instruction: LDA_INDY 2
						Load the value at an address, plus the value in
						register y, at an other address in zero page memory
						specified in the next byte into the accumulator and
						ensure that a page cross takes an extra cycle. */

					processor.registerY = 0xff;
					memory.loadValues({
						0xfffc: Instruction.operations[operationName].indirectY,
						0xfffd: 0x02,
						0x0002: 0x08,
						0x0003: 0x80,
						0x8107: 0x55,
					});

					await processor.execute(6);
					expect(processor[registerName]).toBe(0x55);
					checkFlags(processor.flags, previousFlags, {
						zeroFlag: false,
						negativeFlag: false,
					});
				});
			}
		});
	});
}
