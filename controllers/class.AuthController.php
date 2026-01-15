<?php
require __DIR__ . "/../vendor/autoload.php";
use Firebase\JWT\JWT;

require_once __DIR__ . "/../config/index.php";
require_once __DIR__ . "/../lib/class.AuthDAO.php";
require_once __DIR__ . "/../lib/class.UsuarioDAO.php";
require_once __DIR__ . "/../lib/class.ServidorDAO.php";
require_once __DIR__ . "/../models/class.Usuario.php";
require_once __DIR__ . "/../models/class.Servidor.php";

class AuthController {
    private $dao;
    private $usuarioDao;
    private $servidorDao;

    function __construct(){
        $this->dao = new AuthDAO();
        $this->usuarioDao = new UsuarioDAO();
        $this->servidorDao = new ServidorDAO();
    }

    function login(){
        global $key;

        try {
            $dados = json_decode(file_get_contents("php:

            if (!$dados) {
                throw new Exception("Dados inválidos");
            }

            $username = $dados->username ?? $dados->email ?? '';
            $senha = $dados->senha ?? $dados->password ?? '';

            if (empty($username) || empty($senha)) {
                throw new Exception("Usuário e senha são obrigatórios");
            }

            $usuario = $this->dao->login($username, $senha);

            if (!$usuario) {
                throw new Exception("Usuário ou senha incorretos. Verifique se o usuário foi criado corretamente.");
            }

            if (empty($usuario->siape)) {
                throw new Exception("Erro: Usuário sem SIAPE cadastrado. Verifique se o servidor foi criado corretamente.");
            }

            if (empty($key)) {
                throw new Exception("Erro de configuração do servidor");
            }

            $payload = [
                'iss'=> 'http:
                'iat' => time(),
                'exp' => time() + 1 * 60 * 60 
            ];

            $payload['userId'] = intval($usuario->siape);

            try {
                $jwt = JWT::encode($payload, $key, 'HS256');
            } catch (Exception $e) {
                throw new Exception("Erro ao gerar token: " . $e->getMessage());
            }

            if (empty($jwt)) {
                throw new Exception("Erro ao gerar token de autenticação");
            }

            
            $tipoRetorno = $usuario->tipo ?? '';
            
            if (!empty($tipoRetorno)) {
                $tipoLower = strtolower($tipoRetorno);
                if ($tipoLower === 'docente' || $tipoLower === 'professor') {
                    $tipoRetorno = 'Docente';
                } else if ($tipoLower === 'cae') {
                    $tipoRetorno = 'CAE';
                } else if ($tipoLower === 'napne') {
                    $tipoRetorno = 'NAPNE';
                }
            }
            
            return [
                'token' => $jwt,
                'siape' => $usuario->siape,
                'username' => $usuario->username,
                'nome' => $usuario->nome,
                'tipo' => $tipoRetorno,
                'email' => $usuario->email,
                'cpf' => $usuario->cpf
            ];
        } catch (Exception $e) {
            throw $e;
        }
    }

    function register(){
        global $key;
        
        $dados = json_decode(file_get_contents("php:

        if (!$dados) {
            throw new Exception("Dados inválidos");
        }

        $username = $dados['username'] ?? '';
        $senha = $dados['senha'] ?? $dados['password'] ?? '';
        $tipoRaw = $dados['tipo'] ?? $dados['userType'] ?? 'napne';
        $nome = $dados['nome'] ?? $username;
        $email = $dados['email'] ?? $username . '@napne.local';
        $cpf = $dados['cpf'] ?? '';
        $telefone = $dados['telefone'] ?? '';
        $siape = $dados['siape'] ?? null;

        if (empty($username) || empty($senha)) {
            throw new Exception("Usuário e senha são obrigatórios");
        }

        
        $tipo = 'NAPNE';
        $tipoLower = strtolower($tipoRaw);
        if ($tipoLower === 'docente' || $tipoLower === 'professor') {
            $tipo = 'Docente';
        } elseif ($tipoLower === 'cae') {
            $tipo = 'CAE';
        } elseif ($tipoLower === 'napne') {
            $tipo = 'NAPNE';
        }
        

        
        $usuarioExistente = $this->usuarioDao->buscarPorUsername($username);
        if ($usuarioExistente) {
            throw new Exception("Nome de usuário já está em uso");
        }

        
        $servidores = $this->servidorDao->buscarTodos();
        
        
        foreach ($servidores as $s) {
            if ($s->getEmail() === $email) {
                throw new Exception("Email já está em uso");
            }
        }

        
        if (!$siape) {
            do {
                $siape = intval(substr(time(), -8)) + rand(1000, 9999);
                $servidorExistente = $this->servidorDao->buscarPorId($siape);
            } while ($servidorExistente);
        } else {
            $servidorExistente = $this->servidorDao->buscarPorId($siape);
            if ($servidorExistente) {
                throw new Exception("SIAPE já está em uso");
            }
        }

        
        if (empty($cpf)) {
            $cpf = str_pad($siape, 11, '0', STR_PAD_LEFT);
            $cpfExiste = false;
            foreach ($servidores as $s) {
                if ($s->getCpf() === $cpf) {
                    $cpfExiste = true;
                    break;
                }
            }
            if ($cpfExiste) {
                $cpf = str_pad($siape, 9, '0', STR_PAD_LEFT) . rand(10, 99);
            }
        } else {
            foreach ($servidores as $s) {
                if ($s->getCpf() === $cpf) {
                    throw new Exception("CPF já está em uso");
                }
            }
        }

        
        $servidor = new Servidor();
        $servidor->setSiape($siape);
        $servidor->setCpf($cpf); 
        $servidor->setNome($nome);
        $servidor->setEmail($email);
        $servidor->setTelefone($telefone);
        $servidor->setTipo($tipo);

        try {
            $servidorCriado = $this->servidorDao->inserir($servidor);
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), 'Duplicate entry') !== false || $e->getCode() == 23000) {
                if (strpos($e->getMessage(), 'cpf') !== false) {
                    throw new Exception('CPF já está em uso');
                }
                if (strpos($e->getMessage(), 'email') !== false) {
                    throw new Exception('Email já está em uso');
                }
                if (strpos($e->getMessage(), 'siape') !== false) {
                    throw new Exception('SIAPE já está em uso');
                }
                throw new Exception('Dados duplicados. Verifique CPF, Email ou SIAPE.');
            }
            throw new Exception('Erro ao criar servidor: ' . $e->getMessage());
        }

        
        try {
            $servidorVerificado = $this->servidorDao->buscarPorId($siape);
            if (!$servidorVerificado) {
                throw new Exception('Servidor não foi criado corretamente. Não é possível criar usuário.');
            }
            
            $usuario = new Usuario();
            $usuario->setSiape($siape);
            $usuario->setUsername($username);
            $usuario->setSenha(password_hash($senha, PASSWORD_DEFAULT));
            
            $usuarioCriado = $this->usuarioDao->inserir($usuario);
            
            if (!$usuarioCriado) {
                throw new Exception('Erro ao criar usuário: método inserir retornou nulo');
            }
            
            $usuarioVerificado = $this->usuarioDao->buscarPorId($siape);
            if (!$usuarioVerificado) {
                throw new Exception('Usuário não foi criado no banco de dados');
            }
        } catch (PDOException $e) {
            try {
                $this->servidorDao->apagar($siape);
            } catch (Exception $e2) {
                
            }
            
            if (strpos($e->getMessage(), 'Duplicate entry') !== false || $e->getCode() == 23000) {
                throw new Exception('Nome de usuário já está em uso');
            }
            throw new Exception('Erro ao criar usuário: ' . $e->getMessage());
        } catch (Exception $e) {
            try {
                $this->servidorDao->apagar($siape);
            } catch (Exception $e2) {
                
            }
            throw $e;
        }

        $usuarioFinal = $this->usuarioDao->buscarPorId($siape);
        if (!$usuarioFinal) {
            try {
                $this->servidorDao->apagar($siape);
            } catch (Exception $e) {
                
            }
            throw new Exception('Usuário não foi criado corretamente.');
        }
        
        $payload = [
            'iss'=> 'http:
            'iat' => time(),
            'exp' => time() + 1 * 60 * 60
        ];

        $payload['userId'] = $siape;
        $jwt = JWT::encode($payload, $key, 'HS256');

        return [
            'token' => $jwt,
            'siape' => $siape,
            'username' => $username,
            'nome' => $nome,
            'tipo' => $tipo,
            'email' => $email,
            'cpf' => $cpf,
            'message' => 'Usuário criado com sucesso!'
        ];
    }
    
    function alterarSenha() {
        $dados = json_decode(file_get_contents("php:
        
        if (!isset($dados->siape, $dados->senhaAtual, $dados->novaSenha)) {
            http_response_code(400);
            return ['error' => 'Dados obrigatórios não fornecidos'];
        }
        
        $resultado = $this->dao->alterarSenha($dados->siape, $dados->senhaAtual, $dados->novaSenha);
        
        if (!$resultado['success']) {
            http_response_code(400);
        }
        
        return $resultado;
    }
}

?>
