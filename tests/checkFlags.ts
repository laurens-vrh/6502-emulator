import { expect } from "@jest/globals";
import { ProcessorFlags } from "../src/Processor";

export function checkFlags(
	flags: ProcessorFlags,
	previousFlags: ProcessorFlags,
	criteria: Partial<ProcessorFlags>
) {
	Object.entries(flags).forEach(([flag, value]) => {
		expect(value).toBe(
			criteria[flag as keyof ProcessorFlags] ??
				previousFlags[flag as keyof ProcessorFlags]
		);
	});
}
