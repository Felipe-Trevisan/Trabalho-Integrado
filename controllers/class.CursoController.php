<?php

require_once "models/class.Curso.php";
require_once "lib/class.CursoDAO.php";
require_once "interface.Controller.php";

class CursoController implements Controller {
    private $dao;

    function __construct() { $this->dao = new CursoDAO(); }

    function getTodos(){
        return $this->dao->buscarTodos();
    }

    function getPorId($id) {
        return $this->dao->buscarPorId($id);
    }
    
    function criar() {
        
        $dados = !empty($_POST) ? $_POST : json_decode(file_get_contents('php:
        
        
        $codigo = $dados['codigo'] ?? $dados['code'] ?? 'CURSO-' . strtoupper(substr(md5(time()), 0, 8));
        
        
        $coordenadorCpf = null;
        $coordenadorCpfRaw = $dados['coordenador_cpf'] ?? $dados['coordinator_cpf'] ?? null;
        
        
        if ($coordenadorCpfRaw !== null && $coordenadorCpfRaw !== '') {
            $coordenadorCpf = preg_replace('/[^0-9]/', '', trim($coordenadorCpfRaw));
            
            
            if (!empty($coordenadorCpf)) {
                
                if (strlen($coordenadorCpf) !== 11) {
                    throw new Exception("CPF do coordenador inválido. Deve conter 11 dígitos.");
                }
                
                
                require_once "lib/class.ServidorDAO.php";
                $servidorDAO = new ServidorDAO();
                
                
                $servidores = $servidorDAO->buscarTodos();
                $cpfExiste = false;
                foreach ($servidores as $servidor) {
                    $cpfServidor = preg_replace('/[^0-9]/', '', $servidor->getCpf());
                    if ($cpfServidor === $coordenadorCpf) {
                        $cpfExiste = true;
                        break;
                    }
                }
                
                if (!$cpfExiste) {
                    throw new Exception("CPF do coordenador não encontrado na tabela de servidores. Verifique se o servidor está cadastrado antes de atribuí-lo como coordenador.");
                }
            } else {
                
                $coordenadorCpf = null;
            }
        }
        
        $c = new Curso();
        $c->setCodigo($codigo);
        $c->setNome($dados['nome'] ?? $dados['name'] ?? '');
        $c->setModalidade($dados['modalidade'] ?? $dados['level'] ?? '');
        $c->setCargaHoraria($dados['carga_horaria'] ?? $dados['workload'] ?? null);
        $c->setDuracao($dados['duracao'] ?? $dados['duration'] ?? '');
        $c->setCoordenadorCpf($coordenadorCpf); 
        
        return $this->dao->inserir($c);
    }

    function editar($id) {
        $dados = json_decode(file_get_contents('php:
        
        
        $coordenadorCpf = null;
        $coordenadorCpfRaw = $dados['coordenador_cpf'] ?? $dados['coordinator_cpf'] ?? null;
        
        
        if ($coordenadorCpfRaw !== null && $coordenadorCpfRaw !== '') {
            $coordenadorCpf = preg_replace('/[^0-9]/', '', trim($coordenadorCpfRaw));
            
            
            if (!empty($coordenadorCpf)) {
                
                if (strlen($coordenadorCpf) !== 11) {
                    throw new Exception("CPF do coordenador inválido. Deve conter 11 dígitos.");
                }
                
                
                require_once "lib/class.ServidorDAO.php";
                $servidorDAO = new ServidorDAO();
                
                
                $servidores = $servidorDAO->buscarTodos();
                $cpfExiste = false;
                foreach ($servidores as $servidor) {
                    $cpfServidor = preg_replace('/[^0-9]/', '', $servidor->getCpf());
                    if ($cpfServidor === $coordenadorCpf) {
                        $cpfExiste = true;
                        break;
                    }
                }
                
                if (!$cpfExiste) {
                    throw new Exception("CPF do coordenador não encontrado na tabela de servidores. Verifique se o servidor está cadastrado antes de atribuí-lo como coordenador.");
                }
            } else {
                
                $coordenadorCpf = null;
            }
        }
        
        $c = new Curso();
        $c->setCodigo($id); 
        $c->setNome($dados['nome'] ?? $dados['name'] ?? '');
        $c->setModalidade($dados['modalidade'] ?? $dados['level'] ?? '');
        $c->setCargaHoraria($dados['carga_horaria'] ?? $dados['workload'] ?? null);
        $c->setDuracao($dados['duracao'] ?? $dados['duration'] ?? '');
        $c->setCoordenadorCpf($coordenadorCpf); 
        
        return $this->dao->editar($id, $c);
    }

    function apagar($id) {
        return $this->dao->apagar($id);
    }
}

?>