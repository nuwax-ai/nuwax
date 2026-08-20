import Connection from './connection';

class Frame {
  connection: Connection;

  constructor() {
    this.connection = new Connection(
      window.parent.postMessage.bind(window.parent),
      listener => {
        const sourceCheckListener = (event: MessageEvent) => {
          if (event.source !== window.parent) {
            return;
          }
          return listener(event);
        };
        window.addEventListener('message', sourceCheckListener);
      }
    );

    this.connection.setServiceMethods({
      runCode: (code: string) => this.runCode(code),
      importScript: (path: string) => this.importScript(path),
      injectStyle: (style: string) => this.injectStyle(style),
      importStyle: (path: string) => this.importStyle(path)
    });

    this.connection.callRemoteServiceMethod('iframeInitialized');
  }

  /**
     * Creates script tag with passed code and attaches it. Runs synchronous
     * @param code
     */
  runCode(code: string) {
    const scriptTag = document.createElement('script');
    scriptTag.innerHTML = code;
    document.getElementsByTagName('head')[0].appendChild(scriptTag);
  }

  importScript(scriptUrl: string) {
    const scriptTag = document.createElement('script');
    scriptTag.src = scriptUrl;
    document.getElementsByTagName('head')[0].appendChild(scriptTag);
    return new Promise<void>(resolve => scriptTag.onload = () => resolve());
  }

  injectStyle(style: string) {
    const styleTag = document.createElement('style');
    styleTag.innerHTML = style;
    document.getElementsByTagName('head')[0].appendChild(styleTag);
  }

  importStyle(styleUrl: string) {
    const linkTag = document.createElement('link');
    linkTag.rel = 'stylesheet';
    linkTag.href = styleUrl;
    document.getElementsByTagName('head')[0].appendChild(linkTag);
  }
}

// @ts-expect-error we explicitly export library to global namespace because
const Websandbox = window.Websandbox || new Frame();

// @ts-expect-error we explicitly export library to global namespace because
// Webpack won't do it for us when this file is loaded via code-loader
window.Websandbox = Websandbox;

export default Websandbox;
