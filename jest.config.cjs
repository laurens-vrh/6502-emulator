/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
	preset: "ts-jest",
	testEnvironment: "node",
	moduleNameMapper: {
		"^(\\.\\.?\\/.+)\\.js$": "$1",
	},
	verbose: true,
	maxWorkers: "50%",
	slowTestThreshold: 15,
};
