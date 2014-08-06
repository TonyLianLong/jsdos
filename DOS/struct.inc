keyboard_buffer_length EQU 32
interrupt_table_addr EQU 0x7E00+0x600-0x500
;In command.asm because we use DS
interrupt_table_seg EQU 0x7E0+0x60
;dos.sys + 0x600(1536)
argument_length EQU 32
argument_max_num EQU 4
struc interrupt_table_type
interrupt_space0:resb 1
interrupt_space1:resb 1
;The first one is for interrupt's counter,the second one is for cursor(hide or show)
interrupt_space2:resb 1
;This one is for caps lock.
interrupt_space3:resb 1
;This one is for shift.
interrupt_space4:resb 1
;This one is for the flag to run program.
interrupt_space5:resb 1
;This one is for the program to tell this program if it allows this program to print text while user is using keyboard.
return_code:resb 1
argument_number:resb 1
argument_pointer:resb 2;16 bit
argument_buffer:resb argument_length*argument_max_num
run_autoexec_finished:resb 1
;The flag for autoexec(have run = 1,have not run = 0)
keyboard_buffer_pointer:resb 1
keyboard_buffer:resb keyboard_buffer_length
;Keyboard buffer length default is 32
program_name_buffer:resb 11;Look clear_program_name_buffer
endstruc