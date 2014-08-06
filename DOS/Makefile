all:
	nasm loader.asm -o loader.bin
	nasm dos.asm -o dos.sys
	nasm command.asm -o command.bin
	nasm program.asm -o program.bin
	nasm dir.asm -o dir.bin
	nasm echo.asm -o echo.bin
	nasm autoexec.asm -o autoexec.bin
	nasm space.asm -o space.bin
	nasm space_2.asm -o space_2.bin
	cat loader.bin space.bin dos.sys command.bin program.bin 6k dir.bin 6k autoexec.bin 6k echo.bin 6k space_2.bin > loader.img
clean:
	rm -rf *.bin *.sys
