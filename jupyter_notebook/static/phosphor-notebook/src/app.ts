import Bootstrapper = phosphor.shell.Bootstrapper;

export
class NotebookApplication extends Bootstrapper {
    configurePlugins(): Promise<void> {
        return this.pluginList.add([
            // Notebook
        ]);
    }
}

console.log('loaded app');
