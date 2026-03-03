class HttpKernel {
    constructor(container) {
        this.container = container;
    }

    handle(req, res, route) {
        const request = this.container.make("request", req, res);

        const [controllerName, controllerMethod] = route.controller.split("::");

        return Config.get("controllers").then(controllerPath => {
            const controllerFile = new File(controllerName + ".js", controllerPath);
            return controllerFile.importJSFile().then(controller_ => {
                const controller = (this.container.make(controller_)).setConfigFile(request);
                
                if (Utils.is_empty(controller[controllerMethod]))
                    return Response.error(res, 401, { "message": "Page not found", "title": "Erro!" });

                const response = controller[controllerMethod](request);

                if (response instanceof Promise)
                    response.then(response_ => {
                        if (!Utils.is_empty(response_))
                            response_.renderResponse(res);
                    }).catch(err => {
                        throw err
                    });
                else
                    if (!Utils.is_empty(response))
                        response.renderResponse(res);
            }).catch(err => {
                Log.error(err);
                return renderError(500, err);
            });
        });
    }

}