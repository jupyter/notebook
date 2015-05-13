// Notebook format interfaces

// In the notebook format *disk* representation, this would be string | string[]
export type multilineString = string;

export
interface MimeBundle {
    // values are always multilineString if we pretend that the application/json key doesn't exist
    // in fact, the in-memory representation always is a string
    [key: string]: multilineString;

    // we fudge the standard a bit here by not telling Typescript about the application/json
    // key, which will be a Javascript object if it exists.  If we want to tell, then uncomment below:
    //"application/json": {};
}

export
interface ExecuteResult {
    output_type: string; // "execute_result"
    execution_count: number;
    data:  MimeBundle;
    metadata: {};
}

export
interface DisplayData {
    output_type: string; // "display_data"
    data: MimeBundle;
    metadata: {};
}

export
interface Stream {
    output_type: string; // "stream"
    name: string;
    text: multilineString;
}

export
interface JupyterError {
    output_type: string; // "error"
    ename: string;
    evalue: string;
    traceback: string[];
}

export
type Output = ExecuteResult | DisplayData | Stream | JupyterError;

export
type Cell = BaseCell | RawCell | MarkdownCell | CodeCell;

export
interface BaseCell {
    cell_type: string;
    metadata: {
        name?: string;
        tags?: string[];
    }
}

export
interface RawCell extends BaseCell {
    cell_type: string; /*"raw"*/
    source: multilineString;
    metadata: {
        format?: string;
    }
}

export
interface MarkdownCell extends BaseCell {
    cell_type: string; /*"markdown"*/
    source: multilineString;
}

export
interface CodeCell extends BaseCell {
    cell_type: string; /*"code"*/
    source: multilineString;
    metadata: {
        collapsed?: boolean;
        scrolled?: boolean | string;
    }
    outputs: Output[];
    execution_count: number;
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
