import fs from 'fs';
import File from '#core/filesystems/File.js';
import Directory from '#core/filesystems/Directory.js';
import Utils from '#core/support/Utils.js';
import Request from "#core/http/Request.js";
import Collection from '#core/support/Collection.js';

class Response {
    static SERVER_SETTINGS;
    env_configuration;
    dataToFront = {};
    session;
    static httpResponse;
    static VIEWS_DIRECTORY = new Directory("/resources/views");

    constructor(session = null) {
        this.env_configuration = {
            APP_URL: process.env.APP_URL,
            APP_PORT: process.env.APP_PORT
        }
        Response.SERVER_SETTINGS = this.env_configuration['APP_URL'] + ":" + this.env_configuration['APP_PORT'];

        if (!empty(session))
            this.session = session;

        this.setHeader();
    }

    setHttpResponse(httpResponse) {
        Response.setHttpResponse(httpResponse);
        return this;
    }

    static setHttpResponse(httpResponse) {
        Response.httpResponse = httpResponse;
        if (Response.httpResponse)
            Request.httpRequest = httpResponse.req;
    }

    static serverConfigurations() {
        return { HOME_URL: Response.SERVER_SETTINGS };
    }

    responseTypeFactory(type, status, file = null, server_configuration = null, data = null, headers = null) {
        server_configuration = Object.assign(Response.serverConfigurations(), server_configuration);

        if (!empty(this.dataToFront)) {
            if (!empty(data) && (Utils.isArray(data) || Utils.isClass(data, "object")))
                data = Object.assign(this.dataToFront, data || {});
            else
                if (empty(data))
                    data = this.dataToFront;
                else
                    data = Object.assign(this.dataToFront, { 0: data } || {});
        }

        this.appendHeaders(headers);
        return this.headers.toObject().then(headers => {
            if (!empty(headers)) {
                return Response.responseTypeFactory(type, status, file, server_configuration, data, headers)
            } else
                return Response.responseTypeFactory(type, status, file, server_configuration, data, null)
        });

    }

    static responseTypeFactory(type, status, file = null, server_configuration = null, data = null, headers = null) {
        server_configuration = Object.assign(Response.serverConfigurations(), server_configuration);
        file = empty(file) ? null : file.getAbsolutePath();
        return new ResponseType(type, file, status, server_configuration, data, headers);
    }

    view(file_dir, status = 200, data) {
        const fileView = this.checkFile(file_dir);
        if (!fileView)
            return Response.error(501, "Not possible find the view: " + file_dir);

        return this.responseTypeFactory("view", status, fileView, null, data);
    };

    back(data = undefined) {
        const before = this.session.getByKey('responses')['before'] ?? undefined;

        if (data !== undefined)
            this.session.create('responses', { 'data': data })

        if (before !== undefined)
            return new ResponseType('redirect', data = before);

        return false;
    }

    redirect(url, data = undefined) {
        if (data !== undefined)
            this.session.create('responses', { 'data': data })

        return this.responseTypeFactory("redirect", null, url, null);
    }

    json(data, status = 200) {
        return this.responseTypeFactory("json", status, null, null, data);
    }

    data(data, status = 200) {
        return this.responseTypeFactory("data", status, null, null, data);
    }

    checkFile(file) {
        const fileView = new File(file.replace('.', '/') + '.html', Response.VIEWS_DIRECTORY.getAbsolutePath());
        if (fileView.exists())
            return fileView;

        fileView.setFileName(file.replace('.', '/') + '.ejs');
        if (fileView.exists())
            return fileView;

        return false;
    }

    downloadFile(path_file, status = 200) {
        if (fs.existsSync(path_file)) {
            return this.responseTypeFactory("download", status, null, null, data);
        }
    }

    setHeader(headers = {}) {
        this.headers = new Collection();
        this.appendHeaders(headers);
    }

    appendHeaders(headers = {}) {
        if (!empty(headers))
            for (const key in headers) {
                const val = headers[key];
                this.addHeader(key, val);
            }
    }
    addHeader(key, value) {
        if (empty(value))
            return this;

        if (Utils.isClass(value, "object"))
            value = JSON.stringify(value);

        this.headers.add(value, key);

        return this;
    }

    deleteHeader(key) {
        return this.headers.removeByKey(key).then(collection => this.headers = collection).then(() => this);
    }

    error(status = 404, error = null) {
        return Response.error(status, error);
    }

    static data(data, status = 200, headers = null) {
        return Response.responseTypeFactory("data", status, null, null, data, headers);
    }

    static error(status = 404, error = null) {
        let data = {
            'title': 'Page of Error'
        };

        const checkIsEmpty = (key, data, error) => {
            if (!empty(error[key]))
                data[key] = error[key];
            return data;
        }

        if (typeof error == 'string')
            data = Object.assign(data, { 'message': error });
        else if (error !== null && typeof error == 'object') {
            data = checkIsEmpty("message", data, error);
            data = checkIsEmpty("stack", data, error);
            data = checkIsEmpty("title", data, error);
        }

        const responseObj = new Response();

        const object = {
            'object': (data, status) => {
                return responseObj.view('error', status ?? 404, data).then(response => response.renderResponse(Response.httpResponse));
            },
            'string': (data, status) => {
                return responseObj.view('error', status ?? 404, data).then(response => response.renderResponse(Response.httpResponse));
            }
        }

        if (Object.keys(object).indexOf(typeof error) == -1 || object[typeof error](data, status) !== true)
            return responseObj.view('error', status, data).then(response => response.renderResponse(Response.httpResponse));
    }
}

class ResponseType {
    file;
    status;
    server_configuration;
    dataElements;
    headers;
    type;

    constructor(type, file = null, status = null, server_configuration = null, data = null, headers = null) {
        this.type = type;
        this.file = file;
        this.status = status;
        this.server_configuration = server_configuration;
        this.dataElements = data;
        this.headers = headers;
    }

    renderResponse(httpResponse = null) {
        httpResponse = !httpResponse ? Response.httpResponse : httpResponse;
        if (!httpResponse || httpResponse.headersSent)
            return;

        const setHeaders = (httpResponse, headers) => {
            if (headers == null || typeof headers == 'undefined' || headers.length == 0)
                return;

            for (const key in headers) {
                const header = headers[key];
                httpResponse.setHeader(key, header);
            }
        }

        setHeaders(httpResponse, this.headers);

        const responseActions = {
            'view': () => {
                if (this.dataElements && this.dataElements !== undefined)
                    httpResponse.status(this.status).render(Directory.getAbsolutePath(this.file), Object.assign(this.server_configuration, this.dataElements, { statusCode: this.status }));
                else
                    httpResponse.status(this.status).render(Directory.getAbsolutePath(this.file), Object.assign(this.server_configuration, { statusCode: this.status }));
                return true;
            },
            'json': () => {
                if (typeof this.dataElements !== 'object')
                    httpResponse.status(this.status).json(JSON.stringify(this.dataElements));
                else
                    httpResponse.status(this.status).json(this.dataElements);
                return true;
            },
            'data': () => {
                httpResponse.status(this.status).send(this.dataElements);
                return true;
            },
            'download': () => {
                httpResponse.status(this.status).download(this.dataElements);
                return true;
            },
            'redirect': () => {
                httpResponse.redirect(this.file)
                return true;
            }
        }
        if (Object.keys(responseActions).indexOf(this.type) == -1 || responseActions[this.type]() !== true)
            throw Error("Not possible execute this file");

        httpResponse.end();
    }
}
export default Response;