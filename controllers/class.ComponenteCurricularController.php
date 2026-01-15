<?php

require_once "models/class.ComponenteCurricular.php";
require_once "lib/class.ComponenteCurricularDAO.php";
require_once "interface.Controller.php";

class ComponenteCurricularController implements Controller {
    private $dao;

    function __construct() { $this->dao = new ComponenteCurricularDAO(); }

    function getTodos(){
        return $this->dao->buscarTodos();
    }

    function getPorId($id) {
        return $this->dao->buscarPorId($id);
    }
    
    function criar() {
        
        $dados = !empty($_POST) ? $_POST : json_decode(file_get_contents('php:
        
        
        unset($dados['codigo_componente']);
        
        $c = new ComponenteCurricular();
        
        
        
        
        $c->setComponente($dados['componente'] ?? $dados['name'] ?? '');
        $c->setCargaHoraria(intval($dados['carga_horaria'] ?? $dados['cargaHoraria'] ?? 0));
        $c->setEmenta($dados['ementa'] ?? $dados['description'] ?? '');
        
        
        
        
        return $this->dao->inserir($c);
    }

    function editar($id) {
        $dados = json_decode(file_get_contents('php:
        
        $c = new ComponenteCurricular();
        $c->setComponente($dados['componente'] ?? $dados['name'] ?? '');
        $c->setCargaHoraria($dados['carga_horaria'] ?? $dados['cargaHoraria'] ?? 0);
        $c->setEmenta($dados['ementa'] ?? $dados['description'] ?? '');
        return $this->dao->editar($id, $c);
    }

    function apagar($id) {
        return $this->dao->apagar($id);
    }
}

?>