// Valid tokens
const subleqInstruction = "subleq";
const dataDirective = ".data";
const referencePrefix = "@";
const commentDelimiter = ";";

export const Syntax = {
    subleqInstruction,
    dataDirective,
    referencePrefix,
    commentDelimiter,
};

// Valid values
const valueMin = -128;
const valueMax = 127;

// Valid addresses
const addressMin = 0;
const addressMax = 255;

// Built-in addresses
const addressUserMax = 252;
const addressInput = 253;
const addressOutput = 254;
const addressHalt = 255;

const subleqInstructionBytes = 3;

export const Constants = {
    valueMin,
    valueMax,

    addressMin,
    addressMax,

    addressUserMax,
    addressInput,
    addressOutput,
    addressHalt,

    subleqInstructionBytes,
};

// Custom error type
export class CompilationError extends Error {
    constructor(message: string) {
        super(message);
    }
}

export enum Command {
    subleqInstruction,
    dataDirective
}

const CommandStringToCommand = {
    [subleqInstruction]: Command.subleqInstruction,
    [dataDirective]: Command.dataDirective,
}

export interface LabelReference {
    label: string;
    offset: number;
}

export type Expression = LabelReference | number;

export interface ParsedLine {
    command: Command;
    expressions: Expression[];
}

export interface SourceMapEntry {
    lineNumber: number;
    command: Command;
    source: string;
}

export interface VariableDefinition {
    symbol: string;
    address: number;
}

export interface AssembledProgram {
    bytes: number[];
    sourceMap: SourceMapEntry[];
    variables: VariableDefinition[];
}

export class Assembler {
    private static readonly identifierPattern = "[_a-zA-Z][_a-zA-Z0-9]*";
    private static readonly commandPattern = `.?${Assembler.identifierPattern}`;
    private static readonly numberPattern = "-?[0-9]+";
    private static readonly referencePattern = `${referencePrefix}${Assembler.identifierPattern}`;
    private static readonly referenceExpressionPattern = `(${Assembler.referencePattern})([+-][0-9]+)?`;
    private static readonly expressionPattern = `(${Assembler.numberPattern}|${Assembler.referenceExpressionPattern})`;
    private static readonly linePattern = `^\\s*((${Assembler.referencePattern})\\s*:)?\\s*((${Assembler.commandPattern})(\\s+${Assembler.expressionPattern}\\s*(,\\s+${Assembler.expressionPattern}\\s*)*)?)?(\\s*${commentDelimiter}.*)?`;

    private static readonly referenceExpressionRegExp = new RegExp(Assembler.referenceExpressionPattern);
    private static readonly lineRegExp = new RegExp(Assembler.linePattern);

    private address = 0;
    private symbols: {[name: string]: number} = {};
    private addressToSymbol = [];

    constructor() {
        this.symbols[`${referencePrefix}MAX`] = addressUserMax;
        this.symbols[`${referencePrefix}IN`] = addressInput;
        this.symbols[`${referencePrefix}OUT`] = addressOutput;
        this.symbols[`${referencePrefix}HALT`] = addressHalt;
    }

    private static isValidNumber(str: string, min: number, max: number): boolean {
        const value = parseInt(str);
        return value !== NaN && value >= min && value <= max;
    }

    private static isValidValue(str: string): boolean {
        return Assembler.isValidNumber(str, valueMin, valueMax);
    }

    private static isValidAddress(str: string): boolean {
        return Assembler.isValidNumber(str, addressMin, addressMax);
    }

    private static signedToUnsigned(signed: number): number {
        return signed & 0xff;
    }

    private static isLabelReference(expression: Expression): expression is LabelReference {
        return typeof(expression) === "object";
    }
    
    private static parseValue(str: string): number {
        if (Assembler.isValidValue(str)) {
            return Assembler.signedToUnsigned(parseInt(str));
        } else {
            throw new CompilationError(`Invalid argument: ${str} (must be an integer on the range [${valueMin}, ${valueMax}])`);
        }
    }

    private static parseAddress(str: string) : number {
        if (Assembler.isValidAddress(str)) {
            return parseInt(str);
        } else {
            throw new CompilationError(`Invalid argument: ${str} (must be an integer on the range [${addressMin}, ${addressMax}])`);
        }
    }

    private static parseExpression(str: string, fallback: (str: string) => number): Expression {
        if (str[0] === referencePrefix) {
            // Reference; resolve in second pass of assembler
            const groups = Assembler.referenceExpressionRegExp.exec(str);
            const label = groups[1];
            const offset = groups[2];
            return {
                label,
                offset: offset ? parseInt(offset) : 0,
            };
        } else {
            return fallback(str);
        }
    }

