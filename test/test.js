/**
 * Created by zjy on 15-9-26.
 */;
var gw=require("../../gwapi");
var g=new gw();
var $user={
    "username":"your 学号",
    "password":"your 密码"
};
g.login($user, function(err,res){
    if(err){
        return ;
    }
    //获取用户信息
    var $data1={
        "req":"getUser"
    };
    res.do($data1,function (info) {
        console.log(info);
    });
    //获取课表
    var $data2={
        "req":"getCourse"
    };
    res.do($data2,function (info) {
        console.log(info);
    });
    //获取成绩
    var $msg={
        xn:"2013-2014",//学年
        xq:"1",//学期
        get:"2"//1表示按学期获取，2表示按学年获取
    };
    var $data3={
        "req":"getGrade",
        "data":$msg
    };
    res.do($data3,function (info) {
        console.log(info);
    });
});