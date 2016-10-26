var mongodb = require('./db');
var crypto = require('crypto');

function User(user) {
    this.name = user.name;
    this.password = user.password;
    this.email = user.email;
}

module.exports = User;

//存储用户信息
User.prototype.save = function(callback) {
    var md5 = crypto.createHash('md5');
    var email_MD5 = md5.update(this.email.toLowerCase()).digest('hex');
    var head = "http://img.mypsd.com.cn/y/d/%e7%9f%a2%e9%87%8f%e5%9b%be%e5%ba%93/%e7%9f%a2%e9%87%8f%e4%ba%ba%e7%89%a9/%e5%85%b6%e4%bb%96/a/jpg/rwqt-c%20%28395%29.jpg";

    var user = {
        name: this.name,
        password: this.password,
        email: this.email,
        head: head
    };
    //打开数据库
    mongodb.open(function(err, db) {
        if (err) {
            return callback(err);
        }

        //读取users集合
        db.collection('users', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }

            collection.insert(user, {
                safe: true
            }, function(err, user) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, user[0]);
            });
        });
    });
};

//读取用户信息
User.get = function(name, callback) {
    //打开数据库
    mongodb.open(function(err, db) {
        if (err) {
            return callback(err);
        }

        //读取users集合
        db.collection('users', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }

            //查找用户名
            collection.findOne({
                name: name
            }, function(err, user) {
                mongodb.close();
                if(err) {
                    return callback(err);
                }

                callback(null, user);
            });
        });
    });
};
