import { Processor } from "./Processor.js";

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
		if (!operationCode || !addressingMode) return;

		const address = await this.getAddress(addressingMode);

		switch (operationCode) {
			case OperationCode.JMP: {
				this.processor.programCounter = address;

				break;
			}

			case OperationCode.JSR: {
				await this.processor.pushStack(this.processor.programCounter);
				this.processor.programCounter = address;
				await this.processor.cycle();

				break;
			}

			case OperationCode.LDA:
			case OperationCode.LDX:
			case OperationCode.LDY: {
				const data =
					addressingMode === AddressingMode.immediate
						? address
						: await this.processor.readByte(address);

				this.processor[
					operationCode === OperationCode.LDA
						? "accumulator"
						: operationCode === OperationCode.LDX
						? "registerX"
						: "registerY"
				] = data;
				this.processor.updateFlags();

				break;
			}

			case OperationCode.NOP: {
				break;
			}

			case OperationCode.RTS: {
				this.processor.programCounter = await this.processor.popStack();
				await this.processor.cycle();

				break;
			}

			case OperationCode.STA:
			case OperationCode.STX:
			case OperationCode.STY: {
				const value =
					this.processor[
						operationCode === OperationCode.STA
							? "accumulator"
							: operationCode === OperationCode.STX
							? "registerX"
							: "registerY"
					];
				this.processor.writeByte(address, value);

				break;
			}
		}
	}

	async getAddress(addressingMode: AddressingMode): Promise<number> {
		switch (addressingMode) {
			case AddressingMode.immediate: {
				return await this.processor.fetchByte();
			}

			case AddressingMode.zeroPage: {
				return await this.processor.fetchByte();
			}

			case AddressingMode.zeroPageX:
			case AddressingMode.zeroPageY: {
				const register =
					addressingMode === AddressingMode.zeroPageY
						? this.processor.registerY
						: this.processor.registerX;

				var address = await this.processor.fetchByte();
				address = (address + register) % 0x100;
				await this.processor.cycle();
				return address;
			}

			case AddressingMode.absolute: {
				return await this.processor.fetchWord();
			}

			case AddressingMode.absoluteX:
			case AddressingMode.absoluteY: {
				const register =
					addressingMode === AddressingMode.absoluteY
						? this.processor.registerY
						: this.processor.registerX;

				const address = await this.processor.fetchWord();
				const newAddress = address + register;
				if (address >> 8 !== newAddress >> 8) await this.processor.cycle();
				return newAddress;
			}

			case AddressingMode.indirect: {
				const address = await this.processor.fetchWord();
				return await this.processor.readWord(address);
			}

			case AddressingMode.indirectX: {
				var zeroPageAddress = await this.processor.fetchByte();
				zeroPageAddress = (zeroPageAddress + this.processor.registerX) % 0x100;
				await this.processor.cycle();
				const address = await this.processor.readWord(zeroPageAddress);
				return address;
			}

			case AddressingMode.indirectY: {
				const zeroPageAddress = await this.processor.fetchByte();
				const address = await this.processor.readWord(zeroPageAddress);
				const newAddress = address + this.processor.registerY;
				if (address >> 8 !== newAddress >> 8) await this.processor.cycle();
				return newAddress;
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

	static operations: Record<OperationCode, Operation> = {
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
		LDX: {
			immediate: 0xa2,
			zeroPage: 0xa6,
			zeroPageY: 0xb6,
			absolute: 0xae,
			absoluteY: 0xbe,
		},
		LDY: {
			immediate: 0xa0,
			zeroPage: 0xa4,
			zeroPageX: 0xb4,
			absolute: 0xac,
			absoluteX: 0xbc,
		},
		NOP: { implied: 0xea },
		RTS: { implied: 0x60 },
		STA: {
			zeroPage: 0x85,
			zeroPageX: 0x95,
			absolute: 0x8d,
			absoluteX: 0x9d,
			absoluteY: 0x99,
			indirectX: 0x81,
			indirectY: 0x91,
		},
		STX: {
			zeroPage: 0x86,
			zeroPageY: 0x96,
			absolute: 0x8e,
		},
		STY: {
			zeroPage: 0x84,
			zeroPageX: 0x94,
			absolute: 0x8c,
		},
	};
}

export enum AddressingMode {
	immediate = "immediate",
	zeroPage = "zeroPage",
	zeroPageX = "zeroPageX",
	zeroPageY = "zeroPageY",
	absolute = "absolute",
	absoluteX = "absoluteX",
	absoluteY = "absoluteY",
	implied = "implied",
	indirect = "indirect", // TODO: implement for JMP
	indirectX = "indirectX",
	indirectY = "indirectY",
}

export type Operation = Partial<Record<AddressingMode, number>>;

export enum OperationCode {
	JMP = "JMP",
	JSR = "JSR",
	LDA = "LDA",
	LDX = "LDX",
	LDY = "LDY",
	NOP = "NOP",
	RTS = "RTS",
	STA = "STA",
	STX = "STX",
	STY = "STY",
}
