import { Memory } from "./Memory.js";
import { Processor } from "./Processor.js";
import { Instruction } from "./Instruction.js";

const memory = new Memory();
const processor = new Processor(memory);

processor.registerX = 0x04;

memory.data[0xfffc] = Instruction.operations.LDA.absolute!;
memory.data[0xfffd] = 0x02;
memory.data[0xfffe] = 0x00;

await processor.execute(4, 2000);
processor.logState();
