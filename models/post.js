var mongodb = require('./db');
var markdown =require('markdown').markdown;

function Post(post) {
    this.author = post.author;
    this.title = post.title;
    this.content = post.content;
    this.tags = post.tags;
    this.head = post.head;
}

module.exports = Post;

Post.prototype.save = function(callback) {
    var date = new Date();
    var createDate = {
        date: date,
        year: date.getFullYear(),
        month: date.getFullYear() + "-" + (date.getMonth() + 1),
        day: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
        minute: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +date.getHours() + ":"+ (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
    }
    //要存储的文章
    var post = {
        author: this.author,
        head: this.head,
        title: this.title,
        content: this.content,
        tags: this.tags,
        createDate: createDate,
        reprint_info: {},
        comments: [],
        pv: 0
    };

    //往数据库中存文章
    mongodb.open(function(err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function(err, collection) {
            if (err) {
                return callback(err);
            }
            collection.insert(post, {safe: true}, function(err) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                return callback(null);
            });
        });
    });
};

/*分页*/
Post.getTen = function(author, page, callback) {
    mongodb.open(function(err, db) {
        if (err) {
            return callback(err);
        }

        db.collection('posts', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }

            var query = {};
            if (author) {
                query.author = author;
            }
            collection.count(query, function(err, total) {
                collection.find(query).skip((page - 1) * 5).limit(5).sort({
                    createDate: -1
                }).toArray(function(err, docs) {
                    mongodb.close();
                    if (err) {
                        return callback(err);
                    }

                    docs.forEach(function(doc) {
                        doc.content = doc.content.substr(0, 50);
                    });
                    return callback(null, docs, total);
                });
            });
        });
    });
};

Post.getOne = function(author, date, title, callback) {
    mongodb.open(function(err, db) {
        if (err) {
            return callback(err);
        }

        db.collection('posts', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            collection.findOne({
                "author": author,
                "title": title,
                "createDate.minute": date
            }, function(err, doc) {
                if (err) {
                    return callback(err);
                }
                if (doc) {
                    collection.update({
                        "author": author,
                        "createDate.minute": date,
                        "title": title
                    }, {
                        $inc: {'pv': 1}
                    }, function(err) {
                        mongodb.close();
                        if (err) {
                            return callback(err);
                        }
                    });

                    doc.content = markdown.toHTML(doc.content);
                    doc.comments.forEach(function(comment) {
                        comment.content = markdown.toHTML(comment.content);
                    });
                }

                return callback(null, doc);
            });
        });
    });
};
Post.edit = function(author, date, title, callback) {
    mongodb.open(function(err, db) {
        if (err) {
            return callback(err);
        }

        db.collection('posts', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }

            collection.findOne({
                'author': author,
                'title': title,
                'createDate.minute': date
            }, function(err, doc) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }

                return callback(null, doc);
            });
        });
    });
};

Post.update = function(author, date, title, content,tags, callback) {
    mongodb.open(function(err, db) {
        if (err) {
            return callback(err);
        }

        db.collection('posts', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }

            collection.update({
                'author': author,
                'createDate.minute': date,
                'title': title
            }, {
                $set: {content: content, tags: tags}
            }, function(err) {
                if (err) {
                    mongodb.close();
                    return callback(err);
                }

                return callback(null);
            });
        });
    });
};

Post.delete = function(author, date, title, callback) {
    mongodb.open(function(err, db) {
        if (err) {
            return callback(err);
        }

        db.collection('posts', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }

            /* {
                w: 1
            }, 不加也可以*/
            collection.remove({
                'author': author,
                'createDate.minute': date,
                'title': title
            }, function(err) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }

                return callback(null);
            });
        });
    });
};
Post.getArchive = function(author, callback) {
    mongodb.open(function(err, db) {
        if (err) {
            return callback(err);
        }

        db.collection('posts', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            var query = {};
            if (author) {
                query.author = author;
            }

            collection.find(query, {
                author: 1,
                createDate: 1,
                title: 1
            }).sort({
                createDate: -1
            }).toArray(function(err, docs) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
};

Post.getTags = function(callback) {
    mongodb.open(function(err, db) {
        if (err) {
            return callback(err);
        }

        db.collection('posts', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }

            collection.distinct('tags', function(err, docs) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }

                callback(null, docs);
            });
        });
    });
};

Post.getTag = function(tag, page, callback) {
    mongodb.open(function(err, db) {
        if (err) {
            return callback(err);
        }

        db.collection('posts', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            collection.count({
                tags: tag
            }, function(err, total) {
                collection.find({
                tags: tag
                }, {
                    author: 1,
                    createDate: 1,
                    title: 1,
                    tags: 1
                }).skip((page - 1) * 5).limit(5).sort({
                        createDate: -1
                }).toArray(function(err, docs) {
                    mongodb.close();
                    if (err) {
                        return callback(err);
                    }

                    return callback(null, total, docs);
                });

            });
        });
    });
};

Post.search = function(keyword, page, callback) {
    mongodb.open(function(err, db) {
        if (err) {
            return callback(err);
        }

        db.collection('posts', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }

            var pattern = new RegExp(keyword, 'i');
            collection.count({
                title: pattern
            }, function(err, total) {
                collection.find({
                    title: pattern
                }, {
                    author: 1,
                    createDate: 1,
                    title: 1
                }).skip((page - 1) * 5).limit(5).sort({
                    createDate: -1
                }).toArray(function(err, docs) {
                    mongodb.close();
                    if (err) {
                        return callback(err);
                    }

                    return callback(null, total, docs);
                });
            });
        });
    });
};

Post.reprint = function(reprint_from, reprint_to, callback) {
    mongodb.open(function(err, db) {
        if (err) {
            return callback(err);
        }

        db.collection('posts', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }

            collection.findOne({
                "author": reprint_from.name,
                "createDate.minute": reprint_from.date,
                "title": reprint_from.title
            }, function(err, doc) {
                if (err) {
                    return callback(err);
                }

                var date = new Date();
                var updateDate = {
                    date: date,
                    year: date.getFullYear(),
                    month: date.getFullYear() + "-" + (date.getMonth() + 1),
                    day: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
                    minute: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +date.getHours() + ":"+ (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
                }

                delete doc._id;//删掉文档原来的_id

                doc.author = reprint_to.name;
                doc.head = reprint_to.head;
                doc.createDate = updateDate;
                doc.title = (doc.title.search(/[转载]/) > -1 ? doc.title : "[转载]" + doc.title);
                doc.comments = [];
                doc.reprint_info = {"reprint_from": reprint_from};
                doc.pv = 0;

                collection.update({
                    "author": reprint_from.name,
                    "createDate.minute": reprint_from.date,
                    "title": reprint_from.title
                }, {
                    $push: {
                        "reprint_info.reprint_to": {
                            "name": doc.author,
                            "date": updateDate.minute,
                            "title": doc.title
                        }
                    }
                }, function(err) {
                    if (err) {
                        mongodb.close();
                        return callback(err);
                    }
                });
                collection.insert(doc, {
                    safe: true
                }, function(err, post) {
                    mongodb.close();
                    if (err) {
                        return callback(err);
                    }

                    callback(null, post.ops[0]);
                });
            });
        });
    });
};
