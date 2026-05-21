class Socket{

    constructor(httpSocket){
        this.httpSocket = httpSocket;
    }

    end(response){
        this.httpSocket.end(response);
    }

    destroy(){
        this.httpSocket.destroy();
    }
}

export default Socket;