<?php
require_once "class.Banco.php";
require_once "models/class.Usuario.php";

class UsuarioDAO {
    private $pdo;

    function __construct() { $this->pdo = Banco::getConexao(); }

    function buscarTodos() {
        try {
            
            $sql = "
                SELECT u.siape, u.username, u.senha, s.nome as servidor_nome 
                FROM USUARIOS u 
                LEFT JOIN SERVIDORES s 
                    ON (u.siape = s.siape)
            ";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();

            $stmt->setFetchMode(PDO::FETCH_CLASS, Usuario::class);
            $usuarios = $stmt->fetchAll();

            return $usuarios ?: [];
        } catch (PDOException $e) {
            return [];
        }
    }

    function buscarPorId($id) {
        try {
            $sql = "SELECT siape, username, senha FROM USUARIOS WHERE siape = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':id' => $id]);

            $stmt->setFetchMode(PDO::FETCH_CLASS, Usuario::class);
            $usuario = $stmt->fetch();

            return $usuario ?: null;
        } catch (PDOException $e) {
            throw new Exception("Erro ao buscar usuário");
        }
    }

    function buscarPorUsername($username) {
        try {
            $sql = "SELECT siape, username, senha FROM USUARIOS WHERE username = :username";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':username' => $username]);

            $stmt->setFetchMode(PDO::FETCH_CLASS, Usuario::class);
            $usuario = $stmt->fetch();

            return $usuario ?: null;
        } catch (PDOException $e) {
            throw new Exception("Erro ao buscar usuário");
        }
    }

    function inserir(Usuario $usuario) {
        try {
            $siape = $usuario->getSiape();
            if (!$siape || $siape <= 0) {
                throw new Exception("SIAPE é obrigatório para criar usuário");
            }
            
            $username = $usuario->getUsername();
            if (empty($username)) {
                throw new Exception("Username é obrigatório");
            }
            
            $existente = $this->buscarPorId($siape);
            if ($existente) {
                throw new Exception("Usuário já existe com este SIAPE");
            }
            
            $existenteUsername = $this->buscarPorUsername($username);
            if ($existenteUsername) {
                throw new Exception("Username já está em uso");
            }
            
            $sql = "INSERT INTO USUARIOS(siape, username, senha) VALUES (:siape, :username, :senha)";
            $stmt = $this->pdo->prepare($sql);
            if (!$stmt) {
                $errorInfo = $this->pdo->errorInfo();
                throw new Exception("Erro ao preparar query: " . ($errorInfo[2] ?? 'Erro desconhecido'));
            }
            
            $resultado = $stmt->execute([
                ':siape' => $siape,
                ':username' => $username,
                ':senha' => $usuario->getSenha()
            ]);

            if (!$resultado) {
                $errorInfo = $stmt->errorInfo();
                throw new Exception("Erro ao inserir usuário: " . ($errorInfo[2] ?? 'Erro desconhecido'));
            }
            
            $usuarioCriado = $this->buscarPorId($siape);
            if (!$usuarioCriado) {
                throw new Exception("Usuário criado mas não encontrado após inserção");
            }
            
            return $usuarioCriado;
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), 'Duplicate entry') !== false || $e->getCode() == 23000) {
                throw new Exception("Nome de usuário ou SIAPE já está em uso");
            }
            throw new Exception("Erro ao inserir usuário: " . $e->getMessage());
        }
    }

    function editar($id, $usuario) {
        $u = $this->buscarPorId($id);
        if (!$u) 
            throw new Exception("Usuário não encontrado!");

        $sql = "UPDATE USUARIOS SET username=:username, senha=:senha WHERE siape=:id";
        $query = $this->pdo->prepare($sql);
        $query->bindValue(':username', $usuario->getUsername());
        $query->bindValue(':senha', $usuario->getSenha());
        $query->bindValue(':id', $id);
        if (!$query->execute())
            throw new Exception("Erro ao atualizar registro.");

        $u->setUsername($usuario->getUsername());
        $u->setSenha($usuario->getSenha());
        return $u;
    }

    function apagar($id) {
        $usuario = $this->buscarPorId($id);
        if (!$usuario) 
            throw new Exception("Usuário não encontrado!");

        $sql = "DELETE FROM USUARIOS WHERE siape=:id";
        $query = $this->pdo->prepare($sql);
        $query->bindValue(':id', $id);
        if (!$query->execute())
            throw new Exception("Erro ao apagar registro!");    

        return $usuario;
    }
}
?>