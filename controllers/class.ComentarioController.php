<?php

require_once "models/class.Comentario.php";
require_once "lib/class.ComentarioDAO.php";
require_once "interface.Controller.php";

class ComentarioController implements Controller {
    private $dao;

    function __construct() { $this->dao = new ComentarioDAO(); }

    function getTodos(){
        return $this->dao->buscarTodos();
    }

    function getPorId($id) {
        return $this->dao->buscarPorId($id);
    }
    
    function criar() {
        
        $dados = !empty($_POST) ? $_POST : json_decode(file_get_contents('php:
        
        if (!$dados) {
            throw new Exception('Dados inválidos');
        }
        
        $c = new Comentario();
        $c->setParecerId($dados['parecer_id'] ?? $dados['parecerId'] ?? null);
        $c->setUsuarioId($dados['usuario_id'] ?? $dados['usuarioId'] ?? null);
        $c->setComentarios($dados['comentarios'] ?? $dados['comentario'] ?? '');
        return $this->dao->inserir($c);
    }

    function editar($id) {
        $dados = json_decode(file_get_contents('php:
        
        if (!$dados) {
            throw new Exception('Dados inválidos');
        }
        
        $c = new Comentario();
        $c->setParecerId($dados['parecer_id'] ?? $dados['parecerId'] ?? null);
        $c->setUsuarioId($dados['usuario_id'] ?? $dados['usuarioId'] ?? null);
        $c->setComentarios($dados['comentarios'] ?? $dados['comentario'] ?? '');
        return $this->dao->editar($id, $c);
    }

    function apagar($id) {
        return $this->dao->apagar($id);
    }
}

?>