const CONFIG = require('./config.json');
new (require('./structure/client'))(CONFIG).build();