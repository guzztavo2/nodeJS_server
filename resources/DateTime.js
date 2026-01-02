import Env from './Env.js';

class DateTime {

    // static envConfig = new Env
    static now() {
        return Intl.DateTimeFormat(process.env.LANGUAGE, {
            dateStyle: 'short',
            timeStyle: 'medium'
        }).format(Date.now());
    }

    static date(){
        return new Date();
    }

    static dateObject(){
        const now = DateTime.date();
        return {
            "y": String(now.getFullYear()),
            "mm": String(now.getMonth() + 1).padStart(2, '0'),
            "d": String(now.getDate()).padStart(2, '0'),
            "h": String(now.getHours()).padStart(2, '0'),
            "m": String(now.getMinutes()).padStart(2, '0'),
            "s": String(now.getSeconds()).padStart(2, '0')
        }
    }

    static getFormattedDate(date = null, options = {}) {
        const d = date || DateTime.date();
        return Intl.DateTimeFormat(process.env.LANGUAGE_, options).format(d);
    }
}

export default DateTime;