TSFILES = $(shell find notebook/static/ -name '*.ts')

.PHONY: clean

clean:
	rm -rf tsdocs

docs: ${TSFILES}
	echo  notebook/static/**/*.ts typings/* 
	typedoc --out tsdocs --mode file --externalPattern 'typings/*' ${TSFILES} typings/* --module amd


