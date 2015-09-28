/**
 * Created by zjy on 2015/9/22.
 * 张嘉永--2015-09-28
 * for test
 */
var http=require('http');
var querystring=require("querystring");
var urls=require("url");
var iconvLite = require('iconv-lite');
function Gwtxz(){
    this.$field=null;
    this.$user=null;
    this.$cookie=null;
    this.__VIEWSTATE='';
    this.code='';
    this.gradeMsg=null;
}
Gwtxz.prototype={
    constructor: Gwtxz,
    login: function ($user,callback) {
        var self=this;
        self.$user=$user;
        self.$field = {
            "username": $user.username,//学号
            "password": $user.password,//密码
            "login-form-type": "pwd"//$_POST['login-form-type']
        };
        return self.checkField(callback);
    },
    do:function($op,callback){
        var self=this;
      switch ($op.req){
          case 'getUser':self.getUser(callback);
              break;
          case 'getCourse':self.getCourse(callback);
              break;
          case 'getGrade':self.getGrade($op.data,callback);
              self.gradeMsg=$op.data;
              break;
          default :
              callback({status:0,error:"wrong request!"});
      }
    },
    checkField:function(callback){
        var self=this;
        var $formUrl = 'http://tsg.gdufs.edu.cn/pkmslogin.form';//http://jw.gdufs.edu.cn/pkmslogin.form
        var $refer = self.getReferUrl();

        var $param=querystring.stringify(self.$field),
            $host=urls.parse($formUrl).host,
            $origin='http://'+$host,
            $header = {
                'Host':$host,
                'Connection': 'keep-alive',
                'Content-Length':$param.length,
                'Cache-Control': 'max-age=0',
                'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Origin': $origin,
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.31 (KHTML, like Gecko) Chrome/26.0.1410.12 Safari/537.31',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Referer':$refer,
                'Accept-Encoding': 'gzip,deflate,sdch',
                'Accept-Language': 'zh-CN,zh;q=0.8',
                'Accept-Charset': 'GBK,utf-8;q=0.7,*;q=0.3'
            };

        //console.log($header);
        //声明请求参数
        var options={
            host:$host,
            path:"/pkmslogin.form",
            port:'80',
            'login-form-type':'pwd',
            method:"post",
            headers:$header
        };
        //发送请求
        var req=http.request(options,function(res){
            res.setEncoding('utf-8');
            var error=null;
            res.on("data", function (data) {
                var $pattern =new RegExp('<TITLE>Success<\/TITLE>','i');
                if(data.match($pattern)){
                    console.log("登陆成功");
                    self.$cookie=res.headers['set-cookie'].join("; ");
                }
                else{
                    error={
                        "status":0,
                        "error":"登陆失败"
                    };
                    console.log("登陆失败");
                }
            });
            res.on("end",function(){
                callback(error,self);
            });
        });
//正式传输内容
        req.write($param);
        req.end();
    },
    getReferUrl: function () {
        var $referUrl = "http://auth.gdufs.edu.cn/wps/myportal/001/00101/!ut/p/c5/fY1LDoIwFADPwgHMe_zLEj-RFhURVNoNqYnBSimEGNTb686dmcUsZjEg4IuRk2rkQ_VGaqhABHWWJ0jnxImynPlI03K7TEjoIgmBgwh_HcliiZSydOOtmItrhGpS1yeUUKFXF_eIbb4-zqOUvYuzmFUmaI-dzspuYEL7r0voH6S-ddLo2diefd7HCyUK0VgWZLaDngu7vZbKQPn3yoH_7YLGp9FxbDtAtAkMLZ8a0lsfBmXNWQ!!/";
        return $referUrl;
    },
    /**
     * 获取用户的详细信息,
     * 这个是一个耗时方法，建议只调用一次
     * @return multitype:array |NULL
     */
    getUser: function (callback) {
        //爬取用户信息
        var self=this;
        var $info;
        var $re = self.getRequestUrl(self.$field.username, 4);
        self.saveContent($re, function ($pageContent) {
            //var $matches='';
            var $pattern = new RegExp('<font.*?>.+?</font>','g');
            var $arr=$pageContent.match($pattern);
            var $reMsg;
            if($arr){
                for(var $in in $arr){
                    $arr[$in]=$arr[$in].replace(/<\/*font.*?>/ig,'');
                }
                $info={
                    'studentNumber': $arr[0],
                    'name': $arr[1],
                    'gender': $arr[2],
                    'academy': $arr[3],
                    'grade': $arr[4],
                    'major': $arr[5],
                    'campus': $arr[6],
                    'block': $arr[8],
                    'floor': $arr[9],
                    'room': $arr[10]
                };
                $reMsg={
                    status:1,
                    data:$info
                };
            }
            else{
                $reMsg={
                    status:0,
                    error:"getUser failure"
                };
            }
            callback($reMsg);
        });
    },

    /**
     * 生成请求的地址
     * @param string $schoolNumber 学号
     * @param int $type 类型： 1为正方管理系统>>我的信息；2为正方管理系统>>我的课表；3为学工管理>>我的基本信息；4为学工管理>>我的宿舍信息
     * @return string $requstUrl 返回请求的地址
     */
    getRequestUrl: function ($schoolNumber,$type) {
        var self=this;
        var $re={requestUrl:'',code:''};
        switch ($type){
            case 1://现代教学管理信息系统
                $re.requestUrl = 'http://jw.gdufs.edu.cn/xsgrxx.aspx?xh='+$schoolNumber;
                $re.code="gbk";
                break;
            case 2://课表
                $re.requestUrl = 'http://jw.gdufs.edu.cn/xskbcx.aspx?xh='+$schoolNumber;
                $re.code="gbk";
                break;
            case 3://学生个人信息明细
                $re.requestUrl = 'http://xg.gdufs.edu.cn/epstar/app/template.jsp?mainobj=SWMS/XSJBXX/T_XSJBXX_XSJBB&tfile=XGMRMB/detail_BDTAG';
                $re.code="utf-8";
                break;
            case 4://我的宿舍信息
                $re.requestUrl = "http://xg.gdufs.edu.cn/epstar/app/template.jsp?mainobj=SWMS/SSGLZXT/SSAP/V_SS_SSXXST&tfile=XSCKMB/BDTAG&filter=V_SS_SSXXST:XH='"+$schoolNumber+"'";
                $re.code="utf-8";
                break;
            case 5://分数查询
                $re.requestUrl = "http://jw.gdufs.edu.cn/xscj_gc.aspx?xh="+$schoolNumber;
                $re.code="gbk";
                break;
            case 5://分数查询
                $re.requestUrl = "http://jw.gdufs.edu.cn/xscj_gc.aspx?xh="+$schoolNumber;
                $re.code="gbk";
                break;
            default:
                $re.requestUrl = 'http://jw.gdufs.edu.cn/xsgrxx.aspx?xh='+$schoolNumber;
                $re.code="utf-8";

        }
        return $re;
    },

    /**
     * 保存页面返回内容
     * @param string $requesUrl 请求地址的url
     * 学工管理：http://xg.gdufs.edu.cn/epstar/app/template.jsp?mainobj=SWMS/XSJBXX/T_XSJBXX_XSJBB&tfile=XGMRMB/detail_BDTAG
     * 正方教务: http://jw.gdufs.edu.cn/xskbcx.aspx?xh=20111003632
     * @return 返回页面的header信息
     */
    saveContent: function ($re,callback) {
        var self=this;
        var $url=urls.parse($re.requestUrl);
        var $header = {
            'Cookie':self.$cookie
        };

        //console.log($header);
        //声明请求参数
        var options={
            host:$url.host,
            path:$url.path,
            method:'GET',
            headers:$header
        };
        //发送请求
        var req=http.request(options,function(res){
            var buffers = [];
            res.on("data", function (data) {
                buffers.push(data);
            });
            res.on('end', function() {
                var $pageContent = iconvLite.decode(Buffer.concat(buffers), $re.code);
                console.log("成功获取数据");
                if(callback){
                    callback($pageContent);
                }
            });
        });
        req.end();
    },
    /**
     * 获取课程表
     * @return
     * 'name' => "电路与电子技术",
     * 'teacherName' => '李心广',
     * 'place'=>'南C403',
     * 'week'=> 1
     * 'startSection'=>2,
     * 'endSection'=>5
     */
    getCourse:function(callback){
        var self=this;
        var $re = self.getRequestUrl(self.$field.username, 2);
        self.saveContent($re, function ($pageContent) {
            var $patten = /<td align=\"Center\"( rowspan=\"\d\"){0,1}( width=\"[\d]+%\"){0,1}>([^\s]+?)<br>([^\s]*?)<br>([^\s]*?)<br>([^\s]*?)<\/td>/g;
            var $matches;
            var $data = [],len=0;
            var $weekArr = {
                "周日": 0, "周一": 1, "周二": 2, "周三": 3, "周四": 4, "周五": 5, "周六": 6
            };
            var $course={};
            while($matches=$patten.exec($pageContent)){
                //console.log($maches[3]);
                var $name = $matches[3];
                var teacherName = $matches[5];
                var $timeStr = $matches[4];
                var $week = $timeStr.substring(0,2);
                var $index = $timeStr.indexOf("节");
                var $times = $timeStr.substring(3, $index).split(",");
                if($course[$name]){//针对三课时的课做的优化，（因为3课时的课会放在两个td里）
                    $data[$course[$name].len].endSection=$times[$times.length - 1];
                }
                else{
                    var $arr = {
                        'name': $name,
                        'teacherName': teacherName,
                        'place': $matches[6],
                        'week': $weekArr[$week],
                        'startSection': $times[0],
                        'endSection': $times[$times.length - 1]
                    };
                    $data.push($arr);
                    $course[$name]={len:len};
                    len++;
                }
            }
            $course=null;
            $matches=null;
            if($data.length>0){
                var $reMsg={
                    status:1,
                    data:$data
                };
                callback($reMsg);
            }
            else{
                callback({status:0,"error":"course not found"});
            }
        });
    },
    getGrade:function($msg,callback,times){
        var self=this;
        var $param={};
        //验证$msg
        var xn=$msg.xn.split("-");
        //console.log(xn,xn.length,xn[0].length,parseInt(xn[1])-parseInt(xn[0]));
        if(xn.length==2 && xn[0].length==4 && xn[1].length==4 && parseInt(xn[1])-parseInt(xn[0])==1){
            $param.ddlXN=$msg.xn;
        }
        else{
            callback({status:0,error:"xn学年参数不符合，参考2013-2014"});
            return ;
        }
        if(parseInt($msg.xq)==1 || parseInt($msg.xq)==2 || parseInt($msg.xq)==3){
            $param.ddlXQ=$msg.xq;
        }
        else{
            callback({status:0,error:"xq学期参数不符合，为1，2，3"});
            return ;
        }
        if(parseInt($msg.get)==1 || parseInt($msg.get)==2){
            parseInt($msg.get)==1?$param.Button1="按学期查询":$param.Button5="按学年查询";
        }
        else{
            callback({status:0,error:"get 成绩请求参数不符合，为1（代表学期），2（代表学年）"});
            return ;
        }
        var $re = self.getRequestUrl(self.$field.username, 5);
        if(self.__VIEWSTATE!=''){
            $param.__VIEWSTATE=self.__VIEWSTATE;
            $param=querystring.stringify($param);
            self.sendPost($re.requestUrl,$param,self.$cookie, function (info) {
                self.gradeDeal(info,callback,times);
            });
        }
        else{
            self.saveContent($re,function ($pageContent) {
                var $patten = /<input type="hidden" name="__VIEWSTATE" value="(.*)" \/>/i;
                var $matches=$pageContent.match($patten);
                $param.__VIEWSTATE=$matches[1];
                self.__VIEWSTATE=$matches[1];
                $param=querystring.stringify($param);
                self.sendPost($re.requestUrl,$param,self.$cookie, function (info) {
                    self.gradeDeal(info,callback,times);
                });
            });
        }

    },
    sendPost: function ($requestUrl,$param,$cookie,callback) {
        var $url=urls.parse($requestUrl),
            $origin='http://'+$url.host,
            $header = {
                'Host':$url.host,
                'Connection': 'keep-alive',
                'Content-Length':$param.length,
                'Cache-Control': 'max-age=0',
                'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Origin': $origin,
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.31 (KHTML, like Gecko) Chrome/26.0.1410.12 Safari/537.31',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Referer':"http://jw.gdufs.edu.cn/xscj_gc.aspx?xh=20131003637&xm=%D5%C5%BC%CE%D3%C0&gnmkdm=N121605",
                'Accept-Language': 'zh-CN,zh;q=0.8,en-US;q=0.5,en;q=0.3',
                'Cookie':$cookie
            };

        //声明请求参数
        var options={
            host:$url.host,
            path:$url.path,
            port:'80',
            method:"post",
            headers:$header
        };

        //console.log(options);
        //发送请求
        var req=http.request(options,function(res){
            var buffers = [];
            res.on("data", function (data) {
                buffers.push(data);
            });
            res.on("end",function(){
                var decodedBody = iconvLite.decode(Buffer.concat(buffers), "GBK");
                callback(decodedBody);
            });
        });
//正式传输内容
        req.write($param);
        req.end();
    },
    gradeDeal: function (info,callback,times) {
        var self=this;
        var $msg={
            times:times
        };
        var $errorPattern=/<title>Object moved<\/title>/i;
        if(info.match($errorPattern)){
            times=times?times:0;
            console.log("扒取失败，重试1");
            if(times>9){
                $msg.status=0;
                $msg.error='getGrade failure';
                callback($msg);
            }
            else{
                self.login({"username":self.$user.username,"password":self.$user.password},function(err,res){
                    res.getGrade(self.gradeMsg,callback,times+1);
                });
            }
        }
        else{
            var $patten = /<table class="datelist" cellspacing="0" cellpadding="3" border="0" id="Datagrid1" width="100%">[\s]*([\s\S.]*?)[\s]*<\/table>?/i;
            var $table=$patten.exec(info)[1];
            var $trPatten=/<tr.*>[\s]*(<td>.*<\/td>)[\s]*<\/tr>/ig;
            var $tr=$trPatten.exec($table)[1];
            var $tdPatten=/<td>(.*?)<\/td>/ig;
            var value;
            $msg.name=[];
            $msg.value=[];
            while(value=$tdPatten.exec($tr)){
                //res.write(util.inspect(value)+"\n\n");
                $msg.name.push(value[1]);
            }
            while($tr=$trPatten.exec($table)){
                $tdPatten=/<td>(.*?)<\/td>/ig;
                var val=[];
                while(value=$tdPatten.exec($tr[1])){
                    val.push(value[1]);
                }
                $msg.value.push(val);
            }
            var $reMsg={
                status:1,
                data:$msg
            };
            callback($reMsg);
        }
    }

};
module.exports=Gwtxz;