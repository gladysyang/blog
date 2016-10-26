var mongodb = require('./db');

function Comment(name, day, title, comment) {
    this.name = name;
    this.day = day;
    this.title = title;
    this.comment = comment;
}

Comment.prototype.save = function(callback) {
    var name = this.name;
    var day = this.day;
    var title = this.title;
    var comment = this.comment;

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
                'author': name,
                'createDate.minute': day,
                'title': title
            }, {
                $push: {'comments': comment}
            }, function(err) {
                if (err) {
                    return callback(err);
                }

                return callback(null);
            });
        });
    });
};

module.exports = Comment;
