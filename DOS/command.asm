%include "struct.inc"
ORG 0x0100
autoexec_command_length EQU 12
command_com_length EQU 1024
command_buffer_length EQU 32
STI
MOV BX,command_text
call print_text
PUSHA
MOV AX,0x50
MOV ES,AX
MOV DI,0x100
MOV AX,CS
MOV DS,AX
MOV SI,0x100
MOV CX,command_com_length
REP MOVSB
MOV AL,[jmp_to_command_com_start]
MOV [ES:0x100],AL
MOV AX,[jmp_to_command_com_start+1]
MOV [ES:0x100+1],AX
MOV AX,[jmp_to_command_com_start+3]
MOV [ES:0x100+3],AX
;Copy this to 0x600 for dos.asm's exit interrupt
POPA
jmp_to_command_com_start:
JMP 0x50:command_com_start;Jump to start address
command_com_start:
JMP run_autoexec
command_com_next:
MOV byte [DS:interrupt_table_addr+interrupt_space4],0;Init run program's flag
MOV byte [DS:interrupt_table_addr+interrupt_space5],1;Init print flag
MOV byte [DS:interrupt_table_addr+keyboard_buffer_pointer],0;Init pointer
MOV word [DS:interrupt_table_addr+argument_pointer],interrupt_table_addr+argument_buffer
MOV byte [DS:interrupt_table_addr+argument_number],0;No argument at first
MOV byte [DS:command_buffer_pointer],0
call clear_program_name_buffer
MOV AX,0
MOV ES,AX
;ES 0
MOV BX,disk_text
call print_text_no_return
loop:
MOV BX,interrupt_table_addr+interrupt_space4
MOV AL,[DS:BX]
CMP AL,1
JE run_program_from_keyboard_buffer
STI
HLT
JMP loop
run_program:
CLI
;Disable interrupt
MOV BX,command_buffer_pointer
MOV AL,[DS:BX]
call clear_program_name_buffer
MOV AH,0
MOV BX,command_buffer
ADD AX,BX
MOV CH,0
MOV DL,0
turn_to_capital:
CMP BX,AX
JE turn_to_capital_end
MOV CL,[DS:BX]
CMP CL,' '
JE get_a_space
CMP CH,11
JE command_not_found;That's too long when you type a command (include a extra name)
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
MOV BX,interrupt_table_addr+program_name_buffer
MOV CL,CH
MOV CH,0
ADD BX,CX
POP CX
MOV [DS:BX],CL
POP BX
ADD CH,1
ADD BX,1
JMP turn_to_capital
save_arguments:
ADD BX,1;Skip this space
MOV CL,[DS:BX]
CMP BX,AX
JE save_arguments_end
CMP CL,' '
JE get_a_space
PUSH BX
MOV BX,[DS:interrupt_table_addr+argument_pointer];Get the address
MOV [DS:BX],CL
POP BX
ADD byte [DS:interrupt_table_addr+argument_pointer],1
JMP save_arguments
save_arguments_end:
call argument_end
turn_to_capital_end:
CMP CH,0;Pointer is zero
JE empty_command;It's empty so only re-print
MOV AX,0x00
MOV DX,0x00
int 0x13
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
MOV CX,0x00;ES is 0xF0 so address is 0xF00
MOV BX,interrupt_table_addr+program_name_buffer
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
JL command_not_found;Invalid cluster
MOV AH,0
PUSH AX
MOV AX,0x00
MOV DX,0x00
int 0x13
POP AX
call cluster_translate
MOV AH,0x02
;Read
MOV AL,0x06
;Sector number of each program
MOV DL,0x00
MOV BX,0x00
int 0x13
JC run_program_failed
STI
MOV AX,0x0E0
MOV DS,AX
MOV ES,AX
JMP 0x0E0:0x100;0x0F00
JMP loop
turn_next_char_not_save:
ADD BX,1
JMP turn_to_capital
get_a_space:
CMP CH,0
JE turn_next_char_not_save
CMP byte [DS:interrupt_table_addr+argument_number],0
JE the_first_argument
call argument_end;Add 0 for arguments
the_first_argument:
ADD byte [DS:interrupt_table_addr+argument_number],1
CMP word [DS:interrupt_table_addr+argument_pointer],interrupt_table_addr+argument_buffer+argument_length
JGE arguments_too_long
JMP save_arguments
arguments_too_long:
MOV BX,arguments_too_long_text
call print_text
MOV byte [DS:interrupt_table_addr+return_code],1
JMP command_com_start;Restart
run_program_from_keyboard_buffer:
PUSH CX
MOV CL,[DS:interrupt_table_addr+keyboard_buffer_pointer]
MOV CH,0
PUSH DS
PUSH ES
MOV AX,CS
MOV DS,AX
MOV ES,AX
MOV DI,command_buffer
MOV SI,interrupt_table_addr+keyboard_buffer
REP MOVSB
MOV AL,[DS:interrupt_table_addr+keyboard_buffer_pointer]
MOV [DS:command_buffer_pointer],AL
MOV byte [DS:interrupt_table_addr+keyboard_buffer_pointer],0
POP ES
POP DS
POP CX
JMP run_program
run_autoexec:
MOV AX,CS
MOV DS,AX
CMP byte [DS:interrupt_table_addr+run_autoexec_finished],1
JE command_com_next
MOV ES,AX
MOV AX,0
MOV DI,command_buffer
MOV SI,autoexec_command
MOV byte [DS:command_buffer_pointer],autoexec_command_length
MOV byte [DS:interrupt_table_addr+run_autoexec_finished],1
move_name:
MOVSB
ADD AX,1
CMP AX,autoexec_command_length
JE run_program
JMP move_name
clear_program_name_buffer:
PUSH AX
PUSH BX
MOV BX,interrupt_table_addr+program_name_buffer
clear_program_name_buffer_next:
MOV byte [DS:BX],' '
ADD BX,1
CMP BX,interrupt_table_addr+program_name_buffer+8
JE clear_program_name_buffer_next2
JMP clear_program_name_buffer_next
clear_program_name_buffer_next2:
MOV byte [DS:interrupt_table_addr+program_name_buffer+8],'C'
MOV byte [DS:interrupt_table_addr+program_name_buffer+9],'O'
MOV byte [DS:interrupt_table_addr+program_name_buffer+10],'M'
POP BX
POP AX
ret
argument_end:
PUSH BX
MOV BX,[DS:interrupt_table_addr+argument_pointer]
MOV byte [DS:BX],0;End of the argument string is 0
ADD BX,1
MOV [DS:interrupt_table_addr+argument_pointer],BX
POP BX
ret
turn_to_capital_hit_dot:
CMP DL,1;It already has a dot
JE command_not_found;Because you can't use dot in filename and command (in this system)
MOV byte [DS:interrupt_table_addr+program_name_buffer+8],' '
MOV byte [DS:interrupt_table_addr+program_name_buffer+9],' '
MOV byte [DS:interrupt_table_addr+program_name_buffer+10],' '
MOV CH,8
ADD BX,1
MOV DL,1;Is dot
JMP turn_to_capital
command_not_found:
MOV BX,command_not_found_text
call print_text
STI
JMP empty_command
run_program_failed:
MOV BX,run_program_failed_text
call print_text
MOV BX,interrupt_table_addr+interrupt_space4
MOV byte [DS:BX],0;Stop running program
JMP loop
empty_command:;You can add the code you want to exec when you type nothing
JMP command_com_next
turn_to_capital_verify:;DL=0 means we have not het a dot and we need to look if it's too long
CMP CH,8
JE command_not_found;Command is too long
JMP turn_to_capital_next
file_cmp:
;MOV BX,program_name
;MOV CX,0x600
PUSH CX
cmp_next:
CMP BX,interrupt_table_addr+program_name_buffer+11;Compare to know if it's equal Name's address + Length
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
%include "print.inc"
command_text:
db "Command v0.99",0x00
disk_text:
db "A:\>",0x00
run_program_failed_text:
db "Run program failed.",0x00
command_not_found_text:
db "Command not found.",0x00
arguments_too_long_text:
db "Arguments too long.",0x00
autoexec_command:
db "AUTOEXEC.COM"
command_buffer:
times command_buffer_length db 0x00
command_buffer_pointer:
db 0
times command_com_length-($-$$) db 0
times 8192-($-$$) db 0