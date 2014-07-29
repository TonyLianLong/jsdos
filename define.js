// JavaScript Document
function clearBit(c,bit){
	c &= ~(1<<bit);
	return c;
}
function setBit(c,bit){
	c |= 1<<bit;
	return c;
}
function readBit(c,bit){
	if((c>>bit)&1){
		return 1;
	}else{
		return 0;
	}
}
function writeBit(c,bit,mode){
	if(mode){
		c = setBit(c,bit);
	}else{
		c = clearBit(c,bit);
	}
	return c;
}
//MODRM Operator
XOR = 0;
MOV = 1;
//MODRM LENGTH
SREG_LENGTH=1;
//MODRM Array
modRM_arr1 = [["AL","AX",,,,"ES"],["CL","CX",,,,"CS"],["DL","DX",,,,"SS"],["BL","BX",,,,"DS"],["AH","SP",,,,"FS"],["CH","BP",,,,"GS"],["DH","SI"],["BH","DI"]];
modRM_arr2 = [
[],[],[],[],[],[],[],["BX"],
[],[],[],[],[],[],[],[],
[],[],[],[],[],[],[],[],
["AL","AX"],["CL","CX"],["DL","DX"],["BL","BX"],["AH","SP"],["CH","BP"],["DH","SI"],["BH","DI"]];
//FLAG register
CF = 0;
PF = 2;
AF = 4;
ZF = 6;
SF = 7;
TF = 8;
IF = 9;
DF = 10;
OF = 11;
//Power mode
POWER_ON = 0;
POWER_HALT = 1;
POWER_OFF = 2;
//Keycode
keycode_array_press = [0x2960,0x0231,0x0332,0x0433,0x0534,0x0635,
0x0736,0x0837,0x0938,0x0a39,0x0b30,0x0c2d,0x0d3d,0x2b5c,
0x0f09,0x1071,0x1177,0x1265,0x1372,0x1474,0x1579,0x1675
,0x1769,0x186f,0x1970,0x1a5b,0x1b5d,0x1e61,0x1f73,0x2064,
0x2166,0x2267,0x2368,0x246a,0x256b,0x266c,0x273b,0x2827,
0x2c7a,0x2d78,0x2e63,0x2f76,0x3062,0x316e,0x326d,0x332c,
0x342e,0x352f,0x3920,0x1c0d,0x3A14,0x2A10,0x0E08];
keycode_array_release = [0xAA10];
//Function
function lowercase(code){
	if(code >= 65 && code <= 90){
		return code+(97-65);
	}
	return code;
}
function uppercase(code){
	if(code >= 97 && code <= 122){
		return code-(97-65);
	}
	return code;
}