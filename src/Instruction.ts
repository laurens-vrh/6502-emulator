import { Processor } from "./Processor.js";
import { handleJumpsAndCallsOperation } from "./instructions/jumpsAndCallsOperation.js";
import { handleLoadStoreOperation } from "./instructions/loadStoreOperation.js";
import { handleStackOperation } from "./instructions/stackOperation.js";
import { handleSystemFunctionsOperation } from "./instructions/systemFunctionsOperation.js";

export class Instruction {
	processor: Processor;
	instruction: number;
	operationCode?: OperationCode;
	addressingMode?: AddressingMode;

	constructor(processor: Processor, instruction: number) {
		const { operationCode, addressingMode } =
			Instruction.getOperation(instruction);

		this.processor = processor;
		this.instruction = instruction;
		this.operationCode = operationCode;
		this.addressingMode = addressingMode;
	}

	async execute() {
		if (!this.operationCode || !this.addressingMode) return;
		const address = await this.getAddress(this.addressingMode);

		switch (this.operationCode) {
			case OperationCode.LDA:
			case OperationCode.LDX:
			case OperationCode.LDY:
			case OperationCode.STA:
			case OperationCode.STX:
			case OperationCode.STY: {
				await handleLoadStoreOperation(this, address);
				break;
			}

			case OperationCode.JMP:
			case OperationCode.JSR:
			case OperationCode.RTS: {
				await handleJumpsAndCallsOperation(this, address);
				break;
			}

			case OperationCode.TSX:
			case OperationCode.TXS:
			case OperationCode.PHA:
			case OperationCode.PHP:
			case OperationCode.PLA:
			case OperationCode.PLP: {
				await handleStackOperation(this, address);
				break;
			}

			case OperationCode.NOP: {
				await handleSystemFunctionsOperation(this, address);
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
		PHA: { implied: 0x48 },
		PHP: { implied: 0x08 },
		PLA: { implied: 0x68 },
		PLP: { implied: 0x28 },
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
		TSX: { implied: 0xba },
		TXS: { implied: 0x9a },
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
	PHA = "PHA",
	PHP = "PHP",
	PLA = "PLA",
	PLP = "PLP",
	RTS = "RTS",
	STA = "STA",
	STX = "STX",
	STY = "STY",
	TSX = "TSX",
	TXS = "TXS",
}
