import DateTime from "#core/support/DateTime.js";
import File from "#core/filesystems/File.js";

class Log {
    static fileLog = new File("main.logs", "/storage/logs");
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
    
    static message(message, showDateTime = true) {
        if (this.showDateTime && showDateTime) {
            const dateTime = `[${DateTime.getFormattedDate(null, { dateStyle: 'short', 'timeStyle': 'medium' })}]`;
            console.log(`${dateTime} ${message}`);
        } else
            console.log(`${message}`);
    }

    static log(message) {
        if (this.showDateTime) {
            const dateTime = `[${DateTime.getFormattedDate(null, { dateStyle: 'short', 'timeStyle': 'medium' })}]`;
            message = (`[LOG] ${dateTime} ${message}`);
        } else
            message = (`[LOG] ${message}`);
        
        console.log(message);
        this.writeInFile(message);
    }

    static info(message) {
        if (this.showDateTime) {
            const dateTime = `[${DateTime.getFormattedDate(null, { dateStyle: 'short', 'timeStyle': 'medium' })}]`;
            message = (`[INFO] ${dateTime} ${message}`);
        } else
            message = (`[INFO] ${message}`);
        console.log(message);
        this.writeInFile(message);
    }

    static error(message) {
        message = message instanceof Error ? (message.toString() + "\nStack:" + message.stack) : message;
        if (this.showDateTime) {
            const dateTime = `[${DateTime.getFormattedDate(null, { dateStyle: 'short', 'timeStyle': 'medium' })}]`;
            message = (`[ERROR] ${dateTime} ${message}`);
        } else
            message = (`[ERROR] ${message}`);
        console.error(message);
        this.writeInFile(message);
    }

    static writeInFile(log){
        log = "\n" + log;
        return this.fileLog.writeFile(log, true);
    }
}

export default Log;