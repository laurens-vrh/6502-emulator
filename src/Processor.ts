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
		interruptDisable: false,
		decimalMode: false,
		breakCommand: false,
		overflowFlag: false,
		negativeFlag: false,
	};

	memory: Memory;

	cycles = 0;
	cyclesUsed = 0;
	lastInstruction = 0;
	lastRead = 0;

	options = {
		verbose: false,
		cycleDuration: 0,
		persistLogs: false,
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
	}

	async readByte(address: number) {
		const value = this.memory.data[address];
		this.lastRead = value;
		await this.cycle();
		return value;
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

	async pushStack(value: number, type: "word" | "byte" = "word") {
		if (type === "word") {
			value--;
			await this.writeByte(this.stackPointer, value >> 8);
			this._stackPointer--;
		}

		await this.writeByte(this.stackPointer, value & 0x00ff);
		this._stackPointer--;
	}

	async pullStack(type: "word" | "byte" = "word") {
		var value;
		if (type === "word") {
			value = (await this.readWord(this.stackPointer + 1)) + 1;
			this._stackPointer += 2;
		} else {
			value = (await this.readByte(this.stackPointer + 1)) % 100;
			this._stackPointer++;
		}
		await this.cycle();
		return value;
	}

	async cycle() {
		if (this.options.cycleDuration > 0) await sleep(this.options.cycleDuration);
		this.cycles--;
		this.cyclesUsed++;

		if (this.options.verbose) this.logState();
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

		if (!this.options.persistLogs) console.clear();
		console.log(
			"--- Processor state ---\n",
			`Program counter:\t${formatHex(this.programCounter)}\n`,
			`Instruction:\t\t${formatHex(this.lastInstruction || 0)} ${
				operationCode ? `(${operationCode} ${addressingMode})` : ""
			}\n`,
			`Last read:\t\t${formatHex(this.lastRead || 0, 2)}\n`,
			`Stack pointer:\t\t${formatHex(this.stackPointer)}\n`,
			this.stackPointer !== 0x01ff
				? `Return address:\t${formatHex(
						((this.memory.data[this.stackPointer + 2] << 8) |
							this.memory.data[this.stackPointer + 1]) +
							1
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
			`Cycles remaining:\t${this.cycles} (used: ${this.cyclesUsed})\n`,
			"---                 ---"
		);
	}
}

export interface ProcessorOptions {
	verbose: boolean;
	cycleDuration: number;
	persistLogs: boolean;
}

export type ProcessorFlags = {
	carryFlag: boolean;
	zeroFlag: boolean;
	interruptDisable: boolean;
	decimalMode: boolean;
	breakCommand: boolean;
	overflowFlag: boolean;
	negativeFlag: boolean;
};
