ORG 0x100
MOV BX,autoexec_text
call print_text
MOV AH,0x4C
int 0x21
%include "print.inc"
autoexec_text:
db "autoexec.com",0x00
times 2048-($-$$) db 0