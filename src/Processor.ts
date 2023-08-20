import { Instruction } from "./Instruction.js";
import { Memory } from "./Memory.js";
import { formatHex } from "./utils/formatHex.js";
import { sleep } from "./utils/sleep.js";

export class Processor {
	programCounter: number = 0xfffc;
	_stackPointer: number = 0xff;
	get stackPointer() {
		return 0x0100 + this._stackPointer;
	}

	accumulator: number = 0;
	registerX: number = 0;
	registerY: number = 0;

	flags: ProcessorFlags = {
		carryFlag: false,
		zeroFlag: false,
		interruptFlag: false,
		decimalMode: false,
		breakCommand: false,
		overflowFlag: false,
		negativeFlag: false,
	};

	memory: Memory;

	cycles = 0;
	lastInstruction = 0;

	options = {
		verbose: false,
		cycleDuration: 0,
	};

	constructor(memory: Memory, options?: ProcessorOptions) {
		this.memory = memory;
		this.options = options ?? this.options;
	}

	async execute(cycles: number) {
		this.cycles += cycles;
		if (this.options.verbose) this.logState();

		while (this.cycles > 0) {
			const instructionCode = await this.fetchByte();
			this.lastInstruction = instructionCode;
			const instruction = new Instruction(this, instructionCode);
			await instruction.execute();
		}

		if (this.options.verbose) {
			console.clear();
			this.logState();
		}
	}

	async readByte(address: number) {
		await this.cycle();
		return this.memory.data[address];
	}

	async fetchByte() {
		const value = await this.readByte(this.programCounter);
		this.programCounter++;
		return value;
	}

	async writeByte(address: number, value: number) {
		this.memory.data[address] = value;
		await this.cycle();
		return;
	}

	async readWord(address: number) {
		const lower = await this.readByte(address);
		const upper = (await this.readByte(address + 1)) << 8;

		return upper | lower;
	}

	async fetchWord() {
		const value = await this.readWord(this.programCounter);

		this.programCounter += 2;
		return value;
	}

	async pushStack(address: number) {
		this.memory.data[this.stackPointer - 1] = (address - 1) & 0x00ff;
		await this.cycle();
		this.memory.data[this.stackPointer] = (address - 1) >> 8;
		await this.cycle();
		this._stackPointer -= 2;
	}

	async popStack() {
		const address = await this.readWord(this.stackPointer + 1);
		this._stackPointer += 2;
		await this.cycle();
		await this.cycle();
		return address + 1;
	}

	async cycle() {
		this.cycles -= 1;

		if (this.options.verbose) {
			await sleep(this.options.cycleDuration);
			console.clear();
			this.logState();
		}
	}

	updateFlags() {
		const registerLetter = Instruction.getOperation(
			this.lastInstruction
		).operationCode?.slice(-1);
		const register =
			registerLetter === "A"
				? this.accumulator
				: registerLetter === "X"
				? this.registerX
				: this.registerY;

		this.flags.zeroFlag = register === 0;
		this.flags.negativeFlag = (register & 0b10000000) > 0;
	}

	logState() {
		const { operationCode, addressingMode } = Instruction.getOperation(
			this.lastInstruction
		);

		console.log(
			"--- Processor state ---\n",
			`Program counter:\t${formatHex(this.programCounter)}\n`,
			`Instruction:\t\t${formatHex(this.lastInstruction)} ${
				operationCode ? `(${operationCode} ${addressingMode})` : ""
			}\n`,
			`Stack pointer:\t\t${formatHex(this.stackPointer)}\n`,
			this.stackPointer !== 0x01ff
				? `Return address:\t${formatHex(
						(this.memory.data[this.stackPointer] |
							(this.memory.data[this.stackPointer + 1] << 8)) +
							3
				  )}\n`
				: "\n",
			"\n",
			`Accumulator:\t${formatHex(this.accumulator, 2)}\n`,
			`Register X:\t${formatHex(this.registerX, 2)}\n`,
			`Register Y:\t${formatHex(this.registerY, 2)}\n`,
			"\n",
			"Flags:\tC | Z | I | D | B | V | N\n",
			`\t${Object.values(this.flags)
				.map((f) => (f ? 1 : 0))
				.join(" | ")}\n`,
			"\n",
			`Cycles:\t${this.cycles}\n`,
			"---                 ---"
		);
	}
}

export interface ProcessorOptions {
	verbose: boolean;
	cycleDuration: number;
}

export type ProcessorFlags = {
	carryFlag: boolean;
	zeroFlag: boolean;
	interruptFlag: boolean;
	decimalMode: boolean;
	breakCommand: boolean;
	overflowFlag: boolean;
	negativeFlag: boolean;
};
