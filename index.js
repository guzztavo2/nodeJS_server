import Application from '#core/Application.js';
import Cli from '#core/support/Cli.js';
import Log from '#core/support/Log.js';

class MainCLI extends Cli {
    static application = new Application();
    selector = ">";

    menus = [
        new Menu("Start Server", 1, null, true),
        new Menu("Migrate", 2),
        new Menu("Configurations", 3, async (menu) =>
            await this.renderMenu(menu.submenus, () => Cli.log("Configurations From Server\n\n\n", false)), false, [new Menu("Back", 4, () => this.renderMenu(this.menus), false)]),
        new Menu("Exit", 4, async (menu) =>
            await this.renderMenu(menu.submenus, () => Cli.log("Exit from App:\n\n\nYou sure want exit?", false)), false,
            [new Menu("Yes", 1, () => Cli.exit(), false), new Menu("No", 2, () => this.renderMenu(this.menus), true)])
    ];

    prepareMenuMigration() {
        const configurationsMenu = this.findMenu("Configurations");

        const menuMigration = new Menu("Migration", 1, async menu =>
            await this.renderMenu(menu.submenus, () => Cli.log("Migrations \n\n\n", false)), true, []);

        const tables = { migrated: [], not_migrated: [] }
        menuMigration.submenus.push(new Menu("List migrations", 1,
            async menu => await this.renderMenu(menu.submenus, async () => {
                Cli.log("Listing migrations:\n\n\n", false);
                const migrationPath = await Config().get("migrations");
                const migrationDirectory = Directory(migrationPath)
                const db = await Container().make("db");
                const results = await db.selectAllMigrations();

                const checkAllMigrations = async (migrationDirectory_, results) => {
                    const migrationDirectoryList = await (await migrationDirectory_.readRecursiveDirectory()).valuesToArray();
                    Cli.write(`\n${migrationDirectory_.getRelativePath()}:\n\n`)
                    for (const migration of migrationDirectoryList) {
                        if (migration instanceof File()) {
                            Cli.write(`${migration.getFileName()} - `, false, "\x1b[1m")
                            if (results.find(val => val.name === migration.getAbsolutePath())) {
                                Cli.write(`Migrated`, false, "\x1b[92m")
                                tables.migrated.push(migration);
                            } else {
                                Cli.write(`Not Migrated`, false, "\x1b[91m")
                                tables.not_migrated.push(migration);
                            }
                            Cli.write("\n");
                        } else
                            await checkAllMigrations(migration, results);
                    }
                };

                await checkAllMigrations(migrationDirectory, results);
                if (!empty(tables.not_migrated) && !menuMigration.submenus[0].submenus.find(val => val.name == "Migrate"))
                    menuMigration.submenus[0].submenus.push(new Menu("Migrate", 2, () => {
                    }, false));
            }), true, [
            new Menu("Back", 1, async () => {
                return await this.renderMenu(this.findMenu("Migration").submenus);
            }, true)]));

        menuMigration.submenus.push(
            new Menu("Create migration", 1, async () => {
                const migrationPath = await Config().get("migrations");
                while (true) {

                    let response = await Cli.readLine("Insert name from file:");

                    if (empty(response)) {
                        Cli.log("Please file not possible create it")
                        continue;
                    }

                    response = response.includes(".js") ? response.substr(0, response.indexOf(".js")) : response;
                    const fileMigration = File(migrationPath + Directory().PathSep + response + ".js");

                    const result = await this.renderSelections(["yes", "no"], () => {
                        Cli.log(`File used be path a name: ${fileMigration.getRelativePath()} \n\n`, false);

                        Cli.log(`Confirm file and directory?`, false)
                    });

                    if (result === "no")
                        return await this.renderMenu(menuMigration.submenus);
                    else {
                        const MigrationFileClass = File("./cli/commands/make/migration.js");
                        const result = await Cli.runningProcessChild(MigrationFileClass, [response, "silent"])
                        console.log(result);
                    }
                }

            }, false)
        );

        menuMigration.submenus.push(
            new Menu("Delete migration", 1, null, false),
            new Menu("Back", 4, async () => await configurationsMenu.action(configurationsMenu)));

        configurationsMenu.submenus.push(menuMigration);
    }
    findMenu(name, menus = this.menus) {
        for (const menu of menus) {
            if (menu.submenus && !empty(menu.submenus)) {
                const menu_ = this.findMenu(name, menu.submenus);
                if (menu_)
                    return menu_;
            }

            if (menu.name === name)
                return menu;
        }
        return false;
    }

    rendeByOrder(menus) {
        menus = menus.sort((a, b) => a.order - b.order);
        menus.forEach((menu) => {
            if (menu.active)
                Cli.write(`${this.selector} ${menu.render()}\n`)
            else
                Cli.write(` ${menu.render()}\n`)
        });
    }

