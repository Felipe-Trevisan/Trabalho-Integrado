<?php

require_once "models/class.Estudante.php";
require_once "lib/class.EstudanteDAO.php";
require_once "interface.Controller.php";

class EstudanteController implements Controller {
    private $dao;

    function __construct() { $this->dao = new EstudanteDAO(); }

    function getTodos(){
        return $this->dao->buscarTodos();
    }

    function getPorId($id) {
        try {
            
            if (!Auth::check()) {
                throw new Exception("Não autorizado");
            }
            
            $estudante = $this->dao->buscarPorId($id);
            if (!$estudante) {
                
                return new stdClass();
            }
            return $estudante;
        } catch (PDOException $e) {
            throw new Exception("Erro ao buscar estudante: " . $e->getMessage());
        } catch (Exception $e) {
            throw $e;
        }
    }
    
    function criar() {
        
        $dados = !empty($_POST) ? $_POST : json_decode(file_get_contents('php:
        
        
        if (!isset($dados['matricula']) || empty(trim($dados['matricula']))) {
            throw new Exception("Matrícula é obrigatória para cadastrar um estudante.");
        }
        
        if (!isset($dados['courseId']) || empty(trim($dados['courseId']))) {
            throw new Exception("Curso é obrigatório para cadastrar um estudante.");
        }
        
        $matriculaNum = trim($dados['matricula']);
        $cursoId = strval(trim($dados['courseId']));
        
        
        require_once "lib/class.MatriculaDAO.php";
        $matriculaDAO = new MatriculaDAO();
        try {
            $matriculaExistente = $matriculaDAO->buscarPorId($matriculaNum);
            if ($matriculaExistente) {
                throw new Exception("Matrícula já cadastrada no sistema. Use outro número de matrícula.");
            }
        } catch (Exception $e) {
            
            if (strpos($e->getMessage(), 'já cadastrada') !== false) {
                throw $e; 
            }
        }
        
        $e = new Estudante();
        
        $cpf = str_replace(['.', '-'], '', $dados['cpf'] ?? $dados['cpf'] ?? '');
        $e->setCpf($cpf); 
        $e->setNome($dados['nome'] ?? $dados['name'] ?? '');
        $e->setContato($dados['contato'] ?? $dados['phone'] ?? '');
        $e->setMatricula($matriculaNum); 
        
        $precisaAtendimento = $dados['precisa_atendimento_psicopedagogico'] ?? $dados['psychopedagogical'] ?? 0;
        
        $precisaAtendimento = ($precisaAtendimento === true || $precisaAtendimento === 'true' || $precisaAtendimento === '1' || $precisaAtendimento === 1) ? 1 : 0;
        $e->setPrecisaAtendimentoPsicopedagogico($precisaAtendimento);
        $e->setHistorico($dados['historico'] ?? '');
        
        try {
            $estudante = $this->dao->inserir($e);
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), 'Duplicate entry') !== false || $e->getCode() == 23000) {
                if (strpos($e->getMessage(), 'matricula') !== false) {
                    throw new Exception("Matrícula já cadastrada no sistema. Use outro número de matrícula.");
                }
                if (strpos($e->getMessage(), 'cpf') !== false) {
                    throw new Exception("CPF já cadastrado no sistema.");
                }
                throw new Exception("Dados duplicados. Verifique CPF ou Matrícula.");
            }
            throw new Exception("Erro ao criar estudante: " . $e->getMessage());
        }
        
        
        require_once "models/class.Matricula.php";
        $m = new Matricula();
        $m->setMatricula($matriculaNum);
        $m->setEstudanteId($estudante->getIdAluno());
        $m->setCursoId($cursoId); 
        $m->setAtivo(true);
        
