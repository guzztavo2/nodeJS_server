import Application from '#core/Application.js';
import Cli from '#core/support/Cli.js';
import Log from '#core/support/Log.js';
import Container from "#core/container/Container.js";
import Route from "#core/http/Route.js";
import Collection from '#core/support/Collection.js';

const route = new Route();
const container = new Container();
// container.bind(null, () => new Application())
//     .then(container.bind(null, () => new Element()))
//     .then(res => {
//         console.log(container);
//     })

// const collection = new Collection();

// const values = Array(4).fill(() => new Application());

// values.reduce((p, v) => p.then(() => collection.add(v)), Promise.resolve()).then(() => {
//     return collection.get([1,2,3,4,5]).then(el => {
//         console.log(el);
//     });
//     console.log(item);
// })
//     Promise.all([
//     collection.add(() => new Application()),
//     collection.add(() => new Application()),
//     collection.add(() => new Application())
// ])
//     .then(res => {
//         collection.first().then(element => {
//             console.log(element);
//         })
//     })



const application = new Application();

function drawBar(height = 1) {
    return new Promise(res => {
        const width = (process.stdout.columns - 1);
        const width_total = Math.floor(width * height);
        for (let x = 0; x < width_total; x++) {
            setTimeout(() => {
                Log.write("█", false, "\x1b[31m");
                if ((x + 1) % width == 0) {
                    Log.write("█", false, "\x1b[31m");
                    Log.write("\n");
                }
                if (x == width_total - 1) {
                    res();
                }
            }, x * 2);
        }
    })
}
function transitionText(width, pass = 2, callback) {
    return new Promise(res => {
        for (let x = 0; x <= width; x++) {
            setTimeout(() => {
                const resolver = callback(x, width);
                if (resolver instanceof Promise)
                    return resolver.then(_ => {
                        if (x === width) res();
                    });
                else
                    if (x === width) res();
            }, x * pass);
        }
    })
}

function wrapText(text, width) {
    const words = text.split(/\s+/);
    const lines = [];
    let currentLine = "";
    for (const word of words) {
        if ((currentLine + word).length + 1 <= width) {
            currentLine += (currentLine ? " " : "") + word;
        }
        else {
            lines.push(` ${currentLine} `);
            currentLine = word;
        }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
}

function transitionTextLine(width, pass, char) {
    return new Promise(res => {
        let x = 0;
        function step() {
            if (x < width) {
                process.stdout.write(char);
                x++;
                setTimeout(step, pass);
            } else {
                process.stdout.write("\n"); // quebra controlada
                res();
            }
        }
        step();
    });
}

function centerText(text) {
    const cols = process.stdout.columns;
    const width = cols - 1;


    const textWrapped = wrapText(text, width - 8);
    text = textWrapped.join("");
    const padding = Math.floor((Math.max(text.length, width) - Math.min(text.length, width)) / 2);
    const padding_calc = Math.min(Math.max(0, padding), width);
    const isCenterized = padding_calc === width ? true : false;

    return transitionText((width), 2, (x, width) => {
        Log.write("█", false, "\x1b[32m");
    })
        .then(_ => transitionText(padding_calc, 2, (x, width) => Log.write("█", false, "\x1b[32m", "\x1b[41m")))
        .then(_ => textWrapped.reduce((p, text_) => p.then(() =>
            transitionText(isCenterized ? padding_calc : text_.length, 2, (x, width) => {
                if (isCenterized) {
                    if (x == 0)
                        Log.write("█", false, "\x1b[32m");
                    else if (x == width) {
                        Log.write("█", false, "\x1b[32m");
                    } else
                        if (text_[x - 4])
                            Log.write(text_[x - 4], false, "\x1b[34m", "\x1b[41m");
                        else
                            Log.write(" ", false, "\x1b[31m", "\x1b[41m");
                } else {
                    if (text_[x])
                        Log.write(text_[x], false, "\x1b[34m", "\x1b[41m");
                }
            })), Promise.resolve()))
        .then(_ => transitionText(isCenterized ? width : padding_calc, 2, (x, width) => {
            Log.write("█", false, "\x1b[32m", "\x1b[41m")
            if (x == width)
                Log.write("\n");
        }));
}

// const file = new File("menu_lang.json", "./config");
// Application.env_configurations.init().then(env => {
//     console.log(env);
//     file.readData(true).then(langs => {
//         console.log(langs);
//     })
// })

// drawBar(2).reduce((p, v) => p.then());
drawBar(2).then(_ => {
    // return centerText("Bem vindo ao servidor!").then(_ => {
    // return centerText(`Pariatur minim tempor pariatur labore anim anim exercitation id esse. Consequat sint ipsum laborum ut aute excepteur. Officia ut voluptate minim consectetur tempor ad sunt ex esse exercitation ea. Et minim ut elit enim quis nisi dolor excepteur occaecat et ea. Incididunt duis veniam irure qui id quis ad excepteur commodo anim non.Magna ea consequat velit minim incididunt nostrud mollit duis Lorem occaecat aute enim ad cillum. Mollit consequat minim aute aliqua ea nisi fugiat nulla est quis quis. Officia tempor qui sit irure fugiat consequat nisi adipisicing. Aliquip nulla duis ea et veniam id consequat duis ex exercitation dolore. Eiusmod laborum adipisicing quis velit mollit irure adipisicing et quis in voluptate.
    // Proident enim fugiat minim tempor. Excepteur proident est anim ad tempor aliquip magna et tempor. Anim occaecat est sit sunt eu sint fugiat eiusmod cillum amet ut cupidatat. Incididunt minim sunt qui mollit sit irure.`);

    // })
    // centerText("Olá mundo!");


});


const readKey = () => {
    return Cli.readyKey(key => {
        const keyTransformed = key.toLowerCase();
        if (key === "\u001B[A" || keyTransformed == "w") // seta para cima
            return "up";
        if (key === "\u001B[B" || keyTransformed == "s") // seta para baixo
            return "down";
        // case "\u001B[C" || keyTransformed == "d": // seta para direita
        // return "right";
        // case "\u001B[D" || keyTransformed == "a": // seta para esquerda
        // return "left";
        if (JSON.stringify(key) == '"\\u0003"' || keyTransformed == "q") // Ctrl+C ou Q
            throw Error("Exit");
    }
    ).then(key => {
        console.log(key);
        return readKey();
    }).catch((key) => {
        console.log(key);
        console.log("No valid key pressed, try again.");
        return readKey();
    });
}
readKey().then();

// Cli.readLine("Please enter what you want: ").then(input => {
//     Cli.log(`You entered: ${input}`);

// });

try {

    // new Promise(res => {
        application.startServer()
    //     setTimeout(() => res(), 2000);
    // }).then(() => {
    //     new Promise(res => {
    //         application.stopServer(); console.log("Server closed")
    //         setTimeout(() => res(), 2000);
    //     }).then(() => {
    //         application.startServer();
    //     }).then(_ => {
    //         console.log("teste");
    //     });
    // })


} catch (err) {
    console.error(err);
}

// export default Application.server;