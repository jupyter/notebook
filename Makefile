

.PHONY: clean

clean:
	rm -rf tsdocs

docs: notebook/static/**/*.ts 
	typedoc --out tsdocs --mode file --externalPattern 'typings/*' notebook/static/**/*.ts typings/* --module amd


