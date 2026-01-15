<?php

class Rotas {
    private $rotas;
    function __construct(){ $this->rotas = []; }
    function get($url, $acao, $protegida = true){ $this->add('GET', $url, $acao, $protegida); }
    function post($url, $acao, $protegida = true) { $this->add('POST', $url, $acao, $protegida); }
    function put($url, $acao, $protegida = true) { $this->add('PUT', $url, $acao, $protegida); }
    function delete($url, $acao, $protegida = true) {$this->add('DELETE', $url, $acao, $protegida); }

    private function add($metodo, $url, $acao, $protegida = true) {
        $this->rotas[] = compact('metodo', 'url', 'acao', 'protegida');
    }

    function executar(){
        $urlBase = 'GitHub/Trabalho-Integrado/';
        $metodo = $_SERVER['REQUEST_METHOD'];
        $url = rtrim(
            str_ireplace($urlBase, '', $_SERVER['REQUEST_URI']),
            '/'
        );

        foreach($this->rotas as $rota) {
            if ($rota['metodo'] !== $metodo) continue;

            $padrao = "@^" . preg_replace('/\{[^\}]+\}/','([^/]+)', $rota['url']) . "$@";

            if(!preg_match($padrao, $url, $matches)) continue;
            array_shift($matches);
            
            [$controllerNome, $acao] =  explode('@',$rota['acao']);

            require_once "controllers/class.$controllerNome.php";
            $controller = new $controllerNome();
            
            if ($rota['protegida'] && !Auth::check()){
                http_response_code(404);
                echo json_encode(['error'=>"Você não está autenticado."]);
                return;
            }
            return call_user_func_array([$controller, $acao], $matches);    
        }
        http_response_code(404);
        return ['error'=>"Url não encontrada"];
    }   
}

?>