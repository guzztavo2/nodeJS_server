import File from "#core/filesystems/File.js";
import Config from "#core/support/Config.js";
import Log from "#core/support/Log.js";
import Utils from "#core/support/Utils.js";
import Response from "#core/http/Response.js";

class HttpKernel {
    constructor(container) {
        this.container = container;
    }

    handle(route) {
        const [controllerName, controllerMethod] = route.controller.split("::");

        const renderHttpError = (http_code = 404, err = null) => {
            return Response.error(http_code, err)
        };

        const renderHttpResponse = (response) => {
            if (!empty(response) && response.constructor.name === "ResponseType") response.renderResponse();
            else Response.data(response, 200).renderResponse();
        };

        return Config.get("controllers").then(controllerPath => {
            return this.container.make("request").then(request => {
                const controllerFile = new File(controllerName + ".js", controllerPath);

                return controllerFile.importJSFile().then(controllerClass =>
                    this.container.make(controllerClass).then(controller => {
                        controller = controller.setConfigFile(request);

                        if (empty(controller[controllerMethod]))
                            return renderHttpError(401, { "message": "Page not found", "title": "Erro!" });

                        const response = controller[controllerMethod](request);

                        if (response instanceof Promise)
                            return response.then(response_ => renderHttpResponse(response_)).catch(err => { throw err });
                        else
                            renderHttpResponse(response);
                    })).catch(err => {
                        Log.error(err);
                        return renderHttpError(500, err);
                    });
            });
        });
    }
}

export default HttpKernel;