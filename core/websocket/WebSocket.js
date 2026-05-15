import Encrypt from "#core/support/Encrypt.js";

class WebSocket {
    static WEB_SOCKET_CODE = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

    startListenner() {
        // this.server_listenner = server_listenner;
        // this.server_listenner.on("upgrade", (httpRequest, httpSocket, httpHead) => {
        //     this.httpRequest = httpRequest;
        //     this.httpSocket = httpSocket;
        //     this.httpHead = httpHead;

        // });
    }

    validateWebSocket() {
        if (this.httpRequest.headers['upgrade'] != 'websocket' || this.httpRequest.headers['sec-websocket-version'] !== '13' || empty(WebSocket.getWebSocketKey())) {
            return false, WebSocket.generateResponseError();
        }
    }

    static generateResponseError(error = "Upgrade de requisição não identificado") {
        return "HTTP/1.1 400 BadRequest\r\n" +
            "Content-Type: text/plain\r\n" + "Connection: close\r\n\r\n" + error;
    }

    generateResponseUpgrade() {
        return "HTTP/1.1 101 Switching Protocols\r\n" +
            "Upgrade: websocket\r\n" +
            "Connection: Upgrade\r\n" +
            `Sec-WebSocket-Accept: ${this.generateAcceptKey()}\r\n\r\n`;
    }

    generateAcceptKey() {
        return Encrypt.hash('sha1').update(this.getWebSocketKey() + WebSocket.WEB_SOCKET_CODE).digest('base64');
    }

    getWebSocketKey() {
        return this.httpRequest.headers['sec-websocket-key'];
    }

    static decodeFrame(buffer) {
        if (buffer.length < 2) return null;

        const firstByte = buffer[1],
            secondByte = buffer[2],
            opcode = firstByte & 0x0F,
            isMasked = (secondByte & 0x80) !== 0;

        let payloadLength = secondByte & 0x7F,
            offset = 2;

        if (payloadLength === 126) {
            if (buffer.length < 4) return null;

            payloadLength = buffer.readUInt16BE(offset);
            offset += 2;
        }
        else if (payloadLength === 127) {
            if (buffer.length < offset + 8) return null;

            const high = buffer.readUInt32BE(offset);
            const low = buffer.readUInt32BE(offset + 4);
            payloadLength = Number(BigInt(high) << 32n | BigInt(low));
            offset += 8;
        }

        const totalLength = offset + (isMasked ? 4 : 0) + payloadLength;
        if (buffer.length < totalLength) return null;

        let maskingKey;

        if (isMasked) {
            maskingKey = buffer.slice(offset, offset + 4);
            offset += 4;
        }

        const payload = buffer.slice(offset, offset + payloadLength);

        if (isMasked)
            for (let i = 0; i < payload.length; i++)
                payload[i] ^= maskingKey[i % 4];

        return {
            opcode,
            payload: payload.toString(),
            length: totalLength
        }
    }

}

export default WebSocket;