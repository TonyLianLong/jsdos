ORG 0x7c00
;DOS loader
JMP short loader
nop
;Jump to loader
db 0x44, 0x4F, 0x53, 0x20, 0x20, 0x20, 0x20, 0x20, 0x00, 0x02, 0x10, 0x05, 0x00, 0x02, 0x00, 0x02, 
db 0x40, 0x0B, 0xF8, 0xF0, 0x00, 0x3D, 0x00, 0x10, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
db 0x00, 0x00, 0x00, 0x29, 0x34, 0x61, 0x53, 0x09, 0x4E, 0x4F, 0x20, 0x4E, 0x41, 0x4D, 0x45, 0x20, 
db 0x20, 0x20, 0x20, 0x46, 0x41, 0x54, 0x31, 0x36, 0x20, 0x20, 0x20
loader:
;Init
CLI
MOV AX,0
MOV SS,AX
MOV SP,0x7C00;Segment
MOV AH,0x6
MOV AL,0
MOV CX,0
MOV DH,24
MOV DL,79
MOV BH,7
MOV BL,0
int 0x10;Clear Screen
MOV AH,0x2
MOV BH,0
MOV DX,0
int 0x10;Set cursor
MOV AX,0
MOV BX,0
MOV CX,0
MOV DX,0
;Print
MOV BX,boot_text
call print_text
call reset_disk
; call get_disk_status
;Floppy Size:0x168000
;Address:0x3CA00
;H 0
;S 5
;C 6
MOV AX,0x060
MOV ES,AX
MOV AH,0x02
MOV AL,0x01
;Sector number
MOV CH,13
MOV CL,18
MOV DH,0
MOV DL,0
MOV BX,0x00
int 0x13
JC read_failed
MOV BX,check_disk_success_text
call print_text
;Check the first file
cmp_start:
MOV BX,program_name
MOV CX,0x600
cmp_next:
CMP BX,program_name+11
JE cmp2_start
MOV AL,[DS:BX]
ADD BX,1
PUSH BX
MOV BX,CX
ADD CX,1
MOV AH,[DS:BX]
CMP AH,AL
POP BX
JE cmp_next
JMP no_such_file
cmp2_start:
MOV BX,CX
ADD BX,0x1C-0xB
MOV AX,[DS:BX]
CMP AX,0x0800;2 bytes
JNE no_such_file
ADD BX,2
MOV AX,[DS:BX]
CMP AX,0x0000;2bytes
JNE no_such_file
;File size
MOV BX,CX
;ADD BX,0x0B-0xB
MOV AL,[DS:BX]
CMP AL,0x27
JNE no_such_file
;File type
MOV BX,CX
ADD BX,0x1A-0xB
MOV AL,[DS:BX]
CMP AL,2
JNE no_such_file
;Cluster
MOV BX,find_success_text
call print_text
run_code:
;Read Cluster's first 1024 byte
;Address in floppy:0x40A00
MOV AX,0x0050
MOV DS,AX
MOV ES,AX
MOV AH,0x02
MOV AL,4
;Sector number
MOV CH,14
MOV CL,14
MOV DX,0
MOV BX,0x100
int 0x13
JC read_failed
;Run
MOV AX,0
MOV SS,AX
MOV SP,0x0600
MOV BX,0
MOV CX,0
MOV DX,0
jmp 0x50:0x100
;jump to 0x600
loop:
JMP loop
no_such_file:
MOV BX,no_such_file_text
call print_text
JMP loop
print_text:
PUSH BX
MOV AH,0x0E
MOV AL,byte [BX]
CMP byte AL,0
je print_finish
MOV BH,0
MOV BL,0
INT 0x10
POP BX
ADD BX,1
JMP print_text
print_finish:
MOV AH,0x0E
MOV AL,0x0D
MOV BH,0
MOV BL,0
INT 0x10
MOV AH,0x0E
MOV AL,0x0A
MOV BH,0
MOV BL,0
INT 0x10
POP BX
ret
reset_disk:
PUSH AX
PUSH DX
MOV AX,0x00
MOV DX,0x00
int 0x13
POP AX
POP DX
ret
; get_disk_status:
; PUSH AX
; PUSH BX
; PUSH CX
; PUSH DX
; MOV BX,0
; MOV CX,0
; MOV AH,0x01
; MOV DL,0x00
; int 0x13
; CMP AL,0
; JE no_error
; POP DX
; POP CX
; POP BX
; POP AX
; MOV BX,disk_error_text
; call print_text
; JMP loop
; no_error:
; POP DX
; POP CX
; POP BX
; POP AX
; ret
read_failed:
MOV BX,read_failed_text
call print_text
JMP loop
boot_text:
db "DOS v0.99",0x00
; disk_error_text:
; db "Disk error",0x00
read_failed_text:
db "Read failed",0x00
no_such_file_text:
db "No such file.",0x00
find_success_text:
db "Find file.",0x00
check_disk_success_text:
db "Check disk success.",0x00
program_name:
db "COMMAND COM"
times 510-($-$$) db 0
dw 0xAA55