import { Processor } from "./Processor.js";
import { AddressingMode, Operation, OperationCode } from "./types.js";
import { formatHex } from "./utils/formatHex.js";

export class Instruction {
	processor: Processor;
	instruction: number;

	constructor(processor: Processor, instruction: number) {
		this.processor = processor;
		this.instruction = instruction;
	}

	async execute() {
		const { operationCode, addressingMode } = Instruction.getOperation(
			this.instruction
		);
		if (!operationCode || !addressingMode)
			return console.log(
				`[ERROR] Unknown instruction:`,
				formatHex(this.instruction)
			);

		switch (operationCode) {
			case OperationCode.JMP: {
				this.processor.programCounter = await this.getData(addressingMode);

				break;
			}

			case OperationCode.JSR: {
				this.processor.memory.data[this.processor.stackPointer] =
					(this.processor.programCounter - 1) & 0xff;
				await this.processor.cycle();
				this.processor.memory.data[this.processor.stackPointer + 1] =
					(this.processor.programCounter - 1) >> 8;
				await this.processor.cycle();
				this.processor.stackPointer += 2;

				this.processor.programCounter = await this.getData(addressingMode);
				await this.processor.cycle();

				break;
			}

			case OperationCode.LDA: {
				var data = await this.getData(addressingMode);

				if (addressingMode === AddressingMode.absolute)
					data = await this.processor.readByte(data);

				this.processor.accumulator = data;
				this.processor.updateFlags();

				break;
			}

			case OperationCode.NOP: {
				break;
			}
		}
	}

	async getData(addressingMode: AddressingMode): Promise<number> {
		switch (addressingMode) {
			case AddressingMode.immediate: {
				return await this.processor.fetchByte();
			}

			case AddressingMode.zeroPage: {
				const address = await this.processor.fetchByte();
				return await this.processor.readByte(address);
			}

			case AddressingMode.zeroPageX: {
				var address = await this.processor.fetchByte();
				address = (address + this.processor.registerX) % 0x100;
				await this.processor.cycle();
				return await this.processor.readByte(address);
			}

			case AddressingMode.absolute: {
				return await this.processor.fetchWord();
			}

			case AddressingMode.absoluteX: {
				const address = await this.processor.fetchWord();
				const newAddress = address + this.processor.registerX;
				if (address >> 8 !== newAddress >> 8) await this.processor.cycle();
				return await this.processor.readByte(newAddress);
			}

			case AddressingMode.absoluteY: {
				const address = await this.processor.fetchWord();
				const newAddress = address + this.processor.registerY;
				if (address >> 8 !== newAddress >> 8) await this.processor.cycle();
				return await this.processor.readByte(newAddress);
			}

			case AddressingMode.indirectX: {
				var zeroPageAddress = await this.processor.fetchByte();
				zeroPageAddress = (zeroPageAddress + this.processor.registerX) % 0x100;
				await this.processor.cycle();
				const address = await this.processor.readWord(zeroPageAddress);
				return await this.processor.readByte(address);
			}

			case AddressingMode.indirectY: {
				const zeroPageAddress = await this.processor.fetchByte();
				const address = await this.processor.readWord(zeroPageAddress);
				const newAddress = address + this.processor.registerY;
				if (address >> 8 !== newAddress >> 8) await this.processor.cycle();
				return await this.processor.readByte(newAddress);
			}

			default: {
				return 0;
			}
		}
	}

	static getOperation(instruction: number): {
		operationCode?: OperationCode;
		addressingMode?: AddressingMode;
	} {
		var result: any = {};

		Object.entries(this.operations).forEach(
			([operationCode, addressingModes]) =>
				Object.entries(addressingModes).forEach(
					([addressingMode, modeInstruction]) => {
						if (instruction === modeInstruction)
							result = { operationCode, addressingMode };
					}
				)
		);

		return result;
	}

	static operations: Record<string, Operation> = {
		JMP: {
			absolute: 0x4c,
			indirect: 0x6c, // TODO: implement indirect mode
		},
		JSR: {
			absolute: 0x20,
		},
		LDA: {
			immediate: 0xa9,
			zeroPage: 0xa5,
			zeroPageX: 0xb5,
			absolute: 0xad,
			absoluteX: 0xbd,
			absoluteY: 0xb9,
			indirectX: 0xa1,
			indirectY: 0xb1,
		},
		NOP: { implied: 0xea },
	};
}
