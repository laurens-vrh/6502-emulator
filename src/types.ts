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
	NOP = "NOP",
}

export enum AddressingMode {
	immediate = "immediate",
	zeroPage = "zeroPage",
	zeroPageX = "zeroPageX",
	absolute = "absolute",
	absoluteX = "absoluteX",
	absoluteY = "absoluteY",
	implied = "implied",
	indirect = "indirect", // TODO: implement for JMP
	indirectX = "indirectX",
	indirectY = "indirectY",
}

export type Operation = Partial<Record<AddressingMode, number>>;
