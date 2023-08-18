// import { Memory } from "./Memory.js";
// import { Processor } from "./Processor.js";
// import { Instruction } from "./Instruction.js";

// const memory = new Memory();
// const processor = new Processor(memory);

// processor.registerX = 0x04;

// memory.data[0xfffc] = Instruction.LDA.INDX; // Load value at zero page address + register X into accumulator
// memory.data[0xfffd] = 0x02;
// memory.data[0x0006] = 0x00;
// memory.data[0x0007] = 0x80;
// memory.data[0x8000] = 0x55;

// await processor.execute(8, 1000);
// processor.logState();
