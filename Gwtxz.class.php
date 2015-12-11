<?php

/**
 * 通过模拟登录，爬取数字广外的宿舍专业等个人信息
 * @author wangjiewen
 *
 */
class Gwtxz {
	private $firstContent = '';
	private $pageContent = '';//保存返回的页面内容

	public $cookie = '';
	
	private $username = '';//学号
	
	
	public function __construct(){
		
	}
	
	/**
	 * 从返回的内容中提取出cookie
	 * @param String $responseHeader
	 */
	private function parseResponseCookie($responseHeader){
		list($header, $body) = explode("\r\n\r\n", $responseHeader);
		preg_match_all("/set\-cookie:([^\r\n]*)/is", $header, $matches);
		foreach ($matches[1] as $value) {
			$this->cookie .= $value.'; ';
		}
		
	}
	
	/**
	 * 从一串url地址中，解析主机
	 *
	 * @param string $url 如：http://www.php.net/pub/
	 * @return string $host 如：www.php.net
	 */
	private function parseHost($url){
		$search = '~^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?~i';
		$url = trim($url);
		preg_match($search, $url ,$match);
		return $match[4];
	}
	
	/**
	 * 外部接口调用
	 * @param string $username
	 * @param string $password
	 * @return boolean
	 */
	public function login($username, $password){
		$field = array(
				'username'=> $username,
				'password'=> $password,
				'login-form-type'=> 'pwd', //$_POST['login-form-type']
		);
		return $this->checkField($field);
	}
	
	/**
	 * 判断是否登录成功
	 * 发送表单数据，并存储cookie
	 * @param array $field //表单的数据
	 * @param string $formUrl //广外统一验证入口 
	 * @param string $refer //页面的refer,由于数字广外采用了xscf，如果要获取数字广外的内容，必须指定该项
	 * 学工管理： http://xg.gdufs.edu.cn/pkmslogin.form 
	 * 正方教务： http://jw.gdufs.edu.cn/pkmslogin.form
	 * 
	 * @return boolean
	 */
	function checkField($field, $formUrl='',$refer=''){
		if (empty($formUrl)){//默认为正方管理系统的验证入口
			$formUrl = 'http://tsg.gdufs.edu.cn/pkmslogin.form';//http://jw.gdufs.edu.cn/pkmslogin.form
		}
		if (empty($refer)){
			$refer = $this->getReferUrl();
		}
		//save username
		$this->username = $field['username'];
		
		$param = '';
		foreach ($field as $key => $value){
			$param .= "$key=".urlencode($value)."&";
		}
		$param = substr($param, 0,-1);
		$host = $this->parseHost($formUrl);
		$origin = 'http://'.$host;
		
		
		$header = array(
			'POST /pkmslogin.form HTTP/1.1',
			'Host: '.$host,
			'Connection: keep-alive',
			'Content-Length: '.strlen($param),
			'Cache-Control: max-age=0',
			'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
			'Origin: '.$origin,
			'User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.31 (KHTML, like Gecko) Chrome/26.0.1410.12 Safari/537.31',
			'Content-Type: application/x-www-form-urlencoded',
			'Referer: '.$refer,
			'Accept-Encoding: gzip,deflate,sdch',
			'Accept-Language: zh-CN,zh;q=0.8',
			'Accept-Charset: GBK,utf-8;q=0.7,*;q=0.3',
			
		);
		
		
		$ch = curl_init();
		curl_setopt($ch, CURLOPT_URL, $formUrl);
		curl_setopt($ch, CURLOPT_HEADER, true);
		curl_setopt($ch, CURLOPT_HTTPHEADER, $header);
		curl_setopt($ch, CURLOPT_POST, 1);
		curl_setopt($ch, CURLOPT_POSTFIELDS, $param);
// 		curl_setopt($ch, CURLOPT_COOKIEJAR, dirname(__FILE__).'/cookie.txt');  //将cookie保存到文件中
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		curl_setopt($ch, CURLINFO_HEADER_OUT, true);
		
		// 抓取URL并把它传递给浏览器
		$content = curl_exec($ch);
		
		curl_close($ch);
		
		$this->parseResponseCookie($content);//从返回的内容中提取出cookie
		
		$pattern ='#<TITLE>Success<\/TITLE>#';
		if(preg_match($pattern, $content)){
			return true;
		}else{
			return false;
		}
	
	}
	
