<?php
require __DIR__ . "/../vendor/autoload.php";

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

require_once __DIR__ . "/../config/index.php";
require_once __DIR__ . "/class.AuthDAO.php";

class Auth {
    static function check(){
        global $key;

        $headers = getallheaders();
        if (!isset($headers['Authorization'])) {
            return false;
        }

        $authorization = $headers['Authorization'];
        $parts = explode(" ", $authorization);
        
        if (count($parts) < 2) {
            return false;
        }
        
        $token = trim($parts[1]);

        try {
            $resultado = JWT::decode( 
                $token, new Key($key, 'HS256')
            );

            $dao = new AuthDAO();
            $usuario = $dao->buscarPorSiape($resultado->userId);

            return !!$usuario;

        } catch(Exception $e) {
            return false;
        }
    }
}
?>