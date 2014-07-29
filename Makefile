#This Makefile is the file to build my DOS
all:
	( cd "DOS" && "$(MAKE)" all -f Makefile) || exit 1
clean:
	( cd "DOS" && "$(MAKE)" clean -f Makefile) || exit 1