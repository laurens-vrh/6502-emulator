import { describe } from "@jest/globals";

import { AddressingMode } from "../src/Instruction";
import { testJumpsAndCalls } from "./instructions/jumpsAndCalls";
import {
	testLoadOperations,
	testStoreOperations,
} from "./instructions/loadStoreOperations";
import { testStackOperations } from "./instructions/stackOperations";
import { testSystemFunctions } from "./instructions/systemFunctions";

describe("Instructions", () => {
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

	testStackOperations();

	testJumpsAndCalls();

	testSystemFunctions();
});
