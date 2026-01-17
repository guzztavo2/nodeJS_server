import DateTime from "./DateTime.js";

class Log {
    static message(message) {
        console.log(`[LOG][${DateTime.getFormattedDate(null, { dateStyle: 'short', 'timeStyle': 'medium' })}] ${message}`);
    }
    
    static info(message) {
        console.info(`[INFO][${DateTime.getFormattedDate(null, { dateStyle: 'short', 'timeStyle': 'medium' })}] ${message}`);
    }

    static error(message) {
        console.error(`[ERROR][${DateTime.getFormattedDate(null, { dateStyle: 'short', 'timeStyle': 'medium' })}] ${message}`);
    }

}

export default Log;