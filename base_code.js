// JavaScript Document
function setdisk_buffer(i,data,disk_buffer){
	disk_buffer[i] = data;
}
function load_binary_resource(url) {
	var req = new XMLHttpRequest();
	req.open('GET', url, false);
	// The following line says we want to receive data as Binary and not as Unicode
	req.overrideMimeType('text/plain; charset=x-user-defined');
	req.send(null);
	if (req.status != 200) return '';
	return req.responseText;
}
function load_binary(url,disk_buffer,length) {
	data_rep = load_binary_resource(url);
	reader = new BinaryReader(data_rep);
	for(i = 0;i < length;i++){
		reader.seek(i);
		disk_buffer[i] = reader.readUInt8();
	}
};
function load_code(disk_buffer,RAM,register){
	//Like BIOS
	//Load bootsector
	for(i=0;i<512;i++){
		RAM[0x7C00+i] = disk_buffer[i];
	}
	register["IP"] = 0x7C00;
}
function fatal_error(text){
	console.log(text);
	console_print("Error:"+text);
	finished = 1;
}
function scanIF(){
	if(readBit(register["FLAG"],IF)){
		//console.log("IF in Flag register is enable.No IF support.");
		//Interrupt is enable
	}
}
function scanTF(){
	if(readBit(register["FLAG"],TF)){
		console.log("TF in Flag register is enable.No TF support.");
	}
}
function scanDF(){
	if(readBit(register["FLAG"],DF)){
		console.log("DF in Flag register is enable.No DF support.");
	}
}
/*
function modRM(operator,c,len1,len2){
	if(!len1)len1=0;
	if(!len2)len2=0;
	switch(len1){
		case SREG_LENGTH:
			len1 = 5;
		break;
		case 8:
			len1 = 0;
		break;
		case 16:
			len1 = 1;
		break;
		default:
			if(len1>0){
				len1/=8;
				len1--;
			}
		break;
	}
	if(len2>0){
		len2/=8;
		len2--;
	}
	console.log(len1);
	if((!modRM_arr2[((c>>3)&0x18)|(c&0x7)][len2]) || (!modRM_arr1[(c>>3)&0x7][len1])){
		console.log("Unavailable");
		finished = true;
		return 0;
	}
	switch(operator){
		case XOR:
			if(c&0xC0 == 0xC0){
				RAM[modRM_arr2[((c>>3)&0x18)|(c&0x7)][len2]()] = register[modRM_arr1[(c>>3)&0x7][len1]];
				console.log("RAM");
			}else{
				 register[modRM_arr1[(c>>3)&0x7][len1]] = register[modRM_arr2[((c>>3)&0x18)|(c&0x7)][len2]];
				console.log("DEST:"+modRM_arr1[(c>>3)&0x7][len1]);
				console.log("SRC:"+modRM_arr2[((c>>3)&0x18)|(c&0x7)][len2]);
				console.log("VALUE:"+register[modRM_arr1[(c>>3)&0x7][len1]])
			}
		break;
		case MOV:
			if(c&0xC0 == 0xC0){
				RAM[modRM_arr2[((c>>3)&0x18)|(c&0x7)][len2]()] = register[modRM_arr1[(c>>3)&0x7][len1]];
				console.log("RAM");
			}else{
				 register[modRM_arr1[(c>>3)&0x7][len1]] = register[modRM_arr2[((c>>3)&0x18)|(c&0x7)][len2]];
				console.log("DEST:"+modRM_arr1[(c>>3)&0x7][len1]);
				console.log("SRC:"+modRM_arr2[((c>>3)&0x18)|(c&0x7)][len2]);
				console.log("VALUE:"+register[modRM_arr1[(c>>3)&0x7][len1]])
			}
		break;
	}
}*/
function ModRM_check(len1,len2){
	if((!modRM_arr2[((c>>3)&0x18)|(c&0x7)][len2]) || (!modRM_arr1[(c>>3)&0x7][len1])){
		console.log("Unavailable");
		finished = true;
		return 0;
	}
	return 1;
}
function run_code(RAM,register){
	var code_length = 0;
	var segment = "DS";
	var addr = (register["CS"]<<4)+register["IP"];
	no_code_length_added = 0;
	if(addr>1024*1024){
		addr=addr%(1024*1024);
	}
	console.log("Addr:0x"+addr.toString(16));
	switch(RAM[addr]){
		case 0x36://SS
			segment = "SS";
			register["IP"]++;
			addr = (register["CS"]<<4)+register["IP"];
			console.log("Prefix:SS");
		break;
		case 0x3E://DS
			segment = "DS";
			register["IP"]++;
			addr = (register["CS"]<<4)+register["IP"];
			console.log("Prefix:DS 0x"+register["DS"].toString(16));
		break;
		case 0x26://ES
			segment = "ES";
			register["IP"]++;
			addr = (register["CS"]<<4)+register["IP"];
			console.log("Prefix:ES");
		break;
	}
	console.log("Code is:0x"+RAM[addr].toString(16));
	switch(RAM[addr]){
		case 0xEB://JMP
			console.log("JMP");
			register["IP"] += rel(RAM[addr+1],8);
			code_length=2;
			if(rel(RAM[addr+1],8) == -2){
				console.log("Loop");
				machine_mode = POWER_HALT;
			}
		break;
		case 0xFA://CLI
			console.log("CLI");
			register["FLAG"] = clearBit(register["FLAG"],IF);
			code_length=1;
		break;
		case 0x33://XOR
			console.log("XOR");
			//modRM(XOR,RAM[addr+1],16,16);
			var c = RAM[addr+1];
			var len1 = 1;
			var len2 = 1;
			if((c&0xC0) != 0xC0){
				finished = true;
				console.log("Not supported.");
			}else{
				 register[modRM_arr1[(c>>3)&0x7][len1]] ^= register[modRM_arr2[((c>>3)&0x18)|(c&0x7)][len2]];
				console.log("DEST:"+modRM_arr1[(c>>3)&0x7][len1]);
				console.log("SRC:"+modRM_arr2[((c>>3)&0x18)|(c&0x7)][len2]);
				console.log("VALUE:"+register[modRM_arr1[(c>>3)&0x7][len1]])
			}
			register["FLAG"] = clearBit(register["FLAG"],CF);
			register["FLAG"] = clearBit(register["FLAG"],OF);
			code_length=2;
		break;
		case 0x8E://MOV
			//modRM(MOV,RAM[addr+1],SREG_LENGTH,16);
			var c = RAM[addr+1];
			var len1 = 5;
			var len2 = 1;
			if((c&0xC0) != 0xC0){
				finished = true;
				console.log("Not supported.");
			}else{
				 register[modRM_arr1[(c>>3)&0x7][len1]] = register[modRM_arr2[((c>>3)&0x18)|(c&0x7)][len2]];
				console.log("DEST:"+modRM_arr1[(c>>3)&0x7][len1]);
				console.log("SRC:"+modRM_arr2[((c>>3)&0x18)|(c&0x7)][len2]);
				console.log("VALUE:0x"+register[modRM_arr1[(c>>3)&0x7][len1]].toString(16));
			}
			code_length=2;
		break;
		case 0xBC://MOV SP
			register["SP"] = RAM[addr+1]|RAM[addr+2]<<8;
			console.log("SP:0x"+register["SP"].toString(16));
			code_length=3;
		break;
		case 0x16://PUSH SS
			register["SP"] = register["SP"] - 2;
			RAM[(register["SS"]<<4)+register["SP"]] = register["SS"]>>8;
			RAM[(register["SS"]<<4)+register["SP"]+1] = register["SS"]&0xFF;
			code_length=1;
		break;
		case 0x07://POP ES
			register["ES"] = RAM[(register["SS"]<<4)+register["SP"]]<<8|RAM[(register["SS"]<<4)+register["SP"]+1]&0xFF;
			register["SP"] = register["SP"] + 2;
			console.log("ES:"+register["ES"]);
			code_length=1;
		break;
		case 0x1E://PUSH DS
			console.log("PUSH DS:0x"+register["DS"].toString(16));
			register["SP"] = register["SP"] - 2;
			RAM[(register["SS"]<<4)+register["SP"]] = register["DS"]>>8;
			RAM[(register["SS"]<<4)+register["SP"]+1] = register["DS"]&0xFF;
			code_length=1;
		break;
		case 0x56://PUSH SI
			register["SP"] = register["SP"] - 2;
			RAM[(register["SS"]<<4)+register["SP"]] = register["SI"]>>8;
			RAM[(register["SS"]<<4)+register["SP"]+1] = register["SI"]&0xFF;
			code_length=1;
		break;
		case 0x53://PUSH BX
			console.log("PUSH BX data:0x"+register["BX"].toString(16));
			register["SP"] = register["SP"] - 2;
			console.log("0x"+((register["SS"]<<4)+register["SP"]).toString(16));
			RAM[(register["SS"]<<4)+register["SP"]] = register["BX"]>>8;
			RAM[(register["SS"]<<4)+register["SP"]+1] = register["BX"]&0xFF;
			code_length=1;
		break;
		case 0xBB://MOV BX
			register["BX"] = RAM[addr+1]|RAM[addr+2]<<8;
			console.log("BX:0x"+register["BX"].toString(16));
			code_length=3;
		break;
		case 0xC5://LDS
			console.log("LDS");
			var c = RAM[addr+1];
			var len1 = 1;
			var len2 = 0;
			console.log(c.toString(16),c&0xC0);
			if((c&0xC0) != 0xC0){
				//RAM[modRM_arr2[((c>>3)&0x18)|(c&0x7)][len2]] = 0;//register[modRM_arr1[(c>>3)&0x7][len1]];
				register[modRM_arr1[(c>>3)&0x7][len1]] = RAM[(register[segment]<<4)+register[modRM_arr2[((c>>3)&0x18)|(c&0x7)][len2]]]+(RAM[(register[segment]<<4)+register[modRM_arr2[((c>>3)&0x18)|(c&0x7)][len2]]+1]<<8);
				register["DS"] = RAM[(register[segment]<<4)+register[modRM_arr2[((c>>3)&0x18)|(c&0x7)][len2]]+2]+(RAM[(register[segment]<<4)+register[modRM_arr2[((c>>3)&0x18)|(c&0x7)][len2]]+3]<<8);
				console.log((modRM_arr1[(c>>3)&0x7][len1])+":0x"+register[modRM_arr1[(c>>3)&0x7][len1]].toString(16));
				console.log("DS:0x"+register["DS"].toString(16));
			}else{
				 console.log("Not supported.");
				 finished = true;
			}
			code_length = 2;
		break;
		case 0xBF://MOV DI
			register["DI"] = RAM[addr+1]|RAM[addr+2]<<8;
			console.log("DI:0x"+register["DI"].toString(16));
			code_length=3;
		break;
		case 0xB9://MOV CX
			register["CX"] = RAM[addr+1]|RAM[addr+2]<<8;
			console.log("CX:0x"+register["CX"].toString(16));
			code_length=3;
		break;
		case 0xFC://CLD
			register["FLAG"] = clearBit(register["FLAG"],DF);
			code_length=1;
		break;
		case 0xF3://REP
			console.log("REP");
			if(RAM[addr+1] == 0xA4){
				for(i=0;register["CX"];i++){
					RAM[register["ES"]<<4+register["DI"]+i] = RAM[register["DS"]<<4+register["SI"]+i];
					register["CX"]--;
				}
			}else{
				console.log("Not supported.");
				finished = true;
			}
			code_length=2;
		break;
		case 0x06://PUSH ES
			register["SP"] = register["SP"] - 2;
			RAM[(register["SS"]<<4)+register["SP"]] = register["ES"]>>8;
			RAM[(register["SS"]<<4)+register["SP"]+1] = register["ES"]&0xFF;
			code_length=1;
		break;
		case 0x1F://POP DS
			register["DS"] = RAM[(register["SS"]<<4)+register["SP"]]<<8|RAM[(register["SS"]<<4)+register["SP"]+1]&0xFF;
			register["SP"] = register["SP"] + 2;
			console.log("DS:"+register["DS"]);
			code_length=1;
		break;
		case 0xC6://MOV
			var mod = getMod(RAM[addr+1]);
			var RM = getRM(RAM[addr+1]);
			var reg = getReg_Opcode(RAM[addr+1]);
			var modrm = mod<<3|RM;
			var len2 = 0;
			console.log(modrm);
			if((c&0xC0) == 0x40){
				if(c == 0x45){
					if(RAM[addr+2]>>7){
						var op2 = ~(RAM[addr+2]&0x7f)-1;
					}else{
						var op2 = RAM[addr+2];
					}
					RAM[(register[segment]<<4)+register[modRM_arr2[((c>>3)&0x18)|(c&0x7)][len2]]+op2] = RAM[addr+3];
					//[XX] + DISP8
				}else{
					finished = true;
					console.log("Not supported.");
				}
				code_length=4;
			}else if(modrm == 6){
				if(reg != 0){
					finished = true;
					console.log("Not supported.");
				}
				RAM[(register[segment]<<4)+((RAM[addr+3]<<8)|RAM[addr+2])] = RAM[addr+4];
				code_length=5;
			}else if(modrm == 7){
				if(reg != 0){
					finished = true;
					console.log("Not supported.");
				}
				RAM[(register[segment]<<4)+(register["BX"])] = RAM[addr+2];
				code_length=3;
			}else{
				finished = true;
				console.log("Not supported.");
			}
			
		break;
		case 0x8B://MOV
			var mod = getMod(RAM[addr+1]);
			var RM = getRM(RAM[addr+1]);
			var reg = getReg_Opcode(RAM[addr+1]);
			var modrm = mod<<3|RM;
			if(mod == 0){
				if(RM == 6){
					register[modRM_arr1[reg][1]] = (RAM[addr+2]&0xFF)|(RAM[addr+1]<<8);
					// DISP16
				}else if(RM == 7){
					register[modRM_arr1[reg][1]] = RAM[(register[segment]<<4)+register["BX"]]|(RAM[(register[segment]<<4)+register["BX"]+1]<<8);
				}else{
					finished = true;
					console.log("Not supported.");
				}
			}else{
				finished = true;
				console.log("Not supported.");
			}
			code_length=2;
		break;
		case 0xB8://MOV AX
			register["AX"] = RAM[addr+1]|RAM[addr+2]<<8;
			console.log("AX:0x"+register["AX"].toString(16));
			code_length=3;
		break;
		case 0xB4://MOV AH
			register["AX"] = (register["AX"] & 0x00FF) | RAM[addr+1]<<8;
			//Only update AH
			console.log("AH:0x"+(register["AX"]>>8).toString(16));
			code_length=2;
		break;
		case 0xB0://MOV AL
			register["AX"] = (register["AX"] & 0xFF00) | RAM[addr+1];
			//Only update AL
			console.log("AL:0x"+(register["AX"]&0x00FF).toString(16));
			code_length=2;
		break;
		case 0xB6://MOV DH
			register["DX"] = (register["DX"] & 0x00FF) | RAM[addr+1]<<8;
			//Only update DH
			console.log("DH:0x"+(register["DX"]>>8).toString(16));
			code_length=2;
		break;
		case 0xB2://MOV DL
			register["DX"] = (register["DX"] & 0xFF00) | RAM[addr+1];
			//Only update DL
			console.log("DL:0x"+(register["DX"]&0x00FF).toString(16));
			code_length=2;
		break;
		case 0xB7://MOV BH
			register["BX"] = (register["BX"] & 0x00FF) | RAM[addr+1]<<8;
			//Only update BH
			console.log("BH:0x"+(register["BX"]>>8).toString(16));
			code_length=2;
		break;
		case 0xB3://MOV BL
			register["BX"] = (register["BX"] & 0xFF00) | RAM[addr+1];
			//Only update BL
			console.log("BL:0x"+(register["BX"]&0x00FF).toString(16));
			code_length=2;
		break;
		case 0xBA://MOV DX
			register["DX"] = RAM[addr+1]|RAM[addr+2]<<8;
			console.log("DX:0x"+register["DX"].toString(16));
			code_length=3;
		break;
		case 0xCD://INT
			switch(RAM[addr+1]){
				case 0x10:
					switch((register["AX"]>>8)&0xFF){
						/*case 0x0:
							console.log("Set screen mode");
							//Ignore
						break;*/
						case 0x3:
							console.log("Get cursor");
							register["AX"] = 0;
							register["CX"] = (0xC<<8)|0xF;
							register["DX"] = (0<<8)|0;
						break;
						case 0xE:
							console.log("Print text:"+String.fromCharCode(register["AX"]&0xFF)+" code:0x"+(register["AX"]&0xFF).toString(16));
							console_print_no_return(String.fromCharCode(register["AX"]&0xFF));
							//Ignore BH and BL
						break;
						case 0x6:
							console.log("Scroll up window");
							if((register["AX"]&0xFF) == 0){
								console.log("Clear screen");
								clear_screen();
							}
						break;
						case 0x2:
							console.log("Set cursor");
						break;
						default:
							finished = true;
							console.log("Not supported:0x"+((register["AX"]>>8)&0xFF).toString(16)+".");
						break;
					}
				break;
				case 0x13:
					switch(register["AX"]>>8){
						case 0x00:
							register["FLAG"] = clearBit(register["FLAG"],CF);
						break;
						case 0x01:
							if(register["DL"] != 0){
								//Not floppy
								register["AX"] = (register["AX"]&0xFF00)|(0x06);
								register["FLAG"] = setBit(register["FLAG"],CF);
							}else{
								register["AX"]=(register["AX"]&0xFF00)|0;
								register["FLAG"] = clearBit(register["FLAG"],CF);
							}
						break;
						case 0x02://Read sector
							if(register["CX"]&0xFF == 0){
								fatal_error("int 13:out of range");
							}
							if(register["DL"] != 0){
								//Not floppy
								register["AX"] = (register["AX"]&0xFF00)|(0x06);
								register["FLAG"] = setBit(register["FLAG"],CF);
								break;
							}
							var address = ((register["CX"]>>8)*36+(register["DX"]>>8)*18+((register["CX"]&0xFF)-1))*0x200;
							var sector_num = register["AX"]&0x00FF;
							console.log("Disk Address 0x"+address.toString(16));
							console.log("RAM Address: 0x"+((register["ES"]<<4)+register["BX"]).toString(16));
							console.log("Length:0x"+(sector_num*512).toString(16));
							for(i = 0;i<sector_num;i++){
								for(j = 0;j<512;j++){
									RAM[(register["ES"]<<4)+register["BX"]+(i*512+j)] = diskbuffer[address+(i*512+j)];
								}
							}
							register["FLAG"] = clearBit(register["FLAG"],CF);
						break;
						default:
							finished = true;
							console.log("Not supported.");
						break;
					}
				break;
				default:
					console.log("INT by memory");
					//finished = true;
					//console.log("Not supported.");
					no_code_length_added = true;
					interrupt(RAM[addr+1]);
				break;
			}
			console.log("INT:0x"+RAM[addr+1].toString(16));
			code_length=2;
		break;
		case 0xE8://CALL
			code_length=3;
			register["SP"] = register["SP"] - 2;
			RAM[(register["SS"]<<4)+register["SP"]] = (register["IP"]+code_length)>>8;
			RAM[(register["SS"]<<4)+register["SP"]+1] = (register["IP"]+code_length)&0xFF;
			console.log(((register["SS"]<<4)+register["SP"]).toString(16));
			console.log(RAM[(register["SS"]<<4)+register["SP"]].toString(16));
			console.log(RAM[(register["SS"]<<4)+register["SP"]+1].toString(16));
			register["IP"] += rel((RAM[addr+2]<<8)|RAM[addr+1],16);
			console.log("AL 0x"+(register["AX"]>>8).toString(16));
			console.log("CALL 0x"+RAM[addr+1].toString(16));
		break;
		case 0x8A://MOV r8 r/m8
			var mod = getMod(RAM[addr+1]);
			var RM = getRM(RAM[addr+1]);
			var reg = getReg_Opcode(RAM[addr+1]);
			if(mod == 0 && RM == 0x7){
				//BX
				flush_register_get();
				register[modRM_arr1[reg][0]] = RAM[(register[segment]<<4)+register["BX"]];
				flush_register_set();
				console.log("Address:0x"+((register[segment]<<4)+register["BX"]).toString(16));
				console.log("Register:"+modRM_arr1[reg][0]);
				console.log("Data:0x"+register[modRM_arr1[reg][0]].toString(16));
			}else{
				finished = true;
				console.log("Not supported.");
			}
			code_length=2;
		break;
		case 0x3C://CMP AL,imm
			flush_register_get();
			cmp(register["AL"],RAM[addr+1],8);
			code_length = 2;
		break;
		case 0x74://JE JZ
			if(readBit(register["FLAG"],ZF)){
				register["IP"]+=rel(RAM[addr+1],8);
			}
			code_length=2;
		break;
		case 0x5B://POP BX
			var reg_addr = (register["SS"]<<4)+register["SP"];
			register["BX"] = (RAM[reg_addr]<<8)|(RAM[reg_addr+1]&0xFF);
			console.log("Data address:0x"+reg_addr.toString(16));
			register["SP"] = register["SP"] + 2;
			console.log("POP BX data:0x"+register["BX"].toString(16));
			code_length=1;
		break;
		case 0x83://GROUP
			var mod = getMod(RAM[addr+1]);
			var RM = getRM(RAM[addr+1]);
			var opcode = getReg_Opcode(RAM[addr+1]);
			var modrm = mod<<3|RM;
			switch(opcode){
				case 0://ADD r/m16 imm8
					if(mod == 3){
						console.log("Data:0x"+register[modRM_arr2[modrm][1]].toString(16));
						register[modRM_arr2[modrm][1]] += rel(RAM[addr+2],8);
						console.log("Register:"+modRM_arr2[modrm][1]);
						console.log("Plus:"+RAM[addr+2].toString(16));
						console.log("Data:0x"+register[modRM_arr2[modrm][1]].toString(16));
					}else{
						finished = true;
						console.log("Not supported.");
					}
				break;
				case 7:
					if(mod == 3){
						cmp(register[modRM_arr2[modrm][1]],RAM[addr+2],16);
					}else{
						finished = true;
						console.log("Not supported.");
					}
				break;
				default:
					finished = true;
					console.log("Not supported.");
				break;
			}
			code_length=3;
		break;
		case 0xC3://RET
			register["IP"] = (((RAM[(register["SS"]<<4)+register["SP"]])&0xFF)<<8)|(RAM[(register["SS"]<<4)+register["SP"]+1]&0xFF);
			console.log(((RAM[(register["SS"]<<4)+register["SP"]])&0xFF).toString(16));
			console.log(((RAM[(register["SS"]<<4)+register["SP"]+1])&0xFF).toString(16));
			register["SP"] = register["SP"] + 2;
			console.log("RET IP:0x"+register["IP"].toString(16));
			code_length=1;
			no_code_length_added=1;
		break;
		case 0x50://PUSH AX
			register["SP"] = register["SP"] - 2;
			RAM[(register["SS"]<<4)+register["SP"]] = register["AX"]>>8;
			RAM[(register["SS"]<<4)+register["SP"]+1] = register["AX"]&0xFF;
			code_length=1;
		break;
		case 0x52://PUSH DX
			register["SP"] = register["SP"] - 2;
			RAM[(register["SS"]<<4)+register["SP"]] = register["DX"]>>8;
			RAM[(register["SS"]<<4)+register["SP"]+1] = register["DX"]&0xFF;
			code_length=1;
		break;
		case 0x58://POP AX
			register["AX"] = RAM[(register["SS"]<<4)+register["SP"]]<<8|RAM[(register["SS"]<<4)+register["SP"]+1]&0xFF;
			register["SP"] = register["SP"] + 2;
			console.log("AX:"+register["AX"]);
			code_length=1;
		break;
		case 0x5A://POP DX
			register["DX"] = RAM[(register["SS"]<<4)+register["SP"]]<<8|RAM[(register["SS"]<<4)+register["SP"]+1]&0xFF;
			register["SP"] = register["SP"] + 2;
			console.log("DX:"+register["DX"]);
			code_length=1;
		break;
		case 0xB5://MOV CH
			register["CX"] = (register["CX"] & 0x00FF) | RAM[addr+1]<<8;
			//Only update CH
			console.log("CH:0x"+(register["CX"]>>8).toString(16));
			code_length=2;
		break;
		case 0xB1://MOV CL
			register["CX"] = (register["CX"] & 0xFF00) | RAM[addr+1];
			//Only update CL
			console.log("CL:0x"+(register["CX"]&0x00FF).toString(16));
			code_length=2;
		break;
		case 0x0F://Two-byte Opcode
			addr++;
			console.log("Two-byte Opcode:0x"+RAM[addr].toString(16));
			switch(RAM[addr]){
				case 0x82://JC JB JNAE
					if(readBit(register["FLAG"],CF)){
						register["IP"] += rel((RAM[addr+2]<<8)|RAM[addr+1],16);
					}
					code_length = 4;//Include two-byte opcode
				break;
				case 0x84://JZ JE
					if(readBit(register["FLAG"],ZF)){
						register["IP"] += rel((RAM[addr+2]<<8)|RAM[addr+1],16);
					}
					code_length = 4;//Include two-byte opcode
				break;
				default:
					console.log("Not supported.");
					finished = true;
				break;
			}
		break;
		case 0x81://GROUP
			var mod = getMod(RAM[addr+1]);
			var RM = getRM(RAM[addr+1]);
			var opcode = getReg_Opcode(RAM[addr+1]);
			var modrm = mod<<3|RM;
			if(opcode == 7){//CMP r/m16 imm16
				if(mod == 3){
					var a = register[modRM_arr2[modrm][1]];
					var b = RAM[addr+2]|(RAM[addr+3]<<8);
					cmp(a,b,16);
					console.log("Register:"+modRM_arr2[modrm][1]);
				}else{
					finished = true;
					console.log("Not supported.");
				}
				console.log("Data:0x"+register["BX"].toString(16));
			}else{
				finished = true;
				console.log("Not supported.");
			}
			code_length=4;
		break;
		case 0x89://MOV r/m16 r16
			var mod = getMod(RAM[addr+1]);
			var RM = getRM(RAM[addr+1]);
			var reg = getReg_Opcode(RAM[addr+1]);
			var modrm = mod<<3|RM;
			if(mod == 3){//CMP r/m16 imm16
				register[modRM_arr2[modrm][1]] = register[modRM_arr1[reg][1]];
				console.log("MOV");
				console.log("Register 1:"+modRM_arr2[modrm][1]);
				console.log("Register 2:"+modRM_arr1[reg][1]);
				console.log("Data:0x"+register[modRM_arr2[modrm][1]].toString(16));
			}else{
				finished = true;
				console.log("Not supported.");
			}
			code_length=2;
		break;
		case 0x38://CMP r/m8 r8
			var mod = getMod(RAM[addr+1]);
			var RM = getRM(RAM[addr+1]);
			var reg = getReg_Opcode(RAM[addr+1]);
			var modrm = mod<<3|RM;
			if(mod == 3){
				flush_register_get();
				cmp(register[modRM_arr2[modrm][0]],register[modRM_arr1[reg][0]],8);
				console.log("CMP a "+modRM_arr2[modrm][0]+":0x"+register[modRM_arr2[modrm][0]].toString(16));
				console.log("CMP b "+modRM_arr1[reg][0]+":0x"+register[modRM_arr1[reg][0]].toString(16));
			}else{
				finished = true;
				console.log("Not supported.");
			}
			code_length = 2;
		break;
		case 0x3D://CMP AX,imm
			var b = RAM[addr+1]|(RAM[addr+2]<<8);
			cmp(register["AX"],b,16);
			code_length = 3;
		break;
		case 0x75://JNE JNZ
			if(!readBit(register["FLAG"],ZF)){
				register["IP"]+=rel(RAM[addr+1],8);
				console.log("Jump");
			}
			code_length=2;
		break;
		case 0x72://JC JB JNAE
			if(readBit(register["FLAG"],CF)){
				register["IP"] += rel(RAM[addr+1],8);
			}
			code_length = 2;
		break;
		case 0xEA://JMP F
			register["IP"] = (RAM[addr+2]<<8)|RAM[addr+1];
			register["CS"] = (RAM[addr+4]<<8)|RAM[addr+3];
			console.log("Jump to 0x"+register["CS"].toString(16)+":0x"+register["IP"].toString(16));
			no_code_length_added = 1;
			code_length = 5;
		break;
		case 0x51://PUSH CX
			register["SP"] = register["SP"] - 2;
			console.log(((register["SS"]<<4)+register["SP"]).toString(16));
			RAM[(register["SS"]<<4)+register["SP"]] = register["CX"]>>8;
			RAM[(register["SS"]<<4)+register["SP"]+1] = register["CX"]&0xFF;
			code_length=1;
		break;
		case 0x59://POP CX
			var reg_addr = (register["SS"]<<4)+register["SP"];
			register["CX"] = (RAM[reg_addr%(1024*1024)]<<8)|(RAM[(reg_addr+1)%(1024*1024)]&0xFF);
			register["SP"] = register["SP"] + 2;
			console.log("POP CX data:0x"+register["CX"].toString(16));
			code_length=1;
		break;
		case 0xC7://MOV
			var mod = getMod(RAM[addr+1]);
			var RM = getRM(RAM[addr+1]);
			var reg = getReg_Opcode(RAM[addr+1]);
			var modrm = mod<<3|RM;
			if(reg != 0){//Unknown code
				console.log("Not supported.");
				finished = true;
			}else{
				if(modrm == 6){
					// DISP16
					var data_address = (register[segment]<<4)+(RAM[addr+2]|(RAM[addr+3]<<8));
					data_address %= 1024*1024;
					RAM[data_address] = RAM[addr+4];
					RAM[data_address+1] = RAM[addr+5];
					console.log("Data Address:0x"+data_address.toString(16));
					console.log("Data:0x"+((RAM[data_address+1]<<8)|RAM[data_address]).toString(16));
				}
			}
			code_length = 6;
		break;
		case 0x8C://MOV 
			var mod = getMod(RAM[addr+1]);
			var RM = getRM(RAM[addr+1]);
			var reg = getReg_Opcode(RAM[addr+1]);
			var modrm = mod<<3|RM;
			register[modRM_arr2[modrm][1]] = register[modRM_arr1[reg][5]];
			console.log("Register 1:"+modRM_arr2[modrm][1]);
			console.log("Register 2:"+modRM_arr1[reg][5]);
			code_length = 2;
		break;
		case 0xA3://MOV
			var save_addr = (register[segment]<<4)+((RAM[addr+1]&0xFF)|(RAM[addr+2]<<8));
			RAM[save_addr] = register["AX"]&0xFF;
			RAM[save_addr+1] = (register["AX"]&0xFF00)>>8;
			console.log("Data address:"+save_addr.toString(16));
			code_length = 3;
		break;
		case 0xE6://OUT
			IO_port[RAM[addr+1]] = register["AX"]&0xFF;
			code_length = 2;
		break;
		case 0xFB://STI
			console.log("STI");
			register["FLAG"] = setBit(register["FLAG"],IF);
			code_length=1;
		break;
		case 0xF4://HLT
			console.log("HLT");
			machine_mode = POWER_HALT;
			code_length = 1;
		break;
		case 0xCF://IRET
			console.log("IRET");
			var reg_addr;
			reg_addr = (register["SS"]<<4)+register["SP"];
			register["IP"] = (RAM[reg_addr]<<8)|(RAM[reg_addr+1]&0xFF);
			register["SP"] = register["SP"] + 2;
			reg_addr = (register["SS"]<<4)+register["SP"];
			console.log("SP:0x"+register["SP"].toString(16));
			register["CS"] = (RAM[reg_addr]<<8)|(RAM[reg_addr+1]&0xFF);
			register["SP"] = register["SP"] + 2;
			reg_addr = (register["SS"]<<4)+register["SP"];
			register["FLAG"] = (RAM[reg_addr]<<8)|(RAM[reg_addr+1]&0xFF);
			console.log("Flag SP:0x"+register["SP"].toString(16));
			register["SP"] = register["SP"] + 2;
			console.log("IP 0x"+register["IP"].toString(16));
			console.log("CS 0x"+register["CS"].toString(16));
			console.log("FLAG 0x"+register["FLAG"].toString(16));
			no_code_length_added=1;
			code_length = 1;
		break;
		case 0xE4:
			console.log("IN");
			var IO_port_data = IO_port[RAM[addr+1]];
			register["AX"] = (register["AX"]&0xFF00)|IO_port_data&0xFF;
			console.log("IO Port:0x"+RAM[addr+1].toString(16));
			console.log("Data:0x"+IO_port_data.toString(16));
			code_length = 2;
		break;
		case 0x80://GROUP
			var mod = getMod(RAM[addr+1]);
			var RM = getRM(RAM[addr+1]);
			var opcode = getReg_Opcode(RAM[addr+1]);
			var modrm = mod<<3|RM;
			if(opcode == 0){
				if(mod == 3){
					//ADD r/m8 imm8
					flush_register_get();
					console.log("Data a:"+modRM_arr2[modrm][0]+" 0x"+register[modRM_arr2[modrm][0]].toString(16));
					console.log("Data b:0x"+RAM[addr+2].toString(16));
					register[modRM_arr2[modrm][0]] = (register[modRM_arr2[modrm][0]] + RAM[addr+2])&0xFF;
					flush_register_set();
					console.log("CH:0x"+((register["CX"]>>8)&0xFF).toString(16));
					console.log("Data:0x"+register[modRM_arr2[modrm][0]].toString(16));
					console.log("CH:0x"+((register["CX"]>>8)&0xFF).toString(16));
				}else{
					finished = true;
					console.log("Not supported.");
				}
			}else if(opcode == 7){
				if(mod == 3){
					//CMP r/m8 imm8
					flush_register_get();
					cmp(register[modRM_arr2[modrm][0]],RAM[addr+2],8);
					flush_register_set();
					console.log("CMP a "+modRM_arr2[modrm][0]+":0x"+register[modRM_arr2[modrm][0]].toString(16));
					console.log("CMP b:0x"+RAM[addr+2].toString(16));
				}else if(mod == 0){
					cmp(RAM[(register[segment]<<4)+register[modRM_arr2[modrm][0]]],RAM[addr+2],8);
				}else{
					finished = true;
					console.log("Not supported.");
				}
			}else if(opcode == 4){
				if(mod == 0){//Mod is 0 (RAM) so you don't need to flush register
					//AND r/m8 imm8
					var RAM_addr = (register[segment]<<4)+register[modRM_arr2[modrm][0]];
					console.log("AND a ["+modRM_arr2[modrm][0]+"]");
					console.log("Address:0x"+RAM_addr.toString(16));
					console.log("Data:0x"+RAM[RAM_addr].toString(16));
					console.log("AND b:0x"+RAM[addr+2].toString(16));
					RAM[RAM_addr] = RAM[RAM_addr] & RAM[addr+2];
					console.log("AND:0x"+RAM[RAM_addr].toString(16));
				}else if(mod == 3){
					flush_register_get();
					register[modRM_arr2[modrm][0]] = register[modRM_arr2[modrm][0]] & RAM[addr+2];
					flush_register_set();
				}else{
					finished = true;
					console.log("Not supported.");
				}
			}else{
				finished = true;
				console.log("Not supported.");
			}
			code_length = 3;
		break;
		case 0x30://XOR r/m8 r8
			var mod = getMod(RAM[addr+1]);
			var RM = getRM(RAM[addr+1]);
			var reg = getReg_Opcode(RAM[addr+1]);
			var modrm = mod<<3|RM;
			if(mod == 3){
				flush_register_get();
				console.log("Register 1:"+modRM_arr2[modrm][0]);
				console.log("Register 2:"+modRM_arr1[reg][0]);
				console.log("Data1:"+register[modRM_arr2[modrm][0]]);
				console.log("Data2:"+register[modRM_arr1[reg][0]]);
				register[modRM_arr2[modrm][0]] = register[modRM_arr2[modrm][0]]^register[modRM_arr1[reg][0]];
				console.log("Data:"+register[modRM_arr2[modrm][0]]);
				flush_register_set();
			}
			code_length = 2;
		break;
		case 0x88://MOV 
			var mod = getMod(RAM[addr+1]);
			var RM = getRM(RAM[addr+1]);
			var reg = getReg_Opcode(RAM[addr+1]);
			var modrm = mod<<3|RM;
			if(mod == 0){
				var RAM_addr = (register[segment]<<4)+register[modRM_arr2[modrm][0]];
				flush_register_get();
				RAM[RAM_addr] = register[modRM_arr1[reg][0]];
				//register[modRM_arr2[modrm][0]] = register[modRM_arr1[reg][0]];
				console.log("RAM address 1:["+modRM_arr2[modrm][0]+"]");
				console.log("Register 2:"+modRM_arr1[reg][0]);
				console.log("RAM address:0x"+RAM_addr.toString(16));
				console.log("Data:0x"+RAM[RAM_addr].toString(16));
			}else if(mod == 3){
				flush_register_get();
				register[modRM_arr2[modrm][0]] = register[modRM_arr1[reg][0]];
				flush_register_set();
				console.log("Register 1:"+modRM_arr2[modrm][0]);
				console.log("Register 2:"+modRM_arr1[reg][0]);
				console.log("Data:0x"+register[modRM_arr2[modrm][0]].toString(16));
			}else{
				finished = true;
				console.log("Not supported.");
			}
			//flush_register_set();
			code_length = 2;
		break;
		case 0x01://ADD 
			var mod = getMod(RAM[addr+1]);
			var RM = getRM(RAM[addr+1]);
			var reg = getReg_Opcode(RAM[addr+1]);
			var modrm = mod<<3|RM;
			console.log("Register a:"+modRM_arr2[modrm][1]);
			console.log("Data a:0x"+register[modRM_arr2[modrm][1]].toString(16));
			console.log("Register b:"+modRM_arr1[reg][1]);
			console.log("Data b:0x"+register[modRM_arr1[reg][1]].toString(16));
			register[modRM_arr2[modrm][1]] = register[modRM_arr2[modrm][1]]+register[modRM_arr1[reg][1]];
			console.log("Data:0x"+register[modRM_arr2[modrm][1]].toString(16));
			code_length = 2;
		break;
		case 0xE9://JMP
			console.log("JMP");
			register["IP"] += rel(RAM[addr+1]|(RAM[addr+2]<<8),16);
			code_length=3;
			console.log("Address IP:0x"+(register["IP"]+3).toString(16));
			if(rel(RAM[addr+1]|(RAM[addr+2]<<8),16) == -3){
				console.log("Loop");
				machine_mode = POWER_HALT;
			}
		break;
		case 0xFF://GROUP
			var mod = getMod(RAM[addr+1]);
			var RM = getRM(RAM[addr+1]);
			var opcode = getReg_Opcode(RAM[addr+1]);
			var modrm = mod<<3|RM;
			code_length = 2;
			switch(opcode){
				case 2://CALL
					if(modrm == 7){
						register["SP"] = register["SP"] - 2;
						RAM[(register["SS"]<<4)+register["SP"]] = (register["IP"]+code_length)>>8;
						RAM[(register["SS"]<<4)+register["SP"]+1] = (register["IP"]+code_length)&0xFF;
						var RAM_addr = (register[segment]<<4)+register[modRM_arr2[modrm][0]];
						register["IP"] = RAM[RAM_addr]|(RAM[RAM_addr+1]<<8);
						console.log("Register:"+modRM_arr2[modrm][0]);
						console.log("Data:0x"+register[modRM_arr2[modrm][0]].toString(16));
						console.log("RAM address:0x"+RAM_addr.toString(16));
						console.log("Address:0x"+register["IP"].toString(16));
						no_code_length_added = true;
					}else{
						finished = true;
						console.log("Not supported.");
					}
				break;
				default:
					finished = true;
					console.log("Not supported.");
				break;
			}
		break;
		case 0x39://CMP r/m16 r16
			var mod = getMod(RAM[addr+1]);
			var RM = getRM(RAM[addr+1]);
			var reg = getReg_Opcode(RAM[addr+1]);
			var modrm = mod<<3|RM;
			if(mod == 3){
				cmp(register[modRM_arr2[modrm][1]],register[modRM_arr1[reg][1]],16);
				console.log("CMP a "+modRM_arr2[modrm][1]+":0x"+register[modRM_arr2[modrm][1]].toString(16));
				console.log("CMP b "+modRM_arr1[reg][1]+":0x"+register[modRM_arr1[reg][1]].toString(16));
			}else{
				finished = true;
				console.log("Not supported.");
			}
			code_length = 2;
		break;
		case 0x7C://JL JNGE
			var bit_SF = readBit(register["FLAG"],SF);
			var bit_OF = readBit(register["FLAG"],OF);
			var jump = bit_SF^bit_OF;
			console.log("JL:"+jump);
			if(jump){
				register["IP"] += rel(RAM[addr+1],8);
			}
			code_length = 2;
		break;
		case 0x7F://JG JNLE
			var bit_SF = readBit(register["FLAG"],SF);
			var bit_OF = readBit(register["FLAG"],OF);
			var bit_ZF = readBit(register["FLAG"],ZF);
			var jump = (bit_SF == bit_OF) && (bit_ZF == 0);
			console.log("JG:"+jump);
			if(jump){
				register["IP"] += rel(RAM[addr+1],8);
			}
			code_length = 2;
		break;
		case 0xF6://GROUP
			var mod = getMod(RAM[addr+1]);
			var RM = getRM(RAM[addr+1]);
			var opcode = getReg_Opcode(RAM[addr+1]);
			var modrm = mod<<3|RM;
			if(opcode == 2){//NOT
				if(mod == 3){
					flush_register_get();
					register[modRM_arr2[modrm][0]] = (~register[modRM_arr2[modrm][0]])&0xFF;
					flush_register_set();
				}else if(mod == 0){
					var RAM_addr = (register[segment]<<4)+register[modRM_arr2[modrm][0]];
					RAM[RAM_addr] = (~RAM[RAM_addr])&0xFF;
					console.log("NOT:0x"+RAM[RAM_addr].toString());
				}else{
					finished = true;
					console.log("Not supported.");
				}
			}else{
				console.log("Not supported.");
				finished = true;
			}
			code_length = 2;
		break;
		case 0x04://ADD
			var val = register["AX"]&0xFF;
			val+=RAM[addr+1];
			register["AX"] = (register["AX"]&0xFF00)|val&0xFF;
			code_length = 2;
		break;
		case 0x7E://JLE JNG
			var bit_SF = readBit(register["FLAG"],SF);
			var bit_OF = readBit(register["FLAG"],OF);
			var bit_ZF = readBit(register["FLAG"],ZF);
			var jump = (bit_SF^bit_OF)||(bit_ZF == 1);
			console.log("JLE:"+jump);
			if(jump){
				register["IP"] += rel(RAM[addr+1],8);
			}
			code_length = 2;
		break;
		case 0x6A://PUSH
			register["SP"] = register["SP"] - 2;
			RAM[(register["SS"]<<4)+register["SP"]] = 0;
			RAM[(register["SS"]<<4)+register["SP"]+1] = RAM[addr+1];
			code_length=2;
		break;
		case 0x68://PUSH
			register["SP"] = register["SP"] - 2;
			RAM[(register["SS"]<<4)+register["SP"]] = RAM[addr+2];
			RAM[(register["SS"]<<4)+register["SP"]+1] = RAM[addr+1];
			code_length=3;
		break;
		default:
			console.log("Unknown code.");
			finished = true;
		break;
	}
	if((code_length == 0) && (finished == false)){
		finished = true;
		console.log("No code length!");
	}
	if(no_code_length_added != 1){
		register["IP"] += code_length;
	}
	if((machine_mode == POWER_HALT) || (machine_mode == POWER_OFF)){
		finished = true;
	}
	/*addr = (register["CS"]<<4)+register["IP"];
	console.log("Pointer:0x"+addr.toString(16));
	if(addr>1024*1024){
		addr=addr%(1024*1024);
	}*/
	scanIF();
	//Scan Intrrrupt flag in Flag Register
	scanTF();
	//Scan Trap flag in Flag Register
	scanDF();
}
function getMod(data){
	mod = data>>6;
	return mod;
}
function getRM(data){
	RM = data&(0x7);
	return RM;
}
function getReg_Opcode(data){
	reg_opcode = (data>>3)&(0x7);
	return reg_opcode;
}

