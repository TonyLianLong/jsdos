ORG 0x0100
CLI
MOV SS,AX
MOV SP,0x0500
MOV AL,'g'
call print_char
MOV AH,0x3
MOV BX,0
INT 0x10
ADD DL,1
CMP DL,24
JG new_line
MOV AH,0x2
MOV BH,0
MOV CL,0
INT 0x10
JMP not_new_line
new_line:
call return
not_new_line:
;MOV BX,command_text
;call print_text
MOV AX,0
MOV ES,AX
MOV word [ES:(0x08*4)],timer_intrrrupt;Offset
MOV AX,CS
MOV word [ES:(0x08*4+2)],AX;Segment
MOV word [ES:(0x09*4)],keyboard_interrupt;Offset
MOV word [ES:(0x09*4+2)],AX;Segment
MOV word [ES:(0x21*4)],dos_interrupt;Offset
MOV word [ES:(0x21*4+2)],AX;Segment
in al,0x21
PUSH AX
mov	al,0b00000000;Enable all of the interrupt of the master 8259A
out 0x21,al;Master 8259A,OCW1
mov	al,0b00000000;Enable all of the interrupt of the slave 8259A
in al,0x0A1
PUSH AX
out	0x0A1,al;Slave 8259A,OCW1
STI
call hide_cursor
MOV BX,disk_text
call print_text_no_return
loop:
MOV BX,interrupt_space4
MOV AL,[DS:BX]
CMP AL,1
JE run_program
JMP loop
run_program:
POP AX
out 0x21,al
POP AX
out	0x0A1,al
CLI
MOV AX,0x00A0
MOV ES,AX
MOV AH,0x02
;Read
MOV AL,0x02
;Sector number of each program
MOV CH,0x00
MOV CL,0x04
;Address of the program on disk
MOV DH,0x00
MOV DL,0x00
MOV BX,0x00
int 0x13
JC run_program_failed
STI
MOV AX,0x090
MOV DS,AX
MOV ES,AX
MOV AX,0
MOV SS,AX
MOV SP,0x1000
JMP 0x090:0x100
JMP loop
run_program_failed:
MOV BX,run_program_failed_text
call print_text
MOV BX,interrupt_space4
MOV byte [DS:BX],0;Stop running program
JMP loop
print_char:
;print AL
PUSH BX
PUSH AX
PUSH CX
MOV AH,0x0A
MOV BH,0
MOV BL,0
MOV CX,1
INT 0x10
POP CX
POP AX
POP BX
ret
print_text:
PUSH AX
PUSH BX
PUSH CX
MOV CX,1
MOV AH,0x0A
MOV AL,byte [BX]
CMP byte AL,0
je print_finish
MOV BH,0
MOV BL,0
INT 0x10
POP CX
POP BX
POP AX
ADD BX,1
JMP print_text
print_finish:
call return
POP CX
POP BX
POP AX
ret
return:
PUSH AX
PUSH BX
PUSH CX
MOV CX,1
MOV AH,0x0E
MOV AL,0x0D
MOV BH,0
MOV BL,0
INT 0x10
MOV AL,0x0A
INT 0x10
POP CX
POP BX
POP AX
ret
print_text_no_return:
PUSH AX
PUSH BX
PUSH CX
MOV CX,0
MOV AH,0x0A
MOV AL,byte [BX]
CMP byte AL,0
je print_finish_no_return
MOV BH,0
MOV BL,0
INT 0x10
POP CX
POP BX
POP AX
ADD BX,1
JMP print_text_no_return
print_finish_no_return:
POP CX
POP BX
POP AX
ret
show_cursor:
PUSH AX
PUSH CX
MOV AH,0x01
MOV AL,0x00
MOV CX,0x0607
INT 0x10
POP CX
POP AX
ret
hide_cursor:
PUSH AX
PUSH CX
MOV AH,0x01
MOV AL,0x00
MOV CX,0x0706
;OR MOV CX,0x2706
;http://en.wikipedia.org/wiki/INT_10H
INT 0x10
POP CX
POP AX
ret
command_text:
db "Command v0.99",0x00
disk_text:
db "A:\>",0x00
run_program_failed_text:
db "Run program failed.",0x00
times 512-($-$$) db 0
;Interrupt Sector
;timer interrupt
timer_intrrrupt:
;MOV BX,interrupt_text
;call print_text
PUSH AX
PUSH BX
PUSH DS
MOV AX,0x40
MOV DS,AX
MOV BX,interrupt_space0
MOV AL,[DS:BX]
CMP AL,9
;Cursor flash
JE deal_interrupt
ADD AL,1
MOV [DS:BX],AL;Add interrupt_space0
stop_interrupt:
POP DS
POP BX
POP AX
mov al,20h;EOI
out 20h,al;Send EOI to master 8259A
out 0A0h,al;Send EOI to slave 8259A
iret
deal_interrupt:
MOV BX,interrupt_space0
MOV byte [DS:BX],0;Set interrupt_space0 to zero
MOV BX,interrupt_space1
MOV AL,[DS:BX]
CMP AL,0
JE hide_cursor_interrupt
call show_cursor
MOV byte [DS:BX],0
JMP stop_interrupt
hide_cursor_interrupt:
call hide_cursor
MOV byte [DS:BX],1
JMP stop_interrupt
keyboard_interrupt:
PUSH AX
PUSH BX
PUSH CX
PUSH DS
MOV AX,0x40
MOV DS,AX
in al,60h;Keyboard port
;Find ASCII
MOV BX,keyboard_table+1
MOV CX,special_keyboard_table
re_match:
PUSH BX
MOV BX,CX
MOV AH,[DS:BX]
POP BX
cmp al,ah
JE deal_with_special_key
CMP AH,0
JNE add_cx
;If special keys' table is end,ignore.
add_cx_next:
MOV AH,[DS:BX]
CMP AH,0
JE stop_keyboard_interrupt
;If normal keys' table is end,exit.
cmp al,ah
je print_keyboard
CMP AH,0
JNE add_bx
add_bx_next:
JMP re_match
stop_keyboard_interrupt:
mov al,20h;EOI
out 20h,al;Send EOI to master 8259A
out 0A0h,al;Send EOI to slave 8259A
POP DS
POP CX
POP BX
POP AX
iret
add_cx:
ADD CX,3
JMP add_cx_next
add_bx:
ADD BX,2
JMP add_bx_next
print_keyboard:
PUSH BX
;Read caps lock
MOV BX,interrupt_space2
MOV AH,[DS:BX];Caps lock
MOV BX,interrupt_space3
MOV AL,[DS:BX];Shift
XOR AH,AL;Shift and Caps lock
;S C CAPITAL
;1 1 0
;0 1 1
;1 0 1
;0 0 0
POP BX
;Read ASCII code
ADD BX,-1
;DW is opposite
MOV AL,[DS:BX]
;Compare
CMP AH,1
JE capital_case1
keyboard_print_char:
MOV BX,interrupt_space5
MOV AH,[DS:BX]
CMP AH,0
JE stop_keyboard_interrupt
;Stop if program does not allow this program to print text
call print_char
JMP stop_keyboard_interrupt
capital_case1:
CMP AL,'a'
JL keyboard_print_char
;Jump If Less
CMP AL,'z'
JG keyboard_print_char
;Jump If Bigger(greater)
ADD AL,-('a'-'A')
JMP keyboard_print_char
press_enter_key:
;Enter
PUSH AX
MOV BX,interrupt_space5
MOV AL,[DS:BX]
CMP AL,0
JE press_enter_key_next
call return
press_enter_key_next:
MOV BX,interrupt_space4
MOV AL,[DS:BX]
CMP AL,1
JE press_enter_key_program_is_running
MOV BX,interrupt_space4
MOV byte [DS:BX],1
;Run program.
press_enter_key_program_is_running:
POP AX
ret
press_caps_lock_key:
MOV BX,interrupt_space2
;MOV AL,[DS:BX]
;ADD AL,'0'
;call print_char
NOT byte [DS:BX]
AND byte [DS:BX],1
ret
press_backspace_key:
MOV AL,0x08
call print_char
MOV AL,0x20
call print_char
MOV AL,0x08
call print_char
ret
press_shift_key:
MOV BX,interrupt_space3
MOV byte [DS:BX],1
ret
release_shift_key:
MOV BX,interrupt_space3
MOV byte [DS:BX],0
ret
deal_with_special_key:
ADD CX,1
MOV BX,CX
MOV AX,[DS:BX]
call [DS:BX]
JMP stop_keyboard_interrupt
dos_interrupt:
PUSH AX
PUSH BX
CMP AH,0x4C
JE exit_dos_program
stop_dos_interrupt:
mov al,20h;EOI
out 20h,al;Send EOI to master 8259A
out 0A0h,al;Send EOI to slave 8259A
POP BX
POP AX
iret
exit_dos_program:
POP BX
POP AX
mov al,20h;EOI
out 20h,al;Send EOI to master 8259A
out 0A0h,al;Send EOI to slave 8259A
MOV BX,interrupt_space4
MOV AX,0x40
MOV DS,AX
MOV ES,AX
MOV byte [DS:BX],0
MOV BX,interrupt_space5
MOV byte [DS:BX],1
POP AX
POP AX
MOV AX,0
;Fake POP
PUSH 0x40;IP
PUSH 0x100;CS
iret
;Fake iret
;JMP 0x40:0x100
interrupt_space0:db 0
interrupt_space1:db 0
;The first one is for interrupt's counter,the second one is for cursor(hide or show)
interrupt_space2:db 0
;This one is for caps lock.
interrupt_space3:db 0
;This one is for shift.
interrupt_space4:db 0
;This one is for the flag to run program.
interrupt_space5:db 1
;This one is for the program to tell this program if it allows this program to print text while user is using keyboard.
%include "keymap.asm"
times 1024-($-$$) db 0
