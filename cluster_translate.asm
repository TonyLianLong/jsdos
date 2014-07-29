ORG 0x100
MOV AX,4
call cluster_translate
loop:
JMP loop
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