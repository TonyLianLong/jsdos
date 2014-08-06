%include "struct.inc"
;In this file,we don't need interrupt_table_addr in struct.inc
ORG 0x100
CLI
MOV AX,0
MOV ES,AX
MOV AX,CS
MOV word [ES:(0x08*4)],timer_intrrrupt;Offset
MOV word [ES:(0x08*4+2)],AX;Segment
MOV word [ES:(0x09*4)],keyboard_interrupt;Offset
MOV word [ES:(0x09*4+2)],AX;Segment
MOV word [ES:(0x21*4)],dos_interrupt;Offset
MOV word [ES:(0x21*4+2)],AX;Segment
mov	al,0b00000001;Enable all of the interrupt of the master 8259A
out 0x21,al;Master 8259A,OCW1
mov	al,0b00000000;Enable all of the interrupt of the slave 8259A
out	0x0A1,al;Slave 8259A,OCW1
STI
MOV BX,in_dos_text
call reset_disk
;Address:0x3CA00
;H 0
;S 5
;C 6
MOV AX,0x00F0
MOV ES,AX
MOV AH,0x02
MOV AL,0x01
;Sector number
MOV CH,13
MOV CL,18
MOV DX,0
MOV BX,0x00
int 0x13
JC run_program_failed
MOV BX,0
PUSH BX
next_file:
MOV CX,command_name
CMP BX,512
JE command_not_found;There is no command.com
compare_next_char:
CMP CX,command_name+11
JE compare2
MOV AL,[ES:BX];AL name in root directory
PUSH BX
MOV BX,CX
MOV AH,[BX];AH name in command_name
POP BX
CMP AL,AH
JNE not_this_file
ADD BX,1
ADD CX,1
JMP compare_next_char
find_file:
POP BX
call cluster_translate
call reset_disk
CLI
MOV AH,0x02
;Read
MOV AL,2
;Sector number of each program
MOV DL,0x00
MOV BX,0x00
int 0x13
JC run_program_failed
MOV AX,0x0E0
MOV DS,AX
MOV ES,AX
JMP 0x0E0:0x100;0x0F00
loop:
JMP loop
reset_disk:
PUSHA
MOV AX,0x00
MOV DX,0x00
int 0x13
JC run_program_failed
POPA
ret
not_this_file:
POP BX
ADD BX,0x20
PUSH BX;Turn to start address
JMP next_file
compare2:
POP BX
PUSH BX;Turn to start
CMP byte [ES:BX],0xE5
JE not_this_file
ADD BX,0xB
CMP byte [ES:BX],0x0F
JE not_this_file
ADD BX,-0xB+0x1A
MOV AX,[ES:BX];Save cluster id
CMP AX,0x0002
JL not_this_file
ADD BX,-0x1A+0x1C
CMP dword [ES:BX],2048
JG not_this_file
JMP find_file
cluster_translate:
;0x40A00+cluster*8192
;cluster is in AX
;It will set CH CL and DH.
MOV CH,14
MOV CL,14
MOV DH,0x00
cluster_translate_start:
CMP AX,2
JLE cluster_translate_finished
ADD CL,16
ADD AX,-1
CMP CL,18
JLE cluster_translate_start
CMP DH,0x1
JE next_cylinder
cluster_translate_next:
NOT DH
AND DH,0x1
ADD CL,-18
JMP cluster_translate_start
cluster_translate_finished:
ret
next_cylinder:
ADD CH,1
JMP cluster_translate_next
in_dos_text:
db "DOS",0x00
%include "print.inc"
show_cursor:
PUSH AX
PUSH CX
MOV AH,0x01
MOV AL,0x00
MOV CX,0x0607
;INT 0x10
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
;INT 0x10
POP CX
POP AX
ret
command_not_found:
MOV BX,command_not_found_text
call print_text
JMP loop
run_program_failed:
MOV BX,run_program_failed_text
call print_text
JMP loop
command_not_found_text:
db "There is no command.com.",0x00
run_program_failed_text:
db "Run command.com failed.",0x00
command_name:
db "COMMAND COM"
;times 512-($-$$) db 0
;You can save things in both sector
;Interrupt Sector
;timer interrupt
timer_intrrrupt:
;MOV BX,interrupt_text
;call print_text
PUSHA
PUSH DS
MOV AX,CS
MOV DS,AX
MOV BX,interrupt_table+interrupt_space0
MOV AL,[DS:BX]
CMP AL,9
;Cursor flash
JE deal_interrupt
ADD AL,1
MOV [DS:BX],AL;Add interrupt_space0
stop_interrupt:
mov al,20h;EOI
out 20h,al;Send EOI to master 8259A
out 0A0h,al;Send EOI to slave 8259A
PUSH DS
POPA
iret
deal_interrupt:
MOV BX,interrupt_table+interrupt_space0
MOV byte [DS:BX],0;Set interrupt_space0 to zero
MOV BX,interrupt_table+interrupt_space1
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
PUSH DX
PUSH DS
MOV AX,CS
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
POP DX
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
MOV BX,interrupt_table+interrupt_space2
MOV AH,[DS:BX];Caps lock
MOV BX,interrupt_table+interrupt_space3
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
MOV BX,interrupt_table+keyboard_buffer_pointer
MOV AH,[DS:BX]
CMP BX,interrupt_table+keyboard_buffer_length
;You can save default 32 chars.
JE stop_keyboard_interrupt;It's full
MOV BX,interrupt_table+keyboard_buffer
PUSH AX
MOV AL,AH
MOV AH,0
ADD AX,BX
MOV BX,AX
POP AX
MOV [DS:BX],AL
;Save char to buffer
MOV BX,interrupt_table+keyboard_buffer_pointer
MOV AH,[DS:BX]
ADD AH,1
MOV [DS:BX],AH
;Buffer's pointer
MOV BX,interrupt_table+interrupt_space5
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
MOV BX,interrupt_table+interrupt_space5
MOV AL,[DS:BX]
CMP AL,0
JE press_enter_key_next
call return
press_enter_key_next:
MOV BX,interrupt_table+interrupt_space4
MOV AL,[DS:BX]
CMP AL,1
JE press_enter_key_program_is_running
MOV BX,interrupt_table+interrupt_space4
MOV byte [DS:BX],1
;Run program.
press_enter_key_program_is_running:
POP AX
ret
press_caps_lock_key:
MOV BX,interrupt_table+interrupt_space2
;MOV AL,[DS:BX]
;ADD AL,'0'
;call print_char
NOT byte [DS:BX]
AND byte [DS:BX],1
ret
press_backspace_key:
MOV BX,interrupt_table+keyboard_buffer_pointer
MOV AL,[DS:BX]
CMP AL,0
JE press_backspace_key_end;It's empty
ADD AL,-1
MOV [DS:BX],AL
MOV AL,0x08
call print_char
MOV AL,0x20
call print_char
MOV AL,0x08
call print_char
press_backspace_key_end:
ret
press_shift_key:
MOV BX,interrupt_table+interrupt_space3
MOV byte [DS:BX],1
ret
release_shift_key:
MOV BX,interrupt_table+interrupt_space3
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
PUSH DS
PUSH AX
MOV AX,CS
MOV DS,AX
POP AX
CMP AH,0x4C
JE exit_dos_program
stop_dos_interrupt:
mov al,20h;EOI
out 20h,al;Send EOI to master 8259A
out 0A0h,al;Send EOI to slave 8259A
POP DS
POP BX
POP AX
iret
exit_dos_program:
POP DS
POP BX
POP AX
mov al,20h;EOI
out 20h,al;Send EOI to master 8259A
out 0A0h,al;Send EOI to slave 8259A
MOV AX,0xD0
MOV DS,AX
MOV ES,AX
MOV BX,interrupt_table+return_code
MOV [DS:BX],AL
MOV BX,interrupt_table+interrupt_space4
MOV byte [DS:BX],0
POP AX
POP AX
MOV AX,0
;Fake POP
PUSH 0x50;CS
PUSH 0x100;IP
;Replace the data in memory and execute iret to jump to run_cmd
iret
;JMP 0xD0:0x100
%include "keymap.asm"
times 1536-($-$$) db 0
interrupt_table:
istruc interrupt_table_type
 at interrupt_space5, db 1
 at keyboard_buffer_pointer, db 0
 at keyboard_buffer,times keyboard_buffer_length db  0
 at program_name_buffer, db "        COM"
iend
times 2048-($-$$) db 0
times 8192-($-$$) db 0