#This Makefile is the file to build DOS
all:
	( cd "DOS" && $(MAKE) all -f Makefile) || exit 1
clean:
	rm DOS/*.bin