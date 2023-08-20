import { Memory } from "./Memory.js";
import { Processor } from "./Processor.js";
import { Instruction } from "./Instruction.js";

const memory = new Memory();
const processor = new Processor(memory, {
	verbose: true,
	cycleDuration: 300,
	persistLogs: true,
});

memory.loadValues({
	0xfffc: Instruction.operations.JSR.absolute,
	0xfffd: 0x01,
	0xfffe: 0x00,
});

await processor.execute(6);
