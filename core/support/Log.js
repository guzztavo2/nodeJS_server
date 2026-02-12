import DateTime from "./DateTime.js";

class Log {
    static showDateTime = true;
    static textColor = "";
    static backgroundColor = "";

    static write(message, showDateTime = false, textColor = "", backgroundColor = "") {
        let messageFinal = `${textColor ?? ""}${backgroundColor ?? ""}${message}${ textColor ? "\x1b[0m" : "" }${ backgroundColor ? "\x1b[0m" : "" }`;
        if (showDateTime) {
            const dateTime = `[${DateTime.getFormattedDate(null, { dateStyle: 'short', 'timeStyle': 'medium' })}]`;
            process.stdout.write(`${dateTime} ${messageFinal}`);
        } else
            process.stdout.write(messageFinal);
    }

    static message(message) {
        if (this.showDateTime) {
            const dateTime = `[${DateTime.getFormattedDate(null, { dateStyle: 'short', 'timeStyle': 'medium' })}]`;
            console.log(`${dateTime} ${message}`);
        } else
            console.log(`${message}`);
    }

    static log(message) {
        if (this.showDateTime) {
            const dateTime = `[${DateTime.getFormattedDate(null, { dateStyle: 'short', 'timeStyle': 'medium' })}]`;
            console.log(`[LOG] ${dateTime} ${message}`);
        } else
            console.log(`[LOG] ${message}`);
    }

    static info(message) {
        if (this.showDateTime) {
            const dateTime = `[${DateTime.getFormattedDate(null, { dateStyle: 'short', 'timeStyle': 'medium' })}]`;
            console.log(`[INFO] ${dateTime} ${message}`);
        } else
            console.log(`[INFO] ${message}`);
    }

    static error(message) {
        if (this.showDateTime) {
            const dateTime = `[${DateTime.getFormattedDate(null, { dateStyle: 'short', 'timeStyle': 'medium' })}]`;
            console.error(`[ERROR] ${dateTime} ${message}`);
        } else
            console.error(`[ERROR] ${message}`);
    }

}

export default Log;