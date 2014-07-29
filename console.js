// JavaScript Document
function setconsole(text){
	$(".console").text(text+"\n");
}
function console_print(text,special){
	if(!special){
		special = 0;
	}
	$(".console").text($(".console").text()+text+"\n");
}
function clear_screen(){
	$(".console").text("");
}
function console_print_no_return(text,special){
	if(!special){
		special = 0;
	}
	if(text.charCodeAt(0) != 8){
		$(".console").text($(".console").text()+text);
	}else{
		var text = $(".console").text();
		text = text.substr(0,text.length-1);
		$(".console").text(text);
	}
}
function find_keycode_press(keycode){
	for(i=0;i<keycode_array_press.length;i++){
		if((keycode_array_press[i]&0xFF) == lowercase(keycode)){
			return (keycode_array_press[i]&0xFF00)>>8;
		}
	}
	return 0;
}
function find_keycode_release(keycode){
	for(i=0;i<keycode_array_release.length;i++){
		if((keycode_array_release[i]&0xFF) == lowercase(keycode)){
			return (keycode_array_release[i]&0xFF00)>>8;
		}
	}
	return 0;
}