export interface ProcessorOptions {
	verbose: boolean;
	cycleDuration: number;
}

export type ProcessorFlags = {
	carryFlag: boolean;
	zeroFlag: boolean;
	interruptFlag: boolean;
	decimalMode: boolean;
	breakCommand: boolean;
	overflowFlag: boolean;
	negativeFlag: boolean;
};

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
