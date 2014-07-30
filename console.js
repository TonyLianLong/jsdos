// JavaScript Document
var cursor = 1;
var cursor_left = 0;
var cursor_top = 0;
var fill_text = "";
for(i=0;i<80;i++){
	fill_text += " ";
}
function setconsole(text){
	//$(".console").text(text+"\n");
}
function console_print(text,special){
	if(!special){
		special = 0;
	}
	var console_line = $(".console tr td").eq(cursor_top);
	var console_line_text = console_line.text();
	if(console_line_text.length == 80){
		$(".console tr td").eq(cursor_top+1).text(text);
		set_cursor(0,cursor_top+2);
	}else{
		console_line.text(console_line_text+text);
		set_cursor(cursor_left+1,cursor_top+1);
	}
}
function clear_screen(){
	for(i=0;i<30;i++){
		$(".console tr td").eq(i).text(fill_text);
	}
}
function console_print_no_return(text,special){
	if(!special){
		special = 0;
	}
	if(text.length != 1){
		console.log("Text is not available.");
		return;
	}
	if(text.charCodeAt(0) == 8){
		if(cursor_left > 0){
			set_cursor(cursor_left-1,cursor_top);
		}else{
			set_cursor(80,cursor_top-1);
		}
	}else if(text.charCodeAt(0) == 0xd){
		if(cursor_top == 29){
			scrollup(1);
			cursor_top = 28;
		}
		set_cursor(cursor_left,cursor_top+1);
	}else if(text.charCodeAt(0) == 0xa){
		set_cursor(0,cursor_top);
	}else{
		var console_line = $(".console tr td").eq(cursor_top);
		var console_line_text = console_line.text();
		if(cursor_left == 80){
			if(cursor_top == 29){
				scrollup(1);
				cursor_top = 28;
				cursor_left = 0;
			}
			console_line_text = $(".console tr td").eq(cursor_top+1).text();
			console_line_text = console_line_text.substr(1,console_line_text.length-1);
			$(".console tr td").eq(cursor_top+1).text(text+console_line_text);
			set_cursor(0,cursor_top+1);
		}else{
			console_line_text = console_line_text.split("");
			for(i=0;i<80;i++){
				if(console_line_text[i] == undefined){
					console_line_text[i] = " ";
				}
			}
			console_line_text[cursor_left] = text;
			console_line_text = console_line_text.join("");
			console_line.text(console_line_text);
			set_cursor(cursor_left+1,cursor_top);
		}
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
function set_cursor_mode(start,end){
	for(i=0;i<8;i++){
		if(i>start && i <=end){
			$(".cursor_table tr td").eq(i).show();
		}else{
			$(".cursor_table tr td").eq(i).hide();
		}
	}
}
function cursor_flash(e){
	if(cursor){
		$(".cursor").hide();
		cursor = 0;
	}else{
		$(".cursor").show();
		cursor = 1;
	}
}
function set_cursor(left,top){
	cursor_left = left;
	cursor_top = top;
	$(".cursor").css("left",String(left*8)+"px");
	$(".cursor").css("top",String(top*17-510)+"px");
	console.log("Cursor left:"+cursor_left+" top:"+cursor_top);
}
function scrollup(num){
	for(i=0;i<30;i++){
		if((i+num)>=30){
			$(".console tr td").eq(i).text(fill_text);
		}else{
			$(".console tr td").eq(i).text($(".console tr td").eq(i+num).text());
		}
	}
}
function reset_cursor(){
	set_cursor(0,0);
}
function console_init(){
	var console_html = "";
	for(i=0;i<30;i++){
		console_html+="<tr><td id=\"console_line"+String(i)+"\"></td></tr>";
	}
	$(".console").html(console_html);
	$(".console").after("<span class=\"cursor\"><table class=\"cursor_table\"><tr><td></td></tr><tr><td></td></tr><tr><td></td></tr><tr><td></td></tr><tr><td></td></tr><tr><td></td></tr><tr><td></td></tr><tr><td></td></tr></table></span>");
	setInterval(cursor_flash,500);
	reset_cursor();
	set_cursor_mode(6,7);
}