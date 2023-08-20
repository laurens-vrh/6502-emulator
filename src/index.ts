import { Memory } from "./Memory.js";
import { Processor } from "./Processor.js";
import { Instruction } from "./Instruction.js";

const memory = new Memory();
const processor = new Processor(memory, { verbose: true, cycleDuration: 1000 });

memory.loadValues({
	0xfffc: Instruction.operations.JMP.indirect!,
	0xfffd: 0x34,
	0xfffe: 0x12,
	0x1234: 0x78,
	0x1235: 0x56,
});

await processor.execute(5);
