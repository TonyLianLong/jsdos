ORG 0x0100
CLI
CLD
MOV SS,AX
MOV SP,0x0600
MOV BX,command_text
call print_text
run_cmd:
MOV AX,0
MOV ES,AX
MOV AX,CS
MOV word [ES:(0x08*4)],timer_intrrrupt;Offset
MOV word [ES:(0x08*4+2)],AX;Segment
MOV word [ES:(0x09*4)],keyboard_interrupt;Offset
MOV word [ES:(0x09*4+2)],AX;Segment
MOV word [ES:(0x21*4)],dos_interrupt;Offset
MOV word [ES:(0x21*4+2)],AX;Segment
mov	al,0b00000000;Enable all of the interrupt of the master 8259A
out 0x21,al;Master 8259A,OCW1
mov	al,0b00000000;Enable all of the interrupt of the slave 8259A
out	0x0A1,al;Slave 8259A,OCW1
MOV byte [DS:interrupt_space4],0;Init run program's flag
MOV byte [DS:interrupt_space5],1;Init print flag
MOV byte [DS:keyboard_buffer_pointer],0;Init pointer
call clear_program_name_buffer
STI
call hide_cursor
MOV BX,disk_text
call print_text_no_return
loop:
MOV BX,interrupt_space4
MOV AL,[DS:BX]
CMP AL,1
JE run_program
HLT
JMP loop
run_program:
CLI
;Disable interrupt
MOV BX,keyboard_buffer_pointer
MOV AL,[DS:BX]
CMP AL,0
JE empty_command;It's empty so only re-print
call clear_program_name_buffer
MOV AH,0
MOV BX,keyboard_buffer
ADD AX,BX
MOV CH,0
MOV DL,0
turn_to_capital:
CMP BX,AX
JE turn_to_capital_end
MOV CL,[DS:BX]
CMP CL,' '
JE turn_to_capital_end;Stop when it is a space
CMP CH,11
JE command_not_found;That's too long when you type a command (include extra name)
CMP CL,'.'
JE turn_to_capital_hit_dot
CMP DL,0
JE turn_to_capital_verify
turn_to_capital_next:
CMP CL,'a'
JL turn_next_char
CMP CL,'z'
JG turn_next_char
ADD CL,('A'-'a')
turn_next_char:
PUSH BX
PUSH CX
MOV BX,program_name_buffer
MOV CL,CH
MOV CH,0
ADD BX,CX
POP CX
MOV [DS:BX],CL
POP BX
ADD CH,1
ADD BX,1
JMP turn_to_capital
turn_to_capital_end:
MOV AX,0x00
MOV DX,0x00
int 0x13
;Address:0x3CA00
;H 0
;S 5
;C 6
MOV AX,0x00E0
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
MOV CX,0x00;ES is 0xE0 so address is 0xE00
MOV BX,program_name_buffer
next_file:
CMP CX,0x1000
JE command_not_found
PUSH BX
call file_cmp
POP BX
CMP AH,0
JE find_file
ADD CX,0x20
JMP next_file
find_file:
MOV BX,CX
ADD BX,0x1A
MOV AL,[ES:BX]
CMP AL,2
JL command_not_found;Invalid sector
MOV AH,0
PUSH AX
MOV AX,0x00
MOV DX,0x00
int 0x13
POP AX
call cluster_translate
MOV AH,0x02
;Read
MOV AL,0x02
;Sector number of each program
MOV DL,0x00
MOV BX,0x00
int 0x13
JC run_program_failed
STI
MOV AX,0x0D0
MOV DS,AX
MOV ES,AX
JMP 0x0D0:0x100;0x0E00
JMP loop
clear_program_name_buffer:
PUSH AX
PUSH BX
MOV BX,program_name_buffer
clear_program_name_buffer_next:
MOV byte [DS:BX],' '
ADD BX,1
CMP BX,program_name_buffer+8
JE clear_program_name_buffer_next2
JMP clear_program_name_buffer_next
clear_program_name_buffer_next2:
MOV byte [DS:program_name_buffer+8],'C'
MOV byte [DS:program_name_buffer+9],'O'
MOV byte [DS:program_name_buffer+10],'M'
POP BX
POP AX
ret
turn_to_capital_hit_dot:
CMP DL,1;It already has a dot
JE command_not_found;Because you can't use dot in filename and command (in this system)
MOV byte [DS:program_name_buffer+8],' '
MOV byte [DS:program_name_buffer+9],' '
MOV byte [DS:program_name_buffer+10],' '
MOV CH,8
ADD BX,1
MOV DL,1;Is dot
JMP turn_to_capital
command_not_found:
MOV BX,command_not_found_text
call print_text
JMP empty_command
run_program_failed:
MOV BX,run_program_failed_text
call print_text
MOV BX,interrupt_space4
MOV byte [DS:BX],0;Stop running program
JMP loop
empty_command:;You can add the code you want to exec when you type nothing
JMP run_cmd
turn_to_capital_verify:
CMP CH,8
JE command_not_found;Command is too long
JMP turn_to_capital_next
file_cmp:
;MOV BX,program_name
;MOV CX,0x600
PUSH CX
cmp_next:
CMP BX,program_name_buffer+11;Compare to know if it's equal Name's address + Length
JE cmp_true
MOV AL,[DS:BX]
ADD BX,1
PUSH BX
MOV BX,CX
ADD CX,1
MOV AH,[ES:BX]
CMP AH,AL
POP BX
JE cmp_next
POP CX
cmp_false:
MOV AH,1
ret
cmp_true:
POP CX
PUSH CX
ADD CX,1
MOV BX,CX
POP CX
CMP byte [ES:BX],0x0F;Erased
JE cmp_false
MOV AH,0
ret
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
command_text:
db "Command v0.99",0x00
disk_text:
db "A:\>",0x00
run_program_failed_text:
db "Run program failed.",0x00
command_not_found_text:
db "Command not found.",0x00
;times 512-($-$$) db 0
;You can save things in both sector
;Interrupt Sector
;timer interrupt
timer_intrrrupt:
;MOV BX,interrupt_text
;call print_text
PUSH AX
PUSH BX
PUSH DS
MOV AX,0x50
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
MOV AX,0x50
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
MOV BX,keyboard_buffer_pointer
MOV AH,[DS:BX]
CMP AH,keyboard_buffer_length
;You can save default 32 chars.
JE stop_keyboard_interrupt;It's full
MOV BX,keyboard_buffer
PUSH AX
MOV AL,AH
MOV AH,0
ADD AX,BX
MOV BX,AX
POP AX
MOV [DS:BX],AL
;Save char to buffer
MOV BX,keyboard_buffer_pointer
MOV AH,[DS:BX]
ADD AH,1
MOV [DS:BX],AH
;Buffer's pointer
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
MOV BX,keyboard_buffer_pointer
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
MOV AX,0x50
MOV DS,AX
MOV ES,AX
MOV byte [DS:BX],0
POP AX
POP AX
MOV AX,0
;Fake POP
PUSH 0x50;CS
PUSH run_cmd;IP
;Replace the data in memory and execute iret to jump to run_cmd
iret
;JMP 0x50:0x100
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
keyboard_buffer_length EQU 32
keyboard_buffer_pointer:db 0
keyboard_buffer:times keyboard_buffer_length db 0
;Keyboard buffer length default is 32
program_name_buffer:db "        COM";Look clear_program_name_buffer
%include "keymap.asm"
times 2048-($-$$) db 0
times 8192-($-$$) db 0