	/**
	 * 保存页面返回内容
	 * @param string $requesUrl 请求地址的url
	 * 学工管理：http://xg.gdufs.edu.cn/epstar/app/template.jsp?mainobj=SWMS/XSJBXX/T_XSJBXX_XSJBB&tfile=XGMRMB/detail_BDTAG
	 * 正方教务: http://jw.gdufs.edu.cn/xskbcx.aspx?xh=20111003632
	 * @return 返回页面的header信息
	 */
	function saveContent($requesUrl){

		$ch2 = curl_init();
		curl_setopt($ch2, CURLOPT_URL, $requesUrl);
		curl_setopt($ch2, CURLOPT_FOLLOWLOCATION, 1);
		curl_setopt($ch2, CURLOPT_COOKIE, $this->cookie);
// 		curl_setopt($ch2, CURLOPT_COOKIEFILE, dirname(__FILE__).'/cookie.txt');
	
		ob_start();
		curl_exec($ch2);
		$content = ob_get_contents();
		ob_end_clean();
		
		$info = curl_getinfo($ch2);
		curl_close($ch2);
		$this->pageContent = $content;

		return $info;
			
	}
	
	/**
	 * 获得页面返回的内容
	 * @return string
	 */
	public function getContent(){
		return $this->pageContent;
	}
	
	
	
	/**
	 * 生成请求的地址
	 * @param string $schoolNumber 学号
	 * @param int $type 类型： 1为正方管理系统>>我的信息；2为正方管理系统>>我的课表；3为学工管理>>我的基本信息；4为学工管理>>我的宿舍信息
	 * @return string $requstUrl 返回请求的地址
	 */
	private function getRequestUrl($schoolNumber, $type){
		$requestUrl = '';
		switch ($type){
			case 1:
				// 学生基础信息
				$requestUrl = 'http://jw.gdufs.edu.cn/xsgrxx.aspx?xh='.$schoolNumber;
				break;
			case 2:
				// 学生课表
				$requestUrl = 'http://jw.gdufs.edu.cn/xskbcx.aspx?xh='.$schoolNumber;
				break;
			case 3:
				// 学生档案
				$requestUrl = 'http://xg.gdufs.edu.cn/epstar/app/template.jsp?mainobj=SWMS/XSJBXX/T_XSJBXX_XSJBB&tfile=XGMRMB/detail_BDTAG';
				break;
			case 4:
				// 学生宿舍信息
				$requestUrl = "http://xg.gdufs.edu.cn/epstar/app/template.jsp?mainobj=SWMS/SSGLZXT/SSAP/V_SS_SSXXST&tfile=XSCKMB/BDTAG&filter=V_SS_SSXXST:XH='".$schoolNumber."'";
				break;
			case 5:
				// 教师基础信息
				$requestUrl = 'http://jw.gdufs.edu.cn/js_grjl.aspx?zgh='.$schoolNumber;
				break;
			default:
				// 学生基础信息
				$requestUrl = 'http://jw.gdufs.edu.cn/xsgrxx.aspx?xh='.$schoolNumber;
				
		}
		return $requestUrl;		
	}
	
	/**
	 * 当获取数字广外的内容时，才需要用到
	 * @return string $referUrl 
	 */
	private function getReferUrl(){
		$referUrl = "http://auth.gdufs.edu.cn/wps/myportal/001/00101/!ut/p/c5/fY1LDoIwFADPwgHMe_zLEj-RFhURVNoNqYnBSimEGNTb686dmcUsZjEg4IuRk2rkQ_VGaqhABHWWJ0jnxImynPlI03K7TEjoIgmBgwh_HcliiZSydOOtmItrhGpS1yeUUKFXF_eIbb4-zqOUvYuzmFUmaI-dzspuYEL7r0voH6S-ddLo2diefd7HCyUK0VgWZLaDngu7vZbKQPn3yoH_7YLGp9FxbDtAtAkMLZ8a0lsfBmXNWQ!!/";
		return $referUrl;
	}
	
