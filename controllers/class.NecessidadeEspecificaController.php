<?php

require_once "models/class.NecessidadeEspecifica.php";
require_once "lib/class.NecessidadeEspecificaDAO.php";
require_once "interface.Controller.php";

class NecessidadeEspecificaController implements Controller {
    private $dao;

    function __construct() { $this->dao = new NecessidadeEspecificaDAO(); }

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
        
        $n = new NecessidadeEspecifica();
        $n->setNome($dados['nome'] ?? $dados['name'] ?? '');
        $n->setDescricao($dados['descricao'] ?? $dados['description'] ?? '');
        return $this->dao->inserir($n);
    }

    function editar($id) {
        $dados = json_decode(file_get_contents('php:
        
        if (!$dados) {
            throw new Exception('Dados inválidos');
        }
        
        $n = new NecessidadeEspecifica();
        $n->setNome($dados['nome'] ?? $dados['name'] ?? '');
        $n->setDescricao($dados['descricao'] ?? $dados['description'] ?? '');
        return $this->dao->editar($id, $n);
    }

    function apagar($id) {
        return $this->dao->apagar($id);
    }
}

?>