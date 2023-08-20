import { AddressingMode, Instruction, OperationCode } from "../Instruction.js";

export async function handleLoadStoreOperation(
	{ processor, operationCode, addressingMode }: Instruction,
	address: number
) {
	switch (operationCode) {
		case OperationCode.LDA:
		case OperationCode.LDX:
		case OperationCode.LDY: {
			const data =
				addressingMode === AddressingMode.immediate
					? address
					: await processor.readByte(address);

			processor[
				operationCode === OperationCode.LDA
					? "accumulator"
					: operationCode === OperationCode.LDX
					? "registerX"
					: "registerY"
			] = data;
			processor.updateFlags();

			break;
		}

		case OperationCode.STA:
		case OperationCode.STX:
		case OperationCode.STY: {
			const value =
				processor[
					operationCode === OperationCode.STA
						? "accumulator"
						: operationCode === OperationCode.STX
						? "registerX"
						: "registerY"
				];
			processor.writeByte(address, value);

			break;
		}
	}
}
