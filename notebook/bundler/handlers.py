"""Tornado handler for bundling notebooks."""

# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.
import os
import shutil
import errno
import nbformat
import fnmatch
import glob
from notebook.utils import url_path_join, url2path
from notebook.base.handlers import IPythonHandler, path_regex
from notebook.services.config import ConfigManager
from ipython_genutils.importstring import import_item
from tornado import web, gen

class BundlerTools(object):
    """Set of common tools to aid bundler implementations."""
    def get_file_references(self, abs_nb_path, version):
        """Gets a list of files referenced either in Markdown fenced code blocks
        or in HTML comments from the notebook. Expands patterns expressed in 
        gitignore syntax (https://git-scm.com/docs/gitignore). Returns the 
        fully expanded list of filenames relative to the notebook dirname.

        Parameters
        ----------
        abs_nb_path: str
            Absolute path of the notebook on disk
        version: int
            Version of the notebook document format to use
        
        Returns
        -------
        list
            Filename strings relative to the notebook path
        """
        ref_patterns = self.get_reference_patterns(abs_nb_path, version)
        expanded = self.expand_references(os.path.dirname(abs_nb_path), ref_patterns)
        return expanded

    def get_reference_patterns(self, abs_nb_path, version):
        """Gets a list of reference patterns either in Markdown fenced code blocks
        or in HTML comments from the notebook.

        Parameters
        ----------
        abs_nb_path: str
            Absolute path of the notebook on disk
        version: int
            Version of the notebook document format to use
        
        Returns
        -------
        list
            Pattern strings from the notebook
        """
        notebook = nbformat.read(abs_nb_path, version)
        referenced_list = []
        for cell in notebook.cells:
            references = self.get_cell_reference_patterns(cell)
            if references:
                referenced_list = referenced_list + references
        return referenced_list

    def get_cell_reference_patterns(self, cell):
        '''
        Retrieves the list of references from a single notebook cell. Looks for
        fenced code blocks or HTML comments in Markdown cells, e.g.,

        ```
        some.csv
        foo/
        !foo/bar
        ```

        or 

        <!--associate:
        some.csv
        foo/
        !foo/bar
        -->

        Parameters
        ----------
        cell: dict
            Notebook cell object
        
        Returns
        -------
        list
            Reference patterns found in the cell
        '''
        referenced = []
        # invisible after execution: unrendered HTML comment
        if cell.get('cell_type').startswith('markdown') and cell.get('source').startswith('<!--associate:'):
            lines = cell.get('source')[len('<!--associate:'):].splitlines()
            for line in lines:
                if line.startswith('-->'):
                    break
                # Trying to go out of the current directory leads to
                # trouble when deploying
                if line.find('../') < 0 and not line.startswith('#'):
                    referenced.append(line)
        # visible after execution: rendered as a code element within a pre element
        elif cell.get('cell_type').startswith('markdown') and cell.get('source').find('```') >= 0:
            source = cell.get('source')
            offset = source.find('```')
            lines = source[offset + len('```'):].splitlines()
            for line in lines:
                if line.startswith('```'):
                    break
                # Trying to go out of the current directory leads to
                # trouble when deploying
                if line.find('../') < 0 and not line.startswith('#'):
                    referenced.append(line)

        # Clean out blank references
        return [ref for ref in referenced if ref.strip()]

    def expand_references(self, root_path, references):
        """Expands a set of reference patterns by evaluating them against the
        given root directory. Expansions are performed against patterns 
        expressed in the same manner as in gitignore 
        (https://git-scm.com/docs/gitignore).
        
        NOTE: Temporarily changes the current working directory when called.

        Parameters
        ----------
        root_path: str 
            Assumed root directory for the patterns
        references: list
            Reference patterns from get_reference_patterns
            
        Returns
        -------
        list
            Filename strings relative to the root path
        """
        globbed = []
        negations = []
        must_walk = []
        for pattern in references:
            if pattern and pattern.find('/') < 0:
                # simple shell glob
                cwd = os.getcwd()
                os.chdir(root_path)
                if pattern.startswith('!'):
                    negations = negations + glob.glob(pattern[1:])
                else:
                    globbed = globbed + glob.glob(pattern)
                os.chdir(cwd)
            elif pattern:
                must_walk.append(pattern)

        for pattern in must_walk:
            pattern_is_negation = pattern.startswith('!')
            if pattern_is_negation:
                testpattern = pattern[1:]
            else:
                testpattern = pattern
            for root, _, filenames in os.walk(root_path):
                for filename in filenames:
                    joined = os.path.join(root[len(root_path) + 1:], filename)
                    if testpattern.endswith('/'):
                        if joined.startswith(testpattern):
                            if pattern_is_negation:
                                negations.append(joined)
                            else:
                                globbed.append(joined)
                    elif testpattern.find('**') >= 0:
                        # path wildcard
                        ends = testpattern.split('**')
                        if len(ends) == 2:
                            if joined.startswith(ends[0]) and joined.endswith(ends[1]):
                                if pattern_is_negation:
                                    negations.append(joined)
                                else:
                                    globbed.append(joined)
                    else:
                        # segments should be respected
                        if fnmatch.fnmatch(joined, testpattern):
                            if pattern_is_negation:
                                negations.append(joined)
                            else:
                                globbed.append(joined)

        for negated in negations:
            try:
                globbed.remove(negated)
            except ValueError as err:
                pass
        return set(globbed)

    def copy_filelist(self, src, dst, src_relative_filenames):
        """Copies the given list of files, relative to src, into dst, creating
        directories along the way as needed and ignore existence errors.
        Skips any files that do not exist. Does not create empty directories
        from src in dst.

        Parameters
        ----------
        src: str 
            Root of the source directory
        dst: str 
            Root of the destination directory
        src_relative_filenames: list
            Filenames relative to src
        """
        for filename in src_relative_filenames:
            # Only consider the file if it exists in src
            if os.path.isfile(os.path.join(src, filename)):
                parent_relative = os.path.dirname(filename)
                if parent_relative:
                    # Make sure the parent directory exists
                    parent_dst = os.path.join(dst, parent_relative)
                    try:
                        os.makedirs(parent_dst)
                    except OSError as exc:
                        if exc.errno == errno.EEXIST:
                            pass
                        else:
                            raise exc
                shutil.copy2(os.path.join(src, filename), os.path.join(dst, filename))

