#This Makefile is the file to build DOS
all:
	make -C DOS
	cp DOS/loader.img loader.img
clean:
	make -C DOS clean