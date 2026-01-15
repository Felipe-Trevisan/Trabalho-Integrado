<?php

require_once "models/class.Responsavel.php";
require_once "lib/class.ResponsavelDAO.php";
require_once "interface.Controller.php";

class ResponsavelController implements Controller {
    private $dao;

    function __construct() { $this->dao = new ResponsavelDAO(); }

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
        
        $r = new Responsavel();
        $r->setNomeResponsavel($dados['nome_responsavel'] ?? $dados['nomeResponsavel'] ?? '');
        $cpf = str_replace(['.', '-'], '', $dados['cpf_responsavel'] ?? $dados['cpfResponsavel'] ?? '');
        $r->setCpfResponsavel($cpf);
        $r->setContatoResponsavel($dados['contato_responsavel'] ?? $dados['contatoResponsavel'] ?? '');
        $r->setEnderecoResponsavel($dados['endereco_responsavel'] ?? $dados['enderecoResponsavel'] ?? '');
        return $this->dao->inserir($r);
    }

    function editar($id) {
        $dados = json_decode(file_get_contents('php:
        
        if (!$dados) {
            throw new Exception('Dados inválidos');
        }
        
        $r = new Responsavel();
        $r->setNomeResponsavel($dados['nome_responsavel'] ?? $dados['nomeResponsavel'] ?? '');
        $cpf = str_replace(['.', '-'], '', $dados['cpf_responsavel'] ?? $dados['cpfResponsavel'] ?? '');
        $r->setCpfResponsavel($cpf);
        $r->setContatoResponsavel($dados['contato_responsavel'] ?? $dados['contatoResponsavel'] ?? '');
        $r->setEnderecoResponsavel($dados['endereco_responsavel'] ?? $dados['enderecoResponsavel'] ?? '');
        return $this->dao->editar($id, $r);
    }

    function apagar($id) {
        return $this->dao->apagar($id);
    }
}

?>