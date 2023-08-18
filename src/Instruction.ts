import { Processor } from "./Processor.js";
import { formatHex } from "./utils/formatHex.js";

export class Instruction {
	static JMP = {
		ABS: 0x4c,
		IN: 0x6c,
	};
	static JSR = 0x20;
	static LDA = {
		IM: 0xa9,
		ZP: 0xa5,
		ZPX: 0xb5,
		ABS: 0xad,
		ABSX: 0xbd,
		ABSY: 0xb9,
		INDX: 0xa1,
		INDY: 0xb1,
	};
	static NOP = 0xea;

	static async execute(instruction: number, processor: Processor) {
		switch (instruction) {
			case Instruction.JMP.ABS: {
				processor.programCounter = await processor.fetchWord();

				break;
			}

			case Instruction.JSR: {
				processor.memory.data[processor.stackPointer] =
					(processor.programCounter - 1) & 0xff;
				await processor.cycle();
				processor.memory.data[processor.stackPointer + 1] =
					(processor.programCounter - 1) >> 8;
				await processor.cycle();
				processor.stackPointer += 2;

				processor.programCounter = await processor.fetchWord();
				await processor.cycle();

				break;
			}

			case Instruction.LDA.IM: {
				processor.accumulator = await processor.fetchByte();
				processor.updateFlags();
				break;
			}

			case Instruction.LDA.ZP: {
				const address = await processor.fetchByte();
				processor.accumulator = await processor.readByte(address);
				processor.updateFlags();
				break;
			}

			case Instruction.LDA.ZPX: {
				var address = await processor.fetchByte();
				address = (address + processor.registerX) % 0x100;
				await processor.cycle();

				processor.accumulator = await processor.readByte(address);
				processor.updateFlags();
				break;
			}

			case Instruction.LDA.ABS: {
				const address = await processor.fetchWord();
				processor.accumulator = await processor.readByte(address);
				processor.updateFlags();
				break;
			}

			case Instruction.LDA.ABSX: {
				var address = await processor.fetchWord();
				const newAddress = address + processor.registerX;
				if (address >> 8 !== newAddress >> 8) await processor.cycle();

				processor.accumulator = await processor.readByte(newAddress);
				processor.updateFlags();
				break;
			}

			case Instruction.LDA.ABSY: {
				const address = await processor.fetchWord();
				const newAddress = address + processor.registerY;
				if (address >> 8 !== newAddress >> 8) await processor.cycle();

				processor.accumulator = await processor.readByte(newAddress);
				processor.updateFlags();
				break;
			}

			case Instruction.LDA.INDX: {
				var zeroPageAddress = await processor.fetchByte();
				zeroPageAddress = (zeroPageAddress + processor.registerX) % 0x100;
				await processor.cycle();

				const address = await processor.readWord(zeroPageAddress);
				processor.accumulator = await processor.readByte(address);
				processor.updateFlags();
				break;
			}

			case Instruction.LDA.INDY: {
				const zeroPageAddress = await processor.fetchByte();

				const address = await processor.readWord(zeroPageAddress);
				const newAddress = address + processor.registerY;
				if (address >> 8 !== newAddress >> 8) await processor.cycle();

				processor.accumulator = await processor.readByte(newAddress);
				processor.updateFlags();
				break;
			}

			case Instruction.NOP: {
				break;
			}

			default:
				console.log(`[ERROR] Unknown instruction:`, formatHex(instruction));
		}
	}
}
