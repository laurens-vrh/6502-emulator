import { Instruction, OperationCode } from "../Instruction.js";

export async function handleSystemFunctionsOperation(
	{ operationCode }: Instruction,
	_address: number
) {
	switch (operationCode) {
		case OperationCode.NOP: {
			break;
		}
	}
}
