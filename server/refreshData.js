var server = require("./server");

exports.onRequest = function (req, res) {
    var ret = { "error": server.errorCode.ok };
    var idMap = {};
    server.database.getUser(req.body.userID, req.body.sessionID, function (user, error) {
        if (error === null) {
            server.database.getUserDriverInfo(user, idMap, function (error) {
                if (error === null) {
                    server.database.getUserPassengerInfo(user, idMap, function (error) {
                        if (error === null) {
                            var postIds = [];
                            for (var app in user.post.repeatedPost) {
                                postIds.push(app._id);
                            }
                            var addPostIds = [];
                            for (var app in user.post.addPost) {
                                addPostIds.push(app._id);
                            }
                            server.database.getApplicationForUser(user, idMap, postIds, addPostIds, function (err) {
                                if (err !== null) {
                                    ret.error = server.errorCode.databaseError;
                                    server.respond(res, ret);
                                } else {
                                    server.database.getUserList(idMap, function (err) {
                                        if (err === null) {
                                            ret["repeatedPost"] = user.post.repeatedPost;
                                            ret["additionalPost"] = user.post.addPost;
                                            ret["cancellationPost"] = user.post.cancel;
                                            ret["repeatedApplication"] = user.application.apps;
                                            ret["additionalApplication"] = user.application.addApps;
                                            ret["repeatApplicationForPost"] = user.repeatAppForPost;
                                            ret["addApplicationForPost"] = user.addAppForPost;
                                            server.respond(res, ret);
                                            console.log(ret);
                                        }
                                        else {
                                            ret.error = server.errorCode.databaseError;
                                            server.respond(res, ret);
                                        }
                                    });
                                }
                            });
                        } else {
                            ret.error = server.errorCode.databaseError;
                            server.respond(res, ret)
                        }
                    });
                } else {
                    ret.error = server.errorCode.databaseError;
                    server.respond(res, ret);
                }
            });
        } else {
            ret.error = server.errorCode.noSuchUser;
            server.respond(res, ret);
        }
    });
}