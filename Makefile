all:
	nasm loader.asm -o loader.bin
	nasm command.asm -o command.bin
	nasm program.asm -o program.bin
	nasm dir.asm -o dir.bin
	nasm space.asm -o space.bin
	nasm space_2.asm -o space_2.bin
	cat loader.bin space.bin command.bin program.bin 7k dir.bin 7k space_2.bin > loader.img
clean:
	rm loader.bin command.bin program.bin dir.bin space.bin space_2.bin
