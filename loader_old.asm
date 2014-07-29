ORG 0x7c00
;DOS loader
;Init
MOV AX,0
MOV SS,AX
MOV SP,0x7C00
;Print
MOV BX,boot_text
call print_text
call reset_disk
MOV BX,boot_text
call print_text
call get_disk_status
MOV BX,boot_text
call print_text
MOV AX,0x0820
MOV ES,AX
MOV AH,0x02
MOV AL,0x01
MOV CH,0x00
MOV CL,0x02
MOV DH,0x00
MOV DL,0x00
MOV BX,0x00
int 0x13
JC read_failed
MOV BX,success_text
call print_text

loop:
JMP loop
print_text:
PUSH BX
MOV AH,0x0E
MOV AL,byte [BX]
MOV BH,0
MOV BL,0
INT 0x10
POP BX
ADD BX,1
CMP byte AL,0
jne print_text
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
get_disk_status:
PUSH AX
PUSH DX
MOV AH,0x01
MOV DL,0x00
int 0x13
CMP AL,0
JE no_error
POP AX
POP DX
MOV BX,disk_error_text
call print_text
JMP loop
no_error:
POP AX
POP DX
ret
read_failed:
MOV BX,read_failed_text
MOV [BX],byte AH
call print_text
JMP loop
boot_text:
db "DOS v0.99",0x00
disk_error_text:
db "Disk error",0x00
read_failed_text:
db "Read failed",0x00
success_text:
db "Read success",0x00

times 510-($-$$) db 0
dw 0xAA55
times 1440*1024-($-$$) db 0