    private static parseValueExpression(str: string): Expression {
        return Assembler.parseExpression(str, Assembler.parseValue);
    };

    private static parseAddressExpression(str: string): Expression {
        return Assembler.parseExpression(str, Assembler.parseAddress);
    };

    public parseLine(str: string): ParsedLine {
        const groups = Assembler.lineRegExp.exec(str);
        if (!groups) {
            throw new CompilationError(`Invalid syntax: ${str}`);
        }
    
        // Update symbol table
        const label = groups[2];
        if (label) {
            if (this.symbols[label]) {
                throw new CompilationError(`Symbol already defined: ${label} (${this.symbols[label]})`);
            }
    
            this.symbols[label] = this.address;
            this.addressToSymbol[this.address] = label;
        }
    
        const expressions: Expression[] = [];
        const commandName = groups[4];
        let command: Command;
        if (commandName) {
            // Parse argument list
            const commandArguments = (groups[5] || "")
                .split(",")
                .map(a => a.trim());
    
            let nextAddress = this.address;
            command = CommandStringToCommand[commandName];
            switch (command) {
                case Command.subleqInstruction:
                {
                    if (commandArguments.length < 2 || commandArguments.length > 3) {
                        throw new CompilationError(`Invalid number of arguments for ${commandName}: ${commandArguments.length} (must be 2 or 3 arguments)`);
                    }
        
                    nextAddress += subleqInstructionBytes;
    
                    expressions.push(Assembler.parseAddressExpression(commandArguments[0]));
                    expressions.push(Assembler.parseAddressExpression(commandArguments[1]));
                    expressions.push((commandArguments.length >= 3) ? Assembler.parseAddressExpression(commandArguments[2]) : nextAddress);
                }
                break;
        
                case Command.dataDirective:
                {
                    if (commandArguments.length !== 1) {
                        throw new CompilationError(`Invalid number of arguments for ${commandName}: ${commandArguments.length} (must be 1 argument)`);
                    }
                    
                    nextAddress++;
                    expressions.push(Assembler.parseValueExpression(commandArguments[0]));
                }
                break;
        
                default:
                throw new CompilationError(`Unknown command: ${commandName} (valid commands are: ${Object.keys(CommandStringToCommand).map(s => `"${s}"`).join(", ")})`);
            }
    
            this.address = nextAddress;
        }
    
        return {
            command: command,
            expressions,
        };
    };
    
    public assemble(lines: string[]): AssembledProgram {
        // Correlate address to source line
        const sourceMap: SourceMapEntry[] = [];
    
        // Parse expressions (note: this can include unresolved references)
        const expressions: Expression[] = [];
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.length > 0) {
                const previousAddress = this.address;
                const assembledLine = this.parseLine(line);
                const lineExpressions = assembledLine.expressions;
                for (let j = 0; j < lineExpressions.length; j++) {
                    expressions.push(lineExpressions[j]);
                }
    
                if (previousAddress !== this.address) {
                    sourceMap[previousAddress] = {
                        lineNumber: i,
                        command: assembledLine.command,
                        source: line
                    };
                }
            }
        }
    
        // Resolve all values
        const bytes = [];
        for (let i = 0; i < expressions.length; i++) {
            const expression = expressions[i];
            let expressionValue: number;
            if (Assembler.isLabelReference(expression)) {
                expressionValue = this.symbols[expression.label];
                if (expressionValue === undefined) {
                    throw new CompilationError(`Undefined reference: ${expression.label}`);
                }

                expressionValue += expression.offset;
            } else {
                expressionValue = expression;
            }
    
            if (expressionValue < 0 || expressionValue > addressMax) {
                throw new CompilationError(`Address \"${expressions[i]}\" (${expressionValue}) is outside of valid range of [0, 255]`);
            }
    
            bytes.push(expressionValue);
        }
    
        const variables: VariableDefinition[] = [];
        for (let i = 0; i < sourceMap.length; i++) {
            if (sourceMap[i] && sourceMap[i].command === Command.dataDirective) {
                variables.push({
                    symbol: this.addressToSymbol[i],
                    address: i,
                });
            }
        }
    
        return {
            bytes,
            sourceMap,
            variables,
        };
    };
}

export interface Variable {
    label: string;
    value: number;
}

export interface HaltData {
    cyclesExecuted: number;
    memoryBytesAccessed: number;
}

export interface StateUpdatedData {
    running: boolean;
    ip: number;
    target: number;
    sourceLineNumber: number;
    source: string;
    cyclesExecuted: number;
    memoryBytesAccessed: number;
    variables: Variable[];
}

