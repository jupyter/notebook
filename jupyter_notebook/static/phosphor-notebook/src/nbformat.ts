// Notebook format interfaces

export
interface MimeBundle {
    // values are always string|string[] if we pretend that the application/json key doesn't exist
    [key: string]: string | string[];

    // we fudge the standard a bit here by not telling Typescript about the application/json
    // key, which will be a Javascript object if it exists.  If we want to tell 
    //"application/json": {};

    // we special-case some keys because we what we assume about them
    "image/png": string;
    "image/jpg": string;
}

export
interface ExecuteResult {
    output_type: string; /*"execute_result"*/
    execution_count: number;
    data:  MimeBundle;
    metadata: {};
}

export
interface DisplayData {
    output_type: string; /*"display_data"*/
    data: MimeBundle;
    metadata: {};
}

export
interface Stream {
    output_type: string; /*"stream"*/
    name: string;
    text: string[];
}

export
interface JupyterError {
    output_type: string; /*"error"*/
    ename: string;
    evalue: string;
    traceback: string[];
}

export
type Output = ExecuteResult | DisplayData | Stream | JupyterError;

export
interface Cell {
    cell_type: string;
    metadata: {
        name: string;
        tags: string[];
    };
    source: string | string[];
}

export
interface RawCell extends Cell {
    cell_type: string; /*"raw"*/
    metadata: {
        format: string;
        name: string;
        tags: string[];
    }
}

export
interface MarkdownCell extends Cell {
    cell_type: string; /*"markdown"*/
}

export
interface CodeCell extends Cell {
    cell_type: string; /*"code"*/
    metadata: {
        name: string;
        tags: string[];
        collapsed: boolean;
        scrolled: boolean | string;
    }
    source: string[];
    outputs: Output[];
    execution_count: number;
}

export
interface UnrecognizedCell extends Cell {
}

export
interface Notebook {
    metadata: {
        kernelspec: {
            name: string;
            display_name: string;
        };
        language_info: {
            name: string;
            codemirror_mode?: string | {};
            file_extension?: string;
            mimetype?: string;
            pygments_lexer?: string
        };
        orig_nbformat?: number;
    }
    nbformat_minor: number;
    nbformat: number;
    cells: Cell[];
}

export
interface NBData {
    content: Notebook;
    name: string;
    path: string;
}