class BundlerHandler(IPythonHandler):
    def initialize(self):
        """Create common tools for bundler implementations to use."""
        self.tools = BundlerTools()

    def get_bundler(self, bundler_id):
        """
        Get bundler metadata from config given a bundler ID.
        
        Parameters
        ----------
        bundler_id: str
            Unique bundler ID within the notebook/bundlerextensions config section
        
        Returns
        -------
        dict
            Bundler metadata with label, group, and module_name attributes
        
        
        Raises
        ------
        KeyError
            If the bundler ID is unknown
        """
        cm = ConfigManager()
        return cm.get('notebook').get('bundlers', {})[bundler_id]

    @web.authenticated
    @gen.coroutine
    def get(self, path):
        """Bundle the given notebook.
        
        Parameters
        ----------
        path: str
            Path to the notebook (path parameter)
        bundler: str
            Bundler ID to use (query parameter)
        """
        bundler_id = self.get_query_argument('bundler')
        model = self.contents_manager.get(path=url2path(path))

        try:
            bundler = self.get_bundler(bundler_id)
        except KeyError:
            raise web.HTTPError(404, 'Bundler %s not found' % bundler_id)
        
        module_name = bundler['module_name']
        try:
            # no-op in python3, decode error in python2
            module_name = str(module_name)
        except UnicodeEncodeError:
            # Encode unicode as utf-8 in python2 else import_item fails
            module_name = module_name.encode('utf-8')
        
        try:
            bundler_mod = import_item(module_name)
        except ImportError:
            raise web.HTTPError(500, 'Could not import bundler %s ' % bundler_id)

        # Let the bundler respond in any way it sees fit and assume it will
        # finish the request
        yield gen.maybe_future(bundler_mod.bundle(self, model))

_bundler_id_regex = r'(?P<bundler_id>[A-Za-z0-9_]+)'

default_handlers = [
    (r"/bundle/(.*)", BundlerHandler)
]
