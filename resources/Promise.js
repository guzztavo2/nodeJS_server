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
}



export default Promise;