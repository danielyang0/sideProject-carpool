var moduleHttps = require("https");
var moduleFs = require("fs");
var moduleLog = require("log4js");
var moduleExpress = require("express");
var moduleBodyParser = require("body-parser");
var ObjectID = require("mongodb").ObjectID;

var app = moduleExpress();
app.use(moduleExpress.static("./frontEnd"));
app.use(moduleBodyParser.json({ "limit": "2mb" }));
app.use(moduleBodyParser.urlencoded({ "extended": true }));

exports.config = JSON.parse(moduleFs.readFileSync("./config.json"));
exports.errorCode = require("./errorCode");

moduleLog.configure({
    "appenders": {
        "normal": {
            "type": "file",
            "filename": "./log/log.log"
        },
        "console": {
            "type": "console"
        }
    },
    "categories": {
        "default": {
            "appenders": ["normal", "console"],
            "level": "trace"
        }
    }
});
exports.logger = moduleLog.getLogger("default");
exports.timeStamp = function () {
    return Date.now();
}

const options = { "key": moduleFs.readFileSync("./privatekey.pem"), "cert": moduleFs.readFileSync("./cert.pem") };

app.post("/login", require("./login").onRequest);

//driver part
app.get("/driverPanel", require("./handle_driverPanel").onRequest);
app.post("/driverResponse", require("./handle_driverResponse").onRequest);
app.post("/repeatedDriverPost", require("./handle_repeatedDriverPost").onRequest);
app.post("/additionalDriverPost", require("./handle_additionalDriverPost").onRequest);
app.post("/revertDriverRepeatedPost", require("./handle_revertDriverRepeatedPost").onRequest);
app.post("/driverCancelRepeatedPost", require("./handle_driverCancelRepeatedPost").onRequest);
app.post("/revertRepeatedCancellation", require("./handle_revertRepeatedCancellation").onRequest);
app.delete("/driverCancelSinglePost", require("./handle_driverCancelSinglePost").onRequest);

//passenger part
app.get("/passengerPanel", require("./passengerPanel").onRequest);
app.post("/repeatedPanel", require("./passengerPanel").onRepeatedPanelRequest);
app.post("/singlePanel", require("./passengerPanel").onSinglePanelRequest);
app.post("/repeatedDriverList", require("./passengerPanel").onRepeatedDriverList);
app.post("/singleDriverList", require("./passengerPanel").onSingleDriverList);
app.post("/repeatedApply", require("./passengerPanel").onRepeatedApplication);
app.post("/singleApply", require("./passengerPanel").onSingleApplication);

app.get("/driverPanel.html", require("./page").onPage);
app.get("/passengerPage.html", require("./page").onPage);


app.post("/refresh", require("./refreshData").onRequest);

app.get("/test", require("./test").onRequest);
app.get("/test/initdb", require("./test").initTestData);

/**
 * Call this function to respond to client with a http code
 * @param res {Object} The res from onRequest
 * @param code {number} The http response code
 * @param body {string} The response body
 */
exports.respondWithCode = function (res, code, body) {
    res.writeHead(code, { "Content-Type": "text/html" });
    res.write(body);
    return res.end();
}

/**
 * Call this function to respond to client with http code 200
 * @param res {Object} The res from onRequest
 * @param body {Object} The response json object
 */
exports.respond = function (res, body) {
    return exports.respondWithCode(res, 200, JSON.stringify(body));
}

/**
 * Gets a record's id
 * @param data {Object} A record from database
 * @returns {string} The string of the id of the record
 */
exports.getIdString = function (data) {
    return data["_id"].toString();
}

/**
 * Reads a html file
 * @param path {string} The path of the file
 * @returns {string} The text of the file
 */
exports.readHtml = function (path) {
    return moduleFs.readFileSync(path, "utf8");
}

/**
 * Changes a string to a id in database
 * @param id {string} The id
 * @returns {ObjectID} The id used in mongodb
 */
exports.stringToID = function (id) {
    try {
        return ObjectID(id);
    } catch (error) {
        return null;
    }
}

exports.database = require("./database");
exports.database.connect(onConnectDB);

function onConnectDB(error) {
    if (error === null) {
        exports.logger.info("connected db, starting server");
        moduleHttps.createServer(options, app).listen(exports.config.serverPort);
    } else {
        exports.logger.error("can't connect to db, error:" + error);
    }
}

