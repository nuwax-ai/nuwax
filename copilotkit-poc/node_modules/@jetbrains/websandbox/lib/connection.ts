import { propertyByPath, splitPath } from "./object-path";
import type {API} from "./types";

export const TYPE_MESSAGE = 'message';
export const TYPE_RESPONSE = 'response';
export const TYPE_SET_INTERFACE = 'set-interface';
export const TYPE_SERVICE_MESSAGE = 'service-message';

// @ts-expect-error this is IE11 obsolete check. It is not typed
const isIE11 = !!window.MSInputMethodContext && !!document.documentMode;

const defaultOptions = {
  //Will not affect IE11 because there sandboxed iframe has not 'null' origin
  //but base URL of iframe's src
  allowedSenderOrigin: undefined
};

export interface ConnectionOptions {
  allowedSenderOrigin?: string;
}

class Connection {
  incrementalID: number;
  options: ConnectionOptions;
  postMessage: typeof window.postMessage;
  remote: API = {};
  serviceMethods: API = {};
  localApi: API = {};
  callbacks: {[key: string]: {successCallback: Function, failureCallback: Function}} = {};
  remoteMethodsWaitPromise: Promise<void>;
  _resolveRemoteMethodsPromise: null | (() => void) = null;

  constructor(
    postMessage: typeof window.postMessage, 
    registerOnMessageListener: (listener: (e: MessageEvent) => void) => void, 
    options: ConnectionOptions = {}
  ) {
    this.options = {...defaultOptions, ...options};
    //Random number between 0 and 100000
    this.incrementalID = Math.floor(Math.random() * 100000);

    this.postMessage = postMessage;

    this.remoteMethodsWaitPromise = new Promise(resolve => {
      this._resolveRemoteMethodsPromise = resolve;
    });

    registerOnMessageListener((e: MessageEvent) => this.onMessageListener(e));
  }

  /**
     * Listens to remote messages. Calls local method if it is called outside or call stored callback if it is response.
     * @param e - onMessage event
     */
  onMessageListener(e: MessageEvent) {
    const data = e.data;

    const {allowedSenderOrigin} = this.options;
    if (allowedSenderOrigin && e.origin !== allowedSenderOrigin && !isIE11) {
      return;
    }

    if (data.type === TYPE_RESPONSE) {
      this.popCallback(data.callId, data.success, data.result);
    } else if (data.type === TYPE_MESSAGE) {
      this
        .callLocalApi(data.methodName, data.arguments)
        .then(res => this.responseOtherSide(data.callId, res))
        .catch(err => this.responseOtherSide(data.callId, err, false));
    } else if (data.type === TYPE_SET_INTERFACE) {
      this.setInterface(data.apiMethods);
      this.responseOtherSide(data.callId);
    } else if (data.type === TYPE_SERVICE_MESSAGE) {
      this
        .callLocalServiceMethod(data.methodName, data.arguments)
        .then(res => this.responseOtherSide(data.callId, res))
        .catch(err => this.responseOtherSide(data.callId, err, false));
    }
  }

  postMessageToOtherSide(dataToPost: any) {
    this.postMessage(dataToPost, '*');
  }

  /**
     * Sets remote interface methods
     * @param remote - hash with keys of remote API methods. Values is ignored
     */
  setInterface(remoteMethods: string[]) {
    this.remote = {};

    remoteMethods.forEach(
      (key: string) => {
        // If key is nested, we need to create nested structure
        const parts = splitPath(key);
        let current = this.remote;
        for (let i = 0; i < parts.length - 1; i++)
        {
          const part = parts[i];
          if (!current[part] || typeof current[part] !== 'object') {
            current[part] = {};
          }
          current = current[part] as API;
        }
        current[parts[parts.length - 1]] = this.createMethodWrapper(key);
      }
    );

    this._resolveRemoteMethodsPromise?.();
  }

  private getMethodsFromInterface(api: API) {
    return Object.keys(api).reduce((acc, key) => {
      if (typeof api[key] === 'object') {
        acc.push(...this.getMethodsFromInterface(api[key] as API).map(subKey => `${key}.${subKey}`));
      } else {
        acc.push(key);
      }
      return acc;
    }, [] as string[]);
  }

