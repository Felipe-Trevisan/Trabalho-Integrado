<?php

require_once "models/class.PeiAdaptacao.php";
require_once "lib/class.PeiAdaptacaoDAO.php";
require_once "interface.Controller.php";

class PeiAdaptacaoController implements Controller {
    private $dao;

    function __construct() { $this->dao = new PeiAdaptacaoDAO(); }

    function getTodos(){
        return $this->dao->buscarTodos();
    }

    function getPorId($id) {
        return $this->dao->buscarPorId($id);
    }
    
    function criar() {
        
        $dados = !empty($_POST) ? $_POST : json_decode(file_get_contents('php:
        
        require_once "lib/class.ServidorDAO.php";
        $servidorDAO = new ServidorDAO();
        
        
        
        $professor_siape = null;
        
        
        if (isset($dados['professor_siape']) && !empty($dados['professor_siape'])) {
            $siape_enviado = intval($dados['professor_siape']);
            
            $servidor = $servidorDAO->buscarPorId($siape_enviado);
            if ($servidor && $servidor->getTipo() === 'Docente') {
                $professor_siape = $siape_enviado;
            }
        }
        
        
        if (!$professor_siape && isset($dados['docente']) && !empty($dados['docente'])) {
            $servidores = $servidorDAO->buscarTodos();
            foreach ($servidores as $s) {
                if ($s->getNome() === $dados['docente'] && $s->getTipo() === 'Docente') {
                    $professor_siape = $s->getSiape();
                    break;
                }
            }
        }
        
        
        if (!$professor_siape) {
            $servidores = $servidorDAO->buscarTodos();
            foreach ($servidores as $s) {
                if ($s->getTipo() === 'Docente') {
                    $professor_siape = $s->getSiape();
                    break;
                }
            }
        }
        
        
        if (!$professor_siape) {
            throw new Exception("Professor não identificado. É necessário ter pelo menos um docente cadastrado no sistema.");
        }
        
        $p = new PeiAdaptacao();
        $p->setPeiGeralId(intval($dados['pei_geral_id'] ?? $dados['pei_geral_id'] ?? 0));
        $p->setCodigoComponente(intval($dados['codigo_componente'] ?? $dados['codigo_componente'] ?? 0));
        $p->setProfessorSiape($professor_siape);
        $p->setEmenta($dados['ementa'] ?? $dados['ementa'] ?? '');
        $p->setObjetivosEspecificos($dados['objetivos_especificos'] ?? $dados['objetivos_especificos'] ?? '');
        $p->setMetodologia($dados['metodologia'] ?? $dados['metodologia'] ?? '');
        $p->setAvaliacao($dados['avaliacao'] ?? $dados['avaliacao'] ?? '');
        $p->setParecer($dados['parecer'] ?? $dados['parecer'] ?? '');
        $p->setStatus($dados['status'] ?? 'rascunho');
        $p->setComentariosNapne($dados['comentarios_napne'] ?? $dados['comentarios_napne'] ?? '');
        $p->setDocente($dados['docente'] ?? $dados['docente'] ?? ''); 
        return $this->dao->inserir($p);
    }

    function editar($id) {
        $dados = json_decode(file_get_contents('php:
        
        
        $converterDataParaMySQL = function($dataISO) {
            if (empty($dataISO) || $dataISO === null) {
                return null;
            }
            
            
            if (preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', $dataISO)) {
                return $dataISO;
            }
            
            
            try {
                $timestamp = strtotime($dataISO);
                if ($timestamp !== false) {
                    return date('Y-m-d H:i:s', $timestamp);
                }
            } catch (Exception $e) {
            }
            
            
            return null;
        };
        
        
        $peiExistente = $this->dao->buscarPorId($id);
        $professor_siape = $peiExistente ? $peiExistente->getProfessorSiape() : null;
        
        
        if (isset($dados['professor_siape']) && !empty($dados['professor_siape'])) {
            $professor_siape = intval($dados['professor_siape']);
        }
        
        $p = new PeiAdaptacao();
        $p->setPeiGeralId(intval($dados['pei_geral_id'] ?? 0));
        $p->setCodigoComponente(intval($dados['codigo_componente'] ?? 0));
        if ($professor_siape) {
            $p->setProfessorSiape($professor_siape);
        }
        $p->setEmenta($dados['ementa'] ?? '');
        $p->setObjetivosEspecificos($dados['objetivos_especificos'] ?? '');
        $p->setMetodologia($dados['metodologia'] ?? '');
        $p->setAvaliacao($dados['avaliacao'] ?? '');
        $p->setParecer($dados['parecer'] ?? '');
        $p->setStatus($dados['status'] ?? $peiExistente->getStatus() ?? 'rascunho');
        $p->setComentariosNapne($dados['comentarios_napne'] ?? '');
        
        
        $dataEnvioNapne = $dados['data_envio_napne'] ?? $peiExistente->getDataEnvioNapne() ?? null;
        $p->setDataEnvioNapne($converterDataParaMySQL($dataEnvioNapne));
        
        $dataRespostaNapne = $dados['data_resposta_napne'] ?? $peiExistente->getDataRespostaNapne() ?? null;
        $p->setDataRespostaNapne($converterDataParaMySQL($dataRespostaNapne));
        
        $p->setDocente($dados['docente'] ?? ''); 
        return $this->dao->editar($id, $p);
    }

    function apagar($id) {
        return $this->dao->apagar($id);
    }
}

?>