function flush_register_set(){
	var hmask = 0xFF00;
	var lmask = 0x00FF;
	var mask;
	if((reg=register["AH"]) != undefined){
		mask = hmask;
		register["AX"] = (register["AX"]&(~mask))|((reg&0xFF)<<((mask==hmask)*8));
	}
	if((reg=register["AL"]) != undefined){
		mask = lmask;
		register["AX"] = (register["AX"]&(~mask))|((reg&0xFF)<<((mask==hmask)*8));
	}
	if((reg=register["BH"]) != undefined){
		mask = hmask;
		register["BX"] = (register["BX"]&(~mask))|((reg&0xFF)<<((mask==hmask)*8));
	}
	if((reg=register["BL"]) != undefined){
		mask = lmask;
		register["BX"] = (register["BX"]&(~mask))|((reg&0xFF)<<((mask==hmask)*8));
	}
	if((reg=register["CH"]) != undefined){
		mask = hmask;
		register["CX"] = (register["CX"]&(~mask))|((reg&0xFF)<<((mask==hmask)*8));
	}
	if((reg=register["CL"]) != undefined){
		mask = lmask;
		register["CX"] = (register["CX"]&(~mask))|((reg&0xFF)<<((mask==hmask)*8));
	}
	if((reg=register["DH"]) != undefined){
		mask = hmask;
		register["DX"] = (register["DX"]&(~mask))|((reg&0xFF)<<((mask==hmask)*8));
	}
	if((reg=register["DL"]) != undefined){
		mask = lmask;
		register["DX"] = (register["DX"]&(~mask))|((reg&0xFF)<<((mask==hmask)*8));
	}
}
function flush_register_get(){
	var hmask = 0xFF00;
	var lmask = 0x00FF;
	register["AH"] = (register["AX"]&hmask)>>8;
	register["BH"] = (register["BX"]&hmask)>>8;
	register["CH"] = (register["CX"]&hmask)>>8;
	register["DH"] = (register["DX"]&hmask)>>8;
	register["AL"] = register["AX"]&lmask;
	register["BL"] = register["BX"]&lmask;
	register["CL"] = register["CX"]&lmask;
	register["DL"] = register["DX"]&lmask;
}
function check_parity(n){
	var parity = 0x1;
	for(i=0;i<8;i++){
		if(readBit(n,i)){
			parity=~parity;
			parity&=1;
		}
	}
	return parity;
}
function rel(n,len){
	if(readBit(n,len-1)){
		clearBit(n,len-1);
		n=~n;
		n&=(1<<len)-1;
		n++;
		if(n == 0x100){
			n = 0;
		}
		n=-n;
		return n;
	}else{
		return n;
	}
}
function breakpoint(){
	if(count>1000){
		finished = true;
		console.log("Breakpoint");
		alert(" ");
	}
	count++;
}
function cmp(a,b,bit){
	console.log("CMP a:0x"+a.toString(16));
	console.log("CMP b:0x"+b.toString(16));
	if((a-b) == 0){
	  register["FLAG"] = writeBit(register["FLAG"],ZF,1);
	  console.log("Have ZF.");
	}else{
	  register["FLAG"] = writeBit(register["FLAG"],ZF,0);
	  console.log("No ZF.");
	}
	var max_num = (1<<bit)-1;
	if((a-b)>(max_num)||(a-b)<(-max_num)){
	  /*Minus is a 32bit number(or larger) so if minus < 0,then carry bit should be set. */
	  register["FLAG"] = writeBit(register["FLAG"],CF,1);
	}else{
	  register["FLAG"] = writeBit(register["FLAG"],CF,0);
	}
	if((a-b)>(max_num>>1) || (a-b)<(-(max_num>>1))){
	  register["FLAG"] = writeBit(register["FLAG"],OF,1);
	}else{
	  register["FLAG"] = writeBit(register["FLAG"],OF,0);
	}
	if((a-b)>>>(bit-1)){
	  register["FLAG"] = writeBit(register["FLAG"],SF,1);
	}else{
	  register["FLAG"] = writeBit(register["FLAG"],SF,0);
	}
	if((a&0xf-b&0xf)<0){
	  register["FLAG"] = writeBit(register["FLAG"],AF,1);
	}else{
	  register["FLAG"] = writeBit(register["FLAG"],AF,0);
	}
	if(check_parity((a-b)&0xFF)){//Always 0xFF
	  register["FLAG"] = writeBit(register["FLAG"],PF,1);
	}else{
	  register["FLAG"] = writeBit(register["FLAG"],PF,0);
	}
	console.log("Flag:0x"+register["FLAG"].toString(16));
}
function interrupt(num){
	if(readBit(register["FLAG"],IF)){
		console.log("Interrupt:0x"+num.toString(16));
		if((num>=0x8)&&(num<=0xF)){
			if(readBit(IO_port[0x21],num-8)){
				console.log("8259A does not enable this interrupt");
				return 0;//8259A does not enable
			}
		}
		console.log("Interrupt Flag:0x"+register["FLAG"].toString(16));
		register["SP"] = register["SP"] - 2;
		RAM[(register["SS"]<<4)+register["SP"]] = register["FLAG"]>>8;
		RAM[(register["SS"]<<4)+register["SP"]+1] = register["FLAG"]&0xFF;
		register["FLAG"]=clearBit(register["FLAG"],IF);
		console.log("Flag SP:0x"+register["SP"].toString(16));
		register["SP"] = register["SP"] - 2;
		console.log("SP:0x"+register["SP"].toString(16));
		RAM[(register["SS"]<<4)+register["SP"]] = register["CS"]>>8;
		RAM[(register["SS"]<<4)+register["SP"]+1] = register["CS"]&0xFF;
		register["SP"] = register["SP"] - 2;
		RAM[(register["SS"]<<4)+register["SP"]] = register["IP"]>>8;
		RAM[(register["SS"]<<4)+register["SP"]+1] = register["IP"]&0xFF;
		register["CS"]=RAM[num*4+2]|(RAM[num*4+3]<<8);
		register["IP"]=RAM[num*4]|(RAM[num*4+1]<<8);
		console.log("CS:0x"+register["CS"].toString(16));
		console.log("IP:0x"+register["IP"].toString(16));
		console.log("Addr:0x"+((register["CS"]<<4)+register["IP"]).toString(16));
		if(machine_mode == POWER_HALT){
			machine_mode = POWER_ON;
			finished = false;
			console.log("Run machine from halt mode.");
			while(!finished){
				run_code(RAM,register);
			}
		}
	}
}
function timer(){
	//interrupt(8);
}