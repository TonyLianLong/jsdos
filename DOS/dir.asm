%include "struct.inc"
ORG 0x100
;DIR
;For test
MOV BX,run_success_text
call print_text
MOV AX,0x4C00
int 0x21
loop:
JMP loop
print_char:
;print AL
PUSH BX
PUSH AX
MOV AH,0x0E
MOV BH,0
MOV BL,0
INT 0x10
POP AX
POP BX
ret
print_text:
PUSH AX
PUSH BX
MOV AH,0x0E
MOV AL,byte [BX]
CMP byte AL,0
je print_finish
MOV BH,0
MOV BL,0
INT 0x10
POP BX
POP AX
ADD BX,1
JMP print_text
print_finish:
call return
POP BX
POP AX
ret
return:
PUSH AX
PUSH BX
PUSH CX
PUSH DX
MOV AH,0x0E
MOV AL,0x0D
MOV BH,0
MOV BL,0
INT 0x10
MOV AL,0x0A
INT 0x10
POP DX
POP CX
POP BX
POP AX
ret
print_text_no_return:
PUSH AX
PUSH BX
MOV AH,0x0E
MOV AL,byte [BX]
CMP byte AL,0
je print_finish_no_return
MOV BH,0
MOV BL,0
INT 0x10
POP BX
POP AX
ADD BX,1
JMP print_text_no_return
print_finish_no_return:
POP BX
POP AX
ret
run_success_text:
db "DIR",0x00
times 2048-($-$$) db 0