export interface EmulatorOptions {
    readInput?: () => number;
    writeOutput?: (value: number) => void;

    onHalt?: (data: HaltData) => void;
    onWriteMemory?: (address: number, byte: number) => void;
    onStateUpdated?: (data: StateUpdatedData) => void;
}

export class Emulator {
    // State
    private running = true;
    private ip = 0;

    // Memory
    private memory: number[] = [];

    // Metrics

    // Memory access
    private memoryAccessed: boolean[] = [];
    private memoryBytesAccessed = 0;

    // Cycle count
    private cyclesExecuted = 0;

    constructor(private program: AssembledProgram, private callbacks: EmulatorOptions) {
        const bytes = this.program.bytes;
        for (let i = 0; i <= addressMax; i++) {
            const value = (i < bytes.length) ? bytes[i] : 0;
            this.memory[i] = value;
    
            if (this.callbacks.onWriteMemory) {
                this.callbacks.onWriteMemory(i, value);
            }
        }

        // Emit initial state info
        this.stateUpdated();
    }

    private static unsignedToSigned(unsigned: number): number {
        let signed = unsigned & 0x7f;
        signed += (unsigned & 0x80) ? -128 : 0;
        return signed;
    }

    private stateUpdated(): void {
        if (this.callbacks.onStateUpdated) {
            // Find source info in source map
            const sourceMap = this.program.sourceMap;
            const ip = this.ip;
            let sourceLineNumber = 0;
            let source = "?";
            const sourceMapEntry = sourceMap[ip];
            if (sourceMapEntry) {
                // Exact match in the source map
                sourceLineNumber = sourceMapEntry.lineNumber;
                source = sourceMapEntry.source;
            } else {
                // No match in the source map; use the previous line number
                for (let i = ip; i >= 0; i--) {
                    const previousEntry = sourceMap[i];
                    if (previousEntry) {
                        sourceLineNumber = previousEntry.lineNumber;
                        break;
                    }
                }
            }
    
            const variables: Variable[] = [];
            for (let i = 0; i < this.program.variables.length; i++) {
                variables.push({
                    label: this.program.variables[i].symbol,
                    value: Emulator.unsignedToSigned(this.memory[this.program.variables[i].address])
                });
            }
    
            this.callbacks.onStateUpdated({
                running: this.running,
                ip,
                target: this.memory[ip],
                sourceLineNumber,
                source,
                cyclesExecuted: this.cyclesExecuted,
                memoryBytesAccessed: this.memoryBytesAccessed,
                variables
            });
        }
    }

    private accessMemory(address: number): void {
        if (!this.memoryAccessed[address]) {
            this.memoryBytesAccessed++;
        }
    
        this.memoryAccessed[address] = true;
    };
    
    private readMemory(address: number): number {
        this.accessMemory(address);
        return this.memory[address];
    };
    
    private writeMemory(address: number, value: number): void {
        this.accessMemory(address);
        this.memory[address] = value;
        if (this.callbacks.onWriteMemory) {
            this.callbacks.onWriteMemory(address, value);
        }
    };
    
    public isRunning(): boolean {
        return this.ip >= 0 && (this.ip + subleqInstructionBytes) < this.memory.length;
    };
    
    public step(): void {
        if (this.isRunning()) {
            const a = this.readMemory(this.ip++);
            const b = this.readMemory(this.ip++);
            const c = this.readMemory(this.ip++);
    
            // Read operands
            const av = this.readMemory(a);
            let bv = 0;
            if (b === addressInput) {
                this.accessMemory(addressInput);
                if (this.callbacks.readInput) {
                    bv = this.callbacks.readInput();
                }
            } else {
                bv = this.readMemory(b);
            }
    
            // Arithmetic (wraps around on overflow)
            const result = (av - bv) & 0xff;
    
            // Write result
            const resultSigned = Emulator.unsignedToSigned(result);
            if (a === addressOutput) {
                this.accessMemory(addressOutput);
                if (this.callbacks.writeOutput) {
                    this.callbacks.writeOutput(resultSigned);
                }
            } else {
                this.writeMemory(a, result);
            }
    
            // Branch, if necessary
            if (resultSigned <= 0) {
                this.ip = c;
            }
    
            this.cyclesExecuted++;
            this.running = this.isRunning();
            this.stateUpdated();
    
            if (this.callbacks.onHalt && !this.running) {
                this.callbacks.onHalt({
                    cyclesExecuted: this.cyclesExecuted,
                    memoryBytesAccessed: this.memoryBytesAccessed,
                });
            }
        }
    };
    
    public run(): void {
        while (this.running) {
            this.step();
        }
    };
}