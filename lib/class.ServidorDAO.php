<?php
require_once "class.Banco.php";
require_once "models/class.Servidor.php";

class ServidorDAO {
    private $pdo;

    function __construct() { $this->pdo = Banco::getConexao(); }

    function buscarTodos() {
        try {
            $sql = "SELECT siape, cpf, nome, email, telefone, tipo FROM SERVIDORES";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();

            $stmt->setFetchMode(PDO::FETCH_CLASS, Servidor::class);
            $servidores = $stmt->fetchAll();

            return $servidores ?: [];
        } catch (PDOException $e) {
            throw new Exception("Erro ao buscar servidores: " . $e->getMessage());
        }
    }

    function buscarPorId($id) {
        try {
            $sql = "SELECT siape, cpf, nome, email, telefone, tipo FROM SERVIDORES WHERE siape = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':id' => $id]);

            $stmt->setFetchMode(PDO::FETCH_CLASS, Servidor::class);
            $servidor = $stmt->fetch();

            return $servidor ?: null;
        } catch (PDOException $e) {
            throw new Exception("Erro ao buscar servidor: " . $e->getMessage());
        }
    }

    function inserir(Servidor $servidor) {
        try {
            $siape = $servidor->getSiape();
            if (!$siape || $siape <= 0) {
                throw new Exception('SIAPE é obrigatório!');
            }
            
            $sql = "INSERT INTO SERVIDORES(siape, cpf, nome, email, telefone, tipo) VALUES (:siape, :cpf, :nome, :email, :telefone, :tipo)";
            $stmt = $this->pdo->prepare($sql);
            $resultado = $stmt->execute([
                ':siape' => $siape,
                ':cpf' => $servidor->getCpf(),
                ':nome' => $servidor->getNome(),
                ':email' => $servidor->getEmail(),
                ':telefone' => $servidor->getTelefone(),
                ':tipo' => $servidor->getTipo()
            ]);

            if (!$resultado) {
                $errorInfo = $stmt->errorInfo();
                throw new PDOException($errorInfo[2] ?? 'Erro ao inserir servidor', $errorInfo[1] ?? 0);
            }

            $servidorCriado = $this->buscarPorId($siape);
            if (!$servidorCriado) {
                throw new Exception("Servidor criado mas não encontrado após inserção");
            }
            
            return $servidorCriado;
        } catch (PDOException $e) {
            throw $e;
        }
    }

    function editar($id, $servidor) {
        try {
            $s = $this->buscarPorId($id);
            if (!$s) 
                throw new Exception("Servidor não encontrado!");

            $sql = "UPDATE SERVIDORES SET cpf=:cpf, nome=:nome, email=:email, telefone=:telefone, tipo=:tipo WHERE siape=:id";
            $query = $this->pdo->prepare($sql);
            $query->bindValue(':cpf', $servidor->getCpf());
            $query->bindValue(':nome', $servidor->getNome());
            $query->bindValue(':email', $servidor->getEmail());
            $query->bindValue(':telefone', $servidor->getTelefone());
            $query->bindValue(':tipo', $servidor->getTipo());
            $query->bindValue(':id', $id);
            if (!$query->execute()) {
                $errorInfo = $query->errorInfo();
                throw new PDOException($errorInfo[2] ?? 'Erro ao atualizar registro', $errorInfo[1] ?? 0);
            }

            $s->setCpf($servidor->getCpf());
            $s->setNome($servidor->getNome());
            $s->setEmail($servidor->getEmail());
            $s->setTelefone($servidor->getTelefone());
            $s->setTipo($servidor->getTipo());
            return $s;
        } catch (PDOException $e) {
            throw $e;
        }
    }

    function apagar($id) {
        try {
            $servidor = $this->buscarPorId($id);
            if (!$servidor) 
                throw new Exception("Servidor não encontrado!");

            $sql = "DELETE FROM SERVIDORES WHERE siape=:id";
            $query = $this->pdo->prepare($sql);
            $query->bindValue(':id', $id);
            if (!$query->execute()) {
                $errorInfo = $query->errorInfo();
                throw new PDOException($errorInfo[2] ?? 'Erro ao apagar registro', $errorInfo[1] ?? 0);
            }    

            return $servidor;
        } catch (PDOException $e) {
            throw $e;
        }
    }
}
?>