	/**
	 * 获取用户的详细信息,
	 * 这个是一个耗时方法，建议只调用一次
	 * @return multitype:array |NULL
	 */
	public function getUser($identity){
		//爬取用户信息，
		if($identity == 'teach'){
			// 教师
			$requestUrl = $this->getRequestUrl($this->username,5);
            $this->saveContent($requestUrl);
            $arr2 = array();
            $pattern1 = '#<td(.*)><span id=\"(zgh1|xm)\">(.*)</span></td>#';
            $pattern2 = '#<select name=\"(xb|mz|zzmm|bm|xw|zc)\" [\s\S]+?</select>#';
            if(!preg_match_all($pattern2, $this->getContent(), $matches2)){
            		return null;
            }
            foreach ($matches2[0] as $key => $value) {
            		$pattern2 = '#<option selected=\"selected\" value=\"(.*)\">(.*)</option>#';
            		preg_match_all($pattern2, $value, $matches21);
            		if(empty($matches21[0])){
            			$pattern2 = '#<option value=\"(.*)\">(.*)</option>#';
            			preg_match_all($pattern2, $value, $matches21);
            		}
            		array_push($arr2, $matches21[2][0]);
            }
            $pattern3 = '#<input name=\"(csrq|zw)\" type=\"text\" value=\"([^\"]*)\" (((\w)+)=\"(.*)\" )+/>#';
	        if (preg_match_all($pattern1, $this->getContent(), $matches1)) {
                    if (preg_match_all($pattern3, $this->getContent(), $matches3)) {
                        $arr1 = $matches1[3];
                        $arr3 = $matches3[2];
                        $data = array(
                                'teacherNumber' => $arr1[0],
                                'name' => $arr1[1],
                                'gender' => $arr2[0],
                                'nation' => $arr2[1],
                                'politics' => $arr2[2],
                                'academy' => $arr2[3],
                                'degree' => $arr2[4],
                                'profession' => $arr2[5],
                                'birthday' => $arr3[0],
                                'position' => $arr3[1]
                        );
                        foreach($data as $k=>$v){
                            $data[$k] = iconv("gb2312","utf-8",$v);
                        }
                        $data['gender'] .= "性";   //统一格式
                        $data['position'] = explode('（',$data['position'])[0];  //去掉中文空格后的文本
                    }else{
                        return null;
                    }
            }else{
                    return null;
			}
		}else{
			// 学生
			$requestUrl = $this->getRequestUrl($this->username,4);
            $this->saveContent($requestUrl);
			$pattern = '#<font id=\"(\w)+\" value=\"(.)+?\">(.*)</font>#';
			if (preg_match_all($pattern, $this->getContent(), $matches)) {
				$arr = $matches[3];
				$data = array(
						'studentNumber' => $arr[0],
						'name' => $arr[1],
						'gender' => $arr[2],
						'academy' => $arr[3],
						'grade' => $arr[4],
						'major' => $arr[5],
						'campus' => $arr[6],
						'block' => $arr[8],
						'floor' => $arr[9],
						'room' => $arr[10]
				);
			}else{
                return null;
            }
		}
		return $data;
		
	}
	
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
	public function getCurriculum(){
		$requestUrl = $this->getRequestUrl($this->username, 2);
		$this->saveContent($requestUrl);
		$pageContent = $this->getContent();
		$patten = '#<td align=\"Center\"( rowspan=\"\d\"){0,1}( width=\"[\d]+%\"){0,1}>([^\s]+?)<br>([^\s]*?)<br>([^\s]*?)<br>([^\s]*?)</td>#';
		$pageContent = iconv("gbk", "utf-8", $pageContent);
		if(preg_match_all($patten, $pageContent, $matches)){
			$len = count($matches[0]);
			$weekArr = array(
				"周日" =>0, "周一" =>1, "周二" => 2, "周三" =>3, "周四" =>4, "周五" =>5, "周六" =>6
			);
			$data = array();
			for($i = 0; $i < $len; $i++){
				$name = $matches[3][$i];
				$timeStr = $matches[4][$i];
				$week = substr($timeStr, 0, 6);
				$index = strpos($timeStr, "节");
				$times = explode(",", substr($timeStr, 9, $index - 9));
				$arr = array(
						'name' => $name,
						'teacherName' => $name,
						'place'=>$matches[6][$i],
						'week'=> $weekArr[$week],
						'startSection'=>$times[0],
						'endSection'=>$times[count($times) - 1]			
				);
				$data[] = $arr;
			}
			return $data;
		}else{
			return null;
		}
	}
	
	
	
	
	
	
	
	
	
	
}