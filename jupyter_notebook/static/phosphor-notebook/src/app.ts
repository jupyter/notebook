import Bootstrapper = phosphor.shell.Bootstrapper;

export
class NotebookApplication extends Bootstrapper {
    configurePlugins(): Promise<void> {
        return this.pluginList.add([
            //plugins
        ]);
    }
}

console.log('loaded app');
