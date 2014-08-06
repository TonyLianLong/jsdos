%include "struct.inc"
ORG 0x100
MOV AX,0x50
MOV DS,AX
MOV AL,[DS:interrupt_table_addr+argument_number]
MOV AH,0
CMP AL,0
JE program_end
MOV BX,interrupt_table_addr+argument_buffer
print_argument:
call print_text_no_return_with_strlen
ADD BX,CX
ADD BX,1
ADD AH,1
CMP AH,AL
JNE next_argument
program_end:
call return
MOV AX,0x4C00
int 0x21
next_argument:
PUSH AX
MOV AL,' '
call print_char
POP AX
JMP print_argument
%include "print.inc"
print_text_no_return_with_strlen:
PUSH AX
PUSH BX
MOV CX,0
MOV AH,0x0E
MOV AL,byte [BX]
CMP byte AL,0
je print_finish_no_return_with_strlen
MOV BH,0
MOV BL,0
INT 0x10
POP BX
POP AX
ADD BX,1
ADD CX,1
JMP print_text_no_return_with_strlen
print_finish_no_return_with_strlen:
POP BX
POP AX
ret
times 2048-($-$$) db 0