<?php
error_reporting(E_ALL);
include 'Gwtxz.class.php';
$user = new Gwtxz();
header("Content-type:text/html; charset=utf-8");
$field = array(
		'username'=>$_POST['username'],
		'password'=>$_POST['password'],
		'login-form-type'=> 'pwd', //$_POST['login-form-type']
	);

$requestUrl = 'http://tsg.gdufs.edu.cn/gwd_local/login_ibm.jsp';
$formUrl = 'http://tsg.gdufs.edu.cn/pkmslogin.form';


$isLogin = $user->checkField($field, $formUrl);
var_dump($isLogin);

$identity = ($_POST['identity'] == 'teach')?'teach':'';
$temp = $user->getUser($identity);
var_dump($temp);


