<?php

require_once "models/class.Servidor.php";
require_once "lib/class.ServidorDAO.php";
require_once "interface.Controller.php";

class ServidorController implements Controller {
    private $dao;

    function __construct() { $this->dao = new ServidorDAO(); }

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
        
        
        if (empty($dados['siape']) || empty($dados['nome']) || empty($dados['email']) || empty($dados['cpf']) || empty($dados['tipo'])) {
            throw new Exception('Campos obrigatórios: SIAPE, Nome, Email, CPF e Tipo');
        }
        
        $s = new Servidor();
        $cpf = str_replace(['.', '-'], '', $dados['cpf'] ?? '');
        $siape = intval($dados['siape'] ?? 0);
        $tipo = strtolower($dados['tipo'] ?? $dados['type'] ?? '');
        
        
        $tipoNormalizado = 'CAE';
        if ($tipo === 'docente' || $tipo === 'professor') {
            $tipoNormalizado = 'Docente';
        } elseif ($tipo === 'napne') {
            $tipoNormalizado = 'NAPNE';
        } elseif ($tipo === 'cae') {
            $tipoNormalizado = 'CAE';
        }
        
        $s->setSiape($siape);
        $s->setCpf($cpf);
        $s->setNome($dados['nome'] ?? $dados['name'] ?? '');
        $s->setEmail($dados['email'] ?? '');
        $s->setTelefone($dados['telefone'] ?? $dados['phone'] ?? '');
        $s->setTipo($tipoNormalizado);
        
        try {
            $servidorCriado = $this->dao->inserir($s);
            
            
            if ($tipoNormalizado === 'Docente' || $tipoNormalizado === 'NAPNE' || $tipoNormalizado === 'CAE') {
                try {
                    require_once "lib/class.UsuarioDAO.php";
                    require_once "models/class.Usuario.php";
                    $usuarioDAO = new UsuarioDAO();
                    
                    
                    $usuarioExistente = $usuarioDAO->buscarPorId($siape);
                    if (!$usuarioExistente) {
                        
                        $usuario = new Usuario();
                        $usuario->setSiape($siape);
                        
                        
                        $username = strtolower(trim($dados['email'] ?? ''));
                        
                        if (empty($username)) {
                            $username = $cpf;
                        }
                        
                        
                        $senhaPadrao = password_hash($cpf, PASSWORD_DEFAULT);
                        
                        $usuario->setUsername($username);
                        $usuario->setSenha($senhaPadrao);
                        
                        try {
                            $usuarioDAO->inserir($usuario);
                        } catch (Exception $e) {
                            
                        }
                    }
                } catch (Exception $e) {
                    
                }
            }
            
            return $servidorCriado;
        } catch (PDOException $e) {
            
            if (strpos($e->getMessage(), 'Duplicate entry') !== false || $e->getCode() == 23000) {
                if (strpos($e->getMessage(), 'cpf') !== false) {
                    throw new Exception('CPF já cadastrado!');
                }
                if (strpos($e->getMessage(), 'email') !== false) {
                    throw new Exception('Email já cadastrado!');
                }
                if (strpos($e->getMessage(), 'siape') !== false) {
                    throw new Exception('SIAPE já cadastrado!');
                }
                throw new Exception('Dados duplicados. Verifique CPF, Email ou SIAPE.');
            }
            throw new Exception('Erro ao salvar servidor: ' . $e->getMessage());
        }
    }

    function editar($id) {
        $dados = json_decode(file_get_contents('php:
        
        if (!$dados) {
            throw new Exception('Dados inválidos');
        }
        
        
        if (empty($dados['nome']) || empty($dados['email']) || empty($dados['cpf']) || empty($dados['tipo'])) {
            throw new Exception('Campos obrigatórios: Nome, Email, CPF e Tipo');
        }
        
        $tipo = strtolower($dados['tipo'] ?? $dados['type'] ?? '');
        
        
        $tipoNormalizado = 'CAE';
        if ($tipo === 'docente' || $tipo === 'professor') {
            $tipoNormalizado = 'Docente';
        } elseif ($tipo === 'napne') {
            $tipoNormalizado = 'NAPNE';
        } elseif ($tipo === 'cae') {
            $tipoNormalizado = 'CAE';
        }
        
        $s = new Servidor();
        $cpf = str_replace(['.', '-'], '', $dados['cpf'] ?? '');
        $s->setCpf($cpf);
        $s->setNome($dados['nome'] ?? $dados['name'] ?? '');
        $s->setEmail($dados['email'] ?? '');
        $s->setTelefone($dados['telefone'] ?? $dados['phone'] ?? '');
        $s->setTipo($tipoNormalizado);
        
        try {
            $servidorAtualizado = $this->dao->editar($id, $s);
            
            
            if ($tipoNormalizado === 'Docente' || $tipoNormalizado === 'NAPNE' || $tipoNormalizado === 'CAE') {
                try {
                    require_once "lib/class.UsuarioDAO.php";
                    require_once "models/class.Usuario.php";
                    $usuarioDAO = new UsuarioDAO();
                    
                    
                    $usuarioExistente = $usuarioDAO->buscarPorId($id);
                    if (!$usuarioExistente) {
                        
                        $usuario = new Usuario();
                        $usuario->setSiape($id);
                        
                        
                        $username = strtolower(trim($dados['email'] ?? ''));
                        
                        if (empty($username)) {
                            $username = $cpf;
                        }
                        
                        
                        $senhaPadrao = password_hash($cpf, PASSWORD_DEFAULT);
                        
                        $usuario->setUsername($username);
                        $usuario->setSenha($senhaPadrao);
                        
                        try {
                            $usuarioDAO->inserir($usuario);
                        } catch (Exception $e) {
                        }
                    }
                } catch (Exception $e) {
                }
            }
            
            return $servidorAtualizado;
        } catch (PDOException $e) {
            
            if (strpos($e->getMessage(), 'Duplicate entry') !== false || $e->getCode() == 23000) {
                if (strpos($e->getMessage(), 'cpf') !== false) {
                    throw new Exception('CPF já cadastrado!');
                }
                if (strpos($e->getMessage(), 'email') !== false) {
                    throw new Exception('Email já cadastrado!');
                }
                throw new Exception('Dados duplicados. Verifique CPF ou Email.');
            }
            throw new Exception('Erro ao atualizar servidor: ' . $e->getMessage());
        }
    }

    function apagar($id) {
        
        try {
            require_once "lib/class.UsuarioDAO.php";
            $usuarioDAO = new UsuarioDAO();
            
            
            try {
                $usuario = $usuarioDAO->buscarPorId($id);
                if ($usuario) {
                    $usuarioDAO->apagar($id);
                }
            } catch (Exception $e) {
                
            }
        } catch (Exception $e) {
            
        }
        
        
        return $this->dao->apagar($id);
    }
}

?>