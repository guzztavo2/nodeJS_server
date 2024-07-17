require('dotenv').config()

class DateTime {

    static now() {
        return Intl.DateTimeFormat(process.env.LANGUAGE, {
            dateStyle: 'short',
            timeStyle: 'medium'
        }).format(Date.now());
    }
}

module.exports = DateTime;