import { Instruction } from "./Instruction.js";
import { Memory } from "./Memory.js";
import { ProcessorFlags } from "./types.js";
import { formatHex } from "./utils/formatHex.js";
import { sleep } from "./utils/sleep.js";

export class Processor {
	programCounter: number = 0xfffc;
	stackPointer: number = 0x0100;

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
	cycleDuration = 0;

	constructor(memory: Memory, cycleDuration = 0) {
		this.memory = memory;
		this.cycleDuration = cycleDuration;
	}

	async execute(_cycles: number, _cycleDuration?: number) {
		if (_cycleDuration) this.cycleDuration = _cycleDuration;
		this.cycles += _cycles;

		while (this.cycles > 0) {
			const instruction = await this.fetchByte();
			await Instruction.execute(instruction, this);
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

	async cycle() {
		this.cycles -= 1;

		if (this.cycleDuration) {
			await sleep(this.cycleDuration);
			console.clear();
			this.logState();
		}
	}

	updateFlags() {
		this.flags.zeroFlag = this.accumulator === 0;
		this.flags.negativeFlag = (this.accumulator & 0b10000000) > 0;
	}

	logState() {
		console.log(
			"--- Processor state ---\n",
			`Program counter:\t${formatHex(this.programCounter)}\n`,
			`Stack pointer:\t\t${formatHex(this.stackPointer)}\n`,
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
