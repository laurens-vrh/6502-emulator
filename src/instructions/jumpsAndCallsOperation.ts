import { Instruction, OperationCode } from "../Instruction.js";

export async function handleJumpsAndCallsOperation(
	{ processor, operationCode }: Instruction,
	address: number
) {
	switch (operationCode) {
		case OperationCode.JMP: {
			processor.programCounter = address;

			break;
		}

		case OperationCode.JSR: {
			await processor.pushStack(processor.programCounter);
			processor.programCounter = address;
			await processor.cycle();

			break;
		}

		case OperationCode.RTS: {
			const value = await processor.pullStack();
			await processor.cycle();
			processor.programCounter = value;
			await processor.cycle();

			break;
		}
	}
}
