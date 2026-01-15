<?php

require_once "models/class.EstudanteNecessidade.php";
require_once "lib/class.EstudanteNecessidadeDAO.php";
require_once "interface.Controller.php";

class EstudanteNecessidadeController implements Controller {
    private $dao;

    function __construct() { $this->dao = new EstudanteNecessidadeDAO(); }

    function getTodos(){
        return $this->dao->buscarTodos();
    }

    function getPorId($id) {
        $ids = explode('-', $id);
        $ids_array = ['estudante_cpf' => $ids[0], 'necessidade_id' => $ids[1]];
        return $this->dao->buscarPorId($ids_array);
    }
    
    function criar() {
        
        $dados = !empty($_POST) ? $_POST : json_decode(file_get_contents('php:
        
        if (!$dados) {
            throw new Exception('Dados inválidos');
        }
        
        $en = new EstudanteNecessidade();
        $cpf = str_replace(['.', '-'], '', $dados['estudante_cpf'] ?? $dados['estudanteCpf'] ?? '');
        $en->setEstudanteCpf($cpf);
        $en->setNecessidadeId($dados['necessidade_id'] ?? $dados['necessidadeId'] ?? null);
        return $this->dao->inserir($en);
    }

    function editar($id) {
        $ids = explode('-', $id);
        $ids_array = ['estudante_cpf' => $ids[0], 'necessidade_id' => $ids[1]];
        
        $dados = json_decode(file_get_contents('php:
        
        if (!$dados) {
            throw new Exception('Dados inválidos');
        }
        
        $en = new EstudanteNecessidade();
        $cpf = str_replace(['.', '-'], '', $dados['estudante_cpf'] ?? $dados['estudanteCpf'] ?? '');
        $en->setEstudanteCpf($cpf);
        $en->setNecessidadeId($dados['necessidade_id'] ?? $dados['necessidadeId'] ?? null);
        return $this->dao->editar($ids_array, $en);
    }

    function apagar($id) {
        $ids = explode('-', $id);
        $ids_array = ['estudante_cpf' => $ids[0], 'necessidade_id' => $ids[1]];
        return $this->dao->apagar($ids_array);
    }
}

?>