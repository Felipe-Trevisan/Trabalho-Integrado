<?php

require_once "models/class.Matricula.php";
require_once "lib/class.MatriculaDAO.php";
require_once "interface.Controller.php";

class MatriculaController implements Controller {
    private $dao;

    function __construct() { $this->dao = new MatriculaDAO(); }

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
        
        $m = new Matricula();
        $m->setMatricula($dados['matricula'] ?? '');
        $m->setEstudanteId($dados['estudante_id'] ?? $dados['estudanteId'] ?? null);
        $m->setCursoId($dados['curso_id'] ?? $dados['cursoId'] ?? null);
        $m->setAtivo($dados['ativo'] ?? $dados['active'] ?? true);
        return $this->dao->inserir($m);
    }

    function editar($id) {
        $dados = json_decode(file_get_contents('php:
        
        if (!$dados) {
            throw new Exception('Dados inválidos');
        }
        
        $m = new Matricula();
        $m->setMatricula($id); 
        $m->setEstudanteId($dados['estudante_id'] ?? $dados['estudanteId'] ?? null);
        $m->setCursoId($dados['curso_id'] ?? $dados['cursoId'] ?? null);
        $m->setAtivo($dados['ativo'] ?? $dados['active'] ?? true);
        return $this->dao->editar($id, $m);
    }

    function apagar($id) {
        return $this->dao->apagar($id);
    }
}

?>