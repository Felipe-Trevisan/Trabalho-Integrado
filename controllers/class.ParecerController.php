<?php

require_once "models/class.Parecer.php";
require_once "lib/class.ParecerDAO.php";
require_once "interface.Controller.php";

class ParecerController implements Controller {
    private $dao;

    function __construct() { $this->dao = new ParecerDAO(); }

    function getTodos(){
        return $this->dao->buscarTodos();
    }

    function getPorId($id) {
        return $this->dao->buscarPorId($id);
    }
    
    function getPorPeiAdaptacao($pei_adaptacao_id) {
        return $this->dao->buscarPorPeiAdaptacao($pei_adaptacao_id);
    }
    
    function criar() {
        
        $dados = !empty($_POST) ? $_POST : json_decode(file_get_contents('php:
        
        if (!$dados) {
            throw new Exception('Dados inválidos');
        }
        
        $p = new Parecer();
        $p->setPeiAdaptacaoId($dados['pei_adaptacao_id'] ?? $dados['peiAdaptacaoId'] ?? null);
        $p->setProfessorSiape($dados['professor_siape'] ?? $dados['professorSiape'] ?? null);
        $p->setPeriodo($dados['periodo'] ?? '');
        $p->setDescricao($dados['descricao'] ?? '');
        return $this->dao->inserir($p);
    }

    function editar($id) {
        $dados = json_decode(file_get_contents('php:
        
        if (!$dados) {
            throw new Exception('Dados inválidos');
        }
        
        $p = new Parecer();
        $p->setPeiAdaptacaoId($dados['pei_adaptacao_id'] ?? $dados['peiAdaptacaoId'] ?? null);
        $p->setPeriodo($dados['periodo'] ?? '');
        $p->setDescricao($dados['descricao'] ?? '');
        return $this->dao->editar($id, $p);
    }

    function apagar($id) {
        return $this->dao->apagar($id);
    }
}

?>