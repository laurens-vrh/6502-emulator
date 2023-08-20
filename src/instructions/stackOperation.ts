import { Instruction, OperationCode } from "../Instruction.js";

export async function handleStackOperation(
	{ processor, operationCode }: Instruction,
	address: number
) {
	switch (operationCode) {
		case OperationCode.TSX: {
			processor.registerX = processor._stackPointer;
			processor.updateFlags();
			await processor.cycle();

			break;
		}

		case OperationCode.TXS: {
			processor._stackPointer = processor.registerX;
			await processor.cycle();

			break;
		}

		case OperationCode.PHA: {
			await processor.pushStack(processor.accumulator, "byte");

			break;
		}

		case OperationCode.PHP: {
			await processor.pushStack(
				(+processor.flags.negativeFlag << 6) |
					(+processor.flags.overflowFlag << 5) |
					(+processor.flags.breakCommand << 4) |
					(+processor.flags.decimalMode << 3) |
					(+processor.flags.interruptDisable << 2) |
					(+processor.flags.zeroFlag << 1) |
					+processor.flags.carryFlag,
				"byte"
			);

			break;
		}

		case OperationCode.PLA: {
			processor.accumulator = await processor.pullStack("byte");
			processor.updateFlags();
			await processor.cycle();

			break;
		}

		case OperationCode.PLP: {
			const flags = await processor.pullStack("byte");
			processor.flags.carryFlag = (flags & 0b0000001) > 0;
			processor.flags.zeroFlag = (flags & 0b0000010) > 0;
			processor.flags.interruptDisable = (flags & 0b0000100) > 0;
			processor.flags.decimalMode = (flags & 0b0001000) > 0;
			processor.flags.breakCommand = (flags & 0b0010000) > 0;
			processor.flags.overflowFlag = (flags & 0b0100000) > 0;
			processor.flags.negativeFlag = (flags & 0b1000000) > 0;
			await processor.cycle();

			break;
		}
	}
}
