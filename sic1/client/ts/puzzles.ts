export interface Puzzle {
    title: string;
    minimumSolvedToUnlock: number; // TODO: Better approach here?
    description: string;
    code?: string;
    io: (number | number[])[][];
}

export interface PuzzleGroup {
    groupTitle: string;
    list: Puzzle[];
}

export const puzzles: PuzzleGroup[] = [
    {
        groupTitle: "Tutorial",
        list: [
            {
                title: "Subleq Instruction and Output",
                minimumSolvedToUnlock: 0,
                description: "Use subleq and input/output to negate an input and write it out.",
                code:
`; The SIC-1 is an 8-bit computer with 256 bytes of memory.
; Programs are written in SIC-1 Assembly Language.
; Each instruction is 3 bytes, specified as follows:
;
;   subleq <A> <B> [<C>]
;
; A, B, and C are memory addresses (0 - 255) or labels.
;
; \"subleq\" subtracts the value at address B from the
; value at address A and stores the result at address A
; (i.e. mem[A] = mem[A] - mem[B]).
;
; If the result is <= 0, execution branches to address C.
;
; Note that if C is not specified, the address of the next
; instruction is used (in other words, the branch does
; nothing).
;
; For convenience, addresses can be specified using labels.
; The following predefined labels are always available:
;
;   @MAX (252): Maximum user-modifiable address
;   @IN (253): Reads a value from input (writes are ignored)
;   @OUT (254): Writes a result to output (reads as zero)
;   @HALT (255): Terminates the program when executed
;
; Below is a very simple SIC-1 program that negates one input
; value and writes it out.
;
; E.g. if the input value from @IN is 3, it subtracts 3 from
; @OUT (which reads as zero), and the result of 0 - 3 = -3 is
; written out.

subleq @OUT, @IN

; First, click \"Load\" to compile the program and load it
; into memory, then use the \"Step\" and \"Run\" buttons to
; execute the program until all expected outputs have been
; successfully written out (see the.
; \"In\"/\"Expected\"/\"Out\" table to the left).
`
                ,
                io: [
                    [3, -3]
                ]
            },
            {
                title: "Data Directive and Looping",
                minimumSolvedToUnlock: 1,
                description: "Use .data and labels to loop.",
                code:
`; Custom labels are defined by putting \"@name: \" at the
; beginning of a line, e.g.:
;
;   @loop: subleq 1, 2
;
; In addition to \"subleq\", there is an assembler
; directive \".data\" that sets a byte of memory to a value
; at compile time (note: this is not an instruction!):
;
;   .data <X>
;
; X is a signed byte (-128 to 127).
;
; Combining labels and the \".data\" directive allows you to:
; develop of system of constants and variables:
;
;   @zero: .data 0
;
; Note that, while a program is executing, you can view the
; current value of each varaible in the variable table on
; the right (under the memory table).
;
; Variables can be used for implementing an unconditional
; jump:
;
;   subleq @zero, @zero, @loop
;
; This will set @zero to @zero - @zero (still zero) and,
; since the result is always <= 0, execution branches to
; @loop.
;
; Below is an updated negation program that repeatedly
; negates input values and writes them out.

@loop:
subleq @OUT, @IN
subleq @zero, @zero, @loop

@zero: .data 0
`
                ,
                io: [
                    [3, -3],
                    [4, -4],
                    [5, -5]
                ]
            },
            {
                title: "First Assessment",
                minimumSolvedToUnlock: 2,
                description: "Write input values to output.",
                code:
`; Now that you understand the \"subleq\" instruction, the
; \".data\" directive, and labels, you should be able to read
; values from input and write the exact same values out
; (hint: negate the value twice).
;
; For reference, here is the previous program that negates
; values on their way to output:

@loop:
subleq @OUT, @IN
subleq @zero, @zero, @loop

@zero: .data 0
`
                ,
                io: [
                    [1, 1],
                    [2, 2],
                    [3, 3]
                ]
            },
        ],
    },
    {
        groupTitle: "Arithmetic",
        list: [
            {
                title: "Addition",
                minimumSolvedToUnlock: 3,
                description: "Read two numbers and output their sum. Repeat.",
                io: [
                    [[1, 1], 2],
                    [[1, 2], 3],
                    [[1, -1], 0],
                    [[11, 25], 36],
                    [[82, 17], 99]
                ]
            },
            {
                title: "Subtraction",
                minimumSolvedToUnlock: 3,
                description: "Read two numbers (A, then B) and output A minus B. Repeat.",
                io: [
                    [[1, 1], 0],
                    [[1, 2], -1],
                    [[1, -1], 2],
                    [[11, 25], -14],
                    [[82, 17], 65]
                ]
            },
            {
                title: "Sign Function",
                minimumSolvedToUnlock: 3,
                description: "Read a number. If less than zero, output -1; if equal to zero, output 0; otherwise output 1. Repeat.",
                io: [
                    [-1, -1],
                    [0, 0],
                    [1, 1],
                    [7, 1],
                    [-29, -1],
                    [99, 1],
                    [-99, -1]
                ]
            },
            {
                title: "Multiplication",
                minimumSolvedToUnlock: 3,
                description: "Read two nonnegative numbers and output their product. Repeat.",
                io: [
                    [[1, 0], 0],
                    [[0, 1], 0],
                    [[1, 1], 1],
                    [[2, 3], 6],
                    [[7, 13], 91]
                ]
            },
            {
                title: "Division",
                minimumSolvedToUnlock: 3,
                description: "Read two positive numbers (A, then B), divide A by B, and output the quotient followed by the remainder. Repeat.",
                io: [
                    [[1, 1], [1, 0]],
                    [[9, 3], [3, 0]],
                    [[17, 2], [8, 1]],
                    [[67, 9], [7, 4]]
                ]
            }
        ]
    },
    {
        groupTitle: "Sequences",
        list: [
            {
                title: "Sequence Sum",
                minimumSolvedToUnlock: 8,
                description: "Read a sequence of positive numbers and output their sum. Repeat. Sequences are terminated by a zero.",
                io: [
                    [[1, 1, 1, 0], 3],
                    [[1, 2, 3, 0], 6],
                    [[3, 5, 7, 11, 0], 26],
                    [[53, 13, 22, 9, 0], 97]
                ]
            },
            {
                title: "Sequence Cardinality",
                minimumSolvedToUnlock: 8,
                description: "Read a sequence of positive numbers and output the count of numbers. Repeat. Sequences are terminated by a zero.",
                io: [
                    [[0], 0],
                    [[1, 0], 1],
                    [[3, 4, 0], 2],
                    [[9, 2, 7, 13, 26, 0], 5],
                ]
            },
            {
                title: "Number to Sequence",
                minimumSolvedToUnlock: 8,
                description: "Read a number and then output that many 1s, followed by a 0. Repeat.",
                io: [
                    [0, 0],
                    [1, [1, 0]],
                    [2, [1, 1, 0]],
                    [5, [1, 1, 1, 1, 1, 0]],
                    [3, [1, 1, 1, 0]],
                    [7, [1, 1, 1, 1, 1, 1, 1, 0]]
                ]
            }
        ]
    },
    {
        groupTitle: "Advanced Techniques",
        list: [
            {
                title: "Self-Modifying Code",
                minimumSolvedToUnlock: 11,
                description: "Output the program's compiled code byte-by-byte.",
                code:
`; Label expressions can include an optional offset, for
; example:
;
;   subleq @loop+1, @one
;
; This is useful in self-modifying code. Each \"subleq\"
; instruction is stored as 3 consecutive addresses: ABC
; (for mem[A] = mem[A] - mem[B], with potential branch
; to C).
;
; The sample program below reads its own compiled code
; and outputs it by incrementing the second address of
; the instruction at @loop (i.e. modifying address
; @loop+1).

@loop:
subleq @tmp, 0           ; Second address (initially zero) will be incremented
subleq @OUT, @tmp        ; Output the value
subleq @loop+1, @n_one   ; Here is where the increment is performed
subleq @tmp, @tmp, @loop

@tmp: .data 0
@n_one: .data -1
`
                ,
                io: [
                    [0, [12, 1, 3, -2, 12, 6, 1, 13, 9, 12, 12, 0]]
                ]
            },
            {
                title: "Stack Memory",
                minimumSolvedToUnlock: 12,
                description: "Read 3 values from input and then output the values in reverse order.",
                code:
`; This program implements a first-in, first-out stack by
; modifying the read and write addresses of the
; instructions that interact with the stack.
;
; The program pushes 3 (defined by @count) input
; values onto the stack and then pops them off
; (outputting them in reverse order).

; The first address of this instruction (which starts
; pointing to @stack) will be incremented with each
; write to the stack
@stack_push:
subleq @stack, @IN
subleq @count, @one, @prepare_to_pop

; Modify the instruction at @stack_push (increment
; target address)
subleq @stack_push, @n_one
subleq @tmp, @tmp, @stack_push

; Prepare to start popping values off of the stack by
; copying the current stack position to @stack_pop+1
@prepare_to_pop:
subleq @tmp, @stack_push
subleq @stack_pop+1, @tmp

; Read a value from the stack (note: the second address
; of this instruction is repeatedly decremented)
@stack_pop:
subleq @OUT, 0

; Decrement stack address in the instruction at @stack_pop
subleq @stack_pop+1, @one
subleq @tmp, @tmp, @stack_pop

; Constants
@one: .data 1
@n_one: .data -1

; Variables
@tmp: .data 0
@count: .data 3

; Base of stack (stack will grow upwards)
@stack: .data 0
`
                ,
                io: [
                    [[3, 5, 7], [7, 5, 3]]
                ]
            }
        ]
    },
    {
        groupTitle: "Sequence Manipulation",
        list: [
            {
                title: "Reverse Sequence",
                minimumSolvedToUnlock: 13,
                description: "Read a sequence of positive numbers (terminated by a zero) and output the sequence in reverse order (with zero terminator). Repeat.",
                io: [
                    [[1, 2, 3, 0], [3, 2, 1, 0]],
                    [[3, 2, 1, 0], [1, 2, 3, 0]],
                    [[3, 5, 7, 11, 13, 15, 17, 0], [17, 15, 13, 11, 7, 5, 3, 0]]
                ]
            }
            // {
            //     title: "Indicator Function",
            //     minimumSolvedToUnlock: 13,
            //     description: "Read set \"A\" of positive numbers (the set is terminated by a zero). Then read a sequence of positive numbers (also zero-terminated) and for each number output 1 if the number is in set \"A\" or 0 otherwise. Repeat.",
            //     io: [
            //         [[0, 1, 2, 0], [0, 0]],
            //         [[2, 4, 6, 8, 0, 6, 7, 8, 0], [1, 0, 1]],
            //         [[3, 5, 7, 11, 0, 5, 6, 7, 8, 10, 11, 12, 0], [1, 0, 1, 0, 0, 1, 0]]]
            // }
        ]
    }
];