        try {
            $matriculaDAO->inserir($m);
        } catch (PDOException $e) {
            
            try {
                $this->dao->apagar($estudante->getIdAluno());
            } catch (Exception $e2) {
            }
            
            if (strpos($e->getMessage(), 'Duplicate entry') !== false || $e->getCode() == 23000) {
                throw new Exception("Matrícula já cadastrada no sistema. Use outro número de matrícula.");
            }
            throw new Exception("Erro ao criar matrícula: " . $e->getMessage());
        }
        
        return $estudante;
    }

    function editar($id) {
        $dados = json_decode(file_get_contents('php:
        
        
        $estudanteExistente = $this->dao->buscarPorId($id);
        if (!$estudanteExistente) {
            throw new Exception("Estudante não encontrado!");
        }
        
        $e = new Estudante();
        $cpf = str_replace(['.', '-'], '', $dados['cpf'] ?? '');
        $e->setCpf($cpf); 
        $e->setNome($dados['nome'] ?? $dados['name'] ?? '');
        $e->setContato($dados['contato'] ?? $dados['phone'] ?? '');
        
        $matricula = isset($dados['matricula']) && !empty(trim($dados['matricula'])) 
            ? trim($dados['matricula']) 
            : $estudanteExistente->getMatricula();
        $e->setMatricula($matricula);
        
        $precisaAtendimento = $dados['precisa_atendimento_psicopedagogico'] ?? $dados['psychopedagogical'] ?? 0;
        
        $precisaAtendimento = ($precisaAtendimento === true || $precisaAtendimento === 'true' || $precisaAtendimento === '1' || $precisaAtendimento === 1) ? 1 : 0;
        $e->setPrecisaAtendimentoPsicopedagogico($precisaAtendimento);
        $e->setHistorico($dados['historico'] ?? $estudanteExistente->getHistorico() ?? '');
        
        try {
            return $this->dao->editar($id, $e);
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), 'Duplicate entry') !== false || $e->getCode() == 23000) {
                if (strpos($e->getMessage(), 'matricula') !== false) {
                    throw new Exception("Matrícula já cadastrada no sistema. Use outro número de matrícula.");
                }
                if (strpos($e->getMessage(), 'cpf') !== false) {
                    throw new Exception("CPF já cadastrado no sistema.");
                }
                throw new Exception("Dados duplicados. Verifique CPF ou Matrícula.");
            }
            throw $e;
        }
    }

    function apagar($id) {
        
        $estudante = $this->dao->buscarPorId($id);
        
        if (!$estudante) {
            throw new Exception("Estudante não encontrado!");
        }
        
        
        $cpf = $estudante->getCpf();
        if ($cpf) {
            try {
                require_once "lib/class.EstudanteNecessidadeDAO.php";
                $estudanteNecessidadeDAO = new EstudanteNecessidadeDAO();
                
                
                $necessidadesDoEstudante = $estudanteNecessidadeDAO->buscarPorCpf($cpf);
                
                
                foreach ($necessidadesDoEstudante as $relacao) {
                    $ids = [
                        'estudante_cpf' => $relacao->getEstudanteCpf(),
                        'necessidade_id' => $relacao->getNecessidadeId()
                    ];
                    $estudanteNecessidadeDAO->apagar($ids);
                }
            } catch (Exception $e) {
                
            }
        }
        
        
        try {
            require_once "lib/class.RespEstudanteDAO.php";
            $respEstudanteDAO = new RespEstudanteDAO();
            
            
            $todasRelacoes = $respEstudanteDAO->buscarTodos();
            $relacoesDoEstudante = array_filter($todasRelacoes, function($relacao) use ($id) {
                return $relacao->getIdAluno() == $id;
            });
            
            
            foreach ($relacoesDoEstudante as $relacao) {
                $ids = [
                    'id_responsavel' => $relacao->getIdResponsavel(),
                    'id_aluno' => $relacao->getIdAluno()
                ];
                $respEstudanteDAO->apagar($ids);
            }
        } catch (Exception $e) {
            
        }
        
        
        return $this->dao->apagar($id);
    }
}

?>