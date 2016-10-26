$('.comment-submit').click(function() {
    var name = $('#name').val();
    var email = $('#email').val();
    var website = $('#website').val();
    var text = $('#content').val();

    if (name != '' && email != '' && website != '' && text != '') {
        $('.comment-form').submit();
    } else {
        alert('还有未填项,请填完再提交');
    }
});

if ($('.message').text() != '') {
    setTimeout("messageDisplay()", 500);
}

function messageDisplay() {
    $('.message').css('display', 'none');
}

$('.post-title').mouseleave(function() {
    if ($('.post-title').val().length > 30) {
        alert('文章的标题字数不能超过30个字');
    }
});

/*$('.post-form').click(function() {
    var name = $('').val();
    var email = $('#email').val();
    var website = $('#website').val();
    var text = $('#content').val();

    if (name != '' && email != '' && website != '' && text != '') {
        $('.comment-form').submit();
    } else {
        alert('还有未填项,请填完再提交');
    }
});*/
