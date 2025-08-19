// In a new file utils/dateFormatter.js
const { format } = require('date-fns');

const formatDateTime = (date) => {
    return format(new Date(date), 'yyyy-MM-dd HH:mm:ss');
};

module.exports = {
    formatDateTime
};