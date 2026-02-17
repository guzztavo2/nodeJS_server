import fs from 'fs';
import File from '#core/filesystems/File.js';
import Directory from '#core/filesystems/Directory.js';
import Env from '#core/support/Env.js';

class Response {
    SERVER_SETTINGS;
    env_configuration;
    HEADERS = [];
    dataToFront = {};
    session;
    response;

    static VIEWS_DIRECTORY = new Directory("./resources/views");

    constructor(session = null, response = null) {
        Env.synchronizeDotEnv();
        this.env_configuration = {
            APP_URL: process.env.APP_URL,
            APP_PORT: process.env.APP_PORT
        }
        this.SERVER_SETTINGS = this.env_configuration['APP_URL'] + ":" + this.env_configuration['APP_PORT'];

        this.response = response || false;

        if (session !== null)
            this.session = session;
    }

    view(file_dir, status = 200, data) {
        const fileView = this.checkFile(file_dir);
        if(!fileView)
            return Response.error(this.response, 501, "Not possible execute command");

        return new ResponseType('view', fileView ? fileView.getAbsolutePath() : null, status,
            { HOME_URL: this.SERVER_SETTINGS },
            Object.assign(this.dataToFront, data), this.HEADERS
        );
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

        return new ResponseType('redirect', url);
    }
    
    json(data, status = 200) {
        return new ResponseType('json', null, status, null, data, this.HEADERS)
    }

    data(data, status = 200) {
        return new ResponseType('data', null, status, null, data, this.HEADERS);
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
            return new ResponseType('download', null, status, null, Object.assign(this.dataToFront, data), this.HEADERS);
        }
    }

    setHeader(key, value) {
        this.HEADERS = this.HEADERS.concat({ [key]: value });
    }

    deleteHeader(key) {
        for (const header of this.HEADERS)
            if (header[key] !== undefined)
                this.HEADERS.splice(this.HEADERS.indexOf(header), 1);
    }

    static error(res, status = 404, error = null) {
        let data = {
            'title': 'Page of Error'
        };

        if (typeof error == 'string')
            data = Object.assign(data, { 'message': error });
        else if (error !== null && typeof error == 'object') {
            if (typeof error.message !== 'undefined')
                data = Object.assign(data, error);

            if (typeof error.stack !== 'undefined')
                data = Object.assign(data, { 'error_stack': error.stack });
        }

        const responseObj = new Response();

        const object = {
            'object': (data, status) => {
                responseObj.view('error', status ?? 404, data).renderResponse(res);
                return true;
            },
            'string': (data, status) => {
                responseObj.view('error', status ?? 404, data).renderResponse(res);
                return true;
            }
        }

        if (error == null || Object.keys(object).indexOf(typeof error) == -1 || object[typeof error](data, status) !== true)
            responseObj.view('error', 404, data).renderResponse(res);
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

    renderResponse(res) {
        if (res._headerSent)
            return;

        const setHeaders = (res, headers) => {
            if (headers == null || typeof headers == 'undefined' || headers.length == 0)
                return;

            for (const header of headers) {
                const key = Object.keys(header)[0];
                res.setHeader(key, header[key])
            }
        }

        setHeaders(res, this.headers)

        const response = {
            'view': () => {
                if (this.dataElements && this.dataElements !== undefined)
                    res.status(this.status).render(Directory.getAbsolutePath(this.file), Object.assign(this.server_configuration, this.dataElements, { statusCode: this.status }));
                else
                    res.status(this.status).render(Directory.getAbsolutePath(this.file), Object.assign(this.server_configuration, { statusCode: this.status }));
                return true;
            },
            'json': () => {
                if (typeof this.dataElements !== 'object')
                    res.status(this.status).json(JSON.stringify(this.dataElements));
                else
                    res.status(this.status).json(this.dataElements);
                return true;
            },
            'data': () => {
                res.status(this.status).send(this.dataElements);
                return true;
            },
            'download': () => {
                res.status(this.status).download(this.dataElements);
                return true;
            },
            'redirect': () => {
                res.redirect(this.file)
                return true;
            }
        }
        if (Object.keys(response).indexOf(this.type) == -1 || response[this.type]() !== true)
            throw Error("Not possible execute this file");

        res.end();
    }
}
export default Response;