  setLocalApi(api: API) {
    return new Promise((resolve, reject) => {
      const id = this.registerCallback(resolve, reject);
      this.postMessageToOtherSide({
        callId: id,
        apiMethods: this.getMethodsFromInterface(api),
        type: TYPE_SET_INTERFACE
      });
    }).then(() => this.localApi = api);
  }

  setServiceMethods(api: API) {
    this.serviceMethods = api;
  }

  /**
     * Calls local method
     * @param methodName
     * @param args
     * @returns {Promise.<*>|string}
     */
  callLocalApi(methodName: string, args: any[]) {
    const method = propertyByPath<Function>(this.localApi, methodName);
    if (!method) {
      throw new Error(`Local method "${methodName}" is not registered`);
    }
    return Promise.resolve(method.call(this, ...args));
  }

  /**
     * Calls local method registered as "service method"
     * @param methodName
     * @param args
     * @returns {Promise.<*>}
     */
  callLocalServiceMethod(methodName: string, args: any[]) {
      const method = propertyByPath<Function>(this.serviceMethods, methodName);
    if (!method) {
      throw new Error(`Service method ${methodName} is not registered`);
    }
    return Promise.resolve(method.call(this, ...args));
  }

  /**
     * Wraps remote method with callback storing code
     * @param methodName - method to wrap
     * @returns {Function} - function to call as remote API interface
     */
  createMethodWrapper(methodName: string) {
    return (...args: any[]) => {
      return this.callRemoteMethod(methodName, ...args);
    };
  }

  /**
     * Calls other side with arguments provided
     * @param id
     * @param methodName
     * @param args
     */
  callRemoteMethod(methodName: string, ...args: any[]) {
    return new Promise((resolve, reject) => {
      const id = this.registerCallback(resolve, reject);
      this.postMessageToOtherSide({
        callId: id,
        methodName: methodName,
        type: TYPE_MESSAGE,
        arguments: args
      });
    });
  }

  /**
     * Calls remote service method
     * @param methodName
     * @param args
     * @returns {*}
     */
  callRemoteServiceMethod(methodName: string, ...args: any[]) {
    return new Promise((resolve, reject) => {
      const id = this.registerCallback(resolve, reject);
      this.postMessageToOtherSide({
        callId: id,
        methodName: methodName,
        type: TYPE_SERVICE_MESSAGE,
        arguments: args
      });
    });
  }

  /**
     * Respond to remote call
     * @param id - remote call ID
     * @param result - result to pass to calling function
     */
  responseOtherSide(id: string, result?: any, success = true) {
    if (result instanceof Error) {
      // Error could be non-serializable, so we copy properties manually
      result = [...Object.keys(result), 'message'].reduce((acc, it) => {
        acc[it] = result[it];
        return acc;
      }, {} as {[k: string]: any});
    }

    const doPost = () =>
      this.postMessage(
        {
          callId: id,
          type: TYPE_RESPONSE,
          success,
          result
        },
        '*'
      );

    try {
      doPost();
    } catch (err) {
      console.error('Failed to post response, recovering...', err); // eslint-disable-line no-console
      if (err instanceof DOMException) {
        result = JSON.parse(JSON.stringify(result));
        doPost();
      }
    }
  }

  /*
     * Stores callbacks to call later when remote call will be answered
     */
  registerCallback(successCallback: Function, failureCallback: Function) {
    const id = (++this.incrementalID).toString();
    this.callbacks[id] = {successCallback, failureCallback};
    return id;
  }

  /**
     * Calls and delete stored callback
     * @param id - call id
     * @param success - was call successful
     * @param result - result of remote call
     */
  popCallback(id: string, success: boolean, result: any) {
    const callback = this.callbacks[id];
    if (!callback) {
      return;
    }
    if (success) {
      callback.successCallback(result);
    } else {
      callback.failureCallback(result);
    }
    delete this.callbacks[id];
  }
}

export default Connection;
