var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var User = require('../models/user.js');
var Post = require('../models/post.js');
var Comment = require('../models/comment.js');
var crypto = require('crypto');

/* GET home page. */
/*router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});*/

router.get('/', function(req, res) {

    /*判断是否是第一页，如果是并把请求的页数转换为number类型*/
    var page = req.query.p ? parseInt(req.query.p) : 1;
     Post.getTen(null, page, function(err, posts, total) {
        if (err) {
            posts = [];
        }

        res.render('index', {
            title: '首页',
            user: req.session.user,
            posts: posts,
            page: page,
            isFirstPage: (page - 1) == 0,
            isLastPage: ((page - 1) * 5 + posts.length) == total,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
});

router.get('/login', checkNotLogin);
router.get('/login', function(req, res) {
    res.render('login', {
        title: '登录',
        user: req.session.user,
        success:req.flash('success').toString(),
        error: req.flash('error').toString()
    });
});

router.post('/login', checkNotLogin);
router.post('/login', function(req, res) {
    var name = req.body['name'];
    var password = req.body['password'];
    var md5 = crypto.createHash('md5');
    var md5_password = md5.update(password).digest('hex');

    if (!name) {
        req.flash('error', '用户名不能为空');
        return res.redirect('/login');
    }

    if (!password) {
        req.flash('error', '密码不能为空');
        return res.redirect('/login');
    }

    User.get(name, function(err, user) {
        if (err) {
            req.flash('error', err);
            return res.redirect('/login');
        }
        if (!user) {
            req.flash('error', '该用户不存在');
            return res.redirect('/login');
        }

        if (user.password != md5_password) {
            req.flash('error', '密码错误');
            return res.redirect('/login');
        }

        req.session.user = user;
        req.flash('success','用户登录成功');
        return res.redirect('/u/' + user.name);
    });
});

router.get('/reg', checkNotLogin);
router.get('/reg', function(req, res) {
    res.render('reg', {
        title: '注册',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    });
});

router.post('/reg', checkNotLogin);
router.post('/reg', function(req, res) {
    var name = req.body.name;
    var password = req.body.password;
    var password_repeat = req.body.password_repeat;
    var email = req.body.email;
    if (!name) {
        req.flash('error', '用户名不能为空');
        return res.redirect('/reg');
    }
    if (!password) {
        req.flash('error', '密码不能为空');
        return res.redirect('/reg');
    }
    if (!email) {
        req.flash('error', '邮箱不能为空');
        return res.redirect('/reg');
    }
    if (password != password_repeat) {
        req.flash('error', '两次输入的密码不一样');
        return res.redirect('/reg');
    }

    var md5 = crypto.createHash('md5');
    var md5_password = md5.update(password).digest('hex');

    var newUser = new User({
        name: name,
        password: md5_password,
        email: email
    });

    //检查用户是否存在
    User.get(newUser.name, function(err, user) {
        if (err) {
            req.flash('error', err);
            return res.redirect('/');
        }

        if (user) {
            req.flash('error', '用户已经存在');//用户已经存在
            return res.redirect('/reg');
        }

        //如果不存在，则新增用户
        newUser.save(function(err, user) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/reg');//注册失败，返回注册页
            }

            /*req.session.user = user;*///将用户信息存入到Ｓｅｓｓｉｏｎ中
            req.flash('success', '注册成功');
            res.redirect('/');
        });
    });
});

router.get('/post', checkLogin);
router.get('/post', function(req, res) {
        res.render('post', {
            title: '发表文章',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
});

router.post('/post', checkLogin);
router.post('/post', function(req, res) {
    if (!req.body.title) {
        req.flash('error', '标题不能为空');
        return res.redirect('/post');
    }
    if (!req.body.content) {
        req.flash('error', '内容不能为空');
        return res.redirect('/post');
    }
    var currentUser = req.session.user;
    tags = [req.body.tag1, req.body.tag2, req.body.tag3];
    var post = new Post({
        author: currentUser.name,
        head: currentUser.head,
        title: req.body.title,
        tags: tags,
        content: req.body.content
    });

    post.save(function(err) {
        if (err) {
            req.flash('error', '发表失败');
            return res.render('post');
        }

        req.flash('success', '发表成功');
        return res.redirect('/u/' + currentUser.name);
    })
});

router.get('/logout', checkLogin);
router.get('/logout', function(req, res) {
    req.session.user = null;
    req.flash('success', '退出成功');
    return res.redirect('/');
});

router.get('/upload', checkLogin);
router.get('/upload', function(req, res) {
    res.render('upload', {
        title: '文件上传',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    });
});

router.post('/upload', checkLogin);
router.post('/upload', function(req, res) {
    req.flash('success', '文件上传成功');
    res.redirect('/upload');
});

router.get('/tags', function(req, res) {
    Post.getTags(function(err, tags) {
        if (err) {
            req.flash('error', err);
            return res.redirect('/');
        }

        return res.render('tags', {
            title: "标签",
            user: req.session.user,
            posts: tags,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
});

router.get('/tag/:tag', function(req, res) {
    var page = req.query.p ? parseInt(req.query.p) : 1;
    Post.getTag(req.params.tag, page, function(err, total, docs) {
        if (err) {
            req.flash('error', err);
            return res.redirect('/tags');
        }

        return res.render('tag', {
            title: "Tag" + req.params.tag,
            user: req.session.user,
            postTag: req.params.tag,
            posts: docs,
            page: page,
            isFirstPage: (page - 1) == 0,
            isLastPage: ((page - 1) * 5 + docs.length) == total,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
});

router.get('/archive/:name', function(req, res) {
    Post.getArchive(req.params.name, function(err, posts) {
        if (err) {
            req.flash('error', err);
            return res.redirect('/');
        }
        return res.render('archive', {
            title: '存档',
            posts: posts,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
});

router.get('/u/:name', function(req, res) {
    var page = req.query.p ? parseInt(req.query.p) : 1;
    User.get(req.params.name, function(err, user) {
        if (!user) {
            req.flash('error', '用户不存在');
            return res.redirect('/');
        }
        Post.getTen(user.name, page, function(err, posts, total) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }

            res.render('user', {
                title: {head: user.head, name: user.name},
                posts: posts,
                page: page,
                isFirstPage: (page - 1) == 0,
                isLastPage: ((page - 1) * 5 + posts.length) == total,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
});

router.get('/u/:name/:date/:title', function(req, res) {
    Post.getOne(req.params.name, req.params.date, req.params.title, function(err, doc) {
        if (err) {
            req.flash('error', err);
            return res.redirect('/');
        }
        res.render('article', {
            title: req.params.title,
            post: doc,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
});

router.post('/u/:name/:date/:title', function(req, res) {
    var md5 = crypto.createHash('md5');
    var email_MD5 = md5.update(req.body.email.toLowerCase()).digest('hex');
    var head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48";

    var date = new Date();
    var time = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
    var comment = {
        name: req.body.name,
        email: req.body.email,
        head: head,
        website: req.body.website,
        content: req.body.content,
        time: time
    };
    var newComment = new Comment(req.params.name, req.params.date, req.params.title, comment);
    newComment.save(function(err) {
        if (err) {
            req.flash('error', err);
            return res.redirect('back');
        }

        req.flash('success', '留言成功');
        return res.redirect('back');
    });
});

router.get('/edit/:name/:date/:title', checkLogin);
router.get('/edit/:name/:date/:title', function(req, res) {
    var currentUser = req.session.user;
    Post.edit(currentUser.name, req.params.date, req.params.title, function(err, doc) {

        if (err) {
            req.flash('error', err);
            return res.redirect('back');
        }

        if (doc) {
            res.render('edit', {
                title: '编辑',
                post: doc,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        } else {
            req.flash('error', err);
            return res.redirect('back');
        }
    });
});

router.post('/edit/:name/:date/:title', checkLogin);
router.post('/edit/:name/:date/:title', function(req, res) {
    var currentUser = req.session.user;
    var tags = [req.body.tag1, req.body.tag2, req.body.tag3];
    Post.update(currentUser.name, req.params.date, req.params.title, req.body.content, tags, function(err) {
        var url = encodeURI('/u/' + req.params.name + '/' + req.params.date + '/' + req.params.title);
        if (err) {
            req.flash('error', err);
            return res.redirect(url);
        }

        req.flash('success', '修改成功');
        return res.redirect(url);
    });
});

router.get('/delete/:name/:date/:title', checkLogin);
router.get('/delete/:name/:date/:title', function(req, res) {
    var currentUser = req.session.user;
    Post.delete(currentUser.name, req.params.date, req.params.title, function(err) {
        if (err) {
            req.flash('error', err);
            return res.redirect('back');
        }

        req.flash('success', '删除成功');
        return res.redirect('/u/' + currentUser.name);
    });
});

router.get('/search', function(req, res) {
    var keyword = req.query.keyword;
    var page = req.query.p ? parseInt(req.query.p) : 1;
    Post.search(keyword, page, function(err, total, docs) {
        if (err) {
            req.flash("error", err);
            return res.redirect('/');
        }

        return res.render('search', {
            title: 'SEARCH ' + req.query.keyword,
            user: req.session.user,
            posts: docs,
            page: page,
            isFirstPage: (page - 1) == 0,
            isLastPage: ((page - 1) * 5 + docs.length) == total,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
});

router.get('/reprint/:name/:day/:title', checkLogin);
router.get('/reprint/:name/:day/:title', function(req, res) {

    Post.edit(req.params.name, req.params.day, req.params.title, function(err, post) {
        if (err) {
            req.flash('error', err);
            return res.redirect('back');
        }


        var currentUser = req.session.user;
        var reprint_from = {name: post.author, date: post.createDate.minute, title: post.title};
        var reprint_to = {name: currentUser.name, head: currentUser.head};

        Post.reprint(reprint_from, reprint_to, function(err, doc) {
            console.log(doc);
            if (err) {
                req.flash('error', err);
                return res.redirect('back');
            }

            req.flash('success', '转载成功');
            var url = encodeURI('/u/' + currentUser.name + '/' + doc.createDate.minute + '/' + doc.title);
            return res.redirect(url);
        });
    });
});

module.exports = router;

//页面控制权限
function checkLogin(req, res, next) {
    if (!req.session.user) {
        req.flash('error', '未登录');
        res.redirect('/login');
    }
    next();
}

function checkNotLogin(req, res, next) {
    if (req.session.user) {
        req.flash('error', '已登录');
        res.redirect('back');//返回之前的页面
    }
    next();
}
