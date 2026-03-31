class Promise {

    callback;

    constructor(callBackExec) {
        this.callback = new global.Promise(callBackExec);
    }

    then(onFulfilled, onRejected) {
        return this.callback.then(onFulfilled, onRejected);
    }

    catch(onRejected) {
        return this.callback.catch(onRejected);
    }

    static checkPromise(value){
        if(value instanceof Promise)
            return value;
        return new Promise((resolve) => resolve(value));
    }
}



export default Promise;