    centerText(text) {
        const cols = process.stdout.columns;
        const width = cols - 1;

        const wrapText = (text, width) => {
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

    async renderSelections(selections = [], beforeCallBack = null) {
        const selectionsFinal = selections.map(el => ({ "render": el, "active": false }));
        let indexActive = 0;
        selectionsFinal[indexActive].active = true;

        while (true) {
            Cli.clearConsole();

            if (beforeCallBack)
                beforeCallBack();

            selectionsFinal.forEach(el => !el.active ? Cli.log(`${el.render}`, false) : Cli.log(`${this.selector} ${el.render}`, false));

            const key = await this.readKey();
            if (key === "up") {
                selectionsFinal[indexActive].active = false;
                if (indexActive + 1 > selectionsFinal.length - 1)
                    indexActive = 0;
                else
                    indexActive += 1;

            } else if (key === "down") {
                selectionsFinal[indexActive].active = false;
                if (indexActive - 1 < 0)
                    indexActive = selectionsFinal.length - 1;
                else
                    indexActive -= 1;
            } else if (key === "enter") {
                return selectionsFinal[indexActive].render;
            }
            selectionsFinal[indexActive].active = true;
        }
    }
    async renderMenu(menus = this.menus, callbackBeforeRender = null, callAfterRender = null) {
        while (true) {
            Cli.clearConsole();

            if (callbackBeforeRender)
                await callbackBeforeRender();

            this.rendeByOrder(menus);
            const key = await this.readKey();
            let menu_index_active = menus.findIndex((val) => val.active);

            if (menus.length > 1) {
                if (key === "up") {
                    menus[menu_index_active].active = false;
                    if (menu_index_active - 1 < 0)
                        menu_index_active = menus.length - 1;
                    else
                        menu_index_active -= 1;

                    menus[menu_index_active].active = true;

                } else if (key === "down") {
                    menus[menu_index_active].active = false;
                    if (menu_index_active + 1 > menus.length - 1)
                        menu_index_active = 0;
                    else
                        menu_index_active += 1;

                    menus[menu_index_active].active = true;
                }
            }

            if (key === "enter")
                return await this.menuAction(menus);

            if (callAfterRender)
                await callAfterRender();
        }
    }

    async render(callback) {
        while (true) {
            Cli.clearConsole();
            const res = await callback();

            if (!empty(res)) {
                if (res === "break")
                    break;
                else
                    continue;
            }
            continue;
        }
    }

    async menuAction(menus) {
        Cli.clearConsole();
        const menu = menus.find(val => val.active);
        if (menu.action)
            await menu.action(menu);
        else
            return this.renderMenu(this.menus);
    }

    async beforeHandle() {
        Cli.shouldExit = false;
        // Log.executeConsoleLog = true;
        // this.prepareMenuMigration();
        // return this.renderMenu();

        // Cli.log("Before handling CLI process...");
    }

    afterHandle() {
        // Cli.log("After handling CLI process...");
    }

    handle() {
        return MainCLI.application.startServer();
    }

    menu() {

    }

    readKey() {
        return Cli.readKey(key => {
            const keyTransformed = key.toLowerCase();
            if (keyTransformed === "\u001b[a" || keyTransformed == "w") // seta para cima
                return "up";
            if (keyTransformed === "\u001b[b" || keyTransformed == "s") // seta para baixo
                return "down";

            if (key === "\r")
                return "enter";

            if (JSON.stringify(key) == '"\\u0003"' || keyTransformed == "q") // Ctrl+C ou Q
                throw Cli.exit("Exiting...");

            return key;
            // case "\u001B[C" || keyTransformed == "d": // seta para direita
            // return "right";
            // case "\u001B[D" || keyTransformed == "a": // seta para esquerda
            // return "left";

        }
        ).catch((key) => {
            MainCLI.log("No valid key pressed, try again.");
            return this.readKey();
        });
    }
}

class Menu {
    constructor(name, order, action = null, active = false, submenus = []) {
        this.name = name;
        this.order = order;
        this.active = active;
        this.action = action;
        this.submenus = Array.isArray(submenus) ? submenus : [];
    }

    render() {
        return (`${this.name}`);
    }
}

new MainCLI();
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

    const wrapText = (text, width) => {
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
// Application.Env.init().then(env => {
//     console.log(env);
//     file.readData(true).then(langs => {
//         console.log(langs);
//     })
// })

// drawBar(2).reduce((p, v) => p.then());
// drawBar(2).then(_ => {
// return centerText("Bem vindo ao servidor!").then(_ => {
// return centerText(`Pariatur minim tempor pariatur labore anim anim exercitation id esse. Consequat sint ipsum laborum ut aute excepteur. Officia ut voluptate minim consectetur tempor ad sunt ex esse exercitation ea. Et minim ut elit enim quis nisi dolor excepteur occaecat et ea. Incididunt duis veniam irure qui id quis ad excepteur commodo anim non.Magna ea consequat velit minim incididunt nostrud mollit duis Lorem occaecat aute enim ad cillum. Mollit consequat minim aute aliqua ea nisi fugiat nulla est quis quis. Officia tempor qui sit irure fugiat consequat nisi adipisicing. Aliquip nulla duis ea et veniam id consequat duis ex exercitation dolore. Eiusmod laborum adipisicing quis velit mollit irure adipisicing et quis in voluptate.
// Proident enim fugiat minim tempor. Excepteur proident est anim ad tempor aliquip magna et tempor. Anim occaecat est sit sunt eu sint fugiat eiusmod cillum amet ut cupidatat. Incididunt minim sunt qui mollit sit irure.`);

// })
// centerText("Olá mundo!");


// });


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
